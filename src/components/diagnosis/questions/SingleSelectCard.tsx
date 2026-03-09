import { motion, AnimatePresence } from "framer-motion";
import type { OptionDef, LocalizedText, Lang } from "@/engine/questionRoutingV5";
import { TermTip } from "@/components/diagnosis/TermTip";

function getText(t: LocalizedText, lang: Lang): string {
  return t[lang] ?? t.en;
}

interface SingleSelectCardProps {
  options: OptionDef[];
  value: string | null;
  lang: Lang;
  onChange: (id: string) => void;
}

export function SingleSelectCard({ options, value, lang, onChange }: SingleSelectCardProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            whileTap={{ scale: 0.985 }}
            className={`relative rounded-xl border px-4 py-3.5 text-left transition-colors min-h-[52px] touch-manipulation overflow-hidden ${
              selected
                ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/25"
                : "border-border hover:border-amber-300/60 dark:hover:border-amber-700/50"
            }`}
          >
            <div className="flex items-center gap-3">
              {opt.icon && (
                <span className="text-lg flex-shrink-0 leading-none">{opt.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    selected
                      ? "font-medium text-amber-700 dark:text-amber-300"
                      : "font-light text-foreground"
                  }`}
                >
                  {getText(opt.label, lang)}
                  {opt.glossary && (
                    <TermTip explanation={getText(opt.glossary, lang)} />
                  )}
                </p>
                <AnimatePresence>
                  {opt.description && selected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-muted-foreground font-light leading-relaxed overflow-hidden"
                    >
                      {getText(opt.description, lang)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Selection indicator */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="ml-auto flex-shrink-0 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Gold ring border overlay */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-amber-500"
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
