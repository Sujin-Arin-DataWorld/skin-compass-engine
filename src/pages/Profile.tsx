/**
 * Profile.tsx — "My Skin Journal" Redesign
 * 
 * Philosophy: 여행 일지, 성적표가 아님.
 * 
 * Sections:
 *   ① Compact Score Hub — SVG ring (Oura-style) + 핵심 pill 3개
 *   ② Active Routine Card — 루틴 CTA (Noom-style)
 *   ③ Skin Trends — Sparkline + Target Trajectory
 *   ④ Full Breakdown — 10축 아코디언
 *   ⑤ Account — iOS Settings 스타일 경량화
 * 
 * Design tokens:
 *   ⬜ Solid backgrounds only (light: #FAFAF8, dark: theme)
 *   🎨 Status colors → ring gradient, thin border, text glow only
 *   ❌ No colored cards / backgrounds for hierarchy
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Sparkles, Calendar, LogOut, Globe, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSkinProfileStore } from '@/store/useSkinProfileStore';
import { useI18nStore } from '@/store/i18nStore';
import { useRoutineStore } from '@/store/useRoutineStore';
import { useAnalysisStore } from '@/store/analysisStore';
import { useSkinAnalysisStore } from '@/store/skinAnalysisStore';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { tokens, tierGradients, ctaGlowToken, glassTokens } from '@/lib/designTokens';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RoutinePicker from '@/components/routine/RoutinePicker';
import RoutineStepIcon from '@/components/routine/RoutineStepIcon';
import { buildProductBundleV5 } from '@/engine/routineEngineV5';
import type { UserSkinProfile, SkinAxis } from '@/types/skinProfile';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS & UTILS
// ═══════════════════════════════════════════════════════════════════════════════

type Lang = 'ko' | 'en' | 'de';

const HIGH_IS_BAD: SkinAxis[] = ['seb', 'sen', 'acne', 'pigment', 'aging', 'ox'];
const AXES: SkinAxis[] = ['seb', 'hyd', 'bar', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox', 'makeup_stability'];

function toHealthScore(axis: SkinAxis, raw: number): number {
  return HIGH_IS_BAD.includes(axis) ? 100 - raw : raw;
}

function getScoreTier(h: number): 'excellent' | 'good' | 'attention' | 'critical' {
  if (h >= 80) return 'excellent';
  if (h >= 65) return 'good';
  if (h >= 45) return 'attention';
  return 'critical';
}

// Status colors — ONLY for ring gradient, thin borders, text glow
const TIER_ACCENT: Record<string, string> = {
  excellent: '#4ECDC4',
  good: '#5E8B68',
  attention: '#C9A96E',
  critical: '#E8A87C',
};

const TIER_LABELS: Record<string, Record<Lang, string>> = {
  excellent: { ko: '우수', en: 'Excellent', de: 'Ausgezeichnet' },
  good: { ko: '양호', en: 'Good', de: 'Gut' },
  attention: { ko: '관리 필요', en: 'Needs Care', de: 'Pflegebedarf' },
  critical: { ko: '집중 케어', en: 'Urgent Care', de: 'Intensive Pflege' },
};

const AXIS_LABELS: Record<SkinAxis, Record<Lang, string>> = {
  seb: { ko: '유분 밸런스', en: 'Oil Balance', de: 'Öl-Balance' },
  hyd: { ko: '수분도', en: 'Hydration', de: 'Feuchtigkeit' },
  bar: { ko: '피부 장벽', en: 'Skin Barrier', de: 'Hautbarriere' },
  sen: { ko: '민감도', en: 'Sensitivity', de: 'Empfindlichkeit' },
  acne: { ko: '트러블', en: 'Breakout Control', de: 'Unreinheiten' },
  pigment: { ko: '톤 균일도', en: 'Tone Evenness', de: 'Ton-Gleichmäßigkeit' },
  texture: { ko: '피부결', en: 'Texture', de: 'Hauttextur' },
  aging: { ko: '탄력', en: 'Firmness', de: 'Straffheit' },
  ox: { ko: '환경 방어', en: 'Env. Shield', de: 'Umweltschutz' },
  makeup_stability: { ko: '화장 지속', en: 'Makeup Wear', de: 'Make-up-Halt' },
};

const AXIS_INSIGHTS: Record<SkinAxis, Record<Lang, { text: string; ingredients: string[] }>> = {
  seb: { ko: { text: 'T존 유분기가 높아요. 밸런싱 케어가 도움됩니다.', ingredients: ['나이아신아마이드', '살리실산', '그린티'] }, en: { text: 'T-zone tends to be oily. Balancing care helps.', ingredients: ['Niacinamide', 'Salicylic Acid', 'Green Tea'] }, de: { text: 'T-Zone neigt zu Öl. Ausgleichende Pflege hilft.', ingredients: ['Niacinamid', 'Salicylsäure', 'Grüntee'] } },
  hyd: { ko: { text: '수분 보유력이 낮아요. 히알루론산 기반 제품을 추천합니다.', ingredients: ['히알루론산', '세라마이드', '판테놀'] }, en: { text: 'Moisture retention is low. Hyaluronic acid recommended.', ingredients: ['Hyaluronic Acid', 'Ceramides', 'Panthenol'] }, de: { text: 'Feuchtigkeitsretention niedrig. Hyaluronsäure empfohlen.', ingredients: ['Hyaluronsäure', 'Ceramide', 'Panthenol'] } },
  bar: { ko: { text: '장벽이 약해져 있어요. 세라마이드 집중 보강이 필요합니다.', ingredients: ['세라마이드', '콜레스테롤', '지방산'] }, en: { text: 'Barrier is weakened. Ceramide reinforcement needed.', ingredients: ['Ceramides', 'Cholesterol', 'Fatty Acids'] }, de: { text: 'Barriere geschwächt. Ceramid-Verstärkung nötig.', ingredients: ['Ceramide', 'Cholesterin', 'Fettsäuren'] } },
  sen: { ko: { text: '자극에 민감한 상태예요. 저자극 제품을 사용하세요.', ingredients: ['시카', '알란토인', '마데카소사이드'] }, en: { text: 'Sensitive to stimuli. Use gentle products.', ingredients: ['Centella', 'Allantoin', 'Madecassoside'] }, de: { text: 'Empfindlich gegen Reize. Sanfte Produkte nutzen.', ingredients: ['Centella', 'Allantoin', 'Madecassosid'] } },
  acne: { ko: { text: '트러블이 잦아요. 진정 + 각질 케어를 병행하세요.', ingredients: ['티트리', 'BHA', '아젤라산'] }, en: { text: 'Breakouts occur easily. Combine calming + exfoliation.', ingredients: ['Tea Tree', 'BHA', 'Azelaic Acid'] }, de: { text: 'Unreinheiten häufig. Beruhigung + Peeling kombinieren.', ingredients: ['Teebaum', 'BHA', 'Azelainsäure'] } },
  pigment: { ko: { text: '색소 침착이 보여요. 브라이트닝 케어를 추천합니다.', ingredients: ['비타민C', '나이아신아마이드', '알부틴'] }, en: { text: 'Pigmentation visible. Brightening care recommended.', ingredients: ['Vitamin C', 'Niacinamide', 'Arbutin'] }, de: { text: 'Pigmentierung sichtbar. Aufhellende Pflege empfohlen.', ingredients: ['Vitamin C', 'Niacinamid', 'Arbutin'] } },
  texture: { ko: { text: '피부결이 거칠어요. 부드러운 각질 제거를 추천합니다.', ingredients: ['AHA', 'PHA', '효소 클렌저'] }, en: { text: 'Texture is rough. Gentle exfoliation recommended.', ingredients: ['AHA', 'PHA', 'Enzyme Cleanser'] }, de: { text: 'Hauttextur rau. Sanftes Peeling empfohlen.', ingredients: ['AHA', 'PHA', 'Enzymreiniger'] } },
  aging: { ko: { text: '탄력 저하가 시작됐어요. 콜라겐 부스팅이 효과적입니다.', ingredients: ['레티놀', '펩타이드', '콜라겐'] }, en: { text: 'Firmness decreasing. Collagen boosting effective.', ingredients: ['Retinol', 'Peptides', 'Collagen'] }, de: { text: 'Straffheit nimmt ab. Kollagen-Boosting effektiv.', ingredients: ['Retinol', 'Peptide', 'Kollagen'] } },
  ox: { ko: { text: '환경 스트레스에 노출돼 있어요. 항산화 케어를 강화하세요.', ingredients: ['비타민C', '비타민E', '페룰산'] }, en: { text: 'Exposed to environmental stress. Boost antioxidants.', ingredients: ['Vitamin C', 'Vitamin E', 'Ferulic Acid'] }, de: { text: 'Umweltstress ausgesetzt. Antioxidative Pflege verstärken.', ingredients: ['Vitamin C', 'Vitamin E', 'Ferulasäure'] } },
  makeup_stability: { ko: { text: '메이크업이 쉽게 무너져요. 수분-유분 밸런스가 핵심입니다.', ingredients: ['프라이머 에센스', '수분크림', '세팅 미스트'] }, en: { text: 'Makeup fades easily. Oil-moisture balance is key.', ingredients: ['Primer Essence', 'Moisturizer', 'Setting Mist'] }, de: { text: 'Make-up verblasst leicht. Öl-Feuchtigkeits-Balance ist entscheidend.', ingredients: ['Primer-Essenz', 'Feuchtigkeitscreme', 'Setting-Spray'] } },
};

function calculateOverallHealth(profile: UserSkinProfile): number {
  const total = AXES.reduce((sum, axis) => sum + toHealthScore(axis, profile.scores[axis]), 0);
  return Math.round(total / AXES.length);
}

function formatDateShort(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr);
  if (lang === 'ko') return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ① — COMPACT SCORE HUB (SVG Ring)
// ═══════════════════════════════════════════════════════════════════════════════

function ScoreRing({ score, size = 120, isDark = false }: { score: number; size?: number; isDark?: boolean }) {
  const tier = getScoreTier(score);
  const color = TIER_ACCENT[tier];
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const trackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  // Gradient colors based on tier
  const gradientId = `ring-gradient-${tier}`;
  const gradients: Record<string, [string, string]> = {
    excellent: ['#4ECDC4', '#2BAE66'],
    good: ['#5E8B68', '#8FC49F'],
    attention: ['#C9A96E', '#B08A4A'],
    critical: ['#E8A87C', '#D4845A'],
  };
  const [g1, g2] = gradients[tier];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={g1} />
          <stop offset="100%" stopColor={g2} />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={trackColor} strokeWidth={8}
      />
      {/* Progress */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={`url(#${gradientId})`} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - progress }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      {/* Center text */}
      <text
        x="50%" y="46%"
        textAnchor="middle" dominantBaseline="central"
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: size * 0.3,
          fontWeight: 700,
          fill: isDark ? '#F5F5F7' : '#1B2838',
        }}
      >
        {score}
      </text>
      <text
        x="50%" y="68%"
        textAnchor="middle" dominantBaseline="central"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: size * 0.09,
          fontWeight: 500,
          fill: isDark ? '#86868B' : '#9CA3AF',
        }}
      >
        / 100
      </text>
    </svg>
  );
}

