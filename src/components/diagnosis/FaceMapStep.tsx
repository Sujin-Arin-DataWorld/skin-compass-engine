import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronRight } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore } from "@/store/i18nStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoneId = "forehead" | "nose" | "eyes" | "cheeks" | "chin_mouth" | "neck";
type Lang = "en" | "de" | "ko";

interface Concern {
  id: string;
  label: Record<Lang, string>;
  axis: string;
}

// ─── Zone concern data ────────────────────────────────────────────────────────

const ZONE_CONCERNS: Record<ZoneId, Concern[]> = {
  forehead: [
    { id: "oily_tzone",          label: { en: "Oily / Shiny",                    de: "Ölig / Glänzend",                         ko: "유분 / 번들거림"           }, axis: "seb"     },
    { id: "blackheads_forehead", label: { en: "Blackheads",                       de: "Mitesser",                                ko: "블랙헤드"                 }, axis: "texture" },
    { id: "whiteheads_forehead", label: { en: "Whiteheads / Closed Comedones",    de: "Weiße Mitesser / Komedonen",              ko: "화이트헤드 / 폐쇄면포"    }, axis: "texture" },
    { id: "forehead_lines",      label: { en: "Forehead Lines / Wrinkles",        de: "Stirnfalten / Runzeln",                   ko: "이마 주름"                }, axis: "aging"   },
    { id: "forehead_breakouts",  label: { en: "Breakouts / Acne",                 de: "Unreinheiten / Akne",                     ko: "트러블 / 여드름"          }, axis: "acne"    },
  ],
  nose: [
    { id: "large_pores_nose",    label: { en: "Enlarged Pores",                   de: "Vergrößerte Poren",                       ko: "모공 확장"                }, axis: "texture" },
    { id: "blackheads_nose",     label: { en: "Blackheads / Sebaceous Filaments", de: "Mitesser / Talgfilamente",                ko: "블랙헤드 / 피지막"        }, axis: "texture" },
    { id: "oily_nose",           label: { en: "Excessive Oil / Shine",            de: "Übermäßiger Glanz / Öl",                  ko: "과도한 유분 / 광택"       }, axis: "seb"     },
    { id: "redness_nose",        label: { en: "Redness around Nose",              de: "Rötungen um die Nase",                    ko: "코 주변 홍조"             }, axis: "sen"     },
  ],
  eyes: [
    { id: "fine_lines_eyes",     label: { en: "Fine Lines / Crow's Feet",         de: "Feine Linien / Krähenfüße",               ko: "잔주름 / 눈가 주름"       }, axis: "aging"   },
    { id: "dark_circles",        label: { en: "Dark Circles",                     de: "Augenringe",                              ko: "다크서클"                 }, axis: "pigment" },
    { id: "puffiness",           label: { en: "Puffiness / Swelling",             de: "Schwellungen / Tränensäcke",              ko: "붓기 / 부종"              }, axis: "aging"   },
    { id: "dryness_eyes",        label: { en: "Dryness / Flaking",                de: "Trockenheit / Schuppung",                 ko: "건조함 / 각질"            }, axis: "hyd"     },
  ],
  cheeks: [
    { id: "redness_cheeks",      label: { en: "Redness / Rosacea / Couperose",    de: "Rötungen / Rosacea / Couperose",          ko: "홍조 / 로사세아 / 쿠페로제"}, axis: "sen"     },
    { id: "cheek_acne",          label: { en: "Breakouts / Acne on Cheeks",       de: "Unreinheiten auf den Wangen",             ko: "볼 트러블 / 여드름"       }, axis: "acne"    },
    { id: "dryness_cheeks",      label: { en: "Dryness / Tightness",              de: "Trockenheit / Spannungsgefühl",           ko: "건조함 / 당김"            }, axis: "hyd"     },
    { id: "pigmentation_cheeks", label: { en: "Dark Spots / Hyperpigmentation",   de: "Dunkle Flecken / Hyperpigmentierung",     ko: "기미 / 색소침착"          }, axis: "pigment" },
    { id: "large_pores_cheeks",  label: { en: "Visible Pores",                    de: "Sichtbare Poren",                         ko: "가시적 모공"              }, axis: "texture" },
  ],
  chin_mouth: [
    { id: "hormonal_breakouts",  label: { en: "Recurring Breakouts (Jawline/Chin)", de: "Wiederkehrende Unreinheiten (Kiefer/Kinn)", ko: "반복 트러블 (턱선/턱)"  }, axis: "acne"    },
    { id: "dryness_lips",        label: { en: "Dryness around Mouth",             de: "Trockenheit um den Mund",                 ko: "입 주변 건조함"           }, axis: "hyd"     },
    { id: "nasolabial",          label: { en: "Nasolabial Folds / Smile Lines",   de: "Nasolabialfalten / Lachfalten",           ko: "팔자주름 / 미소 주름"     }, axis: "aging"   },
    { id: "pigmentation_mouth",  label: { en: "Dark Spots around Mouth",          de: "Dunkle Flecken um den Mund",              ko: "입 주변 색소침착"         }, axis: "pigment" },
  ],
  neck: [
    { id: "neck_wrinkles",       label: { en: "Neck Lines / Tech Neck",           de: "Halsfalten / Tech-Neck",                  ko: "목 주름 / 텍넥"           }, axis: "aging"   },
    { id: "neck_sagging",        label: { en: "Loss of Firmness",                 de: "Verlust an Festigkeit",                   ko: "탄력 감소"                }, axis: "aging"   },
    { id: "neck_sensitivity",    label: { en: "Redness / Irritation",             de: "Rötungen / Reizungen",                    ko: "홍조 / 자극"              }, axis: "sen"     },
    { id: "neck_dryness",        label: { en: "Dryness / Rough Texture",          de: "Trockenheit / Raue Textur",               ko: "건조함 / 거친 결"         }, axis: "hyd"     },
  ],
};

