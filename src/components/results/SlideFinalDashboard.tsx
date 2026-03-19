/**
 * SlideFinalDashboard.tsx
 *
 * Slide 2 (final) of the 3-Slide Funnel — Glassmorphism Master Plan
 *
 * Layout:
 *   - Frosted glass container with glassmorphism effect
 *   - Complete routine: Base + Special Care picks
 *   - Large product cards with brand/name/formulation
 *   - Subscribe/Plans CTA
 *
 * CSS Spec: rgba(255,255,255,0.1) / blur(10px) / rounded-20px / border 1px rgba(255,255,255,0.2)
 * Dark mode: rgba(0,0,0,0.2) adjusted via CSS variables
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FlaskConical, Sparkles, Crown } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { buildRoutineV5 } from '@/engine/routineEngineV5';
import type { DiagnosisResult, AxisKey } from '@/engine/types';
import { AXIS_LABELS, AXIS_LABELS_DE } from '@/engine/types';
import type { RoutineStep, MockProduct } from '@/engine/routineEngine';
import SlideSubscribe from './SlideSubscribe';

const AXIS_LABELS_KO: Record<AxisKey, string> = {
  seb: '피지', hyd: '수분', bar: '장벽', sen: '민감성', ox: '산화',
  acne: '여드름', pigment: '색소', texture: '피부결', aging: '노화',
  makeup_stability: '메이크업',
};

interface Props {
  result: DiagnosisResult;
}

export default function SlideFinalDashboard({ result }: Props) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en';
  const implicitFlags = useDiagnosisStore((s) => s.implicitFlags);
  const specialCarePicks = useDiagnosisStore((s) => s.specialCarePicks);

  const routineOutput = useMemo(() => {
    return buildRoutineV5(result, implicitFlags, 'Full');
  }, [result, implicitFlags]);

  // Flatten base routine products
  type FilteredStep = RoutineStep & { product: MockProduct };
  const baseSteps = useMemo<FilteredStep[]>(() => {
    const routine = routineOutput.routines.committed;
    const am = routine.am.filter((s): s is FilteredStep => s.product !== null);
    const seen = new Set<string>();
    return am.filter((s) => {
      if (seen.has(s.product.id)) return false;
      seen.add(s.product.id);
      return true;
    });
  }, [routineOutput]);

  const addOnProducts = useMemo(() => Object.entries(specialCarePicks), [specialCarePicks]);
  const totalCount = baseSteps.length + addOnProducts.length;

  const primaryAxis = result.primary_concerns?.[0] ?? 'sen';
  const axisLabel = (k: AxisKey) =>
    lang === 'ko' ? AXIS_LABELS_KO[k] : lang === 'de' ? AXIS_LABELS_DE[k] : AXIS_LABELS[k];

  const copy = {
    eyebrow: { en: 'Your Master Plan', de: 'Ihr Masterplan', ko: '마스터 플랜' },
    headline: { en: 'Complete Collection', de: 'Komplette Kollektion', ko: '최종 컬렉션' },
    sub: {
      en: 'Your clinically curated skincare collection — base routine and personal add-ons combined.',
      de: 'Ihre klinisch zusammengestellte Hautpflege-Kollektion — Basisroutine und persönliche Zusatzpflege.',
      ko: '임상적으로 큐레이션된 스킨케어 컬렉션 — 기본 루틴과 맞춤 특수 케어가 결합되었습니다.',
    },
    systemCore: { en: 'System Core', de: 'System-Basis', ko: '시스템 코어' },
    personalAddons: { en: 'My Personal Add-ons', de: 'Meine Zusatzpflege', ko: '맞춤 특수 케어' },
    noAddons: { en: 'No add-ons selected', de: 'Keine Zusatzprodukte', ko: '추가 제품 없음' },
    whyTitle: { en: 'Why Strategy Matters', de: 'Warum Strategie zählt', ko: '전략이 중요한 이유' },
    whyBody: {
      en: 'Using products without a diagnostic framework is like medicine without diagnosis. Your collection is clinically sequenced for maximum synergy between each step.',
      de: 'Produkte ohne diagnostischen Rahmen zu verwenden ist wie Medizin ohne Diagnose. Ihre Kollektion ist klinisch sequenziert.',
      ko: '진단 없이 제품을 사용하는 것은 처방 없이 약을 먹는 것과 같습니다. 컬렉션은 단계 간 최대 시너지를 위해 임상적으로 구성되었습니다.',
    },
    totalProducts: { en: 'Total Products', de: 'Gesamtprodukte', ko: '전체 제품' },
  };
  const t = (k: keyof typeof copy) => copy[k][lang] ?? copy[k]['en'];

  // ── Glassmorphism style object ──
  const glassStyle = {
    background: 'hsl(var(--card) / 0.08)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid hsl(var(--foreground) / 0.1)',
    boxShadow: '0 8px 32px hsl(var(--background) / 0.3)',
  };

  const glassCardStyle = {
    background: 'hsl(var(--card) / 0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid hsl(var(--foreground) / 0.08)',
  };

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1000px]">

        {/* Eyebrow */}
        <motion.p className="slide-eyebrow text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {t('eyebrow')}
        </motion.p>

        {/* Headline */}
        <motion.h2
          className="font-display text-center"
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 500,
            lineHeight: 1.15,
            color: 'hsl(var(--foreground))',
            marginBottom: '0.5rem',
            marginTop: '0.25rem',
          }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          {t('headline')}
        </motion.h2>
        <motion.p className="slide-body text-center mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {t('sub')}
        </motion.p>

        {/* ── Clinic Focus + Count banner ── */}
        <motion.div
          className="flex items-center justify-between p-4 mb-6"
          style={glassStyle}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
            <div>
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {axisLabel(primaryAxis as AxisKey)}
                {result.primary_concerns?.[1] && (
                  <span style={{ color: 'hsl(var(--foreground-hint))' }}> + {axisLabel(result.primary_concerns[1] as AxisKey)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{totalCount}</span>
            <p className="text-[0.6rem]" style={{ color: 'hsl(var(--foreground-hint))' }}>{t('totalProducts')}</p>
          </div>
        </motion.div>

        {/* ── Main Glassmorphism Container ── */}
        <motion.div
          className="p-6 mb-6"
          style={glassStyle}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div className="grid gap-6 md:grid-cols-2">

            {/* System Core Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={14} style={{ color: 'hsl(var(--foreground-hint))' }} />
                <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(var(--foreground-hint))' }}>
                  {t('systemCore')}
                </p>
              </div>

              <div className="space-y-2">
                {baseSteps.map((step, i) => (
                  <motion.div
                    key={step.product.id}
                    layoutId={`product-${step.product.id}`}
                    className="p-3.5 flex items-center gap-3"
                    style={glassCardStyle}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                  >
                    {/* Role icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'hsl(var(--muted) / 0.5)' }}
                    >
                      <span className="text-lg">{
                        step.role === 'cleanser' ? '🫧' :
                        step.role === 'toner' ? '💧' :
                        step.role === 'serum' ? '🔬' :
                        step.role === 'treatment' ? '👁' :
                        step.role === 'moisturizer' ? '🛡' :
                        step.role === 'spf' ? '☀️' : '✨'
                      }</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.5rem] font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--foreground-hint))' }}>
                        {step.product.brand}
                      </p>
                      <p className="text-sm font-medium leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                        {step.product.name[lang] ?? step.product.name.en}
                      </p>
                      <p className="text-[0.65rem] mt-0.5" style={{ color: 'hsl(var(--foreground-hint))' }}>
                        {step.product.formulation ?? ''} {step.product.keyIngredients?.slice(0, 2).join(' · ')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Personal Add-ons Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={14} style={{ color: 'hsl(var(--primary))' }} />
                <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
                  {t('personalAddons')}
                </p>
                {addOnProducts.length > 0 && (
                  <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                  >
                    {addOnProducts.length}
                  </span>
                )}
              </div>

              {addOnProducts.length > 0 ? (
                <div className="space-y-2">
                  {addOnProducts.map(([zone, product], i) => (
                    <motion.div
                      key={zone}
                      className="p-3.5 flex items-center gap-3"
                      style={{
                        ...glassCardStyle,
                        borderColor: 'hsl(var(--primary) / 0.15)',
                      }}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'hsl(var(--primary) / 0.08)' }}
                      >
                        <FlaskConical size={16} style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.5rem] font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--primary))' }}>
                          {(product as any).brand ?? (product as any).brand_en ?? zone}
                        </p>
                        <p className="text-sm font-medium leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                          {(product as any).name_en ?? (product as any).name?.en ?? ''}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center" style={{ ...glassCardStyle, minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <FlaskConical size={28} style={{ color: 'hsl(var(--foreground-hint))', opacity: 0.3, marginBottom: '8px' }} />
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--foreground-hint))' }}>
                    {t('noAddons')}
                  </p>
                  <p className="text-[0.65rem]" style={{ color: 'hsl(var(--primary) / 0.5)' }}>
                    {lang === 'ko' ? '이전 슬라이드에서 추가 가능' : lang === 'de' ? 'Vorherige Folie zum Hinzufügen' : 'Go to previous slide to add'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Why Strategy Matters (glassmorphism) ── */}
        <motion.div
          className="p-5 mb-6"
          style={glassStyle}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
              {t('whyTitle')}
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground-hint))' }}>
            {t('whyBody')}
          </p>
        </motion.div>

        {/* ── Subscribe / Plans CTA ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <SlideSubscribe result={result} />
        </motion.div>

      </div>
    </div>
  );
}
