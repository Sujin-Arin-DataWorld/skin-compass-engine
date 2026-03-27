/**
 * axisExplanationEngine.ts
 *
 * Phase 3.5D — "Why this recommendation" persuasion layer.
 *
 * Generates per-axis user-facing explanations that are:
 *   • Age-aware (mentions decade-specific context)
 *   • Season-aware (mentions current season if relevant)
 *   • Gender-aware (adjusts language for male skin)
 *   • Plain language (no clinical acronyms shown to users)
 */

import type { AxisKey, AxisExplanation } from "@/engine/types";

interface ExplainInput {
  axis: AxisKey;
  score: number;
  ageBracket?: number;   // 0=<20 1=20s 2=30s 3=40s 4=50s 5=60+
  gender?: number;        // 0=female 1=male 2=other
  season?: string;        // "winter" | "summer" | "transitional"
}

function severityFromScore(score: number): 0 | 1 | 2 | 3 {
  if (score < 30) return 0;
  if (score < 50) return 1;
  if (score < 70) return 2;
  return 3;
}

const DECADE_EN = ["teens", "20s", "30s", "40s", "50s", "60s"] as const;
const DECADE_DE = ["Teenagerjahren", "20ern", "30ern", "40ern", "50ern", "60ern"] as const;
const DECADE_KO = ["10대", "20대", "30대", "40대", "50대", "60대"] as const;

