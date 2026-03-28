/**
 * useDiagnosisComparison.ts
 *
 * Phase 6 Step 2 — Hook that fetches the two most recent diagnoses from
 * Supabase and builds a DiagnosisComparison object for the before/after view.
 *
 * Returns { hasPrevious: false } for:
 *  - Unauthenticated users
 *  - First-time users (< 2 diagnoses saved)
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildDiagnosisComparison } from "@/engine/diagnosisComparison";
import type { DiagnosisComparison } from "@/engine/diagnosisComparison";
import type { AxisScores } from "@/engine/types";
import { useAuthStore } from "@/store/authStore";

export interface DiagnosisComparisonState {
  hasPrevious: boolean;
  comparison: DiagnosisComparison | null;
  isLoading: boolean;
  engineVersionMismatch: boolean;
  /** Days since previous diagnosis (used to show >90-day staleness note) */
  previousDiagnosisAgeDays: number | null;
}

const INITIAL: DiagnosisComparisonState = {
  hasPrevious: false,
  comparison: null,
  isLoading: true,
  engineVersionMismatch: false,
  previousDiagnosisAgeDays: null,
};

const DONE_NO_PREV: DiagnosisComparisonState = { ...INITIAL, isLoading: false };

export function useDiagnosisComparison(): DiagnosisComparisonState {
  const { isLoggedIn } = useAuthStore();
  const [state, setState] = useState<DiagnosisComparisonState>(INITIAL);

  useEffect(() => {
    if (!isLoggedIn) {
      setState(DONE_NO_PREV);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user || cancelled) {
        setState(DONE_NO_PREV);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("diagnosis_history")
        .select("id, diagnosed_at, radar_data, engine_version")
        .eq("user_id", user.id)
        .order("diagnosed_at", { ascending: false })
        .limit(2);

      if (cancelled) return;

      if (error || !data || data.length < 2) {
        setState(DONE_NO_PREV);
        return;
      }

      // results[0] = most recent (current), results[1] = previous
      const [current, previous] = data as Array<{
        id: string;
        diagnosed_at: string;
        radar_data: Record<string, number>;
        engine_version?: string | null;
      }>;

      const currentScores  = current.radar_data  as AxisScores;
      const previousScores = previous.radar_data as AxisScores;

      const comparison = buildDiagnosisComparison(
        previous.diagnosed_at,
        previousScores,
        current.diagnosed_at,
        currentScores,
      );

      const engineVersionMismatch =
        !!current.engine_version &&
        !!previous.engine_version &&
        current.engine_version !== previous.engine_version;

      const previousDiagnosisAgeDays = Math.floor(
        (Date.now() - new Date(previous.diagnosed_at).getTime()) / (1000 * 60 * 60 * 24),
      );

      setState({
        hasPrevious: true,
        comparison,
        isLoading: false,
        engineVersionMismatch,
        previousDiagnosisAgeDays,
      });
    };

    fetch();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  return state;
}
