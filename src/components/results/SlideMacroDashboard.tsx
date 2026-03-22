/**
 * SlideMacroDashboard.tsx — Slide 0 Redesign
 * Compact Hero + Tab Navigation (My Routine / Insights) + Sticky Cart Bar
 */

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, ChevronDown } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDiagnosisStore } from '@/store/diagnosisStore';
import { buildRoutineV5 } from '@/engine/routineEngineV5';
import type { DiagnosisResult, AxisKey } from '@/engine/types';
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_KEYS } from '@/engine/types';
import type { RoutineStep, MockProduct } from '@/engine/routineEngine';
import { tokens, ctaTokens, glassTokens } from '@/lib/designTokens';
import { useTheme } from 'next-themes';
import {
  scoreColor, scoreBorderColor, scoreBgColor, categoryTint,
  AXIS_INTERPRETATIONS, CRITICAL_MESSAGES, FLAG_MESSAGES,
  getProductPrice, AGE_CYCLE_MAP, ROLE_EMOJI,
} from './sharedResultsData';
import BarrierRecoveryMode from './BarrierRecoveryMode';

// ── Axis Labels KO ──────────────────────────────────────────────────────────
const AXIS_LABELS_KO: Record<AxisKey, string> = {
  seb: '피지', hyd: '수분', bar: '장벽', sen: '민감성', ox: '산화',
  acne: '여드름', pigment: '색소', texture: '피부결', aging: '노화',
  makeup_stability: '메이크업',
};
// DE abbreviated for small containers (≤64px ring)
const AXIS_LABELS_DE_SHORT: Record<AxisKey, string> = {
  seb: 'Talg', hyd: 'Feucht.', bar: 'Barriere', sen: 'Empfindl.', ox: 'Oxidation',
  acne: 'Unreinh.', pigment: 'Pigment', texture: 'Textur', aging: 'Alterung',
  makeup_stability: 'Make-up',
};
function axisLabel(axis: AxisKey, lang: string, short = false) {
  if (lang === 'ko') return AXIS_LABELS_KO[axis];
  if (lang === 'de') return short ? AXIS_LABELS_DE_SHORT[axis] : AXIS_LABELS_DE[axis];
  return AXIS_LABELS[axis];
}