function CompactScoreHub({
  activeProfile,
  userName,
  lang,
  onReanalyze,
  isDark,
  tok,
}: {
  activeProfile: UserSkinProfile | null;
  userName: string;
  lang: Lang;
  onReanalyze: () => void;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
}) {
  const overall = activeProfile ? calculateOverallHealth(activeProfile) : null;
  const tier = overall !== null ? getScoreTier(overall) : null;

  // Top 3 concerns (lowest health scores)
  const top3 = useMemo(() => {
    if (!activeProfile) return [];
    return AXES.map(axis => ({
      axis,
      health: toHealthScore(axis, activeProfile.scores[axis]),
    }))
      .sort((a, b) => a.health - b.health)
      .slice(0, 3);
  }, [activeProfile]);

  return (
    <section style={{ padding: '24px 20px 16px' }}>
      {/* Name + Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(94,139,104,0.1)',
          }}
        >
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 18, fontWeight: 600, color: tok.accent,
          }}>
            {userName?.charAt(0)?.toUpperCase() || 'S'}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
            fontSize: 20, fontWeight: 600, color: tok.text, margin: 0, lineHeight: 1.3,
          }}>
            {userName || 'Guest'}
          </h1>
          {activeProfile && (
            <p style={{ fontSize: 12, color: tok.textSecondary, margin: 0, marginTop: 2 }}>
              {lang === 'ko'
                ? `마지막 분석 · ${formatDateShort(activeProfile.createdAt, lang)}`
                : lang === 'de'
                  ? `Letzte Analyse · ${formatDateShort(activeProfile.createdAt, lang)}`
                  : `Last analysis · ${formatDateShort(activeProfile.createdAt, lang)}`}
            </p>
          )}
        </div>
      </div>

      {activeProfile && overall !== null && tier !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ring + Tier label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            <ScoreRing score={overall} size={140} isDark={isDark} />
            <div style={{
              marginTop: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, fontWeight: 600,
                color: TIER_ACCENT[tier],
              }}>
                {TIER_LABELS[tier][lang]}
              </span>
              <span style={{ fontSize: 11, color: tok.textSecondary }}>·</span>
              <span style={{
                fontSize: 11, color: tok.textSecondary,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {lang === 'ko' ? '종합 피부 건강도' : lang === 'de' ? 'Gesamt-Hautgesundheit' : 'Overall Skin Health'}
              </span>
            </div>
          </div>

          {/* Top 3 concern pills */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
            marginBottom: 16,
          }}>
            {top3.map(({ axis, health }) => {
              const t = getScoreTier(health);
              const c = TIER_ACCENT[t];
              return (
                <span
                  key={axis}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    padding: '5px 12px', borderRadius: 99,
                    border: `1px solid ${c}30`,
                    color: c,
                    fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {AXIS_LABELS[axis][lang]} {health}
                </span>
              );
            })}
          </div>

          {/* Re-analyze button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.button
              onClick={onReanalyze}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 99,
                border: '1px solid rgba(94,139,104,0.2)',
                background: 'transparent',
                color: tok.accent,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <Calendar size={14} />
              {lang === 'ko' ? '다시 분석하기' : lang === 'de' ? 'Erneut analysieren' : 'Re-analyze'}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <NoAnalysisCTA lang={lang} isDark={isDark} tok={tok} />
      )}
    </section>
  );
}

function NoAnalysisCTA({ lang, isDark, tok }: { lang: Lang; isDark: boolean; tok: ReturnType<typeof tokens> }) {
  const navigate = useNavigate();
  return (
    <div style={{
      borderRadius: 16, padding: 24, textAlign: 'center',
      border: `1px dashed ${tok.accent}40`,
    }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: tok.text, marginBottom: 4 }}>
        {lang === 'ko' ? '아직 피부 분석을 하지 않았어요'
          : lang === 'de' ? 'Noch keine Hautanalyse durchgeführt'
            : "You haven't done a skin analysis yet"}
      </p>
      <p style={{ fontSize: 12, color: tok.textSecondary, marginBottom: 16 }}>
        {lang === 'ko' ? 'AI가 30초 안에 피부 상태를 분석해드려요'
          : lang === 'de' ? 'KI analysiert Ihren Hautzustand in 30 Sekunden'
            : 'AI analyzes your skin in 30 seconds'}
      </p>
      <button
        onClick={() => { useAnalysisStore.getState().reset(); useSkinAnalysisStore.getState().resetAnalysis(); navigate('/skin-analysis'); }}
        style={{
          display: 'inline-block',
          padding: '10px 24px', borderRadius: 12,
          background: isDark ? 'linear-gradient(135deg, #4A9E68, #2D7A48)' : 'linear-gradient(135deg, #5E8B68, #3D6B4A)',
          color: '#fff', fontSize: 14, fontWeight: 600,
          textDecoration: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        {lang === 'ko' ? 'AI 피부 분석 시작 →'
          : lang === 'de' ? 'KI-Hautanalyse starten →'
            : 'Start AI Skin Analysis →'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ② — ACTIVE ROUTINE CARD (Noom-style CTA)
// ═══════════════════════════════════════════════════════════════════════════════

function ActiveRoutineCard({
  lang,
  hasAnalysis,
  onOpenPicker,
  isDark,
  tok,
}: {
  lang: Lang;
  hasAnalysis: boolean;
  onOpenPicker: () => void;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
}) {
  const selectedTier = useRoutineStore((s) => s.selectedTier);
  const hasRoutine = selectedTier !== null;
  const G = glassTokens(isDark).card;

  const tierConfig: Record<string, { label: Record<Lang, string>; steps: string[]; total: number }> = {
    essential: {
      label: { ko: '에센셜 루틴', en: 'Essential Routine', de: 'Essential-Routine' },
      steps: ['cleanser', 'toner', 'moisturizer'],
      total: 4,
    },
    complete: {
      label: { ko: '풀 케어 루틴', en: 'Complete Routine', de: 'Komplett-Routine' },
      steps: ['cleanser', 'toner', 'serum', 'eye_care', 'moisturizer'],
      total: 6,
    },
    pro: {
      label: { ko: '프로 루틴', en: 'Pro Routine', de: 'Pro-Routine' },
      steps: ['cleanser', 'toner', 'serum', 'eye_care', 'moisturizer'],
      total: 7,
    },
  };

  const config = selectedTier ? tierConfig[selectedTier] : null;

  return (
    <section style={{ padding: '0 20px 16px' }}>
      <motion.button
        onClick={onOpenPicker}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', textAlign: 'left',
          borderRadius: 16, padding: 20,
          border: hasRoutine ? `1px solid ${tok.accent}25` : `1px dashed ${tok.accent}40`,
          background: G.background,
          backdropFilter: G.backdropFilter,
          WebkitBackdropFilter: G.WebkitBackdropFilter,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {hasRoutine && config ? (
          <>
            {/* Active routine state */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#5E8B68" />
                <span style={{
                  fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
                  fontSize: 15, fontWeight: 600, color: tok.text,
                }}>
                  {config.label[lang]}
                </span>
              </div>
              <span style={{
                fontSize: 11, color: tok.textSecondary,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {lang === 'ko' ? `총 ${config.total}제품` : `${config.total} products`}
              </span>
            </div>

            {/* Step icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              {config.steps.map((step) => (
                <RoutineStepIcon key={step} stepKey={step} size={32} />
              ))}
              <span style={{ color: tok.textSecondary, fontSize: 12, marginInline: 2 }}>+</span>
              <RoutineStepIcon stepKey="spf" size={32} />
              {selectedTier === 'pro' && <RoutineStepIcon stepKey="device" size={32} />}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: tok.accent, fontSize: 13, fontWeight: 500,
            }}>
              <span>
                {lang === 'ko' ? 'Lab에서 루틴 관리하기'
                  : lang === 'de' ? 'Routine im Lab verwalten'
                    : 'Manage routine in Lab'}
              </span>
              <ChevronRight size={14} />
            </div>
          </>
        ) : (
          <>
            {/* No routine state */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={18} color="#5E8B68" />
              <span style={{
                fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
                fontSize: 15, fontWeight: 600, color: tok.text,
              }}>
                {lang === 'ko' ? '맞춤 루틴 만들기'
                  : lang === 'de' ? 'Routine zusammenstellen'
                    : 'Build your routine'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: tok.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
              {lang === 'ko' ? '분석 결과 기반으로 3가지 루틴 중 선택하세요'
                : lang === 'de' ? 'Wählen Sie aus 3 Routinen basierend auf Ihrer Analyse'
                  : 'Choose from 3 routines based on your analysis'}
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: tok.accent, fontSize: 13, fontWeight: 500,
            }}>
              <span>
                {lang === 'ko' ? '3가지 루틴 살펴보기'
                  : lang === 'de' ? '3 Routinen ansehen'
                    : 'Explore 3 routines'}
              </span>
              <ChevronRight size={14} />
            </div>
          </>
        )}
      </motion.button>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ③ — SKIN TRENDS (Sparkline + Target Trajectory)
// ═══════════════════════════════════════════════════════════════════════════════

interface HistoryRecord {
  id: string;
  created_at: string;
  is_active: boolean;
  analysis_method: string;
  score_sebum: number;
  score_hydration: number;
  score_barrier: number;
  score_sensitivity: number;
  score_acne: number;
  score_pigment: number;
  score_texture: number;
  score_aging: number;
  score_oxidation: number;
  score_makeup_stability: number;
}

function overallFromRecord(r: HistoryRecord): number {
  const scores: Record<SkinAxis, number> = {
    seb: r.score_sebum ?? 50, hyd: r.score_hydration ?? 50, bar: r.score_barrier ?? 50,
    sen: r.score_sensitivity ?? 50, acne: r.score_acne ?? 50, pigment: r.score_pigment ?? 50,
    texture: r.score_texture ?? 50, aging: r.score_aging ?? 50, ox: r.score_oxidation ?? 50,
    makeup_stability: r.score_makeup_stability ?? 50,
  };
  const total = AXES.reduce((sum, axis) => sum + toHealthScore(axis, scores[axis]), 0);
  return Math.round(total / AXES.length);
}

function SparklineSVG({ points, width = 280, height = 60, isDark = false }: { points: number[]; width?: number; height?: number; isDark?: boolean }) {
  if (points.length === 0) return null;

  const padding = 8;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const minVal = Math.max(0, Math.min(...points) - 10);
  const maxVal = Math.min(100, Math.max(...points) + 10);
  const range = maxVal - minVal || 1;

  const coords = points.map((v, i) => ({
    x: padding + (points.length > 1 ? (i / (points.length - 1)) * w : w / 2),
    y: padding + h - ((v - minVal) / range) * h,
  }));

  const pathD = coords.length === 1
    ? ''
    : coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  // Target trajectory (dotted line showing ideal improvement)
  const lastScore = points[points.length - 1];
  const targetScore = Math.min(85, lastScore + 15);
  const targetY = padding + h - ((targetScore - minVal) / range) * h;
  const targetStartX = coords[coords.length - 1]?.x ?? w / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5E8B68" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#5E8B68" />
        </linearGradient>
      </defs>

      {/* Actual data line */}
      {coords.length > 1 && (
        <motion.path
          d={pathD}
          fill="none" stroke="url(#sparkline-grad)" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Target trajectory (dotted) */}
      <line
        x1={targetStartX} y1={coords[coords.length - 1]?.y ?? h / 2}
        x2={width - padding} y2={targetY}
        stroke="#4ECDC4" strokeWidth={1.5}
        strokeDasharray="4,4" opacity={0.5}
      />

      {/* Data points */}
      {coords.map((c, i) => (
        <motion.circle
          key={i}
          cx={c.x} cy={c.y} r={4}
          fill={isDark ? '#1A1A1C' : '#FAFAF8'} stroke="#5E8B68" strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + i * 0.1 }}
        />
      ))}

      {/* Target point (hollow) */}
      <circle
        cx={width - padding} cy={targetY} r={4}
        fill="none" stroke="#4ECDC4" strokeWidth={1.5}
        strokeDasharray="2,2" opacity={0.6}
      />
    </svg>
  );
}

