import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore } from "@/store/i18nStore";
import type { QuestionDef, LocalizedText, QuestionAnswer } from "@/engine/questionRoutingV5";
import { MALE_ADJUSTMENTS } from "@/engine/tailQuestionRouter";
import { useTheme } from "next-themes";
import facemapImg from "@/assets/facemap_final.png";
import { inferFromFaceMap } from "@/engine/faceMapInference";
import type { FaceMapInference } from "@/engine/faceMapInference";
import { computeTailQuestions } from "@/engine/tailQuestionRouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type ZoneId =
  | "forehead"
  | "nose"
  | "eyes"
  | "cheeks"
  | "mouth"
  | "jawline"
  | "neck";

type Lang = "en" | "de" | "ko";
type FaceMapPhase = "mapping" | "followup" | "ready";

interface Concern {
  id: string;
  label: Record<Lang, string>;
  axis: string;
  glossary?: Record<Lang, string>;             // for TermTip ⓘ badge
  showForAge?: { min?: number; max?: number }; // age bracket filter
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const COLOR_PALETTE = {
  dark_selected:  "#f7e28dff",
  light_selected: "#8EA273",
  dark_idle:      "rgba(174, 226, 255, 0.5)",
  light_idle:     "#8EA273",
};

// ─── Zone labels ──────────────────────────────────────────────────────────────
const ZONE_LABELS: Record<ZoneId, Record<Lang, string>> = {
  forehead: { en: "Forehead",      de: "Stirn",         ko: "이마"        },
  nose:     { en: "Nose & T-Zone", de: "Nase & T-Zone", ko: "코 & T존"    },
  eyes:     { en: "Eye Area",      de: "Augenpartie",   ko: "눈가 & 눈밑"  },
  cheeks:   { en: "Cheeks",        de: "Wangen",        ko: "볼"          },
  mouth:    { en: "Mouth Area",    de: "Mundpartie",    ko: "입가"        },
  jawline:  { en: "Jawline",       de: "Kieferlinie",   ko: "턱선"        },
  neck:     { en: "Neck",          de: "Hals",          ko: "목"          },
};

// ─── Zone concern data ────────────────────────────────────────────────────────
const ZONE_CONCERNS: Record<ZoneId, Concern[]> = {
  forehead: [
    { id: "oily_f",       label: { en: "Oily / Shiny",      de: "Ölig / Glänzend",           ko: "이마 번들거림"       }, axis: "seb",
      glossary: { en: "Excess oil (sebum) from overactive glands. Common in the T-zone where oil glands are densest.", de: "Überschüssiger Talg aus überaktiven Drüsen. Häufig in der T-Zone, wo die Talgdrüsen am dichtesten sind.", ko: "피지샘이 활발해서 생기는 과도한 유분이에요. 피지샘이 가장 밀집한 T존에서 흔해요." } },
    { id: "blackheads_f", label: { en: "Blackheads",         de: "Mitesser",                  ko: "까만 점 같은 모공"   }, axis: "texture",
      glossary: { en: "Open pores clogged with oxidized oil — they turn dark when exposed to air, not because of dirt.", de: "Offene Poren, verstopft mit oxidiertem Talg — sie werden durch Luftkontakt dunkel, nicht durch Schmutz.", ko: "피지가 공기와 만나 산화되어 검게 변한 열린 모공이에요 — 때가 낀 게 아니에요." } },
    { id: "whiteheads_f", label: { en: "Whiteheads",         de: "Hautfarbene Pickelchen",     ko: "피부 속 좁쌀 돌기"   }, axis: "texture",
      glossary: { en: "Closed pores trapped under the skin surface — small bumps you can feel but barely see.", de: "Geschlossene Poren unter der Hautoberfläche — kleine Erhöhungen, die man fühlt, aber kaum sieht.", ko: "피부 표면 아래 막힌 모공이에요 — 만져지지만 잘 안 보이는 작은 돌기예요." } },
    { id: "lines_f",      label: { en: "Forehead Lines",     de: "Stirnfalten",               ko: "이마 주름"           }, axis: "aging", showForAge: { min: 1 },
      glossary: { en: "Horizontal lines on the forehead from repeated muscle movement. Deeper lines indicate collagen loss.", de: "Horizontale Linien auf der Stirn durch wiederholte Muskelbewegung. Tiefere Linien deuten auf Kollagenverlust hin.", ko: "반복적인 근육 움직임으로 생기는 이마 가로 주름이에요. 깊을수록 콜라겐 손실을 의미해요." } },
    { id: "breakouts_f",  label: { en: "Breakouts",          de: "Unreinheiten",              ko: "트러블"              }, axis: "texture",
      glossary: { en: "Inflamed spots from clogged pores and bacteria. Forehead breakouts often relate to oil overproduction or hair products.", de: "Entzündete Stellen durch verstopfte Poren und Bakterien. Stirn-Unreinheiten hängen oft mit Talgüberproduktion oder Haarprodukten zusammen.", ko: "모공이 막히고 세균이 번식해서 생기는 염증이에요. 이마 트러블은 피지 과다나 헤어 제품이 원인일 수 있어요." } },
  ],
  nose: [
    { id: "blackheads_n", label: { en: "Blackheads (Nose)",   de: "Mitesser (Nase)",           ko: "코 위 까만 점들"     }, axis: "texture",
      glossary: { en: "The nose has the highest oil gland density on your face — blackheads here are extremely common and not a hygiene issue.", de: "Die Nase hat die höchste Talgdrüsendichte im Gesicht — Mitesser hier sind extrem häufig und kein Hygieneproblem.", ko: "코는 얼굴에서 피지샘이 가장 밀집한 부위예요 — 여기 블랙헤드는 매우 흔하고 위생 문제가 아니에요." } },
    { id: "pores_n",      label: { en: "Enlarged Pores",      de: "Vergrößerte Poren",         ko: "딸기 씨 같은 모공"  }, axis: "texture",
      glossary: { en: "Pores look larger when filled with oil or when skin loses elasticity. Round pores = oil; teardrop pores = aging.", de: "Poren wirken größer, wenn sie mit Talg gefüllt sind oder die Elastizität nachlässt. Rund = Öl; Tropfenform = Alterung.", ko: "모공은 피지로 차 있거나 탄력이 떨어지면 더 커 보여요. 둥근 모공 = 피지; 물방울 모공 = 노화 신호." } },
    { id: "oily_n",       label: { en: "Always Shiny / Oily", de: "Immer glänzend / fettig",   ko: "코가 항상 번들거림"  }, axis: "seb",
      glossary: { en: "The nose is the core of the T-zone — if it's always shiny, your sebum production rate is elevated.", de: "Die Nase ist das Zentrum der T-Zone — wenn sie immer glänzt, ist Ihre Talgproduktion erhöht.", ko: "코는 T존의 중심이에요 — 항상 번들거린다면 피지 분비가 활발한 상태예요." } },
    { id: "redness_n",    label: { en: "Redness around Nose", de: "Rötung um die Nase",        ko: "코 주변 붉어짐"     }, axis: "sen",
      glossary: { en: "Redness around the nose can signal irritation, broken capillaries, or early rosacea. Worth monitoring.", de: "Rötung um die Nase kann auf Reizung, geplatzte Kapillaren oder frühe Rosazea hindeuten.", ko: "코 주변 붉어짐은 자극, 모세혈관 확장, 초기 주사(로제이시아)의 신호일 수 있어요." } },
  ],
  eyes: [
    { id: "dark_circles_e", label: { en: "Dark Circles",          de: "Dunkle Augenringe",         ko: "다크서클"            }, axis: "pigment",
      glossary: { en: "Dark circles are often genetic or from thin under-eye skin showing blood vessels beneath. Sleep and hydration help but may not eliminate them.", de: "Augenringe sind oft genetisch bedingt oder entstehen durch dünne Haut, die Blutgefäße durchscheinen lässt.", ko: "다크서클은 유전적이거나 얇은 눈밑 피부 아래 혈관이 비치는 거예요. 수면과 수분이 도움되지만 완전히 없애기 어려울 수 있어요." } },
    { id: "fine_lines_e",   label: { en: "Fine Lines",            de: "Feine Linien",              ko: "잔주름"              }, axis: "aging", showForAge: { min: 1 },
      glossary: { en: "The eye area has the thinnest skin on your face (0.5mm) — lines appear here first as collagen declines.", de: "Die Augenpartie hat die dünnste Haut im Gesicht (0,5mm) — Linien erscheinen hier zuerst bei Kollagenabbau.", ko: "눈가는 얼굴에서 가장 얇은 피부(0.5mm)예요 — 콜라겐이 줄면 이곳에서 가장 먼저 주름이 나타나요." } },
    { id: "puffiness_e",    label: { en: "Puffiness / Swelling",  de: "Schwellungen / Tränensäcke", ko: "눈가 붓기"          }, axis: "aging",
      glossary: { en: "Puffiness comes from fluid retention or fat pad shifting. Worse in the morning, with salt, or with allergies.", de: "Schwellungen entstehen durch Flüssigkeitsansammlungen oder Verschiebung der Fettpolster. Morgens, bei Salz oder Allergien schlimmer.", ko: "부기는 수분 정체나 지방 패드 이동으로 생겨요. 아침에, 짠 음식 후, 알레르기 시 더 심해져요." } },
    { id: "dryness_e",      label: { en: "Dryness / Rough",       de: "Trockenheit / Rau",         ko: "눈가 당김 / 까칠함"  }, axis: "hyd",
      glossary: { en: "The eye area lacks oil glands — it dries out faster than anywhere else on your face and needs dedicated hydration.", de: "Die Augenpartie hat kaum Talgdrüsen — sie trocknet schneller aus als jede andere Gesichtszone.", ko: "눈가에는 피지샘이 거의 없어서 얼굴 중 가장 빨리 건조해져요 — 전용 수분 관리가 필요해요." } },
  ],
  cheeks: [
    { id: "redness_c",  label: { en: "Redness / Flushing",   de: "Rötung / Flush",            ko: "쉽게 붉어짐 / 열감"  }, axis: "sen",
      glossary: { en: "Cheek redness that lingers may indicate rosacea — a chronic condition affecting facial blood vessels. Triggers include heat, alcohol, and spicy food.", de: "Anhaltende Wangenrötung kann auf Rosazea hindeuten — eine chronische Erkrankung der Gesichtsblutgefäße.", ko: "볼의 지속적인 붉어짐은 주사(로제이시아)의 신호일 수 있어요 — 열, 알코올, 매운 음식이 악화시켜요." } },
    { id: "acne_c",     label: { en: "Breakouts / Acne",     de: "Unreinheiten / Akne",       ko: "트러블"              }, axis: "acne",
      glossary: { en: "Cheek breakouts can be triggered by phone screens, pillowcases, or touching your face — external bacteria meeting pores.", de: "Wangen-Unreinheiten können durch Handybildschirme, Kissenbezüge oder Gesichtsberührungen ausgelöst werden.", ko: "볼 트러블은 휴대폰 화면, 베갯잇, 얼굴 만지는 습관 — 외부 세균이 모공을 만나서 생길 수 있어요." } },
    { id: "dryness_c",  label: { en: "Dryness / Tightness",  de: "Trockenheit / Spannung",    ko: "건조 / 당김"         }, axis: "hyd",
      glossary: { en: "Cheeks have fewer oil glands than the T-zone — they're often the first area to feel tight or flaky, especially in winter.", de: "Wangen haben weniger Talgdrüsen als die T-Zone — sie fühlen sich oft zuerst trocken oder schuppig an, besonders im Winter.", ko: "볼은 T존보다 피지샘이 적어서 건조나 각질이 가장 먼저 나타나는 부위예요 — 특히 겨울에 심해져요." } },
    { id: "pigment_c",  label: { en: "Dark Spots / Pigment", de: "Flecken & Hautton",         ko: "잡티 / 얼룩"         }, axis: "pigment",
      glossary: { en: "Dark spots from sun damage or post-breakout marks. UV exposure makes them darker — daily SPF is essential for fading.", de: "Dunkle Flecken durch Sonnenschäden oder nach Unreinheiten. UV-Strahlung verschlimmert sie — täglicher LSF ist zum Verblassen essenziell.", ko: "자외선 손상이나 트러블 흔적으로 생긴 잡티예요. 자외선에 노출되면 더 진해져요 — 매일 선크림이 필수예요." } },
    { id: "pores_c",    label: { en: "Visible Pores",        de: "Sichtbare Poren",           ko: "볼 모공이 눈에 띔"   }, axis: "texture",
      glossary: { en: "Visible pores on cheeks often have a teardrop shape — a sign of elasticity loss rather than just oil production.", de: "Sichtbare Poren auf den Wangen haben oft eine Tropfenform — ein Zeichen für Elastizitätsverlust, nicht nur Talgproduktion.", ko: "볼의 눈에 띄는 모공은 물방울 모양인 경우가 많아요 — 피지보다는 탄력 저하의 신호예요." } },
  ],
  mouth: [
    { id: "nasolabial", label: { en: "Smile Lines",              de: "Nasolabialfalten",          ko: "팔자 주름"           }, axis: "aging", showForAge: { min: 1 },
      glossary: { en: "Smile lines deepen as the cheek fat pad descends with age and collagen loss — they're a normal part of facial aging.", de: "Nasolabialfalten vertiefen sich, wenn das Wangenfettpolster mit dem Alter absinkt — ein normaler Teil der Gesichtsalterung.", ko: "팔자주름은 나이 들면서 볼 지방이 내려가고 콜라겐이 줄면 깊어져요 — 자연스러운 노화 현상이에요." } },
    { id: "dryness_m",  label: { en: "Dryness around Mouth",     de: "Trockenheit um den Mund",   ko: "입 주변 건조 / 당김"  }, axis: "hyd",
      glossary: { en: "The mouth area is exposed to constant movement (eating, talking) which can crack dry skin. Lip-licking makes it worse.", de: "Die Mundpartie ist ständiger Bewegung ausgesetzt (Essen, Sprechen), was trockene Haut rissig machen kann.", ko: "입 주변은 먹고 말하면서 계속 움직여서 건조한 피부가 갈라지기 쉬워요. 입술 핥는 습관은 더 악화시켜요." } },
    { id: "pigment_m",  label: { en: "Dark Spots near Mouth",    de: "Dunkle Flecken am Mund",    ko: "입가 잡티 / 칙칙함"  }, axis: "pigment",
      glossary: { en: "Darkening around the mouth can be hormonal (melasma) or from sun damage. Common in perimenopause.", de: "Verdunkelung um den Mund kann hormonell (Melasma) oder durch Sonnenschäden bedingt sein. Häufig in der Perimenopause.", ko: "입가 칙칙함은 호르몬(기미)이나 자외선 손상일 수 있어요. 갱년기 초기에 흔해요." } },
    { id: "perioral_m", label: { en: "Irritation around Mouth",  de: "Reizung um den Mund",       ko: "입 주변 자극 / 따가움" }, axis: "sen",
      glossary: { en: "Irritation around the mouth may signal perioral dermatitis — often caused by overuse of heavy creams or steroid creams in this area.", de: "Reizung um den Mund kann auf periorale Dermatitis hindeuten — oft durch übermäßigen Einsatz schwerer oder steroider Cremes.", ko: "입 주변 자극은 구주위 피부염의 신호일 수 있어요 — 이 부위에 무거운 크림이나 스테로이드 크림을 과다 사용하면 생겨요." } },
  ],
  jawline: [
    { id: "hormonal_j", label: { en: "Recurring Hormonal Breakouts", de: "Wiederkehrende hormonelle Pickel", ko: "같은 자리에 반복되는 트러블" }, axis: "acne", showForAge: { max: 4 },
      glossary: { en: "The jawline has the highest concentration of androgen receptors — recurring breakouts here strongly indicate hormonal influence.", de: "Die Kieferlinie hat die höchste Konzentration an Androgenrezeptoren — wiederkehrende Unreinheiten hier deuten stark auf hormonellen Einfluss hin.", ko: "턱선은 안드로겐 수용체가 가장 많은 곳이에요 — 이곳의 반복 트러블은 호르몬 영향을 강하게 시사해요." } },
    { id: "cystic_j",   label: { en: "Deep Painful Bumps",           de: "Tiefe schmerzhafte Knoten",        ko: "크고 깊은 혹 같은 트러블"   }, axis: "acne",
      glossary: { en: "Deep, painful lumps that don't come to a surface head. These form deep in the dermis and often need professional treatment.", de: "Tiefe, schmerzhafte Knoten, die nicht an die Oberfläche kommen. Sie bilden sich tief in der Dermis und brauchen oft professionelle Behandlung.", ko: "표면으로 나오지 않는 깊고 아픈 혹이에요. 진피 깊숙이 생기며 전문의 치료가 필요한 경우가 많아요." } },
    { id: "texture_j",  label: { en: "Rough / Bumpy Texture",        de: "Raue / unebene Textur",            ko: "턱선 피부 결 거칠음"         }, axis: "texture",
      glossary: { en: "Rough or bumpy texture along the jawline may indicate clogged pores from makeup residue, phone contact, or hormonal congestion.", de: "Raue oder unebene Textur an der Kieferlinie kann auf verstopfte Poren durch Make-up-Rückstände, Handykontakt oder hormonelle Stauung hindeuten.", ko: "턱선의 거친 피부결은 화장 잔여물, 휴대폰 접촉, 호르몬성 모공 막힘이 원인일 수 있어요." } },
    { id: "sagging_j",  label: { en: "Loss of Jawline Definition",   de: "Verlust der Kieferkontur",         ko: "턱선 탄력 저하 / 처짐"       }, axis: "aging", showForAge: { min: 2 },
      glossary: { en: "Loss of jawline definition is one of the earliest visible signs of collagen and elastin decline — it accelerates after 40.", de: "Der Verlust der Kieferkontur ist eines der frühesten sichtbaren Zeichen von Kollagen- und Elastinabbau — beschleunigt sich nach 40.", ko: "턱선 윤곽이 흐려지는 건 콜라겐·엘라스틴 감소의 초기 신호예요 — 40대 이후 빨라져요." } },
  ],
  neck: [
    { id: "neck_lines", label: { en: "Neck Lines",           de: "Halsfalten",          ko: "목 주름"             }, axis: "aging", showForAge: { min: 2 },
      glossary: { en: "Horizontal neck lines ('tech neck') are worsened by looking down at screens. The neck gets less skincare attention but ages just as fast.", de: "Horizontale Halsfalten ('Tech-Neck') werden durch das Herunterschauen auf Bildschirme verschlimmert. Der Hals altert genauso schnell wie das Gesicht.", ko: "목 가로 주름('테크 넥')은 스마트폰을 내려다보는 습관으로 악화돼요. 목도 얼굴만큼 빨리 노화해요." } },
    { id: "sagging",    label: { en: "Loss of Firmness",     de: "Elastizitätsverlust", ko: "목살 처짐 / 탄력 없음" }, axis: "aging", showForAge: { min: 2 },
      glossary: { en: "Neck skin is thinner than facial skin and has fewer oil glands — firmness loss here often appears before the face.", de: "Die Halshaut ist dünner als die Gesichtshaut und hat weniger Talgdrüsen — Festigkeitsverlust zeigt sich hier oft zuerst.", ko: "목 피부는 얼굴보다 얇고 피지샘이 적어서 탄력 저하가 얼굴보다 먼저 나타날 수 있어요." } },
    { id: "neck_red",   label: { en: "Redness / Irritation", de: "Rötung / Reizung",   ko: "목 부위 붉어짐"      }, axis: "sen",
      glossary: { en: "Neck redness can come from friction (scarves, collars), sun exposure, or sensitivity. The neck is often neglected in SPF application.", de: "Halsrötung kann durch Reibung (Schals, Kragen), Sonneneinstrahlung oder Empfindlichkeit entstehen. Der Hals wird beim LSF-Auftragen oft vergessen.", ko: "목 붉어짐은 마찰(스카프, 옷깃), 자외선, 민감성이 원인이에요. 선크림 바를 때 목을 빼먹는 경우가 많아요." } },
    { id: "neck_dry",   label: { en: "Dryness / Rough",      de: "Trockenheit / Rau",  ko: "목 피부 까칠함"      }, axis: "hyd",
      glossary: { en: "The neck has very few oil glands — it depends on moisturizer more than any other area. Extend your face routine down to the neck.", de: "Der Hals hat sehr wenige Talgdrüsen — er ist auf Feuchtigkeitspflege angewiesen. Tragen Sie Ihre Gesichtspflege immer auch am Hals auf.", ko: "목에는 피지샘이 거의 없어서 보습제에 가장 의존하는 부위예요. 얼굴 루틴을 목까지 연장하세요." } },
  ],
};

// ─── Copy strings ─────────────────────────────────────────────────────────────
const COPY: Record<Lang, {
  title: string; subtitle: string;
  selected: (n: number) => string;
  close: string; continue: string; hint: string;
  completeMappingCta: string; seeResultsCta: string;
}> = {
  en: {
    title: "Where do you notice concerns?",
    subtitle: "Tap a clinical zone on the face map to select your skin concerns.",
    selected: (n) => n === 1 ? "1 concern selected" : `${n} concerns selected`,
    close: "Done", continue: "Continue",
    hint: "Tap a zone on the face map to begin",
    completeMappingCta: "Complete Face Mapping",
    seeResultsCta: "See My Results",
  },
  de: {
    title: "Wo bemerken Sie Hautprobleme?",
    subtitle: "Tippen Sie auf eine klinische Zone, um Ihre Hautanliegen auszuwählen.",
    selected: (n) => `${n} Anliegen ausgewählt`,
    close: "Fertig", continue: "Weiter",
    hint: "Tippen Sie auf eine Zone, um zu beginnen",
    completeMappingCta: "Gesichts-Mapping abschließen",
    seeResultsCta: "Ergebnisse ansehen",
  },
  ko: {
    title: "어느 부위가 신경 쓰이시나요?",
    subtitle: "얼굴 지도에서 구역을 탭하여 피부 고민을 선택하세요.",
    selected: (n) => `${n}개 선택됨`,
    close: "완료", continue: "계속",
    hint: "얼굴 지도에서 구역을 탭하여 시작하세요",
    completeMappingCta: "얼굴 매핑 완료",
    seeResultsCta: "결과 확인하기",
  },
};

// ─── SVG Geometry ──────────────────────────────────────────────────────────────
interface ZoneDef {
  zone: ZoneId;
  dots: { x: number; y: number }[];
  connectors?: { x1: number; y1: number; x2: number; y2: number }[];
  annotLine?: { x1: number; y1: number; x2: number; y2: number };
  hitPath: string;
}

const ZONES_DEF: ZoneDef[] = [
  {
    zone: "forehead",
    dots: [{ x: 260, y: 120 }, { x: 200, y: 150 }, { x: 320, y: 150 }],
    connectors: [
      { x1: 200, y1: 150, x2: 320, y2: 150 },
      { x1: 260, y1: 120, x2: 260, y2: 150 },
    ],
    annotLine: { x1: 200, y1: 150, x2: 70, y2: 135 },
    hitPath: "M 125 82 L 375 82 L 370 192 L 130 192 Z M 60 110 L 200 110 L 200 170 L 60 170 Z",
  },
  {
    zone: "nose",
    dots: [{ x: 258, y: 192 }, { x: 258, y: 248 }, { x: 258, y: 305 }],
    connectors: [
      { x1: 258, y1: 192, x2: 258, y2: 248 },
      { x1: 258, y1: 248, x2: 258, y2: 305 },
    ],
    annotLine: { x1: 258, y1: 192, x2: 440, y2: 170 },
    hitPath: "M 215 178 L 285 178 L 290 332 L 210 332 Z M 250 150 L 450 150 L 450 200 L 250 200 Z",
  },
  {
    zone: "eyes",
    dots: [{ x: 150, y: 218 }, { x: 370, y: 218 }, { x: 150, y: 270 }, { x: 370, y: 270 }],
    connectors: [
      { x1: 150, y1: 218, x2: 370, y2: 218 },
      { x1: 150, y1: 218, x2: 150, y2: 270 },
      { x1: 370, y1: 218, x2: 370, y2: 270 },
      { x1: 150, y1: 270, x2: 370, y2: 270 },
    ],
    annotLine: { x1: 370, y1: 218, x2: 440, y2: 230 },
    hitPath: "M 125 195 L 375 195 L 375 282 L 125 282 Z M 370 210 L 460 210 L 460 250 L 370 250 Z",
  },
  {
    zone: "cheeks",
    dots: [{ x: 160, y: 318 }, { x: 352, y: 318 }],
    connectors: [],
    annotLine: { x1: 148, y1: 318, x2: 82, y2: 318 },
    hitPath: "M 100 278 L 215 278 L 218 378 L 102 375 Z M 285 278 L 400 278 L 398 375 L 282 378 Z",
  },
  {
    zone: "mouth",
    dots: [{ x: 200, y: 350 }, { x: 320, y: 350 }, { x: 260, y: 418 }],
    connectors: [
      { x1: 200, y1: 350, x2: 320, y2: 350 },
      { x1: 260, y1: 350, x2: 260, y2: 418 },
    ],
    annotLine: { x1: 320, y1: 350, x2: 430, y2: 370 },
    hitPath: "M 152 358 L 348 358 L 342 452 L 158 452 Z M 330 350 L 450 350 L 450 390 L 330 390 Z",
  },
  {
    zone: "jawline",
    dots: [{ x: 175, y: 402 }, { x: 220, y: 435 }, { x: 345, y: 402 }, { x: 318, y: 435 }],
    connectors: [
      { x1: 175, y1: 402, x2: 220, y2: 435 },
      { x1: 345, y1: 402, x2: 318, y2: 435 },
    ],
    annotLine: { x1: 175, y1: 402, x2: 92, y2: 442 },
    hitPath: "M 130 435 L 200 500 L 170 515 L 105 450 Z M 370 435 L 300 500 L 330 515 L 395 450 Z",
  },
  {
    zone: "neck",
    dots: [{ x: 205, y: 470 }, { x: 320, y: 470 }],
    connectors: [{ x1: 205, y1: 470, x2: 320, y2: 470 }],
    annotLine: { x1: 320, y1: 470, x2: 420, y2: 500 },
    hitPath: "M 168 470 L 332 470 L 345 580 L 155 580 Z M 320 460 L 440 460 L 440 520 L 320 520 Z",
  },
];

// ─── SVG animation CSS ────────────────────────────────────────────────────────
const SVG_CSS = `
  @keyframes fms-dot-idle {
    0%, 100% { opacity: 0.40; }
    50%       { opacity: 0.80; }
  }
  @keyframes fms-line-idle {
    0%, 100% { opacity: 0.40; }
    50%       { opacity: 0.80; }
  }
  @keyframes fms-dot-hover {
    0%, 100% { opacity: 0.78; }
    50%       { opacity: 0.90; }
  }
  @keyframes fms-halo-hover {
    0%, 100% { opacity: 0.10; }
    50%       { opacity: 0.24; }
  }
  @keyframes fms-dot-active {
    0%, 100% { opacity: 0.90; }
    50%       { opacity: 1.00; }
  }
  @keyframes fms-halo-active {
    0%, 100% { opacity: 0.16; }
    50%       { opacity: 0.36; }
  }
  @keyframes fms-dot-selected {
    0%, 100% { opacity: 0.85; transform: scale(1.0); }
    50%       { opacity: 1.00; transform: scale(1.15); }
  }
  @keyframes fms-halo-selected {
    0%, 100% { opacity: 0.20; transform: scale(1.0); }
    50%       { opacity: 0.50; transform: scale(1.35); }
  }
  @keyframes fms-severity-pulse {
    0%, 100% { opacity: 0.25; transform: scale(1.0); }
    50%       { opacity: 0.55; transform: scale(1.5); }
  }
`;

// ─── Helper: text anchor from annotation line direction ───────────────────────
function annotLabelProps(ln: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = ln.x2 - ln.x1;
  const dy = ln.y2 - ln.y1;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0
      ? { x: ln.x2 + 7,  y: ln.y2 + 4, anchor: "start"  as const }
      : { x: ln.x2 - 7,  y: ln.y2 + 4, anchor: "end"    as const };
  }
  return dy > 0
    ? { x: ln.x2,      y: ln.y2 + 13, anchor: "middle" as const }
    : { x: ln.x2,      y: ln.y2 - 6,  anchor: "middle" as const };
}

