import type { AxisKey } from "./types";

// ── Face zones ──
export type FaceZone =
  | "forehead" | "forehead_left" | "forehead_right"
  | "nose" | "left_cheek" | "right_cheek" | "chin"
  | "jawline" | "jawline_l" | "jawline_r" | "temple"
  | "t_zone";

// ── Per-category signal shapes ──
export interface UiSignalsV4 {
  acne?: {
    zones?: FaceZone[];
    intensity?: number;       // 0-100
    recurrence?: number;      // 0-100
    hormonal?: boolean;
    body?: boolean;
    mask_area?: boolean;
    photo_match?: 0 | 1 | 2 | 3;
  };
  oil?: {
    shine_start_hour?: number;     // 8-22
    makeup_hold_hours?: number;    // 0-12
    distribution?: "tzone" | "full" | "patchy";
    summer_worse?: boolean;
    oxidizes_darker?: boolean;
  };
  dry?: {
    moisture_retention_hours?: number; // 0-24
    morning_tightness?: number;       // 0-100
    visible_flaking?: boolean;
    dry_environment_worse?: boolean;
    photo_match?: 0 | 1 | 2 | 3;
  };
  sensitivity?: {
    reactivity?: number;          // 0-100
    flush_duration_min?: number;  // 0-240
    react_aha?: boolean;
    react_vitc?: boolean;
    react_retinol?: boolean;
    visible_capillaries?: boolean;
  };
  pigment?: {
    zones?: Array<"cheeks" | "nose_side" | "around_mouth" | "under_eyes" | "forehead">;
    neck_mismatch?: boolean;
    sun_reaction?: number;        // 0-100
    hormonal_pigment?: boolean;
    photo_match?: 0 | 1 | 2 | 3;
  };
  texture?: {
    zoom_choice?: 0 | 1 | 2 | 3;
    pore_location?: "nose" | "cheeks" | "full";
    photo_visibility?: number;    // 0-100
  };
  aging?: {
    rebound?: 0 | 1 | 2 | 3;
    areas?: Array<"eyes" | "nasolabial" | "neck" | "jawline" | "forehead">;
    puff_vs_sag?: boolean;
  };
  barrier?: {
    recovery_hours?: number;      // 0-72+
    product_instability?: boolean;
    exfoliation_freq?: 0 | 1 | 2 | 3;
    needs_multilayer?: boolean;
    new_actives?: boolean;
  };
}

type Severity = 0 | 1 | 2 | 3;

function clampSev(n: number): Severity {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  return 3;
}

function sliderToSev(value?: number): Severity {
  if (value == null) return 0;
  if (value < 26) return 0;
  if (value < 51) return 1;
  if (value < 76) return 2;
  return 3;
}

function hourToSev(h?: number): Severity {
  if (h == null) return 0;
  if (h <= 12) return 3;
  if (h <= 15) return 2;
  if (h <= 18) return 1;
  return 0;
}

function makeupHoldToSev(h?: number): Severity {
  if (h == null) return 0;
  if (h <= 2) return 3;
  if (h <= 4) return 2;
  if (h <= 6) return 1;
  return 0;
}

function durationMinToSev(min?: number): Severity {
  if (min == null) return 0;
  if (min < 5) return 0;
  if (min < 30) return 1;
  if (min < 60) return 2;
  return 3;
}

function hoursToSevInverted(hours?: number, bands: [number, number, number] = [1, 3, 6]): Severity {
  if (hours == null) return 0;
  const [t1, t2, t3] = bands;
  if (hours <= t1) return 3;
  if (hours <= t2) return 2;
  if (hours <= t3) return 1;
  return 0;
}

/**
 * Convert structured UI signals into a severity patch (symptom_id → 0-3).
 * Caller should merge with MAX into the main severities map.
 */
