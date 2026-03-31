/**
 * SlideLabSpecialCare.tsx — Slide 1: Zone Care Redesign
 *
 * Layout (per SLIDE-1-ZONE-CARE-BRIEF.md):
 *   1. Header: eyebrow + benefit title + dynamic desc + 3 summary boxes
 *   2. NEEDS ATTENTION: severity-sorted zone cards (score ≥ 30) with inline K vs G accordion
 *   3. MANAGED BY BASIC ROUTINE: muted zone pills (score < 30)
 *   4. Education card "왜 부위별 케어가 필요한가요?"
 *
 * No FaceMapOverlay. No modal. All comparison inline.
 */

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { useAnalysisStore } from '@/store/analysisStore';
import { useTheme } from 'next-themes';
import { tokens } from '@/lib/designTokens';
import DuelCard from '@/features/lab-selection/components/DuelCard';
import type { FaceZone, ZoneAssessment, Product, PriceTier, RequiredIngredient } from '@/features/lab-selection/types';
import type { AnalysisResult, AxisKey } from '@/engine/types';
import { CONCERN_TO_AXIS } from '@/engine/faceMapInference';
import { AXIS_INGREDIENT_MAP } from '@/features/lab-selection/data/axisIngredientMap';
import { scoreToSeverity } from '@/features/lab-selection/types';
import type { SelectedZones } from '@/store/analysisStore';

// ── Types & maps ───────────────────────────────────────────────────────────────

type AssessmentAxis = 'sebum' | 'hydration' | 'barrier' | 'sensitivity' | 'pores' | 'pigmentation' | 'aging' | 'texture';
type LangKey = 'en' | 'de' | 'ko';

const ENGINE_TO_LAB_AXIS: Partial<Record<AxisKey, AssessmentAxis>> = {
  seb: 'sebum', hyd: 'hydration', bar: 'barrier', sen: 'sensitivity',
  acne: 'pores', pigment: 'pigmentation', aging: 'aging', texture: 'texture',
};

const ZONE_ID_MAP: Record<string, FaceZone> = {
  forehead: 'forehead', eyes: 'eye_area', nose: 'nose',
  cheeks: 'cheeks', mouth: 'mouth', jawline: 'jawline', neck: 'neck',
};

const ZONE_LABELS: Record<string, { en: string; de: string; ko: string }> = {
  forehead: { en: 'Forehead', de: 'Stirn', ko: '이마' },
  eye_area: { en: 'Eye Area', de: 'Augenpartie', ko: '눈가' },
  nose: { en: 'Nose', de: 'Nase', ko: '코' },
  cheeks: { en: 'Cheeks', de: 'Wangen', ko: '볼' },
  mouth: { en: 'Mouth', de: 'Mund', ko: '입가' },
  jawline: { en: 'Jawline', de: 'Kiefer', ko: '턱선' },
  neck: { en: 'Neck', de: 'Hals', ko: '목' },
  whole_face: { en: 'Face', de: 'Gesicht', ko: '얼굴' },
};

const CONCERN_AXIS_MAP: Record<string, AxisKey> = {
  oiliness: 'seb', dryness: 'hyd', barrier: 'bar', sensitivity: 'sen',
  acne: 'acne', breakouts: 'acne', pigment: 'pigment', dark_spots: 'pigment',
  texture: 'texture', aging: 'aging', wrinkles: 'aging', uv_damage: 'ox',
};

// ── i18n ───────────────────────────────────────────────────────────────────────

