# LOVABLE PROMPT — Diagnosis: 6 Critical Fixes (Interaction + UX Flow + Scoring Overhaul)

---

## CONTEXT

Skin diagnosis app, 8 categories, dark theme, cyan/amber primary.
Apply ALL fixes below. Do NOT break existing functionality or visual design language.

---

## FIX 1 — Category 7: Complete Elasticity Test Interaction Rebuild

**Problem:** Pressing Firm / Mild loss / Moderate / Significant does nothing visible.
The "Press & hold" area is confusing and gives no feedback.

### New Elasticity Test Design

Replace the current elasticity test block entirely with this interaction:

**A. Remove the "Press & hold" canvas entirely.**

**B. New visual: Animated skin elasticity meter**

```tsx
// ElasticityMeter.tsx
// Show an animated visual that responds to the selected option
// 4 states: firm | mild_loss | moderate | significant

type ElasticityLevel = "firm" | "mild_loss" | "moderate" | "significant";

const ELASTICITY_CONFIG: Record<ElasticityLevel, {
  label: string;
  description: string;
  bounceBackMs: number;    // animation speed — faster = firmer
  sagDepth: number;        // 0–1, how much the skin "droops"
  color: string;           // ring color
}> = {
  firm: {
    label: "Firm",
    description: "Snaps back immediately on release",
    bounceBackMs: 150,
    sagDepth: 0,
    color: "#22d3ee",      // cyan
  },
  mild_loss: {
    label: "Mild Loss",
    description: "Bounces back within 1–2 seconds",
    bounceBackMs: 500,
    sagDepth: 0.25,
    color: "#86efac",      // green
  },
  moderate: {
    label: "Moderate",
    description: "Takes 3–5 seconds to recover",
    bounceBackMs: 1000,
    sagDepth: 0.55,
    color: "#fbbf24",      // amber
  },
  significant: {
    label: "Significant",
    description: "Skin stays deformed or recovers very slowly",
    bounceBackMs: 2500,
    sagDepth: 0.9,
    color: "#f87171",      // red
  },
};
```

**C. New Elasticity UI layout:**

```
┌─────────────────────────────────────────┐
│  ELASTICITY TEST                        │
│  Select how quickly your skin bounces   │
│  back after being gently pressed        │
│                                         │
│   ┌─── Animated SVG meter ───┐          │
│   │  Oval face profile        │          │
│   │  Cheek area animates:     │          │
│   │  - Pressing (indent)      │          │
│   │  - Releasing (bounce)     │          │
│   │  Speed = selected level   │          │
│   └───────────────────────────┘          │
│                                         │
│  [ Firm ]  [Mild loss]  [Moderate]  [Significant] │
│                                         │
│  ← Selected: bounces back in ~3–5 sec  │
└─────────────────────────────────────────┘
```

**D. Animation spec (CSS/Framer Motion):**

