import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Scan, Brain, FlaskConical, PackageCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import SilkBackground from "@/components/SilkBackground";

// ── Radar data ────────────────────────────────
const RADAR_CATEGORIES = [
  { label: "Acne",        value: 0.72 },
  { label: "Oiliness",    value: 0.58 },
  { label: "Dryness",     value: 0.35 },
  { label: "Sensitivity", value: 0.81 },
  { label: "Pigment",     value: 0.45 },
  { label: "Texture",     value: 0.62 },
  { label: "Aging",       value: 0.28 },
  { label: "Barrier",     value: 0.55 },
];

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function SkinRadar() {
  const radarRef = useRef<SVGSVGElement>(null);
  const radarInView = useInView(radarRef, { once: true, margin: "-40px" });

  const cx = 160, cy = 160, maxR = 120;
  const n = RADAR_CATEGORIES.length;
  const angleStep = 360 / n;

  const rings = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = RADAR_CATEGORIES.map((cat, i) =>
    polarToXY(i * angleStep, maxR * cat.value, cx, cy)
  );
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const labels = RADAR_CATEGORIES.map((cat, i) => ({
    ...polarToXY(i * angleStep, maxR + 28, cx, cy),
    label: cat.label,
  }));

  return (
    <motion.svg
      ref={radarRef}
      viewBox="0 0 320 320"
      className="w-full max-w-[340px] h-auto mx-auto"
      initial={{ opacity: 0 }}
      animate={radarInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {rings.map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: n }, (_, i) => {
            const p = polarToXY(i * angleStep, maxR * r, cx, cy);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={r === 1 ? 1 : 0.5}
          opacity={r === 1 ? 0.5 : 0.2}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = polarToXY(i * angleStep, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.25} />;
      })}
      <motion.path
        d={dataPath}
        fill="hsl(var(--primary) / 0.08)"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={radarInView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i} cx={p.x} cy={p.y} r={3}
          fill="hsl(var(--primary))"
          initial={{ scale: 0, opacity: 0 }}
          animate={radarInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.6 + i * 0.06, duration: 0.3 }}
        />
      ))}
      {labels.map((l, i) => (
        <motion.text
          key={i} x={l.x} y={l.y}
          textAnchor="middle" dominantBaseline="central"
          className="fill-muted-foreground"
          fontSize={9} fontFamily="var(--font-body)" fontWeight={400} letterSpacing="0.04em"
          initial={{ opacity: 0 }}
          animate={radarInView ? { opacity: 0.7 } : {}}
          transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
        >
          {l.label}
        </motion.text>
      ))}
      <circle cx={cx} cy={cy} r={2} fill="hsl(var(--primary) / 0.3)" />
    </motion.svg>
  );
}

// ── Animation variants ────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.13, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ── Static data ───────────────────────────────
const proofItems = [
  {
    num: "01",
    title: "Clinical Precision",
    desc: "10-axis scoring system based on IGA, TEWL and MASI clinical scales",
    detail: "120 validated markers",
  },
  {
    num: "02",
    title: "Personalized Protocol",
    desc: "Phase 1–5 routine matched to your unique skin vector, not a generic type",
    detail: "8 distinct skin patterns",
  },
  {
    num: "03",
    title: "Curated K-Beauty",
    desc: "Dermatologist-validated Korean formulas selected for European skin needs",
    detail: "EU-compliant formulas",
  },
];

const steps = [
  { step: "01", title: "Context Setup",    time: "30 sec",       Icon: Scan,          desc: "Age, environment & lifestyle baseline" },
  { step: "02", title: "Symptom Check",    time: "3–5 min",      Icon: Brain,         desc: "120 clinical markers assessed" },
  { step: "03", title: "Instant Analysis", time: "< 3 sec",      Icon: FlaskConical,  desc: "10-axis scoring computed" },
  { step: "04", title: "Your Protocol",    time: "Personalized", Icon: PackageCheck,  desc: "5-phase K-beauty routine" },
];

