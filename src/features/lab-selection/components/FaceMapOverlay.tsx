/**
 * FaceMapOverlay.tsx
 *
 * Zone navigation panel with severity summaries and selected product badges.
 * Used as sticky navigation panel within ZoneLabFlow.
 *
 * Issue 3 fix: Removed broken SVG schematic circles.
 * Enhanced zone list with severity summary per zone.
 */

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useLabSelectionStore } from '../store/useLabSelectionStore';
import { useI18nStore } from '@/store/i18nStore';
import { FaceZone, Product } from '../types';
import { ZONE_COLORS } from '../data/textureRules';

// ── Labels ────────────────────────────────────────────────────────────────────

const ZONE_LABEL: Record<string, { ko: string; en: string; de: string }> = {
  forehead: { ko: '이마', en: 'Forehead', de: 'Stirn' },
  eye_area: { ko: '눈가', en: 'Eye Area', de: 'Augenpartie' },
  nose: { ko: '코', en: 'Nose', de: 'Nase' },
  cheeks: { ko: '볼', en: 'Cheeks', de: 'Wangen' },
  chin: { ko: '턱', en: 'Chin', de: 'Kinn' },
  jawline: { ko: '턱선', en: 'Jawline', de: 'Kiefer' },
  t_zone: { ko: 'T존', en: 'T-Zone', de: 'T-Zone' },
  whole_face: { ko: '전체', en: 'All', de: 'Gesamt' },
};

const AXIS_LABEL: Record<string, { ko: string; en: string; de: string }> = {
  sebum: { ko: '피지', en: 'Sebum', de: 'Talg' },
  hydration: { ko: '수분', en: 'Hydration', de: 'Feuchtigkeit' },
  pores: { ko: '모공', en: 'Pores', de: 'Poren' },
  texture: { ko: '피부결', en: 'Texture', de: 'Textur' },
  sensitivity: { ko: '민감도', en: 'Sensitivity', de: 'Empfindlichkeit' },
  aging: { ko: '노화', en: 'Aging', de: 'Alterung' },
  pigmentation: { ko: '색소침착', en: 'Pigmentation', de: 'Pigmentierung' },
  barrier: { ko: '장벽', en: 'Barrier', de: 'Barriere' },
  neurodermatitis: { ko: '신경성 피부염', en: 'Neurodermatitis', de: 'Neurodermitis' },
};

const SEVERITY_LABEL: Record<string, { ko: string; en: string; de: string; color: string }> = {
  mild: { ko: '경미', en: 'mild', de: 'mild', color: '#34D399' },
  moderate: { ko: '보통', en: 'moderate', de: 'moderat', color: '#F59E0B' },
  severe: { ko: '심각', en: 'severe', de: 'schwer', color: '#F87171' },
  extreme: { ko: '매우 심각', en: 'extreme', de: 'extrem', color: '#EF4444' },
};

