import { useMemo } from "react";
import { motion } from "framer-motion";
import { useI18nStore } from "@/store/i18nStore";
import { DiagnosisResult, AXIS_LABELS, AXIS_LABELS_DE, AXIS_KEYS, AxisKey } from "@/engine/types";
import RadarChart from "@/components/diagnosis/RadarChart";

function getBarColor(score: number): string {
  if (score >= 70) return "hsl(var(--severity-severe))";
  if (score >= 45) return "hsl(var(--severity-moderate))";
  if (score >= 20) return "hsl(var(--severity-mild))";
  return "hsl(var(--severity-clear))";
}

const AXIS_INTERPRETATIONS: Partial<Record<AxisKey, { en: (s: number) => string, de: (s: number) => string }>> = {
  acne: {
    en: (s) => s >= 75 ? "Cyclical, likely hormonally driven" : s >= 50 ? "Moderate, inflammatory pattern" : "Occasional, surface-level",
    de: (s) => s >= 75 ? "Zyklisch, wahrscheinlich hormonell bedingt" : s >= 50 ? "Mäßiges, entzündliches Muster" : "Gelegentlich, oberflächlich"
  },
  seb: {
    en: (s) => s >= 75 ? "Rapid sebum return, T-zone dominant" : s >= 50 ? "Balanced but reactive to humidity" : "Controlled",
    de: (s) => s >= 75 ? "Schnelle Talgproduktion, T-Zonen-dominant" : s >= 50 ? "Ausgeglichen, reagiert auf Feuchtigkeit" : "Kontrolliert"
  },
  hyd: {
    en: (s) => s >= 75 ? "Compromised moisture barrier (TEWL risk)" : s >= 50 ? "Suboptimal retention" : "Adequate",
    de: (s) => s >= 75 ? "Geschädigte Feuchtigkeitsbarriere (TEWL-Risiko)" : s >= 50 ? "Suboptimale Speicherung" : "Ausreichend"
  },
  sen: {
    en: (s) => s >= 75 ? "High reactivity — multiple trigger exposure" : s >= 50 ? "Moderate — flush and thermal reactivity" : "Manageable",
    de: (s) => s >= 75 ? "Hohe Reaktivität — reagiert auf multiple Trigger" : s >= 50 ? "Mäßig — Flush und thermische Reaktivität" : "Handhabbar"
  },
  pigment: {
    en: (s) => s >= 75 ? "UV-responsive, melasma-type deepening" : s >= 50 ? "Post-inflammatory marks, localized" : "Mild",
    de: (s) => s >= 75 ? "UV-reaktiv, Melasma-artige Verdunkelung" : s >= 50 ? "Post-inflammatorische Spuren, lokalisiert" : "Mild"
  },
  texture: {
    en: (s) => s >= 75 ? "Dual mechanism — pores + surface roughness" : s >= 50 ? "Congestion-dominant" : "Minor irregularity",
    de: (s) => s >= 75 ? "Dualer Mechanismus — Poren + Oberflächenrauheit" : s >= 50 ? "Von Verstopfung dominiert" : "Geringe Unregelmäßigkeit"
  },
  aging: {
    en: (s) => s >= 75 ? "Recoil delay across multiple contour zones" : s >= 50 ? "Early-stage firmness reduction" : "Within normal range",
    de: (s) => s >= 75 ? "Rückstellverzögerung an mehreren Konturenzonen" : s >= 50 ? "Frühstadium der Festigkeitsminderung" : "Im Normalbereich"
  },
  bar: {
    en: (s) => s >= 75 ? "Barrier compromise triad present" : s >= 50 ? "Stress pattern, recovery delayed" : "Mild disruption",
    de: (s) => s >= 75 ? "Trias einer Barrierebeeinträchtigung vorhanden" : s >= 50 ? "Stressmuster, Erholung verzögert" : "Leichte Störung"
  },
  ox: {
    en: (s) => s >= 75 ? "High oxidative stress — antioxidant protocol essential" : s >= 50 ? "Moderate environmental damage" : "Low oxidative burden",
    de: (s) => s >= 75 ? "Hoher oxidativer Stress — Antioxidantien zwingend" : s >= 50 ? "Mäßige Umweltschäden" : "Geringe oxidative Belastung"
  },
};

const CRITICAL_MESSAGES: Partial<Record<AxisKey, { en: string, de: string }>> = {
  acne: { en: "Inflammation control must come before any actives.", de: "Entzündungskontrolle muss vor anderen Wirkstoffen kommen." },
  seb: { en: "Sebum regulation is the gateway to texture and pore improvement.", de: "Talgregulierung ist das Tor zur Verbesserung von Textur und Poren." },
  hyd: { en: "Barrier hydration is Phase 1 before any targeted treatment.", de: "Barriere-Hydratation ist Phase 1 vor jeder gezielten Behandlung." },
  sen: { en: "Barrier calming must precede all active ingredients.", de: "Barriere-Beruhigung muss vor der starken Wirkstofftherapie stehen." },
  pigment: { en: "SPF protocol activation is the highest leverage action.", de: "Aktivierung des SPF-Protokolls ist die wirkungsvollste Maßnahme." },
  texture: { en: "Gentle exfoliation cadence is the critical variable.", de: "Regelmäßiges, schonendes Peeling ist die entscheidende Variable." },
  aging: { en: "Collagen-supporting actives unlock in Phase 4.", de: "Kollagenunterstützende Wirkstoffe entfalten Phase 4." },
  bar: { en: "Barrier repair must be established before adding any new actives.", de: "Die Barrierereparatur muss aufgebaut sein, bevor neue Wirkstoffe hinzugefügt werden." },
  ox: { en: "Antioxidant integration is the first line of defence.", de: "Antioxidantien-Integration ist die erste Verteidigungslinie." },
};



interface Props {
  result: DiagnosisResult;
}

const SlideAxisBreakdown = ({ result }: Props) => {
  const { language } = useI18nStore();
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
          {language === "de" ? "Klinische Analyse" : "Clinical Analysis"}
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
          {language === "de" ? "Ihr Hautvektor" : "Your skin vector"}
        </motion.h2>
        <motion.p
          className="slide-body mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {language === "de"
            ? "Keine zwei Vektoren sind identisch. Dies ist genau Ihrer."
            : "No two vectors are identical. This is precisely yours."}
        </motion.p>

        {/* Radar + bars grid */}
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <RadarChart result={result} highlightAxis={topAxis} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sorted.map((axis, i) => {
              const score = Math.round(result.axis_scores[axis]);
              const isTop = i === 0;
              const interpretation = AXIS_INTERPRETATIONS[axis]?.[language]?.(score) ?? "";
              const labels = language === "de" ? AXIS_LABELS_DE : AXIS_LABELS;

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
                      {labels[axis]}
                      {isTop && (
                        <span style={{ fontSize: "0.625rem", marginLeft: "0.4rem", opacity: 0.7 }}>
                          — {language === "de" ? "Primär" : "Primary"}
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
            {language === "de" ? "Protokoll-Priorität" : "Protocol Priority"}
          </p>
          <p className="slide-body" style={{ lineHeight: 1.5 }}>
            {CRITICAL_MESSAGES[topAxis]?.[language] ?? (
              language === "de"
                ? "Ihr Protokoll ist nach klinischer Priorität geordnet, beginnend mit Ihrer am höchsten bewerteten Achse."
                : "Your protocol is ordered by clinical priority, starting with your highest-scoring axis."
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SlideAxisBreakdown;