// ── i18n Copy ─────────────────────────────────────────────────────────────────
const C = {
  diagnosis_eyebrow: { ko: '피부 진단 결과', de: 'IHRE HAUTDIAGNOSE', en: 'YOUR SKIN DIAGNOSIS' },
  confidence_badge: { ko: '{N}% 진단 신뢰도 · {M}개 신호 분석', de: '{N}% Diagnose-Vertrauen · {M} Signale analysiert', en: '{N}% Diagnosis confidence · {M} signals analyzed' },
  top_concern_suffix: { ko: '이(가) 가장 높아요', de: ' ist am höchsten', en: ' is your top concern' },
  top_concern_neglect: { ko: '방치하면 악화가 가속돼요.', de: 'Unbehandelt beschleunigt sich die Verschlechterung.', en: 'Left untreated, this will accelerate.' },
  remaining_more: { ko: '+{N}개 더', de: '+{N} weitere', en: '+{N} more' },
  tab_routine: { ko: '내 루틴', de: 'Meine Routine', en: 'My routine' },
  tab_zone_care: { ko: '집중 케어', de: 'Intensivpflege', en: 'Focus Care' },
  tab_insights: { ko: '인사이트', de: 'Einblicke', en: 'Insights' },
  tier_3step: { ko: '3단계', de: '3 Schritte', en: '3-Step' },
  tier_3step_sub: { ko: '기본', de: 'Basis', en: 'Basic' },
  tier_5step: { ko: '5단계', de: '5 Schritte', en: '5-Step' },
  tier_5step_sub: { ko: '풀 프로토콜', de: 'Voll-Protokoll', en: 'Full Protocol' },
  tier_5plus: { ko: '5+기기', de: '5+Gerät', en: '5+Device' },
  tier_5plus_sub: { ko: '어드밴스드', de: 'Erweitert', en: 'Advanced' },
  spf_required: { ko: '낮에는 선크림 필수!', de: 'Tagsüber ist Sonnenschutz Pflicht!', en: 'Sunscreen is essential during the day!' },
  step_targets: { ko: '#1 고민 타겟', de: 'Ihr Hauptanliegen', en: 'targets your #1 concern' },
  step_score_goal: { ko: '{a} 점수 {c} → 목표 {g} ({w}주)', de: '{a}-Score {c} → Ziel {g} ({w} Wo.)', en: '{a} score {c} → goal {g} ({w}wk)' },
  routine_summary: { ko: '{N}개 제품 · {P} 루틴', de: '{N} Produkte · {P}-Routine', en: '{N} products · {P} routine' },
  per_bottle: { ko: '1병당', de: 'pro Flasche', en: 'per bottle' },
  why_ingredient: { ko: '이 성분이 좋은 이유', de: 'Warum dieser Wirkstoff', en: 'Why This Ingredient' },
  matching_logic: { ko: '제품 매칭 로직', de: 'Matching-Logik', en: 'Matching Logic' },
  aix_matching: { ko: 'AIX 진단 매칭', de: 'AIX Diagnose', en: 'AIX Diagnosis Match' },
  zone_teaser_badge: { ko: '{N}곳 추가 관리 필요', de: '{N} Zonen brauchen Pflege', en: '{N} zones need care' },
  zone_teaser_no_extra: { ko: '모든 부위가 기본 루틴으로 관리됩니다', de: 'Alle Zonen werden durch die Basisroutine abgedeckt', en: 'All zones are covered by the basic routine' },
  zone_teaser_desc: { ko: '기본 루틴에 포함되지 않는 부위별 특수 성분이 필요해요', de: 'Spezielle Wirkstoffe, die nicht in der Basisroutine enthalten sind', en: 'Specialized ingredients not included in your basic routine' },
  zone_teaser_cta: { ko: '집중 케어에서 확인하기 →', de: 'In Intensivpflege ansehen →', en: 'View in Focus Care →' },
  skin_cycle_eyebrow: { ko: '당신의 피부 주기', de: 'IHR HAUTZYKLUS', en: 'YOUR SKIN CYCLE' },
  skin_cycle_unit: { ko: '일', de: 'Tage', en: 'days' },
  skin_cycle_age_desc: { ko: '{age} 평균 피부 재생 주기', de: 'Durchschnittlicher Hauterneuerungszyklus für {age}', en: 'Average skin renewal cycle for {age}' },
  cycle_checkin: { ko: '첫 체크인', de: 'Erster Check-in', en: 'First check-in' },
  cycle_refill: { ko: '리필 시점', de: 'Nachfüllzeitpunkt', en: 'Refill timing' },
  cycle_results: { ko: '성과 측정', de: 'Ergebnismessung', en: 'Results measurement' },
  cycle_explanation: { ko: '당신의 피부는 {N}일마다 새로 태어나요. 새 세포가 표면에 도달하면 이전 제품의 효과를 정확히 평가할 수 있어요. 그때 3문항 체크인으로 루틴을 최적화합니다.', de: 'Ihre Haut erneuert sich alle {N} Tage. Wenn neue Zellen die Oberfläche erreichen, können wir die Wirkung Ihrer Produkte genau bewerten. Dann optimieren wir Ihre Routine mit einem 3-Fragen-Check-in.', en: 'Your skin renews every {N} days. When new cells reach the surface, we can precisely evaluate product effectiveness. We then optimize your routine with a 3-question check-in.' },
  day_start: { ko: '새 세포 생성', de: 'Neue Zellentstehung', en: 'New cell formation' },
  day_end: { ko: '각질 탈락', de: 'Zellabschuppung', en: 'Cell shedding' },
  role_label: { ko: '역할', de: 'Rolle', en: 'Role' },
  form_label: { ko: '제형', de: 'Form.', en: 'Form.' },
  // ── BARRIER_EMERGENCY zone care teaser ──────────────────────────────────
  barrier_zone_teaser_focus: {
    ko: '민감성이 높아 지금은 피부 장벽 복구에 집중합니다.',
    de: 'Hohe Sensitivität — Fokus auf Barriere-Erholung.',
    en: 'High sensitivity detected — focusing on barrier recovery first.',
  },
} as const;

type LangKey = 'en' | 'de' | 'ko';
function tx(key: string, lang: LangKey, vars?: Record<string, string | number>): string {
  const entry = C[key as keyof typeof C];
  if (!entry) return key;
  let s: string = entry[lang] ?? entry.en;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
}

// ── AIX Insight Content ─────────────────────────────────────────────────────
const AIX_CONTENT: Record<string, { en: string; de: string; ko: string }> = {
  cleanser: { en: 'pH-balanced barrier support. Gentle surfactants that cleanse without stripping.', de: 'pH-ausgewogene Barriere-Unterstützung. Sanfte Tenside.', ko: 'pH 균형 클렌저. 순한 계면활성제 구성.' },
  toner: { en: 'Hydrating toner to restore moisture immediately after cleansing.', de: 'Feuchtigkeitstoner zur sofortigen Wiederherstellung.', ko: '세안 직후 수분 보충 토너.' },
  serum: { en: 'Active serum targeting your primary concern axis.', de: 'Aktives Serum für Ihre Hauptbesorgnis.', ko: '주요 축 타겟팅 액티브 세럼.' },
  treatment: { en: 'Targeted treatment for secondary concerns.', de: 'Gezielte Behandlung für sekundäre Anliegen.', ko: '2차 관심사를 위한 타겟 트리트먼트.' },
  moisturizer: { en: 'Barrier-sealing moisturiser matched to your base type.', de: 'Barriere-versiegelnde Feuchtigkeitscreme.', ko: '기초 타입에 맞춘 장벽 밀봉 보습제.' },
  spf: { en: 'Broad-spectrum UV protection.', de: 'Breitspektrum UV-Schutz.', ko: '광범위 자외선 차단.' },
  device: { en: 'Clinical EMS/LED device. Amplifies serum penetration by up to 3×.', de: 'Klinisches EMS/LED-Gerät.', ko: '임상 등급 EMS/LED 기기.' },
};

