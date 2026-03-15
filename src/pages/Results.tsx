import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useAuthStore } from "@/store/authStore";
import { getPendingDiagnosis } from "@/utils/diagnosisPersistence";
import { useI18nStore } from "@/store/i18nStore";
import { buildRoutineV5 } from "@/engine/routineEngineV5";
import type { RoutineOutputV5 } from "@/engine/routineEngineV5";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import SlideDiagnosisSummary from "@/components/results/SlideDiagnosisSummary";
import SlideAxisBreakdown from "@/components/results/SlideAxisBreakdown";
import SlideWhyProducts from "@/components/results/SlideWhyProducts";
import SlideProtocol from "@/components/results/SlideProtocol";
import SlideSubscriptionTable from "@/components/results/SlideSubscriptionTable";
import SlideSubscribe from "@/components/results/SlideSubscribe";
import SlideNav from "@/components/results/SlideNav";
import DebugPanel from "@/components/diagnosis/DebugPanel";
import { useProductStore } from "@/store/productStore";
import type {
  DiagnosisResult, AxisScores, AxisSeverity, Product,
  ClinicalGrade, ZoneId, ZoneHeatmapEntry, ScoreProvenance, ProjectedImprovement, AxisKey,
} from "@/engine/types";

const SLIDE_LABELS = {
  en: [
    { key: "diagnosis", short: "Pattern", full: "Your Skin Pattern" },
    { key: "axes", short: "Analysis", full: "Clinical Analysis" },
    { key: "protocol", short: "Protocol", full: "Your Routine" },
    { key: "plans", short: "Plans", full: "Choose Your Plan" },
    { key: "products", short: "Products", full: "Matched Products" },
    { key: "subscribe", short: "Strategy", full: "Adaptive Strategy" },
  ],
  de: [
    { key: "diagnosis", short: "Muster", full: "Ihr Hautmuster" },
    { key: "axes", short: "Analyse", full: "Klinische Analyse" },
    { key: "protocol", short: "Protokoll", full: "Ihre Routine" },
    { key: "plans", short: "Abo", full: "Plan wählen" },
    { key: "products", short: "Produkte", full: "Passende Produkte" },
    { key: "subscribe", short: "Strategie", full: "Adaptive Strategie" },
  ],
  ko: [
    { key: "diagnosis", short: "패턴", full: "피부 패턴 분석" },
    { key: "axes", short: "분석", full: "임상 분석 결과" },
    { key: "protocol", short: "루틴", full: "맞춤 스킨케어 루틴" },
    { key: "plans", short: "플랜", full: "플랜 선택" },
    { key: "products", short: "제품", full: "맞춤 추천 제품" },
    { key: "subscribe", short: "전략", full: "맞춤 스킨케어 전략" },
  ],
};

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

