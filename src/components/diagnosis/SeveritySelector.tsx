import { motion } from "framer-motion";
import { useI18nStore, translations } from "@/store/i18nStore";

interface SeveritySelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const SeveritySelector = ({ value, onChange }: SeveritySelectorProps) => {
  const { language } = useI18nStore();
  const t = translations[language];

  return (
    <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
      {[0, 1, 2, 3].map((v) => (
        <motion.button
          key={v}
          onClick={() => onChange(v)}
          className={`relative flex-1 min-h-[44px] min-w-[70px] rounded-lg px-2 py-2.5 text-xs font-medium transition-all overflow-hidden select-none touch-manipulation border ${value === v
              ? v === 0
                ? "bg-muted text-foreground border-border"
                : v === 1
                  ? "bg-severity-mild/20 text-severity-mild border-severity-mild/40"
                  : v === 2
                    ? "bg-severity-moderate/20 text-severity-moderate border-severity-moderate/40"
                    : "bg-severity-severe/20 text-severity-severe border-severity-severe/40"
              : "bg-secondary/50 text-foreground/70 border-transparent hover:bg-secondary active:bg-secondary"
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
          <span className="relative z-10 whitespace-nowrap">{t.diagnosis.ui.frequency[v]}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default SeveritySelector;
