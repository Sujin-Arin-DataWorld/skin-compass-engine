import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useI18nStore } from "@/store/i18nStore";
import type { DiagnosisResult, AxisKey, ScoreProvenance, ZoneId, AxisExplanation } from "@/engine/types";
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_LABELS_KO, AXIS_LABELS_MALE, AXIS_LABELS_MALE_DE, AXIS_LABELS_MALE_KO, AXIS_KEYS } from "@/engine/types";
import RadarChart from "@/components/diagnosis/RadarChart";

// ─────────────────────────────────────────────────────────────────────────────
// i18n maps
// ─────────────────────────────────────────────────────────────────────────────


const AXIS_INTERPRETATIONS: Partial<Record<AxisKey, {
  en: (s: number) => string;
  de: (s: number) => string;
  ko: (s: number) => string;
}>> = {
  acne: {
    en: (s) => s >= 75 ? "Cyclical, likely hormonally driven" : s >= 50 ? "Moderate, inflammatory pattern" : "Occasional, surface-level",
    de: (s) => s >= 75 ? "Zyklisch, wahrscheinlich hormonell bedingt" : s >= 50 ? "Mäßiges, entzündliches Muster" : "Gelegentlich, oberflächlich",
    ko: (s) => s >= 75 ? "주기적, 호르몬성 가능성 높음" : s >= 50 ? "중간 수준의 염증 패턴" : "간헐적, 표면성",
  },
  seb: {
    en: (s) => s >= 75 ? "Rapid sebum return, T-zone dominant" : s >= 50 ? "Balanced but reactive to humidity" : "Controlled",
    de: (s) => s >= 75 ? "Schnelle Talgproduktion, T-Zonen-dominant" : s >= 50 ? "Ausgeglichen, reagiert auf Feuchtigkeit" : "Kontrolliert",
    ko: (s) => s >= 75 ? "빠른 피지 재분비, T존 집중" : s >= 50 ? "균형적이나 습도에 반응" : "조절됨",
  },
  hyd: {
    en: (s) => s >= 75 ? "Rapid moisture loss — barrier needs repair" : s >= 50 ? "Suboptimal moisture retention" : "Adequate",
    de: (s) => s >= 75 ? "Schneller Feuchtigkeitsverlust — Barriere braucht Reparatur" : s >= 50 ? "Suboptimale Feuchtigkeitsspeicherung" : "Ausreichend",
    ko: (s) => s >= 75 ? "빠른 수분 손실 — 장벽 회복 필요" : s >= 50 ? "수분 유지력 부족" : "적절함",
  },
  sen: {
    en: (s) => s >= 75 ? "High reactivity — multiple trigger exposure" : s >= 50 ? "Moderate — flush and thermal reactivity" : "Manageable",
    de: (s) => s >= 75 ? "Hohe Reaktivität — reagiert auf multiple Trigger" : s >= 50 ? "Mäßig — Flush und thermische Reaktivität" : "Handhabbar",
    ko: (s) => s >= 75 ? "높은 반응성 — 복수 자극 요인 노출" : s >= 50 ? "중간 — 홍조 및 열 반응성" : "관리 가능",
  },
  pigment: {
    en: (s) => s >= 75 ? "UV-responsive, melasma-type deepening" : s >= 50 ? "Post-inflammatory marks, localized" : "Mild",
    de: (s) => s >= 75 ? "UV-reaktiv, Melasma-artige Verdunkelung" : s >= 50 ? "Post-inflammatorische Spuren, lokalisiert" : "Mild",
    ko: (s) => s >= 75 ? "자외선 반응성, 기미형 심화" : s >= 50 ? "염증 후 색소침착, 국소적" : "경미함",
  },
  texture: {
    en: (s) => s >= 75 ? "Dual mechanism — pores + surface roughness" : s >= 50 ? "Congestion-dominant" : "Minor irregularity",
    de: (s) => s >= 75 ? "Dualer Mechanismus — Poren + Oberflächenrauheit" : s >= 50 ? "Von Verstopfung dominiert" : "Geringe Unregelmäßigkeit",
    ko: (s) => s >= 75 ? "이중 원인 — 모공 + 표면 거칠기" : s >= 50 ? "모공 막힘 주도" : "경미한 불균일",
  },
  aging: {
    en: (s) => s >= 75 ? "Recoil delay across multiple contour zones" : s >= 50 ? "Early-stage firmness reduction" : "Within normal range",
    de: (s) => s >= 75 ? "Rückstellverzögerung an mehreren Konturenzonen" : s >= 50 ? "Frühstadium der Festigkeitsminderung" : "Im Normalbereich",
    ko: (s) => s >= 75 ? "복수 윤곽 부위에서 탄력 회복 지연" : s >= 50 ? "초기 탄력 감소" : "정상 범위",
  },
  bar: {
    en: (s) => s >= 75 ? "Barrier compromise triad present" : s >= 50 ? "Stress pattern, recovery delayed" : "Mild disruption",
    de: (s) => s >= 75 ? "Trias einer Barrierebeeinträchtigung vorhanden" : s >= 50 ? "Stressmuster, Erholung verzögert" : "Leichte Störung",
    ko: (s) => s >= 75 ? "장벽 손상 3징후 확인" : s >= 50 ? "스트레스 패턴, 회복 지연" : "경미한 손상",
  },
  ox: {
    en: (s) => s >= 75 ? "High oxidative stress — antioxidant protocol essential" : s >= 50 ? "Moderate environmental damage" : "Low oxidative burden",
    de: (s) => s >= 75 ? "Hoher oxidativer Stress — Antioxidantien zwingend" : s >= 50 ? "Mäßige Umweltschäden" : "Geringe oxidative Belastung",
    ko: (s) => s >= 75 ? "높은 산화 스트레스 — 항산화 프로토콜 필수" : s >= 50 ? "중간 수준의 환경성 손상" : "낮은 산화 부담",
  },
};

