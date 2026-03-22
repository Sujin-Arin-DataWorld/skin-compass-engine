import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useAuthStore } from "@/store/authStore";
import { getPendingDiagnosis } from "@/utils/diagnosisPersistence";
import { useI18nStore } from "@/store/i18nStore";
import { buildRoutineV5 } from "@/engine/routineEngineV5";
import type { RoutineOutputV5 } from "@/engine/routineEngineV5";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import SlideMacroDashboard from "@/components/results/SlideMacroDashboard";
import SlideFinalDashboard from "@/components/results/SlideFinalDashboard";
import SlideNav from "@/components/results/SlideNav";
import StickyCartBar from "@/components/results/StickyCartBar";
import { AGE_CYCLE_MAP } from "@/components/results/sharedResultsData";
import DebugPanel from "@/components/diagnosis/DebugPanel";
import { useProductStore } from "@/store/productStore";
import type {
  DiagnosisResult, AxisScores, AxisSeverity, Product,
  ClinicalGrade, ZoneId, ZoneHeatmapEntry, ScoreProvenance, ProjectedImprovement, AxisKey,
} from "@/engine/types";


// Lazy-load Slide 1 (Lab) for performance — keeps Slide 0 fast
const SlideLabSpecialCare = lazy(() => import("@/components/results/SlideLabSpecialCare"));

// ── Slide count ─────────────────────────────────────────────────────────────
const TOTAL_SLIDES = 3;

// ── Slide labels (trilingual — 3-slide funnel) ─────────────────────────────
const SLIDE_LABELS = {
  en: [
    { key: "macro", short: "Analysis", full: "Macro Dashboard" },
    { key: "lab", short: "Focus Care", full: "Focus Care" },
    { key: "plan", short: "Plan", full: "Master Plan" },
  ],
  de: [
    { key: "macro", short: "Analyse", full: "Makro-Dashboard" },
    { key: "lab", short: "Intensivpflege", full: "Intensivpflege" },
    { key: "plan", short: "Plan", full: "Masterplan" },
  ],
  ko: [
    { key: "macro", short: "분석", full: "매크로 대시보드" },
    { key: "lab", short: "집중 케어", full: "집중 케어" },
    { key: "plan", short: "플랜", full: "마스터 플랜" },
  ],
};

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "80%" : "-80%", opacity: 0.3 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-80%" : "80%", opacity: 0.3 }),
};

// ── Dev-only mock result ────────────────────────────────────────────────────
function makeMockResult(products: Product[]): DiagnosisResult {
  const axis_scores: AxisScores    = { seb: 62, hyd: 48, bar: 74, sen: 85, ox: 33, acne: 71, pigment: 45, texture: 56, aging: 38, makeup_stability: 22 };
  const axis_severity: AxisSeverity = { seb: 2,  hyd: 1,  bar: 2,  sen: 3,  ox: 1,  acne: 2,  pigment: 1,  texture: 2,  aging: 1,  makeup_stability: 0 };

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
    axis_clinical_grade,
    zone_heatmap,
    score_provenance,
    projected_improvement,
  };
}

// ── Unified Funnel Page ─────────────────────────────────────────────────────

