import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/store/diagnosisStore";

export default function GlobalProgressRing() {
    const location = useLocation();
    const store = useDiagnosisStore();
    const [mappedStep, setMappedStep] = useState(1);
    const [label, setLabel] = useState("Skin Context");

    // Only show the global ring on diagnosis, results, checkout pages
    const isActiveFlow = ["/diagnosis", "/results", "/checkout"].includes(location.pathname);

    useEffect(() => {
        // Map the internal 0-10 store step to an 8-step visual journey
        const step = store.currentStep;

        if (step === 0 || step === 1) {
            setMappedStep(1);
            setLabel("Skin Context");
        } else if (step === 2 || step === 3) {
            setMappedStep(2);
            setLabel("Base Metrics");
        } else if (step === 4 || step === 5) {
            setMappedStep(3);
            setLabel("Live Scanning");
        } else if (step === 6) {
            setMappedStep(4);
            setLabel("Biometric Capture");
        } else if (step === 7) {
            setMappedStep(5);
            setLabel("Data Vectorization");
        } else if (step === 8) {
            setMappedStep(6);
            setLabel("Lab Analysis");
        } else if (step === 9) {
            setMappedStep(7);
            setLabel("Protocol Matching");
        } else if (step === 10) {
            setMappedStep(8);
            setLabel("Final Report");
        }
    }, [store.currentStep]);

    if (!isActiveFlow) return null;

    // Visual specs
    const totalSteps = 8;
    const radius = store.currentStep === 10 ? 96 : 48; // Double size during final loading
    const stroke = 2.5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const gap = 2; // 2deg gap for data-node look requires calculation or stroke-dasharray tricks
    const segmentLength = (circumference / totalSteps) - gap;

    // Decide position: top center during survey, dead center during generating report (step 10)
    const isGenerating = store.currentStep === 10;

    return (
        <AnimatePresence>
            <motion.div
                className={cn(
                    "fixed z-50 pointer-events-none transition-all duration-1000 ease-spring flex flex-col items-center justify-center",
                    isGenerating
                        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        : "top-8 left-1/2 -translate-x-1/2"
                )}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <div className={cn(
                    "relative flex items-center justify-center bg-background/60 backdrop-blur-xl rounded-full border border-primary/20 shadow-2xl shadow-black/10 dark:shadow-black/50 transition-all duration-1000",
                    isGenerating ? "p-8" : "p-3"
                )}>
                    <svg
                        height={radius * 2}
                        width={radius * 2}
                        className="transform -rotate-90 transition-all duration-1000"
                        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                    >
                        {Array.from({ length: totalSteps }).map((_, i) => {
                            const isActive = i < mappedStep;
                            const rotation = (360 / totalSteps) * i;

                            return (
                                <g key={i} style={{ transformOrigin: "center", transform: `rotate(${rotation}deg)` }}>
                                    {/* Background Track Segment */}
                                    <circle
                                        stroke="currentColor"
                                        fill="transparent"
                                        strokeWidth={stroke}
                                        strokeDasharray={`${segmentLength} ${circumference}`}
                                        strokeLinecap="round"
                                        r={normalizedRadius}
                                        cx={radius}
                                        cy={radius}
                                        className="text-slate-100 dark:text-[#0F1A2A] transition-colors duration-500"
                                    />
                                    {/* Active Track Segment */}
                                    <circle
                                        s
                                        fill="transparent"
                                        strokeWidth={stroke}
                                        strokeDasharray={`${segmentLength} ${circumference}`}
                                        strokeLinecap="round"
                                        r={normalizedRadius}
                                        cx={radius}
                                        cy={radius}
                                        className={cn(
                                            "text-[#97A97C] transition-all duration-700 ease-in-out", // Sage Green
                                            isActive ? "opacity-100" : "opacity-0"
                                        )}
                                        style={{
                                            filter: isActive ? "drop-shadow(0 0 4px rgba(151,169,124,0.4))" : "none",
                                        }}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Center Text (Annulus interior) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        {isGenerating && (
                            <motion.span
                                key={label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="hero-serif text-lg md:text-xl text-foreground font-medium tracking-wide mb-1"
                            >
                                {label}
                            </motion.span>
                        )}
                        <span className={cn(
                            "hero-serif italic tracking-wide text-foreground",
                            isGenerating ? "text-sm text-muted-foreground" : "text-xs"
                        )}>
                            Step {Math.max(1, mappedStep)} / {totalSteps}
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
