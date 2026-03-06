import { motion } from "framer-motion";
import { useState, useRef } from "react"; // Added useRef
import { cn } from "@/lib/utils"; // Added cn import
import { useI18nStore } from "@/store/i18nStore"; // Added useI18nStore import
import LabCard from "./LabCard";

interface TimelineSliderProps {
  label: string;
  value: number; // 0-24
  onChange: (v: number) => void;
  unit?: string;
  markers?: { value: number; label: string }[];
}

const TimelineSlider = ({ label, value, onChange, unit = "hrs", markers }: TimelineSliderProps) => {
  // Removed `dragging` state
  const sliderRef = useRef<HTMLDivElement>(null); // Added sliderRef
  const { language } = useI18nStore(); // Added language from i18nStore

  // The `handlePointerDown` function was incomplete in the instruction,
  // and its purpose isn't fully clear without the body.
  // Assuming it's part of a refactor that removes the `dragging` state,
  // but since the instruction only provided a partial line, I'll omit it
  // as it's not directly related to the translation change and would be incomplete.
  // If it's meant to replace the drag logic, more context would be needed.

  const pct = (value / 24) * 100;

  const shineOpacity = Math.min(0.6, value / 24);

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      <div className="mt-4 relative">
        {/* Track */}
        <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="absolute h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(var(--severity-clear)), hsl(var(--severity-mild)), hsl(var(--severity-severe)))`,
            }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Slider input — taller touch target */}
        <input
          type="range"
          min={0}
          max={24}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          // Removed onMouseDown, onMouseUp, onTouchStart, onTouchEnd props
          className="absolute inset-x-0 w-full opacity-0 cursor-pointer touch-manipulation"
          style={{ top: "-14px", height: "44px" }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute -translate-y-1/2 h-6 w-6 rounded-full border-2 border-primary bg-background pointer-events-none shadow-lg"
          style={{ left: `calc(${pct}% - 12px)`, top: "6px" }}
        // Removed animate prop as `dragging` state is removed
        />
      </div>

      {/* Markers */}
      {markers && (
        <div className="mt-3 flex justify-between">
          {markers.map((m) => (
            <span key={m.value} className="text-[10px] text-muted-foreground">{m.label}</span>
          ))}
        </div>
      )}

      {/* Value display */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <motion.span
          className="text-2xl font-display text-foreground"
          key={value}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {value}
        </motion.span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {/* Oil intensity indicator */}
      {value > 0 && value < 24 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <motion.div
                key={level}
                className={`h-2 w-6 rounded-full ${(value <= 8 && level <= 3) || (value <= 14 && level <= 2) || level <= 1
                    ? "bg-primary"
                    : "bg-border"
                  }`}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <span className="text-secondary-foreground font-medium">
            {value <= 6 ? (language === "de" ? "Hohe Ölproduktion" : "High oil production") : value <= 12 ? (language === "de" ? "Moderat" : "Moderate") : (language === "de" ? "Gering" : "Low")}
          </span>
        </div>
      )}
    </LabCard>
  );
};

export default TimelineSlider;
