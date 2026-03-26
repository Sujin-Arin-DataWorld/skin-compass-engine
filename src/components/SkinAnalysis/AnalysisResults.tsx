// Part B — AnalysisResults.tsx (Apple + Forest Design System, Dark Mode Only)
// Production-ready component: Hero + Top3 Severity + 7-axis Accordion + Products + Feedback

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useAuthStore } from '@/store/authStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { brand, glass } from '@/lib/designTokens';
import FeedbackWidget from './FeedbackWidget';
import ProductRecommendationCard from './ProductRecommendationCard';
import { PRODUCT_RULES, AXIS_KO_SHORT } from '@/data/productRules';
import type { SkinAxisScores } from '@/types/skinAnalysis';
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from '@/engine/types';
import type { AxisKey, AxisScores, AxisSeverity } from '@/engine/types';
import { mergeReasonsWithFallback } from '@/lib/skinAnalysisFallback';

// ── Dark-only tokens (Apple + Forest) ──────────────────────────────────────
const T = brand.dark;
const G = glass.card.dark;

// ── Axis direction mapping ─────────────────────────────────────────────────
const HIGH_IS_BAD = new Set(['seb', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox']);
const LOW_IS_BAD  = new Set(['hyd', 'bar', 'makeup_stability']);

function getSeverity(key: string, score: number): number {
  if (HIGH_IS_BAD.has(key)) return score;
  if (LOW_IS_BAD.has(key))  return 100 - score;
  return 50;
}

function toHealthScore(key: string, value: number): number {
  return HIGH_IS_BAD.has(key) ? 100 - value : value;
}

function getOverallScore(scores: SkinAxisScores): number {
  const keys = Object.keys(scores) as (keyof SkinAxisScores)[];
  const sum = keys.reduce((acc, k) => acc + toHealthScore(k, scores[k]), 0);
  return Math.round(sum / keys.length);
}

// ── Score tier system ──────────────────────────────────────────────────────
type ScoreTier = 'excellent' | 'good' | 'attention' | 'critical';

function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'attention';
  return 'critical';
}

const TIER_COLORS: Record<ScoreTier, string> = {
  excellent: '#4A9E68',  // Forest green
  good:      '#87B6BC',  // Teal
  attention: '#C9A96E',  // Gold
  critical:  '#CF6679',  // Soft rose
};

const TIER_MESSAGES: Record<ScoreTier, Record<string, string>> = {
  excellent: {
    ko: '피부 상태가 매우 건강합니다',
    en: 'Your skin is in excellent condition',
    de: 'Ihre Haut ist in hervorragendem Zustand',
  },
  good: {
    ko: '전반적으로 양호한 피부입니다',
    en: 'Your skin is in good shape overall',
    de: 'Ihre Haut ist insgesamt in gutem Zustand',
  },
  attention: {
    ko: '지금이 케어 골든타임이에요',
    en: 'Now is the golden time for care',
    de: 'Jetzt ist die goldene Zeit für Pflege',
  },
  critical: {
    ko: '집중 케어가 필요한 시점입니다',
    en: 'Your skin needs focused care',
    de: 'Ihre Haut braucht intensive Pflege',
  },
};

// ── Severity badge system ──────────────────────────────────────────────────
type SeverityTier = 'excellent' | 'good' | 'normal' | 'attention' | 'critical';

function getSeverityTier(sev: number): SeverityTier {
  if (sev <= 20) return 'excellent';
  if (sev <= 40) return 'good';
  if (sev <= 55) return 'normal';
  if (sev <= 75) return 'attention';
  return 'critical';
}

const SEV_BADGE_COLORS: Record<SeverityTier, string> = {
  excellent: '#4A9E68',
  good:      '#4A9E68',
  normal:    '#C9A96E',
  attention: '#E8A87C',
  critical:  '#CF6679',
};

const SEV_BADGE_LABELS: Record<SeverityTier, Record<string, string>> = {
  excellent: { ko: '매우 좋음', en: 'Excellent', de: 'Sehr gut' },
  good:      { ko: '양호', en: 'Good', de: 'Gut' },
  normal:    { ko: '보통', en: 'Normal', de: 'Normal' },
  attention: { ko: '관리 필요', en: 'Needs care', de: 'Pflege nötig' },
  critical:  { ko: '집중 케어', en: 'Critical', de: 'Intensive Pflege' },
};

// ── Gauge Bar labels ───────────────────────────────────────────────────────
const GAUGE_LABELS = {
  ko: ['좋음', '보통', '주의'],
  en: ['Good', 'Fair', 'Concern'],
  de: ['Gut', 'Mäßig', 'Achtung'],
};

// ── Axis label helper ──────────────────────────────────────────────────────
function getAxisLabel(key: string, lang: string): string {
  if (lang === 'ko') return AXIS_KO_SHORT[key] ?? key;
  if (lang === 'de') return AXIS_LABELS_DE[key] ?? key;
  return AXIS_LABELS[key] ?? key;
}

// ── i18n texts ─────────────────────────────────────────────────────────────
const TX = {
  overallLabel:  { ko: '종합 피부 점수', en: 'Overall Skin Score', de: 'Gesamt-Hautpunktzahl' },
  topConcerns:   { ko: '관리가 시급한 항목', en: 'Priority Concerns', de: 'Prioritäre Anliegen' },
  allAxes:       { ko: '전체 상세 분석', en: 'Full Analysis', de: 'Vollständige Analyse' },
  products:      { ko: '맞춤 추천 제품', en: 'Recommended Products', de: 'Empfohlene Produkte' },
  viewRoutine:   { ko: '전체 맞춤 루틴 보기', en: 'View My Routine', de: 'Meine Routine ansehen' },
  retake:        { ko: '다시 분석', en: 'Retake', de: 'Wiederholen' },
  save:          { ko: '로그인 후 저장', en: 'Save after login', de: 'Nach Login speichern' },
  saved:         { ko: '저장됨', en: 'Saved', de: 'Gespeichert' },
  productSubtitle:{ ko: '분석 결과를 바탕으로 선별한 맞춤 솔루션입니다.', en: 'Curated solutions based on your analysis results.', de: 'Kuratierte Lösungen basierend auf Ihren Analyseergebnissen.' },
  noProductsHealthy: { ko: '피부 상태가 양호합니다! 맞춤 루틴을 확인해보세요.', en: 'Your skin looks healthy! Check out our curated routines.', de: 'Ihre Haut sieht gesund aus! Entdecken Sie unsere kuratierten Routinen.' },
  noProductsCurating: { ko: '고민에 맞는 전문 솔루션을 준비하고 있습니다.', en: 'We are curating specialized solutions for your specific concerns.', de: 'Wir kuratieren spezialisierte Lösungen für Ihre spezifischen Anliegen.' },
  precision:     { ko: '정밀 분석 완료', en: 'Precision Analysis', de: 'Präzisionsanalyse' },
  precisionDesc: { ko: 'AI 사진 + 생활습관 통합 분석', en: 'AI Photo + Lifestyle Integrated', de: 'KI-Foto + Lebensstil-Analyse' },
};

// ── Circular Score Ring ────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const tier = getScoreTier(score);
  const color = TIER_COLORS[tier];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
      />
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.28, fontFamily: 'var(--font-numeric)', fontWeight: 700, fill: '#F5F5F7' }}
      >
        {score}
      </text>
      <text
        x={cx} y={cy + size * 0.15}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.09, fontFamily: 'var(--font-sans)', fontWeight: 400, fill: '#86868B' }}
      >
        /100
      </text>
    </svg>
  );
}