// ─── Localized text helper ────────────────────────────────────────────────────
const gt = (t: LocalizedText, lang: Lang): string =>
  (t as unknown as Record<string, string>)[lang] ?? (t as unknown as Record<string, string>).en;

// ─── FaceSVG ──────────────────────────────────────────────────────────────────
// Step 8: dots scale by zone max severity
function FaceSVG({
  activeZone, selectedZones, onZoneClick, lang, concernSeverity,
}: {
  activeZone: ZoneId | null;
  selectedZones: Set<ZoneId>;
  onZoneClick: (z: ZoneId) => void;
  lang: Lang;
  concernSeverity: Record<string, 1 | 2 | 3>;
}) {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <svg
      viewBox="-50 0 600 700"
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        overflow: "visible",
        willChange: "transform",
      }}
    >
      <style>{SVG_CSS}</style>
      <defs>
        <filter id="fms-glow-warm" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="fms-glow-sev" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {ZONES_DEF.map(({ zone, dots, connectors, annotLine, hitPath }, zoneIdx) => {
        const isSelected = selectedZones.has(zone);
        const isActive   = activeZone === zone;
        const isHovered  = hoveredZone === zone;

        const lit    = isActive || isSelected;
        const dimmed = activeZone !== null && !lit;

        const statusColor = (isSelected || isActive)
          ? (isDark ? COLOR_PALETTE.dark_selected : COLOR_PALETTE.light_selected)
          : (isDark ? COLOR_PALETTE.dark_idle : COLOR_PALETTE.light_idle);

        const finalOpacity = isSelected ? 1 : (isActive ? 0.9 : 0.6);
        const finalStrokeWidth = (isSelected || isActive) ? 1.2 : 0.8;

        const d0 = zoneIdx * 0.38;

        const lp    = annotLine ? annotLabelProps(annotLine) : null;
        const label = ZONE_LABELS[zone][lang];

        // ── Step 8: Zone max severity for visual scaling ──────────────────────
        const zoneMaxSeverity = Math.max(
          0,
          ...Object.entries(concernSeverity)
            .filter(([cId]) => ZONE_CONCERNS[zone]?.some(c => c.id === cId))
            .map(([, sev]) => sev as number)
        );

        // Dot radius scales: 3.5 → 4.5 → 5.5 → 7
        const dotR = zoneMaxSeverity === 0 ? 3.5
          : zoneMaxSeverity === 1 ? 4.5
          : zoneMaxSeverity === 2 ? 5.5
          : 7;

        // Dot opacity scales: 0.4 → 0.6 → 0.8 → 1.0
        const dotBaseOp = zoneMaxSeverity === 0 ? 0.4
          : zoneMaxSeverity === 1 ? 0.6
          : zoneMaxSeverity === 2 ? 0.8
          : 1.0;
        const dotOp = isSelected ? Math.max(dotBaseOp, finalOpacity) : finalOpacity;

        // Glow radius for severity indicator
        const glowR = zoneMaxSeverity * 4;

        // Severity dots on annotation label: "Forehead ●●○"
        const sevDots = zoneMaxSeverity > 0
          ? " " + "●".repeat(zoneMaxSeverity) + "○".repeat(3 - zoneMaxSeverity)
          : "";

        return (
          <g key={zone}
            onClick={() => onZoneClick(zone)}
            onMouseEnter={() => setHoveredZone(zone)}
            onMouseLeave={() => setHoveredZone(null)}
            style={{
              opacity: dimmed && !isSelected ? 0.8 : 1,
              transition: "all 0.4s",
              cursor: "pointer",
            }}>

            <path d={hitPath} fill="transparent" />

            {/* Connector lines */}
            {connectors?.map((ln, i) => (
              <line
                key={i}
                x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2}
                stroke={statusColor}
                strokeWidth={finalStrokeWidth}
                style={{
                  animation: (isSelected || isActive)
                    ? "none"
                    : `fms-line-idle 3s ease-in-out ${d0 + i * 0.25}s infinite`,
                  opacity: finalOpacity,
                  transition: "all 0.4s ease",
                }}
              />
            ))}

            {/* Annotation callout line */}
            {annotLine && (
              <line
                x1={annotLine.x1} y1={annotLine.y1}
                x2={annotLine.x2} y2={annotLine.y2}
                stroke={statusColor}
                strokeWidth={finalStrokeWidth}
                style={{
                  animation: (isSelected || isActive)
                    ? "none"
                    : `fms-line-idle 3s ease-in-out ${d0 + 0.15}s infinite`,
                  opacity: finalOpacity,
                  transition: "all 0.4s ease",
                }}
              />
            )}

            {/* Zone label + severity dots */}
            {lp && (
              <text
                x={lp.x} y={lp.y}
                textAnchor={lp.anchor}
                fill={statusColor}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "16px",
                  fontWeight: (isSelected || isActive) ? 600 : 400,
                  opacity: dotOp,
                  letterSpacing: "0.02em",
                  animation: (isSelected || isActive)
                    ? "none"
                    : `fms-dot-idle 3s ease-in-out ${d0 + 0.2}s infinite`,
                  transition: "all 0.4s ease",
                  userSelect: "none",
                }}
              >
                {label}{sevDots}
              </text>
            )}

            {/* Dots */}
            {dots.map((d, i) => {
              const dotAnim = isSelected
                ? `fms-dot-selected 2s ease-in-out ${i * 0.3}s infinite`
                : lit
                  ? "fms-dot-active 2.4s ease-in-out infinite"
                  : (isHovered && !dimmed)
                    ? `fms-dot-hover 0.8s ease-in-out infinite`
                    : `fms-dot-idle 3s ease-in-out ${d0 + i * 0.45}s infinite`;

              return (
                <g key={i}>
                  {/* Hover halo */}
                  {isHovered && !dimmed && !isSelected && (
                    <circle
                      cx={d.x} cy={d.y} r={7}
                      fill={statusColor}
                      filter="url(#fms-glow-warm)"
                      style={{ animation: "fms-halo-hover 1.2s ease-in-out infinite", opacity: 0.5 }}
                    />
                  )}

                  {/* Selected halo */}
                  {isSelected && (
                    <circle
                      cx={d.x} cy={d.y} r={7}
                      fill={isDark ? COLOR_PALETTE.dark_selected : COLOR_PALETTE.light_selected}
                      filter="url(#fms-glow-warm)"
                      style={{
                        animation: `fms-halo-selected 2s ease-in-out ${i * 0.3}s infinite`,
                        transformOrigin: `${d.x}px ${d.y}px`,
                      }}
                    />
                  )}

                  {/* Step 8: Severity glow ring */}
                  {zoneMaxSeverity > 0 && glowR > 0 && (
                    <circle
                      cx={d.x} cy={d.y} r={glowR}
                      fill={statusColor}
                      filter="url(#fms-glow-sev)"
                      style={{
                        animation: `fms-severity-pulse 2.4s ease-in-out ${i * 0.3}s infinite`,
                        transformOrigin: `${d.x}px ${d.y}px`,
                        opacity: 0,
                      }}
                    />
                  )}

                  {/* Main dot — scaled by severity */}
                  <circle
                    cx={d.x} cy={d.y}
                    r={dotR}
                    fill={statusColor}
                    filter={(isSelected || (isHovered && !dimmed)) ? "url(#fms-glow-warm)" : undefined}
                    style={{
                      transformOrigin: `${d.x}px ${d.y}px`,
                      animation: dotAnim,
                      opacity: dotOp,
                      transition: "r 0.4s ease, opacity 0.3s ease",
                    }}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Pattern detection cards (Part C Step 2) ─────────────────────────────────
const PATTERN_CARDS: Record<string, Record<Lang, { title: string; body: string }>> = {
  DEHYDRATED_OILY: {
    en: { title: "Combination Pattern Detected", body: "Your T-zone is oily but other areas are dry — this means different zones need different care. We'll create a zone-specific routine." },
    de: { title: "Mischhaut-Muster erkannt", body: "Ihre T-Zone ist fettig, aber andere Bereiche sind trocken — verschiedene Zonen brauchen unterschiedliche Pflege." },
    ko: { title: "복합성 패턴 감지", body: "T존은 유분인데 다른 부위는 건조해요 — 부위별로 다른 관리가 필요합니다. 맞춤 루틴을 만들어 드릴게요." },
  },
  WIDESPREAD_AGING: {
    en: { title: "Multi-Zone Aging Pattern", body: "Signs of firmness loss across 3+ areas — this suggests collagen decline that benefits from a targeted protocol." },
    de: { title: "Alterszeichen in mehreren Zonen", body: "Festigkeitsverlust in 3+ Bereichen — ein gezieltes Kollagen-Protokoll kann hier helfen." },
    ko: { title: "다부위 노화 패턴", body: "3곳 이상에서 탄력 저하 신호가 감지됐어요 — 콜라겐 집중 프로토콜이 도움이 됩니다." },
  },
  HORMONAL_ACNE: {
    en: { title: "Hormonal Pattern Detected", body: "Recurring breakouts on your jawline strongly suggest hormonal influence — we'll factor this into your diagnosis." },
    de: { title: "Hormonelles Muster erkannt", body: "Wiederkehrende Unreinheiten an der Kieferlinie deuten auf hormonellen Einfluss hin." },
    ko: { title: "호르몬 패턴 감지", body: "턱선의 반복 트러블은 호르몬 영향을 강하게 시사해요 — 진단에 반영합니다." },
  },
  BARRIER_STRESS: {
    en: { title: "Barrier Stress Detected", body: "High sensitivity combined with dryness suggests your skin's protective barrier needs repair before other treatments." },
    de: { title: "Barriere-Stress erkannt", body: "Empfindlichkeit + Trockenheit deuten auf eine geschwächte Hautbarriere hin — Reparatur hat Priorität." },
    ko: { title: "장벽 스트레스 감지", body: "높은 민감도 + 건조함은 피부 보호막 손상을 시사해요 — 다른 관리 전에 장벽 회복이 우선입니다." },
  },
  PIH_RISK: {
    en: { title: "Post-Breakout Marks Risk", body: "Breakouts + dark spots together mean your skin is prone to lasting marks after blemishes heal." },
    de: { title: "Risiko für Unreinheiten-Flecken", body: "Unreinheiten + dunkle Flecken zusammen bedeuten, dass Ihre Haut zu bleibenden Spuren neigt." },
    ko: { title: "트러블 흔적 위험 감지", body: "트러블 + 잡티가 함께 있으면 치유 후에도 자국이 오래 남을 수 있어요." },
  },
};

// ─── InlineQuestionRenderer ───────────────────────────────────────────────────
// Used by TailQuestionSection (Step 6)
function InlineQuestionRenderer({
  q, value, onChange, lang, allAnswers, isDark,
}: {
  q: QuestionDef; value: QuestionAnswer;
  onChange: (id: string, val: QuestionAnswer) => void;
  lang: Lang; allAnswers: Record<string, QuestionAnswer>; isDark: boolean;
}) {
  const GOLD = isDark ? "#c9a96e" : "#7A9E82";
  const pillSt = (sel: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", margin: "4px 5px 4px 0",
    borderRadius: 24, fontSize: 13, fontFamily: "var(--font-sans)",
    cursor: "pointer", minHeight: 44, lineHeight: "1.2",
    border: sel ? `1px solid ${GOLD}` : `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    background: sel ? (isDark ? "rgba(201,169,110,0.15)" : "rgba(122,162,115,0.15)") : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    color: sel ? GOLD : isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
    transition: "all 0.3s ease",
  });

  const showConditional = q.conditional != null && (() => {
    const tv = allAnswers[q.conditional!.ifQuestionId];
    if (tv == null) return false;
    const vals = q.conditional!.ifValues;
    return Array.isArray(tv)
      ? tv.some(v => vals.includes(String(v)))
      : vals.includes(String(tv));
  })();

  return (
    <>
      {(q.type === "single" || q.type === "image") && q.options && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {q.options.map(opt => (
            <div key={opt.id} onClick={() => onChange(q.id, opt.id)} style={pillSt(value === opt.id)}>
              {opt.icon && <span style={{ marginRight: 6, opacity: 0.8 }}>{opt.icon}</span>}
              {gt(opt.label, lang)}
            </div>
          ))}
        </div>
      )}
      {q.type === "multi" && q.options && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {q.options.map(opt => {
            const sel = (value as string[]) ?? [];
            const on = sel.includes(opt.id);
            return (
              <div key={opt.id}
                onClick={() => {
                  let next: string[];
                  if (on) {
                    next = sel.filter(x => x !== opt.id);
                  } else if (q.exclusiveIds?.includes(opt.id)) {
                    next = [opt.id];
                  } else {
                    next = [...sel.filter(x => !q.exclusiveIds?.includes(x)), opt.id];
                  }
                  onChange(q.id, next);
                }}
                style={pillSt(on)}>
                {gt(opt.label, lang)}
              </div>
            );
          })}
        </div>
      )}
      {q.type === "slider" && q.slider && (() => {
        const isTouched = value !== undefined;
        const currentVal = (value as number) ?? q.slider.defaultValue;
        const trackColor = isTouched ? GOLD : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)");
        return (
          <div style={{ margin: "8px 0 16px" }}>
            <input
              type="range" min={q.slider.min} max={q.slider.max} step={q.slider.step}
              value={currentVal}
              onChange={e => onChange(q.id, Number(e.target.value))}
              style={{ width: "100%", accentColor: trackColor, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)", fontFamily: "var(--font-sans)", marginTop: 8 }}>
              <span>{gt(q.slider.labelMin, lang)}</span>
              <span style={{ color: trackColor, fontWeight: isTouched ? 600 : 400 }}>{currentVal}</span>
              <span>{gt(q.slider.labelMax, lang)}</span>
            </div>
          </div>
        );
      })()}
      {showConditional && q.conditional && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{ marginTop: 16, paddingLeft: 16, borderLeft: `2px solid ${isDark ? "#c9a96e33" : "#7A9E8233"}`, overflow: "hidden" }}
        >
          <div style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)", marginBottom: 12, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
            {gt(q.conditional.inject.text, lang)}
          </div>
          <InlineQuestionRenderer
            q={q.conditional.inject}
            value={allAnswers[q.conditional.inject.id]}
            isDark={isDark} onChange={onChange} lang={lang} allAnswers={allAnswers}
          />
        </motion.div>
      )}
    </>
  );
}

// ─── GlossaryBadge — viewport-aware popover via createPortal ──────────────────
// Uses position:fixed rendered at document.body so overflow:hidden / overflowY:auto
// parent containers (e.g. the mobile bottom-sheet) can never clip it.
function GlossaryBadge({
  glossaryText, isDark,
}: {
  glossaryText: string;
  isDark: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const TOOLTIP_W = 240;
  const PADDING   = 12;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      // Center tooltip on trigger, clamped inside viewport
      let left = r.left + r.width / 2 - TOOLTIP_W / 2;
      if (left + TOOLTIP_W > window.innerWidth - PADDING) {
        left = window.innerWidth - TOOLTIP_W - PADDING;
      }
      if (left < PADDING) left = PADDING;
      // Place above the trigger (tooltip will translateY(-100%-8px))
      setPos({ left, top: r.top });
    }
    setIsOpen(o => !o);
  };

  return (
    <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      {/* ⓘ trigger */}
      <span
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: "50%",
          fontSize: 10, fontWeight: 600,
          color: isOpen
            ? (isDark ? "#c9a96e" : "#7A9E82")
            : (isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"),
          border: `1px solid ${isOpen
            ? (isDark ? "rgba(201,169,110,0.5)" : "rgba(122,162,115,0.5)")
            : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)")}`,
          background: isOpen
            ? (isDark ? "rgba(201,169,110,0.1)" : "rgba(122,162,115,0.08)")
            : "transparent",
          cursor: "pointer", marginLeft: 5, transition: "all 0.15s ease",
        }}
      >
        i
      </span>

      {/* Popover — rendered at document.body via portal so it escapes overflow containers */}
      {isOpen && pos && createPortal(
        <>
          {/* Click-away backdrop */}
          <div
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform: "translateY(calc(-100% - 8px))",
              width: TOOLTIP_W,
              maxWidth: `calc(100vw - ${PADDING * 2}px)`,
              padding: "12px 14px",
              borderRadius: 12,
              zIndex: 9999,
              background: isDark ? "rgba(24,24,28,0.97)" : "rgba(255,255,255,0.98)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.1)",
              fontSize: 12, lineHeight: 1.6,
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
              fontFamily: "var(--font-sans)", fontWeight: 400,
              wordWrap: "break-word",
            }}
          >
            {glossaryText}
            {/* Arrow pointing down */}
            <div style={{
              position: "absolute", bottom: -5,
              left: Math.min(
                Math.max(PADDING, triggerRef.current
                  ? triggerRef.current.getBoundingClientRect().left + 9 - pos.left
                  : TOOLTIP_W / 2),
                TOOLTIP_W - PADDING
              ),
              transform: "rotate(45deg)",
              width: 10, height: 10,
              background: isDark ? "rgba(24,24,28,0.97)" : "rgba(255,255,255,0.98)",
              borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            }} />
          </motion.div>
        </>,
        document.body
      )}
    </span>
  );
}

// ─── Step 2: ConcernItem — 3-level severity ───────────────────────────────────
const SEVERITY_LABELS: Record<1 | 2 | 3, Record<Lang, string>> = {
  1: { en: "Mild",     de: "Leicht", ko: "약간" },
  2: { en: "Moderate", de: "Mittel", ko: "보통" },
  3: { en: "Severe",   de: "Stark",  ko: "심각" },
};

function ConcernItem({
  concern, severity, onTap, lang, isDark,
}: {
  concern: Concern;
  severity: 0 | 1 | 2 | 3;
  onTap: () => void;
  lang: Lang;
  isDark: boolean;
}) {
  const GOLD = isDark ? "#c9a96e" : "#7A9E82";
  const label = severity > 0 ? SEVERITY_LABELS[severity as 1 | 2 | 3] : null;
  const dots = severity > 0
    ? "●".repeat(severity) + "○".repeat(3 - severity)
    : "○○○";

  const bgOpacity = severity === 3 ? 0.18
    : severity === 2 ? 0.10
    : severity === 1 ? 0.05
    : 0;

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        padding: "13px 16px", borderRadius: 14,
        textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
        background: severity > 0
          ? (isDark ? `rgba(201,169,110,${bgOpacity})` : `rgba(122,162,115,${bgOpacity})`)
          : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
        border: `1px solid ${severity > 0
          ? GOLD
          : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
        color: severity > 0
          ? GOLD
          : (isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)"),
        fontFamily: "var(--font-sans)", fontSize: 14,
        fontWeight: severity > 0 ? 500 : 400,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
        <span>{concern.label[lang]}</span>
        {concern.glossary?.[lang] && (
          <GlossaryBadge glossaryText={concern.glossary[lang]} isDark={isDark} />
        )}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: severity > 0 ? 0.85 : 0.4, flexShrink: 0 }}>
        {label && (
          <span style={{ fontSize: 11, letterSpacing: "0.02em" }}>
            {label[lang]}
          </span>
        )}
        <span style={{ fontSize: 10, letterSpacing: "2px", color: severity > 0 ? GOLD : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)") }}>
          {dots}
        </span>
      </span>
    </motion.button>
  );
}

// ─── Step 3: ConcernAndQuestionPanel — chips only, no deep-dive ───────────────
function ConcernAndQuestionPanel({
  zone, concernSeverity, onToggle, onClose, lang, isDark, severityHintShown, onHintShown,
}: {
  zone: ZoneId;
  concernSeverity: Record<string, 1 | 2 | 3>;
  onToggle: (id: string) => void;
  onClose: () => void;
  lang: Lang;
  isDark: boolean;
  severityHintShown: boolean;
  onHintShown: () => void;
}) {
  const GOLD = isDark ? "#c9a96e" : "#7A9E82";
  const store = useDiagnosisStore();
  const ageBracket = (store.axisAnswers["EXP_AGE"] as number | undefined) ?? 2; // default 30s

  const concerns = ZONE_CONCERNS[zone].filter(c => {
    if (!c.showForAge) return true;
    if (c.showForAge.min !== undefined && ageBracket < c.showForAge.min) return false;
    if (c.showForAge.max !== undefined && ageBracket > c.showForAge.max) return false;
    return true;
  });

  // Show hint on first chip tap
  const zoneSelected = concerns.filter(c => (concernSeverity[c.id] ?? 0) > 0).length;
  const showSeverityHint = !severityHintShown && Object.keys(concernSeverity).length === 1 && zoneSelected >= 1;

  return (
    <div style={{ padding: "8px 0 16px" }}>
      {/* Panel header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 1.5, background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginBottom: 16 }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            {/* Step 3: "Select Your Concerns" instead of "Clinical Area" */}
            <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              {lang === "ko" ? "피부 고민 선택"
                : lang === "de" ? "Beschwerden auswählen"
                : "Select Your Concerns"}
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 400, color: isDark ? "#fff" : "#111", fontFamily: "var(--font-sans)", margin: 0, lineHeight: 1.2 }}>
              {ZONE_LABELS[zone][lang]}
            </h3>
          </div>
          <button onClick={onClose}
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isDark ? "#fff" : "#000", flexShrink: 0 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* Step 2-G: Severity hint tooltip */}
      <AnimatePresence>
        {showSeverityHint && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onAnimationComplete={() => setTimeout(onHintShown, 4000)}
            style={{
              padding: "12px 16px", borderRadius: 12, marginBottom: 14,
              background: isDark ? "rgba(201,169,110,0.08)" : "rgba(122,162,115,0.08)",
              border: `1px solid ${isDark ? "rgba(201,169,110,0.2)" : "rgba(122,162,115,0.2)"}`,
              fontSize: 13,
              color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
            }}
          >
            <div>
              💡 {lang === "ko"
                ? "탭할 때마다 심각도가 올라가요"
                : lang === "de"
                ? "Jedes Tippen erhöht den Schweregrad"
                : "Each tap increases severity"}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, letterSpacing: "1px", opacity: 0.7 }}>
              <span>●○○ {lang === "ko" ? "약간" : lang === "de" ? "Leicht" : "Mild"}</span>
              <span style={{ margin: "0 8px" }}>·</span>
              <span>●●○ {lang === "ko" ? "보통" : lang === "de" ? "Mittel" : "Moderate"}</span>
              <span style={{ margin: "0 8px" }}>·</span>
              <span>●●● {lang === "ko" ? "심각" : lang === "de" ? "Stark" : "Severe"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concern list */}
      <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
        {lang === "ko" ? "피부 고민 선택" : lang === "de" ? "Beschwerden auswählen" : "Select Concerns"}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {concerns.map(c => (
          <ConcernItem
            key={c.id}
            concern={c}
            severity={(concernSeverity[c.id] ?? 0) as 0 | 1 | 2 | 3}
            onTap={() => onToggle(c.id)}
            lang={lang}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Step 2-H: "No concerns here — skip" button */}
      <motion.button
        onClick={onClose}
        style={{
          width: "100%", padding: "11px 16px", borderRadius: 14,
          border: `1px dashed ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
          background: "transparent", cursor: "pointer",
          color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
          fontSize: 13, fontFamily: "var(--font-sans)",
          marginBottom: 8, transition: "all 0.2s ease",
        }}
      >
        {lang === "ko" ? "이 부위는 괜찮아요 — 건너뛰기"
          : lang === "de" ? "Hier keine Probleme — überspringen"
          : "No concerns here — skip"}
      </motion.button>

      {/* Confirm Selection button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
        style={{
          width: "100%", padding: "14px 0",
          borderRadius: 24, fontSize: 14, fontWeight: 600,
          fontFamily: "var(--font-sans)", border: "none",
          background: isDark ? "linear-gradient(135deg, #c9a96e, #a38555)" : "linear-gradient(135deg, #8EA273, #2D4F39)",
          color: isDark ? "#0d0d12" : "#fff", cursor: "pointer",
          boxShadow: isDark ? "0 6px 20px rgba(201,169,110,0.3)" : "0 6px 20px rgba(45,79,57,0.25)",
        }}
      >
        {lang === "ko" ? "선택 완료" : lang === "de" ? "Auswahl bestätigen" : "Confirm Selection"}
      </motion.button>
    </div>
  );
}

// ─── Panel style ───────────────────────────────────────────────────────────────
const PANEL_S = (isDark: boolean): React.CSSProperties => ({
  width: "min(400px, 90vw)", flexShrink: 0, borderRadius: 24,
  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
  background: isDark ? "rgba(20,20,25,0.88)" : "rgba(255,255,255,0.93)",
  backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
  boxShadow: isDark ? "0 24px 68px rgba(0,0,0,0.65)" : "0 24px 68px rgba(0,0,0,0.15)",
  padding: "20px 24px", display: "flex", flexDirection: "column",
  maxHeight: "80vh", overflowY: "auto",
});

// ─── Step 6: TailQuestionSection ─────────────────────────────────────────────
function TailQuestionSection({
  tailQuestions, lang, isDark, axisAnswers, onAnswer,
}: {
  tailQuestions: QuestionDef[];
  lang: Lang;
  isDark: boolean;
  axisAnswers: Record<string, QuestionAnswer>;
  onAnswer: (id: string, val: QuestionAnswer) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: "24px 0", maxWidth: 520, margin: "0 auto" }}
    >
      <h3 style={{
        fontSize: 20, fontWeight: 400,
        color: isDark ? "#fff" : "#111",
        fontFamily: "var(--font-sans)",
        marginBottom: 6,
      }}>
        {lang === "ko" ? "마지막 몇 가지만 확인할게요"
          : lang === "de" ? "Nur noch ein paar kurze Fragen"
          : "Just a few quick follow-ups"}
      </h3>
      <p style={{
        fontSize: 13,
        color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
        fontFamily: "var(--font-sans)",
        marginBottom: 28, lineHeight: 1.5,
      }}>
        {lang === "ko" ? "피부 지도에서 알 수 없는 것만 여쭤볼게요"
          : lang === "de" ? "Wir fragen nur, was die Gesichtskarte nicht zeigen kann"
          : "We only ask what the face map can't tell us"}
      </p>

      {tailQuestions.map((q, i) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          style={{
            marginBottom: 28, padding: "16px 20px", borderRadius: 16,
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <div style={{
            fontSize: 15, color: isDark ? "#fff" : "#111",
            marginBottom: 8, fontFamily: "var(--font-sans)", lineHeight: 1.5,
          }}>
            {gt(q.text, lang)}
          </div>
          {q.hint && (
            <div style={{
              fontSize: 12,
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              marginBottom: 14, fontStyle: "italic",
              fontFamily: "var(--font-sans)", lineHeight: 1.5,
            }}>
              {gt(q.hint, lang)}
            </div>
          )}
          <InlineQuestionRenderer
            q={q} value={axisAnswers[q.id]}
            isDark={isDark} onChange={onAnswer}
            lang={lang} allAnswers={axisAnswers}
          />
          {(q as unknown as { clinicalBasis?: { method: string } }).clinicalBasis && (
            <div style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)", marginTop: 8, fontFamily: "var(--font-sans)" }}>
              🔬 {(q as unknown as { clinicalBasis: { method: string } }).clinicalBasis.method}
            </div>
          )}
        </motion.div>
      ))}

      {/* Progress indicator */}
      <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", fontFamily: "var(--font-sans)", textAlign: "center", marginBottom: 12 }}>
        {lang === "ko"
          ? `${tailQuestions.length}개 질문`
          : lang === "de"
          ? `${tailQuestions.length} Fragen`
          : `${tailQuestions.length} question${tailQuestions.length !== 1 ? "s" : ""}`}
        {" · "}
        {lang === "ko" ? "약 1분" : lang === "de" ? "ca. 1 Minute" : "~1 minute"}
      </div>
    </motion.div>
  );
}

