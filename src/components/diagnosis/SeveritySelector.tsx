import { motion } from "framer-motion";

const SEVERITY_LABELS = ["None", "Occasionally", "Often", "Almost Always"];

interface SeveritySelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const SeveritySelector = ({ value, onChange }: SeveritySelectorProps) => (
  <div className="flex gap-1">
    {[0, 1, 2, 3].map((v) => (
      <motion.button
        key={v}
        onClick={() => onChange(v)}
        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
          value === v
            ? v === 0
              ? "bg-muted text-foreground"
              : v === 1
              ? "bg-severity-mild/20 text-severity-mild"
              : v === 2
              ? "bg-severity-moderate/20 text-severity-moderate"
              : "bg-severity-severe/20 text-severity-severe"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
        }`}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        {SEVERITY_LABELS[v]}
      </motion.button>
    ))}
  </div>
);

export default SeveritySelector;