export function mapUiSignalsToSeverityPatch(signals: UiSignalsV4): Record<string, number> {
  const p: Record<string, Severity> = {};

  // ── Cat 1 Acne ──
  const acne = signals.acne;
  if (acne) {
    const zones = new Set(acne.zones ?? []);
    const zc = zones.size;
    if (zc >= 1) p["C1_02"] = clampSev(zc >= 4 ? 3 : zc >= 2 ? 2 : 1);
    if (zones.has("jawline") || zones.has("chin"))
      p["C1_02"] = clampSev(Math.max(p["C1_02"] ?? 0, 2));

    const intenSev = sliderToSev(acne.intensity);
    if (intenSev >= 2) { p["C1_07"] = intenSev; p["C1_08"] = intenSev; }
    p["C1_01"] = sliderToSev(acne.recurrence);
    if (acne.hormonal) p["C1_03"] = 2;
    if (acne.body) p["C1_15"] = 2;
    if (acne.mask_area) p["C1_04"] = 2;
    if (acne.photo_match === 1) p["C1_03"] = clampSev(Math.max(p["C1_03"] ?? 0, 2));
    if (acne.photo_match === 2) p["C1_07"] = 3;
  }

  // ── Cat 2 Oil ──
  const oil = signals.oil;
  if (oil) {
    p["C2_01"] = hourToSev(oil.shine_start_hour);
    p["C2_04"] = makeupHoldToSev(oil.makeup_hold_hours);
    if (oil.distribution === "tzone") p["C2_02"] = 2;
    if (oil.distribution === "full") p["C2_14"] = 2;
    if (oil.distribution === "patchy") p["C2_14"] = 1;
    if (oil.summer_worse) p["C2_13"] = 2;
    if (oil.oxidizes_darker) p["C2_10"] = 2;
  }

  // ── Cat 3 Dry ──
  const dry = signals.dry;
  if (dry) {
    p["C3_02"] = hoursToSevInverted(dry.moisture_retention_hours, [1, 3, 6]);
    p["C3_01"] = sliderToSev(dry.morning_tightness);
    if (dry.visible_flaking) p["C3_03"] = 2;
    if (dry.dry_environment_worse) p["C3_15"] = 2;
    if (dry.photo_match === 1) p["C3_01"] = clampSev(Math.max(p["C3_01"] ?? 0, 2));
    if (dry.photo_match === 2) p["C3_03"] = 2;
    if (dry.photo_match === 3) p["C3_02"] = 3;
  }

  // ── Cat 4 Sensitivity ──
  const sen = signals.sensitivity;
  if (sen) {
    p["C4_01"] = sliderToSev(sen.reactivity);
    p["C4_09"] = durationMinToSev(sen.flush_duration_min);
    if (sen.react_aha) p["C4_05"] = 2;
    if (sen.react_retinol) p["C4_06"] = 2;
    if (sen.react_vitc) p["C4_05"] = clampSev(Math.max(p["C4_05"] ?? 0, 1));
    if (sen.visible_capillaries) p["C4_15"] = 2;
  }

  // ── Cat 5 Pigment ──
  const pig = signals.pigment;
  if (pig) {
    const z = new Set(pig.zones ?? []);
    if (z.size) {
      p["C5_12"] = clampSev(z.size >= 4 ? 3 : z.size >= 2 ? 2 : 1);
      if (z.has("nose_side")) p["C5_07"] = 2;
    }
    if (pig.neck_mismatch) p["C5_11"] = 2;
    p["C5_06"] = sliderToSev(pig.sun_reaction);
    if (pig.hormonal_pigment) { p["C5_02"] = 2; p["C5_14"] = 2; }
    if (pig.photo_match === 1) p["C5_02"] = 2;
    if (pig.photo_match === 0) p["C5_03"] = 2;
  }

  // ── Cat 6 Texture ──
  const tex = signals.texture;
  if (tex) {
    if (tex.zoom_choice === 1) p["C6_07"] = 1;
    if (tex.zoom_choice === 2) p["C6_01"] = 2;
    if (tex.zoom_choice === 3) { p["C6_06"] = 2; p["C6_07"] = 2; }
    if (tex.pore_location === "nose") p["C6_02"] = 2;
    if (tex.pore_location === "cheeks") p["C6_03"] = 2;
    if (tex.pore_location === "full") p["C6_01"] = 2;
    p["C6_10"] = sliderToSev(tex.photo_visibility);
  }

  // ── Cat 7 Aging ──
  const ag = signals.aging;
  if (ag) {
    if (ag.rebound != null) { p["C7_06"] = ag.rebound; p["C7_07"] = ag.rebound; }
    const a = new Set(ag.areas ?? []);
    if (a.has("eyes")) p["C7_01"] = 2;
    if (a.has("nasolabial")) p["C7_03"] = 2;
    if (a.has("neck")) p["C7_04"] = 2;
    if (a.has("jawline")) p["C7_05"] = 2;
    if (a.has("forehead")) p["C7_02"] = 2;
    if (ag.puff_vs_sag) p["C7_13"] = 2;
  }

  // ── Cat 8 Barrier ──
  const bar = signals.barrier;
  if (bar) {
    const h = bar.recovery_hours ?? 0;
    p["C8_06"] = h <= 1 ? 0 : h <= 6 ? 1 : h <= 24 ? 2 : 3;
    if (bar.product_instability) p["C8_01"] = 2;
    if (bar.exfoliation_freq != null) p["C8_12"] = bar.exfoliation_freq;
    if (bar.needs_multilayer) p["C8_13"] = 2;
    if (bar.new_actives) p["C8_12"] = clampSev(Math.max(p["C8_12"] ?? 0, 2));
  }

  return p;
}

/**
 * Merge a severity patch into existing severities using MAX (strongest signal wins).
 */
export function mergeSeveritiesMax(
  base: Record<string, number>,
  patch: Record<string, number>
): Record<string, number> {
  const out = { ...base };
  for (const [sid, sev] of Object.entries(patch)) {
    out[sid] = Math.max(out[sid] ?? 0, sev);
  }
  return out;
}
