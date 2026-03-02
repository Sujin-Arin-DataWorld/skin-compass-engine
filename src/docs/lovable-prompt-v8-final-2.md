# LOVABLE PROMPT v8-FINAL — SaaS Skin Diagnostic Engine
### Complete Integration: Adaptive Q Trees · Scoring Stability · Slide UX · Protocol Builder

---

## COVERAGE CHECKLIST

| Layer | v7 | v8 | Notes |
|---|---|---|---|
| 5 Clinical Phases shell | ✅ | ✅ | Retained — outer navigation |
| Category Micro-Wizard (per-category slides) | ❌ | ✅ | NEW — replaces single long page per phase |
| Visual Match → Face Map order | ✅ | ✅ | Retained |
| Zone-level type + intensity (uiSignals v2) | ❌ | ✅ | NEW — Cat5 pattern + Cat6 zone type |
| Scoring stability patch | ❌ | ✅ | NEW — evidence scaling + high-score gate |
| idealSignals per category (calibrated) | ❌ | ✅ | NEW — prevents easy 90+ scores |
| Adaptive Precision Q rule engine | ❌ | ✅ | NEW — all 8 categories |
| WhyRules JSON + product bucket mapping | ❌ | ✅ | NEW — all 8 categories |
| Protocol Builder v1 (safety-gated) | ❌ | ✅ | NEW — barrier-first, SPF gating |
| Results: horizontal slide dashboard | ✅ | ✅ | Retained + updated with new data |
| Debug panel (?debug=true) | ✅ | ✅ | Retained + evidenceAdjusted field |
| Design system (fonts/colors/silk) | ✅ | ✅ | DO NOT CHANGE |

---

## ARCHITECTURE OVERVIEW

```
User enters → Phase 1 (Primary Concern Selection)
                    ↓
           Category Micro-Wizard (per activated category)
           ┌──────────────────────────────────────────────┐
           │ Slide 1: Visual Match (pattern hypothesis)   │
           │ Slide 2: Face/Zone Map (zone + type + sev)   │
           │ Slide 3: Core 3 Questions                    │
           │ Slide 4–N: Precision Q (adaptive, 2–4 max)  │
           │ Slide N+1: Mini Summary                      │
           └──────────────────────────────────────────────┘
                    ↓
           Phase 4: Systemic Risk (global, shared)
                    ↓
           Phase 5: Barrier Baseline (global, shared)
                    ↓
           Results: 5 horizontal slides
           [Diagnosis → Axis Breakdown → Protocol → Why Products → Subscribe]
```

**Key principles:**
- No long scrolling anywhere. Every category = micro-wizard with horizontal slides.
- Mobile: swipe gesture. Desktop: arrow buttons + keyboard left/right.
- Step dots at top per category (e.g., "2 / 5").
- "Skip" button on non-critical slides.
- Adaptive Precision Q slides are injected automatically — not shown unless triggered.

---

## PART 1 — ROUTING & SHELL

### 1A. Router

```tsx
// src/App.tsx
<Routes>
  <Route path="/"              element={<Index />} />
  <Route path="/diagnosis"     element={<DiagnosisShell />}>
    <Route index               element={<Navigate to="phase/1" replace />} />
    <Route path="phase/1"      element={<Phase1_ConcernSelector />} />
    <Route path="category/:id" element={<CategoryMicroWizard />} />  {/* NEW */}
    <Route path="phase/4"      element={<Phase4_SystemicRisk />} />
    <Route path="phase/5"      element={<Phase5_BarrierBaseline />} />
  </Route>
  <Route path="/results"       element={<Results />} />
</Routes>
```

### 1B. DiagnosisShell — Progress Header

```tsx
// src/pages/diagnosis/DiagnosisShell.tsx

// Progress is now: Phase1 → [C1..C8 micro-wizards] → Phase4 → Phase5 → Results
// Show a segmented bar: Phase 1 | Categories | Systemic | Barrier

const OUTER_STEPS = [
  { key: 'phase1',     label: 'Concern',   desc: 'What bothers you most' },
  { key: 'categories', label: 'Diagnosis', desc: 'Per-area assessment' },
  { key: 'systemic',   label: 'Systemic',  desc: 'Triggers & lifestyle' },
  { key: 'barrier',    label: 'Baseline',  desc: 'Tolerance & history' },
];

// Inner: when inside a category micro-wizard, show category-level dot progress
// (e.g., "Breakouts · 2 of 5 slides")

export default function DiagnosisShell() {
  const location = useLocation();
  const isCategoryRoute = location.pathname.includes('/category/');
  const currentCategoryId = isCategoryRoute
    ? location.pathname.split('/category/')[1]?.split('/')[0]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SilkBackground />
      <Navbar />

      {/* Outer phase progress */}
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-[680px] px-6 py-4">
          <OuterProgressBar currentPath={location.pathname} steps={OUTER_STEPS} />
          {isCategoryRoute && currentCategoryId && (
            <CategorySlideProgress categoryId={currentCategoryId} />
          )}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-[680px] px-6 py-10 pb-24">
        <Outlet />
      </main>
      <DiagnosisNavButtons />
    </div>
  );
}
```

---

## PART 2 — PHASE 1: CONCERN SELECTOR

```tsx
// src/pages/diagnosis/Phase1_ConcernSelector.tsx
// Unchanged from v7 — primary concern + secondary concerns + duration
// On completion: compute activatedCategories[] and navigate to first category

const CONCERN_TO_CATEGORIES: Record<string, string[]> = {
  acne:         ['C1_ACNE', 'C6_TEXTURE', 'C8_BARRIER'],
  redness:      ['C4_SENSITIVITY', 'C8_BARRIER'],
  dryness:      ['C3_HYDRATION', 'C8_BARRIER'],
  pigmentation: ['C5_PIGMENT', 'C4_SENSITIVITY'],
  oiliness:     ['C2_OILINESS', 'C1_ACNE', 'C6_TEXTURE'],
  aging:        ['C7_ELASTICITY', 'C5_PIGMENT', 'C8_BARRIER'],
  texture:      ['C6_TEXTURE', 'C1_ACNE', 'C8_BARRIER'],
  multiple:     ['C1_ACNE', 'C2_OILINESS', 'C3_HYDRATION', 'C4_SENSITIVITY', 'C5_PIGMENT', 'C6_TEXTURE', 'C7_ELASTICITY', 'C8_BARRIER'],
};

// Deduplicate and limit to max 4 categories to keep total flow under 5 min
function getActivatedCategories(primary: string, secondary: string[]): string[] {
  const all = [
    ...CONCERN_TO_CATEGORIES[primary] ?? [],
    ...secondary.flatMap(s => CONCERN_TO_CATEGORIES[s] ?? []),
  ];
  const unique = [...new Set(all)];
  return unique.slice(0, 4);
}
```

---

## PART 3 — CATEGORY MICRO-WIZARD

```tsx
// src/pages/diagnosis/CategoryMicroWizard.tsx
// Universal wrapper — renders the correct slides for any of the 8 categories

import { useParams, useNavigate } from 'react-router-dom';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { usePrecisionQEngine } from '@/lib/precisionQEngine';

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  C1_ACNE:        { label: 'Breakouts & Acne',       emoji: '🔴' },
  C2_OILINESS:    { label: 'Oiliness & Shine',        emoji: '✨' },
  C3_HYDRATION:   { label: 'Hydration & Dryness',     emoji: '💧' },
  C4_SENSITIVITY: { label: 'Sensitivity & Redness',   emoji: '🌡' },
  C5_PIGMENT:     { label: 'Pigmentation & Tone',     emoji: '🌑' },
  C6_TEXTURE:     { label: 'Pores & Texture',         emoji: '◎' },
  C7_ELASTICITY:  { label: 'Firmness & Elasticity',   emoji: '⏳' },
  C8_BARRIER:     { label: 'Barrier & Recovery',      emoji: '🛡' },
};

export default function CategoryMicroWizard() {
  const { id: categoryId } = useParams<{ id: string }>();
  const { answers, uiSignals, signals, preliminaryScores } = useDiagnosis();
  const [slideIndex, setSlideIndex] = useState(0);

  // Build base slides: [VisualMatch, FaceMap, Core3...core questions, MiniSummary]
  // Then inject Precision Q slides between Core3 and MiniSummary
  const baseSlides = useMemo(() => buildBaseSlides(categoryId!), [categoryId]);
  const precisionSlides = usePrecisionQEngine(categoryId!, { answers, uiSignals, signals, preliminaryScores });
  const allSlides = useMemo(() => [
    ...baseSlides.slice(0, -1),   // everything except MiniSummary
    ...precisionSlides,            // adaptive questions
    baseSlides[baseSlides.length - 1], // MiniSummary last
  ], [baseSlides, precisionSlides]);

  const meta = CATEGORY_META[categoryId!] ?? { label: categoryId!, emoji: '◆' };

  return (
    <div>
      {/* Category header */}
      <div className="mb-6 flex items-center gap-3">
        <span style={{ fontSize: '2rem' }}>{meta.emoji}</span>
        <div>
          <p style={{ fontFamily: "'DM Sans'", fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'hsl(var(--foreground-hint))' }}>
            Category Assessment
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 400,
            color: 'hsl(var(--foreground))' }}>
            {meta.label}
          </h2>
        </div>
      </div>

      {/* Slide dot progress */}
      <div className="mb-6 flex items-center gap-2">
        <span style={{ fontFamily: "'DM Sans'", fontSize: '0.75rem',
          color: 'hsl(var(--foreground-hint))' }}>
          {slideIndex + 1} / {allSlides.length}
        </span>
        <div className="flex gap-1.5 flex-1">
          {allSlides.map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1 overflow-hidden"
                 style={{ background: 'hsl(var(--border))' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: i <= slideIndex ? 'hsl(var(--primary))' : 'transparent' }}
                initial={false} animate={{ width: i <= slideIndex ? '100%' : '0%' }}
                transition={{ duration: 0.3 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Slide viewport — swipeable */}
      <SwipeableSlide
        slide={allSlides[slideIndex]}
        onNext={() => setSlideIndex(i => Math.min(i + 1, allSlides.length - 1))}
        onPrev={() => setSlideIndex(i => Math.max(i - 1, 0))}
      />

      {/* Nav buttons */}
      <CategorySlideNavButtons
        slideIndex={slideIndex}
        totalSlides={allSlides.length}
        onPrev={() => setSlideIndex(i => Math.max(i - 1, 0))}
        onNext={() => setSlideIndex(i => Math.min(i + 1, allSlides.length - 1))}
        onComplete={() => navigateToNextCategory(categoryId!)}
        isSkippable={allSlides[slideIndex]?.skippable}
      />
    </div>
  );
}
```

### 3A. Base Slide Definitions per Category

Each category has 3 required base slides + 1 mini-summary. Precision Q slides are injected adaptively.

**Slide Type 1: Visual Match**
- Show 4–5 pattern cards for the category
- User selects one → pre-highlights face zones (same as v7 Phase 2)
- evidenceGain: +1

**Slide Type 2: Face / Zone Map**
- FaceMap component with zone-level intensity (0–3) + type selection where applicable
- Cat5: zone severity only
- Cat6: zone + primaryType (oxidized_pores / rough_texture / enlarged_pores / etc.)
- Zone selection: evidenceGain +1 per zone (max +3 cap per category)
- evidenceGain: +1 to +3

**Slide Type 3: Core Questions (3 questions, one per slide OR grouped)**

> Note: Keep core questions SHORT. Use single-choice or severity-0–3 inputs.
> Each answered core question: evidenceGain +1

**Slide Type 4: Mini Summary (always last)**
- Show this category's preliminary axis score as a simple bar + label
- "Based on your responses: [Axis] — [Mild / Moderate / High]"
- "Next: [next category label] →" or "Review complete →"

---

### 3B. Category Core Questions Reference

**C1_ACNE — Core 3:**
1. How often do breakouts appear? → `breakoutFrequency` (Never / <Weekly / Several/week / Daily / Constant)
2. What type of breakout describes them best? → `acneLesionType` (Blackheads & bumps / Red inflamed spots / Deep painful nodules / Mix)
3. How long does a typical breakout take to heal? → `healingDuration` (A few days / ~1 week / 2+ weeks / Never fully clears)

