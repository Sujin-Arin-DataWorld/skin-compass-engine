/**
 * SlideFinalDashboard.tsx
 *
 * Slide 2 — Checkout & Master Plan
 * Complete rewrite: hero stats, product grid, skin timeline,
 * pricing cards, trust badges.
 *
 * Revenue-critical page — Apple-checkout-level design.
 * All colors from designTokens.ts — zero hardcoded hex.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { buildRoutineV5 } from '@/engine/routineEngineV5';
import type { DiagnosisResult, AxisKey } from '@/engine/types';
import type { RoutineStep, MockProduct } from '@/engine/routineEngine';
import { tokens, ctaTokens, glassTokens, buttonTokens } from '@/lib/designTokens';
import {
  categoryTint, ROLE_EMOJI, getProductPrice, AGE_CYCLE_MAP,
} from './sharedResultsData';
import {
  BARRIER_RECOVERY_PHASES, type BarrierRecoveryProduct,
} from './BarrierRecoveryProducts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LangKey = 'en' | 'de' | 'ko';

function tx(
  ko: string, de: string, en: string,
  lang: LangKey, vars?: Record<string, string | number>,
): string {
  let s = lang === 'ko' ? ko : lang === 'de' ? de : en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

const ROLE_LABELS: Record<string, { ko: string; de: string; en: string }> = {
  cleanser:    { ko: '클렌저', de: 'REINIGUNG', en: 'CLEANSER' },
  toner:       { ko: '토너', de: 'TONER', en: 'TONER' },
  serum:       { ko: '세럼', de: 'SERUM', en: 'SERUM' },
  treatment:   { ko: '트리트먼트', de: 'BEHANDLUNG', en: 'TREATMENT' },
  moisturizer: { ko: '모이스처라이저', de: 'FEUCHTIGKEITSPFLEGE', en: 'MOISTURIZER' },
  spf:         { ko: '선크림', de: 'SONNENSCHUTZ', en: 'SPF' },
  eye:         { ko: '아이크림', de: 'AUGENPFLEGE', en: 'EYE CARE' },
  device:      { ko: '디바이스', de: 'GERÄT', en: 'DEVICE' },
  toner_essence: { ko: '토너 에센스', de: 'TONER-ESSENZ', en: 'TONER ESSENCE' },
  sunscreen:   { ko: '선에센스', de: 'SONNENSCHUTZ', en: 'SUN ESSENCE' },
};

// ─── Count-up Hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setCount(target); return; }
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

// ─── Section animation ───────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as number[] },
  }),
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  result: DiagnosisResult;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SlideFinalDashboard({ result }: Props) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en' as LangKey;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const glassTok = glassTokens(isDark);
  const btnTok = buttonTokens(isDark);

  const implicitFlags = useDiagnosisStore((s) => s.implicitFlags);
  const specialCarePicks = useDiagnosisStore((s) => s.specialCarePicks);
  const isBarrierEmergency = useDiagnosisStore(
    (s) => s.result?.active_flags?.includes('BARRIER_EMERGENCY') ?? false,
  );
  const ageGroup = useDiagnosisStore((s) => s.foundationAnswers?.age_bracket ?? 2);

  // ── Routine data ────────────────────────────────────────────────────────────
  const routineOutput = useMemo(
    () => buildRoutineV5(result, implicitFlags, 'Full'),
    [result, implicitFlags],
  );

  type FilteredStep = RoutineStep & { product: MockProduct };

  const amProducts = useMemo<FilteredStep[]>(() => {
    const routine = routineOutput.routines.committed;
    const seen = new Set<string>();
    return routine.am.filter((s): s is FilteredStep => {
      if (!s.product) return false;
      if (seen.has(s.product.id)) return false;
      seen.add(s.product.id);
      return true;
    });
  }, [routineOutput]);

  const pmProducts = useMemo<FilteredStep[]>(() => {
    const routine = routineOutput.routines.committed;
    const amIds = new Set(amProducts.map(s => s.product.id));
    const seen = new Set<string>();
    return routine.pm.filter((s): s is FilteredStep => {
      if (!s.product) return false;
      if (amIds.has(s.product.id)) return false; // no dupes with AM
      if (seen.has(s.product.id)) return false;
      seen.add(s.product.id);
      return true;
    });
  }, [routineOutput, amProducts]);

  const zoneProducts = useMemo(
    () => Object.entries(specialCarePicks),
    [specialCarePicks],
  );

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const allProductIds = useMemo(() => {
    const ids: string[] = [];
    for (const s of amProducts) ids.push(s.product.id);
    for (const s of pmProducts) ids.push(s.product.id);
    for (const [, p] of zoneProducts) ids.push((p as any).id ?? '');
    return ids;
  }, [amProducts, pmProducts, zoneProducts]);

  const totalOriginal = useMemo(
    () => allProductIds.reduce((sum, id) => sum + getProductPrice(id), 0),
    [allProductIds],
  );
  const discountPct = 18;
  const totalDiscounted = Math.round(totalOriginal * (1 - discountPct / 100) * 100) / 100;
  const totalCount = amProducts.length + pmProducts.length + zoneProducts.length;

  const cycleDays = AGE_CYCLE_MAP[ageGroup]?.cycleDays ?? 35;
  const supplyWeeks = Math.round((cycleDays * 2) / 7);

  // ── Animated counters ───────────────────────────────────────────────────────
  const animatedCount = useCountUp(totalCount, 800);
  const animatedSavings = useCountUp(discountPct, 800);
  const animatedWeeks = useCountUp(supplyWeeks, 800);

  // ── Barrier recovery ────────────────────────────────────────────────────────
  const barrierProducts = useMemo(
    () => BARRIER_RECOVERY_PHASES.flatMap(p => p.products),
    [],
  );
  const barrierTotal = useMemo(
    () => barrierProducts.reduce((s, p) => s + p.price, 0),
    [barrierProducts],
  );

  // ── Card style factory ──────────────────────────────────────────────────────
  const cardBg = glassTok.card.background;
  const cardBorder = glassTok.card.border;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ paddingBottom: 220 }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        padding: 'clamp(16px, 4vw, 32px) clamp(16px, 4vw, 24px)',
      }}>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION A: YOUR COMPLETE PROTOCOL — Hero                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          style={{ textAlign: 'center', marginBottom: 'clamp(28px, 5vw, 40px)' }}
        >
          {/* Eyebrow */}
          <p style={{
            fontSize: 'clamp(0.625rem, 1vw, 0.75rem)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
            color: tok.accent,
            marginBottom: 8,
          }}>
            {isBarrierEmergency
              ? tx('장벽 회복 프로토콜', 'Barriere-Erholungsprotokoll', 'Barrier Recovery Protocol', lang)
              : tx('맞춤 프로토콜 완성', 'IHR KOMPLETTES PROTOKOLL', 'YOUR COMPLETE PROTOCOL', lang)
            }
          </p>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(1.375rem, 2.5vw + 0.5rem, 2rem)',
            fontWeight: 300,
            color: tok.text,
            lineHeight: 1.25,
            margin: '0 0 clamp(16px, 3vw, 24px)',
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          }}>
            {tx(
              '당신만의 맞춤 프로토콜이 완성되었어요',
              'Ihr persönliches Protokoll ist fertig',
              'Your personalized protocol is ready',
              lang,
            )}
          </h2>

          {/* Three stat boxes */}
          <div style={{
            display: 'flex', gap: 'clamp(8px, 1.5vw, 12px)',
            justifyContent: 'center', marginBottom: 'clamp(12px, 2vw, 20px)',
          }}>
            {[
              { num: animatedCount, label: tx('제품', 'Produkte', 'products', lang), prefix: '' },
              { num: animatedSavings, label: tx('절약', 'Ersparnis', 'savings', lang), prefix: '-', suffix: '%' },
              { num: animatedWeeks, label: tx('분량', 'Vorrat', 'supply', lang), prefix: '~', suffix: tx('주', ' Wo.', 'wk', lang) },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1,
                padding: 'clamp(14px, 2.5vw, 20px)',
                borderRadius: 12,
                textAlign: 'center' as const,
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              }}>
                <div style={{
                  fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 600,
                  color: tok.accent,
                }}>
                  {s.prefix}{s.num}{s.suffix ?? ''}
                </div>
                <div style={{
                  fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
                  color: tok.textSecondary,
                  marginTop: 2,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(0.8125rem, 1.2vw, 0.9375rem)',
            color: tok.textSecondary,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: '0 auto',
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          }}>
            {tx(
              `피부 진단 ${result.radar_chart_data?.length ?? 9}개 축 분석 결과, 당신에게 가장 효과적인 성분만 선별했어요.`,
              `Basierend auf ${result.radar_chart_data?.length ?? 9} Hautanalyse-Achsen haben wir die wirksamsten Inhaltsstoffe ausgewählt.`,
              `Based on ${result.radar_chart_data?.length ?? 9} diagnostic axes, we selected only the most effective ingredients for you.`,
              lang,
            )}
          </p>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION B: PRODUCT COLLECTION — Visual Grid                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          custom={0.15}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          style={{ marginBottom: 'clamp(28px, 5vw, 40px)' }}
        >
          {isBarrierEmergency ? (
            /* Barrier Recovery Products */
            <>
              {BARRIER_RECOVERY_PHASES.map((phase) => (
                <div key={phase.key} style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                  <ProductGroupHeader label={`${phase.label[lang]} · ${phase.subtitle[lang]}`} tok={tok} />
                  <ProductGrid>
                    {phase.products.map((p, i) => (
                      <BarrierProductCard
                        key={p.id}
                        product={p}
                        lang={lang}
                        tok={tok}
                        glassTok={glassTok}
                        isDark={isDark}
                        index={i}
                      />
                    ))}
                  </ProductGrid>
                </div>
              ))}
            </>
          ) : (
            /* Normal Product Grid */
            <>
              {amProducts.length > 0 && (
                <div style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                  <ProductGroupHeader label={tx('AM 루틴', 'AM-Routine', 'AM Routine', lang)} tok={tok} />
                  <ProductGrid>
                    {amProducts.map((step, i) => (
                      <RoutineProductCard
                        key={step.product.id}
                        step={step}
                        lang={lang}
                        tok={tok}
                        glassTok={glassTok}
                        isDark={isDark}
                        index={i}
                      />
                    ))}
                  </ProductGrid>
                </div>
              )}
              {pmProducts.length > 0 && (
                <div style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                  <ProductGroupHeader label={tx('PM 루틴', 'PM-Routine', 'PM Routine', lang)} tok={tok} />
                  <ProductGrid>
                    {pmProducts.map((step, i) => (
                      <RoutineProductCard
                        key={step.product.id}
                        step={step}
                        lang={lang}
                        tok={tok}
                        glassTok={glassTok}
                        isDark={isDark}
                        index={i}
                      />
                    ))}
                  </ProductGrid>
                </div>
              )}
              {zoneProducts.length > 0 && (
                <div style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                  <ProductGroupHeader label={tx('존 케어', 'Zonen-Pflege', 'Zone Care', lang)} tok={tok} />
                  <ProductGrid>
                    {zoneProducts.map(([zone, product], i) => (
                      <ZoneProductCard
                        key={zone}
                        zone={zone}
                        product={product as any}
                        lang={lang}
                        tok={tok}
                        glassTok={glassTok}
                        isDark={isDark}
                        index={i}
                      />
                    ))}
                  </ProductGrid>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION C: SKIN TIMELINE VISUALIZATION                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          custom={0.3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          style={{ marginBottom: 'clamp(28px, 5vw, 40px)' }}
        >
          <p style={{
            fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
            color: tok.textTertiary,
            marginBottom: 'clamp(12px, 2vw, 16px)',
            textAlign: 'center' as const,
          }}>
            {tx('당신의 피부 여정', 'IHRE HAUT-REISE', 'YOUR SKIN JOURNEY', lang)}
          </p>

          <SkinTimeline
            isBarrierEmergency={isBarrierEmergency}
            cycleDays={cycleDays}
            lang={lang}
            tok={tok}
            isDark={isDark}
          />
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION D: PRICING OPTIONS                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          custom={0.45}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          style={{ marginBottom: 'clamp(28px, 5vw, 40px)' }}
        >
          <PricingSection
            totalDiscounted={isBarrierEmergency ? barrierTotal : totalDiscounted}
            supplyWeeks={supplyWeeks}
            isBarrierEmergency={isBarrierEmergency}
            lang={lang}
            tok={tok}
            ctaTok={ctaTok}
            btnTok={btnTok}
            glassTok={glassTok}
            isDark={isDark}
          />
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION E: TRUST & GUARANTEES                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          custom={0.6}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <TrustSection lang={lang} tok={tok} isDark={isDark} />

          {isBarrierEmergency && (
            <p style={{
              fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
              color: tok.accent,
              textAlign: 'center',
              marginTop: 16,
              fontWeight: 500,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            }}>
              {tx(
                '장벽 회복 완료 후 풀 프로토콜로 업그레이드 가능',
                'Nach Erholung auf Voll-Protokoll upgraden',
                'Upgrade to full protocol after recovery',
                lang,
              )}
            </p>
          )}
        </motion.div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Product Group Header ──────────────────────────────────────────────────────

function ProductGroupHeader({ label, tok }: { label: string; tok: ReturnType<typeof tokens> }) {
  return (
    <div style={{
      fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      fontWeight: 600,
      color: tok.textTertiary,
      paddingBottom: 8,
      marginBottom: 12,
      borderBottom: `1px solid ${tok.border}`,
    }}>
      {label}
    </div>
  );
}

// ── Product Grid ──────────────────────────────────────────────────────────────

function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 'clamp(8px, 1.5vw, 12px)',
    }}>
      {children}
    </div>
  );
}

// ── Routine Product Card ──────────────────────────────────────────────────────

function RoutineProductCard({
  step, lang, tok, glassTok, isDark, index,
}: {
  step: RoutineStep & { product: MockProduct };
  lang: LangKey;
  tok: ReturnType<typeof tokens>;
  glassTok: ReturnType<typeof glassTokens>;
  isDark: boolean;
  index: number;
}) {
  const price = getProductPrice(step.product.id);
  const roleLabel = ROLE_LABELS[step.role]?.[lang] ?? step.role.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: 'clamp(10px, 2vw, 14px)',
        borderRadius: 12,
        textAlign: 'center' as const,
        background: glassTok.card.background,
        border: `1px solid ${glassTok.card.border}`,
        cursor: 'default',
        transition: 'transform 0.2s, border-color 0.2s',
      }}
      whileHover={{ y: -3 }}
    >
      {/* Image container */}
      <div style={{
        width: 'clamp(80px, 12vw, 100px)',
        height: 'clamp(80px, 12vw, 100px)',
        borderRadius: 12,
        overflow: 'hidden',
        background: categoryTint(step.role),
        margin: '0 auto clamp(8px, 1vw, 10px)',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28 }}>{ROLE_EMOJI[step.role] ?? '💊'}</span>
        <img
          src={`/productsimage/${step.product.id}.jpeg`}
          alt={step.product.name[lang] ?? step.product.name.en}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* Role badge */}
      <div style={{
        fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        fontWeight: 600,
        color: tok.textTertiary,
        marginBottom: 2,
      }}>
        {roleLabel}
      </div>

      {/* Product name */}
      <div style={{
        fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
        fontWeight: 500,
        color: tok.text,
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as any,
        overflow: 'hidden',
        marginBottom: 4,
        minHeight: '2.4em',
      }}>
        {step.product.name[lang] ?? step.product.name.en}
      </div>

      {/* Price */}
      {price > 0 && (
        <div style={{
          fontSize: 'clamp(0.875rem, 1.2vw, 1rem)',
          fontWeight: 600,
          color: tok.text,
        }}>
          €{price.toFixed(price % 1 === 0 ? 0 : 2)}
        </div>
      )}
    </motion.div>
  );
}

