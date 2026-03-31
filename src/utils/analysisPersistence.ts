// src/utils/skin-assessmentPersistence.ts
// Persist analysis results to localStorage so they survive the
// guest → login page-reload transition (Google OAuth, email login).

import type { AnalysisResult } from "@/engine/types";

const STORAGE_KEY = "ssl_pending_analysis";

export interface PendingAnalysis {
  /** ISO timestamp when analysis was completed */
  completedAt: string;
  /** Raw axis scores — used for analysis_history radar_data column */
  axisScores: Record<string, number>;
  /** Axis severity map */
  axisSeverity: Record<string, string>;
  /** Skin tier string for analysis_history skin_tier column */
  skinTier: string;
  /** Flat product list for analysis_history recommended_products column */
  recommendedProducts: Array<{ id: string; name: string; phase: string }>;
  /** Full serialised AnalysisResult — restored to Zustand store after login */
  fullResult: AnalysisResult;
  /** Engine version tag for debugging */
  engineVersion: string;
}

// @deprecated alias removed — PendingAnalysis is already exported above.

/**
 * Save analysis results to localStorage immediately after scoring completes.
 * Falls back to sessionStorage if localStorage is unavailable (Safari private).
 */
export function savePendingAnalysis(data: PendingAnalysis): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }
}

// @deprecated alias removed — savePendingAnalysis is already exported above.

/**
 * Retrieve pending analysis. Returns null if nothing stored,
 * data is unparseable, or older than 24 hours.
 */
export function getPendingAnalysis(): PendingAnalysis | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingAnalysis;

    // Reject stale data (> 24 h)
    const age = Date.now() - new Date(parsed.completedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      clearPendingAnalysis();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// @deprecated alias removed — getPendingAnalysis is already exported above.

/** True when a pending analysis is waiting to be synced. */
export function hasPendingAnalysis(): boolean {
  return getPendingAnalysis() !== null;
}

// @deprecated alias removed — hasPendingAnalysis is already exported above.

/** Remove pending analysis after successful Supabase sync or expiry. */
export function clearPendingAnalysis(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

// @deprecated alias removed — clearPendingAnalysis is already exported above.
