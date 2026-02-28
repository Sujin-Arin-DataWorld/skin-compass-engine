import { useMemo, useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { AXIS_LABELS, Tier, Product, AXIS_KEYS } from "@/engine/types";
import { SYMPTOMS } from "@/engine/weights";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DebugPanel from "@/components/diagnosis/DebugPanel";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const severityColor = (score: number) => {
  if (score <= 20) return "hsl(var(--severity-clear))";
  if (score <= 45) return "hsl(var(--severity-mild))";
  if (score <= 70) return "hsl(var(--severity-moderate))";
  return "hsl(var(--severity-severe))";
};

const severityLabel = (score: number) => {
  if (score <= 20) return "Low";
  if (score <= 45) return "Mild";
  if (score <= 70) return "Moderate";
  return "High";
};

const ResultsPage = () => {
  const { result, selectedTier, setTier, severities } = useDiagnosisStore();
  const [searchParams] = useSearchParams();
  const [activeTier, setActiveTier] = useState<Tier>(selectedTier);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [radarReady, setRadarReady] = useState(false);
  const isDebug = searchParams.get("debug") === "true" && import.meta.env.DEV;
  const { reducedMotion } = usePerformanceMode();

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

  const [animatedRadar, setAnimatedRadar] = useState<{ axis: string; score: number; label: string }[]>([]);

  useEffect(() => {
    if (!result) return;
    if (reducedMotion) {
      setAnimatedRadar(result.radar_chart_data);
      setRadarReady(true);
      return;
    }
    setAnimatedRadar(result.radar_chart_data.map(d => ({ ...d, score: 0 })));
    const t1 = setTimeout(() => {
      setRadarReady(true);
      result.radar_chart_data.forEach((d, i) => {
        setTimeout(() => {
          setAnimatedRadar(prev => prev.map((p, j) =>
            j <= i ? { ...p, score: result.radar_chart_data[j].score } : p
          ));
        }, i * 200);
      });
    }, 600);
    return () => clearTimeout(t1);
  }, [result, reducedMotion]);

  if (!result) return <Navigate to="/diagnosis" replace />;

  const primaryPattern = result.detected_patterns[0];
  const additionalPatterns = result.detected_patterns.slice(1);
  const handleTierChange = (t: Tier) => { setActiveTier(t); setTier(t); };
  const bundle = result.product_bundle;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-24 pb-16">

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: PRIMARY DIAGNOSIS (always visible)
        ═══════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Urgency banner */}
          {primaryPattern ? (
            <div className={`rounded-lg border p-6 ${URGENCY_BG[result.urgency_level]}`}>
              <p className="text-sm font-medium" style={{ color: URGENCY_COLORS[result.urgency_level] }}>
                {result.urgency_level === "CRITICAL" ? "⚠️ Critical Pattern Detected" : result.urgency_level === "HIGH" ? "⚠️ High-Risk Pattern Detected" : "Pattern Detected"}
              </p>
              <p className="mt-1 font-display text-xl text-foreground">{primaryPattern.pattern.name_en}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-severity-clear/20 bg-severity-clear/5 p-6">
              <p className="text-sm text-severity-clear">No critical patterns detected.</p>
            </div>
          )}

          {/* Pattern name + explanation */}
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">YOUR SKIN PATTERN</p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl text-foreground">
              {primaryPattern?.pattern.name_en || "Balanced Skin Profile"}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              {primaryPattern?.pattern.clinical_en || "Your skin shows a balanced profile without any dominant pattern."}
            </p>

            {/* Severity badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: URGENCY_COLORS[result.urgency_level] }} />
              <span className="text-xs font-medium text-foreground">{result.urgency_level} Severity</span>
            </div>

            {additionalPatterns.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Additional:</span>
                {additionalPatterns.map((p) => (
                  <span key={p.pattern.id} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {p.pattern.name_en}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Why this result? */}
          <div className="mt-6 rounded-lg border border-border/50 bg-secondary/20 p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Why this result?</p>
            {patternReasons.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {patternReasons.map((r) => (
                  <div key={r.id} className="flex items-start gap-2">
                    <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${r.severity >= 3 ? "bg-severity-severe" : "bg-severity-moderate"}`} />
                    <p className="text-sm text-muted-foreground leading-snug">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
            {result.primary_concerns.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {result.primary_concerns.slice(0, 3).map((axis) => (
                  <div key={axis} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{AXIS_LABELS[axis]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      result.axis_severity[axis] >= 3
                        ? "bg-severity-severe/10 text-severity-severe"
                        : result.axis_severity[axis] >= 2
                        ? "bg-severity-moderate/10 text-severity-moderate"
                        : "bg-severity-mild/10 text-severity-mild"
                    }`}>
                      {result.axis_severity[axis] >= 3 ? "High" : result.axis_severity[axis] >= 2 ? "Moderate" : "Low"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              AI-assisted assessment based on your self-reported symptoms. Not a medical diagnosis.
            </p>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: SKIN METRICS (collapsed by default)
        ═══════════════════════════════════════════════════════════ */}
        <motion.section
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg border border-border px-5 py-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 min-h-[44px] touch-manipulation">
                <span>View detailed skin metrics</span>
                <motion.div animate={{ rotate: metricsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 rounded-lg border border-border p-4">
                {/* Axis score counters */}
                <div className="mb-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {result.radar_chart_data.map((d, i) => (
                    <div key={d.axis} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{d.axis}</span>
                      <span className="text-xl font-display" style={{ color: severityColor(d.score) }}>
                        <AnimatedScore target={d.score} delay={0.1 + i * 0.1} />
                      </span>
                    </div>
                  ))}
                </div>

                {/* Radar chart */}
                <div className="mx-auto max-w-[500px]">
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarReady ? animatedRadar : animatedRadar}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={({ payload, x, y, cx, ...rest }) => {
                          const score = result.radar_chart_data.find(d => d.axis === payload.value)?.score ?? 0;
                          return (
                            <text {...rest} x={x} y={y} textAnchor={x > cx ? "start" : x < cx ? "end" : "middle"} fill={severityColor(score)} fontSize={11}>
                              {payload.value}
                            </text>
                          );
                        }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "hsl(var(--text-muted))", fontSize: 8 }} tickCount={4} />
                      <Radar dataKey="score" stroke="hsl(var(--accent-cyan))" fill="hsl(var(--accent-cyan))" fillOpacity={0.15} strokeWidth={2} animationBegin={0} animationDuration={600} animationEasing="ease-out" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3: AXIS BREAKDOWN (accordion, one open at a time)
        ═══════════════════════════════════════════════════════════ */}
        <motion.section
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-display text-xl text-foreground mb-4">Axis Breakdown</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {result.radar_chart_data.map((d) => (
              <AccordionItem key={d.axis} value={d.axis} className="rounded-lg border border-border px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: severityColor(d.score) }} />
                    <span className="text-sm font-medium text-foreground">{AXIS_LABELS[d.axis] || d.axis}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      d.score > 70 ? "bg-severity-severe/10 text-severity-severe"
                        : d.score > 45 ? "bg-severity-moderate/10 text-severity-moderate"
                        : d.score > 20 ? "bg-severity-mild/10 text-severity-mild"
                        : "bg-severity-clear/10 text-severity-clear"
                    }`}>
                      {severityLabel(d.score)} · {d.score}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-2 space-y-2">
                    {/* Show contributing symptoms for this axis */}
                    {Object.entries(severities)
                      .filter(([id]) => {
                        const sym = SYMPTOMS[id];
                        return sym && AXIS_LABELS[d.axis]?.toLowerCase().includes(sym.category.toString());
                      })
                      .filter(([, val]) => val >= 2)
                      .slice(0, 5)
                      .map(([id, val]) => (
                        <div key={id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{SYMPTOMS[id]?.text_en ?? id}</span>
                          <span className="text-foreground">{val}/3</span>
                        </div>
                      ))
                    }
                    {result.axis_severity[d.axis] != null && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Severity level: {result.axis_severity[d.axis] >= 3 ? "High" : result.axis_severity[d.axis] >= 2 ? "Moderate" : "Low"}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4: 5-PHASE PROTOCOL
        ═══════════════════════════════════════════════════════════ */}
        <motion.section
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="font-display text-2xl text-foreground">Your 5-Phase Protocol</h2>
          <p className="mt-1 text-sm text-muted-foreground">Applied in this exact order, morning and evening.</p>

          {/* Clinical Flags */}
          {result.active_flags.length > 0 && (
            <div className="mt-6 space-y-3">
              {result.active_flags.map((flag) => {
                const msg = FLAG_MESSAGES[flag];
                if (!msg) return null;
                return (
                  <div key={flag} className="border-l-2 border-border pl-4">
                    <p className="text-sm font-medium text-foreground">{msg.icon} {msg.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{msg.body}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Phase steps */}
          <div className="mt-8 space-y-6">
            {Object.entries(PHASE_LABELS).map(([key, phase]) => {
              const products = bundle[key] || [];
              if (key === "Device" && products.length === 0) return null;
              return (
                <div key={key} className="border-l-2 border-border pl-6">
                  <h3 className="font-display text-lg text-foreground">{phase.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{phase.desc}</p>
                  {products.map((product: Product) => (
                    <div key={product.id} className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-3 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{product.key_ingredients.join(" · ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">€{product.price_eur}</span>
                        <button className="rounded-md border border-primary px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground min-h-[44px] touch-manipulation">
                          Notify Me
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Tier selector */}
          <div className="mt-12 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {(["Entry", "Full", "Premium"] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTierChange(t)}
                className={`rounded-lg border p-5 text-left transition-all min-h-[44px] touch-manipulation ${
                  activeTier === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-widest text-primary">{TIER_INFO[t].label}</p>
                {t === "Full" && (
                  <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">Recommended</span>
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

          <p className="mt-6 text-xs text-muted-foreground">
            Estimated total calculated at checkout. Shopify integration coming soon.
          </p>
        </motion.section>

        {/* Restart */}
        <div className="mt-20 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">Skin changes. Reassess in 6–8 weeks.</p>
          <Link
            to="/diagnosis"
            className="mt-3 inline-flex items-center justify-center text-sm font-medium text-primary hover:underline min-h-[44px]"
            onClick={() => useDiagnosisStore.getState().reset()}
          >
            Restart Assessment
          </Link>
        </div>
      </div>

      {isDebug && result?._debug && <DebugPanel debugData={result._debug} />}
      <Footer />
    </div>
  );
};

export default ResultsPage;
