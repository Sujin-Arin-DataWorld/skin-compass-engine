import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Scan, Brain, FlaskConical, PackageCheck, Sparkles, ShieldCheck, Activity, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { useProductStore } from "@/store/productStore";
import { AXIS_LABELS } from "@/engine/types";

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  })
};

// ─────────────────────────────────────────────
// Persistent data markers on face
// Positioned to overlay on consistent facial zones
// ─────────────────────────────────────────────
const FACE_MARKERS = [
  { label: "Sebum", value: 70, top: "22%", left: "19%", color: "hsl(43 70% 50%)" },        // 이마 중앙 (T-zone)
  { label: "Aging", value: 28, top: "39%", left: "12%", color: "hsl(270 30% 55%)" },       // 눈가 (Crow's feet)
  { label: "Hydration", value: 78, top: "40%", left: "32%", color: "hsl(200 65% 50%)" },    // 눈밑 / 광대 상단
  { label: "Pigment", value: 55, top: "45%", right: "18%", color: "hsl(28 55% 50%)" },      // 광대 바깥쪽
  { label: "Sensitivity", value: 45, top: "52%", left: "8%", color: "hsl(8 50% 55%)" },    // 볼 중앙 (홍조)
  { label: "Texture", value: 81, top: "55%", right: "32%", color: "hsl(160 40% 45%)" },     // 코 옆 (나비존)
  { label: "Barrier", value: 62, top: "66%", left: "35%", color: "hsl(38 60% 50%)" },       // 입가 (팔자주름)
  { label: "Elasticity", value: 73, top: "75%", left: "28%", color: "hsl(145 50% 45%)" },  // 턱선 (Jawline)
];

// ─────────────────────────────────────────────
// Static data
const journeyItems = [
  {
    num: "01",
    title: "Context Setup",
    subtitle: "Age, environment & lifestyle baseline",
    desc: "We begin by establishing your environmental and lifestyle parameters. Every algorithmic decision accounts for your local climate and daily routine.",
    accent: "30 sec",
    icon: Scan
  },
  {
    num: "02",
    title: "Biometric Symptom Check",
    subtitle: "120 clinical markers assessed",
    desc: "Our diagnostic engine evaluates your skin across multiple dimensions based on IGA, TEWL, and MASI—the exact clinical scales used in dermatological research.",
    accent: "3-5 min",
    icon: Brain
  },
  {
    num: "03",
    title: "Data-Driven Analysis",
    subtitle: "10-axis scoring computed",
    desc: "Your responses generate a unique biometric skin vector. We don't sort you into a generic \"skin type.\" Your clinical metrics drive the entire recommendation engine.",
    accent: "< 3 sec",
    icon: FlaskConical
  },
  {
    num: "04",
    title: "Your Targeted Protocol",
    subtitle: "5-phase K-beauty routine",
    desc: "Every product recommendation passes a dual filter: dermatological efficacy for your specific data vector, and EU-compliant safety standards. No guesswork.",
    accent: "Personalized",
    icon: PackageCheck
  }
];

// ─────────────────────────────────────────────
// FaceMarker — persistent floating data tag
// ─────────────────────────────────────────────
function FaceMarker({ marker, index }: { marker: typeof FACE_MARKERS[0]; index: number }) {
  const isLeft = marker.left !== undefined;

  return (
    <motion.div
      className="absolute flex items-center gap-2"
      style={{
        top: marker.top,
        ...(isLeft ? { left: marker.left } : { right: (marker as any).right }),
      }}
      initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.0 + index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Connector line */}
      {isLeft ? (
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <div className="marker-dot" style={{ background: marker.color, boxShadow: `0 0 8px ${marker.color}40` }} />
          <div className="marker-tag">
            <span className="marker-label scale-110">{marker.label}</span>
            <span className="marker-value scale-110 pl-1">{marker.value}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="marker-dot" style={{ background: marker.color, boxShadow: `0 0 8px ${marker.color}40` }} />
          <div className="marker-tag">
            <span className="marker-label scale-110">{marker.label}</span>
            <span className="marker-value scale-110 pl-1">{marker.value}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ScanBeam — vertical scanning light effect
// ─────────────────────────────────────────────
function ScanBeam() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Vertical scan beam */}
      <motion.div
        className="absolute top-0 bottom-0 w-[2px]"
        style={{
          background: "linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.6) 30%, hsl(var(--primary) / 0.8) 50%, hsl(var(--primary) / 0.6) 70%, transparent 100%)",
          boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.15)"
        }}
        initial={{ left: "15%" }}
        animate={{ left: ["15%", "85%", "15%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
      />

      {/* Horizontal scan sweep */}
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 20%, hsl(var(--primary) / 0.5) 50%, hsl(var(--primary) / 0.3) 80%, transparent 100%)",
        }}
        initial={{ top: "10%" }}
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
      />

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-[1.5px] border-l-[1.5px] border-primary/30" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-[1.5px] border-r-[1.5px] border-primary/30" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-[1.5px] border-l-[1.5px] border-primary/30" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-[1.5px] border-r-[1.5px] border-primary/30" />
    </div>
  );
}

