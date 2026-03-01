# LOVABLE PROMPT — Diagnosis Page: 5 Critical Improvements + Scoring Logic Overhaul

---

## CONTEXT

This is a clinical skin assessment app (K-beauty, dermatology-grade).
The diagnosis flow has 8 categories. I need the following 5 improvements applied across all relevant files.
Do NOT break any existing functionality. Apply changes surgically.

---

## FIX 1 — Face Map: Unify Size & Style Across ALL Categories (Cat 1–8)

**Problem:** Category 4's face illustration is tiny (small SVG oval with blob cheeks).
Category 1 likely uses a larger, more detailed face map component.

**Fix:**
- Use the SAME face map component that Category 1 uses across ALL 8 categories.
- The face map must be consistently sized: minimum height 220px, width auto, centered.
- If a shared `<FaceMap />` component does not exist yet, extract the Category 1 face map into a reusable component at `src/components/diagnosis/FaceMap.tsx` and import it in all category files.
- All zone highlight states must be passed as props so each category can control which zones are active independently.

---

## FIX 2 — Face Map: Add Left & Right Hairline Zones (All Categories That Use Face Map)

**Problem:** The face map only has forehead (center), left cheek, right cheek, nose, chin zones.
Users need to select acne/redness on the LEFT HAIRLINE and RIGHT HAIRLINE areas.

**Fix — Add 2 new clickable SVG zones to the FaceMap component:**

```
Left Hairline zone:  SVG ellipse positioned top-left of the face oval (x≈18%, y≈12%, rx≈10%, ry≈7%)
Right Hairline zone: SVG ellipse positioned top-right of the face oval (x≈82%, y≈12%, rx≈10%, ry≈7%)
```

**Zone IDs to add:**
```typescript
type FaceZone =
  | "forehead_center"
  | "forehead_left"   // LEFT hairline — NEW
  | "forehead_right"  // RIGHT hairline — NEW
  | "left_cheek"
  | "right_cheek"
  | "nose"
  | "chin"
  | "left_jaw"
  | "right_jaw";
```

**Zone label tooltips (show on hover):**
- `forehead_left`: "Left hairline / temple"
- `forehead_right`: "Right hairline / temple"

**Scoring implication (see Fix 5):** Left + right hairline selections = hormonal acne pattern signal.

---

## FIX 3 — Category 4: "Which Actives Cause Stinging?" → Add "Not Sure" Option

**Problem:** Beginners don't know what AHA, Retinol, Vitamin C are. No fallback option exists.

**Fix:**

1. Add a "Not sure / haven't tried" toggle button to the multi-select group.
   - Style: same pill button as AHA/Retinol/Vitamin C but with a ❓ prefix or italic label.
   - Label: **"Not sure / haven't tried"**
   - Behavior: When selected, it is MUTUALLY EXCLUSIVE with all other options (deselects AHA, Retinol, Vitamin C). If user selects any active after selecting "Not sure", deselect "Not sure" automatically.

2. Add a small helper tooltip or info icon (ⓘ) next to each active name:
   - **AHA** → tooltip: "Alpha Hydroxy Acids — e.g. glycolic acid, lactic acid. Found in exfoliating toners."
   - **Retinol** → tooltip: "Vitamin A derivative. Found in anti-aging serums. Can cause purging."
   - **Vitamin C** → tooltip: "Brightening antioxidant. Found in serums targeting dark spots."

3. Scoring (see Fix 5): "Not sure" = sensitivity score neutral (0 points) but flag `sensitivityDataConfidence: 'low'` in the user's score object.

---

## FIX 4 — CRITICAL BUG: Selections Disappear When Navigating Between Categories

**Problem:** When user goes Back or Next between Category 1–8, all previously selected answers are lost (state resets).

**Root Cause:** Category component state is local (`useState`) and unmounts on navigation, discarding selections.

**Fix — Lift state to a persistent context or use a global store:**

### Option A (preferred if using React Context):

Create `src/context/DiagnosisContext.tsx`:

