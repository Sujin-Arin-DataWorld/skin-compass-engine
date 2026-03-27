// Prompt 3 — PART C: SkinAnalysisPage
// State machine: idle → camera → analyzing → result → error

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Camera, AlertCircle, RefreshCw, Sun, CheckCircle2 } from 'lucide-react';
import LiveCamera from '@/components/SkinAnalysis/LiveCamera';
import LifestyleSurvey from '@/components/SkinAnalysis/LifestyleSurvey';
import AnalysisLoading from '@/components/SkinAnalysis/AnalysisLoading';
import AnalysisResults from '@/components/SkinAnalysis/AnalysisResults';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useSkinProfileStore } from '@/store/useSkinProfileStore';
import { analyzeSkinImage } from '@/services/skinAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { useI18nStore, translations } from '@/store/i18nStore';
import { safeSessionStorage } from '@/utils/safeStorage';
import { tokens, ctaTokens, glassTokens } from '@/lib/designTokens';
import type { SkinAxisScores as ProfileAxisScores, SkinType, SkinConcern } from '@/types/skinProfile';
import type { SkinAxisScores } from '@/types/skinAnalysis';

// ── Multilingual meta for /skin-analysis ────────────────────────────────────
// ── Camera soft prompt i18n ──────────────────────────────────────────────────
const CAMERA_PROMPT = {
  ko: {
    title: '카메라 준비',
    heading: '밝은 곳에서\n얼굴을 비춰주세요',
    tips: [
      '자연광이 있는 밝은 공간에서 촬영하세요',
      '메이크업 없는 맨얼굴이 가장 정확합니다',
      '정면을 바라보고 얼굴 전체가 보이게 해주세요',
    ],
    cta: '카메라 시작',
    disclaimer: '촬영 후 사진은 분석 직후 삭제됩니다.',
  },
  en: {
    title: 'Camera Ready',
    heading: 'Find a bright spot\nand face the camera',
    tips: [
      'Use a well-lit area with natural light',
      'Bare skin without makeup gives the best results',
      'Look straight ahead with your full face visible',
    ],
    cta: 'Start Camera',
    disclaimer: 'Your photo is deleted immediately after analysis.',
  },
  de: {
    title: 'Kamera bereit',
    heading: 'Suchen Sie einen\nhellen Ort',
    tips: [
      'Verwenden Sie einen gut beleuchteten Bereich mit natürlichem Licht',
      'Ungeschminkte Haut liefert die besten Ergebnisse',
      'Schauen Sie geradeaus, das gesamte Gesicht sichtbar',
    ],
    cta: 'Kamera starten',
    disclaimer: 'Ihr Foto wird sofort nach der Analyse gelöscht.',
  },
} as const;

const SKIN_ANALYSIS_META = {
  ko: {
    title: 'AI 피부 분석 | SkinStrategyLab',
    description: '60초 AI 피부 진단으로 10가지 축의 피부 상태를 분석하고 맞춤 스킨케어를 추천받으세요.',
  },
  en: {
    title: 'AI Skin Analysis | SkinStrategyLab',
    description: 'Analyze your skin across 10 axes with a 60-second AI diagnosis and get personalized skincare recommendations.',
  },
  de: {
    title: 'KI-Hautanalyse | SkinStrategyLab',
    description: 'Analysieren Sie Ihre Haut in 10 Achsen mit einer 60-Sekunden-KI-Diagnose und erhalten Sie personalisierte Hautpflege-Empfehlungen.',
  },
} as const;

// ── Derive skin type from analysis scores ─────────────────────────────────────
function deriveSkinType(scores: SkinAxisScores): SkinType {
  if (scores.sen >= 65) return 'sensitive';
  if (scores.seb >= 65 && scores.hyd >= 50) return 'oily';
  if (scores.hyd <= 35 && scores.seb <= 35) return 'dry';
  if (scores.seb >= 50 && scores.hyd <= 45) return 'combination';
  return 'normal';
}

// ── Derive primary concerns from high scores ─────────────────────────────────
function derivePrimaryConcerns(scores: SkinAxisScores): SkinConcern[] {
  const concerns: SkinConcern[] = [];
  if (scores.acne >= 50) concerns.push('acne');
  if (scores.hyd <= 40) concerns.push('dehydration');
  if (scores.pigment >= 50) concerns.push('pigmentation');
  if (scores.sen >= 55) concerns.push('sensitivity');
  if (scores.aging >= 50) concerns.push('aging');
  if (scores.bar >= 55) concerns.push('barrier_damage');
  if (scores.seb >= 60) concerns.push('excess_sebum');
  if (scores.texture >= 55) concerns.push('texture');
  if (scores.ox >= 55) concerns.push('oxidation');
  return concerns.slice(0, 5); // cap at top 5
}