function SkinTrends({
  userId,
  activeProfile,
  lang,
  onOpenPicker,
  isDark,
  tok,
}: {
  userId: string;
  activeProfile: UserSkinProfile | null;
  lang: Lang;
  onOpenPicker: () => void;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
}) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const G = glassTokens(isDark).card;

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('user_skin_profiles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(10);
        if (!error && data) setHistory(data as HistoryRecord[]);
      } catch { /* silent */ }
    };
    fetchHistory();
  }, [userId]);

  const overallPoints = useMemo(() => history.map(overallFromRecord), [history]);
  const currentScore = activeProfile ? calculateOverallHealth(activeProfile) : null;

  // Change indicator
  const change = useMemo(() => {
    if (overallPoints.length < 2) return null;
    const diff = overallPoints[overallPoints.length - 1] - overallPoints[overallPoints.length - 2];
    return diff;
  }, [overallPoints]);

  return (
    <section style={{ padding: '0 20px 16px' }}>
      <h2 style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        fontSize: 16, fontWeight: 600, color: tok.text,
        marginBottom: 12,
      }}>
        {lang === 'ko' ? '피부 변화 추이' : lang === 'de' ? 'Hauttrends' : 'Skin Trends'}
      </h2>

      <div style={{
        borderRadius: 16, padding: 20,
        background: G.background,
        backdropFilter: G.backdropFilter,
        WebkitBackdropFilter: G.WebkitBackdropFilter,
        border: G.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        {/* Sparkline chart */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <SparklineSVG points={overallPoints.length > 0 ? overallPoints : (currentScore ? [currentScore] : [50])} />
        </div>

        {/* Change indicator or target trajectory message */}
        {change !== null && change !== 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            border: `1px solid ${change > 0 ? '#4ECDC430' : '#FF6B6B30'}`,
          }}>
            <span style={{ fontSize: 16 }}>{change > 0 ? '↑' : '↓'}</span>
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: change > 0 ? '#4ECDC4' : '#FF6B6B',
            }}>
              {lang === 'ko'
                ? `지난 분석 대비 ${Math.abs(change)}점 ${change > 0 ? '개선' : '하락'}`
                : lang === 'de'
                  ? `${Math.abs(change)} Punkte ${change > 0 ? 'verbessert' : 'verschlechtert'}`
                  : `${Math.abs(change)} points ${change > 0 ? 'improved' : 'decreased'}`}
            </span>
          </div>
        ) : (
          /* Single data point — Target Trajectory message */
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: 12, color: tok.textSecondary, lineHeight: 1.6, marginBottom: 10,
            }}>
              {lang === 'ko'
                ? 'Skin Strategy Lab의 맞춤 루틴을 꾸준히 진행했을 때\n기대되는 4주 뒤의 변화입니다'
                : lang === 'de'
                  ? 'Die erwartete Veränderung nach 4 Wochen\nmit Ihrer personalisierten Routine'
                  : 'Expected improvement after 4 weeks\nwith your personalized routine'}
            </p>
            <motion.button
              onClick={onOpenPicker}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 99,
                background: isDark ? 'linear-gradient(135deg, #4A9E68, #2D7A48)' : 'linear-gradient(135deg, #5E8B68, #3D6B4A)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}
            >
              <Sparkles size={14} />
              {lang === 'ko' ? '루틴 시작하기' : lang === 'de' ? 'Routine starten' : 'Start routine'}
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ④ — FULL BREAKDOWN (Accordion)
// ═══════════════════════════════════════════════════════════════════════════════

