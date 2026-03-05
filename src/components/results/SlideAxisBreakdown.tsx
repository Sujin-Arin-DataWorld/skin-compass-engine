import { useMemo } from "react";
import { motion } from "framer-motion";
import { DiagnosisResult, AXIS_LABELS, AXIS_KEYS, AxisKey } from "@/engine/types";

function getBarColor(score: number): string {
  if (score >= 70) return "hsl(var(--severity-severe))";
  if (score >= 45) return "hsl(var(--severity-moderate))";
  if (score >= 20) return "hsl(var(--severity-mild))";
  return "hsl(var(--severity-clear))";
}

const AXIS_INTERPRETATIONS: Partial<Record<AxisKey, (s: number) => string>> = {
  acne: (s) => s >= 75 ? "Cyclical, likely hormonally driven" : s >= 50 ? "Moderate, inflammatory pattern" : "Occasional, surface-level",
  seb: (s) => s >= 75 ? "Rapid sebum return, T-zone dominant" : s >= 50 ? "Balanced but reactive to humidity" : "Controlled",
  hyd: (s) => s >= 75 ? "Compromised moisture barrier (TEWL risk)" : s >= 50 ? "Suboptimal retention" : "Adequate",
  sen: (s) => s >= 75 ? "High reactivity — multiple trigger exposure" : s >= 50 ? "Moderate — flush and thermal reactivity" : "Manageable",
  pigment: (s) => s >= 75 ? "UV-responsive, melasma-type deepening" : s >= 50 ? "Post-inflammatory marks, localized" : "Mild",
  texture: (s) => s >= 75 ? "Dual mechanism — pores + surface roughness" : s >= 50 ? "Congestion-dominant" : "Minor irregularity",
  aging: (s) => s >= 75 ? "Recoil delay across multiple contour zones" : s >= 50 ? "Early-stage firmness reduction" : "Within normal range",
  bar: (s) => s >= 75 ? "Barrier compromise triad present" : s >= 50 ? "Stress pattern, recovery delayed" : "Mild disruption",
  ox: (s) => s >= 75 ? "High oxidative stress — antioxidant protocol essential" : s >= 50 ? "Moderate environmental damage" : "Low oxidative burden",
};

const CRITICAL_MESSAGES: Partial<Record<AxisKey, string>> = {
  acne: "Inflammation control must come before any actives.",
  seb: "Sebum regulation is the gateway to texture and pore improvement.",
  hyd: "Barrier hydration is Phase 1 before any targeted treatment.",
  sen: "Barrier calming must precede all active ingredients.",
  pigment: "SPF protocol activation is the highest leverage action.",
  texture: "Gentle exfoliation cadence is the critical variable.",
  aging: "Collagen-supporting actives unlock in Phase 4.",
  bar: "Barrier repair must be established before adding any new actives.",
  ox: "Antioxidant integration is the first line of defence.",
};

// SVG radar chart — always 10 axes
function RadarChart({ result, highlightAxis }: { result: DiagnosisResult; highlightAxis: AxisKey }) {
  // Build full 10-axis data from AXIS_KEYS
  const axes = AXIS_KEYS.map((key) => ({
    axis: AXIS_LABELS[key],
    score: Math.round(result.axis_scores[key] ?? 0),
    key,
  }));
  const n = axes.length;
  const VIEWBOX = 340, CENTER = VIEWBOX / 2, RADIUS = 100;

  const points = axes.map((a, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (a.score / 100) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  });
  const poly = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="mx-auto max-w-[320px]">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: n }, (_, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const rad = r * RADIUS;
            return `${CENTER + rad * Math.cos(angle)},${CENTER + rad * Math.sin(angle)}`;
          }).join(" ")}
          fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={r === 1 ? 0.4 : 0.15}
        />
      ))}
      {points.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const end = { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
        return <line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.2} />;
      })}
      <motion.polygon
        points={poly}
        fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />
      {axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = RADIUS + 30;
        return (
          <text
            key={a.key} x={CENTER + r * Math.cos(angle)} y={CENTER + r * Math.sin(angle)}
            textAnchor="middle" dominantBaseline="central"
            style={{
              fontSize: "10px",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: a.key === highlightAxis ? 700 : 500,
              fill: a.key === highlightAxis ? "hsl(var(--primary))" : "hsl(var(--foreground))",
              opacity: 0.85,
            }}
          >
            {a.axis}
          </text>
        );
      })}
    </svg>
  );
}

interface Props {
  result: DiagnosisResult;
}

const SlideAxisBreakdown = ({ result }: Props) => {
  const sorted = useMemo(
    () => [...AXIS_KEYS].sort((a, b) => result.axis_scores[b] - result.axis_scores[a]),
    [result]
  );
  const topAxis = sorted[0];

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">
        {/* Eyebrow */}
        <motion.p className="slide-eyebrow mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Clinical Analysis
        </motion.p>

        {/* Headline */}
        <motion.h2
          className="font-display"
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "hsl(var(--foreground))",
            marginBottom: "0.5rem",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          Your skin vector
        </motion.h2>
        <motion.p
          className="slide-body mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          No two vectors are identical. This is precisely yours.
        </motion.p>

        {/* Radar + bars grid */}
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <RadarChart result={result} highlightAxis={topAxis} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sorted.map((axis, i) => {
              const score = Math.round(result.axis_scores[axis]);
              const isTop = i === 0;
              const interpretation = AXIS_INTERPRETATIONS[axis]?.(score) ?? "";

              return (
                <motion.div
                  key={axis}
                  className={`rounded-xl p-3 ${isTop ? "border md:col-span-2" : ""}`}
                  style={isTop ? {
                    borderColor: "hsl(var(--primary) / 0.4)",
                    background: "hsl(var(--primary) / 0.04)",
                  } : {}}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <p style={{
                      fontSize: "0.8125rem",
                      fontWeight: isTop ? 700 : 500,
                      color: isTop ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                    }}>
                      {AXIS_LABELS[axis]}
                      {isTop && (
                        <span style={{ fontSize: "0.625rem", marginLeft: "0.4rem", opacity: 0.7 }}>
                          — Primary
                        </span>
                      )}
                    </p>
                    <span
                      className="font-display"
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: isTop ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      }}
                    >
                      {score}
                    </span>
                  </div>
                  <div
                    className="rounded-full overflow-hidden mb-1"
                    style={{ height: "3px", background: "hsl(var(--border))" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: isTop ? "hsl(var(--primary))" : "hsl(var(--foreground-hint))",
                        opacity: isTop ? 1 : 0.5,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.03 }}
                    />
                  </div>
                  {interpretation && (
                    <p style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--foreground-hint))",
                      lineHeight: 1.4,
                    }}>
                      {interpretation}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Critical focus callout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl border p-4"
          style={{
            borderColor: "hsl(var(--primary) / 0.25)",
            background: "hsl(var(--primary) / 0.05)",
          }}
        >
          <p className="slide-eyebrow mb-1" style={{ color: "hsl(var(--primary))" }}>
            Protocol Priority
          </p>
          <p className="slide-body" style={{ lineHeight: 1.5 }}>
            {CRITICAL_MESSAGES[topAxis] ?? "Your protocol is ordered by clinical priority, starting with your highest-scoring axis."}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SlideAxisBreakdown;
