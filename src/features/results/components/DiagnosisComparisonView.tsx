/**
 * DiagnosisComparisonView.tsx
 *
 * Phase 6 Step 2 — Before/after radar chart + per-axis change cards.
 * Only rendered when useDiagnosisComparison().hasPrevious === true.
 *
 * Layout (top to bottom):
 *  Section C — Overall progress summary banner (improved/stable/worsened counts)
 *  Section A — Dual radar chart (current = gold solid, previous = gray dashed)
 *  Section B — Per-axis change cards (staggered, sorted improved→stable→worsened)
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useI18nStore } from "@/store/i18nStore";
import { AXIS_KEYS, AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from "@/engine/types";
import type { DiagnosisResult } from "@/engine/types";
import type { DiagnosisComparison } from "@/engine/diagnosisComparison";
import RadarChart from "@/components/diagnosis/RadarChart";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "ko" | "en" | "de";
type Direction = "improved" | "stable" | "worsened";

export interface DiagnosisComparisonViewProps {
  result: DiagnosisResult;
  comparison: DiagnosisComparison;
  engineVersionMismatch?: boolean;
  previousDiagnosisAgeDays?: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_ORDER: Record<Direction, number> = { improved: 0, stable: 1, worsened: 2 };

const DIR_COLOR: Record<Direction, string> = {
  improved: "hsl(var(--success))",
  stable: "rgba(140,150,165,0.9)",
  worsened: "hsl(var(--warning))",
};

const DIR_BG: Record<Direction, string> = {
  improved: "rgba(34,197,94,0.08)",
  stable: "rgba(140,150,165,0.09)",
  worsened: "rgba(245,158,11,0.08)",
};

const DIR_ARROW: Record<Direction, string> = {
  improved: "↓",
  stable: "→",
  worsened: "↑",
};

const PILL_LABEL: Record<Direction, Record<Lang, string>> = {
  improved: { en: "improved", de: "verbessert", ko: "개선됨" },
  stable: { en: "stable", de: "stabil", ko: "안정됨" },
  worsened: { en: "need attention", de: "beachten", ko: "주의 필요" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleDateString(
      lang === "ko" ? "ko-KR" : lang === "de" ? "de-DE" : "en-US",
      { month: "short", day: "numeric" },
    );
  } catch {
    return iso.slice(0, 10);
  }
}

// ─── Sub-component: CountPill ─────────────────────────────────────────────────

function CountPill({ count, dir, lang }: { count: number; dir: Direction; lang: Lang }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11,
      fontFamily: "var(--font-sans)", fontWeight: 600,
      color: DIR_COLOR[dir], background: DIR_BG[dir],
    }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{count}</span>
      <span style={{ fontWeight: 400, opacity: 0.85 }}>{PILL_LABEL[dir][lang]}</span>
    </span>
  );
}

// ─── Sub-component: AxisChangeCard ────────────────────────────────────────────

function AxisChangeCard({
  axis, comparison, lang, isDark, index,
}: {
  axis: (typeof AXIS_KEYS)[number];
  comparison: DiagnosisComparison;
  lang: Lang;
  isDark: boolean;
  index: number;
}) {
  const change = comparison.changes[axis];
  const prev = comparison.previous.scores[axis];
  const curr = comparison.current.scores[axis];
  const dir = change.direction;
  const axisName =
    lang === "de" ? AXIS_LABELS_DE[axis] :
      lang === "ko" ? AXIS_LABELS_KO[axis] :
        AXIS_LABELS[axis];

  // Delta badge: negative = score went down (good), positive = score went up (bad)
  const deltaSign = change.delta > 0 ? "−" : change.delta < 0 ? "+" : "±";
  const deltaBadge = `${deltaSign}${Math.abs(change.delta)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
      style={{
        borderRadius: 10,
        border: "1px solid hsl(var(--border))",
        borderLeft: `3px solid ${DIR_COLOR[dir]}`,
        padding: "10px 12px",
        background: isDark ? "hsl(var(--card))" : "hsl(var(--background))",
      }}
    >
      {/* Axis label */}
      <p style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
        textTransform: "uppercase", color: "hsl(var(--muted-foreground))",
        fontFamily: "var(--font-sans)", marginBottom: 6,
      }}>
        {axisName}
      </p>

      {/* Arrow + score + delta */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{
          fontSize: 17, fontWeight: 700, color: DIR_COLOR[dir],
          lineHeight: 1, fontFamily: "var(--font-sans)",
        }}>
          {DIR_ARROW[dir]}
        </span>
        <span style={{
          fontSize: 11, fontFamily: "var(--font-numeric)",
          color: isDark ? "rgba(245,240,232,0.65)" : "rgba(26,26,46,0.6)",
        }}>
          {prev} → {curr}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: "1px 6px", borderRadius: 8,
          color: DIR_COLOR[dir], background: DIR_BG[dir],
          fontFamily: "var(--font-numeric)",
        }}>
          {deltaBadge}
        </span>
      </div>

      {/* Message */}
      <p style={{
        fontSize: 10, lineHeight: 1.5,
        color: "hsl(var(--muted-foreground))",
        fontFamily: "var(--font-sans)",
      }}>
        {change.message[lang]}
      </p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DiagnosisComparisonView({
  result, comparison, engineVersionMismatch, previousDiagnosisAgeDays,
}: DiagnosisComparisonViewProps) {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const lang = language as Lang;

  const { improvedCount, stableCount, worsenedCount, summary } = comparison.overallProgress;
  const majorityWorsened = worsenedCount > improvedCount && worsenedCount > stableCount;

  const sortedAxes = [...AXIS_KEYS].sort(
    (a, b) => SORT_ORDER[comparison.changes[a].direction] - SORT_ORDER[comparison.changes[b].direction],
  );

  const prevDateLabel = fmtDate(comparison.previous.date, lang);
  const currDateLabel = fmtDate(comparison.current.date, lang);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Eyebrow */}
      <p className="slide-eyebrow mb-3" style={{ letterSpacing: "0.14em" }}>
        {lang === "ko" ? "재분석 비교" : lang === "de" ? "Re-Analyse Vergleich" : "Re-Analysis Comparison"}
      </p>

      {/* ── Section C: Overall progress banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          borderRadius: 14, padding: "14px 18px", marginBottom: 16,
          background: isDark ? "hsl(var(--card))" : "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* Count pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <CountPill count={improvedCount} dir="improved" lang={lang} />
          <CountPill count={stableCount} dir="stable" lang={lang} />
          <CountPill count={worsenedCount} dir="worsened" lang={lang} />
        </div>

        {/* Summary text */}
        <p style={{
          fontSize: 13, lineHeight: 1.55, fontFamily: "var(--font-sans)",
          color: isDark ? "rgba(245,240,232,0.75)" : "rgba(26,26,46,0.72)",
          marginBottom: majorityWorsened ? 10 : 0,
        }}>
          {summary[lang]}
        </p>

        {/* CTA to /lab when majority worsened */}
        {majorityWorsened && (
          <Link
            to="/lab"
            style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textDecoration: "none",
              padding: "6px 14px", borderRadius: 20,
              color: "hsl(var(--accent-gold))",
              border: "1px solid hsl(var(--accent-gold) / 0.4)",
            }}
          >
            {lang === "ko" ? "루틴 조정하기 →" : lang === "de" ? "Routine anpassen →" : "Adjust my routine →"}
          </Link>
        )}
      </motion.div>

      {/* Engine version mismatch note */}
      {engineVersionMismatch && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 11, lineHeight: 1.5, fontFamily: "var(--font-sans)",
            color: "hsl(var(--muted-foreground))",
            padding: "8px 12px", borderRadius: 8, marginBottom: 10,
            background: "hsl(var(--muted))",
          }}
        >
          ⓘ{" "}
          {lang === "ko"
            ? "분석 알고리즘이 업데이트되었습니다. 비교 결과에 방법론 변경이 반영될 수 있습니다."
            : lang === "de"
              ? "Der Scoring-Algorithmus wurde zwischen den Analysen aktualisiert. Der Vergleich kann Methodenänderungen widerspiegeln."
              : "The scoring algorithm was updated between analyses. Comparison may reflect methodology changes."}
        </motion.p>
      )}

      {/* >90-day staleness note */}
      {(previousDiagnosisAgeDays ?? 0) >= 90 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: 11, lineHeight: 1.5, fontFamily: "var(--font-sans)",
            color: "hsl(var(--muted-foreground))",
            padding: "8px 12px", borderRadius: 8, marginBottom: 10,
            background: "hsl(var(--muted))",
          }}
        >
          ⓘ{" "}
          {lang === "ko"
            ? "마지막 분석이 3개월 이상 전입니다. 생활 습관 변화가 비교 정확도에 영향을 줄 수 있습니다."
            : lang === "de"
              ? "Ihre letzte Analyse liegt über 3 Monate zurück. Erhebliche Lebensstiländerungen können die Vergleichsgenauigkeit beeinflussen."
              : "Your last analysis was over 3 months ago. Significant lifestyle changes may affect comparison accuracy."}
        </motion.p>
      )}

      {/* ── Section A: Dual radar chart ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 8 }}
      >
        <RadarChart
          result={result}
          comparisonScores={comparison.previous.scores}
          comparisonDate={comparison.previous.date}
          currentDate={comparison.current.date}
        />

        {/* Comparison legend */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 20, marginTop: 8, marginBottom: 20,
          fontSize: 10, fontFamily: "var(--font-sans)",
        }}>
          {/* Previous — gray dashed */}
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(140,150,165,0.9)" }}>
            <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden="true">
              <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(150,150,150,0.65)" strokeWidth="1.5" strokeDasharray="5,4" />
            </svg>
            {lang === "ko" ? `이전 (${prevDateLabel})` : lang === "de" ? `Früher (${prevDateLabel})` : `Previous (${prevDateLabel})`}
          </span>
          {/* Current — gold solid */}
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "hsl(var(--accent-gold))" }}>
            <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden="true">
              <line x1="0" y1="4" x2="20" y2="4" stroke="hsl(var(--accent-gold))" strokeWidth="1.5" />
            </svg>
            {lang === "ko" ? `현재 (${currDateLabel})` : lang === "de" ? `Aktuell (${currDateLabel})` : `Current (${currDateLabel})`}
          </span>
        </div>
      </motion.div>

      {/* ── Section B: Per-axis change cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
        gap: 8,
      }}>
        {sortedAxes.map((axis, idx) => (
          <AxisChangeCard
            key={axis}
            axis={axis}
            comparison={comparison}
            lang={lang}
            isDark={isDark}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}
