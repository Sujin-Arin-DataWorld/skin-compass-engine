/**
 * SkinAgeCard.tsx
 *
 * Phase 6 Step 1 — Skin Age display card for the results page.
 *
 * Imports computeSkinAge from the existing engine (DO NOT reimplement).
 * Shows:
 *  - Large animated count-up of the skin age number (Framer Motion)
 *  - Comparison subtitle that fades in 0.5s after count-up finishes
 *  - Horizontal gauge bar with "Biological" and "Skin" markers
 *  - Explanation text at the bottom (3 locales)
 *
 * Styling:
 *  - Dark mode: gold→rose-gold gradient 6-8% opacity, 1px gold border 15% opacity
 *  - Light mode: soft green→cream gradient 8% opacity
 *  - Design tokens: gold #C8A951, dark bg #1A1A2E
 */

import { useEffect, useRef, useState } from "react";
import { motion, animate, useMotionValue } from "framer-motion";
import { useTheme } from "next-themes";
import { PremiumCard } from "@/components/ui/card-patterns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "ko" | "en" | "de";
type Comparison = "younger" | "matches" | "older";

export interface SkinAgeCardProps {
  /** Midpoint of the user's age bracket (from AGE_MIDPOINTS[ageBracket]) */
  realAge: number;
  /** Output of computeSkinAge().skinAge */
  skinAge: number;
  /** Output of computeSkinAge().comparison */
  comparison: Comparison;
  /** Display language */
  lang: Lang;
}

// ─── i18n strings ─────────────────────────────────────────────────────────────

const EYEBROW: Record<Lang, string> = {
  ko: "피부 나이",
  en: "Your Skin Age",
  de: "Ihr Hautalter",
};

function comparisonText(comparison: Comparison, delta: number, lang: Lang): string {
  if (comparison === "younger") {
    const y = delta;
    return lang === "ko"
      ? `피부가 실제 나이보다 ${y}세 더 젊게 작동하고 있어요!`
      : lang === "de"
      ? `Ihre Haut ist ${y} Jahr${y !== 1 ? "e" : ""} jünger!`
      : `Your skin is performing ${y} year${y !== 1 ? "s" : ""} younger!`;
  }
  if (comparison === "older") {
    return lang === "ko"
      ? "피부에 가속 노화 징후가 나타나고 있어요"
      : lang === "de"
      ? "Ihre Haut zeigt Zeichen beschleunigter Hautalterung"
      : "Your skin shows signs of accelerated aging";
  }
  // matches
  return lang === "ko"
    ? "피부 나이가 실제 나이와 일치해요"
    : lang === "de"
    ? "Ihr Hautalter entspricht Ihrem biologischen Alter"
    : "Your skin age matches your biological age";
}

const EXPLANATION: Record<Lang, string> = {
  ko: "피부 나이는 수분, 탄력, 자외선 손상 등 10개 축 점수를 기반으로 산출됩니다",
  en: "Skin age is calculated from 10 analysis axes including hydration, elasticity, and UV damage",
  de: "Das Hautalter basiert auf 10 Analysedimensionen wie Hydration, Elastizität und UV-Schäden",
};

const GAUGE_LABELS: Record<Lang, { bio: string; skin: string }> = {
  ko: { bio: "생물학적", skin: "피부" },
  en: { bio: "Biological", skin: "Skin" },
  de: { bio: "Biologisch", skin: "Haut" },
};

// ─── Comparison color map ─────────────────────────────────────────────────────

