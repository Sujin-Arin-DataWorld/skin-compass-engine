// =================================================
// src/components/product/CompatibilityBadge.tsx
// Match score badge — compact (card overlay) & expanded (detail popup)
// =================================================

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSkinProfileStore } from '@/store/useSkinProfileStore';
import { calculateCompatibilityScore, type CompatibilityResult, type CompatibilityFlag } from '@/lib/compatibility/calculateScore';
import { useI18nStore } from '@/store/i18nStore';
import type { Product } from '@/engine/types';

// ── i18n labels ──────────────────────────────────────────────────────────────

const LABELS = {
  ko: {
    matchScore: '매칭 점수',
    aiMatchAnalysis: 'AI 매칭 분석',
    greatMatch: '좋은 매칭',
    goodMatch: '적합',
    fairMatch: '보통',
    poorMatch: '부적합',
    cta: '피부 분석하고 매칭 확인 →',
    ingredientMatch: '성분 매칭',
    profileMatch: '프로필 매칭',
    safety: '안전성',
    close: '닫기',
    gradeS: '최적 매칭',
    gradeA: '좋은 매칭',
    gradeB: '적합',
    gradeC: '보통',
    gradeD: '부적합',
  },
  en: {
    matchScore: 'Match Score',
    aiMatchAnalysis: 'AI Match Analysis',
    greatMatch: 'Great Match',
    goodMatch: 'Good Match',
    fairMatch: 'Fair Match',
    poorMatch: 'Poor Match',
    cta: 'Analyze skin to check match →',
    ingredientMatch: 'Ingredients',
    profileMatch: 'Profile Match',
    safety: 'Safety',
    close: 'Close',
    gradeS: 'Perfect Match',
    gradeA: 'Great Match',
    gradeB: 'Good Match',
    gradeC: 'Fair Match',
    gradeD: 'Poor Match',
  },
  de: {
    matchScore: 'Match-Score',
    aiMatchAnalysis: 'AI Match-Analyse',
    greatMatch: 'Gutes Match',
    goodMatch: 'Gutes Match',
    fairMatch: 'Mittelmäßig',
    poorMatch: 'Ungeeignet',
    cta: 'Haut analysieren für Match →',
    ingredientMatch: 'Inhaltsstoffe',
    profileMatch: 'Profil-Match',
    safety: 'Sicherheit',
    close: 'Schließen',
    gradeS: 'Perfektes Match',
    gradeA: 'Gutes Match',
    gradeB: 'Passendes Match',
    gradeC: 'Mittelmäßig',
    gradeD: 'Ungeeignet',
  },
} as const;

// ── Grade system ─────────────────────────────────────────────────────────────

type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

const GRADE_COLORS: Record<Grade, string> = {
  S: '#8a9a7b', // sage-green
  A: '#8a9a7b', // sage-green
  B: '#c4a265', // gold
  C: '#9a9590', // warm-gray
  D: '#9a9590', // warm-gray
};

const GRADE_BG: Record<Grade, string> = {
  S: 'rgba(138,154,123,0.15)',
  A: 'rgba(138,154,123,0.12)',
  B: 'rgba(196,162,101,0.12)',
  C: 'rgba(154,149,144,0.10)',
  D: 'rgba(154,149,144,0.08)',
};

