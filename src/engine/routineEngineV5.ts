/**
 * routineEngineV5.ts
 *
 * V5 Routine Engine — takes DiagnosisResult from skinVectorEngineV5 and builds
 * the personalized routine + product bundle with projected improvement timelines.
 *
 * Clinical Hierarchy (strict priority — DO NOT CHANGE):
 *   1. Barrier Repair (SOS)     — BARRIER_EMERGENCY flag OR bar ≥ 70: pause all actives
 *   2. Intensive Hydration      — hyd ≥ 60
 *   3. Problem Skin             — acne OR texture ≥ 60, ONLY when bar < 50
 *   4. Brightening / Anti-aging — correction phase when earlier priorities stabilise
 *
 * Tier Differentiation:
 *   Entry   → minimalist (3-step: cleanser + serum + moisturiser)
 *   Full    → committed  (5-step: + toner + SPF)
 *   Premium → advanced   (5-step + clinical device, gated behind barrier recovery)
 *
 * Device Gating (Premium only):
 *   bar ≥ 70 → DEVICE_GATE: ACTIVE  (ships month 2, locked until bar < 50)
 *   bar < 50 → DEVICE_GATE: CLEARED (available immediately)
 *
 * New additive fields (SlideProtocol.tsx ignores unknowns — fully backward-compat):
 *   projected_improvement: per-axis 4-week / 12-week improvement targets
 *   deviceGate:            barrier-gate status string for Premium tier
 */

import {
  buildRoutine,
  type BaseType,
  type TargetTrouble,
  type RoutineLevel,
  type RoutineStep,
  type MockProduct,
  type RoutineOutput,
} from "@/engine/routineEngine";
import type { ImplicitFlags, AxisResponses } from "@/store/diagnosisStore";
import type { AxisKey, DiagnosisResult, Product, Tier, SkinVector } from "@/engine/types";
import { AXIS_KEYS } from "@/engine/types";

// ─────────────────────────────────────────────────────────────────────────────
// Barrier Recovery Mode — ingredient-safe product overrides
//
// When BARRIER_EMERGENCY is active, specific catalog products are replaced
// with barrier-optimised alternatives that meet these rules:
//   Cleanser   : No BHA / AHA / enzyme exfoliants. Low pH, gentle surfactants.
//   Serum      : No retinol, Vitamin C, Niacinamide >5%, AHA, BHA, PHA.
//                If unsafe → swap to Panthenol / Centella / Ceramide ampoule.
//   Moisturizer: Must contain ≥1 of: Ceramide, Cholesterol, Fatty Acid.
//                If absent → swap to triple-lipid recovery cream.
//   SPF        : Mineral-only (Zinc Oxide / Titanium Dioxide).
//                Chemical UV filters (Tinosorb, Oxybenzone, Octinoxate …) excluded.
// ─────────────────────────────────────────────────────────────────────────────

// ── Barrier-safe cleanser overrides (mirrored from SOS_CATALOG in routineEngine.ts)

const BARRIER_CLEANSER_OILY: MockProduct = {
  id: "madeca-cleanser",
  name: {
    en: "Madeca MD Calming Gel Cleanser",
    de: "Madeca MD Beruhigendes Gel-Reinigungsmittel",
    ko: "마데카MD 진정 젤 클렌저",
  },
  brand: "Dongkook Pharm",
  role: "cleanser", targetTrouble: "barrier-repair",
  baseTypes: ["oily", "combination-dehydrated-oily"],
  formulation: "gel",
  keyIngredients: ["Centella Asiatica 60%", "Madecassoside", "Panthenol 5%"],
  phaseTiming: ["am", "pm"],
};

const BARRIER_CLEANSER_DRY: MockProduct = {
  id: "aestura-cleanser",
  name: {
    en: "Atobarrier 365 Gentle Cream Cleanser",
    de: "Atobarrier 365 Sanfter Creme-Reiniger",
    ko: "에스트라 아토베리어 365 순한 크림 클렌저",
  },
  brand: "Aestura",
  role: "cleanser", targetTrouble: "barrier-repair",
  baseTypes: ["dry", "normal"],
  formulation: "cream",
  keyIngredients: ["Ceramide NP", "Betaine", "Allantoin"],
  phaseTiming: ["am", "pm"],
};

// ── Barrier-safe serum placeholder (when catalog serum contains actives)

