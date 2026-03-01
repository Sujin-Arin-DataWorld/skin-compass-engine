# LOVABLE PROMPT — Results Page: Horizontal Slide Redesign (5 Slides)

---

## CONTEXT

After completing all 8 diagnosis categories, the user lands on `/results`.
Currently this is one long vertical scroll page.

**Replace it entirely** with a **full-screen horizontal slide carousel** — 5 slides, each occupying 100vw × 100vh (minus navbar).

Dark theme, cyan primary (`#22d3ee`), amber accent (`#fbbf24`). Match existing design language.

---

## ARCHITECTURE OVERVIEW

```
Slide 1: SKIN PATTERN REVEAL      — emotional hook, identity reveal
Slide 2: AXIS BREAKDOWN           — radar chart + score bars
Slide 3: WHY THESE PRODUCTS WORK  — science-linked persuasion per axis
Slide 4: YOUR 5-PHASE PROTOCOL    — routine steps with product cards
Slide 5: SUBSCRIBE & DELIVER      — conversion CTA
```

Navigation:
- Swipe left/right (touch + mouse drag via Framer Motion `drag`)
- Arrow buttons left/right (desktop)
- Dot indicators at bottom (5 dots)
- Keyboard: ← → arrow keys
- No looping — first/last slide locks

---

## SLIDE CONTAINER COMPONENT

Create `src/pages/Results.tsx` (replace existing):

```tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { computeSkinScore, mapScoreToProtocolPriorities } from "@/lib/scoring";
import SlidePatternReveal  from "@/components/results/SlidePatternReveal";
import SlideAxisBreakdown  from "@/components/results/SlideAxisBreakdown";
import SlideWhyItWorks     from "@/components/results/SlideWhyItWorks";
import SlideProtocol       from "@/components/results/SlideProtocol";
import SlideSubscribe      from "@/components/results/SlideSubscribe";
import SlideNav            from "@/components/results/SlideNav";

const SLIDES = [
  SlidePatternReveal,
  SlideAxisBreakdown,
  SlideWhyItWorks,
  SlideProtocol,
  SlideSubscribe,
];

const SLIDE_LABELS = [
  "Your Pattern",
  "Skin Profile",
  "Why It Works",
  "Protocol",
  "Get Started",
];

export default function Results() {
  const { answers } = useDiagnosis();
  const score    = computeSkinScore(answers);
  const priorities = mapScoreToProtocolPriorities(score);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= SLIDES.length) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft")  goTo(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, goTo]);

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const SlideComponent = SLIDES[current];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goTo(current + 1);
            if (info.offset.x >  60) goTo(current - 1);
          }}
          className="absolute inset-0 flex flex-col"
        >
          <SlideComponent score={score} answers={answers} priorities={priorities} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation overlay */}
      <SlideNav
        current={current}
        total={SLIDES.length}
        labels={SLIDE_LABELS}
        onPrev={() => goTo(current - 1)}
        onNext={() => goTo(current + 1)}
      />
    </div>
  );
}
```

---

## SLIDE 1 — Skin Pattern Reveal

File: `src/components/results/SlidePatternReveal.tsx`