const CRITICAL_MESSAGES: Partial<Record<AxisKey, { en: string; de: string; ko: string }>> = {
  acne:    { en: "Inflammation control must come before any actives.",                  de: "Entzündungskontrolle muss vor anderen Wirkstoffen kommen.",            ko: "모든 활성 성분 전에 염증 관리가 선행되어야 합니다." },
  seb:     { en: "Sebum regulation is the gateway to texture and pore improvement.",    de: "Talgregulierung ist das Tor zur Verbesserung von Textur und Poren.",    ko: "피지 조절이 피부결과 모공 개선의 시작점입니다." },
  hyd:     { en: "Barrier hydration is Phase 1 before any targeted treatment.",         de: "Barriere-Hydratation ist Phase 1 vor jeder gezielten Behandlung.",      ko: "장벽 수분 공급이 모든 집중 케어 전 1단계입니다." },
  sen:     { en: "Barrier calming must precede all active ingredients.",                de: "Barriere-Beruhigung muss vor der starken Wirkstofftherapie stehen.",    ko: "모든 활성 성분 전에 장벽 진정이 선행되어야 합니다." },
  pigment: { en: "SPF protocol activation is the highest leverage action.",             de: "Aktivierung des SPF-Protokolls ist die wirkungsvollste Maßnahme.",      ko: "SPF 프로토콜 실천이 가장 효과적인 조치입니다." },
  texture: { en: "Gentle exfoliation cadence is the critical variable.",                de: "Regelmäßiges, schonendes Peeling ist die entscheidende Variable.",       ko: "부드러운 각질 제거 주기가 핵심 변수입니다." },
  aging:   { en: "Collagen-supporting actives unlock in Phase 4.",                      de: "Kollagenunterstützende Wirkstoffe entfalten Phase 4.",                  ko: "콜라겐 지지 활성 성분은 4단계에서 효과가 나타납니다." },
  bar:     { en: "Barrier repair must be established before adding any new actives.",   de: "Die Barrierereparatur muss aufgebaut sein, bevor neue Wirkstoffe hinzugefügt werden.", ko: "새로운 활성 성분 추가 전 장벽 회복이 선행되어야 합니다." },
  ox:      { en: "Antioxidant integration is the first line of defence.",               de: "Antioxidantien-Integration ist die erste Verteidigungslinie.",          ko: "항산화제 적용이 첫 번째 방어선입니다." },
};

// ─────────────────────────────────────────────────────────────────────────────
// Clinical grade badge
// ─────────────────────────────────────────────────────────────────────────────

type Grade = "stable" | "watch" | "active" | "critical";

