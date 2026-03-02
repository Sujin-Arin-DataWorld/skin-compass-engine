import { ReactNode } from "react";

/**
 * FaceBase — shared face SVG used by all category interactive components.
 * Extracted from Category 1 (FaceMapInteractive) as the single source of truth.
 *
 * The face is always transparent (fill="none") so overlays sit on top
 * and the card background shows through.
 *
 * Uses tokens:
 *   --face-stroke   — main outline
 *   --face-detail   — eyes, mouth, nose, hairline
 */

interface FaceBaseProps {
    /** SVG viewBox, default matches Category 1 reference */
    viewBox?: string;
    /** Tailwind className for sizing */
    className?: string;
    /** Overlays rendered inside the SVG (zones, thermal glow, etc.) */
    children?: ReactNode;
}

const FaceBase = ({
    viewBox = "30 10 140 170",
    className = "w-full max-w-[280px] min-h-[220px] h-auto touch-manipulation",
    children,
}: FaceBaseProps) => (
    <svg viewBox={viewBox} className={className}>
        {/* Face outline */}
        <ellipse
            cx="100" cy="95" rx="48" ry="60"
            fill="none"
            stroke="hsl(var(--face-stroke))"
            strokeWidth="1.8"
        />

        {/* Hairline */}
        <path
            d="M 55 55 Q 60 25 100 20 Q 140 25 145 55"
            fill="none"
            stroke="hsl(var(--face-detail) / 0.5)"
            strokeWidth="1"
        />

        {/* Left eye */}
        <ellipse
            cx="82" cy="80" rx="8" ry="4"
            fill="none"
            stroke="hsl(var(--face-detail))"
            strokeWidth="0.8"
        />

        {/* Right eye */}
        <ellipse
            cx="118" cy="80" rx="8" ry="4"
            fill="none"
            stroke="hsl(var(--face-detail))"
            strokeWidth="0.8"
        />

        {/* Nose */}
        <path
            d="M 97 85 L 100 100 L 103 100"
            fill="none"
            stroke="hsl(var(--face-detail) / 0.5)"
            strokeWidth="0.6"
        />

        {/* Mouth */}
        <path
            d="M 90 125 Q 100 132 110 125"
            fill="none"
            stroke="hsl(var(--face-detail))"
            strokeWidth="0.8"
        />

        {/* Overlay slot */}
        {children}
    </svg>
);

export default FaceBase;