// ─── Zone display labels ──────────────────────────────────────────────────────

const ZONE_LABELS: Record<ZoneId, Record<Lang, string>> = {
  forehead:  { en: "Forehead",        de: "Stirn",           ko: "이마"      },
  nose:      { en: "Nose / T-Zone",   de: "Nase / T-Zone",   ko: "코 / T존"  },
  eyes:      { en: "Eye Area",        de: "Augenpartie",     ko: "눈 주위"   },
  cheeks:    { en: "Cheeks",          de: "Wangen",          ko: "볼"        },
  chin_mouth:{ en: "Chin & Mouth",    de: "Kinn & Mund",     ko: "턱 & 입"   },
  neck:      { en: "Neck",            de: "Hals",            ko: "목"        },
};

// ─── UI copy ──────────────────────────────────────────────────────────────────

const COPY: Record<Lang, {
  title: string; subtitle: string;
  selected: (n: number) => string;
  close: string; continue: string;
  placeholderHint: string;
}> = {
  en: {
    title:           "Where do you notice concerns?",
    subtitle:        "Tap a zone on the face map to select specific skin concerns.",
    selected:        (n) => n === 1 ? "1 concern selected" : `${n} concerns selected`,
    close:           "Done",
    continue:        "Continue",
    placeholderHint: "Tap a zone on the face to get started",
  },
  de: {
    title:           "Wo bemerken Sie Hautprobleme?",
    subtitle:        "Tippen Sie auf eine Zone, um spezifische Hautanliegen auszuwählen.",
    selected:        (n) => `${n} ${n === 1 ? "Anliegen" : "Anliegen"} ausgewählt`,
    close:           "Fertig",
    continue:        "Weiter",
    placeholderHint: "Tippen Sie auf eine Zone der Gesichtskarte",
  },
  ko: {
    title:           "어느 부위가 걱정되시나요?",
    subtitle:        "얼굴 지도에서 구역을 탭하여 피부 고민을 선택하세요.",
    selected:        (n) => `${n}개 선택됨`,
    close:           "완료",
    continue:        "계속",
    placeholderHint: "얼굴 지도에서 구역을 탭하여 시작하세요",
  },
};

