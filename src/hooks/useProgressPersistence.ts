import { useEffect, useCallback } from "react";
import { useDiagnosisStore } from "@/store/diagnosisStore";

const STORAGE_KEY = "ssl_diagnosis_progress";

interface SavedProgress {
  currentStep: number;
  currentCategory: number;
  contexts: string[];
  skinType: string | null;
  severities: Record<string, number>;
  metaAnswers: Record<string, number | boolean>;
  selectedTier: string;
  uiSignals: Record<string, unknown>;
  savedAt: number;
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useProgressPersistence() {
  const store = useDiagnosisStore();

  // Save progress on every relevant state change
  useEffect(() => {
    // Don't save if on results step or step 0 with no data
    if (store.currentStep === 10 || store.result) return;
    if (store.currentStep === 0 && store.contexts.length === 0) return;

    const data: SavedProgress = {
      currentStep: store.currentStep,
      currentCategory: store.currentCategory,
      contexts: store.contexts,
      skinType: store.skinType,
      severities: store.severities,
      metaAnswers: store.metaAnswers,
      selectedTier: store.selectedTier,
      uiSignals: store.uiSignals as Record<string, unknown>,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable
    }
  }, [
    store.currentStep,
    store.contexts,
    store.skinType,
    store.severities,
    store.metaAnswers,
    store.selectedTier,
    store.uiSignals,
    store.result,
    store.currentCategory,
  ]);

  const clearSavedProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { clearSavedProgress };
}

/**
 * Check if there's saved progress and return it (or null).
 * Does NOT auto-restore — caller decides.
 */
export function getSavedProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProgress;
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (data.currentStep <= 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSavedProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Estimate remaining time based on current step.
 * ~30s per category step, ~10s for context/skintype.
 */
export function estimateTimeRemaining(currentStep: number): string {
  const stepsLeft = Math.max(0, 10 - currentStep);
  const seconds = stepsLeft <= 2 ? stepsLeft * 10 : stepsLeft * 25;
  if (seconds <= 0) return "Almost done";
  if (seconds < 60) return `~${seconds}s remaining`;
  const min = Math.ceil(seconds / 60);
  return `~${min} min remaining`;
}
