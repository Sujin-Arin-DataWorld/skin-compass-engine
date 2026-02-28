import { useMemo, useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { AXIS_LABELS, Tier, Product, AXIS_KEYS } from "@/engine/types";
import { SYMPTOMS } from "@/engine/weights";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DebugPanel from "@/components/diagnosis/DebugPanel";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

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

// ── Animated counter component ──
const AnimatedScore = ({ target, delay }: { target: number; delay: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(0, target, {
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1],
        onUpdate: (v) => setDisplay(Math.round(v)),
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [target, delay]);

  return <span>{display}</span>;
};

const ResultsPage = () => {
  const { result, selectedTier, setTier, severities } = useDiagnosisStore();
  const [searchParams] = useSearchParams();
  const [activeTier, setActiveTier] = useState<Tier>(selectedTier);
  const [radarReady, setRadarReady] = useState(false);
  const [replayPhase, setReplayPhase] = useState(0);
  const isDebug = searchParams.get("debug") === "true" && import.meta.env.DEV;
  const { reducedMotion } = usePerformanceMode();

  // Explainability
  const patternReasons = useMemo(() => {
    if (!result) return [];
    const pp = result.detected_patterns[0];
    if (!pp) return [];
    const allIds = [...pp.pattern.required, ...pp.pattern.optional];
    return allIds
      .filter((id) => (severities[id] ?? 0) >= 2)
      .map((id) => ({ id, text: SYMPTOMS[id]?.text_en ?? id, severity: severities[id] ?? 0 }))
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3);
  }, [result, severities]);

  // Animated radar data — starts at 0, builds up
  const [animatedRadar, setAnimatedRadar] = useState<{ axis: string; score: number; label: string }[]>([]);

  useEffect(() => {
    if (!result) return;
    // Start with zeros
    setAnimatedRadar(result.radar_chart_data.map(d => ({ ...d, score: 0 })));

    // Phase 0 → 1 (banner visible immediately, pattern at 0.6s)
    const t1 = setTimeout(() => setReplayPhase(1), 600);
    // Phase 2 (radar starts building at 1.2s)
    const t2 = setTimeout(() => {
      setReplayPhase(2);
      setRadarReady(true);
      // Animate each axis sequentially
      result.radar_chart_data.forEach((d, i) => {
        setTimeout(() => {
          setAnimatedRadar(prev => prev.map((p, j) =>
            j <= i ? { ...p, score: result.radar_chart_data[j].score } : p
          ));
        }, i * 200);
      });
    }, 1200);
    // Phase 3 (rest of content at 3s)
    const t3 = setTimeout(() => setReplayPhase(3), 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [result]);

  if (!result) return <Navigate to="/diagnosis" replace />;

  const primaryPattern = result.detected_patterns[0];
  const additionalPatterns = result.detected_patterns.slice(1);

  const handleTierChange = (t: Tier) => {
    setActiveTier(t);
    setTier(t);
  };

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

      <div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-24 pb-16">
        {/* Section A: Pattern Banner — reveals immediately */}
        <AnimatePresence>
          {replayPhase >= 0 && (
            primaryPattern ? (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className={`rounded-lg border p-6 ${URGENCY_BG[result.urgency_level]}`}
              >
                <motion.p
                  className="text-sm font-medium"
                  style={{ color: URGENCY_COLORS[result.urgency_level] }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {result.urgency_level === "CRITICAL" ? "⚠️ Critical Pattern Detected" : result.urgency_level === "HIGH" ? "⚠️ High-Risk Pattern Detected" : "Pattern Detected"}
                </motion.p>
                <motion.p
                  className="mt-1 font-display text-xl text-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  {primaryPattern.pattern.name_en}
                </motion.p>
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
            )
          )}
        </AnimatePresence>

        {/* Section B: Pattern Name & Summary — staggered reveal */}
        <AnimatePresence>
          {replayPhase >= 1 && (
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.p
                className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.2em" }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                YOUR SKIN PATTERN
              </motion.p>
              <motion.h1
                className="mt-3 font-display text-3xl sm:text-4xl text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {primaryPattern?.pattern.name_en || "Balanced Skin Profile"}
              </motion.h1>
              <motion.p
                className="mt-4 max-w-2xl text-muted-foreground leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {primaryPattern?.pattern.clinical_en || "Your skin shows a balanced profile without any dominant pattern. Follow the recommended protocol to maintain optimal skin health."}
              </motion.p>
              {additionalPatterns.length > 0 && (
                <motion.div
                  className="mt-4 flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-xs text-muted-foreground">Additional patterns:</span>
                  {additionalPatterns.map((p, i) => (
                    <motion.span
                      key={p.pattern.id}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                    >
                      {p.pattern.name_en}
                    </motion.span>
                  ))}
                </motion.div>
              )}
              {/* Explainability bullets */}
              {patternReasons.length > 0 && (
                <motion.div
                  className="mt-6 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Key Contributors
                  </p>
                  {patternReasons.map((r, i) => (
                    <motion.div
                      key={r.id}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.12 }}
                    >
                      <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                        r.severity >= 3 ? "bg-severity-severe" : "bg-severity-moderate"
                      }`} />
                      <p className="text-sm text-muted-foreground leading-snug">{r.text}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section C: Radar Chart — axes build up sequentially */}
        <AnimatePresence>
          {replayPhase >= 2 && (
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Axis score counters */}
              <div className="mb-6 grid grid-cols-3 sm:grid-cols-6 gap-3">
                {result.radar_chart_data.map((d, i) => (
                  <motion.div
                    key={d.axis}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border p-3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.15, duration: 0.4 }}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{d.axis}</span>
                    <span
                      className="text-xl font-display"
                      style={{ color: severityColor(d.score) }}
                    >
                      <AnimatedScore target={d.score} delay={0.2 + i * 0.15} />
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mx-auto max-w-[500px]">
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart data={radarReady ? animatedRadar : animatedRadar}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={({ payload, x, y, cx, ...rest }) => {
                        const score = result.radar_chart_data.find(d => d.axis === payload.value)?.score ?? 0;
                        return (
                          <text
                            {...rest}
                            x={x}
                            y={y}
                            textAnchor={x > cx ? "start" : x < cx ? "end" : "middle"}
                            fill={severityColor(score)}
                            fontSize={11}
                          >
                            {payload.value}
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
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sections D-H — reveal after radar completes */}
        <AnimatePresence>
          {replayPhase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Section D: Phase Protocol */}
              <div className="mt-16">
                <h2 className="font-display text-2xl text-foreground">Your 5-Phase Protocol</h2>
                <p className="mt-1 text-sm text-muted-foreground">Applied in this exact order, morning and evening.</p>
                <div className="mt-8 space-y-6">
                  {Object.entries(PHASE_LABELS).map(([key, phase], i) => {
                    const products = bundle[key] || [];
                    if (key === "Device" && products.length === 0) return null;
                    return (
                      <motion.div
                        key={key}
                        className="border-l-2 border-border pl-6"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                      >
                        <h3 className="font-display text-lg text-foreground">{phase.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{phase.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Section E: Strategy Box (Tiers) */}
              <motion.div
                className="mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                  {(["Entry", "Full", "Premium"] as Tier[]).map((t, i) => (
                    <motion.button
                      key={t}
                      onClick={() => handleTierChange(t)}
                      className={`rounded-lg border p-5 sm:p-6 text-left transition-all min-h-[44px] touch-manipulation ${
                        activeTier === t
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 active:border-primary/60"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      whileTap={{ scale: 0.97 }}
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
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Section F: Product List */}
              <motion.div
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
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
                        <div key={product.id} className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                            <p className="text-sm font-medium text-foreground">{product.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {product.key_ingredients.join(" · ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">€{product.price_eur}</span>
                            <button className="rounded-md border border-primary px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground min-h-[44px] touch-manipulation">
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
                    {result.active_flags.map((flag, i) => {
                      const msg = FLAG_MESSAGES[flag];
                      if (!msg) return null;
                      return (
                        <motion.div
                          key={flag}
                          className="border-l-2 border-border pl-4"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 + i * 0.1 }}
                        >
                          <p className="text-sm font-medium text-foreground">
                            {msg.icon} {msg.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{msg.body}</p>
                        </motion.div>
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
                  className="mt-3 inline-block text-sm font-medium text-primary hover:underline min-h-[44px] flex items-center justify-center"
                  onClick={() => useDiagnosisStore.getState().reset()}
                >
                  Restart Assessment
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
};

export default ResultsPage;
