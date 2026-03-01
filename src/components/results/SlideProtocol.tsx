import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosisResult, Product, AXIS_LABELS } from "@/engine/types";

const PHASES = [
  { key: "Phase1", num: 1, name: "Cleanse",  icon: "💧", am: true,  pm: true,  desc: "Remove impurities without disrupting barrier integrity." },
  { key: "Phase2", num: 2, name: "Prep",     icon: "🌿", am: true,  pm: true,  desc: "Rebuild and reinforce the skin's moisture barrier." },
  { key: "Phase3", num: 3, name: "Treat",    icon: "🔬", am: false, pm: true,  desc: "Address primary concerns with active ingredients." },
  { key: "Phase4", num: 4, name: "Seal",     icon: "🛡", am: true,  pm: true,  desc: "Lock in moisture and create a protective film." },
  { key: "Phase5", num: 5, name: "Protect",  icon: "☀️", am: true,  pm: false, desc: "UV protection — always the final step." },
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

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-12 overflow-y-auto">
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
          transition={{ delay: 0.1 }}
        >
          Personalized sequence based on your skin vector
        </motion.p>

        {/* Clinical flags */}
        {result.active_flags.length > 0 && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {result.active_flags.slice(0, 2).map((flag) => {
              const msg = FLAG_MESSAGES[flag];
              if (!msg) return null;
              return (
                <div key={flag} className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
                  <span>{msg.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{msg.title}</p>
                    <p className="slide-body" style={{ fontSize: '0.875rem' }}>{msg.body}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Instruction hint */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 mb-4 text-center"
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.875rem',
            color: 'hsl(var(--foreground-hint))',
            fontStyle: 'italic',
          }}
        >
          ← Tap each phase to see your personalised step →
        </motion.p>

        {/* Phase tabs — bigger */}
        <div className="flex gap-2 rounded-xl p-1.5" style={{ background: 'hsl(var(--muted))' }}>
          {PHASES.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setActivePhase(i)}
              className="flex-1 rounded-lg py-3 transition-all duration-200 min-h-[56px] touch-manipulation"
              style={{
                background: activePhase === i ? 'hsl(var(--card))' : 'transparent',
                boxShadow: activePhase === i ? '0 1px 4px hsl(0 0% 0% / 0.12)' : 'none',
              }}
            >
              <div style={{ fontSize: '1.25rem', textAlign: 'center', marginBottom: '4px' }}>
                {p.icon}
              </div>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '0.8125rem',
                fontWeight: activePhase === i ? 600 : 400,
                color: activePhase === i ? 'hsl(var(--foreground))' : 'hsl(var(--foreground-hint))',
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {p.num}<br/>{p.name}
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
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            {/* Phase label */}
            <p style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: 'hsl(var(--primary))',
              marginBottom: '0.5rem',
            }}>
              Phase {phase.num} · {phase.name}
            </p>

            {/* Phase description */}
            <p className="slide-body" style={{ marginBottom: '1rem' }}>{phase.desc}</p>

            {/* AM/PM badges */}
            <div className="flex gap-2 mb-5">
              {phase.am && (
                <span className="rounded-full px-3 py-1 text-sm font-medium"
                      style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                  ☀️ AM
                </span>
              )}
              {phase.pm && (
                <span className="rounded-full px-3 py-1 text-sm font-medium"
                      style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                  🌙 PM
                </span>
              )}
            </div>

            {/* Products in this phase */}
            <div className="space-y-4">
              {products.length === 0 ? (
                <p className="slide-body" style={{ fontStyle: 'italic' }}>No products assigned for this phase at your current tier.</p>
              ) : (
                products.map((product: Product) => (
                  <div key={product.id} className="border-t border-border/50 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="slide-eyebrow" style={{ fontSize: '0.6875rem', letterSpacing: '0.12em' }}>{product.brand}</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{product.name}</p>
                        <p className="slide-body" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {product.key_ingredients.join(" · ")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {product.target_axes.map((axis) => (
                            <span key={axis} className="rounded-full bg-secondary px-2 py-0.5 text-[0.75rem]" style={{ color: 'hsl(var(--foreground-hint))' }}>
                              {AXIS_LABELS[axis]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>€{product.price_eur}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlideProtocol;
