import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { SliderConfig, LocalizedText, Lang } from "@/engine/questionRoutingV5";

function getText(t: LocalizedText, lang: Lang): string {
  return t[lang] ?? t.en;
}

interface MagneticSliderProps {
  config: SliderConfig;
  value: number;
  lang: Lang;
  onChange: (value: number) => void;
}

export function MagneticSlider({ config, value, lang, onChange }: MagneticSliderProps) {
  const [isActive, setIsActive] = useState(false);
  const { min, max, step, labelMin, labelMax } = config;

  const percent = ((value - min) / (max - min)) * 100;
  const stepCount = Math.round((max - min) / step);

  // Spring-animated thumb position
  const motionPercent = useMotionValue(percent);
  const springPercent = useSpring(motionPercent, {
    stiffness: 420,
    damping: 32,
    mass: 0.7,
  });
  const leftStyle = useTransform(springPercent, (v) => `${v}%`);

  useEffect(() => {
    motionPercent.set(percent);
  }, [percent, motionPercent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="relative pt-10 pb-5 select-none px-1">
      {/* Track container */}
      <div className="relative mx-2 h-1.5 rounded-full bg-border/60">
        {/* Filled portion */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: leftStyle,
            background: "linear-gradient(to right, hsl(43 74% 49%), hsl(35 65% 55%))",
          }}
        />

        {/* Tick marks */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
          {Array.from({ length: stepCount + 1 }).map((_, i) => {
            const tickValue = min + i * step;
            const filled = tickValue <= value;
            return (
              <div
                key={i}
                className={`h-2 w-px rounded-full transition-colors duration-200 ${
                  filled ? "bg-amber-500/60" : "bg-border"
                }`}
              />
            );
          })}
        </div>

        {/* Animated thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ left: leftStyle }}
          animate={{ scale: isActive ? 1.35 : 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          {/* Value tooltip */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background whitespace-nowrap shadow-lg"
              >
                {value}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thumb circle */}
          <div
            className="h-5 w-5 rounded-full border-2 border-amber-500 bg-background shadow-[0_2px_8px_rgba(0,0,0,0.15)] shadow-amber-500/20"
            style={{ boxShadow: isActive ? "0 0 0 4px hsl(43 74% 49% / 0.2)" : undefined }}
          />
        </motion.div>
      </div>

      {/* Native range input — invisible, captures all pointer events */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onTouchStart={() => setIsActive(true)}
        onTouchEnd={() => setIsActive(false)}
        className="absolute inset-x-2 top-0 h-full w-[calc(100%-16px)] cursor-pointer opacity-0 z-10"
        style={{ touchAction: "none" }}
        aria-label={`${getText(labelMin, lang)} — ${getText(labelMax, lang)}`}
      />

      {/* Min / Max labels */}
      <div className="mt-3 flex justify-between text-xs font-light text-muted-foreground">
        <span>{getText(labelMin, lang)}</span>
        <span className="text-center tabular-nums font-medium text-foreground">
          {value} / {max}
        </span>
        <span>{getText(labelMax, lang)}</span>
      </div>
    </div>
  );
}
