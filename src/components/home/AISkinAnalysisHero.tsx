// =================================================
// src/components/home/AISkinAnalysisHero.tsx
// Premium hero section: AI skin analysis promo
// Video-first design with scroll-triggered animations
//
// ⚠️ NO SVG face, NO radar chart, NO @keyframes for scroll elements
// =================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18nStore, phase1T } from '@/store/i18nStore';
import { useAnalysisStore } from '@/store/analysisStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
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
  const { language } = useI18nStore();
  const isKo = language === 'ko';
  const t = phase1T[language].analysisHero;

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
    useAnalysisStore.getState().reset();
    useSkinAnalysisStore.getState().resetAnalysis();
    navigate('/skin-analysis');
  }, [navigate]);

  const handleQuestionnaireAnalysis = useCallback(() => {
    useAnalysisStore.getState().reset();
    useSkinAnalysisStore.getState().resetAnalysis();
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
                  fontFamily: isKo ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#a3b394',
                }}
              >
                {t.badge}
              </span>
            </div>
          </div>

          {/* ── 2. Heading ── */}
          <h2
            className={`${fadeClass(1)} ${styles.heroHeading}`}
            style={{
              fontFamily: isKo ? "'Hahmlet', serif" : "'Fraunces', serif",
              fontSize: 40,
              fontWeight: 400,
              color: '#f5f0e8',
              lineHeight: 1.35,
              marginBottom: 20,
            }}
          >
            {t.headingLine1}
            <br />
            <span style={{ color: '#d4b87a', fontWeight: 500 }}>
              {t.headingLine2}
            </span>
            <span dangerouslySetInnerHTML={{ __html: t.headingLine3 }} />
          </h2>

          <p
            className={fadeClass(2)}
            style={{
              fontFamily: isKo ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 300,
              color: 'rgba(245, 240, 232, 0.5)',
              lineHeight: 1.8,
              marginBottom: 32,
              maxWidth: 420,
            }}
            dangerouslySetInnerHTML={{ __html: t.description }}
          />

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
              {t.btnPrimary}
            </button>
            <button
              className={styles.ctaSecondary}
              onClick={handleQuestionnaireAnalysis}
              type="button"
            >
              {t.btnSecondary}
              <ChevronRight />
            </button>
          </div>

          {/* ── 5. Feature pills ── */}
          <div
            className={`${fadeClass(4)} ${styles.featurePillRow}`}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
          >
            <span className={styles.featurePill}>{t.feature1}</span>
            <span className={styles.featurePill}>{t.feature2}</span>
            <span className={styles.featurePill}>{t.feature3}</span>
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
              autoPlay
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
                    fontFamily: isKo ? "'Hahmlet', serif" : "'Fraunces', serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#f5f0e8',
                  }}
                >
                  {t.zoneTitle}
                </span>
              </div>
              <p
                style={{
                  fontFamily: isKo ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  fontSize: 11,
                  color: 'rgba(245, 240, 232, 0.4)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
                dangerouslySetInnerHTML={{ __html: t.zoneDesc }}
              />
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
                  fontFamily: isKo ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 400,
                  color: 'rgba(245, 240, 232, 0.45)',
                  marginTop: 4,
                }}
              >
                {t.scoreLabel}
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
