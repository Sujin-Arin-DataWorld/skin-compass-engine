-- =================================================
-- Phase 1: user_skin_profiles table
-- Run this in Supabase Dashboard → SQL Editor
-- =================================================

-- Create table
CREATE TABLE IF NOT EXISTS public.user_skin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  score_sebum INT NOT NULL DEFAULT 50 CHECK (score_sebum BETWEEN 0 AND 100),
  score_hydration INT NOT NULL DEFAULT 50 CHECK (score_hydration BETWEEN 0 AND 100),
  score_barrier INT NOT NULL DEFAULT 50 CHECK (score_barrier BETWEEN 0 AND 100),
  score_sensitivity INT NOT NULL DEFAULT 50 CHECK (score_sensitivity BETWEEN 0 AND 100),
  score_acne INT NOT NULL DEFAULT 50 CHECK (score_acne BETWEEN 0 AND 100),
  score_pigment INT NOT NULL DEFAULT 50 CHECK (score_pigment BETWEEN 0 AND 100),
  score_texture INT NOT NULL DEFAULT 50 CHECK (score_texture BETWEEN 0 AND 100),
  score_aging INT NOT NULL DEFAULT 50 CHECK (score_aging BETWEEN 0 AND 100),
  score_oxidation INT NOT NULL DEFAULT 50 CHECK (score_oxidation BETWEEN 0 AND 100),
  score_makeup_stability INT NOT NULL DEFAULT 50 CHECK (score_makeup_stability BETWEEN 0 AND 100),

  zone_scores JSONB DEFAULT '{}'::jsonb,

  skin_type TEXT NOT NULL DEFAULT 'combination'
    CHECK (skin_type IN ('oily','dry','combination','sensitive','normal')),
  primary_concerns TEXT[] DEFAULT '{}',
  analysis_method TEXT NOT NULL DEFAULT 'questionnaire'
    CHECK (analysis_method IN ('camera','questionnaire')),
  confidence_score FLOAT DEFAULT 0.5
    CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usp_user_active
  ON public.user_skin_profiles(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_usp_user_created
  ON public.user_skin_profiles(user_id, created_at DESC);

-- RLS
ALTER TABLE public.user_skin_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usp_select_own') THEN
    CREATE POLICY usp_select_own ON public.user_skin_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usp_insert_own') THEN
    CREATE POLICY usp_insert_own ON public.user_skin_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usp_update_own') THEN
    CREATE POLICY usp_update_own ON public.user_skin_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Auto-deactivate old profiles when a new one is inserted
CREATE OR REPLACE FUNCTION deactivate_old_skin_profiles()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_skin_profiles
  SET is_active = false, updated_at = now()
  WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deactivate_old ON public.user_skin_profiles;
CREATE TRIGGER trg_deactivate_old
  AFTER INSERT ON public.user_skin_profiles
  FOR EACH ROW WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_old_skin_profiles();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usp_updated_at ON public.user_skin_profiles;
CREATE TRIGGER trg_usp_updated_at
  BEFORE UPDATE ON public.user_skin_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
