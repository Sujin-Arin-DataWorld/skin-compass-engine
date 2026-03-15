// src/engine/faceMapInference.ts
// Extracts maximum diagnostic data from face-map severity chips
// BEFORE asking any follow-up questions.

import { AXIS_KEYS } from "@/engine/types";
import type { AxisKey } from "@/engine/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaceMapInference {
  /** Skin type inferred from spatial oiliness/dryness distribution */
  skinType: "oily" | "dry" | "combination" | "dehydrated-oily" | "normal";

  /** Per-axis preliminary score from chip severity (0-45 range) */
  chipScores: Record<AxisKey, number>;

  /** Cross-zone patterns detected (e.g. "DEHYDRATED_OILY", "WIDESPREAD_AGING") */
  patterns: string[];

  /** Axes fully characterised by high-severity chips — no follow-up needed */
  resolvedAxes: AxisKey[];

  /** Axes with low/medium severity — may need 1 clarifying tail question */
  ambiguousAxes: AxisKey[];
}

// ─── Concern → Axis mapping (mirrors scoringEngineV5 CONCERN_AXIS_MAP) ────────

const CONCERN_TO_AXIS: Record<string, AxisKey> = {
  // Forehead
  oily_f:       "seb",
  blackheads_f: "texture",
  whiteheads_f: "texture",
  lines_f:      "aging",
  breakouts_f:  "texture",
  // Nose
  blackheads_n: "texture",
  pores_n:      "texture",
  oily_n:       "seb",
  redness_n:    "sen",
  // Eyes
  dark_circles_e: "pigment",
  fine_lines_e:   "aging",
  puffiness_e:    "aging",
  dryness_e:      "hyd",
  // Cheeks
  redness_c: "sen",
  acne_c:    "acne",
  dryness_c: "hyd",
  pigment_c: "pigment",
  pores_c:   "texture",
  // Mouth
  nasolabial: "aging",
  dryness_m:  "hyd",
  pigment_m:  "pigment",
  perioral_m: "sen",
  // Jawline
  hormonal_j: "acne",
  cystic_j:   "acne",
  texture_j:  "texture",
  sagging_j:  "aging",
  // Neck
  neck_lines: "aging",
  sagging:    "aging",
  neck_red:   "sen",
  neck_dry:   "hyd",
};

// ─── Inference function ───────────────────────────────────────────────────────

export function inferFromFaceMap(
  concernSeverity: Record<string, 1 | 2 | 3>,
): FaceMapInference {
  // ── 1. Accumulate per-axis chip scores ──────────────────────────────────────
  const chipScores = Object.fromEntries(
    AXIS_KEYS.map(a => [a, 0])
  ) as Record<AxisKey, number>;

  for (const [concernId, severity] of Object.entries(concernSeverity)) {
    const axis = CONCERN_TO_AXIS[concernId];
    if (!axis) continue;
    // Each chip contributes proportionally to severity:
    //   severity 1 → ~2.1 pts, severity 2 → ~4.3 pts, severity 3 → ~6.4 pts
    //   (based on LAYER1_MAX=45 / 7 zones ≈ 6.4 pts max per zone-axis)
    chipScores[axis] += (severity / 3) * 6.4;
  }

  // ── 2. Infer skin type from spatial oiliness/dryness distribution ──────────
  const tZoneOily = (concernSeverity["oily_f"] ?? 0) + (concernSeverity["oily_n"] ?? 0);
  const uZoneDry  = (concernSeverity["dryness_c"] ?? 0) + (concernSeverity["dryness_m"] ?? 0)
                  + (concernSeverity["dryness_e"] ?? 0);

  let skinType: FaceMapInference["skinType"] = "normal";
  if (tZoneOily >= 4 && uZoneDry >= 4) {
    skinType = "combination";
  } else if (tZoneOily >= 3 && uZoneDry >= 2) {
    skinType = "dehydrated-oily";
  } else if (tZoneOily >= 3) {
    skinType = "oily";
  } else if (uZoneDry >= 4) {
    skinType = "dry";
  }

  // ── 3. Detect cross-zone patterns ───────────────────────────────────────────
  const patterns: string[] = [];

  if (skinType === "dehydrated-oily" || skinType === "combination") {
    patterns.push("DEHYDRATED_OILY");
  }

  // Widespread aging: aging-related concerns in 3+ different zones
  const agingZones = new Set<string>();
  const agingConcerns = ["lines_f", "fine_lines_e", "puffiness_e", "nasolabial",
    "sagging_j", "neck_lines", "sagging"];
  for (const cId of agingConcerns) {
    if (concernSeverity[cId]) {
      if (cId.endsWith("_f"))        agingZones.add("forehead");
      else if (cId.endsWith("_e"))   agingZones.add("eyes");
      else if (cId === "nasolabial") agingZones.add("mouth");
      else if (cId.endsWith("_j"))   agingZones.add("jawline");
      else if (cId.startsWith("neck") || cId === "sagging") agingZones.add("neck");
    }
  }
  if (agingZones.size >= 3) patterns.push("WIDESPREAD_AGING");

  // Hormonal acne: jawline-specific deep bumps
  if ((concernSeverity["hormonal_j"] ?? 0) >= 2 || (concernSeverity["cystic_j"] ?? 0) >= 2) {
    patterns.push("HORMONAL_ACNE");
  }

  // Barrier stress: high sensitivity + high dryness simultaneously
  if (chipScores.sen >= 10 && chipScores.hyd >= 10) {
    patterns.push("BARRIER_STRESS");
  }

  // PIH risk: acne + pigmentation co-present
  if (chipScores.acne >= 8 && chipScores.pigment >= 8) {
    patterns.push("PIH_RISK");
  }

  // ── 4. Classify axes as resolved vs ambiguous ────────────────────────────────
  const resolvedAxes: AxisKey[] = [];
  const ambiguousAxes: AxisKey[] = [];

  for (const axis of AXIS_KEYS) {
    const score = chipScores[axis];
    if (score === 0) continue; // not triggered → skip

    // Score >= 20: user selected severe (3) on ≥1 concern, or moderate on 2+
    if (score >= 20) {
      resolvedAxes.push(axis);
    } else {
      ambiguousAxes.push(axis);
    }
  }

  return { skinType, chipScores, patterns, resolvedAxes, ambiguousAxes };
}
