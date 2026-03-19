/**
 * SlideLabSpecialCare.tsx
 *
 * Slide 3 of the Unified Funnel: Lab & Special Care Box
 *
 * Renders:
 *   - Compact FaceMap with zone heatmap overlays
 *   - Empty Add-on Slots (dashed boxes with [ + ] icon) for each zone
 *   - Clicking [ + ] opens SpecialCareModal with DuelCard for that zone
 *   - Selected products fill the slots with product summaries
 *
 * Performance: Wrapped in React.memo. FaceMapOverlay is lazy-loaded.
 * Theming: All colors via CSS variables / Tailwind — zero hardcoded hex.
 */

import { useState, useMemo, useCallback, lazy, Suspense, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, FlaskConical, MapPin, ChevronDown, Droplets } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { useLabSelectionStore } from '@/features/lab-selection/store/useLabSelectionStore';
import SpecialCareModal from './SpecialCareModal';

import {
  ZoneDiagnosis,
  AxisScore,
  FaceZone,
  Product,
  PriceTier,
  RequiredIngredient,
  scoreToSeverity,
} from '@/features/lab-selection/types';
import type { DiagnosisResult, AxisKey, ZoneId } from '@/engine/types';
import { CONCERN_TO_AXIS } from '@/engine/faceMapInference';
import { AXIS_INGREDIENT_MAP } from '@/features/lab-selection/data/axisIngredientMap';
import type { SelectedZones } from '@/store/diagnosisStore';

// Lazy-load the FaceMapOverlay to keep Slide 1/2 fast
const FaceMapOverlay = lazy(() => import('@/features/lab-selection/components/FaceMapOverlay'));

// ── Types & Mappings ──────────────────────────────────────────────────────────

type DiagnosisAxis = 'sebum' | 'hydration' | 'barrier' | 'sensitivity' | 'pores' | 'pigmentation' | 'aging' | 'texture';

const ENGINE_TO_LAB_AXIS: Partial<Record<AxisKey, DiagnosisAxis>> = {
  seb: 'sebum',
  hyd: 'hydration',
  bar: 'barrier',
  sen: 'sensitivity',
  acne: 'pores',
  pigment: 'pigmentation',
  aging: 'aging',
  texture: 'texture',
};

const ZONE_ID_MAP: Record<string, FaceZone> = {
  forehead: 'forehead',
  eyes: 'eye_area',
  nose: 'nose',
  cheeks: 'cheeks',
  mouth: 'mouth',
  jawline: 'jawline',
  neck: 'neck',
};

const ZONE_LABELS: Record<string, { en: string; de: string; ko: string }> = {
  forehead: { en: 'Forehead', de: 'Stirn', ko: '이마' },
  eye_area: { en: 'Eye Area', de: 'Augenpartie', ko: '눈가' },
  nose: { en: 'Nose', de: 'Nase', ko: '코' },
  cheeks: { en: 'Cheeks', de: 'Wangen', ko: '볼' },
  mouth: { en: 'Mouth', de: 'Mund', ko: '입가' },
  jawline: { en: 'Jawline', de: 'Kiefer', ko: '턱선' },
  neck: { en: 'Neck', de: 'Hals', ko: '목' },
  whole_face: { en: 'Whole Face', de: 'Gesamt', ko: '전체' },
};

// ── Bridge helpers (reused from LabSelectionPage) ─────────────────────────────

function computeZoneAxisScores(
  zoneConcerns: string[],
  concernSeverity: Record<string, 1 | 2 | 3>
): AxisScore[] {
  const scores: Partial<Record<DiagnosisAxis, number>> = {};

  for (const concernId of zoneConcerns) {
    const engineAxis = CONCERN_TO_AXIS[concernId];
    if (!engineAxis) continue;
    const labAxis = ENGINE_TO_LAB_AXIS[engineAxis];
    if (!labAxis) continue;

    const severity = concernSeverity[concernId] ?? 1;
    scores[labAxis] = Math.min(100, Math.round((scores[labAxis] ?? 0) + (severity / 3) * 100));
  }

  return Object.entries(scores).map(([axis, score]) => ({
    axis: axis as DiagnosisAxis,
    score,
    severity: scoreToSeverity(score),
  }));
}

