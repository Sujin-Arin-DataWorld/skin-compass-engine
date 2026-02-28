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
  darken?: boolean; // For pigmentation darkening effect
}

const AreaTapOverlay = ({ title, subtitle, zones, selected, onToggle, darken = false }: AreaTapOverlayProps) => (
  <LabCard>
    <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
      {title}
    </p>
    {subtitle && <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>}

    <div className="flex justify-center">
      <svg viewBox="30 15 140 160" className="w-full max-w-[260px] h-auto">
        {/* Face outline */}
        <ellipse cx="100" cy="90" rx="45" ry="58" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Eyes */}
        <ellipse cx="82" cy="76" rx="7" ry="3.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
        <ellipse cx="118" cy="76" rx="7" ry="3.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
        {/* Nose */}
        <path d="M 97 82 L 100 98 L 103 98" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.6" />
        {/* Mouth */}
        <path d="M 90 118 Q 100 124 110 118" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.6" />

        {/* Tappable zones */}
        {zones.map((zone) => {
          const isSelected = selected.includes(zone.id);
          return (
            <g key={zone.id}>
              <AnimatePresence>
                {isSelected && (
                  <motion.ellipse
                    cx={zone.cx}
                    cy={zone.cy}
                    rx={zone.rx + 4}
                    ry={zone.ry + 4}
                    fill={darken ? "hsla(30, 40%, 25%, 0.2)" : "hsl(var(--primary) / 0.1)"}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.2, 0.4, 0.2], scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.3 } }}
                  />
                )}
              </AnimatePresence>

              <motion.ellipse
                cx={zone.cx}
                cy={zone.cy}
                rx={zone.rx}
                ry={zone.ry}
                fill={
                  isSelected
                    ? darken
                      ? "hsla(30, 40%, 25%, 0.35)"
                      : "hsl(var(--primary) / 0.2)"
                    : "transparent"
                }
                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"}
                strokeWidth={isSelected ? 1.5 : 0.8}
                strokeDasharray={isSelected ? "none" : "3 3"}
                className="cursor-pointer"
                onClick={() => onToggle(zone.id)}
                whileTap={{ scale: 0.92 }}
                whileHover={{ strokeWidth: 1.5 }}
              />

              <text
                x={zone.cx}
                y={zone.cy + zone.ry + 10}
                textAnchor="middle"
                className="text-[7px] fill-muted-foreground pointer-events-none"
              >
                {zone.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>

    {/* Selected tags */}
    <div className="mt-3 flex flex-wrap gap-2 justify-center">
      {selected.map((id) => {
        const zone = zones.find(z => z.id === id);
        return (
          <motion.span
            key={id}
            className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
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

export default AreaTapOverlay;
