import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronRight } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore } from "@/store/i18nStore";
import { AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { QuestionDef, LocalizedText, QuestionAnswer } from "@/engine/questionRoutingV5";
import { useTheme } from "next-themes";
import facemapImg from "@/assets/facemap_final.png";

// ─── 타입 정의 ────────────────────────────────────────────────────────────────
// 7개의 임상 기능 존 (좌우 대칭 존은 하나로 통합)
type ZoneId =
  | "forehead"     // 이마
  | "t_zone"       // 코 & T존
  | "eyes"         // 눈가 & 눈밑 (다크서클 통합)
  | "cheeks"       // 볼 (좌우 통합)
  | "mouth_chin"   // 입가 & 턱
  | "jawline"      // 턱선 (좌우 통합)
  | "neck";        // 목

type Lang = "en" | "de" | "ko";

interface Concern { id: string; label: Record<Lang, string>; axis: string; }

// ─── Axis mappings ────────────────────────────────────────────────────────────
const CONCERN_AXIS_ID: Record<string, number> = {
  seb: 1, hyd: 2, pores: 3, texture: 4,
  sen: 5, aging: 6, pigment: 7, hormonal: 8,
};

const AXIS_COLOR: Record<number, string> = {
  1: "rgba(201,169,110,0.8)", 2: "rgba(100,180,220,0.8)",
  3: "rgba(160,140,120,0.8)", 4: "rgba(220,120,120,0.8)",
  5: "rgba(220,160,160,0.8)", 6: "rgba(180,160,200,0.8)",
  7: "rgba(180,140,100,0.8)", 8: "rgba(200,130,170,0.8)",
};

const gt = (t: LocalizedText, lang: Lang): string =>
  (t as unknown as Record<string, string>)[lang] ?? (t as unknown as Record<string, string>).en;

// ─── 존 이름 (7개 임상 존) ────────────────────────────────────────────────────
const ZONE_LABELS: Record<ZoneId, Record<Lang, string>> = {
  forehead:   { en: "Forehead",      de: "Stirn",          ko: "이마"         },
  t_zone:     { en: "Nose & T-Zone", de: "Nase & T-Zone",  ko: "코 & T존"      },
  eyes:       { en: "Eye Area",      de: "Augenpartie",    ko: "눈가 & 눈밑"   },
  cheeks:     { en: "Cheeks",        de: "Wangen",         ko: "볼"           },
  mouth_chin: { en: "Mouth & Chin",  de: "Mund & Kinn",    ko: "입가 & 턱"     },
  jawline:    { en: "Jawline",       de: "Kieferlinie",    ko: "턱선"         },
  neck:       { en: "Neck",          de: "Hals",           ko: "목"           },
};

// ─── 존별 피부 고민 데이터 (7개 임상 존으로 단순화) ───────────────────────────
// 대칭 존(볼, 턱선)은 좌우 하나로 통합 → 중복 없이 정확한 진단 가중치 산출
const ZONE_CONCERNS: Record<ZoneId, Concern[]> = {
  // 이마 — 피지·노화·트러블 중심
  forehead: [
    { id: "oily_f",      label: { en: "Oily / Shiny",      de: "Ölig / Glänzend",    ko: "유분 / 번들거림" }, axis: "seb"     },
    { id: "lines_f",     label: { en: "Forehead Lines",    de: "Stirnfalten",         ko: "이마 주름"       }, axis: "aging"   },
    { id: "breakouts_f", label: { en: "Breakouts",         de: "Unreinheiten",        ko: "트러블"          }, axis: "texture" },
  ],

  // 코 & T존 — 모공·피지 집중 구역
  t_zone: [
    { id: "bh_t",    label: { en: "Blackheads (Nose)", de: "Mitesser (Nase)",   ko: "블랙헤드 / 피지" }, axis: "pores" },
    { id: "pores_t", label: { en: "Enlarged Pores",    de: "Vergrößerte Poren", ko: "넓은 모공"        }, axis: "pores" },
  ],

  // 눈가 & 눈밑 통합 — 노화·색소·볼륨 감소 (이전 eyes + dark_circles 통합)
  eyes: [
    { id: "dc_e",        label: { en: "Dark Circles",       de: "Dunkle Augenringe",  ko: "다크서클"        }, axis: "pigment" },
    { id: "finelines_e", label: { en: "Fine Lines",         de: "Feine Linien",       ko: "잔주름"           }, axis: "aging"   },
    { id: "hollow_e",    label: { en: "Under-Eye Hollows",  de: "Eingefallene Augen", ko: "눈밑 꺼짐"        }, axis: "aging"   },
  ],

  // 볼 (좌우 통합) — 민감성·수분·색소 중심
  // SVG에서 좌우 hitPath가 모두 이 존을 가리킴 → 클릭 시 동일 패널 표시
  cheeks: [
    { id: "red_c",  label: { en: "Redness / Flushing",   de: "Rötungen",        ko: "홍조 / 붉은기"   }, axis: "sen"     },
    { id: "dry_c",  label: { en: "Dryness / Tightness",  de: "Trockenheit",     ko: "건조함 / 당김"   }, axis: "hyd"     },
    { id: "pigm_c", label: { en: "Sun Spots / Pigment",  de: "Pigmentflecken",  ko: "기미 / 색소침착" }, axis: "pigment" },
  ],

  // 입가 & 턱 — 표정주름(팔자)·호르몬성 트러블·수분 (턱선과 임상적으로 구분)
  mouth_chin: [
    { id: "nasolabial", label: { en: "Nasolabial Folds",    de: "Nasolabialfalten",       ko: "팔자주름"        }, axis: "aging"    },
    { id: "hormonal_m", label: { en: "Chin Breakouts",      de: "Unreinheiten am Kinn",   ko: "턱 주변 트러블"  }, axis: "hormonal" },
    { id: "dry_m",      label: { en: "Dry Lips / Perioral", de: "Trockene Lippen",        ko: "입가 건조함"     }, axis: "hyd"      },
  ],

  // 턱선 (좌우 통합) — 중력성 처짐·림프성 여드름 (입/턱 존과 임상적으로 구분)
  // SVG에서 좌우 hitPath가 모두 이 존을 가리킴 → 클릭 시 동일 패널 표시
  jawline: [
    { id: "sag_j",    label: { en: "Loss of Firmness", de: "Konturverlust",  ko: "턱선 탄력 저하" }, axis: "aging"    },
    { id: "jaw_acne", label: { en: "Jawline Acne",     de: "Akne am Kiefer", ko: "턱선 여드름"    }, axis: "hormonal" },
  ],

  // 목 — 노화·수분 (목 주름·텍넥 집중)
  neck: [
    { id: "neck_lines", label: { en: "Neck Lines",     de: "Halsfalten",  ko: "목 주름"     }, axis: "aging" },
    { id: "neck_dry",   label: { en: "Rough Texture",  de: "Raue Textur", ko: "거친 피부결" }, axis: "hyd"   },
  ],
};

// ─── Copy strings ─────────────────────────────────────────────────────────────
const COPY: Record<Lang, {
  title: string; subtitle: string;
  selected: (n: number) => string;
  close: string; continue: string; hint: string;
  confirmSelection: string; completeCta: string; resultsCta: string;
}> = {
  en: {
    title: "Where do you notice concerns?",
    subtitle: "Tap a clinical zone on the face map to analyse your skin condition.",
    selected: (n) => n === 1 ? "1 concern selected" : `${n} concerns selected`,
    close: "Done", continue: "Continue",
    hint: "Tap a zone on the face map to begin",
    confirmSelection: "Confirm Selection",
    completeCta: "Please complete analysis",
    resultsCta: "Check Results",
  },
  de: {
    title: "Wo bemerken Sie Hautprobleme?",
    subtitle: "Tippen Sie auf eine klinische Zone für eine Tiefenanalyse.",
    selected: (n) => `${n} Anliegen ausgewählt`,
    close: "Fertig", continue: "Weiter",
    hint: "Tippen Sie auf eine Zone, um zu beginnen",
    confirmSelection: "Auswahl bestätigen",
    completeCta: "Analyse abschließen",
    resultsCta: "Ergebnisse ansehen",
  },
  ko: {
    title: "어느 부위가 신경 쓰이시나요?",
    subtitle: "얼굴 지도에서 구역을 탭하여 피부 상태를 분석하세요.",
    selected: (n) => `${n}개 선택됨`,
    close: "완료", continue: "계속",
    hint: "얼굴 지도에서 구역을 탭하여 시작하세요",
    confirmSelection: "선택 완료",
    completeCta: "분석을 완료하세요",
    resultsCta: "결과 확인하기",
  },
};

// ─── SVG Geometry ─────────────────────────────────────────────────────────────
// viewBox "-50 0 600 700" — face coords unchanged; 50px padding each side for labels.
// The container uses aspect-ratio 600/700 with objectFit cover.
//
// Dot layout (facemap.jpg portrait, face centered ~250, hairline ~y80):
//   Forehead    y≈120   eyes y≈215   dark circles y≈255
//   Nose/T-zone y≈185–310   cheeks y≈290–360
//   Mouth/chin  y≈390   jawline y≈450  neck y≈530
//
// Each zone has:
//   dots       — clinical dot positions (shown always, gold when active)
//   connectors — lines connecting dots within/across zone (always faint, gold when active)
//   annotLine  — callout line pointing outside the face (only when active)
//   hitPath    — transparent click target

interface ZoneDef {
  zone: ZoneId;
  dots: { x: number; y: number }[];
  connectors?: { x1: number; y1: number; x2: number; y2: number }[];
  annotLine?: { x1: number; y1: number; x2: number; y2: number };
  hitPath: string;
}

// ─── SVG 존 기하 데이터 ───────────────────────────────────────────────────────
// viewBox "-50 0 600 700" 기준 — 얼굴 좌표 유지, 양옆 50px 여백 추가.
// 대칭 존(볼·턱선)은 단일 항목에 좌우 모든 도트·연결선을 통합:
//   hitPath에 두 개의 서브패스(M...Z M...Z)를 사용해 좌우 영역을 동시에 커버
//   → 어느 쪽을 클릭/호버해도 onZoneClick/hoveredZone이 동일 ID로 발동
const ZONES_DEF: ZoneDef[] = [
  // ── 이마 (Forehead) ───────────────────────────────────────────────────────
  {
    zone: "forehead",
    dots: [
      { x: 260, y: 120 },   // 이마 중앙
      { x: 200, y: 150 },   // 이마 좌측
      { x: 320, y: 150 },   // 이마 우측
    ],
    connectors: [
      { x1: 200, y1: 150, x2: 320, y2: 150 },   // 이마 가로 연결선
      { x1: 260, y1: 120, x2: 260, y2: 150 },   // 중앙 수직 연결선
    ],
    annotLine: { x1: 200, y1: 150, x2: 70, y2: 135 },
    hitPath: "M 125 82 L 375 82 L 370 192 L 130 192 Z M 60 110 L 200 110 L 200 170 L 60 170 Z",
  },

  // ── 코 & T존 (Nose & T-Zone) — 3개 도트로 T자 세로 축 완성 ───────────────
  // 미간(Glabella) → 코 브릿지 → 코 끝 3점이 T존의 세로 기둥을 형성
  {
    zone: "t_zone",
    dots: [
      { x: 258, y: 192 },   // 미간 (Glabella) — T존 상단 기준점
      { x: 258, y: 248 },   // 코 브릿지 (Nose bridge) — T존 중간
      { x: 258, y: 305 },   // 코 끝 (Nose tip) — T존 하단
    ],
    connectors: [
      { x1: 258, y1: 192, x2: 258, y2: 248 },   // 미간 → 브릿지 세로선
      { x1: 258, y1: 248, x2: 258, y2: 305 },   // 브릿지 → 코끝 세로선
    ],
    annotLine: { x1: 258, y1: 192, x2: 440, y2: 170 },
    hitPath: "M 215 178 L 285 178 L 290 332 L 210 332 Z M 250 150 L 450 150 L 450 200 L 250 200 Z",
  },

  // ── 눈가 & 눈밑 통합 (Eye Area + Under-Eye) ─────────────────────────────
  // eyes + dark_circles 통합 — 눈 높이와 눈밑을 사각형 프레임으로 연결
  {
    zone: "eyes",
    dots: [
      { x: 150, y: 218 },   // 좌안 외측
      { x: 370, y: 218 },   // 우안 외측
      { x: 150, y: 270 },   // 좌측 눈밑 (다크서클)
      { x: 370, y: 270 },   // 우측 눈밑 (다크서클)
    ],
    connectors: [
      { x1: 150, y1: 218, x2: 370, y2: 218 },   // 눈 높이 가로선
      { x1: 150, y1: 218, x2: 150, y2: 270 },   // 좌측 수직 연결선
      { x1: 370, y1: 218, x2: 370, y2: 270 },   // 우측 수직 연결선
      { x1: 150, y1: 270, x2: 370, y2: 270 },   // 눈밑 가로선
    ],
    annotLine: { x1: 370, y1: 218, x2: 440, y2: 230 },
    hitPath: "M 125 195 L 375 195 L 375 282 L 125 282 Z M 370 210 L 460 210 L 460 250 L 370 250 Z",
  },

  // ── 볼 통합 (Cheeks — 좌우 각 1개 도트, 라벨 인출선 1개) ──────────────────
  // 양 볼에 점 하나씩 (2개), 연결선 없음, annotLine 1개로 라벨만 표시
  // hitPath: M...Z M...Z 두 서브패스 → 좌우 어느 쪽 클릭/호버도 동일 반응
  {
    zone: "cheeks",
    dots: [
      { x: 160, y: 318 },   // 왼볼 중앙 1개
      { x: 352, y: 318 },   // 오른볼 중앙 1개
    ],
    connectors: [],   // 볼은 연결선 없음 — 점 두 개만 표시
    annotLine: { x1: 148, y1: 318, x2: 82, y2: 318 },   // 왼쪽으로 라벨 인출
    hitPath: "M 100 278 L 215 278 L 218 378 L 102 375 Z M 285 278 L 400 278 L 398 375 L 282 378 Z",
  },

  // ── 입가 & 턱 (Mouth & Chin) ─────────────────────────────────────────────
  // 팔자주름·호르몬 트러블 중심 — 턱선의 중력성 처짐과 임상적으로 구분
  {
    zone: "mouth_chin",
    dots: [
      { x: 200, y: 350 },   // 입 왼쪽 코너
      { x: 320, y: 350 },   // 입 오른쪽 코너
      { x: 260, y: 418 },   // 턱 중앙
    ],
    connectors: [
      { x1: 200, y1: 350, x2: 320, y2: 350 },   // 입술 가로 연결선
      { x1: 260, y1: 350, x2: 260, y2: 418 },   // 턱 방향 수직선
    ],
    annotLine: { x1: 320, y1: 350, x2: 430, y2: 370 },
    hitPath: "M 152 358 L 348 358 L 342 452 L 158 452 Z M 330 350 L 450 350 L 450 390 L 330 390 Z",
  },

  // ── 턱선 통합 (Jawline — 좌우 단일 항목으로 완전 통합) ───────────────────
  // 중력성 처짐·림프성 여드름 중심 — 입/턱 존과 임상적으로 구분
  // hitPath: M...Z M...Z 두 서브패스 → 좌우 어느 쪽 클릭/호버도 동일 반응
  {
    zone: "jawline",
    dots: [
      { x: 175, y: 402 },   // 왼쪽 턱선 상단
      { x: 220, y: 435 },   // 왼쪽 턱선 하단
      { x: 345, y: 402 },   // 오른쪽 턱선 상단
      { x: 318, y: 435 },   // 오른쪽 턱선 하단
    ],
    connectors: [
      { x1: 175, y1: 402, x2: 220, y2: 435 },   // 왼쪽 턱선 사선
      { x1: 345, y1: 402, x2: 318, y2: 435 },   // 오른쪽 턱선 사선
    ],
    annotLine: { x1: 175, y1: 402, x2: 92, y2: 442 },   // 좌측으로 라벨 인출
    hitPath: "M 130 435 L 200 500 L 170 515 L 105 450 Z M 370 435 L 300 500 L 330 515 L 395 450 Z",
  },

  // ── 목 (Neck) — 상부 목 위치로 조정 ──────────────────────────────────────
  // 이전 y=528은 쇄골 근처로 너무 낮음 → 상부 목(아담의 사과) 위치로 상향 조정
  {
    zone: "neck",
    dots: [
      { x: 205, y: 470 },   // 왼쪽 상부 목
      { x: 320, y: 470 },   // 오른쪽 상부 목
    ],
    connectors: [
      { x1: 205, y1: 470, x2: 320, y2: 470 },   // 목 가로 연결선
    ],
    annotLine: { x1: 320, y1: 470, x2: 420, y2: 500 },
    hitPath: "M 168 470 L 332 470 L 345 580 L 155 580 Z M 320 460 L 440 460 L 440 520 L 320 520 Z",
  },
];

// ─── Colour palette ───────────────────── 존 라벨 색상
const COLOR_PALETTE = {
  dark_selected: "#f7e28dff", // Dark Mode Selected: Muted Terracotta
  light_selected: "#8EA273", // White Mode Selected: Deep Terracotta (slightly darker for contrast)
  dark_idle: "rgba(174, 226, 255, 0.5)",   // Dark Mode: Crisp Ice Blue with opacity
  light_idle: "#8EA273",  // White Mode: Dusty Rose
};


// ─── 3-level animation keyframes ─────────────────────────────────────────────
// idle  → always-on gentle hum (never stops)
// hover → faster, slightly brighter hum (medium glow added)
// active/selected → full bloom pulse
const SVG_CSS = `

  /* Idle: dots & lines breathe softly — always running */
  @keyframes fms-dot-idle {
    0%, 100% { opacity: 0.40; }
    50%       { opacity: 0.80; }
  }
  @keyframes fms-line-idle {
    0%, 100% { opacity: 0.40; }
    50%       { opacity: 0.80; }
  }
  /* Hover: faster, brighter pulse */
  @keyframes fms-dot-hover {
    0%, 100% { opacity: 0.78; }
    50%       { opacity: 0.90; }
  }
  @keyframes fms-halo-hover {
    0%, 100% { opacity: 0.10; }
    50%       { opacity: 0.24; }
  }
  /* Active (zone open): full bloom */
  @keyframes fms-dot-active {
    0%, 100% { opacity: 0.90; }
    50%       { opacity: 1.00; }
  }
  @keyframes fms-halo-active {
    0%, 100% { opacity: 0.16; }
    50%       { opacity: 0.36; }
  }
  /* Selected (questions done): steady bling — dot & halo pulse together */
  @keyframes fms-dot-selected {
    0%, 100% { opacity: 0.85; transform: scale(1.0); }
    50%       { opacity: 1.00; transform: scale(1.15); }
  }
  @keyframes fms-halo-selected {
    0%, 100% { opacity: 0.20; transform: scale(1.0); }
    50%       { opacity: 0.50; transform: scale(1.35); }
  }
`;

// ─── Helper: text anchor + position from annotation line direction ────────────
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

// ─── FaceSVG ──────────────────────────────────────────────────────────────────
// Visual states (in priority order):
//   dimmed  — another zone is active → low opacity, no interaction
//   active  — clicked / concern selected → full bloom + hum
//   hover   — mouse/touch enters zone → medium glow + faster hum
//   idle    — default → dots & lines visible, gentle breathing animation
//
// Dot size is animated via CSS transform: scale() so it transitions smoothly
// (SVG `r` attribute cannot be CSS-transitioned reliably across all browsers).
function FaceSVG({
  activeZone, selectedZones, onZoneClick, lang,
}: {
  activeZone: ZoneId | null;
  selectedZones: Set<ZoneId>;
  onZoneClick: (z: ZoneId) => void;
  lang: Lang;
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
        willChange: "transform",          // GPU layer hint — smooth on mobile
      }}
    >
      <style>{SVG_CSS}</style>
      <defs>
        <filter id="fms-glow-warm" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>



      {/* ── Zones ───────────────────────────────────────────────────────────── */}
      {ZONES_DEF.map(({ zone, dots, connectors, annotLine, hitPath }, zoneIdx) => {
        const isSelected = selectedZones.has(zone);
        const isActive   = activeZone === zone;
        const isHovered  = hoveredZone === zone;

        // Priority: active > hovered > idle.  Dimmed when another zone is active.
        const lit    = isActive || isSelected;
        const dimmed = activeZone !== null && !lit;
        
        const statusColor = (isSelected || isActive) 
          ? (isDark ? COLOR_PALETTE.dark_selected : COLOR_PALETTE.light_selected)
          : (isDark ? COLOR_PALETTE.dark_idle : COLOR_PALETTE.light_idle);

        const finalOpacity = isSelected ? 1 : (isActive ? 0.9 : 0.6);
        const finalStrokeWidth = (isSelected || isActive) ? 1.2 : 0.8;

        // Stagger idle anim phases per zone so they don't all pulse in sync
        const d0 = zoneIdx * 0.38;

        const lp    = annotLine ? annotLabelProps(annotLine) : null;
        const label = ZONE_LABELS[zone][lang];

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

            {/* ── Click / hover target — covers the whole zone area ─────── */}
            <path
              d={hitPath}
              fill="transparent"
            />

            {/* ── Connector lines (always visible) ─────────────────────── */}
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

            {/* ── Annotation callout line (always visible) ─────────────── */}
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

            {/* ── Zone label (always visible) ───────────────────────────── */}
            {lp && (
              <text
                x={lp.x} y={lp.y}
                textAnchor={lp.anchor}
                fill={statusColor}
                style={{
                  fontFamily: lang === "ko" ? "'Pretendard', 'Noto Sans KR', sans-serif" : "'DM Sans', sans-serif",
                  fontSize: "16px",
                  fontWeight: (isSelected || isActive) ? 600 : 400,
                  opacity: finalOpacity,
                  letterSpacing: "0.02em",
                  animation: (isSelected || isActive)
                    ? "none"
                    : `fms-dot-idle 3s ease-in-out ${d0 + 0.2}s infinite`,
                  transition: "all 0.4s ease",
                  userSelect: "none",
                }}
              >
                {label}
              </text>
            )}

            {/* ── Dots (always visible) ─────────────────────────────────── */}
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
                  {/* 호버 시 블링블링 광채 레이어 */}
                  {isHovered && !dimmed && !isSelected && (
                    <circle
                      cx={d.x} cy={d.y} r={7}
                      fill={statusColor}
                      filter="url(#fms-glow-warm)"
                      style={{
                        animation: "fms-halo-hover 1.2s ease-in-out infinite",
                        opacity: 0.5,
                      }}
                    />
                  )}

                  {/* 진단 완료 시 펄싱 광채 */}
                  {isSelected && (
                    <circle
                      cx={d.x} cy={d.y} r={7
                      }
                      fill={isDark ? COLOR_PALETTE.dark_selected : COLOR_PALETTE.light_selected}
                      filter="url(#fms-glow-warm)"
                      style={{
                        animation: `fms-halo-selected 2s ease-in-out ${i * 0.3}s infinite`,
                        transformOrigin: `${d.x}px ${d.y}px`,
                      }}
                    />
                  )}

                  {/* 메인 도트 */}
                  <circle
                    cx={d.x} cy={d.y}
                    r={3.3}
                    fill={statusColor}
                    filter={(isSelected || (isHovered && !dimmed)) ? "url(#fms-glow-warm)" : undefined}
                    style={{
                      transformOrigin: `${d.x}px ${d.y}px`,
                      animation: dotAnim,
                      opacity: finalOpacity,
                      transition: "opacity 0.3s ease",
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

// ─── Question renderer ────────────────────────────────────────────────────────
function InlineQuestionRenderer({
  q, value, onChange, lang, allAnswers, isDark,
}: {
  q: QuestionDef; value: QuestionAnswer;
  onChange: (id: string, val: QuestionAnswer) => void;
  lang: Lang; allAnswers: Record<string, QuestionAnswer>; isDark: boolean;
}) {
  const GOLD = "#FD8B7C";
  const pillSt = (sel: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", margin: "4px 5px 4px 0",
    borderRadius: 24, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", minHeight: 44, lineHeight: "1.2",
    border: sel ? `1px solid ${GOLD}` : `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
    background: sel ? "rgba(201,169,110,0.15)" : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
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
                onClick={() => onChange(q.id, on ? sel.filter(x => x !== opt.id) : [...sel, opt.id])}
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)", fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
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
          style={{ marginTop: 16, paddingLeft: 16, borderLeft: `2px solid ${GOLD}33`, overflow: "hidden" }}
        >
          <div style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
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

// ─── Concern item ─────────────────────────────────────────────────────────────
function ConcernItem({
  concern, selected, onToggle, lang, isDark,
}: {
  concern: Concern; selected: boolean; onToggle: () => void; lang: Lang; isDark: boolean;
}) {
  const GOLD = "#c9a96e";
  return (
    <motion.button onClick={onToggle} whileTap={{ scale: 0.98 }}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        padding: "13px 16px", borderRadius: 14,
        textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
        background: selected ? "rgba(201,169,110,0.12)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: selected ? `1px solid ${GOLD}` : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        color: selected ? GOLD : isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)",
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        fontWeight: selected ? 500 : 400,
      }}>
      <span>{concern.label[lang]}</span>
      <motion.span
        animate={{ scale: selected ? [1, 1, 1] : 1 }}
        transition={{ duration: 0.2 }}
        style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
          border: selected ? `2px solid ${GOLD}` : `2px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
          background: selected ? GOLD : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {selected && <Check style={{ width: 14, height: 14, color: isDark ? "#000" : "#fff" }} />}
      </motion.span>
    </motion.button>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function ConcernAndQuestionPanel({
  zone, selectedConcerns, onToggle, onClose, lang, isDark, axisAnswers, onAnswer,
}: {
  zone: ZoneId; selectedConcerns: Set<string>; onToggle: (id: string) => void;
  onClose: () => void; lang: Lang; isDark: boolean;
  axisAnswers: Record<string, QuestionAnswer>; onAnswer: (id: string, val: QuestionAnswer) => void;
}) {
  const GOLD = "#c9a96e";

  const concerns = ZONE_CONCERNS[zone];
  const triggeredAxisIds = Array.from(new Set(
    Array.from(selectedConcerns)
      .map(cId => concerns.find(c => c.id === cId)?.axis)
      .filter((a): a is string => a !== undefined && CONCERN_AXIS_ID[a] !== undefined)
      .map(a => CONCERN_AXIS_ID[a])
  ));

  return (
    <div style={{ padding: "8px 0 16px" }}>
      {/* Panel header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 1.5, background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, marginBottom: 16 }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 6, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Clinical Area
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 400, color: isDark ? "#fff" : "#111", fontFamily: "'DM Sans', system-ui, sans-serif", margin: 0, lineHeight: 1.2 }}>
              {ZONE_LABELS[zone][lang]}
            </h3>
          </div>
          <button onClick={onClose}
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isDark ? "#fff" : "#000", flexShrink: 0 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* Concern list */}
      <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        {lang === "ko" ? "피부 고민 선택" : lang === "de" ? "Beschwerden auswählen" : "Select Concerns"}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {concerns.map(c => (
          <ConcernItem key={c.id} concern={c} selected={selectedConcerns.has(c.id)}
            onToggle={() => onToggle(c.id)} lang={lang} isDark={isDark} />
        ))}
      </div>

      {/* Deep-dive questions */}
      {triggeredAxisIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            {lang === "ko" ? "정밀 분석" : lang === "de" ? "Tiefenanalyse" : "Deep-Dive Analysis"}
          </h4>
          {triggeredAxisIds.map(axisId => {
            const axisDef = AXIS_DEFINITIONS.find(a => a.id === axisId);
            if (!axisDef) return null;
            const reqQs = axisDef.questions.filter(q => q.required);
            const isAnswered = reqQs.length > 0 && reqQs.every(q => axisAnswers[q.id] !== undefined);

            const visibleQs: QuestionDef[] = [];
            for (const q of axisDef.questions) {
              if (q.hideIf) {
                const ha = axisAnswers[q.hideIf.questionId];
                if (ha !== undefined) {
                  const m = Array.isArray(ha)
                    ? ha.some(v => q.hideIf!.values.includes(String(v)))
                    : q.hideIf.values.includes(String(ha));
                  if (m) continue;
                }
              }
              visibleQs.push(q);
            }

            return (
              <div key={axisId} style={{
                marginBottom: 20, padding: 16, borderRadius: 16,
                background: isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.5)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: AXIS_COLOR[axisId], fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    {gt(axisDef.name, lang)}
                  </span>
                  {isAnswered && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#4ade80" }}>✓</span>
                  )}
                </div>
                {visibleQs.map(q => (
                  <div key={q.id} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 16, color: isDark ? "#fff" : "#111", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
                      {gt(q.text, lang)}
                    </div>
                    <InlineQuestionRenderer
                      isDark={isDark} q={q} value={axisAnswers[q.id]}
                      onChange={onAnswer} lang={lang} allAnswers={axisAnswers}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Confirm Selection button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
        style={{
          marginTop: 16, width: "100%", padding: "14px 0",
          borderRadius: 24, fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", border: "none",
          background: "linear-gradient(135deg, #8EA273, #2D4F39)",
          color: "#fff", cursor: "pointer",
          boxShadow: "0 6px 20px rgba(111, 152, 141, 0.3)",
        }}
      >
        {lang === "ko" ? "선택 완료" : lang === "de" ? "Auswahl bestätigen" : "Confirm Selection"}
      </motion.button>
    </div>
  );
}

// ─── Panel style ──────────────────────────────────────────────────────────────
const PANEL_S = (isDark: boolean): React.CSSProperties => ({
  width: "min(400px, 90vw)", flexShrink: 0, borderRadius: 24,
  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
  background: isDark ? "rgba(20,20,25,0.88)" : "rgba(255,255,255,0.93)",
  backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
  boxShadow: isDark ? "0 24px 68px rgba(0,0,0,0.65)" : "0 24px 68px rgba(0,0,0,0.15)",
  padding: "20px 24px", display: "flex", flexDirection: "column",
  maxHeight: "80vh", overflowY: "auto",
});

// ─── Main export ──────────────────────────────────────────────────────────────
export function FaceMapStep({ onNext }: { onNext: () => void }) {
  const { language }      = useI18nStore();
  const lang              = language as Lang;
  const store             = useDiagnosisStore();
  const copy              = COPY[lang];
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [selectedConcerns, setSelectedConcerns] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone]             = useState<ZoneId | null>(null);
  const [isMobile, setIsMobile]                 = useState(false);

  // Session-scoped axis answers: lazy-initialise with only EXP_* lifestyle values.
  // This prevents stale AX* answers from a previous session (persisted in localStorage)
  // from appearing as pre-selected in the deep-dive Q panels.
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

  // Derive which zones have ≥1 selected concern (for dot highlighting)
  const selectedZones = useMemo(() => {
    const out = new Set<ZoneId>();
    for (const [z, arr] of Object.entries(ZONE_CONCERNS)) {
      if (arr.some(c => selectedConcerns.has(c.id))) out.add(z as ZoneId);
    }
    return out;
  }, [selectedConcerns]);

  const toggleConcern = useCallback((id: string) => {
    setSelectedConcerns(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }, []);

  const handleZoneClick = useCallback((id: ZoneId) => {
    setActiveZone(prev => (prev === id ? null : id));
  }, []);

  const handleAnswer = useCallback((id: string, val: QuestionAnswer) => {
    setSessionAnswers(prev => ({ ...prev, [id]: val }));
    store.setAxisAnswer(id, val);
  }, [store]);

  const handleNext = useCallback(() => {
    // Build axis weight map
    const axisMap: Record<string, number> = {};
    for (const cid of selectedConcerns) {
      for (const arr of Object.values(ZONE_CONCERNS)) {
        const f = arr.find(c => c.id === cid);
        if (f) axisMap[f.axis] = (axisMap[f.axis] ?? 0) + 1;
      }
    }
    // Build zone map
    const zoneMap: Record<string, { concerns: string[] }> = {};
    for (const [zid, arr] of Object.entries(ZONE_CONCERNS)) {
      const sel = arr.filter(c => selectedConcerns.has(c.id)).map(c => c.id);
      if (sel.length) zoneMap[zid] = { concerns: sel };
    }
    store.actions.setAllZones(zoneMap);
    store.setUiSignals("faceMap", axisMap as Record<string, unknown>);
    onNext();
  }, [selectedConcerns, store, onNext]);

  const totalSelected = selectedConcerns.size;
  const allZonesDone  = selectedZones.size === ZONES_DEF.length;

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <h2 style={{
        fontSize: isMobile ? 26 : 30, fontWeight: 300,
        fontFamily: "'Cormorant Garamond',Georgia,serif",
        color: isDark ? "#fff" : "#111", marginBottom: 8,
      }}>
        {copy.title}
      </h2>
      <p style={{
        fontSize: 14, marginBottom: 32,
        color: isDark ? "rgba(185, 182, 141, 0.76)" : "rgba(0,0,0,0.6)",
        fontFamily: "'DM Sans',sans-serif",
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
        {/* Face Image Card */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: isMobile ? "430px" : "520px",
          aspectRatio: "600/700",
          flexShrink: 0, 
          borderRadius: 28, 
          background: isDark ? "#121214" : "#becad3bf",
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
                  selectedConcerns={selectedConcerns}
                  onToggle={toggleConcern}
                  onClose={() => setActiveZone(null)}
                  lang={lang}
                  isDark={isDark}
                  axisAnswers={sessionAnswers}
                  onAnswer={handleAnswer}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  width: "min(380px, 40vw)", height: 300,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px dashed ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                  borderRadius: 24, padding: 32, textAlign: "center",
                }}>
                <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                  {copy.hint}
                </p>
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
                selectedConcerns={selectedConcerns}
                onToggle={toggleConcern}
                onClose={() => setActiveZone(null)}
                lang={lang}
                isDark={isDark}
                axisAnswers={sessionAnswers}
                onAnswer={handleAnswer}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {totalSelected > 0 && (
          <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontFamily: "'DM Sans', sans-serif" }}>
            {copy.selected(totalSelected)}
          </p>
        )}
        <div style={{ marginLeft: "auto" }}>
          <motion.button
            onClick={handleNext}
            disabled={!totalSelected}
            animate={allZonesDone ? {
              boxShadow: [
                "0 8px 24px rgba(201,169,110,0.4)",
                "0 8px 40px rgba(201,169,110,0.85)",
                "0 8px 24px rgba(201,169,110,0.4)",
              ],
            } : { boxShadow: totalSelected > 0 ? "0 4px 16px rgba(201,169,110,0.15)" : "none" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 32px", borderRadius: 32,
              fontSize: 14, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", border: "none",
              background: allZonesDone
                ? "linear-gradient(135deg, #c9a96e, #a38555)"
                : totalSelected > 0
                  ? "linear-gradient(135deg, rgba(201,169,110,0.45), rgba(163,133,85,0.45))"
                  : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              color: totalSelected > 0
                ? "#fff"
                : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              cursor: totalSelected > 0 ? "pointer" : "not-allowed",
              transition: "background 0.4s ease",
            }}>
            {allZonesDone
              ? copy.resultsCta
              : totalSelected > 0
                ? copy.completeCta
                : copy.continue}
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default FaceMapStep;
