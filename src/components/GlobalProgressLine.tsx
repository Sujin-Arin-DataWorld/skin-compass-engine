import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore, translations } from "@/store/i18nStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface GlobalProgressLineProps {
    /** Override segment count (default 9 for legacy flow, dynamic for axis flow) */
    totalSegments?: number;
    /** Override the active segment index (0-based). Falls back to computed value. */
    activeSegment?: number;
    /** Override the label shown below the bar */
    stepLabel?: string;
}

export default function GlobalProgressLine({
    totalSegments,
    activeSegment: activeSegmentOverride,
    stepLabel,
}: GlobalProgressLineProps = {}) {
    const store = useDiagnosisStore();
    const { language } = useI18nStore();
    const t = translations[language];

    const segments = totalSegments ?? 9;

    // Track the deepest step the user has reached so we allow forward jumps if they go back
    const [maxStepVisited, setMaxStepVisited] = useState(store.currentStep);

    useEffect(() => {
        if (store.currentStep > maxStepVisited) {
            setMaxStepVisited(store.currentStep);
        }
    }, [store.currentStep, maxStepVisited]);

    const handleSegmentClick = (segmentIndex: number) => {
        const targetStep = segmentIndex;
        if (targetStep <= maxStepVisited) {
            store.setStep(targetStep);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Active segment: use override if provided, else compute from currentStep
    const activeSegmentIndex = activeSegmentOverride ?? (store.currentStep <= 1 ? 0 : store.currentStep - 1);
    const isLastSegment = activeSegmentIndex >= segments - 1;
    const isFinale = isLastSegment || store.currentStep >= segments + 1;

    // Encouragement logic
    const progress = activeSegmentIndex / Math.max(1, segments - 1);
    let encouragement = t.diagnosis.progress.enc1;
    if (isFinale) {
        encouragement = t.diagnosis.progress.encFinal;
    } else if (progress >= 0.75) {
        encouragement = t.diagnosis.progress.enc4;
    } else if (progress >= 0.5) {
        encouragement = t.diagnosis.progress.enc3;
    } else if (progress >= 0.25) {
        encouragement = t.diagnosis.progress.enc2;
    }

    // Typography logic
    let textColorClass = "text-foreground/80";
    if (isFinale) {
        textColorClass = "text-[#001A33] dark:text-[#E2E8F0] font-semibold text-[13px] md:text-[15px]";
    }

    const displayLabel = stepLabel ?? (
        isFinale
            ? t.diagnosis.progress.processing
            : `${t.diagnosis.progress.category} ${activeSegmentIndex + 1} ${t.diagnosis.progress.of} ${segments}`
    );

    return (
        <div className="w-full max-w-xl mx-auto mb-4 flex flex-col gap-2 relative">
            {/* Encouragement text */}
            <div className={cn("text-center hero-serif italic text-xs md:text-sm tracking-wide mb-1 transition-colors duration-500", textColorClass)}>
                {encouragement}
            </div>

            {/* Segmented Stepper */}
            <div className="relative w-full h-[4px] flex gap-[2px] overflow-visible">
                {Array.from({ length: segments }).map((_, i) => {
                    const isCompleted = i <= activeSegmentIndex;
                    const isClickable = i <= maxStepVisited;
                    const fillClass = isCompleted ? "bg-[#97A97C] dark:bg-[#2D5A4C]" : "bg-[#F8FAFC] dark:bg-foreground/10";
                    const isPulse = isFinale && isCompleted;

                    return (
                        <div
                            key={i}
                            onClick={() => { if (isClickable) handleSegmentClick(i); }}
                            className={cn(
                                "relative w-full h-full rounded-full transition-all duration-300 shadow-sm",
                                fillClass,
                                isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                            )}
                        >
                            {isPulse && (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-full"
                                        style={{ boxShadow: "0 0 20px 4px rgba(151, 169, 124, 0.6)" }}
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent bg-[length:200%_auto] animate-shimmer" />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step label */}
            <div className="text-[11px] md:text-xs font-bold tracking-widest text-primary uppercase">
                {displayLabel}
            </div>
        </div>
    );
}
