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
  exclusiveIds?: string[]; // if one of these IDs is selected, all other selections are cleared
  /** Hide this question for users outside the given age_bracket range. */
  showForAge?: { min?: number; max?: number };
  /** Hide this question if the user's gender matches any of these values (0=female,1=male,2=other). */
  hideIfGender?: number[];
  /** Clinical derivation — shown as a trust badge in TailQuestionSection */
  clinicalBasis?: {
    method: string;      // e.g. "SOS (Skin Oiliness Scale)"
    validation: string;  // e.g. "Correlates with Sebumeter at r=0.54, p<0.01"
    source: string;      // e.g. "Journal of Dermatological Science, 2020"
  };
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
    eyebrow: t("Your Daily Basics", "Ihre tägliche Basis", "데일리 기본 루틴"),
    triggerConcerns: [],
    alwaysShow: true,
    questions: [
      {
        id: "AX0_Q1",
        type: "single",
        text: t("Do you wear sunscreen every morning, even on cloudy days?", "Tragen Sie jeden Morgen Sonnenschutz auf – auch an bewölkten Tagen?", "흐린 날에도 매일 아침 선크림을 바르시나요?"),
        hint: t(
          "80% of UV reaches you even through clouds. Daily SPF is the #1 anti-aging habit according to dermatologists worldwide.",
          "80% der UV-Strahlung dringt durch Wolken. Täglicher Sonnenschutz ist laut Dermatologen weltweit die wichtigste Anti-Aging-Gewohnheit.",
          "구름을 뚫고도 자외선의 80%가 도달해요. 매일 선크림 바르기는 전 세계 피부과 의사가 인정하는 노화 방지 습관 1위입니다."
        ),
        required: true,
        axisHints: { ox: 0.9 },
        options: [
          opt("spf_daily",   0, "Yes, every morning",    "Ja, jeden Morgen",                  "네, 매일 아침",       "☀️", "Applied every morning regardless of weather", "Jeden Morgen aufgetragen, unabhängig vom Wetter", "날씨에 관계없이 매일 아침 사용"),
          opt("spf_outdoor", 1, "Only when going outside","Nur wenn ich nach draußen gehe",    "야외 나갈 때만",     "🌤️", "Applied before outdoor activities only", "Nur vor Outdoor-Aktivitäten", "야외 활동 전에만 사용"),
          opt("spf_rarely",  3, "Rarely or never",        "Selten oder nie",                   "거의 안 바름",       "🌙", "Rarely or not at all", "Selten oder gar nicht", "드물거나 전혀 사용하지 않음"),
        ],
      },
      {
        id: "AX0_Q2",
        type: "single",
        text: t("How do you wash your face at night?", "Wie reinigen Sie Ihr Gesicht abends?", "저녁에 세안은 어떻게 하시나요?"),
        hint: t(
          "Incomplete cleansing leaves sunscreen and makeup residue that clogs pores and disrupts your skin barrier overnight.",
          "Unvollständige Reinigung hinterlässt Sonnenschutz- und Make-up-Rückstände, die über Nacht die Poren verstopfen.",
          "세안이 불완전하면 선크림·메이크업 잔여물이 모공을 막고 밤새 피부 장벽을 약화시켜요."
        ),
        required: true,
        axisHints: { bar: 0.7, seb: 0.4 },
        options: [
          withGloss(
            opt("cleanse_double", 0, "Oil or balm first, then foam/gel", "Erst Öl oder Balsam, dann Schaum/Gel", "오일/밤 먼저, 그 다음 폼/젤", "🫧"),
            "This is called double cleansing — it removes sunscreen and makeup residue that water alone can't dissolve.",
            "Das nennt man Doppelreinigung — sie entfernt Sonnenschutz- und Make-up-Rückstände, die Wasser allein nicht löst.",
            "더블 클렌징이라고 해요 — 물만으로는 지워지지 않는 선크림·메이크업 잔여물을 확실히 제거해줘요."
          ),
          opt("cleanse_foam",   1, "Foam or gel cleanser only",          "Nur Schaum- oder Gelreiniger",         "폼/젤 클렌저만", "💧"),
          opt("cleanse_water",  2, "Water or wipes only",                "Nur Wasser oder Tücher",               "물 세안 또는 클렌징 티슈만", "🌊"),
        ],
      },
      {
        id: "AX0_Q3",
        type: "single",
        text: t(
          "What type of sunscreen do you usually use?",
          "Welchen Sonnenschutz verwenden Sie normalerweise?",
          "보통 어떤 선크림을 사용하시나요?"
        ),
        hint: t(
          "Waterproof or mineral sunscreens need oil-based cleansing to remove properly — leftover residue can clog pores",
          "Wasserfeste oder mineralische Sonnencremes müssen mit Öl-Reinigung entfernt werden — Rückstände können Poren verstopfen",
          "워터프루프나 무기자차 선크림은 오일 클렌징으로 확실히 제거해야 모공이 막히지 않아요"
        ),
        required: false,
        axisHints: { bar: 0.3, texture: 0.2 },
        options: [
          opt("spf_mineral_wp",    1, "Mineral / Waterproof SPF",   "Mineralisch / Wasserfest",         "무기자차 / 워터프루프"),
          opt("spf_chemical_light",0, "Lightweight daily SPF",      "Leichter Tages-Sonnenschutz",      "가벼운 데일리 선크림"),
          opt("spf_none",          2, "I don't use sunscreen",      "Ich benutze keinen Sonnenschutz",  "선크림을 안 써요"),
        ],
      },
    ],
  },

  // ── Axis 1: Sebum ─────────────────────────────────────────────────────────
  {
    id: 1,
    name: t("Oiliness", "Hautöl & Glanz", "피지 & 유분"),
    eyebrow: t("Oiliness Check", "Fettigkeit-Check", "유분 체크"),
    triggerConcerns: ["oily_tzone", "oily_nose", "blackheads_forehead", "blackheads_nose", "whiteheads_forehead", "forehead_breakouts"],
    questions: [
      {
        id: "AX1_Q1",
        type: "single",
        text: t("After washing your face in the morning, when does the shine appear?", "Wann beginnt Ihre Haut nach der morgendlichen Reinigung zu glänzen?", "아침 세안 후 얼마나 지나면 얼굴이 번들거리나요?"),
        hint: t(
          "This estimates your skin oil production rate — the faster the shine, the more active your oil glands.",
          "Das schätzt Ihre Hautöl-Produktionsrate ein — je schneller der Glanz, desto aktiver Ihre Öl-Drüsen.",
          "피지 분비 속도를 추정하는 질문이에요 — 번들거림이 빨리 올수록 피지선이 활발해요."
        ),
        required: true,
        axisHints: { seb: 1.0, makeup_stability: 0.6 },
        clinicalBasis: {
          method: "Skin Oiliness Scale (SOS)",
          validation: "Sebumeter correlation r=0.54, p<0.01",
          source: "J Dermatological Science",
        },
        options: [
          opt("shine_1hr",       3, "By breakfast time (~1 hr)",       "Bis zum Frühstück (~1 Std.)",     "아침 식사 무렵 (약 1시간)"),
          opt("shine_midday",    2, "Around lunchtime",                "Gegen Mittag",                    "점심 무렵"),
          opt("shine_afternoon", 1, "Late afternoon, barely noticeable","Nachmittags, kaum merklich",      "오후 늦게, 거의 느끼지 못함"),
          opt("shine_never",     0, "Stays matte all day",             "Bleibt den ganzen Tag matt",      "하루 종일 매트함 유지"),
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
          opt("zone_mouth",    1, "Mouth",    "Mund",    "입가/턱"),
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
      {
        id: "AX1_Q4",
        type: "single",
        hideIfGender: [1],  // male users don't typically wear base makeup
        text: t("By 2 PM, what does your base makeup look like?", "Wie sieht Ihr Foundation-Make-up gegen 14 Uhr aus?", "오후 2시경, 베이스 메이크업 상태는 어떤가요?"),
        hint: t(
          "Makeup breakdown speed is a validated proxy for skin oil output in clinical dermatology.",
          "Die Geschwindigkeit des Make-up-Abbaus ist ein klinisch validierter Indikator für die Hautöl-Produktion.",
          "화장 무너짐 속도는 피부과 임상에서 검증된 피지량 추정 지표예요."
        ),
        required: false,
        axisHints: { seb: 0.7, makeup_stability: 0.9 },
        options: [
          opt("makeup_melted",  3, "Patchy and melted away",       "Fleckig und abgetragen",          "얼룩덜룩 녹아내림"),
          opt("makeup_tzone",   2, "T-zone slightly faded",        "T-Zone leicht verblasst",         "T존만 살짝 지워짐"),
          opt("makeup_intact",  0, "Still mostly intact",          "Noch weitgehend intakt",          "거의 그대로 유지"),
          opt("makeup_nomake",  0, "I don't wear base makeup",     "Ich trage kein Foundation-Make-up","베이스 메이크업 안 함"),
        ],
      },
      {
        id: "AX1_Q4_MALE",
        type: "single",
        hideIfGender: [0, 2],  // only shown to male users
        text: t(
          "After shaving, how does your skin feel by midday?",
          "Wie fühlt sich Ihre Haut nach dem Rasieren am Mittag an?",
          "면도 후 정오 무렵 피부 상태는 어떤가요?"
        ),
        hint: t(
          "Post-shave oiliness or tightness reveals your skin's oil behavior and barrier response after mechanical stress.",
          "Öl oder Spannung nach dem Rasieren zeigt das Hautöl- und Barriereverhalten Ihrer Haut nach mechanischem Stress.",
          "면도 후 유분감이나 당김은 기계적 자극 후 피지 분비와 장벽 반응을 파악하는 데 도움이 돼요."
        ),
        required: false,
        axisHints: { seb: 0.5, bar: 0.4, sen: 0.3 },
        options: [
          opt("postshave_tight",  2, "Tight, dry, or irritated",      "Angespannt, trocken oder gereizt", "당기거나 건조하거나 자극받음"),
          opt("postshave_oily",   2, "Oily or shiny",                 "Ölig oder glänzend",               "유분지고 번들거림"),
          opt("postshave_fine",   0, "Comfortable — no issues",       "Angenehm — keine Probleme",        "편안해요 — 문제 없음"),
          opt("postshave_noshave",0, "I don't shave",                 "Ich rasiere mich nicht",           "면도 안 해요"),
        ],
      },
    ],
  },

  // ── Axis 2: Hydration ─────────────────────────────────────────────────────
  {
    id: 2,
    name: t("Hydration & Dryness", "Feuchtigkeit & Trockenheit", "수분 & 건조"),
    eyebrow: t("Dryness Check", "Trockenheits-Check", "건조 체크"),
    triggerConcerns: ["dryness_cheeks", "dryness_eyes", "dryness_lips", "neck_dryness", "redness_cheeks", "redness_nose", "neck_sensitivity"],
    questions: [
      {
        id: "AX2_Q1",
        type: "single",
        text: t("After washing, does your skin feel like wearing a mask that's one size too small?", "Fühlt sich Ihre Haut nach dem Waschen an, als würden Sie eine zu kleine Maske tragen?", "세안 후, 피부가 한 사이즈 작은 마스크를 쓴 것처럼 조이는 느낌이 드나요?"),
        hint: t(
          "That 'squeezing' sensation means your skin barrier is losing water rapidly — your barrier needs extra support to lock in moisture.",
          "Dieses 'Zusammenziehen' bedeutet, dass Ihre Hautschutzbarriere schnell Wasser verliert — sie braucht extra Unterstützung, um Feuchtigkeit einzuschließen.",
          "이 '조이는' 느낌은 피부 장벽에서 수분이 빠르게 증발하고 있다는 신호예요 — 수분을 잡아두는 장벽 케어가 필요해요."
        ),
        required: true,
        axisHints: { hyd: 1.0, bar: 0.6 },
        clinicalBasis: {
          method: "TEWL Sensory Markers",
          validation: "Correlates with Tewameter readings",
          source: "Int J Cosmetic Science",
        },
        options: [
          opt("tight_constantly",  3, "Unbearable — skin might crack",           "Unerträglich — Haut könnte reißen",         "찢어질 것 같아요"),
          opt("tight_frequently",  2, "Tight but fades after moisturizer",       "Angespannt, nachlassend nach Feuchtigkeitspflege", "당기지만 보습제 바르면 나아짐"),
          opt("tight_after_wash",  1, "Brief tightness only after washing",      "Kurze Spannung nur nach dem Waschen",       "세안 직후에만 잠깐"),
          opt("tight_never",       0, "Comfortable — no tightness at all",       "Angenehm — keine Spannung",                 "편안해요 — 전혀 당기지 않음"),
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
    eyebrow: t("Pore Check", "Poren-Check", "모공 체크"),
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
    eyebrow: t("Breakout Check", "Unreinheiten-Check", "트러블 체크"),
    triggerConcerns: ["forehead_breakouts", "cheek_acne", "hormonal_breakouts", "whiteheads_forehead"],
    questions: [
      {
        id: "AX4_Q1",
        type: "multi",
        text: t("What types of troubles do you usually experience?", "Welche Art von Unreinheiten haben Sie am häufigsten?", "주로 어떤 종류의 트러블이 생기나요?"),
        required: true,
        axisHints: { acne: 1.0, texture: 0.5 },
        options: [
          withGloss(
            opt("acne_comedonal", 2, "Skin-colored bumps (whiteheads)", "Hautfarbene Pickelchen (Whiteheads)", "피부 속 하얀 알갱이 (화이트헤드)", "🟡",
              "Small bumps under skin, skin-colored", "Kleine Erhöhungen unter der Haut", "피부 속 작은 돌기"),
            "Clogged pores that haven't become inflamed yet — appearing as small skin-coloured bumps or milia.",
            "Verstopfte Poren ohne Entzündung — erscheinen als hautfarbene Unebenheiten oder Milien.",
            "아직 염증이 없는 막힌 모공으로 피부색 작은 돌기나 비립종처럼 나타납니다."
          ),
          withGloss(
            opt("acne_pustular",  2, "Pus-filled pimples", "Eiter-Pickel", "고름이 있는 뾰루지", "🔴",
              "Red, inflamed with visible pus", "Rot und entzündet mit sichtbarem Eiter", "붉고 염증성, 고름 보임"),
            "Infected pimples — red, inflamed spots with visible white or yellow pus at their centre.",
            "Infizierte Pickel — rote, entzündete Stellen mit sichtbarem weißem oder gelbem Eiter.",
            "감염된 여드름으로 중앙에 흰색 또는 노란색 고름이 보이는 붉고 염증성 병변입니다."
          ),
          withGloss(
            opt("acne_cystic",    3, "Deep, painful lumps", "Tiefe, schmerzhafte Knoten", "크고 깊은 혹 같은 트러블", "🟣",
              "Deep, painful nodules that don't surface", "Tiefe, schmerzhafte Knoten", "깊고 통증 있는 결절"),
            "Deep, painful lesions that form beneath the skin — a more severe form of acne often requiring medical treatment.",
            "Tiefe, schmerzhafte Läsionen unter der Hautoberfläche — schwere Akneform, die oft ärztliche Behandlung erfordert.",
            "피부 깊숙이 형성되는 크고 통증이 있는 병변으로, 의학적 치료가 필요한 심한 형태의 여드름입니다."
          ),
          opt("acne_notsure",   1, "Not Sure", "Nicht sicher", "잘 모르겠어요", "❓"),
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
        type: "multi",
        text: t("Do breakouts leave marks after healing?", "Hinterlassen Unreinheiten nach dem Abheilen Flecken?", "트러블이 나은 후 흔적이 남나요?"),
        required: false,
        axisHints: { pigment: 0.7, acne: 0.3 },
        options: [
          withGloss(
            opt("mark_pie",   2, "Red / pink marks after breakouts",   "Rote / rosa Flecken nach Unreinheiten",      "트러블 후 남는 붉은/분홍 흔적"),
            "PIE — Post-Inflammatory Erythema. Temporary red/pink flat marks after a pimple heals. Usually fade in weeks to months.",
            "PIE — Post-entzündliches Erythem. Vorübergehende rote/rosa Flecken nach dem Abheilen, meist in Wochen bis Monaten.",
            "PIE(홍반성 색소침착) — 트러블 치유 후 남는 일시적인 붉은/분홍 자국으로, 주로 몇 주에서 몇 달 내 사라집니다."
          ),
          withGloss(
            opt("mark_pih",   3, "Dark marks after breakouts", "Dunkle Flecken nach Unreinheiten",  "트러블 후 남는 어두운 흔적"),
            "PIH — Post-Inflammatory Hyperpigmentation. Dark marks caused by excess melanin after inflammation. Can persist for months.",
            "PIH — Post-entzündliche Hyperpigmentierung. Dunkle Flecken durch Melaninüberschuss, können Monate anhalten.",
            "PIH(염증 후 과색소침착) — 염증 후 멜라닌 과다로 생기는 갈색/어두운 자국으로 몇 달간 지속될 수 있어요."
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
    eyebrow: t("Sensitivity Check", "Empfindlichkeits-Check", "민감도 체크"),
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
          ifValues: ["jawline_neck_shaving"],
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
      {
        id: "AX5_Q_BARRIER",
        type: "single",
        text: t("After cleansing, how urgently do you NEED to apply moisturizer?", "Wie dringend müssen Sie nach der Reinigung Feuchtigkeitspflege auftragen?", "세안 후, 보습제를 얼마나 급하게 발라야 하나요?"),
        hint: t(
          "The urgency reflects your barrier's water-holding capacity — the faster you need moisture, the more your barrier is compromised.",
          "Die Dringlichkeit spiegelt die Wasserhaltungskapazität Ihrer Hautschutzbarriere wider.",
          "보습 긴급도는 피부 장벽의 수분 보유력을 반영해요 — 빨리 발라야 할수록 장벽이 약화된 상태입니다."
        ),
        required: false,
        axisHints: { bar: 1.0, hyd: 0.5, sen: 0.3 },
        clinicalBasis: {
          method: "APIA Methodology",
          validation: "European dermatology clinical framework",
          source: "APIA Protocol",
        },
        options: [
          opt("barrier_sos",      3, "Immediately — can't wait 1 minute", "Sofort — kann keine Minute warten",  "즉시 — 1분도 못 참겠어요"),
          opt("barrier_5min",     2, "Within 5 minutes",                  "Innerhalb von 5 Minuten",           "5분 이내"),
          opt("barrier_norush",   0, "No rush — skin stays comfortable",  "Keine Eile — Haut bleibt angenehm", "서두를 필요 없어요"),
        ],
      },
      {
        id: "AX5_Q_NEURO",
        type: "single",
        text: t("When you try a new product, do you feel a brief 'spicy tingle' — like eating something hot?", "Wenn Sie ein neues Produkt ausprobieren, spüren Sie ein kurzes 'scharfes Kribbeln' — wie beim Essen von etwas Heißem?", "새 화장품을 바르면 잠깐이지만 '매운 음식 먹은 듯한 따끔함'이 느껴지나요?"),
        hint: t(
          "This stinging sensation indicates heightened nerve-ending reactivity — a sign of neurosensitive skin.",
          "Dieses Stechen weist auf eine erhöhte Nervenendreaktivität hin — ein Zeichen neurosensitiver Haut.",
          "이 따끔함은 피부 신경 말단의 반응이 높다는 신호예요 — 신경 민감형 피부의 특징입니다."
        ),
        required: false,
        axisHints: { sen: 1.0 },
        clinicalBasis: {
          method: "Lactic Acid Sting Test (proxy)",
          validation: "Standard dermatology office assessment",
          source: "Contact Dermatitis Journal",
        },
        options: [
          opt("neuro_always",  3, "Almost every new product",  "Fast bei jedem neuen Produkt",  "거의 모든 새 제품에서"),
          opt("neuro_some",    2, "Some products",             "Bei einigen Produkten",         "일부 제품에서"),
          opt("neuro_never",   0, "Never noticed",             "Nie bemerkt",                   "느낀 적 없어요"),
        ],
      },
      {
        id: "AX5_Q_INFLAM",
        type: "single",
        text: t("After exercise or spicy food, does your face turn 'apple-red' and stay that way?", "Wird Ihr Gesicht nach Sport oder scharfem Essen 'apfelrot' und bleibt das lange so?", "운동하거나 매운 음식 먹으면 얼굴이 '사과처럼' 빨개지고 오래 지속되나요?"),
        hint: t(
          "Prolonged flushing signals elevated blood vessel reactivity — a hallmark of inflammatory sensitivity.",
          "Anhaltende Rötung signalisiert eine erhöhte Blutgefäßreaktivität — ein Zeichen entzündlicher Empfindlichkeit.",
          "오래 지속되는 홍조는 혈관 반응성이 높은 염증 민감형 피부의 신호예요."
        ),
        required: false,
        axisHints: { sen: 1.0 },
        options: [
          opt("inflam_severe", 3, "Intense redness, 30+ minutes",   "Starke Rötung, 30+ Minuten",    "강한 홍조, 30분 이상 지속"),
          opt("inflam_mild",   1, "Slight flush, fades quickly",    "Leichte Rötung, verblasst schnell", "가볍게 붉어졌다 금방 사라짐"),
          opt("inflam_none",   0, "No noticeable flushing",         "Keine merkliche Rötung",        "특별한 홍조 없음"),
        ],
      },
      {
        id: "AX5_Q_SHAVE",
        type: "single",
        hideIfGender: [0, 2],  // only shown to male users
        text: t(
          "Do you experience razor burn, bumps, or persistent redness after shaving?",
          "Haben Sie Rasierbrand, Pickel oder anhaltende Rötung nach dem Rasieren?",
          "면도 후 면도 자극, 모낭염, 또는 지속적인 홍조가 생기나요?"
        ),
        hint: t(
          "Post-shave irritation disrupts the skin barrier and can lead to chronic sensitivity — it's a significant barrier stressor for male skin.",
          "Rasierirritationen stören die Hautschutzbarriere und können zu chronischer Empfindlichkeit führen — ein wesentlicher Barrierestressor für Männerhaut.",
          "면도 자극은 피부 장벽을 손상시키고 만성 민감성으로 이어질 수 있어요 — 남성 피부의 주요 장벽 스트레스 요인입니다."
        ),
        required: false,
        axisHints: { bar: 0.8, sen: 0.6 },
        options: [
          opt("razburn_severe", 3, "Severe — persistent redness or bumps", "Stark — anhaltende Rötung oder Pickel", "심각 — 지속적인 홍조 또는 모낭염"),
          opt("razburn_mild",   1, "Mild — brief redness only",            "Mild — nur kurze Rötung",               "약함 — 짧은 홍조만"),
          opt("razburn_none",   0, "None — skin tolerates shaving well",   "Keine — Haut verträgt Rasieren gut",    "없음 — 면도 잘 버텨요"),
          opt("razburn_na",     0, "I don't shave",                        "Ich rasiere mich nicht",                "면도 안 해요"),
        ],
      },
    ],
  },

  // ── Axis 6: Aging ─────────────────────────────────────────────────────────
  {
    id: 6,
    name: t("Aging & Firmness", "Straffheit & Falten", "노화 & 탄력"),
    eyebrow: t("Firmness & Lines", "Straffheit & Falten", "탄력 & 주름"),
    triggerConcerns: ["forehead_lines", "fine_lines_eyes", "nasolabial", "neck_wrinkles", "neck_sagging", "puffiness"],
    questions: [
      {
        id: "AX6_Q1",
        type: "slider",
        text: t("When you smile and then relax, how visible are the lines that remain?", "Wenn Sie lächeln und sich dann entspannen — wie sichtbar sind die verbleibenden Linien?", "웃었다 표정을 풀었을 때, 남아있는 주름이 얼마나 보이나요?"),
        hint: t(
          "Static wrinkles (visible at rest) indicate deeper collagen loss than dynamic ones (visible only when moving).",
          "Statische Falten (in Ruhe sichtbar) zeigen tieferen Kollagenverlust als dynamische (nur bei Bewegung sichtbar).",
          "표정을 안 지어도 보이는 주름은 콜라겐 손실이 깊다는 뜻이에요."
        ),
        required: true,
        showForAge: { min: 1 },
        axisHints: { aging: 1.0 },
        clinicalBasis: {
          method: "Fitzpatrick Wrinkle Scale",
          validation: "Clinical grading system for photoaging",
          source: "Dermatologic Surgery",
        },
        slider: {
          min: 1, max: 10, step: 1, defaultValue: 3,
          labelMin: t("Gone — completely smooth", "Weg — völlig glatt",      "완전히 사라짐"),
          labelMax: t("Deep, clearly visible",    "Tief, deutlich sichtbar", "깊고 선명하게 보임"),
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
          opt("firm_under_eyes",  2, "Around the eyes", "Um die Augen",     "눈 주변"),
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
            "AHA(예: 글리콜릭산)는 표면을, BHA(예: 살리실산)는 모공 안쪽을 각질 제거해요."
          ),
          opt("active_none",     0, "None",       "Keine",      "없음"),
        ],
      },
    ],
  },

  // ── Axis 7: Pigmentation ──────────────────────────────────────────────────
  {
    id: 7,
    name: t("Pigmentation & Tone", "Flecken & Hautton", "색소침착 & 피부톤"),
    eyebrow: t("Dark Spots & Tone", "Flecken & Hautton", "잡티 & 피부톤"),
    triggerConcerns: ["dark_circles", "pigmentation_cheeks", "pigmentation_mouth"],
    questions: [
      {
        id: "AX7_Q1",
        type: "multi",
        text: t("What type of discoloration do you primarily have?", "Welche Art von Verfärbung haben Sie hauptsächlich?", "주로 어떤 유형의 색소 변화가 있나요?"),
        required: true,
        axisHints: { pigment: 1.0, ox: 0.3 },
        options: [
          opt("pig_pih",     2, "Dark marks after breakouts", "Dunkle Flecken nach Unreinheiten", "트러블 후 어두운 흔적", "🟤",
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
    eyebrow: t("Hormonal Influence", "Hormoneller Einfluss", "호르몬 영향"),
    triggerConcerns: ["hormonal_breakouts"],
    questions: [
      {
        id: "AX8_Q1",
        type: "single",
        text: t("Do your skin changes fluctuate significantly with your hormonal cycle?", "Schwanken Ihre Hautveränderungen stark mit Ihrem Hormonstatus?", "호르몬 주기에 따라 피부 변화가 뚜렷한가요?"),
        required: true,
        showForAge: { min: 1, max: 4 },
        hideIfGender: [1],
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
        type: "multi",
        text: t("Are you currently taking any hormonal medication?", "Nehmen Sie derzeit Medikamente ein?", "현재 복용 중인 약이 있나요?"),
        required: false,
        axisHints: { acne: 0.3 },
        exclusiveIds: ["hormone_none"],
        options: [
          opt("hormone_bc",       1, "Contraceptive pill",                     "Antibabypille",                              "피임약"),
          opt("hormone_hormonal", 1, "Hormone therapy (HRT)",                  "Hormontherapie (HRT)",                       "호르몬 치료제 (에스트로겐·프로게스테론 등)"),
          opt("hormone_adhd",     1, "ADHD medication",                        "ADHS-Medikament",                            "ADHD 약 (리탈린·콘서타 등)"),
          opt("hormone_antidep",  1, "Antidepressants / Anxiolytics",          "Antidepressiva / Anxiolytika",               "항우울제 / 항불안제"),
          opt("hormone_thyroid",  1, "Thyroid medication",                     "Schilddrüsenmedikament",                     "갑상선 약"),
          opt("hormone_other",    1, "Other prescription medication",          "Andere verschreibungspflichtige Medikamente","기타 처방약 복용 중"),
          opt("hormone_none",     0, "None",                                   "Keine",                                      "복용하지 않음"),
          opt("hormone_unsure",   0, "Not sure",                               "Nicht sicher",                               "잘 모르겠어요"),
        ],
      },
    ],
  },

  // ── Axis 9: Neurodermatitis & Psoriasis ───────────────────────────────────
  {
    id: 9,
    name: t("Chronic Skin Conditions", "Chronische Hauterkrankungen", "만성 피부 질환"),
    eyebrow: t("Chronic Skin Check", "Chronische Haut-Check", "만성 피부 체크"),
    triggerConcerns: [],
    alwaysShow: true,
    questions: [
      {
        id: "AX9_Q1",
        type: "single",
        text: t("Do you sometimes have an itch that keeps coming back, no matter what you do?", "Haben Sie manchmal Juckreiz, der immer wieder kommt, egal was Sie tun?", "뭘 해도 자꾸 돌아오는 가려움이 있나요?"),
        hint: t(
          "Recurring itch can be an early sign of atopic dermatitis or psoriasis — we ask to ensure safe product recommendations.",
          "Wiederkehrender Juckreiz kann ein frühes Zeichen für Atopische Dermatitis oder Psoriasis sein — wir fragen, um sichere Produktempfehlungen zu gewährleisten.",
          "반복되는 가려움은 아토피나 건선의 초기 신호일 수 있어요 — 안전한 제품 추천을 위해 확인해요."
        ),
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
            "Atopische Dermatitis (Ekzem) — chronisch entzündliche Erkrankung mit starkem Juckreiz und gestörter Hautschutzbarriere.",
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
            "아토피 또는 건선이 의심되지만 진단받지 못하셨다면, 민감성 맞춤 프로토콜에 이를 반영해요."
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
  // Forehead
  oily_f:        [1],
  blackheads_f:  [1, 3],
  whiteheads_f:  [1, 4],
  lines_f:       [6],
  breakouts_f:   [1, 4],

  // Eyes
  fine_lines_e:  [6],
  dark_circles_e:[7],
  puffiness_e:   [6],
  dryness_e:     [2],

  // Nose
  pores_n:       [3],
  blackheads_n:  [1, 3],
  oily_n:        [1],
  redness_n:     [5],

  // Cheeks
  redness_c:     [5],
  acne_c:        [4],
  dryness_c:     [2],
  pigment_c:     [7],
  pores_c:       [3],

  // Mouth
  dryness_m:     [2],
  nasolabial:    [6],
  pigment_m:     [7],
  perioral_m:    [5],

  // Jawline
  hormonal_j:    [4, 8],
  cystic_j:      [4, 8],
  texture_j:     [4],
  sagging_j:     [6],

  // Neck
  neck_lines:    [6],
  sagging:       [6],
  neck_red:      [5],
  neck_dry:      [2],
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
