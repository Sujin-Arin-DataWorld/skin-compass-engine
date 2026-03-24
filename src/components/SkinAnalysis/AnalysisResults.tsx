// Prompt 4 (+ Prompt 4 UPDATE) — AI Analysis Results
// Hero + Radar Chart + Axis Cards + Feedback + Product Recommendations

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Save, ChevronRight } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useAuthStore } from '@/store/authStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import FeedbackWidget from './FeedbackWidget';
import ProductRecommendationCard from './ProductRecommendationCard';
import { PRODUCT_RULES, AXIS_KO_SHORT } from '@/data/productRules';
import type { SkinAxisScores } from '@/types/skinAnalysis';
import { RADAR_AXES, AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO } from '@/engine/types';

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

function getScoreSummary(score: number, lang: string): string {
  if (score >= 80) return lang === 'ko' ? '피부 상태가 매우 좋습니다! ✨' : lang === 'de' ? 'Ihr Hautzustand ist ausgezeichnet! ✨' : 'Your skin is in excellent condition! ✨';
  if (score >= 60) return lang === 'ko' ? '전반적으로 양호하지만 개선할 부분이 있어요' : lang === 'de' ? 'Insgesamt gut, aber verbesserungswürdig' : 'Overall good, but some areas need attention';
  if (score >= 40) return lang === 'ko' ? '관리가 필요한 부분이 있습니다' : lang === 'de' ? 'Einige Bereiche benötigen Pflege' : 'Some areas need care';
  return lang === 'ko' ? '집중 케어가 필요합니다' : lang === 'de' ? 'Intensive Pflege erforderlich' : 'Intensive care needed';
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

function getBarColor(key: string, score: number): string {
  const isGood = ['hyd', 'bar', 'makeup_stability'].includes(key);
  const health = isGood ? score : 100 - score;
  if (health >= 70) return '#4ade80'; // green
  if (health >= 40) return '#facc15'; // yellow
  return '#f87171'; // red
}

// ── Inline SVG Radar Chart ────────────────────────────────────────────────────
function AIRadarChart({ scores, lang }: { scores: SkinAxisScores; lang: string }) {
  const labels = lang === 'ko' ? AXIS_LABELS_KO : lang === 'de' ? AXIS_LABELS_DE : AXIS_LABELS;
  const n = RADAR_AXES.length;
  const VIEWBOX = 340, CENTER = VIEWBOX / 2, RADIUS = 100;

  // For AI scores: show raw values (some axes high=good, some high=bad)
  // We scale by health direction for visual display
  const points = RADAR_AXES.map((key, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const raw = scores[key as keyof SkinAxisScores] ?? 50;
    const health = toHealthScore(key, raw);
    const MIN = 0.15, MAX = 0.95;
    const r = (MIN + (health / 100) * (MAX - MIN)) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  });
  const poly = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="mx-auto max-w-[300px]">
        {[0.25, 0.5, 0.75, 0.95].map((r) => (
          <polygon
            key={r}
            points={Array.from({ length: n }, (_, i) => {
              const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
              const rad = r * RADIUS;
              return `${CENTER + rad * Math.cos(angle)},${CENTER + rad * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.5"
          />
        ))}
        {RADAR_AXES.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const end = { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
          return <line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />;
        })}
        <motion.polygon
          points={poly}
          fill="rgba(201,169,110,0.15)"
          stroke="#c9a96e"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#c9a96e" opacity={0.8} />
        ))}
        {RADAR_AXES.map((key, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = RADIUS + 28;
          return (
            <text
              key={key}
              x={CENTER + r * Math.cos(angle)}
              y={CENTER + r * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fill: 'rgba(255,255,255,0.7)' }}
            >
              {labels[key as keyof typeof labels]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 40, cx = 52, cy = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171';

  return (
    <svg width="104" height="104" viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
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
        style={{ fontSize: '22px', fontFamily: 'var(--font-numeric)', fontWeight: 700, fill: '#fff' }}
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
    navigate('/results?slide=2');
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      navigate('/login');
    }
    // If logged in: already saved during analysis
  };

  const handleRetake = () => {
    resetAnalysis();
    onRetake();
  };

  const stagger = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 + 0.1, duration: 0.4 } }) };

  return (
    <div
      className="min-h-dvh w-full overflow-y-auto pb-24"
      style={{ background: 'linear-gradient(160deg, #0d0d12 0%, #1a1520 100%)' }}
    >
      <div className="mx-auto max-w-md px-4 pt-8">

        {/* ── SECTION 0: Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.15em', color: '#c9a96e', textTransform: 'uppercase', marginBottom: '6px' }}>
            AI Skin Analysis
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#fff', fontWeight: 400 }}>
            {language === 'ko' ? '분석 결과' : language === 'de' ? 'Analyseergebnis' : 'Analysis Result'}
          </h1>
        </motion.div>

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
              <ScoreRing score={overallScore} />
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                  {language === 'ko' ? '종합 피부 점수' : language === 'de' ? 'Gesamt-Hautpunktzahl' : 'Overall Skin Score'}
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 2: Radar Chart ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-3xl p-4 mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-center mb-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            {language === 'ko' ? '10축 피부 분석' : language === 'de' ? '10-Achsen-Hautanalyse' : '10-Axis Skin Analysis'}
          </p>
          <AIRadarChart scores={scores} lang={language} />
        </motion.div>

        {/* ── SECTION 3: Axis Cards ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-6"
        >
          <p className="mb-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
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
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-numeric)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                      {score}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="rounded-full overflow-hidden mb-1.5" style={{ height: '3px', background: 'rgba(255,255,255,0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: i * 0.04 + 0.5, duration: 0.6 }}
                    />
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>
                    {insight}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 4: Feedback ───────────────────────────────────────────── */}
        {analysisId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mb-6"
          >
            <FeedbackWidget analysisId={analysisId} />
          </motion.div>
        )}

        {/* ── SECTION 5: Product Recommendations ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mb-6"
        >
          <p className="mb-3" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
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
              style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#4ade80' }}>
                피부 상태가 양호합니다! 현재 루틴을 유지하세요.
              </p>
              <button
                onClick={handleNavigateToLab}
                className="mt-2 text-sm"
                style={{ fontFamily: 'var(--font-sans)', color: 'rgba(255,255,255,0.4)' }}
              >
                전체 제품 둘러보기 →
              </button>
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
            전체 맞춤 루틴 보기
            <ChevronRight size={16} />
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}
            >
              <RotateCcw size={14} />
              다시 분석
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: isLoggedIn ? 'rgba(255,255,255,0.7)' : '#c9a96e',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}
            >
              <Save size={14} />
              {isLoggedIn ? '저장됨' : '로그인 후 저장'}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
