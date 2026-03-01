import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LabCard from "./LabCard";

interface TapZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface AreaTapOverlayProps {
  title: string;
  subtitle?: string;
  zones: TapZone[];
  selected: string[];
  onToggle: (zoneId: string) => void;
  darken?: boolean;
}

const AreaTapOverlay = ({ title, subtitle, zones, selected, onToggle, darken = false }: AreaTapOverlayProps) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {subtitle && <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>}

      <div className="relative flex justify-center">
        <svg viewBox="30 15 140 160" className="w-full max-w-[260px] h-auto touch-manipulation">
          {/* Face outline — increased contrast */}
          <ellipse cx="100" cy="90" rx="45" ry="58" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground) / 0.25)" strokeWidth="1.8" />
          <ellipse cx="82" cy="76" rx="7" ry="3.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
          <ellipse cx="118" cy="76" rx="7" ry="3.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
          <path d="M 97 82 L 100 98 L 103 98" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.6" />
          <path d="M 90 118 Q 100 124 110 118" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.6" />

          {/* Tappable zones */}
          {zones.map((zone) => {
            const isSelected = selected.includes(zone.id);
            const hitRx = Math.max(zone.rx, 18);
            const hitRy = Math.max(zone.ry, 14);
            return (
              <g key={zone.id}>
                <AnimatePresence>
                  {isSelected && (
                    <motion.ellipse
                      cx={zone.cx}
                      cy={zone.cy}
                      rx={zone.rx + 4}
                      ry={zone.ry + 4}
                      fill={darken ? "hsla(30, 40%, 25%, 0.2)" : "hsla(30, 55%, 48%, 0.12)"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.2, 0.4, 0.2], scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.3 } }}
                    />
                  )}
                </AnimatePresence>

                {/* Invisible enlarged hit area */}
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={hitRx}
                  ry={hitRy}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => onToggle(zone.id)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                />

                {/* Visible zone — bronze highlight when selected */}
                <motion.ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={
                    isSelected
                      ? darken
                        ? "hsla(30, 40%, 25%, 0.35)"
                        : "hsla(30, 55%, 48%, 0.18)"
                      : "transparent"
                  }
                  stroke={isSelected ? "hsl(var(--accent))" : "hsl(var(--border) / 0.5)"}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  strokeDasharray={isSelected ? "none" : "3 3"}
                  className="pointer-events-none"
                  animate={isSelected ? { scale: [1, 1.04, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />

                {/* Interactive dot instead of text label */}
                <motion.circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r={isSelected ? 4 : 3}
                  fill={isSelected ? "hsl(var(--accent))" : "hsl(var(--muted-foreground) / 0.5)"}
                  className="pointer-events-none"
                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.6, repeat: isSelected ? Infinity : 0, repeatDelay: 1 }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {hoveredZone && (
            <motion.div
              className="absolute top-0 right-0 rounded-md bg-secondary border border-border px-2.5 py-1 text-xs text-foreground shadow-md"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {zones.find(z => z.id === hoveredZone)?.label}
              {selected.includes(hoveredZone) && " ✓"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected chips */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {selected.map((id) => {
          const zone = zones.find(z => z.id === id);
          return (
            <motion.span
              key={id}
              className="rounded-full bg-accent/20 px-3 py-1.5 text-xs text-foreground font-medium border border-accent/40 min-h-[32px] flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {zone?.label}
            </motion.span>
          );
        })}
      </div>
    </LabCard>
  );
};

export default AreaTapOverlay;