```tsx
// Dramatic reveal of the user's "skin identity"
// Derives pattern name from top 2 scoring axes

function derivePatternName(score: SkinScore): {
  name: string;
  tagline: string;
  color: string;
  icon: string;
} {
  // Find top 2 axes
  const axes = Object.entries(score)
    .filter(([k]) => k !== "confidence")
    .sort(([,a],[,b]) => (b as number) - (a as number));
  const [top1] = axes;

  const patterns: Record<string, { name: string; tagline: string; color: string; icon: string }> = {
    acne:         { name: "The Reactive Combatant",  tagline: "Your skin fights back — and needs a peace treaty", color: "#f87171", icon: "🔴" },
    hormonal:     { name: "The Cycle Responder",     tagline: "Your skin moves with your body's rhythms",          color: "#c084fc", icon: "🌙" },
    sensitivity:  { name: "The Hyper-Aware",         tagline: "Finely tuned — but easily overwhelmed",            color: "#fb923c", icon: "⚡" },
    redness:      { name: "The Flushed Reactor",     tagline: "Vascular hyperreactivity at the surface",          color: "#f97316", icon: "🌡" },
    barrier:      { name: "The Compromised Shield",  tagline: "Your barrier needs rebuilding from the inside out", color: "#22d3ee", icon: "🛡" },
    hydration:    { name: "The Thirsty Skin",        tagline: "Depleted reservoirs beneath the surface",          color: "#38bdf8", icon: "💧" },
    sebum:        { name: "The Overproducer",        tagline: "Excess sebum masking an underlying dehydration",   color: "#fbbf24", icon: "✨" },
    pigmentation: { name: "The Memory Keeper",       tagline: "Your skin holds onto every story — literally",     color: "#a78bfa", icon: "🌑" },
    aging:        { name: "The Time Traveller",      tagline: "Collagen loss ahead of the curve — correctable",   color: "#6ee7b7", icon: "⏳" },
    lifestyle:    { name: "The Stress Carrier",      tagline: "Your skin is a readout of your nervous system",    color: "#94a3b8", icon: "🌪" },
  };

  return patterns[top1[0]] ?? patterns["barrier"];
}
```

**Layout:**

```
┌────────────────────────────────────────────┐
│                                            │
│   [CATEGORY 8 OF 8 COMPLETE] ← small tag  │
│                                            │
│           🔴                               │
│    ← icon animates in with scale+blur      │
│                                            │
│   ┌──────────────────────────────────┐     │
│   │  YOUR SKIN PATTERN               │     │
│   │                                  │     │
│   │  The Reactive                    │     │
│   │  Combatant          ← word by    │     │
│   │                       word reveal│     │
│   └──────────────────────────────────┘     │
│                                            │
│   "Your skin fights back — and needs       │
│    a peace treaty"                         │
│                                            │
│   ────────────────────────────────         │
│                                            │
│   TOP 3 SIGNALS:                           │
│   ● Acne 78/100   ● Hormonal 65/100        │
│   ● Barrier 60/100                         │
│                                            │
│   [→ See Full Profile]    swipe hint →     │
│                                            │
└────────────────────────────────────────────┘
```

**Animations:**
- Staggered reveal: icon (0ms) → pattern label (400ms) → name (700ms) → tagline (1000ms) → signals (1300ms) → CTA (1600ms)
- Name reveals word by word using `split(" ").map()` with staggered `motion.span`
- Background: subtle radial gradient matching pattern color at 8% opacity

---

## SLIDE 2 — Axis Breakdown

File: `src/components/results/SlideAxisBreakdown.tsx`

**Layout:**

```
┌─────────────────────────────────────────────┐
│  YOUR SKIN PROFILE          confidence: 84% │
│                                             │
│  ┌──── Radar Chart ────┐  ┌─── Score Bars ─┐│
│  │   SVG radar of      │  │ Hydration   72 ││
│  │   all 10 axes       │  │ ███████░░░     ││
│  │   Animated draw-in  │  │ Barrier     58 ││
│  │   on slide enter    │  │ █████░░░░░     ││
│  │                     │  │ Acne        81 ││
│  │                     │  │ ████████░░     ││
│  └─────────────────────┘  │ ... (all 10)   ││
│                           └────────────────┘│
│                                             │
│  WHAT THIS MEANS:                           │
│  Short plain-English interpretation of the  │
│  top 3 axes in 1 sentence each              │
│                                             │
└─────────────────────────────────────────────┘
```

