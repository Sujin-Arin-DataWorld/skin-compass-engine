// src/engine/tailQuestionRouter.ts
// Determines the minimal set of follow-up questions (max 3-6)
// that severity chips cannot answer on their own.

import type { QuestionDef } from "@/engine/questionRoutingV5";
import { AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { FaceMapInference } from "./faceMapInference";

// ── Menopause status question (female 40+ only) ────────────────────────────────

const MENOPAUSE_STATUS_Q: QuestionDef = {
  id: "menopause_status",
  type: "single",
  text: {
    en: "Where are you in your hormonal journey?",
    de: "Wo stehen Sie in Ihrer hormonellen Phase?",
    ko: "호르몬 변화 시기가 어디쯤인가요?",
  },
  hint: {
    en: "Hormonal shifts are the #1 factor in skin changes after 40 — more than age itself. This helps us recommend exactly the right barrier support.",
    de: "Hormonelle Veränderungen sind der wichtigste Faktor für Hautveränderungen ab 40 — wichtiger als das Alter. So können wir die richtige Barrierepflege empfehlen.",
    ko: "40대 이후 피부 변화의 가장 큰 요인은 나이보다 호르몬 변화예요. 정확한 장벽 보호 추천에 활용됩니다.",
  },
  required: false,
  axisHints: { aging: 0.5, hyd: 0.5, bar: 0.5 },
  scientificBasis: {
    method: "Brincat et al. Longitudinal Study",
    validation: "30% collagen loss in first 5 postmenopausal years",
    source: "PMC/NIH — J Cosmetic Dermatology 2025",
  },
  options: [
    {
      id: "meno_pre", score: 0,
      label: { en: "Not yet — regular cycles", de: "Noch nicht — regelmäßige Zyklen", ko: "아직 — 규칙적인 주기" },
    },
    {
      id: "meno_peri", score: 2,
      label: { en: "Perimenopause — cycles becoming irregular", de: "Perimenopause — Zyklen werden unregelmäßig", ko: "갱년기 초기 — 주기가 불규칙" },
      description: {
        en: "You might notice hot flashes, sleep changes, or mood shifts along with cycle changes",
        de: "Hitzewallungen, Schlafveränderungen oder Stimmungsschwankungen möglich",
        ko: "안면홍조, 수면 변화, 기분 변동과 함께 주기 변화가 나타날 수 있어요",
      },
    },
    {
      id: "meno_post_early", score: 3,
      label: { en: "Post-menopause (1-5 years)", de: "Postmenopause (1-5 Jahre)", ko: "폐경 후 1-5년" },
      description: {
        en: "This is when collagen loss is fastest — up to 30% in 5 years. Targeted care now makes the biggest difference.",
        de: "Jetzt ist der Kollagenverlust am stärksten — bis zu 30% in 5 Jahren. Gezielte Pflege macht den größten Unterschied.",
        ko: "콜라겐 소실이 가장 빠른 시기예요 — 5년간 최대 30%. 지금 관리하면 가장 큰 효과를 볼 수 있어요.",
      },
    },
    {
      id: "meno_post_late", score: 2,
      label: { en: "Post-menopause (5+ years)", de: "Postmenopause (5+ Jahre)", ko: "폐경 후 5년 이상" },
    },
    {
      id: "meno_unsure", score: 1,
      label: { en: "Not sure / Prefer not to say", de: "Nicht sicher / Keine Angabe", ko: "잘 모르겠어요 / 답하고 싶지 않아요" },
    },
  ],
};

// ── Skin type change question (30+ only) ───────────────────────────────────────

const SKIN_TYPE_CHANGE_Q: QuestionDef = {
  id: "skin_type_change",
  type: "single",
  text: {
    en: "Has your skin type noticeably changed in recent years?",
    de: "Hat sich Ihr Hauttyp in den letzten Jahren merklich verändert?",
    ko: "최근 몇 년간 피부 타입이 눈에 띄게 달라졌나요?",
  },
  hint: {
    en: "Many people's skin shifts from oily to dry after 40 — this is normal and affects which products work best now",
    de: "Viele Menschen erleben nach 40 einen Wechsel von fettiger zu trockener Haut — das ist normal und beeinflusst die Produktwahl",
    ko: "40대 이후 지성에서 건성으로 변하는 분이 많아요 — 자연스러운 현상이며 지금 맞는 제품이 달라집니다",
  },
  required: false,
  axisHints: { hyd: 0.3, seb: 0.3, sen: 0.2 },
  options: [
    {
      id: "change_oily_to_dry", score: 2,
      label: { en: "Was oily, now dry", de: "War fettig, jetzt trocken", ko: "지성이었는데 건성으로 변함" },
    },
    {
      id: "change_normal_to_sensitive", score: 2,
      label: { en: "Was normal, now more sensitive", de: "War normal, jetzt empfindlicher", ko: "보통이었는데 민감해짐" },
    },
    {
      id: "change_more_spots", score: 1,
      label: { en: "More dark spots than before", de: "Mehr dunkle Flecken als früher", ko: "예전보다 잡티가 늘었음" },
    },
    {
      id: "change_none", score: 0,
      label: { en: "No major change", de: "Keine große Veränderung", ko: "큰 변화 없음" },
    },
  ],
};

// ── Seasonal change question (dehydrated-oily / combination only) ──────────────

const SEASONAL_CHANGE_Q: QuestionDef = {
  id: "seasonal_change",
  type: "single",
  text: {
    en: "Does your skin behave differently in summer vs. winter?",
    de: "Verhält sich Ihre Haut im Sommer anders als im Winter?",
    ko: "여름과 겨울에 피부 상태가 달라지나요?",
  },
  hint: {
    en: "Many Europeans experience oilier skin in summer and tighter/drier skin in winter — your routine should adapt to the season",
    de: "Viele Europäer haben im Sommer fettigere und im Winter trockenere Haut — Ihre Pflege sollte darauf abgestimmt sein.",
    ko: "유럽에서는 여름에 더 유분지고 겨울에 더 건조해지는 분이 많아요 — 루틴도 계절에 맞게 바뀌어야 합니다",
  },
  required: false,
  axisHints: { hyd: 0.3, seb: 0.3 },
  options: [
    {
      id: "season_oily_summer_dry_winter", score: 1,
      label: { en: "Yes — oilier in summer, drier in winter", de: "Ja – im Sommer eher ölig, im Winter trockener", ko: "네 — 여름엔 유분, 겨울엔 건조" },
    },
    {
      id: "season_dry_always", score: 2,
      label: { en: "Dry year-round, worse in winter", de: "Ja – ganzjährig trocken, im Winter ausgeprägter", ko: "연중 건조하고 겨울에 더 심함" },
    },
    {
      id: "season_oily_always", score: 1,
      label: { en: "Oily year-round, worse in summer", de: "Ja – ganzjährig ölig, im Sommer ausgeprägter", ko: "연중 유분지고 여름에 더 심함" },
    },
    {
      id: "season_stable", score: 0,
      label: { en: "No significant change", de: "Keine wesentliche Veränderung", ko: "큰 변화 없음" },
    },
  ],
};

// ── Male adjustments (exported for FaceMapStep and results page) ───────────────

export const MALE_ADJUSTMENTS = {
  /** Axis label overrides for male users (makeup_stability → Skin Comfort) */
  axisLabelOverride: {
    makeup_stability: {
      en: "Skin Comfort",
      de: "Hautkomfort",
      ko: "피부 쾌적도",
    },
  },

  /** Question IDs to skip for male users */
  skipQuestionIds: [
    "AX8_Q1",  // "Do skin changes fluctuate with hormonal cycle?"
    "AX8_Q2",  // "Which phase is worst?"
    // Keep AX8_Q3 (medication question) — relevant for all genders
  ],

  /** Replacement tail question for male users with sensitivity concerns */
  shavingQuestion: {
    id: "MALE_SHAVE",
    type: "single" as const,
    text: {
      en: "Does shaving cause redness, bumps, or irritation?",
      de: "Verursacht Rasieren Rötungen, Pickel oder Reizungen?",
      ko: "면도 후 붉어짐, 뾰루지, 자극이 생기나요?",
    },
    hint: {
      en: "Shaving can damage the skin barrier and trigger inflammation — we'll adjust sensitivity scoring if needed",
      de: "Rasieren kann die Hautbarriere schädigen — wir passen die Empfindlichkeitsbewertung an",
      ko: "면도는 피부 장벽을 손상시킬 수 있어요 — 필요하면 민감도 점수를 조정합니다",
    },
    required: false,
    axisHints: { sen: 0.8, bar: 0.6 },
    options: [
      {
        id: "shave_always", score: 3,
        label: { en: "Yes — almost every time", de: "Ja — fast jedes Mal", ko: "네 — 거의 매번" },
      },
      {
        id: "shave_sometimes", score: 1,
        label: { en: "Sometimes", de: "Manchmal", ko: "가끔" },
      },
      {
        id: "shave_no", score: 0,
        label: { en: "No / I don't shave", de: "Nein / Ich rasiere mich nicht", ko: "아니요 / 면도 안 함" },
      },
    ],
  } as QuestionDef,
};

/**
 * Returns ONLY the questions that face-map severity chips cannot answer.
 * Typical output: 3-6 questions. Maximum: ~8-9.
 *
 * @param inference  Output from inferFromFaceMap()
 * @param ageBracket 0=<20, 1=20s, 2=30s, 3=40s, 4=50s, 5=60+
 * @param gender     0=female, 1=male, 2=other/prefer not to say
 */
export function computeTailQuestions(
  inference: FaceMapInference,
  ageBracket: number,
  gender: number,
): QuestionDef[] {
  const tailQs: QuestionDef[] = [];
  const addedIds = new Set<string>();

  const addQ = (q: QuestionDef | undefined) => {
    if (q && !addedIds.has(q.id)) {
      tailQs.push(q);
      addedIds.add(q.id);
    }
  };

  // ── ALWAYS ASK (2 questions — invisible behaviour, chips can't infer) ────────

  // SPF usage frequency
  const ax0 = AXIS_DEFINITIONS.find(a => a.id === 0);
  addQ(ax0?.questions.find(q => q.id === "AX0_Q1"));

  // Cleansing routine
  addQ(ax0?.questions.find(q => q.id === "AX0_Q2"));

  // ── CONDITIONAL: Sensitivity subtype (max 1 question) ────────────────────────
  if (inference.chipScores.sen > 0) {
    const ax5 = AXIS_DEFINITIONS.find(a => a.id === 5);
    if (inference.patterns.includes("BARRIER_STRESS")) {
      addQ(ax5?.questions.find(q => q.id === "AX5_Q_BARRIER"));
    } else {
      addQ(ax5?.questions.find(q => q.id === "AX5_Q_NEURO"));
    }
  }

  // ── CONDITIONAL: Male shaving question (Step 5-B) ────────────────────────────
  // Male + sensitivity concerns → ask shaving question instead of sensitivity subtype
  if (gender === 1 && inference.chipScores.sen > 0) {
    addQ(MALE_ADJUSTMENTS.shavingQuestion);
  }

  // ── CONDITIONAL: Menopause status (female 40+ only) ──────────────────────────
  if (gender === 0 && ageBracket >= 3) {
    addQ(MENOPAUSE_STATUS_Q);
  }

  // ── CONDITIONAL: Skin type change (30+ only) ─────────────────────────────────
  if (ageBracket >= 2) {
    addQ(SKIN_TYPE_CHANGE_Q);
  }

  // ── CONDITIONAL: Seasonal change (dehydrated-oily / combination only) ────────
  if (inference.skinType === "dehydrated-oily" || inference.skinType === "combination") {
    addQ(SEASONAL_CHANGE_Q);
  }

  // ── CONDITIONAL: Axis clarifiers (max 2, ambiguous axes only) ───────────────
  // The single most informative question per axis
  const CLARIFIER_IDS: Partial<Record<string, string>> = {
    seb:     "AX1_Q1",  // "When does shine appear?"
    hyd:     "AX2_Q1",  // "Tight mask feeling after washing?"
    aging:   "AX6_Q1",  // "Lines visible when face is relaxed?"
    pigment: "AX7_Q2",  // "How long have you had these spots?"
    acne:    "AX4_Q2",  // "How frequently do breakouts occur?"
    texture: "AX3_Q2",  // "How visible are pores without makeup?"
  };

  // Sort ambiguous axes by chip score (highest first = most relevant to clarify)
  const sortedAmbiguous = [...inference.ambiguousAxes]
    .sort((a, b) => inference.chipScores[b] - inference.chipScores[a]);

  let clarifiersAdded = 0;
  for (const axis of sortedAmbiguous) {
    if (clarifiersAdded >= 2) break;
    const qId = CLARIFIER_IDS[axis];
    if (!qId) continue;

    for (const axisDef of AXIS_DEFINITIONS) {
      const q = axisDef.questions.find(q => q.id === qId);
      if (q) {
        addQ(q);
        clarifiersAdded++;
        break;
      }
    }
  }

  // ── CONDITIONAL: Chronic skin condition check ────────────────────────────────
  // Only if SEVERE sensitivity signals are present (don't alarm healthy users)
  if (inference.chipScores.sen >= 20 && inference.chipScores.bar >= 15) {
    const ax9 = AXIS_DEFINITIONS.find(a => a.id === 9);
    addQ(ax9?.questions.find(q => q.id === "AX9_Q1"));
  }

  return tailQs;
}
