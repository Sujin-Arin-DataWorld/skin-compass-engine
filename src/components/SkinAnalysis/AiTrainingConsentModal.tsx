/**
 * AiTrainingConsentModal — Phase 2 GDPR Two-Track
 *
 * Dual-consent modal shown after user confirms analysis accuracy (👍).
 * Strictly separates:
 *   - photo_storage: Save photos for personal Skin Journey tracking
 *   - ai_training:   Allow anonymized data for AI model improvement
 *
 * Reads capturedImageBase64 from skinAnalysisStore (zero-friction — no re-capture).
 * Full Dark ↔ Light mode via CSS custom properties (--ssl-* tokens).
 * Full i18n: ko / en / de.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Camera,
  Shield,
  Clock,
  X,
  Loader2,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

type Lang = 'ko' | 'en' | 'de';

// ── i18n Copy ─────────────────────────────────────────────────────────────────
const TX = {
  badge: {
    ko: 'AI 트레이닝 기여',
    en: 'AI Training Contribution',
    de: 'KI-Training Beitrag',
  },
  title: {
    ko: '당신의 데이터가\nAI를 진화시킵니다',
    en: 'Your Data Powers\nSmarter AI',
    de: 'Ihre Daten machen\ndie KI intelligenter',
  },
  subtitle: {
    ko: '탁월한 분석 결과에 감사드립니다! 선택적으로 두 가지 방식으로 피부 과학에 기여할 수 있습니다.',
    en: 'Thank you for confirming your analysis! You can optionally contribute to skin science in two ways.',
    de: 'Danke für Ihre Bestätigung! Sie können optional auf zwei Wegen zur Hautwissenschaft beitragen.',
  },

  // Track 1: photo_storage
  journeyTitle: {
    ko: '피부 여정 추적',
    en: 'Skin Journey Tracking',
    de: 'Hautreise-Tracking',
  },
  journeyDesc: {
    ko: '사진을 저장하여 시간 경과에 따른 피부 변화를 추적합니다. 나만 볼 수 있습니다.',
    en: 'Save your photo to track skin changes over time. Only visible to you.',
    de: 'Speichern Sie Ihr Foto, um Hautveränderungen zu verfolgen. Nur für Sie sichtbar.',
  },

  // Track 2: ai_training
  aiTitle: {
    ko: 'AI 모델 개선 기여',
    en: 'AI Model Improvement',
    de: 'KI-Modell verbessern',
  },
  aiDesc: {
    ko: '익명화된 분석 데이터로 AI 정확도를 향상합니다. 사진은 암호화 저장 후 90일 후 자동 삭제됩니다.',
    en: 'Improve AI accuracy with anonymized analysis data. Photos are encrypted and auto-deleted after 90 days.',
    de: 'Verbessern Sie die KI-Genauigkeit mit anonymisierten Daten. Fotos werden verschlüsselt und nach 90 Tagen gelöscht.',
  },

  // Safety badges
  encrypted: { ko: '암호화 저장', en: 'Encrypted', de: 'Verschlüsselt' },
  autoDelete: { ko: '90일 자동 삭제', en: '90-day auto-delete', de: '90 Tage Auto-Löschung' },
  revocable: { ko: '언제든 철회 가능', en: 'Revocable anytime', de: 'Jederzeit widerrufbar' },

  // Buttons
  submit: { ko: '동의하고 기여하기', en: 'Agree & Contribute', de: 'Zustimmen & Beitragen' },
  submitting: { ko: '저장 중...', en: 'Saving...', de: 'Speichern...' },
  skip: { ko: '다음에 할게요', en: 'Maybe later', de: 'Vielleicht später' },

  // Success
  successTitle: { ko: '감사합니다! 🧬', en: 'Thank you! 🧬', de: 'Vielen Dank! 🧬' },
  successDesc: {
    ko: 'AI가 더 똑똑해지는 데 기여해주셨습니다.',
    en: "You've helped make our AI smarter.",
    de: 'Sie haben unsere KI intelligenter gemacht.',
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (consents: { photoStorage: boolean; aiTraining: boolean }) => Promise<void>;
  hasImage: boolean; // whether capturedImageBase64 exists in store
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ConsentToggle({
  checked,
  onChange,
  icon: Icon,
  title,
  description,
  accentColor,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full text-left rounded-2xl p-4 transition-all duration-300 active:scale-[0.98]"
      style={{
        background: checked
          ? `color-mix(in srgb, ${accentColor} 8%, var(--ssl-bg-card))`
          : 'var(--ssl-bg-card)',
        border: `1.5px solid ${checked ? `color-mix(in srgb, ${accentColor} 35%, transparent)` : 'var(--ssl-border)'}`,
        boxShadow: checked ? `0 0 20px color-mix(in srgb, ${accentColor} 8%, transparent)` : 'none',
      }}
    >
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300"
          style={{
            background: checked
              ? `color-mix(in srgb, ${accentColor} 15%, transparent)`
              : 'color-mix(in srgb, var(--ssl-text-tertiary) 10%, transparent)',
          }}
        >
          <Icon
            size={18}
            style={{
              color: checked ? accentColor : 'var(--ssl-text-tertiary)',
              transition: 'color 0.3s',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className="font-semibold"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                color: checked ? accentColor : 'var(--ssl-text)',
                transition: 'color 0.3s',
              }}
            >
              {title}
            </p>

            {/* Toggle rail */}
            <div
              className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-300"
              style={{
                background: checked ? accentColor : 'var(--ssl-bg-surface)',
                border: `1px solid ${checked ? 'transparent' : 'var(--ssl-border)'}`,
              }}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm"
                animate={{ left: checked ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  background: checked ? '#FFFFFF' : 'var(--ssl-text-tertiary)',
                }}
              />
            </div>
          </div>
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: 1.55,
              color: 'var(--ssl-text-secondary)',
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AiTrainingConsentModal({ isOpen, onClose, onSubmit, hasImage }: Props) {
  const { language } = useI18nStore();
  const lang = (language as Lang) || 'en';

  const [photoStorage, setPhotoStorage] = useState(false);
  const [aiTraining, setAiTraining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasSelection = photoStorage || aiTraining;

  const handleSubmit = useCallback(async () => {
    if (!hasSelection) return;
    setSubmitting(true);
    try {
      await onSubmit({ photoStorage, aiTraining });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('[AiTrainingConsent] Submit error:', err);
      setSubmitting(false);
    }
  }, [hasSelection, photoStorage, aiTraining, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ai-consent-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !submitting) onClose();
        }}
      >
        <motion.div
          key="ai-consent-modal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden relative"
          style={{
            background: 'var(--ssl-bg)',
            border: '1px solid var(--ssl-border)',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
            maxHeight: '90vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Scrollable Content ─────────────────────────────────── */}
          <div className="overflow-y-auto" style={{ maxHeight: '85vh' }}>
            <AnimatePresence mode="wait">
              {success ? (
                // ── Success State ──────────────────────────────────
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-6 py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                    className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--ssl-accent-bg)',
                      border: '2px solid var(--ssl-accent-border)',
                    }}
                  >
                    <Sparkles size={28} style={{ color: 'var(--ssl-accent)' }} />
                  </motion.div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'var(--ssl-accent)',
                      marginBottom: 8,
                    }}
                  >
                    {TX.successTitle[lang]}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      color: 'var(--ssl-text-secondary)',
                    }}
                  >
                    {TX.successDesc[lang]}
                  </p>
                </motion.div>
              ) : (
                // ── Main Form ──────────────────────────────────────
                <motion.div key="form" exit={{ opacity: 0 }}>
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    disabled={submitting}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-70"
                    style={{
                      background: 'var(--ssl-bg-surface)',
                      border: '1px solid var(--ssl-border)',
                      minHeight: '32px',
                      minWidth: '32px',
                    }}
                  >
                    <X size={14} style={{ color: 'var(--ssl-text-secondary)' }} />
                  </button>

                  {/* Header */}
                  <div className="px-6 pt-7 pb-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={14} style={{ color: 'var(--ssl-accent)' }} />
                      <p
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--ssl-accent)',
                        }}
                      >
                        {TX.badge[lang]}
                      </p>
                    </div>
                    <h2
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '22px',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color: 'var(--ssl-text)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {TX.title[lang]}
                    </h2>
                    <p
                      className="mt-2.5"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--ssl-text-secondary)',
                      }}
                    >
                      {TX.subtitle[lang]}
                    </p>
                  </div>

                  {/* Toggle Cards */}
                  <div className="px-6 py-4 space-y-3">
                    {/* Track 1: Photo Storage (Skin Journey) */}
                    <ConsentToggle
                      checked={photoStorage}
                      onChange={setPhotoStorage}
                      icon={Camera}
                      title={TX.journeyTitle[lang]}
                      description={TX.journeyDesc[lang]}
                      accentColor="var(--ssl-secondary)"
                    />

                    {/* Track 2: AI Training */}
                    <ConsentToggle
                      checked={aiTraining}
                      onChange={setAiTraining}
                      icon={Sparkles}
                      title={TX.aiTitle[lang]}
                      description={TX.aiDesc[lang]}
                      accentColor="var(--ssl-accent)"
                    />
                  </div>

                  {/* Safety Badges */}
                  <div className="px-6 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: Shield, text: TX.encrypted[lang] },
                        { icon: Clock, text: TX.autoDelete[lang] },
                        { icon: ChevronRight, text: TX.revocable[lang] },
                      ].map((badge) => (
                        <div
                          key={badge.text}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                          style={{
                            background: 'var(--ssl-bg-surface)',
                            border: '1px solid var(--ssl-border)',
                          }}
                        >
                          <badge.icon size={11} style={{ color: 'var(--ssl-accent-muted)' }} />
                          <span
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: '10.5px',
                              fontWeight: 500,
                              color: 'var(--ssl-text-secondary)',
                            }}
                          >
                            {badge.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="px-6 pb-8 pt-4 space-y-3"
                    style={{ borderTop: '1px solid var(--ssl-border)' }}
                  >
                    {/* No image warning */}
                    {!hasImage && hasSelection && (
                      <p
                        className="text-center"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '11px',
                          color: 'var(--ssl-text-tertiary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {lang === 'ko'
                          ? '촬영 사진이 만료되었습니다. 다음 분석에서 적용됩니다.'
                          : lang === 'de'
                            ? 'Das Foto ist abgelaufen. Die Einstellung gilt ab der nächsten Analyse.'
                            : 'Photo has expired. Setting will apply from next analysis.'}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!hasSelection || submitting}
                      className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
                      style={{
                        background: hasSelection ? 'var(--ssl-accent)' : 'var(--ssl-bg-surface)',
                        color: hasSelection ? '#FFFFFF' : 'var(--ssl-text-tertiary)',
                        opacity: submitting ? 0.6 : 1,
                        cursor: hasSelection ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font-sans)',
                        border: hasSelection ? 'none' : '1px solid var(--ssl-border)',
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {TX.submitting[lang]}
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          {TX.submit[lang]}
                        </>
                      )}
                    </button>

                    {/* Skip */}
                    <button
                      onClick={onClose}
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-70"
                      style={{
                        color: 'var(--ssl-text-tertiary)',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 400,
                      }}
                    >
                      {TX.skip[lang]}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
