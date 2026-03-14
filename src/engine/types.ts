import type { QuestionAnswer } from "@/engine/questionRoutingV5";

export const AXIS_KEYS = [
  "seb", "hyd", "bar", "sen", "ox",
  "acne", "pigment", "texture", "aging", "makeup_stability"
] as const;

export type AxisKey = typeof AXIS_KEYS[number];
export type AxisScores = Record<AxisKey, number>;
export type AxisSeverity = Record<AxisKey, 0 | 1 | 2 | 3>;

export const AXIS_LABELS: Record<AxisKey, string> = {
  seb: "Sebum",
  hyd: "Hydration",
  bar: "Barrier",
  sen: "Sensitivity",
  ox: "Oxidative Stress",
  acne: "Acne",
  pigment: "Pigmentation",
  texture: "Texture",
  aging: "Aging",
  makeup_stability: "Makeup Stability",
};

export const AXIS_LABELS_DE: Record<AxisKey, string> = {
  seb: "Talg",
  hyd: "Feuchtigkeit",
  bar: "Hautbarriere",
  sen: "Empfindlichkeit",
  ox: "Oxidativer Stress",
  acne: "Akne",
  pigment: "Pigmentierung",
  texture: "Textur",
  aging: "Alterung",
  makeup_stability: "Make-up Stabilität",
};

export const RADAR_AXES: AxisKey[] = ["seb", "hyd", "bar", "sen", "acne", "pigment", "texture", "aging", "ox", "makeup_stability"];

export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";

export type ContextKey =
  | "shaving" | "makeup" | "hormonal" | "outdoor_work"
  | "skincare_beginner" | "recent_procedure" | "low_water_intake"
  | "reactive_skin" | "high_stress";

export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SymptomWeight {
  [axis: string]: number;
}

export interface SymptomDef {
  id: string;
  text_en: string;
  text_de?: string;
  category: number;
  weights: SymptomWeight;
}

export interface MetaQuestion {
  id: string;
  text_en: string;
  text_de?: string;
  type: "boolean" | "severity";
  trigger_after_category: number;
  trigger_condition: (severities: Record<string, number>) => boolean;
}

export interface RiskPattern {
  id: string;
  name_en: string;
  name_de?: string;
  required: string[];
  optional: string[];
  min_optional: number;
  axis_gates: Partial<Record<AxisKey, number>>;
  clinical_en: string;
  clinical_de?: string;
  flag: string;
  urgency: Urgency;
  threshold: number;
}

export interface DetectedPattern {
  pattern: RiskPattern;
  score: number;
  severity: 0 | 1 | 2 | 3;
}

export interface LocalizedContent {
  de: string;
  en: string;
}

export interface Product {
  id: string;
  name: LocalizedContent;
  brand: string;
  phase: string;
  type: string;

  // Commerce & Pricing
  price?: number;
  price_eur: number;
  volume?: string;
  unitPrice?: string;
  shelfLife?: string;
  stockStatus?: "available" | "out_of_stock";

  // Content
  benefitSummary?: LocalizedContent;
  description?: LocalizedContent;
  howToUse?: LocalizedContent;
  ingredients?: string[]; // Full INCI list

  // Scientific Metadata
  phLevel?: number;
  targetVector?: AxisKey;
  vectorImpact?: Partial<Record<AxisKey, number>>;

  // Legacy / Other
  tier: string[];
  shopify_handle: string;
  key_ingredients: string[];
  target_axes: AxisKey[];
  for_skin: string[];
  image?: string;
  texture_feel?: string;
}

export interface DiagnosisResult {
  engineVersion: string;
  axis_scores: AxisScores;
  axis_severity: AxisSeverity;
  axis_scores_normalized: AxisScores;
  detected_patterns: DetectedPattern[];
  urgency_level: Urgency;
  active_flags: string[];
  radar_chart_data: { axis: string; score: number; label: string }[];
  primary_concerns: AxisKey[];
  secondary_concerns: AxisKey[];
  product_bundle: Record<string, Product[]>;

