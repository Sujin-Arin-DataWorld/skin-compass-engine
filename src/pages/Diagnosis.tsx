import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useAuthStore } from "@/store/authStore";
import { runDiagnosis } from "@/engine/runDiagnosisV4";
import { computeAxisQueue, AXIS_DEFINITIONS } from "@/engine/questionRoutingV5";
import type { QuestionAnswer } from "@/engine/questionRoutingV5";
import { convertAxisAnswersToUiSignals } from "@/engine/axisAnswerBridge";
import { useI18nStore, translations } from "@/store/i18nStore";
import { X } from "lucide-react";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import DebugPanel from "@/components/diagnosis/DebugPanel";
import GlobalProgressLine from "@/components/GlobalProgressLine";
import { FaceMapStep } from "@/components/diagnosis/FaceMapStep";
import { AxisQuestionStep } from "@/components/diagnosis/AxisQuestionStep";
import { ExposomeStep } from "@/components/diagnosis/ExposomeStep";
import { useProgressPersistence, getSavedProgress, clearSavedProgress } from "@/hooks/useProgressPersistence";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import React from "react";

// ─── Mini radar chart (used in retest intercept modal) ────────────────────────

const MINI_AXES = ["seb", "hyd", "bar", "sen", "acne", "pigment", "texture", "aging"] as const;
type MiniAxis = typeof MINI_AXES[number];