// ── Zone Product Card ─────────────────────────────────────────────────────────

function ZoneProductCard({
  zone, product, lang, tok, glassTok, isDark, index,
}: {
  zone: string;
  product: { id: string; name?: Record<string, string>; name_en?: string; brand?: string; role?: string; emoji?: string };
  lang: LangKey;
  tok: ReturnType<typeof tokens>;
  glassTok: ReturnType<typeof glassTokens>;
  isDark: boolean;
  index: number;
}) {
  const price = getProductPrice(product.id);
  const name = product.name?.[lang] ?? product.name?.en ?? product.name_en ?? zone;
  const role = product.role ?? 'serum';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: 'clamp(10px, 2vw, 14px)',
        borderRadius: 12,
        textAlign: 'center' as const,
        background: glassTok.card.background,
        border: `1px solid ${glassTok.card.border}`,
      }}
      whileHover={{ y: -3 }}
    >
      <div style={{
        width: 'clamp(80px, 12vw, 100px)',
        height: 'clamp(80px, 12vw, 100px)',
        borderRadius: 12, overflow: 'hidden',
        background: categoryTint(role),
        margin: '0 auto clamp(8px, 1vw, 10px)',
        position: 'relative' as const,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28 }}>{product.emoji ?? ROLE_EMOJI[role] ?? '💊'}</span>
        <img
          src={`/productsimage/${product.id}.jpeg`}
          alt={name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div style={{ fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600, color: tok.textTertiary, marginBottom: 2 }}>
        {ROLE_LABELS[role]?.[lang] ?? role.toUpperCase()}
      </div>
      <div style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 500, color: tok.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', marginBottom: 4, minHeight: '2.4em' }}>
        {name}
      </div>
      {price > 0 && (
        <div style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 600, color: tok.text }}>
          €{price.toFixed(price % 1 === 0 ? 0 : 2)}
        </div>
      )}
    </motion.div>
  );
}