const GRADE_COLORS: Record<Grade, { text: string; bg: string }> = {
  stable:   { text: "hsl(142, 65%, 32%)", bg: "hsla(142, 65%, 32%, 0.12)" },
  watch:    { text: "hsl(45,  88%, 38%)", bg: "hsla(45,  88%, 38%, 0.13)" },
  active:   { text: "hsl(25,  90%, 46%)", bg: "hsla(25,  90%, 46%, 0.13)" },
  critical: { text: "hsl(0,   78%, 52%)", bg: "hsla(0,   78%, 52%, 0.13)" },
};

const GRADE_LABELS: Record<Grade, { en: string; de: string; ko: string }> = {
  stable:   { en: "Stable",   de: "Stabil",      ko: "안정" },
  watch:    { en: "Watch",    de: "Beobachten",  ko: "주의" },
  active:   { en: "Active",   de: "Aktiv",       ko: "관리 필요" },
  critical: { en: "Critical", de: "Kritisch",    ko: "긴급" },
};

function ClinicalBadge({ grade, lang }: { grade: Grade; lang: string }) {
  const colors = GRADE_COLORS[grade];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: 20,
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.text}33`,
        lineHeight: 1.6,
        flexShrink: 0,
      }}
    >
      {GRADE_LABELS[grade][lang as keyof typeof GRADE_LABELS[Grade]] ?? GRADE_LABELS[grade].en}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provenance drawer helpers
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_LABELS: Record<ZoneId, { en: string; de: string; ko: string }> = {
  forehead: { en: "Forehead", de: "Stirn",   ko: "이마" },
  eyes:     { en: "Eyes",     de: "Augen",   ko: "눈 주변" },
  nose:     { en: "Nose",     de: "Nase",    ko: "코" },
  cheeks:   { en: "Cheeks",   de: "Wangen",  ko: "볼" },
  mouth:    { en: "Mouth",    de: "Mund",    ko: "입 주변" },
  jawline:  { en: "Jawline",  de: "Kiefer",  ko: "턱선" },
  neck:     { en: "Neck",     de: "Hals",    ko: "목" },
};

const FACTOR_LABELS: Record<string, { en: string; de: string; ko: string }> = {
  stress_high:      { en: "High stress",         de: "Hoher Stress",           ko: "높은 스트레스" },
  stress_moderate:  { en: "Moderate stress",      de: "Mäßiger Stress",         ko: "중간 스트레스" },
  sleep_poor:       { en: "Poor sleep (<5h)",     de: "Schlechter Schlaf (<5h)", ko: "수면 부족 (<5h)" },
  sleep_low:        { en: "Low sleep (5–6h)",     de: "Wenig Schlaf (5–6h)",    ko: "부족한 수면 (5–6h)" },
  water_low:        { en: "Low water intake",     de: "Wenig Wasser",           ko: "수분 섭취 부족" },
  climate_humid:    { en: "Humid climate",        de: "Feuchtes Klima",         ko: "습한 기후" },
  climate_dry:      { en: "Dry climate",          de: "Trockenes Klima",        ko: "건조한 기후" },
  climate_polluted: { en: "Polluted air",         de: "Verschmutzte Luft",      ko: "오염된 공기" },
  climate_tropical: { en: "Tropical climate",     de: "Tropisches Klima",       ko: "열대성 기후" },
};

const CONCERN_READABLE: Record<string, string> = {
  oily: "Excess oil", blackheads: "Blackheads", whiteheads: "Whiteheads",
  lines: "Fine lines", fine_lines: "Fine lines", breakouts: "Breakouts",
  dark_circles: "Dark circles", puffiness: "Puffiness", dryness: "Dryness",
  pores: "Enlarged pores", redness: "Redness", acne: "Acne",
  pigment: "Pigmentation", nasolabial: "Nasolabial lines", perioral: "Perioral sensitivity",
  hormonal: "Hormonal breakouts", cystic: "Cystic acne", texture: "Rough texture",
  sagging: "Sagging", neck_lines: "Neck lines", neck_red: "Redness", neck_dry: "Dryness",
};

function readableConcern(id: string): string {
  // strip single-letter zone suffix: _f _e _n _c _m _j (but not _neck_ compound)
  const stripped = id.replace(/_[fencmj]$/, "");
  return CONCERN_READABLE[stripped] ?? stripped.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

interface ProvenanceDrawerProps {
  prov:     ScoreProvenance;
  lang:     string;
}

function ProvenanceDrawer({ prov, lang }: ProvenanceDrawerProps) {
  const t = (en: string, de: string, ko: string) =>
    lang === "de" ? de : lang === "ko" ? ko : en;

  // Zone concerns — exclude internal baselines, sort by contribution desc, take top 6
  const zoneConcerns = prov.breakdown.zoneConcerns
    .filter(z => !z.concernId.startsWith("__"))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 6);

  // Deep-dive total (sum of all contributions)
  const deepDiveTotal = prov.breakdown.deepDiveQuestions.reduce(
    (s, q) => s + q.contribution, 0
  );

  const { foundationModifiers, crossAxisBonus } = prov.breakdown;

  const hasAny =
    zoneConcerns.length > 0 ||
    deepDiveTotal > 1 ||
    foundationModifiers.length > 0 ||
    crossAxisBonus != null;

  if (!hasAny) {
    return (
      <p style={{ fontSize: "0.7rem", color: "hsl(var(--foreground-hint))", padding: "4px 0 6px" }}>
        {t("No significant zone contributions for this axis.", "Keine signifikanten Zonenbeiträge.", "이 축에 대한 유의미한 존 기여 없음.")}
      </p>
    );
  }

  return (
    <div style={{ padding: "6px 0 8px", display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Zone signals */}
      {zoneConcerns.length > 0 && (
        <div>
          <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--foreground-hint))", marginBottom: 4 }}>
            {t("Zone signals", "Zonen-Signale", "존 신호")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {zoneConcerns.map((z, i) => {
              const zoneName = ZONE_LABELS[z.zone as ZoneId]?.[lang as "en" | "de" | "ko"] ?? z.zone;
              const concern  = readableConcern(z.concernId);
              const pts      = Math.round(z.contribution);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.7rem", color: "hsl(var(--foreground))" }}>
                    {zoneName} · {concern}
                  </span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "hsl(var(--primary))", flexShrink: 0 }}>
                    +{pts > 0 ? pts : "<1"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deep-dive */}
      {deepDiveTotal > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "hsl(var(--foreground))" }}>
            {t("Deep-dive answers", "Tiefenanalyse-Antworten", "심층 질문 응답")}
          </span>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "hsl(var(--primary))" }}>
            +{Math.round(deepDiveTotal)}
          </span>
        </div>
      )}

      {/* Foundation modifiers */}
      {foundationModifiers.length > 0 && (
        <div>
          <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--foreground-hint))", marginBottom: 4 }}>
            {t("Lifestyle modifiers", "Lebensstil-Faktoren", "라이프스타일 요인")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {foundationModifiers.map((m, i) => {
              const label = FACTOR_LABELS[m.factor]?.[lang as "en" | "de" | "ko"] ?? m.factor.replace(/_/g, " ");
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.7rem", color: "hsl(var(--foreground))" }}>{label}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "hsl(var(--severity-moderate))" }}>
                    ×{m.multiplier.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-axis bonus */}
      {crossAxisBonus && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "hsl(var(--foreground))" }}>
            {t("Pattern interaction", "Muster-Interaktion", "패턴 상호작용")} · {crossAxisBonus.pattern}
          </span>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "hsl(var(--severity-moderate))" }}>
            +{crossAxisBonus.bonusPercent}%
          </span>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

function getBarColor(score: number): string {
  if (score >= 70) return "hsl(var(--severity-severe))";
  if (score >= 45) return "hsl(var(--severity-moderate))";
  if (score >= 20) return "hsl(var(--severity-mild))";
  return "hsl(var(--severity-clear))";
}

interface Props {
  result: DiagnosisResult;
  goToProducts?: () => void;
}

const SlideAxisBreakdown = ({ result, goToProducts }: Props) => {
  const { language } = useI18nStore();
  const [expandedAxis, setExpandedAxis] = useState<AxisKey | null>(null);

  const sorted = useMemo(
    () => [...AXIS_KEYS].sort((a, b) => result.axis_scores[b] - result.axis_scores[a]),
    [result]
  );
  const topAxis = sorted[0];

  const isMale = result.active_flags.includes("MALE");
  const baseLabels = language === "de" ? AXIS_LABELS_DE : language === "ko" ? AXIS_LABELS_KO : AXIS_LABELS;
  const maleOverrides = isMale ? (language === "de" ? AXIS_LABELS_MALE_DE : language === "ko" ? AXIS_LABELS_MALE_KO : AXIS_LABELS_MALE) : {};
  const labels = { ...baseLabels, ...maleOverrides } as Record<AxisKey, string>;

  // V5 lookup helpers — graceful when fields are absent
  const clinicalGrade = result.axis_clinical_grade;
  const provenance    = result.score_provenance;
  const getGrade = (axis: AxisKey) => clinicalGrade?.[axis]?.grade as Grade | undefined;
  const getProv  = (axis: AxisKey) => provenance?.find(p => p.axis === axis) ?? null;

  const hasV5 = Boolean(clinicalGrade || provenance);

  const toggle = (axis: AxisKey) =>
    setExpandedAxis(prev => (prev === axis ? null : axis));

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">

        {/* Eyebrow */}
        <motion.p className="slide-eyebrow mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {language === "de" ? "Klinische Analyse" : language === "ko" ? "임상 분석 결과" : "Clinical Analysis"}
        </motion.p>

        {/* Headline */}
        <motion.h2
          className="font-display"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, lineHeight: 1.2, color: "hsl(var(--foreground))", marginBottom: "0.5rem" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {language === "de" ? "Ihr Hautvektor" : language === "ko" ? "피부 벡터" : "Your skin vector"}
        </motion.h2>
        <motion.p
          className="slide-body mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {language === "de"
            ? "Keine zwei Vektoren sind identisch. Dies ist genau Ihrer."
            : language === "ko"
            ? "두 벡터는 동일하지 않습니다. 이것이 바로 당신의 피부입니다."
            : "No two vectors are identical. This is precisely yours."}
        </motion.p>

        {/* Radar + axis bars */}
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <RadarChart result={result} highlightAxis={topAxis} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sorted.map((axis, i) => {
              const score          = Math.round(result.axis_scores[axis]);
              const isTop          = i === 0;
              const interpretation = AXIS_INTERPRETATIONS[axis]?.[language as "en" | "de" | "ko"]?.(score)
                ?? AXIS_INTERPRETATIONS[axis]?.en?.(score) ?? "";
              const grade          = getGrade(axis);
              const prov           = getProv(axis);
              const isExpanded     = expandedAxis === axis;
              const canExpand      = hasV5 && prov != null;

              return (
                <motion.div
                  key={axis}
                  className={`rounded-xl p-3 ${isTop ? "border md:col-span-2" : ""}`}
                  style={isTop ? {
                    borderColor: "hsl(var(--primary) / 0.4)",
                    background: "hsl(var(--primary) / 0.04)",
                  } : {}}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                >
                  {/* Header row — tappable if V5 provenance available */}
                  <div
                    className={`flex justify-between items-center mb-1.5 ${canExpand ? "cursor-pointer select-none" : ""}`}
                    onClick={canExpand ? () => toggle(axis) : undefined}
                    role={canExpand ? "button" : undefined}
                    aria-expanded={canExpand ? isExpanded : undefined}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p style={{
                        fontSize: "0.8125rem",
                        fontWeight: isTop ? 700 : 500,
                        color: isTop ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                        lineHeight: 1.2,
                      }}>
                        {labels[axis]}
                        {isTop && (
                          <span style={{ fontSize: "0.625rem", marginLeft: "0.4rem", opacity: 0.7 }}>
                            — {language === "de" ? "Primär" : language === "ko" ? "1순위" : "Primary"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Clinical grade badge (V5) or raw score (fallback) */}
                      {grade ? (
                        <>
                          <ClinicalBadge grade={grade} lang={language} />
                          <span
                            className="font-display"
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "hsl(var(--foreground-hint))",
                            }}
                          >
                            {score}
                          </span>
                        </>
                      ) : (
                        <span
                          className="font-display"
                          style={{
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: isTop ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                          }}
                        >
                          {score}
                        </span>
                      )}

                      {/* Expand chevron */}
                      {canExpand && (
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                          style={{ color: "hsl(var(--foreground-hint))", display: "flex" }}
                        >
                          <ChevronDown size={13} />
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* Score bar */}
                  <div
                    className="rounded-full overflow-hidden mb-1"
                    style={{ height: "3px", background: "hsl(var(--border))" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: isTop ? "hsl(var(--primary))" : getBarColor(score),
                        opacity: isTop ? 1 : 0.6,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.03 }}
                    />
                  </div>

                  {/* Interpretation text */}
                  {interpretation && !isExpanded && (
                    <p style={{ fontSize: "0.6875rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.4 }}>
                      {interpretation}
                    </p>
                  )}

                  {/* Provenance drawer (V5) */}
                  <AnimatePresence>
                    {isExpanded && prov && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            borderTop: "1px solid hsl(var(--border) / 0.5)",
                            marginTop: 6,
                          }}
                        >
                          <ProvenanceDrawer prov={prov} lang={language} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* V5 hint */}
        {hasV5 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ fontSize: "0.6875rem", color: "hsl(var(--foreground-hint))", marginTop: 8, textAlign: "right" }}
          >
            {language === "de"
              ? "Tippen Sie auf eine Achse für die Bewertungsaufschlüsselung"
              : language === "ko"
              ? "축을 탭하면 점수 분석을 볼 수 있습니다"
              : "Tap any axis to see the score breakdown"}
          </motion.p>
        )}

        {/* Critical focus callout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl border p-4"
          style={{
            borderColor: "hsl(var(--primary) / 0.25)",
            background: "hsl(var(--primary) / 0.05)",
          }}
        >
          <p className="slide-eyebrow mb-1" style={{ color: "hsl(var(--primary))" }}>
            {language === "de" ? "Protokoll-Priorität" : language === "ko" ? "프로토콜 우선순위" : "Protocol Priority"}
          </p>
          <p className="slide-body" style={{ lineHeight: 1.5 }}>
            {CRITICAL_MESSAGES[topAxis]?.[language as "en" | "de" | "ko"] ?? (
              language === "de"
                ? "Ihr Protokoll ist nach klinischer Priorität geordnet, beginnend mit Ihrer am höchsten bewerteten Achse."
                : language === "ko"
                ? "프로토콜은 임상적 우선순위에 따라 정렬되며, 가장 높은 점수의 축부터 시작합니다."
                : "Your protocol is ordered by clinical priority, starting with your highest-scoring axis."
            )}
          </p>

          {goToProducts && (
            <button
              onClick={goToProducts}
              className="mt-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                border: "none",
                cursor: "pointer",
              }}
            >
              {language === "de" ? "Passende Produkte ansehen" : language === "ko" ? "맞춤 제품 보기" : "See Matched Products"}
              <ArrowRight size={14} />
            </button>
          )}

        {/* ── "Why this recommendation" explanations (Phase 3.5D) ── */}
        {result.axis_explanations && result.axis_explanations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mt-5"
          >
            <p className="slide-eyebrow mb-3" style={{ letterSpacing: "0.12em" }}>
              {language === "de"
                ? "Warum diese Empfehlung?"
                : language === "ko"
                ? "이 추천의 이유"
                : "Why this recommendation?"}
            </p>
            <div className="space-y-3">
              {(result.axis_explanations as AxisExplanation[]).slice(0, 3).map((exp) => {
                const axLabel = language === "de"
                  ? AXIS_LABELS_DE[exp.axis]
                  : language === "ko"
                  ? AXIS_LABELS_KO[exp.axis]
                  : AXIS_LABELS[exp.axis];
                const explanation = exp.explanation[language as "en" | "de" | "ko"] ?? exp.explanation.en;
                const outcome = exp.expectedOutcome[language as "en" | "de" | "ko"] ?? exp.expectedOutcome.en;
                return (
                  <div
                    key={exp.axis}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: "hsl(var(--border) / 0.6)",
                      background: "hsl(var(--card) / 0.6)",
                    }}
                  >
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--primary))", marginBottom: 4 }}>
                      {axLabel}
                    </p>
                    <p className="slide-body" style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 4 }}>
                      {explanation}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.4, fontStyle: "italic" }}>
                      {language === "de" ? "In 4 Wochen: " : language === "ko" ? "4주 후: " : "In 4 weeks: "}
                      {outcome}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        </motion.div>
      </div>
    </div>
  );
};

export default SlideAxisBreakdown;