```tsx
// When user selects a level, animate the cheek oval:
// 1. "Press" phase: scale cheek to (1 - sagDepth * 0.3), duration 300ms ease-in
// 2. "Hold" phase: stay compressed for 600ms
// 3. "Release" phase: spring back to scale(1), duration = bounceBackMs, ease = spring
//    - For "firm": sharp overshoot spring (stiffness 400, damping 15)
//    - For "significant": very slow, no overshoot (stiffness 60, damping 30)

// Loop this animation continuously while option is selected.
// Color of the animation ring changes to match ELASTICITY_CONFIG[level].color

import { motion, useAnimation } from "framer-motion";

function ElasticityVisual({ level }: { level: ElasticityLevel }) {
  const config = ELASTICITY_CONFIG[level];
  const controls = useAnimation();

  useEffect(() => {
    let cancelled = false;
    async function loop() {
      while (!cancelled) {
        await controls.start({
          scaleX: 1 - config.sagDepth * 0.28,
          scaleY: 1 - config.sagDepth * 0.18,
          transition: { duration: 0.3, ease: "easeIn" }
        });
        await new Promise(r => setTimeout(r, 600));
        await controls.start({
          scaleX: 1,
          scaleY: 1,
          transition: {
            type: "spring",
            stiffness: Math.max(400 - config.sagDepth * 350, 60),
            damping: 15 + config.sagDepth * 20,
            duration: config.bounceBackMs / 1000,
          }
        });
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    loop();
    return () => { cancelled = true; };
  }, [level]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG face with animated cheek */}
      <svg width="160" height="200" viewBox="0 0 160 200">
        {/* Face outline */}
        <ellipse cx="80" cy="100" rx="68" ry="85" fill="transparent"
          stroke="#334155" strokeWidth="1.5" />
        {/* Left cheek — animates */}
        <motion.ellipse
          cx="42" cy="115" rx="26" ry="20"
          fill={config.color + "33"}
          stroke={config.color}
          strokeWidth="1.5"
          animate={controls}
          style={{ originX: "42px", originY: "115px" }}
        />
        {/* Right cheek — mirrors */}
        <motion.ellipse
          cx="118" cy="115" rx="26" ry="20"
          fill={config.color + "33"}
          stroke={config.color}
          strokeWidth="1.5"
          animate={controls}
          style={{ originX: "118px", originY: "115px" }}
        />
      </svg>

      {/* Description */}
      <p className="text-center text-sm text-muted-foreground max-w-xs">
        {config.description}
      </p>

      {/* Bounce speed indicator bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Bounce speed</span>
          <span style={{ color: config.color }}>
            {config.bounceBackMs < 300 ? "Instant" :
             config.bounceBackMs < 700 ? "Fast" :
             config.bounceBackMs < 1500 ? "Slow" : "Very slow"}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ width: `${100 - config.sagDepth * 80}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
