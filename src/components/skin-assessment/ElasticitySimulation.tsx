import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import LabCard from "./LabCard";
import { useI18nStore, translations } from "@/store/i18nStore";

interface ElasticitySimulationProps {
  value: number;
  onChange: (v: number) => void;
}

const PRESS_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** Generate a smooth SVG path for the skin surface with an optional dip at center. */
function skinSurfacePath(dip: number): string {
  // Surface goes from left to right with a smooth dip in the center
  const y0 = 50; // baseline y
  return `M 10 ${y0} Q 50 ${y0} 80 ${y0 + dip * 0.3} Q 110 ${y0 + dip} 140 ${y0 + dip} Q 170 ${y0 + dip} 200 ${y0 + dip * 0.3} Q 230 ${y0} 270 ${y0}`;
}

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const surfaceControls = useAnimation();
  const arrowControls = useAnimation();
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;

  const LEVELS = [
    { label: t.analysis.ui.elasticFirm, description: t.analysis.ui.elasticFirmDesc, recoveryRange: "~0.2–0.4s", recoverySec: 0.45, speedLabel: t.analysis.ui.recoveryFast, pct: 100, dipDepth: 6 },
    { label: t.analysis.ui.elasticMild, description: t.analysis.ui.elasticMildDesc, recoveryRange: "~0.7–1.2s", recoverySec: 1.2, speedLabel: t.analysis.ui.recoveryMedium, pct: 72, dipDepth: 12 },
    { label: t.analysis.ui.elasticModerate, description: t.analysis.ui.elasticModerateDesc, recoveryRange: "~1.8–2.5s", recoverySec: 2.5, speedLabel: t.analysis.ui.recoverySlow, pct: 42, dipDepth: 20 },
    { label: t.analysis.ui.elasticSignificant, description: t.analysis.ui.elasticSignificantDesc, recoveryRange: "~3–5s", recoverySec: 4.8, speedLabel: t.analysis.ui.recoveryVerySlow, pct: 15, dipDepth: 28 },
  ];

  const config = LEVELS[value];
  const animating = useRef(false);
  const [phase, setPhase] = useState<"idle" | "pressing" | "recovering">("idle");
  const prevValue = useRef(value);

  const animatePress = useCallback(async (recoverySec: number, dipDepth: number) => {
    if (animating.current) return;
    animating.current = true;

    setPhase("pressing");
    // Arrow descends, surface dips
    await Promise.all([
      arrowControls.start({ y: 18, opacity: 0.9, transition: { duration: 0.25, ease: PRESS_EASE } }),
      surfaceControls.start({
        d: skinSurfacePath(dipDepth),
        transition: { duration: 0.25, ease: PRESS_EASE },
      }),
    ]);

    await new Promise((r) => setTimeout(r, 200));

    setPhase("recovering");
    // Arrow lifts
    await arrowControls.start({ y: -8, opacity: 0.4, transition: { duration: 0.15, ease: "easeOut" } });

    // Surface recovers — speed depends on level
    const t = Math.max(recoverySec, 0.3);
    // Overshoot slightly
    await surfaceControls.start({
      d: skinSurfacePath(-2),
      transition: { duration: t * 0.35, ease: "easeOut" },
    });
    // Settle back to flat
    await surfaceControls.start({
      d: skinSurfacePath(0),
      transition: { duration: t * 0.65, ease: [0.25, 0.1, 0.25, 1] },
    });

    setPhase("idle");
    animating.current = false;
  }, [arrowControls, surfaceControls]);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      animatePress(LEVELS[value].recoverySec, LEVELS[value].dipDepth);
    }
  }, [value, animatePress]);

  const handleTap = useCallback(() => {
    animatePress(config.recoverySec, config.dipDepth);
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
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-1 text-center transition-all min-h-[44px] touch-manipulation border ${value === i
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

        {/* Info */}
        <div className="text-center space-y-0.5 px-2">
          <p className="text-[13px] text-foreground/75 leading-relaxed">{config.description}</p>
          <p className="text-xs text-primary font-semibold tracking-wide">{config.recoveryRange} recovery</p>
        </div>

        {/* SVG Press & Release interaction area */}
        <div
          className="relative w-full max-w-[300px] cursor-pointer select-none group"
          onClick={handleTap}
          role="button"
          tabIndex={0}
          aria-label="Tap to test skin elasticity"
        >
          <svg viewBox="0 0 280 120" className="w-full h-auto">
            {/* Skin cross-section layers */}
            <defs>
              <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(28, 40%, 78%)" />
                <stop offset="50%" stopColor="hsl(25, 35%, 68%)" />
                <stop offset="100%" stopColor="hsl(20, 30%, 58%)" />
              </linearGradient>
              <linearGradient id="skinGradDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(28, 25%, 40%)" />
                <stop offset="50%" stopColor="hsl(25, 20%, 32%)" />
                <stop offset="100%" stopColor="hsl(20, 18%, 24%)" />
              </linearGradient>
            </defs>

            {/* Dermis layer (static, always behind) */}
            <rect x="10" y="65" width="260" height="50" rx="6" fill="url(#skinGrad)" opacity="0.4" className="dark:fill-[url(#skinGradDark)]" />

            {/* Skin surface — animated path */}
            <motion.path
              d={skinSurfacePath(0)}
              fill="none"
              stroke="hsl(var(--foreground) / 0.6)"
              strokeWidth="3"
              strokeLinecap="round"
              animate={surfaceControls}
            />

            {/* Epidermis fill below surface */}
            <motion.path
              d={skinSurfacePath(0) + " L 270 110 L 10 110 Z"}
              fill="url(#skinGrad)"
              opacity="0.7"
              className="dark:fill-[url(#skinGradDark)]"
              animate={surfaceControls}
            />

            {/* Press indicator arrow */}
            <motion.g
              initial={{ y: -8, opacity: 0.4 }}
              animate={arrowControls}
            >
              <line x1="140" y1="8" x2="140" y2="34" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="132,30 140,42 148,30" fill="hsl(var(--primary))" />
            </motion.g>

            {/* Phase label */}
            <text x="140" y="108" textAnchor="middle" className="text-[9px] fill-current text-muted-foreground" style={{ fontSize: 9 }}>
              {phase === "idle" ? "Tap to press" : phase === "pressing" ? "Pressing..." : "Recovering..."}
            </text>
          </svg>

          {/* Hover hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[10px] text-foreground/20 tracking-wide">tap to test</span>
          </div>
        </div>

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
