/**
 * skinVectorEngine.ts
 *
 * Calculates a 9-axis SkinVector from the typed DiagnosisState.
 * Each axis uses a WEIGHTED scoring system: clinical core questions
 * carry a 3× multiplier, clinical supporting questions 2×, and
 * lifestyle/environmental factors 1×. All final scores are clamped
 * to [0, 100] to prevent radar chart overflow.
 */

import type { AxisResponses, Lifestyle, ImplicitFlags } from "@/store/diagnosisStore";

// ─── Output type ──────────────────────────────────────────────────────────────

export interface SkinVector {
  sebum: number;       // 0 = bone dry / no oil,  100 = extremely oily
  hydration: number;   // 0 = severely dehydrated, 100 = perfectly hydrated
  pores: number;       // 0 = invisible,           100 = severely enlarged
  texture: number;     // 0 = smooth / clear,      100 = severe breakouts
  sensitivity: number; // 0 = resilient,           100 = extremely reactive
  aging: number;       // 0 = no signs,            100 = advanced aging
  pigment: number;     // 0 = even tone,           100 = severe discoloration
  barrier: number;     // 0 = intact,              100 = severely compromised
  atopy: number;       // 0 = none,                100 = severe atopic/psoriasis
}

// ─── Utility ──────────────────────────────────────────────────────────────────

const clamp = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));

// ─── Per-axis calculators ─────────────────────────────────────────────────────

/**
 * SEBUM — 0 = bone dry, 100 = extremely oily
 *
 * Clinical core (×3): how quickly skin shines after cleansing
 * Clinical (×2):      which zones get oily
 * Supporting (×1):    stress, climate amplifiers
 */
function calcSebum(ar: AxisResponses, ls: Lifestyle): number {
  let score = 28; // base: typical mixed-skin tendency

  // Clinical core (×3)
  const shine = ar.sebum?.shineTimeline;
  if (shine === "shine_1hr")        score += 33; // within 1 hr — severe
  else if (shine === "shine_midday") score += 20; // by midday — moderate
  else if (shine === "shine_afternoon") score += 9;
  else if (shine === "shine_never") score -= 15; // no shine at all → dry

  // Clinical (×2)
  const zones = ar.sebum?.oilyAreas ?? [];
  if (zones.length >= 4)            score += 18; // full face
  else if (zones.includes("zone_forehead") && zones.includes("zone_nose")) score += 11; // T-zone
  else if (zones.length >= 1)       score += 5;
  else if (zones.length === 0 && shine !== undefined) score -= 5; // answered but no zones

  // Texture proxy — oiliness + rough texture → higher sebum score
  const tex = ar.sebum?.roughTexture;
  if (tex === "tex_severe")   score += 6;
  else if (tex === "tex_moderate") score += 3;

  // Supporting (×1)
  if (ls.stressLevel === "stress_high") score += 8;
  else if (ls.stressLevel === "stress_mod") score += 4;

  // Climate: use ClimateProfile risk if available, else fall back to legacy string
  const humidRisk = ls.climateProfile?.humidityRisk
    ?? (ls.climate === "climate_humid" ? "high" : "low");
  if (humidRisk === "high") score += 5;
  else if (humidRisk === "moderate") score += 3;

  return clamp(score);
}

/**
 * HYDRATION — 0 = severely dehydrated, 100 = well hydrated
 *
 * Inverted axis: high symptoms → LOW score.
 * Clinical core (×3): skin tightness / dehydrated-oily
 * Clinical (×2):      flaking severity, worst timing
 * Supporting (×1):    water intake, sleep, climate
 */
function calcHydration(ar: AxisResponses, ls: Lifestyle): number {
  let score = 68; // base: reasonably hydrated starting point

  // Clinical core (×3) — tightness severity
  const tight = ar.hydration?.dehydratedOily;
  if (tight === "tight_constantly")   score -= 33;
  else if (tight === "tight_frequently") score -= 22;
  else if (tight === "tight_after_wash") score -= 11;
  // tight_never → no penalty (skin is hydrated)

  // Clinical (×2) — visible flaking
  const flake = ar.hydration?.flaking;
  if (flake === "flake_severe") score -= 20;
  else if (flake === "flake_mild") score -= 10;

  // Clinical (×2) — environmental worst-case
  const timing = ar.hydration?.worstTiming;
  if (timing === "dry_heated" || timing === "dry_outdoors" || timing === "dry_washing") score -= 10;

  // Supporting (×1) — water intake
  if (ls.waterIntake === "water_low")  score -= 14;
  else if (ls.waterIntake === "water_mid") score -= 7;
  else if (ls.waterIntake === "water_high") score += 5;

  // Supporting (×1) — sleep quality
  const sleep = ls.sleepHours;
  if (typeof sleep === "number") {
    if (sleep === 0)      score -= 10;
    else if (sleep === 1) score -= 5;
    else if (sleep === 2) score -= 2;
  }

  // Supporting (×1) — climate
  const dryRisk = ls.climateProfile?.drynessRisk
    ?? (ls.climate === "climate_cold_dry" ? "high" : "low");
  const coldRisk = ls.climateProfile?.coldRisk
    ?? (ls.climate === "climate_cold_dry" ? "high" : "low");
  if (dryRisk === "high" || coldRisk === "high") score -= 8;
  else if (dryRisk === "moderate" || coldRisk === "moderate") score -= 4;

  return clamp(score);
}

