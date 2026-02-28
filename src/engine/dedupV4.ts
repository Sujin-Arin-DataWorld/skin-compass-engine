/**
 * De-duplication layer: when an interactive component has been used (indicated by
 * a context flag like "ui_facemap"), the corresponding checklist symptoms that
 * overlap with the interactive capture are soft-scaled to prevent double-counting.
 *
 * Strategy: scale the checklist-entered severity by 0.5 (rounded) for symptoms
 * that are also covered by the interactive component.
 */

// Map from context flag → symptom IDs that the interactive component already captures
const INTERACTIVE_COVERAGE: Record<string, string[]> = {
  ui_facemap: ["C1_01", "C1_02", "C1_03", "C1_04", "C1_07", "C1_08", "C1_15"],
  ui_timeline: ["C2_01", "C2_02", "C2_03", "C2_04", "C2_09", "C2_14"],
  ui_hydration: ["C3_01", "C3_02", "C3_03", "C3_13", "C3_15"],
  ui_thermal: ["C4_01", "C4_05", "C4_06", "C4_07", "C4_09", "C4_15"],
  ui_pigment_map: ["C5_01", "C5_02", "C5_03", "C5_04", "C5_06", "C5_07", "C5_12"],
  ui_skinzoom: ["C6_01", "C6_02", "C6_03", "C6_06", "C6_07", "C6_10"],
  ui_elasticity: ["C7_01", "C7_02", "C7_03", "C7_04", "C7_05", "C7_06", "C7_07"],
  ui_recovery: ["C8_01", "C8_05", "C8_06", "C8_12", "C8_13"],
};

/**
 * Given merged severities (interactive MAX'd with checklist), and active contexts,
 * apply soft scaling to checklist-covered symptoms so they don't inflate scores.
 *
 * We know a symptom was set by an interactive component if `uiPatch` contains it.
 * If the same symptom also has a checklist value AND the interactive flag is present,
 * we take the interactive value (already MAX'd) but don't let checklist stack on top.
 *
 * In practice, since we already used MAX merge, the values are already correct.
 * The dedup layer only needs to ensure we don't double-weight when BOTH sources
 * contributed. We do this by keeping the MAX'd value as-is (no stacking).
 *
 * If only the checklist set it and the interactive component was used for that
 * category but didn't set that specific symptom, we scale checklist by 0.7.
 */
export function applyDedup(
  mergedSeverities: Record<string, number>,
  uiPatch: Record<string, number>,
  contexts: string[]
): Record<string, number> {
  const result = { ...mergedSeverities };

  for (const ctx of contexts) {
    const covered = INTERACTIVE_COVERAGE[ctx];
    if (!covered) continue;

    for (const sid of covered) {
      const uiVal = uiPatch[sid];
      const mergedVal = result[sid];
      if (mergedVal == null || mergedVal === 0) continue;

      // If UI didn't set this symptom but checklist did, soft-scale
      if (uiVal == null || uiVal === 0) {
        result[sid] = Math.round(mergedVal * 0.7);
      }
      // If both set it, MAX is already applied — no change needed
    }
  }

  return result;
}
