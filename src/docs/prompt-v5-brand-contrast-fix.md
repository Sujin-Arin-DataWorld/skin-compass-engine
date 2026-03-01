# LOVABLE PROMPT v5 — Brand Identity Fix + Typography + Contrast Overhaul

---

## CONTEXT

Skin Strategy Lab = **Self-diagnosis + AI-matched K-beauty products you buy directly**.
NOT a spa, NOT a clinic, NOT a treatment service.
Every design decision must reinforce: "You assess yourself → We match the right products → You buy them."

Apply ALL fixes below. Do NOT break existing functionality.

---

## FIX 1 — Replace Editorial Images with Brand-Correct Visuals

### Remove Immediately
- The facial mask / spa treatment image (woman with green clay mask) → completely wrong brand message
- The interior room / living room image → off-brand
- The Curology branded product image → competitor brand visible

### Replace with These Unsplash URLs (self-care, products, K-beauty)

```tsx
// src/pages/Index.tsx — replace EDITORIAL_IMAGES and banner images

const EDITORIAL_IMAGES = [
  // Hero floating card 1 — skincare product flatlay
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=85",
  // Hero floating card 2 — serum/essence texture
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=85",
];

// Banner section — 3-image grid
const BANNER_IMAGES = [
  // Self-applying skincare at home (person, not spa)
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=900&q=85",
  // K-beauty product lineup — bottles/serums on clean surface
  "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600&q=85",
  // Person examining own skin in mirror — self-diagnosis feel
  "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&q=85",
];
```

### Banner Section Alt Text (update for brand accuracy)
```
Image 1: alt="At-home skincare routine"
Image 2: alt="K-beauty serum collection"  
Image 3: alt="Skin self-assessment"
```

### Add Brand Message Overlay on Banner
Add a centered text overlay between the stats row and the image banner:

```tsx
<motion.div
  className="mx-auto max-w-[1100px] px-6 py-12 text-center"
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-40px" }}
  transition={{ duration: 0.6 }}
>
  <p className="font-display text-display-md text-foreground">
    Diagnose yourself.<br />
    <span className="text-primary italic">Get exactly what your skin needs.</span>
  </p>
  <p className="mt-4 font-body text-body-lg text-muted-foreground max-w-xl mx-auto">
    No guessing. No generic routines. A 10-axis clinical assessment matches
    you to K-beauty formulas proven to work for your specific skin pattern —
    then delivers them to your door.
  </p>
</motion.div>
```

---

## FIX 2 — Radar Chart: Bigger Labels + Remove Floating Images

### Remove Floating Editorial Images from Radar Section
In the hero right column, remove:
- The top-right floating card with tilted image (rotate: 3)
- The bottom-left floating card with tilted image (rotate: -2)

Keep only: the `<SkinRadar />` component + the glow background div + the "Illustrative" label.

### Fix Radar Label Size

In `SkinRadar` component (or wherever the SVG radar is rendered), update font size:

```tsx
// Before:
fontSize={9}

// After:
fontSize={11}
fontWeight={500}
```

Also increase label distance from chart edge:
```tsx
// Before: polarToXY(i * angleStep, maxR + 28, cx, cy)
// After:
const labels = RADAR_CATEGORIES.map((cat, i) => ({
  ...polarToXY(i * angleStep, maxR + 36, cx, cy),  // +36 instead of +28
  label: cat.label,
}));
```

And update label color for better contrast on both modes:
```tsx
// Before: className="fill-muted-foreground"
// After: use inline fill with opacity
fill="hsl(var(--foreground))"
opacity={0.75}
```

---

## FIX 3 — Navbar Logo: Text-Based Logo (Remove Image Logos)

Remove both `logo-light.png` and `logo-dark.png` image approach entirely.

### Replace with Typography Logo

```tsx
// src/components/Navbar.tsx

// Remove:
import logoLight from "@/assets/logo-light.png";
import logoDark  from "@/assets/logo-dark.png";

// Replace Logo component with:
function Logo() {
  return (
    <Link to="/" className="flex flex-col items-start leading-none group" aria-label="Skin Strategy Lab">
      <span
        className="font-display text-[1.35rem] font-light tracking-[0.12em] text-foreground transition-colors group-hover:text-primary"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.14em" }}
      >
        SKIN STRATEGY
      </span>
      <span
        className="font-body text-[0.6rem] font-medium uppercase tracking-[0.35em] text-primary mt-[-2px]"
        style={{ letterSpacing: "0.4em" }}
      >
        — LAB —
      </span>
    </Link>
  );
}
```

**Typography choice rationale:**
- **Cormorant Garamond** for "SKIN STRATEGY" — same font as the logo design, serif luxury feel, wide letter-spacing reads as authoritative yet refined
- **DM Sans** for "— LAB —" — clean small-caps label creates the typographic hierarchy seen in the logo

This matches the uploaded logo design exactly in typographic spirit, works perfectly on both dark and light backgrounds without image files.

---

## FIX 4 — Dark Mode: Diagnosis Page Text Contrast Fix

**Problem:** Category title text and description text in `/diagnosis/category/*` pages is too dark, clashes with the dark background, and is unreadable.

### Category Page Global Typography Rules

Update `src/index.css` — add diagnosis-specific contrast rules:

