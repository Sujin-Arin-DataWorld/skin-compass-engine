import { AxisKey, AXIS_KEYS, AxisScores, AxisSeverity } from "./types";
import { SYMPTOMS, SKIN_TYPE_BASELINES, CONTEXT_MODIFIERS } from "./weights";
import type { SkinType, ContextKey } from "./types";

const SEVERITY_MULTIPLIER: Record<number, number> = {
  0: 0,
  1: 0.35,
  2: 0.70,
  3: 1.00,
};

function emptyScores(): AxisScores {
  return AXIS_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as AxisScores);
}

export function computeRawScores(
  severities: Record<string, number>
): AxisScores {
  const raw = emptyScores();
  for (const [symptomId, severity] of Object.entries(severities)) {
    const def = SYMPTOMS[symptomId];
    if (!def || severity === 0) continue;
    const mult = SEVERITY_MULTIPLIER[severity] ?? 0;
    for (const [axis, weight] of Object.entries(def.weights)) {
      raw[axis as AxisKey] += weight * mult;
    }
  }
  return raw;
}

export function applySkinTypeBaseline(
  raw: AxisScores,
  skinType: SkinType
): AxisScores {
  const baseline = SKIN_TYPE_BASELINES[skinType] || {};
  const result = { ...raw };
  for (const [axis, val] of Object.entries(baseline)) {
    result[axis as AxisKey] += val;
  }
  return result;
}

export function applyContextModifiers(
  scores: AxisScores,
  contexts: ContextKey[]
): AxisScores {
  const result = { ...scores };
  for (const ctx of contexts) {
    const mods = CONTEXT_MODIFIERS[ctx];
    if (!mods) continue;
    for (const [axis, mod] of Object.entries(mods)) {
      result[axis as AxisKey] *= 1 + mod;
    }
  }
  return result;
}

/**
 * Normalized S-curve scoring: prevents clustering at 87–100.
 * Computes earned/possible ratio per axis, then applies soft S-curve.
 */
export function saturateScores(
  raw: AxisScores,
  severities: Record<string, number>
): AxisScores {
  // Determine which categories the user actually answered
  const answeredCategories = new Set<number>();
  for (const [sid, sev] of Object.entries(severities)) {
    if (sev > 0 && SYMPTOMS[sid]) {
      answeredCategories.add(SYMPTOMS[sid].category);
    }
  }

  // Max possible per axis = sum of all weights for symptoms in answered categories
  const maxPossible = emptyScores();
  for (const def of Object.values(SYMPTOMS)) {
    if (answeredCategories.has(def.category)) {
      for (const [axis, weight] of Object.entries(def.weights)) {
        maxPossible[axis as AxisKey] += weight;
      }
    }
  }

  const result = emptyScores();
  for (const axis of AXIS_KEYS) {
    if (maxPossible[axis] <= 0) {
      result[axis] = 0;
      continue;
    }
    const ratio = Math.min(raw[axis] / maxPossible[axis], 1.0);
    // Soft S-curve: mild responses don't spike, severe responses stay high
    const curved =
      ratio < 0.5
        ? 2 * ratio * ratio
        : 1 - Math.pow(-2 * ratio + 2, 2) / 2;
    result[axis] = Math.round(curved * 100);
  }
  return result;
}

export function classifyAxisSeverity(score: number): 0 | 1 | 2 | 3 {
  if (score <= 20) return 0;
  if (score <= 45) return 1;
  if (score <= 70) return 2;
  return 3;
}

export function getAxisSeverities(scores: AxisScores): AxisSeverity {
  return AXIS_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: classifyAxisSeverity(scores[k]) }),
    {} as AxisSeverity
  );
}

/** Clinical normalization: soft coupling corrections */
export function clinicalNormalize(scores: AxisScores): {
  normalized: AxisScores;
  flags: string[];
} {
  const s = { ...scores };
  const flags: string[] = [];

  // Coupling corrections
  if (s.hyd > 80 && s.seb < 10) s.seb = Math.min(100, s.seb + 8);
  if (s.bar > 70 && s.sen < 20) s.sen = Math.min(100, s.sen + 10);
  if (s.ox > 75 && s.pigment < 20) s.pigment = Math.min(100, s.pigment + 8);
  if (s.aging > 70 && s.texture < 15) s.texture = Math.min(100, s.texture + 7);

  // Flags
  if (s.bar > 75) flags.push("ACTIVES_LIMIT");
  if (s.sen > 70) flags.push("IRRITATION_RISK");

  return { normalized: s, flags };
}