export function generateAxisExplanation(input: ExplainInput): AxisExplanation {
  const { axis, score, ageBracket, gender, season } = input;
  const severity = severityFromScore(score);
  const decade = ageBracket ?? 2;
  const isWinter = season === "winter";
  const isSummer = season === "summer";
  const isMale = gender === 1;

  let explanationEn = "";
  let explanationDe = "";
  let explanationKo = "";
  let outcomeEn = "";
  let outcomeDe = "";
  let outcomeKo = "";

  if (axis === "hyd" && score >= 40) {
    const ageCtxEn = decade >= 3 ? ` In your ${DECADE_EN[decade]}, natural lipid production slows, accelerating moisture loss.` : "";
    const ageCtxDe = decade >= 3 ? ` In Ihren ${DECADE_DE[decade]} verlangsamt sich die natürliche Lipidproduktion.` : "";
    const ageCtxKo = decade >= 3 ? ` ${DECADE_KO[decade]}에는 피부의 천연 지질 생산이 느려져 수분 손실이 빨라져요.` : "";
    const winterCtxEn = isWinter ? " Indoor heating further strips moisture from the air." : "";
    const winterCtxDe = isWinter ? " Innenraumheizung entzieht der Luft zusätzlich Feuchtigkeit." : "";
    const winterCtxKo = isWinter ? " 겨울 실내 난방이 공기 중 수분도 함께 빼앗아요." : "";

    explanationEn = `Your skin is losing moisture faster than it can replenish.${ageCtxEn}${winterCtxEn} Your barrier needs extra support to stay hydrated.`;
    explanationDe = `Ihre Haut verliert Feuchtigkeit schneller als sie nachliefern kann.${ageCtxDe}${winterCtxDe} Ihre Barriere braucht extra Unterstützung.`;
    explanationKo = `피부가 수분을 보충하는 속도보다 빠르게 잃고 있어요.${ageCtxKo}${winterCtxKo} 수분을 잡아두는 장벽 케어가 더 필요합니다.`;
    outcomeEn = "With a hydration-focused routine, you should notice less tightness within 1–2 weeks and visibly plumper skin by week 4.";
    outcomeDe = "Mit einer feuchtigkeitsfokussierten Pflege sollten Sie in 1–2 Wochen weniger Spannung und nach 4 Wochen sichtbar prallere Haut bemerken.";
    outcomeKo = "수분 집중 루틴을 따르면 1-2주 내에 당김이 줄고, 4주 후 눈에 띄게 촉촉한 피부를 느낄 수 있어요.";

  } else if (axis === "aging" && score >= 30) {
    const collagenCtxEn = decade >= 2 ? " Collagen production decreases approximately 1% per year after 30." : "";
    const collagenCtxDe = decade >= 2 ? " Die Kollagenproduktion nimmt nach dem 30. Lebensjahr um ca. 1% pro Jahr ab." : "";
    const collagenCtxKo = decade >= 2 ? " 30세 이후 콜라겐 생성이 매년 약 1%씩 감소해요." : "";

    explanationEn = `Signs of firmness loss are becoming visible.${collagenCtxEn} Targeted actives can help stimulate new collagen.`;
    explanationDe = `Festigkeitsverlust wird sichtbar.${collagenCtxDe} Gezielte Wirkstoffe können die Kollagenproduktion anregen.`;
    explanationKo = `탄력 저하의 신호가 보이기 시작해요.${collagenCtxKo} 타겟 성분이 콜라겐 생성을 도울 수 있어요.`;
    outcomeEn = "Consistent use of peptides and/or retinoids can visibly improve firmness in 6–12 weeks.";
    outcomeDe = "Der regelmäßige Einsatz von Peptiden und/oder Retinoiden kann die Festigkeit in 6–12 Wochen sichtbar verbessern.";
    outcomeKo = "펩타이드 또는 레티노이드를 꾸준히 사용하면 6-12주 내에 탄력이 눈에 띄게 개선될 수 있어요.";

  } else if (axis === "seb" && score >= 40) {
    const maleCtxEn = isMale ? " Male skin produces significantly more skin oil due to higher androgen levels." : "";
    const maleCtxDe = isMale ? " Männliche Haut produziert aufgrund höherer Androgenspiegel deutlich mehr Hautöl." : "";
    const maleCtxKo = isMale ? " 남성 피부는 안드로겐 수치가 높아 피지 분비가 더 활발해요." : "";
    const summerCtxEn = isSummer ? " Heat and humidity in summer amplify skin oil output." : "";
    const summerCtxDe = isSummer ? " Hitze und Feuchtigkeit im Sommer verstärken die Hautöl-Produktion." : "";
    const summerCtxKo = isSummer ? " 여름철 열기와 습도가 피지 분비를 더욱 촉진해요." : "";

    explanationEn = `Your oil glands are actively producing excess skin oil.${maleCtxEn}${summerCtxEn} This contributes to shine, enlarged pores, and potential breakouts.`;
    explanationDe = `Ihre Öl-Drüsen produzieren übermäßig Hautöl.${maleCtxDe}${summerCtxDe} Das trägt zu Glanz, vergrößerten Poren und möglichen Unreinheiten bei.`;
    explanationKo = `피지선이 과도하게 피지를 분비하고 있어요.${maleCtxKo}${summerCtxKo} 번들거림, 넓은 모공, 트러블의 원인이 될 수 있어요.`;
    outcomeEn = "With the right oil-control routine, shine should reduce noticeably within 2–3 weeks.";
    outcomeDe = "Mit der richtigen ölkontrollierenden Pflege sollte der Glanz innerhalb von 2–3 Wochen merklich abnehmen.";
    outcomeKo = "적절한 피지 조절 루틴으로 2-3주 내에 번들거림이 눈에 띄게 줄어들어요.";

  } else if (axis === "bar" && score >= 40) {
    const ageCtxEn = decade >= 4 ? ` After 50, the skin barrier becomes naturally thinner and more fragile.` : "";
    const ageCtxDe = decade >= 4 ? ` Nach 50 wird die Hautbarriere von Natur aus dünner und empfindlicher.` : "";
    const ageCtxKo = decade >= 4 ? ` 50세 이후 피부 장벽이 자연스럽게 얇아지고 약해져요.` : "";

    explanationEn = `Your skin barrier is compromised — it's less effective at keeping moisture in and irritants out.${ageCtxEn} This makes skin reactive and more prone to redness.`;
    explanationDe = `Ihre Hautbarriere ist geschwächt — sie hält Feuchtigkeit schlechter und lässt Reizstoffe leichter durch.${ageCtxDe}`;
    explanationKo = `피부 장벽이 약화된 상태예요 — 수분을 가두고 외부 자극을 차단하는 능력이 떨어져 있어요.${ageCtxKo}`;
    outcomeEn = "A focused barrier-repair protocol can restore skin resilience within 4–6 weeks.";
    outcomeDe = "Ein gezieltes Barriere-Reparaturprotokoll kann die Hautresistenz innerhalb von 4–6 Wochen wiederherstellen.";
    outcomeKo = "집중 장벽 회복 루틴으로 4-6주 내에 피부 회복력을 되찾을 수 있어요.";

  } else if (axis === "sen" && score >= 40) {
    explanationEn = "Your skin reacts more readily than average to environmental triggers, products, and temperature changes.";
    explanationDe = "Ihre Haut reagiert stärker als normal auf Umweltreize, Produkte und Temperaturwechsel.";
    explanationKo = "환경 자극, 제품, 온도 변화에 평균보다 더 민감하게 반응하는 피부예요.";
    outcomeEn = "Simplifying your routine and focusing on barrier support typically reduces reactivity within 3–4 weeks.";
    outcomeDe = "Eine vereinfachte Pflege und Barriere-Unterstützung reduziert die Reaktivität meist innerhalb von 3–4 Wochen.";
    outcomeKo = "루틴을 단순화하고 장벽 케어에 집중하면 보통 3-4주 내에 민감도가 감소해요.";

  } else if (axis === "acne" && score >= 40) {
    explanationEn = "Active breakouts indicate ongoing inflammation, often driven by excess skin oil, bacteria, or hormonal fluctuations.";
    explanationDe = "Aktive Unreinheiten weisen auf anhaltende Entzündungen hin, oft durch übermäßiges Hautöl, Bakterien oder hormonelle Schwankungen.";
    explanationKo = "활성 트러블은 지속적인 염증 상태를 나타내며, 과도한 피지·세균·호르몬 변화가 주요 원인이에요.";
    outcomeEn = "Consistent use of targeted actives can noticeably reduce breakout frequency within 4–6 weeks.";
    outcomeDe = "Der konsistente Einsatz gezielter Wirkstoffe kann die Häufigkeit von Unreinheiten in 4–6 Wochen merklich reduzieren.";
    outcomeKo = "타겟 성분을 꾸준히 사용하면 4-6주 내에 트러블 빈도가 눈에 띄게 줄어들어요.";

  } else if (axis === "pigment" && score >= 30) {
    explanationEn = "Uneven tone and dark spots develop from UV exposure, post-acne marks, or hormonal pigmentation. These respond well to brightening actives — but slowly.";
    explanationDe = "Ungleichmäßiger Teint und dunkle Flecken entstehen durch UV-Exposition, Akne-Narben oder hormonelle Pigmentierung. Sie sprechen gut auf aufhellende Wirkstoffe an — aber langsam.";
    explanationKo = "자외선, 트러블 흔적, 호르몬성 색소침착으로 피부톤이 불균일해져요. 미백 성분에 잘 반응하지만 시간이 걸려요.";
    outcomeEn = "Brightening ingredients typically take 8–12 weeks to show visible improvement in dark spots.";
    outcomeDe = "Aufhellende Inhaltsstoffe benötigen in der Regel 8–12 Wochen, um sichtbare Verbesserungen zu zeigen.";
    outcomeKo = "미백 성분은 보통 8-12주가 지나야 어두운 흔적의 가시적인 개선이 나타나요.";

  } else if (axis === "ox" && score >= 30) {
    explanationEn = "Environmental stressors — UV, pollution, blue light — are generating oxidative damage that accelerates skin aging and dullness.";
    explanationDe = "Umweltstressoren — UV, Schadstoffe, blaues Licht — verursachen oxidativen Schaden, der die Hautalterung und Mattheit beschleunigt.";
    explanationKo = "자외선·대기오염·블루라이트 등 환경 스트레스가 산화 손상을 일으켜 피부 노화와 칙칙함을 가속화해요.";
    outcomeEn = "Antioxidant serums used consistently can reduce environmental damage accumulation within 4–8 weeks.";
    outcomeDe = "Regelmäßig angewendete Antioxidans-Seren können die Anhäufung von Umweltschäden innerhalb von 4–8 Wochen reduzieren.";
    outcomeKo = "항산화 세럼을 꾸준히 사용하면 4-8주 내에 환경 손상 누적이 줄어들어요.";

  } else if (axis === "texture" && score >= 30) {
    explanationEn = "Rough, uneven texture is typically caused by clogged pores, dead cell buildup, or scarring from previous breakouts.";
    explanationDe = "Raue, unebene Textur wird typischerweise durch verstopfte Poren, abgestorbene Zellen oder Narben von früheren Unreinheiten verursacht.";
    explanationKo = "거칠고 불균일한 피부 결은 보통 막힌 모공, 각질 축적, 또는 트러블 흔적이 원인이에요.";
    outcomeEn = "Regular gentle exfoliation with the right actives typically smooths texture in 4–8 weeks.";
    outcomeDe = "Regelmäßige sanfte Peelings mit den richtigen Wirkstoffen glättert die Textur meist in 4–8 Wochen.";
    outcomeKo = "적합한 성분으로 꾸준히 각질을 관리하면 4-8주 내에 피부 결이 부드러워져요.";

  } else {
    // Generic fallback
    explanationEn = `Your ${axis} score is ${score >= 50 ? "elevated" : "within a healthy range"} — we've accounted for this in your routine.`;
    explanationDe = `Ihr ${axis}-Wert ist ${score >= 50 ? "erhöht" : "im gesunden Bereich"} — wir haben dies in Ihrer Pflege berücksichtigt.`;
    explanationKo = `${axis} 점수가 ${score >= 50 ? "높은 편이에요" : "건강한 범위 내에 있어요"} — 루틴에 반영했습니다.`;
    outcomeEn = "Following the recommended routine consistently will support overall skin health.";
    outcomeDe = "Die konsequente Befolgung der empfohlenen Pflege unterstützt die allgemeine Hautgesundheit.";
    outcomeKo = "추천 루틴을 꾸준히 따르면 전반적인 피부 건강이 향상돼요.";
  }

  return {
    axis,
    score,
    severity,
    explanation:    { en: explanationEn, de: explanationDe, ko: explanationKo },
    expectedOutcome: { en: outcomeEn, de: outcomeDe, ko: outcomeKo },
  };
}

/**
 * Generate explanations for ALL axes above a minimum score threshold.
 * Only axes with score ≥ minScore get an explanation entry.
 */
export function generateAxisExplanations(
  axisScores: Record<string, number>,
  foundation: { age_bracket?: number; gender?: number; seasonal_change?: number },
  currentSeason: string = "transitional",
): AxisExplanation[] {
  const MIN_SCORE = 25;
  const axisOrder: AxisKey[] = ["bar", "hyd", "sen", "seb", "acne", "aging", "pigment", "ox", "texture", "makeup_stability"];

  return axisOrder
    .filter(axis => (axisScores[axis] ?? 0) >= MIN_SCORE)
    .map(axis =>
      generateAxisExplanation({
        axis,
        score: axisScores[axis] ?? 0,
        ageBracket: foundation.age_bracket,
        gender: foundation.gender,
        season: currentSeason,
      })
    );
}
