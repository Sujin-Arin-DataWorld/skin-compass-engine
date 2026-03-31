import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { OptionDef, LocalizedText, Lang } from "@/engine/questionRoutingV5";

function getText(t: LocalizedText, lang: Lang): string {
  return t[lang] ?? t.en;
}

interface MultiSelectChipsProps {
  options: OptionDef[];
  value: string[];
  lang: Lang;
  onChange: (ids: string[]) => void;
}

export function MultiSelectChips({ options, value, lang, onChange }: MultiSelectChipsProps) {
  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <motion.button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            whileTap={{ scale: 0.93 }}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors min-h-[40px] touch-manipulation ${
              selected
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-border text-foreground hover:border-amber-300 dark:hover:border-amber-700/60 font-light"
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {selected && (
                <motion.span
                  key="check"
                  initial={{ scale: 0, width: 0, opacity: 0 }}
                  animate={{ scale: 1, width: 14, opacity: 1 }}
                  exit={{ scale: 0, width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </motion.span>
              )}
            </AnimatePresence>
            {opt.icon && <span className="text-sm">{opt.icon}</span>}
            <span className={selected ? "font-medium" : "font-light"}>
              {getText(opt.label, lang)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
