/**
 * routineEngine.ts
 *
 * B-2 / B-2.1 / B-3: Base Type + Target Trouble + Advanced Tier + Skin Rescue Override
 *
 * Input:  SkinVector + ImplicitFlags + AxisResponses
 * Output: RoutineOutput — 3-step, 5-step, Advanced (Device), and SOS Rescue routines.
 *
 * Products sourced from product_db_merged.json via productBridge.ts.
 * Zero hardcoded product catalogs — ONE source of truth.
 *
 * Clinical Safety Gate (Advanced tier):
 *   IF barrier > 85 OR atopyFlag → advanced = null.
 *
 * Skin Rescue Hard Override (B-3):
 *   IF atopyFlag OR confirmed dx_atopic/dx_psoriasis OR (chronic itch + barrier > 75):
 *   → BYPASS all general K-Beauty routines.
 *   → Force 3-Step K-Derma SOS protocol (Dongkook Pharm / Aestura only).
 *   → Device lockout guaranteed (atopyFlag → safetyBlocked → advanced = null).
 */

import type { SkinVector } from "@/engine/types";
import type { AxisResponses, ImplicitFlags } from "@/store/diagnosisStore";
import {
  findProductsForSlot,
  getProductById,
  getWeakAxes,
  SOS_IDS,
  DEVICE_ID,
  type RealProduct,
} from "@/engine/productBridge";

// Re-export so consumers can import from either module
export type { RealProduct } from "@/engine/productBridge";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type BaseType =
  | "oily"
  | "combination-dehydrated-oily"
  | "dry"
  | "normal";

export type TargetTrouble =
  | "barrier-repair"        // Priority 1: SOS Rescue
  | "intense-hydration"     // Priority 2: Critical Dehydration
  | "blemish-sebum-control" // Priority 3: Active Clearance
  | "brightening"           // Priority 4a: Pigment > Aging
  | "well-aging";           // Priority 4b: Aging >= Pigment

export type StepRole =
  | "cleanser"
  | "toner"
  | "serum"
  | "treatment"   // slot 4 in 5-step: eye cream or targeted concentrate
  | "moisturizer"
  | "spf"
  | "device";     // slot 6 in advanced: professional device (Medicube Booster Pro)

export type Formulation =
  | "gel"
  | "water"
  | "lightweight-fluid"
  | "lotion"
  | "cream"
  | "balm"
  | null;         // null = not applicable (devices)

// ─── Routine interfaces ───────────────────────────────────────────────────────

export interface RoutineStep {
  role: StepRole;
  product: RealProduct | null; // null = gracefully omitted in UI
  timing: "am" | "pm";
  order: number;
}

export interface RoutineLevel {
  label: "3-step" | "5-step" | "advanced";
  am: RoutineStep[];
  pm: RoutineStep[];
}

/**
 * B-3: Skin Rescue Hard Override metadata.
 * When `isActive`, the UI must display the SOS protocol instead of
 * all general K-Beauty routines. Device is always locked out.
 */
export interface SkinRescueProtocol {
  isActive: true;
  /** Which trigger condition fired the override. */
  trigger: "atopyFlag" | "diagnosis" | "itch+barrier";
  /** Forced 3-Step routine using K-Derma clinical brands only. */
  routine: RoutineLevel;
  disclaimer: { en: string; de: string; ko: string };
}

export interface RoutineOutput {
  baseType: BaseType;
  targetTrouble: TargetTrouble;
  /**
   * Non-null when advanced is blocked by the Clinical Safety Gate.
   * The UI should show this message instead of the advanced routine.
   */
  advancedCaution: { en: string; de: string; ko: string } | null;
  /**
   * B-3: Non-null when the Skin Rescue Hard Override is active.
   * The UI MUST replace all standard routine display with the SOS rescue UI.
   */
  skinRescue: SkinRescueProtocol | null;
  routines: {
    minimalist: RoutineLevel;      // 3-step
    committed: RoutineLevel;      // 5-step
    advanced: RoutineLevel | null; // 5-step + Device (null = safety gate active)
  };
}

// ─── Device mode mapping (Medicube Age-R Booster Pro 6-in-1) ─────────────────

