/**
 * useRoutineBuilder.ts
 *
 * Builds the final routine and runs professional safety checks (Rules 1 & 3).
 * Wires integration points for safetyRules.ts per Step 8 spec.
 *
 * Integration points active here:
 *   RULE 1 — checkCumulativeIrritation()  (irritation load counter)
 *   RULE 3 — checkSpfRequirement()        (mandatory SPF pairing)
 *
 * Rules 2/4/5 (pregnancy filter, rosacea filter, ceramide scoring) are applied
 * upstream in ZoneLabFlow (product filtering) and DuelCard (compliance scoring).
 */

import { useEffect, useMemo } from 'react';
import { useLabSelectionStore } from '../store/useLabSelectionStore';
import {
  checkCumulativeIrritation,
  checkSpfRequirement,
  IrritationCheckResult,
  SpfCheckResult,
} from '../utils/safetyRules';
import { FinalRoutine } from '../types';

export interface RoutineBuilderResult {
  routine: FinalRoutine | null;
  irritation: IrritationCheckResult | null;
  spf: SpfCheckResult | null;
  /** True if the routine cannot be saved due to safety blocks */
  isSaveBlocked: boolean;
  /** Array of i18n keys for all active warnings / blocks */
  activeWarningKeys: string[];
  isLoading: boolean;
  error: string | null;
}

export function useRoutineBuilder(): RoutineBuilderResult {
  const {
    selectedProducts,
    finalRoutine,
    isLoading,
    error,
    buildRoutine,
  } = useLabSelectionStore();

  // Rebuild routine whenever selected products change
  useEffect(() => {
    if (selectedProducts.size > 0) {
      buildRoutine();
    }
  }, [selectedProducts, buildRoutine]);

  // Rule 1: Cumulative Irritation Check
  const irritation = useMemo<IrritationCheckResult | null>(() => {
    if (!finalRoutine) return null;
    return checkCumulativeIrritation(finalRoutine);
  }, [finalRoutine]);

  // Rule 3: SPF Requirement Check
  const spf = useMemo<SpfCheckResult | null>(() => {
    if (!finalRoutine) return null;
    return checkSpfRequirement(finalRoutine);
  }, [finalRoutine]);

  // Aggregate warning keys
  const activeWarningKeys = useMemo<string[]>(() => {
    const keys: string[] = [];
    if (irritation?.warning_key) keys.push(irritation.warning_key);
    if (spf?.warning_key) keys.push(spf.warning_key);
    return keys;
  }, [irritation, spf]);

  // Save is blocked when irritation is 'blocked' OR SPF is required but missing
  const isSaveBlocked = useMemo(
    () =>
      (irritation?.status === 'blocked') ||
      (spf !== null && !spf.is_valid),
    [irritation, spf]
  );

  return {
    routine: finalRoutine,
    irritation,
    spf,
    isSaveBlocked,
    activeWarningKeys,
    isLoading,
    error,
  };
}
