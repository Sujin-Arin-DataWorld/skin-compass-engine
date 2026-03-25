// =================================================
// src/components/home/AISkinAnalysisHero.tsx
// Premium hero section: AI skin analysis promo
// Video-first design with scroll-triggered animations
//
// ⚠️ NO SVG face, NO radar chart, NO @keyframes for scroll elements
// =================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AISkinAnalysisHero.module.css';
import CameraIcon from './CameraIcon';

// ══════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════

export default function AISkinAnalysisHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  // ── IntersectionObserver: trigger animations + video autoplay ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Auto-play video when section scrolls into view
          videoRef.current?.play().catch(() => {
            // Autoplay may be blocked — silent fail is fine
          });
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ── Navigation handlers ──
  const handleCameraAnalysis = useCallback(() => {
    navigate('/skin-analysis');
  }, [navigate]);

  const handleQuestionnaireAnalysis = useCallback(() => {
    navigate('/skin-analysis?method=questionnaire');
  }, [navigate]);

  // ── Helper: apply fade class + stagger delay ──
  const fadeClass = (delay: number) =>
    `${styles.fadeElement} ${isVisible ? styles.visible : ''} ${styles[`fadeDelay${delay}` as keyof typeof styles] || ''}`;

  return (
    <section ref={sectionRef} className={styles.heroSection}>
      {/* Grain texture overlay */}
      <div className={styles.grainOverlay} />

      {/* Two-column grid */}
      <div className={styles.heroGrid}>
        {/* ════════════════════════════════════
            LEFT COLUMN — Text content
            ════════════════════════════════════ */}
        <div className={styles.textColumn}>
          {/* ── 1. Badge pill ── */}
          <div className={fadeClass(0)} style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 100,
                background: 'rgba(138, 154, 123, 0.1)',
                border: '1px solid rgba(138, 154, 123, 0.18)',
              }}
            >
              <span className={styles.pulseDot} />
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#a3b394',
                }}
              >
                정밀 AI 피부 스캔
              </span>
            </div>
          </div>

          {/* ── 2. Heading ── */}
          <h2
            className={`${fadeClass(1)} ${styles.heroHeading}`}
            style={{
              fontFamily: "'Hahmlet', serif",
              fontSize: 40,
              fontWeight: 400,
              color: '#f5f0e8',
              lineHeight: 1.35,
              marginBottom: 20,
            }}
          >
            피부가 머금은 고유의 결,
            <br />
            <span style={{ color: '#d4b87a', fontWeight: 500 }}>
              데이터
            </span>
            로
            <br />
            마주하는 첫 순간
          </h2>

          {/* ── 3. Description ── */}
          <p
            className={fadeClass(2)}
            style={{
              fontFamily: "'Hahmlet', serif",
              fontSize: 15,
              fontWeight: 300,
              color: 'rgba(245, 240, 232, 0.5)',
              lineHeight: 1.8,
              marginBottom: 32,
              maxWidth: 420,
            }}
          >
            10가지 정밀 지표와 7개 부위의 입체적 매핑으로,
            당신만을 위한 솔루션을 제안합니다
          </p>

          {/* ── 4. CTA Buttons ── */}
          <div
            className={`${fadeClass(3)} ${styles.ctaRow}`}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            <button
              className={styles.ctaPrimary}
              onClick={handleCameraAnalysis}
              type="button"
            >
              <CameraIcon size={18} />
              AI로 분석받기
            </button>
            <button
              className={styles.ctaSecondary}
              onClick={handleQuestionnaireAnalysis}
              type="button"
            >
              질문으로 진단하기
              <ChevronRight />
            </button>
          </div>

          {/* ── 5. Feature pills ── */}
          <div
            className={`${fadeClass(4)} ${styles.featurePillRow}`}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
          >
            <span className={styles.featurePill}>⚡ 30초 분석</span>
            <span className={styles.featurePill}>🔬 정밀 피부 진단</span>
            <span className={styles.featurePill}>🧴 성분 기반 매칭</span>
          </div>
        </div>

        {/* ════════════════════════════════════
            RIGHT COLUMN — Video visual
            ════════════════════════════════════ */}
        <div className={styles.videoColumn}>
          <div className={`${fadeClass(2)} ${styles.videoContainer}`}>
            {/* Video element */}
            <video
              ref={videoRef}
              src="/videos/AI_Screen.mp4"
              muted
              loop
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                display: 'block',
                borderRadius: 20,
              }}
            />

            {/* ── Floating zone card (bottom-left) ── */}
            <div
              className={`${styles.floatingCard} ${styles.floatingZoneCard} ${fadeClass(5)}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <GridIcon />
                <span
                  style={{
                    fontFamily: "'Hahmlet', serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#f5f0e8',
                  }}
                >
                  7개의 얼굴 부위 분석
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'SUIT', sans-serif",
                  fontSize: 11,
                  color: 'rgba(245, 240, 232, 0.4)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                이마 · 볼 · 코 · 눈가
                <br />
                입가 · 턱 · 턱선
              </p>
            </div>

            {/* ── Floating score badge (top-right) ── */}
            <div
              className={`${styles.floatingCard} ${styles.floatingScoreBadge} ${fadeClass(6)}`}
            >
              <span
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#8a9a7b',
                  lineHeight: 1,
                }}
              >
                85
              </span>
              <span
                style={{
                  fontFamily: "'SUIT', sans-serif",
                  fontSize: 11,
                  fontWeight: 400,
                  color: 'rgba(245, 240, 232, 0.45)',
                  marginTop: 4,
                }}
              >
                매칭 점수
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════
// INLINE SVG ICONS (small, not worth separate files)
// ══════════════════════════════════════════════════

function ChevronRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8a9a7b" strokeWidth={1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
