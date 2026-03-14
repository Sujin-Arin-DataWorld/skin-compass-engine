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
  type MockProduct,
  type RoutineOutput,
} from "@/engine/routineEngine";
import type { ImplicitFlags, AxisResponses } from "@/store/diagnosisStore";
import type { AxisKey, DiagnosisResult, Product, Tier, SkinVector } from "@/engine/types";
import { AXIS_KEYS } from "@/engine/types";

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

  return {
    // Core RoutineOutput fields (SlideProtocol.tsx reads these)
    baseType,
    targetTrouble,
    advancedCaution,
    skinRescue: v4.skinRescue,
    routines: {
      minimalist: v4.routines.minimalist,
      committed:  v4.routines.committed,
      advanced:   (tier === "Premium" && !deviceGated)
        ? (v4.routines.advanced ?? null)
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
 * buildProductBundleV5
 *
 * Returns the product_bundle Record<string, Product[]> for DiagnosisResult.
 *
 * Selection priority:
 *   1. SOS Rescue active → 3-step K-Derma SOS protocol
 *   2. Premium + device cleared → advanced (5-step + device)
 *   3. Full or Premium (gated) → committed (5-step)
 *   4. Entry → minimalist (3-step)
 */
export function buildProductBundleV5(
  result:        DiagnosisResult,
  implicitFlags: ImplicitFlags,
  tier:          Tier,
): Record<string, Product[]> {
  const routine = buildRoutineV5(result, implicitFlags, tier);

  // 1. SOS hard override
  if (routine.skinRescue?.isActive) {
    const r = routine.skinRescue.routine;
    return routineLevelToPhaseMap(r.am, r.pm);
  }

  // 2. Premium + device available
  if (tier === "Premium" && routine.routines.advanced) {
    return routineLevelToPhaseMap(
      routine.routines.advanced.am,
      routine.routines.advanced.pm,
    );
  }

  // 3. Full or Premium (device gated) → 5-step
  if (tier === "Full" || tier === "Premium") {
    return routineLevelToPhaseMap(
      routine.routines.committed.am,
      routine.routines.committed.pm,
    );
  }

  // 4. Entry → 3-step
  return routineLevelToPhaseMap(
    routine.routines.minimalist.am,
    routine.routines.minimalist.pm,
  );
}
