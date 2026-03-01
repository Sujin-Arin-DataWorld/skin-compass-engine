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
    <div className="results-slide flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <div className="w-full max-w-[520px]">
        <motion.p
          className="slide-eyebrow text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Your Protocol is Ready
        </motion.p>

        {/* Summary card */}
        <motion.div
          className="mt-6 rounded-xl border border-border p-6 space-y-3"
          style={{ background: 'hsl(var(--card))' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: "Skin Pattern", value: patternName },
            topAxis ? { label: "Top concern", value: `${AXIS_LABELS[topAxis]} (${Math.round(result.axis_scores[topAxis])}/100)` } : null,
            { label: "Products", value: `${productCount} matched formulas` },
            { label: "Protocol", value: "5-phase, AM + PM" },
          ].filter(Boolean).map((row) => (
            <div key={row!.label} className="flex justify-between" style={{ fontSize: '1rem' }}>
              <span style={{ color: 'hsl(var(--foreground-hint))' }}>{row!.label}</span>
              <span style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{row!.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Tier selection */}
        <motion.div
          className="mt-8 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="section-header text-center">Choose Your Plan</p>
          <div className="grid gap-3">
            {TIER_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTier(t.key)}
                className={`rounded-lg border p-4 text-left transition-all min-h-[56px] touch-manipulation ${
                  activeTier === t.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
                style={{ background: activeTier === t.key ? undefined : 'hsl(var(--card))' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{t.label}</span>
                    {t.badge && (
                      <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[0.75rem] font-medium text-primary">
                        {t.badge}
                      </span>
                    )}
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground-body))', marginTop: '0.25rem' }}>{t.desc}</p>
                  </div>
                  <span className="font-display text-xl" style={{ color: 'hsl(var(--foreground))' }}>{t.price}</span>
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
          <p className="mt-3" style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground-hint))' }}>Shopify integration coming soon</p>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-2"
          style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground-hint))' }}
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
            className="text-primary hover:underline"
            style={{ fontSize: '0.9375rem' }}
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
