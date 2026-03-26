// Prompt 4 (+ Prompt 4 UPDATE) — AI Analysis Results
// AI Analysis Results — Axis Cards + Feedback + Product Recommendations

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { RotateCcw, Save, ChevronRight } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useAuthStore } from '@/store/authStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { tokens, glassTokens } from '@/lib/designTokens';
import FeedbackWidget from './FeedbackWidget';
import ProductRecommendationCard from './ProductRecommendationCard';
import { PRODUCT_RULES, AXIS_KO_SHORT } from '@/data/productRules';
import type { SkinAxisScores } from '@/types/skinAnalysis';
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from '@/engine/types';
import type { AxisKey, AxisScores, AxisSeverity } from '@/engine/types';

interface AnalysisResultsProps {
  scores: SkinAxisScores;
  capturedImage: string | null; // base64 (mirrored for display)
  analysisId: string | null;
  onRetake: () => void;
}

// Axes where high score = problematic (invert for health score)
const PROBLEM_AXES = new Set(['seb', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox']);

function toHealthScore(key: string, value: number): number {
  return PROBLEM_AXES.has(key) ? 100 - value : value;
}

function getOverallScore(scores: SkinAxisScores): number {
  const keys = Object.keys(scores) as (keyof SkinAxisScores)[];
  const sum = keys.reduce((acc, k) => acc + toHealthScore(k, scores[k]), 0);
  return Math.round(sum / keys.length);
}

type ScoreTier = 'excellent' | 'good' | 'attention' | 'critical';

function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'attention';
  return 'critical';
}

const TIER_MESSAGES: Record<ScoreTier, Record<string, string>> = {
  excellent: {
    ko: '훌륭해요! 현재 루틴이 피부에 딱 맞고 있어요.',
    en: 'Wonderful! Your current routine is working beautifully.',
    de: 'Wunderbar! Ihre aktuelle Routine passt perfekt zu Ihrer Haut.',
  },
  good: {
    ko: '전반적으로 좋은 상태예요. 몇 가지 포인트만 더 관리하면 완벽해질 거예요.',
    en: 'Your skin is in good shape. A few targeted adjustments will make it perfect.',
    de: 'Ihre Haut ist in guter Verfassung. Einige gezielte Anpassungen werden sie perfekt machen.',
  },
  attention: {
    ko: '지금이 케어 골든타임이에요. 맞춤 솔루션을 준비했습니다.',
    en: 'Now is the golden time for care. We\'ve prepared a tailored solution for you.',
    de: 'Jetzt ist die goldene Zeit für Pflege. Wir haben eine maßgeschneiderte Lösung für Sie.',
  },
  critical: {
    ko: '집중 케어가 필요한 시점이에요. 전문 솔루션으로 함께 회복해요.',
    en: 'Your skin needs focused care right now. Let\'s restore it together with expert solutions.',
    de: 'Ihre Haut braucht jetzt intensive Pflege. Lassen Sie uns sie mit Expertenlösungen wiederherstellen.',
  },
};

function getScoreSummary(score: number, lang: string): string {
  const tier = getScoreTier(score);
  return TIER_MESSAGES[tier][lang] ?? TIER_MESSAGES[tier]['en'];
}

function getAxisInsight(key: string, score: number, lang: string): string {
  const ko: Record<string, (s: number) => string> = {
    seb: (s) => s > 70 ? 'T존 유분기가 다소 높습니다' : s < 30 ? '피부가 많이 건조한 편입니다' : '피지 분비가 균형 잡혀 있습니다',
    hyd: (s) => s < 40 ? '수분 보충이 시급합니다' : s > 70 ? '수분도가 충분합니다' : '수분 보충이 필요합니다',
    bar: (s) => s < 40 ? '피부 장벽이 손상되었습니다' : s > 70 ? '피부 장벽이 건강합니다' : '장벽 강화가 도움이 됩니다',
    sen: (s) => s > 70 ? '민감도가 높으니 자극을 줄이세요' : s < 30 ? '피부가 매우 안정적입니다' : '중간 수준의 민감도입니다',
    acne: (s) => s > 60 ? '트러블 관리가 필요합니다' : s < 20 ? '트러블이 거의 없습니다' : '가벼운 트러블이 있습니다',
    pigment: (s) => s > 60 ? '색소 침착 케어가 필요합니다' : s < 20 ? '피부 톤이 균일합니다' : '약간의 색소 불균형이 있습니다',
    texture: (s) => s > 60 ? '모공과 피부결 개선이 필요합니다' : s < 20 ? '피부결이 매우 매끄럽습니다' : '피부결이 양호합니다',
    aging: (s) => s > 60 ? '노화 방지 케어가 필요합니다' : s < 20 ? '노화 징후가 거의 없습니다' : '약간의 노화 징후가 있습니다',
    ox: (s) => s > 60 ? '피부 광채 회복이 필요합니다' : s < 20 ? '피부에 광채가 넘칩니다' : '피부 광채가 보통 수준입니다',
    makeup_stability: (s) => s > 70 ? '화장 지속력이 우수합니다' : s < 40 ? '화장 유지가 어렵습니다' : '화장 지속력이 보통입니다',
  };
  if (lang === 'ko' && ko[key]) return ko[key](score);
  // Simplified EN/DE fallbacks
  const isGood = ['hyd', 'bar', 'makeup_stability'].includes(key);
  const level = isGood
    ? (score > 70 ? 'high' : score < 40 ? 'low' : 'mid')
    : (score < 30 ? 'high' : score > 60 ? 'low' : 'mid');
  if (lang === 'de') {
    return level === 'high' ? 'Sehr gut' : level === 'low' ? 'Verbesserungsbedarf' : 'Im Normalbereich';
  }
  return level === 'high' ? 'Very good' : level === 'low' ? 'Needs improvement' : 'Within normal range';
}

// Clinical Elegance palette — no raw green/yellow/red
function getBarColor(key: string, score: number): string {
  const isGood = ['hyd', 'bar', 'makeup_stability'].includes(key);
  const health = isGood ? score : 100 - score;
  if (health >= 70) return '#4ECDC4'; // mint (excellent)
  if (health >= 40) return '#E8A87C'; // muted coral (attention)
  return '#CF6679'; // soft rose (critical)
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ScoreRing({ score, textColor, trackColor }: { score: number; textColor: string; trackColor: string }) {
  const r = 40, cx = 52, cy = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#4ECDC4' : score >= 65 ? '#7C9CBF' : score >= 45 ? '#E8A87C' : '#CF6679';

  return (
    <svg width="104" height="104" viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth="6" />
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '22px', fontFamily: 'var(--font-numeric)', fontWeight: 700, fill: textColor }}
      >
        {score}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalysisResults({
  scores,
  capturedImage,
  analysisId,
  onRetake,
}: AnalysisResultsProps) {
  const navigate = useNavigate();
  const { language } = useI18nStore();
  const { isLoggedIn } = useAuthStore();
  const resetAnalysis = useSkinAnalysisStore((s) => s.resetAnalysis);
  const lifestyleAnswers = useSkinAnalysisStore((s) => s.lifestyleAnswers);
  const hasLifestyle = lifestyleAnswers !== null;
  const setResult = useDiagnosisStore((s) => s.setResult);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const glassTok = glassTokens(isDark);
  const ringTrackColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const overallScore = useMemo(() => getOverallScore(scores), [scores]);
  const summary = useMemo(() => getScoreSummary(overallScore, language), [overallScore, language]);

  const matchedProducts = useMemo(
    () =>
      PRODUCT_RULES.filter((r) => r.triggerCondition(scores))
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3),
    [scores],
  );

  const handleNavigateToLab = () => {
    const axisKeys = Object.keys(scores) as AxisKey[];
    const axisScores = { ...scores } as unknown as AxisScores;
    const axisScoresNormalized = { ...scores } as unknown as AxisScores;
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
      axis_scores_normalized: axisScoresNormalized,
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
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      // ── BUG 3 fix: persist pending analysis + redirect back to analysis page ──
      try {
        sessionStorage.setItem('ssl_pending_analysis', JSON.stringify({
          scores,
          analysisId,
          hasLifestyle,
          timestamp: Date.now(),
        }));
        console.log('[AnalysisResults] Pending analysis saved to sessionStorage');
      } catch (e) {
        console.warn('[AnalysisResults] Failed to save pending analysis:', e);
      }
      navigate('/login?redirect=/skin-analysis');
    }
    // If logged in: already saved during analysis
  };

  const handleRetake = () => {
    resetAnalysis();
    onRetake();
  };

  const stagger = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 + 0.1, duration: 0.4 } }) };

  return (
    <div className="min-h-dvh w-full overflow-y-auto pb-32 transition-colors duration-300" style={{ background: tok.bg, color: tok.text }}>
      <div className="mx-auto max-w-md px-4 pt-8">

        {/* ── SECTION 0: Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.15em', color: '#c9a96e', textTransform: 'uppercase', marginBottom: '6px' }}>
            {language === 'ko' ? 'AI 피부 분석' : language === 'de' ? 'KI-Hautanalyse' : 'AI Skin Analysis'}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: tok.text, fontWeight: 400 }}>
            {language === 'ko' ? '분석 결과' : language === 'de' ? 'Analyseergebnis' : 'Analysis Result'}
          </h1>
        </motion.div>

        {/* ── SECTION 0.5: Precision Badge (only when lifestyle data present) ── */}
        {hasLifestyle && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6 rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(201,169,110,0.06)',
              border: '1px solid rgba(201,169,110,0.25)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span style={{ fontSize: '16px' }}>🔬</span>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: '#c9a96e',
                fontWeight: 500,
              }}>
                {language === 'ko' ? '정밀 분석 완료' : language === 'de' ? 'Pr\u00e4zisionsanalyse abgeschlossen' : 'Precision Analysis Complete'}
              </p>
            </div>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: tok.textTertiary,
              lineHeight: 1.5,
            }}>
              {language === 'ko'
                ? 'AI 피부 사진 + 생활습관 기반 통합 분석 \u00b7 신뢰도 92%'
                : language === 'de'
                  ? 'KI-Foto + Lebensstil-Analyse \u00b7 Zuverl\u00e4ssigkeit 92%'
                  : 'AI Photo + Lifestyle Integrated Analysis \u00b7 Confidence 92%'}
            </p>
          </motion.div>
        )}

        {/* ── SECTION 1: Hero ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-5 mb-8 px-2"
        >
          {/* Face thumbnail */}
          {capturedImage && (
            <div
              className="w-[88px] h-[88px] rounded-full overflow-hidden flex-shrink-0"
              style={{ border: '2px solid rgba(201,169,110,0.4)', transform: 'scaleX(-1)' }}
            >
              <img
                src={`data:image/jpeg;base64,${capturedImage}`}
                alt="captured"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Score ring + summary */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <ScoreRing score={overallScore} textColor={tok.text} trackColor={ringTrackColor} />
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: tok.textSecondary, marginBottom: '4px' }}>
                  {language === 'ko' ? '종합 피부 점수' : language === 'de' ? 'Gesamt-Hautpunktzahl' : 'Overall Skin Score'}
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: tok.text, lineHeight: 1.4 }}>
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 2: Axis Cards ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-6"
        >
          <p className="mb-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: tok.textSecondary, letterSpacing: '0.05em' }}>
            {language === 'ko' ? '축별 상세 분석' : language === 'de' ? 'Detailanalyse je Achse' : 'Axis Breakdown'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(scores) as (keyof SkinAxisScores)[]).map((key, i) => {
              const score = scores[key];
              const label = language === 'ko' ? AXIS_KO_SHORT[key] : language === 'de' ? AXIS_LABELS_DE[key] : AXIS_LABELS[key];
              const barColor = getBarColor(key, score);
              const insight = getAxisInsight(key, score, language);

              return (
                <motion.div
                  key={key}
                  custom={i}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl p-3"
                  style={{ background: tok.bgCard, border: `1px solid ${tok.border}` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: tok.textSecondary }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-numeric)', fontSize: '15px', fontWeight: 700, color: tok.text }}>
                      {score}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="rounded-full overflow-hidden mb-1.5" style={{ height: '3px', background: tok.border }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: i * 0.04 + 0.5, duration: 0.6 }}
                    />
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: tok.textTertiary, lineHeight: 1.3 }}>
                    {insight}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>


        {/* ── SECTION 3: Product Recommendations ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mb-6"
        >
          <p className="mb-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: tok.textSecondary, letterSpacing: '0.05em' }}>
            {language === 'ko' ? '맞춤 추천 제품' : language === 'de' ? 'Empfohlene Produkte' : 'Recommended Products'}
          </p>

          {matchedProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {matchedProducts.map((rule) => (
                <ProductRecommendationCard key={rule.productId} rule={rule} scores={scores} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(78,205,196,0.06)', border: '1px solid rgba(78,205,196,0.2)' }}
            >
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#4ECDC4' }}>
                {getScoreSummary(overallScore, language)}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: tok.textTertiary, marginTop: '6px' }}>
                {language === 'ko' ? '더 정밀한 맞춤 추천이 곧 제공됩니다' : language === 'de' ? 'Weitere personalisierte Empfehlungen folgen in Kürze' : 'More personalized recommendations coming soon'}
              </p>
            </div>
          )}
        </motion.div>

        {/* ── SECTION 6: Action Buttons ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex flex-col gap-3 pb-8"
        >
          <button
            onClick={handleNavigateToLab}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.2) 0%, rgba(183,110,121,0.2) 100%)',
              border: '1px solid rgba(201,169,110,0.4)',
              color: '#c9a96e',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            {language === 'ko' ? '전체 맞춤 루틴 보기' : language === 'de' ? 'Meine Routine ansehen' : 'View My Routine'}
            <ChevronRight size={16} />
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                ...glassTok.button,
                color: tok.textSecondary,
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}
            >
              <RotateCcw size={14} />
              {language === 'ko' ? '다시 분석' : language === 'de' ? 'Erneut analysieren' : 'Retake'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                ...glassTok.button,
                color: isLoggedIn ? tok.textSecondary : '#c9a96e',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}
            >
              <Save size={14} />
              {isLoggedIn
                ? (language === 'ko' ? '저장됨' : language === 'de' ? 'Gespeichert' : 'Saved')
                : (language === 'ko' ? '로그인 후 저장' : language === 'de' ? 'Nach Login speichern' : 'Save after login')
              }
            </button>
          </div>
        </motion.div>

        {/* ── SECTION 5: Feedback (moved to bottom per Master Guide) ─────── */}
        {analysisId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="mb-6"
          >
            <FeedbackWidget analysisId={analysisId} />
          </motion.div>
        )}

      </div>
    </div>
  );
}
