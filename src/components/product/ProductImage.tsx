/**
 * ProductImage.tsx — Shared product image component
 *
 * Used across Results, Profile, Lab pages.
 * Features:
 *   - Strict aspect-ratio lock (1:1) to prevent CLS
 *   - Premium shimmer skeleton loader that adapts to dark/light mode
 *   - Graceful fallback: product name's first letter in styled circle
 *   - Tries /productsimage/{id}.jpg
 */
import { useState } from 'react';
import { useTheme } from 'next-themes';

interface ProductImageProps {
  productId: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 48, md: 80, lg: 120 } as const;

export default function ProductImage({ productId, name, size = 'md', className = '' }: ProductImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const px = SIZES[size];

  // Theme-aware colors
  const containerBg = isDark ? '#1C1C1E' : '#F3F3EF';
  const shimmerBase = isDark ? '#2C2C2E' : '#E8E8E4';
  const shimmerHighlight = isDark ? '#3A3A3C' : '#F5F5F3';
  const fallbackColor = isDark ? '#4A9E68' : '#5E8B68';
  const fallbackBg = isDark ? 'rgba(45,107,74,0.10)' : 'rgba(94,139,104,0.06)';

  return (
    <div
      className={`overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        borderRadius: size === 'sm' ? 10 : 14,
        background: containerBg,
        // Strict aspect-ratio lock prevents layout shift
        aspectRatio: '1 / 1',
        position: 'relative',
      }}
    >
      {/* Image */}
      {status !== 'error' && (
        <img
          src={`/productsimage/${productId}.jpg`}
          alt={name}
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: status === 'loaded' ? 'block' : 'none',
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Error fallback: styled letter */}
      {status === 'error' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: fallbackBg,
            borderRadius: 'inherit',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: px * 0.32,
              fontWeight: 600,
              color: fallbackColor,
              opacity: 0.55,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {(name || '?')[0]}
          </span>
        </div>
      )}

      {/* Loading: premium shimmer skeleton */}
      {status === 'loading' && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `linear-gradient(
              110deg,
              ${shimmerBase} 0%,
              ${shimmerBase} 40%,
              ${shimmerHighlight} 50%,
              ${shimmerBase} 60%,
              ${shimmerBase} 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'productImageShimmer 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Inline keyframes — injected once */}
      <style>{`
        @keyframes productImageShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
