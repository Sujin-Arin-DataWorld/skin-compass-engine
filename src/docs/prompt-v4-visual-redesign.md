# LOVABLE PROMPT — Full Visual Redesign: Logo + Silk Aesthetic + Typography + Route Fix

---

## CRITICAL BUG FIX FIRST (Priority 1)

The Results page code was accidentally placed at the wrong route, causing Category 1–8 diagnosis pages to disappear.

**Fix the router:**

```tsx
// src/App.tsx or src/router.tsx — ensure ALL routes exist:
<Routes>
  <Route path="/"           element={<Index />} />
  <Route path="/diagnosis"  element={<DiagnosisLayout />}>
    <Route index             element={<Navigate to="category/1" />} />
    <Route path="category/1" element={<Category1 />} />
    <Route path="category/2" element={<Category2 />} />
    <Route path="category/3" element={<Category3 />} />
    <Route path="category/4" element={<Category4 />} />
    <Route path="category/5" element={<Category5 />} />
    <Route path="category/6" element={<Category6 />} />
    <Route path="category/7" element={<Category7 />} />
    <Route path="category/8" element={<Category8 />} />
  </Route>
  <Route path="/results"    element={<Results />} />
</Routes>
```

The Results page (5-slide horizontal carousel) lives ONLY at `/results`.
The diagnosis categories live at `/diagnosis/category/1` through `/diagnosis/category/8`.
The homepage (`/`) is `Index.tsx` — do NOT replace it with Results content.

DO NOT delete or modify any existing Category component files.

---

## DESIGN SYSTEM OVERHAUL

### 1. Color Palette — Warm Luxury (Light + Dark)

Replace the current cyan-dominant palette with a **warm champagne gold × dark espresso** system.

```css
/* src/index.css — update :root and .dark */

:root {
  /* Silk / warm cream background */
  --background:        28 20% 97%;        /* #F7F3EF — warm off-white */
  --background-2:      28 18% 93%;        /* slightly deeper cream */
  --foreground:        20 25% 18%;        /* #2E1F14 — dark espresso */

  /* Gold primary */
  --primary:           38 65% 52%;        /* #C99B3A — champagne gold */
  --primary-foreground: 28 20% 97%;

  /* Accents */
  --accent:            20 35% 28%;        /* #5C3418 — warm brown */
  --muted:             28 15% 88%;
  --muted-foreground:  20 15% 48%;
  --border:            28 20% 82%;

  /* Card / glass surfaces */
  --card:              0 0% 100% / 0.7;
  --card-foreground:   20 25% 18%;

  /* Sand gradient token */
  --gradient-start:    38 55% 85%;        /* pale gold */
  --gradient-end:      28 20% 97%;        /* cream */
}

.dark {
  --background:        20 18% 8%;         /* #14100C — near-black espresso */
  --background-2:      20 16% 11%;
  --foreground:        38 30% 90%;        /* warm near-white */

  --primary:           38 55% 62%;        /* lighter gold for dark mode */
  --primary-foreground: 20 18% 8%;

  --accent:            38 40% 45%;
  --muted:             20 14% 16%;
  --muted-foreground:  38 15% 58%;
  --border:            20 15% 20%;

  --card:              20 16% 12% / 0.8;
}
```

### 2. Typography System

```css
/* Google Fonts — add to index.html <head> */
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">

/* In tailwind.config or CSS: */
--font-display: 'Cormorant Garamond', Georgia, serif;   /* headlines */
--font-body:    'DM Sans', system-ui, sans-serif;        /* body/UI */
```

**Type scale (update Tailwind config):**
```js
// tailwind.config.js
fontSize: {
  'display-xl': ['clamp(3rem, 7vw, 6rem)',    { lineHeight: '1.05', letterSpacing: '-0.02em' }],
  'display-lg': ['clamp(2.2rem, 5vw, 4rem)',  { lineHeight: '1.1',  letterSpacing: '-0.015em' }],
  'display-md': ['clamp(1.6rem, 3vw, 2.5rem)', { lineHeight: '1.2' }],
  'body-lg':    ['1.125rem', { lineHeight: '1.7' }],
  'body-md':    ['1rem',     { lineHeight: '1.65' }],
  'label':      ['0.75rem',  { lineHeight: '1.4', letterSpacing: '0.1em' }],
}
```

