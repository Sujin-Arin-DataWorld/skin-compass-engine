import { useCallback, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";

interface ElasticitySimulationProps {
  value: number; // 0-3
  onChange: (v: number) => void;
}

const LEVELS = [
  { label: "Firm", description: "Skin snaps back immediately — no visible deformation", recoveryRange: "~0.2–0.4s", recoverySec: 0.3, sagDepth: 0.05, recoveryLabel: "Instant", speedLabel: "Fast" },
  { label: "Mild", description: "Skin returns within 1–2 seconds after release", recoveryRange: "~0.7–1.2s", recoverySec: 1.0, sagDepth: 0.3, recoveryLabel: "~1–2s recovery", speedLabel: "Medium" },
  { label: "Moderate", description: "Skin takes 3–5 seconds to recover its shape", recoveryRange: "~1.8–2.5s", recoverySec: 2.2, sagDepth: 0.6, recoveryLabel: "~3–5s recovery", speedLabel: "Slow" },
  { label: "Significant", description: "Skin stays deformed or recovers very slowly", recoveryRange: "~3–5s", recoverySec: 4.0, sagDepth: 0.9, recoveryLabel: "> 5s recovery", speedLabel: "Very slow" },
];

const PINCH_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const skinControls = useAnimation();
  const leftFingerControls = useAnimation();
  const rightFingerControls = useAnimation();

  const config = LEVELS[value];
  const animating = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const animatePinch = useCallback(async (depth: number, recoverySec: number) => {
    if (animating.current) return;
    animating.current = true;
    setIsAnimating(true);

    const pinchInset = 4 + depth * 8;
    const skinCompress = Math.max(depth * 0.15, 0.02);

    // Phase 1: Pinch inward
    await Promise.all([
      leftFingerControls.start({ x: pinchInset, transition: { duration: 0.3, ease: PINCH_EASE } }),
      rightFingerControls.start({ x: -pinchInset, transition: { duration: 0.3, ease: PINCH_EASE } }),
      skinControls.start({ scaleX: 1 - skinCompress, scaleY: 1 + skinCompress * 0.4, transition: { duration: 0.3, ease: PINCH_EASE } }),
    ]);

    // Phase 2: Hold
    await new Promise((r) => setTimeout(r, 400));

    // Phase 3: Release fingers
    await Promise.all([
      leftFingerControls.start({ x: 0, transition: { duration: 0.2, ease: "easeOut" } }),
      rightFingerControls.start({ x: 0, transition: { duration: 0.2, ease: "easeOut" } }),
    ]);

    // Phase 4: Skin recovery
    const recoveryDuration = Math.max(recoverySec, 0.25);
    await skinControls.start({
      scaleX: 1, scaleY: 1,
      transition: { duration: recoveryDuration, ease: [0.25, 0.1, 0.25, 1] },
    });

    animating.current = false;
    setIsAnimating(false);
  }, [leftFingerControls, rightFingerControls, skinControls]);

  const handleTest = useCallback(() => {
    animatePinch(config.sagDepth, config.recoverySec);
  }, [animatePinch, config]);

  const recoveryPct = 100 - config.sagDepth * 85;

  return (
    <LabCard>
      <p className="section-header">Elasticity Test</p>
      <p className="category-description text-sm mb-5">
        Select your skin's firmness level, then tap the cheek to see recovery speed
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* ── Level selector buttons ── */}
        <div className="flex w-full gap-1.5">
          {LEVELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
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

        {/* ── Description + recovery range ── */}
        <div className="text-center space-y-1">
          <p className="text-sm text-foreground/80 max-w-xs leading-relaxed">{config.description}</p>
          <p className="text-xs text-primary font-medium">{config.recoveryRange} recovery</p>
        </div>

        {/* ── SVG: Two-finger pinch on face ── */}
        <div className="relative select-none mt-2">
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            className="overflow-visible touch-none"
          >
            {/* Face outline */}
            <ellipse cx="110" cy="110" rx="62" ry="78" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" />
            {/* Eyes */}
            <ellipse cx="90" cy="95" rx="7" ry="3.5" fill="none" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="0.8" />
            <ellipse cx="130" cy="95" rx="7" ry="3.5" fill="none" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="0.8" />
            {/* Nose */}
            <path d="M 107 100 L 110 113 L 113 113" fill="none" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.6" />
            {/* Mouth */}
            <path d="M 98 135 Q 110 141 122 135" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="0.8" />

            {/* ── Pinch target zone (cheek skin) ── */}
            <motion.ellipse
              cx="68"
              cy="120"
              rx="18"
              ry="14"
              fill={`hsl(var(--primary) / ${isAnimating ? 0.18 : 0.08})`}
              stroke={`hsl(var(--primary) / ${isAnimating ? 0.5 : 0.3})`}
              strokeWidth="1"
              strokeDasharray={value === 0 ? "3 2.5" : "none"}
              animate={skinControls}
              style={{ originX: "68px", originY: "120px" }}
            />

            {/* "Pinch here" label */}
            <text x="68" y="150" textAnchor="middle" fill="hsl(var(--foreground) / 0.35)" fontSize="8" fontFamily="sans-serif">
              Pinch here (cheek)
            </text>

            {/* ── Left finger ── */}
            <motion.g animate={leftFingerControls} style={{ originX: "40px", originY: "130px" }}>
              <ellipse cx="44" cy="128" rx="4.5" ry="7" fill="none" stroke="hsl(var(--primary) / 0.5)" strokeWidth="0.9" transform="rotate(15, 44, 128)" />
              <path d="M 40 123 L 30 114 M 40 133 L 32 140" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M 41.5 122 Q 44 120 46.5 122" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="0.5" />
            </motion.g>

            {/* ── Right finger ── */}
            <motion.g animate={rightFingerControls} style={{ originX: "92px", originY: "110px" }}>
              <ellipse cx="92" cy="112" rx="4.5" ry="7" fill="none" stroke="hsl(var(--primary) / 0.5)" strokeWidth="0.9" transform="rotate(-15, 92, 112)" />
              <path d="M 96 107 L 106 100 M 96 117 L 104 126" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M 89.5 106 Q 92 104 94.5 106" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="0.5" />
            </motion.g>
          </svg>

          {/* Tap to test button overlay */}
          <button
            onClick={handleTest}
            disabled={isAnimating}
            className="absolute inset-0 w-full h-full cursor-pointer bg-transparent"
            aria-label="Tap to replay elasticity test"
          />
        </div>

        {/* Test now button */}
        <motion.button
          onClick={handleTest}
          disabled={isAnimating}
          className="rounded-lg border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm text-primary font-medium transition-all min-h-[44px] touch-manipulation hover:bg-primary/10 disabled:opacity-50"
          whileTap={{ scale: 0.96 }}
        >
          {isAnimating ? "Testing…" : "👆 Test now"}
        </motion.button>

        {/* Recovery speed bar */}
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
