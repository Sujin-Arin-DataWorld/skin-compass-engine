import {
  AxisKey, AXIS_KEYS, AXIS_LABELS, RADAR_AXES,
  AxisScores, DiagnosisResult, SkinType, ContextKey, Tier, Product,
} from "./types";
import {
  computeRawScores, applySkinTypeBaseline, applyContextModifiers,
  saturateScores, getAxisSeverities, clinicalNormalize,
} from "./scoreEngineV4";
import { detectPatterns, applyPatternBoosts, getUrgencyLevel } from "./patternEngineV4";
import { PRODUCT_CATALOG } from "./weights";
import { mapUiSignalsToSeverityPatch, mergeSeveritiesMax } from "./uiMappingV4";
import { applyDedup } from "./dedupV4";
import type { UiSignalsV4 } from "./uiMappingV4";

export interface DiagnosisInput {
  severities: Record<string, number>;
  contexts: ContextKey[];
  skinType: SkinType;
  tier: Tier;
  metaAnswers: Record<string, number | boolean>;
  uiSignals?: UiSignalsV4;
}

export interface DebugData {
  rawScores: AxisScores;
  normalizedScores: AxisScores;
  finalScores: AxisScores;
  axisSeverities: Record<AxisKey, 0 | 1 | 2 | 3>;
  patterns: { id: string; name: string; confidence: number; flag: string; severity: number }[];
  dedupScales: Record<string, number>;
  topSymptoms: { id: string; severity: number; text: string }[];
}

export function runDiagnosis(input: DiagnosisInput): DiagnosisResult {
  // Step A: UI signals → symptom severity patch
  const uiPatch = input.uiSignals
    ? mapUiSignalsToSeverityPatch(input.uiSignals)
    : {};

  // Step B: Merge UI patch into checklist severities (MAX wins)
  const merged = mergeSeveritiesMax(input.severities, uiPatch);

  // Step C: Dedup to prevent double counting
  const deduped = applyDedup(merged, uiPatch, input.contexts as string[]);

  // Step 1: Raw accumulation with severity multipliers
  const raw = computeRawScores(deduped);

  // Step 2: Skin type baseline
  const withBaseline = applySkinTypeBaseline(raw, input.skinType);

  // Step 3: Context modifiers
  const withContext = applyContextModifiers(withBaseline, input.contexts);

  // Step 4: Saturating logistic
  const saturated = saturateScores(withContext);

  // Step 5: Clinical normalization
  const { normalized, flags: clinicalFlags } = clinicalNormalize(saturated);

  // Step 6: Pattern detection
  const patterns = detectPatterns(deduped, normalized, input.metaAnswers);

  // Step 7: Pattern boosts (additive, top 2 only)
  const boosted = applyPatternBoosts(normalized, patterns);

  // Step 8: Final severity classification
  const axisSeverity = getAxisSeverities(boosted);

  // Step 9: Urgency
  const urgency = getUrgencyLevel(patterns);

  // Collect flags
  const patternFlags = patterns.map((p) => p.pattern.flag);
  const allFlags = [...new Set([...clinicalFlags, ...patternFlags])];

  // Primary/secondary concerns
  const sorted = AXIS_KEYS
    .map((k) => ({ axis: k, score: boosted[k] }))
    .sort((a, b) => b.score - a.score);
  const primary = sorted.filter((s) => s.score >= 46).slice(0, 3).map((s) => s.axis);
  const secondary = sorted.filter((s) => s.score >= 21 && s.score < 46).slice(0, 4).map((s) => s.axis);

  // Radar chart data (6 axes)
  const radarData = RADAR_AXES.map((k) => ({
    axis: AXIS_LABELS[k],
    score: Math.round(boosted[k]),
    label: AXIS_LABELS[k],
  }));

  // Product bundle
  const bundle = buildProductBundle(boosted, allFlags, input.skinType, input.tier);

  return {
    engineVersion: "4.0.0",
    axis_scores: boosted,
    axis_severity: axisSeverity,
    axis_scores_normalized: normalized,
    detected_patterns: patterns,
    urgency_level: urgency,
    active_flags: allFlags,
    radar_chart_data: radarData,
    primary_concerns: primary,
    secondary_concerns: secondary,
    product_bundle: bundle,
  };
}

function buildProductBundle(
  scores: AxisScores,
  flags: string[],
  skinType: SkinType,
  tier: Tier
): Record<string, Product[]> {
  const bundle: Record<string, Product[]> = {
    Phase1: [], Phase2: [], Phase3: [], Phase4: [], Phase5: [], Device: [],
  };

  if (scores.seb >= 40 || scores.acne >= 30) {
    bundle.Phase1.push(PRODUCT_CATALOG.drg_cleanser_oily);
  } else {
    bundle.Phase1.push(PRODUCT_CATALOG.biplain_cleanser);
  }

  if (scores.hyd >= 25) {
    bundle.Phase2.push(tier === "Entry" ? PRODUCT_CATALOG.snature_toner : PRODUCT_CATALOG.torriden_serum);
  }
  if (scores.bar >= 35) {
    bundle.Phase2.push(tier === "Entry" ? PRODUCT_CATALOG.snature_squalane : PRODUCT_CATALOG.aestura_cream);
  }
  if (scores.bar >= 40 && scores.sen >= 35) {
    if (tier === "Premium") bundle.Phase2.push(PRODUCT_CATALOG.bioheal_probioderm);
    else if (tier === "Full") bundle.Phase2.push(PRODUCT_CATALOG.manyo_bifida);
  }

  if (tier !== "Entry") {
    if (scores.acne >= 35 || scores.seb >= 45) {
      bundle.Phase3.push(PRODUCT_CATALOG.cosrx_bha);
      bundle.Phase3.push(PRODUCT_CATALOG.bringgreen_teatree);
    }
    if (scores.pigment >= 35 || scores.ox >= 30) {
      bundle.Phase3.push(tier === "Premium" ? PRODUCT_CATALOG.cellfusionc_toning : PRODUCT_CATALOG.missha_vitac);
    }
    if (scores.aging >= 35 || scores.ox >= 35) {
      if (tier === "Premium") bundle.Phase3.push(PRODUCT_CATALOG.bioheal_collagen);
      bundle.Phase3.push(PRODUCT_CATALOG.iope_retinol);
    }
  }

  if (scores.seb >= 40) {
    bundle.Phase4.push(PRODUCT_CATALOG.drg_soothing_cream);
  } else {
    bundle.Phase4.push(PRODUCT_CATALOG.snature_moistcream);
  }

  bundle.Phase5.push(tier === "Entry" ? PRODUCT_CATALOG.drg_sunscreen : PRODUCT_CATALOG.cellfusionc_sunscreen);

  if (scores.aging >= 46 || flags.includes("DEVICE_RECOMMENDED")) {
    if (tier === "Premium") bundle.Device.push(PRODUCT_CATALOG.medicube_booster);
    else if (tier === "Full") bundle.Device.push(PRODUCT_CATALOG.mamicare_device);
  }

  return bundle;
}
