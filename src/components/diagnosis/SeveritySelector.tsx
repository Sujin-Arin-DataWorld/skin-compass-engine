import { motion } from "framer-motion";

const SEVERITY_LABELS = ["None", "Occasionally", "Often", "Almost Always"];

interface SeveritySelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const SeveritySelector = ({ value, onChange }: SeveritySelectorProps) => (
  <div className="flex gap-1.5">
    {[0, 1, 2, 3].map((v) => (
      <motion.button
        key={v}
        onClick={() => onChange(v)}
        className={`relative flex-1 min-h-[44px] rounded-lg px-2 py-2.5 text-xs font-medium transition-all overflow-hidden select-none touch-manipulation ${
          value === v
            ? v === 0
              ? "bg-muted text-foreground"
              : v === 1
              ? "bg-severity-mild/20 text-severity-mild"
              : v === 2
              ? "bg-severity-moderate/20 text-severity-moderate"
              : "bg-severity-severe/20 text-severity-severe"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary active:bg-secondary"
        }`}
        whileTap={{ scale: 0.93 }}
        transition={{ duration: 0.1 }}
      >
        {/* Tap ripple */}
        {value === v && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-current opacity-[0.08]"
            initial={{ scale: 0, opacity: 0.2 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.4 }}
            key={`ripple-${v}-${Date.now()}`}
          />
        )}
        <span className="relative z-10">{SEVERITY_LABELS[v]}</span>
      </motion.button>
    ))}
  </div>
);

export default SeveritySelector;