```typescript
import { createContext, useContext, useState, ReactNode } from "react";

// All answer types for all 8 categories
export interface DiagnosisAnswers {
  // Cat 1: Hydration & Barrier
  skinFeelAfterCleansing?: string;       // "tight" | "comfortable" | "oily" | "varies"
  visibleDryness?: string[];             // face zones
  barrierDisruption?: string;

  // Cat 2: Oiliness & Pores
  oilinessLevel?: string;
  tZoneVsUZone?: string;
  poreVisibility?: string[];

  // Cat 3: Acne & Breakouts
  acneFrequency?: string;
  acneZones?: string[];                  // NOW includes "forehead_left" | "forehead_right"
  acneType?: string[];

  // Cat 4: Sensitivity & Redness
  flushReactivity?: string;             // "none" | "mild" | "moderate" | "intense"
  redZones?: string[];
  activeStinging?: string[];            // "AHA" | "Retinol" | "Vitamin C" | "not_sure"
  sensitivityDataConfidence?: "high" | "low";  // low when "not_sure" selected

  // Cat 5: Pigmentation & Dark Spots
  pigmentationPattern?: string;
  pigmentZones?: string[];
  sunExposureHistory?: string;

  // Cat 6: Aging & Firmness
  fineLinesZones?: string[];
  skinFirmness?: string;
  agingConcern?: string;

  // Cat 7: Lifestyle & Environment
  sleepQuality?: string;
  stressLevel?: string;
  dietPattern?: string[];
  environmentType?: string;

  // Cat 8: Routine & Products
  currentRoutineComplexity?: string;
  productReactions?: string[];
  routineDuration?: string;
}

interface DiagnosisContextType {
  answers: DiagnosisAnswers;
  updateAnswers: (partial: Partial<DiagnosisAnswers>) => void;
  clearAnswers: () => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | null>(null);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});

  const updateAnswers = (partial: Partial<DiagnosisAnswers>) =>
    setAnswers((prev) => ({ ...prev, ...partial }));

  const clearAnswers = () => setAnswers({});

  return (
    <DiagnosisContext.Provider value={{ answers, updateAnswers, clearAnswers }}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
}
```

- Wrap the diagnosis route/layout with `<DiagnosisProvider>` in the router or layout file.
- In EVERY category component, replace local `useState` for answers with `useDiagnosis()`:
  ```typescript
  const { answers, updateAnswers } = useDiagnosis();
  // Read:  answers.flushReactivity
  // Write: updateAnswers({ flushReactivity: "moderate" })
  ```
- This ensures state persists across all forward/back navigation.

---

## FIX 5 — Scoring Logic Overhaul (Full 10-Axis Recalculation)

Replace or update the scoring function at `src/lib/scoring.ts` (or wherever scores are computed).

### Scoring Philosophy
Each of the 10 axes is scored 0–100 where **higher = more concern/severity** (not "better").
The protocol recommendation engine then inverts axes where needed (e.g., high hydration score = needs humectants).

### Axis Definitions & Weights

```typescript
export interface SkinScore {
  hydration: number;      // 0–100 (100 = severely dehydrated)
  barrier: number;        // 0–100 (100 = severely compromised barrier)
  acne: number;           // 0–100 (100 = severe acne)
  sensitivity: number;    // 0–100 (100 = extremely sensitive)
  redness: number;        // 0–100 (100 = chronic redness/rosacea risk)
  sebum: number;          // 0–100 (100 = extremely oily)
  pigmentation: number;   // 0–100 (100 = severe hyperpigmentation)
  aging: number;          // 0–100 (100 = advanced visible aging)
  hormonal: number;       // 0–100 (100 = strong hormonal acne pattern) — NEW AXIS
  lifestyle: number;      // 0–100 (100 = high lifestyle-induced skin stress)
  confidence: number;     // 0–100 (% data completeness / answer confidence)
}
```

### Full Scoring Function

