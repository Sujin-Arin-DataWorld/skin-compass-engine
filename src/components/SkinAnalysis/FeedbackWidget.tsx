// FeedbackWidget v3 — MLOps Correction Funnel
// 3-step progressive disclosure: Hook → Correction Funnel → Auto-close Success
// Payload schema prepares for Part C Face Map Override logic
//
// Step 1: Compact card — "How accurate?" → 👍 / 👎
// Step 2: If 👎 → expand with Zone chips + Condition chips + optional comment
// Step 3: Success message → 3s auto-close (height → 0)

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, ChevronRight, Check, ClipboardList } from 'lucide-react';
import { submitFeedback, grantConsent, storeTrainingImage } from '@/services/skinAnalysisService';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useI18nStore } from '@/store/i18nStore';
import { supabase } from '@/integrations/supabase/client';
import AiTrainingConsentModal from './AiTrainingConsentModal';
import { useAuthStore } from '@/store/authStore';

type Lang = 'ko' | 'en' | 'de';
type Step = 'hook' | 'correction' | 'success' | 'hidden';

// ── Zone chips (Question A: "Which area did we miss?") ──────────────────────
// ... (Keep existing definitions) ...
const ZONE_CHIPS = [
  { id: 'forehead', ko: '이마', en: 'Forehead', de: 'Stirn' },
  { id: 'cheeks', ko: '볼', en: 'Cheeks', de: 'Wangen' },
  { id: 'nose', ko: '코', en: 'Nose', de: 'Nase' },
  { id: 'chin', ko: '턱', en: 'Chin', de: 'Kinn' },
  { id: 'overall', ko: '전체', en: 'Overall', de: 'Gesamt' },
] as const;

// ── Condition chips (Question B: "What is the actual condition?") ────────────
const CONDITION_CHIPS = [
  { id: 'more_oily', metric: 'seb', direction: 'increase' as const, ko: '더 기름짐', en: 'More Oily', de: 'Öliger' },
  { id: 'more_dry', metric: 'hyd', direction: 'decrease' as const, ko: '더 건조함', en: 'More Dry', de: 'Trockener' },
  { id: 'more_sensitive', metric: 'sen', direction: 'increase' as const, ko: '더 민감함', en: 'More Sensitive', de: 'Empfindlicher' },
  { id: 'breakouts', metric: 'acne', direction: 'increase' as const, ko: '트러블 있음', en: 'Breakouts', de: 'Unreinheiten' },
  { id: 'pigmentation', metric: 'pigment', direction: 'increase' as const, ko: '색소침착', en: 'Pigmentation', de: 'Pigmentierung' },
  { id: 'texture_rough', metric: 'texture', direction: 'increase' as const, ko: '피부결 거침', en: 'Rough Texture', de: 'Raue Textur' },
] as const;

type ZoneId = typeof ZONE_CHIPS[number]['id'];
type ConditionId = typeof CONDITION_CHIPS[number]['id'];

// ── i18n Texts ──────────────────────────────────────────────────────────────
const TX = {
  question: { ko: '분석 결과가 정확한가요?', en: 'How accurate is this analysis?', de: 'Wie genau ist diese Analyse?' },
  accurate: { ko: '정확해요', en: 'Accurate', de: 'Genau' },
  inaccurate: { ko: '조정이 필요해요', en: 'Needs tweaking', de: 'Braucht Anpassung' },
  zoneQuestion: { ko: 'AI가 놓친 부위는?', en: 'Which area did we miss?', de: 'Welchen Bereich haben wir übersehen?' },
  condQuestion: { ko: '실제 피부 상태는?', en: 'What is the actual condition?', de: 'Wie ist der tatsächliche Zustand?' },
  selectHint: { ko: '(복수 선택 가능)', en: '(Select multiple)', de: '(Mehrfachauswahl)' },
  comment: { ko: '추가 의견 (선택)', en: 'Additional comments (optional)', de: 'Zusätzliche Anmerkungen (optional)' },
  submit: { ko: '보정 제출하기', en: 'Submit Correction', de: 'Korrektur absenden' },
  submitting: { ko: '전송 중...', en: 'Sending...', de: 'Senden...' },
  thanks: { ko: '소중한 피드백 감사합니다! AI가 진화합니다 🧬', en: 'Thank you! Your feedback helps our AI evolve 🧬', de: 'Danke! Ihr Feedback hilft unserer KI, sich weiterzuentwickeln 🧬' },
  ctaTitle: { ko: '더 정확한 분석을 원하시나요?', en: 'Want a more precise analysis?', de: 'Möchten Sie eine genauere Analyse?' },
  ctaDesc: { ko: '얼굴 존별 정밀 분석 설문으로 AI를 보정하세요.', en: 'Calibrate AI results with our zone-by-zone analysis.', de: 'Kalibrieren Sie die KI mit unserer zonenweisen Analyse.' },
  ctaButton: { ko: '정밀 분석 시작', en: 'Start Precision Analysis', de: 'Präzisionsanalyse starten' },
} as const;

