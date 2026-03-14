import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DiagnosisResult, AxisKey, ProjectedImprovement } from "@/engine/types";
import { AXIS_LABELS, AXIS_LABELS_DE, AXIS_KEYS } from "@/engine/types";
import { useI18nStore } from "@/store/i18nStore";
import type { RoutineOutput, RoutineStep, StepRole, BaseType, TargetTrouble } from "@/engine/routineEngine";

// ─── Axis label maps ───────────────────────────────────────────────────────────

const AXIS_LABELS_KO: Record<AxisKey, string> = {
  seb:              "피지",
  hyd:              "수분",
  bar:              "피부 장벽",
  sen:              "민감성",
  ox:               "산화 스트레스",
  acne:             "여드름",
  pigment:          "색소침착",
  texture:          "피부결",
  aging:            "노화",
  makeup_stability: "메이크업 지속",
};

// ─── Clinical flag alerts (kept from legacy protocol) ─────────────────────────

const FLAG_MESSAGES: Record<string, {
  icon: string;
  title: Record<string, string>;
  body: Record<string, string>;
}> = {
  BARRIER_EMERGENCY: {
    icon: "⚠️",
    title: { en: "Barrier Emergency", de: "Barriere-Notfall", ko: "장벽 응급" },
    body: { en: "Pause all actives for 2 weeks. Focus on cleansing, barrier serum & moisturiser only.", de: "Alle Wirkstoffe für 2 Wochen pausieren. Nur Reinigung, Barriere-Serum & Feuchtigkeitspflege.", ko: "모든 액티브 성분을 2주간 중단하세요. 세안제, 배리어 세럼, 보습제만 사용하세요." },
  },
  ACTIVE_INGREDIENT_PAUSE: {
    icon: "⚠️",
    title: { en: "Exfoliation Pause", de: "Peeling-Pause", ko: "각질 제거 중단" },
    body: { en: "Remove all exfoliants for 4 weeks.", de: "Alle Peelings für 4 Wochen absetzen.", ko: "모든 각질 제거제를 4주간 중단하세요." },
  },
  HORMONAL_ACNE_PROTOCOL: {
    icon: "ℹ️",
    title: { en: "Hormonal Pattern Detected", de: "Hormonelles Muster erkannt", ko: "호르몬 패턴 감지" },
    body: { en: "Track skin alongside your menstrual cycle for best results.", de: "Beobachten Sie Ihre Haut parallel zu Ihrem Zyklus.", ko: "최상의 효과를 위해 월경 주기와 함께 피부 상태를 기록하세요." },
  },
  DERMATOLOGIST_REFERRAL: {
    icon: "⚕️",
    title: { en: "Consultation Advised", de: "Konsultation Empfohlen", ko: "전문의 상담 권장" },
    body: { en: "Acne severity may benefit from medical treatment.", de: "Die Schwere der Akne könnte von ärztlicher Behandlung profitieren.", ko: "여드름 심각도가 의학적 치료에서 도움을 받을 수 있습니다." },
  },
  DEVICE_RECOMMENDED: {
    icon: "💡",
    title: { en: "Device Recommended", de: "Gerät Empfohlen", ko: "기기 사용 권장" },
    body: { en: "EMS/LED device 3× weekly amplifies serum results.", de: "EMS/LED-Gerät 3× wöchentlich verstärkt Serum-Ergebnisse.", ko: "EMS/LED 기기를 주 3회 사용하면 세럼 효과가 증폭됩니다." },
  },
};

// ─── Display maps ─────────────────────────────────────────────────────────────

const ROLE_ICON: Record<StepRole, string> = {
  cleanser:     "🫧",
  toner:        "💧",
  serum:        "🔬",
  treatment:    "👁",
  moisturizer:  "🛡",
  spf:          "☀️",
  device:       "✨",
};

const ROLE_LABEL: Record<StepRole, Record<string, string>> = {
  cleanser:    { en: "Cleanser",    de: "Reiniger",      ko: "클렌저"    },
  toner:       { en: "Toner",       de: "Toner",         ko: "토너"      },
  serum:       { en: "Serum",       de: "Serum",         ko: "세럼"      },
  treatment:   { en: "Treatment",   de: "Treatment",     ko: "트리트먼트" },
  moisturizer: { en: "Moisturiser", de: "Feuchtigkeits-\ncreme", ko: "보습제" },
  spf:         { en: "SPF",         de: "Sonnenschutz",  ko: "선크림"    },
  device:      { en: "Device",      de: "Gerät",         ko: "기기"      },
};

