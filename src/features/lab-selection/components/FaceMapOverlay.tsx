/**
 * FaceMapOverlay.tsx
 *
 * Interactive face map schematic showing zone overlays and selected product badges.
 * Used as sticky navigation panel within ZoneLabFlow.
 */

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useLabSelectionStore } from '../store/useLabSelectionStore';
import { useI18nStore } from '@/store/i18nStore';
import { FaceZone, Product } from '../types';
import { ZONE_COLORS } from '../data/textureRules';

// ── Zone geometry (coordinate space: 240×320) ────────────────────────────────

interface ZoneGeometry {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  labelX: number;
  labelY: number;
}

const ZONE_GEOMETRY: Partial<Record<FaceZone, ZoneGeometry>> = {
  forehead:   { cx: 120, cy:  60, rx: 75, ry: 38, labelX: 120, labelY:  58 },
  eye_area:   { cx: 120, cy: 105, rx: 70, ry: 18, labelX: 120, labelY: 105 },
  nose:       { cx: 120, cy: 155, rx: 28, ry: 32, labelX: 120, labelY: 155 },
  cheeks:     { cx: 120, cy: 155, rx: 90, ry: 45, labelX: 120, labelY: 200 },
  chin:       { cx: 120, cy: 240, rx: 42, ry: 28, labelX: 120, labelY: 240 },
  jawline:    { cx: 120, cy: 265, rx: 70, ry: 22, labelX: 120, labelY: 265 },
  t_zone:     { cx: 120, cy: 100, rx: 28, ry: 90, labelX: 120, labelY: 100 },
  whole_face: { cx: 120, cy: 155, rx: 100, ry: 140, labelX: 120, labelY: 155 },
};

const ZONE_LABEL: Record<string, { ko: string; en: string; de: string }> = {
  forehead:   { ko: '이마',    en: 'Forehead', de: 'Stirn' },
  eye_area:   { ko: '눈가',    en: 'Eye Area', de: 'Augenpartie' },
  nose:       { ko: '코',      en: 'Nose',     de: 'Nase' },
  cheeks:     { ko: '볼',      en: 'Cheeks',   de: 'Wangen' },
  chin:       { ko: '턱',      en: 'Chin',     de: 'Kinn' },
  jawline:    { ko: '턱선',    en: 'Jawline',  de: 'Kiefer' },
  t_zone:     { ko: 'T존',     en: 'T-Zone',   de: 'T-Zone' },
  whole_face: { ko: '전체',    en: 'All',      de: 'Gesamt' },
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

  const { selectedProducts } = useLabSelectionStore();

  const getLabel = (zone: FaceZone) => {
    const l = ZONE_LABEL[zone];
    if (!l) return zone;
    return language === 'ko' ? l.ko : language === 'de' ? l.de : l.en;
  };

  return (
    <div
      style={{
        width: 200,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Zone legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {zones.map((zone) => {
          const colors = ZONE_COLORS[zone] ?? ZONE_COLORS.whole_face;
          const color = isDark ? colors.dark : colors.light;
          const isActive = zone === activeZone;
          const sel = selectedProducts.get(zone);

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
                padding: '7px 10px',
                borderRadius: 10,
                border: isActive
                  ? `1.5px solid ${colors.light}`
                  : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                background: isActive
                  ? isDark
                    ? `${color}22`
                    : `${colors.light}18`
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'border 0.15s, background 0.15s',
              }}
            >
              {/* Color swatch */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: colors.light,
                  flexShrink: 0,
                  boxShadow: isActive ? `0 0 6px ${colors.light}` : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    color: isDark
                      ? isActive ? '#f5f0e8' : 'rgba(245,240,232,0.6)'
                      : isActive ? '#1a1a2e' : 'rgba(26,26,46,0.55)',
                    lineHeight: 1.2,
                  }}
                >
                  {getLabel(zone)}
                </div>

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

      {/* SVG schematic face — decorative */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <svg
          width={160}
          height={220}
          viewBox="0 0 240 320"
          style={{ opacity: 0.5 }}
          aria-hidden
        >
          {/* Face outline */}
          <ellipse
            cx={120} cy={160}
            rx={102} ry={140}
            fill="none"
            stroke={isDark ? 'rgba(245,240,232,0.18)' : 'rgba(26,26,46,0.15)'}
            strokeWidth={1.5}
          />

          {/* Zone overlays — only for zones present in this session */}
          {zones.map((zone) => {
            const geo = ZONE_GEOMETRY[zone];
            if (!geo) return null;
            const colors = ZONE_COLORS[zone] ?? ZONE_COLORS.whole_face;
            const isActive = zone === activeZone;
            const hasProduct = selectedProducts.has(zone);

            return (
              <ellipse
                key={zone}
                cx={geo.cx} cy={geo.cy}
                rx={geo.rx} ry={geo.ry}
                fill={colors.light}
                fillOpacity={hasProduct ? 0.35 : isActive ? 0.2 : 0.1}
                stroke={colors.light}
                strokeOpacity={isActive ? 0.7 : 0.3}
                strokeWidth={isActive ? 1.5 : 0.8}
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s' }}
                onClick={() => onZoneClick(zone)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
