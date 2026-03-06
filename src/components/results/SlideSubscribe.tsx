import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { DiagnosisResult, AXIS_LABELS, Tier } from "@/engine/types";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { FlaskConical, ShieldCheck, RefreshCw, Calendar } from "lucide-react";

type PlanKey = "entry" | "full" | "premium";

const PLANS: {
  key: PlanKey;
  label: string;
  tagline: string;
  price: string;
  priceNote: string;
  perDay: string | null;
  badge?: string;
  features: string[];
  gated: string[];
}[] = [
    {
      key: "entry",
      label: "Entry",
      tagline: "Essential 3-step routine — one-time",
      price: "€49",
      priceNote: "",
      perDay: null,
      features: [
        "Core 3-product routine matched to your skin vector",
        "Protocol PDF (AM + PM steps)",
        "Dermatologist reviewed formulas",
      ],
      gated: [
        "Monthly recalibration — products re-rank as skin changes",
        "Protocol gating (active safety logic)",
        "Progress history & Baseline Snapshot",
      ],
    },
    {
      key: "full",
      label: "Full Protocol",
      tagline: "Complete 5-phase adaptive routine",
      price: "€89",
      priceNote: "/ month",
      perDay: "€2.97",
      badge: "Recommended",
      features: [
        "All 5 protocol phases, built from your diagnosis",
        "Monthly recalibration — products re-rank as your skin shifts",
        "Protocol gating — actives unlock only when barrier is ready",
        "Baseline Snapshot + monthly progress score comparison",
        "Swap any product anytime — no questions asked",
        "Ships EU 3–5 business days",
      ],
      gated: ["Clinical-grade device integration"],
    },
    {
      key: "premium",
      label: "Premium Strategy",
      tagline: "Full routine + clinical device",
      price: "€149",
      priceNote: "/ month",
      perDay: "€4.97",
      features: [
        "Everything in Full Protocol",
        "Clinical-grade device (LED or microcurrent) matched to your phase",
        "Priority recalibration within 48h of any skin event",
        "Exclusive ingredient unlocks (prescription-adjacent actives)",
      ],
      gated: [],
    },
  ];

interface Props {
  result: DiagnosisResult;
}

