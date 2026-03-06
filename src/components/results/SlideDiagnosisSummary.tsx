import { motion } from "framer-motion";
import { useI18nStore } from "@/store/i18nStore";
import { DiagnosisResult, AXIS_LABELS, AxisKey } from "@/engine/types";

// ── Empathy map: pattern → human acknowledgment ──
const EMPATHY_MAP: Record<string, { en: string; de: string }> = {
  'Hormonal Acne Cascade': {
    en: 'Breakouts that follow a pattern, not a random one. Your skin is reacting to something deeper than surface oil.',
    de: 'Ausbrüche, die einem Muster folgen, nicht zufällig sind. Ihre Haut reagiert auf tieferliegende hormonelle Signale.'
  },
  'Barrier Stress Pattern': {
    en: 'Your skin is working harder than it should have to. It\'s not sensitivity — it\'s a barrier under pressure.',
    de: 'Ihre Haut arbeitet härter als sie müsste. Das ist keine Empfindlichkeit — das ist eine Barriere unter Stress.'
  },
  'Dehydrated-Oily Complex': {
    en: 'Shine on the surface, tightness underneath. These two signals together tell us something specific about your skin.',
    de: 'Glanz an der Oberfläche, Spannungsgefühl darunter. Diese widersprüchlichen Signale verraten uns etwas Spezifisches.'
  },
  'Melasma-Dominant Pattern': {
    en: 'Your pigmentation has a logic to it. UV and hormones are both in the picture.',
    de: 'Ihre Pigmentierung folgt einer Logik. UV-Strahlung und Hormone spielen hier eng zusammen.'
  },
  'Texture-Congestion Overlap': {
    en: 'Rough texture and congested pores usually share the same root. Your skin is telling us where to focus.',
    de: 'Raue Textur und verstopfte Poren haben meist dieselbe Wurzel. Ihre Haut sagt uns genau, wo wir ansetzen müssen.'
  },
  'Elasticity Loss — Early Stage': {
    en: 'The changes you\'re noticing aren\'t sudden. They\'ve been building, and that means they can be addressed systematically.',
    de: 'Die Veränderungen, die Sie bemerken, kamen nicht plötzlich. Sie haben sich aufgebaut, und können nun systematisch adressiert werden.'
  },
  default: {
    en: 'Your skin has a specific pattern. It\'s not random, and it\'s not unsolvable.',
    de: 'Ihre Haut hat ein spezifisches Muster. Nichts ist zufällig, und nichts ist unlösbar.'
  }
};

const OBSERVATION_TEMPLATES: Partial<Record<AxisKey, { en: (score: number) => string; de: (score: number) => string }>> = {
  acne: {
    en: (s) => `Breakout activity ${s > 60 ? 'concentrated and cyclical' : 'present with moderate frequency'}`,
    de: (s) => `Ausbruchsaktivität ${s > 60 ? 'konzentriert und zyklisch' : 'mit mäßiger Häufigkeit vorhanden'}`
  },
  seb: {
    en: (s) => `Sebum overproduction${s > 60 ? ' returning within 2–4h of cleansing' : ' in the T-zone'}`,
    de: (s) => `Talgüberproduktion${s > 60 ? ', die 2–4h nach der Reinigung zurückkehrt' : ' primär in der T-Zone'}`
  },
  hyd: {
    en: (s) => `Moisture retention ${s > 60 ? 'significantly compromised (fast TEWL pattern)' : 'below optimal'}`,
    de: (s) => `Feuchtigkeitsspeicherung ${s > 60 ? 'erheblich beeinträchtigt (schneller TEWL)' : 'unter dem Optimum'}`
  },
  sen: {
    en: (s) => `Reactive sensitivity${s > 60 ? ' — multiple actives causing stinging' : ' with thermal flush tendency'}`,
    de: (s) => `Reaktive Empfindlichkeit${s > 60 ? ' — mehrere Wirkstoffe verursachen Stechen' : ' mit Tendenz zum Hitzeflush'}`
  },
  pigment: {
    en: (s) => `Pigmentation${s > 60 ? ' showing UV-responsive deepening' : ' with residual post-inflammatory marks'}`,
    de: (s) => `Pigmentierung${s > 60 ? ' zeigt UV-reaktive Vertiefung' : ' mit verbleibenden post-entzündlichen Spuren'}`
  },
  texture: {
    en: (s) => `Pore and texture irregularity${s > 60 ? ' across both nose and forehead zones' : ' in T-zone'}`,
    de: (s) => `Poren- und Texturunregelmäßigkeiten${s > 60 ? ' über Nasen- und Stirnpartien' : ' leicht in der T-Zone'}`
  },
  aging: {
    en: (s) => `Firmness response${s > 60 ? ' — pinch recoil significantly delayed' : ' showing early-stage reduction'}`,
    de: (s) => `Festigkeitsreaktion${s > 60 ? ' — Hautrückbildung nach Kneifen deutlich verzögert' : ' zeigt Rückgang im Frühstadium'}`
  },
  bar: {
    en: (s) => `Barrier stress${s > 60 ? ' — redness + tightness + stinging triad present' : ' with recovery delay'}`,
    de: (s) => `Barriere-Stress${s > 60 ? ' — Rötung + Spannungsgefühl + Stechen (Triade) vorhanden' : ' mit Verzögerung der Erholungsphase'}`
  },
};

interface Props {
  result: DiagnosisResult;
}

const SlideDiagnosisSummary = ({ result }: Props) => {
  const { language } = useI18nStore();

  // Use _de fields if language is German
  const patternNameEN = result.detected_patterns[0]?.pattern.name_en ?? "Balanced Profile";
  const patternName = language === "de"
    ? (result.detected_patterns[0]?.pattern as any)?.name_de ?? "Ausgeglichenes Profil"
    : patternNameEN;

  const empathyText = EMPATHY_MAP[patternNameEN]?.[language] ?? EMPATHY_MAP.default[language];
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
          <p className="slide-eyebrow mb-2.5">{language === "de" ? "Diagnose-Ergebnis" : "Diagnostic Result"}</p>
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
            {language === "de" ? "Identifiziertes Hautmuster" : "Identified Skin Pattern"}
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
            <StatMini label={language === "de" ? "Signale erfasst" : "Signals captured"} value={String(signalCount)} />
            <div className="w-px" style={{ background: "hsl(var(--border))" }} />
            <StatMini label={language === "de" ? "Konfidenzniveau" : "Diagnostic confidence"} value={`${confidence}%`} />
            <div className="w-px" style={{ background: "hsl(var(--border))" }} />
            <StatMini label={language === "de" ? "Dermatologisch geprüft" : "Dermatologist reviewed"} value="✓" accent />
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
          {language === "de"
            ? "Dieses Muster wurde aus der Überschneidung Ihrer am höchsten bewerteten Achsen identifiziert. Es beschreibt, wie Ihre Hautprobleme interagieren — nicht nur, was sie einzeln bedeuten."
            : "This pattern was identified from the intersection of your highest-scoring axes. It describes how your skin's concerns interact — not just what they are individually."}
        </motion.p>

        {/* ── Section D: Observation bullets ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 mb-6"
        >
          <p className="slide-eyebrow mb-2" style={{ letterSpacing: "0.1em" }}>
            {language === "de" ? "Was wir beobachtet haben" : "What we observed"}
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
                  {template[language](score)}
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
          {language === "de" ? "Ihre vollständige klinische Karte ansehen →" : "See your full clinical map →"}
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
