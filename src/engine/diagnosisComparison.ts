// src/engine/diagnosisComparison.ts
// Re-diagnosis comparison utilities (Part C — Steps 3 & 4)

import { AXIS_KEYS, AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from "@/engine/types";
import type { AxisKey, AxisScores } from "@/engine/types";
import type { Lang } from "@/engine/questionRoutingV5";

// ─── Step 3-B: DiagnosisComparison interface ─────────────────────────────────

export interface DiagnosisComparison {
  previous: { date: string; scores: AxisScores };
  current: { date: string; scores: AxisScores };
  changes: Record<AxisKey, {
    delta: number;                                          // positive = improved (score went DOWN)
    direction: "improved" | "stable" | "worsened";
    message: Record<Lang, string>;
  }>;
  overallProgress: {
    improvedCount: number;
    stableCount: number;
    worsenedCount: number;
    summary: Record<Lang, string>;
  };
}

// ─── Step 3-C: Per-axis change message generator ─────────────────────────────

function generateAxisChangeMessage(
  axis: AxisKey,
  prevScore: number,
  currScore: number,
): { delta: number; direction: "improved" | "stable" | "worsened"; message: Record<Lang, string> } {
  const delta = prevScore - currScore; // positive = improved (lower score = less severity)
  const direction: "improved" | "stable" | "worsened" =
    delta >= 5 ? "improved" : delta <= -5 ? "worsened" : "stable";

  const axisName = {
    en: AXIS_LABELS[axis],
    de: AXIS_LABELS_DE[axis],
    ko: AXIS_LABELS_KO[axis],
  };

  const message: Record<Lang, string> = { en: "", de: "", ko: "" };

  if (direction === "improved") {
    message.en = `Your ${axisName.en.toLowerCase()} score improved by ${delta} points — keep it up!`;
    message.de = `Ihr ${axisName.de}-Wert verbesserte sich um ${delta} Punkte — weiter so!`;
    message.ko = `${axisName.ko} 점수가 ${delta}점 개선됐어요 — 이대로 유지하세요!`;
  } else if (direction === "worsened") {
    message.en = `Your ${axisName.en.toLowerCase()} score increased by ${Math.abs(delta)} points — let's adjust your routine.`;
    message.de = `Ihr ${axisName.de}-Wert stieg um ${Math.abs(delta)} Punkte — wir passen Ihre Pflege an.`;
    message.ko = `${axisName.ko} 점수가 ${Math.abs(delta)}점 올랐어요 — 루틴 조정이 필요합니다.`;
  } else {
    message.en = `Your ${axisName.en.toLowerCase()} is stable — your current care is maintaining results.`;
    message.de = `Ihr ${axisName.de}-Wert ist stabil — Ihre aktuelle Pflege hält die Ergebnisse.`;
    message.ko = `${axisName.ko}이(가) 안정적이에요 — 현재 관리가 효과를 유지하고 있어요.`;
  }

  return { delta, direction, message };
}

// ─── Build full comparison object ────────────────────────────────────────────

export function buildDiagnosisComparison(
  previousDate: string,
  previousScores: AxisScores,
  currentDate: string,
  currentScores: AxisScores,
): DiagnosisComparison {
  const changes = {} as DiagnosisComparison["changes"];
  let improvedCount = 0, stableCount = 0, worsenedCount = 0;

  for (const axis of AXIS_KEYS) {
    const result = generateAxisChangeMessage(axis, previousScores[axis], currentScores[axis]);
    changes[axis] = result;
    if (result.direction === "improved") improvedCount++;
    else if (result.direction === "stable") stableCount++;
    else worsenedCount++;
  }

  const summary: Record<Lang, string> = {
    en: improvedCount > worsenedCount
      ? `Great progress — ${improvedCount} axes improved since your last diagnosis.`
      : worsenedCount > improvedCount
        ? `${worsenedCount} areas need attention — let's review your routine.`
        : `Your skin is holding steady — ${stableCount} axes are stable.`,
    de: improvedCount > worsenedCount
      ? `Guter Fortschritt — ${improvedCount} Bereiche haben sich seit der letzten Diagnose verbessert.`
      : worsenedCount > improvedCount
        ? `${worsenedCount} Bereiche brauchen Aufmerksamkeit — überprüfen wir Ihre Pflege.`
        : `Ihre Haut ist stabil — ${stableCount} Bereiche halten das Niveau.`,
    ko: improvedCount > worsenedCount
      ? `좋은 진전이에요 — 지난 분석 이후 ${improvedCount}개 항목이 개선됐습니다.`
      : worsenedCount > improvedCount
        ? `${worsenedCount}개 항목에 주의가 필요해요 — 루틴을 함께 점검해 봐요.`
        : `피부가 안정적이에요 — ${stableCount}개 항목이 유지되고 있습니다.`,
  };

  return {
    previous: { date: previousDate, scores: previousScores },
    current: { date: currentDate, scores: currentScores },
    changes,
    overallProgress: { improvedCount, stableCount, worsenedCount, summary },
  };
}

// ─── Step 3-D: 4-week re-check prompt ────────────────────────────────────────

export const RECHECK_PROMPT: Record<Lang, { title: string; body: string; cta: string }> = {
  en: {
    title: "Time for a Re-Check",
    body: "It's been 4 weeks since your last diagnosis. Your skin changes with seasons, hormones, and habits.",
    cta: "Re-diagnose now →",
  },
  de: {
    title: "Zeit für einen Re-Check",
    body: "4 Wochen seit Ihrer letzten Diagnose. Ihre Haut verändert sich mit Jahreszeiten, Hormonen und Gewohnheiten.",
    cta: "Jetzt neu diagnostizieren →",
  },
  ko: {
    title: "재분석 시간이에요",
    body: "마지막 분석 후 4주가 지났어요. 피부는 계절, 호르몬, 습관에 따라 변합니다.",
    cta: "지금 재분석하기 →",
  },
};

/** Returns true if the user's last diagnosis was ≥ 4 weeks ago */
export function isRecheckDue(lastDiagnosisDate: string | null): boolean {
  if (!lastDiagnosisDate) return false;
  const ms = Date.now() - new Date(lastDiagnosisDate).getTime();
  return ms >= 28 * 24 * 60 * 60 * 1000; // 28 days
}

// ─── Step 4: Skin Age computation ────────────────────────────────────────────

export const AGE_MIDPOINTS = [15, 25, 35, 45, 55, 65] as const;

export function computeSkinAge(
  realAgeMidpoint: number,
  scores: AxisScores,
  menoStatus: string | null,
): { skinAge: number; comparison: "younger" | "matches" | "older" } {
  let skinAge = realAgeMidpoint;

  // High aging score → skin appears older
  if (scores.aging >= 60) skinAge += 5;
  else if (scores.aging >= 40) skinAge += 2;
  else if (scores.aging <= 20) skinAge -= 3;

  // High barrier damage → adds perceived age
  if (scores.bar >= 60) skinAge += 3;

  // Good hydration (low hyd score = less dehydration) → younger
  if (scores.hyd <= 30) skinAge -= 2;

  // §11: ox >= 50 now indicates genuine chip-confirmed damage
  if (scores.ox >= 50) skinAge += 3;
  else if (scores.ox <= 20) skinAge -= 2;

  // Menopause acceleration
  if (menoStatus === "meno_post_early" && scores.aging >= 50) skinAge += 4;
  if (menoStatus === "meno_post_late" && scores.aging >= 50) skinAge += 2;

  // Clamp: max ±15 years from real age
  skinAge = Math.max(realAgeMidpoint - 10, Math.min(realAgeMidpoint + 15, Math.round(skinAge)));

  const diff = skinAge - realAgeMidpoint;
  const comparison = diff <= -3 ? "younger" : diff >= 3 ? "older" : "matches";

  return { skinAge, comparison };
}
