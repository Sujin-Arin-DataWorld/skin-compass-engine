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
} from '@/features/lab-selection/types';
import type { DiagnosisResult } from '@/engine/types';

// ── Bridge: DiagnosisResult → ZoneDiagnosis[] ────────────────────────────────

const ZONE_ID_MAP: Record<string, FaceZone> = {
  forehead: 'forehead',
  eyes:     'eye_area',
  nose:     'nose',
  cheeks:   'cheeks',
  mouth:    'chin',
  jawline:  'jawline',
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

function diagnosisToZoneDiagnoses(result: DiagnosisResult): ZoneDiagnosis[] {
  // Build global axis scores
  const globalAxisScores: AxisScore[] = Object.entries(result.axis_scores ?? {})
    .filter(([axis]) =>
      ['sebum','hydration','pores','sensitivity','barrier','pigmentation','aging'].includes(axis)
    )
    .map(([axis, score]) => ({
      axis: axis as DiagnosisAxis,
      score: score as number,
      severity: scoreToSeverity(score as number),
    }));

  // If zone_heatmap exists, build per-zone diagnoses
  const heatmap = result.zone_heatmap;
  if (heatmap && Object.keys(heatmap).length > 0) {
    const zoneDiagnoses: ZoneDiagnosis[] = [];

    for (const [zoneId, entry] of Object.entries(heatmap)) {
      if (!entry) continue;
      const faceZone = ZONE_ID_MAP[zoneId];
      if (!faceZone) continue;

      // Scale global scores by this zone's intensity
      const scaledScores: AxisScore[] = globalAxisScores.map((a) => {
        const scaled = Math.round(a.score * entry.intensity * 1.5);
        const clamped = Math.min(100, scaled);
        return { ...a, score: clamped, severity: scoreToSeverity(clamped) };
      });

      // Also elevate the dominant axis for this zone
      const withDominant = scaledScores.map((a) =>
        a.axis === entry.dominantAxis
          ? { ...a, score: Math.min(100, a.score + 15), severity: scoreToSeverity(Math.min(100, a.score + 15)) }
          : a
      );

      zoneDiagnoses.push({
        zone: faceZone,
        axis_scores: withDominant,
        matched_profile: inferProfile(withDominant),
        required_ingredients: [],
      });
    }

    if (zoneDiagnoses.length > 0) return zoneDiagnoses;
  }

  // Fallback: single whole_face diagnosis
  return [{
    zone: 'whole_face',
    axis_scores: globalAxisScores,
    matched_profile: inferProfile(globalAxisScores),
    required_ingredients: [],
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
  const zoneDiagnosesMemo = useMemo(
    () => (result ? diagnosisToZoneDiagnoses(result) : []),
    [result]
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
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#C8A951',
                marginBottom: 8,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {language === 'ko' ? '스킨케어 연구소' : language === 'de' ? 'Das Labor' : 'The Lab'}
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: isDark ? '#f5f0e8' : '#1a1a2e',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
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
                        fontFamily: 'monospace',
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