// ── Circular Score Ring 점수링 디자인 ─────────────────────────────────────────────────────
const CircularScore = memo(function CircularScore({ axis, score, lang, size = 56, isDark = false }: {
  axis: AxisKey; score: number; lang: LangKey; size?: number; isDark?: boolean;
}) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = scoreColor(score);
  const textColor = isDark ? '#F5F5F7' : '#1B2838'; // tok.text
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.1} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.32} fontWeight={600} fill={textColor}
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >{Math.round(score)}</text>
      </svg>
      <span style={{
        fontSize: 'clamp(0.625rem, 0.9vw, 0.75rem)', fontWeight: 800,
        textAlign: 'center',
        color: isDark ? '#86868B' : '#6B7280', // tok.textSecondary
        whiteSpace: 'nowrap',
        maxWidth: 90,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{axisLabel(axis, lang, true)}</span>
    </div>
  );
});

// ── Types ────────────────────────────────────────────────────────────────────
type TierKey = '3-step' | '5-step' | 'advanced';
type TabKey = 'routine' | 'insights';
type FilteredStep = RoutineStep & { product: MockProduct };

type CartItem = { id: string; price: number; role: string; emoji: string };
interface Props {
  result: DiagnosisResult;
  onGoToLab?: () => void;
  onTierChange?: (steps: FilteredStep[]) => void;
  onAddToCart?: (item: CartItem) => void;
}

const DISCOUNT_PCT = 0.18;