```css
/* Diagnosis category pages — force readable contrast */
.diagnosis-page {
  color: hsl(var(--foreground));
}

/* Category header — large, unmissable */
.category-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.01em;
  /* Light mode */
  color: hsl(20 25% 15%);
}

.dark .category-title {
  /* Dark mode — warm near-white for max contrast against dark background */
  color: hsl(38 25% 92%);
}

/* Category subtitle/description */
.category-description {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.65;
  color: hsl(20 15% 40%);
}

.dark .category-description {
  color: hsl(38 20% 68%);
}

/* Category badge (CATEGORY X OF 8) */
.category-badge {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--primary));
}
```

### Apply to All Category Components

In EVERY Category component (`Category1.tsx` through `Category8.tsx`), update the header section:

```tsx
{/* Before — typically looks like: */}
<div>
  <span className="text-sm text-primary">CATEGORY {n} OF 8</span>
  <h1 className="text-2xl font-display text-foreground">{title}</h1>
  <p className="text-sm text-muted-foreground">{description}</p>
</div>

{/* After — higher contrast, bigger, clearer: */}
<div className="mb-6">
  <span className="category-badge">Category {n} of 8</span>
  <h1 className="category-title mt-1 flex items-center gap-3">
    <span>{emoji}</span>
    {title}
  </h1>
  <p className="category-description mt-2 max-w-lg">{description}</p>
</div>
```

---

## FIX 5 — Light Mode: Diagnosis Page Text Visibility

**Problem:** In light mode, category text is near-invisible (very light text on cream background — insufficient contrast ratio).

### Minimum Contrast Requirements (WCAG AA)

```css
/* Ensure ALL text in diagnosis pages meets 4.5:1 contrast ratio */

/* Light mode */
:root {
  /* Override muted-foreground to be darker in diagnosis context */
  --diagnosis-text-primary:   20 35% 12%;   /* #1C1008 — very dark brown */
  --diagnosis-text-secondary: 20 20% 32%;   /* #4A3525 — medium brown */
  --diagnosis-text-hint:      20 15% 48%;   /* #6B5544 — readable hint */
}

/* Dark mode */
.dark {
  --diagnosis-text-primary:   38 30% 92%;   /* #EDE4D6 — warm white */
  --diagnosis-text-secondary: 38 20% 72%;   /* #C4AD94 — warm mid */
  --diagnosis-text-hint:      38 15% 55%;   /* #9A856E — readable hint */
}
```

### Section Card Backgrounds — Add Contrast Backing

In diagnosis category cards/sections, add a visible background:

```tsx
{/* Before: */}
<div className="rounded-xl border border-border/40 p-6">

{/* After: */}
<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
{/* 
  bg-card = white/90% in light mode → creates contrast against cream page bg
  bg-card = dark charcoal in dark mode → creates contrast against black page bg
*/}
```

Update `--card` in CSS:
```css
:root {
  --card: 0 0% 100%;           /* pure white in light mode */
  --card-foreground: 20 35% 12%;
}
.dark {
  --card: 20 16% 13%;          /* slightly lighter than page bg */
  --card-foreground: 38 25% 90%;
}
```

### Question Text in Cards

```css
/* All question labels inside diagnosis cards */
.question-label {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: hsl(var(--diagnosis-text-primary));
  line-height: 1.5;
}

.dark .question-label {
  color: hsl(var(--diagnosis-text-primary));  /* uses .dark override above */
}

/* Section headers (e.g. "FLUSH REACTIVITY", "CORE ASSESSMENT") */
.section-header {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: hsl(var(--diagnosis-text-secondary));
}
```

Apply `question-label` class to all question text.
Apply `section-header` class to all uppercase section titles inside cards.

---

## FIX 6 — Button & Option Text Contrast

### Unselected Option Buttons

```css
/* Light mode — unselected options must be readable */
.option-button {
  background: hsl(0 0% 97%);
  border: 1px solid hsl(20 15% 80%);
  color: hsl(20 25% 22%);           /* dark enough on white */
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.9rem;
  font-weight: 400;
}

.dark .option-button {
  background: hsl(20 14% 18%);
  border: 1px solid hsl(20 14% 28%);
  color: hsl(38 20% 78%);           /* warm light on dark */
}

/* Selected state */
.option-button.selected {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-weight: 500;
}
```

---

## SUMMARY OF ALL CHANGES

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Replace spa images → self-care/product images; add brand message overlay; remove floating hero cards |
| `src/components/Navbar.tsx` | Replace image logos → typographic logo (Cormorant Garamond + DM Sans) |
| `src/components/SkinRadar.tsx` (or inline) | Increase label fontSize 9→11, label distance +36, fill color for contrast |
| `src/index.css` | Add `.category-title`, `.category-description`, `.category-badge`, `.question-label`, `.section-header`, `.option-button` with proper contrast; update `--card` values; add `--diagnosis-text-*` tokens |
| `src/pages/diagnosis/Category1–8.tsx` | Apply `.category-title`, `.category-description`, `.category-badge` classes; add `bg-card` to section cards |

## DO NOT CHANGE
- Route structure (Category 1–8 paths, Results path)
- DiagnosisContext / scoring logic
- Any question content or interaction logic
- Results.tsx slide components
- Footer, CookieConsent
- SilkBackground component (keep as is)
- Dark/light mode toggle behavior
