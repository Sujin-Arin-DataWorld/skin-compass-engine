import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SkinAxisScores, AnalysisStep, ScoreSource } from '@/types/skinAnalysis';

// Prompt 4.5 — Zustand Store Bridge (AI scores → existing system)
// This store manages the AI camera analysis flow.
// scoreSource field lets the UI show "AI 분석 결과 기반" vs "자가진단 결과 기반" badges.

interface AnalysisHistoryEntry {
  date: string;
  scores: SkinAxisScores;
  source: ScoreSource;
}

interface SkinAnalysisState {
  // Current flow step
  currentStep: AnalysisStep;
  setStep: (step: AnalysisStep) => void;

  // Captured image — only in memory, never persisted (too large for localStorage)
  capturedImageBase64: string | null;
  setCapturedImage: (base64: string | null) => void;

  // Analysis results
  scores: SkinAxisScores | null;
  scoreSource: ScoreSource | null;
  analysisId: string | null;
  errorMessage: string | null;
  setAnalysisResult: (
    scores: SkinAxisScores,
    source: ScoreSource,
    analysisId?: string,
  ) => void;
  setError: (message: string) => void;

  // Feedback tracking
  feedbackGiven: boolean;
  setFeedbackGiven: (given: boolean) => void;

  // History persisted to localStorage (for future trend chart)
  analysisHistory: AnalysisHistoryEntry[];

  resetAnalysis: () => void;
}

export const useSkinAnalysisStore = create<SkinAnalysisState>()(
  persist(
    (set) => ({
      currentStep: 'idle',
      setStep: (step) => set({ currentStep: step }),

      capturedImageBase64: null,
      setCapturedImage: (base64) => set({ capturedImageBase64: base64 }),

      scores: null,
      scoreSource: null,
      analysisId: null,
      errorMessage: null,
      setAnalysisResult: (scores, source, analysisId) =>
        set((state) => ({
          scores,
          scoreSource: source,
          analysisId: analysisId ?? null,
          currentStep: 'result',
          errorMessage: null,
          analysisHistory: [
            { date: new Date().toISOString(), scores, source },
            ...state.analysisHistory,
          ].slice(0, 20),
        })),
      setError: (message) =>
        set({ errorMessage: message, currentStep: 'error' }),

      feedbackGiven: false,
      setFeedbackGiven: (given) => set({ feedbackGiven: given }),

      analysisHistory: [],

      resetAnalysis: () =>
        set({
          currentStep: 'idle',
          capturedImageBase64: null,
          scores: null,
          scoreSource: null,
          analysisId: null,
          errorMessage: null,
          feedbackGiven: false,
        }),
    }),
    {
      name: 'skin-analysis-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist the history array — all other state is ephemeral per-session
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
      }),
    },
  ),
);
