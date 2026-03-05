import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
    currentStep: number;
    totalSteps?: number;
    label?: string;
    className?: string;
}

export default function AnalysisProgress({
    currentStep,
    totalSteps = 8,
    label = "Analyzing...",
    className,
}: AnalysisProgressProps) {
    const radius = 64; // Adjusted for a refined size
    const stroke = 2.5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const gap = 8; // Micro-gap between segments
    const segmentLength = (circumference / totalSteps) - gap;

    return (
        <div className={cn("relative flex items-center justify-center bg-background/60 backdrop-blur-xl rounded-full p-4 border border-primary/20 shadow-2xl shadow-black/10 dark:shadow-black/50", className)}>
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
                viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            >
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const isActive = i < currentStep;
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
                                className="text-slate-200 dark:text-[#0F1A2A] transition-colors duration-500" // using deep navy for dark mode
                            />
                            {/* Active Track Segment */}
                            <circle
                                stroke="currentColor"
                                fill="transparent"
                                strokeWidth={stroke}
                                strokeDasharray={`${segmentLength} ${circumference}`}
                                strokeLinecap="round"
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className={cn(
                                    "text-primary transition-all duration-700 ease-in-out",
                                    isActive ? "opacity-100" : "opacity-0"
                                )}
                                style={{
                                    filter: isActive ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" : "none",
                                }}
                            />
                        </g>
                    );
                })}
            </svg>
            {/* Center Text (Annulus interior) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.span
                    key={label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="hero-serif text-[13px] md:text-[15px] text-foreground font-medium tracking-wide"
                >
                    {label}
                </motion.span>
                <span className="text-[10px] md:text-xs text-muted-foreground mt-1 hero-serif italic tracking-wide">
                    Step {Math.max(1, currentStep)}/{totalSteps}
                </span>
            </div>
        </div>
    );
}
