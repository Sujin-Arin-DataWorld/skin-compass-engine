import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useSearchParams } from "react-router-dom";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useAuthStore } from "@/store/authStore";
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
import type { DiagnosisResult, AxisScores, AxisSeverity } from "@/engine/types";

const SLIDE_LABELS = [
  { key: "diagnosis", short: "Pattern", full: "Your Skin Pattern" },
  { key: "axes", short: "Analysis", full: "Clinical Analysis" },
  { key: "protocol", short: "Protocol", full: "Your Routine" },
  { key: "plans", short: "Plans", full: "Choose Your Plan" },
  { key: "products", short: "Products", full: "Matched Products" },
  { key: "subscribe", short: "Strategy", full: "Adaptive Strategy" },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

// Dev-only mock result for testing Results UI without running full diagnosis
function makeMockResult(): DiagnosisResult {
  const axis_scores: AxisScores = { seb: 62, hyd: 48, bar: 74, sen: 85, ox: 33, acne: 71, pigment: 45, texture: 56, aging: 38, makeup_stability: 22 };
  const axis_severity: AxisSeverity = { seb: 2, hyd: 1, bar: 2, sen: 3, ox: 1, acne: 2, pigment: 1, texture: 2, aging: 1, makeup_stability: 0 };
  return {
    engineVersion: "v4-mock",
    axis_scores,
    axis_severity,
    axis_scores_normalized: axis_scores,
    detected_patterns: [{ pattern: { id: "barrier_stress", name_en: "Barrier Stress Pattern", required: [], optional: [], min_optional: 0, axis_gates: {}, clinical_en: "Barrier compromise with sensitivity overlay", flag: "BARRIER_EMERGENCY", urgency: "HIGH", threshold: 0.6 }, score: 0.82, severity: 2 }],
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
      Phase1: [{ id: "p1", name: "Gentle Barrier Cleanser", brand: "DERMATICA", phase: "Phase 1", type: "Cleanser", price_eur: 24, tier: ["Entry", "Full", "Premium"], shopify_handle: "gentle-cleanser", key_ingredients: ["Ceramide NP", "Glycerin", "Panthenol"], target_axes: ["bar", "sen"], for_skin: ["sensitive", "combination"] }],
      Phase2: [{ id: "p2", name: "Barrier Repair Serum", brand: "SKINCEUTICALS", phase: "Phase 2", type: "Serum", price_eur: 42, tier: ["Full", "Premium"], shopify_handle: "barrier-serum", key_ingredients: ["Niacinamide 10%", "Madecassoside", "Hyaluronic Acid"], target_axes: ["bar", "hyd", "sen"], for_skin: ["sensitive", "dry"] }],
      Phase3: [{ id: "p3", name: "Anti-Blemish Treatment", brand: "PAULA'S CHOICE", phase: "Phase 3", type: "Treatment", price_eur: 36, tier: ["Full", "Premium"], shopify_handle: "blemish-treatment", key_ingredients: ["Salicylic Acid 2%", "Green Tea Extract"], target_axes: ["acne", "seb", "texture"], for_skin: ["oily", "combination"] }],
      Phase4: [{ id: "p4", name: "Recovery Moisturiser", brand: "LA ROCHE-POSAY", phase: "Phase 4", type: "Moisturiser", price_eur: 28, tier: ["Entry", "Full", "Premium"], shopify_handle: "recovery-moisturiser", key_ingredients: ["Shea Butter", "Thermal Water", "Ceramide AP"], target_axes: ["bar", "hyd"], for_skin: ["all"] }],
      Phase5: [{ id: "p5", name: "UV Shield SPF50+", brand: "HELIOCARE", phase: "Phase 5", type: "Sunscreen", price_eur: 32, tier: ["Entry", "Full", "Premium"], shopify_handle: "uv-shield", key_ingredients: ["Fernblock", "Zinc Oxide", "Vitamin E"], target_axes: ["pigment", "ox", "aging"], for_skin: ["all"] }],
    },
  };
}

const ResultsPage = () => {
  const { result: storeResult } = useDiagnosisStore();
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get("debug") === "true";

  // Use mock data in dev when no real result exists
  const result = useMemo(() => {
    if (storeResult) return storeResult;
    if (import.meta.env.DEV) return makeMockResult();
    return null;
  }, [storeResult]);

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

  const slides = [
    <SlideDiagnosisSummary result={result} />,
    <SlideAxisBreakdown result={result} />,
    <SlideProtocol result={result} />,
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
        labels={SLIDE_LABELS.map((l) => l.short)}
        fullLabels={SLIDE_LABELS.map((l) => l.full)}
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
