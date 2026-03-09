// ─── Types ────────────────────────────────────────────────────────────────────

export type Lang = "en" | "de" | "ko";
export type QuestionType = "single" | "multi" | "image" | "slider";
export type QuestionAnswer = string | string[] | number | null;

export interface LocalizedText {
  en: string;
  de: string;
  ko: string;
}

export interface OptionDef {
  id: string;
  label: LocalizedText;
  description?: LocalizedText;
  /** Plain-language gloss shown via TermTip ⓘ badge (always visible on hover/tap) */
  glossary?: LocalizedText;
  icon?: string;
  score: number; // 0–3 semantic severity
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  labelMin: LocalizedText;
  labelMax: LocalizedText;
}

export interface ConditionalDef {
  ifQuestionId: string;
  ifValues: string[]; // option IDs that trigger injection
  inject: QuestionDef;
}

export interface QuestionDef {
  id: string;
  type: QuestionType;
  text: LocalizedText;
  hint?: LocalizedText;
  required: boolean;
  options?: OptionDef[];
  slider?: SliderConfig;
  conditional?: ConditionalDef;
  axisHints: Partial<Record<string, number>>; // axis-key → weight multiplier
  hideIf?: { questionId: string; values: string[] }; // hide this question if condition met
}

export interface AxisDef {
  id: number;
  name: LocalizedText;
  eyebrow: LocalizedText;
  triggerConcerns: string[]; // empty[] = always shown
  alwaysShow?: boolean;
  questions: QuestionDef[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function t(en: string, de: string, ko: string): LocalizedText { return { en, de, ko }; }

function opt(id: string, score: number, en: string, de: string, ko: string, icon?: string, descEn?: string, descDe?: string, descKo?: string): OptionDef {
  return { id, score, label: { en, de, ko }, icon, ...(descEn ? { description: { en: descEn, de: descDe!, ko: descKo! } } : {}) };
}

/** Attaches a plain-language glossary explanation (rendered via TermTip ⓘ badge) */
function withGloss(option: OptionDef, en: string, de: string, ko: string): OptionDef {
  return { ...option, glossary: { en, de, ko } };
}

// Frequency options (reused across axes)
const FREQ_OPTIONS: OptionDef[] = [
  opt("constantly",   3, "Constantly",            "Ständig",          "항상"),
  opt("frequently",   2, "Frequently",            "Häufig",           "자주"),
  opt("occasionally", 1, "Occasionally",          "Gelegentlich",     "가끔"),
  opt("never",        0, "None / Rarely",         "Nie / Selten",     "없음 / 드물게"),
];

// ─── Axis Definitions ─────────────────────────────────────────────────────────

export const AXIS_DEFINITIONS: AxisDef[] = [

  // ── Axis 0: Global Habits ─────────────────────────────────────────────────
  {
    id: 0,
    name: t("Global Habits & Base Routine", "Allgemeine Gewohnheiten & Basis-Routine", "기본 습관 및 루틴"),
    eyebrow: t("Foundation", "Basis", "기반"),
    triggerConcerns: [],
    alwaysShow: true,
    questions: [
      {
        id: "AX0_Q1",
        type: "single",
        text: t("How often do you apply SPF sunscreen?", "Wie oft tragen Sie Sonnenschutz (LSF) auf?", "SPF 선크림을 얼마나 자주 바르시나요?"),
        required: true,
        axisHints: { ox: 0.9 },
        options: [
          opt("spf_daily",   0, "Always (Daily)", "Immer (täglich)", "항상 (매일)",       "☀️", "Applied every morning regardless of weather", "Jeden Morgen aufgetragen, unabhängig vom Wetter", "날씨에 관계없이 매일 아침 사용"),
          opt("spf_outdoor", 1, "Only Outdoors",  "Nur bei Outdoor-Aktivitäten", "야외 활동 시에만", "🌤️", "Applied before outdoor activities only", "Nur vor Outdoor-Aktivitäten", "야외 활동 전에만 사용"),
          opt("spf_rarely",  3, "Rarely / Never", "Selten / Nie", "드물게 / 전혀",           "🌙", "Rarely or not at all", "Selten oder gar nicht", "드물거나 전혀 사용하지 않음"),
        ],
      },
      {
        id: "AX0_Q2",
        type: "single",
        text: t("What is your typical evening cleansing routine?", "Wie sieht Ihre abendliche Reinigungsroutine aus?", "저녁 세안 루틴은 어떻게 되시나요?"),
        required: true,
        axisHints: { bar: 0.7, seb: 0.4 },
        options: [
          opt("cleanse_double", 0, "Double Cleanse",     "Doppelte Reinigung",        "더블 클렌징",  "🫧", "Oil/balm cleanser + foam/gel", "Öl-/Balsam-Reiniger + Schaum/Gel", "오일/밤 + 폼/젤 클렌저"),
          opt("cleanse_foam",   1, "Foam or Gel Only",   "Nur Schaum oder Gel",       "폼/젤 클렌저만", "💧", "Single foam or gel cleanser", "Nur ein Schaum- oder Gel-Reiniger", "폼 또는 젤 클렌저 단독"),
          opt("cleanse_water",  2, "Water / Wipes Only", "Nur Wasser / Abschminktücher", "물 / 클렌징 티슈만", "🌊", "Water rinse or micellar water only", "Nur Wasserreinigung oder Mizellenwasser", "물 세안 또는 미셀라 워터만"),
        ],
      },
    ],
  },

  // ── Axis 1: Sebum ─────────────────────────────────────────────────────────
  {
    id: 1,
    name: t("Sebum & Oiliness", "Talg & Glanz", "피지 & 유분"),
    eyebrow: t("Axis 01 — Sebum", "Achse 01 — Talg", "축 01 — 피지"),
    triggerConcerns: ["oily_tzone", "oily_nose", "blackheads_forehead", "blackheads_nose", "whiteheads_forehead", "forehead_breakouts"],
    questions: [
      {
        id: "AX1_Q1",
        type: "single",
        text: t("How quickly does your skin become shiny after cleansing?", "Wie schnell wird Ihre Haut nach der Reinigung glänzend?", "세안 후 얼마나 빨리 피부가 번들거리나요?"),
        required: true,
        axisHints: { seb: 1.0, makeup_stability: 0.6 },
        options: [
          opt("shine_1hr",       3, "Constantly (Within 1 hr)",     "Ständig (innerhalb 1 Std.)",      "항상 (1시간 이내)"),
          opt("shine_midday",    2, "Frequently (By midday)",        "Häufig (bis Mittag)",             "자주 (점심 무렵)"),
          opt("shine_afternoon", 1, "Occasionally (Late afternoon)", "Gelegentlich (Nachmittags)",      "가끔 (오후 늦게)"),
          opt("shine_never",     0, "None (Rarely / Never)",         "Nicht (Selten / Nie)",            "없음 (드물게 / 전혀)"),
        ],
      },
      {
        id: "AX1_Q2",
        type: "multi",
        text: t("Which areas get oily first?", "Welche Bereiche werden zuerst ölig?", "어느 부위가 가장 먼저 유분이 생기나요?"),
        required: false,
        axisHints: { seb: 0.5 },
        options: [
          opt("zone_forehead", 1, "Forehead", "Stirn",   "이마"),
          opt("zone_nose",     1, "Nose",     "Nase",    "코"),
          opt("zone_chin",     1, "Chin",     "Kinn",    "턱"),
          opt("zone_cheeks",   1, "Cheeks",   "Wangen",  "볼"),
        ],
      },
      {
        id: "AX1_Q3",
        type: "single",
        text: t("Does oiliness come with a rough or bumpy texture?", "Geht die Öligkeit mit einer rauen oder unebenen Textur einher?", "유분과 함께 거칠거나 울퉁불퉁한 피부 결이 있나요?"),
        required: false,
        axisHints: { texture: 0.8, seb: 0.3 },
        options: [
          opt("tex_severe",   3, "Severe — Very rough & textured",      "Schwer — Sehr rau & strukturiert",    "심각 — 매우 거칠고 울퉁불퉁"),
          opt("tex_moderate", 2, "Moderate — Noticeably rough",         "Mäßig — Merklich rau",                "중간 — 눈에 띄게 거침"),
          opt("tex_mild",     1, "Mild — Slightly bumpy",               "Mild — Leicht uneben",                "약함 — 약간 울퉁불퉁"),
          opt("tex_none",     0, "None — Smooth",                       "Nicht vorhanden — Glatt",             "없음 — 부드러움"),
        ],
      },
    ],
  },

  // ── Axis 2: Hydration ─────────────────────────────────────────────────────
  {
    id: 2,
    name: t("Hydration & Dryness", "Feuchtigkeit & Trockenheit", "수분 & 건조"),
    eyebrow: t("Axis 02 — Hydration", "Achse 02 — Feuchtigkeit", "축 02 — 수분"),
    triggerConcerns: ["dryness_cheeks", "dryness_eyes", "dryness_lips", "neck_dryness", "redness_cheeks", "redness_nose", "neck_sensitivity"],
    questions: [
      {
        id: "AX2_Q1",
        type: "single",
        text: t("Does your skin feel tight and dry on the inside, even if the surface looks oily?", "Fühlt sich Ihre Haut von innen angespannt an – auch wenn die Oberfläche ölig wirkt?", "표면이 유분져 보여도 피부 속은 건조하고 당기는 느낌이 있나요?"),
        required: true,
        axisHints: { hyd: 1.0, bar: 0.6 },
        options: [
          opt("tight_constantly",  3, "Constantly — All day",             "Ständig — Den ganzen Tag",         "항상 — 하루 종일"),
          opt("tight_frequently",  2, "Frequently — Often tight",         "Häufig — Oft angespannt",          "자주 — 자주 당김"),
          opt("tight_after_wash",  1, "Occasionally — Only after washing", "Gelegentlich — Nur nach Reinigung", "가끔 — 세안 후에만"),
          opt("tight_never",       0, "None — Never tight",               "Nie — Nie angespannt",             "없음 — 전혀 당기지 않음"),
        ],
      },
      {
        id: "AX2_Q2",
        type: "single",
        text: t("When does tightness or dryness feel worst?", "Wann ist das Spannungs- oder Trockenheitsgefühl am stärksten?", "건조함이나 당김이 언제 가장 심한가요?"),
        required: false,
        axisHints: { hyd: 0.7, bar: 0.5 },
        options: [
          opt("dry_washing",  2, "Right after washing",           "Direkt nach der Reinigung",       "세안 직후"),
          opt("dry_heated",   2, "In heated or air-conditioned rooms", "In beheizten oder klimatisierten Räumen", "난방 또는 에어컨 실내"),
          opt("dry_outdoors", 2, "Outdoors in cold / wind",       "Draußen bei Kälte / Wind",        "야외 추위/바람"),
          opt("dry_na",       0, "Not applicable",                "Nicht zutreffend",                "해당 없음"),
        ],
      },
      {
        id: "AX2_Q3",
        type: "single",
        text: t("Does your skin flake or peel in specific areas?", "Schuppt oder pellt sich Ihre Haut in bestimmten Bereichen?", "특정 부위에 각질이 일어나거나 벗겨지나요?"),
        required: false,
        axisHints: { hyd: 0.8, bar: 0.5 },
        options: [
          opt("flake_severe", 3, "Severe — Visible peeling / cracking", "Stark — Sichtbares Abschälen / Risse",   "심각 — 눈에 띄는 벗겨짐 / 갈라짐"),
          opt("flake_mild",   1, "Mild — Slight flaking",               "Mild — Leichtes Schuppen",               "약함 — 가벼운 각질"),
          opt("flake_none",   0, "None",                                "Nicht vorhanden",                        "없음"),
        ],
      },
    ],
  },

  // ── Axis 3: Pores ─────────────────────────────────────────────────────────
  {
    id: 3,
    name: t("Pore Visibility", "Porensichtbarkeit", "모공 가시성"),
    eyebrow: t("Axis 03 — Pores", "Achse 03 — Poren", "축 03 — 모공"),
    triggerConcerns: ["large_pores_nose", "large_pores_cheeks", "blackheads_nose", "blackheads_forehead"],
    questions: [
      {
        id: "AX3_Q1",
        type: "image",
        text: t("What shape are your most visible pores?", "Welche Form haben Ihre am deutlichsten sichtbaren Poren?", "가장 잘 보이는 모공의 모양은 어떤가요?"),
        required: false,
        axisHints: { texture: 0.8, seb: 0.4 },
        options: [
          opt("pore_round",    2, "Round (O-shape)",    "Rund (O-Form)",    "둥근형 (O자)",    "⭕",
            "Round, open pores — typical oily T-zone", "Runde, offene Poren – typisch ölige T-Zone", "둥글고 열린 모공 — 유분이 많은 T존"),
          opt("pore_teardrop", 3, "Teardrop (Y-shape)", "Tropfen (Y-Form)", "물방울형 (Y자)", "🔽",
            "Elongated, stretched pores — common with aging / loss of elasticity", "Längliche Poren – typisch bei Hautalterung", "늘어진 모공 — 탄력 저하 시 흔함"),
          opt("pore_notsure",  1, "Not Sure",           "Nicht sicher",     "잘 모르겠어요",  "❓"),
        ],
      },
      {
        id: "AX3_Q2",
        type: "slider",
        text: t("How visible are your pores without makeup?", "Wie sichtbar sind Ihre Poren ohne Make-up?", "메이크업 없이 모공이 얼마나 보이나요?"),
        required: false,
        axisHints: { texture: 1.0 },
        slider: {
          min: 1, max: 5, step: 1, defaultValue: 2,
          labelMin: t("Barely visible", "Kaum sichtbar", "거의 안 보임"),
          labelMax: t("Very prominent", "Sehr deutlich", "매우 뚜렷함"),
        },
      },
      {
        id: "AX3_Q3",
        type: "single",
        text: t("Do pores appear larger in the T-zone vs. the cheeks?", "Erscheinen die Poren in der T-Zone größer als auf den Wangen?", "볼보다 T존의 모공이 더 크게 보이나요?"),
        required: false,
        axisHints: { seb: 0.5, texture: 0.4 },
        options: [
          opt("tzone_yes",    3, "Yes — T-zone much larger",     "Ja — T-Zone viel größer",          "네 — T존이 훨씬 큼"),
          opt("tzone_same",   1, "Same everywhere",              "Überall gleich groß",              "전체적으로 비슷"),
          opt("tzone_no",     0, "No — Cheeks more visible",     "Nein — Wangen sichtbarer",         "아니요 — 볼이 더 뚜렷"),
          opt("tzone_unsure", 0, "Not sure",                     "Nicht sicher",                     "잘 모르겠어요"),
        ],
      },
    ],
  },

  // ── Axis 4: Texture / Breakouts ───────────────────────────────────────────
  {
    id: 4,
    name: t("Breakouts & Texture", "Unreinheiten & Textur", "트러블 & 피부 결"),
    eyebrow: t("Axis 04 — Texture", "Achse 04 — Textur", "축 04 — 피부 결"),
    triggerConcerns: ["forehead_breakouts", "cheek_acne", "hormonal_breakouts", "whiteheads_forehead"],
    questions: [
      {
        id: "AX4_Q1",
        type: "image",
        text: t("What type of breakouts do you experience most?", "Welche Art von Unreinheiten haben Sie am häufigsten?", "주로 어떤 종류의 트러블이 생기나요?"),
        required: true,
        axisHints: { acne: 1.0, texture: 0.5 },
        options: [
          withGloss(
            opt("acne_comedonal", 2, "Closed Comedones",  "Geschlossene Komedonen", "폐쇄면포",          "🟡",
              "Small bumps under skin, skin-colored", "Kleine Erhöhungen unter der Haut", "피부 속 작은 돌기"),
            "Clogged pores that haven't become inflamed yet — appearing as small skin-coloured bumps or milia.",
            "Verstopfte Poren ohne Entzündung — erscheinen als hautfarbene Unebenheiten oder Milien.",
            "아직 염증이 없는 막힌 모공으로 피부색 작은 돌기나 비립종처럼 나타납니다."
          ),
          withGloss(
            opt("acne_pustular",  2, "Pustules",           "Pusteln",                "농포",              "🔴",
              "Red, inflamed with visible pus", "Rot und entzündet mit sichtbarem Eiter", "붉고 염증성, 고름 보임"),
            "Infected pimples — red, inflamed spots with visible white or yellow pus at their centre.",
            "Infizierte Pickel — rote, entzündete Stellen mit sichtbarem weißem oder gelbem Eiter.",
            "감염된 여드름으로 중앙에 흰색 또는 노란색 고름이 보이는 붉고 염증성 병변입니다."
          ),
          withGloss(
            opt("acne_cystic",    3, "Cystic / Nodular",  "Zystisch / Nodulär",    "낭종성 / 결절성",   "🟣",
              "Deep, painful nodules that don't surface", "Tiefe, schmerzhafte Knoten", "깊고 통증 있는 결절"),
            "Deep, painful lesions that form beneath the skin — a more severe form of acne often requiring medical treatment.",
            "Tiefe, schmerzhafte Läsionen unter der Hautoberfläche — schwere Akneform, die oft ärztliche Behandlung erfordert.",
            "피부 깊숙이 형성되는 크고 통증이 있는 병변으로, 의학적 치료가 필요한 심한 형태의 여드름입니다."
          ),
          opt("acne_notsure",   1, "Not Sure",           "Nicht sicher",           "잘 모르겠어요",     "❓"),
        ],
      },
      {
        id: "AX4_Q2",
        type: "single",
        text: t("How frequently do breakouts occur?", "Wie häufig haben Sie Unreinheiten?", "트러블이 얼마나 자주 생기나요?"),
        required: true,
        axisHints: { acne: 1.0 },
        options: [
          opt("acne_constantly",    3, "Constantly — Always active",       "Ständig — Immer aktiv",               "항상 — 계속 생김"),
          opt("acne_frequently",    2, "Frequently — Weekly",              "Häufig — Wöchentlich",                "자주 — 매주"),
          opt("acne_occasionally",  1, "Occasionally — Monthly / Cyclical", "Gelegentlich — Monatlich / Zyklisch", "가끔 — 월별 / 주기적"),
          opt("acne_rarely",        0, "Rarely",                           "Selten",                              "드물게"),
        ],
        conditional: {
          ifQuestionId: "AX4_Q2",
          ifValues: ["acne_occasionally"],
          inject: {
            id: "AX4_Q2_COND",
            type: "single",
            text: t("Do breakouts align with your hormonal / menstrual cycle?", "Stehen Ihre Unreinheiten im Zusammenhang mit Ihrem Hormon- / Menstruationszyklus?", "트러블이 호르몬/월경 주기와 관련이 있나요?"),
            required: false,
            axisHints: { acne: 0.6, sen: 0.3 },
            options: [
              opt("hormonal_yes", 3, "Yes",                "Ja",                   "네"),
              opt("hormonal_no",  0, "No",                 "Nein",                 "아니요"),
              opt("hormonal_na",  0, "N/A",                "Nicht zutreffend",     "해당 없음"),
            ],
          },
        },
      },
      {
        id: "AX4_Q3",
        type: "single",
        text: t("Do breakouts leave marks after healing?", "Hinterlassen Unreinheiten nach dem Abheilen Flecken?", "트러블이 나은 후 흔적이 남나요?"),
        required: false,
        axisHints: { pigment: 0.7, acne: 0.3 },
        options: [
          withGloss(
            opt("mark_pie",   2, "Red / Pink marks (PIE)",   "Rote / rosa Flecken (PIE)",      "붉은/분홍 흔적 (PIE)"),
            "PIE — Post-Inflammatory Erythema. Temporary red/pink flat marks after a pimple heals. Usually fade in weeks to months.",
            "PIE — Post-entzündliches Erythem. Vorübergehende rote/rosa Flecken nach dem Abheilen, meist in Wochen bis Monaten.",
            "PIE(홍반성 색소침착) — 트러블 치유 후 남는 일시적인 붉은/분홍 자국으로, 주로 몇 주에서 몇 달 내 사라집니다."
          ),
          withGloss(
            opt("mark_pih",   3, "Brown / Dark marks (PIH)", "Braune / dunkle Flecken (PIH)",  "갈색/어두운 흔적 (PIH)"),
            "PIH — Post-Inflammatory Hyperpigmentation. Dark marks caused by excess melanin after inflammation. Can persist for months.",
            "PIH — Post-entzündliche Hyperpigmentierung. Dunkle Flecken durch Melaninüberschuss, können Monate anhalten.",
            "PIH(염증 후 과색소침착) — 염증 후 멜라닌 과다로 생기는 갈색/어두운 자국으로 몇 달간 지속될 수 있습니다."
          ),
          withGloss(
            opt("mark_scar",  2, "Indented scars",           "Eingefallene Narben",            "패인 흉터"),
            "Atrophic (indented) scars — permanent textural depressions caused by tissue loss during healing.",
            "Atrophe Narben — dauerhafte Gewebevertiefungen durch Gewebeverlust während der Heilung.",
            "위축성(패인) 흉터 — 치유 과정에서 조직이 손실되어 생기는 영구적인 함몰 자국입니다."
          ),
          opt("mark_none",  0, "No marks",                 "Keine Flecken",                  "흔적 없음"),
          opt("mark_unsure",0, "Not sure",                 "Nicht sicher",                   "잘 모르겠어요"),
        ],
      },
    ],
  },

  // ── Axis 5: Sensitivity & Barrier ─────────────────────────────────────────
  {
    id: 5,
    name: t("Sensitivity & Barrier", "Empfindlichkeit & Barriere", "민감도 & 피부 장벽"),
    eyebrow: t("Axis 05 — Barrier", "Achse 05 — Barriere", "축 05 — 피부 장벽"),
    triggerConcerns: ["redness_cheeks", "redness_nose", "neck_sensitivity", "dryness_cheeks"],
    questions: [
      {
        id: "AX5_Q1",
        type: "single",
        text: t("How does your skin react to hard tap water or dry indoor heating?", "Wie reagiert Ihre Haut auf hartes Leitungswasser oder trockene Innenraumheizung?", "석회질 수돗물이나 건조한 실내 난방에 피부가 어떻게 반응하나요?"),
        required: true,
        axisHints: { sen: 1.0, bar: 0.8 },
        options: [
          opt("barrier_severe",   3, "Severe — Stinging / Burning",    "Schwer — Brennen / Stechen",       "심각 — 따가움 / 화끈거림"),
          opt("barrier_moderate", 2, "Moderate — Tightness / Pulling", "Mäßig — Spannung / Ziehen",        "중간 — 당김"),
          opt("barrier_mild",     1, "Mild — Visible flaking",         "Mild — Sichtbares Schuppen",       "약함 — 눈에 띄는 각질"),
          opt("barrier_none",     0, "None — No reaction",             "Keine — Keine Reaktion",           "없음 — 반응 없음"),
        ],
        conditional: {
          ifQuestionId: "facemap_zones",
          ifValues: ["chin_neck_shaving"],
          inject: {
            id: "AX5_Q1_COND",
            type: "single",
            text: t("Do you experience irritation or redness from shaving?", "Haben Sie nach dem Rasieren Reizungen oder Rötungen?", "면도 후 자극이나 홍조가 생기나요?"),
            required: false,
            axisHints: { sen: 0.7, bar: 0.5 },
            options: [
              opt("shave_yes",    2, "Yes — Frequently",   "Ja — Häufig",          "네 — 자주"),
              opt("shave_mild",   1, "Mild / Sometimes",   "Mild / Manchmal",      "약간 / 가끔"),
              opt("shave_no",     0, "No",                 "Nein",                 "아니요"),
              opt("shave_na",     0, "I don't shave",      "Ich rasiere mich nicht","면도 안 함"),
            ],
          },
        },
      },
      {
        id: "AX5_Q2",
        type: "single",
        text: t("How often does your skin become red or irritated without obvious cause?", "Wie oft wird Ihre Haut ohne erkennbaren Grund rot oder gereizt?", "뚜렷한 원인 없이 얼마나 자주 피부가 붉어지거나 자극받나요?"),
        required: false,
        axisHints: { sen: 1.0 },
        options: FREQ_OPTIONS,
      },
      {
        id: "AX5_Q3",
        type: "single",
        text: t("Can you use most skincare products without issues?", "Können Sie die meisten Hautpflegeprodukte ohne Probleme verwenden?", "대부분의 스킨케어 제품을 문제없이 사용할 수 있나요?"),
        required: false,
        axisHints: { sen: 0.8, bar: 0.5 },
        options: [
          opt("tol_fine",    0, "Most are fine",              "Die meisten sind in Ordnung", "대부분 괜찮음"),
          opt("tol_some",    2, "Some cause reactions",        "Einige verursachen Reaktionen", "일부는 반응 유발"),
          opt("tol_few",     3, "Very few are tolerated",     "Sehr wenige werden vertragen", "극소수만 사용 가능"),
        ],
      },
    ],
  },

  // ── Axis 6: Aging ─────────────────────────────────────────────────────────
  {
    id: 6,
    name: t("Aging & Firmness", "Hautalterung & Festigkeit", "노화 & 탄력"),
    eyebrow: t("Axis 06 — Aging", "Achse 06 — Alterung", "축 06 — 노화"),
    triggerConcerns: ["forehead_lines", "fine_lines_eyes", "nasolabial", "neck_wrinkles", "neck_sagging", "puffiness"],
    questions: [
      {
        id: "AX6_Q1",
        type: "slider",
        text: t("Rate the depth of your most noticeable lines or wrinkles.", "Bewerten Sie die Tiefe Ihrer auffälligsten Linien oder Falten.", "가장 눈에 띄는 주름의 깊이를 평가하세요."),
        required: true,
        axisHints: { aging: 1.0 },
        slider: {
          min: 1, max: 10, step: 1, defaultValue: 3,
          labelMin: t("Fine surface lines", "Feine Oberflächenlinien", "얕은 잔주름"),
          labelMax: t("Deep folds",         "Tiefe Falten",           "깊은 주름"),
        },
      },
      {
        id: "AX6_Q2",
        type: "multi",
        text: t("Where do you notice loss of firmness most?", "Wo bemerken Sie den meisten Festigkeitsverlust?", "탄력 저하가 가장 두드러지는 부위는 어디인가요?"),
        required: false,
        axisHints: { aging: 0.7 },
        options: [
          opt("firm_jaw",         2, "Jawline",         "Kieferlinie",      "턱선"),
          opt("firm_cheeks",      2, "Cheeks",          "Wangen",           "볼"),
          opt("firm_under_eyes",  2, "Under eyes",      "Unteraugenlid",    "눈 아래"),
          opt("firm_neck",        2, "Neck",            "Hals",             "목"),
          opt("firm_nasolabial",  2, "Nasolabial area", "Nasolabialbereich","팔자 부위"),
        ],
      },
      {
        id: "AX6_Q3",
        type: "multi",
        text: t("Do you currently use any anti-aging actives?", "Verwenden Sie derzeit Anti-Aging-Wirkstoffe?", "현재 안티에이징 성분을 사용 중인가요?"),
        required: false,
        axisHints: { aging: -0.2 }, // usage of actives slightly reduces concern score
        options: [
          withGloss(
            opt("active_retinol",  0, "Retinol",    "Retinol",    "레티놀"),
            "Vitamin A derivative that speeds cell turnover — reduces fine lines, acne marks, and uneven tone. Start with low concentrations.",
            "Vitamin-A-Derivat, das die Zellerneuerung beschleunigt — reduziert Fältchen, Akneflecken und ungleichmäßigen Teint.",
            "세포 재생을 촉진하는 비타민 A 유도체로, 잔주름·여드름 흔적·피부톤 개선에 효과적입니다. 낮은 농도부터 시작하세요."
          ),
          opt("active_vitc",     0, "Vitamin C",  "Vitamin C",  "비타민 C"),
          withGloss(
            opt("active_peptide",  0, "Peptides",   "Peptide",    "펩타이드"),
            "Short chains of amino acids that signal your skin to produce more collagen and elastin — key for firmness and anti-aging.",
            "Kurze Aminosäureketten, die die Haut zur Kollagen- und Elastinproduktion anregen — essenziell für Festigkeit.",
            "피부에 콜라겐·엘라스틴 생성을 신호하는 짧은 아미노산 사슬로, 탄력 개선에 핵심적입니다."
          ),
          withGloss(
            opt("active_aha_bha",  0, "AHA / BHA",  "AHA / BHA",  "AHA / BHA"),
            "AHAs (e.g. Glycolic Acid) exfoliate the surface; BHAs (e.g. Salicylic Acid) exfoliate deep inside pores. Both improve texture and tone.",
            "AHAs (z.B. Glykolsäure) exfoliieren die Oberfläche; BHAs (z.B. Salicylsäure) exfoliieren tief in den Poren.",
            "AHA(예: 글리콜릭산)는 표면을, BHA(예: 살리실산)는 모공 안쪽을 각질 제거합니다."
          ),
          opt("active_none",     0, "None",       "Keine",      "없음"),
        ],
      },
    ],
  },

  // ── Axis 7: Pigmentation ──────────────────────────────────────────────────
  {
    id: 7,
    name: t("Pigmentation & Tone", "Pigmentierung & Teint", "색소침착 & 피부톤"),
    eyebrow: t("Axis 07 — Pigment", "Achse 07 — Pigment", "축 07 — 색소"),
    triggerConcerns: ["dark_circles", "pigmentation_cheeks", "pigmentation_mouth"],
    questions: [
      {
        id: "AX7_Q1",
        type: "image",
        text: t("What type of discoloration do you primarily have?", "Welche Art von Verfärbung haben Sie hauptsächlich?", "주로 어떤 유형의 색소 변화가 있나요?"),
        required: true,
        axisHints: { pigment: 1.0, ox: 0.3 },
        options: [
          opt("pig_pih",     2, "Post-acne Marks",        "Akne-Narben / PIH",           "트러블 흔적 (PIH)",    "🟤",
            "Dark marks where blemishes healed", "Dunkle Flecken nach Unreinheiten", "트러블 치유 후 어두운 흔적"),
          opt("pig_sun",     2, "Sun-induced Spots",      "Sonnenflecken",                "자외선 색소침착",     "🌞",
            "Discrete spots from UV exposure", "Diskrete Flecken durch UV-Bestrahlung", "자외선 노출로 인한 반점"),
          opt("pig_melasma", 3, "Melasma-like Patches",   "Melasma-ähnliche Flecken",    "기미성 반점",         "🌑",
            "Larger symmetrical patches, often hormonal", "Größere symmetrische Flecken", "호르몬성 넓은 반점"),
          opt("pig_dull",    1, "General Uneven Tone",    "Allgemein ungleichmäßiger Teint", "전체적인 칙칙함",   "🌫️",
            "Overall dullness without distinct spots", "Allgemeine Mattheit ohne auffällige Flecken", "뚜렷한 반점 없는 전체적 어둠"),
          opt("pig_unsure",  1, "Not Sure",               "Nicht sicher",                 "잘 모르겠어요",       "❓"),
        ],
      },
      {
        id: "AX7_Q2",
        type: "single",
        text: t("How long have you had these spots?", "Wie lange haben Sie diese Flecken schon?", "색소 변화가 생긴 지 얼마나 됐나요?"),
        required: false,
        axisHints: { pigment: 0.6 },
        options: [
          opt("pig_recent",    1, "< 6 months",         "< 6 Monate",           "6개월 미만"),
          opt("pig_6_12",      2, "6–12 months",        "6–12 Monate",          "6–12개월"),
          opt("pig_years",     3, "1+ years",           "1+ Jahre",             "1년 이상"),
          opt("pig_since_kid", 2, "Since childhood",   "Seit der Kindheit",    "어릴 때부터"),
        ],
      },
      {
        id: "AX7_Q3",
        type: "single",
        text: t("How often are you exposed to direct sunlight or UV?", "Wie oft sind Sie direktem Sonnenlicht oder UV ausgesetzt?", "얼마나 자주 직접적인 햇빛이나 자외선에 노출되나요?"),
        required: false,
        axisHints: { ox: 0.8, pigment: 0.5 },
        options: [
          opt("uv_constantly",   3, "Constantly — Daily outdoors",    "Ständig — Täglich draußen",        "항상 — 매일 야외"),
          opt("uv_frequently",   2, "Frequently",                     "Häufig",                           "자주"),
          opt("uv_occasionally", 1, "Occasionally",                   "Gelegentlich",                     "가끔"),
          opt("uv_rarely",       0, "Rarely — Mostly indoors",        "Selten — Meist drinnen",           "드물게 — 주로 실내"),
        ],
      },
    ],
  },

  // ── Axis 8: Hormonal ──────────────────────────────────────────────────────
  {
    id: 8,
    name: t("Hormonal Influence", "Hormoneller Einfluss", "호르몬적 영향"),
    eyebrow: t("Axis 08 — Hormonal", "Achse 08 — Hormonal", "축 08 — 호르몬"),
    triggerConcerns: ["hormonal_breakouts"],
    questions: [
      {
        id: "AX8_Q1",
        type: "single",
        text: t("Do your skin changes fluctuate significantly with your hormonal cycle?", "Schwanken Ihre Hautveränderungen stark mit Ihrem Hormonstatus?", "호르몬 주기에 따라 피부 변화가 뚜렷한가요?"),
        required: true,
        axisHints: { acne: 0.8, sen: 0.4 },
        options: [
          opt("horm_severe", 3, "Severe fluctuations",  "Starke Schwankungen",  "심한 변화"),
          opt("horm_mild",   2, "Mild fluctuations",    "Milde Schwankungen",   "가벼운 변화"),
          opt("horm_none",   0, "None / N/A",           "Keine / N/A",          "없음 / 해당 없음"),
        ],
      },
      {
        id: "AX8_Q2",
        type: "single",
        text: t("Which phase is worst for your skin?", "In welcher Phase ist Ihre Haut am schlechtesten?", "어느 주기에 피부가 가장 좋지 않나요?"),
        required: false,
        axisHints: { acne: 0.4 },
        hideIf: { questionId: "AX8_Q1", values: ["horm_none"] },
        options: [
          opt("phase_before",    2, "Before period",          "Vor der Menstruation",  "생리 전"),
          opt("phase_during",    2, "During period",          "Während der Menstruation", "생리 중"),
          opt("phase_ovulation", 2, "Around ovulation",       "Rund um den Eisprung",  "배란 주변"),
          opt("phase_notsure",   1, "Not sure",               "Nicht sicher",          "잘 모르겠어요"),
        ],
      },
      {
        id: "AX8_Q3",
        type: "single",
        text: t("Are you currently on hormonal medication?", "Nehmen Sie derzeit hormonelle Medikamente ein?", "현재 호르몬 약을 복용 중인가요?"),
        required: false,
        axisHints: { acne: 0.3 },
        options: [
          opt("hmed_yes",    1, "Yes",                 "Ja",                   "예"),
          opt("hmed_no",     0, "No",                  "Nein",                 "아니요"),
          opt("hmed_prefer", 0, "Prefer not to say",  "Keine Angabe",         "말씀드리기 어려워요"),
        ],
      },
    ],
  },

  // ── Axis 9: Neurodermatitis & Psoriasis ───────────────────────────────────
  {
    id: 9,
    name: t("Chronic Skin Conditions", "Chronische Hauterkrankungen", "만성 피부 질환"),
    eyebrow: t("Axis 09 — Clinical Check", "Achse 09 — Klinischer Check", "축 09 — 임상 체크"),
    triggerConcerns: [],
    alwaysShow: true,
    questions: [
      {
        id: "AX9_Q1",
        type: "single",
        text: t("Do you experience chronic, severe itching that disrupts daily life?", "Leiden Sie unter chronischem, starkem Juckreiz, der Ihren Alltag beeinträchtigt?", "일상생활에 지장을 줄 정도의 만성적인 심한 가려움증이 있나요?"),
        required: true,
        axisHints: { sen: 1.0, bar: 0.8 },
        options: FREQ_OPTIONS,
      },
      {
        id: "AX9_Q2",
        type: "single",
        text: t("Have you been diagnosed with Atopic Dermatitis or Psoriasis?", "Wurde bei Ihnen Atopische Dermatitis oder Psoriasis diagnostiziert?", "아토피 피부염이나 건선을 진단받은 적이 있나요?"),
        required: false,
        axisHints: { sen: 1.2, bar: 1.0 },
        options: [
          withGloss(
            opt("dx_atopic",    3, "Yes — Atopic Dermatitis", "Ja — Atopische Dermatitis", "예 — 아토피 피부염"),
            "Atopic Dermatitis (Eczema) — chronic inflammatory condition causing intense itching, redness, and impaired skin barrier. Requires a gentle, barrier-repair-focused routine.",
            "Atopische Dermatitis (Ekzem) — chronisch entzündliche Erkrankung mit starkem Juckreiz und gestörter Hautbarriere.",
            "아토피 피부염(습진) — 심한 가려움, 붉음증, 피부 장벽 기능 저하를 일으키는 만성 염증성 피부 질환입니다."
          ),
          withGloss(
            opt("dx_psoriasis", 3, "Yes — Psoriasis",         "Ja — Psoriasis",            "예 — 건선"),
            "Psoriasis — autoimmune condition that accelerates skin cell turnover, causing thick, scaly plaques. Requires specialised care.",
            "Psoriasis — Autoimmunerkrankung mit beschleunigter Hauterneuerung, die zu schuppigen Plaques führt.",
            "건선 — 피부 세포 재생이 가속화되어 두껍고 비늘 모양의 반점이 생기는 자가면역 질환입니다."
          ),
          withGloss(
            opt("dx_suspected", 2, "Suspected / Undiagnosed", "Vermutet / Nicht diagnostiziert", "의심 / 미진단"),
            "If you suspect Atopic Dermatitis or Psoriasis but haven't been formally diagnosed, we'll factor this into a sensitivity-focused protocol.",
            "Wenn Sie Atopische Dermatitis oder Psoriasis vermuten, berücksichtigen wir dies in Ihrem sensibilitätsfokussierten Protokoll.",
            "아토피 또는 건선이 의심되지만 진단받지 못하셨다면, 민감성 맞춤 프로토콜에 이를 반영합니다."
          ),
          opt("dx_no",        0, "No",                      "Nein",                      "아니요"),
        ],
      },
      {
        id: "AX9_Q3",
        type: "single",
        text: t("Do you experience extreme flaking, cracking, or weeping skin?", "Leiden Sie unter extremem Schuppen, Rissen oder nässender Haut?", "극심한 각질, 피부 갈라짐, 진물이 나는 증상이 있나요?"),
        required: false,
        axisHints: { bar: 1.0, hyd: 0.6, sen: 0.5 },
        options: [
          opt("crack_severe", 3, "Severe — Cracking / Weeping", "Schwer — Risse / Nässend",    "심각 — 갈라짐 / 진물"),
          opt("crack_mild",   1, "Mild flaking",                "Leichtes Schuppen",           "가벼운 각질"),
          opt("crack_none",   0, "None",                        "Nicht vorhanden",             "없음"),
        ],
      },
    ],
  },
];

// ─── Trigger mapping ──────────────────────────────────────────────────────────

const CONCERN_TO_AXES: Record<string, number[]> = {
  // → Sebum (1)
  oily_tzone: [1],         oily_nose: [1],
  blackheads_forehead: [1, 3], blackheads_nose: [1, 3],
  whiteheads_forehead: [1, 4], forehead_breakouts: [1, 4],
  large_pores_nose: [3],   large_pores_cheeks: [3],
  // → Hydration (2)
  dryness_cheeks: [2],     dryness_eyes: [2],
  dryness_lips: [2],       neck_dryness: [2],
  redness_cheeks: [2, 5],  redness_nose: [5],
  neck_sensitivity: [5],
  // → Texture/Breakouts (4)
  cheek_acne: [4],         hormonal_breakouts: [4, 8],
  // → Aging (6)
  forehead_lines: [6],     fine_lines_eyes: [6],
  nasolabial: [6],         neck_wrinkles: [6],
  neck_sagging: [6],       puffiness: [6],
  // → Pigment (7)
  dark_circles: [7],       pigmentation_cheeks: [7],
  pigmentation_mouth: [7],
};

// ─── Routing ──────────────────────────────────────────────────────────────────

export function computeAxisQueue(faceZones: Record<string, number>): number[] {
  const triggered = new Set<number>([0]); // Axis 0 always first
  const selectedIds = Object.keys(faceZones);

  for (const concernId of selectedIds) {
    const axes = CONCERN_TO_AXES[concernId];
    if (axes) axes.forEach((a) => triggered.add(a));
  }

  // Axis 9 always last (global check)
  triggered.add(9);

  return Array.from(triggered).sort((a, b) => a - b);
}

// ─── Answer → axis score mapping ─────────────────────────────────────────────

export type AnswerMap = Record<string, QuestionAnswer>;

export function mapAnswersToAxisScores(answers: AnswerMap): Record<string, number> {
  const rawScores: Record<string, number> = {};

  for (const axis of AXIS_DEFINITIONS) {
    for (const question of axis.questions) {
      const answer = answers[question.id];
      if (answer == null) continue;

      let qScore = 0;
      if ((question.type === "single" || question.type === "image") && typeof answer === "string") {
        const opt = question.options?.find((o) => o.id === answer);
        qScore = opt?.score ?? 0;
      } else if (question.type === "multi" && Array.isArray(answer)) {
        qScore = Math.min(3, answer.length);
      } else if (question.type === "slider" && typeof answer === "number") {
        const s = question.slider!;
        qScore = Math.round(((answer - s.min) / (s.max - s.min)) * 3);
      }

      for (const [axisKey, weight] of Object.entries(question.axisHints)) {
        rawScores[axisKey] = (rawScores[axisKey] ?? 0) + qScore * (weight ?? 0);
      }
    }
  }

  // Normalize each axis to 0–100
  const maxPossible = 9; // 3 questions × score 3
  const normalized: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawScores)) {
    normalized[key] = Math.min(100, Math.max(0, Math.round((val / maxPossible) * 100)));
  }
  return normalized;
}

// ─── atopy flag check ─────────────────────────────────────────────────────────

export function checkAtopyFlag(answers: AnswerMap): boolean {
  const q1 = answers["AX9_Q1"];
  const q2 = answers["AX9_Q2"];
  const highItch = q1 === "constantly" || q1 === "frequently";
  const diagnosed = q2 === "dx_atopic" || q2 === "dx_psoriasis";
  return highItch || diagnosed;
}
