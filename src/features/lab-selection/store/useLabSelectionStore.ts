import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import {
  LabSelectionState,
  ZoneAssessment,
  FaceZone,
  Product,
  PriceTier,
  GateStatus,
  GlobalGateResult,
  FinalRoutine,
  RoutineStep,
  PhConflict,
} from '../types';
import { PH_CONFLICTS, ZONE_COLORS } from '../data/textureRules';
import { inferTimeOfDay, buildZoneOverlay } from '../utils/routineHelpers';
import { useAnalysisStore } from '@/store/analysisStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True if a product contains an ingredient by name (case-insensitive partial match) */
function hasIngredient(product: Product, ingredientName: string): boolean {
  return product.ingredients.some((ing) =>
    ing.name_en.toLowerCase().includes(ingredientName.toLowerCase())
  );
}

/** Detect pH / interaction conflicts among all selected products */
function detectConflicts(
  products: Product[]
): PhConflict[] {
  const conflicts: PhConflict[] = [];
  const seen = new Set<string>();

  for (const rule of PH_CONFLICTS) {
    for (const prodA of products) {
      for (const prodB of products) {
        if (prodA.id === prodB.id) continue;

        const pairKey = [prodA.id, prodB.id].sort().join('::');
        if (seen.has(`${pairKey}::${rule.warning_key}`)) continue;

        const aHasA = hasIngredient(prodA, rule.ingredient_a);
        const bHasB = hasIngredient(prodB, rule.ingredient_b);
        const aHasB = hasIngredient(prodA, rule.ingredient_b);
        const bHasA = hasIngredient(prodB, rule.ingredient_a);

        if ((aHasA && bHasB) || (aHasB && bHasA)) {
          seen.add(`${pairKey}::${rule.warning_key}`);
          conflicts.push({
            product_a_id: prodA.id,
            product_b_id: prodB.id,
            conflict_type: rule.conflict_type,
            warning_key: rule.warning_key,
          });
        }
      }
    }
  }

  return conflicts;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  zoneDiagnoses: [] as ZoneAssessment[],
  gateResult: null as GlobalGateResult | null,
  selectedProducts: new Map<FaceZone, { product: Product; tier: PriceTier }>(),
  finalRoutine: null as FinalRoutine | null,
  isPregnantOrNursing: false,
  isRosaceaProne: false,
  isLoading: false,
  error: null as string | null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useLabSelectionStore = create<LabSelectionState>()((set, get) => ({
  ...INITIAL_STATE,

  // ── setZoneDiagnoses ────────────────────────────────────────────────────────
  setZoneDiagnoses: (diagnoses: ZoneAssessment[]) => {
    set({ zoneDiagnoses: diagnoses, gateResult: null, finalRoutine: null });
  },

  // ── evaluateGate ────────────────────────────────────────────────────────────
  // Checks ALL zones for extreme/severe sensitivity or barrier damage.
  evaluateGate: () => {
    const { zoneDiagnoses } = get();

    let status: GateStatus = 'full_routine';
    let triggeredAxis: GlobalGateResult['triggered_by'] = null;
    let worstSeverity: GlobalGateResult['severity'] = 'mild';

    for (const zone of zoneDiagnoses) {
      for (const axisScore of zone.axis_scores) {
        if (axisScore.axis !== 'sensitivity' && axisScore.axis !== 'barrier') continue;

        if (axisScore.severity === 'extreme') {
          status = 'recovery_only';
          triggeredAxis = axisScore.axis;
          worstSeverity = 'extreme';
          break; // No need to check further — worst case found
        }

        if (axisScore.severity === 'severe') {
          status = 'caution';
          triggeredAxis = axisScore.axis;
          worstSeverity = 'severe';
        }
      }
      if (status === 'recovery_only') break;
    }

    const messageKey =
      status === 'recovery_only'
        ? 'lab.gate.recovery_message'
        : status === 'caution'
          ? 'lab.gate.caution_title'
          : '';

    set({
      gateResult: {
        status,
        triggered_by: triggeredAxis,
        severity: worstSeverity,
        message_key: messageKey,
        recovery_products: [],         // populated by GlobalGateCard via useProducts
        recovery_duration_weeks: 2,
        re_analysis_cta: status === 'recovery_only',
      },
    });
  },

  // ── selectProduct ───────────────────────────────────────────────────────────
  selectProduct: (zone: FaceZone, product: Product, tier: PriceTier) => {
    set((state) => {
      const next = new Map(state.selectedProducts);
      next.set(zone, { product, tier });
      return { selectedProducts: next, finalRoutine: null };
    });
    // Sync to analysisStore.specialCarePicks so StickyCartBar / Results stays updated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useAnalysisStore.getState().setSpecialCarePick(zone, product as any);
  },

  // ── removeProduct ───────────────────────────────────────────────────────────
  removeProduct: (zone: FaceZone) => {
    set((state) => {
      const next = new Map(state.selectedProducts);
      next.delete(zone);
      return { selectedProducts: next, finalRoutine: null };
    });
  },

  // ── buildRoutine ────────────────────────────────────────────────────────────
  buildRoutine: () => {
    const { selectedProducts, gateResult } = get();

    const allProducts = Array.from(selectedProducts.values()).map((s) => s.product);

    // Sort thinnest → thickest
    const sorted = [...allProducts].sort((a, b) => a.texture_order - b.texture_order);

    // Split into AM / PM / masks
    const amSteps: RoutineStep[] = [];
    const pmSteps: RoutineStep[] = [];
    const weeklyMasks: RoutineStep[] = [];

    sorted.forEach((product, idx) => {
      const isMask =
        product.routine_slot === 'mask_sheet' ||
        product.routine_slot === 'mask_modeling' ||
        product.routine_slot === 'mask_sleeping';

      const timeOfDay = inferTimeOfDay(product);

      // Find which zone this product belongs to
      const zone =
        Array.from(selectedProducts.entries()).find(
          ([, sel]) => sel.product.id === product.id
        )?.[0] ?? 'whole_face';

      const step: RoutineStep = {
        order: idx + 1,
        product,
        time_of_day: timeOfDay,
        zone_instructions: [zone],
        warning_key: zone !== 'whole_face' ? 'lab.routine.zone_warning' : null,
        texture_order: product.texture_order,
      };

      if (isMask) {
        weeklyMasks.push(step);
      } else if (timeOfDay === 'AM') {
        amSteps.push({ ...step, order: amSteps.length + 1 });
      } else if (timeOfDay === 'PM') {
        pmSteps.push({ ...step, order: pmSteps.length + 1 });
      } else {
        // 'both' → appears in both routines
        amSteps.push({ ...step, order: amSteps.length + 1 });
        pmSteps.push({ ...step, order: pmSteps.length + 1 });
      }
    });

    // Detect pH / interaction conflicts
    const phConflicts: PhConflict[] = detectConflicts(allProducts);

    // Build face map overlay
    const selections = Array.from(selectedProducts.entries()).map(([zone, sel]) => ({
      product: sel.product,
      zone,
    }));
    const zoneMapOverlay = buildZoneOverlay(selections).map((entry) => ({
      ...entry,
      color_code:
        ZONE_COLORS[entry.zone]?.light ?? ZONE_COLORS.whole_face.light,
    }));

    // Total cost
    const totalCostEur = allProducts.reduce((sum, p) => sum + p.price_eur, 0);

    const routine: FinalRoutine = {
      user_id: '',                           // filled in saveRoutine
      analysis_session_id: crypto.randomUUID(),
      global_gate: gateResult?.status ?? 'full_routine',
      am_routine: amSteps,
      pm_routine: pmSteps,
      weekly_masks: weeklyMasks,
      ph_conflicts: phConflicts,
      zone_map_overlay: zoneMapOverlay,
      total_cost_eur: +totalCostEur.toFixed(2),
      created_at: new Date().toISOString(),
    };

    set({ finalRoutine: routine });
  },

  // ── saveRoutine ─────────────────────────────────────────────────────────────
  saveRoutine: async () => {
    const { finalRoutine } = get();
    if (!finalRoutine) return;

    set({ isLoading: true, error: null });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      const row = {
        user_id: user.id,
        analysis_session_id: finalRoutine.analysis_session_id,
        global_gate_status: finalRoutine.global_gate,
        am_steps: finalRoutine.am_routine,
        pm_steps: finalRoutine.pm_routine,
        weekly_masks: finalRoutine.weekly_masks,
        ph_conflicts: finalRoutine.ph_conflicts,
        zone_map_overlay: finalRoutine.zone_map_overlay,
        total_cost_eur: finalRoutine.total_cost_eur,
        is_active: true,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: saveErr } = await (supabase as any)
        .from('user_routines')
        .upsert(row, { onConflict: 'analysis_session_id' });

      if (saveErr) {
        set({ isLoading: false, error: saveErr.message });
      } else {
        // Update local record with the real user_id
        set({
          isLoading: false,
          finalRoutine: { ...finalRoutine, user_id: user.id },
        });
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  },

  // ── setPregnancyStatus ──────────────────────────────────────────────────────
  setPregnancyStatus: (status: boolean) => {
    set({ isPregnantOrNursing: status });
  },

  // ── setRosaceaStatus ────────────────────────────────────────────────────────
  setRosaceaStatus: (status: boolean) => {
    set({ isRosaceaProne: status });
  },

  // ── reset ───────────────────────────────────────────────────────────────────
  reset: () => {
    set({
      ...INITIAL_STATE,
      selectedProducts: new Map(),
    });
  },
}));