const ResultsPage = () => {
  const { result: storeResult, implicitFlags, setResult } = useDiagnosisStore();
  const { products } = useProductStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDebug = searchParams.get("debug") === "true";
  const { language } = useI18nStore();

  // Resolve the active slide from ?slide= query param
  const slideFromUrl = parseInt(searchParams.get("slide") ?? "0", 10);
  const initialSlide = (slideFromUrl >= 0 && slideFromUrl < TOTAL_SLIDES) ? slideFromUrl : 0;

  // Use mock data in dev when no real result exists.
  const result = useMemo(() => {
    if (storeResult) return storeResult;
    const pending = getPendingDiagnosis();
    if (pending?.fullResult) return pending.fullResult;
    if (import.meta.env.DEV) return makeMockResult(products);
    return null;
  }, [storeResult, products]);

  // Restore pending diagnosis into Zustand store
  useEffect(() => {
    if (storeResult) return;
    const pending = getPendingDiagnosis();
    if (pending?.fullResult) setResult(pending.fullResult);
  }, [storeResult, setResult]);

  // Build personalised routine
  const routineOutput = useMemo<RoutineOutputV5 | null>(() => {
    if (!result) return null;
    return buildRoutineV5(result, implicitFlags, "Full");
  }, [result, implicitFlags]);

  // Cart bar data: default to full routine, gets overridden by tier changes from SlideMacroDashboard
  const [tierCartSteps, setTierCartSteps] = useState<any[] | null>(null);

  const defaultCartSteps = useMemo(() => {
    if (!routineOutput) return [];
    const level = routineOutput.routines.committed;
    const allSteps = [...level.am, ...level.pm];
    const filtered = allSteps.filter((s): s is typeof s & { product: NonNullable<typeof s.product> } => s.product !== null);
    const seen = new Set<string>();
    return filtered.filter((s) => { if (seen.has(s.product.id)) return false; seen.add(s.product.id); return true; });
  }, [routineOutput]);

  // Use tier-specific steps when available, otherwise default
  const cartSteps = tierCartSteps ?? defaultCartSteps;

  const handleTierChange = useCallback((steps: any[]) => {
    setTierCartSteps(steps);
  }, []);

  // Cycle days from EXP_AGE
  const axisAnswers = useDiagnosisStore((s) => s.axisAnswers);
  const expAge = axisAnswers?.EXP_AGE as number | undefined;
  const cycleDays = AGE_CYCLE_MAP[expAge !== undefined && expAge in AGE_CYCLE_MAP ? expAge : 2].cycleDays;

  const [current, setCurrent] = useState(initialSlide);
  const [direction, setDirection] = useState(1);

  // Read special care picks from Zustand store (persisted)
  const specialCarePicks = useDiagnosisStore((s) => s.specialCarePicks);

  // ── URL query param sync ─────────────────────────────────────────────────
  // Sync ?slide= param whenever current slide changes
  useEffect(() => {
    const currentSlideParam = searchParams.get("slide");
    const target = current.toString();
    if (currentSlideParam !== target) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("slide", target);
      // Use replaceState for forward navigation, pushState for enabling Back
      setSearchParams(newParams, { replace: false });
    }
  }, [current, searchParams, setSearchParams]);

  // Intercept browser Back button — navigate between slides instead of exiting
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      // Read current slide from URL after popstate
      const params = new URLSearchParams(window.location.search);
      const urlSlide = parseInt(params.get("slide") ?? "0", 10);
      if (urlSlide >= 0 && urlSlide < TOTAL_SLIDES) {
        setDirection(urlSlide < current ? -1 : 1);
        setCurrent(urlSlide);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [current]);

  // Auto-save diagnosis result
  const { isLoggedIn, saveDiagnosisResult } = useAuthStore();
  useEffect(() => {
    if (isLoggedIn && result) {
      // Attach special care picks before saving
      const resultWithPicks = {
        ...result,
        special_care_picks: Object.values(specialCarePicks),
      };
      saveDiagnosisResult(resultWithPicks);
    }
  }, [isLoggedIn, result, saveDiagnosisResult, specialCarePicks]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= TOTAL_SLIDES) return;
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

  // ── Unified 3-slide sequence ─────────────────────────────────────────────
  //
  // Slide 0: Macro Dashboard (Circular Axis Charts + 2-col Products + AIX Insight)
  // Slide 1: Lab & Special Care (SlideLabSpecialCare — lazy loaded)
  // Slide 2: Final Selection (Glassmorphism Master Plan)
  //
  const slides = [
    // Slide 0: Macro Dashboard
    <SlideMacroDashboard key="slide-macro" result={result} onGoToLab={() => goTo(1)} onTierChange={handleTierChange} />,

    // Slide 1: Lab & Special Care (lazy)
    <Suspense
      key="slide-lab"
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: 'hsl(var(--border))',
              borderTopColor: 'hsl(var(--primary))',
            }}
          />
        </div>
      }
    >
      <SlideLabSpecialCare result={result} onGoToMacro={() => goTo(0)} />
    </Suspense>,

    // Slide 2: Final Selection (Glassmorphism)
    <SlideFinalDashboard key="slide-final" result={result} />,
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <SilkBackground />
      <Navbar />

      {/* Narrative progress bar */}
      <div className="absolute top-[57px] left-0 right-0 z-50 h-0.5 bg-border/40">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Slide content — hardware-accelerated container */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goTo(current + 1);
            if (info.offset.x > 60) goTo(current - 1);
          }}
          className="absolute inset-0 flex flex-col pt-[96px] pb-[220px]"
          style={{ willChange: "transform" }}
        >
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* Sticky cart bar — above SlideNav */}
      {cartSteps.length > 0 && (
        <StickyCartBar steps={cartSteps} cycleDays={cycleDays} slideNavHeight={0} />
      )}

      {/* Navigation overlay */}
      <SlideNav
        current={current}
        total={TOTAL_SLIDES}
        labels={SLIDE_LABELS[language].map((l) => l.short)}
        fullLabels={SLIDE_LABELS[language].map((l) => l.full)}
        onPrev={() => goTo(current - 1)}
        onNext={() => goTo(current + 1)}
        onGoTo={goTo}
      />

      {/* Debug panel */}
      {isDebug && result?._debug && <DebugPanel debugData={result._debug} />}
    </div>
  );
};

export default ResultsPage;
