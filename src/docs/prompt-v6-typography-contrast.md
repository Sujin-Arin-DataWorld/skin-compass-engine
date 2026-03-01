# LOVABLE PROMPT v6 — Typography Scale + Contrast System Overhaul

---

## DESIGN PRINCIPLE

Every text element must be readable at a glance without squinting.
Minimum font size across the entire app: **14px body, 11px labels**.
All contrast ratios must meet WCAG AA (4.5:1 for body, 3:1 for large text).

**Color system for both modes:**

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Primary heading | `#1C1008` (very dark espresso) | `#EDE4D6` (warm white) |
| Body text | `#3D2B1A` (dark brown) | `#C8B49A` (warm sand) |
| Hint / label | `#7A6352` (medium brown) | `#8A7560` (warm mid) |
| Primary accent | `#C99B3A` (gold) | `#D4A84B` (brighter gold) |
| Card background | `#FFFFFF` | `#1E1712` (dark espresso card) |
| Page background | `#F7F3EF` (cream) | `#120E0A` (near black) |

---

## PART A — GLOBAL CSS TOKENS

Replace all color and font-size tokens in `src/index.css`:

```css
:root {
  /* Backgrounds */
  --background:           28 20% 97%;     /* #F7F3EF */
  --background-2:         28 15% 93%;
  --card:                 0 0% 100%;      /* pure white — contrast against cream */
  --card-foreground:      20 40% 11%;     /* #1C1008 */

  /* Text */
  --foreground:           20 40% 11%;     /* #1C1008 — primary heading */
  --foreground-body:      20 30% 24%;     /* #3D2B1A — body */
  --foreground-hint:      20 20% 47%;     /* #7A6352 — labels/hints */
  --muted-foreground:     20 20% 47%;

  /* Primary gold */
  --primary:              38 60% 50%;     /* #C99B3A */
  --primary-foreground:   28 20% 97%;

  --border:               28 20% 82%;
  --muted:                28 15% 90%;
  --input:                28 20% 88%;
}

.dark {
  --background:           20 22% 7%;      /* #120E0A */
  --background-2:         20 18% 10%;
  --card:                 20 18% 12%;     /* #1E1712 — visible card lift */
  --card-foreground:      38 28% 91%;     /* #EDE4D6 */

  --foreground:           38 28% 91%;     /* #EDE4D6 — warm white */
  --foreground-body:      38 22% 78%;     /* #C8B49A — warm sand */
  --foreground-hint:      38 16% 54%;     /* #8A7560 */
  --muted-foreground:     38 16% 54%;

  --primary:              38 58% 56%;     /* #D4A84B — brighter gold for dark bg */
  --primary-foreground:   20 22% 7%;

  --border:               20 16% 22%;
  --muted:                20 16% 16%;
  --input:                20 18% 15%;
}

/* ── Typography scale ────────────────────── */
:root {
  --text-hero:     clamp(2.8rem, 7vw, 5.5rem);
  --text-display: clamp(2rem, 4vw, 3.2rem);
  --text-title:   clamp(1.5rem, 2.5vw, 2rem);
  --text-section: 1.375rem;    /* 22px — section headings */
  --text-card:    1.125rem;    /* 18px — card titles */
  --text-body:    1rem;        /* 16px — default body */
  --text-small:   0.9375rem;   /* 15px — secondary body */
  --text-label:   0.8125rem;   /* 13px — labels/hints — minimum for UI labels */
  --text-micro:   0.75rem;     /* 12px — badges only */
}
```

---

## PART B — DIAGNOSIS PAGES (Category 1–8)

### B1. Category Header — Bigger + Proper Contrast

In ALL `Category*.tsx` files, the header block must use these exact classes:

```tsx
{/* Category header */}
<div className="mb-8">
  {/* Badge */}
  <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em]"
     style={{ color: 'hsl(var(--primary))' }}>
    Category {n} of 8
  </p>

  {/* Title — large, high contrast */}
  <h1 className="flex items-center gap-3"
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: 400,
        lineHeight: 1.15,
        color: 'hsl(var(--foreground))',   /* adapts to dark/light */
      }}>
    <span role="img" aria-hidden="true">{emoji}</span>
    {title}
  </h1>

  {/* Description */}
  <p className="mt-2"
     style={{
       fontFamily: "'DM Sans', system-ui, sans-serif",
       fontSize: '1.0625rem',   /* 17px */
       lineHeight: 1.65,
       color: 'hsl(var(--foreground-body))',
     }}>
    {description}
  </p>
</div>
```

### B2. Section Labels (e.g. "FLUSH REACTIVITY", "CORE ASSESSMENT")

```tsx
<p style={{
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'hsl(var(--foreground-hint))',   /* readable in both modes */
  marginBottom: '0.75rem',
}}>
  {sectionLabel}
</p>
```

### B3. Question Text Inside Cards

```tsx
<p style={{
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: '1.0625rem',   /* 17px */
  fontWeight: 500,
  lineHeight: 1.55,
  color: 'hsl(var(--foreground))',
}}>
  {questionText}
</p>
```

