/**
 * Display-friendly summary of caution-mode concentration caps.
 * Used by GlobalGateCard's collapsible detail section.
 * Kept separate from routineHelpers to avoid importing internals into the UI.
 */
export interface CautionCapDisplay {
  ingredient: string;
  max: number;
  note_ko: string | null;
  note_en: string | null;
  note_de: string | null;
}

export const CAUTION_CAPS_DISPLAY: CautionCapDisplay[] = [
  {
    ingredient: 'Salicylic Acid (BHA)',
    max: 0.5,
    note_ko: '워시오프 전용',
    note_en: 'wash-off only',
    note_de: 'nur Wash-off',
  },
  {
    ingredient: 'Niacinamide',
    max: 4.0,
    note_ko: null,
    note_en: null,
    note_de: null,
  },
  {
    ingredient: 'L-Ascorbic Acid (Vitamin C)',
    max: 10.0,
    note_ko: 'SAP/MAP 유도체 권장',
    note_en: 'consider SAP/MAP derivatives',
    note_de: 'SAP/MAP-Derivate empfohlen',
  },
  {
    ingredient: 'Retinol',
    max: 0.1,
    note_ko: '주 1회',
    note_en: '1× per week',
    note_de: '1× pro Woche',
  },
  {
    ingredient: 'Azelaic Acid',
    max: 10.0,
    note_ko: null,
    note_en: null,
    note_de: null,
  },
  {
    ingredient: 'Glycolic Acid (AHA)',
    max: 5.0,
    note_ko: '주 1회',
    note_en: '1× per week',
    note_de: '1× pro Woche',
  },
  {
    ingredient: 'Lactic Acid (AHA)',
    max: 5.0,
    note_ko: '주 1회',
    note_en: '1× per week',
    note_de: '1× pro Woche',
  },
];