// ── Barrier Product Card ──────────────────────────────────────────────────────

function BarrierProductCard({
  product, lang, tok, glassTok, isDark, index,
}: {
  product: BarrierRecoveryProduct;
  lang: LangKey;
  tok: ReturnType<typeof tokens>;
  glassTok: ReturnType<typeof glassTokens>;
  isDark: boolean;
  index: number;
}) {
  const role = product.role;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: 'clamp(10px, 2vw, 14px)',
        borderRadius: 12, textAlign: 'center' as const,
        background: glassTok.card.background,
        border: `1px solid ${glassTok.card.border}`,
      }}
    >
      <div style={{
        width: 'clamp(80px, 12vw, 100px)', height: 'clamp(80px, 12vw, 100px)',
        borderRadius: 12, overflow: 'hidden',
        background: categoryTint(role),
        margin: '0 auto clamp(8px, 1vw, 10px)',
        position: 'relative' as const,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28 }}>{product.emoji}</span>
        <img
          src={`/productsimage/${product.id}.jpeg`}
          alt={product.name[lang]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div style={{ fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600, color: tok.textTertiary, marginBottom: 2 }}>
        {ROLE_LABELS[role]?.[lang] ?? role.toUpperCase()}
      </div>
      <div style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 500, color: tok.text, lineHeight: 1.3, marginBottom: 4, minHeight: '2.4em' }}>
        {product.name[lang]}
      </div>
      <div style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 600, color: tok.text }}>
        €{product.price.toFixed(2)}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C: SKIN TIMELINE
