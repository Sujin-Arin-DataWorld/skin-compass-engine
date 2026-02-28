import { motion } from "framer-motion";
import { useMemo } from "react";
import LabCard from "./LabCard";

interface HydrationEvaporationProps {
  retentionLevel: number; // 0-3 (0 = no issue, 3 = evaporates immediately)
  onChange: (v: number) => void;
}

const RETENTION_LABELS = [
  { label: "Holds Well", desc: "Moisture stays for hours" },
  { label: "Fades Gradually", desc: "Dries within 2–3 hours" },
  { label: "Evaporates Fast", desc: "Gone within an hour" },
  { label: "Won't Absorb", desc: "Immediate moisture loss" },
];

const HydrationEvaporation = ({ retentionLevel, onChange }: HydrationEvaporationProps) => {
  const droplets = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 20 + (i % 4) * 25 + Math.random() * 10,
      y: 15 + Math.floor(i / 4) * 22 + Math.random() * 8,
      size: 4 + Math.random() * 3,
      delay: Math.random() * 0.5,
    }));
  }, []);

  // How fast droplets disappear (higher retention level = faster evaporation)
  const evapDuration = retentionLevel === 0 ? 8 : retentionLevel === 1 ? 4 : retentionLevel === 2 ? 2 : 0.8;
  const remainingDroplets = retentionLevel === 0 ? 12 : retentionLevel === 1 ? 8 : retentionLevel === 2 ? 4 : 1;

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Hydration Retention
      </p>

      <div className="mt-4 flex flex-col items-center gap-5">
        {/* Skin surface with droplets */}
        <div className="relative w-full max-w-[260px] h-32 rounded-xl bg-secondary/60 border border-border overflow-hidden">
          {/* Skin texture lines */}
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute w-full border-t border-border/30"
              style={{ top: `${25 + i * 22}%` }}
            />
          ))}

          {/* Micro-crack overlay for severe dryness */}
          {retentionLevel >= 2 && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  ${45 + retentionLevel * 10}deg,
                  transparent,
                  transparent 8px,
                  hsl(var(--border)) 8px,
                  hsl(var(--border)) 8.5px
                )`,
              }}
              animate={{ opacity: retentionLevel === 2 ? 0.2 : 0.4 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Water droplets */}
          <svg viewBox="0 0 130 80" className="absolute inset-0 w-full h-full">
            {droplets.map((d, i) => (
              <motion.ellipse
                key={d.id}
                cx={d.x}
                cy={d.y}
                rx={d.size * 0.7}
                ry={d.size}
                fill="hsl(var(--primary) / 0.4)"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{
                  opacity: i < remainingDroplets ? [0.5, 0.8, 0.5] : 0,
                  scale: i < remainingDroplets ? [0.9, 1, 0.9] : 0,
                  cy: i >= remainingDroplets ? d.y - 15 : d.y,
                }}
                transition={{
                  opacity: { duration: evapDuration, repeat: i < remainingDroplets ? Infinity : 0 },
                  scale: { duration: evapDuration, repeat: i < remainingDroplets ? Infinity : 0 },
                  cy: { duration: 0.6, delay: d.delay },
                }}
              />
            ))}
          </svg>
        </div>

        {/* Selector */}
        <div className="flex w-full gap-1">
          {RETENTION_LABELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-md px-1 py-2.5 text-center transition-all ${
                retentionLevel === i
                  ? i === 0
                    ? "bg-severity-clear/20 text-severity-clear"
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

export default HydrationEvaporation;
