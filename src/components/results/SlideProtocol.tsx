import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosisResult, Product, AXIS_LABELS, AXIS_LABELS_DE } from "@/engine/types";
import { useI18nStore } from "@/store/i18nStore";
import { Lock } from "lucide-react";

const PHASES = [
  {
    key: "Phase1", num: 1,
    name: { en: "Prepare", de: "Vorbereiten" },
    icon: "💧", am: true, pm: true,
    axisDriver: { en: "Sebum · Hydration", de: "Talg · Feuchtigkeit" },
    desc: { en: "Double cleanse and tone. Resets sebum balance and opens hydration pathways for full protocol absorption.", de: "Doppelreinigung und Toner. Reguliert den Talghaushalt und öffnet Feuchtigkeitswege für maximale Protokollaufnahme." },
    skipWarning: { en: "Skipping traps oxidative residue — Phase 2 absorption drops by 60%.", de: "Auslassen hinterlässt oxidative Rückstände — Phase 2 Absorption sinkt um 60%." },
  },
  {
    key: "Phase2", num: 2,
    name: { en: "Activate", de: "Aktivieren" },
    icon: "🌿", am: true, pm: true,
    axisDriver: { en: "Barrier", de: "Hautbarriere" },
    desc: { en: "Barrier essence layer. Reinforces the structural matrix and seals moisture channels before actives.", de: "Barriere-Essenz-Schicht. Stärkt die Strukturmatrix und versiegelt Feuchtigkeitskanäle vor den Wirkstoffen." },
    skipWarning: { en: "Barrier activation is the foundation — skipping collapses all downstream treatment phases.", de: "Barriere-Aktivierung ist das Fundament — Auslassen lässt alle nachfolgenden Phasen kollabieren." },
  },
  {
    key: "Phase3", num: 3,
    name: { en: "Treat", de: "Behandeln" },
    icon: "🔬", am: false, pm: true,
    axisDriver: { en: "Acne · Pigment · Aging · Oxidative", de: "Akne · Pigment · Alterung · Oxidativer Stress" },
    desc: { en: "The Formula. PM-only targeted actives addressing your highest-priority clinical vector.", de: "Die Formel. Nur-PM-Wirkstoffe, die Ihren dringendsten klinischen Vektor adressieren." },
    skipWarning: { en: "Actives on unprimed barrier trigger reactive flare-ups. Phase 2 must precede.", de: "Wirkstoffe auf unvorbereiteter Barriere lösen Reaktivität aus. Phase 2 muss vorangehen." },
  },
  {
    key: "Phase4", num: 4,
    name: { en: "Recover", de: "Regenerieren" },
    icon: "🛡", am: true, pm: true,
    axisDriver: { en: "Sensitivity · Aging", de: "Empfindlichkeit · Alterung" },
    desc: { en: "Moisturizer + repair matrix. Locks treatment gains and fuels overnight collagen synthesis.", de: "Feuchtigkeitscreme + Reparatur-Matrix. Sichert Behandlungserfolge und fördert die nächtliche Kollagensynthese." },
    skipWarning: { en: "Recovery seals treatment gains — skipping reduces cumulative protocol efficacy by ~40%.", de: "Regeneration sichert Behandlungserfolge — Auslassen reduziert die kumulierte Wirksamkeit um ~40%." },
  },
  {
    key: "Phase5", num: 5,
    name: { en: "Protect", de: "Schützen" },
    icon: "☀️", am: true, pm: false,
    axisDriver: { en: "Oxidative Stress · Makeup Stability", de: "Oxidativer Stress · Make-up Stabilität" },
    desc: { en: "Barrier shield + UV armor. Neutralizes oxidative attack and seals the protocol for lasting results.", de: "Barriere-Schutzschild + UV-Schutz. Neutralisiert oxidativen Stress und versiegelt das Protokoll für dauerhafte Ergebnisse." },
    skipWarning: { en: "Without SPF, all pigmentation and barrier gains are reversed by UV exposure daily.", de: "Ohne LSF werden alle Pigmentierungs- und Barriereerfolge täglich durch UV rückgängig gemacht." },
  },
];

