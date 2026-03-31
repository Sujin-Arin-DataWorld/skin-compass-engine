/**
 * axisAnswerBridgeV5.ts
 *
 * Two jobs:
 *
 * 1. convertToScoringInput(store, zoneData?)
 *    Reads the Zustand store snapshot directly and produces a ScoringInput
 *    ready for scoringEngineV5.computeScores().  This is the preferred call
 *    site inside handleCompleteAnalysis() in Analysis.tsx.
 *
 * 2. runAnalysisV5(input: BridgeInput)
 *    Full V5 pipeline in a single call — kept for backward compat and for
 *    callers that pre-package their own BridgeInput.
 *
 * V5 pipeline:
 *   store state / BridgeInput
 *     ↓ convertToScoringInput() / buildScoringInput()
 *   ScoringInput
 *     ↓ computeScores()          [scoringEngineV5]
 *   ScoringOutput (scores, provenance, activeFlags)
 *     ↓ buildSkinVector()        [skinVectorEngineV5]
 *   SkinVectorResult (AnalysisResult + V5 fields)
 *     ↓ buildProductBundleV5()   [routineEngineV5]
 *   product_bundle injected → final SkinVectorResult
 */

import type { QuestionAnswer } from "@/engine/questionRoutingV5";
import { computeScores } from "@/engine/scoringEngineV5";
import type { ScoringInput } from "@/engine/scoringEngineV5";
import { buildSkinVector } from "@/engine/skinVectorEngineV5";
import type { SkinVectorResult, SkinVectorInput } from "@/engine/skinVectorEngineV5";
import { buildProductBundleV5, computeSeasonalGuidance } from "@/engine/routineEngineV5";
import { generateAxisExplanations } from "@/engine/axisExplanationEngine";
import type { AnalysisStoreState } from "@/store/analysisStore";
import type { SelectedZones, Lifestyle, ImplicitFlags } from "@/store/analysisStore";
import type { Product, Tier } from "@/engine/types";

// ─────────────────────────────────────────────────────────────────────────────
// Foundation converter — ExposomeStep answer IDs → ScoringInput.foundation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps EXP_SLEEP (discrete slider index 0-4) to the 0-3 sleep tier:
 *   0 = < 5h   → 0 (poor)
 *   1 = 5h     → 1 (low)
 *   2 = 6h     → 1 (low)
 *   3 = 7h     → 2 (adequate)
 *   4 = 8h+    → 3 (optimal)
 */
const SLEEP_INDEX_MAP: Record<number, number> = {
  0: 0,   // < 5h  → poor
  1: 1,   // 5h    → low
  2: 1,   // 6h    → low
  3: 2,   // 7h    → adequate
  4: 3,   // 8h+   → optimal
};

/**
 * Maps EXP_WATER option IDs to foundation water index (0-2):
 *   0 = 1-2 glasses/day (low)
 *   1 = 3-5 glasses/day (mid)
 *   2 = 6+ glasses/day  (high)
 */
const WATER_MAP: Record<string, number> = {
  water_low: 0,
  water_mid: 1,
  water_high: 2,
};

/**
 * Maps EXP_STRESS option IDs to foundation stress index (0-2):
 *   0 = Low
 *   1 = Moderate
 *   2 = High
 */
const STRESS_MAP: Record<string, number> = {
  stress_low: 0,
  stress_mod: 1,
  stress_high: 2,
};