function inferProfile(axisScores: AxisScore[]) {
  const scoreMap = Object.fromEntries(axisScores.map((a) => [a.axis, a.score]));
  const s = (k: string) => scoreMap[k] ?? 0;
  if (s('sebum') >= 60 || s('pores') >= 60) return 'oily_acne' as const;
  if (s('barrier') >= 60 && s('hydration') >= 50) return 'dry_barrier' as const;
  if (s('sensitivity') >= 55) return 'sensitive' as const;
  if (s('aging') >= 55) return 'aging_elasticity' as const;
  if (s('pigmentation') >= 55) return 'pigmentation' as const;
  if (s('barrier') >= 45) return 'dry_barrier' as const;
  return 'combination' as const;
}

function computeRequiredIngredients(zoneAxisScores: AxisScore[]): RequiredIngredient[] {
  const ingredientsMap = new Map<string, RequiredIngredient>();
  for (const { axis, score, severity } of zoneAxisScores) {
    if (score <= 0) continue;
    const axisIngredients = AXIS_INGREDIENT_MAP[axis]?.[severity] ?? [];
    for (const ing of axisIngredients) {
      if (!ingredientsMap.has(ing.name_en)) {
        ingredientsMap.set(ing.name_en, ing);
      }
    }
  }
  return Array.from(ingredientsMap.values());
}

function diagnosisToZoneDiagnoses(result: DiagnosisResult, selectedZones: SelectedZones): ZoneDiagnosis[] {
  const globalAxisScores: AxisScore[] = (
    Object.entries(result.axis_scores ?? {}) as [AxisKey, number][]
  )
    .filter(([engineKey]) => ENGINE_TO_LAB_AXIS[engineKey] !== undefined)
    .map(([engineKey, score]) => ({
      axis: ENGINE_TO_LAB_AXIS[engineKey]!,
      score: Math.round(score),
      severity: scoreToSeverity(Math.round(score)),
    }));

  const heatmap = result.zone_heatmap;
  if (heatmap && Object.keys(heatmap).length > 0) {
    const zoneDiagnoses: ZoneDiagnosis[] = [];
    for (const [zoneId, entry] of Object.entries(heatmap)) {
      if (!entry) continue;
      const faceZone = ZONE_ID_MAP[zoneId];
      if (!faceZone) continue;

      let scaledScores: AxisScore[] = globalAxisScores.map((a) => ({ ...a, score: 0, severity: scoreToSeverity(0) }));
      const zoneData = selectedZones[zoneId];

      if (zoneData && zoneData.concerns.length > 0) {
        const computed = computeZoneAxisScores(zoneData.concerns, zoneData.severity ?? {});
        scaledScores = scaledScores.map(a => {
          const found = computed.find(c => c.axis === a.axis);
          return found ? found : a;
        });
      } else {
        scaledScores = globalAxisScores.map((a) => ({ ...a }));
      }

      const dominantLabAxis = ENGINE_TO_LAB_AXIS[entry.dominantAxis];
      const withDominant = scaledScores.map((a) =>
        dominantLabAxis && a.axis === dominantLabAxis
          ? { ...a, score: Math.min(100, a.score + 15), severity: scoreToSeverity(Math.min(100, a.score + 15)) }
          : a
      );

      zoneDiagnoses.push({
        zone: faceZone,
        axis_scores: withDominant,
        matched_profile: inferProfile(withDominant),
        required_ingredients: computeRequiredIngredients(withDominant),
      });
    }
    if (zoneDiagnoses.length > 0) return zoneDiagnoses;
  }

  return [{
    zone: 'whole_face',
    axis_scores: globalAxisScores,
    matched_profile: inferProfile(globalAxisScores),
    required_ingredients: computeRequiredIngredients(globalAxisScores),
  }];
}

// ── Severity labels ───────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, { en: string; de: string; ko: string }> = {
  moderate: { en: 'Moderate', de: 'Mäßig', ko: '보통' },
  severe:   { en: 'Severe', de: 'Schwer', ko: '심각' },
  extreme:  { en: 'Extreme', de: 'Extrem', ko: '매우 심각' },
};

const AXIS_DISPLAY: Record<string, { en: string; de: string; ko: string }> = {
  sebum:        { en: 'Sebum', de: 'Talg', ko: '피지' },
  hydration:    { en: 'Hydration', de: 'Feuchtigkeit', ko: '수분' },
  barrier:      { en: 'Barrier', de: 'Barriere', ko: '장벽' },
  sensitivity:  { en: 'Sensitivity', de: 'Empfindlichkeit', ko: '민감성' },
  pores:        { en: 'Pores', de: 'Poren', ko: '모공' },
  pigmentation: { en: 'Pigmentation', de: 'Pigmentierung', ko: '색소' },
  aging:        { en: 'Aging', de: 'Alterung', ko: '노화' },
  texture:      { en: 'Texture', de: 'Textur', ko: '피부결' },
};