function AxisAccordionItem({
  axis,
  health,
  lang,
  isOpen,
  onToggle,
  isDark,
  tok,
}: {
  axis: SkinAxis;
  health: number;
  lang: Lang;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
}) {
  const tier = getScoreTier(health);
  const color = TIER_ACCENT[tier];
  const insight = AXIS_INSIGHTS[axis]?.[lang];

  return (
    <div style={{
      borderBottom: `1px solid ${tok.border}`,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          padding: '14px 0', border: 'none', background: 'transparent',
          cursor: 'pointer', gap: 12,
        }}
      >
        {/* Color dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, flexShrink: 0,
        }} />

        {/* Axis name */}
        <span style={{
          flex: 1, textAlign: 'left',
          fontSize: 14, fontWeight: 500, color: tok.text,
          fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
        }}>
          {AXIS_LABELS[axis][lang]}
        </span>

        {/* Score */}
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 18, fontWeight: 700, color,
          marginRight: 8,
        }}>
          {health}
        </span>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} color={tok.textSecondary} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && insight && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: 14, paddingLeft: 20 }}>
              <p style={{
                fontSize: 13, color: tok.textSecondary, lineHeight: 1.6, marginBottom: 10,
              }}>
                {insight.text}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {insight.ingredients.map((ing) => (
                  <span
                    key={ing}
                    style={{
                      fontSize: 11, fontWeight: 500,
                      padding: '3px 10px', borderRadius: 99,
                      border: `1px solid ${color}30`,
                      color,
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FullBreakdown({ activeProfile, lang, isDark, tok }: { activeProfile: UserSkinProfile; lang: Lang; isDark: boolean; tok: ReturnType<typeof tokens> }) {
  const [openAxis, setOpenAxis] = useState<SkinAxis | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const allAxes = useMemo(() =>
    AXES.map(axis => ({
      axis,
      health: toHealthScore(axis, activeProfile.scores[axis]),
    })).sort((a, b) => a.health - b.health),
    [activeProfile]);

  return (
    <section style={{ padding: '0 20px 16px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: 'none', background: 'transparent', cursor: 'pointer',
          paddingBottom: 8,
        }}
      >
        <h2 style={{
          fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
          fontSize: 16, fontWeight: 600, color: tok.text, margin: 0,
        }}>
          {lang === 'ko' ? '전체 피부 분석' : lang === 'de' ? 'Vollständige Analyse' : 'Full Breakdown'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: tok.textSecondary }}>
          <span style={{ fontSize: 12 }}>
            {lang === 'ko' ? '10개 축' : '10 axes'}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              overflow: 'hidden',
              borderRadius: 16,
              background: isDark ? 'rgba(28,28,30,0.7)' : '#FFFFFF',
              border: `1px solid ${tok.border}`,
              boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.03)',
              paddingInline: 16,
            }}
          >
            {allAxes.map(({ axis, health }) => (
              <AxisAccordionItem
                key={axis}
                axis={axis}
                health={health}
                lang={lang}
                isOpen={openAxis === axis}
                isDark={isDark}
                tok={tok}
                onToggle={() => setOpenAxis(openAxis === axis ? null : axis)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ⑤ — ACCOUNT (iOS Settings style)
// ═══════════════════════════════════════════════════════════════════════════════

function AccountSection({ email, lang, onLogout, isDark, tok }: {
  email: string | undefined;
  lang: Lang;
  onLogout: () => void;
  isDark: boolean;
  tok: ReturnType<typeof tokens>;
}) {
  const langDisplay: Record<Lang, string> = { ko: '한국어', de: 'Deutsch', en: 'English' };

  const items = [
    {
      icon: <Mail size={16} color={tok.textSecondary} />,
      label: lang === 'ko' ? '이메일' : 'Email',
      value: email || '-',
    },
    {
      icon: <Globe size={16} color={tok.textSecondary} />,
      label: lang === 'ko' ? '언어' : lang === 'de' ? 'Sprache' : 'Language',
      value: langDisplay[lang],
    },
  ];

  return (
    <section style={{ padding: '0 20px 32px' }}>
      <h2 style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        fontSize: 14, fontWeight: 600, color: tok.textSecondary,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 8,
      }}>
        {lang === 'ko' ? '계정' : lang === 'de' ? 'Konto' : 'Account'}
      </h2>

      <div style={{
        borderRadius: 12,
        background: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
        border: `1px solid ${tok.border}`,
        overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginLeft: 44 }} />}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '13px 16px', gap: 12,
            }}>
              {item.icon}
              <span style={{ flex: 1, fontSize: 14, color: tok.textSecondary }}>{item.label}</span>
              <span style={{ fontSize: 14, color: tok.text }}>{item.value}</span>
            </div>
          </div>
        ))}

        <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginLeft: 44 }} />

        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            padding: '13px 16px', gap: 12,
            border: 'none', background: 'transparent', cursor: 'pointer',
          }}
        >
          <LogOut size={16} color="#FF6B6B" />
          <span style={{ fontSize: 14, color: '#FF6B6B' }}>
            {lang === 'ko' ? '로그아웃' : lang === 'de' ? 'Abmelden' : 'Sign Out'}
          </span>
        </button>
      </div>

      {/* Legal links */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
        <Link to="/impressum" style={{ fontSize: 11, color: tok.textSecondary, textDecoration: 'none' }}>
          {lang === 'ko' ? '이용약관' : 'Impressum'}
        </Link>
        <Link to="/datenschutz" style={{ fontSize: 11, color: tok.textSecondary, textDecoration: 'none' }}>
          {lang === 'ko' ? '개인정보처리방침' : 'Datenschutz'}
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUEST VIEW (not logged in)
// ═══════════════════════════════════════════════════════════════════════════════

function GuestView({ lang, isDark, tok }: { lang: Lang; isDark: boolean; tok: ReturnType<typeof tokens> }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '50vh', padding: '0 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${tok.accent}14`, marginBottom: 16,
      }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: tok.accent }}>S</span>
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: tok.text, marginBottom: 4 }}>
        {lang === 'ko' ? '로그인 후 피부 분석 결과를 저장하세요'
          : lang === 'de' ? 'Melden Sie sich an, um Ihre Analyse zu speichern'
            : 'Sign in to save your skin analysis'}
      </p>
      <p style={{ fontSize: 13, color: tok.textSecondary, marginBottom: 24 }}>
        {lang === 'ko' ? '분석 기록, 루틴, 변화 추이를 한눈에 확인할 수 있어요'
          : lang === 'de' ? 'Verlauf, Routine und Veränderungen auf einen Blick'
            : 'View history, routine, and progress at a glance'}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          to="/login"
          style={{
            padding: '10px 24px', borderRadius: 12,
            border: `1px solid ${tok.accent}40`,
            color: tok.accent, fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          {lang === 'ko' ? '로그인' : lang === 'de' ? 'Anmelden' : 'Sign In'}
        </Link>
        <Link
          to="/signup"
          style={{
            padding: '10px 24px', borderRadius: 12,
            background: isDark ? 'linear-gradient(135deg, #4A9E68, #2D7A48)' : 'linear-gradient(135deg, #5E8B68, #3D6B4A)',
            color: '#fff', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          {lang === 'ko' ? '회원가입' : lang === 'de' ? 'Registrieren' : 'Sign Up'}
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Profile() {
  const { isLoggedIn, userProfile, logout } = useAuthStore();
  const { activeProfile } = useSkinProfileStore();
  const { language } = useI18nStore();
  const { isPickerOpen, openPicker, closePicker, setSelectedTier } = useRoutineStore();
  const navigate = useNavigate();
  const lang = (['ko', 'de'].includes(language) ? language : 'en') as Lang;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const G = glassTokens(isDark).card;

  const userName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName ?? ''}`.trim()
    : userProfile?.email?.split('@')[0] ?? '';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Section spacing
  const sectionGap = <div style={{ height: 8 }} />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: tok.bg, color: tok.text, transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <Navbar />

      <main style={{ paddingTop: 80, paddingBottom: 16, maxWidth: 480, marginInline: 'auto', position: 'relative', zIndex: 10 }}>
        {!isLoggedIn || !userProfile ? (
          <GuestView lang={lang} isDark={isDark} tok={tok} />
        ) : (
          <>
            {/* ① Compact Score Hub */}
            <CompactScoreHub
              activeProfile={activeProfile}
              userName={userName}
              lang={lang}
              onReanalyze={() => { useAnalysisStore.getState().reset(); useSkinAnalysisStore.getState().resetAnalysis(); navigate('/skin-analysis'); }}
              isDark={isDark}
              tok={tok}
            />

            {activeProfile && (
              <>
                {sectionGap}

                {/* ② Active Routine Card */}
                <ActiveRoutineCard
                  lang={lang}
                  hasAnalysis={!!activeProfile}
                  onOpenPicker={openPicker}
                  isDark={isDark}
                  tok={tok}
                />

                {sectionGap}

                {/* ③ Skin Trends */}
                {userProfile && (
                  <SkinTrends
                    userId={userProfile.userId}
                    activeProfile={activeProfile}
                    lang={lang}
                    onOpenPicker={openPicker}
                    isDark={isDark}
                    tok={tok}
                  />
                )}

                {sectionGap}

                {/* ④ Full Breakdown */}
                <FullBreakdown activeProfile={activeProfile} lang={lang} isDark={isDark} tok={tok} />
              </>
            )}

            {sectionGap}
            {sectionGap}

            {/* ⑤ Account */}
            <AccountSection
              email={userProfile.email}
              lang={lang}
              onLogout={handleLogout}
              isDark={isDark}
              tok={tok}
            />
          </>
        )}
      </main>

      <Footer />

      {/* RoutinePicker bottom sheet */}
      <RoutinePicker
        isOpen={isPickerOpen}
        onClose={closePicker}
        onConfirm={(tierId) => {
          closePicker();
          setSelectedTier(tierId);
          if (activeProfile?.scores) {
            const s = activeProfile.scores;
            const axis_scores = {
              seb: s.seb, hyd: s.hyd, bar: s.bar, sen: s.sen, ox: s.ox,
              acne: s.acne, pigment: s.pigment, texture: s.texture,
              aging: s.aging, makeup_stability: s.makeup_stability,
            };
            const axis_severity = {} as Record<string, number>;
            const primaryConcerns: string[] = [];
            for (const key of Object.keys(axis_scores)) {
              const score = axis_scores[key as keyof typeof axis_scores];
              axis_severity[key] = score > 60 ? 2 : score < 40 ? 1 : 0;
              if (score > 60) primaryConcerns.push(key);
            }
            const tierMap: Record<string, 'Entry' | 'Full' | 'Premium'> = {
              essential: 'Entry', complete: 'Full', pro: 'Premium',
            };
            const engineTier = tierMap[tierId] ?? 'Full';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tempResult: any = {
              engineVersion: 'v5-profile-restore',
              axis_scores,
              axis_scores_normalized: { ...axis_scores },
              axis_severity,
              primary_concerns: primaryConcerns.slice(0, 5),
              secondary_concerns: [],
              detected_patterns: [],
              urgency_level: 'MEDIUM',
              active_flags: [],
              radar_chart_data: Object.entries(axis_scores).map(([k, v]) => ({ axis: k, score: v, label: k })),
              product_bundle: {},
            };
            const flags = { atopyFlag: false, likelyHormonalCycleUser: false, likelyShaver: false };
            tempResult.product_bundle = buildProductBundleV5(tempResult, flags, engineTier);
            useAnalysisStore.getState().setResult(tempResult);
          }
          navigate('/results');
        }}
      />
    </div>
  );
}
