// src/utils/diagnosisPersistence.ts
// Persist diagnosis results to localStorage so they survive the
// guest → login page-reload transition (Google OAuth, email login).

import type { DiagnosisResult } from "@/engine/types";

const STORAGE_KEY  = "ssl_pending_diagnosis";

export interface PendingDiagnosis {
  /** ISO timestamp when diagnosis was completed */
  completedAt: string;
  /** Raw axis scores — used for diagnosis_history radar_data column */
  axisScores: Record<string, number>;
  /** Axis severity map */
  axisSeverity: Record<string, string>;
  /** Skin tier string for diagnosis_history skin_tier column */
  skinTier: string;
  /** Flat product list for diagnosis_history recommended_products column */
  recommendedProducts: Array<{ id: string; name: string; phase: string }>;
  /** Full serialised DiagnosisResult — restored to Zustand store after login */
  fullResult: DiagnosisResult;
  /** Engine version tag for debugging */
  engineVersion: string;
}

/**
 * Save diagnosis results to localStorage immediately after scoring completes.
 * Falls back to sessionStorage if localStorage is unavailable (Safari private).
 */
export function savePendingDiagnosis(data: PendingDiagnosis): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }
}

/**
 * Retrieve pending diagnosis. Returns null if nothing stored,
 * data is unparseable, or older than 24 hours.
 */
export function getPendingDiagnosis(): PendingDiagnosis | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingDiagnosis;

    // Reject stale data (> 24 h)
    const age = Date.now() - new Date(parsed.completedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      clearPendingDiagnosis();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/** True when a pending diagnosis is waiting to be synced. */
export function hasPendingDiagnosis(): boolean {
  return getPendingDiagnosis() !== null;
}

/** Remove pending diagnosis after successful Supabase sync or expiry. */
export function clearPendingDiagnosis(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}