### B4. Option Buttons (None / Occasionally / Often / Almost Always)

```tsx
<button
  className={`rounded-lg border px-4 py-3 text-[0.9375rem] font-medium transition-all duration-150 ${
    selected
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
  }`}
  style={{
    fontFamily: "'DM Sans', system-ui, sans-serif",
    minHeight: '48px',     /* touch target */
  }}
>
  {label}
</button>
```

### B5. Card Containers — Visible in Both Modes

```tsx
<div className="rounded-2xl border p-6 md:p-8"
     style={{
       background: 'hsl(var(--card))',
       borderColor: 'hsl(var(--border))',
       boxShadow: '0 1px 3px hsl(0 0% 0% / 0.06)',
     }}>
```

---

## PART C — RESULTS SLIDE 2: Your Skin Profile

### C1. "YOUR SKIN PROFILE" Section Title

```tsx
<h2 style={{
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
  fontWeight: 400,
  letterSpacing: '-0.01em',
  color: 'hsl(var(--primary))',     /* gold — visible in both modes */
  marginBottom: '1.5rem',
}}>
  Your Skin Profile
</h2>
```

### C2. Radar Chart Labels — Much Bigger

In the `RadarChart` or `SkinRadar` SVG component:

```tsx
{/* Axis labels */}
{axes.map((axis, i) => {
  const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const r = RADIUS + 42;   /* was 28–36, now 42 — more breathing room */
  return (
    <text
      key={axis}
      x={CENTER + r * Math.cos(angle)}
      y={CENTER + r * Math.sin(angle)}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{
        fontSize: '12px',          /* was 9–11, now 12 */
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 500,
        fill: 'hsl(var(--foreground))',   /* NOT muted — full contrast */
        opacity: 0.85,
        textTransform: 'capitalize',
      }}
    >
      {axis}
    </text>
  );
})}
```

Also make the radar SVG bigger:
```tsx
{/* Before: */}
<svg width="220" height="220" viewBox="0 0 220 220">
{/* After: */}
<svg width="280" height="280" viewBox="0 0 280 280">
{/* And scale RADIUS: 90 → 110, CENTER: 110 */}
const SIZE   = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
```

### C3. Score Bars — Bigger Text

```tsx
{/* Score bar row */}
<div className="flex items-center gap-3">
  {/* Axis name */}
  <span style={{
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '1rem',           /* was tiny — now 16px */
    fontWeight: 500,
    color: 'hsl(var(--foreground))',
    width: '130px',             /* wider for readability */
    flexShrink: 0,
  }}>
    {axis}
  </span>

  {/* Bar track */}
  <div className="flex-1 h-2.5 rounded-full overflow-hidden"   /* h-2.5 = 10px, was 6px */
       style={{ background: 'hsl(var(--border))' }}>
    <motion.div
      className="h-full rounded-full"
      style={{ background: getBarColor(score) }}   /* see color fn below */
      initial={{ width: 0 }}
      animate={{ width: `${score}%` }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  </div>

  {/* Score number */}
  <span style={{
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: getBarColor(score),
    width: '36px',
    textAlign: 'right',
    flexShrink: 0,
  }}>
    {score}
  </span>
</div>
```

Score bar color function:
```typescript
function getBarColor(score: number): string {
  if (score >= 70) return '#ef4444';   /* red — high concern */
  if (score >= 45) return '#f59e0b';   /* amber — moderate */
  if (score >= 20) return '#22c55e';   /* green — mild */
  return '#6b7280';                    /* gray — minimal */
}
```

### C4. "WHAT THIS MEANS" Section

```tsx
{/* Section header */}
<h3 style={{
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: '0.8125rem',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'hsl(var(--foreground-hint))',
  marginBottom: '1.25rem',
}}>
  What This Means
</h3>

{/* Interpretation rows — with matching icon/image */}
{topAxes.map(axis => (
  <div key={axis.key} className="flex items-start gap-4 py-4 border-b border-border/40 last:border-0">
    {/* Axis icon */}
    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
         style={{ background: `${getBarColor(axis.score)}22` }}>
      <span style={{ fontSize: '1.25rem' }}>{AXIS_ICONS[axis.key]}</span>
    </div>

    {/* Text */}
    <div>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: '1.0625rem',    /* 17px */
        fontWeight: 600,
        color: 'hsl(var(--foreground))',
        marginBottom: '0.25rem',
      }}>
        {axis.label}
        <span style={{
          marginLeft: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 400,
          color: getBarColor(axis.score),
        }}>
          {axis.score}/100
        </span>
      </p>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: '0.9375rem',    /* 15px */
        lineHeight: 1.6,
        color: 'hsl(var(--foreground-body))',
      }}>
        {AXIS_INTERPRETATIONS[axis.key](axis.score)}
      </p>
    </div>
  </div>
))}
```

