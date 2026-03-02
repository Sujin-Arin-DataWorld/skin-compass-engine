import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";
import fingerImg from "@/assets/finger-press.png";

interface ElasticitySimulationProps {
  value: number;
  onChange: (v: number) => void;
}

const LEVELS = [
  { label: "Firm", description: "Skin snaps back immediately — no visible deformation", recoveryRange: "~0.2–0.4s", recoverySec: 0.45, speedLabel: "Fast", pct: 100 },
  { label: "Mild", description: "Skin returns within 1–2 seconds after release", recoveryRange: "~0.7–1.2s", recoverySec: 1.2, speedLabel: "Medium", pct: 72 },
  { label: "Moderate", description: "Skin takes 3–5 seconds to recover its shape", recoveryRange: "~1.8–2.5s", recoverySec: 2.5, speedLabel: "Slow", pct: 42 },
  { label: "Significant", description: "Skin stays deformed or recovers very slowly", recoveryRange: "~3–5s", recoverySec: 4.8, speedLabel: "Very slow", pct: 15 },
];

const PRESS_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const fingerControls = useAnimation();
  const skinControls = useAnimation();

  const config = LEVELS[value];
  const animating = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "pressed" | "recovering">("idle");
  const prevValue = useRef(value);

  const animatePress = useCallback(async (recoverySec: number) => {
    if (animating.current) return;
    animating.current = true;
    setIsAnimating(true);

    // Press
    setPhase("pressed");
    await Promise.all([
      fingerControls.start({ y: 14, transition: { duration: 0.22, ease: PRESS_EASE } }),
      skinControls.start({
        scaleX: 0.91, scaleY: 1.06, y: 2,
        transition: { duration: 0.22, ease: PRESS_EASE },
      }),
    ]);

    // Hold
    await new Promise((r) => setTimeout(r, 160));

    // Lift finger
    setPhase("recovering");
    await fingerControls.start({ y: 0, transition: { duration: 0.12, ease: "easeOut" } });

    // Recovery — overshoot then settle
    const t = Math.max(recoverySec, 0.3);
    await skinControls.start({
      scaleX: 1.012, scaleY: 0.994, y: 0,
      transition: { duration: t * 0.28, ease: "easeOut" },
    });
    await skinControls.start({
      scaleX: 1, scaleY: 1, y: 0,
      transition: { duration: t * 0.72, ease: [0.25, 0.1, 0.25, 1] },
    });

    setPhase("idle");
    animating.current = false;
    setIsAnimating(false);
  }, [fingerControls, skinControls]);

  // Auto-play on selection change
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      animatePress(LEVELS[value].recoverySec);
    }
  }, [value, animatePress]);

  const handleTap = useCallback(() => {
    animatePress(config.recoverySec);
  }, [animatePress, config]);

  return (
    <LabCard>
      <p className="section-header">Elasticity Test</p>
      <p className="category-description text-sm mb-4">
        How quickly does your skin bounce back after being pressed?
      </p>

      <div className="flex flex-col items-center gap-4">
        {/* Level buttons */}
        <div className="grid grid-cols-4 w-full gap-1.5">
          {LEVELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-1 text-center transition-all min-h-[44px] touch-manipulation border ${
                value === i
                  ? i === 0
                    ? "bg-muted text-foreground border-border ring-1 ring-primary/30"
                    : i === 1
                    ? "bg-severity-mild/15 text-severity-mild border-severity-mild/30 ring-1 ring-severity-mild/20"
                    : i === 2
                    ? "bg-severity-moderate/15 text-severity-moderate border-severity-moderate/30 ring-1 ring-severity-moderate/20"
                    : "bg-severity-severe/15 text-severity-severe border-severity-severe/30 ring-1 ring-severity-severe/20"
                  : "bg-secondary/40 text-foreground/60 border-transparent hover:bg-secondary/70"
              }`}
            >
              <span className="text-[11px] font-medium leading-tight">{lvl.label}</span>
            </button>
          ))}
        </div>

        {/* Info block */}
        <div className="text-center space-y-0.5 px-2">
          <p className="text-[13px] text-foreground/75 leading-relaxed">{config.description}</p>
          <p className="text-xs text-primary font-semibold tracking-wide">{config.recoveryRange} recovery</p>
        </div>

        {/* Interaction area */}
        <div
          className="relative select-none cursor-pointer group"
          onClick={handleTap}
          role="button"
          tabIndex={0}
          aria-label="Tap to test skin elasticity"
          style={{ width: 180, height: 200 }}
        >
          {/* Face */}
          <svg width="180" height="180" viewBox="0 0 180 180" className="absolute top-[20px] left-0">
            <defs>
              <radialGradient id="faceGrad" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <ellipse cx="90" cy="95" rx="52" ry="65" fill="url(#faceGrad)" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="0.8" />
            {/* Eyes */}
            <ellipse cx="74" cy="82" rx="5.5" ry="2.5" fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="0.6" />
            <ellipse cx="106" cy="82" rx="5.5" ry="2.5" fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="0.6" />
            {/* Nose */}
            <path d="M 88 86 L 90 96 L 93 96" fill="none" stroke="hsl(var(--foreground) / 0.07)" strokeWidth="0.4" />
            {/* Mouth */}
            <path d="M 82 116 Q 90 121 98 116" fill="none" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.6" />
          </svg>

          {/* Cheek target — deformable */}
          <motion.div
            className="absolute rounded-[50%] transition-shadow duration-200"
            style={{
              width: 44,
              height: 36,
              left: 22,
              top: 104,
              background: phase === "pressed"
                ? "radial-gradient(ellipse, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.06) 70%)"
                : "hsl(var(--primary) / 0.05)",
              border: `1px solid hsl(var(--primary) / ${phase === "idle" ? 0.12 : 0.3})`,
              boxShadow: phase === "pressed"
                ? "inset 0 8px 16px rgba(0,0,0,0.18), inset 0 2px 5px rgba(0,0,0,0.1)"
                : "none",
              transformOrigin: "center center",
            }}
            animate={skinControls}
          />

          {/* Finger */}
          <motion.img
            src={fingerImg}
            alt=""
            className="absolute pointer-events-none"
            draggable={false}
            style={{
              width: 48,
              height: 48,
              left: 20,
              top: 52,
              transform: "rotate(180deg)",
              filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.12))",
              objectFit: "contain",
            }}
            initial={{ y: 0 }}
            animate={fingerControls}
          />

          {/* Hover hint on cheek */}
          <div
            className="absolute text-[8px] text-foreground/25 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: 12, top: 146, width: 64 }}
          >
            tap to test
          </div>
        </div>

        {/* Microcopy */}
        <p className="text-[10px] text-foreground/35 -mt-1 tracking-wide">
          Tap cheek to replay · Auto-plays on selection
        </p>

        {/* Recovery bar */}
        <div className="w-full max-w-[260px]">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-foreground/50">Recovery speed</span>
            <span className="text-primary font-medium">{config.speedLabel}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/80"
              animate={{ width: `${config.pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </LabCard>
  );
};

export default ElasticitySimulation;
