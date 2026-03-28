import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
import type { SkinAxisScores, AnalysisStep, ScoreSource } from '@/types/skinAnalysis';

// ─── Phase 3 Migration: Legacy localStorage Cleanup ──────────────────────────
// Clears the old 5MB-limited localStorage key to prevent memory bloat
// and edge-case bugs for returning users.
// NOTE: We do NOT delete 'ssl_pending_analysis' here — it is managed by
// AnalysisResults.tsx / SkinAnalysisPage.tsx / App.tsx and may contain
// active pending data for a user mid-login flow.
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('skin-analysis-store');
  } catch (e) {
    console.warn('[Storage Migration] Failed to clear legacy key:', e);
  }
}

// ─── IndexedDB Storage Adapter ───────────────────────────────────────────────
// Bypasses localStorage's 5MB limit. Safely handles massive Base64 strings
// (~2-4MB high-res selfies) asynchronously without blocking the UI thread.
// Full try/catch coverage: If IndexedDB fails (iOS Safari Private Mode,
// denied storage quota), Zustand continues to work in-memory without crash.
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return (await get(name)) || null;
    } catch (error) {
      console.error(`[IndexedDB] Failed to GET "${name}":`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (error) {
      console.error(`[IndexedDB] Failed to SET "${name}":`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (error) {
      console.error(`[IndexedDB] Failed to REMOVE "${name}":`, error);
    }
  },
};

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface AnalysisHistoryEntry {
  date: string;
  scores: SkinAxisScores;
  source: ScoreSource;
}

interface SkinAnalysisState {
  // Current flow step
  currentStep: AnalysisStep;
  setStep: (step: AnalysisStep) => void;

  // Captured image — now persisted via IndexedDB (no 5MB limit)
  capturedImageBase64: string | null;
  setCapturedImage: (base64: string | null) => void;

  // Lifestyle survey answers (collected before camera capture)
  lifestyleAnswers: Record<string, number | string> | null;
  setLifestyleAnswers: (answers: Record<string, number | string>) => void;

  // Analysis results
  scores: SkinAxisScores | null;
  reasons: Record<string, string> | null;
  scoreSource: ScoreSource | null;
  analysisId: string | null;
  errorMessage: string | null;
  setAnalysisResult: (
    scores: SkinAxisScores,
    source: ScoreSource,
    analysisId?: string,
    reasons?: Record<string, string> | null,
  ) => void;
  setError: (message: string) => void;

  // Feedback tracking
  feedbackGiven: boolean;
  setFeedbackGiven: (given: boolean) => void;

  // Phase 2: Training consent tracking (prevents re-showing modal in same session)
  trainingConsentGiven: boolean;
  setTrainingConsentGiven: (given: boolean) => void;

  // History persisted for future trend chart
  analysisHistory: AnalysisHistoryEntry[];

  resetAnalysis: () => void;
}

// ─── Store Definition ────────────────────────────────────────────────────────

export const useSkinAnalysisStore = create<SkinAnalysisState>()(
  persist(
    (set) => ({
      currentStep: 'idle',
      setStep: (step) => set({ currentStep: step }),

      capturedImageBase64: null,
      setCapturedImage: (base64) => set({ capturedImageBase64: base64 }),

      lifestyleAnswers: null,
      setLifestyleAnswers: (answers) => set({ lifestyleAnswers: answers }),

      scores: null,
      reasons: null,
      scoreSource: null,
      analysisId: null,
      errorMessage: null,
      setAnalysisResult: (scores, source, analysisId, reasons) =>
        set((state) => ({
          scores,
          reasons: reasons ?? null,
          scoreSource: source,
          analysisId: analysisId ?? null,
          currentStep: 'result',
          errorMessage: null,
          // NOTE: capturedImageBase64 is intentionally KEPT here.
          // AnalysisResults.tsx uses it for the Hero photo overlay.
          // It will be cleaned up in resetAnalysis() when the user
          // explicitly starts a new analysis.
          analysisHistory: [
            { date: new Date().toISOString(), scores, source },
            ...state.analysisHistory,
          ].slice(0, 20),
        })),
      setError: (message) =>
        set({ errorMessage: message, currentStep: 'error' }),

      feedbackGiven: false,
      setFeedbackGiven: (given) => set({ feedbackGiven: given }),

      trainingConsentGiven: false,
      setTrainingConsentGiven: (given) => set({ trainingConsentGiven: given }),

      analysisHistory: [],

      resetAnalysis: () =>
        set({
          currentStep: 'idle',
          capturedImageBase64: null, // 🗑️ GC: Base64 (~2-4MB) drops from IndexedDB here
          lifestyleAnswers: null,    // 🗑️ GC: Survey data cleaned up too
          scores: null,
          trainingConsentGiven: false,
          reasons: null,
          scoreSource: null,
          analysisId: null,
          errorMessage: null,
          feedbackGiven: false,
        }),
    }),
    {
      name: 'skin-analysis-store-v2', // Versioned to cleanly separate from old localStorage data
      storage: createJSONStorage(() => idbStorage),
      // Persist the FULL analysis state to IndexedDB.
      // IndexedDB has no 5MB limit — safe to include Base64 images.
      // CRITICAL: 'analyzing' state → 'idle' to prevent infinite loading on return.
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        scores: state.scores,
        reasons: state.reasons,
        scoreSource: state.scoreSource,
        analysisId: state.analysisId,
        currentStep: state.currentStep === 'analyzing' ? 'idle' : state.currentStep,
        feedbackGiven: state.feedbackGiven,

        // 🛡️ MOBILE RETENTION: Survives iOS Safari tab-kills during camera app usage
        capturedImageBase64: state.capturedImageBase64,
        lifestyleAnswers: state.lifestyleAnswers,
      }) as SkinAnalysisState,
    },
  ),
);