export const DEVICE_MODE_MAP: Record<TargetTrouble, { en: string; de: string; ko: string }> = {
  "well-aging": {
    en: "EMS Derma Shot + Microcurrent Mode",
    de: "EMS Derma Shot + Mikrostrom-Modus",
    ko: "EMS 더마샷 + 마이크로커런트 모드",
  },
  "intense-hydration": {
    en: " Mode — Electroporation for deep absorption",
    de: "Booster-Modus — Elektroporation für Tiefenwirkung",
    ko: "부스터 모드 — 전기영동으로 깊은 흡수",
  },
  "blemish-sebum-control": {
    en: "Air Shot Mode — Needle-free aesthetic care",
    de: "Air Shot Modus — Nadelfreie Ästhetikpflege",
    ko: "에어샷 모드 — 니들프리 에스테틱 케어",
  },
  "brightening": {
    en: "Booster Mode — Active ingredient absorption (Vitamin C)",
    de: "Booster-Modus — Wirkstoff-Absorption (Vitamin C)",
    ko: "부스터 모드 — 유효성분 흡수 (비타민 C)",
  },
  "barrier-repair": {
    en: "LED Therapy Mode — Low-level light, safe for compromised barrier",
    de: "LED-Anwendung — Niedrigenergie, sicher bei gestörter Barriere",
    ko: "저강도 LED 테라피 모드 — 손상된 장벽에 안전",
  },
};

// ─── Trouble → weak-axis mapping ──────────────────────────────────────────────
// Used to create weakAxes from TargetTrouble when full health scores aren't available.

const TROUBLE_TO_WEAK_AXES: Record<TargetTrouble, string[]> = {
  "barrier-repair":        ["bar", "sen"],
  "intense-hydration":     ["hyd", "bar"],
  "blemish-sebum-control": ["acne", "texture", "seb"],
  "brightening":           ["pigment", "ox"],
  "well-aging":            ["aging", "pigment"],
};

// ─── Derivation logic ─────────────────────────────────────────────────────────

/**
 * Determines skin's base type (cleansing, moisturizer, texture bias)
 * from sebum and hydration axis scores.
 */
export function deriveBaseType(sebum: number, hydration: number): BaseType {
  if (sebum > 60 && hydration < 40) return "combination-dehydrated-oily";
  if (sebum > 60 && hydration >= 40) return "oily";
  if (sebum < 40 && hydration < 40) return "dry";
  return "normal";
}

/**
 * Evaluates the SkinVector against a strict Clinical Hierarchy.
 * The first condition matched becomes the PRIMARY TargetTrouble —
 * it is NOT overridden by lower-priority concerns.
 */
export function deriveTargetTrouble(v: SkinVector): TargetTrouble {
  // ── Priority 1: SOS Rescue (Barrier & Sensitivity) ──────────────────────────
  if (v.barrier > 75 || v.sensitivity > 75) return "barrier-repair";

  // ── Priority 2: Critical Dehydration ────────────────────────────────────────
  if (v.hydration < 25) return "intense-hydration";

  // ── Priority 3: Active Clearance (Acne & Pores) ─────────────────────────────
  if (v.texture > 60 || v.pores > 70) return "blemish-sebum-control";

  // ── Priority 4: Correction ───────────────────────────────────────────────────
  if (v.pigment > v.aging) return "brightening";
  return "well-aging";
}

// ─── B-3: Skin Rescue trigger evaluation ─────────────────────────────────────

/**
 * Determines whether the Skin Rescue Hard Override (B-3) should activate.
 */
export function isSkinRescueRequired(
  axisResponses: AxisResponses,
  implicitFlags: ImplicitFlags,
  vector: SkinVector
): { required: boolean; trigger: SkinRescueProtocol["trigger"] | null } {
  // Trigger 1: Compound atopy flag (multi-signal confirmation)
  if (implicitFlags.atopyFlag) {
    return { required: true, trigger: "atopyFlag" };
  }

  // Trigger 2: Confirmed clinical diagnosis via direct question answer
  const dx = axisResponses.neurodermatitis?.diagnosis;
  if (dx === "dx_atopic" || dx === "dx_psoriasis") {
    return { required: true, trigger: "diagnosis" };
  }

  // Trigger 3: Chronic itch + severely compromised barrier (cross-validated)
  const itch = axisResponses.neurodermatitis?.chronicItching;
  if ((itch === "frequently" || itch === "constantly") && vector.barrier > 75) {
    return { required: true, trigger: "itch+barrier" };
  }

  return { required: false, trigger: null };
}