const C = {
  zone_eyebrow: { ko: '존 케어', de: 'ZONEN-PFLEGE', en: 'ZONE CARE' },
  zone_title: { ko: '이 부위에 집중하면 빠르게 개선돼요', de: 'Fokus auf diese Bereiche beschleunigt Ergebnisse', en: 'Focus here for faster results' },
  zone_desc: { ko: '기본 루틴은 전체 피부를 관리하지만, {zone} 부위는 추가 성분이 필요해요.', de: 'Ihre Basis-Routine pflegt die gesamte Haut, aber {zone} braucht spezielle Wirkstoffe.', en: 'Your basic routine covers overall skin, but {zone} needs specialized ingredients.' },
  zone_urgent: { ko: '긴급 관리 필요', de: 'Dringend', en: 'Urgent care' },
  zone_moderate: { ko: '보통 관리', de: 'Moderate Pflege', en: 'Moderate care' },
  zone_sufficient: { ko: '충분', de: 'Ausreichend', en: 'Sufficient' },
  needs_attention: { ko: '집중 관리 필요', de: 'AUFMERKSAMKEIT NÖTIG', en: 'NEEDS ATTENTION' },
  moderate_header: { ko: '보통 관리', de: 'MODERAT', en: 'MODERATE' },
  zone_needs: { ko: '필요: {ingredients}', de: 'Benötigt: {ingredients}', en: 'Needs: {ingredients}' },
  zone_status_urgent: { ko: '기본 루틴에 없는 성분 — 추가 필요', de: 'Nicht in Basis-Routine — Ergänzung nötig', en: 'Not in basic routine — needs addition' },
  zone_status_mod: { ko: '기본 루틴으로 부분 관리 — 강화 추천', de: 'Teilweise abgedeckt — Verstärkung empfohlen', en: 'Partially covered — boost recommended' },
  add_button: { ko: '+ 추가', de: '+ Hinzufügen', en: '+ Add' },
  collapse: { ko: '접기', de: 'Zuklappen', en: 'Collapse' },
  managed_title: { ko: '기본 루틴으로 관리됨', de: 'Durch Basis-Routine abgedeckt', en: 'MANAGED BY BASIC ROUTINE' },
  managed_desc: { ko: '이 부위들은 기본 루틴으로 충분히 관리되고 있어요. 추가 제품이 필요하지 않습니다.', de: 'Diese Bereiche werden ausreichend durch Ihre Basisroutine abgedeckt. Keine zusätzlichen Produkte nötig.', en: 'These zones are sufficiently covered by your basic routine. No additional products needed.' },
  managed_safe: { ko: '{N}곳 안전 — 기본 루틴으로 충분', de: '{N} Zonen sicher — Basis-Routine reicht', en: '{N} zones safe — basic routine sufficient' },
  why_zone_title: { ko: '왜 부위별 케어가 필요한가요?', de: 'Warum braucht jede Zone eigene Pflege?', en: 'Why does each zone need its own care?' },
  why_zone_body: { ko: '얼굴의 각 부위는 피지선 밀도, 피부 두께, 자외선 노출량이 다릅니다. 이마의 피지선이 가장 많아서(단위면적당), 눈가는 피부가 가장 얇아서(0.5mm), 한 가지 제품으로는 모든 부위를 최적으로 관리할 수 없습니다.', de: 'Jeder Gesichtsbereich hat unterschiedliche Talgdrüsendichte, Hautdicke und UV-Exposition. Stirn hat die dichteste Talgdrüsenverteilung, Augenpartie hat die dünnste Haut (0,5 mm) — ein einziges Produkt kann nicht alle Bereiche optimal versorgen.', en: 'Each facial area has different sebaceous gland density, skin thickness, and UV exposure. The forehead has the highest gland density, the eye area the thinnest skin (0.5mm) — one product cannot optimally serve all zones.' },
  why_zone_source: { ko: 'Source: Journal of Dermatological Science · axisIngredientMap.ts 기반', de: 'Quelle: Journal of Dermatological Science', en: 'Source: Journal of Dermatological Science · axisIngredientMap.ts' },
  barrier_emergency_warning: {
    ko: '장벽 응급 상태에서는 추가 제품을 권장하지 않습니다. 먼저 2주간 장벽 회복 루틴 단계를 따라주세요.',
    de: 'Keine zusätzlichen Produkte bei Barriere-Notfall empfohlen. Zuerst 2-Wochen-Routine-Schritte befolgen.',
    en: 'Additional products not recommended during barrier emergency. Follow the 2-week barrier recovery routine steps first.',
  },
  barrier_view_routine: {
    ko: '내 루틴에서 확인하기 →',
    de: 'Meine Routine ansehen →',
    en: 'View My Routine →',
  },
} as const;

