/**
 * Shared ProductImage component — used across Results, Profile, Lab pages
 * Tries /productsimage/{id}.jpg, falls back to first letter of product name
 */
import { useState } from 'react';

interface ProductImageProps {
  productId: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 48, md: 80, lg: 120 } as const;

export default function ProductImage({ productId, name, size = 'md', className = '' }: ProductImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const px = SIZES[size];

  return (
    <div
      className={`rounded-xl overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: px, height: px, background: '#242B3D' }}
    >
      {status !== 'error' && (
        <img
          src={`/productsimage/${productId}.jpg`}
          alt={name}
          className="w-full h-full object-cover"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          style={{ display: status === 'loaded' ? 'block' : 'none' }}
        />
      )}
      {status === 'error' && (
        <div className="w-full h-full flex items-center justify-center p-2">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: px * 0.28, color: '#c4a265', opacity: 0.4 }}>
            {name[0]}
          </span>
        </div>
      )}
      {status === 'loading' && (
        <div className="w-full h-full animate-pulse" style={{ background: '#333A4D' }} />
      )}
    </div>
  );
}
