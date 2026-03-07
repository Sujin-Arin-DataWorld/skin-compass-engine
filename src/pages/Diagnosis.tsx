import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useAuthStore } from "@/store/authStore";
import { CATEGORY_INFO, META_QUESTIONS } from "@/engine/weights";
import { runDiagnosis } from "@/engine/runDiagnosisV4";
import type { SkinType, ContextKey } from "@/engine/types";
import { useI18nStore, translations } from "@/store/i18nStore";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import CategoryInteractive from "@/components/diagnosis/CategoryInteractive";
import SeveritySelector from "@/components/diagnosis/SeveritySelector";
import LabCard from "@/components/diagnosis/LabCard";
import DebugPanel from "@/components/diagnosis/DebugPanel";
import GlobalProgressLine from "@/components/GlobalProgressLine";
import { useProgressPersistence, getSavedProgress, clearSavedProgress, estimateTimeRemaining } from "@/hooks/useProgressPersistence";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import React from "react";

const CONTEXT_OPTIONS: { key: ContextKey; label: string }[] = [
  { key: "shaving", label: "I shave regularly" },
  { key: "makeup", label: "I wear makeup daily" },
  { key: "hormonal", label: "I experience hormonal fluctuations" },
  { key: "outdoor_work", label: "I work outdoors frequently" },
  { key: "skincare_beginner", label: "I'm new to skincare" },
  { key: "recent_procedure", label: "I've recently had a cosmetic procedure" },
  { key: "low_water_intake", label: "I don't drink much water" },
  { key: "reactive_skin", label: "My skin is easily irritated/reactive (Sensitive)" },
  { key: "high_stress", label: "I experience high stress or lack of sleep" },
];

const SKIN_TYPES: { key: SkinType; label: string; desc: string }[] = [
  { key: "dry", label: "Dry", desc: "Tight, flaky, craves moisture" },
  { key: "oily", label: "Oily", desc: "Shiny, enlarged pores, breakout-prone" },
  { key: "combination", label: "Combination", desc: "Oily T-zone, drier cheeks" },
  { key: "normal", label: "Normal", desc: "Generally balanced" },
];

const LOADING_MESSAGES = [
  "Mapping your symptom profile...",
  "Scoring 10 clinical axes...",
  "Detecting high-risk patterns...",
  "Building your protocol...",
];

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

type StepWrapperProps = {
  children: React.ReactNode;
  reducedMotion?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
} & import("framer-motion").HTMLMotionProps<"div">;