**C2_OILINESS — Core 3:**
1. How quickly does shine return after cleansing? → `oilReturnHours` (0–2h / 2–4h / 4–6h / 6h+)
2. Where is oiliness most noticeable? → `oilDistribution` (T-zone / Full face / Cheeks only / Mixed)
3. Does makeup break down unevenly or slide off? → `makeupWear` (Rarely / By afternoon / Within 2h / Doesn't stay at all)

**C3_HYDRATION — Core 3:**
1. How does skin feel within 1 hour after cleansing? → `cleansingResponse` (Comfortable / Slightly tight / Very tight / Oily again)
2. Does skin look dull or dehydrated by end of day? → `endOfDayHydration` (Fresh / Slightly dull / Noticeably dull / Tight & flaky)
3. Does moisturizer absorb quickly but dryness returns fast? → `moistureRetention` (Stays hydrated / Needs reapplication once / Returns within hours / Doesn't feel hydrated at all)

**C4_SENSITIVITY — Core 3:**
1. How reactive is skin to temperature/product changes? → `flushReactivity` (None / Mild / Moderate / Intense)
2. How persistent is redness after a trigger? → `rednessPersistence` (Fades fast / ~30 min / Hours / Permanent baseline)
3. Which actives cause stinging? (multi-select) → `activeStinging[]` (AHA / BHA / Vitamin C / Retinol / Niacinamide / None)

**C5_PIGMENT — Core 3:**
1. Which type of pigmentation describes you best? → `pigmentPattern` (Post-acne marks / Sun spots / Symmetric mask-like / Scattered freckles / Diffuse dullness)
2. Does discoloration darken with sun exposure? → `pigmentPhotoResponse` (No change / Slightly / Noticeably / Dramatically)
3. How long do marks take to fade? → `pigmentFadeDuration` (Weeks / 1–2 months / 3–6 months / Stays indefinitely)

**C6_TEXTURE — Core 3:**
1. What best describes your texture concern? → `textureMainConcern` (Visible pores / Rough bumpy surface / Blackheads / Uneven skin tone / Mix)
2. Does texture worsen by end of day? → `textureWorsensByAfternoon` (Rarely / Sometimes / Often)
3. Does exfoliation help temporarily? → `exfoliationTempHelp` (Yes / No / Not sure)

**C7_ELASTICITY — Core 3:**
1. After gently pinching your cheek, how quickly does skin return? → `pinchReturn` (Fast <1s / Medium 1–2s / Slow 2–3s / Very slow 3s+)
2. Where do you notice firmness loss most? (multi-select) → `firmnessAreas[]` (Around eyes / Jawline / Neck / Nasolabial folds / Not noticeable yet)
3. Has your skin's texture visibly changed over the past 1–2 years? → `firmnessTrend` (No change / Subtle change / Noticeable change / Significant change)

**C8_BARRIER — Core 3:**
1. How often do redness + tightness + stinging occur together? → `barrierTriad` (Never / Sometimes / Often / Almost always)
2. How frequently do you use exfoliating acids or retinoids? → `exfoliationFrequency` (Rarely / 1–2×/week / 3–4×/week / 5+×/week)
3. Do new products often cause immediate irritation? → `productIntolerance` (Rarely / Sometimes / Often / Almost always)

---

## PART 4 — SCORING ENGINE v2 (Stability Patch Applied)

```typescript
// src/lib/scoring.ts — COMPLETE REPLACEMENT

export interface ClinicalScore {
  acne:          number;  // 0–100
  redness:       number;
  barrier:       number;
  hydration:     number;
  sebum:         number;
  pigmentation:  number;
  aging:         number;
  sensitivity:   number;
  hormonal:      number;
  lifestyle:     number;
  oxidative:     number;
  texture:       number;  // NEW in v8
  elasticity:    number;  // NEW in v8 (renamed from aging for clarity)
  severity:      'subclinical' | 'emerging' | 'active' | 'severe';
  dominantAxis:  string;
  hypothesis:    string;
  confidence:    number;
  protocolGating: ProtocolGating;
  _debug?: DebugData;
}

interface ProtocolGating {
  requiresBarrierFirst: boolean;
  canUseRetinol:        boolean;
  canUseAHA:            boolean;
  canUseVitaminC:       boolean;
}

interface DebugData {
  axes: Record<string, AxisDebug>;
  warning?: string;
}

interface AxisDebug {
  totalEarned:      number;
  totalMax:         number;
  ratio:            number;
  curvedScore:      number;
  answeredSignals:  number;
  idealSignals:     number;
  evidenceFactor:   number;    // raw 0..1
  evidenceAdjusted: number;    // after stability formula
  finalScore:       number;
  highScoreGated:   boolean;   // true if score was capped at 89
}

// ── IDEAL SIGNALS PER AXIS (calibrated for A-strategy: fast by default) ──
// These values prevent easy 90+ scores from just 2–3 core answers.
const IDEAL_SIGNALS: Record<string, number> = {
  acne:        7,  // visual + 3 zones + core3 = 7 → fills ideal naturally
  sebum:       6,
  hydration:   7,
  sensitivity: 7,
  pigment:     7,
  texture:     7,
  elasticity:  6,
  barrier:     8,  // highest: over-diagnosis risk is greatest here
  hormonal:    4,
  lifestyle:   3,
  oxidative:   2,
  redness:     3,
};

// ── S-CURVE ───────────────────────────────────────────────────────────────
function sCurve(ratio: number): number {
  const r = Math.min(Math.max(ratio, 0), 1);
  return r < 0.5
    ? 2 * r * r
    : 1 - Math.pow(-2 * r + 2, 2) / 2;
}

// ── CORE COMPUTE (v8: Stability Patch applied) ────────────────────────────
function computeAxisScore(
  contribs:        Array<{ earned: number; max: number }>,
  answeredSignals: number,
  axisKey:         string,
  debugKey?:       string,
  debugStore?:     DebugData
): number {
  if (!contribs.length) return 0;

  const idealSignals  = IDEAL_SIGNALS[axisKey] ?? 5;
  const totalEarned   = contribs.reduce((s, c) => s + c.earned, 0);
  const totalMax      = contribs.reduce((s, c) => s + c.max,    0);
  if (totalMax === 0) return 0;

  const ratio       = Math.min(totalEarned / totalMax, 1.0);
  const curvedScore = sCurve(ratio) * 100;

  // ── STABILITY PATCH A: evidence scaling (replaces v7 "pull toward 50") ──
  // Old (v7):  final = curved * evidence + 50 * (1 - evidence)
  //   → problem: 3 answers at max = ~69 score even with 0 evidence contribution
  // New (v8):  final = curved * (0.35 + 0.65 * evidence)
  //   → low evidence compresses toward ~35% of curved; never collapses to 0
  const evidence         = Math.min(answeredSignals / Math.max(idealSignals, 1), 1.0);
  const evidenceAdjusted = 0.35 + 0.65 * evidence;
  let   finalScore       = Math.round(curvedScore * evidenceAdjusted);

  // ── STABILITY PATCH B: high-score gate (90+ requires sufficient evidence) ──
  const highScoreThreshold          = 90;
  const minimumSignalsForHighScore  = Math.ceil(0.7 * idealSignals);
  let   highScoreGated              = false;
  if (answeredSignals < minimumSignalsForHighScore && finalScore >= highScoreThreshold) {
    finalScore    = 89;
    highScoreGated = true;
  }

  finalScore = Math.min(100, Math.max(0, finalScore));

  // ── DEBUG ─────────────────────────────────────────────────────────────
  if (debugKey && debugStore) {
    debugStore.axes[debugKey] = {
      totalEarned, totalMax,
      ratio:            Math.round(ratio * 100)         / 100,
      curvedScore:      Math.round(curvedScore),
      answeredSignals,  idealSignals,
      evidenceFactor:   Math.round(evidence * 100)      / 100,
      evidenceAdjusted: Math.round(evidenceAdjusted * 100) / 100,
      finalScore,       highScoreGated,
    };
    if (totalMax < answeredSignals * 0.5) {
      debugStore.warning = `${debugKey}: totalMax may be underestimated (max=${totalMax}, answered=${answeredSignals})`;
    }
  }

  return finalScore;
}

// ── EVIDENCE COUNTING HELPERS ─────────────────────────────────────────────
// Interactive modules MUST count as evidence signals.
// Call these from CategoryMicroWizard when slides complete.

function countZoneEvidence(zones: ZoneSelection[], maxCap = 3): number {
  return Math.min(zones?.length ?? 0, maxCap);
}

function countInteractiveEvidence(uiSignals: UISignalsV2, axisKey: string): number {
  let count = 0;
  if (axisKey === 'acne'     && uiSignals.acne?.zones?.length)       count += Math.min(uiSignals.acne.zones.length, 3);
  if (axisKey === 'sebum'    && uiSignals.sebum?.zones?.length)      count += Math.min(uiSignals.sebum.zones.length, 3);
  if (axisKey === 'hydration'&& uiSignals.hydration?.retentionLevel !== undefined) count++;
  if (axisKey === 'sensitivity' && uiSignals.sensitivity?.flushZones?.length) count += 1;
  if (axisKey === 'pigment'  && uiSignals.pigment?.zones?.length)    count += Math.min(uiSignals.pigment.zones.length, 3);
  if (axisKey === 'texture'  && uiSignals.texture?.zones?.length)    count += Math.min(uiSignals.texture.zones.length, 3);
  if (axisKey === 'elasticity' && uiSignals.elasticity?.selectedLevel !== undefined) count++;
  if (axisKey === 'barrier'  && uiSignals.barrier?.zones?.length)    count += 1;
  // Visual match pattern selection always counts +1
  const vm = (uiSignals as any)[axisKey.toLowerCase()]?.selectedPattern;
  if (vm) count++;
  return count;
}

// ── MAIN FUNCTION ─────────────────────────────────────────────────────────
export function computeClinicalScore(
  answers:    DiagnosisAnswers,
  uiSignals:  UISignalsV2,
  signals:    PrecisionSignals,
  debug = false
): ClinicalScore {

  const debugStore: DebugData = { axes: {} };

  // ── ACNE ────────────────────────────────────────────────────────────────
  const acneContribs: Contrib[] = [];
  let acneAnswered = countInteractiveEvidence(uiSignals, 'acne');

  const freqMap: Record<string, number> = { never: 0, less_weekly: 1, several_weekly: 2, daily: 3, constant: 4 };
  if (answers.breakoutFrequency !== undefined) {
    acneContribs.push({ earned: freqMap[answers.breakoutFrequency] ?? 0, max: 4 });
    acneAnswered++;
  }
  if (answers.acneLesionType) {
    const lv: Record<string, number> = { blackheads_bumps: 1.5, red_inflamed: 3, deep_cystic: 4, mix: 2.5 };
    acneContribs.push({ earned: lv[answers.acneLesionType] ?? 0, max: 4 });
    acneAnswered++;
  }
  if (answers.healingDuration) {
    const hv: Record<string, number> = { few_days: 0.5, one_week: 2, two_plus_weeks: 3.5, never_clears: 4 };
    acneContribs.push({ earned: hv[answers.healingDuration] ?? 0, max: 4 });
    acneAnswered++;
  }
  if (uiSignals.acne?.zones?.length) {
    const total = uiSignals.acne.zones.reduce((s, z) => s + z.severity, 0);
    acneContribs.push({ earned: Math.min(total, 12), max: 12 });
  }
  // Precision Q signal effects
  if (signals.hormonalCluster === 'yes')          acneContribs.push({ earned: 0.6, max: 1 });
  if (signals.hormonalCycle !== undefined)        { acneContribs.push({ earned: signals.hormonalCycle * 0.3, max: 1.2 }); acneAnswered++; }
  if (signals.lesionDuration === 'yes')           acneContribs.push({ earned: 0.5, max: 1 });
  if (signals.postAcneMarkType === 'brown_marks') acneContribs.push({ earned: 0.3, max: 1 });

  const acne = computeAxisScore(acneContribs, acneAnswered, 'acne', debug ? 'acne' : undefined, debug ? debugStore : undefined);

  // ── SEBUM ───────────────────────────────────────────────────────────────
  const sebumContribs: Contrib[] = [];
  let sebumAnswered = countInteractiveEvidence(uiSignals, 'sebum');

  if (answers.oilReturnHours) {
    const ov: Record<string, number> = { '0_2': 4, '2_4': 3, '4_6': 1.5, '6_plus': 0.5 };
    sebumContribs.push({ earned: ov[answers.oilReturnHours] ?? 0, max: 4 });
    sebumAnswered++;
  }
  if (answers.oilDistribution) {
    const dv: Record<string, number> = { full_face: 4, t_zone: 3, mixed: 2, cheeks_only: 1 };
    sebumContribs.push({ earned: dv[answers.oilDistribution] ?? 0, max: 4 });
    sebumAnswered++;
  }
  if (answers.makeupWear) {
    const mv: Record<string, number> = { doesnt_stay: 4, within_2h: 3, by_afternoon: 2, rarely: 0.5 };
    sebumContribs.push({ earned: mv[answers.makeupWear] ?? 0, max: 4 });
    sebumAnswered++;
  }
  if (uiSignals.sebum?.zones?.length) {
    const total = uiSignals.sebum.zones.reduce((s, z) => s + z.severity, 0);
    sebumContribs.push({ earned: Math.min(total, 9), max: 9 });
  }
  if (signals.tightDespiteShine) {
    const sv: Record<string, number> = { often: 0.6, sometimes: 0.3, rarely: 0 };
    sebumContribs.push({ earned: sv[signals.tightDespiteShine] ?? 0, max: 0.6 });
    sebumAnswered++;
  }

  const sebum = computeAxisScore(sebumContribs, sebumAnswered, 'sebum', debug ? 'sebum' : undefined, debug ? debugStore : undefined);

  // ── HYDRATION ───────────────────────────────────────────────────────────
  const hydrationContribs: Contrib[] = [];
  let hydrationAnswered = countInteractiveEvidence(uiSignals, 'hydration');

  if (answers.cleansingResponse) {
    const cv: Record<string, number> = { comfortable: 0, slightly_tight: 2, very_tight: 4, oily_again: 0 };
    hydrationContribs.push({ earned: cv[answers.cleansingResponse] ?? 0, max: 4 });
    hydrationAnswered++;
  }
  if (answers.endOfDayHydration) {
    const ev: Record<string, number> = { fresh: 0, slightly_dull: 1.5, noticeably_dull: 3, tight_flaky: 4 };
    hydrationContribs.push({ earned: ev[answers.endOfDayHydration] ?? 0, max: 4 });
    hydrationAnswered++;
  }
  if (answers.moistureRetention) {
    const mrv: Record<string, number> = { stays_hydrated: 0, once: 1.5, returns_within_hours: 3, never_feels_hydrated: 4 };
    hydrationContribs.push({ earned: mrv[answers.moistureRetention] ?? 0, max: 4 });
    hydrationAnswered++;
  }
  if (signals.dryWithin1h) {
    const dhv: Record<string, number> = { yes: 0.5, sometimes: 0.3, no: 0 };
    hydrationContribs.push({ earned: dhv[signals.dryWithin1h] ?? 0, max: 0.5 });
    hydrationAnswered++;
  }
  if (signals.moistureReturnsFast) {
    const mrf: Record<string, number> = { often: 0.6, sometimes: 0.3, rarely: 0 };
    hydrationContribs.push({ earned: mrf[signals.moistureReturnsFast] ?? 0, max: 0.6 });
    hydrationAnswered++;
  }

  const hydration = computeAxisScore(hydrationContribs, hydrationAnswered, 'hydration', debug ? 'hydration' : undefined, debug ? debugStore : undefined);

  // ── SENSITIVITY ─────────────────────────────────────────────────────────
  const sensitivityContribs: Contrib[] = [];
  let sensitivityAnswered = countInteractiveEvidence(uiSignals, 'sensitivity');

  if (answers.flushReactivity) {
    const fv: Record<string, number> = { none: 0, mild: 1, moderate: 2.5, intense: 4 };
    sensitivityContribs.push({ earned: fv[answers.flushReactivity] ?? 0, max: 4 });
    sensitivityAnswered++;
  }
  if (answers.activeStinging?.length) {
    const stinging = answers.activeStinging.filter(a => !['none', 'not_sure'].includes(a));
    sensitivityContribs.push({ earned: Math.min(stinging.length * 1.5, 4), max: 4 });
    sensitivityAnswered++;
  }
  if (answers.rednessPersistence) {
    const pv: Record<string, number> = { fades_fast: 0, half_hour: 1.5, hours: 3, permanent: 4 };
    sensitivityContribs.push({ earned: pv[answers.rednessPersistence] ?? 0, max: 4 });
    sensitivityAnswered++;
  }
  if (signals.persistentCapillaries === 'yes')   { sensitivityContribs.push({ earned: 0.5, max: 1 }); sensitivityAnswered++; }
  if (signals.rednessBaseline === 'yes')          sensitivityContribs.push({ earned: 0.5, max: 1 });

  const sensitivity = computeAxisScore(sensitivityContribs, sensitivityAnswered, 'sensitivity', debug ? 'sensitivity' : undefined, debug ? debugStore : undefined);

  // ── REDNESS (derived, shares signals with sensitivity) ──────────────────
  const rednessContribs: Contrib[] = [];
  let rednessAnswered = 0;

  if (answers.flushReactivity) {
    const fv: Record<string, number> = { none: 0, mild: 1, moderate: 2.5, intense: 4 };
    rednessContribs.push({ earned: fv[answers.flushReactivity] ?? 0, max: 4 });
    rednessAnswered++;
  }
  if (answers.rednessPersistence) {
    const pv: Record<string, number> = { fades_fast: 0, half_hour: 1.5, hours: 3, permanent: 4 };
    rednessContribs.push({ earned: pv[answers.rednessPersistence] ?? 0, max: 4 });
    rednessAnswered++;
  }
  if (signals.persistentCapillaries === 'yes') { rednessContribs.push({ earned: 0.5, max: 1 }); rednessAnswered++; }

  const redness = computeAxisScore(rednessContribs, rednessAnswered, 'redness', debug ? 'redness' : undefined, debug ? debugStore : undefined);

  // ── PIGMENTATION ────────────────────────────────────────────────────────
  const pigmentContribs: Contrib[] = [];
  let pigmentAnswered = countInteractiveEvidence(uiSignals, 'pigment');

  if (answers.pigmentPattern) {
    const pv: Record<string, number> = { post_acne_marks: 3, sun_spots: 3, symmetric_mask: 4, scattered_freckles: 2, diffuse_dullness: 2 };
    pigmentContribs.push({ earned: pv[answers.pigmentPattern] ?? 0, max: 4 });
    pigmentAnswered++;
  }
  if (answers.pigmentPhotoResponse) {
    const rv: Record<string, number> = { no_change: 0, slightly: 1.5, noticeably: 3, dramatically: 4 };
    pigmentContribs.push({ earned: rv[answers.pigmentPhotoResponse] ?? 0, max: 4 });
    pigmentAnswered++;
  }
  if (answers.pigmentFadeDuration) {
    const fdv: Record<string, number> = { weeks: 0.5, one_two_months: 1.5, three_six_months: 3, stays_indefinitely: 4 };
    pigmentContribs.push({ earned: fdv[answers.pigmentFadeDuration] ?? 0, max: 4 });
    pigmentAnswered++;
  }
  // Zone severity contribution
  if (uiSignals.pigment?.zones?.length) {
    const avg = uiSignals.pigment.zones.reduce((s, z) => s + z.severity, 0) / uiSignals.pigment.zones.length / 3;
    const coverage = Math.min(uiSignals.pigment.zones.length / 4, 1);
    pigmentContribs.push({ earned: (0.65 * avg + 0.35 * coverage) * 4, max: 4 });
  }
  if (signals.symmetry === 'yes')          pigmentContribs.push({ earned: 0.3, max: 0.5 });
  if (signals.uvDarken === 'yes')          { pigmentContribs.push({ earned: 0.6, max: 1 }); pigmentAnswered++; }
  if (signals.melasmaHormonalHistory === 'yes') pigmentContribs.push({ earned: 0.3, max: 0.5 });

  const pigmentation = computeAxisScore(pigmentContribs, pigmentAnswered, 'pigment', debug ? 'pigmentation' : undefined, debug ? debugStore : undefined);

  // ── TEXTURE ─────────────────────────────────────────────────────────────
  const textureContribs: Contrib[] = [];
  let textureAnswered = countInteractiveEvidence(uiSignals, 'texture');

  if (answers.textureMainConcern) {
    const tv: Record<string, number> = { visible_pores: 3, rough_bumpy: 3, blackheads: 2.5, uneven_tone: 2, mix: 3 };
    textureContribs.push({ earned: tv[answers.textureMainConcern] ?? 0, max: 3 });
    textureAnswered++;
  }
  if (answers.textureWorsensByAfternoon) {
    const tv: Record<string, number> = { often: 3, sometimes: 1.5, rarely: 0 };
    textureContribs.push({ earned: tv[answers.textureWorsensByAfternoon] ?? 0, max: 3 });
    textureAnswered++;
  }
  if (answers.exfoliationTempHelp !== undefined) {
    textureContribs.push({ earned: answers.exfoliationTempHelp === 'yes' ? 2 : 0, max: 2 });
    textureAnswered++;
  }
  // Zone type-weighted contribution
  if (uiSignals.texture?.zones?.length) {
    const typeWeight: Record<string, number> = {
      oxidized_pores: 1.0, enlarged_pores: 0.8, rough_texture: 0.9,
      closed_comedones: 0.9, sebaceous_filaments: 0.6,
      uneven_texture: 0.7, mixed: 0.85,
    };
    const zoneCoverage = Math.min(uiSignals.texture.zones.length / 4, 1);
    const avgScore = uiSignals.texture.zones.reduce((s, z) => {
      const w = typeWeight[z.primaryType] ?? 0.8;
      return s + (z.severity / 3) * w;
    }, 0) / Math.max(uiSignals.texture.zones.length, 1);
    textureContribs.push({ earned: (avgScore * (0.7 + 0.3 * zoneCoverage)) * 4, max: 4 });
  }
  if (signals.noseOxidizedPlugs !== undefined)     { textureContribs.push({ earned: (signals.noseOxidizedPlugs / 3) * 0.9, max: 0.9 }); textureAnswered++; }
  if (signals.foreheadRoughTexture !== undefined)  { textureContribs.push({ earned: (signals.foreheadRoughTexture / 3) * 0.7, max: 0.7 }); textureAnswered++; }

  const texture = computeAxisScore(textureContribs, textureAnswered, 'texture', debug ? 'texture' : undefined, debug ? debugStore : undefined);

  // ── ELASTICITY ──────────────────────────────────────────────────────────
  const elasticityContribs: Contrib[] = [];
  let elasticityAnswered = countInteractiveEvidence(uiSignals, 'elasticity');

  if (answers.pinchReturn) {
    const pv: Record<string, number> = { fast: 0, medium: 1.5, slow: 3, very_slow: 4 };
    elasticityContribs.push({ earned: pv[answers.pinchReturn] ?? 0, max: 4 });
    elasticityAnswered++;
  }
  if (answers.firmnessAreas?.length) {
    elasticityContribs.push({ earned: Math.min(answers.firmnessAreas.length * 1.2, 4), max: 4 });
    elasticityAnswered++;
  }
  if (answers.firmnessTrend) {
    const fv: Record<string, number> = { no_change: 0, subtle: 1.5, noticeable: 3, significant: 4 };
    elasticityContribs.push({ earned: fv[answers.firmnessTrend] ?? 0, max: 4 });
    elasticityAnswered++;
  }
  if (uiSignals.elasticity?.selectedLevel !== undefined) {
    elasticityContribs.push({ earned: uiSignals.elasticity.selectedLevel * 1.5, max: 4.5 });
  }

  const elasticity = computeAxisScore(elasticityContribs, elasticityAnswered, 'elasticity', debug ? 'elasticity' : undefined, debug ? debugStore : undefined);

  // ── BARRIER ─────────────────────────────────────────────────────────────
  const barrierContribs: Contrib[] = [];
  let barrierAnswered = countInteractiveEvidence(uiSignals, 'barrier');

  if (answers.barrierTriad) {
    const bv: Record<string, number> = { never: 0, sometimes: 1.5, often: 3, almost_always: 4 };
    barrierContribs.push({ earned: bv[answers.barrierTriad] ?? 0, max: 4 });
    barrierAnswered++;
  }
  if (answers.exfoliationFrequency) {
    const ev: Record<string, number> = { rarely: 0, '1_2': 1, '3_4': 3, '5_plus': 4 };
    barrierContribs.push({ earned: ev[answers.exfoliationFrequency] ?? 0, max: 4 });
    barrierAnswered++;
  }
  if (answers.productIntolerance) {
    const pv: Record<string, number> = { rarely: 0, sometimes: 1.5, often: 3, almost_always: 4 };
    barrierContribs.push({ earned: pv[answers.productIntolerance] ?? 0, max: 4 });
    barrierAnswered++;
  }
  if (signals.exfoliationFrequency) {
    const sv: Record<string, number> = { rare: 0, '1_2': 1, '3_4': 0.5, '5_plus': 0.8 };
    barrierContribs.push({ earned: sv[signals.exfoliationFrequency] ?? 0, max: 0.8 });
    barrierAnswered++;
  }
  if (signals.barrierTriad === 'yes') { barrierContribs.push({ earned: 0.8, max: 1 }); barrierAnswered++; }

  const barrier = computeAxisScore(barrierContribs, barrierAnswered, 'barrier', debug ? 'barrier' : undefined, debug ? debugStore : undefined);

  // ── HORMONAL, LIFESTYLE, OXIDATIVE (unchanged from v7, use existing signals) ──
  // [Keep v7 logic for these derived axes — they don't have dedicated categories]

  // ── DERIVED FIELDS ───────────────────────────────────────────────────────
  const scores = { acne, redness, barrier, hydration, sebum, pigmentation, elasticity, sensitivity, texture };

  const dominantAxis = (Object.entries(scores) as [string, number][])
    .sort(([, a], [, b]) => b - a)[0][0];

  const topScore = Math.max(...Object.values(scores));
  const severity =
    topScore >= 80 ? 'severe'     :
    topScore >= 60 ? 'active'     :
    topScore >= 30 ? 'emerging'   : 'subclinical';

  const protocolGating: ProtocolGating = {
    requiresBarrierFirst: barrier >= 60,
    canUseRetinol:  barrier < 60 && sensitivity < 65 && !answers.activeStinging?.includes('retinol'),
    canUseAHA:      barrier < 50 && !answers.activeStinging?.includes('aha'),
    canUseVitaminC: sensitivity < 55 && !answers.activeStinging?.includes('vitamin_c'),
  };

  const keyFields = ['primaryConcern', 'visualPatternMatch', 'breakoutFrequency', 'oilReturnHours',
    'cleansingResponse', 'flushReactivity', 'pigmentPattern', 'textureMainConcern',
    'pinchReturn', 'barrierTriad'] as const;
  const confidence = Math.round(
    keyFields.filter(k => (answers as any)[k] != null).length / keyFields.length * 100
  );

  return {
    ...scores, severity, dominantAxis,
    hypothesis:    answers.hypothesis ?? 'mixed_concern',
    confidence,    protocolGating,
    ...(debug ? { _debug: debugStore } : {}),
  } as ClinicalScore;
}
```

---

## PART 5 — UI SIGNALS SCHEMA v2

```typescript
// src/types/uiSignals.ts

type Severity03    = 0 | 1 | 2 | 3;
type FaceZone      = 'forehead' | 'nose' | 'left_cheek' | 'right_cheek' | 'chin'
                   | 'upper_lip' | 'jawline' | 'under_eye' | 'temple' | 'full_face'
                   | 'forehead_left' | 'forehead_right' | 'left_jaw' | 'right_jaw'
                   | 'forehead_center';

type ZoneSelection = {
  zone:       FaceZone;
  severity:   Severity03;   // 0 = not active; 1 mild; 2 moderate; 3 severe
  source?:    'user' | 'prefill';
};

// ── Category 5: Pigmentation ────────────────────────────────────────────
type PigmentPattern = 'pih_spots' | 'melasma_mask' | 'freckle_scattered'
                    | 'diffuse_dullness' | 'mixed';

type PigmentSignalsV2 = {
  selectedPattern?: PigmentPattern;
  zones:            ZoneSelection[];
  patternPrefill?:  ZoneSelection[];  // auto-suggested from visual match
};

// ── Category 6: Pores & Texture ─────────────────────────────────────────
type TextureType = 'oxidized_pores' | 'enlarged_pores' | 'rough_texture'
                 | 'closed_comedones' | 'sebaceous_filaments' | 'uneven_texture' | 'mixed';

type TextureZoneSelection = ZoneSelection & {
  primaryType: TextureType;
};

type TextureSignalsV2 = {
  zones:            TextureZoneSelection[];
  patternPrefill?:  TextureZoneSelection[];
};

// ── Full UISignals Schema v2 ─────────────────────────────────────────────
export type UISignalsV2 = {
  acne?: {
    selectedPattern?: string;  // e.g. 'hormonal_jawline', 'deep_cystic'
    zones:            ZoneSelection[];
  };
  sebum?: {
    zones:       ZoneSelection[];
    oilTimeline?: number;  // hours until shine returns
  };
  hydration?: {
    zones?:          ZoneSelection[];
    retentionLevel?: Severity03;  // from simulation
  };
  sensitivity?: {
    activesSting?: string[];
    flushZones?:   ZoneSelection[];
  };
  pigment?:     PigmentSignalsV2;
  texture?:     TextureSignalsV2;
  elasticity?: {
    selectedLevel?: Severity03;
    zones?:         ZoneSelection[];
  };
  barrier?: {
    zones?: ZoneSelection[];
  };
};

// ── Evidence Gain Rules ───────────────────────────────────────────────────
// Visual Match pattern selection:              +1
// Zone entry per zone (capped per category):   +1 per zone (max 3)
// Zone type selection (Cat6):                  +1 (max 2)
// Each Core Q answered:                        +1
// Each Precision Q answered:                   +1 (per evidenceGain in rule)
```

---

## PART 6 — PRECISION Q ENGINE (JSON Rule Table + Runtime)

### 6A. PrecisionQEngine Runtime

```typescript
// src/lib/precisionQEngine.ts

import PRECISION_RULES from '@/data/precisionRules.json';

export function usePrecisionQEngine(
  categoryId: string,
  context: { answers: DiagnosisAnswers; uiSignals: UISignalsV2; signals: PrecisionSignals; preliminaryScores: Record<string, number> }
): PrecisionSlide[] {

  const cat = PRECISION_RULES.categories[categoryId];
  if (!cat) return [];

  const GLOBAL = PRECISION_RULES.global;
  const matchedRules = cat.rules
    .filter(rule => evalTrigger(rule.trigger, context))
    .sort((a, b) => b.priority - a.priority);

  const questions: PrecisionQuestion[] = [];
  const seen = new Set<string>();

  for (const rule of matchedRules) {
    for (const q of rule.questions) {
      if (questions.length >= GLOBAL.maxPrecisionQuestionsPerCategory) break;
      if (!seen.has(q.id)) {
        seen.add(q.id);
        questions.push(q);
      }
    }
  }

  return questions.map(q => ({ type: 'precision_q', question: q, skippable: false }));
}

// Trigger evaluator (supports all operators defined in trigger DSL)
function evalTrigger(trigger: Trigger, ctx: EvalContext): boolean {
  if (trigger.all)  return trigger.all.every(t => evalSingleTrigger(t, ctx));
  if (trigger.any)  return trigger.any.some(t  => evalSingleTrigger(t, ctx));
  return evalSingleTrigger(trigger, ctx);
}

function evalSingleTrigger(t: SingleTrigger, ctx: EvalContext): boolean {
  const val = getPath(ctx, t.path);
  switch (t.op) {
    case 'isMissing':           return val === undefined || val === null;
    case 'exists':              return val !== undefined && val !== null;
    case 'eq':                  return val === t.value;
    case 'gte':                 return typeof val === 'number' && val >= t.value;
    case 'lte':                 return typeof val === 'number' && val <= t.value;
    case 'between':             return typeof val === 'number' && val >= t.value[0] && val <= t.value[1];
    case 'includes':            return Array.isArray(val) && val.includes(t.value);
    case 'includesAny':         return Array.isArray(val) && t.value.some((v: any) => val.includes(v));
    case 'hasZoneMinSeverity':  return hasZoneMinSeverity(val, t.value.zone, t.value.minSeverity);
    case 'hasZoneTypeMinSeverity': return hasZoneTypeMinSeverity(val, t.value.zone, t.value.type, t.value.minSeverity);
    case 'zoneCoverageAtLeast': return (val?.length ?? 0) >= t.value;
    case 'dominantZoneIs':      return dominantZoneIs(val, t.value);
    default: return false;
  }
}

function hasZoneMinSeverity(zones: ZoneSelection[], zone: string, minSev: number): boolean {
  return zones?.some(z => z.zone === zone && z.severity >= minSev) ?? false;
}
function hasZoneTypeMinSeverity(zones: TextureZoneSelection[], zone: string, type: string, minSev: number): boolean {
  return zones?.some(z => z.zone === zone && z.primaryType === type && z.severity >= minSev) ?? false;
}
function zoneCoverageAtLeast(zones: ZoneSelection[], n: number): boolean {
  return (zones?.length ?? 0) >= n;
}
function dominantZoneIs(zones: ZoneSelection[], zone: string): boolean {
  if (!zones?.length) return false;
  const dom = zones.reduce((a, b) => b.severity > a.severity ? b : a);
  return dom.zone === zone;
}
```

### 6B. Precision Q Rules JSON

```json
// src/data/precisionRules.json
{
  "version": "v1.0",
  "global": {
    "maxPrecisionQuestionsPerCategory": 4,
    "evidenceLowThreshold": 0.65,
    "ambiguityBand": { "low": 0.55, "high": 0.75 }
  },
  "categories": {
    "C1_ACNE": {
      "axisKey": "acne",
      "rules": [
        {
          "id": "C1_HORMONAL_AMBIGUOUS",
          "priority": 100,
          "trigger": {
            "all": [
              { "any": [
                { "path": "uiSignals.acne.zones", "op": "hasZoneMinSeverity", "value": { "zone": "jawline", "minSeverity": 2 } },
                { "path": "answers.acneLesionType", "op": "includesAny", "value": ["red_inflamed", "deep_cystic"] }
              ]},
              { "path": "signals.hormonalCycle", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C1_HORMONAL_CLUSTER",
              "type": "single_choice",
              "text": "Do breakouts cluster mainly on your jawline or chin?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_applicable", "label": "Not applicable" }
              ],
              "signalEffects": { "set": { "signals.hormonalCluster": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C1_HORMONAL_CYCLE",
              "type": "severity_0_3",
              "text": "Do breakouts flare in a monthly cycle?",
              "signalEffects": { "set": { "signals.hormonalCycle": "{severity}" } },
              "evidenceGain": 1
            }
          ]
        },
        {
          "id": "C1_SEVERITY_CONFIRM",
          "priority": 80,
          "trigger": {
            "all": [
              { "path": "preliminaryScores.acne", "op": "between", "value": [0.60, 0.90] },
              { "path": "signals.lesionDuration", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C1_DURATION",
              "type": "single_choice",
              "text": "Do inflamed breakouts typically last longer than 7 days?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "unsure", "label": "Not sure" }
              ],
              "signalEffects": { "set": { "signals.lesionDuration": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C1_MARKS",
              "type": "single_choice",
              "text": "After a breakout heals, what remains?",
              "options": [
                { "value": "red_marks", "label": "Red marks" },
                { "value": "brown_marks", "label": "Brown / dark marks" },
                { "value": "none", "label": "Nothing noticeable" }
              ],
              "signalEffects": { "set": { "signals.postAcneMarkType": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C2_OILINESS": {
      "axisKey": "sebum",
      "rules": [
        {
          "id": "C2_DEHYDRATED_OILY",
          "priority": 100,
          "trigger": {
            "all": [
              { "path": "preliminaryScores.sebum", "op": "gte", "value": 0.60 },
              { "path": "preliminaryScores.hydration", "op": "lte", "value": 0.45 },
              { "path": "signals.tightDespiteShine", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C2_TIGHT_DESPITE_SHINE",
              "type": "single_choice",
              "text": "Does your skin feel tight even when it looks shiny?",
              "options": [
                { "value": "often", "label": "Often" },
                { "value": "sometimes", "label": "Sometimes" },
                { "value": "rarely", "label": "Rarely" }
              ],
              "signalEffects": { "set": { "signals.tightDespiteShine": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C2_PATCHY_MAKEUP",
              "type": "single_choice",
              "text": "Does makeup separate with patchy dryness at the same time?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_sure", "label": "Not sure" }
              ],
              "signalEffects": { "set": { "signals.patchyMakeupDryness": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C3_HYDRATION": {
      "axisKey": "hydration",
      "rules": [
        {
          "id": "C3_TEWL_SUSPECT",
          "priority": 100,
          "trigger": {
            "all": [
              { "path": "preliminaryScores.hydration", "op": "gte", "value": 0.60 },
              { "path": "preliminaryScores.barrier", "op": "gte", "value": 0.55 },
              { "path": "signals.dryWithin1h", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C3_DRY_WITHIN_1H",
              "type": "single_choice",
              "text": "Do you feel dryness or tightness within 1 hour after cleansing?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "sometimes", "label": "Sometimes" },
                { "value": "no", "label": "No" }
              ],
              "signalEffects": { "set": { "signals.dryWithin1h": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C3_FAST_RETURN",
              "type": "single_choice",
              "text": "Does moisturizer absorb quickly but dryness returns fast?",
              "options": [
                { "value": "often", "label": "Often" },
                { "value": "sometimes", "label": "Sometimes" },
                { "value": "rarely", "label": "Rarely" }
              ],
              "signalEffects": { "set": { "signals.moistureReturnsFast": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C4_SENSITIVITY": {
      "axisKey": "sensitivity",
      "rules": [
        {
          "id": "C4_VASCULAR_SUSPECT",
          "priority": 100,
          "trigger": {
            "all": [
              { "any": [
                { "path": "uiSignals.sensitivity.flushZones", "op": "hasZoneMinSeverity", "value": { "zone": "left_cheek", "minSeverity": 2 } },
                { "path": "answers.rednessPersistence", "op": "includesAny", "value": ["hours", "permanent"] }
              ]},
              { "path": "signals.persistentCapillaries", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C4_CAPILLARIES",
              "type": "single_choice",
              "text": "Do you see persistent visible capillaries (tiny red vessels) on cheeks or nose?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_sure", "label": "Not sure" }
              ],
              "signalEffects": { "set": { "signals.persistentCapillaries": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C4_REDNESS_BASELINE",
              "type": "single_choice",
              "text": "Does redness remain even without triggers like heat or exercise?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "sometimes", "label": "Sometimes" },
                { "value": "no", "label": "No" }
              ],
              "signalEffects": { "set": { "signals.rednessBaseline": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C5_PIGMENT": {
      "axisKey": "pigment",
      "rules": [
        {
          "id": "C5_MELASMA_VS_PIH",
          "priority": 120,
          "trigger": {
            "all": [
              { "path": "uiSignals.pigment.selectedPattern", "op": "eq", "value": "melasma_mask" },
              { "path": "uiSignals.pigment.zones", "op": "hasZoneMinSeverity", "value": { "zone": "forehead", "minSeverity": 2 } },
              { "path": "uiSignals.pigment.zones", "op": "hasZoneMinSeverity", "value": { "zone": "upper_lip", "minSeverity": 2 } },
              { "path": "signals.melasmaHormonalHistory", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C5_HORMONAL_HISTORY",
              "type": "single_choice",
              "text": "Did this pigmentation start or worsen after a hormonal change (pregnancy, birth control)?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_applicable", "label": "Not applicable" }
              ],
              "signalEffects": { "set": { "signals.melasmaHormonalHistory": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C5_SYMMETRY",
              "type": "single_choice",
              "text": "Is the pigmentation roughly symmetrical on both sides of your face?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_sure", "label": "Not sure" }
              ],
              "signalEffects": { "set": { "signals.symmetry": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        },
        {
          "id": "C5_UV_RESPONSE",
          "priority": 100,
          "trigger": {
            "all": [
              { "path": "signals.uvDarken", "op": "isMissing" },
              { "path": "preliminaryScores.pigment", "op": "gte", "value": 0.55 }
            ]
          },
          "questions": [
            {
              "id": "PQ_C5_UV_DARKEN",
              "type": "single_choice",
              "text": "Does pigmentation darken quickly with sun exposure?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_sure", "label": "Not sure" }
              ],
              "signalEffects": { "set": { "signals.uvDarken": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C6_TEXTURE": {
      "axisKey": "texture",
      "rules": [
        {
          "id": "C6_DUAL_MECHANISM",
          "priority": 120,
          "trigger": {
            "all": [
              { "path": "uiSignals.texture.zones", "op": "hasZoneTypeMinSeverity", "value": { "zone": "nose", "type": "oxidized_pores", "minSeverity": 2 } },
              { "path": "uiSignals.texture.zones", "op": "hasZoneTypeMinSeverity", "value": { "zone": "forehead", "type": "rough_texture", "minSeverity": 2 } },
              { "path": "signals.textureWorsensByAfternoon", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C6_WORSENS_AFTERNOON",
              "type": "single_choice",
              "text": "Does texture or visible pore size look worse by afternoon?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "sometimes", "label": "Sometimes" },
                { "value": "no", "label": "No" }
              ],
              "signalEffects": { "set": { "signals.textureWorsensByAfternoon": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C6_EXFOL_TEMP_HELP",
              "type": "single_choice",
              "text": "Does exfoliation (AHA / BHA / PHA) make skin look smoother temporarily?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "no", "label": "No" },
                { "value": "not_sure", "label": "Not sure" }
              ],
              "signalEffects": { "set": { "signals.exfoliationTempHelp": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        },
        {
          "id": "C6_ZONE_DIFFERENTIATION",
          "priority": 100,
          "trigger": {
            "all": [
              { "path": "uiSignals.texture.zones", "op": "zoneCoverageAtLeast", "value": 2 },
              { "path": "signals.noseOxidizedPlugs", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C6_NOSE_OXIDIZED",
              "type": "severity_0_3",
              "text": "Nose: how noticeable are oxidized pore plugs or blackheads?",
              "signalEffects": { "set": { "signals.noseOxidizedPlugs": "{severity}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C6_FOREHEAD_ROUGH",
              "type": "severity_0_3",
              "text": "Forehead: how rough or bumpy is the texture?",
              "signalEffects": { "set": { "signals.foreheadRoughTexture": "{severity}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C7_ELASTICITY": {
      "axisKey": "elasticity",
      "rules": [
        {
          "id": "C7_ELASTICITY_CONFIRM",
          "priority": 100,
          "trigger": {
            "all": [
              { "path": "preliminaryScores.elasticity", "op": "gte", "value": 0.50 },
              { "path": "signals.firmnessAreaDetail", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C7_AREA_FIRMNESS",
              "type": "multi_choice",
              "text": "Where do you most notice firmness or contour changes?",
              "options": [
                { "value": "eyes", "label": "Around eyes" },
                { "value": "jawline", "label": "Jawline" },
                { "value": "neck", "label": "Neck" },
                { "value": "nasolabial", "label": "Nasolabial folds" }
              ],
              "signalEffects": { "set": { "signals.firmnessAreaDetail": "{answers}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C7_PINCH_CONFIRM",
              "type": "single_choice",
              "text": "After a gentle cheek pinch, how quickly does skin return?",
              "options": [
                { "value": "fast", "label": "Fast (under 1 sec)" },
                { "value": "medium", "label": "Medium (1–2 sec)" },
                { "value": "slow", "label": "Slow (2–3 sec)" },
                { "value": "very_slow", "label": "Very slow (3 sec+)" }
              ],
              "signalEffects": { "set": { "signals.pinchReturnConfirm": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    },

    "C8_BARRIER": {
      "axisKey": "barrier",
      "rules": [
        {
          "id": "C8_OVEREXFOLIATION",
          "priority": 100,
          "trigger": {
            "all": [
              { "path": "preliminaryScores.barrier", "op": "gte", "value": 0.60 },
              { "path": "signals.exfoliationFrequency", "op": "isMissing" }
            ]
          },
          "questions": [
            {
              "id": "PQ_C8_EXFOL_FREQ",
              "type": "single_choice",
              "text": "How often do you use exfoliating acids (AHA / BHA / PHA) or retinoids?",
              "options": [
                { "value": "rare", "label": "Rarely" },
                { "value": "1_2", "label": "1–2× per week" },
                { "value": "3_4", "label": "3–4× per week" },
                { "value": "5_plus", "label": "5+ times per week" }
              ],
              "signalEffects": { "set": { "signals.exfoliationFrequency": "{answer}" } },
              "evidenceGain": 1
            },
            {
              "id": "PQ_C8_TRIAD",
              "type": "single_choice",
              "text": "Do you often experience redness + tightness + stinging together?",
              "options": [
                { "value": "yes", "label": "Yes" },
                { "value": "sometimes", "label": "Sometimes" },
                { "value": "no", "label": "No" }
              ],
              "signalEffects": { "set": { "signals.barrierTriad": "{answer}" } },
              "evidenceGain": 1
            }
          ]
        }
      ]
    }
  }
}
```

---

## PART 7 — WHY RULES + PRODUCT BUCKET MAPPING (JSON)

```json
// src/data/whyRules.json
{
  "version": "why_rules_v1.0",

  "productBuckets": {
    "BASE_GENTLE_CLEANSER":    { "productIds": ["biplain_cleanser"],                               "phase": "Phase 1", "frequency": "daily" },
    "BASE_OILY_CLEANSER":      { "productIds": ["drg_cleanser_oily"],                              "phase": "Phase 1", "frequency": "daily" },
    "BARRIER_HYDRATION_CORE":  { "productIds": ["torriden_serum", "snature_toner", "aestura_cream"],"phase": "Phase 2", "frequency": "AM/PM" },
    "BARRIER_REPAIR_ADVANCED": { "productIds": ["manyo_bifida", "snature_squalane", "aestura_cream"],"phase": "Phase 2","frequency": "PM (or AM/PM if severe)" },
    "ACNE_SOOTHE_BALANCE":     { "productIds": ["bringgreen_teatree", "drg_soothing_cream"],       "phase": "Phase 2–3","frequency": "daily" },
    "ACNE_CONGESTION_TREAT":   { "productIds": ["cosrx_bha"],                                      "phase": "Phase 3", "frequency": "2–3×/week" },
    "PIGMENT_VITC_STARTER":    { "productIds": ["missha_vitac"],                                   "phase": "Phase 4", "frequency": "3–5×/week (start slow)" },
    "PIGMENT_TONE_TARGET":     { "productIds": ["cellfusionc_toning"],                             "phase": "Phase 4", "frequency": "daily or 5×/week" },
    "ELASTICITY_RETINOL_CORE": { "productIds": ["iope_retinol"],                                   "phase": "Phase 4", "frequency": "2–4×/week (ramp up)" },
    "ELASTICITY_COLLAGEN":     { "productIds": ["bioheal_collagen", "bioheal_probioderm"],         "phase": "Phase 4", "frequency": "daily or 5×/week" },
    "SPF_SENSITIVE":           { "productIds": ["drg_sunscreen"],                                  "phase": "Phase 5", "frequency": "daily" },
    "SPF_STRONG":              { "productIds": ["cellfusionc_sun"],                                "phase": "Phase 5", "frequency": "daily" },
    "DEVICE_PREMIUM":          { "productIds": ["medicube_booster", "mamicare_device"],            "phase": "Premium", "frequency": "per device protocol" }
  },

  "selectionLogic": {
    "perCategoryMaxWhyRules":    2,
    "ruleSelection":             "priority_desc_then_first_match",
    "bucketDeduplication":       "dedupe_by_productId_keep_highest_priority_rule",
    "fallbackBuckets":           ["BASE_GENTLE_CLEANSER", "BARRIER_HYDRATION_CORE", "SPF_SENSITIVE"],
    "fallbackOutput": {
      "because":  ["Your results show a mixed profile without a single dominant signature.", "A stable foundation improves tolerance and performance across routines."],
      "helps":    ["Strengthens hydration and barrier stability to reduce daily variability."],
      "protocol": ["Start with Phase 1–2 + Phase 5. Add Phase 3–4 only after stability improves."]
    }
  },

  "whyRules": [
    {
      "id": "WHY_C1_HORMONAL_JAWLINE",
      "category": "C1_ACNE", "priority": 120,
      "trigger": {
        "all": [
          { "path": "uiSignals.acne.zones", "op": "hasZoneMinSeverity", "value": { "zone": "jawline", "minSeverity": 2 } },
          { "any": [{ "path": "signals.hormonalCycle", "op": "gte", "value": 2 }, { "path": "answers.acneLesionType", "op": "eq", "value": "deep_cystic" }] }
        ]
      },
      "selectBuckets": ["BASE_GENTLE_CLEANSER", "BARRIER_HYDRATION_CORE", "ACNE_SOOTHE_BALANCE"],
      "output": {
        "because":  ["Breakouts concentrate along jawline/chin (moderate–high).", "Pattern suggests cyclical or hormonal flare tendency."],
        "helps":    ["Supports calmer inflammatory signaling while keeping the barrier stable.", "Balances sebum behavior without stripping (important for cyclical breakouts)."],
        "protocol": ["Phase 2 daily for stability; Phase 3 targeted support as needed."]
      }
    },
    {
      "id": "WHY_C1_CONGESTION_BHA",
      "category": "C1_ACNE", "priority": 110,
      "trigger": {
        "all": [
          { "path": "preliminaryScores.acne", "op": "gte", "value": 0.60 },
          { "any": [
            { "path": "answers.acneLesionType", "op": "includesAny", "value": ["blackheads_bumps", "mix"] },
            { "path": "uiSignals.texture.zones", "op": "hasZoneTypeMinSeverity", "value": { "zone": "nose", "type": "oxidized_pores", "minSeverity": 2 } }
          ]}
        ]
      },
      "selectBuckets": ["BASE_OILY_CLEANSER", "BARRIER_HYDRATION_CORE", "ACNE_CONGESTION_TREAT"],
      "output": {
        "because":  ["Acne risk is elevated with congestion-style signals (clogging tendencies).", "Pore congestion markers present (comedonal / oxidized plug pattern)."],
        "helps":    ["Gently clears pore congestion and reduces buildup driving breakouts.", "Keeps barrier supported so treatment remains tolerable."],
        "protocol": ["Phase 3 treatment 2–3×/week; pause if barrier irritation increases."]
      }
    },
    {
      "id": "WHY_C2_FAST_OIL_REBOUND",
      "category": "C2_OILINESS", "priority": 120,
      "trigger": {
        "all": [
          { "path": "answers.oilReturnHours", "op": "includesAny", "value": ["0_2", "2_4"] },
          { "path": "uiSignals.sebum.zones", "op": "hasZoneMinSeverity", "value": { "zone": "nose", "minSeverity": 2 } }
        ]
      },
      "selectBuckets": ["BASE_OILY_CLEANSER", "BARRIER_HYDRATION_CORE", "SPF_STRONG"],
      "output": {
        "because":  ["Shine returns quickly after cleansing (fast oil rebound signature).", "Oiliness concentrates in the T-zone (nose/forehead)."],
        "helps":    ["Improves oil control while maintaining hydration to reduce rebound shine.", "Stabilizes base performance, improving makeup longevity."],
        "protocol": ["Phase 1 oil-balancing cleanse daily; Phase 2 hydration prevents rebound."]
      }
    },
    {
      "id": "WHY_C2_DEHYDRATED_OILY",
      "category": "C2_OILINESS", "priority": 110,
      "trigger": {
        "all": [
          { "path": "preliminaryScores.sebum", "op": "gte", "value": 0.60 },
          { "path": "preliminaryScores.hydration", "op": "lte", "value": 0.45 },
          { "path": "signals.tightDespiteShine", "op": "includesAny", "value": ["often", "sometimes"] }
        ]
      },
      "selectBuckets": ["BASE_GENTLE_CLEANSER", "BARRIER_HYDRATION_CORE", "SPF_SENSITIVE"],
      "output": {
        "because":  ["Skin looks shiny but feels tight (dehydrated-oily pattern).", "This drives oil rebound and uneven makeup breakdown."],
        "helps":    ["Rebalances hydration so oil production calms instead of rebounding.", "Supports barrier comfort while improving surface stability."],
        "protocol": ["Phase 2 is the priority; keep Phase 1 gentle to avoid over-stripping."]
      }
    },
    {
      "id": "WHY_C3_TEWL_DRYNESS",
      "category": "C3_HYDRATION", "priority": 120,
      "trigger": {
        "all": [
          { "path": "signals.dryWithin1h", "op": "includesAny", "value": ["yes", "sometimes"] },
          { "path": "preliminaryScores.barrier", "op": "gte", "value": 0.55 }
        ]
      },
      "selectBuckets": ["BASE_GENTLE_CLEANSER", "BARRIER_REPAIR_ADVANCED", "SPF_SENSITIVE"],
      "output": {
        "because":  ["Tightness/dryness appears soon after cleansing (fast moisture loss signature).", "Barrier-related dryness is likely driving hydration loss."],
        "helps":    ["Improves water retention and reduces moisture loss through barrier support.", "Builds tolerance so future treatments can be introduced safely."],
        "protocol": ["Phase 2 AM/PM; avoid strong exfoliation until dryness stabilizes."]
      }
    },
    {
      "id": "WHY_C3_FLAKY_SURFACE",
      "category": "C3_HYDRATION", "priority": 110,
      "trigger": {
        "all": [
          { "path": "preliminaryScores.hydration", "op": "gte", "value": 0.60 },
          { "path": "preliminaryScores.texture", "op": "gte", "value": 0.55 }
        ]
      },
      "selectBuckets": ["BASE_GENTLE_CLEANSER", "BARRIER_HYDRATION_CORE"],
      "output": {
        "because":  ["Dryness co-occurs with rough texture (surface dehydration pattern).", "Skin needs replenishment more than aggressive exfoliation."],
        "helps":    ["Softens and restores hydration while keeping irritation risk low.", "Improves surface smoothness indirectly by stabilizing hydration."],
        "protocol": ["Phase 2 daily; keep Phase 3 gentle and infrequent if used at all."]
      }
    },
    {
      "id": "WHY_C4_VASCULAR_REDNESS",
      "category": "C4_SENSITIVITY", "priority": 120,
      "trigger": {
        "all": [
          { "path": "uiSignals.sensitivity.flushZones", "op": "hasZoneMinSeverity", "value": { "zone": "left_cheek", "minSeverity": 2 } },
          { "any": [
            { "path": "signals.persistentCapillaries", "op": "eq", "value": "yes" },
            { "path": "signals.rednessBaseline", "op": "includesAny", "value": ["yes", "sometimes"] }
          ]}
        ]
      },
      "selectBuckets": ["BASE_GENTLE_CLEANSER", "BARRIER_REPAIR_ADVANCED", "SPF_SENSITIVE"],
      "output": {
        "because":  ["Redness clusters on cheeks with vascular tendencies.", "Redness persists beyond immediate triggers."],
        "helps":    ["Reduces reactivity by supporting barrier calm and minimizing irritation loops.", "Prioritizes tolerance-building rather than aggressive actives."],
        "protocol": ["Phase 2 daily; avoid strong acids until reactivity stabilizes."]
      }
    },
    {
      "id": "WHY_C4_ACTIVE_STINGING",
      "category": "C4_SENSITIVITY", "priority": 110,
      "trigger": {
        "all": [
          { "path": "answers.activeStinging", "op": "exists" },
          { "path": "preliminaryScores.sensitivity", "op": "gte", "value": 0.60 }
        ]
      },
      "selectBuckets": ["BARRIER_REPAIR_ADVANCED", "ACNE_SOOTHE_BALANCE"],
      "output": {
        "because":  ["Common actives cause stinging (reactivity and tolerance issue).", "Sensitivity axis is elevated, suggesting barrier stress signaling."],
        "helps":    ["Strengthens tolerance and reduces stinging frequency over time.", "Supports recovery so treatment phases can be reintroduced gradually."],
        "protocol": ["Phase 2 reset (1–2 weeks) before escalating Phase 3/4 treatments."]
      }
    },
    {
      "id": "WHY_C5_MELASMA_MASK",
      "category": "C5_PIGMENT", "priority": 130,
      "trigger": {
        "all": [
          { "path": "uiSignals.pigment.selectedPattern", "op": "eq", "value": "melasma_mask" },
          { "path": "uiSignals.pigment.zones", "op": "hasZoneMinSeverity", "value": { "zone": "forehead", "minSeverity": 2 } },
          { "path": "uiSignals.pigment.zones", "op": "hasZoneMinSeverity", "value": { "zone": "upper_lip", "minSeverity": 2 } }
        ]
      },
      "selectBuckets": ["PIGMENT_TONE_TARGET", "SPF_STRONG"],
      "output": {
        "because":  ["Mask-like pigmentation concentrated on forehead/upper lip (moderate–high).", "Pattern shows UV responsiveness (darkens with sun)."],
        "helps":    ["Supports melanin regulation while staying barrier-safe for long-term use.", "Pairs with strong daily protection to prevent rebound darkening."],
        "protocol": ["Phase 4 for tone + Phase 5 daily SPF (non-negotiable for melasma patterns)."]
      }
    },
    {
      "id": "WHY_C5_PIH_SPOTTY",
      "category": "C5_PIGMENT", "priority": 120,
      "trigger": {
        "all": [
          { "path": "answers.pigmentPattern", "op": "includesAny", "value": ["post_acne_marks", "mixed"] },
          { "path": "preliminaryScores.acne", "op": "gte", "value": 0.50 }
        ]
      },
      "selectBuckets": ["PIGMENT_VITC_STARTER", "SPF_SENSITIVE"],
      "output": {
        "because":  ["Post-inflammatory marks follow breakout activity (spotty discoloration).", "Uneven tone concentrates around acne-prone zones."],
        "helps":    ["Improves recovery and tone uniformity while staying compatible with acne routines.", "Prevents marks from persisting by pairing with daily protection."],
        "protocol": ["Phase 4 3–5×/week to start; Phase 5 SPF daily."]
      }
    },
    {
      "id": "WHY_C6_DUAL_MECHANISM",
      "category": "C6_TEXTURE", "priority": 130,
      "trigger": {
        "all": [
          { "path": "uiSignals.texture.zones", "op": "hasZoneTypeMinSeverity", "value": { "zone": "nose", "type": "oxidized_pores", "minSeverity": 2 } },
          { "path": "uiSignals.texture.zones", "op": "hasZoneTypeMinSeverity", "value": { "zone": "forehead", "type": "rough_texture", "minSeverity": 2 } }
        ]
      },
      "selectBuckets": ["ACNE_CONGESTION_TREAT", "BARRIER_HYDRATION_CORE"],
      "output": {
        "because":  ["Oxidized pore plugs on nose (moderate–high).", "Rough, uneven texture on forehead (moderate)."],
        "helps":    ["Gently reduces congestion and smooths texture while maintaining barrier tolerance.", "Prevents over-exfoliation by pairing treatment with hydration support."],
        "protocol": ["Phase 3 2–3×/week; Phase 2 daily to protect the barrier."]
      }
    },
    {
      "id": "WHY_C6_ENLARGED_PORES",
      "category": "C6_TEXTURE", "priority": 110,
      "trigger": {
        "all": [
          { "path": "preliminaryScores.sebum", "op": "gte", "value": 0.60 },
          { "path": "uiSignals.texture.zones", "op": "hasZoneTypeMinSeverity", "value": { "zone": "nose", "type": "enlarged_pores", "minSeverity": 2 } }
        ]
      },
      "selectBuckets": ["BASE_OILY_CLEANSER", "BARRIER_HYDRATION_CORE"],
      "output": {
        "because":  ["Pore visibility is linked with higher surface oil activity.", "Texture worsens later in the day as oil accumulates."],
        "helps":    ["Balances oil dynamics and improves pore appearance without stripping.", "Supports smoother texture by stabilizing hydration."],
        "protocol": ["Phase 1 + Phase 2 daily; consider Phase 3 only if tolerated."]
      }
    },
    {
      "id": "WHY_C7_SLOW_RECOIL",
      "category": "C7_ELASTICITY", "priority": 120,
      "trigger": {
        "all": [
          { "any": [
            { "path": "answers.pinchReturn", "op": "includesAny", "value": ["slow", "very_slow"] },
            { "path": "uiSignals.elasticity.selectedLevel", "op": "gte", "value": 2 }
          ]},
          { "path": "preliminaryScores.elasticity", "op": "gte", "value": 0.55 }
        ]
      },
      "selectBuckets": ["ELASTICITY_RETINOL_CORE", "ELASTICITY_COLLAGEN", "SPF_STRONG"],
      "output": {
        "because":  ["Elastic recoil is reduced (slower bounce-back signature).", "Firmness axis is elevated, suggesting structural support needs."],
        "helps":    ["Supports collagen-friendly routines and improves perceived firmness over time.", "Pairs with daily protection to reduce photoaging acceleration."],
        "protocol": ["Phase 4 at night (ramp up slowly); Phase 5 SPF daily."]
      }
    },
    {
      "id": "WHY_C7_CONTOUR_FOCUS",
      "category": "C7_ELASTICITY", "priority": 110,
      "trigger": {
        "all": [
          { "path": "answers.firmnessAreas", "op": "exists" },
          { "path": "answers.firmnessAreas", "op": "includesAny", "value": ["jawline", "neck"] }
        ]
      },
      "selectBuckets": ["ELASTICITY_COLLAGEN", "DEVICE_PREMIUM"],
      "output": {
        "because":  ["Firmness changes concentrate around jawline/neck contour.", "Contour definition is a key concern."],
        "helps":    ["Supports resilience and contour appearance with consistent use.", "Optional device add-ons can enhance routine adherence and perceived results."],
        "protocol": ["Phase 4 support daily / 5×/week; consider Premium add-on if desired."]
      }
    },
    {
      "id": "WHY_C8_BARRIER_TRIAD",
      "category": "C8_BARRIER", "priority": 140,
      "trigger": {
        "all": [
          { "path": "signals.barrierTriad", "op": "eq", "value": "yes" },
          { "path": "preliminaryScores.barrier", "op": "gte", "value": 0.65 }
        ]
      },
      "selectBuckets": ["BARRIER_REPAIR_ADVANCED", "SPF_SENSITIVE"],
      "output": {
        "because":  ["Redness + tightness + stinging occur together (barrier stress signature).", "Skin reacts easily to routine changes (recovery is slower)."],
        "helps":    ["Rebuilds barrier tolerance (lipids + soothing) and reduces reactivity loops.", "Creates a stable foundation before reintroducing strong actives."],
        "protocol": ["Phase 2 AM/PM; temporarily pause strong acids/retinoids until stable."]
      }
    },
    {
      "id": "WHY_C8_OVEREXFOLIATION",
      "category": "C8_BARRIER", "priority": 120,
      "trigger": {
        "all": [
          { "path": "signals.exfoliationFrequency", "op": "includesAny", "value": ["3_4", "5_plus"] },
          { "path": "preliminaryScores.barrier", "op": "gte", "value": 0.55 }
        ]
      },
      "selectBuckets": ["BARRIER_HYDRATION_CORE", "ACNE_SOOTHE_BALANCE"],
      "output": {
        "because":  ["Frequent exfoliation correlates with irritation patterns (barrier load).", "Barrier score suggests recovery support is needed."],
        "helps":    ["Restores barrier comfort and reduces actives-induced irritation loops.", "Lets you reintroduce treatments more safely and effectively."],
        "protocol": ["Phase 2 daily; reintroduce Phase 3 slowly (start 1×/week)."]
      }
    }
  ]
}
```

---

## PART 8 — PROTOCOL BUILDER v1 (Safety-Gated, JSON)

```json
// src/data/protocolBuilder.json
{
  "version": "protocol_builder_v1.0",

  "axisThresholds": { "low": 0.35, "mid": 0.55, "high": 0.70, "critical": 0.82 },

  "defaultBuckets": ["BASE_GENTLE_CLEANSER", "BARRIER_HYDRATION_CORE", "SPF_SENSITIVE"],

  "phaseTemplates": {
    "Phase 1": { "label": "Cleanse",              "timeOfDay": ["AM", "PM"] },
    "Phase 2": { "label": "Hydrate & Barrier",    "timeOfDay": ["AM", "PM"] },
    "Phase 3": { "label": "Targeted Treatment",   "timeOfDay": ["PM"] },
    "Phase 4": { "label": "Long-term Correction", "timeOfDay": ["PM"] },
    "Phase 5": { "label": "Protect (SPF)",        "timeOfDay": ["AM"] }
  },

  "globalSafetyRules": [
    {
      "id": "SAFETY_BARRIER_CRITICAL",
      "priority": 999,
      "trigger": { "path": "scores.barrier", "op": "gte", "value": 0.82 },
      "actions": [
        { "type": "removeModules", "targets": ["AHA", "BHA", "RETINOL", "VITAMIN_C_STRONG"] },
        { "type": "capFrequency",  "targets": ["Phase 3", "Phase 4"], "value": "0x/week" },
        { "type": "forceBuckets",  "buckets": ["BARRIER_REPAIR_ADVANCED", "SPF_SENSITIVE", "BASE_GENTLE_CLEANSER"] }
      ],
      "rationale": "Barrier risk is critical. Prioritize recovery and remove strong irritants temporarily."
    },
    {
      "id": "SAFETY_SENSITIVITY_HIGH",
      "priority": 900,
      "trigger": { "path": "scores.sensitivity", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "capFrequency", "targets": ["AHA", "BHA", "RETINOL", "VITAMIN_C_STRONG"], "value": "1x/week" },
        { "type": "preferBuckets", "buckets": ["SPF_SENSITIVE", "BARRIER_HYDRATION_CORE"] }
      ],
      "rationale": "High sensitivity: reduce active frequency and bias toward barrier-safe options."
    }
  ],

  "moduleRules": [
    {
      "id": "MOD_ACNE_HIGH",
      "priority": 500,
      "trigger": { "path": "scores.acne", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "addBuckets", "buckets": ["ACNE_CONGESTION_TREAT", "ACNE_SOOTHE_BALANCE"] },
        { "type": "setModule",  "module": "BHA", "phase": "Phase 3", "frequency": "2–3×/week" }
      ],
      "rationale": "Acne axis is high. Add congestion control and anti-inflammatory support."
    },
    {
      "id": "MOD_ACNE_MID",
      "priority": 450,
      "trigger": { "path": "scores.acne", "op": "between", "value": [0.55, 0.70] },
      "actions": [
        { "type": "addBuckets", "buckets": ["ACNE_SOOTHE_BALANCE"] },
        { "type": "setModule",  "module": "SOOTHE", "phase": "Phase 2", "frequency": "daily" }
      ],
      "rationale": "Moderate acne: emphasize calming and stability before stronger treatments."
    },
    {
      "id": "MOD_SEBUM_HIGH",
      "priority": 420,
      "trigger": { "path": "scores.sebum", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "swapBucket", "from": "BASE_GENTLE_CLEANSER", "to": "BASE_OILY_CLEANSER" },
        { "type": "setModule",  "module": "OIL_CONTROL", "phase": "Phase 1", "frequency": "daily" }
      ],
      "rationale": "Sebum axis is high. Use an oil-optimized cleanse without stripping the barrier."
    },
    {
      "id": "MOD_HYDRATION_HIGH",
      "priority": 460,
      "trigger": { "path": "scores.hydration", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "addBuckets", "buckets": ["BARRIER_HYDRATION_CORE"] },
        { "type": "setModule",  "module": "RETENTION", "phase": "Phase 2", "frequency": "AM/PM" }
      ],
      "rationale": "Hydration axis is high. Prioritize retention and long-lasting hydration support."
    },
    {
      "id": "MOD_PIGMENT_HIGH",
      "priority": 480,
      "trigger": { "path": "scores.pigmentation", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "require",   "module": "SPF", "phase": "Phase 5", "frequency": "daily" },
        { "type": "addBuckets","buckets": ["PIGMENT_TONE_TARGET"] },
        { "type": "setModule", "module": "TONE", "phase": "Phase 4", "frequency": "daily_or_5x" }
      ],
      "rationale": "Pigment axis is high. Tone treatment only works when paired with strict daily SPF."
    },
    {
      "id": "MOD_PIGMENT_MID",
      "priority": 430,
      "trigger": { "path": "scores.pigmentation", "op": "between", "value": [0.55, 0.70] },
      "actions": [
        { "type": "require",   "module": "SPF", "phase": "Phase 5", "frequency": "daily" },
        { "type": "addBuckets","buckets": ["PIGMENT_VITC_STARTER"] },
        { "type": "setModule", "module": "VITC", "phase": "Phase 4", "frequency": "3–5×/week_start_slow" }
      ],
      "rationale": "Moderate pigmentation responds well to gradual Vitamin C + strict SPF."
    },
    {
      "id": "MOD_TEXTURE_HIGH",
      "priority": 440,
      "trigger": { "path": "scores.texture", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "addBuckets", "buckets": ["ACNE_CONGESTION_TREAT"] },
        { "type": "setModule",  "module": "GENTLE_EXFOL", "phase": "Phase 3", "frequency": "2×/week" }
      ],
      "rationale": "Texture axis is high. Introduce controlled exfoliation, gated by barrier status."
    },
    {
      "id": "MOD_ELASTICITY_HIGH",
      "priority": 470,
      "trigger": { "path": "scores.elasticity", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "capFrequencyIf", "if": { "path": "scores.barrier", "op": "gte", "value": 0.70 }, "targets": ["RETINOL"], "value": "1–2×/week" },
        { "type": "addBuckets", "buckets": ["ELASTICITY_RETINOL_CORE", "ELASTICITY_COLLAGEN"] },
        { "type": "setModule",  "module": "RETINOL", "phase": "Phase 4", "frequency": "2–4×/week_ramp" }
      ],
      "rationale": "Elasticity axis is high. Retinoid support is effective but gated by barrier tolerance."
    },
    {
      "id": "MOD_BARRIER_HIGH",
      "priority": 800,
      "trigger": { "path": "scores.barrier", "op": "gte", "value": 0.70 },
      "actions": [
        { "type": "forceBuckets", "buckets": ["BARRIER_REPAIR_ADVANCED", "SPF_SENSITIVE", "BASE_GENTLE_CLEANSER"] },
        { "type": "setModule",    "module": "BARRIER_REPAIR", "phase": "Phase 2", "frequency": "AM/PM" },
        { "type": "capFrequency", "targets": ["BHA", "RETINOL", "VITAMIN_C_STRONG"], "value": "1×/week" }
      ],
      "rationale": "Barrier axis is high. Repair is prioritized and all strong actives are limited."
    }
  ]
}
```

---

## PART 9 — DEBUG PANEL v2

```tsx
// src/components/debug/ScoreDebugPanel.tsx — v8 version
// Shows evidenceAdjusted + highScoreGated fields

export function ScoreDebugPanel({ score }: { score: ClinicalScore }) {
  const [params] = useSearchParams();
  if (!params.get('debug') || !score._debug) return null;
  const { axes, warning } = score._debug;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-xl border border-amber-500/40 bg-black/92 p-4 text-xs font-mono text-green-400 backdrop-blur-md">
      <p className="mb-2 font-bold text-amber-400">🔬 Score Debug Panel v8</p>
      {warning && <p className="mb-2 text-red-400">⚠️ {warning}</p>}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {Object.entries(axes).map(([axis, d]) => (
          <div key={axis} className="rounded border border-white/10 p-2">
            <div className="flex justify-between">
              <span className="font-bold text-white">{axis}</span>
              <span className={d.highScoreGated ? 'text-amber-400' : 'text-green-300'}>
                → {d.finalScore} {d.highScoreGated ? '🔒gated' : ''}
              </span>
            </div>
            <p className="text-green-300">earned {d.totalEarned.toFixed(2)} / max {d.totalMax} = ratio {d.ratio}</p>
            <p className="text-yellow-300">curved {d.curvedScore} × adj {d.evidenceAdjusted} = {d.finalScore}</p>
            <p className="text-cyan-300">signals {d.answeredSignals} / ideal {d.idealSignals} → ev {d.evidenceFactor}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-white/40">?debug=true · Scoring Stability Patch v8 active</p>
    </div>
  );
}
```

---

## PART 10 — RESULTS: HORIZONTAL SLIDE DASHBOARD

All 5 result slides. No long scroll. Mobile swipe / desktop tab navigation.

### Slide 1 — Diagnosis Summary
Unchanged from v7. Driven by live ClinicalScore. Show:
- Primary finding card (severity color + score)
- Hypothesis title + mechanism
- Top 3 contributing axes
- Protocol gating warning if barrier ≥ 60

### Slide 2 — Axis Breakdown
Unchanged from v7 (severity band legend + confidence bar).
Add: texture + elasticity axes to the bar chart (v8 adds these as explicit axes).

### Slide 3 — 5-Phase Protocol (NEW in v8)

```tsx
// src/components/results/SlideProtocol.tsx
// Built from Protocol Builder output (protocolResult computed from protocolBuilder.json rules)

export function SlideProtocol({ protocolResult }: { protocolResult: ProtocolResult }) {
  const phases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];
  const [activePhase, setActivePhase] = useState('Phase 2'); // default to most important

  return (
    <div className="flex flex-col h-full px-6 py-10 max-w-xl mx-auto w-full">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="slide-eyebrow mb-4">
        Your Protocol
      </motion.p>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, marginBottom: '1.5rem' }}>
        5-Phase Routine Plan
      </h2>

      {/* Phase tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {phases.map(phase => (
          <button key={phase} onClick={() => setActivePhase(phase)}
            className="rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-all"
            style={{
              background: activePhase === phase ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--card))',
              borderColor: activePhase === phase ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              fontFamily: "'DM Sans'", fontWeight: activePhase === phase ? 700 : 400,
              color: 'hsl(var(--foreground))',
            }}>
            {phase}
          </button>
        ))}
      </div>

      {/* Active phase detail */}
      <AnimatePresence mode="wait">
        <motion.div key={activePhase}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
          <PhaseDetailCard phase={activePhase} protocolResult={protocolResult} />
        </motion.div>
      </AnimatePresence>

      {/* Safety note */}
      {protocolResult.gatingNotes?.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3">
          <p style={{ fontFamily: "'DM Sans'", fontSize: '0.8125rem', fontWeight: 600, color: '#f59e0b' }}>
            ⚠️ Protocol Adjustments
          </p>
          {protocolResult.gatingNotes.map((note, i) => (
            <p key={i} style={{ fontFamily: "'DM Sans'", fontSize: '0.8125rem', color: 'hsl(var(--foreground-body))', marginTop: '0.25rem' }}>
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Slide 4 — Why These Products (NEW in v8)

```tsx
// src/components/results/SlideWhyProducts.tsx
// Driven by WhyRules engine output

export function SlideWhyProducts({ whyResults }: { whyResults: WhyResult[] }) {
  return (
    <div className="flex flex-col h-full px-6 py-10 max-w-xl mx-auto w-full">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="slide-eyebrow mb-4">
        Personalized Selection
      </motion.p>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, marginBottom: '1.5rem' }}>
        Why These Products
      </h2>

      <div className="space-y-4 overflow-y-auto">
        {whyResults.map((result) => (
          <ProductWhyCard key={result.productId} result={result} />
        ))}
      </div>
    </div>
  );
}

