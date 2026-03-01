import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Scan, Brain, FlaskConical, PackageCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import heroImage from "@/assets/hero-skin-texture.webp";

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// ScoreBar
// ─────────────────────────────────────────────
function ScoreBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="space-y-1">
      <div className="flex justify-between text-xs">
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

// ─────────────────────────────────────────────
// SkinScoreCard
// ─────────────────────────────────────────────
function SkinScoreCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:bottom-8 md:w-56 rounded-xl border border-border/60 bg-card/90 backdrop-blur-md p-4 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] font-medium uppercase tracking-widest text-primary mb-3">
            Sample Score Profile
          </p>
          <div className="space-y-2.5">
            {SCORE_AXES.map((axis, i) => (
              <ScoreBar key={axis.key} label={axis.label} value={axis.value} delay={i * 0.1} />
            ))}
          </div>
          <p className="mt-3 text-[9px] text-muted-foreground text-center">
            Illustrative only — your results will differ
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// ProofCard
// ─────────────────────────────────────────────
function ProofCard({ item, i }: { item: (typeof proofItems)[0]; i: number }) {
  const [active, setActive] = useState(false);

  return (
    <motion.div
      custom={i}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      tabIndex={0}
      role="article"
      className="group relative overflow-hidden rounded-xl border border-border/40 p-6 transition-colors duration-200 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <div className="relative">
        <span className="text-sm font-medium text-primary">{item.num}</span>
        <h3 className="mt-2 font-display text-2xl text-foreground">{item.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
        <motion.p
          className="mt-2 text-xs text-primary/80"
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
          transition={{ duration: 0.2 }}
        >
          {item.detail}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// StepCard
// ─────────────────────────────────────────────
function StepCard({ s, i }: { s: (typeof steps)[0]; i: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      custom={i}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      role="article"
      aria-label={`Step ${s.step}: ${s.title}`}
      className="group relative rounded-xl border border-border/50 p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
        Step {s.step}
      </span>

      <div className="mt-3 mb-3">
        <s.Icon className={`h-6 w-6 transition-colors duration-200 ${hovered ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      <h4 className="font-display text-lg text-foreground">{s.title}</h4>

      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        {s.desc}
      </p>

      <div className="mt-3 text-xs font-medium text-primary/80">
        {s.time}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ────────────────────────────── */}
      <section className="relative flex min-h-screen items-center px-6 pt-20 overflow-hidden">
        <div className="mx-auto grid max-w-[1100px] w-full gap-12 md:grid-cols-2 md:items-center">

          {/* Left: copy */}
          <div className="relative z-10 order-2 md:order-1">
            {/* Eyebrow badge */}
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FlaskConical className="h-3 w-3" />
              Dermatology-Grade AI Assessment
            </motion.div>

            <motion.h1
              className="font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Your Skin.<br />
              <span className="text-gradient-sand">Clinically Decoded.</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-md text-lg text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              A dermatology-grade skin assessment.<br />
              Personalized K-beauty protocols.<br />
              Delivered to your door.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Link
                to="/diagnosis"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all glow-cyan hover:opacity-90"
              >
                Begin Your Skin Assessment
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="text-xs text-muted-foreground">Free · No account needed</span>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="mt-10 flex gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {[
                { val: "120", lbl: "clinical markers" },
                { val: "8",   lbl: "skin patterns" },
                { val: "5",   lbl: "phase protocol" },
              ].map((stat) => (
                <div key={stat.lbl} className="text-center">
                  <p className="font-display text-2xl text-foreground">{stat.val}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.lbl}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: hero image + score card */}
          <motion.div
            className="relative order-1 md:order-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={heroImage}
                alt="Abstract skin surface analysis — clinical macro texture with data overlay"
                className="w-full h-auto object-cover opacity-[0.88]"
                loading="eager"
                width={1920}
                height={1080}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent md:bg-gradient-to-l md:from-background/60 md:via-transparent md:to-transparent" />
            </div>

            <SkinScoreCard />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {!scrolled && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-[10px] uppercase tracking-widest">Scroll</span>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Why It Works ────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[960px]">
          <motion.h2
            className="font-display text-3xl text-foreground mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            Why It Works
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {proofItems.map((item, i) => (
              <ProofCard key={item.num} item={item} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Scoring System Explainer ─────────── */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-[960px]">
          <motion.div
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <span className="text-xs font-medium uppercase tracking-widest text-primary">
              Scoring System
            </span>
            <h2 className="mt-2 font-display text-3xl text-foreground">
              10-Axis Skin Vector
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every assessment generates a unique 10-dimensional vector across clinically validated
              axes. Your protocol is computed from the full vector — not a single bucket or type.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Animated score bars */}
            <div className="rounded-xl border border-border/40 p-6">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Sample output — illustrative
              </p>
              <div className="space-y-3">
                {SCORE_AXES.map((axis, i) => (
                  <ScoreBar key={axis.key} label={axis.label} value={axis.value} delay={i * 0.1} />
                ))}
              </div>
            </div>

            {/* Clinical axis descriptions */}
            <div className="space-y-4">
              {CLINICAL_AXES.map((item, i) => (
                <motion.div key={item.axis} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <h4 className="text-sm font-medium text-foreground">{item.axis}</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────── */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-[960px]">
          <motion.div
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <h2 className="font-display text-3xl text-foreground">
              How It Works
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Four steps. Under 6 minutes. Clinically grounded results.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {steps.map((s, i) => (
              <StepCard key={s.step} s={s} i={i} />
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div className="mt-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
            <Link
              to="/diagnosis"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all glow-cyan hover:opacity-90"
            >
              Start Free Assessment
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
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