// Dev-only mock result for testing Results UI without running full diagnosis
function makeMockResult(products: Product[]): DiagnosisResult {
  const axis_scores: AxisScores    = { seb: 62, hyd: 48, bar: 74, sen: 85, ox: 33, acne: 71, pigment: 45, texture: 56, aging: 38, makeup_stability: 22 };
  const axis_severity: AxisSeverity = { seb: 2,  hyd: 1,  bar: 2,  sen: 3,  ox: 1,  acne: 2,  pigment: 1,  texture: 2,  aging: 1,  makeup_stability: 0 };

  // ── V5 mock fields ──────────────────────────────────────────────────────────
  const axis_clinical_grade: Record<AxisKey, { grade: ClinicalGrade; label: { en: string; de: string; ko: string } }> = {
    seb:              { grade: "active",   label: { en: "Active",   de: "Aktiv",    ko: "활성" } },
    hyd:              { grade: "watch",    label: { en: "Watch",    de: "Beachten", ko: "주의" } },
    bar:              { grade: "active",   label: { en: "Active",   de: "Aktiv",    ko: "활성" } },
    sen:              { grade: "critical", label: { en: "Critical", de: "Kritisch", ko: "위험" } },
    ox:               { grade: "watch",    label: { en: "Watch",    de: "Beachten", ko: "주의" } },
    acne:             { grade: "active",   label: { en: "Active",   de: "Aktiv",    ko: "활성" } },
    pigment:          { grade: "watch",    label: { en: "Watch",    de: "Beachten", ko: "주의" } },
    texture:          { grade: "active",   label: { en: "Active",   de: "Aktiv",    ko: "활성" } },
    aging:            { grade: "watch",    label: { en: "Watch",    de: "Beachten", ko: "주의" } },
    makeup_stability: { grade: "stable",   label: { en: "Stable",   de: "Stabil",   ko: "안정" } },
  };

  const zone_heatmap: Partial<Record<ZoneId, ZoneHeatmapEntry>> = {
    forehead: { intensity: 0.55, dominantAxis: "seb", concernCount: 3,
      summary: { en: "Oily T-zone with intermittent congestion", de: "Ölige T-Zone mit gelegentlicher Verstopfung", ko: "간헐적 모공 막힘이 있는 T존 유분" } },
    cheeks:   { intensity: 0.72, dominantAxis: "sen", concernCount: 4,
      summary: { en: "Reactive skin with redness and heat sensitivity", de: "Reaktive Haut mit Rötungen und Wärmeempfindlichkeit", ko: "홍조 및 열 민감성이 있는 반응성 피부" } },
    nose:     { intensity: 0.48, dominantAxis: "acne", concernCount: 2,
      summary: { en: "Enlarged pores with blackhead tendency", de: "Vergrößerte Poren mit Mitesser-Neigung", ko: "블랙헤드 경향이 있는 확장된 모공" } },
  };

  const score_provenance: ScoreProvenance[] = [
    {
      axis: "sen", totalScore: 85,
      breakdown: {
        zoneConcerns:        [{ zone: "cheeks", concernId: "redness_c", contribution: 18 }, { zone: "cheeks", concernId: "stinging_c", contribution: 12 }],
        deepDiveQuestions:   [{ questionId: "SEN_01", contribution: 20 }],
        foundationModifiers: [{ factor: "high_stress", multiplier: 1.15 }],
        crossAxisBonus:      null,
      },
    },
    {
      axis: "bar", totalScore: 74,
      breakdown: {
        zoneConcerns:        [{ zone: "cheeks", concernId: "dryness_c", contribution: 15 }],
        deepDiveQuestions:   [{ questionId: "BAR_01", contribution: 18 }],
        foundationModifiers: [{ factor: "low_sleep", multiplier: 1.10 }],
        crossAxisBonus:      { pattern: "barrier_stress", bonusPercent: 8 },
      },
    },
  ];

  const projected_improvement: ProjectedImprovement = {
    seb:              { currentScore: 62, targetScore4w: 51, targetScore12w: 43 },
    hyd:              { currentScore: 48, targetScore4w: 37, targetScore12w: 30 },
    bar:              { currentScore: 74, targetScore4w: 56, targetScore12w: 46 },
    sen:              { currentScore: 85, targetScore4w: 68, targetScore12w: 58 },
    ox:               { currentScore: 33, targetScore4w: 28, targetScore12w: 25 },
    acne:             { currentScore: 71, targetScore4w: 60, targetScore12w: 53 },
    pigment:          { currentScore: 45, targetScore4w: 41, targetScore12w: 38 },
    texture:          { currentScore: 56, targetScore4w: 49, targetScore12w: 44 },
    aging:            { currentScore: 38, targetScore4w: 34, targetScore12w: 31 },
    makeup_stability: { currentScore: 22, targetScore4w: 19, targetScore12w: 16 },
  };
  // ────────────────────────────────────────────────────────────────────────────

  return {
    engineVersion: "v5-mock",
    axis_scores,
    axis_severity,
    axis_scores_normalized: axis_scores,
    detected_patterns: [{ pattern: { id: "barrier_stress", name_en: "Barrier Stress Pattern", required: [], optional: [], min_optional: 0, axis_gates: {}, clinical_en: "Barrier compromise with sensitivity overlay", flag: "BARRIER_EMERGENCY", urgency: "HIGH", threshold: 0.6 }, score: 0.82, severity: 2 }],
    urgency_level: "HIGH",
    active_flags: ["BARRIER_EMERGENCY"],
    radar_chart_data: [
      { axis: "Sebum",       score: 62, label: "Sebum"       },
      { axis: "Hydration",   score: 48, label: "Hydration"   },
      { axis: "Barrier",     score: 74, label: "Barrier"     },
      { axis: "Sensitivity", score: 85, label: "Sensitivity" },
      { axis: "Acne",        score: 71, label: "Acne"        },
      { axis: "Aging",       score: 38, label: "Aging"       },
    ],
    primary_concerns:   ["sen", "bar", "acne"],
    secondary_concerns: ["seb", "hyd", "texture"],
    product_bundle: {
      Phase1: products[0] ? [products[0]] : [],
      Phase2: products[1] ? [products[1]] : [],
      Phase3: products[2] ? [products[2]] : [],
      Phase4: products[3] ? [products[3]] : [],
      Phase5: products[4] ? [products[4]] : [],
    },
    // V5 fields
    axis_clinical_grade,
    zone_heatmap,
    score_provenance,
    projected_improvement,
  };
}