/**
 * PORES — 0 = invisible, 100 = severely enlarged
 *
 * Clinical core (×3): visibility slider (1–5 scale)
 * Clinical (×2):      T-zone enlargement, pore shape
 * Supporting (×1):    sebum shine as proxy for pore-clogging
 */
function calcPores(ar: AxisResponses): number {
  let score = 0;

  // Clinical core (×3) — visibility slider 1–5 maps to 0–60
  const vis = ar.pores?.visibility;
  if (typeof vis === "number") {
    score += Math.round(((vis - 1) / 4) * 60);
  }

  // Clinical (×2) — T-zone vs. cheeks
  const tzone = ar.pores?.tzoneWorse;
  if (tzone === "tzone_yes")   score += 18;
  else if (tzone === "tzone_same") score += 10;
  else if (tzone === "tzone_no")   score += 5;

  // Clinical (×2) — pore shape (teardrop/Y = aging + stretched)
  const shape = ar.pores?.shape;
  if (shape === "pore_teardrop") score += 14;
  else if (shape === "pore_round") score += 6;
  else if (shape === "pore_notsure") score += 3;

  // Supporting (×1) — oily skin clogs pores
  const shine = ar.sebum?.shineTimeline;
  if (shine === "shine_1hr")        score += 8;
  else if (shine === "shine_midday") score += 4;

  return clamp(score);
}

/**
 * TEXTURE — 0 = smooth / clear, 100 = severe breakouts
 *
 * Clinical core (×3): breakout type (cystic > pustular > comedonal)
 * Clinical (×2):      breakout frequency, post-breakout marks
 * Supporting (×1):    stress, hormonal cycle
 */
function calcTexture(ar: AxisResponses, ls: Lifestyle, flags: ImplicitFlags): number {
  let score = 0;

  // Clinical core (×3) — breakout severity tier
  const breakout = ar.texture?.breakoutType;
  if (breakout === "acne_cystic")      score += 42;
  else if (breakout === "acne_pustular") score += 28;
  else if (breakout === "acne_comedonal") score += 16;
  else if (breakout === "acne_notsure") score += 8;
  // acne_none → 0

  // Clinical (×2) — breakout frequency
  const freq = ar.texture?.frequency;
  if (freq === "acne_constantly")     score += 20;
  else if (freq === "acne_frequently") score += 14;
  else if (freq === "acne_occasionally") score += 8;
  else if (freq === "acne_rarely")    score += 2;

  // Clinical (×2) — scarring (marks left after healing)
  const scarring = ar.texture?.scarring;
  if (scarring === "mark_scar")      score += 14; // indented scars — most severe
  else if (scarring === "mark_pih")  score += 10; // dark PIH marks
  else if (scarring === "mark_pie")  score += 6;  // red PIE marks — milder
  // mark_none / mark_unsure → 0

  // Supporting (×1)
  if (ls.stressLevel === "stress_high") score += 8;
  else if (ls.stressLevel === "stress_mod") score += 4;
  if (flags.likelyHormonalCycleUser)  score += 8;

  return clamp(score);
}

/**
 * SENSITIVITY — 0 = resilient, 100 = extremely reactive
 *
 * Clinical core (×3): reaction to hard water / heating
 * Clinical (×2):      redness frequency, product tolerance
 * Supporting (×1):    shaving irritation, stress, cold/dry climate
 */