const NO_CONCERNS_LABEL = {
  ko: '관리 불필요',
  en: 'No concerns',
  de: 'Keine Auffälligkeiten',
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FaceMapOverlayProps {
  /** Zones present in this session (from zoneDiagnoses) */
  zones: FaceZone[];
  /** Currently focused zone in ZoneLabFlow */
  activeZone: FaceZone | null;
  onZoneClick: (zone: FaceZone) => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProductBadge({ product, language }: { product: Product; language: string }) {
  const name =
    language === 'ko' ? product.name_kr
      : language === 'de' ? product.name_de
        : product.name_en;

  return (
    <div
      style={{
        background: 'rgba(201,169,110,0.18)',
        border: '1px solid rgba(201,169,110,0.55)',
        borderRadius: 6,
        padding: '2px 6px',
        fontSize: 9,
        color: 'hsl(var(--accent-gold))',
        maxWidth: 90,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        fontFamily: 'var(--font-sans)',
      }}
      title={name}
    >
      ✓ {name}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FaceMapOverlay({ zones, activeZone, onZoneClick }: FaceMapOverlayProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();
  const lang = language as 'ko' | 'en' | 'de';

  const { selectedProducts, zoneDiagnoses } = useLabSelectionStore();

  const getLabel = (zone: FaceZone) => {
    const l = ZONE_LABEL[zone];
    if (!l) return zone;
    return lang === 'ko' ? l.ko : lang === 'de' ? l.de : l.en;
  };

  /** Build severity summary string for a zone, e.g. "피부결 심각 · 모공 보통" */
  const getSeveritySummary = (zone: FaceZone): { text: string; hasAnyConcern: boolean } => {
    const zd = zoneDiagnoses.find((d) => d.zone === zone);
    if (!zd) return { text: '', hasAnyConcern: false };

    // Filter axes with severity >= moderate (skip mild — too noisy for summary)
    const notable = zd.axis_scores
      .filter((a) => a.severity === 'moderate' || a.severity === 'severe' || a.severity === 'extreme')
      .sort((a, b) => b.score - a.score) // highest severity first
      .slice(0, 2); // show top 2 to keep it compact

    if (notable.length === 0) {
      return { text: '', hasAnyConcern: zd.axis_scores.some((a) => a.score >= 10) };
    }

    const parts = notable.map((a) => {
      const axisL = AXIS_LABEL[a.axis];
      const sevL = SEVERITY_LABEL[a.severity];
      const axisName = axisL ? axisL[lang] : a.axis;
      const sevName = sevL ? sevL[lang] : a.severity;
      return `${axisName} ${sevName}`;
    });

    return { text: parts.join(' · '), hasAnyConcern: true };
  };

  return (
    <div
      style={{
        width: 210,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'hsl(var(--accent-gold))',
          marginBottom: 10,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {lang === 'ko' ? '부위별 분석' : lang === 'de' ? 'Zonenübersicht' : 'Zone Overview'}
      </div>

      {/* Zone list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {zones.map((zone) => {
          const colors = ZONE_COLORS[zone] ?? ZONE_COLORS.whole_face;
          const color = isDark ? colors.dark : colors.light;
          const isActive = zone === activeZone;
          const sel = selectedProducts.get(zone);
          const { text: sevText, hasAnyConcern } = getSeveritySummary(zone);
          const isGrayedOut = !hasAnyConcern && !sel;

          return (
            <motion.button
              key={zone}
              onClick={() => onZoneClick(zone)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 10,
                border: isActive
                  ? `1.5px solid ${colors.light}`
                  : sel
                    ? '1px solid rgba(93,202,165,0.35)'
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                background: isActive
                  ? isDark
                    ? `${color}22`
                    : `${colors.light}18`
                  : sel
                    ? isDark ? 'rgba(93,202,165,0.06)' : 'rgba(93,202,165,0.04)'
                    : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'border 0.15s, background 0.15s',
                opacity: isGrayedOut ? 0.45 : 1,
              }}
            >
              {/* Color swatch */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isGrayedOut
                    ? isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
                    : colors.light,
                  flexShrink: 0,
                  boxShadow: isActive ? `0 0 6px ${colors.light}` : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Zone name */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    color: isDark
                      ? isActive ? '#f5f0e8' : 'rgba(245,240,232,0.7)'
                      : isActive ? '#1a1a2e' : 'rgba(26,26,46,0.6)',
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {getLabel(zone)}
                </div>

                {/* Severity summary subtitle */}
                {sevText && (
                  <div
                    style={{
                      fontSize: 9,
                      color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.4)',
                      marginTop: 2,
                      lineHeight: 1.3,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {sevText}
                  </div>
                )}

                {/* "No concerns" badge for grayed-out zones */}
                {isGrayedOut && (
                  <div
                    style={{
                      fontSize: 8,
                      color: isDark ? 'rgba(245,240,232,0.3)' : 'rgba(26,26,46,0.3)',
                      marginTop: 2,
                      fontFamily: 'var(--font-sans)',
                      fontStyle: 'italic',
                    }}
                  >
                    {NO_CONCERNS_LABEL[lang]}
                  </div>
                )}

                {/* Product badge if selected */}
                {sel && (
                  <div style={{ marginTop: 3 }}>
                    <ProductBadge product={sel.product} language={language} />
                  </div>
                )}
              </div>

              {/* Checkmark if selected */}
              {sel && (
                <span style={{ fontSize: 11, color: '#5DCAA5', flexShrink: 0 }}>✓</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