// ── Glassmorphism tokens ────────────────────────────────────────────────────
const GLASS = {
  background: 'rgba(28,28,30,0.55)',
  backdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid rgba(255,255,255,0.06)',
};

// ── Chip component ──────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
  accentColor = '#C9A96E',
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3.5 py-2 transition-all active:scale-95"
      style={{
        fontSize: '12px',
        fontFamily: 'var(--font-sans)',
        fontWeight: selected ? 600 : 400,
        lineHeight: 1.4,
        background: selected ? `${accentColor}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? `${accentColor}50` : 'rgba(255,255,255,0.1)'}`,
        color: selected ? accentColor : 'rgba(255,255,255,0.55)',
      }}
    >
      {selected && <Check size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface FeedbackWidgetProps {
  analysisId: string;
}

export default function FeedbackWidget({ analysisId }: FeedbackWidgetProps) {
  const navigate = useNavigate();
  const { language } = useI18nStore();
  const lang = language as Lang;
  const setFeedbackGiven = useSkinAnalysisStore((s) => s.setFeedbackGiven);
  const trainingConsentGiven = useSkinAnalysisStore((s) => s.trainingConsentGiven);
  const setTrainingConsentGiven = useSkinAnalysisStore((s) => s.setTrainingConsentGiven);
  const capturedImageBase64 = useSkinAnalysisStore((s) => s.capturedImageBase64);

  const isAuthenticated = useAuthStore((s) => s.isLoggedIn);
  const [step, setStep] = useState<Step>('hook');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedZones, setSelectedZones] = useState<Set<ZoneId>>(new Set());
  const [selectedConditions, setSelectedConditions] = useState<Set<ConditionId>>(new Set());
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, []);

  // ── Toggle helpers ──────────────────────────────────────────────────────────
  const toggleZone = useCallback((id: ZoneId) => {
    setSelectedZones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleCondition = useCallback((id: ConditionId) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Submit logic ────────────────────────────────────────────────────────────
  const showSuccessAndAutoClose = useCallback(() => {
    setStep('success');
    setFeedbackGiven(true);
    autoCloseTimer.current = setTimeout(() => {
      setStep('hidden');
    }, 3000);
  }, [setFeedbackGiven]);

  const handleAccurate = useCallback(async () => {
    setSubmitting(true);
    try {
      await submitFeedback(analysisId, 'accurate', undefined, undefined);
    } catch {
      // Non-fatal — feedback is best-effort
    } finally {
      setSubmitting(false);
      showSuccessAndAutoClose();

      // Phase 2: Show consent modal for ALL users who haven't opted in yet
      // Authenticated → dual consent toggles (photo_storage + ai_training)
      // Anonymous → "Sign up to save results" marketing hook (signup conversion)
      if (!trainingConsentGiven) {
        // Small delay so success animation plays first
        setTimeout(() => setShowConsentModal(true), 800);
      }
    }
  }, [analysisId, showSuccessAndAutoClose, trainingConsentGiven]);

  // Phase 2: Handle consent modal submission
  const handleConsentSubmit = useCallback(async (
    consents: { photoStorage: boolean; aiTraining: boolean },
  ) => {
    const promises: Promise<unknown>[] = [];

    if (consents.photoStorage) {
      promises.push(grantConsent('photo_storage'));
    }
    if (consents.aiTraining) {
      promises.push(
        grantConsent('ai_training').then(async () => {
          // If we have the image in memory, upload it immediately
          if (capturedImageBase64 && analysisId) {
            const result = await storeTrainingImage(analysisId, capturedImageBase64);
            if (result.success) {
              console.log('[FeedbackWidget] Training image stored:', result.storagePath);
            } else {
              console.warn('[FeedbackWidget] Training image store failed:', result.error);
            }
          }
        }),
      );
    }

    await Promise.allSettled(promises);
    setTrainingConsentGiven(true);
  }, [capturedImageBase64, analysisId, setTrainingConsentGiven]);

  const handleInaccurate = useCallback(() => {
    setStep('correction');
  }, []);

  const handleSubmitCorrection = useCallback(async () => {
    setSubmitting(true);

    // Build Part C-compatible override payload
    const zones = Array.from(selectedZones);
    const conditions = Array.from(selectedConditions);
    const overrides: Record<string, string> = {};
    for (const condId of conditions) {
      const chip = CONDITION_CHIPS.find((c) => c.id === condId);
      if (chip) overrides[chip.metric] = chip.direction;
    }

    // Combine into structured tags for the existing API
    const tags = [...zones.map((z) => `zone:${z}`), ...conditions.map((c) => `condition:${c}`)];

    try {
      await submitFeedback(
        analysisId,
        'inaccurate',
        comment || undefined,
        tags.length > 0 ? tags : undefined,
      );
    } catch {
      // Non-fatal
    } finally {
      setSubmitting(false);
      showSuccessAndAutoClose();
    }
  }, [analysisId, selectedZones, selectedConditions, comment, showSuccessAndAutoClose]);

  // ── Render nothing if auto-closed ───────────────────────────────────────────
  if (step === 'hidden') return (
    <>
      {/* Consent modal can outlive the widget */}
      <AiTrainingConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onSubmit={handleConsentSubmit}
        hasImage={!!capturedImageBase64}
        isAuthenticated={isAuthenticated}
      />
    </>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {/* ── Step 1: The Hook ────────────────────────────────────────────────── */}
        {step === 'hook' && (
          <motion.div
            key="hook"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className="rounded-2xl px-5 py-5 overflow-hidden"
            style={{ ...GLASS, WebkitBackdropFilter: GLASS.backdropFilter }}
          >
            <p
              className="text-center mb-4"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}
            >
              {TX.question[lang]}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleAccurate}
                disabled={submitting}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 transition-all active:scale-95"
                style={{
                  background: 'rgba(74,158,104,0.12)',
                  border: '1px solid rgba(74,158,104,0.3)',
                  color: '#4A9E68',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                <ThumbsUp size={15} />
                {TX.accurate[lang]}
              </button>
              <button
                onClick={handleInaccurate}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 transition-all active:scale-95"
                style={{
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  color: '#C9A96E',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <ThumbsDown size={15} />
                {TX.inaccurate[lang]}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Correction Funnel ──────────────────────────────────────── */}
        {step === 'correction' && (
          <motion.div
            key="correction"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
            className="rounded-2xl px-5 py-5 overflow-hidden"
            style={{ ...GLASS, WebkitBackdropFilter: GLASS.backdropFilter }}
          >
            {/* Question A: Zone */}
            <div className="mb-5">
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                {TX.zoneQuestion[lang]}{' '}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                  {TX.selectHint[lang]}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {ZONE_CHIPS.map((z) => (
                  <Chip
                    key={z.id}
                    label={z[lang]}
                    selected={selectedZones.has(z.id)}
                    onClick={() => toggleZone(z.id)}
                    accentColor="#87B6BC"
                  />
                ))}
              </div>
            </div>

            {/* Question B: Condition */}
            <div className="mb-5">
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                {TX.condQuestion[lang]}{' '}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                  {TX.selectHint[lang]}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {CONDITION_CHIPS.map((c) => (
                  <Chip
                    key={c.id}
                    label={c[lang]}
                    selected={selectedConditions.has(c.id)}
                    onClick={() => toggleCondition(c.id)}
                    accentColor="#C9A96E"
                  />
                ))}
              </div>
            </div>

            {/* Optional comment */}
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={TX.comment[lang]}
              className="w-full rounded-xl px-3 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                outline: 'none',
              }}
            />

            {/* Precision Analysis CTA (Part C entrypoint) */}
            <div
              className="mt-4 rounded-xl px-4 py-3.5"
              style={{
                background: 'rgba(74,158,104,0.06)',
                border: '1px solid rgba(74,158,104,0.15)',
              }}
            >
              <div className="flex items-start gap-3">
                <ClipboardList size={18} style={{ color: '#4A9E68', flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#4A9E68', fontFamily: 'var(--font-sans)', marginBottom: 2 }}>
                    {TX.ctaTitle[lang]}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                    {TX.ctaDesc[lang]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/analysis')}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(74,158,104,0.12)',
                  border: '1px solid rgba(74,158,104,0.25)',
                  color: '#4A9E68',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {TX.ctaButton[lang]}
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Submit correction */}
            <button
              onClick={handleSubmitCorrection}
              disabled={submitting || (selectedZones.size === 0 && selectedConditions.size === 0)}
              className="mt-4 w-full rounded-full py-3 transition-all active:scale-[0.98]"
              style={{
                background: (selectedZones.size > 0 || selectedConditions.size > 0)
                  ? 'rgba(201,169,110,0.18)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(selectedZones.size > 0 || selectedConditions.size > 0)
                  ? 'rgba(201,169,110,0.35)'
                  : 'rgba(255,255,255,0.08)'}`,
                color: (selectedZones.size > 0 || selectedConditions.size > 0)
                  ? '#C9A96E'
                  : 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                opacity: submitting ? 0.5 : 1,
                cursor: (selectedZones.size === 0 && selectedConditions.size === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? TX.submitting[lang] : TX.submit[lang]}
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Success → 3s Auto-Close ───────────────────────────────── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className="rounded-2xl px-5 py-5 text-center overflow-hidden"
            style={{ ...GLASS, WebkitBackdropFilter: GLASS.backdropFilter }}
          >
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
              className="mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{
                width: 40,
                height: 40,
                background: 'rgba(74,158,104,0.15)',
                border: '1px solid rgba(74,158,104,0.3)',
              }}
            >
              <Check size={20} style={{ color: '#4A9E68' }} />
            </motion.div>

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.6,
            }}>
              {TX.thanks[lang]}
            </p>

            {/* Subtle progress bar showing auto-close countdown */}
            <motion.div
              className="mt-4 h-0.5 rounded-full mx-auto"
              style={{ background: 'rgba(74,158,104,0.4)', maxWidth: 120 }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: AI Training Consent Modal */}
      <AiTrainingConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onSubmit={handleConsentSubmit}
        hasImage={!!capturedImageBase64}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