function calcSensitivity(ar: AxisResponses, ls: Lifestyle): number {
  let score = 0;

  // Clinical core (×3) — water/heating reactivity
  const reaction = ar.sensitivity?.waterReaction;
  if (reaction === "barrier_severe")    score += 42;
  else if (reaction === "barrier_moderate") score += 28;
  else if (reaction === "barrier_mild") score += 14;
  // barrier_none → 0

  // Clinical (×2) — spontaneous redness
  const redFreq = ar.sensitivity?.rednessFrequency;
  if (redFreq === "constantly")         score += 20;
  else if (redFreq === "frequently")    score += 14;
  else if (redFreq === "occasionally")  score += 8;
  else if (redFreq === "never")         score += 1;

  // Clinical (×2) — product tolerance
  const tol = ar.sensitivity?.productTolerance;
  if (tol === "tol_few")   score += 20;
  else if (tol === "tol_some") score += 12;
  // tol_fine → 0

  // Supporting (×1)
  const shave = ar.sensitivity?.shavingIrritation;
  if (shave === "shave_yes")   score += 8;
  else if (shave === "shave_mild") score += 4;

  if (ls.stressLevel === "stress_high") score += 8;
  else if (ls.stressLevel === "stress_mod") score += 4;

  // Cold/dry climate amplifies sensitivity
  const sensColdRisk = ls.climateProfile?.coldRisk
    ?? (ls.climate === "climate_cold_dry" ? "high" : "low");
  const sensDryRisk = ls.climateProfile?.drynessRisk
    ?? (ls.climate === "climate_cold_dry" ? "high" : "low");
  if (sensColdRisk === "high" || sensDryRisk === "high") score += 5;
  else if (sensColdRisk === "moderate" || sensDryRisk === "moderate") score += 2;

  return clamp(score);
}

/**
 * AGING — 0 = no signs, 100 = advanced aging
 *
 * Clinical core (×3): wrinkle depth slider (1–10)
 * Clinical (×2):      number of sagging areas
 * Supporting (×1):    sleep deprivation, chronic stress, UV proxy
 */
function calcAging(ar: AxisResponses, ls: Lifestyle): number {
  let score = 0;

  // Clinical core (×3) — wrinkle depth 1–10 → 0–45
  const depth = ar.aging?.wrinkleDepth;
  if (typeof depth === "number") {
    score += Math.round(((depth - 1) / 9) * 45);
  }

  // Clinical (×2) — sagging area count (each = +8, max 5 areas = +40)
  const sagging = ar.aging?.saggingAreas ?? [];
  score += Math.min(sagging.length * 8, 40);

  // Supporting (×1) — using actives → slight protective bonus
  const actives = ar.aging?.currentActives ?? [];
  const hasRetinol = actives.includes("active_retinol");
  const hasPeptide = actives.includes("active_peptide");
  if (hasRetinol) score -= 6;
  if (hasPeptide) score -= 3;

  // Supporting (×1) — sleep deprivation accelerates aging
  const sleep = ls.sleepHours;
  if (typeof sleep === "number") {
    if (sleep === 0)      score += 12;
    else if (sleep === 1) score += 6;
  }
  if (ls.stressLevel === "stress_high") score += 6;

  // UV proxy from pigment answers (also ages skin)
  const uv = ar.pigment?.uvExposure;
  if (uv === "uv_constantly")   score += 8;
  else if (uv === "uv_frequently") score += 4;

  return clamp(score);
}

/**
 * PIGMENT — 0 = even tone, 100 = severe discoloration
 *
 * Clinical core (×3): pigmentation type (melasma > sun > PIH > dullness)
 * Clinical (×2):      UV exposure frequency, lesion duration
 * Supporting (×1):    outdoor exercise, climate
 */
function calcPigment(ar: AxisResponses, ls: Lifestyle): number {
  let score = 0;

  // Clinical core (×3) — pigment type
  const type = ar.pigment?.type;
  if (type === "pig_melasma")     score += 42;
  else if (type === "pig_sun")    score += 28;
  else if (type === "pig_pih")    score += 20;
  else if (type === "pig_dull")   score += 10;
  else if (type === "pig_unsure") score += 5;
  // undefined / none → 0

  // Clinical (×2) — UV exposure
  const uv = ar.pigment?.uvExposure;
  if (uv === "uv_constantly")    score += 20;
  else if (uv === "uv_frequently") score += 12;
  else if (uv === "uv_occasionally") score += 5;
  // uv_rarely → 0

  // Clinical (×2) — lesion duration (chronic = harder to treat)
  const dur = ar.pigment?.duration;
  if (dur === "pig_years" || dur === "pig_since_kid") score += 14;
  else if (dur === "pig_6_12")  score += 8;
  else if (dur === "pig_recent") score += 3;

  // Supporting (×1)
  if (ls.outdoorExercise === "ex_daily") score += 8;

  // Hot/UV climate amplifies pigment risk
  const pigUvRisk  = ls.climateProfile?.uvRisk
    ?? (ls.climate === "climate_hot_dry" ? "high" : "low");
  const pigHeatRisk = ls.climateProfile?.heatRisk
    ?? (ls.climate === "climate_hot_dry" ? "high" : "low");
  if (pigUvRisk === "high" || pigHeatRisk === "high") score += 5;
  else if (pigUvRisk === "moderate" || pigHeatRisk === "moderate") score += 2;

  return clamp(score);
}