// ─── Zone glow ellipse positions ─────────────────────────────────────────────
// Coordinate space: SVG viewBox "20 0 160 235"
// Face ellipse: cx=100, cy=100, rx=48, ry=65 → top Y=35, bottom Y=165

const GLOW_SHAPES: Record<ZoneId, { cx: number; cy: number; rx: number; ry: number }> = {
  forehead:  { cx: 100, cy: 60,  rx: 32, ry: 20 },
  eyes:      { cx: 100, cy: 83,  rx: 44, ry: 10 },
  nose:      { cx: 100, cy: 107, rx: 14, ry: 16 },
  cheeks:    { cx: 100, cy: 118, rx: 46, ry: 26 },
  chin_mouth:{ cx: 100, cy: 140, rx: 28, ry: 18 },
  neck:      { cx: 100, cy: 193, rx: 18, ry: 28 },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function zonesWithSelections(selectedConcerns: Set<string>): Set<ZoneId> {
  const zones = new Set<ZoneId>();
  for (const [zoneId, concerns] of Object.entries(ZONE_CONCERNS)) {
    if (concerns.some((c) => selectedConcerns.has(c.id))) {
      zones.add(zoneId as ZoneId);
    }
  }
  return zones;
}

// ─── Face SVG ─────────────────────────────────────────────────────────────────

interface FaceSVGProps {
  selectedZones: Set<ZoneId>;
  activeZone: ZoneId | null;
  hoveredZone: ZoneId | null;
  onZoneClick: (zone: ZoneId) => void;
  onZoneHover: (zone: ZoneId | null) => void;
}

const ALL_ZONES: ZoneId[] = ["forehead", "eyes", "nose", "cheeks", "chin_mouth", "neck"];

function FaceSVG({ selectedZones, activeZone, hoveredZone, onZoneClick, onZoneHover }: FaceSVGProps) {
  const getGlowOpacity = (zone: ZoneId) => {
    if (activeZone === zone) return 0.65;
    if (selectedZones.has(zone)) return 0.42;
    if (hoveredZone === zone) return 0.34;
    return 0;
  };

  return (
    <svg
      viewBox="20 0 160 235"
      className="w-full max-w-[210px] h-auto mx-auto select-none touch-manipulation"
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id="fm-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Glow overlays (below face lines) ── */}
      {ALL_ZONES.map((zone) => {
        const opacity = getGlowOpacity(zone);
        if (opacity <= 0) return null;
        const s = GLOW_SHAPES[zone];
        return (
          <motion.ellipse
            key={`glow-${zone}`}
            cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
            fill="#C9A96E"
            filter="url(#fm-glow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: selectedZones.has(zone)
                ? [opacity - 0.12, opacity, opacity - 0.12]
                : hoveredZone === zone
                ? [opacity - 0.1, opacity, opacity - 0.1]
                : opacity,
            }}
            transition={
              selectedZones.has(zone)
                ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                : hoveredZone === zone
                ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.18 }
            }
          />
        );
      })}

      {/* ── Decorative face lines ── */}

      {/* Face oval */}
      <ellipse
        cx="100" cy="100" rx="48" ry="65"
        fill="none"
        stroke="hsl(var(--face-stroke))"
        strokeWidth="1.5"
      />

      {/* Hairline */}
      <path
        d="M 57,65 Q 62,28 100,23 Q 138,28 143,65"
        fill="none"
        stroke="hsl(var(--face-detail) / 0.4)"
        strokeWidth="0.9"
      />

      {/* Left eyebrow */}
      <path
        d="M 69,78 Q 79,71 92,74"
        fill="none"
        stroke="hsl(var(--face-detail))"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* Right eyebrow */}
      <path
        d="M 108,74 Q 121,71 131,78"
        fill="none"
        stroke="hsl(var(--face-detail))"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Left eye (almond) */}
      <path
        d="M 69,85 Q 80,79 91,85 Q 80,91 69,85 Z"
        fill="none"
        stroke="hsl(var(--face-detail))"
        strokeWidth="0.9"
      />
      {/* Right eye (almond) */}
      <path
        d="M 109,85 Q 120,79 131,85 Q 120,91 109,85 Z"
        fill="none"
        stroke="hsl(var(--face-detail))"
        strokeWidth="0.9"
      />

      {/* Nose bridge + tip */}
      <path
        d="M 97,94 L 96,116 Q 100,121 104,116 L 103,94"
        fill="none"
        stroke="hsl(var(--face-detail) / 0.5)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Upper lip bow */}
      <path
        d="M 88,132 Q 94,128 100,131 Q 106,128 112,132"
        fill="none"
        stroke="hsl(var(--face-detail))"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* Lower lip */}
      <path
        d="M 88,132 Q 100,140 112,132"
        fill="none"
        stroke="hsl(var(--face-detail))"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Chin cleft suggestion */}
      <path
        d="M 97,156 Q 100,160 103,156"
        fill="none"
        stroke="hsl(var(--face-detail) / 0.35)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />

      {/* Neck lines */}
      <path
        d="M 84,165 C 82,183 80,198 78,213"
        fill="none"
        stroke="hsl(var(--face-detail) / 0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 116,165 C 118,183 120,198 122,213"
        fill="none"
        stroke="hsl(var(--face-detail) / 0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Collarbone hint */}
      <path
        d="M 55,220 C 72,212 90,208 100,208 C 110,208 128,212 145,220"
        fill="none"
        stroke="hsl(var(--face-detail) / 0.3)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* ── Zone hit areas (transparent, pointer-events:all) ── */}

      {/* Forehead */}
      <path
        d="M 56,75 C 59,50 73,37 100,36 C 127,37 141,50 144,75 Z"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("forehead")}
        onMouseEnter={() => onZoneHover("forehead")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Eyes row */}
      <rect
        x="52" y="72" width="96" height="24"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("eyes")}
        onMouseEnter={() => onZoneHover("eyes")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Nose */}
      <rect
        x="87" y="92" width="26" height="32"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("nose")}
        onMouseEnter={() => onZoneHover("nose")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Left cheek */}
      <path
        d="M 52,80 L 85,80 L 83,155 C 63,150 52,128 52,95 Z"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("cheeks")}
        onMouseEnter={() => onZoneHover("cheeks")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Right cheek */}
      <path
        d="M 115,80 L 148,80 C 148,128 137,150 117,155 Z"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("cheeks")}
        onMouseEnter={() => onZoneHover("cheeks")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Chin & Mouth */}
      <path
        d="M 60,120 L 140,120 L 128,165 C 116,170 84,170 72,165 Z"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("chin_mouth")}
        onMouseEnter={() => onZoneHover("chin_mouth")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Neck */}
      <path
        d="M 80,165 L 120,165 L 118,220 L 82,220 Z"
        fill="transparent"
        style={{ pointerEvents: "all", cursor: "pointer" }}
        onClick={() => onZoneClick("neck")}
        onMouseEnter={() => onZoneHover("neck")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* ── Zone indicator dots ── */}
      {ALL_ZONES.map((zone) => {
        const s = GLOW_SHAPES[zone];
        const active = selectedZones.has(zone) || activeZone === zone;
        return (
          <motion.circle
            key={`dot-${zone}`}
            cx={s.cx} cy={s.cy} r={active ? 3.5 : 2.5}
            fill={active ? "#C9A96E" : "hsl(var(--muted-foreground) / 0.3)"}
            style={{ pointerEvents: "none" }}
            animate={active
              ? { r: [3.5, 4.5, 3.5], opacity: [0.9, 1, 0.9] }
              : { r: 2.5, opacity: 0.5 }
            }
            transition={active
              ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              : {}
            }
          />
        );
      })}

      {/* Cheeks gets two dots */}
      {(["cheeks"] as ZoneId[]).map(() => {
        const active = selectedZones.has("cheeks") || activeZone === "cheeks";
        return [
          <motion.circle key="dot-cheek-l" cx={66} cy={118} r={active ? 3.5 : 2.5}
            fill={active ? "#C9A96E" : "hsl(var(--muted-foreground) / 0.3)"}
            style={{ pointerEvents: "none" }}
            animate={active ? { r: [3.5, 4.5, 3.5] } : { r: 2.5 }}
            transition={active ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : {}}
          />,
          <motion.circle key="dot-cheek-r" cx={134} cy={118} r={active ? 3.5 : 2.5}
            fill={active ? "#C9A96E" : "hsl(var(--muted-foreground) / 0.3)"}
            style={{ pointerEvents: "none" }}
            animate={active ? { r: [3.5, 4.5, 3.5] } : { r: 2.5 }}
            transition={active ? { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 } : {}}
          />,
        ];
      })}
    </svg>
  );
}

