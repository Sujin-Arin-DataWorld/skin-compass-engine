/**
 * ExposomeStep — "Your Daily Life & Skin"
 * Always shown for every user after all axis-specific questions.
 *
 * Questions:
 *  EXP_SLEEP   — Sleep hours (custom discrete slider)
 *  EXP_WATER   — Daily water intake (animated glass-fill cards)
 *  EXP_STRESS  — Stress level (3 visual icon cards)
 *  EXP_CLIMATE — Climate (single-select cards)
 *  EXP_EXERCISE— Outdoor exercise frequency (single-select)
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lang, QuestionAnswer } from "@/engine/questionRoutingV5";
import { CityClimateInput } from "@/components/skin-assessment/CityClimateInput";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerMap = Record<string, QuestionAnswer>;
type LT = Record<Lang, string>;

function tx(obj: LT, lang: Lang): string {
  return obj[lang] ?? obj.en;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const L = {
  eyebrow:    { en: "Lifestyle Profile",      de: "Lebensstil-Profil",         ko: "라이프스타일 프로필" } as LT,
  title:      { en: "Your Daily Life & Skin",  de: "Ihr Alltag & Ihre Haut",   ko: "일상과 피부" } as LT,
  sub:        { en: "Small daily habits have a big impact on your skin.", de: "Kleine Alltagsgewohnheiten beeinflussen Ihre Haut stark.", ko: "작은 일상 습관이 피부에 큰 영향을 줍니다." } as LT,
  whyPrefix:  { en: "Why we ask:",             de: "Warum wir fragen:",         ko: "왜 물어보나요:" } as LT,
  back:       { en: "← Back",                  de: "← Zurück",                 ko: "← 뒤로" } as LT,
  cont:       { en: "Continue →",              de: "Weiter →",                 ko: "계속 →" } as LT,

  // Q1 — Sleep
  q1:    { en: "How much sleep do you get on average?", de: "Wie viele Stunden schlafen Sie durchschnittlich?", ko: "평균 수면 시간이 얼마나 되세요?" } as LT,
  q1why: { en: "Your skin repairs itself during sleep. Less rest means slower cell turnover and a weaker barrier.", de: "Ihre Haut regeneriert sich im Schlaf. Weniger Schlaf bedeutet langsamere Zellerneuerung und eine geschwächte Hautbarriere.", ko: "수면 중 피부가 스스로 회복해요. 수면이 부족하면 세포 재생이 느려지고 피부 장벽이 약해집니다." } as LT,

  // Q2 — Water
  q2:    { en: "How much water do you drink per day?", de: "Wie viel Wasser trinken Sie am Tag?", ko: "하루에 물을 얼마나 마시세요?" } as LT,
  q2why: { en: "Staying hydrated supports your skin barrier from within and helps maintain a healthy glow.", de: "Ausreichend trinken stärkt Ihre Hautbarriere von innen und sorgt für einen frischen Teint.", ko: "충분한 수분 섭취는 피부 장벽을 안에서부터 건강하게 유지해줘요." } as LT,

  // Q3 — Stress
  q3:    { en: "How stressed are you right now?", de: "Wie gestresst fühlen Sie sich gerade?", ko: "요즘 스트레스가 어느 정도예요?" } as LT,
  q3why: { en: "Stress raises cortisol, which increases oil production and can trigger breakouts and premature ageing.", de: "Stress erhöht Cortisol — das steigert die Talgproduktion und kann Unreinheiten und vorzeitige Hautalterung auslösen.", ko: "스트레스는 코르티솔을 높여 피지 분비를 늘리고 트러블과 조기 노화를 유발할 수 있어요." } as LT,

  // Q4 — Climate
  q4:    { en: "What is the climate where you live?", de: "Welches Klima herrscht an Ihrem Wohnort?", ko: "사시는 곳의 기후는 어떤가요?" } as LT,
  q4why: { en: "Cold air strips moisture, humidity promotes oiliness, and UV accelerates pigmentation — your climate shapes your skin's daily challenges.", de: "Kälte entzieht Feuchtigkeit, Luftfeuchtigkeit fördert Talgproduktion und UV beschleunigt Pigmentierung — Ihr Klima bestimmt die täglichen Herausforderungen Ihrer Haut.", ko: "추위는 수분을 빼앗고, 습도는 피지를 늘리고, UV는 색소침착을 가속해요 — 기후가 피부의 일상 과제를 결정합니다." } as LT,

  // Q5 — Exercise
  q5:    { en: "How often do you exercise outdoors?", de: "Wie oft bewegen Sie sich draußen?", ko: "야외 운동을 얼마나 자주 하세요?" } as LT,
  q5why: { en: "Outdoor exercise boosts circulation and skin repair, but also increases UV and sweat exposure.", de: "Bewegung draußen fördert die Durchblutung und Hautregeneration — erhöht aber auch UV- und Schweißbelastung.", ko: "야외 운동은 혈액순환과 피부 재생에 좋지만 자외선과 땀 노출도 늘어요." } as LT,
} as const;

// ─── Sleep slider labels ──────────────────────────────────────────────────────

const SLEEP_LABELS: LT[] = [
  { en: "< 5h",  de: "< 5 Std.",  ko: "5시간 미만" },
  { en: "5–6h",  de: "5–6 Std.",  ko: "5–6시간" },
  { en: "7–8h",  de: "7–8 Std.",  ko: "7–8시간" },
  { en: "8h+",   de: "8+ Std.",   ko: "8시간 이상" },
];
const SLEEP_DEFAULT = 1; // 5–6h

// ─── Water options ────────────────────────────────────────────────────────────

const WATER_OPTS = [
  {
    id: "water_low",
    label:    { en: "Under 1L", de: "Unter 1 Liter", ko: "1리터 미만" } as LT,
    sublabel: { en: "per day", de: "pro Tag", ko: "하루" } as LT,
    glasses: 1,
    fill: 0.28,
  },
  {
    id: "water_mid",
    label:    { en: "1–2L", de: "1–2 Liter", ko: "1–2리터" } as LT,
    sublabel: { en: "per day", de: "pro Tag", ko: "하루" } as LT,
    glasses: 3,
    fill: 0.62,
  },
  {
    id: "water_high",
    label:    { en: "Over 2L", de: "Über 2 Liter", ko: "2리터 이상" } as LT,
    sublabel: { en: "per day", de: "pro Tag", ko: "하루" } as LT,
    glasses: 5,
    fill: 0.88,
  },
] as const;

// ─── Stress options ───────────────────────────────────────────────────────────

const STRESS_OPTS = [
  { id: "stress_low",  emoji: "😌", label: { en: "Low",      de: "Gering", ko: "낮음" } as LT, accent: "emerald" },
  { id: "stress_mod",  emoji: "😐", label: { en: "Moderate", de: "Mittel",  ko: "보통" } as LT, accent: "amber"   },
  { id: "stress_high", emoji: "😰", label: { en: "High",     de: "Hoch",   ko: "높음" } as LT, accent: "rose"    },
] as const;

// ─── Exercise options ─────────────────────────────────────────────────────────

const EXERCISE_OPTS = [
  { id: "ex_daily",   label: { en: "Daily",        de: "Täglich",       ko: "매일"     } as LT },
  { id: "ex_34",      label: { en: "3–4× / week",  de: "3–4× / Woche",  ko: "주 3–4회" } as LT },
  { id: "ex_12",      label: { en: "1–2× / week",  de: "1–2× / Woche",  ko: "주 1–2회" } as LT },
  { id: "ex_rarely",  label: { en: "Rarely",        de: "Selten",        ko: "드물게"   } as LT },
] as const;

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Single water-glass SVG with spring-animated fill level */
function WaterGlass({
  fillLevel,
  delay,
  clipId,
}: {
  fillLevel: number;
  delay: number;
  clipId: string;
}) {
  const waterTop = 37 - fillLevel * 34; // y coord: 37=empty → 3=full

  return (
    <svg viewBox="0 0 24 40" width="18" height="28" className="overflow-visible flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <path d="M3 3 L21 3 L19 37 L5 37 Z" />
        </clipPath>
      </defs>
      {/* Water fill */}
      <motion.rect
        x="0"
        width="24"
        height="40"
        clipPath={`url(#${clipId})`}
        initial={{ y: 37, opacity: 0 }}
        animate={{ y: fillLevel > 0 ? waterTop : 37, opacity: fillLevel > 0 ? 0.72 : 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20, delay, opacity: { duration: 0.18 } }}
        style={{ fill: "hsl(205 90% 65%)" }}
      />
      {/* Glass outline */}
      <path
        d="M3 3 L21 3 L19 37 L5 37 Z"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-foreground/40"
      />
    </svg>
  );
}

