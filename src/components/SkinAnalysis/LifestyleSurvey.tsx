// LifestyleSurvey — Dark-themed one-question-at-a-time stepper
// Shown before camera capture in the AI Skin Analysis flow.
// Matches the existing SkinAnalysisPage dark aesthetic.

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Microscope } from 'lucide-react';
import { useTheme } from 'next-themes';
import { FOUNDATION_QUESTIONS, fqText, fqHint, optLabel } from '@/data/foundationQuestions';
import { CityClimateInput } from '@/components/diagnosis/CityClimateInput';
import { useI18nStore } from '@/store/i18nStore';
import { tokens, ctaTokens, glassTokens } from '@/lib/designTokens';

type Lang = 'en' | 'de' | 'ko';

interface LifestyleSurveyProps {
  onComplete: (answers: Record<string, number | string>) => void;
  onClose: () => void;
}

const TOTAL_STEPS = FOUNDATION_QUESTIONS.length + 1; // +1 for climate

// ── Multilingual copy ────────────────────────────────────────────────────────
const INTRO_COPY = {
  badge: { en: 'Precision Analysis Mode', de: 'Präzisions-Analyse-Modus', ko: '정밀 분석 모드' },
  title: {
    en: 'Your Lifestyle Shapes Your Skin',
    de: 'Ihr Lebensstil formt Ihre Haut',
    ko: '생활 습관이 피부를 결정합니다',
  },
  desc: {
    en: 'Answering these questions lets our AI analyze your skin photo with clinical-grade precision — not just what it sees, but why.',
    de: 'Ihre Antworten ermöglichen unserer KI eine wissenschaftlich präzise Analyse — nicht nur, was sie sieht, sondern warum.',
    ko: 'AI가 피부 사진을 더 정확하게 분석할 수 있도록, 먼저 생활 습관을 파악합니다.',
  },
  start: { en: 'Start →', de: 'Start →', ko: '시작 →' },
  climate: { en: 'Your climate', de: 'Ihr Klima', ko: '거주 기후' },
  back: { en: '← Back', de: '← Zurück', ko: '← 이전' },
} as const;

const ICONS = ['💤', '💧', '🧠', '🌍', '🏃'];

function tx(obj: Record<string, string>, lang: Lang): string {
  return obj[lang] ?? obj.en;
}