```

**E. Persist selection in DiagnosisContext:**
```typescript
elasticityLevel?: "firm" | "mild_loss" | "moderate" | "significant";
```

---

## FIX 2 — Category 7: Replace "Face puffs in morning and sags by evening"

**Problem:** This question is too vague and colloquial for a clinical assessment. 
"Puffing" relates to lymphatic drainage, not collagen/firmness. It conflates two separate phenomena.

**Replace with:**

```
Old: "Face puffs in the morning and sags by evening"
New: "Skin feels loose or lacks resistance when pinched gently"
```

Options remain: None / Occasionally / Often / Almost Always

**Clinical rationale:** "Lacks resistance when pinched" is a direct proxy for dermal collagen density and tensile strength — far more aligned with the category's stated focus (ECM degradation, gravitational changes). Pinch resistance is actually used in the Pinch Test (a validated elasticity assessment method).

**Additionally add as a 4th question in Core Assessment:**

```
"Facial contours appear less defined than 1–2 years ago"
Options: No change / Slight change / Noticeable change / Significant change
```

This replaces the vague temporal puffing question with a longitudinal comparison that users can actually evaluate.

---

## FIX 3 — UX Flow Redesign: Visual Match → Face Map (Cat 3, 5, 6)

**Problem:** Visual Match (pattern selection) and Face Map (zone tapping) are independent.
User selects "Hormonal Jawline" as pattern but can still tap forehead as affected zone — contradiction.
Selected pattern adds no meaning to face map. Zone data and pattern data don't inform each other.

### New Flow for ALL categories that have both Visual Match + Face Map:

**Step 1 → Visual Match (full width, presented first)**

```
┌────────────────────────────────────────────────────┐
│  VISUAL MATCH                                      │
│  Which looks closest to your skin? (select one)   │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ Mild Scattered│  │Hormonal Jaw  │               │
│  │  ◆            │  │  ▼           │               │
│  │ Few spots     │  │ Jaw & chin   │               │
│  └──────────────┘  └──────────────┘               │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ Deep Cystic  │  │ Comedonal    │               │
│  │  🔴           │  │  ⚫          │               │
│  └──────────────┘  └──────────────┘               │
└────────────────────────────────────────────────────┘
```

**Step 2 → After pattern selected: Face Map appears with pre-highlighted zones**

```
Pattern selected: "Hormonal Jawline"
→ Face map auto-highlights: left_jaw, right_jaw, chin zones (low opacity, dashed border)
→ Label: "These zones are pre-selected based on your pattern. Tap to adjust intensity or add more zones."
→ User can: (a) tap highlighted zones to increase intensity ×1→×2→×3, (b) tap non-highlighted zones to add them, (c) tap highlighted zones at ×3 to deselect
```

**Zone pre-highlight mapping (per pattern):**
```typescript
const PATTERN_TO_ZONES: Record<string, string[]> = {
  // Category 3 — Acne
  "mild_scattered":    ["left_cheek", "right_cheek"],
  "hormonal_jawline":  ["left_jaw", "right_jaw", "chin"],
  "deep_cystic":       ["left_cheek", "right_cheek", "chin", "left_jaw", "right_jaw"],
  "mostly_comedonal":  ["nose", "forehead_center", "t_zone"],

  // Category 5 — Pigmentation
  "melasma":           ["left_cheek", "right_cheek", "forehead_center", "upper_lip"],
  "post_acne_marks":   ["left_cheek", "right_cheek"],
  "sun_spots":         ["forehead_center", "nose", "left_cheek", "right_cheek"],
  "freckles":          ["nose", "left_cheek", "right_cheek"],

  // Category 6 — Pores
  "smooth":            [],
  "visible_pores":     ["nose", "forehead_center"],
  "oxidised_pores":    ["nose", "chin"],
  "rough_texture":     ["forehead_center", "left_cheek", "right_cheek"],
};
```

### For Category 6 specifically — Multi-texture Zone Assignment

**Problem:** User can't assign different textures to different zones (nose=oxidised, forehead=rough).

**Solution — "Texture Brush" mode:**

```
1. User selects a texture type (e.g., "Oxidised Pores") from the visual match grid
2. That texture type becomes the "active brush"
3. User taps zones on the face map → those zones are tagged with "Oxidised Pores"
4. User switches texture type to "Rough Texture"
5. Taps different zones → tagged with "Rough Texture"
6. Face map shows each zone colored by its assigned texture type (using a color legend)
7. Tap an already-tagged zone → cycle to next texture → tap again to remove
```

**Zone texture data structure:**
```typescript
// In DiagnosisAnswers:
poreZoneTextures?: Record<string, "smooth" | "visible_pores" | "oxidised_pores" | "rough_texture">;
// Example: { nose: "oxidised_pores", forehead_center: "rough_texture", left_cheek: "smooth" }
```

**Color legend for zone texture:**
```typescript
const TEXTURE_COLORS = {
  smooth:          "#22d3ee",  // cyan
  visible_pores:   "#a3a3a3",  // gray
  oxidised_pores:  "#92400e",  // dark amber
  rough_texture:   "#7c3aed",  // purple
};
```

**Update scoring to use zone-texture data:**
```typescript
// More granular sebum/pore scoring
const oxidisedZones = Object.values(answers.poreZoneTextures ?? {}).filter(t => t === "oxidised_pores").length;
const roughZones    = Object.values(answers.poreZoneTextures ?? {}).filter(t => t === "rough_texture").length;
sebum        += oxidisedZones * 12;  // oxidised = sebum oxidation, congestion
textureScore += roughZones * 10;
```

---

## FIX 4 — Scoring Overhaul: Fix 87–100 Score Clustering

**Root cause:** Additive scoring accumulates too fast. 3 "Almost Always" answers = 3 × ~40pts = 120 → clamped to 100. Every heavy user gets 100.

**Solution: Normalized percentage-based scoring (NOT additive)**

### New Scoring Architecture

Each axis score = `(earned_points / max_possible_points_for_answered_questions) × 100`

This means:
- Answering 3 questions: scored against 3-question max, not 10-question max
- No score inflation from "partially answered" categories
- Only confidence score drops when fewer questions answered

```typescript
// New scoring structure
interface AxisScoring {
  earned: number;   // points earned from user's answers
  possible: number; // max points possible from questions actually answered
}