```typescript
import { DiagnosisAnswers, SkinScore } from "./types";

export function computeSkinScore(answers: DiagnosisAnswers): SkinScore {
  // ── HYDRATION ───────────────────────────────────────────────
  let hydration = 0;
  if (answers.skinFeelAfterCleansing === "tight")       hydration += 40;
  if (answers.skinFeelAfterCleansing === "comfortable") hydration += 10;
  if (answers.skinFeelAfterCleansing === "varies")      hydration += 25;
  if (answers.visibleDryness && answers.visibleDryness.length > 0) {
    hydration += Math.min(answers.visibleDryness.length * 10, 40);
  }
  if (answers.barrierDisruption === "frequent")         hydration += 20;

  // ── BARRIER ─────────────────────────────────────────────────
  let barrier = 0;
  if (answers.barrierDisruption === "frequent")         barrier += 50;
  if (answers.barrierDisruption === "occasional")       barrier += 25;
  // Stinging actives = direct barrier proxy
  const stingingActives = answers.activeStinging?.filter(a => a !== "not_sure") ?? [];
  barrier += Math.min(stingingActives.length * 15, 45);
  // Sensitivity boosts barrier score (they are correlated)
  if (answers.flushReactivity === "intense")            barrier += 20;
  if (answers.flushReactivity === "moderate")           barrier += 10;

  // ── ACNE ────────────────────────────────────────────────────
  let acne = 0;
  if (answers.acneFrequency === "always")               acne += 50;
  if (answers.acneFrequency === "often")                acne += 35;
  if (answers.acneFrequency === "sometimes")            acne += 20;
  if (answers.acneFrequency === "rarely")               acne += 8;
  if (answers.acneZones && answers.acneZones.length > 0) {
    acne += Math.min(answers.acneZones.length * 7, 35);
  }
  if (answers.acneType?.includes("cystic"))             acne += 15;
  if (answers.acneType?.includes("whitehead"))          acne += 8;
  if (answers.acneType?.includes("blackhead"))          acne += 5;

  // ── HORMONAL (NEW) ──────────────────────────────────────────
  // Hormonal acne pattern = jawline, chin, and/or hairline zones
  let hormonal = 0;
  const hormonalZones = ["left_jaw", "right_jaw", "chin", "forehead_left", "forehead_right"];
  const matchedHormonalZones = answers.acneZones?.filter(z => hormonalZones.includes(z)) ?? [];
  hormonal += matchedHormonalZones.length * 18;
  // Hairline-specific signal (stronger hormonal indicator than chin alone)
  if (answers.acneZones?.includes("forehead_left") || answers.acneZones?.includes("forehead_right")) {
    hormonal += 15; // hairline acne is a strong androgen sensitivity signal
  }
  if (answers.stressLevel === "high")                   hormonal += 15;
  if (answers.sleepQuality === "poor")                  hormonal += 10;

  // ── SENSITIVITY ─────────────────────────────────────────────
  let sensitivity = 0;
  if (answers.flushReactivity === "intense")            sensitivity += 50;
  if (answers.flushReactivity === "moderate")           sensitivity += 30;
  if (answers.flushReactivity === "mild")               sensitivity += 15;
  // Each stinging active = confirmed sensitivity signal
  sensitivity += stingingActives.length * 12;
  // "Not sure" = no positive signal, but don't penalize
  if (answers.productReactions?.length)                 sensitivity += Math.min(answers.productReactions.length * 8, 24);

  // ── REDNESS ─────────────────────────────────────────────────
  let redness = 0;
  if (answers.flushReactivity === "intense")            redness += 55;
  if (answers.flushReactivity === "moderate")           redness += 35;
  if (answers.flushReactivity === "mild")               redness += 15;
  if (answers.redZones && answers.redZones.length > 0) {
    redness += Math.min(answers.redZones.length * 8, 32);
  }
  // Rosacea risk: redness + sensitivity both high
  if (sensitivity > 50 && redness > 40)                 redness += 10;

  // ── SEBUM ────────────────────────────────────────────────────
  let sebum = 0;
  if (answers.oilinessLevel === "very_oily")            sebum += 60;
  if (answers.oilinessLevel === "oily")                 sebum += 40;
  if (answers.oilinessLevel === "combination")          sebum += 25;
  if (answers.oilinessLevel === "normal")               sebum += 10;
  if (answers.tZoneVsUZone === "tzone_only")            sebum += 10;
  if (answers.poreVisibility && answers.poreVisibility.length > 0) {
    sebum += Math.min(answers.poreVisibility.length * 5, 20);
  }

  // ── PIGMENTATION ─────────────────────────────────────────────
  let pigmentation = 0;
  if (answers.pigmentationPattern === "melasma")        pigmentation += 55;
  if (answers.pigmentationPattern === "post_acne")      pigmentation += 40;
  if (answers.pigmentationPattern === "sun_spots")      pigmentation += 35;
  if (answers.pigmentationPattern === "freckles")       pigmentation += 15;
  if (answers.pigmentZones && answers.pigmentZones.length > 0) {
    pigmentation += Math.min(answers.pigmentZones.length * 8, 30);
  }
  if (answers.sunExposureHistory === "high")            pigmentation += 15;

  // ── AGING ────────────────────────────────────────────────────
  let aging = 0;
  if (answers.skinFirmness === "very_low")              aging += 45;
  if (answers.skinFirmness === "low")                   aging += 25;
  if (answers.fineLinesZones && answers.fineLinesZones.length > 0) {
    aging += Math.min(answers.fineLinesZones.length * 10, 40);
  }
  if (answers.agingConcern === "sagging")               aging += 15;
  if (answers.agingConcern === "wrinkles")              aging += 12;

  // ── LIFESTYLE ────────────────────────────────────────────────
  let lifestyle = 0;
  if (answers.sleepQuality === "poor")                  lifestyle += 30;
  if (answers.sleepQuality === "average")               lifestyle += 15;
  if (answers.stressLevel === "high")                   lifestyle += 30;
  if (answers.stressLevel === "moderate")               lifestyle += 15;
  if (answers.environmentType === "urban_polluted")     lifestyle += 20;
  if (answers.dietPattern?.includes("high_sugar"))      lifestyle += 15;
  if (answers.dietPattern?.includes("low_water"))       lifestyle += 10;

  // ── DATA CONFIDENCE ──────────────────────────────────────────
  // Count how many key questions were answered
  const keyFields: (keyof DiagnosisAnswers)[] = [
    "skinFeelAfterCleansing", "acneFrequency", "flushReactivity",
    "activeStinging", "oilinessLevel", "pigmentationPattern",
    "skinFirmness", "sleepQuality", "stressLevel", "currentRoutineComplexity",
  ];
  const answeredCount = keyFields.filter(k => answers[k] !== undefined && answers[k] !== null).length;
  let confidence = Math.round((answeredCount / keyFields.length) * 100);
  // Penalize low-confidence answers
  if (answers.sensitivityDataConfidence === "low") confidence = Math.max(confidence - 10, 0);

  // ── CLAMP ALL TO 0–100 ───────────────────────────────────────
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

  return {
    hydration:    clamp(hydration),
    barrier:      clamp(barrier),
    acne:         clamp(acne),
    sensitivity:  clamp(sensitivity),
    redness:      clamp(redness),
    sebum:        clamp(sebum),
    pigmentation: clamp(pigmentation),
    aging:        clamp(aging),
    hormonal:     clamp(hormonal),
    lifestyle:    clamp(lifestyle),
    confidence,
  };
}
```

