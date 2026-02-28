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

export const RADAR_AXES: AxisKey[] = ["seb", "hyd", "bar", "sen", "acne", "aging"];

export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";

export type ContextKey =
  | "shaving" | "makeup" | "hormonal" | "outdoor_work"
  | "skincare_beginner" | "recent_procedure" | "low_water_intake";

export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SymptomWeight {
  [axis: string]: number;
}

export interface SymptomDef {
  id: string;
  text_en: string;
  category: number;
  weights: SymptomWeight;
}

export interface MetaQuestion {
  id: string;
  text_en: string;
  type: "boolean" | "severity";
  trigger_after_category: number;
  trigger_condition: (severities: Record<string, number>) => boolean;
}

export interface RiskPattern {
  id: string;
  name_en: string;
  required: string[];
  optional: string[];
  min_optional: number;
  axis_gates: Partial<Record<AxisKey, number>>;
  clinical_en: string;
  flag: string;
  urgency: Urgency;
  threshold: number;
}

export interface DetectedPattern {
  pattern: RiskPattern;
  score: number;
  severity: 0 | 1 | 2 | 3;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  phase: string;
  type: string;
  price_eur: number;
  tier: string[];
  shopify_handle: string;
  key_ingredients: string[];
  target_axes: AxisKey[];
  for_skin: string[];
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
