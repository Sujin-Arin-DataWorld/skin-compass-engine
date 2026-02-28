import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { AXIS_LABELS, Tier, Product } from "@/engine/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const URGENCY_COLORS: Record<string, string> = {
  LOW: "hsl(var(--severity-clear))",
  MEDIUM: "hsl(var(--severity-mild))",
  HIGH: "hsl(var(--severity-moderate))",
  CRITICAL: "hsl(var(--severity-severe))",
};

const URGENCY_BG: Record<string, string> = {
  LOW: "bg-severity-clear/5 border-severity-clear/20",
  MEDIUM: "bg-severity-mild/5 border-severity-mild/20",
  HIGH: "bg-severity-moderate/5 border-severity-moderate/20",
  CRITICAL: "bg-severity-severe/5 border-severity-severe/20",
};

const FLAG_MESSAGES: Record<string, { icon: string; title: string; body: string }> = {
  BARRIER_EMERGENCY: { icon: "⚠️", title: "Barrier Emergency Protocol Active", body: "Pause all active ingredients (acids, retinol) for a minimum of 2 weeks. Focus exclusively on Phases 1, 2B, and 4 until skin stabilises." },
  ACTIVE_INGREDIENT_PAUSE: { icon: "⚠️", title: "Exfoliation Pause Required", body: "Your barrier shows signs of over-processing. Remove all exfoliants from your routine for 4 weeks." },
  HORMONAL_ACNE_PROTOCOL: { icon: "ℹ️", title: "Hormonal Pattern Detected", body: "Track your skin cycle alongside your menstrual cycle. Niacinamide 10%+ is most effective during the luteal phase." },
  DERMATOLOGIST_REFERRAL: { icon: "⚕️", title: "Professional Consultation Advised", body: "Your acne severity (IGA Grade 3+) may benefit from medical treatment. This protocol addresses topical management only." },
  ANTIOXIDANT_PRIORITY: { icon: "☀️", title: "Photoprotection is Non-Negotiable", body: "Your oxidative pattern requires SPF50+ every day, including winter. Vitamin C must be applied before sunscreen." },
  DEVICE_RECOMMENDED: { icon: "💡", title: "EMS/LED Device Can Accelerate Results", body: "Your aging score indicates collagen matrix activity. A microcurrent or LED device, used 3× weekly, significantly amplifies the effectiveness of your Phase 3 serums." },
  HYDRATION_FIRST: { icon: "💧", title: "Hydration-First Protocol", body: "Address dehydration before controlling sebum. Layer humectants before any oil-control actives." },
  ANTI_REDNESS_PROTOCOL: { icon: "🔴", title: "Anti-Redness Protocol Active", body: "Avoid thermal triggers, alcohol, and fragrance. Niacinamide + Azelaic acid for vascular stabilisation." },
  ACTIVES_LIMIT: { icon: "⚠️", title: "Active Ingredients Limited", body: "Your barrier score is elevated. Limit active ingredient usage until barrier recovers." },
  IRRITATION_RISK: { icon: "⚠️", title: "Irritation Risk Elevated", body: "Your sensitivity score is high. Patch-test all new products for 48 hours before full application." },
};

const PHASE_LABELS: Record<string, { name: string; desc: string }> = {
  Phase1: { name: "Phase 1 — Cleanse", desc: "Remove impurities without disrupting barrier integrity." },
  Phase2: { name: "Phase 2 — Prep & Barrier", desc: "Rebuild and reinforce the skin's moisture barrier." },
  Phase3: { name: "Phase 3 — Target", desc: "Address your primary skin concerns with active ingredients." },
  Phase4: { name: "Phase 4 — Seal", desc: "Lock in moisture and create a protective film." },
  Phase5: { name: "Phase 5 — Protect", desc: "UV protection is always the final step. Non-negotiable." },
  Device: { name: "Device", desc: "Amplify results with clinical-grade home devices." },
};

const TIER_INFO: Record<Tier, { label: string; price: string; features: string[] }> = {
  Entry: { label: "ENTRY Routine", price: "€49", features: ["Cleanser", "Hydration", "Suncare"] },
  Full: { label: "FULL Protocol", price: "€79–89", features: ["+ Full serum", "+ Barrier boost", "+ Target serum"] },
  Premium: { label: "PREMIUM Strategy", price: "€149+", features: ["+ Device", "+ Premium serums", "+ Priority ship"] },
};

