/**
 * Sprint 5 — Profile Page Redesign
 *
 * Sections 0–5:
 *   0. Profile Header (avatar + overall health card)
 *   1. Skin Profile (10-axis health score grid)
 *   2. Top 3 Focus Points (lowest axes)
 *   3. Analysis History (timeline from Supabase)
 *   4. My Routine (CTA to Lab)
 *   5. Account Settings (email, language, logout, legal)
 *
 * Data source: useSkinProfileStore → activeProfile (UserSkinProfile)
 * Auth:        useAuthStore → isLoggedIn, userProfile, logout
 * i18n:        useI18nStore → language
 *
 * CONSTRAINTS:
 *   ❌ No Radar/Spider charts
 *   ❌ No new npm packages
 *   ❌ No Supabase schema changes
 *   ❌ No raw score exposure — all UI uses toHealthScore()
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useSkinProfileStore } from '@/store/useSkinProfileStore';
import { useI18nStore } from '@/store/i18nStore';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { UserSkinProfile, SkinAxis } from '@/types/skinProfile';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

type Lang = 'ko' | 'en' | 'de';

const HIGH_IS_BAD: SkinAxis[] = ['seb', 'sen', 'acne', 'pigment', 'aging', 'ox'];

function toHealthScore(axis: SkinAxis, raw: number): number {
  return HIGH_IS_BAD.includes(axis) ? 100 - raw : raw;
}

function getScoreTier(h: number): 'excellent' | 'good' | 'attention' | 'critical' {
  if (h >= 80) return 'excellent';
  if (h >= 65) return 'good';
  if (h >= 45) return 'attention';
  return 'critical';
}

const TIER_COLORS = {
  excellent: '#4ECDC4',
  good: '#8a9a7b',
  attention: '#c4a265',
  critical: '#E8A87C',
} as const;

const TIER_LABELS: Record<string, Record<Lang, string>> = {
  excellent: { ko: '우수', en: 'Excellent', de: 'Ausgezeichnet' },
  good: { ko: '양호', en: 'Good', de: 'Gut' },
  attention: { ko: '보통', en: 'Fair', de: 'Mäßig' },
  critical: { ko: '주의', en: 'Needs Care', de: 'Pflegebedarf' },
};

const AXES: SkinAxis[] = ['seb', 'hyd', 'bar', 'sen', 'acne', 'pigment', 'texture', 'aging', 'ox', 'makeup_stability'];

const AXIS_LABELS: Record<SkinAxis, Record<Lang, string>> = {
  seb: { ko: '유분 밸런스', en: 'Oil Balance', de: 'Öl-Balance' },
  hyd: { ko: '수분도', en: 'Hydration', de: 'Feuchtigkeit' },
  bar: { ko: '피부 장벽', en: 'Skin Barrier', de: 'Hautbarriere' },
  sen: { ko: '민감도 방어', en: 'Sensitivity Defense', de: 'Empfindlichkeitsschutz' },
  acne: { ko: '트러블 관리', en: 'Breakout Control', de: 'Unreinheiten-Kontrolle' },
  pigment: { ko: '톤 균일도', en: 'Tone Evenness', de: 'Ton-Gleichmäßigkeit' },
  texture: { ko: '피부결', en: 'Skin Texture', de: 'Hauttextur' },
  aging: { ko: '탄력 방어', en: 'Firmness Defense', de: 'Straffheitsschutz' },
  ox: { ko: '환경 방어', en: 'Environmental Shield', de: 'Umweltschutz' },
  makeup_stability: { ko: '화장 지속력', en: 'Makeup Wear', de: 'Make-up-Haltbarkeit' },
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

function formatMonth(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr);
  if (lang === 'ko') return `${d.getMonth() + 1}월`;
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'short' });
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 0: PROFILE HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function NoAnalysisCTA({ lang }: { lang: Lang }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'rgba(138, 154, 123, 0.06)',
        border: '1px dashed rgba(138, 154, 123, 0.3)',
      }}
    >
      <p className="text-sm mb-1" style={{ color: '#1a1a18', fontWeight: 500 }}>
        {lang === 'ko' ? '아직 피부 분석을 하지 않았어요'
          : lang === 'de' ? 'Sie haben noch keine Hautanalyse durchgeführt'
            : "You haven't done a skin analysis yet"}
      </p>
      <p className="text-xs mb-4" style={{ color: '#9a9590' }}>
        {lang === 'ko' ? 'AI가 30초 안에 피부 상태를 분석해드려요'
          : lang === 'de' ? 'KI analysiert Ihren Hautzustand in 30 Sekunden'
            : 'AI analyzes your skin condition in 30 seconds'}
      </p>
      <Link
        to="/skin-analysis"
        className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium"
        style={{ backgroundColor: '#8a9a7b', color: '#fff' }}
      >
        {lang === 'ko' ? 'AI 피부 분석 시작 →'
          : lang === 'de' ? 'KI-Hautanalyse starten →'
            : 'Start AI Skin Analysis →'}
      </Link>
    </div>
  );
}

function OverallHealthCard({ score, lang }: { score: number; lang: Lang }) {
  const tier = getScoreTier(score);
  const color = TIER_COLORS[tier];

  const messages: Record<string, Record<Lang, string>> = {
    excellent: {
      ko: '피부 상태가 매우 좋습니다! 현재 루틴을 유지하세요.',
      en: 'Your skin is in excellent condition!',
      de: 'Ihre Haut ist in ausgezeichnetem Zustand!',
    },
    good: {
      ko: '전반적으로 양호해요. 몇 가지 포인트 케어로 더 좋아질 수 있어요.',
      en: 'Overall good. Targeted care can make it even better.',
      de: 'Insgesamt gut. Gezielte Pflege kann es noch verbessern.',
    },
    attention: {
      ko: '지금이 케어 골든타임이에요 — 맞춤 솔루션을 확인해보세요.',
      en: "Now is the golden time — check your customized solutions.",
      de: 'Jetzt ist die goldene Zeit — prüfen Sie Ihre Lösungen.',
    },
    critical: {
      ko: '집중 케어가 필요합니다. 맞춤 루틴을 시작해보세요.',
      en: 'Intensive care is needed. Start your custom routine.',
      de: 'Intensive Pflege nötig. Starten Sie Ihre Routine.',
    },
  };

  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{
        background: '#fff',
        border: '1px solid rgba(26, 26, 24, 0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs tracking-wider uppercase mb-3" style={{ color: '#9a9590' }}>
        {lang === 'ko' ? '종합 피부 건강도' : lang === 'de' ? 'Gesamt-Hautgesundheit' : 'Overall Skin Health'}
      </p>

      <div className="flex items-center gap-3 mb-3">
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 40, fontWeight: 700, color: '#1a1a18', lineHeight: 1,
        }}>
          {score}
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {TIER_LABELS[tier][lang]}
        </span>
      </div>

      <div className="w-full h-2 rounded-full mb-3" style={{ backgroundColor: 'rgba(26,26,24,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>

      <p className="text-sm leading-relaxed" style={{
        fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
        color: '#6B7280',
      }}>
        {messages[tier][lang]}
      </p>
    </motion.div>
  );
}

function ProfileHeader({ userName, activeProfile, lang }: {
  userName: string;
  activeProfile: UserSkinProfile | null;
  lang: Lang;
}) {
  const overallHealth = activeProfile ? calculateOverallHealth(activeProfile) : null;

  return (
    <section className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(138, 154, 123, 0.15)' }}
          >
            <span style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 18, fontWeight: 600, color: '#8a9a7b',
            }}>
              {userName?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <div>
            <h1 style={{
              fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
              fontSize: 20, fontWeight: 600, color: '#1a1a18',
            }}>
              {userName || 'Guest'}
            </h1>
            {activeProfile && (
              <p className="text-xs mt-0.5" style={{ color: '#9a9590' }}>
                {lang === 'ko'
                  ? `마지막 분석: ${formatDateShort(activeProfile.createdAt, lang)}`
                  : lang === 'de'
                    ? `Letzte Analyse: ${formatDateShort(activeProfile.createdAt, lang)}`
                    : `Last analysis: ${formatDateShort(activeProfile.createdAt, lang)}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {activeProfile && overallHealth !== null ? (
        <OverallHealthCard score={overallHealth} lang={lang} />
      ) : (
        <NoAnalysisCTA lang={lang} />
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SKIN PROFILE GRID (10-axis)
// ═══════════════════════════════════════════════════════════════════════════════

function SkinProfileGrid({ activeProfile, lang }: { activeProfile: UserSkinProfile; lang: Lang }) {
  return (
    <section className="px-5 py-6">
      <h2 className="text-base font-semibold mb-4" style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        color: '#1a1a18',
      }}>
        {lang === 'ko' ? '피부 프로필' : lang === 'de' ? 'Hautprofil' : 'Skin Profile'}
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        {AXES.map((axis, i) => {
          const raw = activeProfile.scores[axis];
          const health = toHealthScore(axis, raw);
          const tier = getScoreTier(health);
          const color = TIER_COLORS[tier];

          return (
            <motion.div
              key={axis}
              className="rounded-xl p-3"
              style={{
                background: '#fff',
                border: '1px solid rgba(26,26,24,0.06)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <p className="text-[11px] mb-1.5" style={{ color: '#9a9590' }}>
                {AXIS_LABELS[axis][lang]}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <span style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 22, fontWeight: 700, color: '#1a1a18',
                }}>
                  {health}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {TIER_LABELS[tier][lang]}
                </span>
              </div>

              <div className="w-full h-1 rounded-full" style={{ backgroundColor: 'rgba(26,26,24,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(health, 4)}%`, backgroundColor: color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <Link
        to="/lab"
        className="flex items-center justify-center gap-1 mt-4 py-3 rounded-xl text-sm font-medium"
        style={{ backgroundColor: 'rgba(138, 154, 123, 0.08)', color: '#8a9a7b' }}
      >
        {lang === 'ko' ? '맞춤 제품 추천 보러가기'
          : lang === 'de' ? 'Personalisierte Empfehlungen ansehen'
            : 'View Personalized Recommendations'}
        <span>→</span>
      </Link>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: TOP 3 FOCUS POINTS
// ═══════════════════════════════════════════════════════════════════════════════

const INSIGHTS: Record<SkinAxis, Record<Lang, { insight: string; ingredients: string }>> = {
  seb: {
    ko: { insight: 'T존 유분기가 높은 편이에요. 밸런싱 케어가 도움됩니다.', ingredients: '나이아신아마이드, 살리실산, 그린티' },
    en: { insight: 'T-zone tends to be oily. Balancing care helps.', ingredients: 'Niacinamide, Salicylic Acid, Green Tea' },
    de: { insight: 'T-Zone neigt zu Öl. Ausgleichende Pflege hilft.', ingredients: 'Niacinamid, Salicylsäure, Grüntee' },
  },
  hyd: {
    ko: { insight: '수분 보유력이 낮아요. 히알루론산 기반 제품을 추천합니다.', ingredients: '히알루론산, 세라마이드, 판테놀' },
    en: { insight: 'Moisture retention is low. Hyaluronic acid products recommended.', ingredients: 'Hyaluronic Acid, Ceramides, Panthenol' },
    de: { insight: 'Feuchtigkeitsretention ist niedrig. Hyaluronsäure empfohlen.', ingredients: 'Hyaluronsäure, Ceramide, Panthenol' },
  },
  bar: {
    ko: { insight: '피부 장벽이 약해져 있어요. 세라마이드 집중 보강이 필요합니다.', ingredients: '세라마이드, 콜레스테롤, 지방산' },
    en: { insight: 'Skin barrier is weakened. Ceramide reinforcement needed.', ingredients: 'Ceramides, Cholesterol, Fatty Acids' },
    de: { insight: 'Die Hautbarriere ist geschwächt. Ceramid-Verstärkung nötig.', ingredients: 'Ceramide, Cholesterin, Fettsäuren' },
  },
  sen: {
    ko: { insight: '외부 자극에 민감한 상태예요. 저자극 제품 위주로 사용하세요.', ingredients: '시카, 알란토인, 마데카소사이드' },
    en: { insight: 'Sensitive to external stimuli. Use gentle products.', ingredients: 'Centella, Allantoin, Madecassoside' },
    de: { insight: 'Empfindlich gegen Reize. Verwenden Sie sanfte Produkte.', ingredients: 'Centella, Allantoin, Madecassosid' },
  },
  acne: {
    ko: { insight: '트러블이 자주 발생하는 편이에요. 진정 + 각질 관리를 병행하세요.', ingredients: '티트리, BHA, 아젤라산' },
    en: { insight: 'Breakouts are frequent. Combine calming with exfoliation.', ingredients: 'Tea Tree, BHA, Azelaic Acid' },
    de: { insight: 'Unreinheiten sind häufig. Beruhigung + Peeling kombinieren.', ingredients: 'Teebaum, BHA, Azelainsäure' },
  },
  pigment: {
    ko: { insight: '색소 침착이 보여요. 브라이트닝 케어로 톤을 균일하게 만들어요.', ingredients: '비타민C, 나이아신아마이드, 알부틴' },
    en: { insight: 'Pigmentation visible. Brightening care for even tone.', ingredients: 'Vitamin C, Niacinamide, Arbutin' },
    de: { insight: 'Pigmentierung sichtbar. Aufhellende Pflege für gleichmäßigen Ton.', ingredients: 'Vitamin C, Niacinamid, Arbutin' },
  },
  texture: {
    ko: { insight: '피부결이 거칠어요. 부드러운 각질 케어를 추천합니다.', ingredients: 'AHA, PHA, 효소 클렌저' },
    en: { insight: 'Skin texture is rough. Gentle exfoliation recommended.', ingredients: 'AHA, PHA, Enzyme Cleanser' },
    de: { insight: 'Die Hauttextur ist rau. Sanftes Peeling empfohlen.', ingredients: 'AHA, PHA, Enzymreiniger' },
  },
  aging: {
    ko: { insight: '탄력 저하가 시작됐어요. 콜라겐 부스팅 케어가 효과적입니다.', ingredients: '레티놀, 펩타이드, 콜라겐' },
    en: { insight: 'Firmness is decreasing. Collagen boosting care is effective.', ingredients: 'Retinol, Peptides, Collagen' },
    de: { insight: 'Die Straffheit nimmt ab. Kollagen-Boosting ist effektiv.', ingredients: 'Retinol, Peptide, Kollagen' },
  },
  ox: {
    ko: { insight: '자외선/환경 스트레스에 노출돼 있어요. 항산화 케어를 강화하세요.', ingredients: '비타민C, 비타민E, 페룰산' },
    en: { insight: 'Exposed to UV/environmental stress. Boost antioxidant care.', ingredients: 'Vitamin C, Vitamin E, Ferulic Acid' },
    de: { insight: 'UV-/Umweltstress ausgesetzt. Antioxidative Pflege verstärken.', ingredients: 'Vitamin C, Vitamin E, Ferulasäure' },
  },
  makeup_stability: {
    ko: { insight: '메이크업이 쉽게 무너지는 편이에요. 수분-유분 밸런스 조절이 핵심입니다.', ingredients: '프라이머 에센스, 수분크림, 세팅 미스트' },
    en: { insight: 'Makeup tends to fade easily. Oil-moisture balance is key.', ingredients: 'Primer Essence, Moisturizer, Setting Mist' },
    de: { insight: 'Make-up verblasst leicht. Öl-Feuchtigkeits-Balance ist entscheidend.', ingredients: 'Primer-Essenz, Feuchtigkeitscreme, Setting-Spray' },
  },
};

function TopConcerns({ activeProfile, lang }: { activeProfile: UserSkinProfile; lang: Lang }) {
  const sorted = useMemo(() =>
    AXES.map(axis => ({
      axis,
      health: toHealthScore(axis, activeProfile.scores[axis]),
    }))
      .sort((a, b) => a.health - b.health)
      .slice(0, 3),
    [activeProfile]);

  return (
    <section className="px-5 py-6">
      <h2 className="text-base font-semibold mb-4" style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        color: '#1a1a18',
      }}>
        {lang === 'ko' ? '집중 케어 포인트' : lang === 'de' ? 'Fokus-Pflegepunkte' : 'Focus Care Points'}
      </h2>

      <div className="flex flex-col gap-3">
        {sorted.map(({ axis, health }, i) => {
          const tier = getScoreTier(health);
          const color = TIER_COLORS[tier];
          const data = INSIGHTS[axis]?.[lang];

          return (
            <motion.div
              key={axis}
              className="rounded-xl p-4"
              style={{
                background: '#fff',
                border: `1px solid ${color}25`,
                borderLeft: `3px solid ${color}`,
              }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: '#1a1a18' }}>
                  {AXIS_LABELS[axis][lang]}
                </span>
                <div className="flex items-center gap-2">
                  <span style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 18, fontWeight: 700, color,
                  }}>
                    {health}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {TIER_LABELS[tier][lang]}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed mb-2" style={{ color: '#6B7280' }}>
                {data?.insight}
              </p>

              <div className="flex items-center gap-1">
                <span className="text-[10px]" style={{ color: '#8a9a7b' }}>
                  {lang === 'ko' ? '추천 성분' : lang === 'de' ? 'Empfohlene Wirkstoffe' : 'Recommended'}:
                </span>
                <span className="text-[10px] font-medium" style={{ color: '#1a1a18' }}>
                  {data?.ingredients}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: ANALYSIS HISTORY
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

function calculateOverallFromRecord(record: HistoryRecord): number {
  const scores: Record<SkinAxis, number> = {
    seb: record.score_sebum ?? 50,
    hyd: record.score_hydration ?? 50,
    bar: record.score_barrier ?? 50,
    sen: record.score_sensitivity ?? 50,
    acne: record.score_acne ?? 50,
    pigment: record.score_pigment ?? 50,
    texture: record.score_texture ?? 50,
    aging: record.score_aging ?? 50,
    ox: record.score_oxidation ?? 50,
    makeup_stability: record.score_makeup_stability ?? 50,
  };
  const total = AXES.reduce((sum, axis) => sum + toHealthScore(axis, scores[axis]), 0);
  return Math.round(total / AXES.length);
}

function ChangeIndicator({ current, previous, lang }: {
  current: HistoryRecord;
  previous: HistoryRecord;
  lang: Lang;
}) {
  const curOverall = calculateOverallFromRecord(current);
  const prevOverall = calculateOverallFromRecord(previous);
  const diff = curOverall - prevOverall;

  if (diff === 0) return null;
  const isUp = diff > 0;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: isUp ? 'rgba(78,205,196,0.08)' : 'rgba(232,168,124,0.08)' }}
    >
      <span style={{ color: isUp ? '#4ECDC4' : '#E8A87C', fontSize: 14 }}>
        {isUp ? '↑' : '↓'}
      </span>
      <span className="text-xs" style={{ color: isUp ? '#4ECDC4' : '#E8A87C' }}>
        {lang === 'ko'
          ? `지난 분석 대비 ${Math.abs(diff)}점 ${isUp ? '개선' : '하락'}`
          : lang === 'de'
            ? `${Math.abs(diff)} Punkte ${isUp ? 'verbessert' : 'verschlechtert'} seit letzter Analyse`
            : `${Math.abs(diff)} points ${isUp ? 'improved' : 'decreased'} since last`}
      </span>
    </div>
  );
}

function AnalysisHistory({ userId, lang }: { userId: string; lang: Lang }) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('user_skin_profiles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (!error && data) setHistory(data as HistoryRecord[]);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading || !history.length) return null;

  return (
    <section className="px-5 py-6">
      <h2 className="text-base font-semibold mb-4" style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        color: '#1a1a18',
      }}>
        {lang === 'ko' ? '분석 히스토리' : lang === 'de' ? 'Analyse-Verlauf' : 'Analysis History'}
      </h2>

      {history.length >= 2 && (
        <ChangeIndicator current={history[0]} previous={history[1]} lang={lang} />
      )}

      <div className="flex flex-col gap-2 mt-3">
        {history.map((record) => {
          const overall = calculateOverallFromRecord(record);
          const tier = getScoreTier(overall);

          return (
            <div
              key={record.id}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                background: record.is_active ? 'rgba(138,154,123,0.06)' : '#fff',
                border: '1px solid rgba(26,26,24,0.06)',
              }}
            >
              <div className="flex-shrink-0 text-center" style={{ width: 48 }}>
                <p className="text-[10px]" style={{ color: '#9a9590' }}>
                  {formatMonth(record.created_at, lang)}
                </p>
                <p style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 20, fontWeight: 700, color: '#1a1a18',
                }}>
                  {formatDay(record.created_at)}
                </p>
              </div>

              <div className="w-px h-10" style={{ backgroundColor: 'rgba(26,26,24,0.08)' }} />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: '#1a1a18' }}>
                    {record.analysis_method === 'camera'
                      ? (lang === 'ko' ? 'AI 분석' : lang === 'de' ? 'KI-Analyse' : 'AI Analysis')
                      : (lang === 'ko' ? '자가분석' : lang === 'de' ? 'Selbstanalyse' : 'Self-analysis')}
                  </span>
                  {record.is_active && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: '#8a9a7b', color: '#fff' }}>
                      {lang === 'ko' ? '현재' : lang === 'de' ? 'Aktuell' : 'Current'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: '#9a9590' }}>
                  {lang === 'ko' ? '종합 건강도' : lang === 'de' ? 'Gesamt' : 'Overall'}: {overall}
                </p>
              </div>

              <span style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 24, fontWeight: 700, color: TIER_COLORS[tier],
              }}>
                {overall}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: MY ROUTINE
// ═══════════════════════════════════════════════════════════════════════════════

function MyRoutineSection({ lang }: { lang: Lang }) {
  return (
    <section className="px-5 py-6">
      <h2 className="text-base font-semibold mb-4" style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        color: '#1a1a18',
      }}>
        {lang === 'ko' ? '내 루틴' : lang === 'de' ? 'Meine Routine' : 'My Routine'}
      </h2>

      <Link
        to="/lab"
        className="block rounded-xl p-5 text-center"
        style={{
          background: 'rgba(138,154,123,0.06)',
          border: '1px dashed rgba(138,154,123,0.3)',
        }}
      >
        <p className="text-sm mb-1" style={{ color: '#1a1a18', fontWeight: 500 }}>
          {lang === 'ko' ? '맞춤 루틴을 구성해보세요'
            : lang === 'de' ? 'Stellen Sie Ihre Routine zusammen'
              : 'Build your custom routine'}
        </p>
        <p className="text-xs" style={{ color: '#9a9590' }}>
          {lang === 'ko' ? '피부 분석 결과 기반으로 제품을 추천해드려요'
            : lang === 'de' ? 'Wir empfehlen Produkte basierend auf Ihrer Analyse'
              : 'Product recommendations based on your analysis'}
        </p>
        <span className="inline-block mt-3 text-sm font-medium" style={{ color: '#8a9a7b' }}>
          {lang === 'ko' ? 'Lab에서 루틴 만들기 →'
            : lang === 'de' ? 'Routine im Lab erstellen →'
              : 'Build routine in Lab →'}
        </span>
      </Link>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: ACCOUNT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

function AccountSettings({ email, lang, onLogout }: {
  email: string | undefined;
  lang: Lang;
  onLogout: () => void;
}) {
  const langDisplay: Record<Lang, string> = { ko: '한국어', de: 'Deutsch', en: 'English' };

  return (
    <section className="px-5 py-6 pb-32">
      <h2 className="text-base font-semibold mb-4" style={{
        fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
        color: '#1a1a18',
      }}>
        {lang === 'ko' ? '계정' : lang === 'de' ? 'Konto' : 'Account'}
      </h2>

      <div className="flex flex-col gap-0 rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(26,26,24,0.06)' }}
      >
        {/* Email */}
        <div className="flex items-center justify-between p-4 bg-white">
          <span className="text-sm" style={{ color: '#6B7280' }}>
            {lang === 'ko' ? '이메일' : 'Email'}
          </span>
          <span className="text-sm" style={{ color: '#1a1a18' }}>
            {email || '-'}
          </span>
        </div>

        <div className="h-px" style={{ backgroundColor: 'rgba(26,26,24,0.06)' }} />

        {/* Language */}
        <div className="flex items-center justify-between p-4 bg-white">
          <span className="text-sm" style={{ color: '#6B7280' }}>
            {lang === 'ko' ? '언어' : lang === 'de' ? 'Sprache' : 'Language'}
          </span>
          <span className="text-sm" style={{ color: '#1a1a18' }}>
            {langDisplay[lang]}
          </span>
        </div>

        <div className="h-px" style={{ backgroundColor: 'rgba(26,26,24,0.06)' }} />

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full text-left p-4 bg-white text-sm"
          style={{ color: '#E8A87C' }}
        >
          {lang === 'ko' ? '로그아웃' : lang === 'de' ? 'Abmelden' : 'Sign Out'}
        </button>
      </div>

      {/* Legal links */}
      <div className="flex gap-4 mt-4">
        <Link to="/impressum" className="text-[11px]" style={{ color: '#9a9590' }}>
          {lang === 'ko' ? '이용약관' : 'Impressum'}
        </Link>
        <Link to="/datenschutz" className="text-[11px]" style={{ color: '#9a9590' }}>
          {lang === 'ko' ? '개인정보처리방침' : 'Datenschutz'}
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: GUEST VIEW (not logged in)
// ═══════════════════════════════════════════════════════════════════════════════