  // ── V5 optional additive fields ────────────────────────────────────────────
  /** Per-axis clinical grade (stable / watch / active / critical). */
  axis_clinical_grade?: Record<AxisKey, { grade: ClinicalGrade; label: { en: string; de: string; ko: string } }>;
  /** Per-zone heatmap intensities and dominant axes from Phase 02 selections. */
  zone_heatmap?: Partial<Record<ZoneId, ZoneHeatmapEntry>>;
  /** Full score provenance trail from scoringEngineV5. */
  score_provenance?: ScoreProvenance[];
  /** Per-axis projected 4-week and 12-week improvement targets. */
  projected_improvement?: ProjectedImprovement;

  _debug?: {
    rawScores: AxisScores;
    normalizedScores: AxisScores;
    finalScores: AxisScores;
    axisSeverities: AxisSeverity;
    patterns: { id: string; name: string; confidence: number; flag: string; severity: number }[];
    dedupScales: Record<string, number>;
    topSymptoms: { id: string; severity: number; text: string }[];
  };
}

export type Tier = "Entry" | "Full" | "Premium";

// ─────────────────────────────────────────────────────────────────────────────
// V5 types — added to keep types.ts as the single source of domain types
// ─────────────────────────────────────────────────────────────────────────────

/** The 7 face zones used in Phase 02 Face Map and zone heatmap. */
export type ZoneId =
  | "forehead" | "eyes" | "nose" | "cheeks"
  | "mouth"    | "jawline" | "neck";

/** Four-band clinical severity grade per axis. */
export type ClinicalGrade = "stable" | "watch" | "active" | "critical";

/** Per-zone summary entry for the zone heatmap (used in SlideAxisBreakdown). */
export interface ZoneHeatmapEntry {
  /** Normalised average axis score for this zone (0–1). */
  intensity:    number;
  /** The highest-scoring axis among this zone's selected concerns. */
  dominantAxis: AxisKey;
  /** Number of concern chips selected in this zone. */
  concernCount: number;
  /** Short human-readable summary of the top concerns (trilingual). */
  summary: { en: string; de: string; ko: string };
}

/**
 * Per-axis score provenance — explains how each axis score was built up
 * through the 5-layer scoring pipeline.
 */
export interface ScoreProvenance {
  axis:       AxisKey;
  totalScore: number;
  breakdown: {
    zoneConcerns:        { zone: ZoneId; concernId: string; contribution: number }[];
    deepDiveQuestions:   { questionId: string; contribution: number }[];
    foundationModifiers: { factor: string; multiplier: number }[];
    crossAxisBonus:      { pattern: string; bonusPercent: number } | null;
  };
}

/** Input shape expected by scoringEngineV5.computeScores(). */
export interface ScoringInput {
  /** Zone concern chip selections from Phase 02. */
  zoneData: Record<string, string[]>;
  /** Deep-dive question answers from Phase 03. */
  axisAnswers: Record<string, QuestionAnswer>;
  /** Phase 01 lifestyle foundation values (all 0-indexed). */
  foundation: {
    sleep:   number;   // 0 = <5h  1 = 5-6h  2 = 7h  3 = 8h+
    water:   number;   // 0 = 1-2 glasses  1 = 3-5  2 = 6+
    stress:  number;   // 0 = Low  1 = Moderate  2 = High
    climate: string | null;
  };
  implicitFlags: { atopyFlag: boolean; [key: string]: unknown };
}

/**
 * Per-axis projected improvement targets produced by routineEngineV5.
 * Used in SlideAxisBreakdown to show 4-week and 12-week goals.
 */
export type ProjectedImprovement = Record<
  AxisKey,
  { currentScore: number; targetScore4w: number; targetScore12w: number }
>;

/**
 * 9-axis skin vector produced by skinVectorEngine (V4 shim).
 * Used as input to routineEngine.ts and routineEngineV5.ts.
 */
export interface SkinVector {
  sebum: number;
  hydration: number;
  pores: number;
  texture: number;
  sensitivity: number;
  aging: number;
  pigment: number;
  barrier: number;
  atopy: number;
}