function ProductWhyCard({ result }: { result: WhyResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
      {/* Product name + phase badge */}
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          {result.productName}
        </p>
        <span className="rounded-full px-2.5 py-0.5 text-xs"
          style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', fontFamily: "'DM Sans'", fontWeight: 700 }}>
          {result.phase}
        </span>
      </div>

      {/* Expandable "Why this works for you" */}
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs"
        style={{ color: 'hsl(var(--primary))', fontFamily: "'DM Sans'", fontWeight: 600 }}>
        Why this works for you {expanded ? '↑' : '↓'}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-1.5">
          {result.because.map((b, i) => (
            <p key={i} style={{ fontFamily: "'DM Sans'", fontSize: '0.8125rem', color: 'hsl(var(--foreground-body))', lineHeight: 1.5 }}>
              · {b}
            </p>
          ))}
          {result.helps.map((h, i) => (
            <p key={i} style={{ fontFamily: "'DM Sans'", fontSize: '0.8125rem', color: 'hsl(var(--foreground-hint))', lineHeight: 1.5 }}>
              ✓ {h}
            </p>
          ))}
          <p style={{ fontFamily: "'DM Sans'", fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--primary))', marginTop: '0.5rem' }}>
            {result.protocol[0]}
          </p>
        </motion.div>
      )}
    </div>
  );
}
```

### Slide 5 — Subscribe / Bundle CTA
Unchanged from v7.

---

## PART 11 — CONTEXT & TYPES UPDATE

```typescript
// src/context/DiagnosisContext.tsx — add new fields