function buildFoundation(
  axisAnswers: Record<string, QuestionAnswer>,
  lifestyle?: Lifestyle,
): ScoringInput["foundation"] {
  // Sleep: from EXP_SLEEP axis answer (0-4 index) or lifestyle.sleepHours fallback
  const sleepRaw = axisAnswers["EXP_SLEEP"];
  const sleepIndex = typeof sleepRaw === "number"
    ? (SLEEP_INDEX_MAP[sleepRaw] ?? 1)
    : typeof lifestyle?.sleepHours === "number"
      ? (SLEEP_INDEX_MAP[lifestyle.sleepHours] ?? 1)
      : 1; // default: adequate (6h)

  // Water: from EXP_WATER axis answer
  const waterRaw = axisAnswers["EXP_WATER"];
  const waterIndex = typeof waterRaw === "string"
    ? (WATER_MAP[waterRaw] ?? 1)
    : 1; // default: mid

  // Stress: from EXP_STRESS axis answer
  const stressRaw = axisAnswers["EXP_STRESS"];
  const stressIndex = typeof stressRaw === "string"
    ? (STRESS_MAP[stressRaw] ?? 0)
    : 0; // default: low

  // Climate: climateProfile.climateType takes priority, then EXP_CLIMATE, then lifestyle.climate
  const climateFromProfile = lifestyle?.climateProfile?.climateType ?? null;
  const climateFromAnswer = axisAnswers["EXP_CLIMATE"];
  const climate =
    climateFromProfile ??
    (typeof climateFromAnswer === "string" ? climateFromAnswer : null) ??
    (lifestyle?.climate ?? null);

  // Age bracket: from EXP_AGE axis answer (0-5)
  const ageRaw = axisAnswers["EXP_AGE"];
  const ageBracket = typeof ageRaw === "number" ? ageRaw : 2; // default 30s

  // Gender: from EXP_GENDER axis answer (0=female, 1=male, 2=other)
  const genderRaw = axisAnswers["EXP_GENDER"];
  const gender = typeof genderRaw === "number" ? genderRaw : 2; // default other

  // Seasonal change: from EXP_SEASONAL axis answer (0-3)
  const seasonalRaw = axisAnswers["EXP_SEASONAL"];
  const seasonalChange = typeof seasonalRaw === "number" ? seasonalRaw : undefined;

  // Texture preference: from EXP_TEXTURE axis answer (0-3)
  const textureRaw = axisAnswers["EXP_TEXTURE"];
  const texturePref = typeof textureRaw === "number" ? textureRaw : undefined;

  // Outdoor exposure: from EXP_OUTDOOR axis answer (0=indoor, 1=1-2hrs, 2=3+hrs)
  const outdoorRaw = axisAnswers["EXP_OUTDOOR"];
  const outdoor = typeof outdoorRaw === "number" ? outdoorRaw : 0;

  // Altitude exposure: from EXP_ALTITUDE axis answer (0=never, 1=occasional, 2=regular)
  const altitudeRaw = axisAnswers["EXP_ALTITUDE"];
  const altitude = typeof altitudeRaw === "number" ? altitudeRaw : 0;

  // Menopause status: from tail question answer "menopause_status"
  const menoRaw = axisAnswers["menopause_status"];
  const menopauseStatus = typeof menoRaw === "string" ? menoRaw : undefined;

  return {
    sleep: sleepIndex,
    water: waterIndex,
    stress: stressIndex,
    climate: climate ?? null,
    age_bracket: ageBracket,
    gender: gender,
    outdoor: outdoor,
    altitude: altitude,
    seasonal_change: seasonalChange,
    texture_pref: texturePref,
    menopause_status: menopauseStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone data converter — SelectedZones → Record<string, Record<string, 1|2|3>>
// ─────────────────────────────────────────────────────────────────────────────

function buildZoneDataFromStore(
  selectedZones: SelectedZones,
): Record<string, Record<string, 1 | 2 | 3>> {
  const zoneData: Record<string, Record<string, 1 | 2 | 3>> = {};
  for (const [zoneId, entry] of Object.entries(selectedZones ?? {})) {
    if (!Array.isArray(entry?.concerns) || entry.concerns.length === 0) continue;
    const zoneSev: Record<string, 1 | 2 | 3> = {};
    for (const cId of entry.concerns) {
      // Use stored severity if available, otherwise default to mild (1)
      const sev = (entry.severity?.[cId] ?? 1) as 1 | 2 | 3;
      zoneSev[cId] = sev;
    }
    zoneData[zoneId] = zoneSev;
  }
  return zoneData;
}

/**
 * Converts a flat concernSeverity map (from FaceMapStep) into
 * zone-grouped format expected by scoringEngineV5.
 */
export function buildZoneData(
  concernSeverity: Record<string, 1 | 2 | 3>,
  zoneConcerns: Record<string, { id: string; axis: string }[]>,
): Record<string, Record<string, 1 | 2 | 3>> {
  const result: Record<string, Record<string, 1 | 2 | 3>> = {};

  for (const [zoneId, concerns] of Object.entries(zoneConcerns)) {
    const zoneSev: Record<string, 1 | 2 | 3> = {};
    for (const c of concerns) {
      const sev = concernSeverity[c.id];
      if (sev && sev > 0) {
        zoneSev[c.id] = sev;
      }
    }
    if (Object.keys(zoneSev).length > 0) {
      result[zoneId] = zoneSev;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter deep-dive answers from the flat axisAnswers map
//
// Phase 01 (Exposome) keys: EXP_*
// Phase 02 (FaceMap) keys:  stored separately in selectedZones
// Phase 03 (Deep-dive) keys: all non-EXP_ keys
// ─────────────────────────────────────────────────────────────────────────────

const EXPOSOME_KEY_PREFIX = "EXP_";

function buildAxisAnswers(
  axisAnswers: Record<string, QuestionAnswer>,
): Record<string, QuestionAnswer> {
  const deepDive: Record<string, QuestionAnswer> = {};
  for (const [key, value] of Object.entries(axisAnswers)) {
    if (!key.startsWith(EXPOSOME_KEY_PREFIX)) {
      deepDive[key] = value;
    }
  }
  return deepDive;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: convertToScoringInput
//
// Takes the live Zustand store snapshot directly — no intermediate object
// needed.  zoneData can be supplied explicitly (e.g. if Analysis.tsx builds
// it from local state before it has been flushed to the store).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * convertToScoringInput
 *
 * Converts the Zustand analysis store snapshot into a ScoringInput that
 * scoringEngineV5.computeScores() understands.
 *
 * Data sources (in priority order):
 *   foundation.sleep/water/stress — store.axisAnswers EXP_* keys
 *   foundation.climate            — lifestyle.climateProfile.climateType
 *                                   → EXP_CLIMATE answer
 *                                   → lifestyle.climate
 *   zoneData                      — explicit param (highest priority)
 *                                   → store.selectedZones
 *   deep-dive axisAnswers         — store.axisAnswers (non-EXP_ keys)
 *   implicitFlags                 — store.implicitFlags.atopyFlag
 */
export function convertToScoringInput(
  store: AnalysisStoreState,
  zoneData?: Record<string, Record<string, 1 | 2 | 3>>,
): ScoringInput {
  return {
    zoneData: zoneData ?? buildZoneDataFromStore(store.selectedZones),
    axisAnswers: buildAxisAnswers(store.axisAnswers),
    foundation: buildFoundation(store.axisAnswers, store.lifestyle),
    implicitFlags: { atopyFlag: store.implicitFlags.atopyFlag },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: BridgeInput + buildScoringInput  (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export interface BridgeInput {
  axisAnswers: Record<string, QuestionAnswer>;
  selectedZones: SelectedZones;
  implicitFlags: ImplicitFlags;
  lifestyle?: Lifestyle;
  products?: Product[];
  tier?: Tier;
}

/**
 * buildScoringInput (BridgeInput overload — backward compat)
 *
 * Alternative entry point for callers that pre-package data into BridgeInput.
 * Internally delegates to the same helpers as convertToScoringInput.
 */
export function buildScoringInput(input: BridgeInput): ScoringInput;

/**
 * buildScoringInput (Step 11 — severity-map overload)
 *
 * Assembles a full ScoringInput directly from UI state:
 * - concernSeverity: flat map from FaceMapStep
 * - zoneConcerns: ZONE_CONCERNS lookup (maps zone → concern list)
 * - axisAnswers: tail question answers
 * - foundationData: pre-built foundation object
 * - implicitFlags: atopy/other flags
 */
export function buildScoringInput(
  concernSeverity: Record<string, 1 | 2 | 3>,
  zoneConcerns: Record<string, { id: string; axis: string }[]>,
  axisAnswers: Record<string, QuestionAnswer>,
  foundationData: ScoringInput["foundation"],
  implicitFlags: ScoringInput["implicitFlags"],
): ScoringInput;

export function buildScoringInput(
  inputOrSeverity: BridgeInput | Record<string, 1 | 2 | 3>,
  zoneConcerns?: Record<string, { id: string; axis: string }[]>,
  axisAnswers?: Record<string, QuestionAnswer>,
  foundationData?: ScoringInput["foundation"],
  implicitFlags?: ScoringInput["implicitFlags"],
): ScoringInput {
  // BridgeInput overload — has selectedZones property
  if ("selectedZones" in inputOrSeverity) {
    const input = inputOrSeverity as BridgeInput;
    return {
      zoneData: buildZoneDataFromStore(input.selectedZones),
      axisAnswers: buildAxisAnswers(input.axisAnswers),
      foundation: buildFoundation(input.axisAnswers, input.lifestyle),
      implicitFlags: { atopyFlag: input.implicitFlags.atopyFlag },
    };
  }

  // Severity-map overload
  const concernSeverity = inputOrSeverity as Record<string, 1 | 2 | 3>;
  return {
    zoneData: buildZoneData(concernSeverity, zoneConcerns!),
    axisAnswers: axisAnswers!,
    foundation: foundationData!,
    implicitFlags: implicitFlags!,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: runAnalysisV5 — full V5 pipeline in one call
// ─────────────────────────────────────────────────────────────────────────────

/**
 * runAnalysisV5
 *
 * Orchestrates the complete V5 analysis pipeline:
 *   1. buildScoringInput()    → ScoringInput
 *   2. computeScores()        → ScoringOutput (raw scores + provenance + flags)
 *   3. buildSkinVector()      → SkinVectorResult (AnalysisResult + V5 fields)
 *   4. buildProductBundleV5() → product_bundle injected into result
 *
 * Returns a SkinVectorResult fully compatible with AnalysisResult
 * and suitable for store.setResult() and navigation to /results.
 */
export function runAnalysisV5(input: BridgeInput): SkinVectorResult {
  // ── Step 1 — Build scoring input ──────────────────────────────────────────
  console.log("[V5] Step 1: buildScoringInput…");
  const scoringInput = buildScoringInput(input);
  console.log("[V5] Step 1 OK — zoneData keys:", Object.keys(scoringInput.zoneData),
    "| concern count:", Object.values(scoringInput.zoneData).reduce((n, z) => n + Object.keys(z).length, 0),
    "| foundation.age_bracket:", scoringInput.foundation.age_bracket,
    "| foundation.gender:", scoringInput.foundation.gender,
    "| foundation.sleep:", scoringInput.foundation.sleep,
    "| foundation.water:", scoringInput.foundation.water,
    "| foundation.stress:", scoringInput.foundation.stress,
  );

  // ── Step 2 — Compute scores ───────────────────────────────────────────────
  console.log("[V5] Step 2: computeScores…");
  const scoringOutput = computeScores(scoringInput);
  console.log("[V5] Step 2 OK — scores:", JSON.stringify(scoringOutput.scores));

  // ── Step 3 — Vector assembly ──────────────────────────────────────────────
  // Flatten zoneData from Record<zone, Record<concern, severity>> → Record<zone, string[]>
  // for skinVectorEngineV5 which only needs concern IDs, not severity
  const flatZoneData: Record<string, string[]> = {};
  for (const [zoneId, sevMap] of Object.entries(scoringInput.zoneData)) {
    flatZoneData[zoneId] = Object.keys(sevMap);
  }

  const vectorInput: SkinVectorInput = {
    scores: scoringOutput.scores,
    provenance: scoringOutput.provenance,
    zoneData: flatZoneData,
    implicitFlags: scoringInput.implicitFlags,
    activeFlags: scoringOutput.activeFlags,
    products: input.products ?? [],
  };
  console.log("[V5] Step 3: buildSkinVector…");
  const result = buildSkinVector(vectorInput);
  console.log("[V5] Step 3 OK — primary_concerns:", result.primary_concerns);

  // ── Step 4 — Routine / product bundle ────────────────────────────────────
  console.log("[V5] Step 4: buildProductBundleV5…");
  const productBundle = buildProductBundleV5(result, input.implicitFlags, input.tier ?? "Full");
  console.log("[V5] Step 4 OK — bundle phases:", Object.keys(productBundle ?? {}));

  // ── Step 5 — Seasonal guidance + axis explanations (Phase 3.5C/D) ────────
  const foundation = scoringInput.foundation;
  const climateLat = (input.lifestyle as { climateProfile?: { lat?: number } } | undefined)
    ?.climateProfile?.lat ?? 50;
  console.log("[V5] Step 5: computeSeasonalGuidance…");
  const seasonalGuidance = computeSeasonalGuidance(result.axis_scores, foundation, climateLat);

  console.log("[V5] Step 6: generateAxisExplanations…");
  const axis_explanations = generateAxisExplanations(
    result.axis_scores,
    foundation,
    seasonalGuidance.currentSeason,
  );
  console.log("[V5] Step 6 OK — axis_explanations count:", axis_explanations?.length ?? 0);

  console.log("[V5] runAnalysisV5 complete ✓");
  return {
    ...result,
    product_bundle: productBundle,
    axis_explanations,
  };
}