/**
 * BARRIER — 0 = intact, 100 = severely compromised
 *
 * Clinical core (×3): reactivity to water/heating (shared w/ sensitivity)
 * Clinical (×2):      product tolerance, extreme flaking/cracking
 * Supporting (×1):    sleep, stress, climate
 */
function calcBarrier(ar: AxisResponses, ls: Lifestyle): number {
  let score = 5; // small positive base (most users have some mild compromise)

  // Clinical core (×3) — water/heating reactivity = primary barrier signal
  const reaction = ar.sensitivity?.waterReaction;
  if (reaction === "barrier_severe")    score += 42;
  else if (reaction === "barrier_moderate") score += 28;
  else if (reaction === "barrier_mild") score += 14;

  // Clinical (×2) — product intolerance = compromised barrier
  const tol = ar.sensitivity?.productTolerance;
  if (tol === "tol_few")   score += 24;
  else if (tol === "tol_some") score += 14;

  // Clinical (×2) — extreme flaking / cracking (from neurodermatitis axis)
  const crack = ar.neurodermatitis?.extremeFlaking;
  if (crack === "crack_severe") score += 18;
  else if (crack === "crack_mild") score += 9;

  // Supporting (×1) — systemic stressors degrade barrier
  const sleep = ls.sleepHours;
  if (typeof sleep === "number") {
    if (sleep === 0)      score += 10;
    else if (sleep === 1) score += 5;
  }
  if (ls.stressLevel === "stress_high") score += 8;

  // Cold/dry climate degrades the barrier
  const barColdRisk = ls.climateProfile?.coldRisk
    ?? (ls.climate === "climate_cold_dry" ? "high" : "low");
  const barDryRisk  = ls.climateProfile?.drynessRisk
    ?? (ls.climate === "climate_cold_dry" ? "high" : "low");
  if (barColdRisk === "high" || barDryRisk === "high") score += 5;
  else if (barColdRisk === "moderate" || barDryRisk === "moderate") score += 2;

  return clamp(score);
}

/**
 * ATOPY — 0 = none, 100 = severe atopic dermatitis / psoriasis
 *
 * Clinical core (×3): chronic itching frequency
 * Clinical (×2):      diagnosis (atopic/psoriasis), extreme flaking
 * Supporting (×1):    atopyFlag confirmation bonus
 */
function calcAtopy(ar: AxisResponses, flags: ImplicitFlags): number {
  let score = 0;

  // Clinical core (×3) — chronic itch frequency
  const itch = ar.neurodermatitis?.chronicItching;
  if (itch === "constantly")         score += 45;
  else if (itch === "frequently")    score += 30;
  else if (itch === "occasionally")  score += 15;
  else if (itch === "never")         score += 2;

  // Clinical (×2) — confirmed diagnosis
  const dx = ar.neurodermatitis?.diagnosis;
  if (dx === "dx_atopic")    score += 30;
  else if (dx === "dx_psoriasis") score += 25;
  // dx_none → 0

  // Clinical (×2) — extreme flaking / cracking
  const crack = ar.neurodermatitis?.extremeFlaking;
  if (crack === "crack_severe") score += 15;
  else if (crack === "crack_mild") score += 7;

  // Supporting (×1) — confirmed flag (from compound signals)
  if (flags.atopyFlag) score += 8;

  return clamp(score);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * calculateSkinVector
 *
 * Pure function — no side effects. Takes typed axis responses,
 * lifestyle data, and derived implicit flags, and returns a fully
 * scored, clamped 9-axis SkinVector.
 */
export function calculateSkinVector(
  axisResponses: AxisResponses,
  lifestyle: Lifestyle,
  implicitFlags: ImplicitFlags
): SkinVector {
  return {
    sebum:       calcSebum(axisResponses, lifestyle),
    hydration:   calcHydration(axisResponses, lifestyle),
    pores:       calcPores(axisResponses),
    texture:     calcTexture(axisResponses, lifestyle, implicitFlags),
    sensitivity: calcSensitivity(axisResponses, lifestyle),
    aging:       calcAging(axisResponses, lifestyle),
    pigment:     calcPigment(axisResponses, lifestyle),
    barrier:     calcBarrier(axisResponses, lifestyle),
    atopy:       calcAtopy(axisResponses, implicitFlags),
  };
}