// ─────────────────────────────────────────────
// RadarChartMockup (Abstract Biometric Dashboard)
// ─────────────────────────────────────────────
function RadarChartMockup() {
  return (
    <div className="relative w-full aspect-[4/5] bg-card/10 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden border border-border/10 shadow-inner z-10 transition-transform duration-500 group-hover:scale-[1.02]">
      {/* Brand header */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-primary">
        <Activity className="w-5 h-5" />
        <span className="text-xs font-bold tracking-widest uppercase">Skin Strategie</span>
      </div>

      {/* Abstract Radar Chart */}
      <div className="relative w-48 h-48 mt-4">
        {/* Concentric circles */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="absolute inset-0 m-auto border border-primary/20 rounded-full" style={{ width: `${i * 25}%`, height: `${i * 25}%` }} />
        ))}
        {/* Axes */}
        {[0, 45, 90, 135].map(deg => (
          <div key={deg} className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/20" style={{ transform: `rotate(${deg}deg)` }} />
        ))}
        {/* Polygon mock - CSS animated */}
        <motion.div
          className="absolute inset-[20%] bg-primary/20 border border-primary/50 shadow-[0_0_20px_rgba(138,154,91,0.4)]"
          style={{ clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)" }}
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.8) 50%, transparent 100%)", boxShadow: "0 0 10px hsl(var(--primary))" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="absolute bottom-6 flex gap-3">
        <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] text-primary font-mono tracking-widest uppercase">SCAN IN PROGRESS</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BespokeProductMockup