// ── Main Component ──────────────────────────────────────────────────────────
export default function SlideMacroDashboard({ result, onGoToLab, onTierChange, onAddToCart }: Props) {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en' as LangKey;
  const implicitFlags = useDiagnosisStore((s) => s.implicitFlags);
  const axisAnswers = useDiagnosisStore((s) => s.axisAnswers);
  const selectedZones = useDiagnosisStore((s) => s.selectedZones);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const glassTok = glassTokens(isDark);

  const [activeTier, setActiveTier] = useState<TierKey>('5-step');
  const [timing, setTiming] = useState<'am' | 'pm'>('am');
  const [activeTab, setActiveTab] = useState<TabKey>('routine');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAxis, setExpandedAxis] = useState<AxisKey | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // ── EXP_AGE & Cycle ──────────────────────────────────────────────────────
  const expAge = axisAnswers?.EXP_AGE as number | undefined;
  const ageBracket = expAge !== undefined && expAge in AGE_CYCLE_MAP ? expAge : 2;
  const { cycleDays, ageLabel } = AGE_CYCLE_MAP[ageBracket];

  // ── Routines ─────────────────────────────────────────────────────────────
  const routines = useMemo(() => ({
    entry: buildRoutineV5(result, implicitFlags, 'Entry'),
    full: buildRoutineV5(result, implicitFlags, 'Full'),
    premium: buildRoutineV5(result, implicitFlags, 'Premium'),
  }), [result, implicitFlags]);

  const currentSteps = useMemo<FilteredStep[]>(() => {
    let level;
    if (activeTier === '3-step') level = routines.entry.routines.minimalist;
    else if (activeTier === 'advanced') level = routines.premium.routines.advanced ?? routines.premium.routines.committed;
    else level = routines.full.routines.committed;
    const steps = timing === 'am' ? level.am : level.pm;
    const filtered = steps.filter((s): s is FilteredStep => s.product !== null);
    const seen = new Set<string>();
    return filtered.filter((s) => { if (seen.has(s.product.id)) return false; seen.add(s.product.id); return true; });
  }, [routines, activeTier, timing]);

  // Fix #5: notify parent whenever steps change (tier switch → cart bar update)
  useEffect(() => {
    onTierChange?.(currentSteps);
  }, [currentSteps, onTierChange]);

  // ── Sorted axes ──────────────────────────────────────────────────────────
  const activeAxes = useMemo(() =>
    AXIS_KEYS.map((k) => ({ axis: k, score: result.axis_scores[k] ?? 0 }))
      .filter((a) => a.score > 0).sort((a, b) => b.score - a.score),
    [result]);
  const topAxis = activeAxes[0];

  const patternNameEN = result.detected_patterns[0]?.pattern.name_en ?? 'Balanced Profile';
  const p = result.detected_patterns[0]?.pattern as unknown as Record<string, string> | undefined;
  const patternName = language === 'de' ? (p?.name_de ?? patternNameEN) : language === 'ko' ? (p?.name_ko ?? patternNameEN) : patternNameEN;

  const signalCount = result.radar_chart_data.reduce((sum, d) => sum + (d.score > 0 ? 1 : 0), 0);
  const confidence = Math.min(95, 65 + signalCount * 3);

  // ── Zone severity — SINGLE SOURCE OF TRUTH for teaser + zone care tab ─────
  const CONCERN_AXIS_MAP: Record<string, AxisKey> = {
    oiliness: 'seb', dryness: 'hyd', barrier: 'bar', sensitivity: 'sen',
    acne: 'acne', breakouts: 'acne', pigment: 'pigment', dark_spots: 'pigment',
    texture: 'texture', aging: 'aging', wrinkles: 'aging', uv_damage: 'ox',
  };
  const zoneSeverities = useMemo(() => {
    const entries = Object.entries(selectedZones ?? {});
    return entries.map(([zoneId, zone]) => {
      // Use zone_heatmap if available (intensity 0-1 → 0-100)
      const hm = result.zone_heatmap?.[zoneId as keyof typeof result.zone_heatmap];
      if (hm) return { zoneId, severity: hm.intensity * 100 };
      // Fallback: max axis score from zone's concerns
      if (!zone?.concerns?.length) return { zoneId, severity: 0 };
      const axes = zone.concerns.map(c => CONCERN_AXIS_MAP[c]).filter(Boolean) as AxisKey[];
      if (!axes.length) return { zoneId, severity: 50 };
      return { zoneId, severity: Math.max(...axes.map(a => result.axis_scores[a] ?? 0)) };
    });
  }, [selectedZones, result]);
  const zoneCounts = useMemo(() => ({
    urgent: zoneSeverities.filter(z => z.severity >= 70).length,
    moderate: zoneSeverities.filter(z => z.severity >= 30 && z.severity < 70).length,
    sufficient: zoneSeverities.filter(z => z.severity < 30).length,
    total: zoneSeverities.length,
    needsCare: zoneSeverities.filter(z => z.severity >= 30).length, // urgent + moderate
  }), [zoneSeverities]);

  // ── BARRIER_EMERGENCY detection ─────────────────────────────────────────
  const isBarrierEmergency = result.active_flags?.includes('BARRIER_EMERGENCY') ?? false;

  // ── Pricing ──────────────────────────────────────────────────────────────
  const routineTotal = useMemo(() => {
    const orig = currentSteps.reduce((s, st) => s + getProductPrice(st.product.id), 0);
    return { original: orig, discounted: Math.round(orig * (1 - DISCOUNT_PCT)) };
  }, [currentSteps]);


  const heroAnim = (i: number) => prefersReducedMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } };

  // ── Tier tabs data ───────────────────────────────────────────────────────
  const tierTabs: { key: TierKey; label: string; desc: string }[] = [
    { key: '3-step', label: tx('tier_3step', lang), desc: tx('tier_3step_sub', lang) },
    { key: '5-step', label: tx('tier_5step', lang), desc: tx('tier_5step_sub', lang) },
    { key: 'advanced', label: tx('tier_5plus', lang), desc: tx('tier_5plus_sub', lang) },
  ];

  return (
    <div className="results-slide flex flex-1 flex-col overflow-y-auto" style={{
      paddingInline: 'clamp(16px, 4vw, 40px)',
      paddingTop: 'clamp(20px, 4vw, 32px)',
      paddingBottom: 200,
      wordBreak: 'keep-all',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* ════════ HERO ════════ */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 3vw, 24px)' }}>

          {/* 1a. Eyebrow */}
          <motion.p {...heroAnim(0)} style={{
            fontSize: 'clamp(0.625rem, 1vw, 0.75rem)', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: tok.textTertiary, marginBottom: 6,
          }}>{tx('diagnosis_eyebrow', lang)}</motion.p>

          {/* 1b. Pattern title */}
          <motion.h1 {...heroAnim(1)} style={{
            fontSize: 'clamp(1.25rem, 2vw + 0.5rem, 1.75rem)', fontWeight: 300,
            lineHeight: 1.2, color: tok.text, margin: '0 0 8px',
          }}>{patternName}</motion.h1>

          {/* 1c. Confidence badge */}
          <motion.div {...heroAnim(2)} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{
              fontSize: 'clamp(0.625rem, 0.9vw, 0.75rem)', fontWeight: 500,
              padding: '4px 12px', borderRadius: 99,
              background: isDark ? 'rgba(45,107,74,0.08)' : 'rgba(94,139,104,0.08)',
              color: tok.accent,
            }}>{tx('confidence_badge', lang, { N: confidence, M: signalCount })}</span>
          </motion.div>

          {/* 1d. Top concern card (desktop only ≥768px) */}
          {topAxis && typeof window !== 'undefined' && window.innerWidth >= 768 && (
            <motion.div {...heroAnim(3)} style={{
              padding: 'clamp(12px, 2vw, 16px)', borderRadius: 12, textAlign: 'left',
              display: 'flex', gap: 12, alignItems: 'center',
              border: `1px solid ${scoreBorderColor(topAxis.score, 0.12)}`,
              background: scoreBgColor(topAxis.score, 0.04),
              marginBottom: 10,
            }}>
              <CircularScore axis={topAxis.axis} score={topAxis.score} lang={lang} size={80} isDark={isDark} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 'clamp(1rem, 1.5vw, 1.1875rem)', fontWeight: 600,
                  color: tok.text, marginBottom: 4, lineHeight: 1.3,
                }}>
                  {axisLabel(topAxis.axis, lang)}{tx('top_concern_suffix', lang)}
                </p>
                <p style={{
                  fontSize: 'clamp(0.8125rem, 1.2vw, 0.9375rem)', color: tok.textSecondary,
                  lineHeight: 1.55,
                }}>
                  {CRITICAL_MESSAGES[topAxis.axis]?.[lang] ?? ''}
                  {' '}{tx('top_concern_neglect', lang)}
                </p>
              </div>
            </motion.div>
          )}

          {/* 1e. Remaining axes as pills */}
          <motion.div {...heroAnim(4)} style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6,
          }}>
            {activeAxes.slice(0, 3).map(({ axis, score }) => {
              // Fix #3: severity-coded pill colors per light/dark mode
              const pillColor = score >= 70
                ? (isDark ? '#E24B4A' : '#A32D2D')
                : score >= 30
                  ? (isDark ? '#BA7517' : '#854F0B')
                  : (isDark ? '#86868B' : '#9CA3AF');
              const pillBg = score >= 70
                ? (isDark ? 'rgba(226,75,74,0.10)' : 'rgba(226,75,74,0.08)')
                : score >= 30
                  ? (isDark ? 'rgba(186,117,23,0.10)' : 'rgba(186,117,23,0.08)')
                  : (isDark ? 'rgba(134,134,139,0.10)' : 'rgba(134,134,139,0.08)');
              return (
                <span key={axis} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)', padding: '4px 12px', borderRadius: 99,
                  background: pillBg, color: pillColor, fontWeight: 500,
                  lineHeight: 1, whiteSpace: 'nowrap', textAlign: 'center',
                  verticalAlign: 'middle',
                }}>{axisLabel(axis, lang)} {Math.round(score)}</span>
              );
            })}
            {activeAxes.length > 3 && (
              <button onClick={() => setActiveTab('insights')} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)', padding: '4px 12px', borderRadius: 99,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                color: tok.textTertiary, fontWeight: 500, border: 'none', cursor: 'pointer',
                lineHeight: 1, whiteSpace: 'nowrap',
                transition: 'all 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; }}
              >{tx('remaining_more', lang, { N: activeAxes.length - 3 })}</button>
            )}
          </motion.div>
        </div>

        {/* ════════ TAB BAR ════════ */}
        <motion.div {...heroAnim(5)} style={{
          display: 'flex', borderBottom: `1px solid ${tok.border}`,
          marginBottom: 'clamp(12px, 2vw, 16px)',
        }}>
          {(['routine', 'insights'] as TabKey[]).map((tab) => {
            const active = activeTab === tab;
            const label = tab === 'routine' ? tx('tab_routine', lang) : tx('tab_insights', lang);
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                background: 'transparent', minHeight: 44,
                fontSize: 'clamp(0.8125rem, 1.2vw, 0.9375rem)', fontWeight: 500,
                      color: active ? tok.accent : tok.textTertiary,
                borderBottom: active ? `2px solid ${tok.accent}` : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}>{label}</button>
            );
          })}
        </motion.div>

        {/* ════════ TAB CONTENT ════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'routine' ? (
            <motion.div key="routine" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>

              {isBarrierEmergency ? (
                <BarrierRecoveryMode
                  lang={lang}
                  isDark={isDark}
                  tok={tok}
                  onAddToCart={onAddToCart ? (item) => {
                    onAddToCart(item);
                    setAddedIds((prev) => new Set([...prev, item.id]));
                  } : undefined}
                />
              ) : (
              <>
              {/* Tier selector */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8, borderRadius: 10, overflow: 'hidden' }}>
                {tierTabs.map((tab) => {
                  const isActive = activeTier === tab.key;
                  return (
                    <button key={tab.key} onClick={() => {
                      setActiveTier(tab.key);
                      setExpandedId(null);
                      // Fix #5: notify parent of tier change for cart bar reactivity
                    }} style={{
                      flex: 1, padding: '10px 4px', textAlign: 'center', border: 'none', cursor: 'pointer',
                      borderRadius: 10, minHeight: 44,
                      background: isActive ? (isDark ? 'rgba(74,158,104,0.08)' : 'rgba(94,139,104,0.08)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      outline: isActive ? `1px solid ${isDark ? 'rgba(74,158,104,0.15)' : 'rgba(94,139,104,0.15)'}` : 'none',
                    }}>
                      <div style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 500, color: isActive ? tok.accent : tok.textSecondary }}>{tab.label}</div>
                      <div style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', color: isActive ? (isDark ? 'rgba(74,158,104,0.7)' : 'rgba(61,107,74,0.7)') : tok.textTertiary }}>{tab.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* AM/PM toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${tok.border}` }}>
                  {(['am', 'pm'] as const).map((t) => (
                    <button key={t} onClick={() => setTiming(t)} style={{
                      padding: '6px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      background: timing === t ? (t === 'am' ? 'rgba(186,117,23,0.08)' : 'rgba(134,134,139,0.08)') : 'transparent',
                      borderRight: t === 'am' ? `1px solid ${tok.border}` : 'none',
                    }}>
                      <span style={{ fontSize: 14 }}>{t === 'am' ? '☀️' : '🌙'}</span>
                      <span style={{
                        fontSize: 'clamp(0.5625rem, 0.8vw, 0.625rem)', fontWeight: 600,
                        color: timing === t ? (t === 'am' ? '#BA7517' : (isDark ? '#86868B' : '#6B7280')) : tok.textTertiary,
                      }}>{t.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                {timing === 'am' && (
                  <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} style={{
                    display: 'flex', alignItems: 'center', gap: 4, borderRadius: 99,
                    padding: '4px 10px', background: 'rgba(226,75,74,0.06)',
                  }}>
                    <span style={{ fontSize: 11 }}>☀️</span>
                    <span style={{ fontSize: 'clamp(0.625rem, 0.9vw, 0.75rem)', fontWeight: 600, color: isDark ? '#E24B4A' : '#A32D2D' }}>
                      {tx('spf_required', lang)}
                    </span>
                  </motion.div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vw, 8px)' }}>
                {currentSteps.map((step, i) => {
                  const price = getProductPrice(step.product.id);
                  const isKeyStep = topAxis && step.product.keyIngredients.some((ing) =>
                    (topAxis.axis === 'ox' && /vitamin\s*c|ascorb|antioxid/i.test(ing)) ||
                    (topAxis.axis === 'bar' && /ceramide|panthe|centella/i.test(ing)) ||
                    (topAxis.axis === 'hyd' && /hyaluron|glycerin/i.test(ing)) ||
                    (topAxis.axis === 'acne' && /salicyl|bha|niacin/i.test(ing)) ||
                    (topAxis.axis === 'seb' && /niacin|zinc|bha/i.test(ing)) ||
                    (topAxis.axis === 'aging' && /retinol|peptide|adenosine/i.test(ing)) ||
                    (topAxis.axis === 'pigment' && /vitamin\s*c|arbutin|tranexam/i.test(ing)) ||
                    (topAxis.axis === 'sen' && /centella|panthe|allantoin/i.test(ing)) ||
                    (topAxis.axis === 'texture' && /bha|aha|niacin/i.test(ing))
                  );
                  const isExpanded = expandedId === step.product.id;
                  const insight = AIX_CONTENT[step.role] ?? AIX_CONTENT['serum'];
                  const topAxes = Object.entries(result.axis_scores).filter(([_, s]) => s > 30).sort((a, b) => b[1] - a[1]).slice(0, 3) as [AxisKey, number][];
                  const proj = routines.full.projected_improvement[topAxis?.axis ?? 'hyd'];

                  return (
                    <motion.div key={`${activeTier}-${timing}-${step.product.id}`}
                      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      style={{
                        borderRadius: 12, overflow: 'hidden',
                        background: isKeyStep ? 'rgba(226,75,74,0.03)' : tok.bgCard,
                        border: `1px solid ${isKeyStep ? 'rgba(226,75,74,0.1)' : tok.border}`,
                      }}
                    >
                      <button onClick={() => setExpandedId(isExpanded ? null : step.product.id)}
                        style={{ width: '100%', padding: 'clamp(12px, 2vw, 16px)', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Step number */}
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'clamp(0.625rem, 0.8vw, 0.6875rem)', fontWeight: 600, flexShrink: 0,
                          background: isKeyStep ? 'rgba(226,75,74,0.12)' : 'rgba(74,158,104,0.12)',
                          color: isKeyStep ? '#E24B4A' : (tok.accent),
                        }}>{i + 1}</span>
                        {/* Product icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: categoryTint(step.role),
                          position: 'relative', overflow: 'hidden',
                        }}>
                          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{ROLE_EMOJI[step.role] ?? '💊'}</span>
                          <img src={`/productsimage/${step.product.id}.jpeg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        {/* Product info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', fontWeight: 600,
                              letterSpacing: '0.1em', textTransform: 'uppercase',
                              color: isKeyStep ? '#E24B4A' : tok.textTertiary,
                            }}>
                              {step.role.toUpperCase()}{isKeyStep ? ` — ${tx('step_targets', lang)}` : ''}
                            </span>
                          </div>
                          <p style={{
                            fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 500,
                            color: tok.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>{step.product.name[lang] ?? step.product.name.en}</p>
                          <p style={{
                            fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)', color: tok.textSecondary, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{step.product.keyIngredients.slice(0, 2).join(', ')}</p>
                          {isKeyStep && topAxis && (
                            <p style={{ fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)', color: scoreColor(topAxis.score), margin: '2px 0 0', fontWeight: 500 }}>
                              {tx('step_score_goal', lang, { a: axisLabel(topAxis.axis, lang), c: proj.currentScore, g: proj.targetScore4w, w: 8 })}
                            </p>
                          )}
                        </div>
                        {/* Price + add button + chevron */}
                        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {price > 0 && <div style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 500, color: tok.text }}>€{price}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {onAddToCart && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const item = { id: step.product.id, price, role: step.role, emoji: ROLE_EMOJI[step.role] ?? '💊' };
                                  onAddToCart(item);
                                  setAddedIds((prev) => new Set([...prev, step.product.id]));
                                }}
                                style={{
                                  padding: '3px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                  fontSize: '0.75rem', fontWeight: 600,
                                  background: addedIds.has(step.product.id) ? 'rgba(74,158,104,0.12)' : 'rgba(74,158,104,0.85)',
                                  color: addedIds.has(step.product.id) ? '#4A9E68' : '#FFFFFF',
                                  transition: 'all 0.2s ease',
                                  minWidth: 40,
                                }}
                              >
                                {addedIds.has(step.product.id) ? '✓' : (lang === 'ko' ? '추가' : lang === 'de' ? 'Add' : 'Add')}
                              </button>
                            )}
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown size={14} style={{ color: tok.textTertiary }} />
                            </motion.div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 clamp(12px, 2vw, 16px) clamp(12px, 2vw, 16px)', borderTop: `1px solid ${tok.border}` }}>
                              <div style={{ paddingTop: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                  <Sparkles size={12} style={{ color: tok.accent }} />
                                  <span style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tok.accent }}>
                                    {tx('why_ingredient', lang)}
                                  </span>
                                </div>
                                <p style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary, lineHeight: 1.5, margin: '0 0 8px' }}>{insight[lang]}</p>
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                  <Brain size={12} style={{ color: tok.accent }} />
                                  <span style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tok.accent }}>
                                    {tx('matching_logic', lang)}
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                                  {[{ l: tx('role_label', lang), v: step.role }, { l: tx('form_label', lang), v: step.product.formulation ?? '—' }].map(({ l, v }) => (
                                    <div key={l} style={{ borderRadius: 6, padding: '4px 6px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                                      <span style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', color: tok.textSecondary }}>{l} </span>
                                      <span style={{ fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 600, color: tok.text }}>{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                  <Brain size={12} style={{ color: tok.accent }} />
                                  <span style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tok.accent }}>
                                    {tx('aix_matching', lang)}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {topAxes.map(([a, s]) => (
                                    <span key={a} style={{
                                      fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                      background: `${scoreColor(s)}15`, border: `1px solid ${scoreColor(s)}33`, color: scoreColor(s),
                                    }}>{axisLabel(a, lang)} {Math.round(s)}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Routine total */}
              <div style={{
                marginTop: 'clamp(8px, 1.5vw, 12px)', padding: 'clamp(10px, 1.5vw, 14px)', borderRadius: 12,
                background: tok.bgCard, border: `1px solid ${tok.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary }}>
                  {tx('routine_summary', lang, { N: currentSteps.length, P: timing.toUpperCase() })}
                </span>
                <div>
                  {routineTotal.original > 0 && (
                    <span style={{ fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.textTertiary, textDecoration: 'line-through', marginRight: 6 }}>€{routineTotal.original}</span>
                  )}
                  <span style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 500, color: tok.text }}>€{routineTotal.discounted}</span>
                </div>
              </div>

              {/* Zone Care Teaser — uses shared zoneCounts (urgent + moderate only) */}
              {zoneCounts.total > 0 && (
                <motion.button onClick={() => onGoToLab?.()}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  style={{
                    width: '100%', marginTop: 'clamp(8px, 1.5vw, 12px)', padding: '10px 14px', borderRadius: 12,
                    background: isDark ? 'rgba(74,158,104,0.04)' : 'rgba(94,139,104,0.04)',
                    border: `1px solid ${isDark ? 'rgba(74,158,104,0.1)' : 'rgba(94,139,104,0.1)'}`,
                    cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary }}>{tx('tab_zone_care', lang)}</span>
                    {!isBarrierEmergency && zoneCounts.needsCare > 0 ? (
                      <span style={{
                        fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 600,
                        padding: '3px 8px', borderRadius: 99,
                        background: 'rgba(226,75,74,0.1)', color: '#E24B4A',
                      }}>{tx('zone_teaser_badge', lang, { N: zoneCounts.needsCare })}</span>
                    ) : !isBarrierEmergency ? (
                      <span style={{
                        fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', fontWeight: 500,
                        padding: '3px 8px', borderRadius: 99,
                        background: isDark ? 'rgba(74,158,104,0.08)' : 'rgba(94,139,104,0.08)',
                        color: tok.accent,
                      }}>✓</span>
                    ) : null}
                  </div>
                  <p style={{ fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    {isBarrierEmergency
                      ? tx('barrier_zone_teaser_focus', lang)
                      : zoneCounts.needsCare > 0 ? tx('zone_teaser_desc', lang) : tx('zone_teaser_no_extra', lang)}
                  </p>
                  {!isBarrierEmergency && zoneCounts.needsCare > 0 && (
                    <p style={{ fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.accent, margin: 0, fontWeight: 500 }}>
                      {tx('zone_teaser_cta', lang)}
                    </p>
                  )}
                </motion.button>
              )}
              </>
              )}
            </motion.div>
          ) : (
            /* ════════ INSIGHTS TAB ════════ */
            <motion.div key="insights" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>

              {/* Flag banners */}
              {result.active_flags?.map((flag) => {
                const msg = FLAG_MESSAGES[flag];
                if (!msg) return null;
                return (
                  <div key={flag} style={{
                    padding: 8, borderRadius: 10, marginBottom: 8,
                    background: 'rgba(226,75,74,0.04)', border: '1px solid rgba(226,75,74,0.1)',
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>{msg.icon}</span>
                    <div>
                  <p style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 600, color: '#E24B4A', margin: 0 }}>{msg.title[lang] ?? msg.title.en}</p>
                      <p style={{ fontSize: 'clamp(0.6875rem, 1vw, 0.8125rem)', color: tok.textSecondary, margin: '2px 0 0', lineHeight: 1.4 }}>{msg.body[lang] ?? msg.body.en}</p>
                    </div>
                  </div>
                );
              })}

              {/* 9 Axis grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))',
                gap: 'clamp(8px, 2vw, 16px)',
                justifyItems: 'center',
                marginBottom: 'clamp(12px, 2vw, 16px)',
              }}>
                {activeAxes.map(({ axis, score }) => (
                  <button key={axis} onClick={() => setExpandedAxis(expandedAxis === axis ? null : axis)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <CircularScore axis={axis} score={score} lang={lang} size={56} isDark={isDark} />
                  </button>
                ))}
              </div>

              {/* Axis detail card */}
              <AnimatePresence>
                {expandedAxis && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                      padding: 10, borderRadius: 10,
                      background: tok.bgCard, border: `1px solid ${tok.border}`,
                    }}>
                      <p style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 500, color: tok.text, margin: '0 0 4px' }}>
                        {axisLabel(expandedAxis, lang)} ({Math.round(result.axis_scores[expandedAxis] ?? 0)}/100)
                      </p>
                      <p style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', color: tok.textSecondary, lineHeight: 1.5, margin: 0 }}>
                        {AXIS_INTERPRETATIONS[expandedAxis]?.[lang]?.(result.axis_scores[expandedAxis] ?? 0) ?? ''}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skin Cell Turnover Cycle Card */}
              <div style={{
                padding: 14, borderRadius: 12,
                background: tok.bgCard, border: `1px solid ${tok.border}`,
              }}>
                <p style={{
                  fontSize: 'clamp(0.625rem, 1vw, 0.75rem)', fontWeight: 600,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: tok.textTertiary, textAlign: 'center', marginBottom: 8,
                }}>{tx('skin_cycle_eyebrow', lang)}</p>

                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, color: tok.text }}>{cycleDays}</span>
                  <span style={{ fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)', color: tok.textSecondary, marginLeft: 4 }}>{tx('skin_cycle_unit', lang)}</span>
                  <p style={{ fontSize: 'clamp(0.6875rem, 0.9vw, 0.75rem)', color: tok.textSecondary, margin: '4px 0 0' }}>
                    {tx('skin_cycle_age_desc', lang, { age: ageLabel[lang] ?? ageLabel.en })}
                  </p>
                </div>

                {/* Progress bar */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <div style={{
                    height: 8, borderRadius: 4, width: '100%',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 4, width: '100%',
                      background: 'linear-gradient(90deg, #4A9E68, #BA7517)',
                    }} />
                  </div>
                  <div style={{
                    position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
                    width: 2, height: 16, borderRadius: 1,
                    background: isDark ? '#F5F5F7' : '#1B2838',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', color: tok.textTertiary }}>Day 1 · {tx('day_start', lang)}</span>
                  <span style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', color: tok.textTertiary }}>Day {cycleDays} · {tx('day_end', lang)}</span>
                </div>

                {/* Three metric boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {[
                    { weeks: Math.round(cycleDays / 7), label: tx('cycle_checkin', lang), bg: 'rgba(74,158,104,0.04)', border: 'rgba(74,158,104,0.1)', color: tok.accent },
                    { weeks: Math.round(cycleDays * 2 / 7), label: tx('cycle_refill', lang), bg: 'rgba(186,117,23,0.04)', border: 'rgba(186,117,23,0.1)', color: '#BA7517' },
                    { weeks: Math.round(cycleDays * 4 / 7), label: tx('cycle_results', lang), bg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: tok.border, color: tok.text },
                  ].map(({ weeks, label, bg, border, color }) => (
                    <div key={label} style={{
                      padding: 8, borderRadius: 8, textAlign: 'center',
                      background: bg, border: `1px solid ${border}`,
                    }}>
                      <div style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)', fontWeight: 500, color }}>{weeks}{tx('skin_cycle_unit', lang) === '일' ? '주' : (lang === 'de' ? ' Wo.' : 'wk')}</div>
                      <div style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)', color: tok.textSecondary, marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <p style={{
                  fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                  color: tok.textSecondary, lineHeight: 1.6, textAlign: 'center', margin: 0,
                }}>{tx('cycle_explanation', lang, { N: cycleDays })}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