// ─── Step 5-C: Axis label with male override ──────────────────────────────────
export function getAxisLabel(axis: string, lang: Lang, gender: number): string {
  if (gender === 1) {
    const override = (MALE_ADJUSTMENTS.axisLabelOverride as Record<string, Record<Lang, string>>)[axis];
    if (override) return override[lang];
  }
  return axis; // fallback: raw axis key (results page provides its own labels)
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function FaceMapStep({ onNext, isAnalyzing = false }: { onNext: () => void; isAnalyzing?: boolean }) {
  const { language }      = useI18nStore();
  const lang              = language as Lang;
  const store             = useDiagnosisStore();
  const copy              = COPY[lang];
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const GOLD   = isDark ? "#c9a96e" : "#7A9E82";

  // ── Step 2: severity map ──────────────────────────────────────────────────
  // Initialise from the Zustand store so selections survive back/forward navigation.
  // The store persists selectedZones (including per-concern severity) to localStorage.
  const [concernSeverity, setConcernSeverity] = useState<Record<string, 1 | 2 | 3>>(() => {
    const zones = useDiagnosisStore.getState().selectedZones ?? {};
    const out: Record<string, 1 | 2 | 3> = {};
    for (const zone of Object.values(zones)) {
      if (zone.severity) Object.assign(out, zone.severity);
    }
    return out;
  });

  // Keep store in sync on every chip change so mid-selection state is preserved
  // even if the user navigates away before hitting "Complete".
  const setAllZones = store.actions.setAllZones;
  useEffect(() => {
    const zoneMap: Record<string, { concerns: string[]; severity?: Record<string, 1 | 2 | 3> }> = {};
    for (const [zid, arr] of Object.entries(ZONE_CONCERNS)) {
      const sel = arr.filter(c => (concernSeverity[c.id] ?? 0) > 0);
      if (sel.length) {
        const sevMap: Record<string, 1 | 2 | 3> = {};
        sel.forEach(c => { sevMap[c.id] = concernSeverity[c.id]; });
        zoneMap[zid] = { concerns: sel.map(c => c.id), severity: sevMap };
      }
    }
    setAllZones(zoneMap);
  }, [concernSeverity, setAllZones]);
  const [activeZone, setActiveZone]           = useState<ZoneId | null>(null);
  const [isMobile, setIsMobile]               = useState(false);
  const [severityHintShown, setSeverityHintShown] = useState(false);

  // ── Step 7: 3-phase state machine ────────────────────────────────────────
  const [fmPhase, setFmPhase]         = useState<FaceMapPhase>("mapping");
  const [inference, setInference]     = useState<FaceMapInference | null>(null);
  const [tailQuestions, setTailQuestions] = useState<QuestionDef[]>([]);

  // ── Real-time pattern detection (Part C Step 2) ───────────────────────────
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);

  useEffect(() => {
    if (Object.keys(concernSeverity).length >= 2) {
      const inf = inferFromFaceMap(concernSeverity);
      setDetectedPatterns(inf.patterns);
    } else {
      setDetectedPatterns([]);
    }
  }, [concernSeverity]);

  // Session-scoped axis answers (EXP_* only from store; AX_* freshly answered here)
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, QuestionAnswer>>(() => {
    const all = useDiagnosisStore.getState().axisAnswers;
    return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith("EXP_")));
  });

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Zones with ≥1 selected concern
  const selectedZones = useMemo(() => {
    const out = new Set<ZoneId>();
    for (const [z, arr] of Object.entries(ZONE_CONCERNS)) {
      if (arr.some(c => (concernSeverity[c.id] ?? 0) > 0)) out.add(z as ZoneId);
    }
    return out;
  }, [concernSeverity]);

  // ── Step 2: severity cycling toggle ──────────────────────────────────────
  const toggleConcern = useCallback((concernId: string) => {
    setConcernSeverity(prev => {
      const current = prev[concernId] ?? 0;
      if (current >= 3) {
        const next = { ...prev };
        delete next[concernId];
        return next;
      }
      return { ...prev, [concernId]: (current + 1) as 1 | 2 | 3 };
    });
  }, []);

  const handleZoneClick = useCallback((id: ZoneId) => {
    setActiveZone(prev => (prev === id ? null : id));
  }, []);

  const handleAnswer = useCallback((id: string, val: QuestionAnswer) => {
    setSessionAnswers(prev => ({ ...prev, [id]: val }));
    store.setAxisAnswer(id, val);
  }, [store]);

  // ── Step 7: mapping → followup/ready ─────────────────────────────────────
  const handleMappingDone = useCallback(() => {
    const inf = inferFromFaceMap(concernSeverity);
    setInference(inf);

    const ageBracket = (store.axisAnswers["EXP_AGE"] as number | undefined) ?? 2;
    const gender     = (store.axisAnswers["EXP_GENDER"] as number | undefined) ?? 2;
    const tqs = computeTailQuestions(inf, ageBracket, gender);
    setTailQuestions(tqs);

    if (tqs.length === 0) {
      buildAndSubmit(inf);
    } else {
      setFmPhase("followup");
    }
  }, [concernSeverity, store]);

  const buildAndSubmit = useCallback((inf?: FaceMapInference | null) => {
    const usedInference = inf ?? inference;
    // Build axis weight map from severity
    const axisMap: Record<string, number> = {};
    for (const [cid, sev] of Object.entries(concernSeverity)) {
      for (const arr of Object.values(ZONE_CONCERNS)) {
        const f = arr.find(c => c.id === cid);
        if (f) axisMap[f.axis] = (axisMap[f.axis] ?? 0) + sev;
      }
    }
    // Build zone map
    const zoneMap: Record<string, { concerns: string[]; severity?: Record<string, 1 | 2 | 3> }> = {};
    for (const [zid, arr] of Object.entries(ZONE_CONCERNS)) {
      const sel = arr.filter(c => (concernSeverity[c.id] ?? 0) > 0);
      if (sel.length) {
        const sevMap: Record<string, 1 | 2 | 3> = {};
        sel.forEach(c => { sevMap[c.id] = concernSeverity[c.id]; });
        zoneMap[zid] = { concerns: sel.map(c => c.id), severity: sevMap };
      }
    }
    store.actions.setAllZones(zoneMap);
    store.setUiSignals("faceMap", axisMap as Record<string, unknown>);
    if (usedInference) {
      store.setUiSignals("inference", usedInference as unknown as Record<string, unknown>);
    }
    onNext();
  }, [concernSeverity, inference, store, onNext]);

  const totalSelected = Object.keys(concernSeverity).length;
  const allZonesDone  = selectedZones.size === ZONES_DEF.length;

  return (
    <div style={{ width: "100%" }}>
      {/* ── Step 7: MAPPING phase ────────────────────────────────────────── */}
      {fmPhase === "mapping" && (
        <>
          {/* Header */}
          <h2 style={{
            fontSize: isMobile ? 26 : 30, fontWeight: 300,
            fontFamily: "var(--font-display)",
            color: isDark ? "#fff" : "#111", marginBottom: 8,
          }}>
            {copy.title}
          </h2>
          <p style={{
            fontSize: 14, marginBottom: 32,
            color: isDark ? "rgba(185, 182, 141, 0.76)" : "rgba(0,0,0,0.6)",
            fontFamily: "var(--font-sans)",
          }}>
            {copy.subtitle}
          </p>

          {/* Main layout */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-start",
            gap: 28,
            padding: "0 20px",
          }}>
            {/* Face image card */}
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: isMobile ? "430px" : "520px",
              aspectRatio: "600/700",
              flexShrink: 0,
              borderRadius: 28,
              background: isDark ? "#484f4ba5" : "#becad3bf",
              boxShadow: isDark ? "0 32px 88px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.12)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}`,
              margin: isMobile ? "0 auto" : "0",
            }}>
              <img
                src={facemapImg}
                alt="Clinical face map"
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  borderRadius: 28,
                  filter: isDark ? "brightness(0.8) contrast(1.2) multiply" : "mix-blend-mode: multiply",
                  transition: "filter 0.3s ease"
                }}
              />
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                borderRadius: 28,
                background: isDark
                  ? "radial-gradient(ellipse at 50% 45%, transparent 20%, rgba(18,18,20,0.6) 100%)"
                  : "radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(242,240,237,0.4) 100%)",
              }} />
              <FaceSVG
                activeZone={activeZone}
                selectedZones={selectedZones}
                onZoneClick={handleZoneClick}
                lang={lang}
                concernSeverity={concernSeverity}
              />
            </div>

            {/* Desktop concern panel */}
            {!isMobile && (
              <AnimatePresence mode="wait">
                {activeZone ? (
                  <motion.div
                    key={activeZone}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    style={PANEL_S(isDark)}
                  >
                    <ConcernAndQuestionPanel
                      zone={activeZone}
                      concernSeverity={concernSeverity}
                      onToggle={toggleConcern}
                      onClose={() => setActiveZone(null)}
                      lang={lang}
                      isDark={isDark}
                      severityHintShown={severityHintShown}
                      onHintShown={() => setSeverityHintShown(true)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      width: "min(380px, 40vw)", minHeight: 300,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: `1px dashed ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                      borderRadius: 24, padding: 32, textAlign: "center",
                    }}>
                    {allZonesDone ? (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ fontSize: 22, marginBottom: 10 }}>✨</div>
                        <div style={{ fontSize: 15, color: GOLD, fontFamily: "var(--font-sans)", fontWeight: 500 }}>
                          {lang === "ko" ? "피부 분석 준비 완료!"
                            : lang === "de" ? "Hautanalyse bereit!"
                            : "Skin Analysis Ready!"}
                        </div>
                        <div style={{ fontSize: 13, marginTop: 6, fontFamily: "var(--font-sans)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                          {lang === "ko" ? "결과를 확인하세요"
                            : lang === "de" ? "Ergebnisse ansehen"
                            : "Check your results"}
                        </div>
                      </motion.div>
                    ) : (
                      <>
                        <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontFamily: "var(--font-sans)" }}>
                          {copy.hint}
                        </p>
                        <div style={{ marginTop: 12, fontSize: 12, fontFamily: "var(--font-sans)", color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>
                          {lang === "ko"
                            ? `완료 ${selectedZones.size} / 전체 ${ZONES_DEF.length} 구역`
                            : lang === "de"
                            ? `${selectedZones.size} von ${ZONES_DEF.length} Zonen abgeschlossen`
                            : `${selectedZones.size} of ${ZONES_DEF.length} zones completed`}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Mobile bottom-sheet drawer */}
          <AnimatePresence>
            {isMobile && activeZone && (
              <div className="fixed inset-0 z-50 flex flex-col justify-end">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setActiveZone(null)}
                  style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  drag="y" dragConstraints={{ top: 0 }}
                  onDragEnd={(_, info) => { if (info.offset.y > 100) setActiveZone(null); }}
                  style={{
                    position: "relative",
                    background: isDark ? "#14141a" : "#ffffff",
                    borderRadius: "28px 28px 0 0",
                    padding: "12px 20px 40px",
                    maxHeight: "85vh", overflowY: "auto",
                    boxShadow: "0 -20px 60px rgba(0,0,0,0.3)",
                  }}>
                  <div style={{ width: 44, height: 4, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", margin: "0 auto 16px" }} />
                  <ConcernAndQuestionPanel
                    zone={activeZone}
                    concernSeverity={concernSeverity}
                    onToggle={toggleConcern}
                    onClose={() => setActiveZone(null)}
                    lang={lang}
                    isDark={isDark}
                    severityHintShown={severityHintShown}
                    onHintShown={() => setSeverityHintShown(true)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Pattern detection cards — show when 2+ concerns selected */}
          {detectedPatterns.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {detectedPatterns.map(patternId => {
                const card = PATTERN_CARDS[patternId];
                if (!card) return null;
                const content = card[lang];
                return (
                  <motion.div
                    key={patternId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "14px 18px", borderRadius: 14,
                      background: isDark ? "rgba(201,169,110,0.06)" : "rgba(122,162,115,0.06)",
                      border: `1px solid ${isDark ? "rgba(201,169,110,0.15)" : "rgba(122,162,115,0.15)"}`,
                    }}
                  >
                    <div style={{
                      fontSize: 12, fontWeight: 600, letterSpacing: "0.03em",
                      color: isDark ? "#c9a96e" : "#7A9E82",
                      fontFamily: "var(--font-sans)", marginBottom: 4,
                    }}>
                      🔍 {content.title}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
                      fontFamily: "var(--font-sans)", lineHeight: 1.5,
                    }}>
                      {content.body}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Submit button — mapping phase */}
          <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {totalSelected > 0 && (
              <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontFamily: "var(--font-sans)" }}>
                {copy.selected(totalSelected)}
              </p>
            )}
            <div style={{ marginLeft: "auto" }}>
              <motion.button
                onClick={handleMappingDone}
                disabled={!totalSelected || isAnalyzing}
                animate={allZonesDone && !isAnalyzing ? {
                  boxShadow: isDark ? [
                    "0 8px 24px rgba(201,169,110,0.4)",
                    "0 8px 40px rgba(201,169,110,0.85)",
                    "0 8px 24px rgba(201,169,110,0.4)",
                  ] : [
                    "0 8px 24px rgba(45,79,57,0.35)",
                    "0 8px 40px rgba(45,79,57,0.7)",
                    "0 8px 24px rgba(45,79,57,0.35)",
                  ],
                } : { boxShadow: totalSelected > 0 ? (isDark ? "0 4px 16px rgba(201,169,110,0.15)" : "0 4px 16px rgba(45,79,57,0.15)") : "none" }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 32px", borderRadius: 32,
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "var(--font-sans)", border: "none",
                  background: allZonesDone
                    ? (isDark ? "linear-gradient(135deg, #c9a96e, #a38555)" : "linear-gradient(135deg, #8EA273, #2D4F39)")
                    : totalSelected > 0
                      ? (isDark ? "linear-gradient(135deg, rgba(201,169,110,0.45), rgba(163,133,85,0.45))" : "linear-gradient(135deg, rgba(142,162,115,0.55), rgba(45,79,57,0.55))")
                      : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  color: totalSelected > 0 ? "#fff" : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                  cursor: (totalSelected > 0 && !isAnalyzing) ? "pointer" : "not-allowed",
                  opacity: isAnalyzing ? 0.65 : 1,
                  transition: "background 0.4s ease, opacity 0.2s ease",
                }}>
                {isAnalyzing ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%" }}
                    />
                    {lang === "ko" ? "분석 중…" : lang === "de" ? "Analysiere…" : "Analysing…"}
                  </>
                ) : (
                  <>
                    {copy.completeMappingCta}
                    <ChevronRight size={18} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* ── Step 7: FOLLOWUP phase ───────────────────────────────────────── */}
      {fmPhase === "followup" && (
        <>
          <TailQuestionSection
            tailQuestions={tailQuestions}
            lang={lang}
            isDark={isDark}
            axisAnswers={sessionAnswers}
            onAnswer={handleAnswer}
          />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <motion.button
              onClick={() => !isAnalyzing && buildAndSubmit()}
              disabled={isAnalyzing}
              whileTap={{ scale: isAnalyzing ? 1 : 0.97 }}
              animate={!isAnalyzing ? {
                boxShadow: isDark ? [
                  "0 8px 24px rgba(201,169,110,0.4)",
                  "0 8px 40px rgba(201,169,110,0.85)",
                  "0 8px 24px rgba(201,169,110,0.4)",
                ] : [
                  "0 8px 24px rgba(45,79,57,0.35)",
                  "0 8px 40px rgba(45,79,57,0.7)",
                  "0 8px 24px rgba(45,79,57,0.35)",
                ],
              } : { boxShadow: "none" }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 32px", borderRadius: 32,
                fontSize: 14, fontWeight: 600,
                fontFamily: "var(--font-sans)", border: "none",
                background: isDark ? "linear-gradient(135deg, #c9a96e, #a38555)" : "linear-gradient(135deg, #8EA273, #2D4F39)",
                color: isDark ? "#0d0d12" : "#fff",
                cursor: isAnalyzing ? "not-allowed" : "pointer",
                opacity: isAnalyzing ? 0.65 : 1,
                transition: "opacity 0.2s ease",
              }}>
              {isAnalyzing ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block", width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%" }}
                  />
                  {lang === "ko" ? "분석 중…" : lang === "de" ? "Analysiere…" : "Analysing…"}
                </>
              ) : (
                <>
                  {copy.seeResultsCta}
                  <ChevronRight size={18} />
                </>
              )}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

export default FaceMapStep;
