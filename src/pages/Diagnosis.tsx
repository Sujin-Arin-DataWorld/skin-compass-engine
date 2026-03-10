// src/pages/Diagnosis.tsx
// ANTIGRAVITY Rebuild — Phase 01 + 02 + 03
// Phase 03 adds: contextual deep-dive axis questions, smart deduplication,
// foundation & atopy store wiring, and the full "Complete Analysis" → runDiagnosis → /results flow.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import Navbar from "@/components/Navbar";
import { AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { QuestionDef, AxisDef, LocalizedText } from "@/engine/questionRoutingV5";
import type { QuestionAnswer } from "@/engine/questionRoutingV5";
import { convertAxisAnswersToUiSignals } from "@/engine/axisAnswerBridge";
import { runDiagnosis } from "@/engine/runDiagnosisV4";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD    = "#c9a96e";
const ROSE    = "#b76e79";
const PAGE_BG = "linear-gradient(160deg, #0d0d12 0%, #141420 40%, #1a1528 100%)";
const GLASS_BG     = "rgba(255,255,255,0.03)";
const GLASS_BORDER = "rgba(201,169,110,0.12)";

// ─── Types ────────────────────────────────────────────────────────────────────
type ZoneId = "forehead" | "eyes" | "nose" | "cheeks" | "chin" | "neck";
type Phase  = "foundation" | "scanning" | "facemap";
type Lang   = "en" | "de" | "ko";

interface ZoneConfig {
  id: ZoneId;
  label: string; labelDE: string; labelKO: string;
  labelShort: string; labelShortDE: string; labelShortKO: string;
}

interface Concern {
  id: string;
  label: string; labelDE: string; labelKO: string;
  axis: string; icon: string;
}

interface FoundationOption { label: string; value: number }
interface FoundationQuestion {
  id: string; icon: string;
  text: string; textDE: string; textKO: string;
  options: FoundationOption[];
}

// ─── Phase 03: New constants ──────────────────────────────────────────────────

// Maps Phase 02 concern axis strings → AXIS_DEFINITIONS numeric IDs
const CONCERN_AXIS_ID: Record<string, number> = {
  sebum: 1, hydration: 2, pores: 3, texture: 4,
  sensitivity: 5, aging: 6, pigment: 7, hormonal: 8,
};

// Localized text extractor — matches getText() in AxisQuestionStep.tsx
const gt = (t: LocalizedText, lang: Lang): string =>
  (t as Record<string, string>)[lang] ?? t.en;

// Axis accent colors
const AXIS_COLOR: Record<number, string> = {
  1: "rgba(201,169,110,0.8)",
  2: "rgba(100,180,220,0.8)",
  3: "rgba(160,140,120,0.8)",
  4: "rgba(220,120,120,0.8)",
  5: "rgba(220,160,160,0.8)",
  6: "rgba(180,160,200,0.8)",
  7: "rgba(180,140,100,0.8)",
  8: "rgba(200,130,170,0.8)",
};

// Module-level pill style — used in Foundation, InlineQuestionRenderer, atopy banner
function pillStyle(selected: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", margin: "4px 5px 4px 0",
    borderRadius: 24, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", minHeight: 44, lineHeight: "1",
    border: selected ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.1)",
    background: selected ? "rgba(201,169,110,0.15)" : "transparent",
    color: selected ? GOLD : "rgba(255,255,255,0.5)",
    transition: "all 0.3s ease",
  };
}

// ─── Zone catalogue ───────────────────────────────────────────────────────────
const ZONES: ZoneConfig[] = [
  { id: "forehead", label: "Forehead",      labelDE: "Stirn",          labelKO: "이마",
    labelShort: "Forehead",                 labelShortDE: "Stirn",     labelShortKO: "이마" },
  { id: "eyes",     label: "Eye Area",      labelDE: "Augenpartie",    labelKO: "눈가",
    labelShort: "Eyes",                     labelShortDE: "Augen",     labelShortKO: "눈가" },
  { id: "nose",     label: "Nose / T-Zone", labelDE: "Nase / T-Zone",  labelKO: "코 / T존",
    labelShort: "T-Zone",                   labelShortDE: "T-Zone",    labelShortKO: "T존" },
  { id: "cheeks",   label: "Cheeks",        labelDE: "Wangen",         labelKO: "볼",
    labelShort: "Cheeks",                   labelShortDE: "Wangen",    labelShortKO: "볼" },
  { id: "chin",     label: "Chin & Mouth",  labelDE: "Kinn & Mund",    labelKO: "턱 & 입",
    labelShort: "Chin",                     labelShortDE: "Kinn",      labelShortKO: "턱" },
  { id: "neck",     label: "Neck",          labelDE: "Hals",           labelKO: "목",
    labelShort: "Neck",                     labelShortDE: "Hals",      labelShortKO: "목" },
];

// Zone SVG rect positions — coordinates within the 320×440 viewBox.
// Used directly as SVG <rect> elements inside FaceSVG (replaces old div overlays).
const ZONE_SVG_RECT: Record<ZoneId, { x: number; y: number; w: number; h: number; rx: number }> = {
  forehead: { x: 84,  y: 80,  w: 152, h: 60,  rx: 22 },
  eyes:     { x: 64,  y: 140, w: 192, h: 46,  rx: 18 },
  nose:     { x: 130, y: 164, w: 60,  h: 70,  rx: 18 },
  cheeks:   { x: 60,  y: 186, w: 200, h: 74,  rx: 22 },
  chin:     { x: 94,  y: 254, w: 132, h: 60,  rx: 20 },
  neck:     { x: 112, y: 320, w: 96,  h: 52,  rx: 16 },
};

// Zone glow ellipse positions — updated for 320×440 viewBox
const ZONE_GLOW: Record<ZoneId, { cx: number; cy: number; rx: number; ry: number }> = {
  forehead: { cx: 160, cy: 110, rx: 92,  ry: 38 },
  eyes:     { cx: 160, cy: 164, rx: 116, ry: 30 },
  nose:     { cx: 160, cy: 200, rx: 48,  ry: 46 },
  cheeks:   { cx: 160, cy: 224, rx: 128, ry: 54 },
  chin:     { cx: 160, cy: 284, rx: 80,  ry: 38 },
  neck:     { cx: 160, cy: 346, rx: 58,  ry: 30 },
};

