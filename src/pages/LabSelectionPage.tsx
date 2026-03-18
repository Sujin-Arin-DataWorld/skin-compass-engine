/**
 * LabSelectionPage.tsx
 *
 * Phase 5 — Zone-Based Lab Selection
 * 3-step flow: Gate Check → Zone Lab Selection → Routine Builder
 *
 * Bridges DiagnosisResult from the existing engine into ZoneDiagnosis[]
 * for the new lab-selection feature system.
 */

import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

import { useDiagnosisStore } from '@/store/diagnosisStore';
import { useI18nStore } from '@/store/i18nStore';
import Navbar from '@/components/Navbar';
import SilkBackground from '@/components/SilkBackground';

import { useLabSelectionStore } from '@/features/lab-selection/store/useLabSelectionStore';
import GlobalGateCard from '@/features/lab-selection/components/GlobalGateCard';
import ZoneLabFlow from '@/features/lab-selection/components/ZoneLabFlow';
import RoutineBuilder from '@/features/lab-selection/components/RoutineBuilder';

import {
  ZoneDiagnosis,
  AxisScore,
  SkinProfile,
  FaceZone,
  DiagnosisAxis,
  scoreToSeverity,
  RequiredIngredient,
} from '@/features/lab-selection/types';
import type { DiagnosisResult, AxisKey } from '@/engine/types';
import { CONCERN_TO_AXIS } from '@/engine/faceMapInference';
import type { SelectedZones } from '@/store/diagnosisStore';
import { AXIS_INGREDIENT_MAP } from '@/features/lab-selection/data/axisIngredientMap';

// ── Bridge: DiagnosisResult → ZoneDiagnosis[] ────────────────────────────────

const ZONE_ID_MAP: Record<string, FaceZone> = {
  forehead: 'forehead',
  eyes: 'eye_area',
  nose: 'nose',
  cheeks: 'cheeks',
  mouth: 'mouth',
  jawline: 'jawline',
  neck: 'neck',
};

/**
 * Maps engine AxisKey (seb, hyd, bar…) → lab-selection DiagnosisAxis (sebum, hydration, barrier…).
 * Keys not listed here are irrelevant to ingredient selection and are dropped.
 */
const ENGINE_TO_LAB_AXIS: Partial<Record<AxisKey, DiagnosisAxis>> = {
  seb: 'sebum',
  hyd: 'hydration',
  bar: 'barrier',
  sen: 'sensitivity',
  acne: 'pores',        // acne concerns map to pore/BHA ingredients
  pigment: 'pigmentation',
  aging: 'aging',
  texture: 'texture',
};

/** Pick the best SkinProfile match from axis scores */
function inferProfile(axisScores: AxisScore[]): SkinProfile {
  const scoreMap = Object.fromEntries(axisScores.map((a) => [a.axis, a.score]));
  const s = (k: string) => scoreMap[k] ?? 0;

  if (s('sebum') >= 60 || s('pores') >= 60) return 'oily_acne';
  if (s('barrier') >= 60 && s('hydration') >= 50) return 'dry_barrier';
  if (s('sensitivity') >= 55) return 'sensitive';
  if (s('aging') >= 55) return 'aging_elasticity';
  if (s('pigmentation') >= 55) return 'pigmentation';
  if (s('barrier') >= 45) return 'dry_barrier';
  return 'combination';
}

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
  // Build global axis scores — translate engine keys to lab-selection axis names
  const globalAxisScores: AxisScore[] = (
    Object.entries(result.axis_scores ?? {}) as [AxisKey, number][]
  )
    .filter(([engineKey]) => ENGINE_TO_LAB_AXIS[engineKey] !== undefined)
    .map(([engineKey, score]) => ({
      axis: ENGINE_TO_LAB_AXIS[engineKey]!,
      score: Math.round(score),
      severity: scoreToSeverity(Math.round(score)),
    }));

  // If zone_heatmap exists, build per-zone diagnoses
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

      // Elevate the dominant axis for this zone (translate engine key first)
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

  // Fallback: single whole_face diagnosis
  return [{
    zone: 'whole_face',
    axis_scores: globalAxisScores,
    matched_profile: inferProfile(globalAxisScores),
    required_ingredients: computeRequiredIngredients(globalAxisScores),
  }];
}


// ── Step enum ─────────────────────────────────────────────────────────────────

type Step = 'zone_selection' | 'routine_builder';

// ── Main component ────────────────────────────────────────────────────────────

