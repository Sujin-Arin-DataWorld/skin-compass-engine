/**
 * ZoneLabFlow.tsx
 *
 * Layer 2 container: orchestrates per-zone Scientific Standard + Duel selection
 * for every zone in the user's diagnosis.
 *
 * Integration points (wired here per Step 7 spec):
 *   • applyCautionCaps()   — trims required ingredient concentrations for caution gate
 *   • applyRosaceaFilter() — adjusts niacinamide for rosacea-prone skin
 *
 * Clinical safety rules 1–5 from clinicalSafetyRules.ts are wired in Step 8
 * (RoutineBuilder), not here.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ChevronDown, ChevronUp, FlaskConical, ArrowRight } from 'lucide-react';

import { useLabSelectionStore } from '../store/useLabSelectionStore';
import { useI18nStore } from '@/store/i18nStore';
import { AXIS_INGREDIENT_MAP } from '../data/axisIngredientMap';
import { applyCautionCaps } from '../utils/routineHelpers';
import { applyRosaceaFilter } from '../utils/clinicalSafetyRules';

import ScientificStandardCard from './ScientificStandardCard';
import DuelCard from './DuelCard';
import FaceMapOverlay from './FaceMapOverlay';

import {
  FaceZone,
  Product,
  PriceTier,
  RequiredIngredient,
  AxisScore,
  ZoneDiagnosis,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Collect required ingredients from AXIS_INGREDIENT_MAP for the given axis scores.
 * Deduplicates by name_en — higher-priority (must_have) entry wins.
 */
function computeRequiredIngredients(axisScores: AxisScore[]): RequiredIngredient[] {
  const map = new Map<string, RequiredIngredient>();

  for (const axisScore of axisScores) {
    // Only process 'moderate' severity and above (skip 'mild' — no specific actives needed)
    if (axisScore.severity === 'mild') continue;

    const severityMap = AXIS_INGREDIENT_MAP[axisScore.axis];
    if (!severityMap) continue;

    const ings: RequiredIngredient[] = severityMap[axisScore.severity] ?? [];

    for (const ing of ings) {
      const existing = map.get(ing.name_en);
      // must_have wins over nice_to_have; otherwise first-encountered is kept
      if (!existing || (ing.priority === 'must_have' && existing.priority !== 'must_have')) {
        map.set(ing.name_en, ing);
      }
    }
  }

  return Array.from(map.values());
}

// ── Zone panel header ─────────────────────────────────────────────────────────

const ZONE_LABEL: Record<string, { ko: string; en: string; de: string }> = {
  forehead: { ko: '이마', en: 'Forehead', de: 'Stirn' },
  eye_area: { ko: '눈가', en: 'Eye Area', de: 'Augenpartie' },
  nose: { ko: '코', en: 'Nose', de: 'Nase' },
  cheeks: { ko: '볼', en: 'Cheeks', de: 'Wangen' },
  mouth: { ko: '입가/턱', en: 'Mouth', de: 'Mund' },
  jawline: { ko: '턱선', en: 'Jawline', de: 'Kiefer' },
  neck: { ko: '목', en: 'Neck', de: 'Hals' },
  t_zone: { ko: 'T존', en: 'T-Zone', de: 'T-Zone' },
  whole_face: { ko: '전체 얼굴', en: 'Whole Face', de: 'Gesamtes Gesicht' },
  spot_only: { ko: '트러블 부위', en: 'Spot Areas', de: 'Problemzonen' },
  dry_areas_only: { ko: '건조 부위', en: 'Dry Areas', de: 'Trockene Partien' },
  oily_areas_only: { ko: '유분 부위', en: 'Oily Areas', de: 'Fettige Partien' },
  // Slot-based virtual zones
  slot_cleanser: { ko: '클렌저', en: 'Cleanser', de: 'Reiniger' },
  slot_toner: { ko: '토너 / 에센스', en: 'Toner / Essence', de: 'Toner / Essenz' },
  slot_serum_am: { ko: '아침 세럼', en: 'Morning Serum', de: 'Morgen-Serum' },
  slot_moisturizer: { ko: '모이스처라이저', en: 'Moisturizer', de: 'Feuchtigkeitspflege' },
  slot_spf: { ko: '선크림 / SPF', en: 'Sunscreen / SPF', de: 'Sonnenschutz' },
  slot_serum_pm: { ko: '저녁 세럼', en: 'Evening Serum', de: 'Abend-Serum' },
  slot_eye_cream: { ko: '아이 크림', en: 'Eye Cream', de: 'Augencreme' },
};

