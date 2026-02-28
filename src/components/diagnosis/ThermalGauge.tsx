import { motion } from "framer-motion";
import LabCard from "./LabCard";

interface ThermalGaugeProps {
  value: number; // 0-3
  onChange: (v: number) => void;
  label: string;
}

const THERMAL_LEVELS = [
  { label: "None", color: "var(--severity-clear)", spread: 0 },
  { label: "Mild flush", color: "var(--severity-mild)", spread: 0.2 },
  { label: "Moderate redness", color: "var(--severity-moderate)", spread: 0.5 },
  { label: "Intense flush", color: "var(--severity-severe)", spread: 0.85 },
];

const ThermalGauge = ({ value, onChange, label }: ThermalGaugeProps) => {
  const level = THERMAL_LEVELS[value];

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      <div className="mt-4 flex flex-col items-center gap-6">
        {/* Face with thermal overlay */}
        <div className="relative">
          <svg viewBox="30 20 140 140" className="w-48 h-auto">
            <ellipse cx="100" cy="90" rx="45" ry="55" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1.5" />
            <ellipse cx="82" cy="78" rx="7" ry="3.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
            <ellipse cx="118" cy="78" rx="7" ry="3.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />
            <path d="M 97 85 L 100 100 L 103 100" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.6" />

            <motion.ellipse
              cx="72" cy="92" rx="18" ry="14"
              fill={`hsl(${level.color})`}
              animate={{ opacity: level.spread, scale: 0.8 + level.spread * 0.4 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
            <motion.ellipse
              cx="128" cy="92" rx="18" ry="14"
              fill={`hsl(${level.color})`}
              animate={{ opacity: level.spread, scale: 0.8 + level.spread * 0.4 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
            <motion.ellipse
              cx="100" cy="95" rx="10" ry="12"
              fill={`hsl(${level.color})`}
              animate={{ opacity: value >= 2 ? level.spread * 0.6 : 0 }}
              transition={{ duration: 0.5 }}
            />

            {value >= 2 && (
              <motion.ellipse
                cx="100" cy="90" rx="40" ry="48"
                fill="none"
                stroke={`hsl(${level.color})`}
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: [0, 0.3, 0], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>
        </div>

        {/* Thermometer selector — touch-optimized */}
        <div className="flex w-full gap-1.5">
          {THERMAL_LEVELS.map((lvl, i) => (
            <motion.button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 min-h-[44px] rounded-lg px-2 py-3 text-xs font-medium transition-all select-none touch-manipulation ${
                value === i
                  ? i === 0
                    ? "bg-muted text-foreground"
                    : i === 1
                    ? "bg-severity-mild/20 text-severity-mild"
                    : i === 2
                    ? "bg-severity-moderate/20 text-severity-moderate"
                    : "bg-severity-severe/20 text-severity-severe"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary active:bg-secondary"
              }`}
              whileTap={{ scale: 0.93 }}
            >
              {lvl.label}
            </motion.button>
          ))}
        </div>
      </div>
    </LabCard>
  );
};

export default ThermalGauge;