// ── Slide 5A: Why Strategy Matters ──
function Slide5A({
  onNext,
  pattern,
  topConcern,
  topAxisName,
  topScore,
  signalCount,
}: {
  onNext: () => void;
  pattern: string;
  topConcern: string;
  topAxisName: string;
  topScore: number;
  signalCount: number;
}) {
  const recalibrationDate = new Date();
  recalibrationDate.setDate(recalibrationDate.getDate() + 29);
  const dateStr = recalibrationDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  const pillars = [
    {
      icon: FlaskConical,
      title: "Evidence Scaling",
      body: `You answered ${signalCount} signals. Each one added weight to the model. Subscription keeps that evidence accumulating — your confidence score grows every cycle.`,
      accent: "hsl(var(--primary))",
    },
    {
      icon: ShieldCheck,
      title: "Protocol Gating",
      body: "Actives like retinoids and AHA are only unlocked when your barrier signals confirm readiness. Without ongoing assessment, there is no safety logic — just guesswork.",
      accent: "#a78bfa",
    },
    {
      icon: RefreshCw,
      title: "Monthly Recalibration",
      body: "Skin shifts with seasons, hormones, and stress. Your product ranking updates every 30 days based on a 3-question check-in. No new quiz. Just continuous precision.",
      accent: "#34d399",
    },
  ];

  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full">
      <motion.p className="slide-eyebrow mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Why Strategy Matters
      </motion.p>

      <motion.h2
        className="font-display"
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: "0.875rem",
          color: "hsl(var(--foreground))",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        You're not buying skincare.
        <br />
        <em>You're running a protocol.</em>
      </motion.h2>

      <motion.p
        className="slide-body mb-6"
        style={{ lineHeight: 1.6 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        A one-time product match solves today's <strong>{topConcern}</strong>. An adaptive strategy adjusts these formulas as your {topAxisName} levels stabilize next month.
      </motion.p>

      {/* Dynamic Clinical Focus Asset */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border p-5 mb-5 overflow-hidden relative"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
      >
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <p className="slide-eyebrow mb-3" style={{ color: "hsl(var(--primary))" }}>Clinical Focus: {topAxisName}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="w-full bg-border/50 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${topScore}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-full bg-primary rounded-full relative"
            >
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 animate-shimmer" />
            </motion.div>
          </div>
          <span className="ml-4 font-display text-xl font-bold text-foreground">{topScore}</span>
        </div>

        <p className="slide-body text-sm" style={{ color: "hsl(var(--foreground-hint))" }}>
          Your baseline {topAxisName} score is highly active. The adaptive strategy prioritizes this vector first, unlocking stronger actives only when your barrier can tolerate them.
        </p>
      </motion.div>

      {/* Diagnosis summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border p-4 mb-5"
        style={{
          borderColor: "hsl(var(--primary) / 0.3)",
          background: "hsl(var(--primary) / 0.06)",
        }}
      >
        <p className="slide-eyebrow mb-2" style={{ color: "hsl(var(--primary))" }}>
          Your Diagnosis
        </p>
        <div className="flex gap-5 flex-wrap">
          {[
            { label: "Pattern", value: pattern },
            { label: "Top concern", value: topConcern },
            { label: "Signals", value: String(signalCount) },
          ].map((item, i) => (
            <div key={i}>
              <p
                className="font-display"
                style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.1 }}
              >
                {item.value}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "hsl(var(--foreground-hint))", marginTop: "0.1rem" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Value pillars */}
      <div className="space-y-3 mb-5">
        {pillars.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="rounded-2xl border p-4"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="rounded-xl p-1.5" style={{ background: `${pillar.accent}18` }}>
                  <Icon size={16} style={{ color: pillar.accent }} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                  {pillar.title}
                </p>
              </div>
              <p className="slide-body" style={{ lineHeight: 1.55 }}>
                {pillar.body}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Scheduled future event */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border p-4 mb-6 flex items-center gap-3"
        style={{
          borderColor: "hsl(var(--primary) / 0.3)",
          background: "hsl(var(--primary) / 0.06)",
        }}
      >
        <Calendar size={20} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
            First recalibration: {dateStr}
          </p>
          <p style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.4 }}>
            Your protocol re-ranks in 29 days. Your diagnosis signals are ready.
          </p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 min-h-[56px] touch-manipulation"
        style={{
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          fontWeight: 700,
          fontSize: "1rem",
          border: "none",
          cursor: "pointer",
        }}
      >
        Choose Your Strategy →
      </motion.button>

      <TrustSignals />
    </div>
  );
}

// ── Slide 5B: Choose Strategy Level ──
function Slide5B({ onBack, signalCount, result }: { onBack: () => void; signalCount: number; result: DiagnosisResult }) {
  const { setTier } = useDiagnosisStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("full");
  const selected = PLANS.find((p) => p.key === selectedPlan)!;

  const handleSelect = (key: PlanKey) => {
    setSelectedPlan(key);
    const tierMap: Record<PlanKey, Tier> = { entry: "Entry", full: "Full", premium: "Premium" };
    setTier(tierMap[key]);
  };

  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full">
      <button
        onClick={onBack}
        style={{
          fontSize: "0.8125rem",
          color: "hsl(var(--foreground-hint))",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: "1.25rem",
          padding: 0,
          alignSelf: "flex-start",
        }}
      >
        ← Why this matters
      </button>

      <p className="slide-eyebrow mb-2">Choose Strategy Level</p>

      <h2
        className="font-display"
        style={{
          fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: "0.5rem",
          color: "hsl(var(--foreground))",
        }}
      >
        Three depths. One diagnostic vector.
      </h2>

      {/* Progress investment anchor */}
      <div
        className="rounded-xl border px-3 py-2.5 mb-5 flex items-center gap-2"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}
      >
        <span style={{ fontSize: "1rem" }}>🧬</span>
        <p className="slide-body" style={{ lineHeight: 1.4 }}>
          Your diagnosis captured <strong>{signalCount} skin signals</strong>. Entry fulfills today. Subscription keeps them active next month.
        </p>
      </div>

      {/* Plan cards */}
      <div className="space-y-3 mb-5">
        {PLANS.map((plan) => (
          <PlanCard key={plan.key} plan={plan} selected={selectedPlan === plan.key} onSelect={() => handleSelect(plan.key)} />
        ))}
      </div>

      {/* Recalibration detail */}
      <AnimatePresence>
        {(selectedPlan === "full" || selectedPlan === "premium") && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border p-3.5 mb-5"
            style={{
              borderColor: "hsl(var(--primary) / 0.25)",
              background: "hsl(var(--primary) / 0.04)",
            }}
          >
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "hsl(var(--primary))", marginBottom: "0.3rem" }}>
              How monthly recalibration works
            </p>
            <p className="slide-body" style={{ lineHeight: 1.55 }}>
              Every 30 days, answer 3 check-in questions. Your precision signals re-weight automatically.
              Products re-rank. Actives gate or unlock based on barrier readiness. No new quiz. No manual adjustments.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-2xl py-4 mb-2 min-h-[56px] touch-manipulation"
        style={{
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          fontWeight: 700,
          fontSize: "1rem",
          border: "none",
          cursor: "pointer",
        }}
      >
        Notify Me When Available — {selected.price}
        {selected.priceNote ? ` ${selected.priceNote}` : ""}
        {selected.perDay ? ` (${selected.perDay}/day)` : ""}
      </motion.button>

      {/* Soft cancel */}
      <p style={{
        fontSize: "0.75rem",
        color: "hsl(var(--foreground-hint))",
        textAlign: "center",
        lineHeight: 1.5,
        marginBottom: "0.75rem",
      }}>
        Pause, adjust, or cancel anytime. Your progress history and diagnosis never reset.
      </p>

      {/* Escape hatch */}
      {selectedPlan !== "entry" && (
        <button
          onClick={() => handleSelect("entry")}
          style={{
            fontSize: "0.8125rem",
            color: "hsl(var(--foreground-hint))",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "center",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            display: "block",
            width: "100%",
          }}
        >
          Start with Entry (€49, one-time, no subscription)
        </button>
      )}

      {/* Restart */}
      <div className="mt-6 text-center">
        <Link
          to="/diagnosis"
          className="text-primary hover:underline"
          style={{ fontSize: "0.875rem" }}
          onClick={() => useDiagnosisStore.getState().reset()}
        >
          ← Restart Assessment
        </Link>
      </div>

      <TrustSignals />
    </div>
  );
}

