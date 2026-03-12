/**
 * axisAnswerBridge.ts
 *
 * Converts V5 axis answers (AnswerMap) → UiSignalsV4
 * so the existing diagnosis engine can process them.
 */

import type { AnswerMap } from "@/engine/questionRoutingV5";
import type { UiSignalsV4 } from "@/engine/uiMappingV4";
import type { Lifestyle } from "@/store/diagnosisStore";

export function convertAxisAnswersToUiSignals(answers: AnswerMap, lifestyle?: Lifestyle): UiSignalsV4 {
  const s: UiSignalsV4 = {};

  // ── Axis 0: SPF / Cleanse (barrier & oxidation signals) ──────────────────
  const spf = answers["AX0_Q1"];
  if (spf === "spf_rarely") {
    s.barrier = { ...s.barrier, new_actives: false };
  }
  const cleanse = answers["AX0_Q2"];
  if (cleanse === "cleanse_water") {
    s.barrier = { ...s.barrier, product_instability: true };
  }

  // ── Axis 1: Sebum ─────────────────────────────────────────────────────────
  const shine = answers["AX1_Q1"];
  if (shine === "shine_1hr") {
    s.oil = { ...s.oil, shine_start_hour: 9, makeup_hold_hours: 2 };
  } else if (shine === "shine_midday") {
    s.oil = { ...s.oil, shine_start_hour: 12, makeup_hold_hours: 4 };
  } else if (shine === "shine_afternoon") {
    s.oil = { ...s.oil, shine_start_hour: 16, makeup_hold_hours: 7 };
  }
  const oilZones = answers["AX1_Q2"];
  if (Array.isArray(oilZones) && oilZones.length >= 3) {
    s.oil = { ...s.oil, distribution: "full" };
  } else if (Array.isArray(oilZones) && oilZones.includes("zone_forehead") && oilZones.includes("zone_nose")) {
    s.oil = { ...s.oil, distribution: "tzone" };
  } else {
    s.oil = { ...s.oil, distribution: "patchy" };
  }

  // ── Axis 2: Hydration ─────────────────────────────────────────────────────
  const tight = answers["AX2_Q1"];
  if (tight === "tight_constantly") {
    s.dry = { ...s.dry, morning_tightness: 90, moisture_retention_hours: 1 };
  } else if (tight === "tight_frequently") {
    s.dry = { ...s.dry, morning_tightness: 65, moisture_retention_hours: 3 };
  } else if (tight === "tight_after_wash") {
    s.dry = { ...s.dry, morning_tightness: 30, moisture_retention_hours: 6 };
  }
  const dryWhen = answers["AX2_Q2"];
  if (dryWhen === "dry_heated" || dryWhen === "dry_outdoors") {
    s.dry = { ...s.dry, dry_environment_worse: true };
  }
  const flake = answers["AX2_Q3"];
  if (flake === "flake_severe") {
    s.dry = { ...s.dry, visible_flaking: true };
  }

  // ── Axis 3: Pores ─────────────────────────────────────────────────────────
  const poreVis = answers["AX3_Q2"];
  if (typeof poreVis === "number") {
    // slider 1-5 → photo_visibility 0-100
    s.texture = { ...s.texture, photo_visibility: Math.round(((poreVis - 1) / 4) * 100) };
  }
  const tzone = answers["AX3_Q3"];
  if (tzone === "tzone_yes") {
    s.texture = { ...s.texture, pore_location: "nose" };
  } else if (tzone === "tzone_no") {
    s.texture = { ...s.texture, pore_location: "cheeks" };
  } else {
    s.texture = { ...s.texture, pore_location: "full" };
  }

  // ── Axis 4: Breakouts ────────────────────────────────────────────────────
  const acneType = answers["AX4_Q1"];
  if (acneType === "acne_cystic") {
    s.acne = { ...s.acne, photo_match: 3, intensity: 90 };
  } else if (acneType === "acne_pustular") {
    s.acne = { ...s.acne, photo_match: 2, intensity: 65 };
  } else if (acneType === "acne_comedonal") {
    s.acne = { ...s.acne, photo_match: 1, intensity: 40 };
  }
  const acneFreq = answers["AX4_Q2"];
  if (acneFreq === "acne_constantly") {
    s.acne = { ...s.acne, recurrence: 100 };
  } else if (acneFreq === "acne_frequently") {
    s.acne = { ...s.acne, recurrence: 70 };
  } else if (acneFreq === "acne_occasionally") {
    s.acne = { ...s.acne, recurrence: 40 };
  }
  const hormonal = answers["AX4_Q2_COND"];
  if (hormonal === "hormonal_yes") {
    s.acne = { ...s.acne, hormonal: true };
  }

  // ── Axis 5: Sensitivity / Barrier ────────────────────────────────────────
  const reaction = answers["AX5_Q1"];
  if (reaction === "barrier_severe") {
    s.sensitivity = { ...s.sensitivity, reactivity: 90 };
    s.barrier = { ...s.barrier, product_instability: true };
  } else if (reaction === "barrier_moderate") {
    s.sensitivity = { ...s.sensitivity, reactivity: 60 };
  } else if (reaction === "barrier_mild") {
    s.sensitivity = { ...s.sensitivity, reactivity: 35 };
  }
  const redFreq = answers["AX5_Q2"];
  if (redFreq === "constantly") {
    s.sensitivity = { ...s.sensitivity, reactivity: Math.max(s.sensitivity?.reactivity ?? 0, 85) };
  }
  const tol = answers["AX5_Q3"];
  if (tol === "tol_few") {
    s.barrier = { ...s.barrier, product_instability: true };
    s.sensitivity = { ...s.sensitivity, react_aha: true, react_vitc: true };
  } else if (tol === "tol_some") {
    s.sensitivity = { ...s.sensitivity, react_aha: true };
  }

  // ── Axis 6: Aging ─────────────────────────────────────────────────────────
  const wrinkleDepth = answers["AX6_Q1"];
  if (typeof wrinkleDepth === "number") {
    // slider 1-10 → rebound 0-3
    const rebound = Math.round(((wrinkleDepth - 1) / 9) * 3) as 0 | 1 | 2 | 3;
    s.aging = { ...s.aging, rebound };
  }
  const firmAreas = answers["AX6_Q2"];
  if (Array.isArray(firmAreas)) {
    const areaMap: Record<string, "eyes" | "nasolabial" | "neck" | "jawline" | "forehead"> = {
      firm_under_eyes: "eyes",
      firm_nasolabial: "nasolabial",
      firm_neck: "neck",
      firm_jaw: "jawline",
    };
    const mapped = firmAreas
      .map((a) => areaMap[a])
      .filter(Boolean) as Array<"eyes" | "nasolabial" | "neck" | "jawline" | "forehead">;
    if (mapped.length > 0) s.aging = { ...s.aging, areas: mapped };
  }

  // ── Axis 7: Pigmentation ──────────────────────────────────────────────────
  const pigType = answers["AX7_Q1"];
  if (pigType === "pig_melasma") {
    s.pigment = { ...s.pigment, hormonal_pigment: true, photo_match: 3 };
  } else if (pigType === "pig_sun") {
    s.pigment = { ...s.pigment, sun_reaction: 80, photo_match: 2 };
  } else if (pigType === "pig_pih") {
    s.pigment = { ...s.pigment, photo_match: 1 };
  } else if (pigType === "pig_dull") {
    s.pigment = { ...s.pigment, photo_match: 0 };
  }
  const uv = answers["AX7_Q3"];
  if (uv === "uv_constantly") {
    s.pigment = { ...s.pigment, sun_reaction: Math.max(s.pigment?.sun_reaction ?? 0, 90) };
  } else if (uv === "uv_frequently") {
    s.pigment = { ...s.pigment, sun_reaction: Math.max(s.pigment?.sun_reaction ?? 0, 60) };
  }

  // ── Axis 8: Hormonal ──────────────────────────────────────────────────────
  const hormFluc = answers["AX8_Q1"];
  if (hormFluc === "horm_severe") {
    s.acne = { ...s.acne, hormonal: true };
  }

  // ── Axis 9: Neurodermatitis ───────────────────────────────────────────────
  const itch = answers["AX9_Q1"];
  const dx = answers["AX9_Q2"];
  if (itch === "constantly" || itch === "frequently" || dx === "dx_atopic" || dx === "dx_psoriasis") {
    s.sensitivity = { ...s.sensitivity, reactivity: 100, react_aha: true, react_vitc: true, react_retinol: true };
    s.barrier = { ...s.barrier, product_instability: true, needs_multilayer: true };
  }
  const crack = answers["AX9_Q3"];
  if (crack === "crack_severe") {
    s.barrier = { ...s.barrier, recovery_hours: 72, needs_multilayer: true };
  }

  // ── Exposome block ────────────────────────────────────────────────────────

  // EXP_SLEEP: 0=<5h  1=5h  2=6h  3=7h  4=8h+
  const sleep = answers["EXP_SLEEP"];
  if (typeof sleep === "number") {
    if (sleep === 0) {
      // severely sleep-deprived → barrier stress, elevated sensitivity
      s.barrier     = { ...s.barrier, recovery_hours: Math.max(s.barrier?.recovery_hours ?? 0, 60) };
      s.sensitivity = { ...s.sensitivity, reactivity: Math.max(s.sensitivity?.reactivity ?? 0, 55) };
    } else if (sleep === 1) {
      s.barrier = { ...s.barrier, recovery_hours: Math.max(s.barrier?.recovery_hours ?? 0, 36) };
    }
    // 3-4 (7-8h+) → optimal, no penalty
  }

  // EXP_WATER (stored as number: 0=low, 1=mid, 2=high; legacy string also supported)
  const water = answers["EXP_WATER"];
  if (water === 0 || water === "water_low") {
    s.dry = { ...s.dry, moisture_retention_hours: Math.min(s.dry?.moisture_retention_hours ?? 24, 3) };
  } else if (water === 1 || water === "water_mid") {
    s.dry = { ...s.dry, moisture_retention_hours: Math.min(s.dry?.moisture_retention_hours ?? 24, 8) };
  }
  // water === 2 || "water_high" → no penalty

  // EXP_STRESS (stored as number: 0=low, 1=mod, 2=high; legacy string also supported)
  const stress = answers["EXP_STRESS"];
  if (stress === 2 || stress === "stress_high") {
    s.acne        = { ...s.acne, recurrence: Math.max(s.acne?.recurrence ?? 0, 65) };
    s.sensitivity = { ...s.sensitivity, reactivity: Math.max(s.sensitivity?.reactivity ?? 0, 55) };
    s.aging       = { ...s.aging, rebound: Math.max(s.aging?.rebound ?? 0, 1) as 0 | 1 | 2 | 3 };
  } else if (stress === 1 || stress === "stress_mod") {
    s.acne = { ...s.acne, recurrence: Math.max(s.acne?.recurrence ?? 0, 35) };
  }

  // EXP_CLIMATE — use ClimateProfile risk levels when available; fall back to legacy string
  const cp = lifestyle?.climateProfile;
  const climate = answers["EXP_CLIMATE"];

  const dryRisk  = cp?.drynessRisk  ?? (climate === "climate_cold_dry" ? "high" : "low");
  const coldRisk = cp?.coldRisk     ?? (climate === "climate_cold_dry" ? "high" : "low");
  const humidRisk = cp?.humidityRisk ?? (climate === "climate_humid"   ? "high" : "low");
  const uvRisk   = cp?.uvRisk       ?? (climate === "climate_hot_dry"  ? "high" : "low");
  const heatRisk = cp?.heatRisk     ?? (climate === "climate_hot_dry"  ? "high" : "low");

  if (dryRisk === "high" || coldRisk === "high") {
    s.dry     = { ...s.dry, dry_environment_worse: true };
    s.barrier = { ...s.barrier, recovery_hours: Math.max(s.barrier?.recovery_hours ?? 0, 36) };
  } else if (dryRisk === "moderate" || coldRisk === "moderate") {
    s.dry = { ...s.dry, dry_environment_worse: true };
  }

  if (humidRisk === "high") {
    s.oil = { ...s.oil, summer_worse: true };
  }

  if (uvRisk === "high" || heatRisk === "high") {
    s.pigment = { ...s.pigment, sun_reaction: Math.max(s.pigment?.sun_reaction ?? 0, 65) };
  } else if (uvRisk === "moderate" || heatRisk === "moderate") {
    s.pigment = { ...s.pigment, sun_reaction: Math.max(s.pigment?.sun_reaction ?? 0, 45) };
  }

  // EXP_EXERCISE
  const exercise = answers["EXP_EXERCISE"];
  if (exercise === "ex_daily") {
    // Daily outdoor → additional UV exposure
    s.pigment = { ...s.pigment, sun_reaction: Math.max(s.pigment?.sun_reaction ?? 0, 45) };
  }
  // ex_rarely → no signals (circulation benefit is neutral for our scoring)

  return s;
}
