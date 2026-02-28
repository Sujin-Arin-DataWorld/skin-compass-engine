import { AxisKey, AxisScores, DetectedPattern, RiskPattern, Urgency } from "./types";
import { HIGH_RISK_PATTERNS } from "./weights";

export function detectPatterns(
  severities: Record<string, number>,
  axisScores: AxisScores,
  metaAnswers: Record<string, number | boolean>
): DetectedPattern[] {
  const detected: DetectedPattern[] = [];

  for (const pattern of HIGH_RISK_PATTERNS) {
    const score = computePatternScore(pattern, severities, axisScores, metaAnswers);
    if (score >= pattern.threshold) {
      detected.push({
        pattern,
        score,
        severity: patternSeverity(score, pattern.threshold),
      });
    }
  }

  // Sort by score desc
  detected.sort((a, b) => b.score - a.score);
  return detected;
}

function computePatternScore(
  pattern: RiskPattern,
  severities: Record<string, number>,
  axisScores: AxisScores,
  metaAnswers: Record<string, number | boolean>
): number {
  // R = avg(required severity / 3)
  const reqScores = pattern.required.map((s) => (severities[s] ?? 0) / 3);
  const R = reqScores.length > 0 ? reqScores.reduce((a, b) => a + b, 0) / reqScores.length : 0;

  // O = avg(top-k optional severity / 3), k = min_optional
  const optScores = pattern.optional
    .map((s) => (severities[s] ?? 0) / 3)
    .sort((a, b) => b - a)
    .slice(0, pattern.min_optional);
  const O = optScores.length > 0 ? optScores.reduce((a, b) => a + b, 0) / optScores.length : 0;

  // G = gate factor
  let G = 1;
  for (const [axis, threshold] of Object.entries(pattern.axis_gates)) {
    if (axisScores[axis as AxisKey] < threshold) {
      G = 0.7;
      break;
    }
  }

  let score = 100 * (0.5 * R + 0.3 * O + 0.2 * G);

  // Meta bonuses/penalties
  if (pattern.id === "PATTERN_COUPEROSE") {
    if (metaAnswers["flush_30min"] === true) score += 5;
    if (metaAnswers["central_face"] === true) score += 5;
  }
  if (pattern.id === "PATTERN_OVER_EXFOLIATION") {
    const exf = metaAnswers["exfoliation_2w"];
    if (typeof exf === "number" && exf >= 2) score += 5;
    if (metaAnswers["new_actives"] === true) score += 3;
  }
  if (pattern.id === "PATTERN_HORMONAL_ACNE") {
    const pre = metaAnswers["premenstrual_7_10d"];
    if (typeof pre === "number" && pre >= 2) score += 5;
    const jaw = metaAnswers["jaw_focus"];
    if (typeof jaw === "number" && jaw >= 2) score += 3;
  }

  return Math.min(100, score);
}

function patternSeverity(score: number, threshold: number): 0 | 1 | 2 | 3 {
  if (score < threshold) return 0;
  if (score < 80) return 1;
  if (score < 90) return 2;
  return 3;
}

/** Apply additive boosts from top 2 patterns */
export function applyPatternBoosts(
  scores: AxisScores,
  patterns: DetectedPattern[]
): AxisScores {
  const result = { ...scores };
  const top2 = patterns.slice(0, 2);

  // Suppression rules
  const hasSevereAcne = top2.some((p) => p.pattern.id === "PATTERN_SEVERE_ACNE");
  const hasBarrierTriad = top2.some((p) => p.pattern.id === "PATTERN_BARRIER_TRIAD");

  for (const dp of top2) {
    // Severe Acne suppresses Hormonal Acne boost
    if (dp.pattern.id === "PATTERN_HORMONAL_ACNE" && hasSevereAcne) continue;
    // Barrier Triad suppresses Couperose unless flush_30min
    if (dp.pattern.id === "PATTERN_COUPEROSE" && hasBarrierTriad) continue;

    // Additive boosts based on severity
    const boostAmount = dp.severity * 5; // 5, 10, or 15 points
    const boostAxes = getBoostAxes(dp.pattern);
    for (const axis of boostAxes) {
      result[axis] = Math.min(100, result[axis] + boostAmount);
    }
  }

  return result;
}

function getBoostAxes(pattern: RiskPattern): AxisKey[] {
  // Derive from pattern flag which axes to boost
  const map: Record<string, AxisKey[]> = {
    BARRIER_EMERGENCY: ["bar", "sen", "hyd"],
    HORMONAL_ACNE_PROTOCOL: ["acne", "seb"],
    HYDRATION_FIRST: ["seb", "hyd", "bar"],
    ANTIOXIDANT_PRIORITY: ["ox", "pigment", "aging"],
    ANTI_REDNESS_PROTOCOL: ["sen", "bar"],
    DERMATOLOGIST_REFERRAL: ["acne", "seb", "sen"],
    DEVICE_RECOMMENDED: ["aging", "ox"],
    ACTIVE_INGREDIENT_PAUSE: ["bar", "sen"],
  };
  return map[pattern.flag] || [];
}

export function getUrgencyLevel(patterns: DetectedPattern[]): Urgency {
  if (patterns.length === 0) return "LOW";
  const levels: Record<Urgency, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  const maxLevel = Math.max(...patterns.map((p) => levels[p.pattern.urgency]));
  return (Object.entries(levels).find(([, v]) => v === maxLevel)?.[0] as Urgency) || "LOW";
}
