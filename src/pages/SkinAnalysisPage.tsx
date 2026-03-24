// Prompt 3 — PART C: SkinAnalysisPage
// State machine: idle → camera → analyzing → result → error

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import LiveCamera from '@/components/SkinAnalysis/LiveCamera';
import AnalysisLoading from '@/components/SkinAnalysis/AnalysisLoading';
import AnalysisResults from '@/components/SkinAnalysis/AnalysisResults';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { analyzeSkinImage } from '@/services/skinAnalysisService';
import { useI18nStore, translations } from '@/store/i18nStore';

// ── Multilingual meta for /skin-analysis ────────────────────────────────────
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

export default function SkinAnalysisPage() {
  const {
    currentStep,
    capturedImageBase64,
    scores,
    analysisId,
    errorMessage,
    setStep,
    setCapturedImage,
    setAnalysisResult,
    setError,
    resetAnalysis,
  } = useSkinAnalysisStore();

  const { language } = useI18nStore();
  const t = translations[language];

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
        const response = await analyzeSkinImage(base64);
        setAnalysisResult(response.scores, 'ai_photo_analysis', response.analysis_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.camera.analysisError);
      }
    },
    [setCapturedImage, setStep, setAnalysisResult, setError, t],
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
        className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(160deg, #0d0d12 0%, #1a1520 100%)' }}
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
              background: 'linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(183,110,121,0.15) 100%)',
              border: '1px solid rgba(201,169,110,0.3)',
            }}
          >
            <Camera size={32} color="#c9a96e" />
          </div>

          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: '#c9a96e',
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
              color: '#fff',
              fontWeight: 400,
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
              color: 'rgba(255,255,255,0.5)',
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
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={() => setStep('camera')}
            className="w-full rounded-2xl py-4 text-center transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.25) 0%, rgba(183,110,121,0.25) 100%)',
              border: '1px solid rgba(201,169,110,0.5)',
              color: '#c9a96e',
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
              color: 'rgba(255,255,255,0.25)',
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
        className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(160deg, #0d0d12 0%, #1a1520 100%)' }}
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
              color: '#fff',
              marginBottom: '8px',
            }}
          >
            {t.camera.analysisFailed}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '28px',
            }}
          >
            {errorMessage}
          </p>
          <button
            onClick={handleRetake}
            className="w-full rounded-2xl py-3 flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
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