---

## LOGO INTEGRATION

### Logo Assets

Two logo variants are provided:
- **Light mode logo**: `src/assets/logo-light.png` (dark text on light/transparent bg — use the image with white background)
- **Dark mode logo**: `src/assets/logo-dark.png` (light text on dark bg — use the black background version)

**Upload both images** and save them as:
- `src/assets/logo-light.png`
- `src/assets/logo-dark.png`

### Navbar Logo Component

```tsx
// src/components/Navbar.tsx — replace text logo with image logo

import logoLight from "@/assets/logo-light.png";
import logoDark  from "@/assets/logo-dark.png";

function Logo() {
  return (
    <div className="flex items-center">
      {/* Show dark logo in light mode, light logo in dark mode */}
      <img
        src={logoLight}
        alt="Skin Strategy Lab"
        className="h-9 w-auto dark:hidden"
        loading="eager"
      />
      <img
        src={logoDark}
        alt="Skin Strategy Lab"
        className="h-9 w-auto hidden dark:block"
        loading="eager"
      />
    </div>
  );
}
```

Navbar height: increase to `h-18` (72px) to give the logo more breathing room.

---

## SILK BACKGROUND SYSTEM

### Global Background

The background should feel like **light passing through champagne silk** — subtle shimmer, warm gradients, organic movement.

```css
/* src/index.css — add after :root */

body {
  background-color: hsl(var(--background));
  /* Silk shimmer base */
  background-image:
    radial-gradient(ellipse 80% 50% at 20% 10%,  hsl(38 60% 90% / 0.6) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%,  hsl(28 40% 88% / 0.5) 0%, transparent 55%),
    radial-gradient(ellipse 100% 60% at 50% 50%, hsl(38 30% 95% / 0.3) 0%, transparent 70%);
  background-attachment: fixed;
}

.dark body {
  background-image:
    radial-gradient(ellipse 80% 50% at 15% 10%,  hsl(38 40% 16% / 0.5) 0%, transparent 55%),
    radial-gradient(ellipse 60% 40% at 85% 85%,  hsl(20 30% 12% / 0.6) 0%, transparent 50%),
    radial-gradient(ellipse 100% 60% at 50% 50%, hsl(30 20% 10% / 0.2) 0%, transparent 65%);
}
```

### Animated Silk Shimmer Component

Add to `src/components/SilkBackground.tsx`:

```tsx
import { motion } from "framer-motion";

export default function SilkBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Orb 1 — top left, gold */}
      <motion.div
        className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(38 60% 80% / 0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Orb 2 — bottom right, warm */}
      <motion.div
        className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(28 50% 75% / 0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      {/* Silk diagonal sweep */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, hsl(38 40% 92% / 0.15) 0%, transparent 50%, hsl(20 30% 88% / 0.1) 100%)",
        }}
      />
    </div>
  );
}
```

Add `<SilkBackground />` as the FIRST child of the main `<div>` in `Index.tsx`.
Also add it to `DiagnosisLayout.tsx` and `Results.tsx`.

All content sections must have `relative z-10` to appear above the silk layer.

---

## INDEX.TSX — Full Redesign

Replace `src/pages/Index.tsx` with the following (preserving all logic, updating visuals):

```tsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Scan, Brain, FlaskConical, PackageCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import SilkBackground from "@/components/SilkBackground";

// ── Radar data (unchanged) ────────────────────
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

// ── SkinRadar (unchanged logic, updated colors) ──
// [Keep existing SkinRadar component — update stroke color to hsl(var(--primary))]

// ── Animation variants ───────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.13, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ── Static data (unchanged) ──────────────────
// [proofItems, steps, SCORE_AXES, CLINICAL_AXES — keep exactly as they are]

// ── ScoreBar (unchanged) ─────────────────────

// ── HERO EDITORIAL IMAGE URLS ────────────────
// These are editorial/product photography style images
// Replace with actual hosted images when available
const EDITORIAL_IMAGES = [
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",  // skincare closeup
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80",  // serum drops
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",     // cream texture
];

// ── MAIN PAGE ────────────────────────────────
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

      {/* ── HERO ──────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen items-center px-6 pt-24 pb-16">
        <div className="mx-auto grid max-w-[1200px] w-full gap-16 lg:grid-cols-2 lg:items-center">

          {/* LEFT: Editorial copy */}
          <div className="order-2 lg:order-1">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 font-body text-xs font-medium uppercase tracking-widest text-primary"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Dermatology-Grade K-Beauty
            </motion.div>

            {/* Display headline — use Cormorant Garamond */}
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

            {/* CTA */}
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

            {/* Stats */}
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

          {/* RIGHT: Radar visualization + editorial image collage */}
          <motion.div
            className="relative order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Background glow behind radar */}
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", filter: "blur(40px)" }}
            />

            {/* Radar chart */}
            <div className="relative z-10">
              <SkinRadar />
            </div>

            {/* Floating editorial image — top right */}
            <motion.div
              className="absolute -top-8 -right-4 z-20 hidden lg:block"
              initial={{ opacity: 0, y: 20, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 3 }}
              transition={{ delay: 1.0, duration: 0.7 }}
            >
              <div className="h-32 w-24 overflow-hidden rounded-2xl border border-border/40 shadow-xl">
                <img
                  src={EDITORIAL_IMAGES[1]}
                  alt="Serum texture"
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>

            {/* Floating editorial image — bottom left */}
            <motion.div
              className="absolute -bottom-6 -left-8 z-20 hidden lg:block"
              initial={{ opacity: 0, y: -20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 1.2, duration: 0.7 }}
            >
              <div className="h-28 w-36 overflow-hidden rounded-2xl border border-border/40 shadow-xl">
                <img
                  src={EDITORIAL_IMAGES[2]}
                  alt="Cream texture"
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>

            <p className="absolute -bottom-10 font-body text-[10px] text-muted-foreground tracking-wider text-center w-full">
              Illustrative 8-category skin profile
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
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

      {/* ── EDITORIAL IMAGE BANNER ───────────── */}
      <section className="relative z-10 py-8 overflow-hidden">
        <motion.div
          className="flex gap-4 px-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="h-64 flex-1 overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=900&q=80"
              alt="K-beauty skincare ritual"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="hidden h-64 w-1/3 overflow-hidden rounded-2xl sm:block">
            <img
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80"
              alt="Skincare texture close-up"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="hidden h-64 w-1/4 overflow-hidden rounded-2xl md:block">
            <img
              src="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80"
              alt="Botanical ingredients"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* ── WHY IT WORKS ──────────────────────── */}
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
                <div className="mt-5 inline-flex items-center rounded-full bg-primary/8 px-3 py-1 font-body text-xs font-medium text-primary">
                  {item.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORING SYSTEM ────────────────────── */}
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

      {/* ── HOW IT WORKS ──────────────────────── */}
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
```

---

## ADDITIONAL STYLE RULES

Add to `src/index.css`:

```css
/* Silk card glass effect */
.glass-card {
  background: hsl(var(--card));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.5);
}

/* Gold gradient text */
.text-gradient-gold {
  background: linear-gradient(135deg, hsl(38 65% 45%) 0%, hsl(38 55% 65%) 50%, hsl(38 65% 45%) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Silk shimmer hover on cards */
@keyframes silk-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.silk-shimmer:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, hsl(38 80% 90% / 0.15) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: silk-shimmer 0.8s ease-out;
  border-radius: inherit;
  pointer-events: none;
}
```

---

## SUMMARY OF CHANGES

| File | Action |
|------|--------|
| `src/App.tsx` / router | FIX — restore Category 1–8 routes, Results at `/results` |
| `src/index.css` | UPDATE — new color system, silk background, typography vars |
| `tailwind.config.js` | UPDATE — font families, type scale |
| `src/components/Navbar.tsx` | UPDATE — image logo with light/dark variants |
| `src/components/SilkBackground.tsx` | CREATE — animated silk orbs |
| `src/pages/Index.tsx` | REPLACE — full redesign with new typography + images |
| `src/assets/logo-light.png` | ADD — light mode logo |
| `src/assets/logo-dark.png` | ADD — dark mode logo |
| `index.html` | ADD — Google Fonts link tags |

## DO NOT CHANGE
- All Category 1–8 diagnosis component logic
- DiagnosisContext
- scoring.ts
- Results.tsx slide components
- Footer content
- CookieConsent