// ─── Concern item ─────────────────────────────────────────────────────────────

function ConcernItem({
  concern, selected, onToggle, lang,
}: {
  concern: Concern; selected: boolean; onToggle: () => void; lang: Lang;
}) {
  return (
    <motion.button
      onClick={onToggle}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all min-h-[44px] touch-manipulation border ${
        selected
          ? "bg-amber-500/12 border-amber-500/40 text-foreground"
          : "bg-secondary/30 border-transparent hover:border-border/60 text-muted-foreground hover:text-foreground"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <span className="leading-snug">{concern.label[lang]}</span>
      <motion.span
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? "bg-amber-500 border-amber-500" : "border-muted-foreground/40"
        }`}
        animate={{ scale: selected ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.2 }}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </motion.span>
    </motion.button>
  );
}

// ─── Desktop side panel ───────────────────────────────────────────────────────

function ZoneConcernPanel({
  zone, selectedConcerns, onToggle, onClose, lang,
}: {
  zone: ZoneId; selectedConcerns: Set<string>; onToggle: (id: string) => void;
  onClose: () => void; lang: Lang;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="w-72 flex-shrink-0 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[0.7rem] tracking-[0.18em] uppercase text-amber-600 dark:text-amber-400 font-medium"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {ZONE_LABELS[zone][lang]}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {ZONE_CONCERNS[zone].map((concern) => (
          <ConcernItem
            key={concern.id}
            concern={concern}
            selected={selectedConcerns.has(concern.id)}
            onToggle={() => onToggle(concern.id)}
            lang={lang}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Mobile bottom drawer ─────────────────────────────────────────────────────

function ZoneConcernDrawer({
  zone, selectedConcerns, onToggle, onClose, lang,
}: {
  zone: ZoneId; selectedConcerns: Set<string>; onToggle: (id: string) => void;
  onClose: () => void; lang: Lang;
}) {
  const copy = COPY[lang];
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background border-t border-border shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90) onClose(); }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pt-1 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-base font-light tracking-[0.15em] uppercase text-amber-600 dark:text-amber-400"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {ZONE_LABELS[zone][lang]}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pb-1">
            {ZONE_CONCERNS[zone].map((concern) => (
              <ConcernItem
                key={concern.id}
                concern={concern}
                selected={selectedConcerns.has(concern.id)}
                onToggle={() => onToggle(concern.id)}
                lang={lang}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-secondary/80 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors min-h-[50px] touch-manipulation"
          >
            {copy.close}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FaceMapStepProps {
  onNext: () => void;
}

export function FaceMapStep({ onNext }: FaceMapStepProps) {
  const { language } = useI18nStore();
  const lang = language as Lang;
  const store = useDiagnosisStore();
  const copy = COPY[lang];

  const [selectedConcerns, setSelectedConcerns] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const selectedZones = useMemo(() => zonesWithSelections(selectedConcerns), [selectedConcerns]);

  const toggleConcern = useCallback((id: string) => {
    setSelectedConcerns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleZoneClick = useCallback((zone: ZoneId) => {
    setActiveZone((prev) => (prev === zone ? null : zone));
  }, []);

  const handleNext = useCallback(() => {
    // Map concerns → axis weight hints for the engine
    const axisMap: Record<string, number> = {};
    for (const concernId of selectedConcerns) {
      for (const concerns of Object.values(ZONE_CONCERNS)) {
        const found = concerns.find((c) => c.id === concernId);
        if (found) {
          axisMap[found.axis] = (axisMap[found.axis] ?? 0) + 1;
        }
      }
    }
    // Build typed SelectedZones (zoneId → concern IDs) and sync via setAllZones
    const zoneMap: Record<string, { concerns: string[] }> = {};
    for (const [zoneId, concerns] of Object.entries(ZONE_CONCERNS)) {
      const selected = concerns.filter((c) => selectedConcerns.has(c.id)).map((c) => c.id);
      if (selected.length > 0) zoneMap[zoneId] = { concerns: selected };
    }
    store.actions.setAllZones(zoneMap);
    store.setUiSignals("faceMap", axisMap as Record<string, unknown>);
    onNext();
  }, [selectedConcerns, store, onNext]);

  return (
    <div className="w-full">
      {/* Header */}
      <h2
        className="text-3xl text-foreground font-light mb-2 leading-tight"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        {copy.title}
      </h2>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        {copy.subtitle}
      </p>

      {/* Layout */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">

        {/* Left: SVG + zone pills */}
        <div className="flex-shrink-0 flex flex-col items-center md:items-start">
          <FaceSVG
            selectedZones={selectedZones}
            activeZone={activeZone}
            hoveredZone={hoveredZone}
            onZoneClick={handleZoneClick}
            onZoneHover={setHoveredZone}
          />

          {/* Zone label pills */}
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center md:justify-start max-w-[210px]">
            {(Object.keys(ZONE_LABELS) as ZoneId[]).map((zone) => (
              <button
                key={zone}
                onClick={() => handleZoneClick(zone)}
                className={`text-[0.6rem] px-2.5 py-1 rounded-full border transition-all min-h-[26px] touch-manipulation leading-none ${
                  selectedZones.has(zone)
                    ? "border-amber-500/60 bg-amber-500/12 text-amber-600 dark:text-amber-400"
                    : activeZone === zone
                    ? "border-border bg-secondary text-foreground"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {ZONE_LABELS[zone][lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Desktop concern panel / placeholder */}
        <AnimatePresence mode="wait">
          {!isMobile && activeZone && (
            <ZoneConcernPanel
              key={activeZone}
              zone={activeZone}
              selectedConcerns={selectedConcerns}
              onToggle={toggleConcern}
              onClose={() => setActiveZone(null)}
              lang={lang}
            />
          )}
          {!isMobile && !activeZone && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:flex flex-col items-center justify-center w-72 min-h-[200px] rounded-2xl border border-dashed border-border/40 text-muted-foreground"
            >
              <div className="text-center px-8">
                <svg viewBox="0 0 24 24" className="w-7 h-7 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-xs leading-relaxed opacity-60">{copy.placeholderHint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: Bottom drawer */}
      <AnimatePresence>
        {isMobile && activeZone && (
          <ZoneConcernDrawer
            zone={activeZone}
            selectedConcerns={selectedConcerns}
            onToggle={toggleConcern}
            onClose={() => setActiveZone(null)}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* Floating selection pill */}
      <AnimatePresence>
        {selectedConcerns.size > 0 && (
          <motion.div
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 rounded-full border border-amber-500/25 bg-background/92 px-5 py-2.5 text-sm shadow-lg backdrop-blur-md"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.9 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[0.62rem] font-medium text-white flex-shrink-0">
              {selectedConcerns.size}
            </span>
            <span className="text-foreground whitespace-nowrap">{copy.selected(selectedConcerns.size)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <div className="mt-10 flex items-center justify-between">
        {/* Empty left side to mirror shared nav layout */}
        <div />
        <motion.button
          onClick={handleNext}
          disabled={selectedConcerns.size === 0}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 min-h-[44px] touch-manipulation"
          whileTap={{ scale: 0.97 }}
        >
          {copy.continue}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

export default FaceMapStep;
