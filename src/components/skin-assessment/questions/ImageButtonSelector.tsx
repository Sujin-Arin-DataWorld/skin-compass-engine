import { motion, AnimatePresence } from "framer-motion";
import type { OptionDef, LocalizedText, Lang } from "@/engine/questionRoutingV5";
import { TermTip } from "@/components/skin-assessment/TermTip";

function getText(t: LocalizedText, lang: Lang): string {
  return t[lang] ?? t.en;
}

interface ImageButtonSelectorProps {
  options: OptionDef[];
  value: string | null;
  lang: Lang;
  onChange: (id: string) => void;
}

export function ImageButtonSelector({ options, value, lang, onChange }: ImageButtonSelectorProps) {
  const gridCols =
    options.length === 2
      ? "grid-cols-2"
      : options.length === 3
      ? "grid-cols-3"
      : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`grid gap-3 ${gridCols}`}>
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            whileHover={{ scale: 1.025, transition: { ease: "easeOut", duration: 0.16 } }}
            whileTap={{ scale: 0.965 }}
            className={`relative rounded-xl border-2 p-4 text-center min-h-[100px] touch-manipulation transition-colors ${
              selected
                ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/25"
                : "border-border hover:border-amber-300/60 dark:hover:border-amber-700/50"
            }`}
            style={{
              filter: selected ? "saturate(1)" : "saturate(0.35)",
              transition: "filter 0.2s ease-in-out",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              {opt.icon && (
                <span className="text-4xl leading-none">{opt.icon}</span>
              )}
              <p
                className={`text-xs sm:text-sm leading-snug ${
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
                {selected && opt.description && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] text-muted-foreground leading-relaxed overflow-hidden"
                  >
                    {getText(opt.description, lang)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Gold ring overlay */}
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
