// src/pages/Diagnosis.tsx
// ANTIGRAVITY Rebuild — Phase 01 + 02 + 03
// Phase 03 adds: contextual deep-dive axis questions, smart deduplication,
// foundation & atopy store wiring, and the full "Complete Analysis" → runDiagnosis → /results flow.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore } from "@/store/i18nStore";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import Navbar from "@/components/Navbar";
import { FaceMapStep } from "@/components/diagnosis/FaceMapStep";
import { CityClimateInput } from "@/components/diagnosis/CityClimateInput";
import { runDiagnosisV5 } from "@/engine/axisAnswerBridgeV5";
import { savePendingDiagnosis, clearPendingDiagnosis } from "@/utils/diagnosisPersistence";
import RetestReminderModal from "@/components/RetestReminderModal";
import { tokens, ctaTokens, glassTokens, buttonTokens } from "@/lib/designTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "foundation" | "scanning" | "facemap";
type Lang = "en" | "de" | "ko";

import { FOUNDATION_QUESTIONS, fqText, fqHint, optLabel } from "@/data/foundationQuestions";
import type { FoundationOption, FoundationQuestion } from "@/data/foundationQuestions";


// Module-level pill style — used in Foundation, InlineQuestionRenderer, atopy banner
function pillStyle(selected: boolean, isDark: boolean): React.CSSProperties {
  const btnTok = buttonTokens(isDark);
  const tok = tokens(isDark);
  return {
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", margin: "4px 5px 4px 0",
    borderRadius: 24, fontSize: 14, fontFamily: "var(--font-sans)",
    cursor: "pointer", minHeight: 44, lineHeight: "1",
    border: selected ? btnTok.accentGhost.border : btnTok.ghost.border,
    background: selected ? btnTok.accentGhost.background : "transparent",
    color: selected ? btnTok.accentGhost.color : tok.textSecondary,
    transition: "all 0.3s ease",
  };
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDiagnosisDate(isoStr: string, lang: Lang): string {
  const d = new Date(isoStr);
  if (lang === "ko") return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (lang === "de") return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Mini Radar Chart ─────────────────────────────────────────────────────────
const MINI_AXES = ["seb", "hyd", "bar", "sen", "acne", "pigment", "texture", "aging"] as const;
function MiniRadarChart({ scores, isDark }: { scores: Record<string, number>; isDark?: boolean }) {
  const tok = tokens(isDark ?? false);
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
          fill="none" stroke={tok.accent} strokeWidth="0.6" strokeOpacity="0.2" />
      ))}
      {MINI_AXES.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
          stroke={tok.accent} strokeWidth="0.5" strokeOpacity="0.22" />
      ))}
      <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")}
        fill={tok.accent} fillOpacity="0.14" stroke={tok.accent} strokeWidth="1.5" strokeOpacity="0.8" />
      {pts.map((p, i) => (scores[MINI_AXES[i]] ?? 0) > 55
        ? <circle key={`rg-${i}`} cx={p.x} cy={p.y} r="3" fill={tok.accentDeep} fillOpacity="0.55" />
        : null)}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill={tok.accent} fillOpacity="0.9" />)}
    </svg>
  );
}

// ─── Mobile Foundation Stepper (one question at a time) ───────────────────────
const TOTAL_MOBILE_STEPS = FOUNDATION_QUESTIONS.length + 1; // +1 for climate

