-- ═══════════════════════════════════════════════════════════════════════════════
-- 002_gdpr_consent_pipeline.sql
-- GDPR Two-Track Data Pipeline Infrastructure
--
-- Run in Supabase Dashboard → SQL Editor
--
-- Creates:
--   1. user_consents          — Granular consent records (photo_storage / ai_training)
--   2. skin_journey_photos    — Photo storage records (FK → user_consents CASCADE)
--   3. storage_cleanup_queue  — Async physical file deletion queue (service role only)
--   4. Triggers               — Auto-queue storage paths on photo deletion
--   5. purge_expired_consents — 90-day TTL auto-revocation (pg_cron)
--   6. feedback_tags column   — ALTER TABLE for FeedbackWidget v2
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. user_consents — Granular GDPR consent tracking
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_consents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 'photo_storage' = save photos for Before/After tracking (Track 2 feature)
  -- 'ai_training'   = allow anonymized data for AI model improvement (separate opt-in)
  consent_type TEXT       NOT NULL CHECK (consent_type IN ('photo_storage', 'ai_training')),

  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ DEFAULT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),

  -- Active = granted and not revoked and not expired
  is_active   BOOLEAN     NOT NULL DEFAULT true,

  -- GDPR audit: which UI version collected this consent
  consent_ui_version TEXT DEFAULT 'v1',

  UNIQUE (user_id, consent_type, granted_at)
);

CREATE INDEX IF NOT EXISTS idx_consents_user_active
  ON public.user_consents (user_id, consent_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_consents_expiry
  ON public.user_consents (expires_at)
  WHERE is_active = true;

-- RLS: Users can only see and manage their own consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consents_select_own') THEN
    CREATE POLICY consents_select_own ON public.user_consents
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consents_insert_own') THEN
    CREATE POLICY consents_insert_own ON public.user_consents
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consents_update_own') THEN
    CREATE POLICY consents_update_own ON public.user_consents
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  -- Service role can do everything (for cron purge)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consents_service_all') THEN
    CREATE POLICY consents_service_all ON public.user_consents
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. skin_journey_photos — Photo storage records
--    FK to user_consents with ON DELETE CASCADE:
--    → Revoking/deleting consent automatically deletes all associated photos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skin_journey_photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The critical FK: deleting the consent row cascades to this row
  consent_id   UUID        NOT NULL REFERENCES public.user_consents(id) ON DELETE CASCADE,

  -- Supabase Storage path: 'skin-images/{user_id}/{timestamp}.jpg'
  storage_path TEXT        NOT NULL,

  -- Link back to the analysis that generated this photo
  analysis_id  UUID        REFERENCES public.skin_analysis_logs(id) ON DELETE SET NULL,

  -- Journey metadata
  journey_day  INT         DEFAULT 0 CHECK (journey_day >= 0),
  notes        TEXT        DEFAULT NULL,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_journey_user
  ON public.skin_journey_photos (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journey_consent
  ON public.skin_journey_photos (consent_id);

-- RLS: Users see only their own photos
ALTER TABLE public.skin_journey_photos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photos_select_own') THEN
    CREATE POLICY photos_select_own ON public.skin_journey_photos
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photos_insert_own') THEN
    CREATE POLICY photos_insert_own ON public.skin_journey_photos
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photos_delete_own') THEN
    CREATE POLICY photos_delete_own ON public.skin_journey_photos
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photos_service_all') THEN
    CREATE POLICY photos_service_all ON public.skin_journey_photos
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. storage_cleanup_queue — Async physical file deletion queue
--    Service role ONLY — no public access
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT        NOT NULL,
  queued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed    BOOLEAN     NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ DEFAULT NULL,
  error_msg    TEXT        DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_cleanup_unprocessed
  ON public.storage_cleanup_queue (queued_at)
  WHERE processed = false;

-- RLS: Only service role can access — no public policies at all
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cleanup_service_only') THEN
    CREATE POLICY cleanup_service_only ON public.storage_cleanup_queue
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: On photo row deletion → queue storage_path for physical cleanup
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION queue_storage_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- When a photo row is deleted (via CASCADE or directly),
  -- insert the storage path into the cleanup queue
  INSERT INTO public.storage_cleanup_queue (storage_path)
  VALUES (OLD.storage_path);

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_queue_storage_cleanup ON public.skin_journey_photos;
CREATE TRIGGER trg_queue_storage_cleanup
  BEFORE DELETE ON public.skin_journey_photos
  FOR EACH ROW
  EXECUTE FUNCTION queue_storage_cleanup();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Cron: 90-day TTL auto-revocation
--    Runs daily at 03:00 UTC — revokes expired consents
--    This triggers CASCADE DELETE on photos → which triggers cleanup queue
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION purge_expired_consents()
RETURNS void AS $$
DECLARE
  revoked_count INT;
BEGIN
  -- Step 1: Delete expired consent rows
  -- CASCADE will automatically:
  --   → Delete skin_journey_photos rows
  --   → Trigger trg_queue_storage_cleanup → insert into storage_cleanup_queue
  DELETE FROM public.user_consents
  WHERE is_active = true
    AND expires_at < now();

  GET DIAGNOSTICS revoked_count = ROW_COUNT;

  RAISE NOTICE '[purge_expired_consents] Revoked % expired consent(s)', revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron schedule (requires pg_cron extension enabled in Supabase Dashboard)
--
-- Run this ONCE in SQL Editor after enabling pg_cron:
--
-- SELECT cron.schedule(
--   'purge-expired-consents-daily',
--   '0 3 * * *',   -- Daily at 03:00 UTC
--   $$SELECT purge_expired_consents();$$
-- );
--
-- To also trigger the storage-cleanup Edge Function after purging:
--
-- SELECT cron.schedule(
--   'storage-cleanup-daily',
--   '5 3 * * *',   -- Daily at 03:05 UTC (5 min after purge)
--   $$SELECT net.http_post(
--     url := 'https://hbcplztoychstmszttge.supabase.co/functions/v1/storage-cleanup',
--     headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
--   );$$
-- );
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ALTER TABLE: Add feedback_tags to skin_analysis_logs
--    (For FeedbackWidget v2 structured tags)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.skin_analysis_logs
  ADD COLUMN IF NOT EXISTS feedback_tags JSONB DEFAULT NULL;

COMMENT ON COLUMN public.skin_analysis_logs.feedback_tags IS
  'Structured feedback tags from FeedbackWidget v2: ["sebum_hydration","sensitivity",...]. Used for AI model improvement signal aggregation.';


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run after migration):
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('user_consents', 'skin_journey_photos', 'storage_cleanup_queue');
--
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
-- WHERE tgname = 'trg_queue_storage_cleanup';
--
-- SELECT proname FROM pg_proc WHERE proname = 'purge_expired_consents';
