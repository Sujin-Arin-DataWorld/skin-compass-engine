// Prompt 3 — PART C: SkinAnalysisPage
// State machine: idle → camera → analyzing → result → error

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import LiveCamera from '@/components/SkinAnalysis/LiveCamera';
import AnalysisLoading from '@/components/SkinAnalysis/AnalysisLoading';
import AnalysisResults from '@/components/SkinAnalysis/AnalysisResults';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { analyzeSkinImage } from '@/services/skinAnalysisService';

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

  // ── Camera captured an image ──────────────────────────────────────────────
  const handleCapture = useCallback(
    async (base64: string) => {
      setCapturedImage(base64);
      setStep('analyzing');

      try {
        const response = await analyzeSkinImage(base64);
        setAnalysisResult(response.scores, 'ai_photo_analysis', response.analysis_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      }
    },
    [setCapturedImage, setStep, setAnalysisResult, setError],
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
            AI Skin Analysis
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
            30초 AI 피부 분석
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '36px',
              lineHeight: 1.6,
            }}
          >
            카메라로 얼굴을 촬영하면 AI가 10가지 피부 축을
            <br />분석하고 맞춤 솔루션을 제안합니다.
          </p>

          {/* Axis chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {['피지', '수분', '장벽', '민감도', '트러블', '색소', '피부결', '노화', '산화', '화장지속'].map((label) => (
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
            카메라 시작 →
          </button>

          <p
            className="mt-4"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            촬영된 이미지는 분석 후 즉시 처리되며 개인 정보를 보호합니다.
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
            분석 실패
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
            다시 시도
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