// ─── Concern data ─────────────────────────────────────────────────────────────
const ZONE_CONCERNS: Record<ZoneId, Concern[]> = {
  forehead: [
    { id: "oily_f",       label: "Oily / Shiny",    labelDE: "Fettig / Glänzend", labelKO: "유분 / 광택",   axis: "sebum",       icon: "💧" },
    { id: "blackheads_f", label: "Blackheads",       labelDE: "Mitesser",          labelKO: "블랙헤드",       axis: "pores",       icon: "⬤" },
    { id: "whiteheads_f", label: "Whiteheads",       labelDE: "Komedonen",         labelKO: "화이트헤드",     axis: "texture",     icon: "○" },
    { id: "lines_f",      label: "Lines / Wrinkles", labelDE: "Falten / Linien",   labelKO: "주름",          axis: "aging",       icon: "〰️" },
    { id: "breakouts_f",  label: "Breakouts",        labelDE: "Unreinheiten",      labelKO: "트러블",         axis: "texture",     icon: "🔴" },
  ],
  eyes: [
    { id: "fine_lines_e",  label: "Fine Lines",   labelDE: "Feine Linien",  labelKO: "잔주름",    axis: "aging",     icon: "〰️" },
    { id: "dark_circles_e",label: "Dark Circles", labelDE: "Augenringe",    labelKO: "다크서클",  axis: "pigment",   icon: "🌑" },
    { id: "puffiness_e",   label: "Puffiness",    labelDE: "Schwellungen",  labelKO: "부종",      axis: "aging",     icon: "💤" },
    { id: "dryness_e",     label: "Dryness",      labelDE: "Trockenheit",   labelKO: "건조",      axis: "hydration", icon: "🏜️" },
  ],
  nose: [
    { id: "pores_n",      label: "Enlarged Pores",  labelDE: "Vergrößerte Poren",    labelKO: "넓은 모공",  axis: "pores",       icon: "◉" },
    { id: "blackheads_n", label: "Blackheads",      labelDE: "Mitesser",             labelKO: "블랙헤드",   axis: "pores",       icon: "⬤" },
    { id: "oily_n",       label: "Excessive Oil",   labelDE: "Übermäßiger Glanz",    labelKO: "과다 피지",  axis: "sebum",       icon: "💧" },
    { id: "redness_n",    label: "Redness",         labelDE: "Rötung",               labelKO: "홍조",       axis: "sensitivity", icon: "🩷" },
  ],
  cheeks: [
    { id: "redness_c",  label: "Redness / Rosacea",   labelDE: "Rötung / Rosazea",      labelKO: "홍조 / 주사",  axis: "sensitivity", icon: "🩷" },
    { id: "acne_c",     label: "Breakouts",            labelDE: "Unreinheiten",          labelKO: "트러블",       axis: "texture",     icon: "🔴" },
    { id: "dryness_c",  label: "Dryness / Tightness",  labelDE: "Trockenheit / Spannung",labelKO: "건조 / 당김",  axis: "hydration",   icon: "🏜️" },
    { id: "pigment_c",  label: "Dark Spots",           labelDE: "Dunkle Flecken",        labelKO: "색소침착",     axis: "pigment",     icon: "🌑" },
    { id: "pores_c",    label: "Visible Pores",        labelDE: "Sichtbare Poren",       labelKO: "가시 모공",    axis: "pores",       icon: "◉" },
  ],
  chin: [
    { id: "hormonal_ch", label: "Recurring Breakouts",  labelDE: "Wiederkehrende Unreinheiten", labelKO: "반복 트러블", axis: "hormonal",  icon: "🔄" },
    { id: "dryness_m",   label: "Dryness around Mouth", labelDE: "Trockenheit um den Mund",     labelKO: "입 주변 건조",axis: "hydration", icon: "🏜️" },
    { id: "nasolabial",  label: "Smile Lines",          labelDE: "Nasolabialfalten",            labelKO: "팔자 주름",  axis: "aging",     icon: "〰️" },
    { id: "pigment_m",   label: "Dark Spots",           labelDE: "Dunkle Flecken",              labelKO: "색소침착",   axis: "pigment",   icon: "🌑" },
  ],
  neck: [
    { id: "neck_lines", label: "Neck Lines",           labelDE: "Halsfalten",          labelKO: "목 주름",    axis: "aging",       icon: "〰️" },
    { id: "sagging",    label: "Loss of Firmness",     labelDE: "Elastizitätsverlust", labelKO: "탄력 저하",  axis: "aging",       icon: "↓" },
    { id: "neck_red",   label: "Redness / Irritation", labelDE: "Rötung / Reizung",    labelKO: "홍조 / 자극",axis: "sensitivity", icon: "🩷" },
    { id: "neck_dry",   label: "Dryness",              labelDE: "Trockenheit",         labelKO: "건조",       axis: "hydration",   icon: "🏜️" },
  ],
};