function getGrade(score: number): Grade {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function getGradeLabel(grade: Grade, lang: keyof typeof LABELS): string {
  const key = `grade${grade}` as keyof typeof LABELS.ko;
  return LABELS[lang][key];
}

// ── Props ────────────────────────────────────────────────────────────────────

interface CompatibilityBadgeProps {
  product: Product;
  variant: 'compact' | 'expanded';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CompatibilityBadge({ product, variant }: CompatibilityBadgeProps) {
  const { activeProfile } = useSkinProfileStore();
  const { language } = useI18nStore();
  const navigate = useNavigate();
  const t = LABELS[language] ?? LABELS.en;

  // Compute score only if profile exists
  const result = useMemo<CompatibilityResult | null>(() => {
    if (!activeProfile) return null;
    return calculateCompatibilityScore(activeProfile, product);
  }, [activeProfile, product]);

  // ── No profile → CTA ──
  if (!activeProfile) {
    if (variant === 'compact') return null; // no badge for guests in compact mode

    return (
      <button
        onClick={() => navigate('/skin-analysis')}
        className="w-full rounded-2xl px-4 py-3 flex items-center gap-2 transition-all hover:scale-[1.01]"
        style={{
          background: 'rgba(138,154,123,0.08)',
          border: '1px solid rgba(138,154,123,0.2)',
        }}
      >
        <Sparkles size={16} color="#8a9a7b" />
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            color: '#8a9a7b',
          }}
        >
          {t.cta}
        </span>
      </button>
    );
  }

  if (!result) return null;

  const grade = getGrade(result.total);
  const gradeColor = GRADE_COLORS[grade];

  // ── COMPACT variant: 36px circle badge ──
  if (variant === 'compact') {
    return <CompactBadge score={result.total} grade={grade} gradeColor={gradeColor} />;
  }

  // ── EXPANDED variant: glassmorphism detail card ──
  return (
    <ExpandedBadge
      result={result}
      grade={grade}
      gradeColor={gradeColor}
      gradeLabel={getGradeLabel(grade, language)}
      t={t}
      language={language}
    />
  );
}

// ── Compact Badge (36px circle) ──────────────────────────────────────────────

function CompactBadge({
  score,
  grade,
  gradeColor,
}: {
  score: number;
  grade: Grade;
  gradeColor: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: GRADE_BG[grade],
        border: `1.5px solid ${gradeColor}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 2px 8px ${gradeColor}20`,
      }}
      title={`Match Score: ${score}`}
    >
      <span
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '13px',
          fontWeight: 500,
          color: gradeColor,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </motion.div>
  );
}

// ── Expanded Badge (glassmorphism detail card) ───────────────────────────────

function ExpandedBadge({
  result,
  grade,
  gradeColor,
  gradeLabel,
  t,
  language,
}: {
  result: CompatibilityResult;
  grade: Grade;
  gradeColor: string;
  gradeLabel: string;
  t: typeof LABELS[keyof typeof LABELS];
  language: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Summary row — clickable to expand */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-all hover:scale-[1.005]"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Score circle */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: GRADE_BG[grade],
              border: `2px solid ${gradeColor}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '17px',
                fontWeight: 500,
                color: gradeColor,
              }}
            >
              {result.total}
            </span>
          </div>

          <div className="text-left">
            <p
              style={{
                fontFamily: language === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
                fontSize: '14px',
                color: gradeColor,
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {gradeLabel}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                marginTop: 2,
              }}
            >
              {t.aiMatchAnalysis}
            </p>
          </div>
        </div>

        <ChevronRight
          size={16}
          color="rgba(255,255,255,0.3)"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Expandable detail panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="rounded-2xl mt-2 p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Score breakdown bars */}
              <div className="space-y-3 mb-4">
                <ScoreBar label={t.ingredientMatch} score={result.ingredientScore} color="#8a9a7b" />
                <ScoreBar label={t.profileMatch} score={result.profileScore} color="#c4a265" />
                <ScoreBar label={t.safety} score={result.safetyScore} color={result.safetyScore >= 70 ? '#8a9a7b' : '#e87961'} />
              </div>

              {/* Flags */}
              {result.flags.length > 0 && (
                <div className="space-y-2">
                  {result.flags.map((flag, i) => (
                    <FlagRow key={i} flag={flag} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Score breakdown bar ──────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '12px',
            color,
          }}
        >
          {score}
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.06)',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="rounded-full h-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ── Flag row ─────────────────────────────────────────────────────────────────

function FlagRow({ flag }: { flag: CompatibilityFlag }) {
  const iconMap = {
    positive: <CheckCircle size={14} color="#8a9a7b" />,
    caution: <AlertTriangle size={14} color="#c4a265" />,
    negative: <Shield size={14} color="#e87961" />,
  };

  const textColorMap = {
    positive: 'rgba(138,154,123,0.9)',
    caution: 'rgba(196,162,101,0.9)',
    negative: 'rgba(232,121,97,0.9)',
  };

  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex-shrink-0">{iconMap[flag.type]}</div>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: textColorMap[flag.type],
          lineHeight: 1.4,
        }}
      >
        {flag.message}
      </span>
    </div>
  );
}
