// Prompt 2 — Analysis loading screen
// Shows frozen captured photo + scanner animation + multi-step progress

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18nStore, translations } from '@/store/i18nStore';

interface AnalysisLoadingProps {
  capturedImage: string; // base64, mirrored for display
  onRetake: () => void;
}

export default function AnalysisLoading({
  capturedImage,
  onRetake,
}: AnalysisLoadingProps) {
  const { language } = useI18nStore();
  const t = translations[language];
  const STEPS = t.skinAnalysis.loadingSteps;

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [STEPS.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#000', touchAction: 'none' }}
    >
      {/* Frozen background — mirrored to match viewfinder */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(data:image/jpeg;base64,${capturedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scaleX(-1)',
          filter: 'brightness(0.45)',
        }}
      />

      {/* Scanner line — pure CSS animation */}
      <style>{`
        @keyframes scanner {
          0%   { top: 20%; opacity: 1; }
          80%  { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
        .scanner-line {
          animation: scanner 2s ease-in-out infinite;
        }
      `}</style>

      {/* Scanner line */}
      <div
        className="scanner-line absolute left-[17.5%] right-[17.5%] pointer-events-none"
        style={{
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, #00e5ff 20%, #00fff7 50%, #00e5ff 80%, transparent 100%)',
          boxShadow: '0 0 12px #00e5ff, 0 0 4px #00fff7',
          borderRadius: '999px',
        }}
      />

      {/* Progress steps */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-8 mt-auto mb-32 w-full max-w-sm">
        {STEPS.map((step: string, i: number) => (
          <div
            key={step}
            className="flex items-center gap-3 transition-all duration-500"
            style={{
              opacity: i <= activeStep ? 1 : 0.25,
              transform: i === activeStep ? 'translateY(0)' : 'translateY(4px)',
            }}
          >
            {/* Indicator dot */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background:
                  i < activeStep
                    ? '#00e5ff'
                    : i === activeStep
                      ? '#fff'
                      : 'rgba(255,255,255,0.3)',
                boxShadow:
                  i === activeStep ? '0 0 6px #00e5ff' : 'none',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color:
                  i === activeStep
                    ? '#fff'
                    : 'rgba(255,255,255,0.55)',
                fontWeight: i === activeStep ? 500 : 400,
              }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Retake button */}
      <button
        onClick={onRetake}
        className="absolute bottom-8 left-6 flex items-center gap-2 rounded-full px-4 py-2"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
        }}
      >
        <RotateCcw size={14} />
        {t.camera.retakeButton}
      </button>
    </div>
  );
}