function scoreAxis(contributions: AxisScoring[]): number {
  const totalEarned   = contributions.reduce((s, c) => s + c.earned, 0);
  const totalPossible = contributions.reduce((s, c) => s + c.possible, 0);
  if (totalPossible === 0) return 0;
  // Apply a soft curve: raw ratio → curved score
  // This prevents clustering at extremes
  const raw = totalEarned / totalPossible; // 0.0 – 1.0
  // Soft S-curve: mild responses don't spike, severe responses stay high
  const curved = raw < 0.5
    ? 2 * raw * raw              // concave up for low scores (harder to reach midpoint)
    : 1 - Math.pow(-2 * raw + 2, 2) / 2; // concave down for high scores
  return Math.round(curved * 100);
}
```

### Full New Scoring Function

```typescript
export function computeSkinScore(answers: DiagnosisAnswers): SkinScore {

  // ── HELPER ─────────────────────────────────────────────────
  // freq: maps "None"|"Occasionally"|"Often"|"Almost Always" → 0,1,2,3
  const freq = (v?: string) =>
    ({ none: 0, occasionally: 1, often: 2, almost_always: 3 }[v?.toLowerCase().replace(/ /g,"_") ?? ""] ?? null);

  const zoneCount = (zones?: string[]) => zones?.length ?? 0;

  // ── HYDRATION ──────────────────────────────────────────────
  const hydrationContribs: AxisScoring[] = [];

  if (answers.skinFeelAfterCleansing !== undefined) {
    const map: Record<string, number> = { tight: 3, varies: 2, comfortable: 1, oily: 0 };
    hydrationContribs.push({
      earned:   map[answers.skinFeelAfterCleansing] ?? 0,
      possible: 3,
    });
  }
  if (answers.visibleDryness !== undefined) {
    hydrationContribs.push({
      earned:   Math.min(zoneCount(answers.visibleDryness), 5),
      possible: 5,
    });
  }
  if (answers.skinThinningFreq !== undefined) {
    const f = freq(answers.skinThinningFreq);
    if (f !== null) hydrationContribs.push({ earned: f, possible: 3 });
  }

  // ── BARRIER ────────────────────────────────────────────────
  const barrierContribs: AxisScoring[] = [];

  if (answers.activeStinging !== undefined) {
    const stinging = answers.activeStinging.filter(a => a !== "not_sure");
    barrierContribs.push({ earned: Math.min(stinging.length * 1.5, 3), possible: 3 });
  }
  if (answers.flushReactivity !== undefined) {
    const fmap: Record<string, number> = { none: 0, mild: 1, moderate: 2, intense: 3 };
    barrierContribs.push({ earned: fmap[answers.flushReactivity] ?? 0, possible: 3 });
  }
  if (answers.productReactions !== undefined) {
    barrierContribs.push({ earned: Math.min(answers.productReactions.length, 3), possible: 3 });
  }

  // ── ACNE ───────────────────────────────────────────────────
  const acneContribs: AxisScoring[] = [];

  if (answers.acneFrequency !== undefined) {
    const amap: Record<string, number> = { never: 0, rarely: 1, sometimes: 2, often: 3, always: 3 };
    acneContribs.push({ earned: amap[answers.acneFrequency] ?? 0, possible: 3 });
  }
  if (answers.acneZones !== undefined) {
    acneContribs.push({ earned: Math.min(zoneCount(answers.acneZones) * 0.6, 3), possible: 3 });
  }
  if (answers.acneType !== undefined) {
    const severity: Record<string, number> = { cystic: 3, pustule: 2, whitehead: 1.5, blackhead: 1 };
    const worst = Math.max(...(answers.acneType.map(t => severity[t] ?? 0)), 0);
    acneContribs.push({ earned: worst, possible: 3 });
  }

  // ── HORMONAL ───────────────────────────────────────────────
  const hormonalContribs: AxisScoring[] = [];

  if (answers.acneZones !== undefined) {
    const hormonalZones = ["left_jaw","right_jaw","chin","forehead_left","forehead_right"];
    const matched = answers.acneZones.filter(z => hormonalZones.includes(z)).length;
    hormonalContribs.push({ earned: Math.min(matched * 1.0, 3), possible: 3 });
    // Hairline bonus
    const hairline = answers.acneZones.filter(z => ["forehead_left","forehead_right"].includes(z)).length;
    if (hairline > 0) hormonalContribs.push({ earned: Math.min(hairline * 1.5, 3), possible: 3 });
  }
  if (answers.stressLevel !== undefined) {
    const smap: Record<string, number> = { low: 0, moderate: 1.5, high: 3 };
    hormonalContribs.push({ earned: smap[answers.stressLevel] ?? 0, possible: 3 });
  }

  // ── SENSITIVITY ────────────────────────────────────────────
  const sensitivityContribs: AxisScoring[] = [];

  if (answers.flushReactivity !== undefined) {
    const fmap: Record<string, number> = { none: 0, mild: 1, moderate: 2, intense: 3 };
    sensitivityContribs.push({ earned: fmap[answers.flushReactivity] ?? 0, possible: 3 });
  }
  if (answers.activeStinging !== undefined) {
    const stinging = answers.activeStinging.filter(a => a !== "not_sure");
    sensitivityContribs.push({ earned: Math.min(stinging.length, 3), possible: 3 });
  }

  // ── REDNESS ────────────────────────────────────────────────
  const rednessContribs: AxisScoring[] = [];

  if (answers.flushReactivity !== undefined) {
    const fmap: Record<string, number> = { none: 0, mild: 1, moderate: 2.5, intense: 3 };
    rednessContribs.push({ earned: fmap[answers.flushReactivity] ?? 0, possible: 3 });
  }
  if (answers.redZones !== undefined) {
    rednessContribs.push({ earned: Math.min(zoneCount(answers.redZones) * 0.75, 3), possible: 3 });
  }

  // ── SEBUM ──────────────────────────────────────────────────
  const sebumContribs: AxisScoring[] = [];

  if (answers.oilinessLevel !== undefined) {
    const omap: Record<string, number> = { dry: 0, normal: 0.5, combination: 1.5, oily: 2.5, very_oily: 3 };
    sebumContribs.push({ earned: omap[answers.oilinessLevel] ?? 0, possible: 3 });
  }
  if (answers.poreZoneTextures !== undefined) {
    const oxidised = Object.values(answers.poreZoneTextures).filter(t => t === "oxidised_pores").length;
    sebumContribs.push({ earned: Math.min(oxidised * 1.0, 3), possible: 3 });
  }

  // ── PIGMENTATION ────────────────────────────────────────────
  const pigmentContribs: AxisScoring[] = [];

  if (answers.pigmentationPattern !== undefined) {
    const pmap: Record<string, number> = { none: 0, freckles: 0.5, sun_spots: 1.5, post_acne: 2, melasma: 3 };
    pigmentContribs.push({ earned: pmap[answers.pigmentationPattern] ?? 0, possible: 3 });
  }
  if (answers.pigmentZones !== undefined) {
    pigmentContribs.push({ earned: Math.min(zoneCount(answers.pigmentZones) * 0.6, 3), possible: 3 });
  }
  if (answers.sunExposureHistory !== undefined) {
    const smap: Record<string, number> = { low: 0, moderate: 1.5, high: 3 };
    pigmentContribs.push({ earned: smap[answers.sunExposureHistory] ?? 0, possible: 3 });
  }

  // ── AGING ──────────────────────────────────────────────────
  const agingContribs: AxisScoring[] = [];

  if (answers.elasticityLevel !== undefined) {
    const emap: Record<string, number> = { firm: 0, mild_loss: 1, moderate: 2, significant: 3 };
    agingContribs.push({ earned: emap[answers.elasticityLevel] ?? 0, possible: 3 });
  }
  if (answers.skinThinningFreq !== undefined) {
    const f = freq(answers.skinThinningFreq);
    if (f !== null) agingContribs.push({ earned: f, possible: 3 });
  }
  if (answers.lessPlumpFreq !== undefined) {
    const f = freq(answers.lessPlumpFreq);
    if (f !== null) agingContribs.push({ earned: f, possible: 3 });
  }
  if (answers.skinLooseResistanceFreq !== undefined) {
    const f = freq(answers.skinLooseResistanceFreq);  // NEW question (replaces puffing)
    if (f !== null) agingContribs.push({ earned: f, possible: 3 });
  }

  // ── LIFESTYLE ──────────────────────────────────────────────
  const lifestyleContribs: AxisScoring[] = [];

  if (answers.sleepQuality !== undefined) {
    const smap: Record<string, number> = { good: 0, average: 1.5, poor: 3 };
    lifestyleContribs.push({ earned: smap[answers.sleepQuality] ?? 0, possible: 3 });
  }
  if (answers.stressLevel !== undefined) {
    const stmap: Record<string, number> = { low: 0, moderate: 1.5, high: 3 };
    lifestyleContribs.push({ earned: stmap[answers.stressLevel] ?? 0, possible: 3 });
  }
  if (answers.environmentType !== undefined) {
    const emap: Record<string, number> = { rural: 0, suburban: 1, urban: 2, urban_polluted: 3 };
    lifestyleContribs.push({ earned: emap[answers.environmentType] ?? 0, possible: 3 });
  }

  // ── NORMALIZE WITH S-CURVE ─────────────────────────────────
  function scoreAxis(contribs: AxisScoring[]): number {
    if (contribs.length === 0) return 0;
    const earned   = contribs.reduce((s, c) => s + c.earned, 0);
    const possible = contribs.reduce((s, c) => s + c.possible, 0);
    if (possible === 0) return 0;
    const raw = Math.min(earned / possible, 1.0);
    // Soft S-curve prevents clustering at 100
    const curved = raw < 0.5
      ? 2 * raw * raw
      : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    return Math.round(curved * 100);
  }

  // ── CONFIDENCE ─────────────────────────────────────────────
  const keyFields: (keyof DiagnosisAnswers)[] = [
    "skinFeelAfterCleansing","acneFrequency","flushReactivity",
    "oilinessLevel","pigmentationPattern","elasticityLevel",
    "sleepQuality","stressLevel","visibleDryness","acneZones",
  ];
  const answeredCount = keyFields.filter(k => answers[k] != null).length;
  let confidence = Math.round((answeredCount / keyFields.length) * 100);
  if (answers.sensitivityDataConfidence === "low") confidence = Math.max(confidence - 8, 0);

  return {
    hydration:    scoreAxis(hydrationContribs),
    barrier:      scoreAxis(barrierContribs),
    acne:         scoreAxis(acneContribs),
    sensitivity:  scoreAxis(sensitivityContribs),
    redness:      scoreAxis(rednessContribs),
    sebum:        scoreAxis(sebumContribs),
    pigmentation: scoreAxis(pigmentContribs),
    aging:        scoreAxis(agingContribs),
    hormonal:     scoreAxis(hormonalContribs),
    lifestyle:    scoreAxis(lifestyleContribs),
    confidence,
  };
}
```

### Expected Score Distribution After Fix

| User behavior | Old score | New score |
|---------------|-----------|-----------|
| 3 "Almost Always" answers | 95–100 | 55–72 |
| All "Almost Always" (10q) | 100 | 85–92 |
| Mixed moderate answers | 70–85 | 38–55 |
| Mostly mild answers | 50–70 | 20–38 |
| Mostly "None" | 15–30 | 5–15 |

Scores now span the full 0–100 range meaningfully.

---

## FIX 5 — DiagnosisAnswers Type: Add New Fields

Add to DiagnosisContext:
```typescript
// Category 7 new/changed
elasticityLevel?: "firm" | "mild_loss" | "moderate" | "significant"; // was local state
skinLooseResistanceFreq?: string;  // replaces "face puffs" question
facialContoursChange?: string;     // new 4th question

// Category 6 new
poreZoneTextures?: Record<string, "smooth"|"visible_pores"|"oxidised_pores"|"rough_texture">;

// Category 3/5 new
acnePatternMatch?: string;       // Visual Match selection
pigmentPatternMatch?: string;    // Visual Match selection
```

---

## SUMMARY — FILES TO MODIFY

| File | Change |
|------|--------|
| `src/components/diagnosis/ElasticityMeter.tsx` | CREATE — animated elasticity visual |
| `src/pages/diagnosis/Category7.tsx` | Replace elasticity test + replace question |
| `src/pages/diagnosis/Category3.tsx` | Visual Match → FaceMap flow |
| `src/pages/diagnosis/Category5.tsx` | Visual Match → FaceMap flow |
| `src/pages/diagnosis/Category6.tsx` | Texture brush multi-zone assignment |
| `src/context/DiagnosisContext.tsx` | Add new fields to DiagnosisAnswers |
| `src/lib/scoring.ts` | Replace with normalized S-curve scoring |

---

## DO NOT CHANGE
- Dark theme, color palette, typography
- Navigation flow between categories
- Cookie consent, Navbar, Footer
- Category 1, 2, 4, 8 unless directly related to context fix
