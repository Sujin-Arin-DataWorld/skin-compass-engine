import { motion } from "framer-motion";
import LabCard from "./LabCard";
import { useI18nStore, translations } from "@/store/i18nStore";

interface RecoveryAnimationProps {
  recoverySpeed: number; // 0-3 (0 = fast recovery, 3 = very slow)
  onChange: (v: number) => void;
}

const RecoveryAnimation = ({ recoverySpeed, onChange }: RecoveryAnimationProps) => {
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;

  const RECOVERY_LABELS = [
    { label: t.diagnosis.ui.recoveryFast, desc: t.diagnosis.ui.recoversHours },
    { label: t.diagnosis.ui.recoveryMedium, desc: t.diagnosis.ui.daysToSettle },
    { label: t.diagnosis.ui.recoverySlow, desc: t.diagnosis.ui.daysIrritation },
    { label: t.diagnosis.ui.recoveryVerySlow, desc: t.diagnosis.ui.weekRecovery },
  ];

  // Recovery animation duration maps to selected speed
  const animDuration = recoverySpeed === 0 ? 1 : recoverySpeed === 1 ? 3 : recoverySpeed === 2 ? 6 : 10;
  const irritationLevel = recoverySpeed / 3;

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {t.diagnosis.ui.recoverySpeedLabel}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {t.diagnosis.ui.calmAfterIrritation}
      </p>

      <div className="flex flex-col items-center gap-5">
        {/* Animated skin surface — warm beige/peach */}
        <div
          className="relative w-full max-w-[260px] h-28 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(28, 40%, 82%), hsl(20, 30%, 75%))",
            border: "1px solid hsl(28, 30%, 72%)",
          }}
        >
          {/* Irritation overlay (red → calm) */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, 
                hsl(var(--severity-severe) / ${0.1 + irritationLevel * 0.4}), 
                transparent 70%)`,
            }}
            animate={{
              opacity: [1, 1 - (1 / (recoverySpeed + 1)), 0.05],
            }}
            transition={{
              duration: animDuration,
              repeat: Infinity,
              repeatDelay: 1,
              ease: [0.4, 0, 0.2, 1],
            }}
          />

          {/* Surface disruption lines */}
          {recoverySpeed >= 2 && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  35deg,
                  transparent,
                  transparent 6px,
                  hsl(var(--severity-severe) / 0.08) 6px,
                  hsl(var(--severity-severe) / 0.08) 6.5px
                )`,
              }}
              animate={{ opacity: [0.6, 0.1] }}
              transition={{
                duration: animDuration,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          )}

          {/* Status text */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <motion.span
              className="text-[10px]"
              style={{ color: "hsl(20, 30%, 35%)" }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: animDuration, repeat: Infinity, repeatDelay: 1 }}
            >
              {recoverySpeed === 0 ? t.diagnosis.ui.quickRecovery : t.diagnosis.ui.recoveringCycle.replace("{s}", animDuration.toString())}
            </motion.span>
          </div>
        </div>

        {/* Selector — warm peach tones for unselected */}
        <div className="flex w-full gap-1">
          {RECOVERY_LABELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2.5 text-center transition-all min-h-[44px] ${recoverySpeed === i
                ? i === 0
                  ? "bg-severity-clear/20 text-severity-clear"
                  : i === 1
                    ? "bg-severity-mild/20 text-severity-mild"
                    : i === 2
                      ? "bg-severity-moderate/20 text-severity-moderate"
                      : "bg-severity-severe/20 text-severity-severe"
                : "text-muted-foreground hover:opacity-80"
                }`}
              style={
                recoverySpeed !== i
                  ? { background: "hsla(25, 35%, 78%, 0.35)" }
                  : undefined
              }
            >
              <span className="text-xs font-medium">{lvl.label}</span>
            </button>
          ))}
        </div>
      </div>
    </LabCard>
  );
};

export default RecoveryAnimation;