// ─── Foundation questions ─────────────────────────────────────────────────────
const FOUNDATION_QUESTIONS: FoundationQuestion[] = [
  {
    id: "sleep", icon: "🌙",
    text: "Average hours of restful sleep",
    textDE: "Stunden erholsamen Schlafs",
    textKO: "평균 수면 시간",
    options: [{ label: "< 5h", value: 1 }, { label: "5–6h", value: 2 }, { label: "7h", value: 3 }, { label: "8h+", value: 4 }],
  },
  {
    id: "water", icon: "💧",
    text: "Daily water intake",
    textDE: "Tägliche Wasseraufnahme",
    textKO: "일일 수분 섭취량",
    options: [{ label: "1–2 glasses", value: 1 }, { label: "3–5 glasses", value: 2 }, { label: "6+ glasses", value: 3 }],
  },
  {
    id: "stress", icon: "🧠",
    text: "Current stress level",
    textDE: "Aktuelles Stresslevel",
    textKO: "현재 스트레스 수준",
    options: [{ label: "Low", value: 1 }, { label: "Moderate", value: 2 }, { label: "High", value: 3 }],
  },
  {
    id: "climate", icon: "🌍",
    text: "Your climate",
    textDE: "Ihr Klima",
    textKO: "거주 기후",
    options: [
      { label: "Cold & Dry", value: 1 }, { label: "Humid", value: 2 },
      { label: "Hot & Dry", value: 3 },  { label: "Temperate", value: 4 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function zoneLabel(z: ZoneConfig, lang: Lang, short = false): string {
  if (short) return lang === "de" ? z.labelShortDE : lang === "ko" ? z.labelShortKO : z.labelShort;
  return lang === "de" ? z.labelDE : lang === "ko" ? z.labelKO : z.label;
}
function concernLabel(c: Concern, lang: Lang): string {
  return lang === "de" ? c.labelDE : lang === "ko" ? c.labelKO : c.label;
}
function fqText(fq: FoundationQuestion, lang: Lang): string {
  return lang === "de" ? fq.textDE : lang === "ko" ? fq.textKO : fq.text;
}
function formatDiagnosisDate(isoStr: string, lang: Lang): string {
  const d = new Date(isoStr);
  if (lang === "ko") return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (lang === "de") return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Mini Radar Chart ─────────────────────────────────────────────────────────
const MINI_AXES = ["seb", "hyd", "bar", "sen", "acne", "pigment", "texture", "aging"] as const;
function MiniRadarChart({ scores }: { scores: Record<string, number> }) {
  const N = MINI_AXES.length;
  const cx = 54, cy = 54, r = 42;
  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;
  const pt = (i: number, s: number) => ({
    x: cx + r * Math.min(1, Math.max(0, s / 100)) * Math.cos(angle(i)),
    y: cy + r * Math.min(1, Math.max(0, s / 100)) * Math.sin(angle(i)),
  });
  const pts = MINI_AXES.map((a, i) => pt(i, scores[a] ?? 0));
  return (
    <svg viewBox="0 0 108 108" width="96" height="96" className="flex-shrink-0">
      {[0.3, 0.6, 1.0].map((lvl, gi) => (
        <polygon key={gi}
          points={MINI_AXES.map((_, i) => { const a = angle(i); return `${cx + r * lvl * Math.cos(a)},${cy + r * lvl * Math.sin(a)}`; }).join(" ")}
          fill="none" stroke="#C9A96E" strokeWidth="0.6" strokeOpacity="0.2" />
      ))}
      {MINI_AXES.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
          stroke="#C9A96E" strokeWidth="0.5" strokeOpacity="0.22" />
      ))}
      <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")}
        fill="#C9A96E" fillOpacity="0.14" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.8" />
      {pts.map((p, i) => (scores[MINI_AXES[i]] ?? 0) > 55
        ? <circle key={`rg-${i}`} cx={p.x} cy={p.y} r="3" fill="#B76E79" fillOpacity="0.55" />
        : null)}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="#C9A96E" fillOpacity="0.9" />)}
    </svg>
  );
}

// ─── Phase 03: InlineQuestionRenderer ────────────────────────────────────────
// Renders a single QuestionDef inline inside the concern panel.
// Handles: single, multi, image (as single), slider.
// Conditionally injects follow-up question from q.conditional.
function InlineQuestionRenderer({
  q, value, onChange, lang, allAnswers,
}: {
  q: QuestionDef;
  value: QuestionAnswer;
  onChange: (id: string, val: QuestionAnswer) => void;
  lang: Lang;
  allAnswers: Record<string, QuestionAnswer>;
}) {
  // Check if a conditional follow-up should show after this question
  const showConditional = q.conditional != null &&
    (() => {
      const triggerVal = allAnswers[q.conditional!.ifQuestionId];
      if (triggerVal == null) return false;
      const vals = q.conditional!.ifValues;
      return Array.isArray(triggerVal)
        ? triggerVal.some(v => vals.includes(String(v)))
        : vals.includes(String(triggerVal));
    })();

  return (
    <>
      {/* single / image — select one option */}
      {(q.type === "single" || q.type === "image") && q.options && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {q.options.map((opt) => (
            <div key={opt.id} onClick={() => onChange(q.id, opt.id)} style={pillStyle(value === opt.id)}>
              {opt.icon && <span style={{ marginRight: 4 }}>{opt.icon}</span>}
              {gt(opt.label, lang)}
              {opt.description && value === opt.id && (
                <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)",
                  fontStyle: "italic", marginTop: 2, letterSpacing: 0 }}>
                  {gt(opt.description, lang)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* multi — select multiple */}
      {q.type === "multi" && q.options && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {q.options.map((opt) => {
            const sel = (value as string[]) ?? [];
            const isOn = sel.includes(opt.id);
            return (
              <div key={opt.id} onClick={() => {
                const next = isOn ? sel.filter(x => x !== opt.id) : [...sel, opt.id];
                onChange(q.id, next);
              }} style={pillStyle(isOn)}>
                {gt(opt.label, lang)}
              </div>
            );
          })}
        </div>
      )}

      {/* slider */}
      {q.type === "slider" && q.slider && (
        <div style={{ margin: "4px 0 8px" }}>
          <input
            type="range"
            min={q.slider.min} max={q.slider.max} step={q.slider.step}
            value={(value as number) ?? q.slider.defaultValue}
            onChange={(e) => onChange(q.id, Number(e.target.value))}
            style={{ width: "100%", accentColor: GOLD, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif",
            marginTop: 4 }}>
            <span>{gt(q.slider.labelMin, lang)}</span>
            <span style={{ color: GOLD, fontWeight: 600 }}>{(value as number) ?? q.slider.defaultValue}</span>
            <span>{gt(q.slider.labelMax, lang)}</span>
          </div>
        </div>
      )}

      {/* Conditional follow-up */}
      {showConditional && q.conditional && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginTop: 12, paddingLeft: 12,
            borderLeft: `2px solid ${GOLD}33` }}>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", marginBottom: 10,
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            {gt(q.conditional.inject.text, lang)}
          </div>
          <InlineQuestionRenderer
            q={q.conditional.inject}
            value={allAnswers[q.conditional.inject.id]}
            onChange={onChange}
            lang={lang}
            allAnswers={allAnswers}
          />
        </motion.div>
      )}
    </>
  );
}