function MiniRadarChart({ scores }: { scores: Record<string, number> }) {
  const N = MINI_AXES.length;
  const cx = 54, cy = 54, r = 42;
  const angleOf = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;
  const ptAt = (i: number, s: number) => ({
    x: cx + r * Math.min(1, Math.max(0, s / 100)) * Math.cos(angleOf(i)),
    y: cy + r * Math.min(1, Math.max(0, s / 100)) * Math.sin(angleOf(i)),
  });
  const pts = MINI_AXES.map((axis, i) => ptAt(i, scores[axis] ?? 0));
  const polyPts = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 108 108" width="96" height="96" className="flex-shrink-0">
      {/* Grid rings */}
      {[0.3, 0.6, 1.0].map((lvl, gi) => (
        <polygon
          key={gi}
          points={MINI_AXES.map((_, i) => {
            const a = angleOf(i);
            return `${cx + r * lvl * Math.cos(a)},${cy + r * lvl * Math.sin(a)}`;
          }).join(" ")}
          fill="none"
          stroke="#C9A96E"
          strokeWidth="0.6"
          strokeOpacity="0.2"
        />
      ))}
      {/* Spokes */}
      {MINI_AXES.map((_, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={cx + r * Math.cos(angleOf(i))}
          y2={cy + r * Math.sin(angleOf(i))}
          stroke="#C9A96E" strokeWidth="0.5" strokeOpacity="0.22"
        />
      ))}
      {/* Score area */}
      <polygon points={polyPts} fill="#C9A96E" fillOpacity="0.14" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.8" />
      {/* High-score accent dots (rose-gold) */}
      {pts.map((p, i) =>
        (scores[MINI_AXES[i] as MiniAxis] ?? 0) > 55
          ? <circle key={`rg-${i}`} cx={p.x} cy={p.y} r="3" fill="#B76E79" fillOpacity="0.55" />
          : null
      )}
      {/* All dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="#C9A96E" fillOpacity="0.9" />
      ))}
    </svg>
  );
}

// ─── Date formatter ────────────────────────────────────────────────────────────

function formatDiagnosisDate(isoStr: string, lang: "en" | "de" | "ko"): string {
  const d = new Date(isoStr);
  if (lang === "ko") return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (lang === "de") return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Loading messages ──────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Mapping your symptom profile...",
  "Scoring 10 clinical axes...",
  "Detecting high-risk patterns...",
  "Building your protocol...",
];

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

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
      onDragEnd={(_, { offset, velocity }) => {
        const swipe = swipePower(offset.x, velocity.x);
        if (swipe < -swipeConfidenceThreshold && onSwipeLeft) onSwipeLeft();
        else if (swipe > swipeConfidenceThreshold && onSwipeRight) onSwipeRight();
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
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showRetestModal, setShowRetestModal] = useState(false);

  // Ensure intercept modal only fires once per page visit
  const hasCheckedHistory = useRef(false);

  const isDebug = searchParams.get("debug") === "true" && import.meta.env.DEV;
  const { reducedMotion } = usePerformanceMode();
  const { history, loading: historyLoading, saveDiagnosis } = useDiagnosis();

  // Last diagnosis record (from Supabase history)
  const lastRecord = history[0] ?? null;
  const radarScores: Record<string, number> | null =
    lastRecord?.radar_data ?? (store.result ? store.result.axis_scores as Record<string, number> : null);
  const lastDiagnosedAt: string | null = lastRecord?.diagnosed_at ?? null;
  const lastTier: string | null = lastRecord?.skin_tier ?? null;

  // Auth Guard
  if (!isLoggedIn) {
    return <Navigate to={`/login?redirect=/diagnosis`} replace />;
  }

  // Progress persistence
  useProgressPersistence();

  // ── Axis queue computed from face zone selections ──────────────────────────
  const axisQueue = useMemo(
    () => computeAxisQueue(store.interactiveState.faceZones),
    [store.interactiveState.faceZones]
  );

  // Step layout:
  //   0            → FaceMapStep
  //   1 .. N       → AxisQuestionStep (N = axisQueue.length)
  //   N + 1        → ExposomeStep (lifestyle block — always shown)
  //   N + 2        → Loading + runDiagnosis
  const totalAxisSteps = axisQueue.length;
  const exposomeStep = totalAxisSteps + 1;
  const loadingStep  = totalAxisSteps + 2;

  // Current axis index (0-based) for Steps 1..N
  const currentAxisIndex = store.currentStep - 1;
  const currentAxisId = axisQueue[currentAxisIndex] ?? axisQueue[0];
  const currentAxis = AXIS_DEFINITIONS.find((a) => a.id === currentAxisId);

  // Show intercept once history has loaded (or immediately if store.result exists)
  useEffect(() => {
    if (historyLoading || hasCheckedHistory.current) return;
    hasCheckedHistory.current = true;

    if (store.result || history.length > 0) {
      setShowRetestModal(true);
      return;
    }
    const saved = getSavedProgress();
    if (saved && store.currentStep === 0) {
      setShowResumePrompt(true);
    }
  }, [historyLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResume = () => {
    const saved = getSavedProgress();
    if (saved) {
      store.setStep(saved.currentStep);
      if (saved.skinType) store.setSkinType(saved.skinType as Parameters<typeof store.setSkinType>[0]);
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

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (store.currentStep < loadingStep) {
      store.setStep(store.currentStep + 1);
    }
  }, [store, loadingStep]);

  const goBack = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (store.currentStep > 0) store.setStep(store.currentStep - 1);
  }, [store]);

  const handleAxisAnswer = useCallback(
    (id: string, value: QuestionAnswer) => {
      store.setAxisAnswer(id, value);
    },
    [store]
  );

  // Loading animation + diagnosis execution
  useEffect(() => {
    if (store.currentStep !== loadingStep) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          clearInterval(interval);

          // Convert V5 axis answers to uiSignals for the existing engine
          const uiSignals = convertAxisAnswersToUiSignals(store.axisAnswers);
          const metaAnswers: Record<string, number | boolean> = {
            ...store.metaAnswers,
            atopy: store.implicitFlags.atopyFlag,
          };

          const result = runDiagnosis({
            severities: store.severities,
            contexts: store.contexts,
            skinType: store.skinType || "normal",
            tier: store.selectedTier,
            metaAnswers,
            uiSignals,
          });

          store.setResult(result);
          clearSavedProgress();

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
  }, [store.currentStep, loadingStep]);

  return (
    <div className="relative min-h-screen bg-background">
      <SilkBackground />
      <Navbar />

      {/* ── Retest intercept modal ── */}
      <AnimatePresence>
        {showRetestModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "hsl(var(--background) / 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowRetestModal(false); }}
          >
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
              style={{
                border: "1px solid #C9A96E55",
                background: "hsl(var(--card) / 0.96)",
                backdropFilter: "blur(32px) saturate(180%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%)",
              }}
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              {/* Gold accent top bar */}
              <div className="h-[2px] w-full" style={{ background: "linear-gradient(to right, transparent, #C9A96E, transparent)" }} />

              {/* Close */}
              <button
                onClick={() => setShowRetestModal(false)}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-6 pt-5 pb-6">
                {/* Eyebrow */}
                <p className="mb-3 text-[0.6rem] tracking-[0.22em] uppercase font-medium" style={{ color: "#C9A96E" }}>
                  {language === "ko" ? "피부 분석 기록" : language === "de" ? "Hautanalyse-Verlauf" : "Skin Analysis History"}
                </p>

                {/* Headline */}
                <h3
                  className="text-[1.55rem] font-light leading-snug text-foreground break-keep"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {language === "ko"
                    ? "당신의 피부는 어떻게 달라졌을까요?"
                    : language === "de"
                    ? "Bereit zu sehen, wie sich Ihre Haut verändert hat?"
                    : "Ready to see how your skin has changed?"}
                </h3>

                {/* Date subtitle */}
                {lastDiagnosedAt && (
                  <p className="mt-1.5 text-xs font-light text-muted-foreground">
                    {language === "ko"
                      ? `마지막 분석: ${formatDiagnosisDate(lastDiagnosedAt, "ko")}`
                      : language === "de"
                      ? `Letzte Analyse: ${formatDiagnosisDate(lastDiagnosedAt, "de")}`
                      : `Last analyzed: ${formatDiagnosisDate(lastDiagnosedAt, "en")}`}
                  </p>
                )}

                {/* Radar preview card */}
                {radarScores && (
                  <div
                    className="mt-5 mb-5 flex items-center gap-4 rounded-2xl p-4"
                    style={{ background: "hsl(var(--secondary) / 0.4)", border: "1px solid #C9A96E22" }}
                  >
                    <MiniRadarChart scores={radarScores} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.65rem] tracking-[0.16em] uppercase text-muted-foreground font-light">
                        {language === "ko" ? "피부 프로필" : language === "de" ? "Hautprofil" : "Skin Profile"}
                      </p>
                      {lastTier && (
                        <p className="mt-1 text-sm font-medium text-foreground">{lastTier}</p>
                      )}
                      <p className="mt-2 text-[11px] font-light text-muted-foreground/70 leading-relaxed break-keep">
                        {language === "ko"
                          ? "변화를 추적하면 더 정밀한 맞춤 프로토콜을 만들 수 있습니다."
                          : language === "de"
                          ? "Verfolgen Sie Veränderungen für ein präziseres Protokoll."
                          : "Track changes to refine your personalised protocol."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <motion.button
                    onClick={() => { store.reset(); setShowRetestModal(false); }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-xl py-3.5 text-sm font-medium text-white min-h-[48px] touch-manipulation"
                    style={{ background: "linear-gradient(135deg, #C9A96E 0%, #947E5C 100%)" }}
                  >
                    {language === "ko" ? "새 분석 시작" : language === "de" ? "Neue Analyse starten" : "Start New Analysis"}
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/profile")}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-xl border py-3 text-sm font-light text-foreground min-h-[44px] touch-manipulation transition-colors hover:bg-secondary/40"
                    style={{ borderColor: "#C9A96E40" }}
                  >
                    {language === "ko" ? "내 피부 여정 보기" : language === "de" ? "Meine Hautreise ansehen" : "View My Skin Journey"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="mt-2 text-sm text-muted-foreground">{t.diagnosis.resumeSub}</p>
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
          {/* Progress line — hidden on Step 0 (FaceMapStep has its own UI) */}
          {store.currentStep > 0 && store.currentStep <= loadingStep && (
            <GlobalProgressLine
              totalSegments={exposomeStep}   /* axis steps + exposome = total visible segments */
              activeSegment={store.currentStep - 1}
              stepLabel={
                store.currentStep >= loadingStep
                  ? t.diagnosis.progress.processing
                  : store.currentStep === exposomeStep
                  ? (language === "ko" ? "라이프스타일 프로필" : language === "de" ? "Lebensstil-Profil" : "Lifestyle Profile")
                  : currentAxis
                  ? `${currentAxis.eyebrow[language] ?? currentAxis.eyebrow.en} — ${currentAxisIndex + 1} / ${exposomeStep}`
                  : undefined
              }
            />
          )}

          <AnimatePresence mode="wait">
            {/* Step 0: Face Map */}
            {store.currentStep === 0 && (
              <motion.div
                key="facemap"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: reducedMotion ? 0.15 : 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <FaceMapStep
                  onNext={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    store.setStep(1);
                  }}
                />
              </motion.div>
            )}

            {/* Steps 1..N: Dynamic axis questions */}
            {store.currentStep >= 1 && store.currentStep <= totalAxisSteps && currentAxis && (
              <StepWrapper
                key={`axis-${currentAxisId}`}
                reducedMotion={reducedMotion}
                onSwipeLeft={goNext}
                onSwipeRight={goBack}
              >
                <AxisQuestionStep
                  axis={currentAxis}
                  lang={language}
                  answers={store.axisAnswers}
                  onChange={handleAxisAnswer}
                  onNext={goNext}
                  onBack={goBack}
                />
              </StepWrapper>
            )}

            {/* Step N+1: Exposome — lifestyle block (always shown) */}
            {store.currentStep === exposomeStep && (
              <StepWrapper key="exposome" reducedMotion={reducedMotion}>
                <ExposomeStep
                  lang={language}
                  answers={store.axisAnswers}
                  onChange={handleAxisAnswer}
                  onNext={goNext}
                  onBack={goBack}
                />
              </StepWrapper>
            )}

            {/* Loading */}
            {store.currentStep >= loadingStep && (
              <StepWrapper key="loading" reducedMotion={reducedMotion}>
                <div className="flex flex-col items-center justify-center py-20">
                  {!reducedMotion ? (
                    /* Premium golden analysis orb */
                    <div className="relative h-28 w-28 mb-2">
                      {/* Ambient glow halo */}
                      <motion.div
                        className="absolute rounded-full pointer-events-none"
                        style={{ inset: "-20px", background: "radial-gradient(circle, #C9A96E18 0%, transparent 70%)" }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Gold conic spinner */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          inset: "6px",
                          background: "conic-gradient(from 0deg, transparent 0%, #C9A96E 35%, transparent 70%)",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Mask center of gold spinner */}
                      <div className="absolute rounded-full bg-background" style={{ inset: "20px" }} />
                      {/* Rose-gold counter-spinner */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          inset: "20px",
                          background: "conic-gradient(from 180deg, transparent 0%, #B76E79 25%, transparent 50%)",
                        }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Mask center of rose spinner */}
                      <div className="absolute rounded-full bg-background" style={{ inset: "32px" }} />
                      {/* Core pulse dot */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{ inset: "32px", background: "radial-gradient(circle, #C9A96E, #C9A96E50)" }}
                        animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  ) : (
                    <div className="h-28 w-28 rounded-full border border-amber-400/40 opacity-60 mb-2" />
                  )}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMsg}
                      className="mt-8 text-base text-muted-foreground font-light tracking-wide"
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
