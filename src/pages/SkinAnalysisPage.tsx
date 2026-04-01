// Prompt 3 — PART C: SkinAnalysisPage
// State machine: idle → camera → analyzing → result → error

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Camera, AlertCircle, RefreshCw, Sun, CheckCircle2 } from 'lucide-react';
import LiveCamera from '@/components/SkinAnalysis/LiveCamera';
import LifestyleSurvey from '@/components/SkinAnalysis/LifestyleSurvey';
import AnalysisLoading from '@/components/SkinAnalysis/AnalysisLoading';
import AnalysisResults from '@/components/SkinAnalysis/AnalysisResults';
import BiometricConsentModal from '@/components/SkinAnalysis/BiometricConsentModal';
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
    cta: 'AI 분석 시작',
    disclaimer: '촬영 후 사진은 분석 직후 삭제됩니다.',
    stepLabel: 'Step 2/2 · AI 카메라 분석',
  },
  en: {
    title: 'Camera Ready',
    heading: 'Find a bright spot\nand face the camera',
    tips: [
      'Use a well-lit area with natural light',
      'Bare skin without makeup gives the best results',
      'Look straight ahead with your full face visible',
    ],
    cta: 'Start AI Analysis',
    disclaimer: 'Your photo is deleted immediately after analysis.',
    stepLabel: 'Step 2/2 · AI Camera Analysis',
  },
  de: {
    title: 'Kamera bereit',
    heading: 'Suchen Sie einen\nhellen Ort',
    tips: [
      'Verwenden Sie einen gut beleuchteten Bereich mit natürlichem Licht',
      'Ungeschminkte Haut liefert die besten Ergebnisse',
      'Schauen Sie geradeaus, das gesamte Gesicht sichtbar',
    ],
    cta: 'KI-Analyse starten',
    disclaimer: 'Ihr Foto wird sofort nach der Analyse gelöscht.',
    stepLabel: 'Step 2/2 · KI-Kamera-Analyse',
  },
} as const;

