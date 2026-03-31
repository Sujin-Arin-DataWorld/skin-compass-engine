import { motion } from "framer-motion";
import { useMemo } from "react";
import LabCard from "./LabCard";
import { useI18nStore, translations } from "@/store/i18nStore";

interface HydrationEvaporationProps {
  retentionLevel: number; // 0-3 (0 = no issue, 3 = evaporates immediately)
  onChange: (v: number) => void;
}

const HydrationEvaporation = ({ retentionLevel, onChange }: HydrationEvaporationProps) => {
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;

  const RETENTION_LABELS = [
    { label: t.analysis.ui.holdsWell, desc: t.analysis.ui.moistureStays },
    { label: t.analysis.ui.fadesGradually, desc: t.analysis.ui.driesWithin },
    { label: t.analysis.ui.evaporatesFast, desc: t.analysis.ui.goneWithin },
    { label: t.analysis.ui.wontAbsorb, desc: t.analysis.ui.immediateLoss },
  ];

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
        {t.analysis.ui.hydrationRetention}
      </p>

      <div className="mt-4 flex flex-col items-center gap-5">
        {/* Skin surface with droplets — blue hydration theme */}
        <div
          className="relative w-full max-w-[260px] h-32 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(var(--hydration-soft)), hsl(var(--card)))`,
            border: `1px solid hsl(var(--hydration) / 0.2)`,
          }}
        >
          {/* Micro-crack overlay for severe dryness */}
          {retentionLevel >= 2 && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  ${45 + retentionLevel * 10}deg,
                  transparent,
                  transparent 8px,
                  hsl(var(--hydration) / 0.12) 8px,
                  hsl(var(--hydration) / 0.12) 8.5px
                )`,
              }}
              animate={{ opacity: retentionLevel === 2 ? 0.4 : 0.7 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Water droplets — blue hydration tokens */}
          <svg viewBox="0 0 130 80" className="absolute inset-0 w-full h-full">
            {droplets.map((d, i) => (
              <motion.path
                key={d.id}
                d={`M ${d.x} ${d.y - d.size * 0.6}
                    Q ${d.x - d.size * 0.5} ${d.y + d.size * 0.3} ${d.x} ${d.y + d.size * 0.6}
                    Q ${d.x + d.size * 0.5} ${d.y + d.size * 0.3} ${d.x} ${d.y - d.size * 0.6} Z`}
                fill="hsl(var(--hydration) / 0.5)"
                stroke="hsl(var(--hydration) / 0.3)"
                strokeWidth="0.4"
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{
                  opacity: i < remainingDroplets ? [0.4, 0.8, 0.4] : 0,
                  scale: i < remainingDroplets ? [0.9, 1, 0.9] : 0,
                  y: i >= remainingDroplets ? -15 : 0,
                }}
                transition={{
                  opacity: { duration: evapDuration, repeat: i < remainingDroplets ? Infinity : 0 },
                  scale: { duration: evapDuration, repeat: i < remainingDroplets ? Infinity : 0 },
                  y: { duration: 0.6, delay: d.delay },
                }}
              />
            ))}
          </svg>

          {/* Level indicator bar */}
          <div className="absolute bottom-2 left-3 right-3">
            <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "hsl(var(--hydration) / 0.15)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "hsl(var(--hydration) / 0.6)" }}
                animate={{ width: `${((3 - retentionLevel) / 3) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Selector */}
        <div className="flex w-full gap-1">
          {RETENTION_LABELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2.5 text-center transition-all min-h-[44px] ${retentionLevel === i
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
