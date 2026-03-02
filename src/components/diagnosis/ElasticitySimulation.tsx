import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";
import fingerImg from "@/assets/finger-press.png";

interface ElasticitySimulationProps {
  value: number; // 0-3
  onChange: (v: number) => void;
}

const LEVELS = [
  { label: "Firm", description: "Skin snaps back immediately — no visible deformation", recoveryRange: "~0.2–0.4s", recoverySec: 0.45, recoveryLabel: "Instant", speedLabel: "Fast" },
  { label: "Mild", description: "Skin returns within 1–2 seconds after release", recoveryRange: "~0.7–1.2s", recoverySec: 1.2, recoveryLabel: "~1–2s recovery", speedLabel: "Medium" },
  { label: "Moderate", description: "Skin takes 3–5 seconds to recover its shape", recoveryRange: "~1.8–2.5s", recoverySec: 2.5, recoveryLabel: "~3–5s recovery", speedLabel: "Slow" },
  { label: "Significant", description: "Skin stays deformed or recovers very slowly", recoveryRange: "~3–5s", recoverySec: 4.8, recoveryLabel: "> 5s recovery", speedLabel: "Very slow" },
];

const PRESS_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const fingerControls = useAnimation();
  const skinControls = useAnimation();
  const shadowControls = useAnimation();

  const config = LEVELS[value];
  const animating = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  const animatePress = useCallback(async (recoverySec: number) => {
    if (animating.current) return;
    animating.current = true;
    setIsAnimating(true);

    // Phase 1: Press down (220ms)
    await Promise.all([
      fingerControls.start({
        y: 10,
        transition: { duration: 0.22, ease: PRESS_EASE },
      }),
      skinControls.start({
        scaleX: 0.92,
        scaleY: 1.04,
        y: 1,
        transition: { duration: 0.22, ease: PRESS_EASE },
      }),
      shadowControls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.22, ease: PRESS_EASE },
      }),
    ]);

    // Phase 2: Hold (150ms)
    await new Promise((r) => setTimeout(r, 150));

    // Phase 3: Finger lifts (120ms)
    await fingerControls.start({
      y: -6,
      transition: { duration: 0.12, ease: "easeOut" },
    });

    // Phase 4: Skin recovery with single overshoot
    const t = Math.max(recoverySec, 0.3);
    // overshoot at 30% of recovery
    await Promise.all([
      skinControls.start({
        scaleX: 1.01,
        scaleY: 0.995,
        y: 0,
        transition: { duration: t * 0.3, ease: "easeOut" },
      }),
      shadowControls.start({
        opacity: 0.15,
        scale: 0.6,
        transition: { duration: t * 0.3, ease: "easeOut" },
      }),
    ]);
    // settle
    await Promise.all([
      skinControls.start({
        scaleX: 1,
        scaleY: 1,
        y: 0,
        transition: { duration: t * 0.7, ease: [0.25, 0.1, 0.25, 1] },
      }),
      shadowControls.start({
        opacity: 0,
        scale: 0.3,
        transition: { duration: t * 0.7, ease: [0.25, 0.1, 0.25, 1] },
      }),
    ]);

    animating.current = false;
    setIsAnimating(false);
  }, [fingerControls, skinControls, shadowControls]);

  // Auto-play on level change
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      animatePress(LEVELS[value].recoverySec);
    }
  }, [value, animatePress]);

  const handleTap = useCallback(() => {
    animatePress(config.recoverySec);
  }, [animatePress, config]);

  const handleSelect = useCallback((i: number) => {
    onChange(i);
    // auto-play is handled by useEffect
  }, [onChange]);

  const recoveryPct = 100 - value * 25;

  return (
    <LabCard>
      <p className="section-header">Elasticity Test</p>
      <p className="category-description text-sm mb-5">
        Select your skin's firmness level. Each selection auto-plays the test.
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* Level selector */}
        <div className="flex w-full gap-1.5">
          {LEVELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-3 text-center transition-all min-h-[48px] touch-manipulation border ${
                value === i
                  ? i === 0
                    ? "bg-muted text-foreground border-border ring-1 ring-primary/30"
                    : i === 1
                    ? "bg-severity-mild/20 text-severity-mild border-severity-mild/40 ring-1 ring-severity-mild/30"
                    : i === 2
                    ? "bg-severity-moderate/20 text-severity-moderate border-severity-moderate/40 ring-1 ring-severity-moderate/30"
                    : "bg-severity-severe/20 text-severity-severe border-severity-severe/40 ring-1 ring-severity-severe/30"
                  : "bg-secondary/50 text-foreground/70 border-transparent hover:bg-secondary"
              }`}
            >
              <span className="text-xs font-medium">{lvl.label}</span>
            </button>
          ))}
        </div>

        {/* Description + recovery */}
        <div className="text-center space-y-1">
          <p className="text-sm text-foreground/80 max-w-xs leading-relaxed">{config.description}</p>
          <p className="text-xs text-primary font-medium">{config.recoveryRange} recovery</p>
        </div>

        {/* 3D Press Interaction */}
        <div
          className="relative select-none cursor-pointer mt-2"
          onClick={handleTap}
          role="button"
          tabIndex={0}
          aria-label="Tap to replay elasticity test"
        >
          {/* Face silhouette */}
          <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
            <ellipse cx="100" cy="105" rx="58" ry="72" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="1" />
            {/* Eyes */}
            <ellipse cx="82" cy="88" rx="6" ry="3" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="0.7" />
            <ellipse cx="118" cy="88" rx="6" ry="3" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="0.7" />
            {/* Nose */}
            <path d="M 97 93 L 100 105 L 103 105" fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="0.5" />
            {/* Mouth */}
            <path d="M 90 125 Q 100 130 110 125" fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="0.7" />
          </svg>

          {/* Cheek skin target */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 52,
              height: 42,
              left: 28,
              top: 98,
              background: "hsl(var(--primary) / 0.06)",
              border: "1px solid hsl(var(--primary) / 0.15)",
              transformOrigin: "center center",
            }}
            animate={skinControls}
          />

          {/* Indentation shadow (visible on press) */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 36,
              height: 28,
              left: 36,
              top: 105,
              background: "radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, transparent 70%)",
              boxShadow: "inset 0 10px 18px rgba(0,0,0,0.22), inset 0 2px 6px rgba(0,0,0,0.14)",
              borderRadius: "50%",
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={shadowControls}
          />

          {/* Upper edge highlight (subtle) */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 30,
              height: 8,
              left: 39,
              top: 98,
              background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
              borderRadius: "50%",
            }}
            animate={{ opacity: isAnimating ? 0.6 : 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* 3D Finger */}
          <motion.img
            src={fingerImg}
            alt="Finger pressing skin"
            className="absolute pointer-events-none"
            style={{
              width: 52,
              height: 52,
              left: 28,
              top: 48,
              transform: "rotate(160deg)",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
            }}
            initial={{ y: -6 }}
            animate={fingerControls}
          />

          {/* Cheek hover hint */}
          <div
            className="absolute text-[9px] text-foreground/30 text-center"
            style={{ left: 14, top: 148, width: 80 }}
          >
            Tap cheek to replay
          </div>
        </div>

        {/* Microcopy */}
        <p className="text-[10px] text-foreground/40 -mt-2">
          Tap to replay · Selection auto-plays
        </p>

        {/* Bounce speed bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-foreground/60">Bounce speed</span>
            <span className="text-primary font-medium">{config.speedLabel}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${recoveryPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>
    </LabCard>
  );
};

export default ElasticitySimulation;
