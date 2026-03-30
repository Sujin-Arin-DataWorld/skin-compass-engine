// Part B — AnalysisResults.tsx (Apple + Forest Design System, Dark Mode Only)
// Production-ready component: Hero + Top3 Severity + 7-axis Accordion + Products + Feedback

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RotateCcw, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useAuthStore } from '@/store/authStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useSkinProfileStore } from '@/store/useSkinProfileStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { useRoutineStore } from '@/store/useRoutineStore';
import { brand, glass } from '@/lib/designTokens';
import FeedbackWidget from './FeedbackWidget';
import RoutinePicker from '@/components/routine/RoutinePicker';
import { AXIS_KO_SHORT } from '@/data/productRules';
import { buildProductBundleV5 } from '@/engine/routineEngineV5';
import type { SkinAxisScores } from '@/types/skinAnalysis';
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from '@/engine/types';
import type { AxisKey, AxisScores, AxisSeverity } from '@/engine/types';
import { mergeReasonsWithFallback } from '@/lib/skinAnalysisFallback';

// ── Dark-only tokens (Apple + Forest) ──────────────────────────────────────
const T = brand.dark;
const G = glass.card.dark;

// ── Axis direction mapping ─────────────────────────────────────────────────
// V5 engine: hyd = dehydration severity, bar = barrier damage → high = bad
const HIGH_IS_BAD = new Set(['seb', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox', 'hyd', 'bar']);
const LOW_IS_BAD  = new Set(['makeup_stability']);

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
  excellent: '#4ECDC4',  // Neon mint
  good:      '#8a9a7b',  // Sage
  attention: '#c4a265',  // Gold
  critical:  '#E8A87C',  // Muted coral
};

const TIER_MESSAGES: Record<ScoreTier, Record<string, string>> = {
  excellent: {
    ko: '피부 상태가 매우 좋습니다! 현재 루틴을 유지하세요.',
    en: 'Your skin is in excellent condition! Keep your current routine.',
    de: 'Ihre Haut ist in ausgezeichnetem Zustand! Behalten Sie Ihre Routine bei.',
  },
  good: {
    ko: '전반적으로 양호합니다. 몇 가지 포인트 케어로 더 좋아질 수 있어요.',
    en: 'Overall good condition. Targeted care can make it even better.',
    de: 'Insgesamt guter Zustand. Gezielte Pflege kann ihn noch verbessern.',
  },
  attention: {
    ko: '지금이 케어 골든타임이에요 — 맞춤 솔루션을 준비했습니다.',
    en: "Now is the golden time for care — we've prepared solutions for you.",
    de: 'Jetzt ist die goldene Zeit für Pflege — wir haben Lösungen für Sie.',
  },
  critical: {
    ko: '집중 케어가 필요합니다. 아래 맞춤 루틴을 확인해 주세요.',
    en: 'Intensive care is needed. Please check your customized routine below.',
    de: 'Intensive Pflege ist nötig. Bitte prüfen Sie Ihre Routine unten.',
  },
};

// ── Tier labels (i18n) ────────────────────────────────────────────────────
const TIER_LABELS: Record<ScoreTier, Record<string, string>> = {
  excellent: { ko: '우수', en: 'Excellent', de: 'Ausgezeichnet' },
  good:      { ko: '양호', en: 'Good', de: 'Gut' },
  attention: { ko: '보통', en: 'Fair', de: 'Mäßig' },
  critical:  { ko: '주의', en: 'Needs Care', de: 'Pflegebedarf' },
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
  masterplan:    { ko: '🧪 AI가 설계한 내 맞춤 스킨케어 마스터플랜 보기', en: '🧪 View AI Custom Skincare Masterplan', de: '🧪 KI-Hautpflege-Masterplan ansehen' },
  retake:        { ko: '다시 분석', en: 'Retake', de: 'Wiederholen' },
  save:          { ko: '저장', en: 'Save', de: 'Speichern' },
  saveLogin:     { ko: '로그인 후 저장', en: 'Save after login', de: 'Nach Login speichern' },
  saved:         { ko: '저장됨 ✓', en: 'Saved ✓', de: 'Gespeichert ✓' },
  saveFail:      { ko: '저장 실패 — 재시도', en: 'Save failed — retry', de: 'Fehler — erneut versuchen' },
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


// ── Accordion Axis Row ─────────────────────────────────────────────────────
function AxisAccordion({ healthScore, label, badge, badgeColor, reason }: {
  healthScore: number; label: string;
  badge: string; badgeColor: string; reason: string;
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

        {/* Progress bar — proportional to healthScore */}
        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: badgeColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(healthScore, 4)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <span style={{ fontSize: '15px', fontFamily: 'var(--font-numeric)', fontWeight: 700, color: '#F5F5F7', width: '28px', textAlign: 'right' }}>
          {healthScore}
        </span>

        {/* Badge */}
        <span
          className="rounded-full px-2 py-0.5 whitespace-nowrap notranslate"
          translate="no"
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
              {reason && (
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', color: '#86868B', lineHeight: 1.6 }}>
                  {reason}
                </p>
              )}
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
      rawScore: scores[key],
      healthScore: toHealthScore(key, scores[key]),
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



  // ── Navigation handlers ──────────────────────────────────────────────────
  const { isPickerOpen, openPicker, closePicker, setSelectedTier } = useRoutineStore();

  const handleNavigateToLab = useCallback((tierId?: string) => {
    const axisKeys = Object.keys(scores) as AxisKey[];
    const axisScores = { ...scores } as unknown as AxisScores;
    const axisSeverity = {} as AxisSeverity;
    const primaryConcerns: AxisKey[] = [];
    for (const key of axisKeys) {
      const score = scores[key as keyof SkinAxisScores];
      axisSeverity[key] = score > 60 ? 2 : score < 40 ? 1 : 0;
      if (score > 60) primaryConcerns.push(key);
    }

    // Build temp result, then inject V5 product bundle
    // Map RoutinePicker tier → engine tier
    const tierMap: Record<string, 'Entry' | 'Full' | 'Premium'> = {
      essential: 'Entry', complete: 'Full', pro: 'Premium',
    };
    const engineTier = tierMap[tierId ?? 'complete'] ?? 'Full';

    const tempResult = {
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
      product_bundle: {} as Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // V5 Engine: build product bundle for selected tier
    const implicitFlags = { atopyFlag: false, likelyHormonalCycleUser: false, likelyShaver: false };
    const bundle = buildProductBundleV5(tempResult, implicitFlags, engineTier);
    tempResult.product_bundle = bundle;

    setResult(tempResult);
    navigate('/results');
  }, [scores, setResult, navigate]);

  const handlePickerConfirm = useCallback((tierId: string) => {
    closePicker();
    setSelectedTier(tierId as 'essential' | 'complete' | 'pro');
    handleNavigateToLab(tierId);
  }, [closePicker, setSelectedTier, handleNavigateToLab]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveAnalysisResult = useSkinProfileStore((s) => s.saveAnalysisResult);

  const handleSave = useCallback(async () => {
    if (saveStatus === 'saved' || saveStatus === 'saving') return;

    // Not logged in → redirect to login
    if (!isLoggedIn) {
      try {
        // Use localStorage (NOT sessionStorage) because Firefox Multi-Account
        // Containers and popup blockers may open OAuth in a new tab.
        // sessionStorage is NOT shared between tabs → data would be lost.
        localStorage.setItem('ssl_pending_analysis', JSON.stringify({
          scores, analysisId, hasLifestyle, timestamp: Date.now(),
        }));
      } catch (e) { console.warn('[AnalysisResults] localStorage failed:', e); }
      navigate('/login?redirect=/skin-analysis');
      return;
    }

    // Logged in → save via useSkinProfileStore to user_skin_profiles
    setSaveStatus('saving');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // BUG-6 FIX: Session expired on mobile (background tab GC'd the token).
      // Save pending analysis → redirect to login so it auto-saves on return.
      if (authError || !user) {
        console.warn('[Save] Session expired:', authError?.message);
        try {
          localStorage.setItem('ssl_pending_analysis', JSON.stringify({
            scores, analysisId, hasLifestyle, timestamp: Date.now(),
          }));
        } catch { /* safe */ }
        setSaveStatus('idle');
        toast.error(
          lang === 'ko' ? '세션이 만료되었습니다. 다시 로그인해주세요.'
            : lang === 'de' ? 'Sitzung abgelaufen. Bitte erneut anmelden.'
            : 'Session expired. Please log in again.'
        );
        navigate('/login?redirect=/skin-analysis');
        return;
      }

      // Derive skinType & primaryConcerns from scores
      const sebHealth = 100 - scores.seb;
      const hydHealth = scores.hyd;
      const skinType =
        sebHealth < 45 && hydHealth < 45 ? 'combination' :
        sebHealth < 45 ? 'oily' :
        hydHealth < 45 ? 'dry' : 'normal';

      const HIGH_IS_BAD_KEYS = ['seb', 'sen', 'acne', 'pigment', 'aging', 'ox'] as const;
      const LOW_IS_BAD_KEYS  = ['hyd', 'bar', 'texture', 'makeup_stability'] as const;
      const primaryConcerns: string[] = [
        ...HIGH_IS_BAD_KEYS.filter(k => scores[k] > 60),
        ...LOW_IS_BAD_KEYS.filter(k => scores[k as keyof typeof scores] < 40),
      ].slice(0, 5);

      const saved = await saveAnalysisResult({
        userId: user.id,
        scores,
        skinType: skinType as 'oily' | 'dry' | 'combination' | 'normal',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        primaryConcerns: primaryConcerns as any,
        analysisMethod: 'camera',
        // BUG-6 FIX: Normalize to 0-1 range (was 85 → DB constraint violation possible)
        confidenceScore: hasLifestyle ? 0.92 : 0.75,
      });

      if (!saved) throw new Error('Save returned null');
      setSaveStatus('saved');
      const saveMsg = lang === 'ko' ? '분석 결과가 저장되었어요 ✓'
        : lang === 'de' ? 'Ihre Analyse wurde gespeichert ✓'
        : 'Your analysis has been saved ✓';
      toast.success(saveMsg);
    } catch (err) {
      console.error('[Save] Failed:', err);
      setSaveStatus('error');
      // BUG-6 FIX: Show specific error message instead of silent failure
      const errMsg = err instanceof Error ? err.message : '';
      toast.error(
        errMsg.includes('JWT') || errMsg.includes('auth') || errMsg.includes('authenticated')
          ? (lang === 'ko' ? '인증 오류 — 다시 로그인해주세요'
            : lang === 'de' ? 'Authentifizierungsfehler — bitte erneut anmelden'
            : 'Auth error — please log in again')
          : (lang === 'ko' ? '저장 실패 — 잠시 후 다시 시도해주세요'
            : lang === 'de' ? 'Speichern fehlgeschlagen — bitte erneut versuchen'
            : 'Save failed — please retry')
      );
      // Auto-reset after 3s so user can retry
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [isLoggedIn, scores, analysisId, hasLifestyle, navigate, saveStatus, saveAnalysisResult, lang]);

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
    <div className="min-h-dvh w-full overflow-y-auto pb-32" style={{ background: '#0A0A0A', color: '#F5F5F7', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>

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
              {top3.map(({ key, healthScore }) => {
                const pillTier = getScoreTier(healthScore);
                const color = TIER_COLORS[pillTier];
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
                    {getAxisLabel(key, lang)} {healthScore}
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
            {top3.map(({ key, healthScore }, i) => {
              const cardTier = getScoreTier(healthScore);
              const badgeColor = TIER_COLORS[cardTier];
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
                        className="rounded-full px-2.5 py-0.5 notranslate"
                        translate="no"
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 600,
                          color: badgeColor,
                          background: `${badgeColor}15`,
                          border: `1px solid ${badgeColor}30`,
                        }}
                      >
                        {TIER_LABELS[cardTier][lang]}
                      </span>
                    </div>
                    <span style={{ fontSize: '22px', fontFamily: 'var(--font-numeric)', fontWeight: 700, color: badgeColor }}>
                      {healthScore}
                    </span>
                  </div>

                  {/* Progress bar — proportional to healthScore */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: badgeColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(healthScore, 4)}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    />
                  </div>

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
            {rest.map(({ key, healthScore }) => {
              const accTier = getScoreTier(healthScore);
              return (
                <AxisAccordion
                  key={key}
                  healthScore={healthScore}
                  label={getAxisLabel(key, lang)}
                  badge={TIER_LABELS[accTier][lang]}
                  badgeColor={TIER_COLORS[accTier]}
                  reason={reasons[key] ?? ''}
                />
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 4: Masterplan CTA ─────────────────────────────────────── */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 mb-2">
          <motion.button
            onClick={openPicker}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(138,154,123,0.15) 0%, rgba(74,158,104,0.12) 100%)',
              border: '1px solid rgba(138,154,123,0.3)',
              boxShadow: '0 0 40px rgba(138,154,123,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span style={{
              fontSize: '15px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: '#8a9a7b',
              lineHeight: 1.4,
              textAlign: 'center',
            }}>
              {TX.masterplan[lang]}
            </span>
            <span style={{
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: 'rgba(138,154,123,0.6)',
              letterSpacing: '0.05em',
            }}>
              {lang === 'ko' ? '3단계 / 5단계 / 기기 포함 프로토콜'
               : lang === 'de' ? '3-Stufen / 5-Stufen / Geräte-Protokoll'
               : '3-Step / 5-Step / Device Protocol'}
            </span>
          </motion.button>
        </motion.div>

        {/* ── SECTION 5: Action Buttons ─────────────────────────────────────── */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="mt-6 flex gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', color: '#86868B', fontFamily: 'var(--font-sans)', fontSize: '14px' }}
          >
            <RotateCcw size={14} />
            {TX.retake[lang]}
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background:
                saveStatus === 'saved'  ? 'rgba(138,154,123,0.15)' :
                saveStatus === 'error'  ? 'rgba(232,168,124,0.10)' :
                'rgba(255,255,255,0.03)',
              border:
                saveStatus === 'saved'  ? '1px solid rgba(138,154,123,0.4)' :
                saveStatus === 'error'  ? '1px solid rgba(232,168,124,0.35)' :
                '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              color:
                saveStatus === 'saved'  ? '#8a9a7b' :
                saveStatus === 'error'  ? '#E8A87C' :
                isLoggedIn ? '#F5F5F7' : '#c4a265',
              fontFamily: 'var(--font-sans)', fontSize: '14px',
              opacity: saveStatus === 'saving' ? 0.6 : 1,
              fontWeight: saveStatus === 'idle' && isLoggedIn ? 600 : 400,
            }}
          >
            <Save size={14} />
            {saveStatus === 'saved'  ? TX.saved[lang] :
             saveStatus === 'error'  ? TX.saveFail[lang] :
             saveStatus === 'saving' ? '...' :
             isLoggedIn ? TX.save[lang] : TX.saveLogin[lang]}
          </button>
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

      {/* RoutinePicker bottom sheet */}
      <RoutinePicker
        isOpen={isPickerOpen}
        onClose={closePicker}
        onConfirm={handlePickerConfirm}
      />
    </div>
  );
}
