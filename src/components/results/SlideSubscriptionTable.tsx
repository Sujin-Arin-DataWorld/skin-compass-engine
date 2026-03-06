import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { DiagnosisResult, Tier } from "@/engine/types";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore, translations } from "@/store/i18nStore";

interface Props {
  result: DiagnosisResult;
}

const TIERS: {
  tier: Tier;
  label: string;
  price: number;
  sub?: string;
  features: { text: string; value: string; highlight?: boolean }[];
  recommended?: boolean;
  cta: string;
}[] = [
    {
      tier: "Entry",
      label: "Entry",
      price: 49,
      features: [
        { text: "5-Phase Product Bundle", value: "✓" },
        { text: "Monthly Recalibration", value: "✓" },
        { text: "Ingredient Gating", value: "✓" },
        { text: "Clinical Device", value: "✕" },
      ],
      cta: "Start My Protocol",
    },
    {
      tier: "Full",
      label: "Full Protocol",
      price: 89,
      recommended: true,
      features: [
        { text: "5-Phase Product Bundle", value: "✓" },
        { text: "Monthly Recalibration", value: "✓" },
        { text: "Ingredient Gating", value: "✓" },
        { text: "Clinical Device", value: "✕" },
      ],
      cta: "Start My Protocol",
    },
    {
      tier: "Premium",
      label: "Premium Strategy",
      price: 149,
      sub: "Includes €120 Clinical Device",
      features: [
        { text: "5-Phase Product Bundle", value: "✓" },
        { text: "Monthly Recalibration", value: "✓" },
        { text: "Ingredient Gating", value: "✓" },
        { text: "Clinical Device", value: "Month 2 Reward", highlight: true },
      ],
      cta: "Start My Protocol",
    },
  ];

const SlideSubscriptionTable = ({ result }: Props) => {
  const navigate = useNavigate();
  const setTier = useDiagnosisStore((s) => s.setTier);
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;

  const barrierScore = Math.round(result?.axis_scores.bar ?? 0);
  const sensitivityScore = Math.round(result?.axis_scores.sen ?? 0);
  const isLocked = barrierScore < 50 || sensitivityScore > 70;

  const startProtocol = (tier: Tier) => {
    setTier(tier);
    navigate("/checkout", { state: { tier, deviceLocked: isLocked } });
  };

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[860px]">
        {/* Header */}
        <motion.p
          className="slide-eyebrow text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {t.results.chooseSubscription}
        </motion.p>
        <motion.p
          className="slide-body mt-1 text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          style={{ color: "#D1D1D1" }}
        >
          {t.results.adaptiveDelivery}
        </motion.p>

        {/* Device lock notice */}
        {isLocked && (
          <motion.div
            className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "hsl(var(--muted) / 0.4)",
              border: "1px solid hsl(var(--border) / 0.5)",
            }}
          >
            <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--foreground-hint))" }} />
            <p style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.4 }}>
              {t.results.deviceGated.replace("{score}", barrierScore.toString())}
            </p>
          </motion.div>
        )}

        {/* Pricing grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl p-5 flex flex-col items-stretch${tier.recommended ? " md:-translate-y-2" : ""}`}
              style={
                tier.recommended
                  ? {
                    background:
                      "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.03) 100%)",
                    boxShadow: "0 8px 30px rgba(200,150,60,0.08)",
                    border: "1px solid hsl(var(--primary) / 0.18)",
                  }
                  : {
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }
              }
            >
              {/* Badge */}
              {tier.recommended && (
                <div className="relative mb-4">
                  <span className="absolute -top-8 left-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                    {t.results.mostRecommended}
                  </span>
                </div>
              )}

              {/* Price header */}
              <div>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {tier.tier === "Entry" ? t.results.entry : tier.tier === "Full" ? t.results.fullProtocol : t.results.premiumStrategy}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span
                    className="text-3xl font-bold"
                    style={{ fontFamily: "Courier New, monospace", color: "hsl(var(--foreground))" }}
                  >
                    €{tier.price}
                  </span>
                  <span className="text-xs" style={{ color: "hsl(var(--foreground-hint))" }}>
                    / month
                  </span>
                </div>
                {tier.sub && (
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--foreground-hint))" }}>
                    {tier.sub}
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="mt-4 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-center justify-between"
                    style={{ fontSize: "0.8375rem", color: "#D1D1D1" }}
                  >
                    <span>{f.text}</span>
                    <span
                      style={{
                        fontWeight: f.highlight ? 600 : 400,
                        color: f.highlight ? "hsl(var(--primary))" : "hsl(var(--foreground-hint))",
                        fontSize: f.highlight ? "0.75rem" : "inherit",
                      }}
                    >
                      {f.value}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => startProtocol(tier.tier)}
                className="mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200"
                style={
                  tier.recommended
                    ? {
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }
                    : {
                      background: "transparent",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }
                }
              >
                {t.results.startProtocol}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Premium device safety note */}
        <motion.div
          className="mt-6 rounded-xl px-5 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
          style={{
            background: "hsl(var(--muted) / 0.35)",
            border: "1px solid hsl(var(--border) / 0.4)",
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "hsl(var(--foreground))",
              marginBottom: "0.25rem",
            }}
          >
            {t.results.premiumTiming}
          </p>
          <p style={{ fontSize: "0.775rem", color: "#D1D1D1", lineHeight: 1.55 }}>
            {t.results.premiumTimingDesc}
          </p>
          <p
            style={{
              fontFamily: "Courier New, monospace",
              fontSize: "0.7rem",
              color: "hsl(var(--foreground-hint))",
              marginTop: "0.5rem",
            }}
          >
            bar_score={barrierScore} · sen_score={sensitivityScore} · DEVICE_GATE:{" "}
            {isLocked ? "ACTIVE" : "CLEARED"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SlideSubscriptionTable;