// ─── Face SVG ─────────────────────────────────────────────────────────────────
function FaceSVG({
  activeZone, zoneData, onZoneClick, lang, isMobile,
}: {
  activeZone: ZoneId | null;
  zoneData: Partial<Record<ZoneId, string[]>>;
  onZoneClick: (id: ZoneId) => void;
  lang: Lang;
  isMobile: boolean;
}) {
  const svgW   = isMobile ? 240 : 320;
  const svgH   = Math.round(svgW * (440 / 320));

  return (
    <div style={{ width: svgW, margin: "0 auto" }}>
      <svg viewBox="0 0 320 440" width={svgW} height={svgH} style={{ display: "block", overflow: "visible" }}>
        <defs>
          {/* Skin — linear gradient top-light → bottom-warm */}
          <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E8C5A0" />
            <stop offset="55%"  stopColor="#D4A574" />
            <stop offset="100%" stopColor="#C4916A" />
          </linearGradient>
          {/* Hair — dark brown gradient */}
          <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#5C3D2E" />
            <stop offset="100%" stopColor="#3D2B1F" />
          </linearGradient>
          {/* Shoulder skin tone */}
          <linearGradient id="shoulderGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D4A574" />
            <stop offset="100%" stopColor="#C4916A" />
          </linearGradient>
          {/* Face highlight — soft upper glow */}
          <radialGradient id="faceHL" cx="44%" cy="28%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,235,200,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Zone glow / bloom filter */}
          <filter id="zoneBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Layer 1: Hair back mass (behind everything) ── */}
        <path
          d="M160 50 C196 48 234 58 262 80 C298 106 310 154 308 210 C306 274 286 356 268 420 L240 440 L80 440 L52 420 C34 356 14 274 12 210 C10 154 22 106 58 80 C86 58 124 48 160 50 Z"
          fill="url(#hairGrad)"
        />

        {/* ── Layer 2: Shoulders ── */}
        <path
          d="M10 440 C10 420 22 404 44 392 C80 376 120 368 160 368 C200 368 240 376 276 392 C298 404 310 420 310 440 Z"
          fill="url(#shoulderGrad)"
        />

        {/* ── Layer 3: Neck ── */}
        <path
          d="M128 320 C122 336 120 356 122 374 L198 374 C200 356 198 336 192 320 Z"
          fill="#D4A574"
        />

        {/* ── Layer 4: Face oval (skin) ── */}
        <path
          d="M160 72 C202 72 252 112 252 186 C252 260 212 322 160 330 C108 322 68 260 68 186 C68 112 118 72 160 72 Z"
          fill="url(#skinGrad)"
        />
        {/* Face highlight */}
        <path
          d="M160 72 C202 72 252 112 252 186 C252 260 212 322 160 330 C108 322 68 260 68 186 C68 112 118 72 160 72 Z"
          fill="url(#faceHL)"
        />

        {/* ── Layer 5: Ears (peeking at face sides) ── */}
        <path d="M68 186 C60 194 58 210 60 224 C62 232 66 236 70 234"
          fill="#C4916A" stroke="none" />
        <path d="M252 186 C260 194 262 210 260 224 C258 232 254 236 250 234"
          fill="#C4916A" stroke="none" />

        {/* ── Layer 6: Front side hair strands (over shoulders) ── */}
        <path
          d="M76 120 C58 158 46 220 44 280 C42 330 50 380 62 420 L82 420 C68 380 60 330 62 280 C64 228 74 174 90 144 Z"
          fill="url(#hairGrad)"
        />
        <path
          d="M244 120 C262 158 274 220 276 280 C278 330 270 380 258 420 L238 420 C252 380 260 330 258 280 C256 228 246 174 230 144 Z"
          fill="url(#hairGrad)"
        />
        {/* Hair front overlap at forehead */}
        <path
          d="M160 52 C178 50 196 56 212 68 C222 76 226 88 220 94 C206 80 184 74 160 74 C136 74 114 80 100 94 C94 88 98 76 108 68 C124 56 142 50 160 52 Z"
          fill="url(#hairGrad)"
        />

        {/* ── Zone glow highlights (mint/teal for active/data zones) ── */}
        {(Object.keys(ZONE_GLOW) as ZoneId[]).map((zid) => {
          const concerns = zoneData[zid] ?? [];
          if (concerns.length === 0 && activeZone !== zid) return null;
          const g = ZONE_GLOW[zid];
          const isActive = activeZone === zid;
          const alpha = Math.min(0.30, concerns.length * 0.06 + (isActive ? 0.10 : 0.04));
          const col = isActive
            ? `rgba(164,213,200,${alpha + 0.06})`
            : `rgba(164,213,200,${alpha * 0.55})`;
          return (
            <ellipse key={zid} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry}
              fill={col} filter="url(#zoneBloom)"
              style={{ transition: "all 0.45s ease" }} />
          );
        })}

        {/* ── Facial features ── */}

        {/* Eyebrows — soft neutral arch */}
        <path d="M95 152 C107 144 121 142 136 147 C142 149 146 153 146 157"
          fill="none" stroke="#5C3D2E" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M225 152 C213 144 199 142 184 147 C178 149 174 153 174 157"
          fill="none" stroke="#5C3D2E" strokeWidth="2.2" strokeLinecap="round" />

        {/* Eyes — closed, peaceful almond */}
        {/* Left eye fill */}
        <path d="M88 170 C98 162 118 160 138 167 C118 174 98 174 88 170 Z"
          fill="rgba(160,112,62,0.20)" />
        {/* Left upper lid / lash line */}
        <path d="M88 170 C98 162 118 160 138 167"
          fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left lower lid */}
        <path d="M90 173 C100 177 120 177 136 173"
          fill="none" stroke="#B8896A" strokeWidth="0.7" strokeLinecap="round" />
        {/* Right eye fill */}
        <path d="M182 167 C202 160 222 162 232 170 C222 174 202 174 182 167 Z"
          fill="rgba(160,112,62,0.20)" />
        {/* Right upper lid / lash line */}
        <path d="M182 167 C202 160 222 162 232 170"
          fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right lower lid */}
        <path d="M184 173 C200 177 220 177 230 173"
          fill="none" stroke="#B8896A" strokeWidth="0.7" strokeLinecap="round" />

        {/* Nose — minimal tip + soft ala */}
        <path d="M150 208 Q154 216 160 218 Q166 216 170 208"
          fill="none" stroke="#B8896A" strokeWidth="1.0" strokeLinecap="round" />
        <path d="M138 206 Q142 216 150 215"
          fill="none" stroke="#B8896A" strokeWidth="0.8" strokeLinecap="round" opacity="0.55" />
        <path d="M182 206 Q178 216 170 215"
          fill="none" stroke="#B8896A" strokeWidth="0.8" strokeLinecap="round" opacity="0.55" />

        {/* Lips — soft rose, neutral shape */}
        {/* Lower lip fill */}
        <path d="M136 240 C144 250 152 254 160 252 C168 254 176 250 184 240"
          fill="#C4756E" fillOpacity="0.48" />
        {/* Upper lip arc */}
        <path d="M136 240 C144 232 152 230 160 233 C168 230 176 232 184 240"
          fill="none" stroke="#C4756E" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.78" />
        {/* Center mouth line */}
        <path d="M142 240 C151 242 169 242 178 240"
          fill="none" stroke="#B8896A" strokeWidth="0.6" strokeLinecap="round" strokeOpacity="0.55" />

        {/* ── Zone interactive overlays (SVG rects — invisible by default) ── */}
        {ZONES.map((zone) => {
          const r        = ZONE_SVG_RECT[zone.id];
          const isActive = activeZone === zone.id;
          const concerns = zoneData[zone.id] ?? [];
          const hasData  = concerns.length > 0;
          const label    = zoneLabel(zone, lang, true);
          const cx       = r.x + r.w / 2;
          const cy       = r.y + r.h / 2;
          return (
            <g key={zone.id} onClick={() => onZoneClick(zone.id)}
              style={{ cursor: "pointer" }}>
              <rect
                x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx}
                fill={
                  isActive ? "rgba(164,213,200,0.22)" :
                  hasData  ? "rgba(164,213,200,0.10)" :
                             "transparent"
                }
                stroke={
                  isActive ? "rgba(164,213,200,0.72)" :
                  hasData  ? "rgba(164,213,200,0.38)" :
                             "rgba(255,255,255,0.06)"
                }
                strokeWidth={isActive ? 1.8 : hasData ? 1.4 : 1}
                style={{ transition: "all 0.3s ease" }}
              />
              {/* Zone label — visible when active or has data */}
              {(isActive || hasData) && (
                <text
                  x={cx} y={cy + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={isMobile ? 11 : 12}
                  fontFamily="'DM Sans', sans-serif"
                  letterSpacing="2"
                  fill={isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)"}
                  fontWeight="500"
                  style={{ textTransform: "uppercase", userSelect: "none" }}
                >
                  {label}
                </text>
              )}
              {/* Concern count badge */}
              {hasData && (
                <>
                  <circle
                    cx={r.x + r.w - 12} cy={r.y + 12} r={10}
                    fill={isActive ? "rgba(164,213,200,0.40)" : "rgba(164,213,200,0.25)"}
                  />
                  <text
                    x={r.x + r.w - 12} y={r.y + 12 + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="10" fontFamily="'DM Sans', sans-serif"
                    fill="rgba(255,255,255,0.92)" fontWeight="700"
                    style={{ userSelect: "none" }}
                  >
                    {concerns.length}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Phase 03: ConcernPanel (updated with deep-dive questions) ────────────────
function ConcernPanel({
  activeZone, zoneData, onToggle, lang,
  axisAnswers, onAnswer, editingAxes, onToggleEdit,
}: {
  activeZone: ZoneId | null;
  zoneData: Partial<Record<ZoneId, string[]>>;
  onToggle: (zone: ZoneId, cid: string) => void;
  lang: Lang;
  axisAnswers: Record<string, QuestionAnswer>;
  onAnswer: (id: string, val: QuestionAnswer) => void;
  editingAxes: Set<number>;
  onToggleEdit: (axisId: number) => void;
}) {
  if (!activeZone) {
    return (
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 14,
        fontFamily: "'DM Sans', sans-serif", textAlign: "center",
        padding: "56px 20px", fontStyle: "italic" }}>
        {lang === "de" ? "← Tippen Sie auf eine Zone im Gesicht"
          : lang === "ko" ? "← 얼굴 지도에서 부위를 선택하세요"
          : "← Tap a zone on the face map to begin"}
      </div>
    );
  }

  const zone     = ZONES.find(z => z.id === activeZone)!;
  const concerns = ZONE_CONCERNS[activeZone];
  const selected = zoneData[activeZone] ?? [];

  // Derive which axis IDs are triggered by selected concerns (deduped)
  const triggeredAxisIds = Array.from(new Set(
    selected
      .map(cId => concerns.find(c => c.id === cId)?.axis)
      .filter((axis): axis is string => axis !== undefined && CONCERN_AXIS_ID[axis] !== undefined)
      .map(axis => CONCERN_AXIS_ID[axis])
  ));

  return (
    <>
      {/* Zone heading */}
      <div style={{ fontSize: 13, letterSpacing: "0.2em", color: GOLD,
        textTransform: "uppercase", marginBottom: 16,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
        {zoneLabel(zone, lang)} —{" "}
        {lang === "de" ? "Beschwerden wählen" : lang === "ko" ? "고민 선택" : "Select your concerns"}
      </div>

      {/* Concern chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 8px", marginBottom: selected.length > 0 ? 20 : 0 }}>
        {concerns.map((c) => {
          const isOn = selected.includes(c.id);
          return (
            <motion.div key={c.id} onClick={() => onToggle(activeZone, c.id)} whileTap={{ scale: 0.95 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 24, fontSize: 14, minHeight: 44,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                border: isOn ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                background: isOn ? "rgba(201,169,110,0.12)" : "rgba(255,255,255,0.02)",
                color: isOn ? GOLD : "rgba(255,255,255,0.5)",
                transition: "all 0.3s ease",
              }}>
              <span>{c.icon}</span>
              <span>{concernLabel(c, lang)}</span>
            </motion.div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif",
          fontStyle: "italic", marginTop: 4 }}>
          {lang === "de" ? "Alle zutreffenden Beschwerden auswählen"
            : lang === "ko" ? "해당하는 피부 고민을 선택하세요"
            : "Select all concerns that apply to this area"}
        </div>
      )}

      {/* ── Phase 03: Deep-dive axis questions ── */}
      {triggeredAxisIds.map((axisId) => {
        const axisDef: AxisDef | undefined = AXIS_DEFINITIONS.find(a => a.id === axisId);
        if (!axisDef) return null;

        const color = AXIS_COLOR[axisId] ?? "rgba(201,169,110,0.8)";

        // Smart deduplication: is this axis fully answered?
        const requiredQs = axisDef.questions.filter(q => q.required);
        const isAnswered  = requiredQs.length > 0 && requiredQs.every(q => axisAnswers[q.id] !== undefined);
        const isEditing   = editingAxes.has(axisId);
        const showQuestions = !isAnswered || isEditing;

        // Build visible questions respecting hideIf + conditional injection
        const visibleQs: QuestionDef[] = [];
        for (const q of axisDef.questions) {
          if (q.hideIf) {
            const hAns = axisAnswers[q.hideIf.questionId];
            if (hAns !== undefined) {
              const matches = Array.isArray(hAns)
                ? hAns.some(v => q.hideIf!.values.includes(String(v)))
                : q.hideIf.values.includes(String(hAns));
              if (matches) continue;
            }
          }
          visibleQs.push(q);
        }

        return (
          <motion.div key={axisId}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              marginTop: 20, paddingTop: 16,
              borderTop: "1px solid rgba(201,169,110,0.08)",
              opacity: isAnswered && !isEditing ? 0.45 : 1,
              transition: "opacity 0.3s ease",
            }}>

            {/* Axis tag + status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12 }}>
              <span style={{
                display: "inline-block", fontSize: 10, letterSpacing: "0.18em",
                textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
                background: color.replace("0.8)", "0.08)"),
                borderRadius: 12, padding: "3px 10px", color,
              }}>
                {gt(axisDef.name, lang)}
                {isAnswered && !isEditing && (
                  <span style={{ marginLeft: 6, color: "#4ade80", fontSize: 10 }}>✓</span>
                )}
              </span>
              {isAnswered && (
                <button onClick={() => onToggleEdit(axisId)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif",
                    padding: "2px 6px", textDecoration: "underline" }}>
                  {isEditing
                    ? (lang === "de" ? "Fertig" : lang === "ko" ? "완료" : "Done")
                    : (lang === "de" ? "Bearbeiten" : lang === "ko" ? "수정" : "Edit")}
                </button>
              )}
            </div>

            {/* Questions (or "already answered" summary) */}
            {isAnswered && !isEditing ? (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)",
                fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
                {lang === "de" ? "Bereits beantwortet"
                  : lang === "ko" ? "이미 답변 완료"
                  : "Already answered — click Edit to modify"}
              </div>
            ) : (
              showQuestions && visibleQs.map((q) => (
                <div key={q.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", marginBottom: 10,
                    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                    {gt(q.text, lang)}
                    {q.hint && (
                      <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.3)",
                        fontStyle: "italic", marginTop: 2 }}>
                        {gt(q.hint, lang)}
                      </span>
                    )}
                  </div>
                  <InlineQuestionRenderer
                    q={q}
                    value={axisAnswers[q.id]}
                    onChange={onAnswer}
                    lang={lang}
                    allAnswers={axisAnswers}
                  />
                </div>
              ))
            )}
          </motion.div>
        );
      })}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const DiagnosisPage: React.FC = () => {
  const navigate     = useNavigate();
  const store        = useDiagnosisStore();
  const isLoggedIn   = useAuthStore((s) => s.isLoggedIn);
  const { language } = useI18nStore();
  const lang         = language as Lang;
  const { history, loading: historyLoading, saveDiagnosis } = useDiagnosis();

  // ── Local state ──
  const [phase, setPhase]              = useState<Phase>("foundation");
  const [foundationAnswers, setFounds] = useState<Record<string, number>>({});
  const [zoneData, setZoneData]        = useState<Partial<Record<ZoneId, string[]>>>({});
  const [activeZone, setActiveZone]    = useState<ZoneId | null>(null);
  const [isMobile, setIsMobile]        = useState(false);
  const [showRetestModal, setShowRetestModal] = useState(false);
  // Phase 03 state
  const [editingAxes, setEditingAxes]  = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing]      = useState(false);
  const hasCheckedHistory = useRef(false);

  // Auth guard
  if (!isLoggedIn) return <Navigate to="/login?redirect=/diagnosis" replace />;

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Retest intercept
  useEffect(() => {
    if (historyLoading || hasCheckedHistory.current) return;
    hasCheckedHistory.current = true;
    if (history.length > 0) setShowRetestModal(true);
  }, [historyLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scanning transition auto-advance
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("facemap"), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  // Retest modal data
  const lastRecord      = history[0] ?? null;
  const radarScores     = (lastRecord?.radar_data ?? null) as Record<string, number> | null;
  const lastDiagnosedAt = lastRecord?.diagnosed_at ?? null;
  const lastTier        = lastRecord?.skin_tier ?? null;

  // Derived state
  const foundationComplete = FOUNDATION_QUESTIONS.every(fq => foundationAnswers[fq.id] !== undefined);
  const totalConcerns = Object.values(zoneData).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
  const zonesWithData = Object.values(zoneData).filter(arr => arr && arr.length > 0).length;
  const axisAnswers   = store.axisAnswers as Record<string, QuestionAnswer>;

  // Atopy answer from store (wired in Phase 03)
  const atopyStoreVal = axisAnswers["AX9_Q2"] as string | undefined;
  const showItching   = atopyStoreVal !== undefined && atopyStoreVal !== "dx_none";
  const itchingVal    = axisAnswers["AX9_Q1"] as string | undefined;

  // ── Callbacks ──
  const toggleConcern = useCallback((zoneId: ZoneId, cid: string) => {
    setZoneData(prev => {
      const existing = prev[zoneId] ?? [];
      const next = existing.includes(cid)
        ? existing.filter(c => c !== cid)
        : [...existing, cid];
      return { ...prev, [zoneId]: next };
    });
  }, []);

  const handleZoneClick = useCallback((id: ZoneId) => {
    setActiveZone(prev => prev === id ? null : id);
  }, []);

  // Phase 03: answer callback
  const onAnswer = useCallback((id: string, val: QuestionAnswer) => {
    store.setAxisAnswer(id, val);
  }, [store]);

  // Phase 03: edit toggle
  const handleToggleEdit = useCallback((axisId: number) => {
    setEditingAxes(prev => {
      const next = new Set(prev);
      next.has(axisId) ? next.delete(axisId) : next.add(axisId);
      return next;
    });
  }, []);

  // Phase 03: begin face mapping — wire foundation answers to store
  const handleBeginFaceMapping = useCallback(() => {
    if (!foundationComplete) return;
    store.setAxisAnswer("EXP_SLEEP",   (foundationAnswers.sleep   ?? 1) - 1);
    store.setAxisAnswer("EXP_WATER",   (foundationAnswers.water   ?? 1) - 1);
    store.setAxisAnswer("EXP_STRESS",  (foundationAnswers.stress  ?? 1) - 1);
    store.setAxisAnswer("EXP_CLIMATE", (foundationAnswers.climate ?? 1) - 1);
    setPhase("scanning");
  }, [foundationComplete, foundationAnswers, store]);

  // Phase 03: Complete Analysis → runDiagnosis → /results
  const handleCompleteAnalysis = useCallback(async () => {
    if (totalConcerns === 0 || analyzing) return;
    setAnalyzing(true);

    await new Promise(r => setTimeout(r, 400));

    const uiSignals = convertAxisAnswersToUiSignals(store.axisAnswers);
    const metaAnswers: Record<string, number | boolean> = {
      ...(store.metaAnswers as Record<string, number | boolean>),
      atopy: store.implicitFlags.atopyFlag,
    };
    const result = runDiagnosis({
      severities: store.severities,
      contexts: store.contexts,
      skinType: store.skinType || "normal",
      tier: store.selectedTier || "Full",
      metaAnswers,
      uiSignals,
    });

    store.setResult(result);

    const TIER_MAP: Record<string, string> = { Entry: "Entry", Full: "Advanced", Premium: "Clinical" };
    const flatProducts = Object.entries(
      result.product_bundle as Record<string, Array<{ id: string; name: { en: string } }>>
    ).flatMap(([phase, prods]) => prods.map(p => ({ id: p.id, name: p.name.en, phase })));

    await saveDiagnosis(
      result.axis_scores as Record<string, number>,
      TIER_MAP[store.selectedTier] ?? "Entry",
      flatProducts
    );

    navigate("/results");
  }, [totalConcerns, analyzing, store, saveDiagnosis, navigate]);

  const AX9_OPTIONS = [
    { label: "Yes — Atopic Dermatitis", labelDE: "Ja — Atopische Dermatitis", labelKO: "예 — 아토피 피부염", val: "dx_atopic" },
    { label: "Yes — Psoriasis",         labelDE: "Ja — Psoriasis",            labelKO: "예 — 건선",         val: "dx_psoriasis" },
    { label: "Suspected",               labelDE: "Vermutet",                  labelKO: "의심",              val: "dx_suspected" },
    { label: "No",                      labelDE: "Nein",                      labelKO: "아니요",            val: "dx_none" },
  ];
  const ax9Label = (opt: typeof AX9_OPTIONS[number]) =>
    lang === "de" ? opt.labelDE : lang === "ko" ? opt.labelKO : opt.label;

  const ITCH_OPTIONS = [
    { label: "Yes, frequently", labelDE: "Ja, häufig",     labelKO: "예, 자주",   val: "constantly" },
    { label: "Sometimes",       labelDE: "Manchmal",       labelKO: "가끔",        val: "frequently" },
    { label: "Rarely",          labelDE: "Selten",         labelKO: "드물게",      val: "occasionally" },
    { label: "No",              labelDE: "Nein",           labelKO: "아니요",      val: "never" },
  ];
  const itchLabel = (opt: typeof ITCH_OPTIONS[number]) =>
    lang === "de" ? opt.labelDE : lang === "ko" ? opt.labelKO : opt.label;

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, color: "#e8e4df",
      fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(201,169,110,0.2);border-radius:4px}
        input[type="range"]{accent-color:#c9a96e}
      `}</style>

      <Navbar />

      {/* ── Retest intercept modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showRetestModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(13,13,18,0.75)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowRetestModal(false); }}>
            <motion.div
              style={{ position: "relative", width: "100%", maxWidth: 380, borderRadius: 24, overflow: "hidden",
                border: "1px solid rgba(201,169,110,0.3)", background: "rgba(20,20,32,0.97)",
                backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)" }}
              initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}>
              <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />
              <button onClick={() => setShowRetestModal(false)}
                style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none",
                  cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 6, borderRadius: "50%" }}>
                <X size={16} />
              </button>
              <div style={{ padding: "20px 24px 24px" }}>
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif", color: GOLD, marginBottom: 10 }}>
                  {lang === "ko" ? "피부 분석 기록" : lang === "de" ? "Hautanalyse-Verlauf" : "Skin Analysis History"}
                </p>
                <h3 style={{ fontSize: "1.45rem", fontWeight: 300, lineHeight: 1.35, marginBottom: 4 }}>
                  {lang === "ko" ? "당신의 피부는 어떻게 달라졌을까요?"
                    : lang === "de" ? "Bereit zu sehen, wie sich Ihre Haut verändert hat?"
                    : "Ready to see how your skin has changed?"}
                </h3>
                {lastDiagnosedAt && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
                    {lang === "de" ? `Letzte Analyse: ${formatDiagnosisDate(lastDiagnosedAt, "de")}`
                      : lang === "ko" ? `마지막 분석: ${formatDiagnosisDate(lastDiagnosedAt, "ko")}`
                      : `Last analyzed: ${formatDiagnosisDate(lastDiagnosedAt, "en")}`}
                  </p>
                )}
                {radarScores && (
                  <div style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 16,
                    padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.15)",
                    marginBottom: 20 }}>
                    <MiniRadarChart scores={radarScores} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                        {lang === "ko" ? "피부 프로필" : lang === "de" ? "Hautprofil" : "Skin Profile"}
                      </p>
                      {lastTier && <p style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#e8e4df", marginBottom: 6 }}>{lastTier}</p>}
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.5, fontWeight: 300 }}>
                        {lang === "ko" ? "변화를 추적하면 더 정밀한 맞춤 프로토콜이 가능합니다."
                          : lang === "de" ? "Verfolgen Sie Veränderungen für ein präziseres Protokoll."
                          : "Track changes to refine your personalised protocol."}
                      </p>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { store.reset(); setShowRetestModal(false); }}
                    style={{ width: "100%", padding: "14px 24px", borderRadius: 14, border: "none",
                      background: `linear-gradient(135deg, ${GOLD}, #947E5C)`,
                      color: "#0d0d12", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 6px 24px rgba(201,169,110,0.3)" }}>
                    {lang === "ko" ? "새 분석 시작" : lang === "de" ? "Neue Analyse starten" : "Start New Analysis"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/profile")}
                    style={{ width: "100%", padding: "12px 24px", borderRadius: 14,
                      border: "1px solid rgba(201,169,110,0.3)", background: "transparent",
                      color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.06em", cursor: "pointer" }}>
                    {lang === "ko" ? "내 피부 여정 보기" : lang === "de" ? "Meine Hautreise ansehen" : "View My Skin Journey"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: "0 auto",
        padding: isMobile ? "80px 20px 48px" : "88px 24px 64px" }}>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {["foundation", "facemap", "results"].map((p) => {
            const isDone    = (p === "foundation" && phase !== "foundation") ||
                              (p === "facemap" && phase === "facemap" /* not done yet */);
            const isActive  = (p === "foundation" && phase === "foundation") ||
                              (p === "facemap" && (phase === "facemap" || phase === "scanning")) ||
                              (p === "results" && analyzing);
            return (
              <div key={p} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: isActive ? `linear-gradient(90deg, ${GOLD}, ${ROSE})`
                  : isDone ? GOLD : "rgba(255,255,255,0.06)",
                transition: "all 0.6s ease",
              }} />
            );
          })}
        </div>
        <p style={{ fontSize: 12, letterSpacing: "0.22em", color: `rgba(201,169,110,0.6)`,
          textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 36 }}>
          {phase === "foundation" && (lang === "de" ? "Phase 01 · Basis-Scan" : lang === "ko" ? "Phase 01 · 기초 스캔" : "Phase 01 · Foundation Scan")}
          {phase === "scanning"   && (lang === "de" ? "Scan wird initialisiert…" : lang === "ko" ? "스캔 초기화 중…" : "Initiating Skin Scan…")}
          {phase === "facemap"    && (lang === "de" ? "Phase 02–03 · Gesichts-Mapping & Analyse" : lang === "ko" ? "Phase 02–03 · 얼굴 매핑 & 분석" : "Phase 02–03 · Face Mapping & Analysis")}
        </p>

        <AnimatePresence mode="wait">

          {/* ─────────── PHASE 01: FOUNDATION ─────────── */}
          {phase === "foundation" && (
            <motion.div key="foundation"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
              <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 300, color: GOLD, marginBottom: 6 }}>
                {lang === "de" ? "Ihr Alltag & Ihre Haut" : lang === "ko" ? "일상 생활과 피부" : "Your Daily Life & Skin"}
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 36,
                fontFamily: "'DM Sans', sans-serif", maxWidth: 480, lineHeight: 1.6 }}>
                {lang === "de" ? "Wir beginnen mit Ihrem Lebensstil — dem Fundament, das Ihre Haut täglich prägt."
                  : lang === "ko" ? "피부를 형성하는 가장 기본적인 생활 습관부터 시작합니다."
                  : "We start with your lifestyle — the foundation that shapes your skin every day."}
              </p>
              <div style={{ display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                gap: 16, marginBottom: 44 }}>
                {FOUNDATION_QUESTIONS.map((fq, i) => (
                  <motion.div key={fq.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`,
                      borderRadius: 16, padding: "20px 16px",
                      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{fq.icon}</div>
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 14,
                      fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{fqText(fq, lang)}</div>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {fq.options.map(opt => (
                        <div key={opt.value}
                          onClick={() => setFounds(p => ({ ...p, [fq.id]: opt.value }))}
                          style={pillStyle(foundationAnswers[fq.id] === opt.value)}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <motion.button onClick={handleBeginFaceMapping}
                  whileTap={foundationComplete ? { scale: 0.97 } : {}}
                  style={{
                    display: "inline-block", padding: "16px 40px", borderRadius: 32, border: "none",
                    background: foundationComplete ? `linear-gradient(135deg, ${GOLD}, ${ROSE})` : "rgba(255,255,255,0.05)",
                    color: foundationComplete ? "#0d0d12" : "rgba(255,255,255,0.2)",
                    fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600,
                    cursor: foundationComplete ? "pointer" : "default",
                    boxShadow: foundationComplete ? "0 8px 32px rgba(201,169,110,0.3)" : "none",
                    transition: "all 0.4s ease",
                  }}>
                  {lang === "de" ? "Gesichts-Mapping beginnen →" : lang === "ko" ? "얼굴 매핑 시작 →" : "Begin Face Mapping →"}
                </motion.button>
                {!foundationComplete && (
                  <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.25)",
                    fontFamily: "'DM Sans', sans-serif" }}>
                    {lang === "de" ? "Bitte alle 4 Fragen beantworten" : lang === "ko" ? "4개 질문을 모두 답해주세요" : "Answer all 4 questions to continue"}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ─────────── SCANNING TRANSITION ─────────── */}
          {phase === "scanning" && (
            <motion.div key="scanning"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ minHeight: "60vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 24 }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <motion.div style={{ position: "absolute", inset: -16, borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)` }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div style={{ position: "absolute", inset: 4, borderRadius: "50%",
                  background: `conic-gradient(from 0deg, transparent 0%, ${GOLD} 35%, transparent 70%)` }}
                  animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                <div style={{ position: "absolute", inset: 16, borderRadius: "50%",
                  background: "linear-gradient(160deg, #0d0d12 0%, #141420 100%)" }} />
                <motion.div style={{ position: "absolute", inset: 16, borderRadius: "50%",
                  background: `conic-gradient(from 180deg, transparent 0%, ${ROSE} 20%, transparent 40%)` }}
                  animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <div style={{ position: "absolute", inset: 26, borderRadius: "50%",
                  background: "linear-gradient(160deg, #0d0d12 0%, #141420 100%)" }} />
                <motion.div style={{ position: "absolute", inset: 26, borderRadius: "50%",
                  background: `radial-gradient(circle, ${GOLD}, rgba(201,169,110,0.4))` }}
                  animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <motion.p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 300, color: GOLD,
                letterSpacing: "0.06em", textAlign: "center" }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                {lang === "de" ? "Haut-Scan wird initialisiert…" : lang === "ko" ? "피부 스캔 초기화 중…" : "Initiating Skin Scan…"}
              </motion.p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em" }}>
                {lang === "de" ? "Biometrische Gesichtsanalyse wird vorbereitet" : lang === "ko" ? "생체 인식 얼굴 분석 준비 중" : "Preparing biometric facial analysis"}
              </p>
            </motion.div>
          )}

          {/* ─────────── PHASE 02+03: FACE MAP ─────────── */}
          {phase === "facemap" && (
            <motion.div key="facemap"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}>

              {/* Stats bar */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", padding: "12px 20px",
                background: "rgba(255,255,255,0.02)", borderRadius: 14,
                border: "1px solid rgba(201,169,110,0.08)", marginBottom: 20,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                <span>{lang === "de" ? "Zonen" : lang === "ko" ? "부위" : "Zones"}:{" "}
                  <strong style={{ color: GOLD }}>{zonesWithData}</strong> / 6</span>
                <span>{lang === "de" ? "Beschwerden" : lang === "ko" ? "고민" : "Concerns"}:{" "}
                  <strong style={{ color: GOLD }}>{totalConcerns}</strong></span>
                <span style={{ color: store.implicitFlags.atopyFlag ? ROSE : "rgba(255,255,255,0.4)" }}>
                  {lang === "de" ? "Atopie" : lang === "ko" ? "아토피" : "Atopy"}:{" "}
                  <strong style={{ color: store.implicitFlags.atopyFlag ? ROSE : "rgba(255,255,255,0.4)" }}>
                    {store.implicitFlags.atopyFlag
                      ? (lang === "de" ? "Ja" : lang === "ko" ? "예" : "Yes")
                      : atopyStoreVal
                        ? (lang === "de" ? "Nein" : lang === "ko" ? "아니요" : "No")
                        : (lang === "de" ? "offen" : lang === "ko" ? "미답변" : "pending")}
                  </strong>
                </span>
              </div>

              {/* Global atopy banner — wired to AX9_Q2/Q1 */}
              <div style={{ background: "rgba(183,110,121,0.07)", border: "1px solid rgba(183,110,121,0.2)",
                borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, letterSpacing: "0.18em", color: ROSE,
                  textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                  {lang === "de" ? "Global Check · Neurodermitis & Psoriasis"
                    : lang === "ko" ? "글로벌 체크 · 아토피 & 건선"
                    : "Global Check · Neurodermatitis & Psoriasis"}
                </p>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 12,
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  {lang === "de"
                    ? "Wurden Sie mit Atopischer Dermatitis (Neurodermitis) oder Psoriasis diagnostiziert?"
                    : lang === "ko" ? "아토피 피부염(습진) 또는 건선 진단을 받으신 적이 있나요?"
                    : "Have you been diagnosed with Atopic Dermatitis (Neurodermitis) or Psoriasis?"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: showItching ? 14 : 0 }}>
                  {AX9_OPTIONS.map(opt => (
                    <div key={opt.val} onClick={() => store.setAxisAnswer("AX9_Q2", opt.val)}
                      style={pillStyle(atopyStoreVal === opt.val)}>
                      {ax9Label(opt)}
                    </div>
                  ))}
                </div>
                {/* Follow-up itching question */}
                <AnimatePresence>
                  {showItching && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                      <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 10,
                        fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                        {lang === "de" ? "Leiden Sie unter chronischem, starkem Juckreiz, der den Alltag beeinträchtigt?"
                          : lang === "ko" ? "일상생활을 방해하는 만성적이고 심한 가려움증이 있으신가요?"
                          : "Do you experience chronic, severe itching that disrupts daily life?"}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ITCH_OPTIONS.map(opt => (
                          <div key={opt.val} onClick={() => store.setAxisAnswer("AX9_Q1", opt.val)}
                            style={pillStyle(itchingVal === opt.val)}>
                            {itchLabel(opt)}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Main layout */}
              <div style={{ display: isMobile ? "block" : "flex", gap: 32, alignItems: "flex-start" }}>
                {/* Face SVG */}
                <div style={{ flexShrink: 0 }}>
                  <FaceSVG activeZone={activeZone} zoneData={zoneData} onZoneClick={handleZoneClick}
                    lang={lang} isMobile={isMobile} />
                  {isMobile && (
                    <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)",
                      fontFamily: "'DM Sans', sans-serif", marginTop: 10, letterSpacing: "0.1em" }}>
                      {lang === "de" ? "Tippen Sie auf eine Zone" : lang === "ko" ? "부위를 탭하세요" : "Tap a zone to select concerns"}
                    </p>
                  )}
                </div>

                {/* Desktop concern panel */}
                {!isMobile && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={activeZone ?? "empty"}
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 20, padding: 24,
                          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                          minHeight: 240, maxHeight: "70vh", overflowY: "auto" }}>
                        <ConcernPanel
                          activeZone={activeZone} zoneData={zoneData} onToggle={toggleConcern} lang={lang}
                          axisAnswers={axisAnswers} onAnswer={onAnswer}
                          editingAxes={editingAxes} onToggleEdit={handleToggleEdit}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Complete Analysis CTA */}
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <motion.button
                  onClick={handleCompleteAnalysis}
                  whileTap={totalConcerns > 0 && !analyzing ? { scale: 0.97 } : {}}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "16px 40px", borderRadius: 32, border: "none",
                    background: totalConcerns > 0 && !analyzing
                      ? `linear-gradient(135deg, ${GOLD}, ${ROSE})`
                      : "rgba(255,255,255,0.05)",
                    color: totalConcerns > 0 && !analyzing ? "#0d0d12" : "rgba(255,255,255,0.2)",
                    fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600,
                    cursor: totalConcerns > 0 && !analyzing ? "pointer" : "default",
                    boxShadow: totalConcerns > 0 && !analyzing ? "0 8px 32px rgba(201,169,110,0.3)" : "none",
                    transition: "all 0.4s ease",
                  }}>
                  {analyzing && (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%",
                        border: `2px solid #0d0d12`, borderTopColor: "transparent" }} />
                  )}
                  {lang === "de" ? "Analyse abschließen & Ergebnisse →"
                    : lang === "ko" ? "분석 완료 & 결과 보기 →"
                    : "Complete Analysis & View Results →"}
                </motion.button>
                {totalConcerns === 0 && (
                  <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.2)",
                    fontFamily: "'DM Sans', sans-serif" }}>
                    {lang === "de" ? "Wählen Sie mindestens eine Beschwerde aus"
                      : lang === "ko" ? "최소 1개의 고민을 선택하세요"
                      : "Select at least one concern to continue"}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile bottom sheet ──────────────────────────────────────────────── */}
      {isMobile && phase === "facemap" && (
        <>
          <AnimatePresence>
            {activeZone && (
              <motion.div onClick={() => setActiveZone(null)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 40 }} />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {activeZone && (
              <motion.div key={activeZone}
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 36 }}
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0,
                  maxHeight: "75vh", overflowY: "auto", zIndex: 50,
                  background: "rgba(20,20,32,0.98)",
                  backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                  borderRadius: "24px 24px 0 0",
                  borderTop: `1px solid rgba(201,169,110,0.2)`,
                  padding: "0 20px 40px",
                }}>
                <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(201,169,110,0.3)" }} />
                </div>
                <ConcernPanel
                  activeZone={activeZone} zoneData={zoneData} onToggle={toggleConcern} lang={lang}
                  axisAnswers={axisAnswers} onAnswer={onAnswer}
                  editingAxes={editingAxes} onToggleEdit={handleToggleEdit}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default DiagnosisPage;