function tx(key: keyof typeof C, lang: LangKey, vars?: Record<string, string | number>): string {
  const entry = C[key];
  let s: string = entry[lang] ?? entry.en;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
}

// ── Severity helpers ───────────────────────────────────────────────────────────

function severityColor(score: number): string {
  if (score >= 70) return '#E24B4A';
  if (score >= 30) return '#BA7517';
  return '#86868B';
}

// ── Bridge: analysisResult → ZoneAssessment[] (same as original) ───────────────

function computeZoneAxisScores(
  zoneConcerns: string[],
  concernSeverity: Record<string, 1 | 2 | 3>,
): Array<{ axis: AssessmentAxis; score: number; severity: ReturnType<typeof scoreToSeverity> }> {
  const scores: Partial<Record<AssessmentAxis, number>> = {};
  for (const concernId of zoneConcerns) {
    const engineAxis = CONCERN_TO_AXIS[concernId];
    if (!engineAxis) continue;
    const labAxis = ENGINE_TO_LAB_AXIS[engineAxis];
    if (!labAxis) continue;
    const sev = concernSeverity[concernId] ?? 1;
    scores[labAxis] = Math.min(100, Math.round((scores[labAxis] ?? 0) + (sev / 3) * 100));
  }
  return Object.entries(scores).map(([axis, score]) => ({
    axis: axis as AssessmentAxis, score, severity: scoreToSeverity(score),
  }));
}

function inferProfile(axisScores: Array<{ axis: AssessmentAxis; score: number }>) {
  const m = Object.fromEntries(axisScores.map(a => [a.axis, a.score]));
  const s = (k: string) => m[k] ?? 0;
  if (s('sebum') >= 60 || s('pores') >= 60) return 'oily_acne' as const;
  if (s('barrier') >= 60 && s('hydration') >= 50) return 'dry_barrier' as const;
  if (s('sensitivity') >= 55) return 'sensitive' as const;
  if (s('aging') >= 55) return 'aging_elasticity' as const;
  if (s('pigmentation') >= 55) return 'pigmentation' as const;
  if (s('barrier') >= 45) return 'dry_barrier' as const;
  return 'combination' as const;
}

function computeRequiredIngredients(zoneAxisScores: Array<{ axis: AssessmentAxis; score: number; severity: string }>): RequiredIngredient[] {
  const map = new Map<string, RequiredIngredient>();
  for (const { axis, score, severity } of zoneAxisScores) {
    if (score <= 0) continue;
    const ings = AXIS_INGREDIENT_MAP[axis]?.[severity as 'extreme' | 'severe' | 'moderate'] ?? [];
    for (const ing of ings) {
      if (!map.has(ing.name_en)) map.set(ing.name_en, ing);
    }
  }
  return Array.from(map.values());
}

function analysisToZoneAssessments(result: AnalysisResult, selectedZones: SelectedZones): ZoneAssessment[] {
  const globalAxisScores = (Object.entries(result.axis_scores ?? {}) as [AxisKey, number][])
    .filter(([k]) => ENGINE_TO_LAB_AXIS[k] !== undefined)
    .map(([k, score]) => ({
      axis: ENGINE_TO_LAB_AXIS[k]!,
      score: Math.round(score),
      severity: scoreToSeverity(Math.round(score)),
    }));

  const heatmap = result.zone_heatmap;
  if (heatmap && Object.keys(heatmap).length > 0) {
    const out: ZoneAssessment[] = [];
    for (const [zoneId, entry] of Object.entries(heatmap)) {
      if (!entry) continue;
      const faceZone = ZONE_ID_MAP[zoneId];
      if (!faceZone) continue;
      let scaledScores = globalAxisScores.map(a => ({ ...a, score: 0, severity: scoreToSeverity(0) }));
      const zoneData = selectedZones[zoneId];
      if (zoneData?.concerns?.length) {
        const computed = computeZoneAxisScores(zoneData.concerns, zoneData.severity ?? {});
        scaledScores = scaledScores.map(a => {
          const found = computed.find(c => c.axis === a.axis);
          return found ? found : a;
        });
      } else {
        scaledScores = globalAxisScores.map(a => ({ ...a }));
      }
      const dominantLabAxis = ENGINE_TO_LAB_AXIS[entry.dominantAxis];
      const withDominant = scaledScores.map(a =>
        dominantLabAxis && a.axis === dominantLabAxis
          ? { ...a, score: Math.min(100, a.score + 15), severity: scoreToSeverity(Math.min(100, a.score + 15)) }
          : a
      );
      out.push({
        zone: faceZone,
        axis_scores: withDominant,
        matched_profile: inferProfile(withDominant),
        required_ingredients: computeRequiredIngredients(withDominant),
      });
    }
    if (out.length > 0) return out;
  }
  return [{
    zone: 'whole_face',
    axis_scores: globalAxisScores,
    matched_profile: inferProfile(globalAxisScores),
    required_ingredients: computeRequiredIngredients(globalAxisScores),
  }];
}