const BASE_TYPE_LABEL: Record<BaseType, Record<string, string>> = {
  "oily":                        { en: "Oily",                      de: "Ölig",                     ko: "지성"         },
  "combination-dehydrated-oily": { en: "Combination-Dehydrated",    de: "Mischhaut-Dehydriert",      ko: "복합성-수분부족" },
  "dry":                         { en: "Dry",                       de: "Trocken",                   ko: "건성"         },
  "normal":                      { en: "Normal / Balanced",         de: "Normal / Ausgeglichen",     ko: "중성 / 균형"   },
};

const TARGET_LABEL: Record<TargetTrouble, Record<string, string>> = {
  "barrier-repair":        { en: "Barrier Repair & Soothing",    de: "Barriere-Reparatur & Beruhigung", ko: "배리어 회복 & 진정"  },
  "intense-hydration":     { en: "Intense Hydration",            de: "Intensive Feuchtigkeit",          ko: "집중 수분 공급"      },
  "blemish-sebum-control": { en: "Blemish & Sebum Control",      de: "Unreinheiten & Talg-Kontrolle",   ko: "트러블 & 피지 관리"  },
  "brightening":           { en: "Brightening & Tone Correction", de: "Aufhellung & Ton-Korrektur",     ko: "브라이트닝 & 톤 보정" },
  "well-aging":            { en: "Well-Aging & Firming",          de: "Well-Aging & Straffung",          ko: "안티에이징 & 탄력"   },
};

const TARGET_COLOR: Record<TargetTrouble, string> = {
  "barrier-repair":        "#B76E79",
  "intense-hydration":     "#6EA8C9",
  "blemish-sebum-control": "#7EC96E",
  "brightening":           "#C9A96E",
  "well-aging":            "#9E6EC9",
};

// ─── Projected Improvement section ────────────────────────────────────────────

interface ImproveSectionProps {
  improvement: ProjectedImprovement;
  primaryAxis: AxisKey;
  accentColor: string;
  lang: "en" | "de" | "ko";
}