const StepWrapper = React.forwardRef<HTMLDivElement, StepWrapperProps>(
  ({ children, reducedMotion, onSwipeLeft, onSwipeRight, ...props }, ref) => (
    <motion.div
      ref={ref}
      drag={onSwipeLeft || onSwipeRight ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = swipePower(offset.x, velocity.x);
        if (swipe < -swipeConfidenceThreshold && onSwipeLeft) {
          onSwipeLeft();
        } else if (swipe > swipeConfidenceThreshold && onSwipeRight) {
          onSwipeRight();
        }
      }}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: reducedMotion ? 0.15 : 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={onSwipeLeft || onSwipeRight ? "cursor-grab active:cursor-grabbing w-full" : "w-full"}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StepWrapper.displayName = "StepWrapper";

const DiagnosisPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useDiagnosisStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { language } = useI18nStore();
  const t = translations[language];

  const [loadingMsg, setLoadingMsg] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const [metaCategoryJustCompleted, setMetaCategoryJustCompleted] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const isDebug = searchParams.get("debug") === "true" && import.meta.env.DEV;
  const { reducedMotion } = usePerformanceMode();
  const { saveDiagnosis } = useDiagnosis();

  // Auth Guard: Redirect anonymous users to login before capturing data
  if (!isLoggedIn) {
    return <Navigate to={`/login?redirect=/diagnosis`} replace />;
  }

  // Progress persistence
  useProgressPersistence();

  // Check for saved progress on mount
  useEffect(() => {
    const saved = getSavedProgress();
    if (saved && store.currentStep === 0 && !store.result) {
      setShowResumePrompt(true);
    }
  }, []);

  const handleResume = () => {
    const saved = getSavedProgress();
    if (saved) {
      store.setStep(saved.currentStep);
      if (saved.skinType) store.setSkinType(saved.skinType as SkinType);
      for (const ctx of saved.contexts) store.addContext(ctx);
      for (const [id, val] of Object.entries(saved.severities)) store.setSeverity(id, val);
      for (const [id, val] of Object.entries(saved.metaAnswers)) store.setMetaAnswer(id, val);
    }
    setShowResumePrompt(false);
  };

  const handleStartFresh = () => {
    clearSavedProgress();
    store.reset();
    setShowResumePrompt(false);
  };

  const totalSteps = 10;
  const progress = ((store.currentStep + 1) / (totalSteps + 1)) * 100;
  const timeEstimate = estimateTimeRemaining(store.currentStep);

  const currentCategoryNum = store.currentStep >= 2 && store.currentStep <= 9 ? store.currentStep - 1 : 0;

  const metaQuestionsForCategory = useMemo(() => {
    if (metaCategoryJustCompleted === null) return [];
    return META_QUESTIONS.filter((q) => {
      if (q.trigger_after_category !== metaCategoryJustCompleted) return false;
      if (q.id === "premenstrual_7_10d" || q.id === "jaw_focus") {
        // only ask hormonal precision questions when context flag is set
        if (!store.contexts.includes("hormonal")) return false;
      }
      return q.trigger_condition(store.severities);
    });
  }, [metaCategoryJustCompleted, store.severities, store.contexts]);

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (store.currentStep >= 2 && store.currentStep <= 9) {
      const completedCat = store.currentStep - 1;
      const metaQs = META_QUESTIONS.filter((q) => {
        if (q.trigger_after_category !== completedCat) return false;
        if ((q.id === "premenstrual_7_10d" || q.id === "jaw_focus") && !store.contexts.includes("hormonal")) {
          return false;
        }
        return q.trigger_condition(store.severities);
      });
      if (metaQs.length > 0 && !showMeta) {
        setMetaCategoryJustCompleted(completedCat);
        setShowMeta(true);
        return;
      }
    }

    setShowMeta(false);
    setMetaCategoryJustCompleted(null);

    if (store.currentStep < 9) {
      store.setStep(store.currentStep + 1);
    } else {
      store.setStep(10);
    }
  }, [store, showMeta]);

  const goBack = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (showMeta) {
      setShowMeta(false);
      setMetaCategoryJustCompleted(null);
      return;
    }
    if (store.currentStep > 0) store.setStep(store.currentStep - 1);
  };

  // Loading animation
  useEffect(() => {
    if (store.currentStep !== 10) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          clearInterval(interval);
          const result = runDiagnosis({
            severities: store.severities,
            contexts: store.contexts,
            skinType: store.skinType || "normal",
            tier: store.selectedTier,
            metaAnswers: store.metaAnswers,
            uiSignals: store.uiSignals,
          });
          store.setResult(result);
          clearSavedProgress();

          // Persist to Supabase asynchronously (fire-and-forget)
          const TIER_MAP: Record<string, string> = { Entry: "Entry", Full: "Advanced", Premium: "Clinical" };
          const flatProducts = Object.entries(result.product_bundle).flatMap(([phase, prods]) =>
            prods.map((p) => ({ id: p.id, name: p.name.en, phase }))
          );
          saveDiagnosis(result.axis_scores, TIER_MAP[store.selectedTier] ?? "Entry", flatProducts);

          setTimeout(() => navigate("/results"), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [store.currentStep]);

  return (
    <div className="relative min-h-screen bg-background">
      <SilkBackground />
      <Navbar />

      {/* Removed old fixed top progress bar and time estimate */}

      {/* Resume prompt */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-lg border border-border bg-background p-6 max-w-sm w-full shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="font-display text-lg text-foreground">{t.diagnosis.resumeTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.diagnosis.resumeSub}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleResume}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground min-h-[44px] touch-manipulation"
                >
                  {t.diagnosis.resumeBtn}
                </button>
                <button
                  onClick={handleStartFresh}
                  className="flex-1 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground min-h-[44px] touch-manipulation hover:text-foreground"
                >
                  {t.diagnosis.startFreshBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-col items-center justify-start px-4 sm:px-6 pt-24 pb-12">
        <div className="mx-auto w-full max-w-[640px]">
          {/* Global persistent line sitting above all changing step content */}
          {store.currentStep < 10 && <GlobalProgressLine />}

          <AnimatePresence mode="wait">
            {/* Step 0: Context */}
            {store.currentStep === 0 && (
              <StepWrapper key="context" reducedMotion={reducedMotion} onSwipeLeft={goNext} onSwipeRight={store.currentStep > 0 ? goBack : undefined}>
                <h2 className="font-display text-3xl text-foreground">
                  {t.diagnosis.contextTitle}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t.diagnosis.contextSub}
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {CONTEXT_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.key}
                      onClick={() => store.toggleContext(opt.key)}
                      className={`rounded-lg border px-5 py-4 text-left text-sm transition-all min-h-[44px] touch-manipulation ${store.contexts.includes(opt.key)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    >
                      {t.diagnosis.contexts[opt.key as keyof typeof t.diagnosis.contexts]}
                    </motion.button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Step 1: Skin Type */}
            {store.currentStep === 1 && (
              <StepWrapper key="skintype" reducedMotion={reducedMotion}>
                <h2 className="font-display text-3xl text-foreground">
                  {t.diagnosis.skinTypeTitle}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t.diagnosis.skinTypeSub}
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {SKIN_TYPES.map((st) => (
                    <motion.button
                      key={st.key}
                      onClick={() => store.setSkinType(st.key)}
                      className={`rounded-lg border px-5 py-4 text-left transition-all min-h-[44px] touch-manipulation ${store.skinType === st.key
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    >
                      <span className="font-medium text-foreground">{t.diagnosis.skinTypes[st.key as keyof typeof t.diagnosis.skinTypes].label}</span>
                      <span className="ml-3 text-sm text-muted-foreground">— {t.diagnosis.skinTypes[st.key as keyof typeof t.diagnosis.skinTypes].desc}</span>
                    </motion.button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Steps 2-9: Interactive Categories */}
            {store.currentStep >= 2 && store.currentStep <= 9 && !showMeta && (
              <StepWrapper key={`cat-${currentCategoryNum}`} reducedMotion={reducedMotion}>
                <CategoryInteractive
                  category={currentCategoryNum}
                  severities={store.severities}
                  onSeverityChange={(id, v) => store.setSeverity(id, v)}
                />
              </StepWrapper>
            )}

            {/* Meta Questions */}
            {showMeta && metaQuestionsForCategory.length > 0 && (
              <StepWrapper key="meta" reducedMotion={reducedMotion} onSwipeLeft={goNext} onSwipeRight={store.currentStep > 0 ? goBack : undefined}>
                <h2 className="font-display text-2xl text-foreground">
                  {t.diagnosis.metaTitle}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.diagnosis.metaSub}
                </p>
                <div className="mt-8 flex flex-col gap-6">
                  {metaQuestionsForCategory.map((q) => (
                    <LabCard key={q.id}>
                      <p className="question-label mb-3">{language === "de" ? q.text_de : q.text_en}</p>
                      {q.type === "boolean" ? (
                        <div className="flex gap-2">
                          {[true, false].map((v) => (
                            <motion.button
                              key={String(v)}
                              onClick={() => store.setMetaAnswer(q.id, v)}
                              className={`flex-1 rounded-md px-4 py-2 text-sm transition-all min-h-[44px] touch-manipulation border ${store.metaAnswers[q.id] === v
                                ? "bg-primary/20 text-primary border-primary"
                                : "bg-secondary/50 text-foreground/70 border-transparent hover:bg-secondary"
                                }`}
                              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                            >
                              {v ? t.diagnosis.btnYes : t.diagnosis.btnNo}
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <SeveritySelector
                            value={(store.metaAnswers[q.id] as number) ?? 0}
                            onChange={(v) => store.setMetaAnswer(q.id, v)}
                          />
                          {/* "Not applicable" option for hormonal questions */}
                          {(q.id === "premenstrual_7_10d") && (
                            <motion.button
                              onClick={() => store.setMetaAnswer(q.id, -1)}
                              className={`w-full rounded-md px-4 py-2.5 text-sm transition-all min-h-[44px] touch-manipulation border ${store.metaAnswers[q.id] === -1
                                ? "bg-muted text-foreground border-border"
                                : "bg-secondary/30 text-foreground/60 border-transparent hover:bg-secondary/60"
                                }`}
                              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                            >
                              {t.diagnosis.btnNotApplicable}
                            </motion.button>
                          )}
                        </div>
                      )}
                    </LabCard>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Loading */}
            {store.currentStep === 10 && (
              <StepWrapper key="loading" reducedMotion={reducedMotion}>
                <div className="flex flex-col items-center justify-center py-20">
                  {!reducedMotion ? (
                    <motion.div
                      className="h-20 w-20 rounded-full border-2 border-primary"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full border-2 border-primary opacity-60" />
                  )}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMsg}
                      className="mt-8 text-lg text-muted-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {t.diagnosis.loading[loadingMsg]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {store.currentStep < 10 && (
            <motion.div
              className="mt-8 flex items-center justify-between pb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={goBack}
                disabled={store.currentStep === 0 && !showMeta}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 min-h-[44px] touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" /> {t.diagnosis.btnBack}
              </button>
              <motion.button
                onClick={goNext}
                disabled={store.currentStep === 1 && !store.skinType}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 min-h-[44px] touch-manipulation"
                whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              >
                {store.currentStep === 9 && !showMeta ? t.diagnosis.btnAnalyze : t.diagnosis.btnContinue}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Debug panel (dev only, ?debug=true) */}
      {isDebug && store.result?._debug && (
        <DebugPanel debugData={store.result._debug} />
      )}
    </div>
  );
};

export default DiagnosisPage;
