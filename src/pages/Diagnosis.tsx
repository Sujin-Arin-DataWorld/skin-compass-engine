import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { SYMPTOMS, CATEGORY_INFO, META_QUESTIONS } from "@/engine/weights";
import { runDiagnosis } from "@/engine/runDiagnosisV4";
import type { SkinType, ContextKey } from "@/engine/types";
import Navbar from "@/components/Navbar";

const CONTEXT_OPTIONS: { key: ContextKey; label: string }[] = [
  { key: "shaving", label: "I shave regularly" },
  { key: "makeup", label: "I wear makeup daily" },
  { key: "hormonal", label: "I experience hormonal fluctuations" },
  { key: "outdoor_work", label: "I work outdoors frequently" },
  { key: "skincare_beginner", label: "I'm new to skincare" },
  { key: "recent_procedure", label: "I've recently had a cosmetic procedure" },
  { key: "low_water_intake", label: "I don't drink much water" },
];

const SKIN_TYPES: { key: SkinType; label: string; desc: string }[] = [
  { key: "dry", label: "Dry", desc: "Tight, flaky, craves moisture" },
  { key: "oily", label: "Oily", desc: "Shiny, enlarged pores, breakout-prone" },
  { key: "combination", label: "Combination", desc: "Oily T-zone, drier cheeks" },
  { key: "sensitive", label: "Sensitive", desc: "Easily irritated, reactive" },
  { key: "normal", label: "Normal", desc: "Generally balanced" },
];

const SEVERITY_LABELS = ["None", "Occasionally", "Often", "Almost Always"];

const SeveritySelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex gap-1">
    {[0, 1, 2, 3].map((v) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
          value === v
            ? v === 0
              ? "bg-muted text-foreground"
              : v === 1
              ? "bg-severity-mild/20 text-severity-mild"
              : v === 2
              ? "bg-severity-moderate/20 text-severity-moderate"
              : "bg-severity-severe/20 text-severity-severe"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
        }`}
      >
        {SEVERITY_LABELS[v]}
      </button>
    ))}
  </div>
);

const LOADING_MESSAGES = [
  "Mapping your symptom profile...",
  "Scoring 10 clinical axes...",
  "Detecting high-risk patterns...",
  "Building your protocol...",
];

const DiagnosisPage = () => {
  const navigate = useNavigate();
  const store = useDiagnosisStore();
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const [metaCategoryJustCompleted, setMetaCategoryJustCompleted] = useState<number | null>(null);

  // Total steps: 0=context, 1=skinType, 2-9=categories 1-8, 10=loading
  const totalSteps = 10;
  const progress = ((store.currentStep + 1) / (totalSteps + 1)) * 100;

  const categorySymptoms = useMemo(() => {
    if (store.currentStep < 2 || store.currentStep > 9) return [];
    const cat = store.currentStep - 1; // step 2 = cat 1, step 9 = cat 8
    return Object.values(SYMPTOMS).filter((s) => s.category === cat);
  }, [store.currentStep]);

  const currentCategoryNum = store.currentStep >= 2 && store.currentStep <= 9 ? store.currentStep - 1 : 0;

  const metaQuestionsForCategory = useMemo(() => {
    if (metaCategoryJustCompleted === null) return [];
    return META_QUESTIONS.filter(
      (q) =>
        q.trigger_after_category === metaCategoryJustCompleted &&
        q.trigger_condition(store.severities)
    );
  }, [metaCategoryJustCompleted, store.severities]);

  const goNext = useCallback(() => {
    // Check for meta questions after category completion
    if (store.currentStep >= 2 && store.currentStep <= 9) {
      const completedCat = store.currentStep - 1;
      const metaQs = META_QUESTIONS.filter(
        (q) => q.trigger_after_category === completedCat && q.trigger_condition(store.severities)
      );
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
      // Start loading + run diagnosis
      store.setStep(10);
    }
  }, [store, showMeta]);

  const goBack = () => {
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
          // Run diagnosis
          const result = runDiagnosis({
            severities: store.severities,
            contexts: store.contexts,
            skinType: store.skinType || "normal",
            tier: store.selectedTier,
            metaAnswers: store.metaAnswers,
          });
          store.setResult(result);
          setTimeout(() => navigate("/results"), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [store.currentStep]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Progress bar */}
      <div className="fixed top-[65px] left-0 right-0 z-40 h-0.5 bg-border">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto w-full max-w-[640px]">
          <AnimatePresence mode="wait">
            {/* Step 0: Context */}
            {store.currentStep === 0 && (
              <StepWrapper key="context">
                <h2 className="font-display text-3xl text-foreground">
                  First, tell us about your skin context
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Select all that apply — this personalises your assessment
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {CONTEXT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => store.toggleContext(opt.key)}
                      className={`rounded-lg border px-5 py-4 text-left text-sm transition-all ${
                        store.contexts.includes(opt.key)
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Step 1: Skin Type */}
            {store.currentStep === 1 && (
              <StepWrapper key="skintype">
                <h2 className="font-display text-3xl text-foreground">
                  What's your baseline skin type?
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Choose the option that best describes your skin on an average day
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {SKIN_TYPES.map((st) => (
                    <button
                      key={st.key}
                      onClick={() => store.setSkinType(st.key)}
                      className={`rounded-lg border px-5 py-4 text-left transition-all ${
                        store.skinType === st.key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">{st.label}</span>
                      <span className="ml-3 text-sm text-muted-foreground">— {st.desc}</span>
                    </button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Steps 2-9: Categories */}
            {store.currentStep >= 2 && store.currentStep <= 9 && !showMeta && (
              <StepWrapper key={`cat-${currentCategoryNum}`}>
                <div className="mb-6">
                  <span className="text-xs font-medium uppercase tracking-widest text-primary">
                    Category {currentCategoryNum} of 8
                  </span>
                  <h2 className="mt-2 font-display text-3xl text-foreground">
                    {CATEGORY_INFO[currentCategoryNum]?.emoji}{" "}
                    {CATEGORY_INFO[currentCategoryNum]?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CATEGORY_INFO[currentCategoryNum]?.clinical}
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  {categorySymptoms.map((symptom) => (
                    <div key={symptom.id} className="space-y-2">
                      <p className="text-sm text-foreground">{symptom.text_en}</p>
                      <SeveritySelector
                        value={store.severities[symptom.id] ?? 0}
                        onChange={(v) => store.setSeverity(symptom.id, v)}
                      />
                    </div>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Meta Questions */}
            {showMeta && metaQuestionsForCategory.length > 0 && (
              <StepWrapper key="meta">
                <h2 className="font-display text-2xl text-foreground">
                  Additional Precision Questions
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Based on your responses, we need a few more details
                </p>
                <div className="mt-8 flex flex-col gap-6">
                  {metaQuestionsForCategory.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm text-foreground">{q.text_en}</p>
                      {q.type === "boolean" ? (
                        <div className="flex gap-2">
                          {[true, false].map((v) => (
                            <button
                              key={String(v)}
                              onClick={() => store.setMetaAnswer(q.id, v)}
                              className={`flex-1 rounded-md px-4 py-2 text-sm transition-all ${
                                store.metaAnswers[q.id] === v
                                  ? "bg-primary/20 text-primary border border-primary"
                                  : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary"
                              }`}
                            >
                              {v ? "Yes" : "No"}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <SeveritySelector
                          value={(store.metaAnswers[q.id] as number) ?? 0}
                          onChange={(v) => store.setMetaAnswer(q.id, v)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Loading */}
            {store.currentStep === 10 && (
              <StepWrapper key="loading">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-20 w-20 animate-pulse-glow rounded-full border-2 border-primary opacity-40" />
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMsg}
                      className="mt-8 text-lg text-muted-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {LOADING_MESSAGES[loadingMsg]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {store.currentStep < 10 && (
            <div className="mt-8 flex items-center justify-between pb-12">
              <button
                onClick={goBack}
                disabled={store.currentStep === 0 && !showMeta}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={goNext}
                disabled={store.currentStep === 1 && !store.skinType}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30"
              >
                {store.currentStep === 9 && !showMeta ? "Analyse My Skin" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StepWrapper = ({ children, ...props }: { children: React.ReactNode; key: string }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
);

export default DiagnosisPage;