// ── Root component ──
const SlideSubscribe = ({ result }: Props) => {
  const [subSlide, setSubSlide] = useState<"5A" | "5B">("5A");

  const topAxis = result.primary_concerns[0] || "sen";
  const topAxisName = AXIS_LABELS[topAxis];
  const topScore = Math.round(result.axis_scores[topAxis]);
  const topConcern = `${topAxisName} (${topScore}/100)`;
  const patternName = result.detected_patterns[0]?.pattern.name_en ?? "Balanced Profile";
  const signalCount = result.radar_chart_data.filter((d) => d.score > 0).length;

  return (
    <div className="results-slide flex flex-1 flex-col overflow-y-auto">
      <AnimatePresence mode="wait">
        {subSlide === "5A" ? (
          <motion.div
            key="5A"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Slide5A
              onNext={() => setSubSlide("5B")}
              pattern={patternName}
              topConcern={topConcern}
              topAxisName={topAxisName}
              topScore={topScore}
              signalCount={signalCount}
            />
          </motion.div>
        ) : (
          <motion.div
            key="5B"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Slide5B onBack={() => setSubSlide("5A")} signalCount={signalCount} result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Shared components ──

function TrustSignals() {
  return (
    <div
      className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4"
      style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))" }}
    >
      <span>🔬 Dermatologist reviewed</span>
      <span>🔄 Cancel or pause anytime</span>
      <span>📦 Ships EU 3–5 days</span>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: (typeof PLANS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      layout
      onClick={onSelect}
      className="w-full rounded-2xl border p-4 text-left transition-all touch-manipulation"
      style={{
        borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--border))",
        background: selected ? "hsl(var(--primary) / 0.07)" : "hsl(var(--card))",
        boxShadow: selected ? "0 0 0 2px hsl(var(--primary) / 0.25)" : "none",
        outline: "none",
        cursor: "pointer",
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "hsl(var(--foreground))" }}>
            {plan.label}
          </p>
          {plan.badge && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
                fontWeight: 700,
              }}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <div className="text-right">
          <span
            className="font-display"
            style={{ fontSize: "1.375rem", fontWeight: 600, color: "hsl(var(--foreground))" }}
          >
            {plan.price}
          </span>
          {plan.priceNote && (
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))", marginLeft: "0.25rem" }}>
              {plan.priceNote}
            </span>
          )}
          {plan.perDay && selected && (
            <p style={{ fontSize: "0.6875rem", color: "hsl(var(--primary))", marginTop: "0.1rem" }}>
              {plan.perDay}/day
            </p>
          )}
        </div>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground-hint))", marginBottom: selected ? "0.75rem" : 0 }}>
        {plan.tagline}
      </p>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 mb-3">
              {plan.features.map((f, i) => (
                <p key={i} className="slide-body flex gap-1.5 items-start" style={{ lineHeight: 1.4 }}>
                  <span style={{ color: "hsl(var(--primary))", flexShrink: 0 }}>✓</span>
                  {f}
                </p>
              ))}
            </div>
            {plan.gated.length > 0 && (
              <div
                className="rounded-xl border p-2.5 space-y-1"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.4)" }}
              >
                <p className="slide-eyebrow mb-1" style={{ letterSpacing: "0.1em" }}>
                  Unlocks in higher tier
                </p>
                {plan.gated.map((g, i) => (
                  <p key={i} className="slide-body" style={{ opacity: 0.6, display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0 }}>🔒</span>{g}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default SlideSubscribe;
