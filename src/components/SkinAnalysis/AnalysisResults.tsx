// Part B — AnalysisResults.tsx (2025 UI/UX Redesign — Apple + Forest + Glassmorphism)
// Production-ready component: Hero + Top3 Severity + 7-axis Accordion + Products + Feedback
// Supports both Dark & Light modes via tokens(isDark)

import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RotateCcw, Save, ChevronRight, ChevronDown, CheckCircle2, Share2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import { useAuthStore } from '@/store/authStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useSkinProfileStore } from '@/store/useSkinProfileStore';
import { useAnalysisStore } from '@/store/analysisStore';
import { useRoutineStore } from '@/store/useRoutineStore';
import { tokens, glassTokens, ctaTokens, ctaGlowToken, tierGradients } from '@/lib/designTokens';
import type { ScoreTier } from '@/lib/designTokens';
import FeedbackWidget from './FeedbackWidget';
import RoutinePicker from '@/components/routine/RoutinePicker';
import AuthModal from '@/components/ui/AuthModal';
import AiGeneratedBadge from '@/components/legal/AiGeneratedBadge';
import MedicalDisclaimer from '@/components/legal/MedicalDisclaimer';
import { compressImageBase64 } from '@/utils/imageCompression';
import { generateShareCard } from '@/utils/generateShareCard';
import { AXIS_KO_SHORT } from '@/data/productRules';
import { buildProductBundleV5 } from '@/engine/routineEngineV5';
import type { SkinAxisScores } from '@/types/skinAnalysis';
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from '@/engine/types';
import type { AxisKey, AxisScores, AxisSeverity } from '@/engine/types';
import { mergeReasonsWithFallback } from '@/lib/skinAnalysisFallback';

