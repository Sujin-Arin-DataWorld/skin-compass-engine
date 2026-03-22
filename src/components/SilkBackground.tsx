/**
 * SilkBackground.tsx
 * Flat background per designTokens.ts brand palette.
 * Dark: #0A0A0A (Apple black) | Light: #FAFAF8 (warm white)
 * NO gradients, NO orbs, NO HSL — just flat color.
 */

export default function SilkBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {/* Dark: #0A0A0A, Light: #FAFAF8 — from designTokens.ts brand.bg */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--ssl-bg, #FAFAF8)' }}
      />
    </div>
  );
}
