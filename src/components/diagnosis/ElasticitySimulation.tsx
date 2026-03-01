import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";

interface ElasticitySimulationProps {
  value: number; // 0-3
  onChange: (v: number) => void;
}

const LEVELS = [
  { label: "Firm", description: "Snaps back immediately on release", bounceBackMs: 150, sagDepth: 0 },
  { label: "Mild Loss", description: "Bounces back within 1–2 seconds", bounceBackMs: 500, sagDepth: 0.25 },
  { label: "Moderate", description: "Takes 3–5 seconds to recover", bounceBackMs: 1000, sagDepth: 0.55 },
  { label: "Significant", description: "Skin stays deformed or recovers very slowly", bounceBackMs: 2500, sagDepth: 0.9 },
];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const controls = useAnimation();
  const config = LEVELS[value];

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        // Press phase — indent cheeks
        await controls.start({
          scaleX: 1 - config.sagDepth * 0.28,
          scaleY: 1 - config.sagDepth * 0.18,
          transition: { duration: 0.3, ease: "easeIn" },
        });
        if (cancelled) break;

        // Hold phase
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) break;

        // Release phase — spring bounce-back
        await controls.start({
          scaleX: 1,
          scaleY: 1,
          transition: {
            type: "spring",
            stiffness: Math.max(400 - config.sagDepth * 350, 60),
            damping: 15 + config.sagDepth * 20,
            duration: config.bounceBackMs / 1000,
          },
        });
        if (cancelled) break;

        // Pause between loops
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
  }, [value, controls, config]);

  const speedPercent = 100 - config.sagDepth * 80;

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Elasticity Test
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Select how quickly your skin bounces back after being gently pressed
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* SVG face with animated cheeks */}
        <svg
          width="160"
          height="200"
          viewBox="0 0 160 200"
          className="overflow-visible"
        >
          {/* Face outline */}
          <ellipse
            cx="80"
            cy="100"
            rx="68"
            ry="85"
            fill="transparent"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          {/* Left cheek — animates */}
          <motion.ellipse
            cx="42"
            cy="115"
            rx="26"
            ry="20"
            className="fill-primary/20 stroke-primary"
            strokeWidth="1.5"
            animate={controls}
            style={{ originX: "42px", originY: "115px" }}
          />
          {/* Right cheek — mirrors */}
          <motion.ellipse
            cx="118"
            cy="115"
            rx="26"
            ry="20"
            className="fill-primary/20 stroke-primary"
            strokeWidth="1.5"
            animate={controls}
            style={{ originX: "118px", originY: "115px" }}
          />
        </svg>

        {/* Description of current level */}
        <p className="text-center text-sm text-muted-foreground max-w-xs">
          {config.description}
        </p>

        {/* Bounce speed indicator bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Bounce speed</span>
            <span className="text-primary">
              {config.bounceBackMs < 300
                ? "Instant"
                : config.bounceBackMs < 700
                ? "Fast"
                : config.bounceBackMs < 1500
                ? "Slow"
                : "Very slow"}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${speedPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Level selector buttons */}
        <div className="flex w-full gap-1">
          {LEVELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-md px-1 py-2.5 text-center transition-all min-h-[44px] touch-manipulation ${
                value === i
                  ? i === 0
                    ? "bg-muted text-foreground"
                    : i === 1
                    ? "bg-severity-mild/20 text-severity-mild"
                    : i === 2
                    ? "bg-severity-moderate/20 text-severity-moderate"
                    : "bg-severity-severe/20 text-severity-severe"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
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