export interface DiagnosisAnswers {
  // Phase 1
  primaryConcern?:       PrimaryConcern;
  secondaryConcerns?:    PrimaryConcern[];
  concernDuration?:      'new' | 'recurring' | 'chronic';
  hypothesis?:           DiagnosticHypothesis;
  activatedCategories?:  string[];  // NEW v8

  // C1 — Acne
  breakoutFrequency?:    string;
  acneLesionType?:       string;    // NEW v8 (replaces cysticFlag)
  healingDuration?:      string;    // NEW v8
  visualPatternMatch?:   string;
  acneZones?:            string[];
  zoneIntensities?:      Record<string, number>;

  // C2 — Oiliness
  oilReturnHours?:       string;    // NEW v8
  oilDistribution?:      string;    // NEW v8
  makeupWear?:           string;    // NEW v8

  // C3 — Hydration
  cleansingResponse?:    string;
  endOfDayHydration?:    string;    // NEW v8
  moistureRetention?:    string;    // NEW v8

  // C4 — Sensitivity
  flushReactivity?:      string;
  rednessPersistence?:   string;
  activeStinging?:       string[];

  // C5 — Pigmentation
  pigmentPattern?:       string;
  pigmentPhotoResponse?: string;
  pigmentFadeDuration?:  string;    // NEW v8