const FLAG_MESSAGES: Record<string, { icon: string; title: { en: string; de: string }; body: { en: string; de: string } }> = {
  BARRIER_EMERGENCY: { icon: "⚠️", title: { en: "Barrier Emergency", de: "Barriere-Notfall" }, body: { en: "Pause all actives for 2 weeks. Focus on Phases 1, 2 & 4.", de: "Pausieren Sie alle Wirkstoffe für 2 Wochen. Fokus auf Phasen 1, 2 & 4." } },
  ACTIVE_INGREDIENT_PAUSE: { icon: "⚠️", title: { en: "Exfoliation Pause", de: "Peeling-Pause" }, body: { en: "Remove all exfoliants for 4 weeks.", de: "Alle Peelings für 4 Wochen absetzen." } },
  HORMONAL_ACNE_PROTOCOL: { icon: "ℹ️", title: { en: "Hormonal Pattern", de: "Hormonelles Muster" }, body: { en: "Track skin alongside your menstrual cycle.", de: "Beobachten Sie Ihre Haut parallel zu Ihrem Menstruationszyklus." } },
  DERMATOLOGIST_REFERRAL: { icon: "⚕️", title: { en: "Consultation Advised", de: "Konsultation Empfohlen" }, body: { en: "Acne severity may benefit from medical treatment.", de: "Die Schwere der Akne könnte von einer medizinischen Behandlung profitieren." } },
  DEVICE_RECOMMENDED: { icon: "💡", title: { en: "Device Recommended", de: "Gerät Empfohlen" }, body: { en: "EMS/LED device 3× weekly amplifies Phase 3 results.", de: "EMS/LED-Gerät 3× wöchentlich verstärkt die Ergebnisse von Phase 3." } },
};

interface Props {
  result: DiagnosisResult;
}