**Radar chart spec:**
```tsx
// SVG radar chart — 10 axes, evenly spaced (36° apart)
// Axes: hydration, barrier, acne, sensitivity, redness, sebum, pigmentation, aging, hormonal, lifestyle

function RadarChart({ score }: { score: SkinScore }) {
  const axes = [
    "hydration","barrier","acne","sensitivity","redness",
    "sebum","pigmentation","aging","hormonal","lifestyle"
  ] as const;

  const SIZE   = 220;
  const CENTER = SIZE / 2;
  const RADIUS = 90;

  // Generate polygon points from scores
  const points = axes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r     = (score[axis] / 100) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(" ");

  // Animate the polygon with pathLength on mount
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Grid rings at 25%, 50%, 75%, 100% */}
      {[0.25, 0.5, 0.75, 1].map(r => (
        <polygon
          key={r}
          points={axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            const radius = r * RADIUS;
            return `${CENTER + radius * Math.cos(angle)},${CENTER + radius * Math.sin(angle)}`;
          }).join(" ")}
          fill="none" stroke="#1e293b" strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {points.map((p, i) => (
        <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y}
          stroke="#1e293b" strokeWidth="1" />
      ))}
      {/* Score polygon — animate from center outward */}
      <motion.polygon
        points={polygonPoints}
        fill="#22d3ee22" stroke="#22d3ee" strokeWidth="1.5"
        initial={{ scale: 0, originX: `${CENTER}px`, originY: `${CENTER}px` }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Axis labels */}
      {axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const r = RADIUS + 16;
        return (
          <text key={axis}
            x={CENTER + r * Math.cos(angle)}
            y={CENTER + r * Math.sin(angle)}
            textAnchor="middle" dominantBaseline="middle"
            className="text-[8px] fill-muted-foreground capitalize"
          >
            {axis}
          </text>
        );
      })}
    </svg>
  );
}
```

**Plain-English interpretation snippets:**
```typescript
const AXIS_INTERPRETATIONS: Record<string, (score: number) => string> = {
  barrier:     s => s > 60 ? "Your skin barrier is significantly compromised — products are penetrating unevenly." : s > 30 ? "Mild barrier weakness — minor sensitivity likely." : "Your barrier is healthy and intact.",
  acne:        s => s > 60 ? "Active breakout pattern — needs targeted antibacterial and anti-inflammatory care." : s > 30 ? "Occasional breakouts, likely triggered by sebum or stress." : "Minimal acne concern.",
  hormonal:    s => s > 50 ? "Hormonal acne pattern detected — hairline and jaw distribution suggest androgen sensitivity." : "",
  sensitivity: s => s > 60 ? "High reactivity — many actives will cause stinging or purging." : s > 30 ? "Moderate sensitivity." : "Good tolerance for actives.",
  hydration:   s => s > 60 ? "Significant dehydration — skin may feel tight or look dull despite oiliness." : s > 30 ? "Mild dehydration." : "Well-hydrated skin.",
};
```

---

## SLIDE 3 — Why These Products Work For Your Skin

File: `src/components/results/SlideWhyItWorks.tsx`

**This is the persuasion slide. Every claim must link back to a specific axis score.**

**Layout:**

```
┌───────────────────────────────────────────────┐
│  WHY THIS WORKS FOR YOU                       │
│  Based on your 10-axis skin vector            │
│                                               │
│  ┌─── Product Card ───────────────────────┐  │
│  │  [Product Image]                        │  │
│  │  Mugwort Calming Serum    ₩48,000       │  │
│  │  by ISNTREE                             │  │
│  │                                         │  │
│  │  🔬 Matched to your profile:            │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ Sensitivity   81  ████████░░     │  │  │  ← your score
│  │  │ Barrier       58  █████░░░░░     │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                         │  │
│  │  Why it works:                          │  │
│  │  Mugwort (artemisia) has demonstrated   │  │
│  │  anti-inflammatory action on TRPV1      │  │
│  │  channels — the primary pathway behind  │  │
│  │  your flush reactivity score.           │  │
│  │                                         │  │
│  │  ✓ Allantoin rebuilds barrier           │  │
│  │  ✓ Centella reduces vascular response   │  │
│  │  ✓ No alcohol, no fragrance             │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ← 1/4 products  ·  swipe to see next →      │
│                                               │
└───────────────────────────────────────────────┘
```

**Nested horizontal scroll inside Slide 3:**
- Slide 3 itself is a slide in the outer carousel
- Inside Slide 3: a second horizontal scroll for individual product cards (4 products)
- Use a different drag handle / touch zone to avoid conflict:
  - Outer carousel: drag from top 20% or bottom nav arrows only
  - Inner product scroll: main content area

