import { motion } from "framer-motion";
import { DiagnosisResult, AXIS_LABELS, AxisKey } from "@/engine/types";

const SKIN_PATTERNS: Record<string, { name: string; tagline: string; icon: string }> = {
  acne:              { name: "The Reactive Combatant",   tagline: "Your skin fights back — and needs a peace treaty",          icon: "🔴" },
  seb:               { name: "The Overproducer",         tagline: "Excess sebum masking an underlying imbalance",              icon: "✨" },
  hyd:               { name: "The Thirsty Skin",         tagline: "Depleted reservoirs beneath the surface",                   icon: "💧" },
  bar:               { name: "The Compromised Shield",   tagline: "Your barrier needs rebuilding from the inside out",         icon: "🛡" },
  sen:               { name: "The Hyper-Aware",          tagline: "Finely tuned — but easily overwhelmed",                    icon: "⚡" },
  ox:                { name: "The Oxidative Burden",     tagline: "Environmental stress leaving its mark on your skin",        icon: "☀️" },
  pigment:           { name: "The Memory Keeper",        tagline: "Your skin holds onto every story — literally",              icon: "🌑" },
  texture:           { name: "The Surface Story",        tagline: "Pore congestion and keratinisation demanding attention",    icon: "⚪" },
  aging:             { name: "The Time Traveller",       tagline: "Collagen loss ahead of the curve — correctable",            icon: "⏳" },
  makeup_stability:  { name: "The Wear Warrior",         tagline: "Your base fights gravity, oil and time — all day",          icon: "💄" },
};

interface Props {
  result: DiagnosisResult;
}

const SlidePatternReveal = ({ result }: Props) => {
  const topAxis = result.primary_concerns[0] ?? "bar";
  const pattern = SKIN_PATTERNS[topAxis] ?? SKIN_PATTERNS.bar;
  const patternName = result.detected_patterns[0]?.pattern.name_en;

  const topSignals = result.primary_concerns.slice(0, 3).map((axis) => ({
    axis,
    label: AXIS_LABELS[axis],
    score: Math.round(result.axis_scores[axis]),
  }));

  const words = (patternName || pattern.name).split(" ");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center overflow-y-auto">
      {/* Completion tag */}
      <motion.p
        className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        Category 8 of 8 complete
      </motion.p>

      {/* Icon */}
      <motion.div
        className="mt-6 text-5xl"
        initial={{ opacity: 0, scale: 0.5, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {pattern.icon}
      </motion.div>

      {/* Pattern label */}
      <motion.p
        className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Your Skin Pattern
      </motion.p>

      {/* Pattern name — word by word */}
      <h1 className="mt-3 font-display text-4xl sm:text-5xl text-foreground leading-tight">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        ))}
      </h1>

      {/* Tagline */}
      <motion.p
        className="mt-4 max-w-md text-base text-muted-foreground leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        {pattern.tagline}
      </motion.p>

      {/* Divider */}
      <motion.div
        className="mt-8 h-px w-32 bg-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />

      {/* Top 3 signals */}
      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        {topSignals.map((s) => (
          <div key={s.axis} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm text-foreground font-medium">{s.label}</span>
            <span className="text-sm text-muted-foreground">{s.score}/100</span>
          </div>
        ))}
      </motion.div>

      {/* CTA hint */}
      <motion.p
        className="mt-10 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.6 }}
      >
        Swipe to see your full profile →
      </motion.p>
    </div>
  );
};

export default SlidePatternReveal;