// ── Zone data type ─────────────────────────────────────────────────────────────

interface ZoneData {
  faceZone: FaceZone;
  zoneId: string;
  severity: number;
  assessment: ZoneAssessment | null;
}

// ── Circular score ring ────────────────────────────────────────────────────────

function CircularScore({ score, size = 52 }: { score: number; size?: number }) {
  const healthScore = 100 - score; // score is raw severity from engine
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, healthScore)) / 100);
  const color = severityColor(score); // color follows severity (red = urgent)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0, overflow: 'visible' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} opacity={0.15} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.28} fontWeight={700} fill={color}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {Math.round(healthScore)}
      </text>
    </svg>
  );
}

// ── Zone card (collapsed + inline accordion) ────────────────────────────────────

interface ZoneCardProps {
  zd: ZoneData;
  lang: LangKey;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
  isExpanded: boolean;
  onToggle: () => void;
  selectedProduct: Product | null;
  onProductSelect: (zone: FaceZone, product: Product, tier: PriceTier) => void;
}

const ZoneCard = memo(function ZoneCard({
  zd, lang, isDark, tok, isExpanded, onToggle, selectedProduct, onProductSelect,
}: ZoneCardProps) {
  const { faceZone, severity, assessment } = zd;
  const color = severityColor(severity);
  const label = ZONE_LABELS[faceZone]?.[lang] ?? faceZone;
  const reqIngNames = assessment?.required_ingredients
    .filter(i => i.name_en !== 'HOLD_ALL_ACTIVES')
    .slice(0, 3)
    .map(i => i[lang === 'ko' ? 'name_kr' : 'name_en'] as string)
    .join(' + ') ?? '';

  const statusText = severity >= 70
    ? tx('zone_status_urgent', lang)
    : tx('zone_status_mod', lang);

  return (
    <motion.div layout
      style={{
        borderRadius: 12,
        background: isDark ? 'rgba(28,28,30,0.55)' : 'rgba(255,255,255,0.72)',
        border: `1px solid ${isExpanded ? color + '33' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(94,139,104,0.08)')}`,
        backdropFilter: 'blur(20px) saturate(1.2)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Collapsed header */}
      <div style={{
        padding: 'clamp(14px, 2.5vw, 18px)',
        display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.5vw, 14px)',
      }}>
        {/* Score ring */}
        <CircularScore score={severity} size={48} />

        {/* Zone info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 600,
            color: tok.text, margin: 0,
          }}>{label}</p>
          {reqIngNames && (
            <p style={{
              fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.textSecondary,
              margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
            }}>
              {tx('zone_needs', lang, { ingredients: reqIngNames })}
            </p>
          )}
          <p style={{
            fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)', color, margin: '2px 0 0', fontWeight: 500,
          }}>{statusText}</p>
        </div>

        {/* Add / Collapse button */}
        {selectedProduct && !isExpanded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#4A9E68' }}>✓</span>
            <button onClick={onToggle} style={{
              fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 600,
              padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(74,158,104,0.3)',
              background: 'rgba(74,158,104,0.08)', color: '#4A9E68', cursor: 'pointer',
              minHeight: 48,
            }}>
              {tx('collapse', lang)}
            </button>
          </div>
        ) : (
          <button onClick={onToggle} style={{
            fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 600,
            padding: '6px 14px', borderRadius: 8, flexShrink: 0,
            background: isExpanded
              ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
              : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            color: isExpanded ? tok.textTertiary : tok.textSecondary,
            cursor: 'pointer', minHeight: 48,
          }}>
            {isExpanded ? tx('collapse', lang) : tx('add_button', lang)}
          </button>
        )}
      </div>

      {/* Inline accordion: DuelCard */}
      <AnimatePresence>
        {isExpanded && assessment && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.3 }, opacity: { duration: 0.25, delay: 0.05 } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } } }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              padding: '0 clamp(14px, 2.5vw, 18px) clamp(14px, 2.5vw, 18px)',
            }}>
              {/* Education: ingredient explanations */}
              {assessment.required_ingredients.length > 0 && (
                <div style={{ paddingTop: 12, marginBottom: 12 }}>
                  <p style={{
                    fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary,
                    lineHeight: 1.6, margin: 0,
                    wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
                  }}>
                    {assessment.required_ingredients
                      .filter(i => i.name_en !== 'HOLD_ALL_ACTIVES')
                      .slice(0, 3)
                      .map(i => {
                        /* eslint-disable @typescript-eslint/no-explicit-any */
                        const desc = lang === 'ko'
                          ? (i as any).description_ko
                          : lang === 'de'
                            ? (i as any).description_de
                            : (i as any).description_en;
                        /* eslint-enable @typescript-eslint/no-explicit-any */
                        return desc as string | undefined;
                      })
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              )}

              {/* Required ingredients as chips */}
              {assessment.required_ingredients.filter(i => i.name_en !== 'HOLD_ALL_ACTIVES').length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {assessment.required_ingredients
                    .filter(i => i.name_en !== 'HOLD_ALL_ACTIVES')
                    .slice(0, 6)
                    .map(ing => (
                      <span key={ing.name_en} style={{
                        fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)',
                        padding: '4px 10px', borderRadius: 99,
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        color: isDark ? '#86868B' : '#6B7280',
                      }}>
                        {ing.name_en}
                      </span>
                    ))}
                </div>
              )}

              {/* Product selection heading */}
              <p style={{
                fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                marginBottom: 4,
              }}>
                {`── ${label} ${tx('add_button', lang).replace('+ ', '')} ──`}
              </p>

              {/* DuelCard */}
              <DuelCard
                zone={faceZone}
                matchedProfile={assessment.matched_profile}
                requiredIngredients={assessment.required_ingredients}
                onProductSelect={onProductSelect}
                selectedProductId={selectedProduct?.id ?? null}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{
        fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)', fontWeight: 700,
        letterSpacing: '0.15em', textTransform: 'uppercase', color,
        padding: '3px 10px', borderRadius: 99,
        background: color + '15', border: `1px solid ${color}30`,
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: color + '20' }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface SlideLabSpecialCareProps {
  result: AnalysisResult;
  onSpecialCareUpdate?: (picks: { zone: FaceZone; product: Product }[]) => void;
  onGoToMacro?: () => void;
}

