// ============================================
// Core Enums & Literal Types
// ============================================

export type Country = 'KR' | 'DE' | 'JP' | 'FR' | 'US';

export type MarketTier =
  | 'budget_daiso'
  | 'budget_drugstore'
  | 'premium'
  | 'drugstore'
  | 'medical_otc'
  | 'luxury';

export type PriceTier = 'entry' | 'full' | 'premium';

export type RoutineSlot =
  | 'cleanser' | 'toner' | 'toner_exfoliant' | 'essence'
  | 'serum_am' | 'serum_pm' | 'serum_spot'
  | 'moisturizer_light' | 'moisturizer_rich' | 'moisturizer_allinone'
  | 'spf'
  | 'mask_sheet' | 'mask_modeling' | 'mask_sleeping';

export type FaceZone =
  | 'whole_face' | 't_zone' | 'forehead' | 'nose'
  | 'cheeks' | 'mouth' | 'jawline' | 'eye_area' | 'neck'
  | 'spot_only' | 'dry_areas_only' | 'oily_areas_only'
  // Slot-based virtual zones (used when no face-map zone data is available)
  | 'slot_cleanser' | 'slot_toner' | 'slot_serum_am' | 'slot_moisturizer'
  | 'slot_spf' | 'slot_serum_pm' | 'slot_eye_cream';

export type ApplicationMethod =
  | 'wash_off' | 'leave_on' | 'sheet_mask'
  | 'modeling_mask' | 'spot_treatment' | 'sleeping_mask';

export type SkinProfile =
  | 'oily_acne' | 'dehydrated_oily' | 'dry_barrier'
  | 'sensitive' | 'aging_elasticity' | 'post_menopause'
  | 'pigmentation' | 'mens' | 'combination';

export type Severity = 'mild' | 'moderate' | 'severe' | 'extreme';

export type AssessmentAxis =
  | 'sebum' | 'hydration' | 'pores' | 'texture'
  | 'sensitivity' | 'aging' | 'pigmentation' | 'barrier'
  | 'neurodermatitis';

export type TimeOfDay = 'AM' | 'PM' | 'both';

// ============================================
// Severity Thresholds (score 0-100 → severity)
// ============================================

export const SEVERITY_THRESHOLDS: Record<Severity, [number, number]> = {
  mild: [0, 25],
  moderate: [26, 50],
  severe: [51, 75],
  extreme: [76, 100],
};

export function scoreToSeverity(score: number): Severity {
  if (score >= 80) return 'extreme';    // severity 3 (100) or stacked → extreme
  if (score >= 46) return 'severe';     // severity 2 single concern (67) → severe
  if (score > 0) return 'moderate';   // severity 1 single concern (33) → moderate
  return 'mild';
}

// ============================================
// Product Schema
// ============================================

export interface Ingredient {
  name_en: string;
  name_kr: string;
  name_inci: string;
  concentration_pct: number | null;
  concentration_unit: '%' | 'ppm' | 'IU' | null;
  role: string;
}

export interface Product {
  id: string;
  name_kr: string;
  name_en: string;
  name_de: string;
  brand: string;
  brand_kr: string;
  country: Country;
  market_tier: MarketTier;
  price_tier: PriceTier;
  price_eur: number;
  price_krw: number | null;
  volume_ml: number;
  price_per_ml_eur: number;
  routine_slot: RoutineSlot;
  texture_type: string;
  texture_order: number;
  ingredients: Ingredient[];
  target_profiles: SkinProfile[];
  target_age_range: string;
  skin_concerns: string[];
  application_zones: FaceZone[];
  application_method: ApplicationMethod;
  application_instruction_kr: string;
  application_instruction_en: string;
  application_instruction_de: string;
  application_frequency: string;
  fragrance_free: boolean;
  alcohol_free: boolean;
  purchase_channels: {
    KR: string[];
    DE: string[];
    global_online: string[];
  };
  awards: string[];
  one_liner_kr: string;
  one_liner_en: string;
  vs_comparison: {
    competitor_id: string;
    advantage_kr: string;
    advantage_en: string;
    disadvantage_kr: string;
    disadvantage_en: string;
  } | null;
  duel_verdict: {
    ingredient_winner: Country | 'draw';
    reason_kr: string;
    reason_en: string;
  } | null;
}

