import { useDiagnosisStore } from "@/store/diagnosisStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function GlobalProgressLine() {
    const store = useDiagnosisStore();

    // Track the deepest step the user has reached so we allow forward jumps if they go back
    const [maxStepVisited, setMaxStepVisited] = useState(store.currentStep);

    useEffect(() => {
        if (store.currentStep > maxStepVisited) {
            setMaxStepVisited(store.currentStep);
        }
    }, [store.currentStep, maxStepVisited]);

    const handleSegmentClick = (segmentIndex: number) => {
        // segmentIndex 0 = Context (step 1 is technically context 2 of 2, but let's just jump to step 0)
        // segmentIndex 1 = Category 1 (step 2)
        // segmentIndex 8 = Category 8 (step 9)
        const targetStep = segmentIndex === 0 ? 0 : segmentIndex + 1;

        // Only allow clicking if they have visited that step or it is the very next unlocked step
        if (targetStep <= maxStepVisited) {
            store.setStep(targetStep);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Determine the display step (1 through 8)
    // Step 0-1: Skin Context/Type
    // Step 2-9: Categories 1-8
    // Step 10: Generating
    // Map 0-10 linear journey strictly to 1-8 visual steps
    let rawStep = 1;
    if (store.currentStep >= 2 && store.currentStep <= 9) {
        rawStep = store.currentStep - 1;
    } else if (store.currentStep >= 10) {
        rawStep = 8;
    }

    // Encouragement logic
    let encouragement = "";
    if (store.currentStep <= 1) {
        encouragement = "Initializing scan... Deep-diving into your skin context.";
    } else if (rawStep <= 4) {
        encouragement = "Analysis in progress. You're doing great—stay focused!";
    } else if (rawStep <= 7) {
        encouragement = "Almost there! We're mapping your unique skin vector now.";
    } else {
        encouragement = "Finalizing your results. Get ready for your report.";
    }

    const isFinale = rawStep === 8 || store.currentStep >= 10;
    if (isFinale) {
        encouragement = "Diagnosis complete! High-precision report incoming...";
    }

    // Typography logic
    let textColorClass = "text-foreground/80";
    if (isFinale) {
        textColorClass = "text-[#001A33] dark:text-[#E2E8F0] font-semibold text-[13px] md:text-[15px]";
    }

    // Interactive Segment Logic
    // Total 9 segments: 0 -> Context, 1..8 -> Categories
    // Currently Active Segment
    const activeSegmentIndex = store.currentStep <= 1 ? 0 : store.currentStep - 1;

    return (
        <div className="w-full max-w-xl mx-auto mb-4 flex flex-col gap-2 relative">
            {/* Encouragement text */}
            <div className={cn("text-center hero-serif italic text-xs md:text-sm tracking-wide mb-1 transition-colors duration-500", textColorClass)}>
                {encouragement}
            </div>

            {/* Segmented Stepper */}
            <div className="relative w-full h-[4px] flex gap-[2px] overflow-visible">
                {Array.from({ length: 9 }).map((_, i) => {
                    const isCompleted = i <= activeSegmentIndex || (i === 0 && store.currentStep > 0);
                    // Determine the target step to see if it's clickable
                    const targetStep = i === 0 ? 0 : i + 1;
                    const isClickable = targetStep <= maxStepVisited;

                    // Base fill colors
                    // Light Mode: Sage Green (#97A97C)
                    // Dark Mode: Emerald/Forest Green (#2D5A4C)
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
                                        style={{
                                            boxShadow: "0 0 20px 4px rgba(151, 169, 124, 0.6)"
                                        }}
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

            {/* The Target Label */}
            <div className="text-[11px] md:text-xs font-bold tracking-widest text-primary uppercase">
                {rawStep === 8 && store.currentStep >= 10 ? "PROCESSING DATA" : (store.currentStep <= 1 ? `CONTEXT ${store.currentStep + 1} OF 2` : `CATEGORY ${rawStep} OF 8`)}
            </div>
        </div>
    );
}
