import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import type { AxisScore, RequiredIngredient, FaceZone } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'de';

interface ScientificStandardCardProps {
  zone: FaceZone;
  axisScores: AxisScore[];
  requiredIngredients: RequiredIngredient[];
}

// ── Static maps ───────────────────────────────────────────────────────────────

const ZONE_META: Record<string, { ko: string; en: string; de: string; icon: string }> = {
  whole_face:     { ko: '전체 얼굴',    en: 'Full Face',     de: 'Gesamtes Gesicht',   icon: '◉' },
  t_zone:         { ko: 'T존',          en: 'T-Zone',        de: 'T-Zone',             icon: 'T' },
  forehead:       { ko: '이마',          en: 'Forehead',      de: 'Stirn',              icon: '↑' },
  nose:           { ko: '코',            en: 'Nose',          de: 'Nase',               icon: '▽' },
  cheeks:         { ko: '볼',            en: 'Cheeks',        de: 'Wangen',             icon: '◈' },
  chin:           { ko: '턱',            en: 'Chin',          de: 'Kinn',               icon: '▼' },
  jawline:        { ko: '턱선',          en: 'Jawline',       de: 'Kieferlinie',        icon: '⌣' },
  eye_area:       { ko: '눈가',          en: 'Eye Area',      de: 'Augenbereich',       icon: '◎' },
  spot_only:      { ko: '트러블 부위',   en: 'Spot Only',     de: 'Problemzonen',       icon: '●' },
  dry_areas_only: { ko: '건조 부위',     en: 'Dry Areas',     de: 'Trockene Stellen',   icon: '○' },
  oily_areas_only:{ ko: '유분 부위',     en: 'Oily Areas',    de: 'Fettige Stellen',    icon: '◆' },
};

const AXIS_META: Record<string, { ko: string; en: string; de: string; color: string }> = {
  sebum:           { ko: '피지',         en: 'Sebum',          de: 'Talg',              color: '#F59E0B' },
  hydration:       { ko: '수분',         en: 'Hydration',      de: 'Feuchtigkeit',      color: '#60A5FA' },
  pores:           { ko: '모공',         en: 'Pores',          de: 'Poren',             color: '#A78BFA' },
  texture:         { ko: '피부결',       en: 'Texture',        de: 'Textur',            color: '#34D399' },
  sensitivity:     { ko: '민감도',       en: 'Sensitivity',    de: 'Empfindlichkeit',   color: '#F87171' },
  aging:           { ko: '노화',         en: 'Aging',          de: 'Alterung',          color: 'hsl(var(--accent-gold))' },
  pigmentation:    { ko: '색소침착',     en: 'Pigmentation',   de: 'Pigmentierung',     color: '#818CF8' },
  barrier:         { ko: '장벽',         en: 'Barrier',        de: 'Barriere',          color: '#F0997B' },
  neurodermatitis: { ko: '신경성 피부염',en: 'Neurodermatitis',de: 'Neurodermitis',     color: '#EC4899' },
};

