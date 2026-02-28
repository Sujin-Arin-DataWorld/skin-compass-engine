import { motion } from "framer-motion";
import LabCard from "./LabCard";

export interface PhotoOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  severityMap: Record<string, number>;
}

interface PhotoMatchSelectorProps {
  title: string;
  options: PhotoOption[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const PhotoMatchSelector = ({ title, options, selected, onSelect }: PhotoMatchSelectorProps) => (
  <LabCard>
    <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
      Visual Match
    </p>
    <p className="mb-5 text-sm text-foreground">{title}</p>

    <div className="grid grid-cols-2 gap-3">
      {options.map((opt, i) => (
        <motion.button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 min-h-[100px] transition-all select-none touch-manipulation ${
            selected === opt.id
              ? "border-primary bg-primary/10 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.3)]"
              : "border-border bg-secondary/30 hover:border-primary/40 active:border-primary/60"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="text-3xl">{opt.icon}</span>
          <span className="text-xs font-medium text-foreground">{opt.label}</span>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">
            {opt.description}
          </span>
        </motion.button>
      ))}
    </div>
  </LabCard>
);

export default PhotoMatchSelector;