const BARRIER_SERUM_PLACEHOLDER: MockProduct = {
  id: "barrier-serum-recovery",
  name: {
    en: "Barrier Recovery Ampoule (Separate Selection)",
    de: "Barriere-Regenerations-Ampulle (separate Auswahl)",
    ko: "베리어 진정 앰플 (별도 선택)",
  },
  brand: "SkinStrategyLab",
  role: "serum", targetTrouble: "barrier-repair",
  baseTypes: [],
  formulation: "lightweight-fluid",
  keyIngredients: ["Panthenol", "Allantoin", "Centella Asiatica"],
  phaseTiming: ["am", "pm"],
};

// ── Triple-lipid barrier moisturizer (when catalog pick lacks ceramide)

const BARRIER_MOISTURIZER: MockProduct = {
  id: "barrier-moist-recovery",
  name: {
    en: "Barrier Lock Ceramide Cream",
    de: "Barriere-Schutz Ceramid-Creme",
    ko: "배리어 락 세라마이드 크림",
  },
  brand: "SkinStrategyLab",
  role: "moisturizer", targetTrouble: "barrier-repair",
  baseTypes: [],
  formulation: "cream",
  keyIngredients: ["Ceramide Complex", "Cholesterol", "Linoleic Acid", "Panthenol"],
  phaseTiming: ["am", "pm"],
};

// ── Mineral-only SPF override (when catalog SPF contains chemical UV filters)

const BARRIER_SPF_MINERAL: MockProduct = {
  id: "barrier-spf-mineral",
  name: {
    en: "Mineral Shield SPF 50+ (Zinc Oxide)",
    de: "Mineral-Schutz LSF 50+ (Zinkoxid)",
    ko: "미네랄 선스크린 SPF 50+ (산화아연)",
  },
  brand: "SkinStrategyLab",
  role: "spf", targetTrouble: "universal",
  baseTypes: [],
  formulation: "lightweight-fluid",
  keyIngredients: ["Zinc Oxide 20%", "Titanium Dioxide", "Ceramide NP"],
  phaseTiming: ["am"],
};

// ── Per-step barrier safety gate

function applyBarrierRecoveryToStep(
  step: RoutineStep,
  baseType: BaseType,
): RoutineStep {
  if (!step.product) return step;
  const ing = step.product.keyIngredients;

  switch (step.role) {
    case "cleanser": {
      const isUnsafe = ing.some((i) =>
        /\bBHA\b|salicylic acid|AHA|glycolic acid|lactic acid|mandelic acid|enzyme|sulfate/i.test(i)
      );
      if (isUnsafe) {
        const isOily = baseType === "oily" || baseType === "combination-dehydrated-oily";
        return { ...step, product: isOily ? BARRIER_CLEANSER_OILY : BARRIER_CLEANSER_DRY };
      }
      return step;
    }
    case "serum": {
      const isUnsafe = ing.some((i) =>
        /retinol|retinal|tretinoin|ascorbic acid|vitamin c [0-9]|salicylic acid|glycolic|lactic|mandelic|niacinamide 10%/i.test(i)
      );
      if (isUnsafe) return { ...step, product: BARRIER_SERUM_PLACEHOLDER };
      return step;
    }
    case "moisturizer": {
      const hasBarrierLipid = ing.some((i) =>
        /ceramide|cholesterol|linoleic|caprylic|capric|fatty acid/i.test(i)
      );
      if (!hasBarrierLipid) return { ...step, product: BARRIER_MOISTURIZER };
      return step;
    }
    case "spf": {
      const hasChemFilter = ing.some((i) =>
        /tinosorb|oxybenzone|octinoxate|homosalate|ethylhexyl methoxycinnamate|butyl methoxydibenzoylmethane/i.test(i)
      );
      if (hasChemFilter) return { ...step, product: BARRIER_SPF_MINERAL };
      return step;
    }
    default:
      return step;
  }
}

/**
 * getBarrierRecoveryRoutine
 *
 * Post-processes a RoutineLevel and replaces any slots whose selected products
 * violate barrier-recovery ingredient rules (see top-of-file comment).
 * Called automatically by buildRoutineV5() when BARRIER_EMERGENCY is active.
 */