export default function LifestyleSurvey({ onComplete, onClose }: LifestyleSurveyProps) {
  const { language } = useI18nStore();
  const lang = language as Lang;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const glassTok = glassTokens(isDark);

  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isClimateStep = currentIndex === FOUNDATION_QUESTIONS.length;
  const q = isClimateStep ? null : FOUNDATION_QUESTIONS[currentIndex];

  const handleAnswer = useCallback((id: string, value: number | string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));

    // Auto-advance after selection
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (currentIndex < TOTAL_STEPS - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        // Last question — complete
        const final = { ...answers, [id]: value };
        onComplete(final);
      }
    }, 350);
  }, [currentIndex, answers, onComplete]);

  const handleClimateChange = useCallback((climateType: string) => {
    setAnswers((prev) => ({ ...prev, climate: climateType }));
  }, []);

  const handleClimateContinue = useCallback(() => {
    if (answers.climate) {
      onComplete(answers);
    }
  }, [answers, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      setShowIntro(true);
    }
  }, [currentIndex]);

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (showIntro) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ background: tok.bg }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rounded-full p-2.5 z-10"
          style={{
            ...glassTok.button,
            color: tok.text,
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-sm w-full"
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: tok.accentBg,
              border: `1px solid ${tok.accentBorder}`,
            }}
          >
            <Microscope size={32} color={tok.accent} />
          </div>

          {/* Badge */}
          <p
            className="mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              color: tok.accent,
              textTransform: 'uppercase',
            }}
          >
            {tx(INTRO_COPY.badge, lang)}
          </p>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              color: tok.text,
              fontWeight: 400,
              marginBottom: '12px',
              lineHeight: 1.35,
            }}
          >
            {tx(INTRO_COPY.title, lang)}
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: tok.textSecondary,
              marginBottom: '28px',
              lineHeight: 1.7,
            }}
          >
            {tx(INTRO_COPY.desc, lang)}
          </p>

          {/* Icon row */}
          <div className="flex justify-center gap-4 mb-8">
            {ICONS.map((icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: tok.accentBg,
                  border: `1px solid ${tok.border}`,
                }}
              >
                {icon}
              </motion.div>
            ))}
          </div>

          {/* Start button */}
          <button
            onClick={() => setShowIntro(false)}
            className="w-full rounded-2xl py-4 text-center transition-all active:scale-[0.98]"
            style={{
              background: ctaTok.background,
              border: 'none',
              color: ctaTok.color,
              boxShadow: ctaTok.boxShadow,
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            {tx(INTRO_COPY.start, lang)}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Question stepper ──────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: tok.bg }}
    >
      {/* Top bar */}
      <div className="px-5 pt-5 pb-3">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{
                background: i <= currentIndex
                  ? tok.accent
                  : tok.border,
              }}
            />
          ))}
        </div>

        {/* Counter + Back */}
        <div className="flex items-center justify-between">
          <button
            onClick={currentIndex === 0 ? () => setShowIntro(true) : handleBack}
            className="text-xs transition-colors"
            style={{
              color: tok.textTertiary,
              fontFamily: 'var(--font-sans)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            {tx(INTRO_COPY.back, lang)}
          </button>
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: tok.textTertiary,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {currentIndex + 1} / {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-16 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-md mx-auto w-full"
          >
            {isClimateStep ? (
              /* Climate step */
              <div>
                <p className="text-2xl mb-3" style={{ lineHeight: 1 }}>🌍</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    color: tok.text,
                    fontWeight: 400,
                    marginBottom: '16px',
                  }}
                >
                  {tx(INTRO_COPY.climate, lang)}
                </h2>
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: tok.accentBg,
                    border: `1px solid ${tok.border}`,
                  }}
                >
                  <CityClimateInput
                    lang={lang}
                    onLegacyChange={handleClimateChange}
                  />
                </div>
                {/* Continue button for climate */}
                <button
                  onClick={handleClimateContinue}
                  disabled={!answers.climate}
                  className="w-full mt-6 rounded-2xl py-4 text-center transition-all active:scale-[0.98]"
                  style={{
                    background: answers.climate
                      ? ctaTok.background
                      : tok.accentBg,
                    border: answers.climate
                      ? 'none'
                      : `1px solid ${tok.border}`,
                    color: answers.climate ? ctaTok.color : tok.textTertiary,
                    boxShadow: answers.climate ? ctaTok.boxShadow : 'none',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '16px',
                    fontWeight: 500,
                    cursor: answers.climate ? 'pointer' : 'default',
                  }}
                >
                  {lang === 'ko' ? '카메라 촬영으로 →' : lang === 'de' ? 'Weiter zur Kamera →' : 'Continue to Camera →'}
                </button>
              </div>
            ) : q ? (
              /* Foundation question */
              <div>
                <p className="text-2xl mb-3" style={{ lineHeight: 1 }}>{q.icon}</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    color: tok.text,
                    fontWeight: 400,
                    marginBottom: '6px',
                    lineHeight: 1.4,
                  }}
                >
                  {fqText(q, lang)}
                </h2>
                {fqHint(q, lang) && (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      color: tok.textTertiary,
                      marginBottom: '20px',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {fqHint(q, lang)}
                  </p>
                )}
                {!fqHint(q, lang) && <div className="mb-5" />}

                <div className="flex flex-col gap-3">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(q.id, opt.value)}
                        className="text-left rounded-xl px-5 py-4 transition-all"
                        style={{
                          background: isSelected
                            ? tok.accentBg
                            : 'transparent',
                          border: isSelected
                            ? `1.5px solid ${tok.accentBorder}`
                            : `1px solid ${tok.border}`,
                          color: isSelected
                            ? tok.accent
                            : tok.textSecondary,
                          fontFamily: 'var(--font-sans)',
                          fontSize: '15px',
                          fontWeight: isSelected ? 500 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {optLabel(opt, lang)}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
