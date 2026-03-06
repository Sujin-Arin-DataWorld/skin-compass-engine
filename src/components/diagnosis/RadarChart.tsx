import { motion } from "framer-motion";
import { useI18nStore } from "@/store/i18nStore";
import { DiagnosisResult, AXIS_LABELS, AXIS_LABELS_DE, AXIS_KEYS, AxisKey } from "@/engine/types";

interface RadarChartProps {
    result: DiagnosisResult;
    highlightAxis?: AxisKey;
}

export default function RadarChart({ result, highlightAxis }: RadarChartProps) {
    const { language } = useI18nStore();
    const activeLabels = language === "de" ? AXIS_LABELS_DE : AXIS_LABELS;

    const axes = AXIS_KEYS.map((key) => ({
        axis: activeLabels[key],
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