// ══════════════════════════════════════════════════════════════════════════════

interface MilestoneData {
  week: number;
  title: { ko: string; en: string; de: string };
  desc: { ko: string; en: string; de: string };
  icon: string;
  color: string;
}

function SkinTimeline({
  isBarrierEmergency, cycleDays, lang, tok, isDark,
}: {
  isBarrierEmergency: boolean;
  cycleDays: number;
  lang: LangKey;
  tok: ReturnType<typeof tokens>;
  isDark: boolean;
}) {
  const milestones: MilestoneData[] = useMemo(() => {
    if (isBarrierEmergency) {
      return [
        { week: 0, title: { ko: '비우기', en: 'Empty', de: 'Leeren' }, desc: { ko: '자극 성분 중단', en: 'Stop irritants', de: 'Reizstoffe stoppen' }, icon: '🗑️', color: 'rgba(226,75,74,0.15)' },
        { week: 1, title: { ko: '채우기', en: 'Fill', de: 'Füllen' }, desc: { ko: '수분 공급', en: 'Hydrate', de: 'Befeuchten' }, icon: '💧', color: 'rgba(55,138,221,0.15)' },
        { week: 1, title: { ko: '잠그기', en: 'Lock', de: 'Versiegeln' }, desc: { ko: '지질막 복구', en: 'Seal & Repair', de: 'Barriere reparieren' }, icon: '🔒', color: 'rgba(74,158,104,0.15)' },
        { week: 2, title: { ko: '재진단', en: 'Reassess', de: 'Neubewertung' }, desc: { ko: '피부 상태 재평가', en: 'Re-diagnose skin', de: 'Haut neu bewerten' }, icon: '📋', color: 'rgba(74,158,104,0.25)' },
      ];
    }
    return [
      { week: 1, title: { ko: '적응기', en: 'Adaptation', de: 'Eingewöhnung' }, desc: { ko: '피부가 새 성분에 적응하는 기간', en: 'Your skin adjusts to new ingredients', de: 'Ihre Haut passt sich an neue Wirkstoffe an' }, icon: '🌱', color: 'rgba(186,117,23,0.15)' },
      { week: Math.round(cycleDays / 7), title: { ko: '첫 체크인', en: 'First Check-in', de: 'Erster Check-in' }, desc: { ko: '첫 세포 주기 완료. 3문항 체크인으로 루틴 최적화', en: 'First cell cycle complete. 3-question check-in to optimize', de: 'Erster Zellzyklus abgeschlossen. 3-Fragen-Check-in' }, icon: '📋', color: 'rgba(74,158,104,0.15)' },
      { week: Math.round((cycleDays * 2) / 7), title: { ko: '리필 시점', en: 'Refill Time', de: 'Nachfüllzeit' }, desc: { ko: '제품 소진 예상. 피부 변화에 맞춘 최적화 리필', en: 'Products running low. Optimized refill based on skin changes', de: 'Produkte gehen zur Neige. Optimierte Nachfüllung' }, icon: '📦', color: 'rgba(55,138,221,0.15)' },
      { week: Math.round((cycleDays * 4) / 7), title: { ko: '성과 측정', en: 'Results', de: 'Ergebnisse' }, desc: { ko: '4번째 세포 주기 완료. Before/After 비교 가능', en: 'Fourth cell cycle. Before/After comparison available', de: 'Vierter Zellzyklus. Vorher/Nachher-Vergleich' }, icon: '📊', color: 'rgba(74,158,104,0.25)' },
    ];
  }, [isBarrierEmergency, cycleDays]);

  // Vertical layout for mobile
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      position: 'relative', paddingLeft: 32,
    }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 11, top: 20, bottom: 20, width: 2,
        background: `linear-gradient(180deg, rgba(186,117,23,0.3), rgba(74,158,104,0.3), rgba(55,138,221,0.3), rgba(74,158,104,0.5))`,
        borderRadius: 1,
      }} />

      {milestones.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            marginBottom: i < milestones.length - 1 ? 'clamp(16px, 3vw, 24px)' : 0,
            position: 'relative',
          }}
        >
          {/* Dot */}
          <div style={{
            position: 'absolute', left: -27,
            width: 14, height: 14,
            borderRadius: '50%',
            border: `2px solid ${m.color.replace(/[\d.]+\)$/, '0.8)')}`,
            background: i === 0 ? m.color.replace(/[\d.]+\)$/, '0.6)') : (isDark ? '#1C1C1E' : '#FAFAF8'),
            boxShadow: i === 0 ? `0 0 8px ${m.color}` : 'none',
          }} />

          {/* Milestone card */}
          <div style={{
            flex: 1,
            padding: 'clamp(10px, 2vw, 14px)',
            borderRadius: 10,
            background: m.color,
            border: `1px solid ${m.color.replace(/[\d.]+\)$/, '0.2)')}`,
          }}>
            <div style={{
              fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)',
              fontWeight: 700,
              color: m.color.replace(/[\d.]+\)$/, '0.8)'),
              marginBottom: 4,
            }}>
              {isBarrierEmergency
                ? (m.week === 0 ? tx('1일차', 'Tag 1', 'Day 1', lang) : tx(`${m.week}주차`, `Woche ${m.week}`, `Week ${m.week}`, lang))
                : tx(`${m.week}주차`, `Woche ${m.week}`, `Week ${m.week}`, lang)
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{
                fontSize: 'clamp(0.8125rem, 1.1vw, 0.875rem)',
                fontWeight: 600,
                color: tok.text,
              }}>
                {m.title[lang]}
              </span>
            </div>
            <p style={{
              fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
              color: tok.textSecondary,
              lineHeight: 1.5,
              margin: 0,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            }}>
              {m.desc[lang]}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION D: PRICING
