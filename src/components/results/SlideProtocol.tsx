import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosisResult, Product, AXIS_LABELS } from "@/engine/types";
import { Lock } from "lucide-react";

const PHASES = [
  { key: "Phase1", num: 1, name: "Cleanse", icon: "💧", am: true, pm: true, desc: "Remove impurities without disrupting barrier integrity.", skipWarning: "Skipping leaves barrier-disrupting residue that amplifies reactivity." },
  { key: "Phase2", num: 2, name: "Prep", icon: "🌿", am: true, pm: true, desc: "Rebuild and reinforce the skin's moisture barrier.", skipWarning: "Barrier support is the foundation — skipping collapses all downstream phases." },
  { key: "Phase3", num: 3, name: "Treat", icon: "🔬", am: false, pm: true, desc: "Address primary concerns with active ingredients.", skipWarning: "Treatment actives without barrier prep cause reactive flare-ups." },
  { key: "Phase4", num: 4, name: "Seal", icon: "🛡", am: true, pm: true, desc: "Lock in moisture and create a protective film.", skipWarning: "Recovery phase locks in treatment gains — skipping reduces efficacy by ~40%." },
  { key: "Phase5", num: 5, name: "Protect", icon: "☀️", am: true, pm: false, desc: "UV protection — always the final step.", skipWarning: "Without SPF, all pigmentation and barrier work is partially reversed daily." },
];

const FLAG_MESSAGES: Record<string, { icon: string; title: string; body: string }> = {
  BARRIER_EMERGENCY: { icon: "⚠️", title: "Barrier Emergency", body: "Pause all actives for 2 weeks. Focus on Phases 1, 2 & 4." },
  ACTIVE_INGREDIENT_PAUSE: { icon: "⚠️", title: "Exfoliation Pause", body: "Remove all exfoliants for 4 weeks." },
  HORMONAL_ACNE_PROTOCOL: { icon: "ℹ️", title: "Hormonal Pattern", body: "Track skin alongside your menstrual cycle." },
  DERMATOLOGIST_REFERRAL: { icon: "⚕️", title: "Consultation Advised", body: "Acne severity may benefit from medical treatment." },
  DEVICE_RECOMMENDED: { icon: "💡", title: "Device Recommended", body: "EMS/LED device 3× weekly amplifies Phase 3 results." },
};

interface Props {
  result: DiagnosisResult;
}

const SlideProtocol = ({ result }: Props) => {
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
          Your 5-Phase Protocol
        </motion.p>
        <motion.p
          className="slide-body mt-1 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          Personalized sequence based on your skin vector
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
              {confidence}% protocol match
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "hsl(var(--foreground-hint))",
              }}
            >
              · Built from {signalCount} signals
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
                    <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>{msg.title}</p>
                    <p className="slide-body" style={{ fontSize: "0.875rem" }}>{msg.body}</p>
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
                fontWeight: activePhase === i ? 600 : 400,
                color: activePhase === i ? "hsl(var(--foreground))" : "hsl(var(--foreground-hint))",
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {p.num}<br />{p.name}
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
            <p className="slide-eyebrow mb-2" style={{ color: "hsl(var(--primary))" }}>
              Phase {phase.num} · {phase.name}
            </p>
            <p className="slide-body mb-1">{phase.desc}</p>

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
                <p className="slide-body" style={{ fontStyle: "italic" }}>No products assigned for this phase at your current tier.</p>
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
                      <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>{product.name}</p>
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
                            {AXIS_LABELS[axis]}
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
                  Premium Reward · Clinical EMS / LED Device
                </p>
                <p style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.4 }}>
                  {isLocked
                    ? "Locked for Month 1 — Ships once barrier stability is confirmed"
                    : "Device ready for dispatch · amplifies Phase 3 results 3× weekly"}
                </p>
              </div>
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: isLocked ? "hsl(var(--foreground-hint))" : "hsl(var(--primary))" }}
              >
                {isLocked ? "Month 2" : "Unlocked"}
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
                ⚠ {phase.skipWarning}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlideProtocol;