const ResultsPage = () => {
  const { result: storeResult, implicitFlags, setResult } = useDiagnosisStore();
  const { products } = useProductStore();
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get("debug") === "true";
  const { language } = useI18nStore();

  // Use mock data in dev when no real result exists.
  // Fallback to localStorage pending diagnosis (survives guest→login page reload).
  const result = useMemo(() => {
    if (storeResult) return storeResult;
    const pending = getPendingDiagnosis();
    if (pending?.fullResult) return pending.fullResult;
    if (import.meta.env.DEV) return makeMockResult(products);
    return null;
  }, [storeResult, products]);

  // Restore pending diagnosis into Zustand store so navigating away and back works.
  // Don't clear localStorage here — AuthCallback needs it to sync to Supabase.
  useEffect(() => {
    if (storeResult) return;
    const pending = getPendingDiagnosis();
    if (pending?.fullResult) setResult(pending.fullResult);
  }, [storeResult, setResult]);

  // B-1 + B-2: compute personalised routine from V5 result (pure, no side-effects)
  const routineOutput = useMemo<RoutineOutputV5 | null>(() => {
    if (!result) return null;
    return buildRoutineV5(result, implicitFlags, "Full");
  }, [result, implicitFlags]);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  // Auto-save diagnosis result to user profile if logged in
  const { isLoggedIn, saveDiagnosisResult } = useAuthStore();
  useEffect(() => {
    if (isLoggedIn && result) {
      saveDiagnosisResult(result);
    }
  }, [isLoggedIn, result, saveDiagnosisResult]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= 6) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [current]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, goTo]);

  if (!result) return <Navigate to="/diagnosis" replace />;

  // PRODUCTS slide is at index 4
  const PRODUCTS_SLIDE = 4;

  const slides = [
    <SlideDiagnosisSummary result={result} />,
    <SlideAxisBreakdown result={result} goToProducts={() => goTo(PRODUCTS_SLIDE)} />,
    <SlideProtocol result={result} routineOutput={routineOutput!} />,
    <SlideSubscriptionTable result={result} />,
    <SlideWhyProducts result={result} />,
    <SlideSubscribe result={result} />,
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <SilkBackground />
      <Navbar />

      {/* Narrative progress bar */}
      <div className="absolute top-[57px] left-0 right-0 z-50 h-0.5 bg-border/40">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((current + 1) / 6) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goTo(current + 1);
            if (info.offset.x > 60) goTo(current - 1);
          }}
          className="absolute inset-0 flex flex-col pt-[60px] pb-16"
        >
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation overlay */}
      <SlideNav
        current={current}
        total={6}
        labels={SLIDE_LABELS[language].map((l) => l.short)}
        fullLabels={SLIDE_LABELS[language].map((l) => l.full)}
        onPrev={() => goTo(current - 1)}
        onNext={() => goTo(current + 1)}
        onGoTo={goTo}
      />

      {/* Debug panel */}
      {isDebug && result?._debug && <DebugPanel debugData={result._debug} />}

      {/* Lab CTA — shown on last slide for logged-in users */}
      {isLoggedIn && current === slides.length - 1 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-5 py-3
                     bg-white/95 dark:bg-[#0D0D0D]/95 backdrop-blur-sm
                     border-t border-[#C8A951]/30 dark:border-[#C8A951]/20"
        >
          <p className="text-xs font-medium text-[#947E5C] dark:text-[#C8A951]/80 leading-snug">
            {language === "ko"
              ? "진단 결과를 바탕으로 맞춤 제품 루틴을 설계하세요."
              : language === "de"
              ? "Erstellen Sie Ihre persönliche Produktroutine basierend auf Ihren Ergebnissen."
              : "Build your personalised product routine from your results."}
          </p>
          <Link
            to="/lab"
            className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all
                       bg-[#C8A951] text-white border border-[#C8A951] shadow-md hover:shadow-lg hover:bg-[#b8973f]
                       dark:bg-transparent dark:text-[#C8A951] dark:border-[#C8A951]
                       dark:shadow-[0_0_10px_rgba(200,169,81,0.2)] dark:hover:shadow-[0_0_18px_rgba(200,169,81,0.45)]"
          >
            {language === "ko" ? "연구소 입장 →" : language === "de" ? "Labor →" : "Enter Lab →"}
          </Link>
        </motion.div>
      )}

      {/* Guest save banner — shown when user is not logged in */}
      {!isLoggedIn && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-5 py-3
                     bg-white/95 dark:bg-[#0D0D0D]/95 backdrop-blur-sm
                     border-t border-[#947E5C]/30 dark:border-[#D4AF37]/20"
        >
          <p className="text-xs font-medium text-[#947E5C] dark:text-white/70 leading-snug">
            {language === "de"
              ? "Analyse bewahren. Jetzt in Ihr Konto einloggen."
              : "Keep your analysis. Sign in to your account."}
          </p>
          <Link
            to="/login?redirect=/results"
            className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all
                       bg-white text-[#947E5C] border border-[#947E5C]/60 shadow-md hover:shadow-lg
                       dark:bg-transparent dark:text-[#D4AF37] dark:border-[#D4AF37]
                       dark:shadow-[0_0_10px_rgba(212,175,55,0.2)] dark:hover:shadow-[0_0_18px_rgba(212,175,55,0.45)]"
          >
            {language === "de" ? "Anmelden" : "Sign In"}
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default ResultsPage;