const ResultsPage = () => {
  const { result, selectedTier, setTier } = useDiagnosisStore();
  const [activeTier, setActiveTier] = useState<Tier>(selectedTier);

  if (!result) return <Navigate to="/diagnosis" replace />;

  const primaryPattern = result.detected_patterns[0];
  const additionalPatterns = result.detected_patterns.slice(1);

  const handleTierChange = (t: Tier) => {
    setActiveTier(t);
    setTier(t);
  };

  // Recompute bundle for active tier
  const bundle = result.product_bundle;

  const severityColor = (score: number) => {
    if (score <= 20) return "hsl(var(--severity-clear))";
    if (score <= 45) return "hsl(var(--severity-mild))";
    if (score <= 70) return "hsl(var(--severity-moderate))";
    return "hsl(var(--severity-severe))";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-[960px] px-6 pt-24 pb-16">
        {/* Section A: Pattern Banner */}
        {primaryPattern ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border p-6 ${URGENCY_BG[result.urgency_level]}`}
          >
            <p className="text-sm font-medium" style={{ color: URGENCY_COLORS[result.urgency_level] }}>
              {result.urgency_level === "CRITICAL" ? "⚠️ Critical Pattern Detected" : result.urgency_level === "HIGH" ? "⚠️ High-Risk Pattern Detected" : "Pattern Detected"}
            </p>
            <p className="mt-1 font-display text-xl text-foreground">
              {primaryPattern.pattern.name_en}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-severity-clear/20 bg-severity-clear/5 p-6"
          >
            <p className="text-sm text-severity-clear">
              No critical risk patterns detected. Proceed with your protocol.
            </p>
          </motion.div>
        )}

        {/* Section B: Pattern Name & Summary */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            YOUR SKIN PATTERN
          </p>
          <h1 className="mt-3 font-display text-4xl text-foreground">
            {primaryPattern?.pattern.name_en || "Balanced Skin Profile"}
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            {primaryPattern?.pattern.clinical_en || "Your skin shows a balanced profile without any dominant pattern. Follow the recommended protocol to maintain optimal skin health."}
          </p>
          {additionalPatterns.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Additional patterns:</span>
              {additionalPatterns.map((p) => (
                <span key={p.pattern.id} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {p.pattern.name_en}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Section C: Radar Chart */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="mx-auto max-w-[500px]">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={result.radar_chart_data}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={({ payload, x, y, cx, cy, ...rest }) => {
                    const score = result.radar_chart_data.find(d => d.axis === payload.value)?.score ?? 0;
                    return (
                      <text
                        {...rest}
                        x={x}
                        y={y}
                        textAnchor={x > cx ? "start" : x < cx ? "end" : "middle"}
                        fill={severityColor(score)}
                        fontSize={12}
                      >
                        {payload.value} {score}
                      </text>
                    );
                  }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--text-muted))", fontSize: 8 }}
                  tickCount={4}
                />
                <Radar
                  dataKey="score"
                  stroke="hsl(var(--accent-cyan))"
                  fill="hsl(var(--accent-cyan))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Section D: Phase Protocol */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="font-display text-2xl text-foreground">Your 5-Phase Protocol</h2>
          <p className="mt-1 text-sm text-muted-foreground">Applied in this exact order, morning and evening.</p>

          <div className="mt-8 space-y-6">
            {Object.entries(PHASE_LABELS).map(([key, phase]) => {
              const products = bundle[key] || [];
              if (key === "Device" && products.length === 0) return null;
              return (
                <div key={key} className="border-l-2 border-border pl-6">
                  <h3 className="font-display text-lg text-foreground">{phase.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{phase.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Section E: Strategy Box (Tiers) */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {(["Entry", "Full", "Premium"] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTierChange(t)}
                className={`rounded-lg border p-6 text-left transition-all ${
                  activeTier === t
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-widest text-primary">
                  {TIER_INFO[t].label}
                </p>
                {t === "Full" && (
                  <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Recommended
                  </span>
                )}
                <p className="mt-3 font-display text-2xl text-foreground">{TIER_INFO[t].price}</p>
                <ul className="mt-3 space-y-1">
                  {TIER_INFO[t].features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground">{f}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Section F: Product List */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {Object.entries(bundle).map(([phase, products]) => {
            if (products.length === 0) return null;
            const phaseLabel = PHASE_LABELS[phase];
            return (
              <div key={phase} className="mb-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
                  {phaseLabel?.name || phase}
                </p>
                {products.map((product: Product) => (
                  <div key={product.id} className="mb-3 flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.key_ingredients.join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">€{product.price_eur}</span>
                      <button className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground">
                        Notify Me
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground">
            Estimated total calculated at checkout. Shopify integration coming soon.
          </p>
        </motion.div>

        {/* Section G: Clinical Flags */}
        {result.active_flags.length > 0 && (
          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="font-display text-xl text-foreground">Clinical Notes for Your Skin</h3>
            <div className="mt-6 space-y-4">
              {result.active_flags.map((flag) => {
                const msg = FLAG_MESSAGES[flag];
                if (!msg) return null;
                return (
                  <div key={flag} className="border-l-2 border-border pl-4">
                    <p className="text-sm font-medium text-foreground">
                      {msg.icon} {msg.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{msg.body}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Section H: Restart */}
        <div className="mt-20 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">Skin changes. Reassess in 6–8 weeks.</p>
          <Link
            to="/diagnosis"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            onClick={() => useDiagnosisStore.getState().reset()}
          >
            Restart Assessment
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResultsPage;