/**
 * Builds the forced 3-Step SOS Rescue RoutineLevel from real DB products.
 * Uses the SOS product IDs defined in productBridge.ts.
 *
 * Two parallel brand lines cover all base types:
 *   Oily / Combination-Dehydrated → Dongkook Pharm — Madeca MD (Centella)
 *   Dry / Normal                  → Aestura — Atobarrier 365 (Ceramide)
 */
function buildSkinRescueProtocol(
  base: BaseType,
  trigger: SkinRescueProtocol["trigger"]
): SkinRescueProtocol {
  const isOily = base === "oily" || base === "combination-dehydrated-oily";

  const pickSos = (role: StepRole, timing: "am" | "pm", order: number): RoutineStep => {
    let productId: string | undefined;
    if (role === "cleanser") {
      productId = isOily ? SOS_IDS.madeca_cleanser : SOS_IDS.aestura_cleanser;
    } else if (role === "serum") {
      productId = isOily ? SOS_IDS.madeca_serum : SOS_IDS.aestura_serum;
    } else if (role === "moisturizer") {
      productId = isOily ? SOS_IDS.madeca_cream : SOS_IDS.aestura_cream;
    }
    const product = productId ? getProductById(productId) ?? null : null;
    return { role, product, timing, order };
  };

  const routine: RoutineLevel = {
    label: "3-step",
    am: [
      pickSos("cleanser", "am", 1),
      pickSos("serum", "am", 2),
      pickSos("moisturizer", "am", 3),
    ],
    pm: [
      pickSos("cleanser", "pm", 1),
      pickSos("serum", "pm", 2),
      pickSos("moisturizer", "pm", 3),
    ],
  };

  return {
    isActive: true,
    trigger,
    routine,
    disclaimer: {
      en: "Based on your responses, we recommend clinically-tested dermatological products. For chronic conditions, please also consult a dermatologist (Hautarzt).",
      de: "Basierend auf Ihren Angaben empfehlen wir dermatologisch getestete Produkte. Bei chronischen Erkrankungen empfehlen wir zusätzlich die Konsultation eines Hautarztes.",
      ko: "귀하의 응답을 바탕으로 임상 테스트된 피부과 전문 제품을 추천드립니다. 만성 질환의 경우 피부과 전문의(Hautarzt) 상담도 병행하시기 바랍니다.",
    },
  };
}

// ─── Product selection ────────────────────────────────────────────────────────

/**
 * Picks the best-matching product from real DB for a given role,
 * target trouble, base type, and timing slot.
 */
function makeStep(
  role: StepRole,
  trouble: TargetTrouble,
  base: BaseType,
  timing: "am" | "pm",
  order: number
): RoutineStep {
  const weakAxes = TROUBLE_TO_WEAK_AXES[trouble] || [];
  const matches = findProductsForSlot(role, weakAxes, base);
  return { role, product: matches[0] || null, timing, order };
}

// ─── Routine builder ──────────────────────────────────────────────────────────

function buildRoutineLevel(
  label: "3-step" | "5-step",
  base: BaseType,
  trouble: TargetTrouble
): RoutineLevel {
  const pick = (role: StepRole, timing: "am" | "pm", order: number): RoutineStep =>
    makeStep(role, trouble, base, timing, order);

  if (label === "3-step") {
    return {
      label,
      // AM: Cleanser → Serum → Moisturizer → SPF
      am: [
        pick("cleanser", "am", 1),
        pick("serum", "am", 2),
        pick("moisturizer", "am", 3),
        pick("spf", "am", 4),
      ],
      // PM: Cleanser → Serum → Moisturizer
      pm: [
        pick("cleanser", "pm", 1),
        pick("serum", "pm", 2),
        pick("moisturizer", "pm", 3),
      ],
    };
  }

  // 5-step
  return {
    label,
    // AM: Cleanser → Toner → Serum → Treatment → Moisturizer → SPF
    am: [
      pick("cleanser", "am", 1),
      pick("toner", "am", 2),
      pick("serum", "am", 3),
      pick("treatment", "am", 4),
      pick("moisturizer", "am", 5),
      pick("spf", "am", 6),
    ],
    // PM: Cleanser → Toner → Serum → Treatment → Moisturizer
    pm: [
      pick("cleanser", "pm", 1),
      pick("toner", "pm", 2),
      pick("serum", "pm", 3),
      pick("treatment", "pm", 4),
      pick("moisturizer", "pm", 5),
    ],
  };
}

