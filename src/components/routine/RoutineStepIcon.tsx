// src/components/routine/RoutineStepIcon.tsx
// Inline SVG icons for skincare routine steps
// Each icon renders inside a circular container

interface StepIconProps {
  stepKey: string;
  size?: number;
  color?: string;
  bgColor?: string;
}

// ── Cleanser: Two bubbles ────────────────────────────────────────────────────
function CleanserIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="10" r="6" />
      <circle cx="17" cy="8" r="4" />
      {/* Shine highlights */}
      <path d="M7 7.5 Q7.5 6.5 8.5 7" />
      <path d="M15.5 6 Q16 5.5 16.8 6" />
    </svg>
  );
}

// ── Toner: Water droplet ─────────────────────────────────────────────────────
function TonerIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 C12 2.5 5 10 5 14.5 C5 18.36 8.13 21.5 12 21.5 C15.87 21.5 19 18.36 19 14.5 C19 10 12 2.5 12 2.5Z" />
      {/* Inner shine */}
      <path d="M9 14 Q9 11 12 8" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

// ── Serum: Dropper/Pipette with drop ─────────────────────────────────────────
function SerumIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Squeeze bulb */}
      <path d="M10 2 C8.5 2 7.5 3 7.5 4.5 C7.5 6 8.5 7 10 7 L14 7 C15.5 7 16.5 6 16.5 4.5 C16.5 3 15.5 2 14 2Z" />
      {/* Collar */}
      <rect x="10.5" y="7" width="3" height="2" rx="0.5" />
      {/* Pipette body */}
      <path d="M11 9 L11 16 Q11 17 12 17 Q13 17 13 16 L13 9" />
      {/* Tip */}
      <path d="M11.5 17 L12 18.5 L12.5 17" />
      {/* Drop */}
      <path d="M12 20 Q11.2 21 12 22 Q12.8 21 12 20Z" fill={color} stroke="none" />
    </svg>
  );
}

// ── Moisturizer: Cream jar with lid ──────────────────────────────────────────
function MoisturizerIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Jar body */}
      <path d="M5 12 L5 18 Q5 21 8 21 L16 21 Q19 21 19 18 L19 12Z" />
      {/* Lid */}
      <rect x="4" y="9.5" width="16" height="3" rx="1.5" />
      {/* Cream peeking */}
      <path d="M8 9.5 Q10 7 12 8 Q14 9 16 7.5" strokeWidth="1.5" />
      {/* Jar line */}
      <line x1="7" y1="16" x2="17" y2="16" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

// ── Eye cream: Closed eye ────────────────────────────────────────────────────
function EyeCareIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Closed eye curve */}
      <path d="M3 12 Q7 16 12 16 Q17 16 21 12" />
      {/* Eyelashes */}
      <path d="M5 13 L4 15.5" />
      <path d="M8.5 14.5 L7.5 17" />
      <path d="M12 15.5 L12 18" />
      <path d="M15.5 14.5 L16.5 17" />
      <path d="M19 13 L20 15.5" />
    </svg>
  );
}

// ── SPF: Shield with plus ────────────────────────────────────────────────────
function SPFIcon({ size = 18, color = '#C9A96E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L4 6 L4 12 C4 17.5 7.8 21.7 12 22 C16.2 21.7 20 17.5 20 12 L20 6Z" />
      {/* Plus */}
      <line x1="12" y1="9" x2="12" y2="15" strokeWidth="2" />
      <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2" />
    </svg>
  );
}

// ── Device: Handheld beauty device (galvanic/LED) ────────────────────────────
function DeviceIcon({ size = 18, color = '#C9A96E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Device head (rounded) */}
      <ellipse cx="12" cy="5.5" rx="4" ry="3.5" />
      {/* Neck */}
      <path d="M10 8.5 L10 11 L14 11 L14 8.5" />
      {/* Handle body */}
      <rect x="9.5" y="11" width="5" height="9" rx="2.5" />
      {/* Button */}
      <circle cx="12" cy="15" r="1" fill={color} stroke="none" />
      {/* Base */}
      <line x1="10" y1="20" x2="14" y2="20" strokeWidth="2" />
    </svg>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  cleanser: CleanserIcon,
  toner: TonerIcon,
  serum: SerumIcon,
  moisturizer: MoisturizerIcon,
  eye_care: EyeCareIcon,
  spf: SPFIcon,
  device: DeviceIcon,
};

export default function RoutineStepIcon({
  stepKey,
  size = 36,
  color,
  bgColor,
}: StepIconProps) {
  const IconComponent = ICON_MAP[stepKey];
  if (!IconComponent) return null;

  const isGold = stepKey === 'spf' || stepKey === 'device';
  const iconColor = color ?? (isGold ? '#C9A96E' : '#9CA3AF');
  const bg = bgColor ?? (isGold ? 'rgba(201, 169, 110, 0.15)' : '#333A4D');

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: isGold ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <IconComponent size={size * 0.5} color={iconColor} />
    </div>
  );
}

export { RoutineStepIcon };
