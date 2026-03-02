import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";

interface ElasticitySimulationProps {
  value: number; // 0-3
  onChange: (v: number) => void;
}

const LEVELS = [
  { label: "Firm", description: "Skin snaps back immediately — no visible deformation", recoverySec: 0.45, sagDepth: 0, recoveryLabel: "Instant" },
  { label: "Mild Loss", description: "Skin returns within 1–2 seconds after release", recoverySec: 1.0, sagDepth: 0.3, recoveryLabel: "Fast" },
  { label: "Moderate", description: "Skin takes 3–5 seconds to recover its shape", recoverySec: 2.3, sagDepth: 0.6, recoveryLabel: "Slow" },
  { label: "Significant", description: "Skin stays deformed or recovers very slowly", recoverySec: 5.0, sagDepth: 0.9, recoveryLabel: "Very slow" },
];

const PINCH_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const skinControls = useAnimation();
  const leftFingerControls = useAnimation();
  const rightFingerControls = useAnimation();

  const config = LEVELS[value];
  const cancelled = useRef(false);
  const [hasPlayedDemo, setHasPlayedDemo] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressLevel = useRef(0);

  // ── Auto-demo on first view ──
  useEffect(() => {
    if (hasPlayedDemo) return;
    setHasPlayedDemo(true);
    (async () => {
      await new Promise((r) => setTimeout(r, 600));
      await animatePinch(0.35, 0.45);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Looping animation synced to current level ──
  useEffect(() => {
    cancelled.current = false;
    async function loop() {
      await new Promise((r) => setTimeout(r, 1200));
      while (!cancelled.current) {
        await animatePinch(config.sagDepth, config.recoverySec);
        if (cancelled.current) break;
        await new Promise((r) => setTimeout(r, 1800));
      }
    }
    loop();
    return () => { cancelled.current = true; };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatePinch = useCallback(async (depth: number, recoverySec: number) => {
    const pinchInset = 4 + depth * 8; // finger travel distance
    const skinCompress = depth * 0.15;

    // Phase 1: Pinch inward
    await Promise.all([
      leftFingerControls.start({
        x: pinchInset,
        transition: { duration: 0.4, ease: PINCH_EASE },
      }),
      rightFingerControls.start({
        x: -pinchInset,
        transition: { duration: 0.4, ease: PINCH_EASE },
      }),
      skinControls.start({
        scaleX: 1 - skinCompress,
        scaleY: 1 + skinCompress * 0.4,
        transition: { duration: 0.4, ease: PINCH_EASE },
      }),
    ]);
    if (cancelled.current) return;

    // Phase 2: Hold
    await new Promise((r) => setTimeout(r, 500));
    if (cancelled.current) return;

    // Phase 3: Release fingers quickly
    await Promise.all([
      leftFingerControls.start({
        x: 0,
        transition: { duration: 0.25, ease: "easeOut" },
      }),
      rightFingerControls.start({
        x: 0,
        transition: { duration: 0.25, ease: "easeOut" },
      }),
    ]);

    // Phase 4: Skin recovery — duration is FELT
    const recoveryDuration = Math.max(recoverySec, 0.3);
    await skinControls.start({
      scaleX: 1,
      scaleY: 1,
      transition: {
        duration: recoveryDuration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    });
  }, [leftFingerControls, rightFingerControls, skinControls]);

  // ── Press-and-hold interaction ──
  const handlePressStart = useCallback(() => {
    setIsPressing(true);
    pressLevel.current = 0;

    const escalate = () => {
      pressLevel.current = Math.min(pressLevel.current + 1, 3);
      onChange(pressLevel.current);
      if (pressLevel.current < 3) {
        pressTimer.current = setTimeout(escalate, 800);
      }
    };
    pressTimer.current = setTimeout(escalate, 600);
  }, [onChange]);

  const handlePressEnd = useCallback(() => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const recoveryPct = 100 - config.sagDepth * 85;

  return (
    <LabCard>
      <p className="section-header">Elasticity Test</p>
      <p className="category-description text-sm mb-5">
        Press and hold the cheek area, or select a level below to see how skin recovers
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* ── SVG: Two-finger pinch on face ── */}
        <div
          className="relative select-none cursor-pointer"
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <svg
            width="220"
            height="240"
            viewBox="0 0 220 240"
            className="overflow-visible touch-none"
          >
            {/* Face outline */}
            <ellipse
              cx="110"
              cy="120"
              rx="62"
              ry="78"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--foreground) / 0.15)"
              strokeWidth="1"
            />
            {/* Eyes */}
            <ellipse cx="90" cy="105" rx="7" ry="3.5" fill="none" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="0.8" />
            <ellipse cx="130" cy="105" rx="7" ry="3.5" fill="none" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="0.8" />
            {/* Nose */}
            <path d="M 107 110 L 110 123 L 113 123" fill="none" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.6" />
            {/* Mouth */}
            <path d="M 98 145 Q 110 151 122 145" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="0.8" />

            {/* ── Pinch target zone (cheek skin) ── */}
            <motion.ellipse
              cx="68"
              cy="130"
              rx="18"
              ry="14"
              fill={`hsl(var(--primary) / ${isPressing ? 0.18 : 0.08})`}
              stroke={`hsl(var(--primary) / ${isPressing ? 0.5 : 0.3})`}
              strokeWidth="1"
              strokeDasharray={value === 0 ? "3 2.5" : "none"}
              animate={skinControls}
              style={{ originX: "68px", originY: "130px" }}
            />

            {/* ── Left finger (thumb, coming from below-left) ── */}
            <motion.g
              animate={leftFingerControls}
              style={{ originX: "40px", originY: "140px" }}
            >
              {/* Fingertip */}
              <ellipse
                cx="44"
                cy="138"
                rx="4.5"
                ry="7"
                fill="none"
                stroke="hsl(var(--primary) / 0.5)"
                strokeWidth="0.9"
                transform="rotate(15, 44, 138)"
              />
              {/* Finger body lines */}
              <path
                d="M 40 133 L 30 124 M 40 143 L 32 150"
                fill="none"
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
              {/* Nail hint */}
              <path
                d="M 41.5 132 Q 44 130 46.5 132"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />
            </motion.g>

            {/* ── Right finger (index, coming from above-right) ── */}
            <motion.g
              animate={rightFingerControls}
              style={{ originX: "92px", originY: "120px" }}
            >
              {/* Fingertip */}
              <ellipse
                cx="92"
                cy="122"
                rx="4.5"
                ry="7"
                fill="none"
                stroke="hsl(var(--primary) / 0.5)"
                strokeWidth="0.9"
                transform="rotate(-15, 92, 122)"
              />
              {/* Finger body lines */}
              <path
                d="M 96 117 L 106 110 M 96 127 L 104 136"
                fill="none"
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
              {/* Nail hint */}
              <path
                d="M 89.5 116 Q 92 114 94.5 116"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />
            </motion.g>

            {/* Direction hint arrows (pinch inward) */}
            <line x1="50" y1="130" x2="58" y2="130" stroke="hsl(var(--foreground) / 0.06)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
            <line x1="86" y1="130" x2="78" y2="130" stroke="hsl(var(--foreground) / 0.06)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
          </svg>

          {/* Recovery timer label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
            {config.recoverySec < 0.6
              ? "< 0.5s recovery"
              : config.recoverySec <= 1.2
              ? "~1–2s recovery"
              : config.recoverySec <= 3
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
            <span className="text-primary font-medium">{config.recoveryLabel}</span>
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