### Protocol Mapping Logic (Post-Score)

Add this function after `computeSkinScore`:

```typescript
export function mapScoreToProtocolPriorities(score: SkinScore): string[] {
  const priorities: { axis: keyof SkinScore; threshold: number; label: string }[] = [
    { axis: "barrier",      threshold: 40, label: "Barrier Repair (Priority 1)" },
    { axis: "hydration",    threshold: 40, label: "Intensive Hydration" },
    { axis: "acne",         threshold: 35, label: "Acne Management" },
    { axis: "hormonal",     threshold: 30, label: "Hormonal Balancing Care" },
    { axis: "sensitivity",  threshold: 40, label: "Sensitivity Calming" },
    { axis: "redness",      threshold: 35, label: "Redness & Rosacea Support" },
    { axis: "sebum",        threshold: 40, label: "Sebum Control" },
    { axis: "pigmentation", threshold: 30, label: "Brightening & Pigmentation" },
    { axis: "aging",        threshold: 35, label: "Anti-Aging Protocol" },
    { axis: "lifestyle",    threshold: 40, label: "Lifestyle-Adjusted Routine" },
  ];

  return priorities
    .filter(p => (score[p.axis] as number) >= p.threshold)
    .sort((a, b) => (score[b.axis] as number) - (score[a.axis] as number))
    .map(p => p.label);
}
```

---

## SUMMARY OF ALL FILES TO MODIFY

| File | Change |
|------|--------|
| `src/context/DiagnosisContext.tsx` | CREATE — global state for all 8 category answers |
| `src/components/diagnosis/FaceMap.tsx` | CREATE or REFACTOR — unified face map with hairline zones |
| `src/pages/diagnosis/Category4.tsx` | Fix face map size, add "Not sure" option with tooltip |
| `src/pages/diagnosis/Category*.tsx` (all) | Replace local useState → useDiagnosis() context |
| `src/lib/scoring.ts` | Replace with new 10-axis scoring function above |
| Router / Layout file | Wrap with `<DiagnosisProvider>` |

---

## IMPORTANT CONSTRAINTS
- Do NOT change the visual design language (dark theme, cyan primary color, existing typography).
- Do NOT remove any existing question. Only ADD the "Not sure" option and hairline zones.
- The `confidence` score must be displayed on the results page as a data completeness indicator, e.g. "Your profile is 80% complete — add more details for a more precise protocol."
- All tooltip text must be in English (matching the rest of the UI).
- Test that navigating Category 1 → 4 → 2 → 8 → back to 1 retains all previously selected values.