function getZoneLabel(zone: FaceZone, lang: string): string {
  const l = ZONE_LABEL[zone];
  if (!l) return zone;
  return lang === 'ko' ? l.ko : lang === 'de' ? l.de : l.en;
}

// ── Zone panel ────────────────────────────────────────────────────────────────

interface ZonePanelProps {
  zoneDiagnosis: ZoneDiagnosis;
  isActive: boolean;
  isCompleted: boolean;
  onActivate: () => void;
  onProductSelect: (zone: FaceZone, product: Product, tier: PriceTier) => void;
  isDark: boolean;
  language: string;
}

function ZonePanel({
  zoneDiagnosis,
  isActive,
  isCompleted,
  onActivate,
  onProductSelect,
  isDark,
  language,
}: ZonePanelProps) {
  const { zone, axis_scores, matched_profile, is_rosacea_prone } = zoneDiagnosis;

  // Pull store flags
  const { gateResult, isRosaceaProne } = useLabSelectionStore();
  const gateStatus = gateResult?.status ?? 'full_routine';

  // Compute required ingredients with caution caps + rosacea filter applied
  const requiredIngredients = useMemo(() => {
    const raw = computeRequiredIngredients(axis_scores);

    // Apply caution caps (Step 4 integration)
    const { capped } = applyCautionCaps(raw, gateStatus);

    // Apply rosacea filter (Step 4 addendum integration)
    const rosaceaActive = isRosaceaProne || (is_rosacea_prone ?? false);
    const { adjusted_ingredients } = applyRosaceaFilter(capped, rosaceaActive);

    return adjusted_ingredients;
  }, [axis_scores, gateStatus, isRosaceaProne, is_rosacea_prone]);

  const zoneLabel = getZoneLabel(zone, language);

  const headerBg = isDark
    ? isActive ? 'rgba(45,107,74,0.08)' : 'rgba(255,255,255,0.03)'
    : isActive ? 'rgba(45,107,74,0.06)' : 'rgba(0,0,0,0.02)';

  const headerBorder = isDark
    ? isActive ? 'rgba(45,107,74,0.35)' : 'rgba(255,255,255,0.08)'
    : isActive ? 'rgba(45,107,74,0.4)' : 'rgba(0,0,0,0.08)';

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1.5px solid ${headerBorder}`,
        overflow: 'hidden',
        background: isDark ? '#0D1420' : '#FFFFFF',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header / accordion trigger */}
      <button
        onClick={onActivate}
        style={{
          width: '100%',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: headerBg,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        {/* Zone icon */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isDark ? 'rgba(45,107,74,0.12)' : 'rgba(45,107,74,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 14,
          }}
        >
          <FlaskConical size={15} color="hsl(var(--accent-gold))" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? '#f5f0e8' : '#1a1a2e',
              lineHeight: 1.2,
            }}
          >
            {zoneLabel}
          </div>
          <div
            style={{
              fontSize: 11,
              color: isDark ? 'rgba(245,240,232,0.45)' : 'rgba(26,26,46,0.5)',
              marginTop: 2,
            }}
          >
            {language === 'ko'
              ? `${matched_profile} 프로필`
              : language === 'de'
                ? `Profil: ${matched_profile}`
                : `Profile: ${matched_profile}`}
          </div>
        </div>

        {/* Completed badge */}
        {isCompleted && (
          <span
            style={{
              fontSize: 10,
              color: '#5DCAA5',
              background: 'rgba(93,202,165,0.12)',
              border: '1px solid rgba(93,202,165,0.3)',
              borderRadius: 12,
              padding: '2px 8px',
              flexShrink: 0,
            }}
          >
            {language === 'ko' ? '선택 완료' : language === 'de' ? 'Fertig' : 'Selected'}
          </span>
        )}

        {/* Expand icon */}
        <span style={{ color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.4)', flexShrink: 0 }}>
          {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Scientific Standard Card */}
              <ScientificStandardCard
                zone={zone}
                axisScores={axis_scores}
                requiredIngredients={requiredIngredients}
              />

              {/* Duel Card */}
              <DuelCard
                zone={zone}
                matchedProfile={matched_profile}
                requiredIngredients={requiredIngredients}
                onProductSelect={onProductSelect}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface ZoneLabFlowProps {
  /** Called when user finishes all zone selections and clicks "Continue" */
  onContinueToRoutine: () => void;
}

export default function ZoneLabFlow({ onContinueToRoutine }: ZoneLabFlowProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();

  const { zoneDiagnoses, gateResult, selectedProducts, selectProduct } = useLabSelectionStore();

  const [activeZoneIndex, setActiveZoneIndex] = useState<number>(0);

  // Zones to display (from diagnoses, in order)
  const zones = useMemo(() => zoneDiagnoses.map((d) => d.zone), [zoneDiagnoses]);

  // Number of zones with a selected product
  const completedCount = useMemo(
    () => zones.filter((z) => selectedProducts.has(z)).length,
    [zones, selectedProducts]
  );
  const allCompleted = completedCount === zones.length && zones.length > 0;

  // Handle zone accordion toggle
  const handleActivate = useCallback((index: number) => {
    setActiveZoneIndex((prev) => (prev === index ? -1 : index));
  }, []);

  // Handle product selection — advance to next incomplete zone automatically
  const handleProductSelect = useCallback(
    (zone: FaceZone, product: Product, tier: PriceTier) => {
      selectProduct(zone, product, tier);
      // Advance to next unselected zone
      const currentIdx = zones.indexOf(zone);
      const nextIdx = zones.findIndex((z, i) => i > currentIdx && !selectedProducts.has(z));
      if (nextIdx !== -1) {
        setActiveZoneIndex(nextIdx);
      }
    },
    [selectProduct, zones, selectedProducts]
  );

  if (zoneDiagnoses.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.4)',
          fontSize: 14,
        }}
      >
        {language === 'ko'
          ? '분석 결과를 불러오는 중입니다…'
          : language === 'de'
            ? 'Diagnosedaten werden geladen…'
            : 'Loading diagnosis data…'}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        maxWidth: 960,
        margin: '0 auto',
        padding: '0 16px',
      }}
    >
      {/* ── Left: Face map overlay (sticky) ─────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 80,
          flexShrink: 0,
        }}
      >
        <FaceMapOverlay
          zones={zones}
          activeZone={activeZoneIndex >= 0 ? zones[activeZoneIndex] ?? null : null}
          onZoneClick={(zone) => {
            const idx = zones.indexOf(zone);
            if (idx !== -1) setActiveZoneIndex(idx);
          }}
        />
      </div>

      {/* ── Right: Zone panels ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Caution warning strip */}
        {gateResult?.status === 'caution' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
              border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#F59E0B'}`,
              fontSize: 12,
              color: isDark ? '#FBBF24' : '#92400E',
              lineHeight: 1.5,
            }}
          >
            <strong>
              {language === 'ko' ? '⚠ 주의 모드 적용 중 — ' : language === 'de' ? '⚠ Vorsichtsmodus aktiv — ' : '⚠ Caution mode active — '}
            </strong>
            {language === 'ko'
              ? '각 존의 성분 농도가 피부 상태에 맞게 조정되었습니다.'
              : language === 'de'
                ? 'Wirkstoffkonzentrationen wurden für Ihre Hautbarriere angepasst.'
                : 'Ingredient concentrations have been adjusted for your current barrier state.'}
          </div>
        )}

        {/* Zone accordion panels */}
        {zoneDiagnoses.map((zd, idx) => (
          <ZonePanel
            key={zd.zone}
            zoneDiagnosis={zd}
            isActive={activeZoneIndex === idx}
            isCompleted={selectedProducts.has(zd.zone)}
            onActivate={() => handleActivate(idx)}
            onProductSelect={handleProductSelect}
            isDark={isDark}
            language={language}
          />
        ))}

        {/* Progress indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 4px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: 3,
              borderRadius: 4,
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, hsl(var(--accent-gold)), #5DCAA5)',
                borderRadius: 4,
              }}
              animate={{ width: zones.length > 0 ? `${(completedCount / zones.length) * 100}%` : '0%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              color: isDark ? 'rgba(245,240,232,0.5)' : 'rgba(26,26,46,0.5)',
              flexShrink: 0,
            }}
          >
            {completedCount} / {zones.length}
          </span>
        </div>

        {/* Continue CTA */}
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            >
              <button
                onClick={onContinueToRoutine}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(45,107,74,0.55)',
                  background: 'linear-gradient(135deg, rgba(45,107,74,0.14), rgba(45,107,74,0.06))',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'hsl(var(--accent-gold))',
                  letterSpacing: '0.04em',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'linear-gradient(135deg, rgba(45,107,74,0.22), rgba(45,107,74,0.12))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'linear-gradient(135deg, rgba(45,107,74,0.14), rgba(45,107,74,0.06))';
                }}
              >
                {language === 'ko'
                  ? '루틴 빌더로 계속하기'
                  : language === 'de'
                    ? 'Weiter zum Routine-Builder'
                    : 'Continue to Routine Builder'}
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