function miniScoreColor(score: number): string {
  if (score >= 70) return 'hsl(0, 72%, 58%)';
  if (score >= 50) return 'hsl(35, 80%, 55%)';
  if (score >= 30) return 'hsl(45, 70%, 55%)';
  return 'hsl(var(--primary))';
}

// ── ZoneAnalysisCard component ────────────────────────────────────────────────

interface ZoneCardProps {
  diagnosis: ZoneDiagnosis;
  selectedProduct: Product | null;
  isExpanded: boolean;
  onToggle: () => void;
  onAddProduct: () => void;
  language: string;
}

const ZoneAnalysisCard = memo(function ZoneAnalysisCard({
  diagnosis, selectedProduct, isExpanded, onToggle, onAddProduct, language,
}: ZoneCardProps) {
  const lang = (language === 'ko' || language === 'de') ? language : 'en';
  const label = ZONE_LABELS[diagnosis.zone]
    ? ZONE_LABELS[diagnosis.zone][lang as 'en' | 'de' | 'ko']
    : diagnosis.zone;

  // Top concerns for this zone (axis_scores > 0, sorted)
  const topScores = useMemo(() =>
    diagnosis.axis_scores
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4),
    [diagnosis]
  );

  // Brief summary for collapsed state
  const briefSummary = topScores.slice(0, 2).map(a => {
    const axLabel = AXIS_DISPLAY[a.axis]?.[lang as 'en' | 'de' | 'ko'] ?? a.axis;
    const sevLabel = SEVERITY_LABELS[a.severity]?.[lang as 'en' | 'de' | 'ko'] ?? a.severity;
    return `${axLabel} ${sevLabel}`;
  }).join(' · ');

  // Severity dot color (based on worst score)
  const worstScore = topScores[0]?.score ?? 0;
  const dotColor = miniScoreColor(worstScore);

  return (
    <motion.div layout className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isExpanded ? 'hsl(var(--card) / 0.9)' : 'hsl(var(--card) / 0.6)',
        border: isExpanded ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid hsl(var(--border) / 0.4)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Collapsed: zone name + brief summary */}
      <button onClick={onToggle} className="w-full px-3.5 py-3 text-left flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{label}</p>
          <p className="text-[0.65rem] truncate" style={{ color: 'hsl(var(--foreground-hint))' }}>{briefSummary}</p>
        </div>
        {selectedProduct && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <Check size={10} style={{ color: 'hsl(var(--primary))' }} />
          </span>
        )}
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'hsl(var(--foreground-hint))' }} />
        </motion.div>
      </button>

      {/* Expanded: axis scores + ingredients + add product */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>

              {/* Circular axis scores */}
              <div className="pt-3">
                <p className="text-[0.55rem] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: 'hsl(var(--primary))' }}>
                  {lang === 'ko' ? '부위별 축 점수' : lang === 'de' ? 'Achsen-Analyse' : 'Axis Analysis'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {topScores.map(({ axis, score }) => {
                    const color = miniScoreColor(score);
                    const r = 22;
                    const circumference = 2 * Math.PI * r;
                    const offset = circumference * (1 - score / 100);
                    const axLabel = AXIS_DISPLAY[axis]?.[lang as 'en' | 'de' | 'ko'] ?? axis;
                    return (
                      <div key={axis} className="flex flex-col items-center gap-0.5">
                        <svg width={54} height={54} viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={27} cy={27} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3.5} opacity={0.3} />
                          <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                          <text x={27} y={27} textAnchor="middle" dominantBaseline="central"
                            fontSize={12} fontWeight={700} fill={color}
                            style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                            {Math.round(score)}
                          </text>
                        </svg>
                        <span className="text-[0.5rem] font-bold tracking-wide uppercase" style={{ color }}>{axLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Required ingredients */}
              {diagnosis.required_ingredients.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Droplets size={10} style={{ color: 'hsl(var(--primary))' }} />
                    <p className="text-[0.55rem] font-bold tracking-[0.12em] uppercase" style={{ color: 'hsl(var(--primary))' }}>
                      {lang === 'ko' ? '필요 성분' : lang === 'de' ? 'Benötigte Wirkstoffe' : 'Required Ingredients'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {diagnosis.required_ingredients.slice(0, 6).map((ing) => (
                      <span key={ing.name_en}
                        className="text-[0.6rem] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: 'hsl(var(--primary) / 0.08)',
                          color: 'hsl(var(--primary))',
                          border: '1px solid hsl(var(--primary) / 0.15)',
                        }}
                      >
                        {lang === 'ko' ? (ing as any).name_ko ?? ing.name_en : lang === 'de' ? (ing as any).name_de ?? ing.name_en : ing.name_en}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected product or Add button */}
              {selectedProduct ? (
                <div className="flex items-center gap-2 rounded-lg p-2"
                  style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  <Check size={12} style={{ color: 'hsl(var(--primary))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.65rem] font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      {selectedProduct.brand} — {lang === 'ko' ? (selectedProduct as any).name_kr ?? selectedProduct.name_en : selectedProduct.name_en}
                    </p>
                  </div>
                  <button onClick={onAddProduct}
                    className="text-[0.6rem] font-bold px-2 py-0.5 rounded-md"
                    style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' }}
                  >{lang === 'ko' ? '변경' : lang === 'de' ? 'Ändern' : 'Change'}</button>
                </div>
              ) : (
                <button onClick={onAddProduct}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2 transition-all"
                  style={{ border: '1.5px dashed hsl(var(--primary) / 0.3)', background: 'hsl(var(--primary) / 0.03)' }}
                >
                  <Plus size={12} style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-[0.65rem] font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    {lang === 'ko' ? '맞춤 제품 추가' : lang === 'de' ? 'Produkt hinzufügen' : 'Add Product'}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

interface SlideLabSpecialCareProps {
  result: DiagnosisResult;
  onSpecialCareUpdate?: (picks: { zone: FaceZone; product: Product }[]) => void;
}

const SlideLabSpecialCare = memo(function SlideLabSpecialCare({
  result,
  onSpecialCareUpdate,
}: SlideLabSpecialCareProps) {
  const { language } = useI18nStore();
  const selectedZones = useDiagnosisStore((s) => s.selectedZones);
  const {
    setZoneDiagnoses,
    evaluateGate,
    zoneDiagnoses: storeZoneDiagnoses,
  } = useLabSelectionStore();

  // Bridge diagnosis to zone diagnoses
  const zoneDiagnoses = useMemo(
    () => diagnosisToZoneDiagnoses(result, selectedZones),
    [result, selectedZones]
  );

  // Seed store on mount
  useEffect(() => {
    if (zoneDiagnoses.length > 0) {
      setZoneDiagnoses(zoneDiagnoses);
    }
  }, [zoneDiagnoses, setZoneDiagnoses]);

  useEffect(() => {
    if (storeZoneDiagnoses.length > 0) {
      evaluateGate();
    }
  }, [storeZoneDiagnoses, evaluateGate]);

  // Picks from Zustand store — survives unmount/remount during slide transitions
  const storePicks = useDiagnosisStore((s) => s.specialCarePicks);
  const setStorePick = useDiagnosisStore((s) => s.setSpecialCarePick);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    zone: FaceZone;
    diagnosis: ZoneDiagnosis | null;
  }>({ isOpen: false, zone: 'whole_face', diagnosis: null });

  // Track which zone card is expanded to show analysis
  const [expandedZone, setExpandedZone] = useState<FaceZone | null>(null);

  const openModal = useCallback((zd: ZoneDiagnosis) => {
    setModalState({ isOpen: true, zone: zd.zone, diagnosis: zd });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleProductSelect = useCallback((zone: FaceZone, product: Product, _tier: PriceTier) => {
    // Bridge lab Product type → engine Product type stored in Zustand
    setStorePick(zone, product as any);
  }, [setStorePick]);

  // Notify parent of picks changes (for auto-save)
  useEffect(() => {
    if (onSpecialCareUpdate) {
      onSpecialCareUpdate(
        Object.entries(storePicks).map(([zone, product]) => ({
          zone: zone as FaceZone,
          product: product as any,
        }))
      );
    }
  }, [storePicks, onSpecialCareUpdate]);

  const zones = useMemo(() => zoneDiagnoses.map(d => d.zone), [zoneDiagnoses]);
  const picksCount = Object.keys(storePicks).length;

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">

        {/* Eyebrow */}
        <motion.p
          className="slide-eyebrow mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {language === 'ko' ? '맞춤 특수 케어' : language === 'de' ? 'Spezielle Pflege' : 'Special Care Lab'}
        </motion.p>

        {/* Headline */}
        <motion.h2
          className="font-display"
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 400,
            lineHeight: 1.2,
            color: 'hsl(var(--foreground))',
            marginBottom: '0.5rem',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {language === 'ko'
            ? '부위별 분석 결과'
            : language === 'de'
              ? 'Zonale Analyse'
              : 'Zone Analysis & Care'}
        </motion.h2>

        <motion.p
          className="slide-body mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {language === 'ko'
            ? '부위를 탭하면 축 점수와 필요 성분을 확인할 수 있습니다. 맞춤 제품도 추가할 수 있어요.'
            : language === 'de'
              ? 'Tippen Sie auf eine Zone für die Achsenanalyse und Wirkstoffliste.'
              : 'Tap a zone to view axis scores, required ingredients, and add targeted products.'}
        </motion.p>

        {/* FaceMap + Add-on slots layout */}
        <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">

          {/* Left: Compact face map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border p-4"
            style={{
              borderColor: 'hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} style={{ color: 'hsl(var(--primary))' }} />
              <p className="text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--primary))' }}>
                {language === 'ko' ? '부위 분석' : language === 'de' ? 'Zonenanalyse' : 'Zone Analysis'}
              </p>
            </div>
            <Suspense
              fallback={
                <div className="h-48 flex items-center justify-center">
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2"
                    style={{
                      borderColor: 'hsl(var(--border))',
                      borderTopColor: 'hsl(var(--primary))',
                    }}
                  />
                </div>
              }
            >
              <FaceMapOverlay
                zones={zones}
                activeZone={null}
                onZoneClick={(zone) => {
                  const zd = zoneDiagnoses.find(d => d.zone === zone);
                  if (zd) openModal(zd);
                }}
              />
            </Suspense>
            <p className="text-[0.65rem] mt-2 text-center" style={{ color: 'hsl(var(--foreground-hint))' }}>
              {language === 'ko' ? '부위를 탭하여 분석결과 보기' : language === 'de' ? 'Zone antippen für Analyse' : 'Tap a zone for analysis'}
            </p>
          </motion.div>

          {/* Right: Zone analysis cards */}
          <div className="flex flex-col gap-2">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={14} style={{ color: 'hsl(var(--primary))' }} />
              <p className="text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--foreground-hint))' }}>
                {language === 'ko'
                  ? `부위별 분석 (${zoneDiagnoses.length})`
                  : language === 'de'
                    ? `Zonenanalyse (${zoneDiagnoses.length})`
                    : `Zone Analysis (${zoneDiagnoses.length})`}
              </p>
            </div>

            {/* Zone analysis cards */}
            {zoneDiagnoses.map((zd, i) => (
              <motion.div
                key={zd.zone}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <ZoneAnalysisCard
                  diagnosis={zd}
                  selectedProduct={storePicks[zd.zone] as any ?? null}
                  isExpanded={expandedZone === zd.zone}
                  onToggle={() => setExpandedZone(prev => prev === zd.zone ? null : zd.zone)}
                  onAddProduct={() => openModal(zd)}
                  language={language}
                />
              </motion.div>
            ))}

            {/* Summary count */}
            {picksCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 rounded-lg px-3 py-2 text-center"
                style={{
                  background: 'hsl(var(--primary) / 0.06)',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                }}
              >
                <p className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                  {language === 'ko'
                    ? `${picksCount}개 특수 케어 제품 선택됨`
                    : language === 'de'
                      ? `${picksCount} Spezialpflege-Produkt${picksCount > 1 ? 'e' : ''} ausgewählt`
                      : `${picksCount} special care product${picksCount > 1 ? 's' : ''} selected`}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalState.diagnosis && (
        <SpecialCareModal
          isOpen={modalState.isOpen}
          zone={modalState.zone}
          matchedProfile={modalState.diagnosis.matched_profile}
          requiredIngredients={modalState.diagnosis.required_ingredients}
          onProductSelect={handleProductSelect}
          onClose={closeModal}
        />
      )}
    </div>
  );
});

export default SlideLabSpecialCare;