  // C6 — Texture
  textureMainConcern?:   string;    // NEW v8
  textureWorsensByAfternoon?: string; // NEW v8
  exfoliationTempHelp?:  string;    // NEW v8

  // C7 — Elasticity
  pinchReturn?:          string;    // NEW v8
  firmnessAreas?:        string[];  // NEW v8
  firmnessTrend?:        string;    // NEW v8

  // C8 — Barrier
  barrierTriad?:         string;    // NEW v8
  exfoliationFrequency?: string;    // NEW v8
  productIntolerance?:   string;    // NEW v8

  // Phase 4 — Systemic (unchanged from v7)
  hormonalFlag?:         string;
  triggers?:             string[];
  sleepQuality?:         string;
  stressLevel?:          string;
  dietSignals?:          string[];
  skinHistory?:          string[];

  // Phase 5 — Barrier Baseline (unchanged from v7)
  treatmentHistory?:     string[];
  elasticityResult?:     string;
  environmentType?:      string;
}

// NEW: Precision Q signals (separate from DiagnosisAnswers — populated dynamically)
export interface PrecisionSignals {
  hormonalCluster?:         string;
  hormonalCycle?:           number;
  lesionDuration?:          string;
  postAcneMarkType?:        string;
  tightDespiteShine?:       string;
  patchyMakeupDryness?:     string;
  dryWithin1h?:             string;
  moistureReturnsFast?:     string;
  persistentCapillaries?:   string;
  rednessBaseline?:         string;
  melasmaHormonalHistory?:  string;
  symmetry?:                string;
  uvDarken?:                string;
  noseOxidizedPlugs?:       number;
  foreheadRoughTexture?:    number;
  textureWorsensByAfternoon?: string;
  exfoliationTempHelp?:     string;
  firmnessAreaDetail?:      string[];
  pinchReturnConfirm?:      string;
  exfoliationFrequency?:    string;
  barrierTriad?:            string;
}
```

---

## PART 12 — FILE LIST

| File | Action | Notes |
|---|---|---|
| `src/App.tsx` | UPDATE | Add `/category/:id` route |
| `src/pages/diagnosis/DiagnosisShell.tsx` | UPDATE | Outer progress bar + category slide progress |
| `src/pages/diagnosis/Phase1_ConcernSelector.tsx` | RENAME | Was Phase1_PatternDetection; add activatedCategories logic |
| `src/pages/diagnosis/CategoryMicroWizard.tsx` | CREATE | Universal category slide wrapper |
| `src/pages/diagnosis/Phase4_SystemicRisk.tsx` | KEEP | Unchanged from v7 |
| `src/pages/diagnosis/Phase5_BarrierBaseline.tsx` | KEEP | Unchanged from v7 |
| `src/lib/scoring.ts` | REPLACE | v8: stability patch + texture + elasticity axes |
| `src/lib/precisionQEngine.ts` | CREATE | Trigger eval + slide injection |
| `src/lib/protocolBuilder.ts` | CREATE | Protocol assembly from JSON rules |
| `src/lib/whyEngine.ts` | CREATE | WhyRule eval → WhyResult[] for products |
| `src/data/precisionRules.json` | CREATE | Precision Q rules for C1–C8 |
| `src/data/whyRules.json` | CREATE | WhyRules + product buckets |
| `src/data/protocolBuilder.json` | CREATE | Protocol builder rules |
| `src/types/uiSignals.ts` | CREATE | UISignalsV2 schema |
| `src/context/DiagnosisContext.tsx` | UPDATE | Add PrecisionSignals + new answer fields |
| `src/components/debug/ScoreDebugPanel.tsx` | UPDATE | evidenceAdjusted + highScoreGated fields |
| `src/components/results/SlideProtocol.tsx` | CREATE | Phase tabs + gating notes |
| `src/components/results/SlideWhyProducts.tsx` | CREATE | Why cards per product |
| `src/components/results/SlideDiagnosisSummary.tsx` | KEEP | Unchanged from v7 |
| `src/components/results/SlideAxisBreakdown.tsx` | UPDATE | Add texture + elasticity bars |
| `src/components/results/SlideSubscribe.tsx` | KEEP | Unchanged from v7 |

---

## DO NOT CHANGE

- Design system: `Cormorant Garamond` + `DM Sans`, color tokens, silk background, dark/light mode
- Navbar, Footer, CookieConsent
- FaceMap SVG zone structure
- Index.tsx (homepage)
- SlideNav swipe component
- All existing Shopify handle mappings in product catalog

---

## SCORING STABILITY SUMMARY

| Scenario | v7 score | v8 score | Goal |
|---|---|---|---|
| 3 core answers all "Almost always" | ~69–75 | ~55–63 | ✅ Reduced |
| 3 core + 3 zones + visual match (7 signals) | ~78 | ~72–78 | ✅ Reasonable |
| Full flow (7+ signals, all high) | ~88–95 | ~85–93 | ✅ Maintained |
| 3 signals, score would be 92 | 92 | 89 (gated) | ✅ Capped |
| 0 signals answered | 50 | 0–15 | ✅ Correct |

**Key formula change:**
```
v7: finalScore = curved * evidence + 50 * (1 - evidence)
v8: finalScore = curved * (0.35 + 0.65 * evidence)
Gate: if answeredSignals < ceil(0.7 * idealSignals) AND finalScore >= 90 → cap at 89
```