const SCORE_AXES = [
  { key: "hydration",    label: "Hydration",    value: 78 },
  { key: "barrier",      label: "Barrier",      value: 62 },
  { key: "sensitivity",  label: "Sensitivity",  value: 45 },
  { key: "pigmentation", label: "Pigmentation", value: 55 },
  { key: "sebum",        label: "Sebum",        value: 70 },
];

const CLINICAL_AXES = [
  { axis: "IGA Scale",  desc: "Investigator Global Assessment — standardized severity rating 0–4" },
  { axis: "TEWL Index", desc: "Trans-Epidermal Water Loss — barrier integrity proxy" },
  { axis: "MASI Score", desc: "Melanin Area Severity Index — pigmentation mapping" },
  { axis: "Sebum Rate", desc: "Relative sebum excretion normalized per T/U zone" },
];

const EDITORIAL_IMAGES = [
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
];

// ── ScoreBar ──────────────────────────────────
function ScoreBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="space-y-1">
      <div className="flex justify-between font-body text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : {}}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────
const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="relative min-h-screen bg-background font-body">
      <SilkBackground />
      <Navbar />

      {/* ── HERO ─────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen items-center px-6 pt-24 pb-16">
        <div className="mx-auto grid max-w-[1200px] w-full gap-16 lg:grid-cols-2 lg:items-center">

          {/* LEFT: Editorial copy */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 font-body text-xs font-medium uppercase tracking-widest text-primary"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Dermatology-Grade K-Beauty
            </motion.div>

            <motion.h1
              className="font-display text-display-xl text-foreground leading-[1.02]"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Your Skin,<br />
              <em className="not-italic text-primary">Clinically</em><br />
              Decoded.
            </motion.h1>

            <motion.p
              className="mt-8 max-w-lg font-body text-body-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.7 }}
            >
              A 10-axis dermatology assessment maps your skin with clinical precision.
              We match you to dermatologist-validated Korean formulas — and deliver them to your door.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <Link
                to="/diagnosis"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-10 py-4 font-body text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
              >
                Begin Your Assessment
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <span className="font-body text-sm text-muted-foreground">Free · 6 minutes · No account</span>
            </motion.div>

            <motion.div
              className="mt-12 flex items-center gap-10 border-t border-border/50 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {[
                { val: "120", lbl: "Clinical markers" },
                { val: "8",   lbl: "Skin patterns" },
                { val: "5",   lbl: "Protocol phases" },
              ].map((stat) => (
                <div key={stat.lbl}>
                  <p className="font-display text-display-md text-foreground">{stat.val}</p>
                  <p className="font-body text-label uppercase tracking-widest text-muted-foreground">{stat.lbl}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Radar + editorial images */}
          <motion.div
            className="relative order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", filter: "blur(40px)" }}
            />

            <div className="relative z-10">
              <SkinRadar />
            </div>

            <motion.div
              className="absolute -top-8 -right-4 z-20 hidden lg:block"
              initial={{ opacity: 0, y: 20, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 3 }}
              transition={{ delay: 1.0, duration: 0.7 }}
            >
              <div className="h-32 w-24 overflow-hidden rounded-2xl border border-border/40 shadow-xl">
                <img src={EDITORIAL_IMAGES[1]} alt="Serum texture" className="h-full w-full object-cover" loading="lazy" />
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-8 z-20 hidden lg:block"
              initial={{ opacity: 0, y: -20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 1.2, duration: 0.7 }}
            >
              <div className="h-28 w-36 overflow-hidden rounded-2xl border border-border/40 shadow-xl">
                <img src={EDITORIAL_IMAGES[2]} alt="Cream texture" className="h-full w-full object-cover" loading="lazy" />
              </div>
            </motion.div>

            <p className="absolute -bottom-10 font-body text-[10px] text-muted-foreground tracking-wider text-center w-full">
              Illustrative 8-category skin profile
            </p>
          </motion.div>
        </div>

        <AnimatePresence>
          {!scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.8 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/50"
              aria-hidden="true"
            >
              <span className="font-body text-label uppercase tracking-widest">Scroll</span>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── EDITORIAL IMAGE BANNER ─────────── */}
      <section className="relative z-10 py-8 overflow-hidden">
        <motion.div
          className="flex gap-4 px-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="h-64 flex-1 overflow-hidden rounded-2xl">
            <img src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=900&q=80" alt="K-beauty skincare ritual" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="hidden h-64 w-1/3 overflow-hidden rounded-2xl sm:block">
            <img src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80" alt="Skincare texture close-up" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="hidden h-64 w-1/4 overflow-hidden rounded-2xl md:block">
            <img src="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80" alt="Botanical ingredients" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </motion.div>
      </section>

      {/* ── WHY IT WORKS ──────────────────── */}
      <section className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-[1100px]">
          <motion.div
            className="mb-16 max-w-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={fadeUp}
            custom={0}
          >
            <span className="font-body text-label uppercase tracking-widest text-primary">The Method</span>
            <h2 className="mt-3 font-display text-display-lg text-foreground">Why It Works</h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {proofItems.map((item, i) => (
              <motion.div
                key={item.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="font-body text-label font-medium text-primary">{item.num}</span>
                <h3 className="mt-3 font-display text-display-md text-foreground">{item.title}</h3>
                <p className="mt-3 font-body text-body-md leading-relaxed text-muted-foreground">{item.desc}</p>
                <div className="mt-5 inline-flex items-center rounded-full bg-primary/5 px-3 py-1 font-body text-xs font-medium text-primary">
                  {item.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORING SYSTEM ────────────────── */}
      <section className="relative z-10 border-t border-border/30 px-6 py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={0}
            >
              <span className="font-body text-label uppercase tracking-widest text-primary">Scoring System</span>
              <h2 className="mt-3 font-display text-display-lg text-foreground">10-Axis Skin Vector</h2>
              <p className="mt-5 font-body text-body-lg leading-relaxed text-muted-foreground">
                Every assessment generates a unique 10-dimensional vector across clinically validated axes.
                Your protocol is computed from the full vector — not a single bucket or type.
              </p>

              <div className="mt-10 space-y-4">
                {CLINICAL_AXES.map((item, i) => (
                  <motion.div
                    key={item.axis}
                    custom={i + 1}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-20px" }}
                    variants={fadeUp}
                    className="border-l-2 border-primary/40 pl-5"
                  >
                    <p className="font-body text-base font-medium text-foreground">{item.axis}</p>
                    <p className="mt-0.5 font-body text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={1}
              className="rounded-2xl border border-border/40 bg-card/60 p-8 backdrop-blur-sm"
            >
              <p className="mb-6 font-body text-label uppercase tracking-widest text-muted-foreground">
                Sample output — illustrative
              </p>
              <div className="space-y-5">
                {SCORE_AXES.map((axis, i) => (
                  <ScoreBar key={axis.key} label={axis.label} value={axis.value} delay={i * 0.1} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────── */}
      <section className="relative z-10 border-t border-border/30 px-6 py-28">
        <div className="mx-auto max-w-[1100px]">
          <motion.div
            className="mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-display-lg text-foreground">How It Works</h2>
            <p className="mt-3 font-body text-body-lg text-muted-foreground">
              Four steps. Under 6 minutes. Clinically grounded results.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                tabIndex={0}
                className="group rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <span className="font-body text-label uppercase tracking-widest text-primary">Step {s.step}</span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <s.Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 font-display text-xl text-foreground">{s.title}</h4>
                <p className="mt-2 font-body text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-4 inline-flex items-center rounded-full border border-border/60 px-3 py-1 font-body text-xs text-muted-foreground">
                  {s.time}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            className="mt-20 flex flex-col items-center gap-4 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={fadeUp}
            custom={4}
          >
            <Link
              to="/diagnosis"
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-12 py-5 font-body text-lg font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
            >
              Start Free Assessment
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <p className="font-body text-sm text-muted-foreground">
              No registration · Results in under 6 min · Backed by clinical scales
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
