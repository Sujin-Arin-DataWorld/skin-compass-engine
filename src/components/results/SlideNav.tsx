/**
 * SlideNav.tsx — Top text bar slide navigation
 * Replaces old bottom circle dots with top text links below the green progress bar.
 * Per SLIDE-0-PATCH-1-FIXES.md Fix #7
 */

import { tokens } from '@/lib/designTokens';
import { useTheme } from 'next-themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavProps {
  current: number;
  total: number;
  labels: string[];
  fullLabels?: string[];
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (idx: number) => void;
}

const SlideNav = ({ current, total, labels, onPrev, onNext, onGoTo }: SlideNavProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);

  return (
    <>
      {/* Top text navigation bar — below green progress line */}
      <div style={{
        position: 'absolute',
        top: 58, // below navbar (57px) + progress bar (0.5px)
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        gap: 'clamp(16px, 4vw, 32px)',
        padding: '4px 0',
        borderBottom: `1px solid ${tok.border}`,
        background: isDark ? 'rgba(10,10,10,0.78)' : 'rgba(250,250,248,0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current;
          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              style={{
                fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                fontWeight: 500,
                color: isActive ? tok.accent : tok.textTertiary,
                background: isActive ? (isDark ? 'rgba(45,107,74,0.08)' : 'rgba(94,139,104,0.06)') : 'transparent',
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = tok.text;
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = tok.textTertiary;
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              aria-label={labels[i]}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>

      {/* Arrow buttons (desktop only) — keep these */}
      {current > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            border: `1px solid ${tok.border}`,
            background: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(250,250,248,0.6)',
            backdropFilter: 'blur(8px)',
            color: tok.textSecondary,
            transition: 'all 0.15s ease',
          }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            border: `1px solid ${tok.border}`,
            background: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(250,250,248,0.6)',
            backdropFilter: 'blur(8px)',
            color: tok.textSecondary,
            transition: 'all 0.15s ease',
          }}
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default SlideNav;