// ══════════════════════════════════════════════════════════════════════════════

function PricingSection({
  totalDiscounted, supplyWeeks, isBarrierEmergency, lang, tok, ctaTok, btnTok, glassTok, isDark,
}: {
  totalDiscounted: number;
  supplyWeeks: number;
  isBarrierEmergency: boolean;
  lang: LangKey;
  tok: ReturnType<typeof tokens>;
  ctaTok: ReturnType<typeof ctaTokens>;
  btnTok: ReturnType<typeof buttonTokens>;
  glassTok: ReturnType<typeof glassTokens>;
  isDark: boolean;
}) {
  const daily = (totalDiscounted / (supplyWeeks * 7)).toFixed(2);
  const smartRefillPrice = Math.round(totalDiscounted * 0.88 * 100) / 100;
  const smartRefillDaily = (smartRefillPrice / (supplyWeeks * 7)).toFixed(2);

  const cards = useMemo(() => {
    const tier1 = {
      key: 'tier1' as const,
      title: tx('지금 시작하기', 'Jetzt starten', 'Start Now', lang),
      subtitle: tx('일회 결제', 'Einmalzahlung', 'One-time purchase', lang),
      price: `€${totalDiscounted.toFixed(2)}`,
      priceNote: tx(`하루 €${daily}`, `€${daily} pro Tag`, `€${daily}/day`, lang),
      supplyNote: tx(`~${supplyWeeks}주분`, `~${supplyWeeks} Wochen Vorrat`, `~${supplyWeeks} weeks supply`, lang),
      features: [
        tx('진단 기반 맞춤 제품', 'Diagnose-basierte Produkte', 'Diagnosis-matched products', lang),
        tx('3/5/5+ 단계 선택', '3/5/5+ Schritte wählbar', '3/5/5+ step choice', lang),
        tx('EU 3-5일 배송', 'EU 3-5 Tage Versand', 'EU 3-5 day shipping', lang),
      ],
      cta: tx('시작하기', 'Jetzt starten', 'Start Now', lang),
      style: 'ghost' as const,
      badge: null as string | null,
      recommended: false,
      comingSoon: false,
    };

    const tier2 = {
      key: 'tier2' as const,
      title: tx('스마트 리필', 'Smart-Nachfüllung', 'Smart Refill', lang),
      subtitle: tx('피부 주기 기반 자동 최적화', 'Hautzyklus-basierte Auto-Optimierung', 'Skin-cycle based auto-optimization', lang),
      price: `€${smartRefillPrice.toFixed(2)}`,
      priceNote: tx(`/${supplyWeeks}주마다`, `/alle ${supplyWeeks} Wochen`, `/every ${supplyWeeks} weeks`, lang),
      supplyNote: tx('일회 대비 12% 절약', '12% Ersparnis vs Einmal', '12% savings vs one-time', lang),
      features: [
        tx('일회 결제의 모든 혜택 포함', 'Alle Einmalzahlungs-Vorteile', 'All one-time benefits included', lang),
        tx('5주차 3문항 체크인', '5-Wochen 3-Fragen Check-in', '5-week 3-question check-in', lang),
        tx('피부 변화에 맞춘 성분 자동 교체', 'Automatischer Wirkstoffwechsel', 'Auto ingredient swap based on skin changes', lang),
        tx('언제든 해지 가능', 'Jederzeit kündbar', 'Cancel anytime', lang),
      ],
      cta: tx('스마트 리필 시작', 'Smart-Nachfüllung starten', 'Start Smart Refill', lang),
      style: 'filled' as const,
      badge: tx('추천', 'EMPFOHLEN', 'RECOMMENDED', lang),
      recommended: true,
      comingSoon: false,
    };

    const tier3 = {
      key: 'tier3' as const,
      title: tx('프리미엄 + 기기', 'Premium + Gerät', 'Premium + Device', lang),
      subtitle: tx('LED/EMS 홈 디바이스 포함', 'Inkl. LED/EMS Heimgerät', 'Includes LED/EMS home device', lang),
      price: '',
      priceNote: '',
      supplyNote: '',
      features: [
        tx('스마트 리필의 모든 혜택', 'Alle Smart-Nachfüllung Vorteile', 'All Smart Refill benefits', lang),
        tx('LED/EMS 전문 디바이스', 'Professionelles LED/EMS Gerät', 'Professional LED/EMS device', lang),
        tx('디바이스 사용 가이드', 'Gerätenutzungs-Anleitung', 'Device usage guide', lang),
      ],
      cta: tx('알림 받기', 'Benachrichtigen', 'Notify Me', lang),
      style: 'ghost-muted' as const,
      badge: null,
      recommended: false,
      comingSoon: true,
    };

    if (isBarrierEmergency) return [tier1];
    return [tier1, tier2, tier3];
  }, [totalDiscounted, smartRefillPrice, supplyWeeks, daily, smartRefillDaily, lang, isBarrierEmergency]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(12px, 2vw, 16px)',
    }}>
      {/* On mobile, show recommended first (reorder) */}
      {[...cards].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)).map((card) => (
        <div
          key={card.key}
          style={{
            position: 'relative',
            padding: 'clamp(16px, 3vw, 24px)',
            borderRadius: 16,
            background: card.recommended
              ? (isDark ? 'rgba(74,158,104,0.06)' : 'rgba(94,139,104,0.06)')
              : glassTok.card.background,
            border: card.recommended
              ? `2px solid ${isDark ? 'rgba(74,158,104,0.3)' : 'rgba(94,139,104,0.3)'}`
              : card.comingSoon
                ? `1px dashed ${tok.border}`
                : `1px solid ${tok.border}`,
            opacity: card.comingSoon ? 0.75 : 1,
          }}
        >
          {/* Recommended badge */}
          {card.badge && (
            <div style={{
              position: 'absolute',
              top: -12, left: '50%', transform: 'translateX(-50%)',
              background: isDark ? 'rgba(74,158,104,0.15)' : 'rgba(94,139,104,0.12)',
              color: tok.accent,
              fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)',
              fontWeight: 700,
              borderRadius: 99,
              padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}>
              {card.badge}
            </div>
          )}

          {/* Title & subtitle */}
          <div style={{ marginBottom: 12 }}>
            <h3 style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              fontWeight: 600, color: tok.text, margin: 0,
            }}>
              {card.title}
            </h3>
            <p style={{
              fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
              color: tok.textSecondary, margin: '2px 0 0',
            }}>
              {card.subtitle}
            </p>
          </div>

          {/* Price block */}
          {card.price && (
            <div style={{ marginBottom: 12 }}>
              <span style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 600, color: tok.text,
              }}>
                {card.price}
              </span>
              {card.priceNote && (
                <span style={{
                  fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                  color: tok.textSecondary, marginLeft: 4,
                }}>
                  {card.priceNote}
                </span>
              )}
              {card.supplyNote && (
                <p style={{
                  fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
                  color: card.recommended ? tok.accent : tok.textSecondary,
                  fontWeight: card.recommended ? 600 : 400,
                  margin: '4px 0 0',
                }}>
                  {card.supplyNote}
                </p>
              )}
            </div>
          )}

          {/* Coming soon */}
          {card.comingSoon && !card.price && (
            <div style={{
              fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
              fontWeight: 600, color: tok.textTertiary,
              margin: '8px 0 16px',
            }}>
              COMING SOON
            </div>
          )}

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {card.features.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                color: tok.textSecondary, lineHeight: 1.4,
              }}>
                <span style={{ color: tok.accent, flexShrink: 0 }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            borderRadius: 12,
            fontSize: 'clamp(0.875rem, 1.1vw, 1rem)',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            minHeight: 48,
            transition: 'transform 0.15s',
            ...(card.style === 'filled' ? {
              background: ctaTok.bg,
              color: ctaTok.text,
            } : card.style === 'ghost-muted' ? {
              background: 'transparent',
              color: tok.textTertiary,
              border: `1px solid ${tok.border}`,
            } : {
              background: 'transparent',
              color: tok.text,
              border: `1px solid ${tok.border}`,
            }),
          }}>
            {card.cta}
          </button>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E: TRUST