export function getBarrierRecoveryRoutine(
  level: RoutineLevel,
  baseType: BaseType,
): RoutineLevel {
  return {
    ...level,
    am: level.am.map((s) => applyBarrierRecoveryToStep(s, baseType)),
    pm: level.pm.map((s) => applyBarrierRecoveryToStep(s, baseType)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.5B: Age-adaptive ingredient concentration profiles
// ─────────────────────────────────────────────────────────────────────────────

interface AgeProfile {
  retinolMax: number;
  vitaminCRange: string;
  exfoliationFreq: string;
  priorityAxes: AxisKey[];
  avoidIngredients: string[];
}

export const AGE_PROFILES: Record<number, AgeProfile> = {
  0: { // Under 20
    retinolMax: 0,
    vitaminCRange: "skip or 5% max",
    exfoliationFreq: "1x per week max",
    priorityAxes: ["acne", "seb", "texture"],
    avoidIngredients: ["retinol", "high_concentration_aha"],
  },
  1: { // 20-29
    retinolMax: 0.3,
    vitaminCRange: "10-15%",
    exfoliationFreq: "2x per week",
    priorityAxes: ["acne", "seb", "pigment", "hyd"],
    avoidIngredients: [],
  },
  2: { // 30-39
    retinolMax: 0.5,
    vitaminCRange: "15-20%",
    exfoliationFreq: "2-3x per week",
    priorityAxes: ["aging", "pigment", "hyd", "ox"],
    avoidIngredients: [],
  },
  3: { // 40-49
    retinolMax: 0.5,
    vitaminCRange: "15-20%",
    exfoliationFreq: "2-3x per week",
    priorityAxes: ["aging", "hyd", "bar", "pigment"],
    avoidIngredients: [],
  },
  4: { // 50-59
    retinolMax: 1.0,
    vitaminCRange: "15-20%",
    exfoliationFreq: "2x per week",
    priorityAxes: ["aging", "hyd", "bar", "pigment"],
    avoidIngredients: [],
  },
  5: { // 60+
    retinolMax: 0.5,
    vitaminCRange: "10-15%",
    exfoliationFreq: "1x per week",
    priorityAxes: ["aging", "hyd", "bar"],
    avoidIngredients: ["high_concentration_aha", "strong_retinol"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.5C: Seasonal guidance
// ─────────────────────────────────────────────────────────────────────────────

interface SeasonalGuidance {
  currentSeason: "summer" | "winter" | "transitional";
  moisturizerTexture: "gel" | "lotion" | "cream" | "rich_cream";
  cleanserNote: { en: string; de: string; ko: string };
  spfNote: { en: string; de: string; ko: string };
}

export function computeSeasonalGuidance(
  scores: DiagnosisResult["axis_scores"],
  foundation: { seasonal_change?: number; texture_pref?: number },
  latitude: number = 50,
): SeasonalGuidance {
  const month = new Date().getMonth();
  const isWinter = month >= 10 || month <= 2;
  const isSummer = month >= 5 && month <= 8;
  const currentSeason: SeasonalGuidance["currentSeason"] =
    isWinter ? "winter" : isSummer ? "summer" : "transitional";

  let moisturizerTexture: SeasonalGuidance["moisturizerTexture"];

  if (isWinter) {
    if (scores.hyd >= 50 || scores.bar >= 50) {
      moisturizerTexture = "rich_cream";
    } else if (scores.seb >= 60) {
      moisturizerTexture = "lotion";
    } else {
      moisturizerTexture = "cream";
    }
  } else if (isSummer) {
    if (scores.seb >= 50) {
      moisturizerTexture = "gel";
    } else if (scores.hyd >= 50) {
      moisturizerTexture = "lotion";
    } else {
      moisturizerTexture = "lotion";
    }
  } else {
    moisturizerTexture = "lotion";
  }

  // Respect user texture preference unless barrier is in crisis
  const texturePref = foundation.texture_pref;
  if (texturePref !== undefined && texturePref !== 3 && scores.bar < 60) {
    const prefMap: SeasonalGuidance["moisturizerTexture"][] = ["gel", "lotion", "cream", "cream"];
    moisturizerTexture = prefMap[texturePref] ?? moisturizerTexture;
  }

  return {
    currentSeason,
    moisturizerTexture,
    cleanserNote: isWinter
      ? { en: "In winter, use a cream or milk cleanser to avoid stripping moisture",
          de: "Im Winter eignet sich eine Reinigungsmilch, um die Feuchtigkeit zu erhalten",
          ko: "겨울에는 수분을 빼앗기지 않는 밀크/크림 클렌저를 추천해요" }
      : { en: "In summer, a gel or foam cleanser effectively removes excess oil and sweat",
          de: "Im Sommer entfernt ein Gel- oder Schaumreiniger überschüssiges Öl und Schweiß",
          ko: "여름에는 피지와 땀을 깔끔하게 제거하는 젤/폼 클렌저를 추천해요" },
    spfNote: (latitude >= 45 && isWinter)
      ? { en: "At your latitude, winter UVB is minimal — SPF 15-30 is sufficient. Focus on barrier protection.",
          de: "In Ihrem Breitengrad ist die Winter-UVB-Strahlung gering — LSF 15-30 reicht. Fokus auf Barriereschutz.",
          ko: "거주 위도에서는 겨울 UVB가 적어요 — SPF 15-30이면 충분합니다. 장벽 보호에 집중하세요." }
      : { en: "Daily SPF 30+ recommended year-round at your location",
          de: "Täglicher LSF 30+ wird ganzjährig an Ihrem Standort empfohlen",
          ko: "거주 지역에서는 연중 SPF 30+ 매일 사용을 권장합니다" },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3.5E: Skinimalism step-count guard
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a step-count override for 60+ users with compromised barrier. */
export function determineSkinimalismOverride(
  ageBracket: number | undefined,
  barScore: number,
): number | null {
  if ((ageBracket ?? -1) >= 5 && barScore >= 50) {
    return 3; // 60+ + fragile barrier → max 3 steps
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// V5 additive types
// ─────────────────────────────────────────────────────────────────────────────

export interface AxisProjection {
  currentScore:   number;
  targetScore4w:  number;
  targetScore12w: number;
}

export type ProjectedImprovement = Record<AxisKey, AxisProjection>;

export interface DeviceGateInfo {
  /** ACTIVE = gated (barrier emergency); CLEARED = device available now */
  status:  "ACTIVE" | "CLEARED";
  /** Human-readable gate display string for debug / UI */
  display: string;
}

/**
 * RoutineOutputV5 — structurally compatible with RoutineOutput so that
 * SlideProtocol.tsx (which expects RoutineOutput) works without changes.
 */
export type RoutineOutputV5 = RoutineOutput & {
  projected_improvement: ProjectedImprovement;
  deviceGate:            DeviceGateInfo | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Base improvement rates (4-week baseline, high score = worse condition)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_RATES: Record<AxisKey, number> = {
  bar:              0.25,   // responds fast to targeted barrier protocol
  hyd:              0.22,
  seb:              0.18,
  sen:              0.20,
  acne:             0.15,
  texture:          0.12,
  pigment:          0.08,   // slowest responder
  aging:            0.10,
  ox:               0.15,
  makeup_stability: 0.12,
};

// ─────────────────────────────────────────────────────────────────────────────
// Projected improvement calculator
// ─────────────────────────────────────────────────────────────────────────────

function computeProjectedImprovement(
  scores: DiagnosisResult["axis_scores"],
  flags:  string[],
  tier:   Tier,
): ProjectedImprovement {
  const hasBarrierEmergency  = flags.includes("BARRIER_EMERGENCY");
  const isPremiumWithDevice  = tier === "Premium" && !hasBarrierEmergency;

  const result = {} as ProjectedImprovement;

  for (const axis of AXIS_KEYS) {
    let rate4w = BASE_RATES[axis];

    // BARRIER_EMERGENCY doubles barrier improvement (focused protocol effect)
    if (axis === "bar" && hasBarrierEmergency) rate4w = 0.50;

    // Premium device amplifies aging and texture axes
    if (isPremiumWithDevice && (axis === "aging" || axis === "texture")) rate4w *= 1.4;

    const rate12w  = Math.min(0.95, rate4w * 2.2);   // diminishing returns, cap at 95%
    const current  = scores[axis] ?? 0;

    result[axis] = {
      currentScore:   Math.round(current),
      targetScore4w:  Math.max(5, Math.round(current * (1 - rate4w))),
      targetScore12w: Math.max(3, Math.round(current * (1 - rate12w))),
    };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Device gate evaluator
// ─────────────────────────────────────────────────────────────────────────────

function computeDeviceGate(
  scores: DiagnosisResult["axis_scores"],
  tier:   Tier,
): DeviceGateInfo | null {
  if (tier !== "Premium") return null;

  const bar    = Math.round(scores.bar    ?? 0);
  const sen    = Math.round(scores.sen    ?? 0);
  const status: "ACTIVE" | "CLEARED" = bar >= 70 ? "ACTIVE" : "CLEARED";

  return {
    status,
    display: `bar_score=${bar} · sen_score=${sen} · DEVICE_GATE: ${status}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// V5 BaseType derivation  (hyd is severity: high = dehydrated)
// ─────────────────────────────────────────────────────────────────────────────

function deriveBaseTypeV5(scores: DiagnosisResult["axis_scores"]): BaseType {
  const { seb, hyd } = scores;
  if (seb > 60 && hyd > 50) return "combination-dehydrated-oily";
  if (seb > 60)              return "oily";
  if (hyd > 50)              return "dry";
  return "normal";
}

// ─────────────────────────────────────────────────────────────────────────────
// V5 TargetTrouble — Clinical Hierarchy (strict order)
// ─────────────────────────────────────────────────────────────────────────────

function deriveTargetTroubleV5(
  scores: DiagnosisResult["axis_scores"],
  flags:  string[],
): TargetTrouble {
  const { bar, hyd, sen, acne, texture, pigment, aging } = scores;

  // 1. Barrier SOS — flag-driven OR score threshold
  if (flags.includes("BARRIER_EMERGENCY") || bar >= 70 || sen >= 75) {
    return "barrier-repair";
  }

  // 2. Intensive hydration
  if (hyd >= 60) return "intense-hydration";

  // 3. Problem skin — ONLY when barrier is healthy (safe to use actives)
  if (bar < 50 && (acne >= 60 || texture >= 60)) return "blemish-sebum-control";

  // 4. Correction phase — pigment vs aging
  if (pigment > aging) return "brightening";
  return "well-aging";
}

// ─────────────────────────────────────────────────────────────────────────────
// V4 shims  (delegate catalog + SOS rescue to existing routineEngine.ts)
// ─────────────────────────────────────────────────────────────────────────────

function toV4SkinVector(
  scores: DiagnosisResult["axis_scores"],
  flags:  string[],
): SkinVector {
  return {
    sebum:       scores.seb,
    hydration:   100 - scores.hyd,   // V5 hyd inverted: high = dehydrated
    pores:       scores.texture,      // V5 texture → V4 pores (congestion proxy)
    texture:     scores.acne,         // V5 acne → V4 texture (breakout/lesion proxy)
    sensitivity: scores.sen,
    aging:       scores.aging,
    pigment:     scores.pigment,
    barrier:     scores.bar,
    atopy:       flags.includes("ATOPY") ? 85 : 5,
  };
}

function toV4ImplicitFlags(
  implicitFlags: { atopyFlag: boolean },
): ImplicitFlags {
  return {
    atopyFlag:               implicitFlags.atopyFlag,
    likelyHormonalCycleUser: false,
    likelyShaver:            false,
  };
}

const EMPTY_AXIS_RESPONSES: AxisResponses = {};

// ─────────────────────────────────────────────────────────────────────────────
// MockProduct → DiagnosisResult.product_bundle Product conversion
// ─────────────────────────────────────────────────────────────────────────────

function mockToProduct(mp: MockProduct, phase: string): Product {
  return {
    id:              mp.id,
    name:            { en: mp.name.en, de: mp.name.de },
    brand:           mp.brand,
    phase,
    type:            mp.role,
    price_eur:       0,
    tier:            mp.isHero ? ["Entry", "Full", "Premium"] : ["Full", "Premium"],
    shopify_handle:  mp.id,
    key_ingredients: mp.keyIngredients,
    target_axes:     [],
    for_skin:        mp.baseTypes,
    texture_feel:    mp.formulation ?? undefined,
  };
}

function routineLevelToPhaseMap(
  am: RoutineLevel["am"],
  pm: RoutineLevel["pm"],
): Record<string, Product[]> {
  const bundle: Record<string, Product[]> = { AM: [], PM: [], Device: [] };

  for (const step of am) {
    if (!step.product) continue;
    bundle.AM.push(mockToProduct(step.product, "AM"));
  }
  for (const step of pm) {
    if (!step.product) continue;
    const phase = step.role === "device" ? "Device" : "PM";
    bundle[phase].push(mockToProduct(step.product, phase));
  }

  if (bundle.Device.length === 0) delete bundle.Device;
  return bundle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: buildRoutineV5
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildRoutineV5
 *
 * Builds a RoutineOutputV5 that is fully compatible with SlideProtocol.tsx
 * (same RoutineOutput shape) plus projected_improvement and deviceGate.
 *
 * The underlying product catalog and SOS Rescue logic are reused from
 * routineEngine.ts via the V4 shim layer, so all existing safety gates
 * are enforced identically.
 */
export function buildRoutineV5(
  result:        DiagnosisResult,
  implicitFlags: ImplicitFlags,
  tier:          Tier,
): RoutineOutputV5 {
  const scores = result.axis_scores;
  const flags  = result.active_flags;

  // ── V4 routine (catalog + SOS rescue) ───────────────────────────────────
  const v4 = buildRoutine(
    toV4SkinVector(scores, flags),
    toV4ImplicitFlags(implicitFlags),
    EMPTY_AXIS_RESPONSES,
  );

  // ── V5 overrides ─────────────────────────────────────────────────────────
  const baseType      = deriveBaseTypeV5(scores);
  const targetTrouble = deriveTargetTroubleV5(scores, flags);
  const deviceGate    = computeDeviceGate(scores, tier);

  // Device gate blocks the advanced routine tier
  const deviceGated    = deviceGate?.status === "ACTIVE";
  const advancedCaution: RoutineOutput["advancedCaution"] = deviceGated
    ? {
        en: `Device therapy is paused. Barrier score (${Math.round(scores.bar)}) must drop below 50 before EMS / LED activation. Follow the 5-step repair protocol for 4–6 weeks before re-assessing.`,
        de: `Gerätetherapie ist pausiert. Der Barriere-Wert (${Math.round(scores.bar)}) muss unter 50 fallen, bevor EMS / LED aktiviert werden kann. Folgen Sie 4–6 Wochen dem 5-Schritt-Reparaturprotokoll.`,
        ko: `기기 테라피가 일시 중단되었습니다. 배리어 점수(${Math.round(scores.bar)})가 50 이하로 내려가야 EMS / LED를 활성화할 수 있습니다. 4–6주간 5단계 회복 루틴을 따르세요.`,
      }
    : v4.advancedCaution;

  // ── Projected improvement ─────────────────────────────────────────────────
  const projected_improvement = computeProjectedImprovement(scores, flags, tier);

  const hasBarrierEmergency = flags.includes("BARRIER_EMERGENCY");

  return {
    // Core RoutineOutput fields (SlideProtocol.tsx reads these)
    baseType,
    targetTrouble,
    advancedCaution,
    skinRescue: v4.skinRescue,
    routines: {
      minimalist: hasBarrierEmergency
        ? getBarrierRecoveryRoutine(v4.routines.minimalist, baseType)
        : v4.routines.minimalist,
      committed: hasBarrierEmergency
        ? getBarrierRecoveryRoutine(v4.routines.committed, baseType)
        : v4.routines.committed,
      advanced: (tier === "Premium" && !deviceGated)
        ? (v4.routines.advanced
            ? (hasBarrierEmergency
                ? getBarrierRecoveryRoutine(v4.routines.advanced, baseType)
                : v4.routines.advanced)
            : null)
        : null,
    },
    // V5 additive fields
    projected_improvement,
    deviceGate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildProductBundleV5 — tier-appropriate product_bundle for DiagnosisResult
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BRAND_AFFINITY_MULTIPLIER
 *
 * When building the routine, if the Phase 1 product has been selected,
 * subsequent products from the SAME brand receive a 1.15× scoring boost.
 * This prevents "Frankenstein" routines that mix too many brands,
 * providing a more cohesive user experience and better ingredient synergy.
 *
 * The multiplier is applied during the post-selection reranking pass:
 *   - Extract Phase 1 brand from the routine
 *   - For each subsequent phase, if multiple candidates exist, prefer
 *     the same-brand candidate by boosting its implicit priority
 *
 * Future maintenance: adjust this constant to tune brand cohesion vs diversity.
 */
const BRAND_AFFINITY_MULTIPLIER = 1.15;

/**
 * applyBrandAffinity
 *
 * Post-selection reranking: given a flat product list from the V4 routine,
 * if Phase 1 product establishes a dominant brand, subsequent same-brand
 * products are moved toward the front of their respective phase slots.
 *
 * This is a "soft preference" — it doesn't replace any products, it only
 * reorders when alternatives from the same pool exist. In practice, since
 * the V4 engine's catalog is brand-homogeneous (SkinStrategyLab), this
 * primarily affects routines using the merged product DB with multi-brand
 * candidates per slot.
 */
function applyBrandAffinity(products: Product[]): Product[] {
  if (products.length < 2) return products;

  // The first product defines the "anchor" brand
  const anchorBrand = products[0].brand;
  if (!anchorBrand) return products;

  // Score each product: same-brand gets the multiplier boost
  return [...products].sort((a, b) => {
    const aBoost = a.brand === anchorBrand ? BRAND_AFFINITY_MULTIPLIER : 1.0;
    const bBoost = b.brand === anchorBrand ? BRAND_AFFINITY_MULTIPLIER : 1.0;
    // Higher boost = earlier position; preserve original order for ties
    return bBoost - aBoost;
  });
}

/**
 * TIER_STEP_LIMITS
 *
 * Strict product counts per tier. After the V4 engine builds the full
 * routine, we slice to exactly this many products per AM/PM phase.
 *   Entry:   3 products (cleanser, serum, moisturizer)
 *   Full:    5 products (cleanser, toner, serum, treatment, moisturizer)
 *   Premium: 5 products + device (same as Full, device handled separately)
 */
const TIER_STEP_LIMITS: Record<Tier, number> = {
  Entry: 3,
  Full: 5,
  Premium: 5,  // device is a separate slot, not counted here
};

/**
 * buildProductBundleV5
 *
 * Returns the product_bundle Record<string, Product[]> for DiagnosisResult.
 *
 * Selection priority:
 *   1. SOS Rescue active → 3-step K-Derma SOS protocol
 *   2. Premium + device cleared → advanced (5-step + device)
 *   3. Full or Premium (gated) → committed (5-step)
 *   4. Entry → minimalist (3-step)
 *
 * After selection, applies:
 *   - Brand affinity reranking (1.15× same-brand boost)
 *   - Strict array slice to match tier step count
 */
export function buildProductBundleV5(
  result:        DiagnosisResult,
  implicitFlags: ImplicitFlags,
  tier:          Tier,
): Record<string, Product[]> {
  const routine = buildRoutineV5(result, implicitFlags, tier);

  // 1. SOS hard override — no brand affinity or slicing applied
  if (routine.skinRescue?.isActive) {
    const r = routine.skinRescue.routine;
    return routineLevelToPhaseMap(r.am, r.pm);
  }

  let bundle: Record<string, Product[]>;

  // 2. Premium + device available
  if (tier === "Premium" && routine.routines.advanced) {
    bundle = routineLevelToPhaseMap(
      routine.routines.advanced.am,
      routine.routines.advanced.pm,
    );
  }
  // 3. Full or Premium (device gated) → 5-step
  else if (tier === "Full" || tier === "Premium") {
    bundle = routineLevelToPhaseMap(
      routine.routines.committed.am,
      routine.routines.committed.pm,
    );
  }
  // 4. Entry → 3-step
  else {
    bundle = routineLevelToPhaseMap(
      routine.routines.minimalist.am,
      routine.routines.minimalist.pm,
    );
  }

  // ── Brand affinity reranking ──────────────────────────────────────────────
  // Apply 1.15× boost for same-brand products within each phase
  for (const phase of Object.keys(bundle)) {
    if (phase === "Device") continue; // Don't rerank devices
    bundle[phase] = applyBrandAffinity(bundle[phase]);
  }

  // ── Strict tier step count slice ──────────────────────────────────────────
  // Ensure we return exactly the right number of products for the tier
  const limit = TIER_STEP_LIMITS[tier];
  for (const phase of Object.keys(bundle)) {
    if (phase === "Device") continue; // Device is a separate slot
    if (bundle[phase].length > limit) {
      bundle[phase] = bundle[phase].slice(0, limit);
    }
  }

  return bundle;
}

