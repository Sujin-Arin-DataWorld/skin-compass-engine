import { useState, useRef } from "react";
import { motion } from "framer-motion";
import LabCard from "./LabCard";

interface ElasticitySimulationProps {
  value: number; // 0-3
  onChange: (v: number) => void;
}

const ELASTICITY_LABELS = [
  { label: "Firm", desc: "Snaps back instantly" },
  { label: "Mild loss", desc: "Slight delay" },
  { label: "Moderate", desc: "Noticeable lag" },
  { label: "Significant", desc: "Very slow rebound" },
];

const ElasticitySimulation = ({ value, onChange }: ElasticitySimulationProps) => {
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Snap-back duration increases with severity
  const snapDuration = value === 0 ? 0.15 : value === 1 ? 0.5 : value === 2 ? 1.2 : 2.5;
  const deformAmount = isPinching ? 20 : 0;
  const sagAmount = value * 3;

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Elasticity Test
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Press and hold the skin surface, then release to test bounce-back
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* Skin surface simulation */}
        <div
          ref={containerRef}
          className="relative w-full max-w-[260px] h-36 rounded-xl border border-border overflow-hidden cursor-pointer select-none"
          style={{ background: "hsl(var(--secondary))" }}
          onMouseDown={() => setIsPinching(true)}
          onMouseUp={() => setIsPinching(false)}
          onMouseLeave={() => setIsPinching(false)}
          onTouchStart={() => setIsPinching(true)}
          onTouchEnd={() => setIsPinching(false)}
        >
          {/* Horizontal skin lines that deform */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute w-full border-t border-border/40"
              style={{ top: `${18 + i * 16}%` }}
              animate={{
                y: isPinching
                  ? Math.sin((i - 2) * 0.8) * deformAmount
                  : sagAmount * Math.sin((i - 1) * 0.5),
              }}
              transition={{
                duration: isPinching ? 0.15 : snapDuration,
                ease: isPinching ? "easeOut" : [0.4, 0, 0.2, 1],
              }}
            />
          ))}

          {/* Central deform indicator */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40"
            animate={{
              width: isPinching ? 60 : 30,
              height: isPinching ? 30 : 30,
              opacity: isPinching ? 0.8 : 0.3,
            }}
            transition={{
              duration: isPinching ? 0.15 : snapDuration,
              ease: [0.4, 0, 0.2, 1],
            }}
          />

          {/* Downward sag preview on sides */}
          {value >= 2 && !isPinching && (
            <motion.path
              d={`M 0 80 Q 130 ${80 + sagAmount * 2} 260 80`}
              className="absolute bottom-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
            />
          )}

          {/* Instruction */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-[10px] text-muted-foreground">
              {isPinching ? "Release to test rebound →" : "Press & hold"}
            </span>
          </div>
        </div>

        {/* Severity selector */}
        <div className="flex w-full gap-1">
          {ELASTICITY_LABELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-md px-1 py-2.5 text-center transition-all ${
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