Axis icons map:
```typescript
const AXIS_ICONS: Record<string, string> = {
  barrier:      '🛡',
  sensitivity:  '⚡',
  acne:         '🔴',
  hormonal:     '🌙',
  redness:      '🌡',
  hydration:    '💧',
  sebum:        '✨',
  pigmentation: '🌑',
  aging:        '⏳',
  lifestyle:    '🌪',
};
```

---

## PART D — RESULTS SLIDE 4: Your 5-Phase Protocol

### D1. Phase Navigation — Bigger + Guided

```tsx
{/* Instruction hint — shown first time only */}
<motion.p
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  className="mb-4 text-center"
  style={{
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '0.875rem',
    color: 'hsl(var(--foreground-hint))',
    fontStyle: 'italic',
  }}
>
  ← Tap each phase to see your personalised step →
</motion.p>

{/* Phase tab buttons */}
<div className="flex gap-2 rounded-xl p-1.5"
     style={{ background: 'hsl(var(--muted))' }}>
  {PHASES.map((phase, i) => (
    <button
      key={phase.num}
      onClick={() => setActivePhase(i)}
      className="flex-1 rounded-lg py-3 transition-all duration-200"
      style={{
        background: activePhase === i ? 'hsl(var(--card))' : 'transparent',
        boxShadow: activePhase === i ? '0 1px 4px hsl(0 0% 0% / 0.12)' : 'none',
      }}
    >
      {/* Phase icon */}
      <div style={{ fontSize: '1.25rem', textAlign: 'center', marginBottom: '4px' }}>
        {phase.icon}
      </div>
      {/* Phase number + name */}
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: '0.8125rem',
        fontWeight: activePhase === i ? 600 : 400,
        color: activePhase === i ? 'hsl(var(--foreground))' : 'hsl(var(--foreground-hint))',
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        {phase.num}<br/>{phase.name}
      </p>
    </button>
  ))}
</div>
```

### D2. Active Phase Content — Big Typography

```tsx
{/* Phase content panel */}
<AnimatePresence mode="wait">
  <motion.div
    key={activePhase}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="mt-6 rounded-2xl p-6 md:p-8"
    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
  >
    {/* Phase label */}
    <p style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'hsl(var(--primary))',
      marginBottom: '0.5rem',
    }}>
      Phase {PHASES[activePhase].num} · {PHASES[activePhase].name}
    </p>

    {/* Product name */}
    <h3 style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
      fontWeight: 400,
      color: 'hsl(var(--foreground))',
      marginBottom: '0.75rem',
    }}>
      {activeProduct.name}
    </h3>

    {/* Why this step */}
    <p style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: '1rem',           /* 16px — readable */
      lineHeight: 1.7,
      color: 'hsl(var(--foreground-body))',
      marginBottom: '1rem',
    }}>
      {activeProduct.clinicalRationale}
    </p>

    {/* AM/PM badges */}
    <div className="flex gap-2">
      {activeProduct.am && (
        <span className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}>
          ☀️ AM
        </span>
      )}
      {activeProduct.pm && (
        <span className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}>
          🌙 PM
        </span>
      )}
    </div>
  </motion.div>
</AnimatePresence>
```

---

## PART E — ALL SLIDES: Global Text Minimums

Add to `src/index.css`:

```css
/* ── Result slide base typography ─────────── */
.results-slide {
  font-family: 'DM Sans', system-ui, sans-serif;
  color: hsl(var(--foreground));
}

.results-slide h1,
.results-slide h2,
.results-slide h3 {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* Any text smaller than 14px is forbidden in results */
.results-slide * {
  min-font-size: 14px;
}

/* Slide section eyebrow labels */
.slide-eyebrow {
  font-size: 0.8125rem;    /* 13px */
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: hsl(var(--primary));
}

/* Large section titles */
.slide-title {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 400;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

/* Body paragraphs in results */
.slide-body {
  font-size: 1rem;         /* 16px minimum */
  line-height: 1.7;
  color: hsl(var(--foreground-body));
}

/* Score numbers */
.score-number {
  font-size: 1.125rem;     /* 18px */
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
```

Apply `results-slide` class to the top-level div of each of the 5 slide components.

---

## SUMMARY

| Area | Change |
|------|--------|
| `src/index.css` | New color tokens (foreground-body, foreground-hint), font size scale, `.results-slide` rules |
| `Category1–8.tsx` | Category title clamp(1.75rem→2.5rem), description 17px, section labels 13px bold, cards bg-card |
| `SlideAxisBreakdown.tsx` | Radar SVG 280px, RADIUS 110, label fontSize 12px + full foreground color; score bar height 10px, text 16px |
| `SlideAxisBreakdown.tsx` | "What This Means" rows: icon + 17px title + 15px body + colored score inline |
| `SlideProtocol.tsx` | Phase tabs bigger (icon + name), instruction hint copy, content panel 16px body |
| All result slides | Add `results-slide` class; use `slide-eyebrow`, `slide-title`, `slide-body` utility classes |

## DO NOT CHANGE
- Route structure
- Scoring logic
- DiagnosisContext
- Animation timings
- SilkBackground
- Image selections
- Logo typography