function MobileFoundationStepper({
  currentIndex, selectedAnswers, onAnswer, onNext, onBack, lang, isDark, onClimateChange,
}: {
  currentIndex: number;
  selectedAnswers: Record<string, number>;
  onAnswer: (id: string, value: number) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Lang;
  isDark: boolean;
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
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {Array.from({ length: TOTAL_MOBILE_STEPS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= currentIndex
              ? tokens(isDark).accent
              : tokens(isDark).border,
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>

      {/* Counter */}
      <div style={{
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        color: tokens(isDark).textTertiary,
        fontFamily: "var(--font-sans)", marginBottom: 10,
      }}>
        {currentIndex + 1} / {TOTAL_MOBILE_STEPS}
      </div>

      {isClimateStep ? (
        /* Climate step */
        <div style={{
          ...glassTokens(isDark).button,
          borderRadius: 16, padding: "20px 16px",
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🌍</div>
          <div style={{
            fontSize: 17, color: tokens(isDark).textSecondary,
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
          <div style={{ fontSize: 22, marginBottom: 4 }}>{q.icon}</div>
          <h3 style={{
            fontSize: 16, fontWeight: 400, marginBottom: 4, lineHeight: 1.4,
            color: tokens(isDark).text, fontFamily: "var(--font-sans)",
          }}>
            {fqText(q, lang)}
          </h3>
          {fqHint(q, lang) && (
            <p style={{
              fontSize: 14, lineHeight: 1.5, marginBottom: 16,
              color: tokens(isDark).textSecondary,
              fontFamily: "var(--font-sans)", fontWeight: 500,
            }}>
              {fqHint(q, lang)}
            </p>
          )}
          <div style={{
            display: q.id === 'age_bracket' ? 'grid' : 'flex',
            ...(q.id === 'age_bracket'
              ? { gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }
              : { flexDirection: 'column' as const, gap: 10 }),
          }}>
            {q.options.map(opt => {
              const isSelected = selectedAnswers[q.id] === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(q.id, opt.value)}
                  translate="no"
                  className="notranslate"
                  style={{
                    padding: q.id === 'age_bracket' ? '14px 8px' : '14px 20px',
                    borderRadius: 14,
                    textAlign: q.id === 'age_bracket' ? 'center' : 'left',
                    cursor: "pointer",
                    fontSize: 15, fontFamily: "var(--font-sans)",
                    transition: "all 0.2s ease", border: "none",
                    borderWidth: 1, borderStyle: "solid",
                    borderColor: isSelected ? tokens(isDark).accent : tokens(isDark).border,
                    background: isSelected
                      ? tokens(isDark).accentBg
                      : "transparent",
                    color: isSelected ? tokens(isDark).accent : tokens(isDark).textSecondary,
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
            fontSize: 13, color: tokens(isDark).textTertiary,
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
  const isDark = resolvedTheme === "dark";
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const glassTok = glassTokens(isDark);
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

  // ── Task 1: Reset diagnosis state on mount to clear leftover zone data ──────
  useEffect(() => {
    store.reset();
    setFounds({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    store.setAxisAnswer("EXP_WATER", (["water_low", "water_mid", "water_high"] as const)[(foundationAnswers.water ?? 1) - 1] ?? "water_mid");
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
        axisAnswers: freshState.axisAnswers,
        selectedZones: freshState.selectedZones ?? {},
        implicitFlags: freshState.implicitFlags,
        lifestyle: freshState.lifestyle,
        products: [],
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
        toast.error(
          lang === "ko" ? "결과 저장에 실패했습니다. 다시 시도해주세요."
            : lang === "de" ? "Ergebnisse konnten nicht gespeichert werden. Bitte versuchen Sie es erneut."
              : "Failed to save results. Please try again."
        );
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
      minHeight: "100vh", color: tok.text,
      background: tok.bg,
      fontFamily: "var(--font-display)"
    }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${tok.accentBg};border-radius:4px}
        input[type="range"]{accent-color:${tok.accent}}
      `}</style>

      <Navbar />

      {/* ── Retest intercept modal ─────────────────────────────────────────── */}
      <RetestReminderModal
        isOpen={showRetestModal}
        onConfirm={() => { store.reset(); setFounds({}); setShowRetestModal(false); }}
        onDismiss={() => setShowRetestModal(false)}
        lastDiagnosedAt={lastDiagnosedAt}
        radarScores={radarScores}
        skinTier={lastTier}
      />

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 960, margin: "0 auto",
        padding: isMobile ? "58px 20px 120px" : "88px 24px 64px"
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
                background: isActive ? ctaTok.background
                  : isDone ? tok.accent : tok.border,
                transition: "all 0.6s ease",
              }} />
            );
          })}
        </div>
        <p style={{
          fontSize: 11, letterSpacing: "0.22em", color: tok.accentMuted,
          textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: isMobile ? 6 : 36
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
              <h1 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 300, color: tok.accent, marginBottom: isMobile ? 2 : 6 }}>
                {lang === "de" ? "Ihr Alltag & Ihre Haut" : lang === "ko" ? "일상 생활과 피부" : "Your Daily Life & Skin"}
              </h1>
              <p style={{
                fontSize: isMobile ? 13 : 15, color: tok.textSecondary, marginBottom: isMobile ? 16 : 36,
                fontFamily: "var(--font-sans)", maxWidth: 480, lineHeight: 1.5
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
                        lang={lang} isDark={isDark}
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
                        ...glassTok.button,
                        borderRadius: 16, padding: "20px 16px",
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{fq.icon}</div>
                      <div style={{
                        fontSize: 15, color: tok.textSecondary, marginBottom: 6,
                        fontFamily: "var(--font-sans)", lineHeight: 1.5
                      }}>{fqText(fq, lang)}</div>
                      {fqHint(fq, lang) && (
                        <div style={{
                          fontSize: 11, color: tok.textTertiary,
                          fontFamily: "var(--font-sans)", lineHeight: 1.4, marginBottom: 10, fontStyle: "italic"
                        }}>{fqHint(fq, lang)}</div>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {fq.options.map(opt => (
                          <div key={opt.value}
                            onClick={() => setFounds(p => ({ ...p, [fq.id]: opt.value }))}
                            style={pillStyle(foundationAnswers[fq.id] === opt.value, isDark)}
                            translate="no"
                            className="notranslate">
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
                      ...glassTok.button,
                      borderRadius: 16, padding: "20px 16px",
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🌍</div>
                    <div style={{
                      fontSize: 15, color: tok.textSecondary, marginBottom: 14,
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
                  whileHover={foundationComplete ? { y: -1, boxShadow: ctaTok.hoverBoxShadow } : {}}
                  whileTap={foundationComplete ? { scale: 0.98, y: 0, boxShadow: ctaTok.activeBoxShadow } : {}}
                  style={{
                    display: "inline-block", padding: "16px 40px", borderRadius: 32,
                    border: foundationComplete ? "none" : glassTok.button.border,
                    background: foundationComplete ? ctaTok.background : glassTok.button.background,
                    backdropFilter: foundationComplete ? "none" : glassTok.button.backdropFilter,
                    WebkitBackdropFilter: foundationComplete ? "none" : glassTok.button.WebkitBackdropFilter,
                    color: foundationComplete ? ctaTok.color : tok.textTertiary,
                    boxShadow: foundationComplete ? ctaTok.boxShadow : "none",
                    fontSize: 15, fontFamily: "var(--font-sans)",
                    letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600,
                    cursor: foundationComplete ? "pointer" : "default",
                    transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}>
                  {lang === "de" ? "Gesichts-Mapping beginnen →" : lang === "ko" ? "얼굴 매핑 시작 →" : "Begin Face Mapping →"}
                </motion.button>
                {!foundationComplete && (
                  <p style={{
                    marginTop: 10, fontSize: 12, color: tok.textTertiary,
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
                  background: `radial-gradient(circle, ${isDark ? 'rgba(45,107,74,0.15)' : 'rgba(45,79,57,0.12)'} 0%, transparent 70%)`
                }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div style={{
                  position: "absolute", inset: 4, borderRadius: "50%",
                  background: `conic-gradient(from 0deg, transparent 0%, ${tok.accent} 35%, transparent 70%)`
                }}
                  animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                <div style={{
                  position: "absolute", inset: 16, borderRadius: "50%",
                  background: tok.bgSurface,
                }} />
                <motion.div style={{
                  position: "absolute", inset: 16, borderRadius: "50%",
                  background: `conic-gradient(from 180deg, transparent 0%, ${tok.accentDeep} 20%, transparent 40%)`
                }}
                  animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <div style={{
                  position: "absolute", inset: 26, borderRadius: "50%",
                  background: tok.bgElevated,
                }} />
                <motion.div style={{
                  position: "absolute", inset: 26, borderRadius: "50%",
                  background: `radial-gradient(circle, ${tok.accent}, ${tok.accentBg})`
                }}
                  animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <motion.p style={{
                fontSize: isMobile ? 20 : 26, fontWeight: 300, color: tok.accent,
                letterSpacing: "0.06em", textAlign: "center"
              }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                {lang === "de" ? "Haut-Scan wird initialisiert…" : lang === "ko" ? "피부 스캔 초기화 중…" : "Initiating Skin Scan…"}
              </motion.p>
              <p style={{ fontSize: 12, color: tok.textTertiary, fontFamily: "var(--font-sans)", letterSpacing: "0.12em" }}>
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