// ══════════════════════════════════════════════════════════════════════════════

function TrustSection({
  lang, tok, isDark,
}: {
  lang: LangKey;
  tok: ReturnType<typeof tokens>;
  isDark: boolean;
}) {
  const badges = [
    { icon: '🔬', label: tx('피부과 전문의 검증', 'Dermatologisch geprüft', 'Dermatologist reviewed', lang) },
    { icon: '🛡️', label: tx('만족 보증', 'Zufriedenheitsgarantie', 'Satisfaction guarantee', lang) },
    { icon: '📦', label: tx('EU 무료 배송', 'Kostenloser EU-Versand', 'Free EU shipping', lang) },
    { icon: '↩️', label: tx('언제든 해지 가능', 'Jederzeit kündbar', 'Cancel anytime', lang) },
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 'clamp(8px, 1.5vw, 12px)',
        marginBottom: 16,
      }}>
        {badges.map((b, i) => (
          <div key={i} style={{
            padding: 'clamp(12px, 2vw, 16px)',
            borderRadius: 10,
            textAlign: 'center' as const,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{b.icon}</div>
            <div style={{
              fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
              color: tok.textSecondary,
              lineHeight: 1.4,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            }}>
              {b.label}
            </div>
          </div>
        ))}
      </div>

      {/* Source line */}
      <p style={{
        fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)',
        color: tok.textTertiary,
        textAlign: 'center' as const,
        margin: 0,
      }}>
        {tx(
          '20,238개 성분 분석 · 100,000개 제품 비교 기반',
          'Basierend auf 20.238 Wirkstoff-Analysen · 100.000 Produktvergleiche',
          'Based on 20,238 ingredient analyses · 100,000 product comparisons',
          lang,
        )}
      </p>
    </div>
  );
}