// ============================================
// Zone Analysis
// ============================================

export interface AxisScore {
  axis: AssessmentAxis;
  score: number;
  severity: Severity;
}

export interface RequiredIngredient {
  name_en: string;
  name_kr: string;
  description_en?: string;
  description_ko?: string;
  description_de?: string;
  min_concentration: number | null;
  max_concentration: number | null;
  unit: string;
  priority: 'must_have' | 'nice_to_have';
  contraindicated_with: string[];
}

export interface ZoneAssessment {
  zone: FaceZone;
  axis_scores: AxisScore[];
  matched_profile: SkinProfile;
  required_ingredients: RequiredIngredient[];
  /** Detected from analysis questionnaire — triggers rosacea concentration adjustments */
  is_rosacea_prone?: boolean;
}

// ============================================
// Layer 1: Global Gate
// ============================================

export type GateStatus = 'recovery_only' | 'caution' | 'full_routine';

export interface GlobalGateResult {
  status: GateStatus;
  triggered_by: AssessmentAxis | null;
  severity: Severity;
  message_key: string;          // i18n key, not hardcoded text
  recovery_products: Product[];
  recovery_duration_weeks: number;
  re_analysis_cta: boolean;
}

// ============================================
// Layer 2: Duel
// ============================================

export interface DuelCard {
  zone: FaceZone;
  scientific_standard: {
    title_key: string;
    criteria: RequiredIngredient[];
  };
  kr_products: Product[];       // may be empty if no KR match
  de_products: Product[];       // may be empty if no DE match
  verdict: {
    winner: Country | 'draw' | 'kr_only' | 'de_only';
    reason_key: string;
  };
  tier_options: {
    entry: Product[];
    full: Product[];
    premium: Product[];
  };
}

// ============================================
// Layer 3: Routine Builder
// ============================================

export interface RoutineStep {
  order: number;
  product: Product;
  time_of_day: TimeOfDay;
  zone_instructions: FaceZone[];
  warning_key: string | null;
  texture_order: number;
}

export interface PhConflict {
  product_a_id: string;
  product_b_id: string;
  conflict_type: 'wait_10min' | 'split_am_pm' | 'pm_only' | 'avoid_combination';
  warning_key: string;
}

export interface FinalRoutine {
  user_id: string;
  analysis_session_id: string;
  global_gate: GateStatus;
  am_routine: RoutineStep[];
  pm_routine: RoutineStep[];
  weekly_masks: RoutineStep[];
  ph_conflicts: PhConflict[];
  zone_map_overlay: {
    zone: FaceZone;
    color_code: string;
    product_ids: string[];
  }[];
  total_cost_eur: number;
  created_at: string;
}

// ============================================
// Zustand Store Shape
// ============================================

export interface LabSelectionState {
  // Input from analysis
  zoneDiagnoses: ZoneAssessment[];

  // Layer 1
  gateResult: GlobalGateResult | null;

  // Layer 2 - user selections
  selectedProducts: Map<FaceZone, { product: Product; tier: PriceTier }>;

  // Layer 3 - final output
  finalRoutine: FinalRoutine | null;

  // Clinical safety flags (from analysis intake)
  isPregnantOrNursing: boolean;
  isRosaceaProne: boolean;

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Actions
  setZoneDiagnoses: (diagnoses: ZoneAssessment[]) => void;
  evaluateGate: () => void;
  selectProduct: (zone: FaceZone, product: Product, tier: PriceTier) => void;
  removeProduct: (zone: FaceZone) => void;
  buildRoutine: () => void;
  saveRoutine: () => Promise<void>;
  setPregnancyStatus: (status: boolean) => void;
  setRosaceaStatus: (status: boolean) => void;
  reset: () => void;
}
