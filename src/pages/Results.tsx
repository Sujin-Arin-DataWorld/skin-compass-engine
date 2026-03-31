import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useAnalysisStore } from "@/store/analysisStore";
import { useAuthStore } from "@/store/authStore";
import { useSkinProfileStore } from "@/store/useSkinProfileStore";
import { getPendingAnalysis } from "@/utils/analysisPersistence";
import { useI18nStore } from "@/store/i18nStore";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import SlideMacroDashboard from "@/components/results/SlideMacroDashboard";
import SlideFinalDashboard from "@/components/results/SlideFinalDashboard";
import SlideNav from "@/components/results/SlideNav";
import StickyCartBar from "@/components/results/StickyCartBar";
import { AGE_CYCLE_MAP } from "@/components/results/sharedResultsData";
import DebugPanel from "@/components/skin-assessment/DebugPanel";
import { useProductStore } from "@/store/productStore";
import { buildProductBundleV5 } from "@/engine/routineEngineV5";
import type {
  AnalysisResult, AxisScores, AxisSeverity, Product,
  SeverityGrade, ZoneId, ZoneHeatmapEntry, ScoreProvenance, ProjectedImprovement, AxisKey,
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
function makeMockResult(products: Product[]): AnalysisResult {
  const axis_scores: AxisScores = { seb: 62, hyd: 48, bar: 74, sen: 85, ox: 33, acne: 71, pigment: 45, texture: 56, aging: 38, makeup_stability: 22 };
  const axis_severity: AxisSeverity = { seb: 2, hyd: 1, bar: 2, sen: 3, ox: 1, acne: 2, pigment: 1, texture: 2, aging: 1, makeup_stability: 0 };

  const axis_severity_grade: Record<AxisKey, { grade: SeverityGrade; label: { en: string; de: string; ko: string } }> = {
    seb: { grade: "active", label: { en: "Active", de: "Aktiv", ko: "활성" } },
    hyd: { grade: "watch", label: { en: "Watch", de: "Beachten", ko: "주의" } },
    bar: { grade: "active", label: { en: "Active", de: "Aktiv", ko: "활성" } },
    sen: { grade: "critical", label: { en: "Critical", de: "Kritisch", ko: "위험" } },
    ox: { grade: "watch", label: { en: "Watch", de: "Beachten", ko: "주의" } },
    acne: { grade: "active", label: { en: "Active", de: "Aktiv", ko: "활성" } },
    pigment: { grade: "watch", label: { en: "Watch", de: "Beachten", ko: "주의" } },
    texture: { grade: "active", label: { en: "Active", de: "Aktiv", ko: "활성" } },
    aging: { grade: "watch", label: { en: "Watch", de: "Beachten", ko: "주의" } },
    makeup_stability: { grade: "stable", label: { en: "Stable", de: "Stabil", ko: "안정" } },
  };

  const zone_heatmap: Partial<Record<ZoneId, ZoneHeatmapEntry>> = {
    forehead: {
      intensity: 0.55, dominantAxis: "seb", concernCount: 3,
      summary: { en: "Oily T-zone with intermittent congestion", de: "Ölige T-Zone mit gelegentlicher Verstopfung", ko: "간헐적 모공 막힘이 있는 T존 유분" }
    },
    cheeks: {
      intensity: 0.72, dominantAxis: "sen", concernCount: 4,
      summary: { en: "Reactive skin with redness and heat sensitivity", de: "Reaktive Haut mit Rötungen und Wärmeempfindlichkeit", ko: "홍조 및 열 민감성이 있는 반응성 피부" }
    },
    nose: {
      intensity: 0.48, dominantAxis: "acne", concernCount: 2,
      summary: { en: "Enlarged pores with blackhead tendency", de: "Vergrößerte Poren mit Mitesser-Neigung", ko: "블랙헤드 경향이 있는 확장된 모공" }
    },
  };

  const score_provenance: ScoreProvenance[] = [
    {
      axis: "sen", totalScore: 85,
      breakdown: {
        zoneConcerns: [{ zone: "cheeks", concernId: "redness_c", contribution: 18 }, { zone: "cheeks", concernId: "stinging_c", contribution: 12 }],
        deepDiveQuestions: [{ questionId: "SEN_01", contribution: 20 }],
        foundationModifiers: [{ factor: "high_stress", multiplier: 1.15 }],
        crossAxisBonuses: [],
      },
    },
    {
      axis: "bar", totalScore: 74,
      breakdown: {
        zoneConcerns: [{ zone: "cheeks", concernId: "dryness_c", contribution: 15 }],
        deepDiveQuestions: [{ questionId: "BAR_01", contribution: 18 }],
        foundationModifiers: [{ factor: "low_sleep", multiplier: 1.10 }],
        crossAxisBonuses: [{ pattern: "barrier_stress", bonusPercent: 8 }],
      },
    },
  ];

  const projected_improvement: ProjectedImprovement = {
    seb: { currentScore: 62, targetScore4w: 51, targetScore12w: 43 },
    hyd: { currentScore: 48, targetScore4w: 37, targetScore12w: 30 },
    bar: { currentScore: 74, targetScore4w: 56, targetScore12w: 46 },
    sen: { currentScore: 85, targetScore4w: 68, targetScore12w: 58 },
    ox: { currentScore: 33, targetScore4w: 28, targetScore12w: 25 },
    acne: { currentScore: 71, targetScore4w: 60, targetScore12w: 53 },
    pigment: { currentScore: 45, targetScore4w: 41, targetScore12w: 38 },
    texture: { currentScore: 56, targetScore4w: 49, targetScore12w: 44 },
    aging: { currentScore: 38, targetScore4w: 34, targetScore12w: 31 },
    makeup_stability: { currentScore: 22, targetScore4w: 19, targetScore12w: 16 },
  };

  return {
    engineVersion: "v5-mock",
    axis_scores,
    axis_severity,
    axis_scores_normalized: axis_scores,
    detected_patterns: [{ pattern: { id: "barrier_stress", name_en: "Barrier Stress Pattern", required: [], optional: [], min_optional: 0, axis_gates: {}, guidance_en: "Barrier compromise with sensitivity overlay", flag: "BARRIER_EMERGENCY", urgency: "HIGH", threshold: 0.6 }, score: 0.82, severity: 2 }],
    urgency_level: "HIGH",
    active_flags: ["BARRIER_EMERGENCY"],
    radar_chart_data: [
      { axis: "Sebum", score: 62, label: "Sebum" },
      { axis: "Hydration", score: 48, label: "Hydration" },
      { axis: "Barrier", score: 74, label: "Barrier" },
      { axis: "Sensitivity", score: 85, label: "Sensitivity" },
      { axis: "Acne", score: 71, label: "Acne" },
      { axis: "Aging", score: 38, label: "Aging" },
    ],
    primary_concerns: ["sen", "bar", "acne"],
    secondary_concerns: ["seb", "hyd", "texture"],
    product_bundle: {
      Phase1: products[0] ? [products[0]] : [],
      Phase2: products[1] ? [products[1]] : [],
      Phase3: products[2] ? [products[2]] : [],
      Phase4: products[3] ? [products[3]] : [],
      Phase5: products[4] ? [products[4]] : [],
    },
    axis_severity_grade,
    zone_heatmap,
    score_provenance,
    projected_improvement,
  };
}

// ── Unified Funnel Page ─────────────────────────────────────────────────────

const ResultsPage = () => {
  const { result: storeResult, implicitFlags, setResult } = useAnalysisStore();
  const { products } = useProductStore();
  const activeProfile = useSkinProfileStore((s) => s.activeProfile);
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
    const pending = getPendingAnalysis();
    if (pending?.fullResult) return pending.fullResult;

    // ── P0 Fix: Reconstruct result from persisted skin profile ──────────
    // When navigating from Profile → /results, the ephemeral Zustand store
    // is empty but useSkinProfileStore has the database-backed scores.
    if (activeProfile?.scores) {
      const s = activeProfile.scores;
      const axis_scores: AxisScores = {
        seb: s.seb, hyd: s.hyd, bar: s.bar, sen: s.sen, ox: s.ox,
        acne: s.acne, pigment: s.pigment, texture: s.texture,
        aging: s.aging, makeup_stability: s.makeup_stability,
      };
      const axis_severity = {} as AxisSeverity;
      const primaryConcerns: AxisKey[] = [];
      for (const key of Object.keys(axis_scores) as AxisKey[]) {
        const score = axis_scores[key];
        axis_severity[key] = score > 60 ? 2 : score < 40 ? 1 : 0;
        if (score > 60) primaryConcerns.push(key);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reconstructed: any = {
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
      reconstructed.product_bundle = buildProductBundleV5(reconstructed, flags, 'Full');
      return reconstructed as AnalysisResult;
    }

    if (import.meta.env.DEV) return makeMockResult(products);
    return null;
  }, [storeResult, products, activeProfile]);

  // Restore pending analysis into Zustand store
  useEffect(() => {
    if (storeResult) return;
    const pending = getPendingAnalysis();
    if (pending?.fullResult) setResult(pending.fullResult);
  }, [storeResult, setResult]);


  // ── Cart state — starts empty; populated only by explicit "추가" clicks ────
  const [cartItems, setCartItems] = useState<
    Array<{ id: string; price: number; role: string; emoji: string }>
  >([]);

  const addToCart = useCallback(
    (item: { id: string; price: number; role: string; emoji: string }) => {
      setCartItems((prev) =>
        prev.some((c) => c.id === item.id) ? prev : [...prev, item]
      );
    },
    []
  );

  const removeFromCart = useCallback(
    (id: string) => {
      setCartItems((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  // Cycle days from EXP_AGE
  const axisAnswers = useAnalysisStore((s) => s.axisAnswers);
  const expAge = axisAnswers?.EXP_AGE as number | undefined;
  const cycleDays = AGE_CYCLE_MAP[expAge !== undefined && expAge in AGE_CYCLE_MAP ? expAge : 2].cycleDays;

  const [current, setCurrent] = useState(initialSlide);
  const [direction, setDirection] = useState(1);

  // Read special care picks from Zustand store (persisted)
  const specialCarePicks = useAnalysisStore((s) => s.specialCarePicks);

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

  // Analysis result is already persisted to Supabase by Analysis.tsx via useAnalysis().saveAnalysis().
  // No additional local save needed here.
  const { isLoggedIn } = useAuthStore();

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

  if (!result) return <Navigate to="/skin-assessment" replace />;

  // ── Unified 3-slide sequence ─────────────────────────────────────────────
  //
  // Slide 0: Macro Dashboard (Circular Axis Charts + 2-col Products + AIX Insight)
  // Slide 1: Lab & Special Care (SlideLabSpecialCare — lazy loaded)
  // Slide 2: Final Selection (Glassmorphism Master Plan)
  //
  const slides = [
    // Slide 0: Macro Dashboard
    <SlideMacroDashboard key="slide-macro" result={result} onGoToLab={() => goTo(1)} onAddToCart={addToCart} onRemoveFromCart={removeFromCart} cartItemIds={cartItems.map(c => c.id)} />,

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
    <SlideFinalDashboard key="slide-final" result={result} cartItemIds={cartItems.map(c => c.id)} />,
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
          className="absolute inset-0 flex flex-col pt-[82px] pb-[90px]"
          style={{ willChange: "transform" }}
        >
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* Legal disclaimer — AI transparency */}
      <div style={{
        position: 'fixed',
        bottom: cartItems.length > 0 ? 80 : 40,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        padding: '6px 16px',
        fontSize: '0.6875rem',
        fontWeight: 500,
        color: 'rgba(128,128,128,0.85)',
        zIndex: 49,
        transition: 'bottom 0.3s ease',
        pointerEvents: 'none',
        borderRadius: 99,
        background: 'rgba(128,128,128,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
      }}>
        {language === 'ko' ? 'ⓘ AI 기반 피부 분석 · 의료 행위가 아닙니다'
          : language === 'de' ? 'ⓘ KI-basierte Hautanalyse · Keine medizinische Beratung'
            : 'ⓘ AI-powered skin analysis · Not medical advice'}
      </div>

      {/* Sticky cart bar — shown only after user adds at least one product */}
      {cartItems.length > 0 && (
        <StickyCartBar
          steps={[]}
          cycleDays={cycleDays}
          barrierProducts={cartItems}
          onCta={() => current < TOTAL_SLIDES - 1 ? goTo(TOTAL_SLIDES - 1) : navigate('/checkout')}
        />
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
