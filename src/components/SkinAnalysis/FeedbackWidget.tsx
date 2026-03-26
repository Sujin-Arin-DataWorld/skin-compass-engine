// FeedbackWidget v2 — Structured 6-tag feedback + Precision Diagnosis CTA
// Thumbs up/down → structured tags → AI model improvement pipeline

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, ClipboardList, ChevronRight } from 'lucide-react';
import { submitFeedback } from '@/services/skinAnalysisService';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { useI18nStore } from '@/store/i18nStore';

type Lang = 'ko' | 'en' | 'de';

// ── Feedback Tag Definitions (6 structured options) ─────────────────────────
const FEEDBACK_TAGS = [
  {
    id: 'sebum_hydration',
    ko: '유분/수분 밸런스가 실제와 달라요',
    en: 'Oil/moisture balance feels different',
    de: 'Öl-/Feuchtigkeitsbalance stimmt nicht',
  },
  {
    id: 'sensitivity',
    ko: '민감도/홍조/붉은기를 잘못 판단했어요',
    en: 'Sensitivity/redness was misjudged',
    de: 'Empfindlichkeit/Rötung wurde falsch eingeschätzt',
  },
  {
    id: 'acne_detection',
    ko: '트러블/여드름 위치를 놓쳤어요',
    en: 'Missed acne/blemish locations',
    de: 'Unreinheiten wurden übersehen',
  },
  {
    id: 'pigmentation',
    ko: '색소침착/기미/잡티를 잡아내지 못했어요',
    en: "Didn't detect pigmentation/dark spots",
    de: 'Pigmentierung/Flecken nicht erkannt',
  },
  {
    id: 'texture_pores',
    ko: '모공이나 잔주름 등 피부결 묘사가 부정확해요',
    en: 'Pore/fine line texture description was inaccurate',
    de: 'Beschreibung von Poren/Falten war ungenau',
  },
  {
    id: 'lighting_quality',
    ko: '사진 조명이나 화질 때문에 잘못 분석된 것 같아요',
    en: 'Analysis seems wrong due to lighting/image quality',
    de: 'Analyse scheint wegen Beleuchtung/Bildqualität falsch',
  },
] as const;

type FeedbackTagId = typeof FEEDBACK_TAGS[number]['id'];

// ── i18n Texts ──────────────────────────────────────────────────────────────
const TX = {
  thanks:       { ko: '소중한 피드백 감사합니다! 🙏', en: 'Thank you for your feedback! 🙏', de: 'Vielen Dank für Ihr Feedback! 🙏' },
  question:     { ko: '분석 결과가 정확한가요?', en: 'Was the analysis accurate?', de: 'War die Analyse genau?' },
  accurate:     { ko: '정확해요', en: 'Accurate', de: 'Genau' },
  inaccurate:   { ko: '아니에요', en: 'Not quite', de: 'Nicht ganz' },
  whatWasDiff:   { ko: '어떤 부분이 다르게 느껴졌나요?', en: 'What felt different?', de: 'Was war anders?' },
  selectMulti:  { ko: '(복수 선택 가능)', en: '(Select multiple)', de: '(Mehrfachauswahl)' },
  placeholder:  { ko: '추가 의견 (선택)', en: 'Additional comments (optional)', de: 'Zusätzliche Anmerkungen (optional)' },
  submitting:   { ko: '전송 중...', en: 'Sending...', de: 'Senden...' },
  submit:       { ko: '제출하기', en: 'Submit', de: 'Absenden' },
  ctaTitle:     { ko: '더 정확한 분석을 원하시나요?', en: 'Want a more precise analysis?', de: 'Möchten Sie eine genauere Analyse?' },
  ctaDesc:      { ko: '얼굴 존별 정밀 진단 설문으로 AI 결과를 보정할 수 있습니다.', en: 'Calibrate AI results with our zone-by-zone skin diagnosis questionnaire.', de: 'Kalibrieren Sie die KI-Ergebnisse mit unserem zonenweisen Hautdiagnose-Fragebogen.' },
  ctaButton:    { ko: '정밀 진단 설문 시작하기', en: 'Start precision diagnosis', de: 'Präzisionsdiagnose starten' },
} as const;