function ProjectedImprovementSection({
  improvement,
  primaryAxis,
  accentColor,
  lang,
}: ImproveSectionProps) {
  const axisLabel = (key: AxisKey) =>
    lang === "ko" ? AXIS_LABELS_KO[key]
    : lang === "de" ? AXIS_LABELS_DE[key]
    : AXIS_LABELS[key];

  // Canonical axis order, only axes with currentScore ≥ 25
  const activeAxes = AXIS_KEYS.filter(
    (k) => improvement[k] && improvement[k].currentScore >= 25,
  );
  if (activeAxes.length === 0) return null;

  // Resolve the summary axis (prefer primaryAxis if eligible)
  const summaryAxis = activeAxes.includes(primaryAxis) ? primaryAxis : activeAxes[0];
  const { currentScore: cur, targetScore4w: t4w } = improvement[summaryAxis];
  const improvePct = cur > 0 ? Math.round(((cur - t4w) / cur) * 100) : 0;

  const GOLD      = "#c9a96e";
  const GOLD_FAINT = "#c9a96e44";

  const title: Record<string, string> = {
    en: "Projected Improvement",
    de: "Projizierter Fortschritt",
    ko: "예상 개선 효과",
  };
  const legendNow: Record<string, string>  = { en: "Current",        de: "Aktuell",          ko: "현재"   };
  const legend4w:  Record<string, string>  = { en: "4-Week Target",  de: "4-Wochen-Ziel",    ko: "4주 목표" };
  const legend12w: Record<string, string>  = { en: "12-Week Target", de: "12-Wochen-Ziel",   ko: "12주 목표" };

  const summaryText: Record<string, string> = {
    en: `Following this protocol, your ${AXIS_LABELS[summaryAxis]} severity is projected to reduce by ${improvePct}% in 4 weeks.`,
    de: `Diesem Protokoll folgend soll die ${AXIS_LABELS_DE[summaryAxis]}-Belastung in 4 Wochen um ${improvePct}% abnehmen.`,
    ko: `이 루틴을 따르면 ${AXIS_LABELS_KO[summaryAxis]} 수치가 4주 후 ${improvePct}% 개선될 것으로 예상됩니다.`,
  };

  return (
    <motion.div
      className="mb-5 rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card) / 0.5)",
        border: "1px solid hsl(var(--border) / 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="px-4 pt-4 pb-3">
        <p style={{
          fontSize: "0.65rem", fontWeight: 700,
          color: "hsl(var(--foreground-hint))",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: "12px",
        }}>
          {title[lang]}
        </p>

        <div className="space-y-4">
          {activeAxes.map((key) => {
            const { currentScore, targetScore4w, targetScore12w } = improvement[key];
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>
                    {axisLabel(key)}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "hsl(var(--foreground-hint))" }}>
                    {currentScore} → {targetScore4w} → {targetScore12w}
                  </span>
                </div>

                {/* Bar track */}
                <div
                  className="relative h-2.5 rounded-full overflow-hidden"
                  style={{ background: "hsl(var(--muted))" }}
                >
                  {/* Current severity — solid accent fill */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      width: `${currentScore}%`,
                      background: `linear-gradient(90deg, ${accentColor}bb, ${accentColor})`,
                    }}
                  />
                  {/* 12-week target tick — faint gold */}
                  <div
                    className="absolute top-0 h-full w-[2px]"
                    style={{ left: `${targetScore12w}%`, background: GOLD_FAINT }}
                  />
                  {/* 4-week target tick — bright gold */}
                  <div
                    className="absolute top-0 h-full w-[2px]"
                    style={{
                      left: `${targetScore4w}%`,
                      background: GOLD,
                      boxShadow: `0 0 4px ${GOLD}88`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary statement */}
        {improvePct > 0 && (
          <p style={{
            fontSize: "0.8rem",
            color: "hsl(var(--foreground-hint))",
            lineHeight: 1.55,
            marginTop: "14px",
            fontStyle: "italic",
          }}>
            {summaryText[lang] ?? summaryText.en}
          </p>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 pt-2.5"
        style={{ borderTop: "1px solid hsl(var(--border) / 0.3)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded-full" style={{ background: accentColor }} />
          <span style={{ fontSize: "0.65rem", color: "hsl(var(--foreground-hint))" }}>{legendNow[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-[2px] rounded-full" style={{ background: GOLD, boxShadow: `0 0 4px ${GOLD}88` }} />
          <span style={{ fontSize: "0.65rem", color: "hsl(var(--foreground-hint))" }}>{legend4w[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-[2px] rounded-full" style={{ background: GOLD_FAINT }} />
          <span style={{ fontSize: "0.65rem", color: "hsl(var(--foreground-hint))" }}>{legend12w[lang]}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  result: DiagnosisResult;
  routineOutput: RoutineOutput;
}

export default function SlideProtocol({ result, routineOutput }: Props) {
  const { language } = useI18nStore();
  const lang = (language === "de" || language === "ko") ? language : "en";

  const [level, setLevel] = useState<"3-step" | "5-step" | "advanced">("3-step");
  const [timing, setTiming] = useState<"am" | "pm">("am");

  const { baseType, targetTrouble, advancedCaution, skinRescue, routines } = routineOutput;
  const isSosActive = skinRescue !== null;

  const routine =
    level === "3-step"   ? routines.minimalist :
    level === "5-step"   ? routines.committed  :
    routines.advanced ?? routines.committed; // fallback if safety gate active

  type FilteredStep = RoutineStep & { product: NonNullable<RoutineStep["product"]> };
  const filterSteps = (arr: RoutineStep[]): FilteredStep[] =>
    arr.filter((s): s is FilteredStep => s.product !== null);

  const steps       = filterSteps(timing === "am" ? routine.am               : routine.pm);
  const sosSteps    = isSosActive
    ? filterSteps(timing === "am" ? skinRescue!.routine.am : skinRescue!.routine.pm)
    : ([] as FilteredStep[]);
  const displaySteps = isSosActive ? sosSteps : steps;

  const signalCount = result.radar_chart_data.filter((d) => d.score > 0).length;
  const confidence  = Math.min(95, 65 + signalCount * 3);

  const SOS_CORAL = "#C8645A";
  const SOS_AMBER = "#D4935A";
  const accentColor = isSosActive ? SOS_CORAL : TARGET_COLOR[targetTrouble];

  const copy = {
    eyebrow:        { en: "Your Personalised Protocol",    de: "Ihr Persönliches Protokoll",    ko: "맞춤 루틴"            },
    sub:            { en: "Personalised sequence based on your skin vector", de: "Personalisierte Sequenz basierend auf Ihrem Hautvektor", ko: "피부 벡터 기반 맞춤 시퀀스" },
    match:          { en: "protocol match",                de: "Protokoll-Übereinstimmung",     ko: "프로토콜 일치율"       },
    signals:        { en: "signals",                       de: "Signale",                       ko: "신호"                },
    baseLabel:      { en: "Skin Type",                     de: "Hauttyp",                       ko: "피부 타입"            },
    targetLabel:    { en: "Priority Target",               de: "Haupt-Ziel",                    ko: "우선 케어"            },
    noSteps:        { en: "No steps for this timing.",     de: "Keine Schritte für diesen Zeitpunkt.", ko: "해당 타이밍에 단계가 없습니다." },
    step:           { en: "Step",                          de: "Schritt",                       ko: "단계"                },
    advancedLabel:  { en: "Advanced ✦",                    de: "Advanced ✦",                    ko: "어드밴스드 ✦"         },
    cautionTitle:   { en: "Device therapy paused",         de: "Gerätetherapie pausiert",       ko: "기기 테라피 일시 중단"  },
    upgradeAdvanced:{ en: "→ Unlock Advanced: 5-step + Medicube Booster Pro Device",
                      de: "→ Advanced freischalten: 5-Schritt + Medicube Booster Pro",
                      ko: "→ 어드밴스드 해제: 5단계 + 메디큐브 부스터 프로 기기" },
    // ── B-3 SOS copy ────────────────────────────────────────────────────────
    sosEyebrow:   { en: "🚨 SOS Rescue Protocol",        de: "🚨 SOS Rettungsprotokoll",        ko: "🚨 SOS 레스큐 프로토콜" },
    sosSub:       { en: "K-Derma Clinic Exclusive",      de: "K-Derma Klinik Exklusiv",         ko: "피부과 전문 추천"       },
    sosBadge:     { en: "Minimalist 3-Step Protocol",    de: "Minimalprotokoll — 3 Schritte",   ko: "미니멀 3단계 프로토콜"  },
    sosBrandNote: { en: "Clinical dermatology brands only", de: "Nur klinische Dermatologie-Marken", ko: "임상 피부과 브랜드 전용" },
  };
  const t = (k: keyof typeof copy) => copy[k][lang] ?? copy[k]["en"];

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">

        {/* Eyebrow + subtitle — SOS override replaces standard copy */}
        <motion.p
          className="slide-eyebrow text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={isSosActive ? { color: SOS_CORAL } : undefined}
        >
          {isSosActive ? t("sosEyebrow") : t("eyebrow")}
        </motion.p>
        <motion.p className="slide-body mt-1 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          {isSosActive ? t("sosSub") : t("sub")}
        </motion.p>

        {/* Protocol match badge */}
        <motion.div className="flex justify-center mt-3 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44` }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: accentColor }}>
              {confidence}% {t("match")}
            </span>
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--foreground-hint))" }}>
              · {signalCount} {t("signals")}
            </span>
          </div>
        </motion.div>

        {/* Clinical flags */}
        {result.active_flags.length > 0 && (
          <motion.div className="space-y-2 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            {result.active_flags.slice(0, 2).map((flag) => {
              const msg = FLAG_MESSAGES[flag];
              if (!msg) return null;
              return (
                <div key={flag} className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
                  <span>{msg.icon}</span>
                  <div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>
                      {msg.title[lang] ?? msg.title.en}
                    </p>
                    <p className="slide-body" style={{ fontSize: "0.875rem" }}>
                      {msg.body[lang] ?? msg.body.en}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Base type + target trouble tags */}
        <motion.div className="flex flex-wrap gap-2 mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border) / 0.6)" }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "hsl(var(--foreground-hint))", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {t("baseLabel")}
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>
              {BASE_TYPE_LABEL[baseType][lang] ?? BASE_TYPE_LABEL[baseType].en}
            </span>
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}40` }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: accentColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {t("targetLabel")}
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: accentColor }}>
              {TARGET_LABEL[targetTrouble][lang] ?? TARGET_LABEL[targetTrouble].en}
            </span>
          </div>
        </motion.div>

        {/* ── Projected Improvement (V5) — shown only when data is available ── */}
        {result.projected_improvement && !isSosActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
            <ProjectedImprovementSection
              improvement={result.projected_improvement}
              primaryAxis={result.primary_concerns[0] ?? "sen"}
              accentColor={accentColor}
              lang={lang}
            />
          </motion.div>
        )}

        {/* Level + timing toggles */}
        <motion.div
          className="flex items-center justify-between gap-3 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          {/* Level toggle — replaced by fixed SOS badge when rescue override is active */}
          {isSosActive ? (
            <div
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2"
              style={{
                background: `${SOS_CORAL}12`,
                border: `1px solid ${SOS_CORAL}44`,
              }}
            >
              <span style={{ fontSize: "0.75rem" }}>⚕️</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: SOS_CORAL, whiteSpace: "nowrap" }}>
                {t("sosBadge")}
              </span>
            </div>
          ) : (
            <div className="flex rounded-xl overflow-hidden" style={{ background: "hsl(var(--muted))", padding: "3px", gap: "3px" }}>
              {(["3-step", "5-step", "advanced"] as const).map((lv) => {
                const isAdv = lv === "advanced";
                const isActive = level === lv;
                const GOLD = "#D4AF37";
                return (
                  <button
                    key={lv}
                    onClick={() => setLevel(lv)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
                    style={{
                      background: isActive
                        ? isAdv ? `linear-gradient(135deg, #1a1400 0%, #2e2200 100%)` : "hsl(var(--card))"
                        : "transparent",
                      color: isActive
                        ? isAdv ? GOLD : accentColor
                        : isAdv ? `${GOLD}99` : "hsl(var(--foreground-hint))",
                      boxShadow: isActive
                        ? isAdv ? `0 0 12px ${GOLD}55, 0 1px 4px hsl(0 0% 0% / 0.2)` : "0 1px 4px hsl(0 0% 0% / 0.12)"
                        : "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isAdv ? t("advancedLabel") : lv}
                  </button>
                );
              })}
            </div>
          )}

          {/* AM / PM toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ background: "hsl(var(--muted))", padding: "3px", gap: "3px" }}>
            {(["am", "pm"] as const).map((tm) => (
              <button
                key={tm}
                onClick={() => setTiming(tm)}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
                style={{
                  background: timing === tm ? "hsl(var(--card))" : "transparent",
                  color: timing === tm ? accentColor : "hsl(var(--foreground-hint))",
                  boxShadow: timing === tm ? "0 1px 4px hsl(0 0% 0% / 0.12)" : "none",
                }}
              >
                {tm === "am" ? "☀️ AM" : "🌙 PM"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Advanced caution message (Safety Gate active) */}
        {level === "advanced" && advancedCaution && (
          <motion.div
            className="mb-4 rounded-2xl px-4 py-3 flex gap-3 items-start"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "linear-gradient(135deg, #1a140022 0%, #2e220033 100%)",
              border: "1px solid #D4AF3755",
            }}
          >
            <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#D4AF37", marginBottom: "2px" }}>
                {t("cautionTitle")}
              </p>
              <p style={{ fontSize: "0.8rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.5 }}>
                {advancedCaution[lang as "en" | "de" | "ko"] ?? advancedCaution.en}
              </p>
            </div>
          </motion.div>
        )}

        {/* B-3: SOS Rescue disclaimer — glassmorphism coral/amber, shown only when override active */}
        {isSosActive && skinRescue && (
          <motion.div
            className="mb-5 rounded-2xl px-5 py-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 24 }}
            style={{
              background: `linear-gradient(135deg, ${SOS_CORAL}0d 0%, ${SOS_AMBER}0a 100%)`,
              border: `1px solid ${SOS_CORAL}44`,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <div className="flex items-start gap-3">
              <span style={{ fontSize: "1.25rem", flexShrink: 0, lineHeight: 1 }}>⚕️</span>
              <div>
                <p style={{
                  fontSize: "0.8rem", fontWeight: 700,
                  color: SOS_CORAL, marginBottom: "4px",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {t("sosBrandNote")}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground-hint))", lineHeight: 1.6 }}>
                  {skinRescue.disclaimer[lang as "en" | "de" | "ko"] ?? skinRescue.disclaimer.en}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${level}-${timing}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {displaySteps.length === 0 ? (
              <p className="slide-body text-center py-6" style={{ fontStyle: "italic" }}>
                {copy.noSteps[lang] ?? copy.noSteps.en}
              </p>
            ) : (
              displaySteps.map((step, idx) => {
                const isDevice = step.role === "device";
                const GOLD = "#D4AF37";
                return (
                <motion.div
                  key={`${step.role}-${idx}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, type: "spring", stiffness: 280, damping: 26 }}
                  className="relative flex items-center gap-4 rounded-2xl overflow-hidden"
                  style={{
                    background: isDevice
                      ? "linear-gradient(135deg, #1a140055 0%, #2e220066 100%)"
                      : "hsl(var(--card) / 0.7)",
                    border: isDevice
                      ? `1px solid ${GOLD}66`
                      : "1px solid hsl(var(--border) / 0.5)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    padding: "14px 16px",
                    boxShadow: isDevice ? `0 0 24px ${GOLD}33` : undefined,
                  }}
                >
                  {/* Gold left accent strip */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
                    style={{ background: `linear-gradient(to bottom, ${accentColor}, transparent)` }}
                  />

                  {/* Step number + icon */}
                  <div
                    className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: `${accentColor}14` }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{ROLE_ICON[step.role]}</span>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: accentColor, marginTop: "1px" }}>
                      {step.order}
                    </span>
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0 pl-1">
                    <p style={{
                      fontSize: "0.65rem", fontWeight: 700, color: accentColor,
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1px",
                    }}>
                      {ROLE_LABEL[step.role][lang] ?? ROLE_LABEL[step.role].en}
                    </p>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>
                      {step.product.name[lang as "en" | "de" | "ko"] ?? step.product.name.en}
                    </p>
                    <p className="slide-body truncate mt-0.5" style={{ fontSize: "0.8rem" }}>
                      {step.product.keyIngredients.slice(0, 3).join(" · ")}
                    </p>
                  </div>

                  {/* Formulation badge */}
                  <div
                    className="flex-shrink-0 rounded-full px-2 py-0.5"
                    style={{
                      background: isDevice ? `${GOLD}22` : `${accentColor}18`,
                      border: `1px solid ${isDevice ? GOLD : accentColor}33`,
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: isDevice ? GOLD : accentColor, whiteSpace: "nowrap" }}>
                      {isDevice
                        ? (lang === "de" ? "6-in-1 Gerät" : lang === "ko" ? "6-in-1 기기" : "6-in-1 Device")
                        : step.product.formulation}
                    </span>
                  </div>
                </motion.div>
              ); })
            )}
          </motion.div>
        </AnimatePresence>

        {/* Upgrade nudge for 3-step → 5-step (hidden during SOS override) */}
        {level === "3-step" && !isSosActive && (
          <motion.button
            className="w-full mt-5 rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
            style={{
              background: `${accentColor}10`,
              border: `1px dashed ${accentColor}44`,
              color: accentColor,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => setLevel("5-step")}
            whileHover={{ background: `${accentColor}1e` }}
          >
            {lang === "de"
              ? "→ Auf 5-Schritt-Protokoll upgraden für Toner + Augenpflege"
              : lang === "ko"
              ? "→ 5단계 루틴으로 업그레이드 (토너 + 트리트먼트 포함)"
              : "→ Upgrade to 5-step for Toner + Eye Treatment"}
          </motion.button>
        )}

        {/* Upgrade nudge for 5-step → Advanced ✦ (hidden during SOS override) */}
        {level === "5-step" && !advancedCaution && !isSosActive && (
          <motion.button
            className="w-full mt-5 rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #1a140018 0%, #2e220022 100%)",
              border: "1px dashed #D4AF3766",
              color: "#D4AF37",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => setLevel("advanced")}
            whileHover={{ background: "linear-gradient(135deg, #1a140033 0%, #2e220044 100%)" }}
          >
            {t("upgradeAdvanced")}
          </motion.button>
        )}

      </div>
    </div>
  );
}
