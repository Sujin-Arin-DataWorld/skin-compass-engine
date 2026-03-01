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
    <div className="flex flex-1 flex-col px-6 py-12 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Your 5-Phase Protocol
        </motion.p>
        <motion.p
          className="mt-1 text-sm text-muted-foreground"
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
                    <p className="text-xs font-medium text-foreground">{msg.title}</p>
                    <p className="text-[11px] text-muted-foreground">{msg.body}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Phase tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
          {PHASES.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setActivePhase(i)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all whitespace-nowrap min-h-[40px] touch-manipulation ${
                activePhase === i
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground border border-transparent hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.num}. {p.name}</span>
            </button>
          ))}
        </div>

        {/* Active phase content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            className="mt-4 rounded-xl border border-border p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-foreground">
                Phase {phase.num} · {phase.name}
              </h3>
              <div className="flex gap-2">
                {phase.am && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">AM</span>}
                {phase.pm && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">PM</span>}
              </div>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{phase.desc}</p>

            {/* Products in this phase */}
            <div className="mt-5 space-y-4">
              {products.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No products assigned for this phase at your current tier.</p>
              ) : (
                products.map((product: Product) => (
                  <div key={product.id} className="border-t border-border/50 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.brand}</p>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.key_ingredients.join(" · ")}
                        </p>
                        {/* Target axes */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {product.target_axes.map((axis) => (
                            <span key={axis} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                              {AXIS_LABELS[axis]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">€{product.price_eur}</span>
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