interface FeedbackWidgetProps {
  analysisId: string;
}

export default function FeedbackWidget({ analysisId }: FeedbackWidgetProps) {
  const navigate = useNavigate();
  const { language } = useI18nStore();
  const lang = language as Lang;
  const setFeedbackGiven = useSkinAnalysisStore((s) => s.setFeedbackGiven);

  const [voted, setVoted] = useState<'accurate' | 'inaccurate' | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<FeedbackTagId>>(new Set());
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleTag = useCallback((id: FeedbackTagId) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleVote = async (v: 'accurate' | 'inaccurate') => {
    setVoted(v);
    if (v === 'accurate') {
      await send(v);
    }
    // 'inaccurate' → show structured tags UI
  };

  const send = async (v: 'accurate' | 'inaccurate', c?: string, tags?: string[]) => {
    setSubmitting(true);
    try {
      await submitFeedback(analysisId, v, c, tags);
    } catch {
      // Non-fatal — feedback is best-effort
    } finally {
      setSubmitting(false);
      setDone(true);
      setFeedbackGiven(true);
    }
  };

  const handleSubmitInaccurate = () => {
    const tags = Array.from(selectedTags);
    send('inaccurate', comment || undefined, tags.length > 0 ? tags : undefined);
  };

  // ── Done state ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-center"
        style={{
          background: 'rgba(201,169,110,0.08)',
          border: '1px solid rgba(201,169,110,0.2)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#c9a96e' }}>
          {TX.thanks[lang]}
        </p>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-2xl px-5 py-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Question */}
      <p
        className="text-center mb-4"
        style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}
      >
        {TX.question[lang]}
      </p>

      {/* Thumbs buttons (only if not yet voted) */}
      {!voted && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleVote('accurate')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 transition-all active:scale-95"
            style={{
              background: 'rgba(74,158,104,0.12)',
              border: '1px solid rgba(74,158,104,0.3)',
              color: '#4A9E68',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            }}
          >
            <ThumbsUp size={15} />
            {TX.accurate[lang]}
          </button>
          <button
            onClick={() => handleVote('inaccurate')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 transition-all active:scale-95"
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            }}
          >
            <ThumbsDown size={15} />
            {TX.inaccurate[lang]}
          </button>
        </div>
      )}

      {/* ── Structured Tags (shown after "inaccurate" vote) ──────────────── */}
      {voted === 'inaccurate' && !done && (
        <div className="mt-4" style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Header */}
          <p
            className="mb-1"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {TX.whatWasDiff[lang]}{' '}
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              {TX.selectMulti[lang]}
            </span>
          </p>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {FEEDBACK_TAGS.map((tag) => {
              const isSelected = selectedTags.has(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full px-3.5 py-2 transition-all active:scale-95"
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.4,
                    background: isSelected ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: isSelected ? '#c9a96e' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {tag[lang]}
                </button>
              );
            })}
          </div>

          {/* Optional comment */}
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={TX.placeholder[lang]}
            className="w-full mt-3 rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          {/* ── Precision Diagnosis CTA ───────────────────────────────────── */}
          <div
            className="mt-4 rounded-xl px-4 py-3.5"
            style={{
              background: 'rgba(74,158,104,0.08)',
              border: '1px solid rgba(74,158,104,0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <ClipboardList size={20} style={{ color: '#4A9E68', flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1">
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#4A9E68', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
                  {TX.ctaTitle[lang]}
                </p>
                <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                  {TX.ctaDesc[lang]}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/diagnosis')}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(74,158,104,0.15)',
                border: '1px solid rgba(74,158,104,0.3)',
                color: '#4A9E68',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {TX.ctaButton[lang]}
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmitInaccurate}
            disabled={submitting}
            className="mt-3 w-full rounded-full py-2.5 transition-all active:scale-[0.98]"
            style={{
              background: selectedTags.size > 0 ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${selectedTags.size > 0 ? 'rgba(201,169,110,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: selectedTags.size > 0 ? '#c9a96e' : 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 600,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? TX.submitting[lang] : TX.submit[lang]}
          </button>
        </div>
      )}
    </div>
  );
}
