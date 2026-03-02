import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useSearchParams } from "react-router-dom";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import SlideDiagnosisSummary from "@/components/results/SlideDiagnosisSummary";
import SlideAxisBreakdown from "@/components/results/SlideAxisBreakdown";
import SlideWhyProducts from "@/components/results/SlideWhyProducts";
import SlideProtocol from "@/components/results/SlideProtocol";
import SlideSubscribe from "@/components/results/SlideSubscribe";
import SlideNav from "@/components/results/SlideNav";
import DebugPanel from "@/components/diagnosis/DebugPanel";

const SLIDE_LABELS = [
  { key: "diagnosis", short: "Pattern", full: "Your Skin Pattern" },
  { key: "axes", short: "Analysis", full: "Clinical Analysis" },
  { key: "protocol", short: "Protocol", full: "Your Routine" },
  { key: "products", short: "Products", full: "Matched Products" },
  { key: "subscribe", short: "Strategy", full: "Adaptive Strategy" },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

const ResultsPage = () => {
  const { result } = useDiagnosisStore();
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get("debug") === "true" && import.meta.env.DEV;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= 5) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
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
          animate={{ width: `${((current + 1) / 5) * 100}%` }}
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
        total={5}
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