/** Row of N animated water glasses */
function WaterGlassRow({
  count,
  fill,
  selected,
  optId,
}: {
  count: number;
  fill: number;
  selected: boolean;
  optId: string;
}) {
  return (
    <div className="flex items-end gap-1.5 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <WaterGlass
          key={i}
          fillLevel={selected ? fill : 0}
          delay={selected ? i * 0.07 : 0}
          clipId={`wg-${optId}-${i}`}
        />
      ))}
    </div>
  );
}

/** Why-we-ask micro-copy */
function WhyAsk({ text, lang }: { text: LT; lang: Lang }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1 mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-light text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-manipulation"
      >
        <span className="inline-flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-[7px] leading-none">
          i
        </span>
        <span>{tx(L.whyPrefix, lang)}</span>
        <span className="ml-0.5 text-[10px]">{open ? "▲" : "▼"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 overflow-hidden text-[11px] font-light italic leading-relaxed text-muted-foreground/70 break-keep whitespace-pre-line"
          >
            {tx(text, lang)}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Labelled section wrapper */
function QSection({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-0">{children}</div>;
}

/** Question label */
function QLabel({ text, lang }: { text: LT; lang: Lang }) {
  return (
    <p className="mb-1 text-sm sm:text-base font-light text-foreground leading-relaxed break-keep whitespace-pre-line">
      {tx(text, lang)}
    </p>
  );
}

// ─── Sleep Slider ─────────────────────────────────────────────────────────────

function SleepSlider({
  value,
  lang,
  onChange,
}: {
  value: number;
  lang: Lang;
  onChange: (v: number) => void;
}) {
  const [active, setActive] = useState(false);
  const pct = (value / (SLEEP_LABELS.length - 1)) * 100;

  return (
    <div className="relative pt-10 pb-6 px-1 select-none">
      {/* Track */}
      <div className="relative mx-2 h-1.5 rounded-full bg-border/60">
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, hsl(43 74% 49%), hsl(35 65% 55%))",
          }}
        />

        {/* Tick marks + labels */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between">
          {SLEEP_LABELS.map((lbl, i) => {
            const filled = i <= value;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`h-2 w-px rounded-full transition-colors duration-200 ${filled ? "bg-amber-500/70" : "bg-border"}`} />
                <span
                  className={`mt-5 text-[10px] whitespace-nowrap font-light transition-colors duration-200 ${
                    i === value
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {tx(lbl, lang)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
          animate={{ left: `${pct}%`, scale: active ? 1.35 : 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background whitespace-nowrap shadow-lg"
              >
                {tx(SLEEP_LABELS[value], lang)}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className="h-5 w-5 rounded-full border-2 border-amber-500 bg-background shadow-md"
            style={{ boxShadow: active ? "0 0 0 4px hsl(43 74% 49% / 0.2)" : undefined }}
          />
        </motion.div>
      </div>

      {/* Native range input (invisible, captures all pointer events) */}
      <input
        type="range"
        min={0}
        max={SLEEP_LABELS.length - 1}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={() => setActive(true)}
        onMouseUp={() => setActive(false)}
        onTouchStart={() => setActive(true)}
        onTouchEnd={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="absolute inset-x-2 top-0 h-full w-[calc(100%-16px)] cursor-pointer opacity-0 z-10"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface ExposomeStepProps {
  lang: Lang;
  answers: AnswerMap;
  onChange: (id: string, value: QuestionAnswer) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ExposomeStep({ lang, answers, onChange, onNext, onBack }: ExposomeStepProps) {
  // Default sleep to 2 (6h) if untouched — counts as answered
  const sleepVal = typeof answers["EXP_SLEEP"] === "number"
    ? (answers["EXP_SLEEP"] as number)
    : SLEEP_DEFAULT;

  // Ensure default is written to store on first render
  useEffect(() => {
    if (answers["EXP_SLEEP"] === undefined) {
      onChange("EXP_SLEEP", SLEEP_DEFAULT);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canContinue =
    !!answers["EXP_WATER"] &&
    !!answers["EXP_STRESS"] &&
    !!answers["EXP_CLIMATE"] &&
    !!answers["EXP_EXERCISE"];

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="mb-8">
        <p
          className="mb-2 text-[0.62rem] tracking-[0.2em] uppercase font-medium"
          style={{ color: "hsl(30 65% 52%)" }}
        >
          {tx(L.eyebrow, lang)}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-light text-foreground leading-tight break-keep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tx(L.title, lang)}
        </h2>
        <p className="mt-2 text-sm font-light text-muted-foreground break-keep">
          {tx(L.sub, lang)}
        </p>
      </div>

      <div className="flex flex-col gap-9">

        {/* ── Q1: Sleep ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.05 }}
          className="relative rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm overflow-hidden"
          style={{ backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}
        >
          <div className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "linear-gradient(to bottom, #C9A96E, transparent)" }} />
          <QSection>
            <QLabel text={L.q1} lang={lang} />
            <WhyAsk text={L.q1why} lang={lang} />
            <SleepSlider
              value={sleepVal}
              lang={lang}
              onChange={(v) => onChange("EXP_SLEEP", v)}
            />
          </QSection>
        </motion.div>

        {/* ── Q2: Water ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.1 }}
          className="relative rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm overflow-hidden"
          style={{ backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}
        >
          <div className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "linear-gradient(to bottom, #C9A96E, transparent)" }} />
          <QSection>
            <QLabel text={L.q2} lang={lang} />
            <WhyAsk text={L.q2why} lang={lang} />
            <div className="grid grid-cols-3 gap-3">
              {WATER_OPTS.map((opt) => {
                const selected = answers["EXP_WATER"] === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => onChange("EXP_WATER", opt.id)}
                    whileTap={{ scale: 0.97 }}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border-2 px-3 py-4 transition-colors min-h-[110px] touch-manipulation ${
                      selected
                        ? "border-amber-500"
                        : "border-border hover:border-amber-300/50"
                    }`}
                    style={{
                      background: selected
                        ? "hsl(43 74% 49% / 0.06)"
                        : undefined,
                      backdropFilter: "blur(12px) saturate(150%)",
                      WebkitBackdropFilter: "blur(12px) saturate(150%)",
                    }}
                  >
                    <WaterGlassRow
                      count={opt.glasses}
                      fill={opt.fill}
                      selected={selected}
                      optId={opt.id}
                    />
                    <div className="text-center">
                      <p className={`text-xs font-medium leading-tight ${selected ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>
                        {tx(opt.label, lang)}
                      </p>
                      <p className="text-[10px] font-light text-muted-foreground">{tx(opt.sublabel, lang)}</p>
                    </div>

                    {/* Gold ring overlay */}
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-amber-500"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </QSection>
        </motion.div>

        {/* ── Q3: Stress ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.15 }}
          className="relative rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm overflow-hidden"
          style={{ backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}
        >
          <div className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "linear-gradient(to bottom, #C9A96E, transparent)" }} />
          <QSection>
            <QLabel text={L.q3} lang={lang} />
            <WhyAsk text={L.q3why} lang={lang} />
            <div className="grid grid-cols-3 gap-3">
              {STRESS_OPTS.map((opt) => {
                const selected = answers["EXP_STRESS"] === opt.id;
                const ringColor =
                  opt.accent === "emerald" ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20"
                  : opt.accent === "rose"    ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/20"
                  : "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20";
                const labelColor =
                  opt.accent === "emerald" ? "text-emerald-700 dark:text-emerald-300"
                  : opt.accent === "rose"    ? "text-rose-700 dark:text-rose-300"
                  : "text-amber-700 dark:text-amber-300";

                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => onChange("EXP_STRESS", opt.id)}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.14 } }}
                    className={`relative flex flex-col items-center gap-2.5 rounded-xl border-2 py-5 px-2 transition-colors min-h-[100px] touch-manipulation ${
                      selected ? ringColor : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="text-3xl leading-none">{opt.emoji}</span>
                    <p className={`text-xs font-medium ${selected ? labelColor : "font-light text-foreground"}`}>
                      {tx(opt.label, lang)}
                    </p>
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`pointer-events-none absolute inset-0 rounded-xl border-2 ${
                            opt.accent === "emerald" ? "border-emerald-500"
                            : opt.accent === "rose"    ? "border-rose-500"
                            : "border-amber-500"
                          }`}
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </QSection>
        </motion.div>

        {/* ── Q4: Climate ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.2 }}
          className="relative rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm overflow-hidden"
          style={{ backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}
        >
          <div className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "linear-gradient(to bottom, #C9A96E, transparent)" }} />
          <QSection>
            <QLabel text={L.q4} lang={lang} />
            <WhyAsk text={L.q4why} lang={lang} />
            <CityClimateInput
              lang={lang}
              onLegacyChange={(climateType) => onChange("EXP_CLIMATE", climateType)}
            />
          </QSection>
        </motion.div>

        {/* ── Q5: Exercise ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.25 }}
          className="relative rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm overflow-hidden"
          style={{ backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}
        >
          <div className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "linear-gradient(to bottom, #C9A96E, transparent)" }} />
          <QSection>
            <QLabel text={L.q5} lang={lang} />
            <WhyAsk text={L.q5why} lang={lang} />
            <div className="flex flex-col gap-2">
              {EXERCISE_OPTS.map((opt) => {
                const selected = answers["EXP_EXERCISE"] === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => onChange("EXP_EXERCISE", opt.id)}
                    whileTap={{ scale: 0.988 }}
                    className={`relative flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors min-h-[48px] touch-manipulation ${
                      selected
                        ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20"
                        : "border-border hover:border-amber-300/50"
                    }`}
                  >
                    <span className={`text-sm ${selected ? "font-medium text-amber-700 dark:text-amber-300" : "font-light text-foreground"}`}>
                      {tx(opt.label, lang)}
                    </span>
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="h-4 w-4 flex-shrink-0 rounded-full bg-amber-500 flex items-center justify-center"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-amber-500"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </QSection>
        </motion.div>

      </div>{/* /questions */}

      {/* Navigation */}
      <motion.div
        className="mt-10 flex items-center justify-between pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <button
          onClick={onBack}
          className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors min-h-[44px] touch-manipulation"
        >
          {tx(L.back, lang)}
        </button>
        <motion.button
          onClick={onNext}
          disabled={!canContinue}
          whileTap={canContinue ? { scale: 0.96 } : undefined}
          className="rounded-xl px-7 py-3 text-sm font-medium text-white transition-all min-h-[44px] touch-manipulation disabled:opacity-30"
          style={{
            background: canContinue
              ? "linear-gradient(135deg, hsl(35 65% 50%), hsl(30 70% 45%))"
              : "hsl(var(--muted))",
            color: canContinue ? "white" : "hsl(var(--muted-foreground))",
          }}
        >
          {tx(L.cont, lang)}
        </motion.button>
      </motion.div>
    </div>
  );
}
