// Shared foundation questions for both Analysis and AI Skin Analysis flows.
// Extracted from Analysis.tsx to avoid duplication.

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
    textDE: 'Wie alt sind Sie?',
    textKO: '나이가 어떻게 되세요?',
    hint: 'Skin needs change with age — we tailor our recommendations accordingly',
    hintDE: 'Mit dem Alter verändern sich die Bedürfnisse Ihrer Haut — wir passen unsere Empfehlungen daran an',
    hintKO: '나이에 따라 피부가 필요로 하는 케어가 달라져요',
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
    textDE: 'Welchem Geschlecht ordnen Sie sich zu?',
    textKO: '성별이 어떻게 되세요?',
    hint: 'Hormones influence oil production and skin sensitivity — this helps us personalise your results',
    hintDE: 'Hormone beeinflussen Talgproduktion und Empfindlichkeit — das hilft uns, Ihre Ergebnisse zu personalisieren',
    hintKO: '호르몬은 피지 분비와 민감도에 영향을 미쳐요 — 맞춤 분석에 활용됩니다',
    options: [
      { label: { en: 'Female', de: 'Weiblich', ko: '여성' }, value: 0 },
      { label: { en: 'Male', de: 'Männlich', ko: '남성' }, value: 1 },
      { label: { en: 'Non-binary / Prefer not to say', de: 'Divers / Keine Angabe', ko: '기타 / 답하지 않음' }, value: 2 },
    ],
  },
  {
    id: 'sleep',
    icon: '🌙',
    text: 'How much sleep do you get on average?',
    textDE: 'Wie viele Stunden schlafen Sie durchschnittlich?',
    textKO: '평균 수면 시간이 얼마나 되세요?',
    hint: 'Your skin repairs itself during sleep — less rest means slower recovery and more visible fatigue',
    hintDE: 'Ihre Haut regeneriert sich im Schlaf — weniger Schlaf bedeutet langsamere Erholung und sichtbare Müdigkeit',
    hintKO: '수면 중 피부가 스스로 회복해요 — 수면이 부족하면 피부 재생이 느려집니다',
    options: [
      { label: { en: 'Under 5 hours', de: 'Unter 5 Stunden', ko: '5시간 미만' }, value: 1 },
      { label: { en: '5–6 hours', de: '5–6 Stunden', ko: '5–6시간' }, value: 2 },
      { label: { en: '7–8 hours', de: '7–8 Stunden', ko: '7–8시간' }, value: 3 },
      { label: { en: '8+ hours', de: 'Über 8 Stunden', ko: '8시간 이상' }, value: 4 },
    ],
  },
  {
    id: 'water',
    icon: '💧',
    text: 'How much water do you drink per day?',
    textDE: 'Wie viel Wasser trinken Sie am Tag?',
    textKO: '하루에 물을 얼마나 마시세요?',
    hint: 'Hydration from within keeps your skin barrier strong and plump',
    hintDE: 'Ausreichend trinken stärkt Ihre Hautbarriere und hält die Haut prall',
    hintKO: '충분한 수분 섭취는 피부 장벽을 건강하게 유지해줘요',
    options: [
      { label: { en: 'Under 1 litre', de: 'Unter 1 Liter', ko: '1리터 미만' }, value: 1 },
      { label: { en: '1–2 litres', de: '1–2 Liter', ko: '1–2리터' }, value: 2 },
      { label: { en: 'Over 2 litres', de: 'Über 2 Liter', ko: '2리터 이상' }, value: 3 },
    ],
  },
  {
    id: 'stress',
    icon: '🧠',
    text: 'How stressed are you right now?',
    textDE: 'Wie gestresst fühlen Sie sich gerade?',
    textKO: '요즘 스트레스가 어느 정도예요?',
    hint: 'Stress raises cortisol, which triggers excess oil and breakouts',
    hintDE: 'Stress erhöht Cortisol — das steigert die Talgproduktion und kann Unreinheiten auslösen',
    hintKO: '스트레스는 코르티솔을 높여 피지 분비를 늘리고 트러블을 유발해요',
    options: [
      { label: { en: 'Low', de: 'Gering', ko: '낮음' }, value: 1 },
      { label: { en: 'Moderate', de: 'Mittel', ko: '보통' }, value: 2 },
      { label: { en: 'High', de: 'Hoch', ko: '높음' }, value: 3 },
    ],
  },
  {
    id: 'seasonal_change',
    icon: '🍂',
    text: 'Does your skin change between summer and winter?',
    textDE: 'Verändert sich Ihre Haut zwischen Sommer und Winter?',
    textKO: '여름과 겨울에 피부가 달라지나요?',
    hint: 'Cold air strips moisture, heat boosts oil — your routine should adapt to the season',
    hintDE: 'Kälte entzieht Feuchtigkeit, Hitze steigert die Talgproduktion — Ihre Pflege sollte sich anpassen',
    hintKO: '추위는 수분을 빼앗고 더위는 피지를 늘려요 — 계절에 따라 루틴도 달라져야 합니다',
    options: [
      { label: { en: 'Yes — oilier in summer, drier in winter', de: 'Ja — im Sommer öliger, im Winter trockener', ko: '네 — 여름엔 유분, 겨울엔 건조' }, value: 1 },
      { label: { en: 'Yes — dry all year, worse in winter', de: 'Ja — ganzjährig trocken, im Winter schlimmer', ko: '네 — 연중 건조, 겨울에 더 심함' }, value: 2 },
      { label: { en: 'Yes — oily all year, worse in summer', de: 'Ja — ganzjährig ölig, im Sommer schlimmer', ko: '네 — 연중 유분, 여름에 더 심함' }, value: 3 },
      { label: { en: 'No real change', de: 'Kaum Veränderung', ko: '큰 변화 없음' }, value: 0 },
    ],
  },
  {
    id: 'texture_pref',
    icon: '🧴',
    text: 'What moisturiser texture do you prefer?',
    textDE: 'Welche Konsistenz bevorzugen Sie bei Ihrer Feuchtigkeitspflege?',
    textKO: '어떤 질감의 보습제를 좋아하세요?',
    hint: 'We match products you will actually enjoy using — texture matters for consistency',
    hintDE: 'Wir empfehlen Produkte, die sich für Sie gut anfühlen — nur so bleiben Sie dran',
    hintKO: '발림감이 좋아야 꾸준히 쓸 수 있어요 — 선호도를 반영합니다',
    options: [
      { label: { en: 'Light gel or watery', de: 'Leichtes Gel oder wässrig', ko: '가벼운 젤 / 워터 타입' }, value: 0 },
      { label: { en: 'Medium lotion', de: 'Mittlere Lotion', ko: '로션' }, value: 1 },
      { label: { en: 'Rich cream', de: 'Reichhaltige Creme', ko: '리치 크림' }, value: 2 },
      { label: { en: 'Depends on the season', de: 'Je nach Jahreszeit', ko: '계절에 따라 다름' }, value: 3 },
    ],
  },
];
