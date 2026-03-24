// Prompt 4 UPDATE — Feedback widget
// Thumbs up/down to validate AI accuracy → Phase 2 training data

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitFeedback } from '@/services/skinAnalysisService';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';

interface FeedbackWidgetProps {
  analysisId: string;
}

export default function FeedbackWidget({ analysisId }: FeedbackWidgetProps) {
  const setFeedbackGiven = useSkinAnalysisStore((s) => s.setFeedbackGiven);
  const [voted, setVoted] = useState<'accurate' | 'inaccurate' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleVote = async (v: 'accurate' | 'inaccurate') => {
    setVoted(v);
    if (v === 'inaccurate') {
      setShowComment(true);
    } else {
      await send(v);
    }
  };

  const send = async (v: 'accurate' | 'inaccurate', c?: string) => {
    setSubmitting(true);
    try {
      await submitFeedback(analysisId, v, c);
    } catch {
      // Non-fatal — feedback is best-effort
    } finally {
      setSubmitting(false);
      setDone(true);
      setFeedbackGiven(true);
    }
  };

  if (done) {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-center"
        style={{
          background: 'rgba(201,169,110,0.08)',
          border: '1px solid rgba(201,169,110,0.2)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            color: '#c9a96e',
          }}
        >
          소중한 피드백 감사합니다! 🙏
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p
        className="text-center mb-3"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.75)',
        }}
      >
        분석 결과가 정확한가요?
      </p>

      {!voted && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleVote('accurate')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 transition-all"
            style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.3)',
              color: '#4ade80',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            }}
          >
            <ThumbsUp size={15} />
            정확해요
          </button>
          <button
            onClick={() => handleVote('inaccurate')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 transition-all"
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            }}
          >
            <ThumbsDown size={15} />
            아니에요
          </button>
        </div>
      )}

      {showComment && !done && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="어떤 부분이 다른가요? (선택 사항)"
            rows={2}
            className="w-full rounded-xl px-3 py-2 resize-none text-sm"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
            }}
          />
          <button
            onClick={() => send('inaccurate', comment || undefined)}
            disabled={submitting}
            className="self-end rounded-full px-4 py-1.5 text-sm"
            style={{
              background: 'rgba(201,169,110,0.2)',
              color: '#c9a96e',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? '전송 중...' : '제출'}
          </button>
        </div>
      )}
    </div>
  );
}
