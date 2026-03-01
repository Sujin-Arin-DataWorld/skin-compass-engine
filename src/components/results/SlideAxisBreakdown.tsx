import { useMemo } from "react";
import { motion } from "framer-motion";
import { DiagnosisResult, AXIS_LABELS, AXIS_KEYS, AxisKey } from "@/engine/types";

const severityColor = (score: number) => {
  if (score <= 20) return "hsl(var(--severity-clear))";
  if (score <= 45) return "hsl(var(--severity-mild))";
  if (score <= 70) return "hsl(var(--severity-moderate))";
  return "hsl(var(--severity-severe))";
};

const AXIS_INTERPRETATIONS: Partial<Record<AxisKey, (s: number) => string>> = {
  bar: (s) => s > 60 ? "Your skin barrier is significantly compromised — products penetrate unevenly." : s > 30 ? "Mild barrier weakness — minor sensitivity likely." : "Your barrier is healthy and intact.",
  acne: (s) => s > 60 ? "Active breakout pattern — needs targeted antibacterial care." : s > 30 ? "Occasional breakouts, likely triggered by sebum or stress." : "Minimal acne concern.",
  sen: (s) => s > 60 ? "High reactivity — many actives will cause stinging." : s > 30 ? "Moderate sensitivity — patch test new products." : "Good tolerance for actives.",
  hyd: (s) => s > 60 ? "Significant dehydration — skin may feel tight despite oiliness." : s > 30 ? "Mild dehydration." : "Well-hydrated skin.",
  aging: (s) => s > 60 ? "Accelerated collagen decline — retinal + peptide protocol recommended." : s > 30 ? "Early signs of aging — preventive care advised." : "Minimal aging concern.",
  seb: (s) => s > 60 ? "Sebum overproduction — contributing to pore congestion and shine." : s > 30 ? "Moderate sebum levels." : "Sebum balanced.",
  pigment: (s) => s > 60 ? "Melanocyte hyperactivation — UV protection critical." : s > 30 ? "Some uneven tone present." : "Even skin tone.",
  texture: (s) => s > 60 ? "Surface irregularity — exfoliation and pore refinement needed." : s > 30 ? "Mild texture concerns." : "Smooth surface texture.",
  ox: (s) => s > 60 ? "High oxidative stress — antioxidant protocol essential." : s > 30 ? "Moderate environmental damage." : "Low oxidative burden.",
};

// SVG radar chart
function RadarChart({ result }: { result: DiagnosisResult }) {
  const axes = result.radar_chart_data;
  const n = axes.length;
  const SIZE = 220, CENTER = SIZE / 2, RADIUS = 85;

  const points = axes.map((a, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (a.score / 100) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  });
  const poly = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto">
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
        fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />
      {axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = RADIUS + 18;
        return (
          <text
            key={a.axis} x={CENTER + r * Math.cos(angle)} y={CENTER + r * Math.sin(angle)}
            textAnchor="middle" dominantBaseline="central"
            className="fill-muted-foreground" fontSize={8} fontFamily="var(--font-body)"
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

  const topInterpretations = sorted.slice(0, 3).map((axis) => ({
    axis,
    text: AXIS_INTERPRETATIONS[axis]?.(result.axis_scores[axis]) ?? "",
  })).filter((i) => i.text);

  return (
    <div className="flex flex-1 flex-col px-6 py-12 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Your Skin Profile
        </motion.p>

        <div className="mt-6 grid gap-8 md:grid-cols-2 items-start">
          {/* Radar */}
          <RadarChart result={result} />

          {/* Score bars */}
          <div className="space-y-3">
            {sorted.map((axis, i) => {
              const score = Math.round(result.axis_scores[axis]);
              return (
                <motion.div
                  key={axis}
                  className="space-y-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{AXIS_LABELS[axis]}</span>
                    <span className="font-medium" style={{ color: severityColor(score) }}>{score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: severityColor(score) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Interpretations */}
        {topInterpretations.length > 0 && (
          <motion.div
            className="mt-8 space-y-3 border-t border-border pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">What this means</p>
            {topInterpretations.map((i) => (
              <p key={i.axis} className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{AXIS_LABELS[i.axis]}:</span>{" "}
                {i.text}
              </p>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SlideAxisBreakdown;
