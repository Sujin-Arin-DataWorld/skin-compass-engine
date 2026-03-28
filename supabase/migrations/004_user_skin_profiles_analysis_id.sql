-- Sprint B: Add analysis_id to user_skin_profiles for upsert deduplication
-- Prevents duplicate rows when React remounts during the AI camera analysis flow

ALTER TABLE user_skin_profiles
  ADD COLUMN IF NOT EXISTS analysis_id TEXT;

-- Unique constraint: same analysis_id cannot produce two rows
ALTER TABLE user_skin_profiles
  DROP CONSTRAINT IF EXISTS user_skin_profiles_analysis_id_key;

ALTER TABLE user_skin_profiles
  ADD CONSTRAINT user_skin_profiles_analysis_id_key UNIQUE (analysis_id);
