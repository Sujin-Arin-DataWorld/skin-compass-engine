import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkinAxisScores, AnalysisStep, ScoreSource } from '@/types/skinAnalysis';

// Prompt 4.5 — Zustand Store Bridge (AI scores → existing system)
// This store manages the AI camera analysis flow.
// scoreSource field lets the UI show "AI 분석 결과 기반" vs "자가분석 결과 기반" badges.

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
          lifestyleAnswers: null,
          scores: null,
          reasons: null,
          scoreSource: null,
          analysisId: null,
          errorMessage: null,
          feedbackGiven: false,
        }),
    }),
    {
      name: 'skin-analysis-store',
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // QuotaExceededError — trim oldest history entries and retry
            console.warn('localStorage quota exceeded, trimming old analysis entries');
            try {
              const current = JSON.parse(localStorage.getItem(name) || '{}');
              if (current?.state?.analysisHistory) {
                current.state.analysisHistory = current.state.analysisHistory.slice(0, 5);
                localStorage.setItem(name, JSON.stringify(current));
              }
            } catch {
              // Last resort — clear this key entirely
              localStorage.removeItem(name);
            }
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
      // Persist analysis results so they survive app switch / tab reload
      // CRITICAL: capturedImageBase64 is NEVER persisted (too large for localStorage)
      // CRITICAL: 'analyzing' state → 'idle' to prevent infinite loading on return
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        scores: state.scores,
        reasons: state.reasons,
        scoreSource: state.scoreSource,
        analysisId: state.analysisId,
        currentStep: state.currentStep === 'analyzing' ? 'idle' : state.currentStep,
        feedbackGiven: state.feedbackGiven,
      }) as SkinAnalysisState,
    },
  ),
);
