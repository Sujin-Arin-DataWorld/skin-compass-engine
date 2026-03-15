import { motion } from "framer-motion";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";
import { DiagnosisResult, AXIS_LABELS, AXIS_LABELS_DE, RADAR_AXES, AxisKey } from "@/engine/types";

interface RadarChartProps {
    result: DiagnosisResult;
    highlightAxis?: AxisKey;
}

// Invert: low problem score → large polygon (healthy skin fills chart)
function invertForDisplay(rawScore: number): number {
    return 100 - rawScore;
}

// Scale to radar radius with guaranteed minimum so no axis collapses to center
function scaleForRadar(displayScore: number): number {
    const MIN = 0.15; // 15% minimum radius
    const MAX = 0.95; // 95% maximum radius
    return MIN + (displayScore / 100) * (MAX - MIN);
}

export default function RadarChart({ result, highlightAxis }: RadarChartProps) {
    const { language } = useI18nStore();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const activeLabels = language === "de" ? AXIS_LABELS_DE : AXIS_LABELS;

    const axes = RADAR_AXES.map((key) => ({
        axis: activeLabels[key],
        score: Math.round(result.axis_scores[key] ?? 0),
        key,
    }));
    const n = axes.length;
    const VIEWBOX = 340, CENTER = VIEWBOX / 2, RADIUS = 100;

    const points = axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const displayScore = invertForDisplay(a.score);
        const r = scaleForRadar(displayScore) * RADIUS;
        return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
    });
    const poly = points.map((p) => `${p.x},${p.y}`).join(" ");

    const POLYGON_FILL   = isDark ? "rgba(201,169,110,0.15)" : "rgba(122,162,115,0.15)";
    const POLYGON_STROKE = isDark ? "#c9a96e" : "#7A9E82";

    return (
        <div style={{ position: "relative" }}>
            <svg width="100%" viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="mx-auto max-w-[320px]">
                {/* Grid rings at 25%, 50%, 75%, 95% */}
                {[0.25, 0.5, 0.75, 0.95].map((r) => (
                    <polygon
                        key={r}
                        points={Array.from({ length: n }, (_, i) => {
                            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                            const rad = r * RADIUS;
                            return `${CENTER + rad * Math.cos(angle)},${CENTER + rad * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                        opacity={r === 0.95 ? 0.4 : 0.15}
                    />
                ))}
                {/* Axis spokes */}
                {points.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                    const end = { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
                    return <line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.2} />;
                })}
                {/* Data polygon */}
                <motion.polygon
                    points={poly}
                    fill={POLYGON_FILL}
                    stroke={POLYGON_STROKE}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                />
                {/* Dots at each axis point */}
                {points.map((p, i) => (
                    <circle
                        key={i} cx={p.x} cy={p.y} r={4}
                        fill={axes[i].key === highlightAxis ? POLYGON_STROKE : POLYGON_STROKE}
                        opacity={axes[i].key === highlightAxis ? 1 : 0.7}
                    />
                ))}
                {/* Axis labels */}
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
                                fill: a.key === highlightAxis ? POLYGON_STROKE : "hsl(var(--foreground))",
                                opacity: 0.85,
                            }}
                        >
                            {a.axis}
                        </text>
                    );
                })}
            </svg>
            {/* Legend */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                padding: "4px 16px 0",
                fontSize: 10, fontFamily: "'DM Sans', sans-serif",
                color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
            }}>
                <span>{language === "ko" ? "관리 필요" : language === "de" ? "Pflegebedarf" : "Needs care"}</span>
                <span>{language === "ko" ? "우수" : language === "de" ? "Hervorragend" : "Excellent"}</span>
            </div>
        </div>
    );
}
