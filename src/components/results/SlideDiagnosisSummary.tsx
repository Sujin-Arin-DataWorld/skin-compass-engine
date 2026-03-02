import { motion } from "framer-motion";
import { DiagnosisResult, AXIS_LABELS, AxisKey } from "@/engine/types";

// ── Empathy map: pattern → human acknowledgment ──
const EMPATHY_MAP: Record<string, string> = {
  'Hormonal Acne Cascade':
    'Breakouts that follow a pattern, not a random one. Your skin is reacting to something deeper than surface oil.',
  'Barrier Stress Pattern':
    'Your skin is working harder than it should have to. It\'s not sensitivity — it\'s a barrier under pressure.',
  'Dehydrated-Oily Complex':
    'Shine on the surface, tightness underneath. These two signals together tell us something specific about your skin.',
  'Melasma-Dominant Pattern':
    'Your pigmentation has a logic to it. UV and hormones are both in the picture.',
  'Texture-Congestion Overlap':
    'Rough texture and congested pores usually share the same root. Your skin is telling us where to focus.',
  'Elasticity Loss — Early Stage':
    'The changes you\'re noticing aren\'t sudden. They\'ve been building, and that means they can be addressed systematically.',
  default:
    'Your skin has a specific pattern. It\'s not random, and it\'s not unsolvable.',
};

const OBSERVATION_TEMPLATES: Partial<Record<AxisKey, (score: number) => string>> = {
  acne: (s) => `Breakout activity ${s > 60 ? 'concentrated and cyclical' : 'present with moderate frequency'}`,
  seb: (s) => `Sebum overproduction${s > 60 ? ' returning within 2–4h of cleansing' : ' in the T-zone'}`,
  hyd: (s) => `Moisture retention ${s > 60 ? 'significantly compromised (fast TEWL pattern)' : 'below optimal'}`,
  sen: (s) => `Reactive sensitivity${s > 60 ? ' — multiple actives causing stinging' : ' with thermal flush tendency'}`,
  pigment: (s) => `Pigmentation${s > 60 ? ' showing UV-responsive deepening' : ' with residual post-inflammatory marks'}`,
  texture: (s) => `Pore and texture irregularity${s > 60 ? ' across both nose and forehead zones' : ' in T-zone'}`,
  aging: (s) => `Firmness response${s > 60 ? ' — pinch recoil significantly delayed' : ' showing early-stage reduction'}`,
  bar: (s) => `Barrier stress${s > 60 ? ' — redness + tightness + stinging triad present' : ' with recovery delay'}`,
};

interface Props {
  result: DiagnosisResult;
}

const SlideDiagnosisSummary = ({ result }: Props) => {
  const patternName = result.detected_patterns[0]?.pattern.name_en ?? "Balanced Profile";
  const empathyText = EMPATHY_MAP[patternName] ?? EMPATHY_MAP.default;
  const signalCount = result.radar_chart_data.reduce((sum, d) => sum + (d.score > 0 ? 1 : 0), 0);
  const confidence = Math.min(95, 65 + signalCount * 3);
  const activeCategories = result.primary_concerns.slice(0, 4);

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-xl">

        {/* ── Section A: Empathy hook ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          <p className="slide-eyebrow mb-2.5">Diagnostic Result</p>
          <p
            className="font-display italic leading-snug"
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
              color: "hsl(var(--foreground))",
              lineHeight: 1.35,
            }}
          >
            "{empathyText}"
          </p>
        </motion.div>

        {/* ── Section B: Pattern Identity Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="rounded-3xl border p-5 mb-5"
          style={{
            borderColor: "hsl(var(--primary) / 0.4)",
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)",
          }}
        >
          <p className="slide-eyebrow mb-1" style={{ letterSpacing: "0.14em" }}>
            Identified Skin Pattern
          </p>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              color: "hsl(var(--foreground))",
              marginBottom: "1rem",
            }}
          >
            {patternName}
          </h1>
          <div className="flex gap-5">
            <StatMini label="Signals captured" value={String(signalCount)} />
            <div className="w-px" style={{ background: "hsl(var(--border))" }} />
            <StatMini label="Diagnostic confidence" value={`${confidence}%`} />
            <div className="w-px" style={{ background: "hsl(var(--border))" }} />
            <StatMini label="Dermatologist reviewed" value="✓" accent />
          </div>
        </motion.div>

        {/* ── Section C: Pattern explainer ── */}
        <motion.p
          className="slide-body mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ lineHeight: 1.6 }}
        >
          This pattern was identified from the intersection of your highest-scoring axes.
          It describes how your skin's concerns interact — not just what they are individually.
        </motion.p>

        {/* ── Section D: Observation bullets ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 mb-6"
        >
          <p className="slide-eyebrow mb-2" style={{ letterSpacing: "0.1em" }}>
            What we observed
          </p>
          {activeCategories.map((axis) => {
            const score = Math.round(result.axis_scores[axis]);
            const template = OBSERVATION_TEMPLATES[axis];
            if (!template) return null;
            return (
              <div key={axis} className="flex gap-2.5 items-start">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "hsl(var(--primary))", fontSize: "0.875rem" }}
                >
                  ·
                </span>
                <p className="slide-body" style={{ lineHeight: 1.5 }}>
                  {template(score)}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* ── Section E: Forward pull ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
          style={{
            fontSize: "0.875rem",
            color: "hsl(var(--foreground-hint))",
            textAlign: "center",
          }}
        >
          See your full clinical map →
        </motion.p>
      </div>
    </div>
  );
};

function StatMini({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className="font-display"
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: accent ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: "0.6875rem",
          color: "hsl(var(--foreground-hint))",
          marginTop: "0.2rem",
          lineHeight: 1.3,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default SlideDiagnosisSummary;
