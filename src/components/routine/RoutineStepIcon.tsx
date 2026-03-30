// src/components/routine/RoutineStepIcon.tsx
// Copyright-free inline SVG icons for skincare routine steps
// All SVGs are hand-coded (mathematical coordinates) — zero image files, zero licensing issues
// stroke="currentColor" inherits from parent via the `color` prop

interface StepIconProps {
  stepKey: string;
  size?: number;
  color?: string;
  bgColor?: string;
}

// ── 1. Cleanser: Three bubbles (거품) ────────────────────────────────────────
function CleanserIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5" />
      <circle cx="16" cy="10" r="3" />
      <circle cx="15" cy="18" r="2" />
    </svg>
  );
}

// ── 2. Toner: Water droplet (물방울) ─────────────────────────────────────────
function TonerIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

// ── 3. Serum: Dropper/Pipette (스포이드) ──────────────────────────────────────
function SerumIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4a2.5 2.5 0 0 0-5 0v5h5V4z" />
      <path d="M12 9v8" />
      <path d="M10 17l4 0" />
      <circle cx="12" cy="20.5" r="1.5" />
    </svg>
  );
}

// ── 4. Moisturizer: Cream jar (단지형 크림통) ────────────────────────────────
function MoisturizerIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <rect x="4" y="7" width="16" height="4" rx="1" />
    </svg>
  );
}

// ── 5. Eye cream: Closed eye with lashes (감은 눈 + 속눈썹) ──────────────────
function EyeCareIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10c4.5 4.5 13.5 4.5 18 0" />
      <path d="M12 14v3" />
      <path d="M8 13.5l-1.5 2.5" />
      <path d="M16 13.5l1.5 2.5" />
    </svg>
  );
}

// ── 6. SPF: Shield with plus (방패 + 십자) ───────────────────────────────────
function SPFIcon({ size = 18, color = '#C9A96E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

// ── 7. Device: Galvanic/LED beauty device (둥근 헤드 + LED + 손잡이) ──────────
function DeviceIcon({ size = 18, color = '#C9A96E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="11" width="8" height="11" rx="4" />
      <path d="M8 11V6a4 4 0 0 1 8 0v5" />
      <circle cx="12" cy="6" r="1" />
      <circle cx="12" cy="16" r="1.5" fill={color} stroke="none" />
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
