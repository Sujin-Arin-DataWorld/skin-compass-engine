import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TermTipProps {
  /** Short clinical term shown as a heading inside the tooltip (e.g. "PIE") */
  term?: string;
  /** Plain-language explanation displayed in the tooltip body */
  explanation: string;
}

/**
 * TermTip — a miniature circular "i" badge that reveals a glassmorphism tooltip.
 * • Desktop: hover to show / mouse-leave to hide
 * • Mobile: tap to toggle (prevents scroll-through with preventDefault)
 */
export function TermTip({ term, explanation }: TermTipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-baseline">
      {/* Trigger badge */}
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onTouchStart={(e) => {
          e.preventDefault();
          setVisible((v) => !v);
        }}
        aria-label={term ? `Definition: ${term}` : "More information"}
        className="ml-1 inline-flex h-3.5 w-3.5 flex-shrink-0 cursor-default select-none touch-manipulation items-center justify-center rounded-full border border-amber-400/50 bg-amber-50 dark:bg-amber-950/60 align-middle text-[8px] font-bold leading-none text-amber-600 dark:text-amber-400"
      >
        i
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, scale: 0.86, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.86, y: 6 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            className="pointer-events-auto absolute bottom-full left-1/2 z-[60] mb-2.5 w-60 -translate-x-1/2 rounded-xl px-3.5 py-3 text-xs shadow-2xl"
            style={{
              background: "hsl(var(--card) / 0.9)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid hsl(var(--border) / 0.5)",
            }}
          >
            {term && (
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-500 dark:text-amber-400">
                {term}
              </p>
            )}
            <p className="font-light leading-relaxed text-foreground/80">{explanation}</p>

            {/* Arrow caret */}
            <div
              className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid hsl(var(--border) / 0.5)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
