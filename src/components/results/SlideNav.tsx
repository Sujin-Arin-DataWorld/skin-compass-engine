import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideNavProps {
  current: number;
  total: number;
  labels: string[];
  fullLabels?: string[];
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (idx: number) => void;
}

const SlideNav = ({ current, total, labels, fullLabels, onPrev, onNext, onGoTo }: SlideNavProps) => (
  <>
    {/* Dot indicators + narrative label */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className="transition-all duration-300 rounded-full"
            style={
              i === current
                ? {
                    height: "8px",
                    background: "hsl(var(--primary))",
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "fit-content",
                  }
                : {
                    width: "8px",
                    height: "8px",
                    background: i < current ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
                  }
            }
            aria-label={labels[i]}
          >
            {i === current && (
              <span
                style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: "hsl(var(--primary-foreground))",
                  whiteSpace: "nowrap",
                }}
              >
                {labels[i]}
              </span>
            )}
          </button>
        ))}
      </div>
      {fullLabels && (
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {fullLabels[current]}
        </span>
      )}
    </div>

    {/* Arrow buttons (desktop) */}
    {current > 0 && (
      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    )}
    {current < total - 1 && (
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    )}

    {/* Swipe hint (mobile, slide 1 only) */}
    {current === 0 && (
      <motion.div
        className="absolute right-6 top-1/2 -translate-y-1/2 md:hidden flex flex-col items-center gap-1 text-muted-foreground/40"
        animate={{ x: [0, 8, 0] }}
        transition={{ repeat: 3, duration: 0.8, delay: 2 }}
        aria-hidden="true"
      >
        <span className="text-[10px]">swipe</span>
        <ChevronRight className="h-4 w-4" />
      </motion.div>
    )}
  </>
);

export default SlideNav;