const COMPARISON_COLOR: Record<Comparison, string> = {
  younger: "hsl(var(--success))",
  matches: "hsl(var(--muted-foreground))",
  older:   "hsl(var(--warning))",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function SkinAgeCard({ realAge, skinAge, comparison, lang }: SkinAgeCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Count-up animation state
  const count         = useMotionValue(0);
  const [display, setDisplay]           = useState(0);
  const [showComparison, setShowComparison] = useState(false);

  // Stable ref to the timeout so cleanup works on unmount
  const comparisonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset on each skinAge change
    count.set(0);
    setDisplay(0);
    setShowComparison(false);
    if (comparisonTimer.current) clearTimeout(comparisonTimer.current);

    const controls = animate(count, skinAge, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => {
        comparisonTimer.current = setTimeout(() => setShowComparison(true), 500);
      },
    });

    return () => {
      controls.stop();
      if (comparisonTimer.current) clearTimeout(comparisonTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skinAge]);

  // ── Gauge math ──────────────────────────────────────────────────────────────
  // Range is realAge ± 12 years (clamped so skinAge is always inside)
  const BAR_MIN   = Math.min(realAge - 12, skinAge - 3);
  const BAR_MAX   = Math.max(realAge + 12, skinAge + 3);
  const BAR_RANGE = BAR_MAX - BAR_MIN;

  const realPct = ((realAge - BAR_MIN) / BAR_RANGE) * 100;
  const skinPct = ((skinAge - BAR_MIN) / BAR_RANGE) * 100;

  const fillLeft  = Math.min(realPct, skinPct);
  const fillWidth = Math.abs(realPct - skinPct);

  const accentColor = COMPARISON_COLOR[comparison];
  const delta       = Math.abs(skinAge - realAge);

  // ── Visual tokens ────────────────────────────────────────────────────────────
  const trackColor  = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";
  const labelColor  = isDark ? "rgba(245,240,232,0.42)" : "rgba(26,26,46,0.42)";
  const valueColor  = isDark ? "rgba(245,240,232,0.75)" : "rgba(26,26,46,0.72)";
  const dotColor    = isDark ? "rgba(245,240,232,0.65)" : "rgba(26,26,46,0.55)";

  const gaugeLabels = GAUGE_LABELS[lang];

  return (
    <PremiumCard className="mb-5 text-center">
      {/* ── Eyebrow label ─────────────────────────────────────────────────── */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: labelColor,
          fontFamily: "var(--font-sans)",
          marginBottom: 8,
        }}
      >
        {EYEBROW[lang]}
      </div>

      {/* ── Large count-up number ─────────────────────────────────────────── */}
      <div
        style={{
          fontSize: 42,
          fontWeight: 300,
          color: "hsl(var(--accent-gold))",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.05,
          marginBottom: 10,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </div>

      {/* ── Comparison subtitle — fades in 0.5s after count-up ───────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showComparison ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: 13,
          fontWeight: comparison !== "matches" ? 500 : 400,
          color: accentColor,
          fontFamily: "var(--font-sans)",
          marginBottom: 22,
          lineHeight: 1.4,
          minHeight: "1.4em",
        }}
      >
        {comparisonText(comparison, delta, lang)}
      </motion.div>

      {/* ── Gauge bar — fades in with comparison text ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showComparison ? 1 : 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ padding: "0 4px", marginBottom: 8 }}
      >
        {/* Track + fill + markers */}
        <div
          style={{
            position: "relative",
            height: 4,
            borderRadius: 2,
            background: trackColor,
            // Margin-bottom provides space for the labels below the track
            marginBottom: 40,
          }}
        >
          {/* Colored fill between the two markers */}
          {fillWidth > 0.5 && (
            <div
              style={{
                position: "absolute",
                left: `${fillLeft}%`,
                width: `${fillWidth}%`,
                height: "100%",
                borderRadius: 2,
                background: accentColor,
                opacity: 0.6,
              }}
            />
          )}

          {/* Real age marker */}
          <GaugeMarker
            pct={realPct}
            top={-2}
            dotColor={dotColor}
            dotBorder={dotColor}
            label={gaugeLabels.bio}
            value={realAge}
            labelColor={labelColor}
            valueColor={valueColor}
          />

          {/* Skin age marker */}
          <GaugeMarker
            pct={skinPct}
            top={-2}
            dotColor={accentColor}
            dotBorder={accentColor + "80"}
            label={gaugeLabels.skin}
            value={skinAge}
            labelColor={labelColor}
            valueColor={accentColor}
            bold
          />
        </div>
      </motion.div>

      {/* ── Explanation text (static) ─────────────────────────────────────── */}
      <div
        style={{
          fontSize: 11,
          color: isDark ? "rgba(245,240,232,0.35)" : "rgba(26,26,46,0.35)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.65,
          textAlign: "center",
        }}
      >
        {EXPLANATION[lang]}
      </div>
    </PremiumCard>
  );
}

// ─── GaugeMarker sub-component ────────────────────────────────────────────────

interface GaugeMarkerProps {
  pct: number;
  top: number;
  dotColor: string;
  dotBorder: string;
  label: string;
  value: number;
  labelColor: string;
  valueColor: string;
  bold?: boolean;
}

function GaugeMarker({
  pct, top, dotColor, dotBorder, label, value, labelColor, valueColor, bold,
}: GaugeMarkerProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${pct}%`,
        transform: "translateX(-50%)",
        top,
      }}
    >
      {/* Dot on the track */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          border: `2px solid ${dotBorder}`,
        }}
      />
      {/* Label + value below the track */}
      <div
        style={{
          position: "absolute",
          top: 13,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: labelColor,
            fontFamily: "var(--font-sans)",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: bold ? 600 : 500,
            color: valueColor,
            fontFamily: "var(--font-sans)",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default SkinAgeCard;
