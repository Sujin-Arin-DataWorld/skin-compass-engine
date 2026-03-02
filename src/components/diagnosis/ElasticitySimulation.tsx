import { useEffect, useRef, useState } from "react";
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
  const cheekControls = useAnimation();
  const fingerControls = useAnimation();
  const config = LEVELS[value];
  const cancelled = useRef(false);
  const [hasPlayedHint, setHasPlayedHint] = useState(false);

  useEffect(() => {
    // One-time hint animation on first mount
    if (!hasPlayedHint) {
      setHasPlayedHint(true);
      (async () => {
        await new Promise((r) => setTimeout(r, 600));
        await Promise.all([
          fingerControls.start({ x: 3, transition: { duration: 0.4, ease: "easeInOut" } }),
          cheekControls.start({
            scaleX: 0.97, transition: { duration: 0.4, ease: "easeInOut" },
          }),
        ]);
        await new Promise((r) => setTimeout(r, 200));
        await Promise.all([
          fingerControls.start({ x: 0, transition: { duration: 0.35, ease: "easeOut" } }),
          cheekControls.start({
            scaleX: 1, transition: { duration: 0.35, ease: "easeOut" },
          }),
        ]);
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cancelled.current = false;

    async function loop() {
      // Initial delay before first cycle
      await new Promise((r) => setTimeout(r, 800));

      while (!cancelled.current) {
        const depth = config.sagDepth;
        const fingerInset = 2 + depth * 3; // 2–5px inward motion

        // Press phase — finger moves in, cheek compresses
        await Promise.all([
          fingerControls.start({
            x: fingerInset,
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
          }),
          cheekControls.start({
            scaleX: 1 - depth * 0.18,
            scaleY: 1 + depth * 0.06,
            y: depth * 4,
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
          }),
        ]);
        if (cancelled.current) break;

        // Hold
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled.current) break;

        // Release — finger retracts, cheek rebounds at configured speed
        const reboundDuration = Math.max(config.bounceBackMs / 1000, 0.3);
        await Promise.all([
          fingerControls.start({
            x: 0,
            transition: { duration: 0.3, ease: "easeOut" },
          }),
          cheekControls.start({
            scaleX: 1,
            scaleY: 1,
            y: 0,
            transition: {
              duration: reboundDuration,
              ease: [0.4, 0, 0.2, 1],
            },
          }),
        ]);
        if (cancelled.current) break;

        // Pause
        await new Promise((r) => setTimeout(r, 1400));
      }
    }

    loop();
    return () => { cancelled.current = true; };
  }, [value, cheekControls, fingerControls, config]);

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
        {/* SVG face with finger + cheek pinch */}
        <div className="relative">
          <svg
            width="200"
            height="230"
            viewBox="0 0 200 230"
            className="overflow-visible"
          >
            {/* Face outline */}
            <ellipse
              cx="100"
              cy="115"
              rx="62"
              ry="78"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--foreground) / 0.18)"
              strokeWidth="1.2"
            />
            {/* Eyes */}
            <ellipse cx="80" cy="100" rx="7" ry="3.5" fill="none" stroke="hsl(var(--foreground) / 0.22)" strokeWidth="0.8" />
            <ellipse cx="120" cy="100" rx="7" ry="3.5" fill="none" stroke="hsl(var(--foreground) / 0.22)" strokeWidth="0.8" />
            {/* Nose */}
            <path d="M 97 105 L 100 118 L 103 118" fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="0.6" />
            {/* Mouth */}
            <path d="M 88 140 Q 100 146 112 140" fill="none" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="0.8" />

            {/* Cheek target zone */}
            <motion.g
              animate={cheekControls}
              style={{ originX: "62px", originY: "125px" }}
            >
              <ellipse
                cx="62"
                cy="125"
                rx="18"
                ry="14"
                fill="hsl(var(--primary) / 0.1)"
                stroke="hsl(var(--primary) / 0.35)"
                strokeWidth="1"
                strokeDasharray={value === 0 ? "3 2.5" : "none"}
              />
            </motion.g>

            {/* Finger indicator — minimal line-art style */}
            <motion.g
              animate={fingerControls}
              style={{ originX: "28px", originY: "125px" }}
            >
              {/* Fingertip — soft oval */}
              <ellipse
                cx="38"
                cy="125"
                rx="5"
                ry="7"
                fill="none"
                stroke="hsl(var(--primary) / 0.55)"
                strokeWidth="0.9"
              />
              {/* Finger body — tapered line */}
              <path
                d="M 33 121 L 22 116 M 33 129 L 22 134"
                fill="none"
                stroke="hsl(var(--primary) / 0.35)"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
              {/* Nail hint */}
              <path
                d="M 35.5 121 Q 38 119 40.5 121"
                fill="none"
                stroke="hsl(var(--primary) / 0.25)"
                strokeWidth="0.5"
              />
              {/* Direction hint line */}
              <line
                x1="44"
                y1="125"
                x2="52"
                y2="125"
                stroke="hsl(var(--foreground) / 0.08)"
                strokeWidth="0.5"
                strokeDasharray="1.5 1.5"
              />
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

        {/* Description */}
        <p className="text-center text-sm text-foreground/80 max-w-xs leading-relaxed">
          {config.description}
        </p>

        {/* Recovery speed bar */}
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
