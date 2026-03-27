/**
 * StickyCartBar.tsx
 *
 * Shared sticky cart bar component — appears at the bottom of all 3 result slides.
 * Glass effect, product count + pricing, CTA button, trust badges.
 */

import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { tokens, ctaTokens, glassTokens } from '@/lib/designTokens';
import { useTheme } from 'next-themes';
import { categoryTint, getProductPrice, ROLE_EMOJI } from './sharedResultsData';
import type { MockProduct, RoutineStep } from '@/engine/routineEngine';

// ── i18n ──────────────────────────────────────────────────────────────────────

const COPY = {
  cart_protocol: { ko: '내 루틴', de: 'Meine Pflege', en: 'My routine' },
  cart_products: { ko: '{N}개 제품', de: '{N} Produkte', en: '{N} products' },
  cart_daily_price: { ko: '하루 €{X}', de: '€{X} pro Tag', en: '€{X}/day' },
  cart_supply: { ko: '~{N}주분', de: '~{N} Wochen', en: '~{N} weeks' },
  cart_cta: { ko: '내 루틴 시작 — 월 €{X}', de: 'Meine Pflege starten — €{X}/Mo.', en: 'Start my routine — €{X}/mo' },
  trust_dermatologist: { ko: '피부과 전문의 검증', de: 'Dermatologisch geprüft', en: 'Dermatologist reviewed' },
  trust_cancel: { ko: '언제든 해지 가능', de: 'Jederzeit kündbar', en: 'Cancel anytime' },
  trust_shipping: { ko: 'EU 3-5일 배송', de: 'EU 3-5 Werktage', en: 'EU 3-5 days' },
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
  steps: Array<RoutineStep & { product: MockProduct }>;
  cycleDays: number;
  slideNavHeight?: number;
  /** When set, overrides steps for pricing/thumbnails (BARRIER_EMERGENCY mode) */
  barrierProducts?: BarrierProduct[];
  onCta?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const DISCOUNT_PCT = 0.18;

const StickyCartBar = memo(function StickyCartBar({
  steps,
  cycleDays,
  slideNavHeight = 56,
  barrierProducts,
  onCta,
}: StickyCartBarProps) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en' as LangKey;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const glassTok = glassTokens(isDark);

  const isBarrierMode = (barrierProducts?.length ?? 0) > 0;

  const pricing = useMemo(() => {
    const totalOriginal = isBarrierMode
      ? barrierProducts!.reduce((sum, p) => sum + p.price, 0)
      : steps.reduce((sum, s) => sum + getProductPrice(s.product.id), 0);
    const totalDiscounted = Math.round(totalOriginal * (1 - DISCOUNT_PCT));
    const supplyDays = cycleDays * 2;
    const supplyWeeks = Math.round(supplyDays / 7);
    const dailyPrice = supplyDays > 0 ? (totalDiscounted / supplyDays).toFixed(2) : '0.00';
    const monthlyPrice = supplyDays > 0 ? (totalDiscounted / (supplyDays / 30)).toFixed(2) : '0.00';
    return { totalOriginal, totalDiscounted, supplyWeeks, dailyPrice, monthlyPrice };
  }, [steps, cycleDays, barrierProducts, isBarrierMode]);

  const productCount = isBarrierMode ? (barrierProducts?.length ?? 0) : steps.length;

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: slideNavHeight,
        left: 0,
        right: 0,
        zIndex: 50,
        ...glassTok.nav,
        background: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(250,250,248,0.95)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 'clamp(10px, 2.5vw, 16px) clamp(16px, 4vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(6px, 1.5vw, 10px)',
      }}>

        {/* Row 1: Product count + pricing */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
            color: isDark ? '#86868B' : '#6B7280',
          }}>
            {t('cart_protocol', lang)} · {t('cart_products', lang, { N: productCount })}
          </span>
          <div style={{ textAlign: 'right' }}>
            {pricing.totalOriginal > 0 && (
              <span style={{
                fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
                color: isDark ? '#48484A' : '#9CA3AF',
                textDecoration: 'line-through',
                marginRight: 6,
              }}>€{pricing.totalOriginal}</span>
            )}
            <span style={{
              fontSize: 'clamp(1.125rem, 1.8vw, 1.375rem)',
              fontWeight: 500,
              color: tok.text,
            }}>€{pricing.totalDiscounted}</span>
          </div>
        </div>

        {/* Row 2: Product thumbnail squares + daily price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(isBarrierMode
              ? barrierProducts!
              : steps.map<BarrierProduct>((s) => ({ id: s.product.id, price: getProductPrice(s.product.id), role: s.role, emoji: ROLE_EMOJI[s.role] ?? '💊' }))
            ).slice(0, 6).map((item) => (
              <div key={item.id} style={{
                width: 24, height: 24, borderRadius: 6,
                background: categoryTint(item.role),
                position: 'relative', overflow: 'hidden', flexShrink: 0,
              }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{item.emoji}</span>
                <img src={`/productsImage/${item.id}.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ))}
          </div>
          <span style={{
            fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
            color: isDark ? '#48484A' : '#9CA3AF',
          }}>
            {t('cart_daily_price', lang, { X: pricing.dailyPrice })} · {t('cart_supply', lang, { N: pricing.supplyWeeks })}
          </span>
        </div>

        {/* Row 3: CTA Button */}
        <motion.button
          onClick={onCta}
          whileHover={prefersReducedMotion ? {} : {
            boxShadow: isDark
              ? '0 0 0 4px rgba(45,107,74,0.15), 0 8px 32px rgba(45,107,74,0.25)'
              : '0 0 0 4px rgba(94,139,104,0.12), 0 8px 32px rgba(61,107,74,0.28)',
            y: -1,
          }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98, boxShadow: isDark ? '0 2px 8px rgba(45,107,74,0.12)' : '0 2px 8px rgba(61,107,74,0.15)' }}
          style={{
            width: '100%',
            padding: 'clamp(10px, 2vw, 14px)',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            background: ctaTok.background,
            color: '#F5F5F7',
            boxShadow: ctaTok.boxShadow,
            fontSize: 'clamp(0.875rem, 1.2vw, 1rem)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            minHeight: 48,
          }}
        >
          {t('cart_cta', lang, { X: pricing.monthlyPrice })}
        </motion.button>


        {/* Row 4: Trust badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)',
          flexWrap: 'wrap',
        }}>
          {(['trust_dermatologist', 'trust_cancel', 'trust_shipping'] as const).map((key) => (
            <span key={key} style={{
              fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)',
              color: isDark ? '#48484A' : '#9CA3AF',
              whiteSpace: 'nowrap',
            }}>
              {t(key, lang)}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default StickyCartBar;
