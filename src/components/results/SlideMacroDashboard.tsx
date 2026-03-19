/**
 * SlideMacroDashboard.tsx
 *
 * Slide 0 of the 3-Slide Funnel — Macro Dashboard
 *
 * Layout:
 *   - Circular progress rings per skin axis (replaces bar charts)
 *   - Tier tabs: 3-step / 5-step / 5+Device (Entry/Full/Premium)
 *   - AM ☀️ / PM 🌙 toggle to switch day/night routines
 *   - SPF mandatory badge on daytime AM view
 *   - Step numbered labels (Step 1, Step 2...)
 *   - Click a product → expandable AIX Insight panel
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, FlaskConical, ChevronDown } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { buildRoutineV5 } from '@/engine/routineEngineV5';
import type { DiagnosisResult, AxisKey } from '@/engine/types';
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_KEYS } from '@/engine/types';
import type { RoutineStep, MockProduct } from '@/engine/routineEngine';

// ── Axis Labels ─────────────────────────────────────────────────────────────

const AXIS_LABELS_KO: Record<AxisKey, string> = {
  seb: '피지', hyd: '수분', bar: '장벽', sen: '민감성', ox: '산화',
  acne: '여드름', pigment: '색소', texture: '피부결', aging: '노화',
  makeup_stability: '메이크업',
};

function scoreColor(score: number): string {
  if (score >= 70) return 'hsl(0, 72%, 58%)';
  if (score >= 50) return 'hsl(35, 80%, 55%)';
  if (score >= 30) return 'hsl(45, 70%, 55%)';
  return 'hsl(var(--primary))';
}

// ── Axis Observation Templates ──────────────────────────────────────────────

const OBSERVATION_TEMPLATES: Partial<Record<AxisKey, {
  en: (s: number) => string;
  de: (s: number) => string;
  ko: (s: number) => string;
}>> = {
  acne: {
    en: (s) => `Breakout activity ${s > 60 ? "concentrated and cyclical" : "present with moderate frequency"}`,
    de: (s) => `Ausbruchsaktivität ${s > 60 ? "konzentriert und zyklisch" : "mit mäßiger Häufigkeit vorhanden"}`,
    ko: (s) => `트러블 활동 ${s > 60 ? "집중적이고 주기적" : "중간 빈도로 나타남"}`,
  },
  seb: {
    en: (s) => `Oil overproduction${s > 60 ? " returning within 2–4h of cleansing" : " in the T-zone"}`,
    de: (s) => `Übermäßige Ölproduktion${s > 60 ? ", die 2–4h nach der Reinigung zurückkehrt" : " primär in der T-Zone"}`,
    ko: (s) => `피지 과다 분비${s > 60 ? " — 세안 후 2–4시간 내 재발생" : " — T존 중심"}`,
  },
  hyd: {
    en: (s) => `Moisture retention ${s > 60 ? "significantly compromised (fast TEWL pattern)" : "below optimal"}`,
    de: (s) => `Feuchtigkeitsspeicherung ${s > 60 ? "erheblich beeinträchtigt (schneller TEWL)" : "unter dem Optimum"}`,
    ko: (s) => `수분 유지력 ${s > 60 ? "심하게 손상됨 (빠른 TEWL 패턴)" : "최적 이하"}`,
  },
  sen: {
    en: (s) => `Reactive sensitivity${s > 60 ? " — multiple actives causing stinging" : " with thermal flush tendency"}`,
    de: (s) => `Reaktive Empfindlichkeit${s > 60 ? " — mehrere Wirkstoffe verursachen Stechen" : " mit Tendenz zum Hitzeflush"}`,
    ko: (s) => `반응성 민감도${s > 60 ? " — 복수의 성분이 따가움 유발" : " — 열성 홍조 경향"}`,
  },
  pigment: {
    en: (s) => `Pigmentation${s > 60 ? " showing UV-responsive deepening" : " with residual post-inflammatory marks"}`,
    de: (s) => `Pigmentierung${s > 60 ? " zeigt UV-reaktive Vertiefung" : " mit verbleibenden post-entzündlichen Spuren"}`,
    ko: (s) => `색소침착${s > 60 ? " — 자외선 반응성 심화 확인" : " — 염증 후 잔여 자국"}`,
  },
  texture: {
    en: (s) => `Pore and texture irregularity${s > 60 ? " across both nose and forehead zones" : " in T-zone"}`,
    de: (s) => `Poren- und Texturunregelmäßigkeiten${s > 60 ? " über Nasen- und Stirnpartien" : " leicht in der T-Zone"}`,
    ko: (s) => `모공 및 피부결 불균일${s > 60 ? " — 코와 이마 전반에 걸쳐" : " — T존 중심"}`,
  },
  aging: {
    en: (s) => `Firmness response${s > 60 ? " — pinch recoil significantly delayed" : " showing early-stage reduction"}`,
    de: (s) => `Festigkeitsreaktion${s > 60 ? " — Hautrückbildung nach Kneifen deutlich verzögert" : " zeigt Rückgang im Frühstadium"}`,
    ko: (s) => `탄력 반응${s > 60 ? " — 꼬집기 후 회복 현저히 지연" : " — 초기 감소 징후"}`,
  },
  bar: {
    en: (s) => `Barrier stress${s > 60 ? " — redness + tightness + stinging triad present" : " with recovery delay"}`,
    de: (s) => `Barriere-Stress${s > 60 ? " — Rötung + Spannungsgefühl + Stechen (Triade) vorhanden" : " mit Verzögerung der Erholungsphase"}`,
    ko: (s) => `피부 장벽 스트레스${s > 60 ? " — 홍조·당김·따가움 3징후 동반" : " — 회복 지연"}`,
  },
};

// ── Circular Progress Ring ──────────────────────────────────────────────────

const CircularScore = memo(function CircularScore({ axis, score, lang, size = 68 }: {
  axis: AxisKey; score: number; lang: 'en' | 'de' | 'ko'; size?: number;
}) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const offset = circumference * (1 - pct);
  const color = scoreColor(score);
  const label = lang === 'ko' ? AXIS_LABELS_KO[axis] : lang === 'de' ? AXIS_LABELS_DE[axis] : AXIS_LABELS[axis];

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={4} opacity={0.3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.22} fontWeight={700} fill={color}
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >{Math.round(score)}</text>
      </svg>
      <span className="text-[0.55rem] font-bold tracking-widest uppercase text-center leading-tight"
        style={{ color: score >= 50 ? color : 'hsl(var(--foreground-hint))', maxWidth: size }}
      >{label}</span>
    </div>
  );
});

// ── AIX Insight Content ─────────────────────────────────────────────────────

const AIX_CONTENT: Record<string, { en: string; de: string; ko: string }> = {
  cleanser: {
    en: 'pH-balanced barrier support. Gentle surfactants that cleanse without stripping.',
    de: 'pH-ausgewogene Barriere-Unterstützung. Sanfte Tenside.',
    ko: 'pH 균형 클렌저. 순한 계면활성제 구성.',
  },
  toner: {
    en: 'Hydrating toner to restore moisture immediately after cleansing.',
    de: 'Feuchtigkeitstoner zur sofortigen Wiederherstellung.',
    ko: '세안 직후 수분 보충 토너.',
  },
  serum: {
    en: 'Active serum targeting your primary concern axis. Concentration calibrated to your severity.',
    de: 'Aktives Serum für Ihre Hauptbesorgnis.',
    ko: '주요 축 타겟팅 액티브 세럼. 심각도에 맞게 농도 보정.',
  },
  treatment: {
    en: 'Targeted treatment for secondary concerns. Applied after serum for layered efficacy.',
    de: 'Gezielte Behandlung für sekundäre Anliegen.',
    ko: '2차 관심사를 위한 타겟 트리트먼트.',
  },
  moisturizer: {
    en: 'Barrier-sealing moisturiser matched to your base type.',
    de: 'Barriere-versiegelnde Feuchtigkeitscreme.',
    ko: '기초 타입에 맞춘 장벽 밀봉 보습제.',
  },
  spf: {
    en: 'Broad-spectrum UV protection. Non-comedogenic formula for your skin type.',
    de: 'Breitspektrum UV-Schutz.',
    ko: '광범위 자외선 차단. 논코메도제닉 포뮬러.',
  },
  eye: {
    en: 'Delicate eye area treatment. Gentle formulation for thin periorbital skin.',
    de: 'Sanfte Augenpflege.',
    ko: '눈가 피부를 위한 순한 아이 트리트먼트.',
  },
  device: {
    en: 'Clinical EMS/LED device. Amplifies serum penetration by up to 3×.',
    de: 'Klinisches EMS/LED-Gerät.',
    ko: '임상 등급 EMS/LED 기기. 세럼 침투 3배 증폭.',
  },
};

const ROLE_EMOJI: Record<string, string> = {
  cleanser: '🫧', toner: '💧', serum: '🔬', treatment: '👁',
  moisturizer: '🛡', spf: '☀️', eye: '👁', device: '✨',
};

// ── Expandable Product Card ─────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({ step, isExpanded, onToggle, lang, axisScores }: {
  step: RoutineStep & { product: MockProduct };
  isExpanded: boolean;
  onToggle: () => void;
  lang: 'en' | 'de' | 'ko';
  axisScores: Record<AxisKey, number>;
}) {
  const { product, role } = step;
  const insight = AIX_CONTENT[role] ?? AIX_CONTENT['serum'];

  const topAxes = useMemo(() => {
    const entries = Object.entries(axisScores) as [AxisKey, number][];
    return entries.filter(([_, s]) => s > 30).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [axisScores]);

  return (
    <motion.div layout className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isExpanded ? 'hsl(var(--card) / 0.9)' : 'hsl(var(--card) / 0.6)',
        border: isExpanded ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid hsl(var(--border) / 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button onClick={onToggle} className="w-full p-3 text-left flex items-center gap-2.5">
        <span className="text-base flex-shrink-0">{ROLE_EMOJI[role] ?? '💊'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[0.5rem] font-bold tracking-[0.12em] uppercase" style={{ color: 'hsl(var(--primary))' }}>{role}</p>
          <p className="text-[0.8rem] font-medium leading-tight truncate" style={{ color: 'hsl(var(--foreground))' }}>
            {product.name[lang] ?? product.name.en}
          </p>
          <p className="text-[0.6rem] mt-0.5 truncate" style={{ color: 'hsl(var(--foreground-hint))' }}>
            {product.brand} · {product.keyIngredients.slice(0, 2).join(', ')}
          </p>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'hsl(var(--foreground-hint))' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
              <div className="pt-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={10} style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[0.55rem] font-bold tracking-[0.1em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
                    {lang === 'ko' ? '이 성분이 좋은 이유' : lang === 'de' ? 'Warum dieser Wirkstoff' : 'Why This Ingredient'}
                  </p>
                </div>
                <p className="text-[0.75rem] leading-relaxed" style={{ color: 'hsl(var(--foreground-hint))' }}>{insight[lang]}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain size={10} style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[0.55rem] font-bold tracking-[0.1em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
                    {lang === 'ko' ? '제품 매칭 로직' : lang === 'de' ? 'Matching-Logik' : 'Matching Logic'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { l: lang === 'ko' ? '역할' : 'Role', v: role },
                    { l: lang === 'ko' ? '제형' : 'Form.', v: product.formulation ?? '—' },
                  ].map(({ l, v }) => (
                    <div key={l} className="rounded-md px-2 py-1" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
                      <span className="text-[0.5rem] font-medium" style={{ color: 'hsl(var(--foreground-hint))' }}>{l}</span>
                      <span className="text-[0.65rem] font-semibold ml-1" style={{ color: 'hsl(var(--foreground))' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain size={10} style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[0.55rem] font-bold tracking-[0.1em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
                    {lang === 'ko' ? 'AIX 진단 매칭' : lang === 'de' ? 'AIX Diagnose' : 'AIX Diagnosis Match'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topAxes.map(([axis, score]) => {
                    const axLabel = lang === 'ko' ? AXIS_LABELS_KO[axis] : lang === 'de' ? AXIS_LABELS_DE[axis] : AXIS_LABELS[axis];
                    return (
                      <div key={axis} className="flex items-center gap-1 rounded-full px-2 py-0.5"
                        style={{ background: `${scoreColor(score)}15`, border: `1px solid ${scoreColor(score)}33` }}
                      >
                        <span className="text-[0.55rem] font-semibold" style={{ color: scoreColor(score) }}>{axLabel}</span>
                        <span className="text-[0.55rem] font-bold" style={{ color: scoreColor(score) }}>{Math.round(score)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ── Main Component ──────────────────────────────────────────────────────────

type TierKey = '3-step' | '5-step' | 'advanced';

interface Props {
  result: DiagnosisResult;
  onGoToLab?: () => void;
}

export default function SlideMacroDashboard({ result, onGoToLab }: Props) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en';
  const implicitFlags = useDiagnosisStore((s) => s.implicitFlags);

  // ── Tier & Timing state ───────────────────────────────────────────────
  const [activeTier, setActiveTier] = useState<TierKey>('5-step');
  const [timing, setTiming] = useState<'am' | 'pm'>('am');

  // Build routines for all tiers (memoized per result)
  const routines = useMemo(() => {
    const entry   = buildRoutineV5(result, implicitFlags, 'Entry');
    const full    = buildRoutineV5(result, implicitFlags, 'Full');
    const premium = buildRoutineV5(result, implicitFlags, 'Premium');
    return { entry, full, premium };
  }, [result, implicitFlags]);

  // Select the right routine level based on active tier + timing
  type FilteredStep = RoutineStep & { product: MockProduct };
  const currentSteps = useMemo<FilteredStep[]>(() => {
    let level;
    if (activeTier === '3-step') level = routines.entry.routines.minimalist;
    else if (activeTier === 'advanced') level = routines.premium.routines.advanced ?? routines.premium.routines.committed;
    else level = routines.full.routines.committed;

    const steps = timing === 'am' ? level.am : level.pm;
    const filtered = steps.filter((s): s is FilteredStep => s.product !== null);
    const seen = new Set<string>();
    return filtered.filter((s) => {
      if (seen.has(s.product.id)) return false;
      seen.add(s.product.id);
      return true;
    });
  }, [routines, activeTier, timing]);

  // Track which product is expanded for AIX insight
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Track which axis is expanded for observation text
  const [expandedAxis, setExpandedAxis] = useState<AxisKey | null>(null);
  const toggleAxis = useCallback((axis: AxisKey) => {
    setExpandedAxis((prev) => (prev === axis ? null : axis));
  }, []);

  // Active axes sorted by score
  const activeAxes = useMemo(() => {
    return AXIS_KEYS
      .map((k) => ({ axis: k, score: result.axis_scores[k] ?? 0 }))
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [result]);

  const patternNameEN = result.detected_patterns[0]?.pattern.name_en ?? 'Balanced Profile';
  const p = result.detected_patterns[0]?.pattern as unknown as Record<string, string> | undefined;
  const patternName = language === 'de' ? (p?.name_de ?? patternNameEN) : language === 'ko' ? (p?.name_ko ?? patternNameEN) : patternNameEN;

  const signalCount = result.radar_chart_data.reduce((sum, d) => sum + (d.score > 0 ? 1 : 0), 0);
  const confidence = Math.min(95, 65 + signalCount * 3);

  const copy = {
    eyebrow: { en: 'Diagnostic Result', de: 'Diagnose-Ergebnis', ko: '진단 결과' },
    skinAxis: { en: 'Skin Axis Analysis', de: 'Hautachsen-Analyse', ko: '피부 축 분석' },
    routineTitle: { en: 'Your Base Routine', de: 'Ihre Basisroutine', ko: '기본 루틴' },
    tapHint: { en: 'Tap for insight', de: 'Für Einsicht tippen', ko: '탭하여 인사이트' },
    confidence: { en: 'diagnostic confidence', de: 'Diagnose-Konfidenz', ko: '진단 신뢰도' },
    spfRequired: { en: 'SPF is essential for daytime', de: 'SPF ist tagsüber unverzichtbar', ko: '낮에는 선크림 필수!' },
    step: { en: 'Step', de: 'Schritt', ko: 'Step' },
  };
  const t = (k: keyof typeof copy) => copy[k][lang] ?? copy[k]['en'];

  const tierTabs: { key: TierKey; label: { en: string; de: string; ko: string }; desc: { en: string; de: string; ko: string } }[] = [
    { key: '3-step', label: { en: '3-Step', de: '3-Schritte', ko: '3단계' }, desc: { en: 'Essential', de: 'Basis', ko: '기본' } },
    { key: '5-step', label: { en: '5-Step', de: '5-Schritte', ko: '5단계' }, desc: { en: 'Full Protocol', de: 'Vollständig', ko: '풀 프로토콜' } },
    { key: 'advanced', label: { en: '5+ Device', de: '5+ Gerät', ko: '5+기기' }, desc: { en: 'Advanced', de: 'Premium', ko: '어드밴스드' } },
  ];

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[900px]">

        {/* Eyebrow */}
        <motion.p className="slide-eyebrow text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {t('eyebrow')}
        </motion.p>

        {/* Pattern title */}
        <motion.h1 className="font-display text-center" style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 600, lineHeight: 1.15,
          color: 'hsl(var(--foreground))', marginBottom: '0.25rem', marginTop: '0.25rem',
        }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {patternName}
        </motion.h1>

        {/* Confidence badge */}
        <motion.div className="flex justify-center mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))' }}
          >{confidence}% {t('confidence')}</span>
        </motion.div>

        {/* ── Circular Axis Charts ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
          <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-center mb-3" style={{ color: 'hsl(var(--primary))' }}>
            {t('skinAxis')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {activeAxes.map(({ axis, score }, i) => {
              const template = OBSERVATION_TEMPLATES[axis];
              const obsText = template ? (template[lang]?.(score) ?? template.en(score)) : null;
              const isAxisOpen = expandedAxis === axis;
              return (
                <motion.div key={axis} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <button onClick={() => obsText && toggleAxis(axis)}
                    className="flex flex-col items-center gap-0.5 transition-transform"
                    style={{ cursor: obsText ? 'pointer' : 'default' }}
                  >
                    <CircularScore axis={axis} score={score} lang={lang} />
                    {obsText && (
                      <motion.div animate={{ rotate: isAxisOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-0.5">
                        <ChevronDown size={10} style={{ color: scoreColor(score), opacity: 0.6 }} />
                      </motion.div>
                    )}
                  </button>
                  <AnimatePresence>
                    {isAxisOpen && obsText && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden" style={{ maxWidth: 140 }}
                      >
                        <p className="text-[0.6rem] leading-snug text-center mt-1 px-1"
                          style={{ color: 'hsl(var(--foreground-hint))' }}
                        >{obsText}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Routine Section with Tier Tabs + AM/PM Toggle ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(var(--foreground-hint))' }}>
              {t('routineTitle')}
            </p>
            <p className="text-[0.5rem]" style={{ color: 'hsl(var(--foreground-hint))' }}>{t('tapHint')}</p>
          </div>

          {/* Tier toggle tabs */}
          <div className="flex gap-1.5 mb-2">
            {tierTabs.map((tab) => {
              const isActive = activeTier === tab.key;
              return (
                <button key={tab.key}
                  onClick={() => { setActiveTier(tab.key); setExpandedId(null); }}
                  className="flex-1 rounded-lg py-1.5 px-2 transition-all text-center"
                  style={{
                    background: isActive ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted) / 0.3)',
                    border: isActive ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  <p className="text-[0.7rem] font-bold" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground-hint))' }}>
                    {tab.label[lang]}
                  </p>
                  <p className="text-[0.5rem]" style={{ color: isActive ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--foreground-hint) / 0.5)' }}>
                    {tab.desc[lang]}
                  </p>
                </button>
              );
            })}
          </div>

          {/* AM/PM toggle + SPF badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border) / 0.4)' }}>
              <button onClick={() => setTiming('am')}
                className="px-3 py-1.5 flex items-center gap-1 transition-all"
                style={{ background: timing === 'am' ? 'hsl(var(--primary) / 0.1)' : 'transparent', borderRight: '1px solid hsl(var(--border) / 0.3)' }}
              >
                <span className="text-sm">☀️</span>
                <span className="text-[0.65rem] font-bold" style={{ color: timing === 'am' ? 'hsl(var(--primary))' : 'hsl(var(--foreground-hint))' }}>AM</span>
              </button>
              <button onClick={() => setTiming('pm')}
                className="px-3 py-1.5 flex items-center gap-1 transition-all"
                style={{ background: timing === 'pm' ? 'hsl(var(--primary) / 0.1)' : 'transparent' }}
              >
                <span className="text-sm">🌙</span>
                <span className="text-[0.65rem] font-bold" style={{ color: timing === 'pm' ? 'hsl(var(--primary))' : 'hsl(var(--foreground-hint))' }}>PM</span>
              </button>
            </div>

            {/* SPF mandatory badge (AM only) */}
            {timing === 'am' && (
              <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{ background: 'hsl(45, 95%, 55%, 0.12)', border: '1px solid hsl(45, 95%, 55%, 0.3)' }}
              >
                <span className="text-xs">☀️</span>
                <span className="text-[0.55rem] font-bold" style={{ color: 'hsl(45, 85%, 45%)' }}>{t('spfRequired')}</span>
              </motion.div>
            )}
          </div>

          {/* Product grid with step numbers */}
          <div className="grid grid-cols-2 gap-2">
            {currentSteps.map((step, i) => (
              <motion.div
                key={`${activeTier}-${timing}-${step.product.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
              >
                {/* Step number label */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[0.55rem] font-bold"
                    style={{
                      background: step.role === 'spf' && timing === 'am' ? 'hsl(45, 95%, 55%, 0.2)' : 'hsl(var(--primary) / 0.1)',
                      color: step.role === 'spf' && timing === 'am' ? 'hsl(45, 85%, 40%)' : 'hsl(var(--primary))',
                    }}
                  >{i + 1}</span>
                  <span className="text-[0.55rem] font-bold tracking-wide" style={{ color: 'hsl(var(--foreground-hint))' }}>
                    {t('step')} {i + 1}
                  </span>
                  {step.role === 'spf' && timing === 'am' && (
                    <span className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'hsl(45, 95%, 55%, 0.15)', color: 'hsl(45, 85%, 40%)' }}
                    >{lang === 'ko' ? '필수' : lang === 'de' ? 'Pflicht' : 'Essential'}</span>
                  )}
                </div>

                <ProductCard
                  step={step}
                  isExpanded={expandedId === step.product.id}
                  onToggle={() => toggleExpand(step.product.id)}
                  lang={lang}
                  axisScores={result.axis_scores}
                />
              </motion.div>
            ))}
          </div>

          {/* Lab nudge */}
          {onGoToLab && (
            <motion.button onClick={onGoToLab}
              className="w-full mt-4 rounded-xl p-3 flex items-center gap-3 transition-all group"
              style={{ background: 'hsl(var(--card) / 0.3)', border: '1.5px dashed hsl(var(--primary) / 0.3)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: 'hsl(var(--primary) / 0.08)' }}
              >
                <FlaskConical size={16} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[0.55rem] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
                  {lang === 'ko' ? '특수 케어 추가' : lang === 'de' ? 'Spezial-Pflege hinzufügen' : 'Add Special Care'}
                </p>
                <p className="text-[0.65rem]" style={{ color: 'hsl(var(--foreground-hint))' }}>
                  {lang === 'ko' ? '부위별 맞춤 제품 →' : lang === 'de' ? 'Gezielte Produkte →' : 'Targeted products by zone →'}
                </p>
              </div>
            </motion.button>
          )}
        </motion.div>

      </div>
    </div>
  );
}
