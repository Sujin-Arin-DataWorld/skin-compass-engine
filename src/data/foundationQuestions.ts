// Shared foundation questions for both Diagnosis and AI Skin Analysis flows.
// Extracted from Diagnosis.tsx to avoid duplication.

export interface FoundationOption {
  label: { en: string; de: string; ko: string };
  value: number;
}

export interface FoundationQuestion {
  id: string;
  icon: string;
  text: string;
  textDE: string;
  textKO: string;
  hint?: string;
  hintDE?: string;
  hintKO?: string;
  options: FoundationOption[];
}

export type Lang = 'en' | 'de' | 'ko';

export function fqText(fq: FoundationQuestion, lang: Lang): string {
  return lang === 'de' ? fq.textDE : lang === 'ko' ? fq.textKO : fq.text;
}

export function fqHint(fq: FoundationQuestion, lang: Lang): string | undefined {
  return lang === 'de' ? fq.hintDE : lang === 'ko' ? fq.hintKO : fq.hint;
}

export function optLabel(opt: FoundationOption, lang: Lang): string {
  return opt.label[lang] ?? opt.label.en;
}

export const FOUNDATION_QUESTIONS: FoundationQuestion[] = [
  {
    id: 'age_bracket',
    icon: '🎂',
    text: 'What is your age range?',
    textDE: 'In welcher Altersgruppe sind Sie?',
    textKO: '연령대가 어떻게 되시나요?',
    hint: "Your skin's needs change with age — this helps us recommend the right level of care",
    hintDE: 'Die Bedürfnisse Ihrer Haut verändern sich mit dem Alter — so können wir die richtige Pflege empfehlen',
    hintKO: '나이에 따라 피부가 필요로 하는 관리가 달라져요 — 맞춤 추천을 위해 확인합니다',
    options: [
      { label: { en: 'Under 20', de: 'Unter 20', ko: '20세 미만' }, value: 0 },
      { label: { en: '20–29', de: '20–29', ko: '20–29세' }, value: 1 },
      { label: { en: '30–39', de: '30–39', ko: '30–39세' }, value: 2 },
      { label: { en: '40–49', de: '40–49', ko: '40–49세' }, value: 3 },
      { label: { en: '50–59', de: '50–59', ko: '50–59세' }, value: 4 },
      { label: { en: '60+', de: '60+', ko: '60세 이상' }, value: 5 },
    ],
  },
  {
    id: 'gender',
    icon: '👤',
    text: 'How do you identify?',
    textDE: 'Wie identifizieren Sie sich?',
    textKO: '성별이 어떻게 되시나요?',
    hint: 'Hormones significantly affect skin — this helps with hormonal and product recommendations',
    hintDE: 'Hormone beeinflussen Ihre Haut erheblich — dies hilft bei hormonellen und Produktempfehlungen',
    hintKO: '호르몬이 피부에 큰 영향을 미쳐요 — 호르몬 관련 추천에 활용됩니다',
    options: [
      { label: { en: 'Female', de: 'Weiblich', ko: '여성' }, value: 0 },
      { label: { en: 'Male', de: 'Männlich', ko: '남성' }, value: 1 },
      { label: { en: 'Non-binary / Prefer not to say', de: 'Nicht-binär / Keine Angabe', ko: '논바이너리 / 답하고 싶지 않음' }, value: 2 },
    ],
  },
  {
    id: 'sleep',
    icon: '🌙',
    text: 'Average hours of restful sleep',
    textDE: 'Stunden erholsamen Schlafs',
    textKO: '평균 수면 시간',
    options: [
      { label: { en: '< 5h', de: '< 5 Std.', ko: '5시간 미만' }, value: 1 },
      { label: { en: '5–6h', de: '5–6 Std.', ko: '5-6시간' }, value: 2 },
      { label: { en: '7h', de: '7 Std.', ko: '7시간' }, value: 3 },
      { label: { en: '8h+', de: '8+ Std.', ko: '8시간 이상' }, value: 4 },
    ],
  },
  {
    id: 'water',
    icon: '💧',
    text: 'Daily water intake',
    textDE: 'Tägliche Wasseraufnahme',
    textKO: '일일 수분 섭취량',
    options: [
      { label: { en: '1–2 glasses', de: '1–2 Gläser', ko: '1-2잔' }, value: 1 },
      { label: { en: '3–5 glasses', de: '3–5 Gläser', ko: '3-5잔' }, value: 2 },
      { label: { en: '6+ glasses', de: '6+ Gläser', ko: '6잔 이상' }, value: 3 },
    ],
  },
  {
    id: 'stress',
    icon: '🧠',
    text: 'Current stress level',
    textDE: 'Aktuelles Stresslevel',
    textKO: '현재 스트레스 수준',
    options: [
      { label: { en: 'Low', de: 'Niedrig', ko: '낮음' }, value: 1 },
      { label: { en: 'Moderate', de: 'Mittel', ko: '보통' }, value: 2 },
      { label: { en: 'High', de: 'Hoch', ko: '높음' }, value: 3 },
    ],
  },
  {
    id: 'seasonal_change',
    icon: '🍂',
    text: 'Does your skin behave differently in summer vs. winter?',
    textDE: 'Verhält sich Ihre Haut im Sommer anders als im Winter?',
    textKO: '여름과 겨울에 피부 상태가 달라지나요?',
    hint: 'Many Europeans experience oilier skin in summer and tighter/drier skin in winter — your routine should adapt',
    hintDE: 'Viele Europäer haben im Sommer fettigere und im Winter trockenere Haut — Ihre Pflege sollte darauf abgestimmt sein.',
    hintKO: '유럽에서는 여름에 더 유분지고 겨울에 더 건조해지는 분들이 많아요 — 루틴도 따라 바뀌어야 합니다',
    options: [
      { label: { en: 'Yes — oilier in summer, drier in winter', de: 'Ja – im Sommer eher ölig, im Winter trockener', ko: '네 — 여름엔 유분, 겨울엔 건조' }, value: 1 },
      { label: { en: 'Yes — dry year-round, worse in winter', de: 'Ja – ganzjährig trocken, im Winter ausgeprägter', ko: '네 — 연중 건조, 겨울에 더 심함' }, value: 2 },
      { label: { en: 'Yes — oily year-round, worse in summer', de: 'Ja – ganzjährig ölig, im Sommer ausgeprägter', ko: '네 — 연중 유분, 여름에 더 심함' }, value: 3 },
      { label: { en: 'No significant change', de: 'Keine wesentliche Veränderung', ko: '큰 변화 없음' }, value: 0 },
    ],
  },
  {
    id: 'texture_pref',
    icon: '🧴',
    text: 'What kind of moisturizer texture do you prefer?',
    textDE: 'Welche Konsistenz bevorzugen Sie bei Ihrer Feuchtigkeitspflege?',
    textKO: '선호하는 보습제 질감이 어떤가요?',
    hint: "We'll recommend products that feel right on YOUR skin — no point prescribing a heavy cream if you hate the feel",
    hintDE: 'Wir empfehlen Produkte, die sich für SIE gut anfühlen — eine schwere Creme nützt nichts, wenn Sie das Gefühl nicht mögen',
    hintKO: '피부에 맞으면서 발림감도 좋아야 꾸준히 쓸 수 있어요 — 선호도를 반영합니다',
    options: [
      { label: { en: 'Light gel or water-based', de: 'Leichtes Gel oder wasserbasiert', ko: '가벼운 젤 또는 수분 베이스' }, value: 0 },
      { label: { en: 'Medium lotion', de: 'Mittlere Lotion', ko: '보통 로션' }, value: 1 },
      { label: { en: 'Rich cream', de: 'Reichhaltige Creme', ko: '리치 크림' }, value: 2 },
      { label: { en: 'Depends on season', de: 'Kommt auf die Jahreszeit an', ko: '계절에 따라 다름' }, value: 3 },
    ],
  },
];