// ── Axis direction mapping ─────────────────────────────────────────────────
// V5 engine: hyd = dehydration severity, bar = barrier damage → high = bad
const HIGH_IS_BAD = new Set(['seb', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox', 'hyd', 'bar']);
const LOW_IS_BAD = new Set(['makeup_stability']);

function getSeverity(key: string, score: number): number {
  if (HIGH_IS_BAD.has(key)) return score;
  if (LOW_IS_BAD.has(key)) return 100 - score;
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
function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'attention';
  return 'critical';
}

// 2025 Redesign: colors via tierGradients from designTokens
const TIER_COLORS: Record<ScoreTier, string> = {
  excellent: tierGradients.excellent.color,
  good: tierGradients.good.color,
  attention: tierGradients.attention.color,
  critical: tierGradients.critical.color,
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
  good: { ko: '양호', en: 'Good', de: 'Gut' },
  attention: { ko: '보통', en: 'Fair', de: 'Mäßig' },
  critical: { ko: '주의', en: 'Needs Care', de: 'Pflegebedarf' },
};

// ── Axis label helper ──────────────────────────────────────────────────────
function getAxisLabel(key: string, lang: string): string {
  if (lang === 'ko') return AXIS_KO_SHORT[key] ?? key;
  if (lang === 'de') return AXIS_LABELS_DE[key] ?? key;
  return AXIS_LABELS[key] ?? key;
}

// ── i18n texts ─────────────────────────────────────────────────────────────
const TX = {
  overallLabel: { ko: '종합 피부 점수', en: 'Overall Skin Score', de: 'Gesamt-Hautpunktzahl' },
  topConcerns: { ko: '관리가 시급한 항목', en: 'Priority Concerns', de: 'Prioritäre Anliegen' },
  allAxes: { ko: '전체 상세 분석', en: 'Full Analysis', de: 'Vollständige Analyse' },
  masterplan: { ko: '🧪 AI가 설계한 내 맞춤 스킨케어 마스터플랜 보기', en: '🧪 View AI Custom Skincare Masterplan', de: '🧪 KI-Hautpflege-Masterplan ansehen' },
  retake: { ko: '다시 스캔', en: 'Retake', de: 'Wiederholen' },
  save: { ko: '저장', en: 'Save', de: 'Speichern' },
  share: { ko: '공유', en: 'Share', de: 'Teilen' },
  shareGenerating: { ko: '카드 생성 중…', en: 'Creating card…', de: 'Karte wird erstellt…' },
  shareDownload: { ko: '이미지 저장됨 — Instagram Stories에서 공유하세요', en: 'Image saved — share to Instagram Stories from your gallery', de: 'Bild gespeichert — teile es in Instagram Stories' },
  saveLogin: { ko: '로그인 후 저장', en: 'Save after login', de: 'Nach Login speichern' },
  saved: { ko: '저장됨 ✓', en: 'Saved ✓', de: 'Gespeichert ✓' },
  saveFail: { ko: '저장 실패 — 재시도', en: 'Save failed — retry', de: 'Fehler — erneut versuchen' },
  precision: { ko: '정밀 분석 완료', en: 'Precision Analysis', de: 'Präzisionsanalyse' },
  precisionDesc: { ko: 'AI 사진 + 생활습관 통합 분석', en: 'AI Photo + Lifestyle Integrated', de: 'KI-Foto + Lebensstil-Analyse' },
};

// ── 2025 Gradient Score Ring ───────────────────────────────────────────────
function ScoreRing({ score, size = 160, isDark = true }: { score: number; size?: number; isDark?: boolean }) {
  const r = (size - 14) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const tier = getScoreTier(score);
  const { gradient } = tierGradients[tier];
  const gradId = `score-grad-${tier}-${size}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="6" />
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - progress }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text
        x={cx} y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.32, fontFamily: "'Fraunces', serif", fontWeight: 700, fill: isDark ? '#F5F5F7' : '#1B2838' }}
      >
        {score}
      </text>
      <text
        x={cx} y={cy + size * 0.16}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.09, fontFamily: 'var(--font-sans)', fontWeight: 400, fill: isDark ? '#86868B' : '#9CA3AF' }}
      >
        /100
      </text>
    </svg>
  );
}


// ── 2025 Accordion Axis Row (Glass Card + Hover Lift) ──────────────────────
function AxisAccordion({ healthScore, label, badge, badgeColor, reason, isDark = true }: {
  healthScore: number; label: string;
  badge: string; badgeColor: string; reason: string; isDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const tok = tokens(isDark);
  const glassTok = glassTokens(isDark);

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: glassTok.card.background,
        backdropFilter: glassTok.card.backdropFilter,
        WebkitBackdropFilter: glassTok.card.WebkitBackdropFilter,
        border: glassTok.card.border,
        boxShadow: glassTok.card.boxShadow,
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-all"
        style={{ minHeight: '48px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        aria-expanded={open}
        aria-label={`${label} — ${badge}`}
      >
        <span className="flex-1 text-left" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 500, color: tok.text }}>
          {label}
        </span>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: tok.border, width: 80 }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: badgeColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(healthScore, 3)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <span style={{ fontSize: '16px', fontFamily: "'Fraunces', serif", fontWeight: 700, color: tok.text, width: '28px', textAlign: 'right' }}>
          {healthScore}
        </span>

        {/* Tier Badge */}
        <span
          className="rounded-full px-2 py-0.5 whitespace-nowrap notranslate"
          translate="no"
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            color: badgeColor,
            background: `${badgeColor}18`,
            border: `1px solid ${badgeColor}30`,
          }}
        >
          {badge}
        </span>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: tok.textSecondary }} />
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
            <div className="px-4 pb-4" style={{ borderTop: `1px solid ${tok.border}`, paddingTop: 10 }}>
              {reason && (
                <p style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: tok.textSecondary, lineHeight: 1.6 }}>
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { language } = useI18nStore();
  const { isLoggedIn } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const glassTok = glassTokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const resetAnalysis = useSkinAnalysisStore((s) => s.resetAnalysis);
  const lifestyleAnswers = useSkinAnalysisStore((s) => s.lifestyleAnswers);

  const [pendingAction, setPendingAction] = useState<'save' | 'masterplan' | 'routine' | null>(null);
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const apiReasons = useSkinAnalysisStore((s) => s.reasons);
  const hasLifestyle = lifestyleAnswers !== null;
  const setResult = useAnalysisStore((s) => s.setResult);

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
    if (!isLoggedIn) {
      // Not logged in → close picker, remember the selected tier, show auth modal
      closePicker();
      setPendingTierId(tierId);
      setPendingAction('routine');
      setShowAuthModal(true);
      return;
    }
    closePicker();
    setSelectedTier(tierId as 'essential' | 'complete' | 'pro');
    handleNavigateToLab(tierId);
  }, [isLoggedIn, closePicker, setSelectedTier, handleNavigateToLab]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveAnalysisResult = useSkinProfileStore((s) => s.saveAnalysisResult);

  const handleGoogleAuth = useCallback(async () => {
    try {
      const resizedImage = capturedImage ? await compressImageBase64(capturedImage, 600, 0.6) : null;
      localStorage.setItem('ssl_pending_analysis', JSON.stringify({
        scores, analysisId, hasLifestyle, timestamp: Date.now(),
        capturedImage: resizedImage,
        reasons: apiReasons ?? null,
      }));

      // Save the user's intent so we can auto-resume after Google redirect return
      if (pendingAction) {
        sessionStorage.setItem('ssl_oauth_intent', JSON.stringify({
          action: pendingAction,
          tierId: pendingTierId,
        }));
      }
    } catch (e) { console.warn('[GoogleAuth] Backup fail:', e); }
    const { loginWithGoogle } = useAuthStore.getState();
    await loginWithGoogle('/skin-analysis?action=oauth_return');
  }, [capturedImage, scores, analysisId, hasLifestyle, apiReasons, pendingAction, pendingTierId]);

  // ── doSave: actual DB save logic — does NOT check isLoggedIn (avoids stale closure) ──
  // Instead, it directly checks supabase.auth.getUser() for a live session.
  const doSave = useCallback(async () => {
    if (saveStatus === 'saved' || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn('[Save] Session expired:', authError?.message);
        setPendingAction('save');
        setShowAuthModal(true);
        setSaveStatus('idle');
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
      const LOW_IS_BAD_KEYS = ['hyd', 'bar', 'texture', 'makeup_stability'] as const;
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
        // Normalize to 0-1 range
        confidenceScore: hasLifestyle ? 0.92 : 0.75,
      });

      if (!saved) throw new Error('Save returned null');
      setSaveStatus('saved');

      const saveMsg = lang === 'ko' ? '분석 결과가 안전하게 저장되었어요' : 'Analysis safely saved';
      toast.success(saveMsg, {
        style: {
          background: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${tok.border}`,
          color: tok.text,
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
          fontFamily: "'SUIT', sans-serif"
        },
        icon: <CheckCircle2 size={18} color="#C9A96E" fill="#1A1F2E" />,
        duration: 2500,
      });
    } catch (err) {
      console.error('[Save] Failed:', err);
      setSaveStatus('error');
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('JWT') || errMsg.includes('auth') || errMsg.includes('authenticated')) {
        setPendingAction('save');
        setShowAuthModal(true);
      } else {
        toast.error(
          lang === 'ko' ? '저장 실패 — 잠시 후 다시 시도해주세요'
            : lang === 'de' ? 'Speichern fehlgeschlagen — bitte erneut versuchen'
              : 'Save failed — please retry'
        );
      }
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [saveStatus, scores, hasLifestyle, lang, saveAnalysisResult]);

  // ── handleSave: button handler — gates on isLoggedIn for the initial click ──
  const handleSave = useCallback(async () => {
    if (saveStatus === 'saved' || saveStatus === 'saving') return;
    if (!isLoggedIn) {
      setPendingAction('save');
      setShowAuthModal(true);
      return;
    }
    doSave();
  }, [saveStatus, isLoggedIn, doSave]);

  // ── Auto-Resume: after Google OAuth redirect, read saved intent and execute ──
  useEffect(() => {
    if (!isLoggedIn) return;
    const intentStr = sessionStorage.getItem('ssl_oauth_intent');
    if (!intentStr || saveStatus !== 'idle') return;
    sessionStorage.removeItem('ssl_oauth_intent'); // one-shot: prevent infinite re-fire
    try {
      const intent = JSON.parse(intentStr) as { action: string; tierId?: string };
      // Delay slightly so the restored UI is fully rendered before triggering actions
      setTimeout(() => {
        if (intent.action === 'save') {
          doSave();
        } else if (intent.action === 'masterplan') {
          doSave(); // save first, then open picker
          openPicker();
        } else if (intent.action === 'routine' && intent.tierId) {
          doSave();
          setSelectedTier(intent.tierId as 'essential' | 'complete' | 'pro');
          handleNavigateToLab(intent.tierId);
        }
      }, 400);
    } catch (e) {
      console.error('[AutoResume] Failed to parse oauth intent:', e);
    }
  }, [isLoggedIn, saveStatus, doSave, openPicker, setSelectedTier, handleNavigateToLab]);

  const resetAnalysisStore = useAnalysisStore((s) => s.reset);

  const handleRetake = useCallback(() => {
    resetAnalysis();
    // Also clear analysisStore to prevent UI flickering when
    // navigating back to the camera view
    resetAnalysisStore();
    onRetake();
  }, [resetAnalysis, resetAnalysisStore, onRetake]);

  // ── handleShare: generate card → Web Share API → download fallback ──────────
  const handleShare = useCallback(async () => {
    if (shareStatus === 'generating') return;
    setShareStatus('generating');

    try {
      const blob = await generateShareCard({
        overallScore,
        tier,
        top3: top3.map((a) => ({ key: a.key, healthScore: a.healthScore })),
        lang,
      });

      const file = new File([blob], 'skin-score.jpg', { type: 'image/jpeg' });

      // 1. Web Share API with file (works on mobile Chrome/Safari → user can pick Instagram Stories)
      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: 'My Skin Score — Skin Strategy Lab' });
        setShareStatus('idle');
        return;
      }

      // 2. Fallback: trigger download + hint toast
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skin-score.jpg';
      a.click();
      URL.revokeObjectURL(url);
      toast(TX.shareDownload[lang], { duration: 5000 });
    } catch (err) {
      // User cancelled Web Share — treat as silent cancel
      if (err instanceof Error && err.name === 'AbortError') {
        /* silent */
      } else {
        console.error('[handleShare]', err);
      }
    } finally {
      setShareStatus('idle');
    }
  }, [shareStatus, overallScore, tier, top3, lang]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-dvh w-full overflow-y-auto pb-32" style={{ background: tok.bg, color: tok.text }}>

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
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, transparent 20%, ${isDark ? 'rgba(10,10,10,0.6)' : 'rgba(250,250,248,0.6)'} 50%, ${tok.bg} 100%)` }}
        />

        {/* Score overlay */}
        <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8" style={{ minHeight: capturedImage ? '380px' : '200px' }}>
          {/* AI Transparency Badge */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
            <AiGeneratedBadge />
          </motion.div>

          {/* Precision badge */}
          {hasLifestyle && (
            <motion.div
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="mb-4 rounded-full px-4 py-1.5 flex items-center gap-2"
              style={{ background: `${tok.accent}14`, border: `1px solid ${tok.accent}25` }}
            >
              <span style={{ fontSize: '14px' }}>🔬</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: tok.accent, letterSpacing: '0.05em' }}>
                {TX.precision[lang]}
              </span>
            </motion.div>
          )}

          {/* 2025 Glassmorphism score card */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="w-full max-w-sm rounded-3xl flex flex-col items-center"
            style={{
              padding: '2rem 1.5rem',
              background: glassTok.card.background,
              backdropFilter: glassTok.card.backdropFilter,
              WebkitBackdropFilter: glassTok.card.WebkitBackdropFilter,
              border: glassTok.card.border,
              boxShadow: glassTok.card.boxShadow,
            }}
          >
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: tok.textSecondary, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>
              {TX.overallLabel[lang]}
            </p>

            <ScoreRing score={overallScore} size={160} isDark={isDark} />

            <p className="mt-4 text-center" style={{
              fontSize: '16px', fontFamily: "'Plus Jakarta Sans', var(--font-sans)", color: tok.text,
              fontWeight: 500, lineHeight: 1.5, maxWidth: 360, margin: '16px auto 0',
            }}>
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
                      fontSize: '12px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      color,
                      background: `${color}14`,
                      border: `1px solid ${color}28`,
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

        {/* ── SECTION 2: Top 3 Priority Cards (2025 Hoverable Glass) ────────── */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
          <p className="mb-4" style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: tok.textSecondary, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
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
                  className="rounded-2xl"
                  whileHover={{ y: -2 }}
                  style={{
                    padding: '1rem 1.25rem',
                    background: glassTok.card.background,
                    backdropFilter: glassTok.card.backdropFilter,
                    WebkitBackdropFilter: glassTok.card.WebkitBackdropFilter,
                    border: glassTok.card.border,
                    boxShadow: glassTok.card.boxShadow,
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '16px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: tok.text }}>
                        {label}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 notranslate"
                        translate="no"
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 600,
                          color: badgeColor,
                          background: `${badgeColor}18`,
                          border: `1px solid ${badgeColor}30`,
                        }}
                      >
                        {TIER_LABELS[cardTier][lang]}
                      </span>
                    </div>
                    <span style={{ fontSize: '28px', fontFamily: "'Fraunces', serif", fontWeight: 700, color: badgeColor, lineHeight: 1 }}>
                      {healthScore}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: tok.border }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: badgeColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(healthScore, 3)}%` }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    />
                  </div>

                  {/* AI Reason */}
                  {reason && (
                    <p className="mt-3" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: tok.textSecondary, lineHeight: 1.6 }}>
                      {reason}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 3: Remaining 7 Axes (2025 Accordion) ──────────────────── */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
          <p className="mb-4" style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: tok.textSecondary, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
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
                  isDark={isDark}
                />
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 4: Masterplan CTA (2025 Gradient + Glow) ─────────────── */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 mb-2">
          <motion.button
            onClick={() => {
              if (!isLoggedIn) {
                setPendingAction('masterplan');
                setShowAuthModal(true);
              } else {
                openPicker();
              }
            }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all"
            aria-label={TX.masterplan[lang]}
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(74,158,104,0.12) 0%, rgba(45,107,74,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(94,139,104,0.08) 0%, rgba(61,107,74,0.05) 100%)',
              border: `1px solid ${tok.accent}30`,
              boxShadow: `${ctaGlowToken(isDark)}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <span style={{
              fontSize: '16px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: tok.accent,
              lineHeight: 1.4,
              textAlign: 'center',
            }}>
              {TX.masterplan[lang]}
            </span>
            <span style={{
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: `${tok.accent}88`,
              letterSpacing: '0.04em',
            }}>
              {lang === 'ko' ? '3단계 / 5단계 / 기기 포함 프로토콜'
                : lang === 'de' ? '3-Stufen / 5-Stufen / Geräte-Protokoll'
                  : '3-Step / 5-Step / Device Protocol'}
            </span>
          </motion.button>
        </motion.div>

        {/* ── Medical Disclaimer ────────────────────────────────────────────── */}
        <motion.div custom={7.5} variants={fadeUp} initial="hidden" animate="visible" className="mt-8 rounded-2xl overflow-hidden">
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${tok.border}`, borderRadius: 16,
            padding: '1rem 1.25rem',
          }}>
            <MedicalDisclaimer />
          </div>
        </motion.div>

        {/* ── SECTION 5: Action Buttons (2025 Premium) ──────────────────────── */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="mt-6 flex gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            aria-label={TX.retake[lang]}
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${tok.border}`,
              backdropFilter: 'blur(12px)',
              color: tok.textSecondary,
              fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500,
            }}
          >
            <RotateCcw size={14} />
            {TX.retake[lang]}
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            aria-label={saveStatus === 'saved' ? TX.saved[lang] : TX.save[lang]}
            style={{
              background:
                saveStatus === 'saved' ? ctaTok.background :
                  saveStatus === 'error' ? 'rgba(232,168,124,0.10)' :
                    ctaTok.background,
              border:
                saveStatus === 'saved' ? 'none' :
                  saveStatus === 'error' ? '1px solid rgba(232,168,124,0.35)' :
                    'none',
              color:
                saveStatus === 'saved' ? (isDark ? '#F5F5F7' : '#FFFFFF') :
                  saveStatus === 'error' ? '#E8A87C' :
                    (isDark ? '#F5F5F7' : '#FFFFFF'),
              fontFamily: 'var(--font-sans)', fontSize: '14px',
              fontWeight: 600,
              opacity: saveStatus === 'saving' ? 0.6 : 1,
              boxShadow: saveStatus === 'error' ? 'none' : ctaGlowToken(isDark),
            }}
          >
            <Save size={14} />
            {saveStatus === 'saved' ? TX.saved[lang] :
              saveStatus === 'error' ? TX.saveFail[lang] :
                saveStatus === 'saving' ? '...' :
                  isLoggedIn ? TX.save[lang] : TX.saveLogin[lang]}
          </button>
        </motion.div>

        {/* ── Share card button ──────────────────────────────────────────────── */}
        <motion.div custom={8.5} variants={fadeUp} initial="hidden" animate="visible" className="mt-3">
          <button
            onClick={handleShare}
            disabled={shareStatus === 'generating'}
            className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            aria-label={TX.share[lang]}
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${tok.border}`,
              backdropFilter: 'blur(12px)',
              color: tok.textSecondary,
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 500,
              opacity: shareStatus === 'generating' ? 0.55 : 1,
            }}
          >
            <Share2 size={13} />
            {shareStatus === 'generating' ? TX.shareGenerating[lang] : TX.share[lang]}
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

      {/* Auth Modal for Saving */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Auto-trigger save now that we are logged in — use doSave (not handleSave)
          // because handleSave's closure still has the stale isLoggedIn=false from before login.
          doSave();
          // Resume the user's original intent after login
          if (pendingAction === 'masterplan') {
            openPicker();
          } else if (pendingAction === 'routine' && pendingTierId) {
            // User picked a tier in RoutinePicker but wasn't logged in → resume
            setSelectedTier(pendingTierId as 'essential' | 'complete' | 'pro');
            handleNavigateToLab(pendingTierId);
            setPendingTierId(null);
          }
          setPendingAction(null);
        }}
        onGoogleClick={handleGoogleAuth}
      />
    </div>
  );
}
