// src/pages/Diagnosis.tsx
// ANTIGRAVITY Rebuild — Phase 01 + 02 + 03
// Phase 03 adds: contextual deep-dive axis questions, smart deduplication,
// foundation & atopy store wiring, and the full "Complete Analysis" → runDiagnosis → /results flow.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore } from "@/store/i18nStore";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import Navbar from "@/components/Navbar";
import { FaceMapStep } from "@/components/diagnosis/FaceMapStep";
import { CityClimateInput } from "@/components/diagnosis/CityClimateInput";
import { runDiagnosisV5 } from "@/engine/axisAnswerBridgeV5";
import { savePendingDiagnosis, clearPendingDiagnosis } from "@/utils/diagnosisPersistence";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD_DARK = "#c9a96e";
const ROSE      = "#b76e79";
const SAGE      = "#7A9E82";   // light-mode primary accent
const FOREST    = "#2D4F39";   // light-mode deep accent

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "foundation" | "scanning" | "facemap";
type Lang = "en" | "de" | "ko";

interface FoundationOption { label: { en: string; de: string; ko: string }; value: number }
interface FoundationQuestion {
  id: string; icon: string;
  text: string; textDE: string; textKO: string;
  hint?: string; hintDE?: string; hintKO?: string;
  options: FoundationOption[];
}

function optLabel(opt: FoundationOption, lang: Lang): string {
  return opt.label[lang] ?? opt.label.en;
}


// Module-level pill style — used in Foundation, InlineQuestionRenderer, atopy banner
function pillStyle(selected: boolean, isDark: boolean): React.CSSProperties {
  const GOLD = isDark ? GOLD_DARK : SAGE;
  return {
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", margin: "4px 5px 4px 0",
    borderRadius: 24, fontSize: 14, fontFamily: "var(--font-sans)",
    cursor: "pointer", minHeight: 44, lineHeight: "1",
    border: selected ? `1px solid ${GOLD}` : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    background: selected ? "rgba(201,169,110,0.15)" : "transparent",
    color: selected ? GOLD : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
    transition: "all 0.3s ease",
  };
}


