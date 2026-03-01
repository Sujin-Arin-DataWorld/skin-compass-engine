import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";

interface ElasticitySimulationProps {
  value: number; // 0-3
  onChange: (v: number) => void;
}

const LEVELS = [
  { label: "Firm", description: "Skin snaps back immediately — no visible deformation", bounceBackMs: 150, sagDepth: 0, recoveryLabel: "Instant" },
  { label: "Mild Loss", description: "Skin returns within 1–2 seconds after release", bounceBackMs: 500, sagDepth: 0.25, recoveryLabel: "Fast" },
  { label: "Moderate", description: "Skin takes 3–5 seconds to recover its shape", bounceBackMs: 1000, sagDepth: 0.55, recoveryLabel: "Slow" },
  { label: "Significant", description: "Skin stays deformed or recovers very slowly", bounceBackMs: 2500, sagDepth: 0.9, recoveryLabel: "Very slow" },
];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const controls = useAnimation();
  const config = LEVELS[value];
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    async function loop() {
      while (!cancelled.current) {
        // Press phase — pinch cheek inward
        await controls.start({
          scaleX: 1 - config.sagDepth * 0.22,
          scaleY: 1 + config.sagDepth * 0.08,
          y: config.sagDepth * 6,
          transition: { duration: 0.35, ease: "easeIn" },
        });
        if (cancelled.current) break;

        // Hold phase
        await new Promise((r) => setTimeout(r, 700));
        if (cancelled.current) break;

        // Release phase — spring bounce-back
        await controls.start({
          scaleX: 1,
          scaleY: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: Math.max(400 - config.sagDepth * 350, 50),
            damping: 12 + config.sagDepth * 25,
            duration: config.bounceBackMs / 1000,
          },
        });
        if (cancelled.current) break;

        // Pause between loops
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    loop();
    return () => {
      cancelled.current = true;
    };
  }, [value, controls, config]);

  const recoveryPct = 100 - config.sagDepth * 85;

  return (
    <LabCard>
      <p className="section-header">
        Elasticity Test
      </p>
      <p className="category-description text-sm mb-5">
        Select how quickly your skin bounces back after being gently pinched on the cheek
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* SVG face with single animated cheek pinch */}
        <div className="relative">
          <svg
            width="180"
            height="220"
            viewBox="0 0 180 220"
            className="overflow-visible"
          >
            {/* Face outline */}
            <ellipse
              cx="90"
              cy="110"
              rx="62"
              ry="78"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--foreground) / 0.2)"
              strokeWidth="1.5"
            />
            {/* Eyes */}
            <ellipse cx="70" cy="95" rx="8" ry="4" fill="none" stroke="hsl(var(--foreground) / 0.25)" strokeWidth="0.8" />
            <ellipse cx="110" cy="95" rx="8" ry="4" fill="none" stroke="hsl(var(--foreground) / 0.25)" strokeWidth="0.8" />
            {/* Nose */}
            <path d="M 87 100 L 90 115 L 93 115" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="0.6" />
            {/* Mouth */}
            <path d="M 78 135 Q 90 142 102 135" fill="none" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="0.8" />

            {/* Pinch target — left cheek with clear visual */}
            <motion.g animate={controls} style={{ originX: "56px", originY: "120px" }}>
              <ellipse
                cx="56"
                cy="120"
                rx="20"
                ry="16"
                fill="hsl(var(--primary) / 0.12)"
                stroke="hsl(var(--primary) / 0.5)"
                strokeWidth="1.2"
                strokeDasharray={value > 0 ? "none" : "4 3"}
              />
              {/* Pinch finger indicators */}
              <motion.g
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <circle cx="36" cy="120" r="3" fill="hsl(var(--foreground) / 0.15)" />
                <circle cx="76" cy="120" r="3" fill="hsl(var(--foreground) / 0.15)" />
                <path d="M 39 120 L 50 120" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
                <path d="M 62 120 L 73 120" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
              </motion.g>
            </motion.g>
          </svg>

          {/* Recovery timer label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
            {config.bounceBackMs < 300
              ? "< 0.5s recovery"
              : config.bounceBackMs < 700
              ? "~1–2s recovery"
              : config.bounceBackMs < 1500
              ? "~3–5s recovery"
              : "> 5s recovery"}
          </div>
        </div>

        {/* Description of current level */}
        <p className="text-center text-sm text-foreground/80 max-w-xs leading-relaxed">
          {config.description}
        </p>

        {/* Recovery speed indicator bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-foreground/60">Bounce speed</span>
            <span className="text-primary font-medium">
              {config.recoveryLabel}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${recoveryPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Level selector buttons */}
        <div className="flex w-full gap-1.5">
          {LEVELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-3 text-center transition-all min-h-[48px] touch-manipulation border ${
                value === i
                  ? i === 0
                    ? "bg-muted text-foreground border-border"
                    : i === 1
                    ? "bg-severity-mild/20 text-severity-mild border-severity-mild/40"
                    : i === 2
                    ? "bg-severity-moderate/20 text-severity-moderate border-severity-moderate/40"
                    : "bg-severity-severe/20 text-severity-severe border-severity-severe/40"
                  : "bg-secondary/50 text-foreground/70 border-transparent hover:bg-secondary"
              }`}
            >
              <span className="text-xs font-medium">{lvl.label}</span>
            </button>
          ))}
        </div>
      </div>
    </LabCard>
  );
};

export default ElasticitySimulation;