const SEVERITY_META: Record<string, { ko: string; en: string; de: string; color: string; bg: string }> = {
  mild:     { ko: '경미',       en: 'Mild',     de: 'Mild',     color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  moderate: { ko: '보통',       en: 'Moderate', de: 'Moderat',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  severe:   { ko: '심각',       en: 'Severe',   de: 'Schwer',   color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  extreme:  { ko: '매우 심각',  en: 'Extreme',  de: 'Extrem',   color: '#EF4444', bg: 'rgba(239,68,68,0.14)'   },
};

// Translate ingredient role strings (from product_db / axisIngredientMap)
const ROLE_META: Record<string, { ko: string; en: string; de: string }> = {
  exfoliant:            { ko: '각질 제거',   en: 'Exfoliant',      de: 'Exfoliant'      },
  sebum_control:        { ko: '피지 조절',   en: 'Sebum Control',  de: 'Talgkontrolle'  },
  hydration:            { ko: '보습',        en: 'Hydration',      de: 'Feuchtigkeit'   },
  soothing:             { ko: '진정',        en: 'Soothing',       de: 'Beruhigung'     },
  brightening:          { ko: '미백',        en: 'Brightening',    de: 'Aufhellung'     },
  barrier_repair:       { ko: '장벽 복구',   en: 'Barrier Repair', de: 'Barriererep.'   },
  anti_aging:           { ko: '노화 방지',   en: 'Anti-Aging',     de: 'Anti-Aging'     },
  pore_minimizing:      { ko: '모공 관리',   en: 'Pore Minimizing',de: 'Porenminimierung'},
  antioxidant:          { ko: '항산화',      en: 'Antioxidant',    de: 'Antioxidans'    },
  'sebum control':      { ko: '피지 조절',   en: 'Sebum Control',  de: 'Talgkontrolle'  },
};

const UI = {
  header:    { ko: '{zone} 분석 결과', en: '{zone} Analysis',          de: '{zone}-Analyse'                    },
  subheader: { ko: '이 부위에 필요한 성분:', en: 'Required ingredients for this zone:', de: 'Benötigte Inhaltsstoffe für diese Zone:' },
  must_have: { ko: '필수', en: 'Must have', de: 'Muss haben' },
  nice:      { ko: '권장', en: 'Nice to have', de: 'Empfohlen' },
  conc_min:  { ko: '최소 ', en: 'min ', de: 'mind. ' },
  hold_title:{ ko: '🛑 활성 성분 일시 중단', en: '🛑 Actives on hold', de: '🛑 Wirkstoffe pausiert' },
  hold_body: { ko: '현재 피부 상태에서는 모든 활성 성분을 중단하고 장벽 복구에 집중해야 합니다.', en: 'All active ingredients are on hold for this zone. Focus on barrier repair first.', de: 'Alle Wirkstoffe sind für diese Zone pausiert. Fokus auf Barrierereparatur.' },
  no_concerns:{ ko: '이 부위는 별도 처방이 필요하지 않습니다.', en: 'No specific concerns for this zone.', de: 'Keine besonderen Anforderungen für diese Zone.' },
  axis_label: { ko: '진단 축', en: 'Diagnosis axes', de: 'Diagnoseachsen' },
} as const;

function tUI(key: keyof typeof UI, lang: Lang, vars?: Record<string, string>): string {
  let str = UI[key][lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

function translateRole(role: string, lang: Lang): string {
  const found = ROLE_META[role.toLowerCase()] ?? ROLE_META[role];
  if (found) return found[lang];
  // Capitalise unknown roles
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AxisBar({
  axisScore, lang, isDark,
}: { axisScore: AxisScore; lang: Lang; isDark: boolean }) {
  const meta  = AXIS_META[axisScore.axis];
  const sev   = SEVERITY_META[axisScore.severity];
  if (!meta || !sev) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Axis label */}
      <span style={{
        width: 72, fontSize: 10, fontWeight: 600, color: meta.color,
        fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em', flexShrink: 0,
      }}>
        {meta[lang]}
      </span>

      {/* Progress track */}
      <div style={{
        flex: 1, height: 4, borderRadius: 2,
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${axisScore.score}%` }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', background: meta.color, borderRadius: 2 }}
        />
      </div>

      {/* Score */}
      <span style={{
        width: 24, fontSize: 10, textAlign: 'right', flexShrink: 0,
        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        fontFamily: "'DM Sans', monospace",
      }}>
        {axisScore.score}
      </span>

      {/* Severity pill */}
      <span style={{
        padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.06em', flexShrink: 0,
        color: sev.color, background: sev.bg,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {sev[lang]}
      </span>
    </div>
  );
}

function IngredientRow({
  ing, lang, isDark, index,
}: { ing: RequiredIngredient; lang: Lang; isDark: boolean; index: number }) {
  const isMustHave = ing.priority === 'must_have';
  const isHold     = ing.name_en === 'HOLD_ALL_ACTIVES';

  // HOLD_ALL_ACTIVES is handled at the card level — skip here
  if (isHold) return null;

  const displayName = lang === 'ko' && ing.name_kr ? ing.name_kr : ing.name_en;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: isDark
          ? (isMustHave ? 'rgba(200,169,81,0.06)' : 'rgba(255,255,255,0.03)')
          : (isMustHave ? 'rgba(200,169,81,0.07)' : 'rgba(0,0,0,0.02)'),
        border: `1px solid ${isDark
          ? (isMustHave ? 'rgba(200,169,81,0.2)' : 'rgba(255,255,255,0.06)')
          : (isMustHave ? 'rgba(200,169,81,0.25)' : 'rgba(0,0,0,0.06)')}`,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      {/* Row 1: priority indicator + name + concentration */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Priority indicator */}
        <span style={{
          fontSize: isMustHave ? 13 : 9,
          color: isMustHave ? 'hsl(var(--accent-gold))' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
          flexShrink: 0, lineHeight: 1,
        }}>
          {isMustHave ? '★' : '·'}
        </span>

        {/* Ingredient name */}
        <span style={{
          flex: 1, fontSize: 12, fontWeight: 600,
          color: isDark ? 'rgba(255,255,255,0.88)' : '#1a1a1a',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {displayName}
          {/* Show EN name in parentheses when viewing in KO/DE if different */}
          {lang !== 'en' && displayName !== ing.name_en && (
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 400,
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
            }}>
              {ing.name_en}
            </span>
          )}
        </span>

        {/* Concentration badge */}
        {ing.min_concentration !== null && (
          <span style={{
            flexShrink: 0, fontSize: 12, fontWeight: 700,
            color: 'hsl(var(--accent-gold))', fontFamily: "'DM Sans', monospace",
            letterSpacing: '-0.02em',
          }}>
            {tUI('conc_min', lang)}{ing.min_concentration}%
            {ing.max_concentration !== null && ing.max_concentration !== ing.min_concentration
              ? `–${ing.max_concentration}%`
              : ''}
          </span>
        )}
      </div>

      {/* Row 2: contraindication tags */}
      {ing.contraindicated_with.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 20 }}>
          {ing.contraindicated_with.map((c) => (
            <span key={c} style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 4,
              background: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.1)',
              color: isDark ? '#F87171' : '#B91C1C',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
            }}>
              ✕ {c}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScientificStandardCard({
  zone, axisScores, requiredIngredients,
}: ScientificStandardCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();
  const lang = (language as Lang) ?? 'en';

  const zoneMeta  = ZONE_META[zone] ?? ZONE_META.whole_face;
  const zoneLabel = zoneMeta[lang];

  const hasHoldFlag = requiredIngredients.some((i) => i.name_en === 'HOLD_ALL_ACTIVES');
  const visibleIngredients = requiredIngredients.filter((i) => i.name_en !== 'HOLD_ALL_ACTIVES');

  // Sort: must_have first, then nice_to_have
  const sorted = [
    ...visibleIngredients.filter((i) => i.priority === 'must_have'),
    ...visibleIngredients.filter((i) => i.priority === 'nice_to_have'),
  ];

  // Lab aesthetic: subtle horizontal rule lines for dark mode (blueprint feel)
  const CARD_BG    = isDark ? '#0D1B2A' : '#FFFFFF';
  const ACCENT     = isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.7)';
  const BORDER     = isDark ? 'rgba(96,165,250,0.18)' : 'rgba(147,197,253,0.4)';
  const LINE_COLOR = isDark ? 'rgba(96,165,250,0.04)' : 'rgba(191,219,254,0.6)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 14,
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(96,165,250,0.08)'
          : '0 2px 16px rgba(147,197,253,0.15)',
        // Blueprint horizontal lines (dark mode only)
        backgroundImage: isDark
          ? `repeating-linear-gradient(0deg, transparent, transparent 23px, ${LINE_COLOR} 23px, ${LINE_COLOR} 24px)`
          : 'none',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px 12px',
        background: ACCENT,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Zone icon badge */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(147,197,253,0.2)',
          border: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
          color: isDark ? '#93C5FD' : '#1D4ED8',
          fontFamily: "'DM Sans', monospace",
        }}>
          {zoneMeta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isDark ? 'rgba(147,197,253,0.6)' : 'rgba(29,78,216,0.6)',
            fontFamily: "'DM Sans', sans-serif", marginBottom: 3,
          }}>
            {/* Clinical chart label */}
            {lang === 'ko' ? '임상 분석' : lang === 'de' ? 'Klinische Analyse' : 'Clinical Analysis'}
          </div>
          <div style={{
            fontSize: 15, fontWeight: 700,
            color: isDark ? '#E0F2FE' : '#1D4ED8',
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.01em',
          }}>
            {tUI('header', lang, { zone: zoneLabel })}
          </div>
        </div>
      </div>

      {/* ── Axis bars ──────────────────────────────────────────────────────── */}
      {axisScores.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${BORDER}`,
          background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(248,250,252,0.8)',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: isDark ? 'rgba(147,197,253,0.5)' : 'rgba(29,78,216,0.45)',
            fontFamily: "'DM Sans', sans-serif", marginBottom: 8,
          }}>
            {tUI('axis_label', lang)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {axisScores.map((a) => (
              <AxisBar key={a.axis} axisScore={a} lang={lang} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {/* ── Ingredients section ────────────────────────────────────────────── */}
      <div style={{ padding: '14px 20px 18px' }}>
        {/* HOLD banner */}
        {hasHoldFlag && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(254,226,226,0.8)',
              border: '1px solid rgba(248,113,113,0.3)',
              fontSize: 12, lineHeight: 1.5,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div style={{ fontWeight: 700, color: isDark ? '#F87171' : '#B91C1C', marginBottom: 2 }}>
              {tUI('hold_title', lang)}
            </div>
            <div style={{ color: isDark ? 'rgba(248,113,113,0.8)' : '#7F1D1D' }}>
              {tUI('hold_body', lang)}
            </div>
          </motion.div>
        )}

        {/* Subheader */}
        {sorted.length > 0 && (
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
            color: isDark ? 'rgba(147,197,253,0.6)' : 'rgba(29,78,216,0.55)',
            fontFamily: "'DM Sans', sans-serif", marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            {tUI('subheader', lang)}
          </div>
        )}

        {/* Legend */}
        {sorted.length > 0 && (
          <div style={{
            display: 'flex', gap: 12, marginBottom: 10,
            fontSize: 10, fontFamily: "'DM Sans', sans-serif",
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
          }}>
            <span>★ {tUI('must_have', lang)}</span>
            <span>· {tUI('nice', lang)}</span>
          </div>
        )}

        {/* Ingredient rows */}
        {sorted.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sorted.map((ing, idx) => (
              <IngredientRow
                key={ing.name_en}
                ing={ing}
                lang={lang}
                isDark={isDark}
                index={idx}
              />
            ))}
          </div>
        ) : !hasHoldFlag && (
          <div style={{
            textAlign: 'center', fontSize: 12,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
            fontFamily: "'DM Sans', sans-serif", padding: '8px 0',
          }}>
            {tUI('no_concerns', lang)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