function GuestView({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(138, 154, 123, 0.1)' }}
      >
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: '#8a9a7b' }}>S</span>
      </div>
      <p className="text-base font-medium mb-2" style={{ color: '#1a1a18' }}>
        {lang === 'ko' ? '로그인 후 피부 분석 결과를 저장하세요'
          : lang === 'de' ? 'Melden Sie sich an, um Ihre Analyse zu speichern'
            : 'Sign in to save your skin analysis'}
      </p>
      <p className="text-xs mb-6" style={{ color: '#9a9590' }}>
        {lang === 'ko' ? '분석 기록, 루틴, 변화 추이를 한눈에 확인할 수 있어요'
          : lang === 'de' ? 'Verlauf, Routine und Veränderungen auf einen Blick'
            : 'View history, routine, and progress at a glance'}
      </p>
      <div className="flex gap-3">
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ border: '1px solid #8a9a7b', color: '#8a9a7b' }}
        >
          {lang === 'ko' ? '로그인' : lang === 'de' ? 'Anmelden' : 'Sign In'}
        </Link>
        <Link
          to="/signup"
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#8a9a7b', color: '#fff' }}
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
  const navigate = useNavigate();
  const lang = (['ko', 'de'].includes(language) ? language : 'en') as Lang;

  const userName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName ?? ''}`.trim()
    : userProfile?.email?.split('@')[0] ?? '';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const divider = <div className="h-px mx-5" style={{ backgroundColor: 'rgba(26,26,24,0.06)' }} />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <Navbar />

      <main className="pt-20 pb-4 relative z-10" style={{ maxWidth: 480, marginInline: 'auto' }}>
        {!isLoggedIn || !userProfile ? (
          <GuestView lang={lang} />
        ) : (
          <>
            {/* Section 0: Profile Header */}
            <ProfileHeader
              userName={userName}
              activeProfile={activeProfile}
              lang={lang}
            />

            {activeProfile && (
              <>
                {/* Section 1: Skin Profile Grid */}
                {divider}
                <SkinProfileGrid activeProfile={activeProfile} lang={lang} />

                {/* Section 2: Top 3 Focus Points */}
                {divider}
                <TopConcerns activeProfile={activeProfile} lang={lang} />
              </>
            )}

            {/* Section 3: Analysis History */}
            {userProfile && (
              <>
                {divider}
                <AnalysisHistory userId={userProfile.userId} lang={lang} />
              </>
            )}

            {activeProfile && (
              <>
                {/* Section 4: My Routine */}
                {divider}
                <MyRoutineSection lang={lang} />
              </>
            )}

            {/* Section 5: Account Settings */}
            {divider}
            <AccountSettings
              email={userProfile.email}
              lang={lang}
              onLogout={handleLogout}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
