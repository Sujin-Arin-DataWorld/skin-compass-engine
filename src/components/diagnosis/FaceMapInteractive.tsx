import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LabCard from "./LabCard";

interface FaceZone {
  id: string;
  label: string;
  path: string;
  cx: number;
  cy: number;
}

const FACE_ZONES: FaceZone[] = [
  { id: "forehead", label: "Forehead", path: "M 80 45 Q 100 25 120 45 L 125 70 Q 100 65 75 70 Z", cx: 100, cy: 50 },
  { id: "forehead_left", label: "Left Hairline / Temple", path: "M 55 42 Q 62 30 75 38 L 75 62 Q 65 58 58 55 Z", cx: 65, cy: 48 },
  { id: "forehead_right", label: "Right Hairline / Temple", path: "M 145 42 Q 138 30 125 38 L 125 62 Q 135 58 142 55 Z", cx: 135, cy: 48 },
  { id: "left_cheek", label: "Left Cheek", path: "M 65 85 Q 55 100 60 120 L 75 125 Q 80 105 75 85 Z", cx: 68, cy: 105 },
  { id: "right_cheek", label: "Right Cheek", path: "M 135 85 Q 145 100 140 120 L 125 125 Q 120 105 125 85 Z", cx: 132, cy: 105 },
  { id: "nose", label: "Nose", path: "M 95 75 L 105 75 L 108 105 Q 100 110 92 105 Z", cx: 100, cy: 90 },
  { id: "chin", label: "Chin", path: "M 85 135 Q 100 155 115 135 L 120 125 Q 100 130 80 125 Z", cx: 100, cy: 140 },
  { id: "jawline_l", label: "Left Jawline", path: "M 60 120 Q 65 135 80 140 L 85 135 Q 72 130 65 120 Z", cx: 72, cy: 130 },
  { id: "jawline_r", label: "Right Jawline", path: "M 140 120 Q 135 135 120 140 L 115 135 Q 128 130 135 120 Z", cx: 128, cy: 130 },
  { id: "t_zone", label: "T-Zone", path: "M 90 45 L 110 45 L 108 75 L 110 105 Q 100 110 90 105 L 92 75 Z", cx: 100, cy: 75 },
];

interface FaceMapInteractiveProps {
  selectedZones: Record<string, number>;
  onChange: (zones: Record<string, number>) => void;
  maxSelections?: number;
}

const FaceMapInteractive = ({ selectedZones, onChange, maxSelections = 7 }: FaceMapInteractiveProps) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [intensity] = useState(1);
  const [tappedZone, setTappedZone] = useState<string | null>(null);

  const toggleZone = useCallback((zoneId: string) => {
    const current = { ...selectedZones };
    if (current[zoneId]) {
      if (current[zoneId] >= 3) {
        delete current[zoneId];
      } else {
        current[zoneId] = current[zoneId] + 1;
      }
    } else {
      const count = Object.keys(current).length;
      if (count >= maxSelections) return;
      current[zoneId] = intensity;
    }
    onChange(current);
    setTappedZone(zoneId);
    setTimeout(() => setTappedZone(null), 300);
  }, [selectedZones, onChange, intensity, maxSelections]);

  const getZoneColor = (zoneId: string) => {
    const val = selectedZones[zoneId];
    if (!val) return "transparent";
    if (val === 1) return "hsla(30, 55%, 48%, 0.18)";
    if (val === 2) return "hsla(30, 55%, 48%, 0.32)";
    return "hsla(30, 55%, 48%, 0.48)";
  };

  const getGlowRadius = (zoneId: string) => {
    const val = selectedZones[zoneId];
    if (!val) return 0;
    return val * 4;
  };

  return (
    <LabCard>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Tap affected areas · Tap again to increase intensity
        </p>

        <div className="relative">
          <svg viewBox="30 10 140 170" className="w-full max-w-[280px] min-h-[220px] h-auto touch-manipulation">
            {/* Face outline — increased contrast */}
            <ellipse cx="100" cy="95" rx="48" ry="60" fill="none" stroke="hsl(var(--foreground) / 0.25)" strokeWidth="1.8" />
            <path d="M 55 55 Q 60 25 100 20 Q 140 25 145 55" fill="none" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="1" />
            <ellipse cx="82" cy="80" rx="8" ry="4" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
            <ellipse cx="118" cy="80" rx="8" ry="4" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
            <path d="M 90 125 Q 100 132 110 125" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />

            {FACE_ZONES.map((zone) => (
              <g key={zone.id}>
                {selectedZones[zone.id] && (
                  <motion.circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={getGlowRadius(zone.id)}
                    fill="hsla(30, 55%, 48%, 0.1)"
                    initial={{ r: 0 }}
                    animate={{
                      r: getGlowRadius(zone.id) + 8,
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      r: { duration: 0.3 },
                      opacity: { duration: 2, repeat: Infinity },
                    }}
                  />
                )}

                {/* Tap ripple */}
                {tappedZone === zone.id && (
                  <motion.circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={5}
                    fill="hsl(var(--accent) / 0.3)"
                    initial={{ r: 5, opacity: 0.6 }}
                    animate={{ r: 20, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}

                <motion.path
                  d={zone.path}
                  fill={getZoneColor(zone.id)}
                  stroke={hoveredZone === zone.id ? "hsl(var(--accent))" : "transparent"}
                  strokeWidth="1"
                  className="cursor-pointer"
                  onClick={() => toggleZone(zone.id)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                />

                {/* Interactive dot — bronze when selected */}
                <motion.circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r={selectedZones[zone.id] ? 3 + selectedZones[zone.id] : 3}
                  fill={selectedZones[zone.id] ? "hsl(var(--accent))" : "hsl(var(--muted-foreground) / 0.4)"}
                  className="pointer-events-none"
                  initial={{ scale: 0 }}
                  animate={{
                    scale: 1,
                    ...(selectedZones[zone.id] ? { r: [3 + selectedZones[zone.id], 4 + selectedZones[zone.id], 3 + selectedZones[zone.id]] } : {}),
                  }}
                  transition={{
                    scale: { type: "spring", stiffness: 400, damping: 15 },
                    r: { duration: 0.8, repeat: selectedZones[zone.id] ? Infinity : 0, repeatDelay: 1.5 },
                  }}
                />
              </g>
            ))}
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
                {FACE_ZONES.find(z => z.id === hoveredZone)?.label}
                {selectedZones[hoveredZone] && ` · Intensity ${selectedZones[hoveredZone]}/3`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(selectedZones).map(([id, val]) => {
            const zone = FACE_ZONES.find(z => z.id === id);
            return (
              <motion.span
                key={id}
                className="rounded-full bg-accent/20 px-3 py-1.5 text-xs text-foreground font-medium border border-accent/40 min-h-[32px] flex items-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {zone?.label} ×{val}
              </motion.span>
            );
          })}
        </div>
      </div>
    </LabCard>
  );
};

export default FaceMapInteractive;
