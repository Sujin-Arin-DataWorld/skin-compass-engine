/**
 * scoringEngineV5.ts
 *
 * New scoring pipeline for the 3-phase diagnosis flow.
 * Produces 0-100 axis scores from:
 *   Layer 1 — Zone concern spread          (max 45 pts)
 *   Layer 2 — Deep-dive question severity  (max 35 pts)
 *   Layer 3 — Foundation lifestyle mods    (multiplicative)
 *   Layer 4 — Cross-axis interaction bonus (multiplicative)
 *   Layer 5 — S-curve normalisation → 0-100 final
 *
 * Sigmoid calibrated so that:
 *   • 1 zone chip-only  ≈ 20  (k=0.041, mid=40)
 *   • 7 zones chip-only ≈ 55
 *   • chip + full deep-dive ceiling ≈ 85-95
 */

import { AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { QuestionAnswer } from "@/engine/questionRoutingV5";
import { AXIS_KEYS } from "@/engine/types";
import type { AxisKey } from "@/engine/types";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ZoneId =
  | "forehead" | "eyes" | "nose" | "cheeks"
  | "mouth"   | "jawline" | "neck";

export interface ScoringInput {
  /** Zone concern chip selections from Phase 02 */
  zoneData: Record<string, string[]>;
  /** Deep-dive question answers from Phase 03 */
  axisAnswers: Record<string, QuestionAnswer>;
  /** Phase 01 lifestyle foundation (all values 0-indexed) */
  foundation: {
    sleep:            number;    // 0=<5h  1=5-6h  2=7h  3=8h+
    water:            number;    // 0=1-2 glasses  1=3-5  2=6+
    stress:           number;    // 0=Low  1=Moderate  2=High
    climate:          string | null;
    age_bracket?:     number;    // 0=<20  1=20s  2=30s  3=40s  4=50s  5=60+
    gender?:          number;    // 0=female  1=male  2=non-binary/prefer not
    seasonal_change?: number;    // 0=no change  1=oilier summer/drier winter  2=dry yr-round  3=oily yr-round
    texture_pref?:    number;    // 0=gel  1=lotion  2=cream  3=depends on season
  };
  implicitFlags: { atopyFlag: boolean; [key: string]: unknown };
}

export interface ScoreProvenance {
  axis: AxisKey;
  totalScore: number;
  breakdown: {
    zoneConcerns:      { zone: ZoneId; concernId: string; contribution: number }[];
    deepDiveQuestions: { questionId: string; contribution: number }[];
    foundationModifiers: { factor: string; multiplier: number }[];
    crossAxisBonus:    { pattern: string; bonusPercent: number } | null;
  };
}

export interface ScoringOutput {
  scores:      Record<AxisKey, number>;
  provenance:  ScoreProvenance[];
  activeFlags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone concern → axis mapping
// ─────────────────────────────────────────────────────────────────────────────

interface ConcernEntry { axis: AxisKey; flag?: string }

/**
 * Canonical mapping of every Phase 02 concern chip ID to its primary axis.
 * Rules applied:
 *   • "pores" concern chips → texture axis
 *   • "hormonal" concern chips → acne axis + HORMONAL_ACNE flag
 */
const CONCERN_AXIS_MAP: Record<string, ConcernEntry> = {
  // ── Forehead ────────────────────────────────────────────────────────────────
  oily_f:          { axis: "seb" },
  blackheads_f:    { axis: "texture" },   // pores → texture
  whiteheads_f:    { axis: "texture" },
  lines_f:         { axis: "aging" },
  breakouts_f:     { axis: "texture" },

  // ── Eyes ────────────────────────────────────────────────────────────────────
  fine_lines_e:    { axis: "aging" },
  dark_circles_e:  { axis: "pigment" },
  puffiness_e:     { axis: "aging" },
  dryness_e:       { axis: "hyd" },

  // ── Nose ────────────────────────────────────────────────────────────────────
  pores_n:         { axis: "texture" },   // pores → texture
  blackheads_n:    { axis: "texture" },   // pores → texture
  oily_n:          { axis: "seb" },
  redness_n:       { axis: "sen" },

  // ── Cheeks ──────────────────────────────────────────────────────────────────
  redness_c:       { axis: "sen" },
  acne_c:          { axis: "texture" },
  dryness_c:       { axis: "hyd" },
  pigment_c:       { axis: "pigment" },
  pores_c:         { axis: "texture" },   // pores → texture

  // ── Mouth ───────────────────────────────────────────────────────────────────
  dryness_m:       { axis: "hyd" },
  nasolabial:      { axis: "aging" },
  pigment_m:       { axis: "pigment" },
  perioral_m:      { axis: "sen" },

  // ── Jawline ─────────────────────────────────────────────────────────────────
  hormonal_j:      { axis: "acne", flag: "HORMONAL_ACNE" },  // hormonal → acne + flag
  cystic_j:        { axis: "acne" },
  texture_j:       { axis: "texture" },
  sagging_j:       { axis: "aging" },

  // ── Neck ────────────────────────────────────────────────────────────────────
  neck_lines:      { axis: "aging" },
  sagging:         { axis: "aging" },
  neck_red:        { axis: "sen" },
  neck_dry:        { axis: "hyd" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Zone-specific concern weights  (default = 1.0; only non-1.0 entries listed)
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_WEIGHTS: Partial<Record<ZoneId, Partial<Record<string, number>>>> = {
  /** Jawline hormonal concern is THE decisive androgen-receptor marker */
  jawline: { hormonal_j: 1.5 },
  /** Nose sebum reflects the primary sebaceous zone */
  nose:    { oily_n: 1.2 },
  /** Eye-area aging is an early signal due to 0.5 mm skin thickness */
  eyes:    { fine_lines_e: 1.3, puffiness_e: 1.3 },
  /** Neck is a supplementary / secondary indicator */
  neck:    { neck_lines: 0.8, sagging: 0.8, neck_red: 0.8, neck_dry: 0.8 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ZONES: ZoneId[] = ["forehead", "eyes", "nose", "cheeks", "mouth", "jawline", "neck"];

const LAYER1_MAX = 45;   // max raw pts from zone concern spread
const LAYER2_MAX = 35;   // max raw pts from deep-dive questions

// Sigmoid calibrated for chip-only range 20-55
// Derivation: solve sigmoid(45/7) = 20 and sigmoid(45) = 55 → k≈0.041, mid≈40
const SIG_K   = 0.041;
const SIG_MID = 40;

const SCORE_FLOOR = 2;   // absolute minimum (no concerns present)
const SCORE_CEIL  = 98;  // hard ceiling

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 100 / (1 + Math.exp(-SIG_K * (x - SIG_MID)));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function zoneWeight(zone: ZoneId, concernId: string): number {
  return ZONE_WEIGHTS[zone]?.[concernId] ?? 1.0;
}

/**
 * Normalise a single question answer to 0-1 severity.
 *
 * single / image : option.score / 3  (semantic 0-3 severity field)
 * multi          : selectedCount / totalOptions  (spread measure)
 * slider         : (value - min) / (max - min)
 */
function questionSeverity(
  q: { type: string; options?: { id: string; score: number }[]; slider?: { min: number; max: number } },
  answer: QuestionAnswer,
): number {
  if (answer === null || answer === undefined) return 0;

  if (q.type === "single" || q.type === "image") {
    if (typeof answer !== "string" || !q.options?.length) return 0;
    const opt = q.options.find(o => o.id === answer);
    if (!opt) return 0;
    const maxScore = Math.max(...q.options.map(o => o.score));
    return maxScore > 0 ? opt.score / maxScore : 0;
  }

  if (q.type === "multi") {
    if (!Array.isArray(answer) || !q.options?.length) return 0;
    return answer.length / q.options.length;
  }

  if (q.type === "slider") {
    if (typeof answer !== "number" || !q.slider) return 0;
    const { min, max } = q.slider;
    return max === min ? 0 : clamp((answer - min) / (max - min), 0, 1);
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 3 — Foundation modifier builder
// ─────────────────────────────────────────────────────────────────────────────

function buildFoundationMods(
  f: ScoringInput["foundation"],
): Record<AxisKey, Array<{ factor: string; multiplier: number }>> {
  const mods = Object.fromEntries(AXIS_KEYS.map(a => [a, []])) as
    Record<AxisKey, Array<{ factor: string; multiplier: number }>>;

  const { sleep, water, stress, climate } = f;
  const c = (climate ?? "").toLowerCase();

  // ── Stress ──────────────────────────────────────────────────────────────────
  if (stress === 2) {
    mods.sen.push(  { factor: "stress_high", multiplier: 1.15 });
    mods.acne.push( { factor: "stress_high", multiplier: 1.10 });
    mods.seb.push(  { factor: "stress_high", multiplier: 1.10 });
    mods.ox.push(   { factor: "stress_high", multiplier: 1.10 });
  } else if (stress === 1) {
    mods.sen.push(  { factor: "stress_moderate", multiplier: 1.05 });
    mods.acne.push( { factor: "stress_moderate", multiplier: 1.05 });
  }

  // ── Sleep ────────────────────────────────────────────────────────────────────
  if (sleep === 0) {
    mods.bar.push(  { factor: "sleep_poor", multiplier: 1.12 });
    mods.hyd.push(  { factor: "sleep_poor", multiplier: 1.10 });
    mods.aging.push({ factor: "sleep_poor", multiplier: 1.08 });
  } else if (sleep === 1) {
    mods.bar.push(  { factor: "sleep_low",  multiplier: 1.05 });
    mods.hyd.push(  { factor: "sleep_low",  multiplier: 1.05 });
  }

  // ── Water ────────────────────────────────────────────────────────────────────
  if (water === 0) {
    mods.hyd.push(  { factor: "water_low", multiplier: 1.15 });
    mods.bar.push(  { factor: "water_low", multiplier: 1.08 });
  }

  // ── Climate ──────────────────────────────────────────────────────────────────
  if (c.includes("humid")) {
    mods.seb.push(  { factor: "climate_humid", multiplier: 1.10 });
    mods.hyd.push(  { factor: "climate_humid", multiplier: 0.92 });
  }
  if (c.includes("dry")) {
    mods.hyd.push(  { factor: "climate_dry", multiplier: 1.12 });
    mods.bar.push(  { factor: "climate_dry", multiplier: 1.08 });
  }
  if (c.includes("pollut")) {
    mods.ox.push(   { factor: "climate_polluted", multiplier: 1.15 });
    mods.bar.push(  { factor: "climate_polluted", multiplier: 1.05 });
  }
  if (c.includes("tropical")) {
    mods.seb.push(  { factor: "climate_tropical",    multiplier: 1.12 });
    mods.pigment.push({ factor: "climate_tropical",  multiplier: 1.08 });
  }

  // ── Age modifiers (Phase 3.5B) ───────────────────────────────────────────────
  const age = f.age_bracket ?? -1; // -1 = not answered

  if (age >= 3) { // 40+
    mods.aging.push({ factor: "age_40plus", multiplier: 1.15 });
    mods.hyd.push(  { factor: "age_40plus_dryness", multiplier: 1.10 });
  }
  if (age >= 4) { // 50+
    mods.aging.push({ factor: "age_50plus", multiplier: 1.20 });
    mods.bar.push(  { factor: "age_50plus_barrier", multiplier: 1.10 });
    mods.hyd.push(  { factor: "age_50plus_dryness", multiplier: 1.15 });
  }
  if (age >= 5) { // 60+
    mods.aging.push({ factor: "age_60plus", multiplier: 1.25 });
    mods.hyd.push(  { factor: "age_60plus_dryness", multiplier: 1.20 });
    mods.bar.push(  { factor: "age_60plus_barrier", multiplier: 1.15 });
    mods.seb.push(  { factor: "age_60plus_seb_decrease", multiplier: 0.85 });
  }
  if (age >= 0 && age <= 1) { // under 29
    mods.seb.push(  { factor: "age_young_seb",  multiplier: 1.10 });
    mods.acne.push( { factor: "age_young_acne", multiplier: 1.10 });
  }

  // ── Gender modifiers (Phase 3.5B) ────────────────────────────────────────────
  const gender = f.gender ?? -1; // -1 = not answered

  if (gender === 1) { // male — higher sebum production
    mods.seb.push({ factor: "male_seb", multiplier: 1.12 });
  }

  // ── Seasonal modifiers (Phase 3.5C) ──────────────────────────────────────────
  const season = f.seasonal_change ?? -1;
  const currentMonth = new Date().getMonth(); // 0-11
  const isWinter = currentMonth >= 10 || currentMonth <= 2; // Nov-Feb
  const isSummer = currentMonth >= 5 && currentMonth <= 8;  // Jun-Sep

  if (season === 1 || season === 2) { // drier in winter
    if (isWinter) {
      mods.hyd.push({ factor: "seasonal_winter_dry",     multiplier: 1.12 });
      mods.bar.push({ factor: "seasonal_winter_barrier", multiplier: 1.08 });
    }
  }
  if (season === 1 || season === 3) { // oilier in summer
    if (isSummer) {
      mods.seb.push( { factor: "seasonal_summer_oily", multiplier: 1.10 });
      mods.acne.push({ factor: "seasonal_summer_acne", multiplier: 1.05 });
    }
  }

  return mods;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function computeScores(input: ScoringInput): ScoringOutput {
  const { zoneData, axisAnswers, foundation, implicitFlags } = input;
  const activeFlags: string[] = [];

  // ── Provenance accumulators ────────────────────────────────────────────────
  type ProvEntry = ScoreProvenance["breakdown"];
  const prov: Record<AxisKey, ProvEntry> = Object.fromEntries(
    AXIS_KEYS.map(a => [a, {
      zoneConcerns: [], deepDiveQuestions: [], foundationModifiers: [], crossAxisBonus: null,
    }])
  ) as Record<AxisKey, ProvEntry>;

  const raw: Record<AxisKey, number> = Object.fromEntries(
    AXIS_KEYS.map(a => [a, 0])
  ) as Record<AxisKey, number>;

  // Track which axes received any zone concern signal
  const hasAnyConcern = new Set<AxisKey>();

  // ───────────────────────────────────────────────────────────────────────────
  // Layer 1 — Zone Concern Spread
  // Each zone contributes at most once per axis (using the max weight among
  // all concerns in that zone that map to that axis).
  // score_per_zone = (maxWeight / 7) × 45
  // ───────────────────────────────────────────────────────────────────────────
  for (const zoneId of ZONES) {
    const concerns = (zoneData[zoneId] ?? []) as string[];

    // Group concerns by target axis
    const byAxis: Partial<Record<AxisKey, string[]>> = {};
    for (const cId of concerns) {
      const entry = CONCERN_AXIS_MAP[cId];
      if (!entry) continue;
      const { axis, flag } = entry;
      if (flag && !activeFlags.includes(flag)) activeFlags.push(flag);
      (byAxis[axis] ??= []).push(cId);
    }

    for (const [axisStr, axisConcerns] of Object.entries(byAxis)) {
      const axis = axisStr as AxisKey;
      hasAnyConcern.add(axis);

      // Zone weight = max weight among all concerns in this zone for this axis
      const maxW  = Math.max(...(axisConcerns as string[]).map(id => zoneWeight(zoneId, id)));
      const zoneContrib = (maxW / ZONES.length) * LAYER1_MAX;
      raw[axis] += zoneContrib;

      // Attribute contribution evenly across the concerns for provenance display
      const perConcern = zoneContrib / (axisConcerns as string[]).length;
      for (const cId of axisConcerns as string[]) {
        prov[axis].zoneConcerns.push({ zone: zoneId, concernId: cId, contribution: perConcern });
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Derived baselines for axes with no direct concern chips
  //
  // ox  — reflects environmental + stress load regardless of zone selections
  // bar — proxy: barrier stress is co-present with hyd + sen concerns
  // ───────────────────────────────────────────────────────────────────────────

  // ox baseline: stress (0-28) + climate bonus (4-20), capped at 45
  const stressOxBase  = ([8, 18, 28] as number[])[foundation.stress] ?? 8;
  const c = (foundation.climate ?? "").toLowerCase();
  const climateOxBonus = c.includes("pollut") ? 20 : c.includes("tropical") ? 8 : 4;
  const oxBaseline = Math.min(stressOxBase + climateOxBonus, 45);
  raw.ox += oxBaseline;
  prov.ox.zoneConcerns.push({ zone: "forehead", concernId: "__ox_baseline__", contribution: oxBaseline });

  // bar baseline: 45% of hyd layer-1 contribution + 30% of sen contribution, max 25
  const barBaseline = Math.min(raw.hyd * 0.45 + raw.sen * 0.30, 25);
  raw.bar += barBaseline;
  prov.bar.zoneConcerns.push({ zone: "forehead", concernId: "__bar_baseline__", contribution: barBaseline });

  // ───────────────────────────────────────────────────────────────────────────
  // Layer 2 — Deep-dive Question Severity
  //
  // Each question's axisHints map determines which axes it contributes to.
  // Per axis: layer2Score = (Σ severity_i × reqWeight_i × hintWeight_i) /
  //                         (Σ          1 × reqWeight_i × hintWeight_i)  × 35
  //
  // If NO questions are answered for an axis → 0 contribution.
  // ───────────────────────────────────────────────────────────────────────────

  // Accumulate: { [axis]: { answered, maxPossible } }
  const l2: Record<AxisKey, { answered: number; maxPossible: number }> = Object.fromEntries(
    AXIS_KEYS.map(a => [a, { answered: 0, maxPossible: 0 }])
  ) as Record<AxisKey, { answered: number; maxPossible: number }>;

  for (const axisDef of AXIS_DEFINITIONS) {
    for (const q of axisDef.questions) {
      const qWeight = q.required ? 3.0 : 2.0;

      for (const [axisKey, hintW] of Object.entries(q.axisHints)) {
        if (!AXIS_KEYS.includes(axisKey as AxisKey)) continue;
        const axis = axisKey as AxisKey;
        const effectiveWeight = qWeight * (hintW ?? 0);
        l2[axis].maxPossible += effectiveWeight;

        const answer = axisAnswers[q.id];
        if (answer === null || answer === undefined) continue;

        const sev = questionSeverity(q, answer);
        const contribution = sev * effectiveWeight;
        l2[axis].answered += contribution;

        // Provenance: record normalised contribution towards the 35-pt ceiling
        prov[axis].deepDiveQuestions.push({
          questionId: q.id,
          contribution: l2[axis].maxPossible > 0
            ? (contribution / l2[axis].maxPossible) * LAYER2_MAX
            : 0,
        });
      }
    }
  }

  for (const axis of AXIS_KEYS) {
    if (l2[axis].maxPossible > 0 && l2[axis].answered > 0) {
      const layer2Score = (l2[axis].answered / l2[axis].maxPossible) * LAYER2_MAX;
      raw[axis] += layer2Score;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Layer 3 — Foundation Modifiers  (multiplicative)
  // ───────────────────────────────────────────────────────────────────────────

  const fMods = buildFoundationMods(foundation);

  for (const axis of AXIS_KEYS) {
    for (const mod of fMods[axis]) {
      raw[axis] *= mod.multiplier;
      prov[axis].foundationModifiers.push(mod);
    }
  }

  // Atopy implicit flag: amplifies sensitivity + barrier
  if (implicitFlags.atopyFlag) {
    raw.sen = Math.min(raw.sen * 1.20, 95);
    raw.bar = Math.min(raw.bar * 1.20, 95);
    if (!activeFlags.includes("ATOPY")) activeFlags.push("ATOPY");
  }

  // Male gender flag — used by UI to adjust labels and question routing (Phase 3.5E)
  if ((foundation.gender ?? -1) === 1 && !activeFlags.includes("MALE")) {
    activeFlags.push("MALE");
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Layer 4 — Cross-Axis Interaction Bonus
  // Applied on pre-sigmoid raw scores (multiplicative, one-time per pattern).
  // ───────────────────────────────────────────────────────────────────────────

  // 1. Dehydrated-Oily: simultaneous high sebum + high dehydration
  if (raw.seb >= 40 && raw.hyd >= 40) {
    raw.seb *= 1.12; raw.hyd *= 1.12;
    prov.seb.crossAxisBonus = { pattern: "Dehydrated-Oily", bonusPercent: 12 };
    prov.hyd.crossAxisBonus = { pattern: "Dehydrated-Oily", bonusPercent: 12 };
  }

  // 2. Barrier Stress: compromised barrier + reactive sensitivity
  if (raw.bar >= 40 && raw.sen >= 40) {
    raw.bar *= 1.15; raw.sen *= 1.15;
    prov.bar.crossAxisBonus = { pattern: "Barrier Stress", bonusPercent: 15 };
    prov.sen.crossAxisBonus = { pattern: "Barrier Stress", bonusPercent: 15 };
  }

  // 3. Hormonal Acne Cascade: jawline hormonal flag + elevated acne
  if (activeFlags.includes("HORMONAL_ACNE") && raw.acne >= 35) {
    raw.acne *= 1.20;
    prov.acne.crossAxisBonus = { pattern: "Hormonal Acne Cascade", bonusPercent: 20 };
  }

  // 4. Photo-Aging: pigmentation + aging co-elevation
  if (raw.pigment >= 40 && raw.aging >= 40) {
    raw.pigment *= 1.10; raw.aging *= 1.10;
    prov.pigment.crossAxisBonus = { pattern: "Photo-Aging", bonusPercent: 10 };
    prov.aging.crossAxisBonus   = { pattern: "Photo-Aging", bonusPercent: 10 };
  }

  // 5. Congestion Complex: excess sebum drives texture deterioration
  if (raw.seb >= 40 && raw.texture >= 40) {
    raw.texture *= 1.15;
    prov.texture.crossAxisBonus = { pattern: "Congestion Complex", bonusPercent: 15 };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Layer 5 — S-Curve Normalisation
  //
  // sigmoid(x) = 100 / (1 + e^(-k × (x − mid)))   k=0.041, mid=40
  //
  // Axes with zero concern chips AND no deep-dive answers → hard floor 3
  // All others → sigmoid then clamp [2, 98]
  // ───────────────────────────────────────────────────────────────────────────

  const scores: Record<AxisKey, number> = {} as Record<AxisKey, number>;

  for (const axis of AXIS_KEYS) {
    if (axis === "makeup_stability") continue; // derived after other scores exist

    const noSignal =
      !hasAnyConcern.has(axis) &&
      l2[axis].answered === 0 &&
      axis !== "ox" &&  // ox always has derived baseline
      axis !== "bar";   // bar always has derived baseline

    if (noSignal) {
      scores[axis] = SCORE_FLOOR + 1; // floor = 3
    } else {
      scores[axis] = clamp(Math.round(sigmoid(raw[axis])), SCORE_FLOOR, SCORE_CEIL);
    }
  }

  // makeup_stability: inverse function of sebum and hydration deficiency
  // Range 3-8 (low baseline — no direct concern chips collected)
  const makeupRaw =
    3 +
    ((100 - scores.seb) / 100) * 3 +  // low seb → higher stability
    (scores.hyd / 100)         * 2;    // high hyd → higher stability
  scores.makeup_stability = clamp(Math.round(makeupRaw), 3, 8);

  // ───────────────────────────────────────────────────────────────────────────
  // Assemble output
  // ───────────────────────────────────────────────────────────────────────────

  const provenance: ScoreProvenance[] = AXIS_KEYS.map(axis => ({
    axis,
    totalScore: scores[axis],
    breakdown:  prov[axis],
  }));

  return { scores, provenance, activeFlags };
}