const SKIN_ANALYSIS_META = {
  ko: {
    title: 'AI 피부 분석 | SkinStrategyLab',
    description: '60초 AI 피부 분석으로 10가지 축의 피부 상태를 분석하고 맞춤 스킨케어를 추천받으세요.',
  },
  en: {
    title: 'AI Skin Analysis | SkinStrategyLab',
    description: 'Analyze your skin across 10 axes with a 60-second AI analysis and get personalized skincare recommendations.',
  },
  de: {
    title: 'KI-Hautanalyse | SkinStrategyLab',
    description: 'Analysieren Sie Ihre Haut in 10 Dimensionen mit einer 60-Sekunden-KI-Analyse und erhalten Sie personalisierte Hautpflege-Empfehlungen.',
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
  const [showBiometricModal, setShowBiometricModal] = useState(false);
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

  // ── Deduplication guard: prevent double-save on React remount ────────────
  const hasSavedRef = useRef(false);
  useEffect(() => { hasSavedRef.current = false; }, [analysisId]);
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const glassTok = glassTokens(isDark);

  // ── Language auto-detect removed ──────────────────────────────────────────
  // Language is managed by the global i18nStore.
  // The previous hostname-based override was breaking user language preferences.

  // ── Restore pending analysis after login redirect ─────────────────────────
  // Data is stored in localStorage (not sessionStorage) so it survives
  // cross-tab OAuth flows (Firefox Multi-Account Containers, popup blockers).
  useEffect(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem('ssl_pending_analysis'); } catch { return; }
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as {
        scores: SkinAxisScores;
        analysisId: string | null;
        hasLifestyle: boolean;
        timestamp: number;
        capturedImage?: string | null;
        reasons?: Record<string, string> | null;
      };
      // TTL guard: only restore if saved within the last 30 minutes
      if (Date.now() - (pending.timestamp || 0) > 30 * 60 * 1000) {
        localStorage.removeItem('ssl_pending_analysis');
        return;
      }
      setAnalysisResult(pending.scores, 'ai_photo_analysis', pending.analysisId, pending.reasons ?? null);
      if (pending.capturedImage) {
        setCapturedImage(pending.capturedImage);
      }
      localStorage.removeItem('ssl_pending_analysis');

      // Show success toast after restore
      const restoreMsg = language === 'ko' ? '분석 결과가 안전하게 복원되었어요'
        : language === 'de' ? 'Analyseergebnisse sicher wiederhergestellt'
          : 'Analysis results safely restored';

      // Delay slightly so SkinAnalysisPage has rendered the result view
      setTimeout(() => {
        toast.success(restoreMsg, {
          style: {
            background: 'rgba(36, 43, 61, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #333A4D',
            color: '#F0EDE8',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: "'SUIT', sans-serif"
          },
          icon: <CheckCircle2 size={18} color="#C9A96E" fill="#1A1F2E" />,
          duration: 3000,
        });
      }, 600);

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

  // ── Sprint 3.2: Overscroll prevention + browser history for result step ────
  useEffect(() => {
    if (currentStep === 'result') {
      // Prevent iOS bounce scroll from triggering back navigation
      document.body.style.overscrollBehavior = 'none';
      // Push a history entry so the back button returns to idle, not away
      window.history.pushState({ step: 'result' }, '', '/skin-analysis');
      return () => {
        document.body.style.overscrollBehavior = 'auto';
      };
    }
  }, [currentStep]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (currentStep === 'result') {
        // User pressed back from results → reset to idle
        resetAnalysis();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, resetAnalysis]);

  // ── Sprint 3.3: Analyzing timeout (60s) — prevent infinite loading ─────────
  useEffect(() => {
    if (currentStep === 'analyzing') {
      const timeout = setTimeout(() => {
        console.error('[Analysis] Timeout — 60s exceeded');
        setError(
          language === 'ko' ? '분석 시간이 초과되었습니다. 다시 시도해 주세요.'
            : language === 'de' ? 'Analyse-Zeitüberschreitung. Bitte versuchen Sie es erneut.'
              : 'Analysis timed out. Please try again.'
        );
      }, 60_000);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, setError, language]);

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

        // GDPR Art.9: Explicit biometric data cleanup after successful analysis
        useSkinAnalysisStore.getState().clearSensitiveData();

        // ── Persist to user_skin_profiles if logged in (non-blocking) ──────
        (async () => {
          if (hasSavedRef.current) return; // Guard against React remount double-save
          hasSavedRef.current = true;
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
              analysisId: response.analysis_id ?? undefined,
            });

            if (saved) {
              console.log('[SkinAnalysis] Profile persisted:', saved.id);
              const saveMsg = language === 'ko'
                ? '분석 결과가 프로필에 안전하게 저장되었습니다.'
                : language === 'de'
                  ? 'Analyseergebnisse wurden sicher in Ihrem Profil gespeichert.'
                  : 'Analysis results securely saved to your profile.';
              toast.success(saveMsg);
            }
          } catch (e) {
            console.warn('[SkinAnalysis] Profile save failed (non-fatal):', e);
          }
        })();
      } catch (err) {
        // GDPR Art.9: Explicit biometric data cleanup even on failure
        useSkinAnalysisStore.getState().clearSensitiveData();
        setError(err instanceof Error ? err.message : t.camera.analysisError);
      }
    },
    [setCapturedImage, setStep, setAnalysisResult, setError, t, lifestyleAnswers, language],
  );

  const handleClose = useCallback(() => {
    resetAnalysis();
  }, [resetAnalysis]);

  const handleRetake = useCallback(() => {
    resetAnalysis();
    // Clear persisted analysis state to prevent stale 'analyzing' restoration
    try { localStorage.removeItem('skin-analysis-store'); } catch { /* ignore */ }
    setStep('camera');
  }, [resetAnalysis, setStep]);

  // ── Idle screen ───────────────────────────────────────────────────────────
  if (currentStep === 'idle') {
    return (
      <>
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

          {/* 2-Step Flow Preview */}
          <div
            className="w-full mb-8 text-left"
            style={{
              background: tok.accentBg,
              border: `1px solid ${tok.border}`,
              borderRadius: '16px',
              padding: '16px 20px',
            }}
          >
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: tok.accent,
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                1
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, color: tok.text, marginBottom: '2px' }}>
                  {language === 'ko' ? '\uc0dd\ud65c \uc2b5\uad00 \uc124\ubb38' : language === 'de' ? 'Lebensstil-Fragen' : 'Lifestyle Survey'}
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: tok.textSecondary }}>
                  {language === 'ko' ? '8\uac1c \uc9c8\ubb38 \u00b7 \uc57d 30\ucd08' : language === 'de' ? '8 Fragen \u00b7 ca. 30 Sek.' : '8 quick questions \u00b7 approx. 30 sec'}
                </p>
              </div>
            </div>
            {/* Connector */}
            <div
              className="ml-[13px] my-1.5"
              style={{ width: '1px', height: '16px', background: tok.border }}
            />
            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: 'transparent',
                  border: `1.5px solid ${tok.accent}`,
                  color: tok.accent,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                2
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, color: tok.text, marginBottom: '2px' }}>
                  {language === 'ko' ? 'AI \uce74\uba54\ub77c \ubd84\uc11d' : language === 'de' ? 'KI-Kamera-Analyse' : 'AI Camera Analysis'}
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: tok.textSecondary }}>
                  {language === 'ko' ? '\uc0ac\uc9c4 1\uc7a5 \u00b7 \uc57d 30\ucd08' : language === 'de' ? '1 Foto \u00b7 ca. 30 Sek.' : 'Photo 1 shot \u00b7 approx. 30 sec'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const hasConsent = localStorage.getItem('biometric_consent') === 'true';
              if (!hasConsent) {
                setShowBiometricModal(true);
              } else {
                setStep('survey');
              }
            }}
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
              color: tok.textSecondary,
            }}
          >
            {t.skinAnalysis.privacyNote}
          </p>
        </motion.div>
      </div>

      {/* Biometric Consent Modal — renders as overlay on top of idle screen */}
      <BiometricConsentModal
        isOpen={showBiometricModal}
        onAccept={async () => {
          setShowBiometricModal(false);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            stream.getTracks().forEach((track) => track.stop());
            setStep('survey');
          } catch {
            setError(t.camera.permissionNeeded);
          }
        }}
        onCancel={() => setShowBiometricModal(false)}
      />
      </>
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
                  {/* Step indicator */}
                  <div className="mb-6">
                    <div className="flex gap-1.5 mb-2">
                      <div className="h-1 rounded-full flex-1" style={{ background: tok.accent }} />
                      <div className="h-1 rounded-full flex-1" style={{ background: tok.accent }} />
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.08em', color: tok.textTertiary }}>
                      {cp.stepLabel}
                    </p>
                  </div>
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
                      const hasConsent = localStorage.getItem('biometric_consent') === 'true';
                      if (!hasConsent) {
                        setShowBiometricModal(true);
                        return;
                      }
                      
                      try {
                        // Request camera permission now
                        const stream = await navigator.mediaDevices.getUserMedia({
                          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                        });
                        stream.getTracks().forEach((t) => t.stop());
                        setStep('camera');
                      } catch {
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
                      color: tok.textSecondary,
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
