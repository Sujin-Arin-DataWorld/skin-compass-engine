import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence, animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { ArrowRight, ChevronDown, Scan, Brain, FlaskConical, PackageCheck, Sparkles, ShieldCheck, Activity, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { useProductStore } from "@/store/productStore";
import { AXIS_LABELS } from "@/engine/types";
import { useI18nStore, translations } from "@/store/i18nStore";

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
const getFaceMarkers = (t: any) => [
  { label: t.markers.sebum, value: 70, top: "22%", left: "35%", color: "hsl(43 70% 50%)" },
  { label: t.markers.aging, value: 28, top: "17%", left: "55%", color: "hsl(270 30% 55%)" },
  { label: t.markers.hydration, value: 78, top: "25%", left: "52%", color: "hsl(200 65% 50%)" },
  { label: t.markers.pigment, value: 55, top: "32%", right: "38%", color: "hsl(28 55% 50%)" },
  { label: t.markers.sensitivity, value: 45, top: "40%", left: "50%", color: "hsl(8 50% 55%)" },
  { label: t.markers.texture, value: 81, top: "50%", right: "55%", color: "hsl(160 40% 45%)" },
  { label: t.markers.barrier, value: 62, top: "63%", left: "60%", color: "hsl(38 60% 50%)" },
  { label: t.markers.aging, value: 73, top: "75%", left: "55%", color: "hsl(145 50% 45%)" },  // Elasticity in the mockup
];

// ─────────────────────────────────────────────
// Static data
const getJourneyItems = (t: any) => [
  {
    num: "01",
    title: t.index.journey[0].title,
    subtitle: t.index.journey[0].subtitle,
    desc: t.index.journey[0].desc,
    accent: t.index.journey[0].accent,
    icon: Scan
  },
  {
    num: "02",
    title: t.index.journey[1].title,
    subtitle: t.index.journey[1].subtitle,
    desc: t.index.journey[1].desc,
    accent: t.index.journey[1].accent,
    icon: Brain
  },
  {
    num: "03",
    title: t.index.journey[2].title,
    subtitle: t.index.journey[2].subtitle,
    desc: t.index.journey[2].desc,
    accent: t.index.journey[2].accent,
    icon: FlaskConical
  },
  {
    num: "04",
    title: t.index.journey[3].title,
    subtitle: t.index.journey[3].subtitle,
    desc: t.index.journey[3].desc,
    accent: t.index.journey[3].accent,
    icon: PackageCheck
  }
];

// ─────────────────────────────────────────────
// FaceMarker — persistent floating data tag
// ─────────────────────────────────────────────
function FaceMarker({ marker, isVisible, isActive }: { marker: any; isVisible: boolean; isActive: boolean }) {
  const isLeft = marker.left !== undefined;

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{
        top: marker.top,
        ...(isLeft ? { left: marker.left } : { right: (marker as any).right }),
      }}
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isVisible && (
        <div className={`flex items-center gap-0 ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
          {/* Crosshair target */}
          <motion.div
            className="relative w-5 h-5 flex items-center justify-center shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0.5, 1, 0.8] }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Focus square */}
            <div className={`absolute inset-0 border rounded-[2px] transition-colors duration-500 ${isActive ? 'border-[#D4AF37]/80' : 'border-[#947E5C]/60'} dark:border-[#F1E9DA]/50`} />
            {/* Crosshair lines */}
            <div className={`absolute w-full h-[0.5px] transition-colors duration-500 ${isActive ? 'bg-[#D4AF37]' : 'bg-[#947E5C]/70'} dark:bg-[#F1E9DA]/60`} />
            <div className={`absolute h-full w-[0.5px] transition-colors duration-500 ${isActive ? 'bg-[#D4AF37]' : 'bg-[#947E5C]/70'} dark:bg-[#F1E9DA]/60`} />
            {/* Center dot — pulsing glow */}
            <motion.div
              className={`w-[3px] h-[3px] rounded-full transition-colors duration-500 ${isActive ? 'bg-[#D4AF37]' : 'bg-[#947E5C]'} dark:bg-[#F1E9DA]`}
              animate={{ boxShadow: isActive ? ["0 0 6px rgba(212,175,55,0.6)", "0 0 12px rgba(212,175,55,1)", "0 0 6px rgba(212,175,55,0.6)"] : ["0 0 4px rgba(148,126,92,0.5)", "0 0 10px rgba(148,126,92,0.9)", "0 0 4px rgba(148,126,92,0.5)"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Hairline connector */}
          <motion.div
            className={`h-[0.5px] ${isLeft ? "bg-gradient-to-r" : "bg-gradient-to-l"} from-[#947E5C] to-[#947E5C]/10 dark:from-[#F1E9DA]/60 dark:to-[#F1E9DA]/15`}
            style={{ width: "28px" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />

          {/* Label text — immediate fade-in upon crossing */}
          <motion.div
            className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          >
            <span className={`radar-label text-[#947E5C] dark:text-[#F1E9DA] ${isLeft ? 'ml-1.5' : 'mr-1.5'}`}>{marker.label}</span>
            <span className={`radar-value text-[#947E5C] dark:text-[#F1E9DA] ${isLeft ? 'mr-1.5' : 'ml-1.5'}`}>{marker.value}</span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ScanBeam — Dynamic X/Y Radar Scanner
// ─────────────────────────────────────────────
function ScanBeam({ scanX, scanY, t }: { scanX: any; scanY: any; t: any }) {
  const leftPos = useTransform(scanX, v => `${v}%`);
  const topPos = useTransform(scanY, v => `${v}%`);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
      {/* Primary vertical scan beam */}
      <motion.div
        className="absolute top-0 bottom-0 w-[0.7px] will-change-transform"
        style={{
          left: leftPos,
          background: "linear-gradient(180deg, transparent 0%, rgba(151,169,124,0.9) 25%, rgba(151,169,124,1) 50%, rgba(151,169,124,0.9) 75%, transparent 100%)",
          filter: "drop-shadow(0 0 6px rgba(151,169,124,0.9))"
        }}
      />

      {/* Horizontal scan sweep */}
      <motion.div
        className="absolute left-0 right-0 h-[0.7px] will-change-transform"
        style={{
          top: topPos,
          background: "linear-gradient(90deg, transparent 0%, rgba(151,169,124,0.8) 15%, rgba(151,169,124,1) 50%, rgba(151,169,124,0.8) 85%, transparent 100%)",
          filter: "drop-shadow(0 0 6px rgba(151,169,124,0.9))"
        }}
      />

      {/* Status indicator — bottom left */}
      <motion.div
        className="absolute bottom-5 left-5 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#97A97C]" />
        <span className="text-[9px] font-mono tracking-[0.2em] text-[#97A97C] font-bold uppercase">
          {t.index.targeting}
        </span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ScannerOverlay — Coordinates animation sync
// ─────────────────────────────────────────────
function ScannerOverlay() {
  const scanX = useMotionValue(50);
  const scanY = useMotionValue(0);
  const [activeMarkerIndex, setActiveMarkerIndex] = useState(-1);
  const { language } = useI18nStore();
  const t = translations[language];

  const markers = getFaceMarkers(t);

  useEffect(() => {
    let isCancelled = false;

    const runSequence = async () => {
      while (!isCancelled) {
        // Reset and wait before starting cycle
        setActiveMarkerIndex(-1);
        await new Promise(r => setTimeout(r, 500));

        for (let i = 0; i < markers.length; i++) {
          if (isCancelled) return;
          const marker = markers[i];
          const targetX = marker.left ? parseFloat(marker.left) : (100 - parseFloat((marker as any).right || "0"));
          const targetY = parseFloat(marker.top);

          // Animate beam to target point (duration 600ms)
          const durationMs = 600;
          animate(scanX, targetX, { duration: durationMs / 1000, ease: "easeInOut" });
          animate(scanY, targetY, { duration: durationMs / 1000, ease: "easeInOut" });

          await new Promise(r => setTimeout(r, durationMs));

          if (isCancelled) return;

          // Trigger marker entrance and hold focus for 1s
          setActiveMarkerIndex(i);
          await new Promise(r => setTimeout(r, 1000));
        }

        if (isCancelled) return;
        // Pause 3 seconds when all 8 are visible
        await new Promise(r => setTimeout(r, 3000));

        // Return beam to neutral quickly to restart
        if (isCancelled) return;
        animate(scanX, 50, { duration: 0.8, ease: "easeInOut" });
        animate(scanY, 0, { duration: 0.8, ease: "easeInOut" });
      }
    };

    runSequence();

    return () => {
      isCancelled = true;
    };
  }, [scanX, scanY]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <ScanBeam scanX={scanX} scanY={scanY} t={t} />
      {markers.map((marker, idx) => (
        <FaceMarker
          key={idx}
          marker={marker}
          isVisible={idx <= activeMarkerIndex}
          isActive={idx === activeMarkerIndex}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RadarChartMockup (Abstract Biometric Dashboard)
// ─────────────────────────────────────────────
function RadarChartMockup({ t }: { t: any }) {
  return (
    <div className="relative w-full aspect-[4/5] bg-card/10 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden border border-border/10 shadow-inner z-10 transition-transform duration-500 group-hover:scale-[1.02]">
      {/* Brand header */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-primary">
        <Activity className="w-5 h-5" />
        <span className="text-xs font-bold tracking-widest uppercase">{t.index.radarBrand}</span>
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
        <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] text-primary font-mono tracking-widest uppercase">{t.index.scanInProgress}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BespokeProductMockup
// ─────────────────────────────────────────────
function BespokeProductMockup({ t }: { t: any }) {
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
        <span className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">{t.index.matchAccuracy}</span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProgressSlider – 2 Weeks vs 6 Weeks
// ─────────────────────────────────────────────
function ProgressSlider({ t }: { t: any }) {
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
              {t.index.progress.week6Improvement}
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
        <div className="absolute top-4 left-4 md:top-5 md:left-5 bg-primary/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30 shadow-md shadow-black/10 z-10 w-max">
          <span className="text-[0.65rem] md:text-[0.75rem] font-['DM_Sans',_'Space_Grotesk',_system-ui,_sans-serif] font-bold uppercase tracking-[0.08em] text-primary-foreground">
            {t.index.progress.week2}
          </span>
        </div>
        <div className="absolute top-4 right-4 md:top-5 md:right-5 bg-primary/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30 shadow-md shadow-black/10 z-10 w-max">
          <span className="text-[0.65rem] md:text-[0.75rem] font-['DM_Sans',_'Space_Grotesk',_system-ui,_sans-serif] font-bold uppercase tracking-[0.08em] text-primary-foreground">
            {t.index.progress.week6}
          </span>
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
          {t.index.progress.dragToCompare}
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
function JourneyCard({ item, i }: { item: ReturnType<typeof getJourneyItems>[0]; i: number }) {
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
function ExpertSeal({ t }: { t: any }) {
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
            {t.index.expertSealTitle}
          </p>
          <Activity className="h-8 w-8 text-primary/70" />
        </div>
        <p className="text-[11px] md:text-sm text-muted-foreground tracking-[0.2em] font-bold mt-2 uppercase">
          {t.index.expertSealSub}
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

  const { language } = useI18nStore();
  const t = translations[language];

  // Rest of Index function ...

  const progressLabels = [
    t.index.initializing,
    t.index.scanningSebum,
    t.index.checkingHydration,
    t.index.analyzingTexture,
    t.index.evaluatingBarrier,
    t.index.measuringElasticity,
    t.index.detectingPigment,
    t.index.assessingAging,
    t.index.analysisComplete
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
                <ScannerOverlay />
                <div className="absolute inset-x-6 md:inset-x-12 bottom-32 md:bottom-24 z-20 flex flex-col justify-end">
                  <h1 className="hero-serif text-5xl md:text-7xl lg:text-8xl text-[#001A33] dark:text-[#FFFFFF] drop-shadow-lg tracking-tight font-light mb-4 transition-colors duration-300" dangerouslySetInnerHTML={{ __html: t.heroTitle }} />
                  <p className="text-lg md:text-2xl text-[#1A1A1A] dark:text-white/90 drop-shadow-md max-w-xl font-light leading-snug transition-colors duration-300">
                    {t.heroSlogan}
                  </p>
                  <Link
                    to="/diagnosis"
                    className="mt-8 inline-flex items-center justify-center gap-4 rounded-full bg-primary/90 text-primary-foreground px-8 py-4 text-sm md:text-base font-bold tracking-widest uppercase hover:bg-primary transition-colors w-max backdrop-blur-md border border-white/20"
                  >
                    {t.startAnalysis}
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
                  <h1 className="hero-serif text-4xl md:text-6xl text-foreground tracking-tight font-light mb-4" dangerouslySetInnerHTML={{ __html: t.steps.step1 }} />
                  <p className="text-base md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    {t.steps.step1Desc}
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
                    <h1 className="hero-serif text-4xl md:text-6xl lg:text-7xl text-foreground tracking-tight font-light mb-4" dangerouslySetInnerHTML={{ __html: t.index.kitTitle }}></h1>
                    <p className="text-base md:text-xl text-muted-foreground leading-relaxed mb-6 md:mb-0">
                      {t.index.kitSub}
                    </p>
                  </div>
                  <Link
                    to="/diagnosis"
                    className="hidden md:inline-flex items-center justify-center gap-4 rounded-full bg-foreground text-background px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-foreground/90 transition-colors shrink-0"
                  >
                    {t.index.exploreKit}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Slider Elements */}
        <div className="absolute bottom-10 right-6 md:right-12 z-30 flex items-center gap-6">
          {/* Pagination */}
          <div className="text-[#1A1A1A] dark:text-white/90 font-mono text-sm tracking-widest transition-colors duration-300">
            0{currentSlide + 1} / 03
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? 2 : prev - 1))}
              className="w-10 h-10 rounded-full border border-[#1A1A1A]/30 dark:border-white/30 flex items-center justify-center text-[#1A1A1A] dark:text-white hover:bg-[#1A1A1A]/10 dark:hover:bg-white/10 transition-colors duration-300"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1))}
              className="w-10 h-10 rounded-full border border-[#1A1A1A]/30 dark:border-white/30 flex items-center justify-center text-[#1A1A1A] dark:text-white hover:bg-[#1A1A1A]/10 dark:hover:bg-white/10 transition-colors duration-300"
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
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">{t.index.collection}</p>
              <h2 className="hero-serif text-3xl md:text-5xl text-foreground font-light">{t.index.targetedFormulas}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-4 md:mt-0 font-medium">{t.index.collectionSub}</p>
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
                    {p.name[language as "en" | "de"]}
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
            <AuthorityBadge icon={ShieldCheck} value="83%" label={t.index.authority.confidence} />
            <AuthorityBadge icon={Activity} value="10" label={t.index.authority.axes} />
            <AuthorityBadge icon={Brain} value="120" label={t.index.authority.markers} />
            <AuthorityBadge icon={PackageCheck} value="5" label={t.index.authority.phase} />
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
              {t.index.authority.realResults}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              {t.index.authority.realResultsSub}
            </p>
          </motion.div>

          {/* Progress Slider (Full Width Container) */}
          <ProgressSlider t={t} />
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
            <div className="mx-auto mb-8 h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
            <h2 className="hero-serif text-3xl md:text-6xl text-foreground tracking-tight mb-6">
              {t.index.diagnosisMeets}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
              {t.index.diagnosisMeetsSub}
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
                  {t.index.tenAxisAnalysis}
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
                    {t.index.clinicallyMatched}
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
            <span className="text-sm md:text-base font-medium tracking-wide">{t.index.flow.diagnosis}</span>
            <span className="text-primary text-lg">→</span>
            <span className="text-sm md:text-base font-medium tracking-wide">{t.index.flow.protocol}</span>
            <span className="text-primary text-lg">→</span>
            <span className="text-sm md:text-base font-medium tracking-wide text-primary">{t.index.flow.routine}</span>
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
              {t.index.journeyTitle}
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-3xl mx-auto font-normal">
              {t.index.journeySub}
            </p>
          </motion.div>
          <div className="space-y-20 md:space-y-32 flex flex-col items-center">
            {getJourneyItems(t).map((item, i) => (
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
            {t.index.readyTitle}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light mb-12">
            {t.index.readySub}
          </p>
          <div className="flex justify-center">
            <Link
              to="/diagnosis"
              className="hero-serif group inline-flex items-center justify-center gap-4 rounded-full bg-primary px-12 md:px-20 py-6 md:py-8 text-xl md:text-3xl font-bold text-primary-foreground transition-all duration-400 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-2 hover:scale-105 w-full md:w-auto min-h-[48px]"
            >
              {t.index.startFree}
              <ArrowRight className="h-8 w-8 transition-transform duration-300 group-hover:translate-x-3" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Expert Seal ─────────────────────── */}
      <ExpertSeal t={t} />

      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;