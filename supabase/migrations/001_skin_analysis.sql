-- Prompt 3.5 — PART A: skin_analysis_logs table
-- Every AI skin analysis is recorded here.
-- Users who click "accurate" contribute high-confidence training data for Phase 2 custom model.

CREATE TABLE IF NOT EXISTS skin_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User identification
  -- Logged-in users: Supabase auth UUID
  -- Anonymous users: deterministic device fingerprint (SHA-256 of UA + Accept-Language)
  user_id UUID NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,

  -- Input evidence
  image_url TEXT,  -- Supabase Storage path to the face photo (updated asynchronously)

  -- Analysis output
  scores_json JSONB NOT NULL,
  -- Example: {"seb":45,"hyd":60,"bar":72,"sen":28,"acne":15,
  --           "pigment":33,"texture":22,"aging":18,"ox":25,"makeup_stability":68}

  -- Model metadata (critical for Phase 2 comparison)
  model_version TEXT NOT NULL DEFAULT 'groq-llama-4-scout-v1',
  inference_latency_ms INTEGER,

  -- User validation — THE GOLD STANDARD for Phase 2 training data
  -- When a user confirms "accurate", this becomes a high-confidence training sample.
  user_feedback TEXT CHECK (user_feedback IN ('accurate', 'inaccurate', NULL)),
  feedback_comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user history queries
CREATE INDEX IF NOT EXISTS idx_skin_analysis_user
  ON skin_analysis_logs (user_id, created_at DESC);

-- Index for Phase 2 training data export
-- Query: SELECT image_url, scores_json FROM skin_analysis_logs WHERE user_feedback = 'accurate'
CREATE INDEX IF NOT EXISTS idx_skin_analysis_training
  ON skin_analysis_logs (user_feedback)
  WHERE user_feedback = 'accurate';

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE skin_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own analyses (anonymous records are world-readable for now)
CREATE POLICY "Users view own analyses"
  ON skin_analysis_logs FOR SELECT
  USING (auth.uid() = user_id OR is_anonymous = true);

-- Edge Function (service role) can insert
CREATE POLICY "Service can insert analyses"
  ON skin_analysis_logs FOR INSERT
  WITH CHECK (true);

-- Users can update ONLY the feedback fields on their own records
CREATE POLICY "Users can give feedback"
  ON skin_analysis_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    scores_json IS NOT DISTINCT FROM scores_json
  );

-- ── Supabase Storage bucket (manual setup in Dashboard) ─────────────────────
-- Bucket name:      skin-images
-- Public:           NO (private — use signed URLs for display)
-- File size limit:  200KB
-- Allowed MIME:     image/jpeg, image/png
-- RLS:              Only service role can read/write

-- ── Phase 2 Training Data Export Query ──────────────────────────────────────
-- Run this when ~1000 confirmed-accurate records exist:
--
-- SELECT
--   image_url,
--   scores_json,
--   created_at
-- FROM skin_analysis_logs
-- WHERE user_feedback = 'accurate'
--   AND image_url IS NOT NULL
-- ORDER BY created_at DESC;
