/**
 * SlideFinalDashboard.tsx
 *
 * Slide 2 — Checkout (Redesigned per SLIDE-2-REDESIGN-BRIEF.md)
 * 3 sections: My Collection · How to Start · Trust Footer
 *
 * Two modes: NORMAL (default) and BARRIER_EMERGENCY
 * Design tokens: designTokens.ts (Apple + Forest palette)
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { buildRoutineV5 } from '@/engine/routineEngineV5';
import type { DiagnosisResult } from '@/engine/types';
import type { RoutineStep, MockProduct } from '@/engine/routineEngine';
import { tokens, ctaTokens } from '@/lib/designTokens';
import {
  ROLE_EMOJI, getProductPrice, AGE_CYCLE_MAP,
} from './sharedResultsData';
import {
  BARRIER_RECOVERY_PHASES,
} from './BarrierRecoveryProducts';

// ── Types ─────────────────────────────────────────────────────────────────────

type LangKey = 'en' | 'de' | 'ko';
type FilteredStep = RoutineStep & { product: MockProduct };

// ── Helpers ───────────────────────────────────────────────────────────────────

function tx(
  ko: string, de: string, en: string,
  lang: LangKey,
  vars?: Record<string, string | number>,
): string {
  let s = lang === 'ko' ? ko : lang === 'de' ? de : en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

function flagEmoji(id: string): string {
  if (id.startsWith('KR_')) return '🇰🇷';
  if (id.startsWith('DE_')) return '🇩🇪';
  return '🌐';
}

// ── Animation variants ────────────────────────────────────────────────────────

const collectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: {
      delay: i * 0.05, duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  result: DiagnosisResult;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SlideFinalDashboard({ result }: Props) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en' as LangKey;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();

  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);

  // ── Store reads ─────────────────────────────────────────────────────────────
  const implicitFlags = useDiagnosisStore((s) => s.implicitFlags);
  const specialCarePicks = useDiagnosisStore((s) => s.specialCarePicks);
  const axisAnswers = useDiagnosisStore((s) => s.axisAnswers);
  const selectedTier = useDiagnosisStore((s) => s.selectedTier);
  const isBarrierEmergency = result.active_flags?.includes('BARRIER_EMERGENCY') ?? false;
  const expAge = axisAnswers?.EXP_AGE as number | undefined;
  const ageGroup = expAge !== undefined && expAge in AGE_CYCLE_MAP ? expAge : 2;

  // ── Routine products ────────────────────────────────────────────────────────
  const routineOutput = useMemo(
    () => buildRoutineV5(result, implicitFlags, selectedTier ?? 'Full'),
    [result, implicitFlags, selectedTier],
  );

  const allRoutineProducts = useMemo<FilteredStep[]>(() => {
    const routine = routineOutput.routines.committed;
    const seen = new Set<string>();
    const combined: FilteredStep[] = [];
    for (const step of [...routine.am, ...routine.pm]) {
      if (!step.product) continue;
      if (seen.has(step.product.id)) continue;
      seen.add(step.product.id);
      combined.push(step as FilteredStep);
    }
    return combined;
  }, [routineOutput]);

  const zoneProducts = useMemo(
    () => Object.entries(specialCarePicks),
    [specialCarePicks],
  );

  // ── Cycle data ──────────────────────────────────────────────────────────────
  const cycleDays = AGE_CYCLE_MAP[ageGroup]?.cycleDays ?? 35;
  const supplyDays = cycleDays * 2;
  const supplyWeeks = Math.round(supplyDays / 7);

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const discountPct = 18;
  const refillDiscountPct = 12;

  const normalOriginal = useMemo(() => {
    const routineTotal = allRoutineProducts.reduce(
      (s, p) => s + getProductPrice(p.product.id), 0,
    );
    const zoneTotal = zoneProducts.reduce(
      (s, [, p]) => s + getProductPrice((p as { id?: string }).id ?? ''), 0,
    );
    return routineTotal + zoneTotal;
  }, [allRoutineProducts, zoneProducts]);

  const barrierAllProducts = useMemo(
    () => BARRIER_RECOVERY_PHASES.flatMap(p => p.products),
    [],
  );
  const barrierOriginal = useMemo(
    () => barrierAllProducts.reduce((s, p) => s + p.price, 0),
    [barrierAllProducts],
  );

  const effectiveOriginal = isBarrierEmergency ? barrierOriginal : normalOriginal;
  const effectiveDiscounted = Math.round(effectiveOriginal * (1 - discountPct / 100) * 100) / 100;
  const effectiveCount = isBarrierEmergency
    ? barrierAllProducts.length
    : allRoutineProducts.length + zoneProducts.length;
  const effectiveDailyPrice = supplyDays > 0
    ? (effectiveDiscounted / supplyDays).toFixed(2) : '0.00';
  const effectiveMonthlyPrice = supplyDays > 0
    ? (effectiveDiscounted / supplyDays * 30).toFixed(2) : '0.00';
  const refillPrice = Math.round(effectiveDiscounted * (1 - refillDiscountPct / 100) * 100) / 100;

  // ── Timeline milestones ─────────────────────────────────────────────────────
  const firstCheckin = Math.round(cycleDays / 7);
  const refillWeek = supplyWeeks;
  const resultWeek = Math.round((cycleDays * 4) / 7);

  // ── Age label for Tier 2 feature ────────────────────────────────────────────
  const ageLabel = AGE_CYCLE_MAP[ageGroup]?.ageLabel[lang] ?? AGE_CYCLE_MAP[2].ageLabel[lang];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRestart = () => {
    useDiagnosisStore.getState().reset();
    navigate('/diagnosis');
  };

  const handleGoToSlide1 = () => {
    navigate('/results?slide=1');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 34px))',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        paddingInline: 'clamp(16px, 4vw, 40px)',
        paddingBlock: 'clamp(20px, 5vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(16px, 4vw, 28px)',
      }}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: MY COLLECTION                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <Section1MyCollection
          isBarrierEmergency={isBarrierEmergency}
          allRoutineProducts={allRoutineProducts}
          zoneProducts={zoneProducts}
          lang={lang}
          isDark={isDark}
          tok={tok}
          effectiveOriginal={effectiveOriginal}
          effectiveDiscounted={effectiveDiscounted}
          effectiveCount={effectiveCount}
          effectiveDailyPrice={effectiveDailyPrice}
          effectiveMonthlyPrice={effectiveMonthlyPrice}
          supplyWeeks={supplyWeeks}
          cycleDays={cycleDays}
          discountPct={discountPct}
          firstCheckin={firstCheckin}
          refillWeek={refillWeek}
          resultWeek={resultWeek}
          onGoToSlide1={handleGoToSlide1}
        />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: HOW TO START                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <Section2HowToStart
          isBarrierEmergency={isBarrierEmergency}
          effectiveDiscounted={effectiveDiscounted}
          effectiveCount={effectiveCount}
          supplyWeeks={supplyWeeks}
          refillPrice={refillPrice}
          refillDiscountPct={refillDiscountPct}
          discountPct={discountPct}
          effectiveDailyPrice={effectiveDailyPrice}
          firstCheckin={firstCheckin}
          ageLabel={ageLabel}
          lang={lang}
          isDark={isDark}
          tok={tok}
          ctaTok={ctaTok}
        />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: TRUST FOOTER                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <Section3TrustFooter
          isBarrierEmergency={isBarrierEmergency}
          lang={lang}
          isDark={isDark}
          onRestart={handleRestart}
        />

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT THUMBNAIL (40x48px, tinted container)
// ═══════════════════════════════════════════════════════════════════════════════

function ProductThumbnail({
  id, role, emoji,
}: { id: string; role: string; emoji: string }) {
  const gradMap: Record<string, [string, string]> = {
    cleanser:      ['rgba(74,158,104,0.12)', 'rgba(74,158,104,0.04)'],
    toner:         ['rgba(55,138,221,0.10)', 'rgba(55,138,221,0.04)'],
    toner_essence: ['rgba(55,138,221,0.10)', 'rgba(55,138,221,0.04)'],
    serum:         ['rgba(186,117,23,0.10)', 'rgba(186,117,23,0.04)'],
    treatment:     ['rgba(186,117,23,0.10)', 'rgba(186,117,23,0.04)'],
    moisturizer:   ['rgba(226,75,74,0.08)',  'rgba(226,75,74,0.03)'],
    spf:           ['rgba(186,117,23,0.08)', 'rgba(186,117,23,0.03)'],
    sunscreen:     ['rgba(186,117,23,0.08)', 'rgba(186,117,23,0.03)'],
    eye:           ['rgba(134,134,139,0.08)', 'rgba(134,134,139,0.03)'],
  };
  const [bgTop, bgBot] = gradMap[role] ?? ['rgba(134,134,139,0.08)', 'rgba(134,134,139,0.03)'];

  return (
    <div style={{
      width: 40, height: 48, borderRadius: 8, flexShrink: 0,
      background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBot} 100%)`,
      border: `1px solid ${bgTop.replace(/[\d.]+\)$/, '0.15)')}`,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 18, lineHeight: 1, zIndex: 1 }}>{emoji}</span>
      <img
        src={`/productsImage/${id}.jpg`}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 2,
        }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: MY COLLECTION
// ═══════════════════════════════════════════════════════════════════════════════

interface Section1Props {
  isBarrierEmergency: boolean;
  allRoutineProducts: FilteredStep[];
  zoneProducts: [string, unknown][];
  lang: LangKey;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
  effectiveOriginal: number;
  effectiveDiscounted: number;
  effectiveCount: number;
  effectiveDailyPrice: string;
  effectiveMonthlyPrice: string;
  supplyWeeks: number;
  cycleDays: number;
  discountPct: number;
  firstCheckin: number;
  refillWeek: number;
  resultWeek: number;
  onGoToSlide1: () => void;
}

function Section1MyCollection({
  isBarrierEmergency,
  allRoutineProducts,
  zoneProducts,
  lang,
  isDark,
  effectiveOriginal,
  effectiveDiscounted,
  effectiveCount,
  effectiveDailyPrice,
  effectiveMonthlyPrice,
  supplyWeeks,
  cycleDays,
  discountPct,
  firstCheckin,
  refillWeek,
  resultWeek,
  onGoToSlide1,
}: Section1Props) {
  const barrierPhases = BARRIER_RECOVERY_PHASES;
  const barrierIdx = isBarrierEmergency ? 3 : 0; // stagger offset for price/cycle cards

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 16px)' }}>

      {/* 1a. Header */}
      <motion.div
        custom={0}
        variants={collectionVariants}
        initial="hidden"
        animate="visible"
        style={{ textAlign: 'center' }}
      >
        {/* Eyebrow */}
        <p style={{
          fontSize: 'clamp(0.4375rem, 0.7vw, 0.5rem)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: isBarrierEmergency ? '#E24B4A' : (isDark ? '#48484A' : '#9CA3AF'),
          margin: '0 0 6px',
          ...(isBarrierEmergency ? {
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(226,75,74,0.08)',
          } : {}),
        }}>
          {isBarrierEmergency
            ? tx('🛡️ 장벽 회복 프로토콜', '🛡️ BARRIERE-ERHOLUNGSPROTOKOLL', '🛡️ BARRIER RECOVERY PROTOCOL', lang)
            : tx('내 프로토콜', 'MEIN PROTOKOLL', 'YOUR PROTOCOL', lang)
          }
        </p>

        {/* Title */}
        <h2 style={{
          fontSize: 'clamp(1.125rem, 2vw + 0.5rem, 1.625rem)',
          fontWeight: 300,
          color: isDark ? '#F5F5F7' : '#1B2838',
          margin: '0 0 4px',
          wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          overflowWrap: 'break-word',
        }}>
          {isBarrierEmergency
            ? tx('장벽 회복 키트', 'Barriere-Erholungskit', 'Barrier Recovery Kit', lang)
            : tx('나만의 스킨케어 컬렉션', 'Meine Hautpflege-Kollektion', 'My skincare collection', lang)
          }
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(0.5625rem, 0.8vw, 0.6875rem)',
          color: isDark ? '#86868B' : '#6B7280',
          margin: 0,
          overflowWrap: 'break-word',
          wordBreak: lang === 'ko' ? 'keep-all' : undefined,
        }}>
          {isBarrierEmergency
            ? tx(
              '2주 집중 회복 · 비우기 → 채우기 → 잠그기',
              '2-Wochen-Erholung · Leeren → Füllen → Versiegeln',
              '2-week recovery · Empty → Fill → Lock',
              lang,
            )
            : tx(
              '진단 기반 · 피부과 검증 · 맞춤 구성',
              'Diagnosebasiert · Dermatologisch geprüft · Personalisiert',
              'Diagnosis-based · Dermatologist verified · Personalized',
              lang,
            )
          }
        </p>
      </motion.div>

      {/* 1b. Product thumbnail row */}
      <motion.div
        custom={1}
        variants={collectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as unknown as undefined,
          scrollbarWidth: 'none' as const,
          paddingBottom: 2,
        } as React.CSSProperties}
      >
        {isBarrierEmergency
          ? barrierPhases.flatMap(p => p.products).map(product => (
            <ProductThumbnail
              key={product.id}
              id={product.id}
              role={product.role}
              emoji={product.emoji}
            />
          ))
          : allRoutineProducts.map(step => (
            <ProductThumbnail
              key={step.product.id}
              id={step.product.id}
              role={step.role}
              emoji={ROLE_EMOJI[step.role] ?? '💊'}
            />
          ))
        }
        {!isBarrierEmergency && zoneProducts.map(([zone, product]) => {
          const p = product as { id?: string; role?: string; emoji?: string };
          return (
            <ProductThumbnail
              key={zone}
              id={p.id ?? zone}
              role={p.role ?? 'serum'}
              emoji={p.emoji ?? '🔬'}
            />
          );
        })}
      </motion.div>

      {/* 1c/1d: Product Lists */}
      {isBarrierEmergency ? (
        /* ── Barrier: Products by phase ── */
        barrierPhases.map((phase, phaseIdx) => (
          <motion.div
            key={phase.key}
            custom={2 + phaseIdx}
            variants={collectionVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Phase label */}
            <div style={{
              fontSize: 'clamp(0.625rem, 0.9vw, 0.75rem)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: phase.color,
              marginBottom: 5,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            }}>
              {phase.icon}{' '}
              {phase.label[lang]} — {phase.subtitle[lang]}
            </div>

            {/* Phase products */}
            {phase.products.map(product => (
              <div key={product.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: 'clamp(4px, 1vw, 8px) clamp(6px, 1.5vw, 10px)',
                borderRadius: 6, marginBottom: 3,
                background: phase.bgColor,
                border: `1px solid ${phase.color}25`,
              }}>
                <div style={{
                  width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0,
                }}>
                  {product.emoji}
                </div>
                <div style={{
                  fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
                  color: isDark ? '#F5F5F7' : '#1B2838',
                  flex: 1,
                  wordBreak: lang === 'ko' ? 'keep-all' : undefined,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                } as React.CSSProperties}>
                  {product.name[lang]}
                </div>
                {product.badge && (
                  <span style={{
                    fontSize: 'clamp(0.4375rem, 0.6vw, 0.5rem)',
                    padding: '1px 5px', borderRadius: 99,
                    background: `${phase.color}18`,
                    color: phase.color, flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {product.badge[lang]}
                  </span>
                )}
                <div style={{
                  fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
                  fontWeight: 500,
                  color: isDark ? '#86868B' : '#6B7280',
                  flexShrink: 0,
                }}>
                  €{product.price.toFixed(2)}
                </div>
              </div>
            ))}
          </motion.div>
        ))
      ) : (
        /* ── Normal: Basic Routine + Zone Care ── */
        <>
          {/* 1c. Basic routine */}
          <motion.div
            custom={2}
            variants={collectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div style={{
              fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isDark ? '#48484A' : '#9CA3AF',
              marginBottom: 5,
            }}>
              {tx(
                '기본 루틴 — {N}단계',
                'BASIS-ROUTINE — {N} SCHRITTE',
                'BASIC ROUTINE — {N} STEPS',
                lang,
                { N: allRoutineProducts.length },
              )}
            </div>

            {allRoutineProducts.map((step) => {
              const price = getProductPrice(step.product.id);
              const name = (step.product.name as Record<string, string> | undefined)?.[lang]
                ?? (step.product.name as Record<string, string> | undefined)?.en
                ?? '';
              return (
                <div key={step.product.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: 'clamp(4px, 1vw, 8px) clamp(6px, 1.5vw, 10px)',
                  borderRadius: 6, marginBottom: 2,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                }}>
                  <div style={{
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                  }}>
                    {ROLE_EMOJI[step.role] ?? '💊'}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
                    color: isDark ? '#F5F5F7' : '#1B2838',
                    flex: 1,
                    wordBreak: lang === 'ko' ? 'keep-all' : undefined,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                  } as React.CSSProperties}>
                    {name}
                  </div>
                  {price > 0 && (
                    <div style={{
                      fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
                      fontWeight: 500,
                      color: isDark ? '#86868B' : '#6B7280',
                      flexShrink: 0,
                    }}>
                      €{price.toFixed(price % 1 === 0 ? 0 : 2)}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* 1d. Zone care */}
          <motion.div
            custom={3}
            variants={collectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div style={{
              fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isDark ? '#E24B4A' : '#A32D2D',
              marginBottom: 5,
            }}>
              {tx(
                '부위별 케어 — 분석 결과 기반',
                'ZONENPFLEGE — AUS IHRER ANALYSE',
                'ZONE CARE — FROM YOUR ANALYSIS',
                lang,
              )}
            </div>

            {zoneProducts.length === 0 ? (
              /* Teaser if no zone care */
              <div style={{
                padding: 10, borderRadius: 8,
                border: '1px dashed rgba(74,158,104,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <span style={{
                  fontSize: 'clamp(0.5625rem, 0.8vw, 0.6875rem)',
                  color: isDark ? '#86868B' : '#6B7280',
                  wordBreak: lang === 'ko' ? 'keep-all' : undefined,
                }}>
                  {tx(
                    '부위별 맞춤 케어를 추가하면 더 효과적이에요',
                    'Zonenpflege hinzufügen für bessere Ergebnisse',
                    'Add zone care for more effective results',
                    lang,
                  )}
                </span>
                <button
                  onClick={onGoToSlide1}
                  style={{
                    fontSize: 'clamp(0.5625rem, 0.8vw, 0.6875rem)',
                    color: '#4A9E68',
                    background: 'none', border: 'none',
                    cursor: 'pointer', flexShrink: 0,
                    padding: '10px 4px', minHeight: 44,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tx('이전 슬라이드에서 추가 →', 'Vorherige Folie zum Hinzufügen →', 'Add from previous slide →', lang)}
                </button>
              </div>
            ) : (
              zoneProducts.map(([zone, product]) => {
                const p = product as {
                  id?: string;
                  name?: Record<string, string>;
                  name_en?: string;
                  role?: string;
                };
                const name = p.name?.[lang] ?? p.name?.en ?? p.name_en ?? zone;
                const price = getProductPrice(p.id ?? '');
                const flag = flagEmoji(p.id ?? '');
                return (
                  <div key={zone} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: 'clamp(4px, 1vw, 8px) clamp(6px, 1.5vw, 10px)',
                    borderRadius: 6, marginBottom: 2,
                    background: 'rgba(226,75,74,0.02)',
                    border: `1px solid ${isDark ? 'rgba(226,75,74,0.08)' : 'rgba(226,75,74,0.06)'}`,
                  }}>
                    <div style={{
                      width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, flexShrink: 0,
                    }}>
                      {flag}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
                      color: isDark ? '#F5F5F7' : '#1B2838',
                      flex: 1,
                      wordBreak: lang === 'ko' ? 'keep-all' : undefined,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                    } as React.CSSProperties}>
                      {name}
                    </div>
                    <span style={{
                      fontSize: 'clamp(0.4375rem, 0.6vw, 0.5rem)',
                      padding: '1px 4px', borderRadius: 99,
                      background: 'rgba(74,158,104,0.08)',
                      color: '#4A9E68', flexShrink: 0,
                    }}>
                      ✓
                    </span>
                    {price > 0 && (
                      <div style={{
                        fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
                        fontWeight: 500,
                        color: isDark ? '#86868B' : '#6B7280',
                        flexShrink: 0,
                      }}>
                        €{price.toFixed(price % 1 === 0 ? 0 : 2)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        </>
      )}

      {/* Barrier Education Card */}
      {isBarrierEmergency && (
        <motion.div
          custom={2 + barrierPhases.length}
          variants={collectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div style={{
            padding: 'clamp(10px, 2.5vw, 16px)',
            borderRadius: 10,
            background: isDark ? 'rgba(186,117,23,0.04)' : 'rgba(186,117,23,0.03)',
            border: '1px solid rgba(186,117,23,0.1)',
          }}>
            <div style={{
              fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
              fontWeight: 600,
              color: isDark ? '#F5F5F7' : '#1B2838',
              marginBottom: 6,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            }}>
              {'💡 '}{tx(
                '왜 지금 강한 성분을 쓰면 안 될까요?',
                'Warum jetzt keine starken Wirkstoffe?',
                'Why no strong actives right now?',
                lang,
              )}
            </div>
            <p style={{
              fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
              color: isDark ? '#86868B' : '#6B7280',
              margin: 0, lineHeight: 1.6,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
              overflowWrap: 'break-word',
            }}>
              {tx(
                '피부 장벽이 손상된 상태에서 레티놀, BHA, 비타민C를 사용하면 오히려 염증이 심해져요. 먼저 장벽을 복구한 뒤, 1 사이클 후 체크인에서 장벽 회복이 확인되면 강한 성분을 해금합니다.',
                'Bei geschädigter Hautbarriere verschlimmern Retinol, BHA und Vitamin C die Entzündung. Nach der Barriere-Reparatur schalten wir beim 1-Zyklus-Check-in stärkere Wirkstoffe frei.',
                'Using retinol, BHA, or vitamin C on a damaged barrier worsens inflammation. After barrier repair, we unlock strong actives at your 1-cycle check-in.',
                lang,
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* 1e. Price breakdown */}
      <motion.div
        custom={isBarrierEmergency ? 2 + barrierPhases.length + 1 : 4}
        variants={collectionVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Divider */}
        <div style={{
          height: '0.5px',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
          marginBottom: 10,
        }} />

        {/* Count + duration */}
        <div style={{
          fontSize: 10,
          color: isDark ? '#86868B' : '#6B7280',
          marginBottom: 6,
          wordBreak: lang === 'ko' ? 'keep-all' : undefined,
        }}>
          {tx(
            '{N}개 제품 · ~{W}주분 ({C} 피부 주기)',
            '{N} Produkte · ~{W} Wochen ({C} Hautzyklen)',
            '{N} products · ~{W} weeks ({C} skin cycles)',
            lang,
            { N: effectiveCount, W: supplyWeeks, C: '2' },
          )}
        </div>

        {/* Prices */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          alignItems: 'baseline', gap: 8, marginBottom: 4,
        }}>
          {effectiveOriginal > effectiveDiscounted && (
            <span style={{
              fontSize: 9,
              color: isDark ? '#48484A' : '#9CA3AF',
              textDecoration: 'line-through',
            }}>
              €{effectiveOriginal.toFixed(2)}
            </span>
          )}
          <span style={{
            fontSize: 'clamp(1.125rem, 1.8vw, 1.375rem)',
            fontWeight: 500,
            color: isDark ? '#F5F5F7' : '#1B2838',
          }}>
            €{effectiveDiscounted.toFixed(2)}
          </span>
        </div>

        {/* Daily + monthly */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          fontSize: 9,
          color: isDark ? '#48484A' : '#9CA3AF',
        }}>
          <span>{tx('하루 €{X}', '€{X} pro Tag', '€{X}/day', lang, { X: effectiveDailyPrice })}</span>
          <span>·</span>
          <span>{tx('월 €{X}', '€{X}/Monat', '€{X}/mo', lang, { X: effectiveMonthlyPrice })}</span>
        </div>
      </motion.div>

      {/* 1f. Compact skin cycle timeline */}
      <motion.div
        custom={isBarrierEmergency ? 2 + barrierPhases.length + 2 : 5}
        variants={collectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div style={{
          padding: 'clamp(10px, 2.5vw, 16px)',
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 500,
            color: isDark ? '#F5F5F7' : '#1B2838',
            marginBottom: 8,
          }}>
            {tx('피부 주기: {N}일', 'Hautzyklus: {N} Tage', 'Skin cycle: {N} days', lang, { N: cycleDays })}
          </div>

          {/* 3 milestone boxes */}
          <div style={{
            display: 'flex', gap: 4, alignItems: 'stretch',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch' as unknown as undefined,
          } as React.CSSProperties}>
            {[
              {
                week: firstCheckin,
                label: tx('첫 체크인', 'Erster Check-in', '1st Check-in', lang),
                color: 'rgba(186,117,23,0.12)',
              },
              {
                week: refillWeek,
                label: tx('리필', 'Nachfüllung', 'Refill', lang),
                color: 'rgba(55,138,221,0.12)',
              },
              {
                week: resultWeek,
                label: tx('성과 측정', 'Ergebnisse', 'Results', lang),
                color: 'rgba(74,158,104,0.15)',
              },
            ].map((m, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 60,
                padding: '6px 8px', borderRadius: 8,
                background: m.color, textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: isDark ? '#F5F5F7' : '#1B2838',
                }}>
                  {tx('{W}주', '{W} Wo.', '{W}wk', lang, { W: m.week })}
                </div>
                <div style={{
                  fontSize: 'clamp(0.5625rem, 0.8vw, 0.625rem)',
                  color: isDark ? '#86868B' : '#6B7280',
                  wordBreak: lang === 'ko' ? 'keep-all' : undefined,
                }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          <p style={{
            fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
            color: isDark ? '#86868B' : '#6B7280',
            margin: '6px 0 0',
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            overflowWrap: 'break-word',
          }}>
            {tx(
              '당신의 피부 재생 주기에 맞춘 리필 타이밍이에요',
              'Nachfüllzeitpunkt abgestimmt auf Ihren Hauterneuerungszyklus',
              'Refill timing matched to your skin renewal cycle',
              lang,
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: HOW TO START
// ═══════════════════════════════════════════════════════════════════════════════

interface Section2Props {
  isBarrierEmergency: boolean;
  effectiveDiscounted: number;
  effectiveCount: number;
  supplyWeeks: number;
  refillPrice: number;
  refillDiscountPct: number;
  discountPct: number;
  effectiveDailyPrice: string;
  firstCheckin: number;
  ageLabel: string;
  lang: LangKey;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
  ctaTok: ReturnType<typeof ctaTokens>;
}

function Section2HowToStart({
  isBarrierEmergency,
  effectiveDiscounted,
  effectiveCount,
  supplyWeeks,
  refillPrice,
  refillDiscountPct,
  discountPct,
  effectiveDailyPrice,
  firstCheckin,
  ageLabel,
  lang,
  isDark,
  ctaTok,
}: Section2Props) {
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  const tier2Features: Array<{ text: string; isAccent: boolean }> = [
    {
      text: tx(
        '{W}주마다 자동 리필 ({age}대 기준)',
        'Automatisches Nachfüllen alle {W} Wochen (für {age}er)',
        'Auto-refill every {W} weeks (for {age}s)',
        lang, { W: supplyWeeks, age: ageLabel },
      ),
      isAccent: false,
    },
    {
      text: tx(
        '{C}주차 리캘리브레이션 체크인',
        'Rekalibrierungs-Check-in in Woche {C}',
        'Recalibration check-in at week {C}',
        lang, { C: firstCheckin },
      ),
      isAccent: false,
    },
    {
      text: isBarrierEmergency
        ? tx(
          '피부 장벽 준비 시 강한 성분 해금',
          'Stärkere Wirkstoffe bei Barriere-Bereitschaft',
          'Stronger actives unlock when barrier is ready',
          lang,
        )
        : tx(
          '피부 변화에 맞춰 포뮬러 교체',
          'Formelanpassung bei Hautveränderungen',
          'Formula adjusts as your skin changes',
          lang,
        ),
      isAccent: isBarrierEmergency,
    },
    {
      text: tx('제품 교체 무제한', 'Unbegrenzter Produkttausch', 'Unlimited product swaps', lang),
      isAccent: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Eyebrow */}
      <motion.p
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          fontSize: 'clamp(0.4375rem, 0.7vw, 0.5rem)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: isDark ? '#48484A' : '#9CA3AF',
          margin: '0 0 4px',
        }}
      >
        {tx('시작하기', 'SO STARTEN SIE', 'HOW TO START', lang)}
      </motion.p>

      {/* ── Tier 1: One-time (PRIMARY CTA) ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        whileHover={prefersReducedMotion ? {} : {
          boxShadow: isDark
            ? '0 0 0 4px rgba(74,158,104,0.1)'
            : '0 0 0 4px rgba(94,139,104,0.08)',
        }}
        style={{
          padding: 'clamp(10px, 2.5vw, 16px)',
          borderRadius: 12,
          border: `2px solid ${isDark ? 'rgba(74,158,104,0.3)' : 'rgba(94,139,104,0.25)'}`,
          background: isDark ? 'rgba(74,158,104,0.03)' : 'rgba(94,139,104,0.03)',
          transition: 'box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Title + Recommended badge */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 8, gap: 8,
        }}>
          <span style={{
            fontSize: 'clamp(0.8125rem, 1.3vw, 1rem)',
            fontWeight: 500,
            color: isDark ? '#F5F5F7' : '#1B2838',
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          }}>
            {isBarrierEmergency
              ? tx('장벽 회복 키트 시작하기', 'Barriere-Erholungskit starten', 'Start Barrier Recovery Kit', lang)
              : tx('지금 시작하기', 'Jetzt starten', 'Start now', lang)
            }
          </span>
          <span style={{
            fontSize: 'clamp(0.4375rem, 0.6vw, 0.5rem)',
            padding: '1px 6px', borderRadius: 99,
            background: isDark ? '#2D6B4A' : '#3D6B4A',
            color: '#F5F5F7',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {tx('추천', 'Empfohlen', 'Recommended', lang)}
          </span>
        </div>

        {/* Price + save + daily */}
        <div style={{ marginBottom: 8, textAlign: 'right' }}>
          <div style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            fontWeight: 500,
            color: isDark ? '#F5F5F7' : '#1B2838',
          }}>
            €{effectiveDiscounted.toFixed(2)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{
              fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
              color: isDark ? '#4A9E68' : '#3D6B4A',
            }}>
              {tx('{N}% 절약', '{N}% sparen', 'save {N}%', lang, { N: discountPct })}
            </span>
            <span style={{
              fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
              color: isDark ? '#4A9E68' : '#3D6B4A',
            }}>
              {tx('하루 €{X}', '€{X} pro Tag', '€{X}/day', lang, { X: effectiveDailyPrice })}
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
          color: isDark ? '#86868B' : '#6B7280',
          margin: '0 0 10px',
          wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          overflowWrap: 'break-word',
        }}>
          {isBarrierEmergency
            ? tx(
              '비우기·채우기·잠그기 3단계 회복 제품 {N}개 · 약 {W}주분',
              '{N} Produkte für 3-Phasen-Erholung · ~{W} Wochen',
              '{N} products for 3-phase recovery · ~{W} weeks',
              lang, { N: effectiveCount, W: supplyWeeks },
            )
            : tx(
              '위에 선택한 {N}개 제품 · 약 {W}주분 · 한번 결제',
              '{N} ausgewählte Produkte · ~{W} Wochen · Einmalzahlung',
              '{N} selected products · ~{W} weeks · one-time payment',
              lang, { N: effectiveCount, W: supplyWeeks },
            )
          }
        </p>

        {/* CTA Button */}
        <motion.button
          whileHover={prefersReducedMotion ? {} : {
            y: -1,
            boxShadow: isDark
              ? '0 4px 16px rgba(45,107,74,0.4)'
              : '0 4px 16px rgba(61,107,74,0.35)',
          }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          style={{
            width: '100%', padding: 10, borderRadius: 12,
            border: 'none', cursor: 'pointer',
            background: ctaTok.background,
            color: '#F5F5F7',
            boxShadow: ctaTok.boxShadow,
            fontSize: 'clamp(0.8125rem, 1.2vw, 0.9375rem)',
            fontWeight: 600, letterSpacing: '0.01em',
            transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            minHeight: 48,
          }}
        >
          {isBarrierEmergency
            ? tx(
              '장벽 회복 시작 — €{X}',
              'Barriere-Erholung starten — €{X}',
              'Start barrier recovery — €{X}',
              lang, { X: effectiveDiscounted.toFixed(2) },
            )
            : tx(
              '지금 주문하기 — €{X}',
              'Jetzt bestellen — €{X}',
              'Order now — €{X}',
              lang, { X: effectiveDiscounted.toFixed(2) },
            )
          }
        </motion.button>
      </motion.div>

      {/* ── Tier 2: Smart Refill ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          padding: 'clamp(10px, 2.5vw, 16px)',
          borderRadius: 12,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        }}
      >
        {/* Title */}
        <div style={{
          fontSize: 'clamp(0.8125rem, 1.3vw, 1rem)',
          fontWeight: 500,
          color: isDark ? '#F5F5F7' : '#1B2838',
          marginBottom: 8,
        }}>
          {tx('스마트 리필 플랜', 'Smart-Nachfüll-Plan', 'Smart Refill Plan', lang)}
        </div>

        {/* Price block */}
        <div style={{ marginBottom: 8, textAlign: 'right' }}>
          <div style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            fontWeight: 500,
            color: isDark ? '#F5F5F7' : '#1B2838',
          }}>
            €{refillPrice.toFixed(2)}
          </div>
          <div style={{
            fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
            color: isDark ? '#4A9E68' : '#3D6B4A',
          }}>
            {tx(
              '단건 대비 {N}% 절약',
              '{N}% Rabatt vs. Einzelkauf',
              'save {N}% vs one-time',
              lang, { N: refillDiscountPct },
            )}
          </div>
          <div style={{
            fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
            color: isDark ? '#86868B' : '#6B7280',
            marginTop: 2,
          }}>
            {tx(
              '{W}주마다 자동 배송',
              'Alle {W} Wochen automatische Lieferung',
              'Auto-delivery every {W} weeks',
              lang, { W: supplyWeeks },
            )}
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
          color: isDark ? '#86868B' : '#6B7280',
          margin: '0 0 8px',
          wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          overflowWrap: 'break-word',
        }}>
          {tx(
            '같은 제품 + 피부 주기 맞춤 리필',
            'Gleiche Produkte + zyklusbasierte Nachfüllung',
            'Same products + cycle-based refill',
            lang,
          )}
        </p>

        {/* Feature list */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10,
        }}>
          {tier2Features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 6,
              fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
              color: f.isAccent
                ? (isDark ? '#4A9E68' : '#3D6B4A')
                : (isDark ? '#86868B' : '#6B7280'),
              fontWeight: f.isAccent ? 500 : 400,
              lineHeight: 1.4,
              wordBreak: lang === 'ko' ? 'keep-all' : undefined,
              overflowWrap: 'break-word',
            }}>
              <span style={{ color: '#4A9E68', flexShrink: 0 }}>✓</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button (outline) */}
        <motion.button
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          style={{
            width: '100%', padding: 10, borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
            cursor: 'pointer',
            background: 'transparent',
            color: isDark ? '#86868B' : '#6B7280',
            fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)',
            fontWeight: 500,
            transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            minHeight: 48,
            overflowWrap: 'break-word',
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          }}
        >
          {tx(
            '스마트 리필 시작 — €{X}/{W}주',
            'Smart-Nachfüllung starten — €{X}/{W} Wo.',
            'Start Smart Refill — €{X}/{W}wk',
            lang, { X: refillPrice.toFixed(2), W: supplyWeeks },
          )}
        </motion.button>
      </motion.div>

      {/* ── Tier 3: Premium + Device (coming soon) ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          padding: 'clamp(10px, 2.5vw, 16px)',
          borderRadius: 12,
          border: `1px dashed ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          background: 'transparent',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 4, gap: 8,
        }}>
          <span style={{
            fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
            color: isDark ? '#48484A' : '#9CA3AF',
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          }}>
            {tx('프리미엄 + 기기', 'Premium + Gerät', 'Premium + Device', lang)}
          </span>
          <span style={{
            fontSize: 'clamp(0.875rem, 1.2vw, 1rem)',
            color: isDark ? '#48484A' : '#9CA3AF',
            flexShrink: 0,
          }}>
            €249.90
          </span>
        </div>

        <p style={{
          fontSize: 'clamp(0.5rem, 0.7vw, 0.5625rem)',
          color: isDark ? '#48484A' : '#9CA3AF',
          margin: '0 0 10px',
          wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          overflowWrap: 'break-word',
        }}>
          {tx(
            '풀 루틴 + LED/마이크로커런트 기기',
            'Volle Routine + LED/Mikrostrom-Gerät',
            'Full routine + LED/microcurrent device',
            lang,
          )}
        </p>

        <button style={{
          width: '100%', padding: 10, borderRadius: 12,
          border: `1px dashed ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          cursor: 'pointer',
          background: 'transparent',
          color: isDark ? '#48484A' : '#9CA3AF',
          fontSize: 9, minHeight: 44,
        }}>
          {tx('출시 알림 받기', 'Benachrichtigung bei Verfügbarkeit', 'Notify me when available', lang)}
        </button>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: TRUST FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

interface Section3Props {
  isBarrierEmergency: boolean;
  lang: LangKey;
  isDark: boolean;
  onRestart: () => void;
}

function Section3TrustFooter({ isBarrierEmergency, lang, isDark, onRestart }: Section3Props) {
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.65 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Barrier upgrade teaser (only in barrier mode) */}
      {isBarrierEmergency && (
        <div style={{
          padding: 'clamp(10px, 2.5vw, 16px)',
          borderRadius: 10,
          background: isDark ? 'rgba(74,158,104,0.03)' : 'rgba(94,139,104,0.03)',
          border: `1px solid ${isDark ? 'rgba(74,158,104,0.1)' : 'rgba(94,139,104,0.1)'}`,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 500,
            color: isDark ? '#4A9E68' : '#3D6B4A',
            marginBottom: 6,
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
          }}>
            {'🔓 '}{tx(
              '장벽 회복 후 풀 프로토콜 해금',
              'Volles Protokoll nach Barriere-Erholung',
              'Full protocol unlocks after barrier recovery',
              lang,
            )}
          </div>
          <p style={{
            fontSize: 9,
            color: isDark ? '#86868B' : '#6B7280',
            margin: 0, lineHeight: 1.6,
            wordBreak: lang === 'ko' ? 'keep-all' : undefined,
            overflowWrap: 'break-word',
          }}>
            {tx(
              '지금은 장벽 회복에 집중하세요. 1 사이클 후 체크인에서 장벽이 회복되면, 당신의 진단에 맞는 풀 5단계 루틴 + 부위별 맞춤 제품이 해금됩니다.',
              'Konzentrieren Sie sich jetzt auf die Erholung. Nach dem 1-Zyklus-Check-in wird Ihr volles 5-Schritte-Protokoll freigeschaltet.',
              'Focus on recovery now. After your 1-cycle check-in confirms healing, your full 5-step protocol + zone care will unlock.',
              lang,
            )}
          </p>
        </div>
      )}

      {/* Trust badges */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
      }}>
        {[
          { icon: '🔬', text: tx('피부과 전문의 검증', 'Dermatologisch geprüft', 'Dermatologist reviewed', lang) },
          { icon: '🔄', text: tx('언제든 해지 가능', 'Jederzeit kündbar', 'Cancel anytime', lang) },
          { icon: '📦', text: tx('EU 3-5일 배송', 'EU 3-5 Werktage', 'EU 3-5 days', lang) },
        ].map((b, i) => (
          <span key={i} style={{
            fontSize: 'clamp(0.5625rem, 0.8vw, 0.6875rem)',
            color: isDark ? '#48484A' : '#9CA3AF',
            whiteSpace: 'nowrap',
          }}>
            {b.icon} {b.text}
          </span>
        ))}
      </div>

      {/* Restart assessment link */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onRestart}
          style={{
            fontSize: 9,
            color: isDark ? '#4A9E68' : '#3D6B4A',
            background: 'none', border: 'none',
            cursor: 'pointer',
            minHeight: 44, padding: '10px 16px',
            textDecoration: 'underline',
            textDecorationColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.textDecorationColor = 'currentColor';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.textDecorationColor = 'transparent';
          }}
        >
          {tx('← 진단 다시 시작하기', '← Diagnose neu starten', '← Restart assessment', lang)}
        </button>
      </div>
    </motion.div>
  );
}