/**
 * Advanced tier: AM is identical to the committed 5-step routine.
 * PM = 5-step committed PM + Step 6: Professional Device Care (Medicube Booster Pro).
 */
function buildAdvancedLevel(base: BaseType, trouble: TargetTrouble): RoutineLevel {
  const committed = buildRoutineLevel("5-step", base, trouble);
  const deviceProduct = getProductById(DEVICE_ID) ?? null;

  const deviceStep: RoutineStep = {
    role: "device",
    product: deviceProduct,
    timing: "pm",
    order: committed.pm.length + 1,
  };

  return {
    label: "advanced",
    am: committed.am,
    pm: [...committed.pm, deviceStep],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * buildRoutine
 *
 * Pure function — takes SkinVector + ImplicitFlags + AxisResponses and returns
 * a RoutineOutput with:
 *   - skinRescue: SkinRescueProtocol | null  (B-3 hard override — checked FIRST)
 *   - minimalist (3-step), committed (5-step), advanced (device) routines
 *   - advancedCaution when the Clinical Safety Gate blocks the advanced tier
 *
 * Evaluation order (STRICT):
 *   1. B-3 Skin Rescue — if active, skinRescue is non-null. Frontend MUST
 *      display the SOS UI and suppress the standard protocol display.
 *      Device is always locked out when rescue is active (atopyFlag → safetyBlocked).
 *   2. Clinical Safety Gate — barrier > 85 OR atopyFlag → advanced = null.
 *   3. Normal 3-tier routine assembly.
 *
 * All product slots use graceful fallback (null = omitted in UI).
 * The frontend (Module C) should treat null steps as omitted.
 */
export function buildRoutine(
  vector: SkinVector,
  implicitFlags: ImplicitFlags,
  axisResponses: AxisResponses
): RoutineOutput {
  const baseType = deriveBaseType(vector.sebum, vector.hydration);
  const targetTrouble = deriveTargetTrouble(vector);

  // ── B-3: Skin Rescue Hard Override (FIRST — no exceptions) ───────────────
  const rescueCheck = isSkinRescueRequired(axisResponses, implicitFlags, vector);
  const skinRescue = rescueCheck.required
    ? buildSkinRescueProtocol(baseType, rescueCheck.trigger!)
    : null;

  // ── Clinical Safety Gate (Advanced tier) ──────────────────────────────────
  const safetyBlocked = vector.barrier > 85 || implicitFlags.atopyFlag;

  const advancedCaution: RoutineOutput["advancedCaution"] = safetyBlocked
    ? {
      en: "Advanced device therapy is currently paused. Your barrier score indicates skin that is not yet ready for EMS / Microcurrent stimulation. Focus on the 5-step repair protocol for 4–6 weeks before re-assessing.",
      de: "Die fortgeschrittene Geräteanwendung ist derzeit pausiert. Ihr Barriere-Score zeigt, dass Ihre Haut noch nicht für EMS / Mikrostrom-Stimulation bereit ist. Konzentrieren Sie sich 4–6 Wochen auf das 5-Schritt-Reparaturprotokoll.",
      ko: "현재 고급 기기 테라피가 일시 중단되었습니다. 배리어 점수가 EMS / 마이크로커런트 자극을 받기에 아직 적합하지 않은 상태입니다. 4–6주 동안 5단계 회복 루틴에 집중한 후 재평가하세요.",
    }
    : null;

  return {
    baseType,
    targetTrouble,
    advancedCaution,
    skinRescue,
    routines: {
      minimalist: buildRoutineLevel("3-step", baseType, targetTrouble),
      committed: buildRoutineLevel("5-step", baseType, targetTrouble),
      advanced: safetyBlocked ? null : buildAdvancedLevel(baseType, targetTrouble),
    },
  };
}
