-- ═══════════════════════════════════════════════════════════════════════════════
-- 003_training_pipeline_enhancements.sql
-- Phase 2: AI Training Data Pipeline Enhancements
--
-- Run in Supabase Dashboard → SQL Editor (AFTER 001 and 002 have been applied)
--
-- Creates / Alters:
--   1. reasons_json JSONB column on skin_analysis_logs
--   2. v_training_export — Comprehensive view for LoRA SFT dataset export
--   3. get_training_stats() — Dashboard statistics function
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add reasons_json to skin_analysis_logs
--    Stores the AI's per-axis reasoning (e.g. "Mild T-zone shine observed")
--    Previously this data was returned in the API response but discarded at DB level.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.skin_analysis_logs
  ADD COLUMN IF NOT EXISTS reasons_json JSONB DEFAULT NULL;

COMMENT ON COLUMN public.skin_analysis_logs.reasons_json IS
  'AI-generated per-axis reasoning text. Combined with scores_json for Llama Vision LoRA fine-tuning. Example: {"seb":"Mild T-zone shine","hyd":"Good plumpness..."}';


-- ─────────────────────────────────────────────────────────────────────────────
-- 1b. Add lifestyle_json to skin_analysis_logs
--     The analyze-skin Edge Function has been sending this data, but the column
--     was never created. This fixes that gap.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.skin_analysis_logs
  ADD COLUMN IF NOT EXISTS lifestyle_json JSONB DEFAULT NULL;

COMMENT ON COLUMN public.skin_analysis_logs.lifestyle_json IS
  'User lifestyle survey answers collected before analysis (age, sleep, stress, etc.). Conditioning signal for LoRA fine-tuning.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. v_training_export — Comprehensive training data view
--    Combines ALL signals needed for Llama Vision SFT:
--      - Image (input)
--      - Scores + Reasons (target output)
--      - Lifestyle context (conditioning signal)
--      - Feedback tags (correction signal for RLHF)
--      - User validation (quality gate)
--
--    Only includes records where:
--      - User explicitly confirmed "accurate" (high-confidence gold standard)
--      - Image exists (consent was granted and upload succeeded)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_training_export AS
SELECT
  sal.id                    AS analysis_id,
  sal.created_at,
  sal.image_url             AS storage_path,
  sal.scores_json,
  sal.reasons_json,
  sal.lifestyle_json,
  sal.feedback_tags,
  sal.model_version,
  sal.inference_latency_ms,
  sal.user_feedback,
  sal.feedback_comment
FROM public.skin_analysis_logs sal
WHERE sal.user_feedback = 'accurate'
  AND sal.image_url IS NOT NULL
ORDER BY sal.created_at DESC;

COMMENT ON VIEW public.v_training_export IS
  'Phase 2 training dataset export view. Only includes user-confirmed accurate analyses with stored images. Use for Llama Vision LoRA SFT on HuggingFace/AWS.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. get_training_stats() — Dashboard statistics
--    Returns a single JSON object with pipeline health metrics.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_training_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_analyses',       (SELECT COUNT(*) FROM public.skin_analysis_logs),
    'with_feedback',        (SELECT COUNT(*) FROM public.skin_analysis_logs WHERE user_feedback IS NOT NULL),
    'accurate_count',       (SELECT COUNT(*) FROM public.skin_analysis_logs WHERE user_feedback = 'accurate'),
    'inaccurate_count',     (SELECT COUNT(*) FROM public.skin_analysis_logs WHERE user_feedback = 'inaccurate'),
    'with_images',          (SELECT COUNT(*) FROM public.skin_analysis_logs WHERE image_url IS NOT NULL),
    'training_ready',       (SELECT COUNT(*) FROM public.v_training_export),
    'with_reasons',         (SELECT COUNT(*) FROM public.skin_analysis_logs WHERE reasons_json IS NOT NULL),
    'with_lifestyle',       (SELECT COUNT(*) FROM public.skin_analysis_logs WHERE lifestyle_json IS NOT NULL),
    'active_ai_consents',   (SELECT COUNT(*) FROM public.user_consents WHERE consent_type = 'ai_training' AND is_active = true),
    'avg_latency_ms',       (SELECT COALESCE(AVG(inference_latency_ms), 0) FROM public.skin_analysis_logs WHERE inference_latency_ms IS NOT NULL),
    'latest_analysis_at',   (SELECT MAX(created_at) FROM public.skin_analysis_logs),
    'readiness_pct',        ROUND(
      (SELECT COUNT(*)::NUMERIC FROM public.v_training_export) /
      GREATEST((SELECT COUNT(*)::NUMERIC FROM public.skin_analysis_logs WHERE user_feedback = 'accurate'), 1) * 100,
      1
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run after migration):
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'skin_analysis_logs' AND column_name = 'reasons_json';
--
-- SELECT * FROM v_training_export LIMIT 5;
--
-- SELECT get_training_stats();