const SlideProtocol = ({ result }: Props) => {
  const { language } = useI18nStore();
  const [activePhase, setActivePhase] = useState(0);
  const phase = PHASES[activePhase];
  const products = result.product_bundle[phase.key] || [];
  const signalCount = result.radar_chart_data.filter((d) => d.score > 0).length;
  const confidence = Math.min(95, 65 + signalCount * 3);

  const barrierScore = Math.round(result?.axis_scores.bar ?? 0);
  const sensitivityScore = Math.round(result?.axis_scores.sen ?? 0);
  const isLocked = barrierScore < 50 || sensitivityScore > 70;

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">
        <motion.p
          className="slide-eyebrow text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {language === "de" ? "Ihr 5-Phasen-Protokoll" : "Your 5-Phase Protocol"}
        </motion.p>
        <motion.p
          className="slide-body mt-1 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          {language === "de" ? "Personalisierte Sequenz basierend auf Ihrem Hautvektor" : "Personalized sequence based on your skin vector"}
        </motion.p>

        {/* Protocol confidence badge */}
        <motion.div
          className="flex justify-center mt-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "hsl(var(--primary))",
              }}
            >
              {confidence}% {language === "de" ? "Protokoll-Übereinstimmung" : "protocol match"}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "hsl(var(--foreground-hint))",
              }}
            >
              · {language === "de" ? `Basierend auf ${signalCount} Signalen` : `Built from ${signalCount} signals`}
            </span>
          </div>
        </motion.div>

        {/* Clinical flags */}
        {result.active_flags.length > 0 && (
          <motion.div
            className="space-y-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {result.active_flags.slice(0, 2).map((flag) => {
              const msg = FLAG_MESSAGES[flag];
              if (!msg) return null;
              return (
                <div key={flag} className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
                  <span>{msg.icon}</span>
                  <div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>{msg.title[language as keyof typeof msg.title]}</p>
                    <p className="slide-body" style={{ fontSize: "0.875rem" }}>{msg.body[language as keyof typeof msg.body]}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Phase tabs */}
        <div className="flex gap-2 rounded-xl p-1.5" style={{ background: "hsl(var(--muted))" }}>
          {PHASES.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setActivePhase(i)}
              className="flex-1 rounded-lg py-3 transition-all duration-200 min-h-[56px] touch-manipulation"
              style={{
                background: activePhase === i ? "hsl(var(--card))" : "transparent",
                boxShadow: activePhase === i ? "0 1px 4px hsl(0 0% 0% / 0.12)" : "none",
              }}
            >
              <div style={{ fontSize: "1.25rem", textAlign: "center", marginBottom: "4px" }}>
                {p.icon}
              </div>
              <p style={{
                fontSize: "0.8125rem",
                fontWeight: activePhase === i ? 700 : 400,
                color: activePhase === i ? "#D4AF37" : "hsl(var(--foreground-hint))",
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {p.num}<br />{p.name[language as keyof typeof p.name]}
              </p>
            </button>
          ))}
        </div>

        {/* Active phase content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-2xl p-6 md:p-8"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <p className="slide-eyebrow mb-1" style={{ color: "#D4AF37", letterSpacing: "0.14em" }}>
              Phase {phase.num} · {phase.name[language as keyof typeof phase.name]}
            </p>
            <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#947E5C", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              ↳ {phase.axisDriver[language as keyof typeof phase.axisDriver]}
            </p>
            <p className="slide-body mb-1">{phase.desc[language as keyof typeof phase.desc]}</p>

            {/* AM/PM badges */}
            <div className="flex gap-2 mb-5">
              {phase.am && (
                <span className="rounded-full px-3 py-1 text-sm font-medium"
                  style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                  ☀️ AM
                </span>
              )}
              {phase.pm && (
                <span className="rounded-full px-3 py-1 text-sm font-medium"
                  style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                  🌙 PM
                </span>
              )}
            </div>

            {/* Products */}
            <div className="space-y-3">
              {products.length === 0 ? (
                <p className="slide-body" style={{ fontStyle: "italic" }}>
                  {language === "de"
                    ? "Für diese Phase sind auf Ihrer aktuellen Stufe keine Produkte zugewiesen."
                    : "No products assigned for this phase at your current tier."}
                </p>
              ) : (
                products.map((product: Product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-xl p-3"
                    style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border) / 0.5)" }}
                  >
                    {/* Product colour swatch placeholder */}
                    <div
                      className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                      style={{ background: "hsl(var(--primary) / 0.12)" }}
                    >
                      🧴
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "0.6875rem", letterSpacing: "0.1em", fontWeight: 600, color: "hsl(var(--foreground-hint))", textTransform: "uppercase" }}>{product.brand}</p>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>{product.name[language as "en" | "de"]}</p>
                      <p className="slide-body truncate" style={{ fontSize: "0.8125rem", marginTop: "0.15rem" }}>
                        {product.key_ingredients.slice(0, 3).join(" · ")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {product.target_axes.map((axis) => (
                          <span
                            key={axis}
                            className="rounded-full px-2 py-0.5 text-[0.7rem] font-medium"
                            style={{ background: "hsl(var(--primary) / 0.25)", color: "hsl(var(--primary))" }}
                          >
                            {(language === "de" ? AXIS_LABELS_DE : AXIS_LABELS)[axis]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(var(--foreground))", flexShrink: 0 }}>€{product.price_eur}</span>
                  </div>
                ))
              )}
            </div>

            {/* Clinical device reward — compact strip */}
            <div
              className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: isLocked ? "hsl(var(--muted) / 0.3)" : "hsl(var(--primary) / 0.08)",
                border: `1px solid ${isLocked ? "hsl(var(--border) / 0.4)" : "hsl(var(--primary) / 0.3)"}`,
                opacity: isLocked ? 0.75 : 1,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: isLocked ? "hsl(var(--muted))" : "hsl(var(--primary) / 0.15)" }}
              >
                {isLocked
                  ? <Lock className="w-4 h-4" style={{ color: "hsl(var(--foreground-hint))" }} />
                  : <span className="text-base">✨</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>
                  {language === "de" ? "Premium-Prämie · Klinisches EMS / LED-Gerät" : "Premium Reward · Clinical EMS / LED Device"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.4 }}>
                  {isLocked
                    ? (language === "de" ? "Für Monat 1 gesperrt — Versand nach Bestätigung der Barriere-Stabilität" : "Locked for Month 1 — Ships once barrier stability is confirmed")
                    : (language === "de" ? "Gerät versandbereit · verstärkt die Ergebnisse von Phase 3 3× wöchentlich" : "Device ready for dispatch · amplifies Phase 3 results 3× weekly")}
                </p>
              </div>
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: isLocked ? "hsl(var(--foreground-hint))" : "hsl(var(--primary))" }}
              >
                {isLocked ? (language === "de" ? "Monat 2" : "Month 2") : (language === "de" ? "Freigeschaltet" : "Unlocked")}
              </span>
            </div>

            {/* Skip warning */}
            <div
              className="mt-4 rounded-xl px-3 py-2"
              style={{
                background: "hsl(var(--muted) / 0.5)",
                borderLeft: "3px solid hsl(var(--foreground-hint) / 0.3)",
              }}
            >
              <p style={{
                fontSize: "0.75rem",
                color: "hsl(var(--foreground-hint))",
                lineHeight: 1.4,
                fontStyle: "italic",
              }}>
                ⚠ {phase.skipWarning[language as keyof typeof phase.skipWarning]}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlideProtocol;