export default function SkinAnalysisPage() {
  const {
    currentStep,
    capturedImageBase64,
    scores,
    analysisId,
    errorMessage,
    lifestyleAnswers,
    setStep,
    setCapturedImage,
    setLifestyleAnswers,
    setAnalysisResult,
    setError,
    resetAnalysis,
  } = useSkinAnalysisStore();

  const { language } = useI18nStore();
  const t = translations[language as keyof typeof translations] || translations.en;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const glassTok = glassTokens(isDark);

  // ── Language auto-detect removed ──────────────────────────────────────────
  // Language is managed by the global i18nStore.
  // The previous hostname-based override was breaking user language preferences.

  // ── Restore pending analysis after login redirect ─────────────────────────
  useEffect(() => {
    let raw: string | null = null;
    try { raw = safeSessionStorage.getItem('ssl_pending_analysis'); } catch { return; }
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as {
        scores: SkinAxisScores;
        analysisId: string | null;
        hasLifestyle: boolean;
        timestamp: number;
      };
      setAnalysisResult(pending.scores, 'ai_photo_analysis', pending.analysisId);
      safeSessionStorage.removeItem('ssl_pending_analysis');
      // Non-blocking DB save
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const profileScores: ProfileAxisScores = {
            seb: pending.scores.seb,
            hyd: pending.scores.hyd,
            bar: pending.scores.bar,
            sen: pending.scores.sen,
            acne: pending.scores.acne,
            pigment: pending.scores.pigment,
            texture: pending.scores.texture,
            aging: pending.scores.aging,
            ox: pending.scores.ox,
            makeup_stability: pending.scores.makeup_stability,
          };
          await useSkinProfileStore.getState().saveAnalysisResult({
            userId: user.id,
            scores: profileScores,
            skinType: deriveSkinType(pending.scores),
            primaryConcerns: derivePrimaryConcerns(pending.scores),
            analysisMethod: 'camera',
            confidenceScore: pending.hasLifestyle ? 0.92 : 0.75,
          });
        } catch (e) {
          console.warn('[SkinAnalysis] Post-login save failed (non-fatal):', e);
        }
      })();
    } catch (e) {
      console.warn('[SkinAnalysis] Failed to restore pending analysis:', e);
    }
  }, [setAnalysisResult]);

  // ── Dynamic Meta Tags for Social Sharing ──────────────────────────────────
  useEffect(() => {
    const prevTitle = document.title;
    const meta = SKIN_ANALYSIS_META[language] ?? SKIN_ANALYSIS_META.en;

    document.title = meta.title;

    // Update <meta name="description">
    const descEl = document.querySelector('meta[name="description"]');
    const prevDesc = descEl?.getAttribute('content') ?? '';
    if (descEl) descEl.setAttribute('content', meta.description);

    // Update OG meta tags
    const updateMeta = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta("og:title", meta.title);
    updateMeta("og:description", meta.description);
    updateMeta("og:url", "https://www.skinstrategylab.de/skin-analysis");

    return () => {
      document.title = prevTitle;
      if (descEl) descEl.setAttribute('content', prevDesc);
    };
  }, [language]);

  // ── Camera captured an image ──────────────────────────────────────────────
  const handleCapture = useCallback(
    async (base64: string) => {
      setCapturedImage(base64);
      setStep('analyzing');

      try {
        const response = await analyzeSkinImage(base64, lifestyleAnswers ?? undefined, language as 'ko' | 'en' | 'de');
        const hasLifestyle = lifestyleAnswers !== null;
        setAnalysisResult(
          response.scores,
          'ai_photo_analysis',
          response.analysis_id,
        );

        // ── Persist to user_skin_profiles if logged in (non-blocking) ──────
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Guest mode — skip DB save

            const profileScores: ProfileAxisScores = {
              seb: response.scores.seb,
              hyd: response.scores.hyd,
              bar: response.scores.bar,
              sen: response.scores.sen,
              acne: response.scores.acne,
              pigment: response.scores.pigment,
              texture: response.scores.texture,
              aging: response.scores.aging,
              ox: response.scores.ox,
              makeup_stability: response.scores.makeup_stability,
            };

            const saved = await useSkinProfileStore.getState().saveAnalysisResult({
              userId: user.id,
              scores: profileScores,
              skinType: deriveSkinType(response.scores),
              primaryConcerns: derivePrimaryConcerns(response.scores),
              analysisMethod: 'camera',
              confidenceScore: hasLifestyle ? 0.92 : 0.75,
            });

            if (saved) {
              console.log('[SkinAnalysis] Profile persisted:', saved.id);
            }
          } catch (e) {
            console.warn('[SkinAnalysis] Profile save failed (non-fatal):', e);
          }
        })();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.camera.analysisError);
      }
    },
    [setCapturedImage, setStep, setAnalysisResult, setError, t, lifestyleAnswers],
  );

  const handleClose = useCallback(() => {
    resetAnalysis();
  }, [resetAnalysis]);

  const handleRetake = useCallback(() => {
    resetAnalysis();
    setStep('camera');
  }, [resetAnalysis, setStep]);

  // ── Idle screen ───────────────────────────────────────────────────────────
  if (currentStep === 'idle') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 pb-24 transition-colors duration-300"
        style={{ background: tok.bg, color: tok.text }}
      >
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
            <Camera size={32} color={tok.accent} />
          </div>

          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: tok.accent,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {t.skinAnalysis.badge}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 400,
              color: tok.text,
              marginBottom: '12px',
              lineHeight: 1.3,
            }}
          >
            {t.skinAnalysis.heading}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: tok.textSecondary,
              marginBottom: '36px',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}
          >
            {t.skinAnalysis.subheading}
          </p>

          {/* Axis chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {t.skinAnalysis.axisLabels.map((label: string) => (
              <span
                key={label}
                className="rounded-full px-3 py-1"
                style={{
                  background: tok.accentBg,
                  border: `1px solid ${tok.border}`,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: tok.textTertiary,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={() => setStep('survey')}
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
            {t.skinAnalysis.startCamera}
          </button>

          <p
            className="mt-4"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: tok.textTertiary,
            }}
          >
            {t.skinAnalysis.privacyNote}
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (currentStep === 'error') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 pb-24 transition-colors duration-300"
        style={{ background: tok.bg, color: tok.text }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm w-full"
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}
          >
            <AlertCircle size={28} color="#f87171" />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: tok.text,
              marginBottom: '8px',
            }}
          >
            {t.camera.analysisFailed}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: tok.textSecondary,
              marginBottom: '28px',
            }}
          >
            {errorMessage}
          </p>
          <button
            onClick={handleRetake}
            className="w-full rounded-2xl py-3 flex items-center justify-center gap-2"
            style={{
              ...glassTok.button,
              color: tok.textSecondary,
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
            }}
          >
            <RefreshCw size={16} />
            {t.camera.retry}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* Survey */}
      {currentStep === 'survey' && (
        <motion.div key="survey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LifestyleSurvey
            onComplete={(answers) => {
              setLifestyleAnswers(answers);
              setStep('camera-prompt');
            }}
            onClose={handleClose}
          />
        </motion.div>
      )}

      {/* Camera Soft Prompt */}
      {currentStep === 'camera-prompt' && (
        <motion.div
          key="camera-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {(() => {
            const cp = CAMERA_PROMPT[language as keyof typeof CAMERA_PROMPT] ?? CAMERA_PROMPT.en;
            return (
              <div
                className="min-h-dvh flex flex-col items-center justify-center px-6 pb-24 transition-colors duration-300"
                style={{ background: tok.bg }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center max-w-sm w-full"
                >
                  {/* Sun icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${tok.accentBg}, rgba(255,200,50,0.08))`,
                      border: `1px solid ${tok.accentBorder}`,
                    }}
                  >
                    <Sun size={32} color="#E8A838" />
                  </motion.div>

                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '11px',
                      letterSpacing: '0.15em',
                      color: tok.accent,
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    {cp.title}
                  </p>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '26px',
                      fontWeight: 400,
                      color: tok.text,
                      marginBottom: '28px',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {cp.heading}
                  </h1>

                  {/* Tips */}
                  <div className="text-left space-y-3 mb-10">
                    {cp.tips.map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2
                          size={18}
                          className="shrink-0 mt-0.5"
                          style={{ color: tok.accent }}
                          strokeWidth={2}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '14px',
                            color: tok.textSecondary,
                            lineHeight: 1.5,
                          }}
                        >
                          {tip}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA — pre-requests camera permission while user sees friendly UI */}
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    onClick={async () => {
                      try {
                        // Request camera permission now — browser popup appears
                        // over this friendly prompt screen, NOT a black camera view
                        const stream = await navigator.mediaDevices.getUserMedia({
                          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                        });
                        // Permission granted — stop the preview stream immediately
                        // (LiveCamera will create its own stream)
                        stream.getTracks().forEach((t) => t.stop());
                        // Advance to camera step — getUserMedia will succeed instantly
                        // since permission is now cached by the browser
                        setStep('camera');
                      } catch {
                        // Permission denied or no camera — go to error
                        setError(t.camera.permissionNeeded);
                      }
                    }}
                    className="w-full rounded-2xl py-4 text-center transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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
                    <Camera size={18} strokeWidth={2} />
                    {cp.cta}
                  </motion.button>

                  <p
                    className="mt-4"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: tok.textTertiary,
                    }}
                  >
                    {cp.disclaimer}
                  </p>
                </motion.div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Camera */}
      {currentStep === 'camera' && (
        <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LiveCamera
            onCapture={(b64, _blob) => handleCapture(b64)}
            onClose={handleClose}
          />
        </motion.div>
      )}

      {/* Analyzing */}
      {currentStep === 'analyzing' && capturedImageBase64 && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AnalysisLoading
            capturedImage={capturedImageBase64}
            onRetake={handleRetake}
          />
        </motion.div>
      )}

      {/* Results */}
      {currentStep === 'result' && scores && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AnalysisResults
            scores={scores}
            capturedImage={capturedImageBase64}
            analysisId={analysisId}
            onRetake={handleRetake}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
