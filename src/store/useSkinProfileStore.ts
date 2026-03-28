// =================================================
// src/store/useSkinProfileStore.ts
// Global skin profile state — cached for instant access everywhere
// =================================================

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import {
  type UserSkinProfile,
  type SkinAxisScores,
  type ZoneScores,
  type SkinType,
  type SkinConcern,
  type AnalysisMethod,
  mapDbRowToProfile,
  mapScoresToDbColumns,
} from '@/types/skinProfile';

// ── Store interface ──

interface SkinProfileState {
  activeProfile: UserSkinProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchActiveProfile: (userId: string) => Promise<void>;
  saveAnalysisResult: (params: SaveAnalysisParams) => Promise<UserSkinProfile | null>;
  clearProfile: () => void;
}

interface SaveAnalysisParams {
  userId: string;
  scores: SkinAxisScores;
  zoneScores?: ZoneScores;
  skinType: SkinType;
  primaryConcerns: SkinConcern[];
  analysisMethod: AnalysisMethod;
  confidenceScore?: number;
  analysisId?: string;
}

// ── Store implementation ──

export const useSkinProfileStore = create<SkinProfileState>((set) => ({
  activeProfile: null,
  isLoading: false,
  error: null,

  /**
   * Fetch the user's currently active skin profile from Supabase.
   * Call this on auth state change (sign-in).
   */
  fetchActiveProfile: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('user_skin_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[SkinProfileStore] fetch error:', error.message);
        set({ isLoading: false, error: error.message });
        return;
      }

      if (data) {
        const profile = mapDbRowToProfile(data);
        set({ activeProfile: profile, isLoading: false });
      } else {
        // No profile yet — user hasn't done analysis
        set({ activeProfile: null, isLoading: false });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SkinProfileStore] unexpected error:', msg);
      set({ isLoading: false, error: msg });
    }
  },

  /**
   * Save a new skin analysis result to Supabase.
   * The DB trigger auto-deactivates any previous active profile.
   * Returns the saved profile or null on failure.
   */
  saveAnalysisResult: async (params: SaveAnalysisParams) => {
    set({ isLoading: true, error: null });

    try {
      const upsertData = {
        user_id: params.userId,
        ...mapScoresToDbColumns(params.scores),
        zone_scores: params.zoneScores ?? {},
        skin_type: params.skinType,
        primary_concerns: params.primaryConcerns,
        analysis_method: params.analysisMethod,
        confidence_score: params.confidenceScore ?? null,
        is_active: true,
        ...(params.analysisId ? { analysis_id: params.analysisId } : {}),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('user_skin_profiles')
        .upsert(upsertData, { onConflict: 'analysis_id', ignoreDuplicates: false })
        .select()
        .single();

      if (error) {
        console.error('[SkinProfileStore] save error:', error.message);
        set({ isLoading: false, error: error.message });
        return null;
      }

      const profile = mapDbRowToProfile(data);
      set({ activeProfile: profile, isLoading: false });
      return profile;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SkinProfileStore] save unexpected error:', msg);
      set({ isLoading: false, error: msg });
      return null;
    }
  },

  /**
   * Clear the cached profile. Call on sign-out.
   */
  clearProfile: () => {
    set({ activeProfile: null, isLoading: false, error: null });
  },
}));

// ── Derived selectors (use outside of components too) ──

/** Returns true if the user has completed at least one skin analysis */
export const selectIsAnalyzed = () =>
  useSkinProfileStore.getState().activeProfile !== null;

/** Quick access to the active profile's scores, or null */
export const selectActiveScores = (): SkinAxisScores | null =>
  useSkinProfileStore.getState().activeProfile?.scores ?? null;