const SlideLabSpecialCare = memo(function SlideLabSpecialCare({
  result,
  onSpecialCareUpdate,
  onGoToMacro,
}: SlideLabSpecialCareProps) {
  const { language } = useI18nStore();
  const lang = (['ko', 'de'] as LangKey[]).includes(language as LangKey) ? language as LangKey : 'en';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);

  const selectedZones = useAnalysisStore(s => s.selectedZones);
  const storePicks = useAnalysisStore(s => s.specialCarePicks);
  const setStorePick = useAnalysisStore(s => s.setSpecialCarePick);

  const isBarrierEmergency = result.active_flags?.includes('BARRIER_EMERGENCY') ?? false;

  // ── Zone assessment (bridge logic) ──────────────────────────────────────────
  const zoneDiagnoses = useMemo(
    () => analysisToZoneAssessments(result, selectedZones),
    [result, selectedZones],
  );

  // ── Zone severity scores (same pipeline as SlideMacroDashboard teaser) ──────
  const zoneDataList = useMemo<ZoneData[]>(() => {
    const heatmap = result.zone_heatmap;
    let items: Array<{ faceZone: FaceZone; zoneId: string; severity: number }>;

    if (heatmap && Object.keys(heatmap).length > 0) {
      items = Object.entries(heatmap)
        .map(([zoneId, entry]) => {
          const faceZone = ZONE_ID_MAP[zoneId];
          if (!faceZone || !entry) return null;
          return { faceZone, zoneId, severity: entry.intensity * 100 };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
    } else {
      // Fallback via selectedZones + axis scores
      items = Object.entries(selectedZones ?? {}).map(([zoneId, zone]) => {
        const faceZone = ZONE_ID_MAP[zoneId];
        if (!faceZone) return null;
        if (!zone?.concerns?.length) return { faceZone, zoneId, severity: 0 };
        const axes = zone.concerns.map(c => CONCERN_AXIS_MAP[c]).filter(Boolean) as AxisKey[];
        const severity = axes.length > 0
          ? Math.max(...axes.map(a => result.axis_scores[a] ?? 0))
          : 50;
        return { faceZone, zoneId, severity };
      }).filter((x): x is NonNullable<typeof x> => x !== null);
    }

    return items
      .map(({ faceZone, zoneId, severity }) => ({
        faceZone,
        zoneId,
        severity,
        assessment: zoneDiagnoses.find(d => d.zone === faceZone) ?? null,
      }))
      .sort((a, b) => b.severity - a.severity);
  }, [result, selectedZones, zoneDiagnoses]);

  const urgentZones = useMemo(() => zoneDataList.filter(z => z.severity >= 70), [zoneDataList]);
  const moderateZones = useMemo(() => zoneDataList.filter(z => z.severity >= 30 && z.severity < 70), [zoneDataList]);
  const sufficientZones = useMemo(() => zoneDataList.filter(z => z.severity < 30), [zoneDataList]);

  const topZoneName = zoneDataList[0]
    ? (ZONE_LABELS[zoneDataList[0].faceZone]?.[lang] ?? zoneDataList[0].faceZone)
    : '';

  // ── Expanded zone (only one at a time) ────────────────────────────────────
  const [expandedZone, setExpandedZone] = useState<FaceZone | null>(null);

  const handleToggle = useCallback((zone: FaceZone) => {
    setExpandedZone(prev => prev === zone ? null : zone);
  }, []);

  const handleProductSelect = useCallback((zone: FaceZone, product: Product, _tier: PriceTier) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setStorePick(zone, product as any);
  }, [setStorePick]);

  // Notify parent
  useEffect(() => {
    if (onSpecialCareUpdate) {
      onSpecialCareUpdate(
        Object.entries(storePicks).map(([zone, product]) => ({
          zone: zone as FaceZone,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          product: product as any,
        })),
      );
    }
  }, [storePicks, onSpecialCareUpdate]);

  // ── Summary box data ──────────────────────────────────────────────────────
  const summaryBoxes = [
    {
      count: urgentZones.length,
      label: tx('zone_urgent', lang),
      bg: 'rgba(226,75,74,0.04)', border: 'rgba(226,75,74,0.12)', color: '#E24B4A',
    },
    {
      count: moderateZones.length,
      label: tx('zone_moderate', lang),
      bg: 'rgba(186,117,23,0.04)', border: 'rgba(186,117,23,0.12)', color: '#BA7517',
    },
    {
      count: sufficientZones.length,
      label: tx('zone_sufficient', lang),
      bg: isDark ? 'rgba(134,134,139,0.04)' : 'rgba(134,134,139,0.04)',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      color: '#86868B',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  // 🚨 Hard Lock State: barrier emergency hijacks the entire screen
  if (isBarrierEmergency) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', paddingBottom: 100,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            maxWidth: 420, width: '100%', textAlign: 'center',
            padding: 'clamp(32px, 5vw, 40px) 24px', borderRadius: 24,
            background: isDark ? 'rgba(255,255,255,0.03)' : tok.bgCard,
            border: `1px solid ${tok.border}`,
            boxShadow: isDark ? 'none' : '0 8px 32px rgba(0,0,0,0.04)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Glassmorphism red glow — clipped by overflow:hidden */}
          <div style={{
            position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
            width: 150, height: 150, background: '#E24B4A',
            filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%',
          }} />

          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '0 0 40px rgba(226,75,74,0.1)', position: 'relative',
          }}>
            🔒
          </div>

          <h2 style={{
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', fontWeight: 600, color: tok.text,
            margin: '0 0 12px', wordBreak: 'keep-all', position: 'relative',
          }}>
            {lang === 'ko' ? '지금은 피부가 쉴 시간입니다'
              : lang === 'de' ? 'Zonenpflege pausiert'
                : 'Zone Care Paused'}
          </h2>

          <p style={{
            color: tok.textSecondary, fontSize: '0.875rem', lineHeight: 1.6,
            marginBottom: 32, wordBreak: 'keep-all', position: 'relative',
          }}>
            {lang === 'ko'
              ? '장벽이 무너진 상태에서 부위별 액티브 성분(비타민C, AHA/BHA 등)을 추가하면 피부에 독이 되어 미세 염증을 악화시킬 수 있습니다. 2주 동안은 장벽 회복 루틴에만 온전히 집중해 주세요.'
              : lang === 'de'
                ? 'Aktive Inhaltsstoffe auf einzelne Zonen aufzutragen, wenn Ihre Hautbarriere beschädigt ist, kann zu starken Entzündungen führen. Konzentrieren Sie sich 2 Wochen lang ausschließlich auf das Barriere-Regenerationsprotokoll.'
                : 'Applying active ingredients to specific zones when your barrier is broken can cause severe inflammation. Please focus entirely on the 2-week barrier recovery routine.'}
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => onGoToMacro?.()}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: 'none', cursor: 'pointer',
              background: '#E24B4A', color: '#fff',
              fontSize: '0.9375rem', fontWeight: 600,
              boxShadow: '0 4px 14px rgba(226,75,74,0.25)',
              position: 'relative',
            }}
          >
            {lang === 'ko' ? '내 회복 루틴으로 돌아가기 →'
              : lang === 'de' ? 'Zurück zum Wiederherstellungsprotokoll →'
                : 'Return to Recovery Routine →'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      paddingBottom: 220,
    }}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        padding: 'clamp(16px, 3vw, 32px) clamp(16px, 4vw, 32px)',
      }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Eyebrow */}
          <p style={{
            fontSize: 'clamp(0.625rem, 1vw, 0.75rem)', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: tok.accent, marginBottom: 8,
          }}>{tx('zone_eyebrow', lang)}</p>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(1.25rem, 2vw + 0.5rem, 1.75rem)', fontWeight: 600,
            color: tok.text, margin: '0 0 8px', lineHeight: 1.2,
            wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
          }}>{tx('zone_title', lang)}</h2>

          {/* Dynamic description */}
          <p style={{
            fontSize: 'clamp(0.8125rem, 1.2vw, 0.9375rem)', color: tok.textSecondary,
            lineHeight: 1.5, margin: '0 0 clamp(16px, 3vw, 24px)',
            wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
          }}>
            {topZoneName
              ? tx('zone_desc', lang, { zone: topZoneName })
              : (lang === 'ko' ? '기본 루틴은 전체 피부를 관리하지만, 부위별 추가 성분이 필요해요.' : lang === 'de' ? 'Ihre Basis-Routine pflegt die gesamte Haut, aber einige Bereiche brauchen spezielle Wirkstoffe.' : 'Your basic routine covers overall skin, but some zones need specialized ingredients.')}
          </p>

          {/* Summary boxes */}
          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 16px)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            {summaryBoxes.map(({ count, label, bg, border, color }) => (
              <div key={label} style={{
                flex: 1, padding: 'clamp(12px, 2vw, 16px)',
                borderRadius: 12, textAlign: 'center',
                background: bg, border: `1px solid ${border}`,
              }}>
                <div style={{
                  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', fontWeight: 600, color, lineHeight: 1,
                }}>{count}</div>
                <div style={{
                  fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.textSecondary,
                  marginTop: 4, lineHeight: 1.3,
                  wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
                }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── NEEDS ATTENTION (urgent + moderate) ─────────────────────────── */}
        {(urgentZones.length > 0 || moderateZones.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ marginBottom: 'clamp(20px, 4vw, 32px)' }}
          >
            {/* Urgent group */}
            {urgentZones.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader label={tx('needs_attention', lang)} color="#E24B4A" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)' }}>
                  {urgentZones.map((zd, i) => (
                    <motion.div key={zd.faceZone}
                      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.35, delay: i * 0.06 }}
                    >
                      <ZoneCard
                        zd={zd} lang={lang} isDark={isDark} tok={tok}
                        isExpanded={expandedZone === zd.faceZone}
                        onToggle={() => handleToggle(zd.faceZone)}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        selectedProduct={storePicks[zd.faceZone] as any ?? null}
                        onProductSelect={handleProductSelect}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderate group */}
            {moderateZones.length > 0 && (
              <div>
                <SectionHeader label={tx('moderate_header', lang)} color="#BA7517" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)' }}>
                  {moderateZones.map((zd, i) => (
                    <motion.div key={zd.faceZone}
                      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.35, delay: i * 0.06 }}
                    >
                      <ZoneCard
                        zd={zd} lang={lang} isDark={isDark} tok={tok}
                        isExpanded={expandedZone === zd.faceZone}
                        onToggle={() => handleToggle(zd.faceZone)}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        selectedProduct={storePicks[zd.faceZone] as any ?? null}
                        onProductSelect={handleProductSelect}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── MANAGED BY BASIC ROUTINE ──────────────────────────────────── */}
        {sufficientZones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              padding: 'clamp(14px, 2.5vw, 18px)', borderRadius: 12, marginBottom: 'clamp(16px, 3vw, 24px)',
              background: isDark ? 'rgba(28,28,30,0.55)' : 'rgba(255,255,255,0.72)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(94,139,104,0.08)'}`,
              backdropFilter: 'blur(20px) saturate(1.2)',
            }}
          >
            <p style={{
              fontSize: 'clamp(0.5625rem, 0.7vw, 0.625rem)', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: tok.textTertiary, marginBottom: 10,
            }}>{tx('managed_title', lang)}</p>

            {/* Zone pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {sufficientZones.map(zd => (
                <div key={zd.faceZone} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 99,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}>
                  <span style={{ fontSize: 10, color: '#86868B' }}>{Math.round(100 - zd.severity)}</span>
                  <span style={{ fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.textSecondary }}>
                    {ZONE_LABELS[zd.faceZone]?.[lang] ?? zd.faceZone}
                  </span>
                </div>
              ))}
            </div>

            <p style={{
              fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary,
              lineHeight: 1.5, margin: '0 0 10px',
              wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
            }}>{tx('managed_desc', lang)}</p>

            {/* Green safety badge */}
            <span style={{
              display: 'inline-block',
              fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)', fontWeight: 600,
              padding: '4px 12px', borderRadius: 99,
              background: 'rgba(74,158,104,0.06)',
              border: '1px solid rgba(74,158,104,0.15)',
              color: isDark ? '#4A9E68' : '#3D6B4A',
            }}>
              {tx('managed_safe', lang, { N: sufficientZones.length })}
            </span>
          </motion.div>
        )}

        {/* ── EDUCATION CARD ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          style={{
            padding: 'clamp(14px, 2.5vw, 18px)', borderRadius: 12,
            background: tok.bgCard, border: `1px solid ${tok.border}`,
          }}
        >
          <p style={{
            fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 600,
            color: tok.text, margin: '0 0 8px',
            wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
          }}>{tx('why_zone_title', lang)}</p>
          <p style={{
            fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary,
            lineHeight: 1.6, margin: '0 0 8px',
            wordBreak: lang === 'ko' ? 'keep-all' : 'normal',
          }}>{tx('why_zone_body', lang)}</p>
          <p style={{
            fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)', color: tok.textTertiary,
            margin: 0, fontStyle: 'italic',
          }}>{tx('why_zone_source', lang)}</p>
        </motion.div>

      </div>
    </div>
  );
});

export default SlideLabSpecialCare;
