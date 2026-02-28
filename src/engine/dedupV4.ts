/**
 * De-duplication layer v4.1
 *
 * When an interactive component has been used (indicated by a context flag),
 * symptoms it already captures are soft-scaled (×0.5) to prevent double-counting.
 * Symptoms the interactive captured directly (present in uiPatch) keep their MAX value.
 */

// Exact mapping: context flag → symptom IDs replaced by that interactive component
const INTERACTIVE_COVERAGE: Record<string, string[]> = {
  // Cat 1: FaceMap + Intensity + Recurrence + Hormonal toggle
  ui_facemap: ["C1_01", "C1_02", "C1_03", "C1_04", "C1_07", "C1_08", "C1_15"],
  // Cat 2: Timeline + Makeup longevity + Distribution + Seasonal
  ui_timeline: ["C2_01", "C2_02", "C2_03", "C2_04", "C2_11", "C2_13", "C2_14"],
  // Cat 3: Retention + Tightness + Flaking + Environment
  ui_hydration: ["C3_01", "C3_02", "C3_03", "C3_11", "C3_13", "C3_15"],
  // Cat 4: Reactivity + Flush duration + Active reaction + Capillary
  ui_thermal: ["C4_01", "C4_03", "C4_05", "C4_06", "C4_09", "C4_15"],
  // Cat 5: Pigment zone mapping
  ui_pigment_map: ["C5_02", "C5_06", "C5_07", "C5_11", "C5_12"],
  // Cat 6: SkinZoom selector
  ui_skinzoom: ["C6_01", "C6_02", "C6_03", "C6_06", "C6_07", "C6_10"],
  // Cat 7: Elasticity simulation + area tap
  ui_elasticity: ["C7_01", "C7_03", "C7_05", "C7_06", "C7_07"],
  // Cat 8: Recovery animation
  ui_recovery: ["C8_01", "C8_06", "C8_12", "C8_13"],
};

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

      // If UI didn't set this symptom but checklist did → soft-scale ×0.5
      if (uiVal == null || uiVal === 0) {
        result[sid] = Math.max(0, Math.round(mergedVal * 0.5));
      }
      // If both set it, MAX is already applied — no change needed
    }
  }

  return result;
}