// ─── Foundation questions ─────────────────────────────────────────────────────
const FOUNDATION_QUESTIONS: FoundationQuestion[] = [
  {
    id: "age_bracket", icon: "🎂",
    text: "What is your age range?",
    textDE: "In welcher Altersgruppe sind Sie?",
    textKO: "연령대가 어떻게 되시나요?",
    hint: "Your skin's needs change with age — this helps us recommend the right level of care",
    hintDE: "Die Bedürfnisse Ihrer Haut verändern sich mit dem Alter — so können wir die richtige Pflege empfehlen",
    hintKO: "나이에 따라 피부가 필요로 하는 관리가 달라져요 — 맞춤 추천을 위해 확인합니다",
    options: [
      { label: { en: "Under 20",  de: "Unter 20",  ko: "20세 미만" }, value: 0 },
      { label: { en: "20–29",     de: "20–29",     ko: "20–29세"  }, value: 1 },
      { label: { en: "30–39",     de: "30–39",     ko: "30–39세"  }, value: 2 },
      { label: { en: "40–49",     de: "40–49",     ko: "40–49세"  }, value: 3 },
      { label: { en: "50–59",     de: "50–59",     ko: "50–59세"  }, value: 4 },
      { label: { en: "60+",       de: "60+",       ko: "60세 이상" }, value: 5 },
    ],
  },
  {
    id: "gender", icon: "👤",
    text: "How do you identify?",
    textDE: "Wie identifizieren Sie sich?",
    textKO: "성별이 어떻게 되시나요?",
    hint: "Hormones significantly affect skin — this helps with hormonal and product recommendations",
    hintDE: "Hormone beeinflussen Ihre Haut erheblich — dies hilft bei hormonellen und Produktempfehlungen",
    hintKO: "호르몬이 피부에 큰 영향을 미쳐요 — 호르몬 관련 추천에 활용됩니다",
    options: [
      { label: { en: "Female",                       de: "Weiblich",              ko: "여성"              }, value: 0 },
      { label: { en: "Male",                          de: "Männlich",              ko: "남성"              }, value: 1 },
      { label: { en: "Non-binary / Prefer not to say", de: "Nicht-binär / Keine Angabe", ko: "논바이너리 / 답하고 싶지 않음" }, value: 2 },
    ],
  },
  {
    id: "sleep", icon: "🌙",
    text: "Average hours of restful sleep",
    textDE: "Stunden erholsamen Schlafs",
    textKO: "평균 수면 시간",
    options: [
      { label: { en: "< 5h",  de: "< 5 Std.",  ko: "5시간 미만"  }, value: 1 },
      { label: { en: "5–6h",  de: "5–6 Std.",  ko: "5-6시간"    }, value: 2 },
      { label: { en: "7h",    de: "7 Std.",    ko: "7시간"      }, value: 3 },
      { label: { en: "8h+",   de: "8+ Std.",   ko: "8시간 이상"  }, value: 4 },
    ],
  },
  {
    id: "water", icon: "💧",
    text: "Daily water intake",
    textDE: "Tägliche Wasseraufnahme",
    textKO: "일일 수분 섭취량",
    options: [
      { label: { en: "1–2 glasses", de: "1–2 Gläser", ko: "1-2잔"    }, value: 1 },
      { label: { en: "3–5 glasses", de: "3–5 Gläser", ko: "3-5잔"    }, value: 2 },
      { label: { en: "6+ glasses",  de: "6+ Gläser",  ko: "6잔 이상" }, value: 3 },
    ],
  },
  {
    id: "stress", icon: "🧠",
    text: "Current stress level",
    textDE: "Aktuelles Stresslevel",
    textKO: "현재 스트레스 수준",
    options: [
      { label: { en: "Low",      de: "Niedrig", ko: "낮음" }, value: 1 },
      { label: { en: "Moderate", de: "Mittel",  ko: "보통" }, value: 2 },
      { label: { en: "High",     de: "Hoch",    ko: "높음" }, value: 3 },
    ],
  },
  {
    id: "seasonal_change", icon: "🍂",
    text: "Does your skin behave differently in summer vs. winter?",
    textDE: "Verhält sich Ihre Haut im Sommer anders als im Winter?",
    textKO: "여름과 겨울에 피부 상태가 달라지나요?",
    hint: "Many Europeans experience oilier skin in summer and tighter/drier skin in winter — your routine should adapt",
    hintDE: "Viele Europäer haben im Sommer fettigere und im Winter trockenere Haut — Ihre Routine sollte sich anpassen",
    hintKO: "유럽에서는 여름에 더 유분지고 겨울에 더 건조해지는 분들이 많아요 — 루틴도 따라 바뀌어야 합니다",
    options: [
      { label: { en: "Yes — oilier in summer, drier in winter",   de: "Ja — im Sommer fettiger, im Winter trockener",   ko: "네 — 여름엔 유분, 겨울엔 건조"    }, value: 1 },
      { label: { en: "Yes — dry year-round, worse in winter",     de: "Ja — ganzjährig trocken, im Winter schlimmer",   ko: "네 — 연중 건조, 겨울에 더 심함"   }, value: 2 },
      { label: { en: "Yes — oily year-round, worse in summer",    de: "Ja — ganzjährig fettig, im Sommer schlimmer",    ko: "네 — 연중 유분, 여름에 더 심함"   }, value: 3 },
      { label: { en: "No significant change",                     de: "Keine wesentliche Veränderung",                  ko: "큰 변화 없음"                    }, value: 0 },
    ],
  },
  {
    id: "texture_pref", icon: "🧴",
    text: "What kind of moisturizer texture do you prefer?",
    textDE: "Welche Konsistenz bevorzugen Sie bei Ihrer Feuchtigkeitspflege?",
    textKO: "선호하는 보습제 질감이 어떤가요?",
    hint: "We'll recommend products that feel right on YOUR skin — no point prescribing a heavy cream if you hate the feel",
    hintDE: "Wir empfehlen Produkte, die sich für SIE gut anfühlen — eine schwere Creme nützt nichts, wenn Sie das Gefühl nicht mögen",
    hintKO: "피부에 맞으면서 발림감도 좋아야 꾸준히 쓸 수 있어요 — 선호도를 반영합니다",
    options: [
      { label: { en: "Light gel or water-based", de: "Leichtes Gel oder wasserbasiert",    ko: "가벼운 젤 또는 수분 베이스" }, value: 0 },
      { label: { en: "Medium lotion",            de: "Mittlere Lotion",                     ko: "보통 로션"               }, value: 1 },
      { label: { en: "Rich cream",               de: "Reichhaltige Creme",                  ko: "리치 크림"               }, value: 2 },
      { label: { en: "Depends on season",        de: "Kommt auf die Jahreszeit an",         ko: "계절에 따라 다름"         }, value: 3 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fqText(fq: FoundationQuestion, lang: Lang): string {
  return lang === "de" ? fq.textDE : lang === "ko" ? fq.textKO : fq.text;
}
function fqHint(fq: FoundationQuestion, lang: Lang): string | undefined {
  return lang === "de" ? fq.hintDE : lang === "ko" ? fq.hintKO : fq.hint;
}
function formatDiagnosisDate(isoStr: string, lang: Lang): string {
  const d = new Date(isoStr);
  if (lang === "ko") return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (lang === "de") return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Mini Radar Chart ─────────────────────────────────────────────────────────
const MINI_AXES = ["seb", "hyd", "bar", "sen", "acne", "pigment", "texture", "aging"] as const;
function MiniRadarChart({ scores }: { scores: Record<string, number> }) {
  const N = MINI_AXES.length;
  const cx = 54, cy = 54, r = 42;
  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;
  const pt = (i: number, s: number) => ({
    x: cx + r * Math.min(1, Math.max(0, s / 100)) * Math.cos(angle(i)),
    y: cy + r * Math.min(1, Math.max(0, s / 100)) * Math.sin(angle(i)),
  });
  const pts = MINI_AXES.map((a, i) => pt(i, scores[a] ?? 0));
  return (
    <svg viewBox="0 0 108 108" width="96" height="96" className="flex-shrink-0">
      {[0.3, 0.6, 1.0].map((lvl, gi) => (
        <polygon key={gi}
          points={MINI_AXES.map((_, i) => { const a = angle(i); return `${cx + r * lvl * Math.cos(a)},${cy + r * lvl * Math.sin(a)}`; }).join(" ")}
          fill="none" stroke="#C9A96E" strokeWidth="0.6" strokeOpacity="0.2" />
      ))}
      {MINI_AXES.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
          stroke="#C9A96E" strokeWidth="0.5" strokeOpacity="0.22" />
      ))}
      <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")}
        fill="#C9A96E" fillOpacity="0.14" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.8" />
      {pts.map((p, i) => (scores[MINI_AXES[i]] ?? 0) > 55
        ? <circle key={`rg-${i}`} cx={p.x} cy={p.y} r="3" fill="#B76E79" fillOpacity="0.55" />
        : null)}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="#C9A96E" fillOpacity="0.9" />)}
    </svg>
  );
}

// ─── Mobile Foundation Stepper (one question at a time) ───────────────────────
const TOTAL_MOBILE_STEPS = FOUNDATION_QUESTIONS.length + 1; // +1 for climate

function MobileFoundationStepper({
  currentIndex, selectedAnswers, onAnswer, onNext, onBack, lang, isDark, GOLD, onClimateChange,
}: {
  currentIndex: number;
  selectedAnswers: Record<string, number>;
  onAnswer: (id: string, value: number) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Lang;
  isDark: boolean;
  GOLD: string;
  onClimateChange: (ct: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClimateStep = currentIndex === FOUNDATION_QUESTIONS.length;
  const q = isClimateStep ? null : FOUNDATION_QUESTIONS[currentIndex];

  const handleAnswer = (id: string, value: number) => {
    onAnswer(id, value);
    // Auto-advance after 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onNext, 300);
  };

  return (
    <div style={{ padding: "0 4px", maxWidth: 440, margin: "0 auto" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {Array.from({ length: TOTAL_MOBILE_STEPS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= currentIndex
              ? GOLD
              : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>

      {/* Counter */}
      <div style={{
        fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
        color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
        fontFamily: "var(--font-sans)", marginBottom: 16,
      }}>
        {currentIndex + 1} / {TOTAL_MOBILE_STEPS}
      </div>

      {isClimateStep ? (
        /* Climate step */
        <div style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${isDark ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.18)"}`,
          borderRadius: 16, padding: "20px 16px",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🌍</div>
          <div style={{
            fontSize: 17, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
            fontFamily: "var(--font-sans)", marginBottom: 16,
          }}>
            {lang === "de" ? "Ihr Klima" : lang === "ko" ? "거주 기후" : "Your climate"}
          </div>
          <CityClimateInput
            lang={lang}
            onLegacyChange={onClimateChange}
          />
        </div>
      ) : q ? (
        /* Foundation question step */
        <>
          <div style={{ fontSize: 26, marginBottom: 8 }}>{q.icon}</div>
          <h3 style={{
            fontSize: 18, fontWeight: 400, marginBottom: 6, lineHeight: 1.4,
            color: isDark ? "#fff" : "#111", fontFamily: "var(--font-sans)",
          }}>
            {fqText(q, lang)}
          </h3>
          {fqHint(q, lang) && (
            <p style={{
              fontSize: 13, lineHeight: 1.5, marginBottom: 20,
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              fontFamily: "var(--font-sans)", fontStyle: "italic",
            }}>
              {fqHint(q, lang)}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map(opt => {
              const isSelected = selectedAnswers[q.id] === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(q.id, opt.value)}
                  style={{
                    padding: "14px 20px", borderRadius: 14,
                    textAlign: "left", cursor: "pointer",
                    fontSize: 15, fontFamily: "var(--font-sans)",
                    transition: "all 0.2s ease", border: "none",
                    borderWidth: 1, borderStyle: "solid",
                    borderColor: isSelected ? GOLD : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
                    background: isSelected
                      ? (isDark ? "rgba(201,169,110,0.1)" : "rgba(122,162,115,0.08)")
                      : "transparent",
                    color: isSelected ? GOLD : (isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)"),
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {optLabel(opt, lang)}
                </motion.button>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Back button */}
      {currentIndex > 0 && (
        <button
          onClick={onBack}
          style={{
            marginTop: 20, padding: "8px 0", background: "transparent",
            border: "none", cursor: "pointer",
            fontSize: 13, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
            fontFamily: "var(--font-sans)",
          }}
        >
          ← {lang === "ko" ? "이전" : lang === "de" ? "Zurück" : "Back"}
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  const store = useDiagnosisStore();
  const { language } = useI18nStore();
  const lang = language as Lang;
  const { resolvedTheme } = useTheme();
  const isDark      = resolvedTheme === "dark";
  const GOLD        = isDark ? GOLD_DARK : SAGE;
  const GOLD_DEEP   = isDark ? "#947E5C" : FOREST;
  const { history, loading: historyLoading, saveDiagnosis } = useDiagnosis();

  // ── URL-synced navigation state ──────────────────────────────────────────────
  // Each phase change (foundation ↔ facemap) creates a browser history entry,
  // so the browser back/forward buttons work naturally.
  // "scanning" is a transient 1.8 s animation — it gets its own local boolean
  // so it does NOT create a history entry (pressing back during scanning would
  // feel broken).
  const [searchParams, setSearchParams] = useSearchParams();
  const [isScanning, setIsScanning] = useState(false);

  // Derive phase from URL; fall back to "foundation"
  const urlPhase = searchParams.get("phase");
  const phase: Phase = isScanning
    ? "scanning"
    : urlPhase === "facemap"
    ? "facemap"
    : "foundation";

  // Mobile question index from URL (0-based)
  const mobileQ = Math.max(
    0,
    Math.min(
      parseInt(searchParams.get("q") || "0", 10),
      TOTAL_MOBILE_STEPS - 1
    )
  );

  const setPhase = useCallback(
    (newPhase: Phase) => {
      if (newPhase === "scanning") {
        setIsScanning(true);
        return;
      }
      setIsScanning(false);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newPhase === "foundation") {
            next.delete("phase");
            next.delete("q");
          } else {
            next.set("phase", newPhase);
          }
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const setMobileQ = useCallback(
    (updater: number | ((prev: number) => number)) => {
      const next =
        typeof updater === "function" ? updater(mobileQ) : updater;
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("q", String(next));
          return params;
        },
        { replace: false }
      );
    },
    [setSearchParams, mobileQ]
  );

  // ── Other local state ─────────────────────────────────────────────────────
  const [foundationAnswers, setFounds] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const hasCheckedHistory = useRef(false);

  // Auth guard — temporarily disabled for local dev
  // if (!isLoggedIn) return <Navigate to="/login?redirect=/diagnosis" replace />;

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Retest intercept
  useEffect(() => {
    if (historyLoading || hasCheckedHistory.current) return;
    hasCheckedHistory.current = true;
    if (history.length > 0) setShowRetestModal(true);
  }, [historyLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scanning transition auto-advance (isScanning is local — no URL history entry)
  useEffect(() => {
    if (!isScanning) return;
    const t = setTimeout(() => setPhase("facemap"), 1800);
    return () => clearTimeout(t);
  }, [isScanning, setPhase]);

  // Retest modal data
  const lastRecord = history[0] ?? null;
  const radarScores = (lastRecord?.radar_data ?? null) as Record<string, number> | null;
  const lastDiagnosedAt = lastRecord?.diagnosed_at ?? null;
  const lastTier = lastRecord?.skin_tier ?? null;

  // Derived state
  const foundationComplete =
    FOUNDATION_QUESTIONS.every(fq => foundationAnswers[fq.id] !== undefined) &&
    store.lifestyle.climateProfile != null;

  // Phase 03: begin face mapping — wire foundation answers to store
  const handleBeginFaceMapping = useCallback(() => {
    if (!foundationComplete) return;
    store.setAxisAnswer("EXP_SLEEP", (foundationAnswers.sleep ?? 1) - 1);
    // water/stress must be stored as string keys that buildFoundation's WATER_MAP / STRESS_MAP expect
    store.setAxisAnswer("EXP_WATER",  (["water_low", "water_mid", "water_high"] as const)[(foundationAnswers.water ?? 1) - 1] ?? "water_mid");
    store.setAxisAnswer("EXP_STRESS", (["stress_low", "stress_mod", "stress_high"] as const)[(foundationAnswers.stress ?? 1) - 1] ?? "stress_low");
    if (foundationAnswers.age_bracket !== undefined)
      store.setAxisAnswer("EXP_AGE", foundationAnswers.age_bracket);
    if (foundationAnswers.gender !== undefined)
      store.setAxisAnswer("EXP_GENDER", foundationAnswers.gender);
    if (foundationAnswers.seasonal_change !== undefined)
      store.setAxisAnswer("EXP_SEASONAL", foundationAnswers.seasonal_change);
    if (foundationAnswers.texture_pref !== undefined)
      store.setAxisAnswer("EXP_TEXTURE", foundationAnswers.texture_pref);
    // EXP_CLIMATE is set directly by CityClimateInput via setClimateProfile
    setPhase("scanning");
  }, [foundationComplete, foundationAnswers, store]);

  // Phase 03: Complete Analysis → runDiagnosis → /results
  const handleCompleteAnalysis = useCallback(async () => {
    if (analyzing) return;

    const { selectedZones } = useDiagnosisStore.getState();

    // Warn but don't silently block — user clicked the button, so proceed regardless
    const facemapConcerns = Object.values(selectedZones ?? {})
      .reduce((sum, z) => sum + (z?.concerns?.length ?? 0), 0);

    if (facemapConcerns === 0) {
      console.warn("[handleCompleteAnalysis] No face map concerns found — proceeding with axis answers only");
    }

    setAnalyzing(true);

    try {
      await new Promise(r => setTimeout(r, 400));

      // Use getState() to guarantee we read the latest Zustand state,
      // not the potentially-stale React hook snapshot captured in this closure.
      const freshState = useDiagnosisStore.getState();
      const result = runDiagnosisV5({
        axisAnswers:   freshState.axisAnswers,
        selectedZones: freshState.selectedZones ?? {},
        implicitFlags: freshState.implicitFlags,
        lifestyle:     freshState.lifestyle,
        products:      [],
      });

      if (!result) {
        console.error("[handleCompleteAnalysis] runDiagnosisV5 returned null/undefined — navigating to results with empty state");
        navigate("/results");
        return;
      }

      store.setResult(result);

      const TIER_MAP: Record<string, string> = {
        Entry: "Entry", Full: "Advanced", Premium: "Clinical",
      };

      const productBundle = (result.product_bundle ?? {}) as Record<
        string, Array<{ id: string; name: { en: string } }>
      >;
      const flatProducts = Object.entries(productBundle).flatMap(([phase, prods]) =>
        (prods ?? []).map(p => ({ id: p.id, name: p.name?.en ?? "", phase }))
      );

      // Persist to localStorage immediately — survives guest→login page reload
      savePendingDiagnosis({
        completedAt: new Date().toISOString(),
        axisScores: result.axis_scores as Record<string, number>,
        axisSeverity: (result.axis_severity ?? {}) as Record<string, string>,
        skinTier: TIER_MAP[store.selectedTier] ?? "Entry",
        recommendedProducts: flatProducts,
        fullResult: result,
        engineVersion: "v5.1",
      });

      // saveDiagnosis failure is non-fatal — navigate regardless.
      // Race against an 8-second timeout so a Supabase hang never freezes the spinner.
      try {
        const savePromise = saveDiagnosis(
          result.axis_scores as Record<string, number>,
          TIER_MAP[freshState.selectedTier] ?? "Entry",
          flatProducts
        );
        const timeoutPromise = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error("save_timeout")), 8000)
        );
        await Promise.race([savePromise, timeoutPromise]);
        // Authenticated save succeeded — no need to keep the localStorage copy
        clearPendingDiagnosis();
      } catch (saveErr) {
        console.warn("[handleCompleteAnalysis] saveDiagnosis failed (non-fatal):", saveErr);
      }

      navigate("/results");
    } catch (err) {
      console.error("[handleCompleteAnalysis] fatal error:", err);
      navigate("/results");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, store, saveDiagnosis, navigate]);

  return (
    <div style={{
      minHeight: "100vh", color: isDark ? "#e8e4df" : "hsl(210,30%,24%)",
      fontFamily: "var(--font-display)"
    }}
      className={isDark ? "" : "bg-background"}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${isDark ? 'rgba(201,169,110,0.2)' : 'rgba(45,79,57,0.15)'};border-radius:4px}
        input[type="range"]{accent-color:${isDark ? '#c9a96e' : '#7A9E82'}}
      `}</style>

      <Navbar />

      {/* ── Retest intercept modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showRetestModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(13,13,18,0.75)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowRetestModal(false); }}>
            <motion.div
              style={{
                position: "relative", width: "100%", maxWidth: 380, borderRadius: 24, overflow: "hidden",
                border: `1px solid ${isDark ? "rgba(201,169,110,0.3)" : "rgba(45,79,57,0.2)"}`,

                background: isDark ? "rgba(20,20,32,0.97)" : "rgba(255,255,255,0.97)",
                backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)"
              }}
              initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}>
              <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />
              <button onClick={() => setShowRetestModal(false)}
                style={{
                  position: "absolute", top: 14, right: 14, background: "none", border: "none",
                  cursor: "pointer", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", padding: 6, borderRadius: "50%"
                }}>
                <X size={16} />
              </button>
              <div style={{ padding: "20px 24px 24px" }}>
                <p style={{
                  fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase",
                  fontFamily: "var(--font-sans)", color: GOLD, marginBottom: 10
                }}>
                  {lang === "ko" ? "피부 분석 기록" : lang === "de" ? "Hautanalyse-Verlauf" : "Skin Analysis History"}
                </p>
                <h3 style={{ fontSize: "1.45rem", fontWeight: 300, lineHeight: 1.35, marginBottom: 4 }}>
                  {lang === "ko" ? "당신의 피부는 어떻게 달라졌을까요?"
                    : lang === "de" ? "Bereit zu sehen, wie sich Ihre Haut verändert hat?"
                      : "Ready to see how your skin has changed?"}
                </h3>
                {lastDiagnosedAt && (
                  <p style={{
                    fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", marginBottom: 16,
                    fontFamily: "var(--font-sans)", fontWeight: 300
                  }}>
                    {lang === "de" ? `Letzte Analyse: ${formatDiagnosisDate(lastDiagnosedAt, "de")}`
                      : lang === "ko" ? `마지막 분석: ${formatDiagnosisDate(lastDiagnosedAt, "ko")}`
                        : `Last analyzed: ${formatDiagnosisDate(lastDiagnosedAt, "en")}`}
                  </p>
                )}
                {radarScores && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 16, borderRadius: 16,
                    padding: 16, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: "1px solid rgba(201,169,110,0.15)", marginBottom: 20
                  }}>
                    <MiniRadarChart scores={radarScores} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase",
                        color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", fontFamily: "var(--font-sans)", marginBottom: 4
                      }}>
                        {lang === "ko" ? "피부 프로필" : lang === "de" ? "Hautprofil" : "Skin Profile"}
                      </p>
                      {lastTier && <p style={{ fontSize: 14, fontFamily: "var(--font-sans)", color: isDark ? "#e8e4df" : "#1a1a1a", marginBottom: 6 }}>{lastTier}</p>}
                      <p style={{
                        fontSize: 11, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", fontFamily: "var(--font-sans)",
                        lineHeight: 1.5, fontWeight: 300
                      }}>
                        {lang === "ko" ? "변화를 추적하면 더 정밀한 맞춤 프로토콜이 가능합니다."
                          : lang === "de" ? "Verfolgen Sie Veränderungen für ein präziseres Protokoll."
                            : "Track changes to refine your personalised protocol."}
                      </p>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { store.reset(); setShowRetestModal(false); }}
                    style={{
                      width: "100%", padding: "14px 24px", borderRadius: 14, border: "none",
                      background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                      color: "#0d0d12", fontSize: 13, fontFamily: "var(--font-sans)",
                      letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer",
                      boxShadow: `0 6px 24px ${isDark ? "rgba(201,169,110,0.3)" : "rgba(45,79,57,0.25)"}`
                    }}>
                    {lang === "ko" ? "새 분석 시작" : lang === "de" ? "Neue Analyse starten" : "Start New Analysis"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/profile")}
                    style={{
                      width: "100%", padding: "12px 24px", borderRadius: 14,
                      border: `1px solid ${isDark ? "rgba(201,169,110,0.3)" : "rgba(45,79,57,0.2)"}`, background: "transparent",
                      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)", fontSize: 13, fontFamily: "var(--font-sans)",
                      letterSpacing: "0.06em", cursor: "pointer"
                    }}>
                    {lang === "ko" ? "내 피부 여정 보기" : lang === "de" ? "Meine Hautreise ansehen" : "View My Skin Journey"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 960, margin: "0 auto",
        padding: isMobile ? "80px 20px 48px" : "88px 24px 64px"
      }}>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {["foundation", "facemap", "results"].map((p) => {
            const isDone = (p === "foundation" && phase !== "foundation") ||
              (p === "facemap" && phase === "facemap" /* not done yet */);
            const isActive = (p === "foundation" && phase === "foundation") ||
              (p === "facemap" && (phase === "facemap" || phase === "scanning")) ||
              (p === "results" && analyzing);
            return (
              <div key={p} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: isActive ? `linear-gradient(90deg, ${GOLD}, ${ROSE})`
                  : isDone ? GOLD : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                transition: "all 0.6s ease",
              }} />
            );
          })}
        </div>
        <p style={{
          fontSize: 12, letterSpacing: "0.22em", color: isDark ? "rgba(201,169,110,0.6)" : "rgba(45,79,57,0.65)",
          textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: 36
        }}>
          {phase === "foundation" && (lang === "de" ? "Phase 01 · Basis-Scan" : lang === "ko" ? "Phase 01 · 기초 스캔" : "Phase 01 · Foundation Scan")}
          {phase === "scanning" && (lang === "de" ? "Scan wird initialisiert…" : lang === "ko" ? "스캔 초기화 중…" : "Initiating Skin Scan…")}
          {phase === "facemap" && (lang === "de" ? "Phase 02–03 · Gesichts-Mapping & Analyse" : lang === "ko" ? "Phase 02–03 · 얼굴 매핑 & 분석" : "Phase 02–03 · Face Mapping & Analysis")}
        </p>

        <AnimatePresence mode="wait">

          {/* ─────────── PHASE 01: FOUNDATION ─────────── */}
          {phase === "foundation" && (
            <motion.div key="foundation"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
              <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 300, color: GOLD, marginBottom: 6 }}>
                {lang === "de" ? "Ihr Alltag & Ihre Haut" : lang === "ko" ? "일상 생활과 피부" : "Your Daily Life & Skin"}
              </h1>
              <p style={{
                fontSize: 15, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)", marginBottom: 36,
                fontFamily: "var(--font-sans)", maxWidth: 480, lineHeight: 1.6
              }}>
                {lang === "de" ? "Wir beginnen mit Ihrem Lebensstil — dem Fundament, das Ihre Haut täglich prägt."
                  : lang === "ko" ? "피부를 형성하는 가장 기본적인 생활 습관부터 시작합니다."
                    : "We start with your lifestyle — the foundation that shapes your skin every day."}
              </p>
              {/* ── Mobile: one question at a time ── */}
              {isMobile ? (
                <div style={{ marginBottom: 36 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mobileQ}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <MobileFoundationStepper
                        currentIndex={mobileQ}
                        selectedAnswers={foundationAnswers}
                        onAnswer={(id, val) => setFounds(p => ({ ...p, [id]: val }))}
                        onNext={() => setMobileQ(q => Math.min(q + 1, TOTAL_MOBILE_STEPS - 1))}
                        onBack={() => setMobileQ(q => Math.max(q - 1, 0))}
                        lang={lang} isDark={isDark} GOLD={GOLD}
                        onClimateChange={(ct) => store.setAxisAnswer("EXP_CLIMATE", ct)}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Desktop: 4-column grid ── */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 44 }}>
                  {FOUNDATION_QUESTIONS.map((fq, i) => (
                    <motion.div key={fq.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: `1px solid ${isDark ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.18)"}`,
                        borderRadius: 16, padding: "20px 16px",
                        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)"
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{fq.icon}</div>
                      <div style={{
                        fontSize: 15, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)", marginBottom: 6,
                        fontFamily: "var(--font-sans)", lineHeight: 1.5
                      }}>{fqText(fq, lang)}</div>
                      {fqHint(fq, lang) && (
                        <div style={{
                          fontSize: 11, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                          fontFamily: "var(--font-sans)", lineHeight: 1.4, marginBottom: 10, fontStyle: "italic"
                        }}>{fqHint(fq, lang)}</div>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {fq.options.map(opt => (
                          <div key={opt.value}
                            onClick={() => setFounds(p => ({ ...p, [fq.id]: opt.value }))}
                            style={pillStyle(foundationAnswers[fq.id] === opt.value, isDark)}>
                            {optLabel(opt, lang)}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  {/* Climate card — desktop */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: FOUNDATION_QUESTIONS.length * 0.08, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${isDark ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.18)"}`,
                      borderRadius: 16, padding: "20px 16px",
                      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)"
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🌍</div>
                    <div style={{
                      fontSize: 15, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)", marginBottom: 14,
                      fontFamily: "var(--font-sans)", lineHeight: 1.5
                    }}>
                      {lang === "de" ? "Ihr Klima" : lang === "ko" ? "거주 기후" : "Your climate"}
                    </div>
                    <CityClimateInput
                      lang={lang}
                      onLegacyChange={(climateType) => store.setAxisAnswer("EXP_CLIMATE", climateType)}
                    />
                  </motion.div>
                </div>
              )}
              <div style={{ textAlign: "center" }}>
                <motion.button onClick={handleBeginFaceMapping}
                  whileTap={foundationComplete ? { scale: 0.97 } : {}}
                  style={{
                    display: "inline-block", padding: "16px 40px", borderRadius: 32, border: "none",
                    background: foundationComplete ? `linear-gradient(135deg, ${GOLD}, ${ROSE})` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    color: foundationComplete ? "#fafafdff" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)",
                    fontSize: 15, fontFamily: "var(--font-sans)",
                    letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600,
                    cursor: foundationComplete ? "pointer" : "default",
                    boxShadow: foundationComplete ? `0 8px 32px ${isDark ? "rgba(201,169,110,0.3)" : "rgba(45,79,57,0.25)"}` : "none",
                    transition: "all 0.4s ease",
                  }}>
                  {lang === "de" ? "Gesichts-Mapping beginnen →" : lang === "ko" ? "얼굴 매핑 시작 →" : "Begin Face Mapping →"}
                </motion.button>
                {!foundationComplete && (
                  <p style={{
                    marginTop: 10, fontSize: 12, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)",
                    fontFamily: "var(--font-sans)"
                  }}>
                    {lang === "de" ? "Bitte alle 4 Fragen beantworten" : lang === "ko" ? "4개 질문을 모두 답해주세요" : "Answer all 4 questions to continue"}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ─────────── SCANNING TRANSITION ─────────── */}
          {phase === "scanning" && (
            <motion.div key="scanning"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                minHeight: "60vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 24
              }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <motion.div style={{
                  position: "absolute", inset: -16, borderRadius: "50%",
                  background: `radial-gradient(circle, ${isDark ? 'rgba(201,169,110,0.15)' : 'rgba(45,79,57,0.12)'} 0%, transparent 70%)`
                }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div style={{
                  position: "absolute", inset: 4, borderRadius: "50%",
                  background: `conic-gradient(from 0deg, transparent 0%, ${GOLD} 35%, transparent 70%)`
                }}
                  animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                <div style={{
                  position: "absolute", inset: 16, borderRadius: "50%",
                  background: "linear-gradient(160deg, #0d0d12 0%, #141420 100%)"
                }} />
                <motion.div style={{
                  position: "absolute", inset: 16, borderRadius: "50%",
                  background: `conic-gradient(from 180deg, transparent 0%, ${ROSE} 20%, transparent 40%)`
                }}
                  animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <div style={{
                  position: "absolute", inset: 26, borderRadius: "50%",
                  background: "linear-gradient(160deg, #0d0d12 0%, #141420 100%)"
                }} />
                <motion.div style={{
                  position: "absolute", inset: 26, borderRadius: "50%",
                  background: `radial-gradient(circle, ${GOLD}, ${isDark ? 'rgba(201,169,110,0.4)' : 'rgba(45,79,57,0.35)'})`
                }}
                  animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <motion.p style={{
                fontSize: isMobile ? 20 : 26, fontWeight: 300, color: GOLD,
                letterSpacing: "0.06em", textAlign: "center"
              }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                {lang === "de" ? "Haut-Scan wird initialisiert…" : lang === "ko" ? "피부 스캔 초기화 중…" : "Initiating Skin Scan…"}
              </motion.p>
              <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)", fontFamily: "var(--font-sans)", letterSpacing: "0.12em" }}>
                {lang === "de" ? "Biometrische Gesichtsanalyse wird vorbereitet" : lang === "ko" ? "생체 인식 얼굴 분석 준비 중" : "Preparing biometric facial analysis"}
              </p>
            </motion.div>
          )}

          {/* ─────────── PHASE 02+03: FACE MAP ─────────── */}
          {phase === "facemap" && (
            <motion.div key="facemap"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}>
              <FaceMapStep onNext={handleCompleteAnalysis} isAnalyzing={analyzing} />
            </motion.div>
          )}



        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiagnosisPage;
