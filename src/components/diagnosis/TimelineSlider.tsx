import { motion } from "framer-motion";
import { useState } from "react";
import LabCard from "./LabCard";

interface TimelineSliderProps {
  label: string;
  value: number; // 0-24
  onChange: (v: number) => void;
  unit?: string;
  markers?: { value: number; label: string }[];
}

const TimelineSlider = ({ label, value, onChange, unit = "hrs", markers }: TimelineSliderProps) => {
  const [dragging, setDragging] = useState(false);
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
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          className="absolute inset-x-0 w-full opacity-0 cursor-pointer touch-manipulation"
          style={{ top: "-14px", height: "44px" }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute -translate-y-1/2 h-6 w-6 rounded-full border-2 border-primary bg-background pointer-events-none shadow-lg"
          style={{ left: `calc(${pct}% - 12px)`, top: "6px" }}
          animate={{ scale: dragging ? 1.3 : 1 }}
          transition={{ duration: 0.15 }}
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

      {/* Shine preview */}
      <motion.div
        className="mt-3 mx-auto h-16 w-32 rounded-full overflow-hidden relative border border-border"
        style={{ background: "hsl(var(--secondary))" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.3), transparent 60%)",
          }}
          animate={{ opacity: shineOpacity }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </LabCard>
  );
};

export default TimelineSlider;
