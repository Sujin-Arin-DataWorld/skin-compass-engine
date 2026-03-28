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
 * Sigmoid recalibrated (Phase 4.5) for severity-weighted chips:
 *   • 1 chip severity=3 (raw ≈ 6.4)   → ~20  (k=0.055, mid=32)
 *   • Mixed severity 4 zones (raw ≈ 25) → ~40 (moderate lower bound)
 *   • Mixed severity 4 zones (raw ≈ 32) → ~50 (moderate mid)
 *   • Severe 5 zones + L2 (raw ≈ 50)   → ~73 (severe lower bound)
 *   • 7 zones sev=3 + full L2 (raw ≈ 80) → ~94 (ceiling)
 *
 * Previous values: k=0.041, mid=40 — calibrated for binary chips (no severity).
 * Reduced mid from 40 → 32 to compensate for lower average raw scores due
 * to severity weighting (sev=1 gives 0.33× contribution, not 1.0×).
 */

import { AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { QuestionAnswer } from "@/engine/questionRoutingV5";
import { AXIS_KEYS } from "@/engine/types";
import type { AxisKey } from "@/engine/types";
import { inferFromFaceMap } from "@/engine/faceMapInference";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ZoneId =
  | "forehead" | "eyes" | "nose" | "cheeks"
  | "mouth"   | "jawline" | "neck";

export interface ScoringInput {
  /** Zone concern chip selections — with severity (1=mild, 2=moderate, 3=severe) */
  zoneData: Record<string, Record<string, 1 | 2 | 3>>;
  /** Tail question answers */
  axisAnswers: Record<string, QuestionAnswer>;
  /** Phase 01 lifestyle foundation */
  foundation: {
    sleep:              number;         // 0=<5h  1=5-6h  2=7h  3=8h+
    water:              number;         // 0=1-2 glasses  1=3-5  2=6+
    stress:             number;         // 0=Low  1=Moderate  2=High
    climate:            string | null;
    age_bracket:        number;         // 0=<20  1=20s  2=30s  3=40s  4=50s  5=60+
    gender:             number;         // 0=female  1=male  2=other
    outdoor:            number;         // 0=indoor  1=1-2hrs  2=3+hrs
    altitude:           number;         // 0=never  1=occasional  2=regular
    seasonal_change?:   number;         // 0=stable  1=oily-summer-dry-winter  2=dry-always  3=oily-always
    texture_pref?:      number;         // 0=gel  1=lotion  2=cream  3=seasonal
    menopause_status?:  string;         // meno_pre, meno_peri, meno_post_early, meno_post_late, meno_unsure
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
    crossAxisBonuses:  { pattern: string; bonusPercent: number }[];
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

interface ConcernEntry {
  axis: AxisKey;
  flag?: string;
  secondaryAxis?: AxisKey;
  secondaryWeight?: number;  // fraction of primary contribution (0-1)
}

/**
 * Canonical mapping of every Phase 02 concern chip ID to its primary axis.
 * Rules applied:
 *   • "pores" concern chips → texture axis
 *   • "hormonal" concern chips → acne axis + HORMONAL_ACNE flag
 */
const CONCERN_AXIS_MAP: Record<string, ConcernEntry> = {
  // ── Forehead ────────────────────────────────────────────────────────────────
  oily_f:          { axis: "seb" },
  blackheads_f:    { axis: "texture", secondaryAxis: "seb", secondaryWeight: 0.25 },
  whiteheads_f:    { axis: "texture", secondaryAxis: "acne", secondaryWeight: 0.30 },
  lines_f:         { axis: "aging" },
  breakouts_f:     { axis: "texture", secondaryAxis: "acne", secondaryWeight: 0.45 },

  // ── Eyes ────────────────────────────────────────────────────────────────────
  fine_lines_e:    { axis: "aging" },
  dark_circles_e:  { axis: "pigment" },
  puffiness_e:     { axis: "aging" },
  dryness_e:       { axis: "hyd" },

  // ── Nose ────────────────────────────────────────────────────────────────────
  pores_n:         { axis: "texture" },
  blackheads_n:    { axis: "texture", secondaryAxis: "seb", secondaryWeight: 0.25 },
  oily_n:          { axis: "seb" },
  redness_n:       { axis: "sen" },

  // ── Cheeks ──────────────────────────────────────────────────────────────────
  redness_c:       { axis: "sen" },
  acne_c:          { axis: "acne", secondaryAxis: "texture", secondaryWeight: 0.35 },
  dryness_c:       { axis: "hyd" },
  pigment_c:       { axis: "pigment" },
  pores_c:         { axis: "texture" },

  // ── Mouth ───────────────────────────────────────────────────────────────────
  dryness_m:       { axis: "hyd" },
  nasolabial:      { axis: "aging" },
  pigment_m:       { axis: "pigment" },
  perioral_m:      { axis: "sen" },

  // ── Jawline ─────────────────────────────────────────────────────────────────
  hormonal_j:      { axis: "acne", flag: "HORMONAL_ACNE" },
  cystic_j:        { axis: "acne" },
  texture_j:       { axis: "texture", secondaryAxis: "acne", secondaryWeight: 0.20 },
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

// Sigmoid recalibrated (Phase 4.5) for severity-weighted chips.
// Previous: k=0.041, mid=40. New: k=0.055, mid=32.
// Derivation: sigmoid(6.4)≈20 and sigmoid(25)≈40 with k=0.055, mid=32.
const SIG_K   = 0.055;
const SIG_MID = 32;

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
    // For multi-select with negative axisHints, only count options with score > 0
    // ("None" selections should not count as meaningful severity)
    const positiveOpts = q.options.filter(o => o.score > 0);
    if (positiveOpts.length === 0) return answer.length / q.options.length;
    const meaningfulSelections = answer.filter(id =>
      (q.options!.find(o => o.id === id)?.score ?? 0) > 0
    );
    return positiveOpts.length > 0
      ? meaningfulSelections.length / positiveOpts.length
      : 0;
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

  // ── Age modifiers — EXCLUSIVE BRACKET (take highest only, no cumulative stacking) ──
  const age = f.age_bracket ?? -1; // -1 = not answered
  const AGE_AGING_MOD: Record<number, number> = { 3: 1.15, 4: 1.25, 5: 1.35 };
  const AGE_HYD_MOD:   Record<number, number> = { 3: 1.10, 4: 1.18, 5: 1.25 };
  const AGE_BAR_MOD:   Record<number, number> = { 4: 1.10, 5: 1.18 };

  if (age >= 3) {
    mods.aging.push({ factor: `age_${age}0s`, multiplier: AGE_AGING_MOD[age] ?? 1.0 });
    mods.hyd.push(  { factor: `age_${age}0s_dryness`, multiplier: AGE_HYD_MOD[age] ?? 1.0 });
    if (age >= 4) {
      mods.bar.push({ factor: `age_${age}0s_barrier`, multiplier: AGE_BAR_MOD[age] ?? 1.0 });
    }
  }
  if (age >= 5) {
    mods.seb.push({ factor: "age_60plus_seb_decrease", multiplier: 0.85 });
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

  // ── Outdoor exposure (Exposome) ───────────────────────────────────────────────
  const outdoor = f.outdoor ?? 0;
  if (outdoor >= 2) { // 3+ hours daily
    mods.ox.push(      { factor: "outdoor_high_uv",      multiplier: 1.20 });
    mods.pigment.push( { factor: "outdoor_high_pigment",  multiplier: 1.08 });
  }

  // ── Altitude exposure — single modifier, no stacking ──────────────────────────
  const altitude = f.altitude ?? 0;
  if (altitude >= 2) {
    mods.ox.push({ factor: "altitude_regular", multiplier: 1.30 });
  } else if (altitude >= 1) {
    mods.ox.push({ factor: "altitude_occasional", multiplier: 1.18 });
  }

  // ── Menopause modifiers (clinical: 30% collagen loss in first 5 years) ────────
  const meno = f.menopause_status;
  if (meno === "meno_peri") {
    mods.sen.push(  { factor: "perimenopause_sensitivity",      multiplier: 1.12 });
    mods.seb.push(  { factor: "perimenopause_seb_flux",         multiplier: 1.08 });
    mods.aging.push({ factor: "perimenopause_collagen_start",   multiplier: 1.10 });
  }
  if (meno === "meno_post_early") {
    // Brincat et al.: 30% collagen loss in first 5 post-menopausal years
    mods.aging.push({ factor: "postmeno_early_collagen_crisis", multiplier: 1.35 });
    mods.hyd.push(  { factor: "postmeno_early_ceramide_loss",   multiplier: 1.25 });
    mods.bar.push(  { factor: "postmeno_early_barrier_collapse",multiplier: 1.20 });
    mods.seb.push(  { factor: "postmeno_early_seb_drop",        multiplier: 0.80 });
  }
  if (meno === "meno_post_late") {
    // Plateau phase — loss rate decelerates
    mods.aging.push({ factor: "postmeno_late_chronic",      multiplier: 1.20 });
    mods.hyd.push(  { factor: "postmeno_late_chronic_dry",  multiplier: 1.18 });
    mods.bar.push(  { factor: "postmeno_late_thin_skin",    multiplier: 1.12 });
    mods.seb.push(  { factor: "postmeno_late_low_seb",      multiplier: 0.78 });
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
      zoneConcerns: [], deepDiveQuestions: [], foundationModifiers: [], crossAxisBonuses: [],
    }])
  ) as Record<AxisKey, ProvEntry>;

  const raw: Record<AxisKey, number> = Object.fromEntries(
    AXIS_KEYS.map(a => [a, 0])
  ) as Record<AxisKey, number>;

  // Track which axes received any zone concern signal
  const hasAnyConcern = new Set<AxisKey>();

  // ───────────────────────────────────────────────────────────────────────────
  // Layer 1 — Zone Concern Spread (severity-weighted)
  // Each zone contributes at most once per axis (using the max weight among
  // all concerns in that zone that map to that axis), multiplied by the
  // maximum severity among those concerns.
  // score_per_zone = (maxWeight / 7) × 45 × sevMult
  // sevMult: severity 1 → 0.33, severity 2 → 0.66, severity 3 → 1.0
  // ───────────────────────────────────────────────────────────────────────────
  for (const zoneId of ZONES) {
    const concerns = zoneData[zoneId];
    if (!concerns || typeof concerns !== "object" || Array.isArray(concerns)) continue;

    // Group concerns by target axis, preserving severity
    const byAxis: Partial<Record<AxisKey, { id: string; severity: number }[]>> = {};
    for (const [cId, severity] of Object.entries(concerns)) {
      const entry = CONCERN_AXIS_MAP[cId];
      if (!entry) continue;
      const { axis, flag } = entry;
      if (flag && !activeFlags.includes(flag)) activeFlags.push(flag);
      (byAxis[axis] ??= []).push({ id: cId, severity: severity as number });
    }

    for (const [axisStr, axisConcerns] of Object.entries(byAxis)) {
      const axis = axisStr as AxisKey;
      hasAnyConcern.add(axis);

      // Severity multiplier: max severity among concerns in this zone for this axis
      const maxSev = Math.max(...axisConcerns.map(c => c.severity));
      const sevMult = maxSev / 3;

      const maxW = Math.max(...axisConcerns.map(c => zoneWeight(zoneId as ZoneId, c.id)));
      const zoneContrib = (maxW / ZONES.length) * LAYER1_MAX * sevMult;
      raw[axis] += zoneContrib;

      // Attribute contribution evenly across the concerns for provenance display
      const perConcern = zoneContrib / axisConcerns.length;
      for (const c of axisConcerns) {
        prov[axis].zoneConcerns.push({ zone: zoneId as ZoneId, concernId: c.id, contribution: perConcern });
      }

      // §1: Secondary axis contribution (dual-axis split)
      for (const c of axisConcerns) {
        const cEntry = CONCERN_AXIS_MAP[c.id];
        if (cEntry?.secondaryAxis) {
          const secContrib = zoneContrib * (cEntry.secondaryWeight ?? 0.3);
          raw[cEntry.secondaryAxis] += secContrib;
          hasAnyConcern.add(cEntry.secondaryAxis);
          prov[cEntry.secondaryAxis].zoneConcerns.push({
            zone: zoneId as ZoneId, concernId: c.id, contribution: secContrib,
          });
        }
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Derived baselines for axes with no direct concern chips
  //
  // ox  — reflects environmental + stress load regardless of zone selections
  // bar — proxy: barrier stress is co-present with hyd + sen concerns
  // ───────────────────────────────────────────────────────────────────────────

  // §4: ox baseline — risk-capped at 18 (sigmoid ≈ 31, "watch" grade)
  const stressOxBase  = ([4, 12, 20] as number[])[foundation.stress] ?? 4;
  const c = (foundation.climate ?? "").toLowerCase();
  const climateOxBonus = c.includes("pollut") ? 10 : c.includes("tropical") ? 4 : 2;
  const OX_RISK_CAP = 18;
  const oxBaseline = Math.min(stressOxBase + climateOxBonus, OX_RISK_CAP);
  raw.ox += oxBaseline;
  prov.ox.zoneConcerns.push({ zone: "forehead", concernId: "__ox_baseline__", contribution: oxBaseline });

  // Flatten zoneData to concernSeverity map for inferFromFaceMap (used by barrier patterns + L2 compensation)
  const flatSeverity: Record<string, 1 | 2 | 3> = {};
  for (const zoneConcerns of Object.values(zoneData)) {
    for (const [cId, sev] of Object.entries(zoneConcerns)) {
      flatSeverity[cId] = sev as 1 | 2 | 3;
    }
  }
  const inference = Object.keys(flatSeverity).length > 0
    ? inferFromFaceMap(flatSeverity)
    : null;

  // §8: Barrier pattern detection — direct chip-derived bar contribution
  const barrierPatterns: { zone: string; concerns: string[]; contribution: number }[] = [];
  const dryRedZones = [
    { dry: "dryness_c", red: "redness_c", zone: "cheeks", weight: 1.0 },
    { dry: "dryness_e", red: "fine_lines_e", zone: "eyes", weight: 0.6 },
    { dry: "neck_dry",  red: "neck_red", zone: "neck", weight: 0.7 },
  ];
  for (const { dry, red, zone, weight } of dryRedZones) {
    const drySev = flatSeverity[dry] ?? 0;
    const redSev = flatSeverity[red] ?? 0;
    if (drySev > 0 && redSev > 0) {
      const avgSev = (drySev + redSev) / 2;
      const contrib = (avgSev / 3) * (LAYER1_MAX / ZONES.length) * weight;
      raw.bar += contrib;
      hasAnyConcern.add("bar");
      barrierPatterns.push({ zone, concerns: [dry, red], contribution: contrib });
    }
  }
  // Perioral sensitivity → oral barrier stress
  const perioralSev = flatSeverity["perioral_m"] ?? 0;
  if (perioralSev >= 2) {
    const contrib = (perioralSev / 3) * (LAYER1_MAX / ZONES.length) * 0.8;
    raw.bar += contrib;
    hasAnyConcern.add("bar");
    barrierPatterns.push({ zone: "mouth", concerns: ["perioral_m"], contribution: contrib });
  }
  for (const bp of barrierPatterns) {
    prov.bar.zoneConcerns.push({
      zone: bp.zone as ZoneId,
      concernId: `__barrier_pattern_${bp.concerns.join("+")}__`,
      contribution: bp.contribution,
    });
  }

  // §8: bar baseline — reduced coefficients (direct chip signal now supplements)
  const barBaseline = Math.min(raw.hyd * 0.45 + raw.sen * 0.35, 30);
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
  // Layer 2 Compensation — Resolved axis implied contribution
  //
  // If an axis was fully characterised by high-severity chips (resolvedAxes)
  // but received no tail-question answers, give it an implied L2 contribution
  // so it doesn't under-score compared to the old all-questions model.
  // ───────────────────────────────────────────────────────────────────────────

  if (inference) {
    for (const axis of AXIS_KEYS) {
      if (inference.resolvedAxes.includes(axis) && l2[axis].answered === 0) {
        // §5: Implied L2 = 40% of theoretical max, capped at 35%
        const chipContribution = raw[axis];
        const impliedL2 = Math.min(
          (chipContribution / LAYER1_MAX) * LAYER2_MAX * 0.40,
          LAYER2_MAX * 0.35
        );
        raw[axis] += impliedL2;
        prov[axis].deepDiveQuestions.push({
          questionId: "__chip_implied__",
          contribution: impliedL2,
        });
      }
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
    // §3: Post-modifier raw score cap — prevents modifier chains from exceeding 80
    const L3_RAW_CAP = LAYER1_MAX + LAYER2_MAX; // = 80
    raw[axis] = Math.min(raw[axis], L3_RAW_CAP);
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

  // §10: Cross-axis patterns — thresholds recalibrated for new L3/L4 model

  // 1. Dehydrated-Oily: simultaneous high sebum + high dehydration
  if (raw.seb >= 35 && raw.hyd >= 35) {
    raw.seb *= 1.12; raw.hyd *= 1.12;
    prov.seb.crossAxisBonuses.push({ pattern: "Dehydrated-Oily", bonusPercent: 12 });
    prov.hyd.crossAxisBonuses.push({ pattern: "Dehydrated-Oily", bonusPercent: 12 });
  }

  // 2. Barrier Stress: compromised barrier + reactive sensitivity
  if (raw.bar >= 30 && raw.sen >= 18) {
    raw.bar *= 1.15; raw.sen *= 1.15;
    prov.bar.crossAxisBonuses.push({ pattern: "Barrier Stress", bonusPercent: 15 });
    prov.sen.crossAxisBonuses.push({ pattern: "Barrier Stress", bonusPercent: 15 });
  }

  // 3. Hormonal Acne Cascade: jawline hormonal flag + elevated acne
  if (activeFlags.includes("HORMONAL_ACNE") && raw.acne >= 35) {
    raw.acne *= 1.20;
    prov.acne.crossAxisBonuses.push({ pattern: "Hormonal Acne Cascade", bonusPercent: 20 });
  }

  // 4. Photo-Aging: pigmentation + aging co-elevation
  if (raw.pigment >= 40 && raw.aging >= 40) {
    raw.pigment *= 1.10; raw.aging *= 1.10;
    prov.pigment.crossAxisBonuses.push({ pattern: "Photo-Aging", bonusPercent: 10 });
    prov.aging.crossAxisBonuses.push({ pattern: "Photo-Aging", bonusPercent: 10 });
  }

  // 5. Congestion Complex: excess sebum drives texture deterioration
  if (raw.seb >= 40 && raw.texture >= 40) {
    raw.texture *= 1.15;
    prov.texture.crossAxisBonuses.push({ pattern: "Congestion Complex", bonusPercent: 15 });
  }

  // 6. PIH Cascade — acne + pigmentation co-elevation
  if (raw.acne >= 35 && raw.pigment >= 30) {
    raw.pigment *= 1.12;
    prov.pigment.crossAxisBonuses.push({ pattern: "PIH Cascade", bonusPercent: 12 });
  }

  // 7. Stress-Sebum Loop — high stress + elevated sebum
  if (foundation.stress >= 2 && raw.seb >= 40) {
    raw.seb *= 1.10;
    raw.acne = Math.min(raw.acne * 1.08, 95);
    prov.seb.crossAxisBonuses.push({ pattern: "Stress-Sebum Loop", bonusPercent: 10 });
  }

  // 8. Dry-Aging Acceleration — dehydration + aging (lowered thresholds)
  if (raw.hyd >= 35 && raw.aging >= 30) {
    raw.aging *= 1.12;
    prov.aging.crossAxisBonuses.push({ pattern: "Dry-Aging Acceleration", bonusPercent: 12 });
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

  // §2: makeup_stability — both high seb AND high hyd reduce stability
  // Added barrier contribution (TEWL-driven product migration)
  const makeupRaw =
    3 +
    ((100 - scores.seb) / 100) * 2.5 +  // low seb → better hold
    ((100 - scores.hyd) / 100) * 1.5 +  // low dehydration → better hold
    ((100 - scores.bar) / 100) * 1.0;   // good barrier → better hold
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