// ─────────────────────────────────────────────
function BespokeProductMockup() {
  return (
    <div className="relative w-full aspect-[4/5] bg-card/10 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden border border-border/10 shadow-inner z-10 transition-transform duration-500 group-hover:scale-[1.02]">
      {/* Glow behind product */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-60" />
      <motion.div
        className="absolute z-0 rounded-full blur-[60px] w-48 h-48 bg-primary/20"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Product Silhouette */}
      <div className="relative z-10 w-24 h-40 rounded-[2rem] rounded-t-xl bg-gradient-to-b from-foreground/5 to-foreground/20 border border-foreground/10 shadow-2xl flex flex-col items-center backdrop-blur-sm">
        {/* Cap */}
        <div className="w-14 h-10 rounded-t-lg border-b border-foreground/10 bg-gradient-to-r from-foreground/10 to-foreground/5 shadow-inner" />
        {/* Body */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div className="w-10 h-16 border border-primary/30 rounded opacity-60 flex items-center justify-center bg-primary/5">
            <div className="w-6 h-px bg-primary/40" />
          </div>
        </div>
      </div>

      {/* Accuracy Tag */}
      <motion.div
        className="absolute bottom-6 px-4 py-2 bg-background/80 backdrop-blur-md border border-primary/30 rounded-full shadow-[0_0_15px_rgba(138,154,91,0.15)] flex items-center gap-2 z-20"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">Match: 98.4% Accuracy</span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProgressSlider – 2 Weeks vs 6 Weeks
// ─────────────────────────────────────────────
function ProgressSlider() {
  const [sliderValue, setSliderValue] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderValue(x);
  };

  return (
    <motion.div
      ref={ref}
      className="relative w-full max-w-3xl mx-auto rounded-[2rem] border border-border/40 bg-card/30 p-6 md:p-10 shadow-xl backdrop-blur-sm"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image container with slider reveal — draggable */}
      <div
        ref={containerRef}
        className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-border/30 shadow-xl aspect-[21/9] md:aspect-[2/1] w-full select-none touch-none"
        onPointerDown={(e) => { setIsDragging(true); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
      >
        <img
          src="/assets/before-after.png"
          alt="Skin improvement comparison — Week 2 vs Week 6"
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Slider overlay curtain */}
        <div
          className="absolute inset-0 bg-background/50 backdrop-blur-sm transition-none"
          style={{ clipPath: `inset(0 0 0 ${sliderValue}%)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-lg font-bold text-primary-foreground bg-primary/90 backdrop-blur-md px-6 py-3 rounded-full border border-primary/20 shadow-xl">
              Week 6 — Visible Improvement
            </span>
          </div>
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(138,154,91,0.8)]"
          style={{ left: `${sliderValue}%` }}
        >
          {/* Slider thumb visual — Circular Glow Handle */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-11 md:h-11 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/60 shadow-lg flex items-center justify-center cursor-grab"
            animate={{ boxShadow: ['0 0 12px rgba(138,154,91,0.4)', '0 0 24px rgba(138,154,91,0.7)', '0 0 12px rgba(138,154,91,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-1.5 h-5 bg-primary/60 rounded-full" />
          </motion.div>
        </div>

        {/* Labels - High Contrast Gold Pills */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-primary/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-primary/30 shadow-xl shadow-black/20 z-10">
          <span className="text-lg md:text-xl font-bold text-primary-foreground tracking-wide">Week 2</span>
        </div>
        <div className="absolute top-6 right-6 md:top-8 md:right-8 bg-primary/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-primary/30 shadow-xl shadow-black/20 z-10">
          <span className="text-lg md:text-xl font-bold text-primary-foreground tracking-wide">Week 6</span>
        </div>
      </div>

      {/* Slider input */}
      <div className="mt-8 px-4 max-w-2xl mx-auto">
        <input
          type="range"
          min={5}
          max={95}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="progress-slider w-full h-3"
          aria-label="Drag to compare Week 2 vs Week 6 results"
        />
        <p className="mt-4 text-center text-[1rem] md:text-lg text-muted-foreground font-medium">
          Drag to compare · Illustrative results
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// AuthorityBadge
// ─────────────────────────────────────────────
function AuthorityBadge({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="authority-badge px-6 py-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Icon className="h-12 w-12 text-primary mb-4" />
      <span className="text-4xl md:text-5xl font-display font-light text-foreground">{value}</span>
      <span className="text-[0.8rem] md:text-sm text-muted-foreground uppercase tracking-widest mt-3 font-semibold">{label}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// JourneyCard – staggered proof item
// ─────────────────────────────────────────────
function JourneyCard({ item, i }: { item: (typeof journeyItems)[0]; i: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const isEven = i % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -50 : 50, y: 30 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col md:flex-row items-center gap-10 md:gap-16 ${isEven ? "md:flex-row" : "md:flex-row-reverse"
        }`}
    >
      <div className="shrink-0 flex items-center justify-center w-20 h-20 md:w-28 md:h-28 rounded-full border border-primary/30 bg-primary/10 shadow-lg shadow-primary/5">
        <item.icon className="h-10 w-10 md:h-12 md:w-12 text-primary" />
      </div>
      <div className="flex-1 storytelling-accent pl-8 md:pl-12 py-4">
        <span className="mb-2 block text-sm md:text-base font-bold text-primary tracking-widest uppercase">
          {item.accent}
        </span>
        <h3 className="hero-serif text-3xl md:text-5xl text-foreground tracking-tight leading-tight">
          {item.title}
        </h3>
        <p className="mt-2 text-lg md:text-xl font-medium text-foreground/80">
          {item.subtitle}
        </p>
        <p className="mt-5 text-[1.1rem] md:text-lg leading-relaxed text-muted-foreground font-normal max-w-2xl normal-case">
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Expert Seal
// ─────────────────────────────────────────────
function ExpertSeal() {
  return (
    <motion.div
      className="py-20 px-10 text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex flex-col items-center gap-6 max-w-3xl">
        <div className="flex items-center gap-4 w-full max-w-[360px]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/40" />
          <Sparkles className="h-6 w-6 text-primary/60" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <div className="flex items-center gap-4">
          <Activity className="h-8 w-8 text-primary/70" />
          <p className="hero-serif text-2xl md:text-4xl text-foreground font-medium tracking-wide">
            Biometric Skin Analysis
          </p>
          <Activity className="h-8 w-8 text-primary/70" />
        </div>
        <p className="text-[11px] md:text-sm text-muted-foreground tracking-[0.2em] font-bold mt-2 uppercase">
          POWERED BY KOREAN BIOMETRIC DATA SCIENCE — GERMANY
        </p>

        <div className="flex items-center gap-4 w-full max-w-[360px] mt-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary/50" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/40" />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { products } = useProductStore();

  const [analysisStep, setAnalysisStep] = useState(0);

  const progressLabels = [
    "Initializing...",
    "Scanning Sebum...",
    "Checking Hydration...",
    "Analyzing Texture...",
    "Evaluating Barrier...",
    "Measuring Elasticity...",
    "Detecting Pigment...",
    "Assessing Aging...",
    "Analysis Complete"
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });

    // Simulate biometric scanning progression
    const interval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= 8) {
          // Pause briefly at Complete before looping (optional, or just stop)
          return 0; // Or keep it at 8 for final state
        }
        return prev + 1;
      });
    }, 1500); // 1.5 seconds per step

    return () => {
      window.removeEventListener("scroll", handler);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* ═══════════════════════════════════════
          HERO — Luxury 3-Slide Swiper
          ═══════════════════════════════════════ */}
      <section className="relative h-screen min-h-[600px] w-full bg-background overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* Background Image / Overlay logic per slide */}
            {currentSlide === 0 && (
              <>
                <img src="/assets/hero-face.png" alt="Precision Skincare" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute inset-x-6 md:inset-x-12 bottom-32 md:bottom-24 z-20 flex flex-col justify-end">
                  <h1 className="hero-serif text-5xl md:text-7xl lg:text-8xl text-[#001A33] dark:text-[#FFFFFF] drop-shadow-lg tracking-tight font-light mb-4 transition-colors duration-300">
                    Precision<br />Skincare.
                  </h1>
                  <p className="text-lg md:text-2xl text-[#1A1A1A] dark:text-white/90 drop-shadow-md max-w-xl font-light leading-snug transition-colors duration-300">
                    End the cycle of skincare speculation.<br />
                    Clinical data matches you to exact formulas.
                  </p>
                  <Link
                    to="/diagnosis"
                    className="mt-8 inline-flex items-center justify-center gap-4 rounded-full bg-primary/90 text-primary-foreground px-8 py-4 text-sm md:text-base font-bold tracking-widest uppercase hover:bg-primary transition-colors w-max backdrop-blur-md border border-white/20"
                  >
                    Start Analysis
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </>
            )}
            {currentSlide === 1 && (
              <>
                <img src="/assets/data-blueprint.png" alt="10-Axis Analysis" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-20">
                  <Scan className="w-12 h-12 text-primary mb-6 animate-pulse" />
                  <h1 className="hero-serif text-4xl md:text-6xl text-foreground tracking-tight font-light mb-4">
                    The 10-Axis<br />Analysis Process.
                  </h1>
                  <p className="text-base md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    120 clinical markers processed in real-time to generate your bespoke biometric skin vector.
                  </p>
                </div>
              </>
            )}
            {currentSlide === 2 && (
              <>
                <img src="/assets/kbeauty-lineup.png" alt="Strategy Lab Kit" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent md:to-background/20" />
                <div className="absolute inset-x-6 md:inset-x-12 bottom-32 md:bottom-24 md:flex items-end justify-between z-20">
                  <div className="max-w-xl">
                    <h1 className="hero-serif text-4xl md:text-6xl lg:text-7xl text-foreground tracking-tight font-light mb-4">
                      The Complete<br />Strategy Lab Kit.
                    </h1>
                    <p className="text-base md:text-xl text-muted-foreground leading-relaxed mb-6 md:mb-0">
                      5 formulas perfectly curated to shift your exact clinical vector toward harmony. Delivered monthly.
                    </p>
                  </div>
                  <Link
                    to="/diagnosis"
                    className="hidden md:inline-flex items-center justify-center gap-4 rounded-full bg-foreground text-background px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-foreground/90 transition-colors shrink-0"
                  >
                    Explore Kit
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Slider Elements */}
        <div className="absolute bottom-10 right-6 md:right-12 z-30 flex items-center gap-6">
          {/* Pagination */}
          <div className="text-white/80 dark:text-foreground/80 font-mono text-sm tracking-widest mix-blend-difference">
            0{currentSlide + 1} / 03
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? 2 : prev - 1))}
              className="w-10 h-10 rounded-full border border-white/30 dark:border-foreground/30 flex items-center justify-center text-white dark:text-foreground mix-blend-difference hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1))}
              className="w-10 h-10 rounded-full border border-white/30 dark:border-foreground/30 flex items-center justify-center text-white dark:text-foreground mix-blend-difference hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRODUCTS GRID (2-Column Mobile, 4 Desktop)
          ═══════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">Die Kollektion</p>
              <h2 className="hero-serif text-3xl md:text-5xl text-foreground font-light">Targeted Formulas</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-4 md:mt-0 font-medium">Alle Produkte werden per Biometrie gematcht.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((p) => (
              <Link key={p.id} to={`/formula/${p.id}`} className="group flex flex-col bg-card/50 rounded-[2rem] border border-border/50 overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow-lg hover:shadow-primary/5">
                <div className="relative aspect-square w-full bg-gray-50 dark:bg-white/5 flex items-center justify-center p-6">
                  {p.image ? (
                    <img src={p.image} alt={p.name.en} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="text-4xl opacity-50">🧴</span>
                  )}
                  {/* Target Vector Badge */}
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-border shadow-sm">
                    <span className="text-[0.6rem] font-bold tracking-widest uppercase text-primary flex items-center gap-1">
                      <Target className="w-3 h-3" /> {AXIS_LABELS[p.targetVector] || "Target"}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-[clamp(0.55rem,1.2vw,0.65rem)] font-bold tracking-widest uppercase text-primary mb-1">{p.brand}</p>
                  <p className="text-[clamp(0.85rem,2vw,1.1rem)] font-semibold text-foreground leading-tight flex-1 group-hover:text-primary transition-colors">
                    {p.name.en}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-muted-foreground">{p.type}</p>
                    <p className="font-display text-[clamp(1.1rem,2.5vw,1.25rem)] font-bold text-foreground">€{p.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          AUTHORITY BADGES + PROGRESS SLIDER (Full Width)
          ═══════════════════════════════════════ */}
      <section className="w-full px-6 md:px-8 lg:px-12 py-16 md:py-32 border-t border-border bg-card/10">
        <div className="w-full mx-auto max-w-7xl">
          {/* Authority badges - Full width grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-20 md:mb-32">
            <AuthorityBadge icon={ShieldCheck} value="83%" label="Diagnostic Confidence" />
            <AuthorityBadge icon={Activity} value="10" label="Clinical Axes" />
            <AuthorityBadge icon={Brain} value="120" label="Validated Markers" />
            <AuthorityBadge icon={PackageCheck} value="5" label="Phase Protocol" />
          </div>

          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="hero-serif text-3xl md:text-6xl text-foreground tracking-tight mb-6">
              Real Results. Visible Progress.
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              See how a clinically matched K-Beauty protocol transforms your skin over time.
            </p>
          </motion.div>

          {/* Progress Slider (Full Width Container) */}
          <ProgressSlider />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          DIAGNOSIS VISUALIZATION
          ═══════════════════════════════════════ */}
      <section className="px-6 md:px-8 lg:px-12 py-16 md:py-32 border-t border-border">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mx-auto mb-8 h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
            <h2 className="hero-serif text-3xl md:text-6xl text-foreground tracking-tight mb-6">
              Diagnosis Meets Beauty.
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              End the cycle of skincare speculation. We curate exactly what your unique skin vector demands.
            </p>
          </motion.div>

          <div className="relative flex flex-col items-center justify-center gap-6 lg:flex-row lg:justify-center lg:gap-8 mx-auto w-full">

            {/* ── Data Pulse Line (Connecting the cards on Desktop) ── */}
            <div className="hidden lg:block absolute top-[40%] left-[45%] right-[45%] h-px z-10 w-[10%] min-w-[80px]">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <motion.div
                className="absolute top-[-1px] left-0 w-8 h-[3px] bg-primary rounded-full shadow-[0_0_12px_rgba(138,154,91,0.9)]"
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Left Card — Data Blueprint (The Input) */}
            <motion.div
              className="relative flex justify-center z-20 w-full lg:w-auto"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative w-full max-w-[420px] mx-auto flex flex-col items-center p-8 md:p-10 bg-card/40 backdrop-blur-md rounded-3xl border border-primary/20 shadow-2xl shadow-[0_0_40px_-10px_rgba(138,154,91,0.15)] group transition-all duration-500 hover:border-primary/40 hover:shadow-primary/20">
                <div
                  className="absolute inset-0 rounded-3xl blur-[40px] opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)" }}
                  aria-hidden="true"
                />
                <div className="relative w-full rounded-[2rem] overflow-hidden border border-border/30 shadow-xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img
                    src="/assets/data-blueprint.png"
                    alt="Abstract topographic wireframe mesh with glowing 10-axis skin vector radar chart"
                    className="w-full h-auto object-cover aspect-square"
                    loading="lazy"
                    fetchPriority="high"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                </div>
                <p className="mt-10 text-center text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
                  10-Axis Skin Vector Analysis
                </p>
              </div>
            </motion.div>

            {/* Right Card — K-Beauty Product Lineup (Solution) */}
            <motion.div
              className="relative flex justify-center z-20 w-full lg:w-auto"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative w-full max-w-[420px] mx-auto flex flex-col items-center p-8 md:p-10 bg-card/40 backdrop-blur-md rounded-3xl border border-primary/20 shadow-2xl shadow-[0_0_40px_-10px_rgba(138,154,91,0.15)] group transition-all duration-500 hover:border-primary/40 hover:shadow-primary/20">
                <div
                  className="absolute inset-0 rounded-3xl blur-[40px] opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)" }}
                  aria-hidden="true"
                />
                <div className="relative w-full rounded-[2rem] overflow-hidden border border-border/30 shadow-xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img
                    src="/assets/kbeauty-lineup.png"
                    alt="Three luxury K-Beauty products — milky toner, golden serum, and rich cream"
                    className="w-full h-auto object-cover aspect-square"
                    loading="lazy"
                  />
                </div>
                <div className="mt-8 flex items-center gap-2">
                  <p className="text-center text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
                    Clinically Matched Formulas
                  </p>
                </div>
                {/* Accuracy Badge */}
                <motion.div
                  className="mt-4 px-4 py-2 bg-primary/10 backdrop-blur-md border border-primary/30 rounded-full shadow-[0_0_15px_rgba(138,154,91,0.15)] flex items-center gap-2"
                  initial={{ y: 10, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">Match: 98.4% Accuracy</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Narrative bridge — minimalist flow */}
          <motion.div
            className="mt-20 flex flex-wrap items-center justify-center gap-3 md:gap-5 text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <span className="text-sm md:text-base font-medium tracking-wide">Diagnosis</span>
            <span className="text-primary text-lg">→</span>
            <span className="text-sm md:text-base font-medium tracking-wide">Your protocol</span>
            <span className="text-primary text-lg">→</span>
            <span className="text-sm md:text-base font-medium tracking-wide text-primary">K-beauty routine</span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          THE SKIN STRATEGY JOURNEY
          ═══════════════════════════════════════ */}
      <section className="px-6 md:px-8 lg:px-12 py-16 md:py-32 bg-card/5 border-t border-border">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            className="mb-24 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mx-auto mb-8 h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
            <h2 className="hero-serif text-3xl md:text-6xl text-foreground tracking-tight mb-6">
              The Skin Strategy Journey
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-3xl mx-auto font-normal">
              A biometrically precise timeline — from intelligent clinical analysis to a vibrant, personalized European-Korean protocol.
            </p>
          </motion.div>
          <div className="space-y-20 md:space-y-32 flex flex-col items-center">
            {journeyItems.map((item, i) => (
              <JourneyCard key={item.num} item={item} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA BAND (Massive)
          ═══════════════════════════════════════ */}
      <section className="relative px-6 md:px-8 lg:px-12 py-24 md:py-48 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: "linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.05) 50%, hsl(var(--primary) / 0.08) 80%, transparent 100%)" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          className="relative text-center w-full max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="hero-serif text-3xl md:text-7xl text-foreground tracking-tight mb-8">
            Ready to decode your skin?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light mb-12">
            No registration · Results in under 6 min · Backed by clinical scales
          </p>
          <div className="flex justify-center">
            <Link
              to="/diagnosis"
              className="hero-serif group inline-flex items-center justify-center gap-4 rounded-full bg-primary px-12 md:px-20 py-6 md:py-8 text-xl md:text-3xl font-bold text-primary-foreground transition-all duration-400 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-2 hover:scale-105 w-full md:w-auto min-h-[48px]"
            >
              Start Free Assessment
              <ArrowRight className="h-8 w-8 transition-transform duration-300 group-hover:translate-x-3" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Expert Seal ─────────────────────── */}
      <ExpertSeal />

      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;