export default function LabSelectionPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();

  const result = useDiagnosisStore((s) => s.result);
  const {
    setZoneDiagnoses,
    evaluateGate,
    gateResult,
    selectedProducts,
    zoneDiagnoses,
  } = useLabSelectionStore();

  const [step, setStep] = useState<Step>('zone_selection');

  // Seed zone diagnoses from diagnosis result
  const selectedZones = useDiagnosisStore((s) => s.selectedZones);
  const zoneDiagnosesMemo = useMemo(
    () => (result ? diagnosisToZoneDiagnoses(result, selectedZones) : []),
    [result, selectedZones]
  );

  useEffect(() => {
    if (zoneDiagnosesMemo.length > 0) {
      setZoneDiagnoses(zoneDiagnosesMemo);
    }
  }, [zoneDiagnosesMemo, setZoneDiagnoses]);

  // Evaluate gate whenever zone diagnoses change
  useEffect(() => {
    if (zoneDiagnoses.length > 0) {
      evaluateGate();
    }
  }, [zoneDiagnoses, evaluateGate]);

  // Redirect if no diagnosis
  if (!result) {
    return <Navigate to="/results" replace />;
  }

  const isRecoveryOnly = gateResult?.status === 'recovery_only';
  const allZonesSelected =
    zoneDiagnoses.length > 0 &&
    zoneDiagnoses.every((zd) => selectedProducts.has(zd.zone));

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(160deg, #0d0d12 0%, #0f1118 50%, #10111a 100%)'
          : 'linear-gradient(160deg, #f8f6f2 0%, #f0ede8 100%)',
        position: 'relative',
      }}
    >
      <SilkBackground />
      <Navbar />

      <div style={{ paddingTop: 72, paddingBottom: 48 }}>
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '32px 16px 24px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: isDark ? 'hsl(var(--accent-gold))' : '#8B7355',
                marginBottom: 8,
                fontFamily: "var(--font-sans)",
              }}
            >
              {language === 'ko' ? '스킨케어 연구소' : language === 'de' ? 'Das Labor' : 'The Lab'}
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: isDark ? '#f5f0e8' : '#1a1a2e',
                fontFamily: "var(--font-display)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {language === 'ko'
                ? '맞춤 루틴 설계'
                : language === 'de'
                  ? 'Ihre persönliche Routine'
                  : 'Build Your Routine'}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: isDark ? 'rgba(245,240,232,0.5)' : 'rgba(26,26,46,0.55)',
                marginTop: 8,
                lineHeight: 1.6,
                maxWidth: 560,
              }}
            >
              {language === 'ko'
                ? '진단 결과를 기반으로 각 부위에 맞는 제품을 선택하고, 안전한 루틴을 완성하세요.'
                : language === 'de'
                  ? 'Wählen Sie Produkte basierend auf Ihren Diagnoseergebnissen und erstellen Sie Ihre sichere Routine.'
                  : 'Select products matched to your diagnosis, zone by zone, and build a clinically safe routine.'}
            </p>
          </motion.div>
        </div>

        {/* ── Stepper ──────────────────────────────────────────────────────── */}
        {!isRecoveryOnly && (
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto 28px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {(['zone_selection', 'routine_builder'] as Step[]).map((s, i) => {
              const active = step === s;
              const done = (s === 'zone_selection' && step === 'routine_builder');
              const labels = {
                zone_selection: {
                  ko: '제품 선택', en: 'Select Products', de: 'Produkte wählen',
                },
                routine_builder: {
                  ko: '루틴 빌더', en: 'Routine Builder', de: 'Routine Builder',
                },
              };
              const label = language === 'ko' ? labels[s].ko : language === 'de' ? labels[s].de : labels[s].en;

              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && (
                    <div
                      style={{
                        width: 32,
                        height: 1,
                        background: done
                          ? 'rgba(201,169,110,0.6)'
                          : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      }}
                    />
                  )}
                  <button
                    onClick={() => {
                      // Allow going back to zone_selection from routine_builder
                      if (s === 'zone_selection') setStep('zone_selection');
                      // Only allow going to routine_builder if all zones selected
                      if (s === 'routine_builder' && allZonesSelected) setStep('routine_builder');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: active
                        ? '1.5px solid rgba(201,169,110,0.6)'
                        : done
                          ? '1px solid rgba(93,202,165,0.4)'
                          : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                      background: active
                        ? 'rgba(201,169,110,0.1)'
                        : 'transparent',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      color: active
                        ? '#C8A951'
                        : done
                          ? '#5DCAA5'
                          : isDark ? 'rgba(245,240,232,0.45)' : 'rgba(26,26,46,0.45)',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: active
                          ? 'rgba(201,169,110,0.2)'
                          : done
                            ? 'rgba(93,202,165,0.2)'
                            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        color: active ? '#C8A951' : done ? '#5DCAA5' : 'inherit',
                        fontFamily: "var(--font-numeric)",
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    {label}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Gate Card (always visible) ───────────────────────────────────── */}
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto 24px',
            padding: '0 16px',
          }}
        >
          <GlobalGateCard />
        </div>

        {/* ── Zone Lab Flow ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!isRecoveryOnly && step === 'zone_selection' && (
            <motion.div
              key="zone-flow"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <ZoneLabFlow
                onContinueToRoutine={() => setStep('routine_builder')}
              />
            </motion.div>
          )}

          {/* ── Routine Builder ───────────────────────────────────────────── */}
          {!isRecoveryOnly && step === 'routine_builder' && (
            <motion.div
              key="routine-builder"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <RoutineBuilder onBack={() => setStep('zone_selection')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
