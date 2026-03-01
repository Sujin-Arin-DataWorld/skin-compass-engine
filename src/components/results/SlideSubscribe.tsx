import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DiagnosisResult, AXIS_LABELS, Tier } from "@/engine/types";
import { useDiagnosisStore } from "@/store/diagnosisStore";

const TIER_OPTIONS: { key: Tier; label: string; price: string; desc: string; badge?: string }[] = [
  { key: "Entry", label: "Entry", price: "€49", desc: "Essential 3-step routine" },
  { key: "Full", label: "Full Protocol", price: "€89", desc: "Complete 5-phase routine", badge: "Recommended" },
  { key: "Premium", label: "Premium Strategy", price: "€149+", desc: "Full routine + device" },
];

interface Props {
  result: DiagnosisResult;
}

const SlideSubscribe = ({ result }: Props) => {
  const { selectedTier, setTier } = useDiagnosisStore();
  const [activeTier, setActiveTier] = useState<Tier>(selectedTier);
  const topAxis = result.primary_concerns[0];
  const patternName = result.detected_patterns[0]?.pattern.name_en ?? "Balanced Profile";
  const productCount = Object.values(result.product_bundle).flat().length;

  const handleTier = (t: Tier) => {
    setActiveTier(t);
    setTier(t);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <div className="w-full max-w-[520px]">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-primary text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Your Protocol is Ready
        </motion.p>

        {/* Summary card */}
        <motion.div
          className="mt-6 rounded-xl border border-border p-6 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Skin Pattern</span>
            <span className="font-medium text-foreground">{patternName}</span>
          </div>
          {topAxis && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Top concern</span>
              <span className="font-medium text-foreground">
                {AXIS_LABELS[topAxis]} ({Math.round(result.axis_scores[topAxis])}/100)
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Products</span>
            <span className="font-medium text-foreground">{productCount} matched formulas</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Protocol</span>
            <span className="font-medium text-foreground">5-phase, AM + PM</span>
          </div>
        </motion.div>

        {/* Tier selection */}
        <motion.div
          className="mt-8 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground text-center">
            Choose Your Plan
          </p>
          <div className="grid gap-3">
            {TIER_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTier(t.key)}
                className={`rounded-lg border p-4 text-left transition-all min-h-[44px] touch-manipulation ${
                  activeTier === t.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                    {t.badge && (
                      <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {t.badge}
                      </span>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                  <span className="font-display text-xl text-foreground">{t.price}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button className="w-full rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 min-h-[56px] touch-manipulation">
            Notify Me When Available
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Shopify integration coming soon</p>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.8 }}
        >
          <p>🔒 Dermatologist reviewed</p>
          <p>🔄 Swap products anytime based on skin changes</p>
          <p>📦 Ships to EU — 3–5 business days</p>
        </motion.div>

        {/* Restart */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link
            to="/diagnosis"
            className="text-sm text-primary hover:underline"
            onClick={() => useDiagnosisStore.getState().reset()}
          >
            ← Restart Assessment
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SlideSubscribe;