**Product card data structure:**
```typescript
interface ProductCard {
  id: string;
  name: string;
  brand: string;
  price: string;
  imageUrl: string;
  matchedAxes: (keyof SkinScore)[];  // which axes this targets
  ingredientHighlights: {
    ingredient: string;
    claim: string;           // what it does
    axisTarget: keyof SkinScore;
  }[];
  certifications: string[];  // "No fragrance", "EWG verified", "Dermatologist tested"
  clinicalNote: string;      // 2-3 sentence science-backed explanation
}
```

**Example product cards (fill with your actual catalog):**

```typescript
const PRODUCT_CARDS: ProductCard[] = [
  {
    id: "mugwort-serum",
    name: "Mugwort 1% Calming Serum",
    brand: "ISNTREE",
    price: "€29",
    imageUrl: "/products/mugwort-serum.webp",
    matchedAxes: ["sensitivity", "redness", "barrier"],
    ingredientHighlights: [
      { ingredient: "Artemisia Annua", claim: "TRPV1 anti-inflammatory — reduces flush reactivity", axisTarget: "redness" },
      { ingredient: "Allantoin", claim: "Accelerates barrier repair (confirmed TEWL reduction)", axisTarget: "barrier" },
      { ingredient: "Centella Asiatica", claim: "Reduces vascular hyperreactivity", axisTarget: "sensitivity" },
    ],
    certifications: ["Fragrance-free", "Alcohol-free", "Dermatologist tested"],
    clinicalNote: "Artemisia (mugwort) has been shown in clinical trials to reduce erythema by up to 38% after 4 weeks — directly targeting your flush reactivity pattern.",
  },
  // Add 3 more products targeting other top axes
];
```

**Axis–product matching logic:**
```typescript
function getRecommendedProducts(score: SkinScore, catalog: ProductCard[]): ProductCard[] {
  // Score each product by how well it addresses the user's top axes
  return catalog
    .map(product => ({
      product,
      relevance: product.matchedAxes.reduce(
        (sum, axis) => sum + (score[axis] ?? 0), 0
      ) / product.matchedAxes.length,
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4)
    .map(r => r.product);
}
```

---

## SLIDE 4 — Your 5-Phase Protocol

File: `src/components/results/SlideProtocol.tsx`

```
┌────────────────────────────────────────────────┐
│  YOUR 5-PHASE PROTOCOL                         │
│  Personalized sequence based on your vector    │
│                                                │
│  ┌── Phase tabs ──────────────────────────┐   │
│  │ [1 Cleanse] [2 Tone] [3 Treat] [4 Seal] [5 Protect]│
│  └────────────────────────────────────────┘   │
│                                                │
│  ┌── Active Phase ─────────────────────────┐  │
│  │  Phase 1 · CLEANSE                      │  │
│  │                                         │  │
│  │  [Product image]                        │  │
│  │  Low pH Gentle Cleanser                 │  │
│  │  Maintain pH 4.5–5.5 for barrier        │  │
│  │                                         │  │
│  │  WHY FIRST?                             │  │
│  │  Your barrier score (58) means alkaline │  │
│  │  cleansers would further disrupt TEWL.  │  │
│  │  A pH-balanced cleanser prevents that.  │  │
│  │                                         │  │
│  │  AM ✓   PM ✓   Usage: daily             │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ← prev phase  [1] [2] [3] [4] [5]  next →   │
│                                                │
└────────────────────────────────────────────────┘
```

**Phase tab component:**
```typescript
const PHASES = [
  { num: 1, name: "Cleanse",  icon: "💧", am: true,  pm: true  },
  { num: 2, name: "Tone",     icon: "🌿", am: true,  pm: true  },
  { num: 3, name: "Treat",    icon: "🔬", am: false, pm: true  },
  { num: 4, name: "Seal",     icon: "🛡", am: true,  pm: true  },
  { num: 5, name: "Protect",  icon: "☀️", am: true,  pm: false },
];
```

Each phase explains:
1. Which product to use
2. Why THIS phase matters for THIS user's specific axis scores
3. AM/PM applicability
4. A 1-sentence clinical rationale linking back to the score

---

## SLIDE 5 — Subscribe & Deliver

File: `src/components/results/SlideSubscribe.tsx`

