/**
 * StickyCartBar.tsx — Floating Pill Design
 *
 * 1-line floating capsule at bottom center.
 * Left: product count + price.  Right: compact CTA.
 * Trust badges moved to SlideMacroDashboard bottom.
 */

import { useMemo, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useI18nStore } from '@/store/i18nStore';
import { useCartStore } from '@/store/cartStore';
import { tokens, ctaTokens, ctaGlowToken } from '@/lib/designTokens';
import { useTheme } from 'next-themes';
import { getProductPrice } from './sharedResultsData';
import type { RealProduct, RoutineStep } from '@/engine/routineEngine';

// ── i18n ──────────────────────────────────────────────────────────────────────

const COPY = {
  cart_products: { ko: '{N}개 제품', de: '{N} Produkte', en: '{N} products' },
  cart_supply: { ko: '~{W}주분', de: '~{W}W', en: '~{W}wk' },
  cart_cta: { ko: '루틴 시작 →', de: 'Starten →', en: 'Start →' },
} as const;

type LangKey = 'en' | 'de' | 'ko';

function t(key: keyof typeof COPY, lang: LangKey, vars?: Record<string, string | number>): string {
  let str: string = COPY[key][lang] ?? COPY[key].en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BarrierProduct {
  id: string;
  price: number;
  role: string;
  emoji: string;
}

interface StickyCartBarProps {
  steps: Array<RoutineStep & { product: RealProduct }>;
  cycleDays: number;
  slideNavHeight?: number;
  barrierProducts?: BarrierProduct[];
  onCta?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const DISCOUNT_PCT = 0.18;

const StickyCartBar = memo(function StickyCartBar({
  steps,
  cycleDays,
  barrierProducts,
  onCta,
}: StickyCartBarProps) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en' as LangKey;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);

  // ── Zombie cart prevention: validate on mount ─────────────────────────────
  useEffect(() => {
    useCartStore.getState().validateCart().then(({ removedCount, priceUpdated }) => {
      if (removedCount > 0 || priceUpdated) {
        const msg = lang === 'ko'
          ? '장바구니가 최신 가격 및 재고로 업데이트되었습니다.'
          : lang === 'de'
            ? 'Ihr Warenkorb wurde mit aktuellen Preisen und Verfügbarkeiten aktualisiert.'
            : 'Your cart has been updated with the latest prices and availability.';
        toast.info(msg);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isBarrierMode = (barrierProducts?.length ?? 0) > 0;

  const pricing = useMemo(() => {
    const totalOriginal = isBarrierMode
      ? barrierProducts!.reduce((sum, p) => sum + p.price, 0)
      : steps.reduce((sum, s) => sum + getProductPrice(s.product.id), 0);
    const totalDiscounted = Math.round(totalOriginal * (1 - DISCOUNT_PCT));
    const supplyDays = cycleDays * 2;
    const supplyWeeks = Math.round(supplyDays / 7);
    return { totalOriginal, totalDiscounted, supplyWeeks };
  }, [steps, cycleDays, barrierProducts, isBarrierMode]);

  const productCount = isBarrierMode ? (barrierProducts?.length ?? 0) : steps.length;

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { y: 60, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 'calc(4rem + 12px + env(safe-area-inset-bottom, 0px))', // BUG-5 FIX: 4rem = bottom nav height
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        zIndex: 50,
        borderRadius: 99,
        padding: '8px 8px 8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: isDark ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)'
          : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
        <span style={{
          fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)',
          color: tok.textSecondary,
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {t('cart_products', lang, { N: productCount })} · {t('cart_supply', lang, { W: pricing.supplyWeeks })}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {pricing.totalOriginal > pricing.totalDiscounted && (
            <span style={{
              fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
              color: tok.textTertiary,
              textDecoration: 'line-through',
            }}>€{pricing.totalOriginal}</span>
          )}
          <span style={{
            fontSize: 'clamp(1rem, 1.4vw, 1.125rem)',
            fontWeight: 600,
            color: tok.text,
          }}>€{pricing.totalDiscounted}</span>
        </div>
      </div>

      {/* Right: CTA */}
      <motion.button
        onClick={onCta}
        whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
        style={{
          padding: '10px 24px',
          borderRadius: 99,
          border: 'none',
          cursor: 'pointer',
          background: ctaTok.background,
          color: isDark ? '#F5F5F7' : '#FFFFFF',
          fontSize: 'clamp(0.8125rem, 1vw, 0.875rem)',
          fontWeight: 600,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          minHeight: 'auto',
          boxShadow: `${ctaTok.boxShadow}, ${ctaGlowToken(isDark)}`,
          transition: 'all 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {t('cart_cta', lang)}
      </motion.button>
    </motion.div>
  );
});

export default StickyCartBar;