// ── 3-Tier Gauge Bar ───────────────────────────────────────────────────────
function GaugeBar({ severity, lang }: { severity: number; lang: string }) {
  const labels = GAUGE_LABELS[lang as keyof typeof GAUGE_LABELS] ?? GAUGE_LABELS.en;

  return (
    <div className="mt-3">
      {/* Gauge track with 3 segments */}
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {/* Colored segments */}
        <div className="absolute inset-0 flex">
          <div style={{ flex: 1, background: 'rgba(74,158,104,0.35)' }} />
          <div style={{ flex: 1, background: 'rgba(201,169,110,0.35)', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1, background: 'rgba(232,168,124,0.35)' }} />
        </div>
        {/* Marker */}
        <motion.div
          className="absolute top-0 h-full w-1 rounded-full"
          style={{
            background: severity <= 35 ? '#4A9E68' : severity <= 65 ? '#C9A96E' : '#E8A87C',
            boxShadow: `0 0 8px ${severity <= 35 ? 'rgba(74,158,104,0.6)' : severity <= 65 ? 'rgba(201,169,110,0.6)' : 'rgba(232,168,124,0.6)'}`,
          }}
          initial={{ left: '0%' }}
          animate={{ left: `calc(${Math.min(Math.max(severity, 2), 98)}% - 2px)` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
      {/* Segment labels */}
      <div className="flex mt-1.5">
        {labels.map((label, i) => (
          <span key={i} className="flex-1 text-center" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Accordion Axis Row ─────────────────────────────────────────────────────
function AxisAccordion({ axisKey, score, severity, label, badge, badgeColor, reason, lang }: {
  axisKey: string; score: number; severity: number; label: string;
  badge: string; badgeColor: string; reason: string; lang: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{ background: G.background, ...{ backdropFilter: G.backdropFilter, WebkitBackdropFilter: G.WebkitBackdropFilter }, border: G.border }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-all"
        style={{ minHeight: '48px' }}
      >
        <span className="flex-1 text-left" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: '#F5F5F7' }}>
          {label}
        </span>

        {/* Mini gauge */}
        <div className="w-16 h-1.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ flex: 1, background: 'rgba(74,158,104,0.3)' }} />
          <div style={{ flex: 1, background: 'rgba(201,169,110,0.3)' }} />
          <div style={{ flex: 1, background: 'rgba(232,168,124,0.3)' }} />
        </div>

        <span style={{ fontSize: '15px', fontFamily: 'var(--font-numeric)', fontWeight: 700, color: '#F5F5F7', width: '28px', textAlign: 'right' }}>
          {score}
        </span>

        {/* Badge */}
        <span
          className="rounded-full px-2 py-0.5 whitespace-nowrap"
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            color: badgeColor,
            background: `${badgeColor}15`,
            border: `1px solid ${badgeColor}30`,
          }}
        >
          {badge}
        </span>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: '#86868B' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <GaugeBar severity={severity} lang={lang} />
              <p className="mt-3" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: '#86868B', lineHeight: 1.6 }}>
                {reason}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stagger animation ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface AnalysisResultsProps {
  scores: SkinAxisScores;
  capturedImage: string | null;
  analysisId: string | null;
  onRetake: () => void;
}

export default function AnalysisResults({
  scores, capturedImage, analysisId, onRetake,
}: AnalysisResultsProps) {
  const navigate = useNavigate();
  const { language } = useI18nStore();
  const { isLoggedIn } = useAuthStore();
  const resetAnalysis = useSkinAnalysisStore((s) => s.resetAnalysis);
  const lifestyleAnswers = useSkinAnalysisStore((s) => s.lifestyleAnswers);
  const apiReasons = useSkinAnalysisStore((s) => s.reasons);
  const hasLifestyle = lifestyleAnswers !== null;
  const setResult = useDiagnosisStore((s) => s.setResult);

  const lang = language as 'ko' | 'en' | 'de';

  // ── Compute overall score ────────────────────────────────────────────────
  const overallScore = useMemo(() => getOverallScore(scores), [scores]);
  const tier = getScoreTier(overallScore);

  // ── Sort axes by severity (descending) ───────────────────────────────────
  const sortedAxes = useMemo(() => {
    const entries = (Object.keys(scores) as (keyof SkinAxisScores)[]).map(key => ({
      key,
      score: scores[key],
      severity: getSeverity(key, scores[key]),
    }));
    return entries.sort((a, b) => b.severity - a.severity);
  }, [scores]);

  const top3 = sortedAxes.slice(0, 3);
  const rest = sortedAxes.slice(3);

  // ── Merge API reasons with fallback ──────────────────────────────────────
  const reasons = useMemo(() =>
    mergeReasonsWithFallback(apiReasons ?? null, scores as unknown as Record<string, number>, lang),
    [apiReasons, scores, lang],
  );

  // ── Product rules ────────────────────────────────────────────────────────
  const matchedProducts = useMemo(() =>
    PRODUCT_RULES.filter(r => r.triggerCondition(scores))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3),
    [scores],
  );

  // ── Navigation handlers ──────────────────────────────────────────────────
  const handleNavigateToLab = useCallback(() => {
    const axisKeys = Object.keys(scores) as AxisKey[];
    const axisScores = { ...scores } as unknown as AxisScores;
    const axisSeverity = {} as AxisSeverity;
    const primaryConcerns: AxisKey[] = [];
    for (const key of axisKeys) {
      const score = scores[key as keyof SkinAxisScores];
      axisSeverity[key] = score > 60 ? 2 : score < 40 ? 1 : 0;
      if (score > 60) primaryConcerns.push(key);
    }
    setResult({
      engineVersion: 'v5-ai-camera',
      axis_scores: axisScores,
      axis_scores_normalized: { ...axisScores },
      axis_severity: axisSeverity,
      primary_concerns: primaryConcerns.slice(0, 5),
      secondary_concerns: [],
      detected_patterns: [],
      urgency_level: 'MEDIUM',
      active_flags: [],
      radar_chart_data: [],
      product_bundle: {},
    });
    navigate('/results');
  }, [scores, setResult, navigate]);

  const handleSave = useCallback(() => {
    if (!isLoggedIn) {
      try {
        sessionStorage.setItem('ssl_pending_analysis', JSON.stringify({
          scores, analysisId, hasLifestyle, timestamp: Date.now(),
        }));
      } catch (e) { console.warn('[AnalysisResults] Failed to save:', e); }
      navigate('/login?redirect=/skin-analysis');
    }
  }, [isLoggedIn, scores, analysisId, hasLifestyle, navigate]);

  const resetDiagnosisStore = useDiagnosisStore((s) => s.reset);

  const handleRetake = useCallback(() => {
    resetAnalysis();
    // Also clear diagnosisStore to prevent UI flickering when
    // navigating back to the camera view
    resetDiagnosisStore();
    onRetake();
  }, [resetAnalysis, resetDiagnosisStore, onRetake]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-dvh w-full overflow-y-auto pb-32" style={{ background: '#0A0A0A', color: '#F5F5F7' }}>

      {/* ── SECTION 1: Photo Hero + Overall Score ──────────────────────────── */}
      <div className="relative w-full" style={{ minHeight: capturedImage ? '380px' : '200px' }}>
        {/* User photo — full width */}
        {capturedImage && (
          <img
            src={`data:image/jpeg;base64,${capturedImage}`}
            alt="Your skin analysis photo"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', filter: 'brightness(0.7)' }}
          />
        )}
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(10,10,10,0.6) 50%, #0A0A0A 100%)' }}
        />

        {/* Score overlay */}
        <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8" style={{ minHeight: capturedImage ? '380px' : '200px' }}>
          {/* Precision badge */}
          {hasLifestyle && (
            <motion.div
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="mb-4 rounded-full px-4 py-1.5 flex items-center gap-2"
              style={{ background: 'rgba(74,158,104,0.12)', border: '1px solid rgba(74,158,104,0.25)' }}
            >
              <span style={{ fontSize: '14px' }}>🔬</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#4A9E68', letterSpacing: '0.05em' }}>
                {TX.precision[lang]}
              </span>
            </motion.div>
          )}

          {/* Glassmorphism score card */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center"
            style={{
              background: 'rgba(28,28,30,0.55)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {TX.overallLabel[lang]}
            </p>

            <ScoreRing score={overallScore} size={130} />

            <p className="mt-3 text-center" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', color: TIER_COLORS[tier], fontWeight: 500 }}>
              {TIER_MESSAGES[tier][lang]}
            </p>

            {/* Top 3 concern pills */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {top3.map(({ key, severity }) => {
                const sevTier = getSeverityTier(severity);
                const color = SEV_BADGE_COLORS[sevTier];
                return (
                  <span
                    key={key}
                    className="rounded-full px-3 py-1"
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      color,
                      background: `${color}12`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {getAxisLabel(key, lang)} {Math.round(severity)}
                  </span>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-md px-4">

        {/* ── SECTION 2: Top 3 Priority Cards ──────────────────────────────── */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
          <p className="mb-4" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {TX.topConcerns[lang]}
          </p>
          <div className="flex flex-col gap-3">
            {top3.map(({ key, score, severity }, i) => {
              const sevTier = getSeverityTier(severity);
              const badgeColor = SEV_BADGE_COLORS[sevTier];
              const label = getAxisLabel(key, lang);
              const reason = reasons[key] ?? '';

              return (
                <motion.div
                  key={key}
                  custom={i + 3}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl p-4"
                  style={{
                    background: G.background,
                    backdropFilter: G.backdropFilter,
                    WebkitBackdropFilter: G.WebkitBackdropFilter,
                    border: G.border,
                    boxShadow: G.boxShadow,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#F5F5F7' }}>
                        {label}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5"
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 600,
                          color: badgeColor,
                          background: `${badgeColor}15`,
                          border: `1px solid ${badgeColor}30`,
                        }}
                      >
                        {SEV_BADGE_LABELS[sevTier][lang]}
                      </span>
                    </div>
                    <span style={{ fontSize: '22px', fontFamily: 'var(--font-numeric)', fontWeight: 700, color: badgeColor }}>
                      {score}
                    </span>
                  </div>

                  {/* Gauge bar */}
                  <GaugeBar severity={severity} lang={lang} />

                  {/* AI Reason */}
                  {reason && (
                    <p className="mt-3" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: '#86868B', lineHeight: 1.6 }}>
                      {reason}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 3: Remaining 7 Axes (Accordion) ──────────────────────── */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
          <p className="mb-4" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {TX.allAxes[lang]}
          </p>
          <div className="flex flex-col gap-2">
            {rest.map(({ key, score, severity }) => {
              const sevTier = getSeverityTier(severity);
              return (
                <AxisAccordion
                  key={key}
                  axisKey={key}
                  score={score}
                  severity={severity}
                  label={getAxisLabel(key, lang)}
                  badge={SEV_BADGE_LABELS[sevTier][lang]}
                  badgeColor={SEV_BADGE_COLORS[sevTier]}
                  reason={reasons[key] ?? ''}
                  lang={lang}
                />
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 4: Product Recommendations ───────────────────────────── */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
          <p className="mb-1" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: '#86868B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {TX.products[lang]}
          </p>
          {matchedProducts.length > 0 && (
            <p className="mb-4" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: 'rgba(134,134,139,0.7)', lineHeight: 1.5 }}>
              {TX.productSubtitle[lang]}
            </p>
          )}
          {matchedProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {matchedProducts.map(rule => (
                <ProductRecommendationCard key={rule.productId} rule={rule} scores={scores} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(74,158,104,0.06)', border: '1px solid rgba(74,158,104,0.15)' }}>
              <p style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: '#4A9E68' }}>
                {(tier === 'excellent' || tier === 'good') ? TX.noProductsHealthy[lang] : TX.noProductsCurating[lang]}
              </p>
            </div>
          )}
        </motion.div>

        {/* ── SECTION 5: Action Buttons ─────────────────────────────────────── */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="mt-8 flex flex-col gap-3">
          {/* Primary CTA */}
          <button
            onClick={handleNavigateToLab}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: '#2D6B4A',
              color: '#F5F5F7',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(45,107,74,0.20)',
            }}
          >
            {TX.viewRoutine[lang]}
            <ChevronRight size={16} />
          </button>

          {/* Secondary actions */}
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                color: '#86868B',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}
            >
              <RotateCcw size={14} />
              {TX.retake[lang]}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                color: isLoggedIn ? '#86868B' : '#C9A96E',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}
            >
              <Save size={14} />
              {isLoggedIn ? TX.saved[lang] : TX.save[lang]}
            </button>
          </div>
        </motion.div>

        {/* ── SECTION 6: Feedback (bottom) ──────────────────────────────────── */}
        <div id="feedback-slot" className="mt-12">
          {analysisId && (
            <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
              <FeedbackWidget analysisId={analysisId} />
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
