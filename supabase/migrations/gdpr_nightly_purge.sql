-- ============================================================================
-- GDPR Data Minimization: Automated 90-Day Purge (pg_cron)
-- Execute this via Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the secure deletion function
CREATE OR REPLACE FUNCTION purge_expired_ai_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hard-delete analysis history older than 90 days
  DELETE FROM analysis_history 
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Failsafe: Hard-delete records for users who actively revoked biometric consent
  DELETE FROM analysis_history 
  WHERE user_id IN (
    SELECT id FROM profiles WHERE biometric_consent = false
  );
END;
$$;

-- 3. Schedule the job to run every day at 03:00 AM UTC
SELECT cron.schedule(
  'gdpr_nightly_purge',
  '0 3 * * *',
  $$ SELECT purge_expired_ai_data(); $$
);

-- 4. Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'gdpr_nightly_purge';
