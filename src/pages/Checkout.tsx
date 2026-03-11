import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Lock, Unlock, ArrowLeft } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import type { Tier } from "@/engine/types";

const PLAN_DETAILS: Record<Tier, { price: string; includes: string[]; color: string }> = {
  Entry: {
    price: "€49 / month",
    includes: [
      "5-Phase personalised product protocol",
      "Monthly axis recalibration",
      "Active ingredient gating",
    ],
    color: "hsl(var(--border))",
  },
  Full: {
    price: "€89 / month",
    includes: [
      "5-Phase personalised product protocol",
      "Monthly axis recalibration",
      "Active ingredient gating",
      "Microbiome & advanced barrier ampoule",
    ],
    color: "hsl(var(--primary) / 0.6)",
  },
  Premium: {
    price: "€149 / month",
    includes: [
      "5-Phase personalised product protocol",
      "Monthly axis recalibration",
      "Active ingredient gating",
      "Microbiome & advanced barrier ampoule",
      "Bioheal collagen peptide serum",
      "Clinical EMS/LED device (Month 2 reward)",
    ],
    color: "hsl(var(--primary))",
  },
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storeTier = useDiagnosisStore((s) => s.selectedTier);

  // Accept tier from navigation state (set by startProtocol) or fall back to store
  const tier: Tier = (location.state as { tier?: Tier })?.tier ?? storeTier;
  const deviceLocked: boolean = (location.state as { deviceLocked?: boolean })?.deviceLocked ?? true;

  if (!tier || !PLAN_DETAILS[tier]) {
    navigate("/");
    return null;
  }

  const plan = PLAN_DETAILS[tier];

  return (
    <div className="relative min-h-screen bg-background">
      <SilkBackground />
      <Navbar />

      <div className="flex min-h-screen flex-col items-center justify-start px-4 sm:px-6 pt-28 pb-16">
        <div className="mx-auto w-full max-w-[520px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Back link */}
            <button
              onClick={() => navigate(-1)}
              className="mb-10 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Protocol
            </button>

            {/* Luxury brand tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: "'RIDIBatang', 'Georgia', 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                fontWeight: 400,
                color: "#D1D1D1",
                lineHeight: 1.5,
                letterSpacing: "0.01em",
                marginBottom: "2rem",
                borderLeft: "2px solid hsl(var(--primary) / 0.5)",
                paddingLeft: "1rem",
              }}
            >
              "K-Beauty innovation, recalibrated for your European lifestyle."
            </motion.p>

            {/* Header */}
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "hsl(var(--primary))" }}
            >
              Order Summary
            </p>
            <h1 className="font-display text-3xl text-foreground mb-1">
              {tier} Protocol
            </h1>
            <p className="text-2xl font-bold text-foreground mb-6">{plan.price}</p>

            {/* Device status banner */}
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-4 mb-8"
              style={{
                background: deviceLocked
                  ? "hsl(var(--muted) / 0.5)"
                  : "hsl(var(--primary) / 0.1)",
                border: `1px solid ${deviceLocked ? "hsl(var(--border))" : "hsl(var(--primary) / 0.4)"}`,
              }}
            >
              <div
                className="flex-shrink-0 mt-0.5 rounded-full p-1.5"
                style={{
                  background: deviceLocked ? "hsl(var(--muted))" : "hsl(var(--primary) / 0.15)",
                  opacity: deviceLocked ? 0.5 : 1,
                }}
              >
                {deviceLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Unlock className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {deviceLocked
                    ? "Dermatological Safety Logic · Locked for Month 1"
                    : "Barrier Stable · Clinical Device Eligible"}
                </p>
                <p className="text-xs" style={{ color: "#D1D1D1", lineHeight: 1.6 }}>
                  {deviceLocked
                    ? "Your barrier score is still building. The EMS/LED device ships once barrier stability is confirmed — this protects against device-induced sensitisation during the repair phase."
                    : "Your barrier score qualifies for immediate device access. The clinical device ships with your Month 1 order."}
                </p>
                {deviceLocked && (
                  <p
                    className="mt-2 text-xs"
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      color: "hsl(var(--primary))",
                      letterSpacing: "0.05em",
                    }}
                  >
                    bar_score &lt; 50 → DEVICE_GATE: ACTIVE
                  </p>
                )}
              </div>
            </div>

            {/* What's included */}
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: "hsl(var(--card))",
                border: `1px solid ${plan.color}`,
              }}
            >
              <p className="text-sm font-semibold text-foreground mb-4">What's included</p>
              <ul className="space-y-3">
                {plan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety note for Premium */}
            {tier === "Premium" && (
              <div
                className="rounded-xl px-4 py-4 mb-8 text-xs"
                style={{
                  background: "hsl(var(--muted) / 0.4)",
                  borderLeft: "3px solid hsl(var(--primary) / 0.4)",
                  lineHeight: 1.7,
                  color: "#D1D1D1",
                }}
              >
                <strong className="text-foreground">Lease-to-own safety:</strong> Clinical device
                ships in Month 2 after barrier readiness is confirmed. Full ownership transfers
                after 3 months. No surprise charges.
              </div>
            )}

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl py-4 text-base font-semibold text-primary-foreground"
              style={{ background: "hsl(var(--primary))" }}
            >
              Confirm & Start {tier} Protocol
            </motion.button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Cancel anytime · No lock-in · Recalibrated monthly to your skin data
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