```
┌────────────────────────────────────────────────┐
│                                                │
│  YOUR PROTOCOL IS READY                        │
│                                                │
│  ┌── Summary Box ──────────────────────────┐  │
│  │  Skin Pattern:  The Reactive Combatant   │  │
│  │  Top concern:   Sensitivity (81/100)     │  │
│  │  Products:      4 matched formulas       │  │
│  │  Protocol:      5-phase, AM + PM         │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  CHOOSE YOUR PLAN                              │
│                                                │
│  ┌──── Monthly ─────┐  ┌──── Quarterly ────┐  │
│  │  €89/month       │  │  €74/month        │  │
│  │  4 products      │  │  4 products       │  │
│  │  Cancel anytime  │  │  Save 17%   ⭐    │  │
│  └──────────────────┘  └───────────────────┘  │
│                                                │
│  [→ Start My Protocol — €89/month]             │
│                                                │
│  ────────────────────────────────────          │
│                                                │
│  🔒 Dermatologist reviewed                     │
│  🔄 Swap products anytime based on skin changes│
│  📦 Ships to EU — 3–5 business days            │
│                                                │
│  ← Back   or   Download PDF Summary            │
│                                                │
└────────────────────────────────────────────────┘
```

**PDF Summary button:**
- Triggers a simple `window.print()` or generates a minimal print-stylesheet version of slides 1+2+4
- Print layout: A4, light theme, no animations

---

## SLIDE NAVIGATION COMPONENT

File: `src/components/results/SlideNav.tsx`

```tsx
function SlideNav({ current, total, labels, onPrev, onNext }) {
  return (
    <>
      {/* Dot indicators + labels */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
        <div className="flex items-center gap-3">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => {/* goTo(i) — pass setter as prop */}}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-border hover:bg-muted-foreground"
              }`}
              aria-label={labels[i]}
            />
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {labels[current]}
        </span>
      </div>

      {/* Arrow buttons (desktop only) */}
      {current > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Previous"
        >
          ←
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Next"
        >
          →
        </button>
      )}

      {/* Swipe hint (mobile, slide 1 only) */}
      {current === 0 && (
        <motion.div
          className="absolute right-6 top-1/2 -translate-y-1/2 md:hidden flex flex-col items-center gap-1 text-muted-foreground/40"
          animate={{ x: [0, 8, 0] }}
          transition={{ repeat: 3, duration: 0.8, delay: 2 }}
          aria-hidden="true"
        >
          <span className="text-[10px]">swipe</span>
          <span>→</span>
        </motion.div>
      )}
    </>
  );
}
```

---

## PROGRESS BAR (top of screen)

Add a thin progress bar at the top of the results page:
```tsx
<div className="absolute top-0 left-0 right-0 z-50 h-0.5 bg-border/40">
  <motion.div
    className="h-full bg-primary"
    animate={{ width: `${((current + 1) / SLIDES.length) * 100}%` }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  />
</div>
```

---

## FILES TO CREATE / MODIFY

| File | Action |
|------|--------|
| `src/pages/Results.tsx` | REPLACE — new slide container |
| `src/components/results/SlidePatternReveal.tsx` | CREATE |
| `src/components/results/SlideAxisBreakdown.tsx` | CREATE |
| `src/components/results/SlideWhyItWorks.tsx` | CREATE |
| `src/components/results/SlideProtocol.tsx` | CREATE |
| `src/components/results/SlideSubscribe.tsx` | CREATE |
| `src/components/results/SlideNav.tsx` | CREATE |
| `src/lib/scoring.ts` | ADD `derivePatternName()`, `getRecommendedProducts()` |
| `src/data/products.ts` | CREATE — product catalog |

---

## CONSTRAINTS
- Do NOT change any diagnosis category pages (Cat 1–8)
- Do NOT change Navbar/Footer/CookieConsent
- Maintain dark theme and cyan/amber color palette
- All slides must be scroll-free individually (no inner vertical scroll except on mobile if content overflows — use `overflow-y-auto` with `max-h` inside cards)
- Mobile: 375px minimum width supported
- The outer carousel must NOT conflict with inner product scroll in Slide 3 (use pointer-events / drag zone separation)
