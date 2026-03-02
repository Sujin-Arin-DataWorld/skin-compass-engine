# LOVABLE PROMPT — Results Full Redesign
### Emotional Conversion Architecture: From "I Feel Understood" → "I Need This" → "I'm Subscribing"

---

## SCOPE

**Files to replace / create:**
- `src/components/results/SlideDiagnosisSummary.tsx` → FULL REDESIGN
- `src/components/results/SlideAxisBreakdown.tsx` → FULL REDESIGN
- `src/components/results/SlideProtocol.tsx` → FULL REDESIGN
- `src/components/results/SlideWhyProducts.tsx` → FULL REDESIGN
- `src/components/results/SlideSubscribe.tsx` → FULL REDESIGN (replaces v8 patch)
- `src/components/results/ResultsShell.tsx` → UPDATE (emotional progress bar)

**Do NOT change:** Design tokens, fonts, color system, DiagnosisContext, FaceMap SVG, Shopify mappings.

---

## EMOTIONAL JOURNEY ARCHITECTURE

The 5 Result slides must function as a **single narrative arc**, not 5 independent screens.

```
Slide 1 — DIAGNOSIS SUMMARY   → Emotion: "They see exactly what I'm dealing with"
Slide 2 — AXIS BREAKDOWN       → Emotion: "This is a real, precise map of my skin"
Slide 3 — 5-PHASE PROTOCOL     → Emotion: "There's a clinical plan built just for me"
Slide 4 — WHY THESE PRODUCTS   → Emotion: "These products make perfect sense. I want them."
Slide 5A — WHY STRATEGY        → Emotion: "A one-time buy isn't enough. I need the system."
Slide 5B — CHOOSE YOUR PLAN    → Emotion: "At this price, this is an obvious yes."
```

Each slide **opens a desire** that the next slide **resolves**.
Never let a slide feel complete without forward pull.

---

## PART 1 — Results Shell & Emotional Progress Bar

```tsx
// src/components/results/ResultsShell.tsx

// The progress bar at the top of Results is not "1 of 5"
// It is a narrative indicator. Replace step numbers with emotional labels.

const RESULT_SLIDE_LABELS = [
  { key: 'diagnosis',  short: 'Pattern',   full: 'Your Skin Pattern' },
  { key: 'axes',       short: 'Analysis',  full: 'Clinical Analysis' },
  { key: 'protocol',   short: 'Protocol',  full: 'Your Routine' },
  { key: 'products',   short: 'Products',  full: 'Matched Products' },
  { key: 'subscribe',  short: 'Strategy',  full: 'Adaptive Strategy' },
];

// The active slide label animates in below the dots.
// Inactive slides are dots. Active slide is a pill with the label.
// This communicates "you are building toward something" not "you are completing a form".
```

---

## PART 2 — SLIDE 1: Diagnosis Summary

### Emotional Goal
The user spent 5+ minutes answering intimate questions about their skin.
**The first result must feel like a mirror that finally sees them.**

Not: "Your score is 72."
But: "We identified your skin's dominant pattern, and here's what it means."

### Layout Structure

```tsx
// src/components/results/SlideDiagnosisSummary.tsx

export function SlideDiagnosisSummary({ diagnosisResult }) {
  // diagnosisResult.pattern — e.g. "Hormonal Acne Cascade"
  // diagnosisResult.topConcern — e.g. "Sensitivity (100/100)"
  // diagnosisResult.skinVector — Array<{ label: string; value: number; severity: 'low'|'mid'|'high' }>
  // diagnosisResult.confidence — 0–100
  // diagnosisResult.activeCategories — string[] (which categories were activated)

  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full min-h-screen">

      {/* ── SECTION A: Opening empathy hook ── */}
      {/* This is the most important line in the entire product. */}
      {/* It must feel human, not clinical. */}
      <EmpathyHook pattern={diagnosisResult.pattern} />

      {/* ── SECTION B: Pattern Identity Card ── */}
      {/* Large, dramatic. The user's skin pattern name like a diagnosis label. */}
      <PatternIdentityCard
        pattern={diagnosisResult.pattern}
        confidence={diagnosisResult.confidence}
        signalCount={diagnosisResult.signalCount}
      />

      {/* ── SECTION C: What this pattern means ── */}
      {/* 3-line clinical plain-language explanation of the pattern */}
      <PatternExplainer pattern={diagnosisResult.pattern} />

      {/* ── SECTION D: Key signal highlights (not scores — observations) ── */}
      {/* "We noticed..." bullets — personalized from activated categories */}
      <ObservationBullets activeCategories={diagnosisResult.activeCategories} signals={diagnosisResult.skinVector} />

      {/* ── SECTION E: Forward pull ── */}
      <ForwardPullFooter slideLabel="See your full clinical map →" />

    </div>
  );
}
```

### Sub-components

#### EmpathyHook

```tsx
// Maps pattern → empathy opening line
// These are NOT marketing. They are human acknowledgments.

const EMPATHY_MAP: Record<string, string> = {
  'Hormonal Acne Cascade':
    'Breakouts that follow a pattern, not a random one. Your skin is reacting to something deeper than surface oil.',
  'Barrier Stress Pattern':
    'Your skin is working harder than it should have to. It\'s not sensitivity — it\'s a barrier under pressure.',
  'Dehydrated-Oily Complex':
    'Shine on the surface, tightness underneath. These two signals together tell us something specific about your skin.',
  'Melasma-Dominant Pattern':
    'Your pigmentation has a logic to it. UV and hormones are both in the picture.',
  'Texture-Congestion Overlap':
    'Rough texture and congested pores usually share the same root. Your skin is telling us where to focus.',
  'Elasticity Loss — Early Stage':
    'The changes you\'re noticing aren\'t sudden. They\'ve been building, and that means they can be addressed systematically.',
  // fallback
  'default':
    'Your skin has a specific pattern. It\'s not random, and it\'s not unsolvable.',
};

function EmpathyHook({ pattern }: { pattern: string }) {
  const text = EMPATHY_MAP[pattern] ?? EMPATHY_MAP['default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-6"
    >
      {/* Eyebrow — small, clinical */}
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'hsl(var(--primary))',
        marginBottom: '0.625rem',
      }}>
        Diagnostic Result
      </p>

      {/* The empathy line — most important text on this screen */}
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.25rem, 3vw, 1.625rem)',
        fontWeight: 400,
        lineHeight: 1.35,
        color: 'hsl(var(--foreground))',
        fontStyle: 'italic',
      }}>
        "{text}"
      </p>
    </motion.div>
  );
}
```

#### PatternIdentityCard

```tsx
// The skin pattern name rendered dramatically — like a medical diagnosis card
// This creates identity anchoring: "This is MY skin pattern"

function PatternIdentityCard({
  pattern, confidence, signalCount
}: { pattern: string; confidence: number; signalCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="rounded-3xl border p-5 mb-5"
      style={{
        borderColor: 'hsl(var(--primary)/0.4)',
        background: 'linear-gradient(135deg, hsl(var(--primary)/0.06) 0%, hsl(var(--card)) 100%)',
      }}
    >
      {/* Label */}
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'hsl(var(--foreground-hint))',
        marginBottom: '0.375rem',
      }}>
        Identified Skin Pattern
      </p>

      {/* Pattern name — the "aha" moment */}
      <h1 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
        fontWeight: 600,
        lineHeight: 1.1,
        color: 'hsl(var(--foreground))',
        marginBottom: '1rem',
      }}>
        {pattern}
      </h1>

      {/* Three stats row */}
      <div className="flex gap-5">
        <StatMini label="Signals captured" value={String(signalCount)} />
        <div style={{ width: '1px', background: 'hsl(var(--border))' }} />
        <StatMini label="Diagnostic confidence" value={`${confidence}%`} />
        <div style={{ width: '1px', background: 'hsl(var(--border))' }} />
        <StatMini label="Dermatologist reviewed" value="✓" accent />
      </div>
    </motion.div>
  );
}

function StatMini({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '1.25rem',
        fontWeight: 600,
        color: accent ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.6875rem',
        color: 'hsl(var(--foreground-hint))',
        marginTop: '0.2rem',
        lineHeight: 1.3,
      }}>
        {label}
      </p>
    </div>
  );
}
```

#### ObservationBullets

```tsx
// "We noticed..." — personalised from actual activated categories and signal values
// NOT generic. Each bullet must use actual data from the diagnosis.

const OBSERVATION_TEMPLATES: Record<string, (signal: SkinVector) => string> = {
  C1_ACNE:       (s) => `Breakout activity ${s.severity === 'high' ? 'concentrated and cyclical' : 'present with moderate frequency'}`,
  C2_OILINESS:   (s) => `Sebum overproduction${s.severity === 'high' ? ' returning within 2–4h of cleansing' : ' in the T-zone'}`,
  C3_HYDRATION:  (s) => `Moisture retention ${s.severity === 'high' ? 'significantly compromised (fast TEWL pattern)' : 'below optimal'}`,
  C4_SENSITIVITY:(s) => `Reactive sensitivity${s.severity === 'high' ? ' — multiple actives causing stinging' : ' with thermal flush tendency'}`,
  C5_PIGMENT:    (s) => `Pigmentation${s.severity === 'high' ? ' showing UV-responsive deepening' : ' with residual post-inflammatory marks'}`,
  C6_TEXTURE:    (s) => `Pore and texture irregularity${s.severity === 'high' ? ' across both nose and forehead zones' : ' in T-zone'}`,
  C7_ELASTICITY: (s) => `Firmness response${s.severity === 'high' ? ' — pinch recoil significantly delayed' : ' showing early-stage reduction'}`,
  C8_BARRIER:    (s) => `Barrier stress${s.severity === 'high' ? ' — redness + tightness + stinging triad present' : ' with recovery delay'}`,
};

function ObservationBullets({
  activeCategories, signals
}: { activeCategories: string[]; signals: SkinVector[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="space-y-2 mb-6"
    >
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'hsl(var(--foreground-hint))',
        marginBottom: '0.5rem',
      }}>
        What we observed
      </p>
      {activeCategories.slice(0, 4).map((catId) => {
        const signal = signals.find(s => s.categoryId === catId);
        if (!signal) return null;
        const template = OBSERVATION_TEMPLATES[catId];
        return (
          <div key={catId} className="flex gap-2.5 items-start">
            <span style={{ color: 'hsl(var(--primary))', fontSize: '0.875rem', flexShrink: 0, marginTop: '0.1rem' }}>
              ·
            </span>
            <p style={{
              fontFamily: "'DM Sans'",
              fontSize: '0.875rem',
              color: 'hsl(var(--foreground-body))',
              lineHeight: 1.5,
            }}>
              {template?.(signal) ?? catId}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
}
```

---

## PART 3 — SLIDE 2: Axis Breakdown

### Emotional Goal
The radar/bar chart becomes a **personal fingerprint**, not a scorecard.
The user should feel: "This is precisely me, not a generic skin type."

### Key Design Changes

```tsx
// src/components/results/SlideAxisBreakdown.tsx

// CHANGE 1: Add a "fingerprint" metaphor above the chart
// "No two skin vectors are identical. This is yours."

// CHANGE 2: Under each axis bar, add a ONE-LINE clinical interpretation
// NOT: "Acne: 78"
// BUT: "Acne: 78 — Hormonal flare pattern with inflammation"

// CHANGE 3: Highlight the TOP axis differently (primary color, slightly larger label)
// This draws the eye and creates identity focus.

// CHANGE 4: Add a "Most critical to address first" call-out beneath the chart
// → this creates urgency and forward pull to the Protocol slide

const AXIS_INTERPRETATIONS: Record<string, (score: number) => string> = {
  acne:        s => s >= 75 ? 'Cyclical, likely hormonally driven' : s >= 50 ? 'Moderate, inflammatory pattern' : 'Occasional, surface-level',
  oiliness:    s => s >= 75 ? 'Rapid sebum return, T-zone dominant' : s >= 50 ? 'Balanced but reactive to humidity' : 'Controlled',
  hydration:   s => s >= 75 ? 'Compromised moisture barrier (TEWL risk)' : s >= 50 ? 'Suboptimal retention' : 'Adequate',
  sensitivity: s => s >= 75 ? 'High reactivity — multiple trigger exposure' : s >= 50 ? 'Moderate — flush and thermal reactivity' : 'Manageable',
  pigmentation:s => s >= 75 ? 'UV-responsive, melasma-type deepening' : s >= 50 ? 'Post-inflammatory marks, localized' : 'Mild',
  texture:     s => s >= 75 ? 'Dual mechanism — pores + surface roughness' : s >= 50 ? 'Congestion-dominant' : 'Minor irregularity',
  elasticity:  s => s >= 75 ? 'Recoil delay across multiple contour zones' : s >= 50 ? 'Early-stage firmness reduction' : 'Within normal range',
  barrier:     s => s >= 75 ? 'Barrier compromise triad present' : s >= 50 ? 'Stress pattern, recovery delayed' : 'Mild disruption',
};

export function SlideAxisBreakdown({ scores }) {
  const sortedAxes = Object.entries(scores).sort(([,a],[,b]) => (b as number) - (a as number));
  const [topAxis] = sortedAxes[0];

  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full">
      {/* Eyebrow */}
      <p className="slide-eyebrow mb-2">Clinical Analysis</p>

      {/* Headline with fingerprint metaphor */}
      <h2 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 400, lineHeight: 1.2, marginBottom: '0.5rem',
      }}>
        Your skin vector
      </h2>
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.875rem',
        color: 'hsl(var(--foreground-hint))', lineHeight: 1.5,
        marginBottom: '1.5rem',
      }}>
        No two vectors are identical. This is precisely yours.
      </p>

      {/* Radar chart — existing component, unchanged */}
      <RadarChartComponent scores={scores} highlightAxis={topAxis} />

      {/* Axis detail bars with interpretation text */}
      <div className="space-y-3 mt-6">
        {sortedAxes.map(([axis, score], i) => (
          <AxisDetailRow
            key={axis}
            axis={axis}
            score={score as number}
            isTop={i === 0}
            interpretation={AXIS_INTERPRETATIONS[axis]?.(score as number) ?? ''}
          />
        ))}
      </div>

      {/* "Critical focus" callout — creates urgency → pull to Protocol slide */}
      <CriticalFocusCallout topAxis={topAxis} topScore={sortedAxes[0][1] as number} />
    </div>
  );
}

function AxisDetailRow({ axis, score, isTop, interpretation }) {
  const AXIS_LABELS = {
    acne: 'Breakouts', oiliness: 'Oiliness', hydration: 'Dryness',
    sensitivity: 'Sensitivity', pigmentation: 'Pigmentation',
    texture: 'Texture', elasticity: 'Firmness', barrier: 'Barrier',
  };

  return (
    <div className={`rounded-xl p-3 ${isTop ? 'border' : ''}`}
      style={isTop ? {
        borderColor: 'hsl(var(--primary)/0.4)',
        background: 'hsl(var(--primary)/0.04)',
      } : {}}>
      {/* Label + score */}
      <div className="flex justify-between items-center mb-1.5">
        <p style={{
          fontFamily: "'DM Sans'",
          fontSize: '0.875rem',
          fontWeight: isTop ? 700 : 500,
          color: isTop ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        }}>
          {AXIS_LABELS[axis] ?? axis}
          {isTop && <span style={{ fontSize: '0.6875rem', marginLeft: '0.4rem', opacity: 0.7 }}>
            — Primary focus
          </span>}
        </p>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1rem',
          fontWeight: 600,
          color: isTop ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        }}>
          {score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="rounded-full overflow-hidden" style={{
        height: '4px', background: 'hsl(var(--border))', marginBottom: '0.5rem',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: isTop ? 'hsl(var(--primary))' : 'hsl(var(--foreground-hint))', opacity: isTop ? 1 : 0.5 }}
        />
      </div>

      {/* Interpretation text */}
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.75rem',
        color: 'hsl(var(--foreground-hint))',
        lineHeight: 1.4,
      }}>
        {interpretation}
      </p>
    </div>
  );
}

function CriticalFocusCallout({ topAxis, topScore }) {
  const CRITICAL_MESSAGES = {
    acne:        'Inflammation control must come before any actives.',
    oiliness:    'Sebum regulation is the gateway to texture and pore improvement.',
    hydration:   'Barrier hydration is Phase 1 before any targeted treatment.',
    sensitivity: 'Barrier calming must precede all active ingredients.',
    pigmentation:'SPF protocol activation is the highest leverage action.',
    texture:     'Gentle exfoliation cadence is the critical variable.',
    elasticity:  'Collagen-supporting actives unlock in Phase 4.',
    barrier:     'Barrier repair must be established before adding any new actives.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 rounded-2xl border p-4"
      style={{
        borderColor: 'hsl(var(--primary)/0.25)',
        background: 'hsl(var(--primary)/0.05)',
      }}
    >
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'hsl(var(--primary))',
        marginBottom: '0.3rem',
      }}>
        Protocol Priority
      </p>
      <p style={{
        fontFamily: "'DM Sans'",
        fontSize: '0.875rem',
        color: 'hsl(var(--foreground-body))',
        lineHeight: 1.5,
      }}>
        {CRITICAL_MESSAGES[topAxis] ?? 'Your protocol is ordered by clinical priority, starting with your highest-scoring axis.'}
      </p>
    </motion.div>
  );
}
```

---

## PART 4 — SLIDE 3: 5-Phase Protocol

### Emotional Goal
"There is a specific, ordered plan. It was built from my data. It's not generic."

### Key Design Changes

```tsx
// src/components/results/SlideProtocol.tsx
// EXTEND existing structure with:

// CHANGE 1: "Protocol confidence score" near the headline
// "Built from 24 signals — 91% match confidence"

// CHANGE 2: Each phase tab shows the REASON this phase applies to them
// Not just "Phase 1 — Cleanse"
// But: "Phase 1 — Cleanse · Barrier-safe only (sensitivity high)"

// CHANGE 3: Products in each phase are shown with matched ingredient callouts
// Product name + "✓ Ceramide NP — matched to your barrier score"

// CHANGE 4: "What happens if you skip this phase" — small text per phase
// Creates urgency and compliance motivation

const PHASE_META = {
  'Phase 1': {
    label: 'Cleanse',
    skipWarning: 'Skipping leaves barrier-disrupting residue that amplifies reactivity.',
  },
  'Phase 2': {
    label: 'Barrier / Hydration',
    skipWarning: 'Barrier support is the foundation — skipping collapses all downstream phases.',
  },
  'Phase 3': {
    label: 'Targeted Treatment',
    skipWarning: 'Treatment actives without barrier prep cause reactive flare-ups.',
  },
  'Phase 4': {
    label: 'Recovery / Tone',
    skipWarning: 'Recovery phase locks in treatment gains — skipping reduces efficacy by ~40%.',
  },
  'Phase 5': {
    label: 'Protect',
    skipWarning: 'Without SPF, all pigmentation and barrier work is partially reversed daily.',
  },
};

// Protocol confidence mini-badge near headline
function ProtocolConfidenceBadge({ signalCount }) {
  const confidence = Math.min(95, 65 + signalCount * 1.5);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4"
      style={{
        background: 'hsl(var(--primary)/0.1)',
        border: '1px solid hsl(var(--primary)/0.3)',
      }}>
      <span style={{
        fontFamily: "'DM Sans'", fontSize: '0.75rem', fontWeight: 700,
        color: 'hsl(var(--primary))',
      }}>
        {Math.round(confidence)}% protocol match
      </span>
      <span style={{
        fontFamily: "'DM Sans'", fontSize: '0.75rem',
        color: 'hsl(var(--foreground-hint))',
      }}>
        · Built from {signalCount} signals
      </span>
    </div>
  );
}
```

---

## PART 5 — SLIDE 4: Why These Products

### Emotional Goal
"I feel like these products were chosen because of something specific about ME,
not because they're popular or profitable."

This is the **purchase intent slide**. The user should feel:
- Understood (signals matched)
- Convinced (ingredients mapped)
- Urgency (limited to what their skin needs)

### Layout

```tsx
// src/components/results/SlideWhyProducts.tsx
// EXTEND existing ProductWhyCard with significant additions:

export function SlideWhyProducts({ whyResults, productCatalog }) {
  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full">
      {/* Eyebrow */}
      <p className="slide-eyebrow mb-2">Personalized Selection</p>

      {/* Headline — "curated" framing, not "here are your products" */}
      <h2 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 400, lineHeight: 1.2, marginBottom: '0.5rem',
      }}>
        5 formulas matched to your vector
      </h2>
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.875rem',
        color: 'hsl(var(--foreground-hint))', lineHeight: 1.5,
        marginBottom: '1.5rem',
      }}>
        Each product was selected because of specific signals in your diagnosis —
        not because of your skin type alone.
      </p>

      {/* Product cards */}
      <div className="space-y-4">
        {whyResults.map((result) => (
          <EnhancedProductWhyCard key={result.productId} result={result} />
        ))}
      </div>

      {/* Bottom trust + forward pull */}
      <SubscribePullBanner />
    </div>
  );
}

// ── Enhanced Product Card ──────────────────────────────────

function EnhancedProductWhyCard({ result }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
    >
      {/* ── Card header: Brand / Name / Phase / Price ── */}
      <div className="px-4 pt-4 pb-3">
        {/* Brand name */}
        <p style={{
          fontFamily: "'DM Sans'", fontSize: '0.625rem', fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'hsl(var(--primary))', marginBottom: '0.2rem',
        }}>
          {result.brand}
        </p>

        <div className="flex items-start justify-between">
          <div>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 600,
              color: 'hsl(var(--foreground))', lineHeight: 1.2,
            }}>
              {result.productName}
            </p>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: '0.75rem',
              color: 'hsl(var(--foreground-hint))', marginTop: '0.15rem',
            }}>
              {result.productType}
            </p>
          </div>
          <div className="text-right">
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.25rem', fontWeight: 600,
              color: 'hsl(var(--foreground))',
            }}>
              {result.price}
            </p>
            <span className="rounded-full px-2 py-0.5 text-xs" style={{
              background: 'hsl(var(--primary)/0.1)',
              color: 'hsl(var(--primary))',
              fontFamily: "'DM Sans'", fontWeight: 700,
            }}>
              {result.phase}
            </span>
          </div>
        </div>
      </div>

      {/* ── Matched signals bar visualization ── */}
      {/* Shows the 2–3 axes this product was matched to */}
      <div className="px-4 pb-3 border-t" style={{ borderColor: 'hsl(var(--border)/0.5)' }}>
        <p style={{
          fontFamily: "'DM Sans'", fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'hsl(var(--foreground-hint))', margin: '0.625rem 0 0.5rem',
        }}>
          Matched to your profile
        </p>
        <div className="space-y-1.5">
          {result.matchedAxes?.map(({ axis, score, isHighest }) => (
            <MatchBar key={axis} axis={axis} score={score} isHighest={isHighest} />
          ))}
        </div>
      </div>

      {/* ── Key ingredients ── */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {result.keyIngredients?.map(ing => (
          <span key={ing} style={{
            fontFamily: "'DM Sans'", fontSize: '0.75rem',
            color: 'hsl(var(--foreground-hint))',
          }}>
            ✓ {ing}
          </span>
        ))}
      </div>

      {/* ── Expandable "Why this works for you" ── */}
      <div className="border-t" style={{ borderColor: 'hsl(var(--border)/0.5)' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{
            fontFamily: "'DM Sans'", fontSize: '0.8125rem', fontWeight: 600,
            color: 'hsl(var(--primary))',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <span>Why this works for you</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            ↓
          </motion.span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="px-4 pb-4 space-y-3 overflow-hidden"
            >
              {/* Because we observed */}
              <div>
                <p style={{
                  fontFamily: "'DM Sans'", fontSize: '0.6875rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'hsl(var(--foreground-hint))', marginBottom: '0.3rem',
                }}>
                  Because we observed
                </p>
                {result.because.map((b, i) => (
                  <p key={i} style={{
                    fontFamily: "'DM Sans'", fontSize: '0.8125rem',
                    color: 'hsl(var(--foreground-body))', lineHeight: 1.5,
                  }}>
                    · {b}
                  </p>
                ))}
              </div>

              {/* This product helps by */}
              <div>
                <p style={{
                  fontFamily: "'DM Sans'", fontSize: '0.6875rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'hsl(var(--foreground-hint))', marginBottom: '0.3rem',
                }}>
                  This product helps by
                </p>
                {result.helps.map((h, i) => (
                  <p key={i} style={{
                    fontFamily: "'DM Sans'", fontSize: '0.8125rem',
                    color: 'hsl(var(--foreground-body))', lineHeight: 1.5,
                  }}>
                    ✓ {h}
                  </p>
                ))}
              </div>

              {/* Best in your protocol */}
              <div className="rounded-xl px-3 py-2" style={{
                background: 'hsl(var(--primary)/0.06)',
                borderLeft: '3px solid hsl(var(--primary))',
              }}>
                <p style={{
                  fontFamily: "'DM Sans'", fontSize: '0.8125rem', fontWeight: 600,
                  color: 'hsl(var(--primary))',
                }}>
                  {result.protocol[0]}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Match Bar component (like the image reference) ──────────

function MatchBar({ axis, score, isHighest }) {
  const AXIS_LABELS = {
    acne: 'Acne', oiliness: 'Sebum', hydration: 'Hydration',
    sensitivity: 'Sensitivity', pigmentation: 'Pigment',
    texture: 'Texture', elasticity: 'Elasticity', barrier: 'Barrier',
  };
  return (
    <div className="flex items-center gap-2">
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.75rem',
        color: 'hsl(var(--foreground-hint))', width: '70px', flexShrink: 0,
      }}>
        {AXIS_LABELS[axis] ?? axis}
      </p>
      <div className="flex-1 rounded-full" style={{ height: '4px', background: 'hsl(var(--border))' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: isHighest ? 'hsl(var(--primary))' : 'hsl(var(--foreground-hint)/0.5)' }}
        />
      </div>
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.75rem', fontWeight: 700,
        color: isHighest ? 'hsl(var(--primary))' : 'hsl(var(--foreground-hint))',
        width: '28px', textAlign: 'right',
      }}>
        {score}
      </p>
    </div>
  );
}

// ── Subscribe pull banner at bottom of Slide 4 ──────────────
// This creates the bridge between "I want these products" → "I need the system"

function SubscribePullBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-6 rounded-2xl border p-4"
      style={{
        borderColor: 'hsl(var(--primary)/0.3)',
        background: 'hsl(var(--primary)/0.05)',
      }}
    >
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.6875rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'hsl(var(--primary))', marginBottom: '0.3rem',
      }}>
        One-time vs. Adaptive
      </p>
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.875rem',
        color: 'hsl(var(--foreground-body))', lineHeight: 1.55,
      }}>
        These 5 products are matched to your skin <em>today</em>.
        Next month, your barrier may shift, or a new active may unlock.
        The subscription keeps the match current.
      </p>
    </motion.div>
  );
}
```

---

## PART 6 — SLIDE 5: Subscribe (Full 2-Sub-Slide Redesign)

### Emotional Architecture

```
5A: WHY STRATEGY MATTERS
  ├── Empathy recap (Your diagnosis in 3 data points)
  ├── Why a one-time match isn't enough (Evidence Scaling / Protocol Gating / Monthly Recalibration)
  ├── Scheduled future event anchor ("Your first recalibration: 29 days from now")
  └── CTA → "Choose Your Strategy"

5B: CHOOSE STRATEGY LEVEL
  ├── Progress Investment anchor ("Your diagnosis captured X signals. Don't lose this.")
  ├── Plan cards (Entry / Full / Premium) — accordion with gated features
  ├── Per-day price framing on Full plan
  ├── Recalibration explainer (only for Full/Premium)
  ├── Cancel flow softener ("Cancel or pause anytime. No reset.")
  └── Primary CTA + escape hatch for Entry
```

```tsx
// src/components/results/SlideSubscribe.tsx
// This is the FULL REPLACEMENT — combines v8 patch + all retention psychology upgrades

// ── Psychological CTA Design Principles Applied ──────────────
//
// 1. TEMPORAL COMMITMENT — "Your first recalibration in 29 days"
//    User sees a future event before they even subscribe. Canceling = canceling something scheduled.
//
// 2. PROGRESS INVESTMENT (Endowment Effect)
//    "You've captured 24 signals. A one-time order means those signals go dormant."
//    Subscribed = signals stay alive. Unsubscribed = your data is wasted.
//
// 3. LOSS FRAMING (not fear — continuity framing)
//    "A one-time order solves today. Subscription solves next month."
//    NOT: "Without subscribing, your skin will worsen."
//
// 4. IDENTITY ANCHORING
//    "You're not buying skincare. You're running an adaptive protocol."
//    This shifts the mental model from "monthly box" → "clinical system"
//
// 5. PRICE ANCHORING + PER-DAY REFRAME
//    Premium €149 → shown first as anchor
//    Full €89 → feels rational beside it + shown as €2.97/day
//    Entry €49 → positioned as "one-time, no system" — respects agency but shows the gap
//
// 6. SOFT CANCEL PROMISE
//    Proactively stated: "You can pause, adjust, or cancel anytime. Your progress history stays."
//    Removes the biggest objection before it forms.

// ── Full component code ──

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { FlaskConical, ShieldCheck, RefreshCw, Calendar } from 'lucide-react';

type PlanKey = 'entry' | 'full' | 'premium';

const PLANS = [
  {
    key: 'entry' as PlanKey,
    label: 'Entry',
    tagline: 'Essential 3-step routine — one-time',
    price: '€49',
    priceNote: '',
    perDay: null,
    features: [
      'Core 3-product routine matched to your skin vector',
      'Protocol PDF (AM + PM steps)',
      'Dermatologist reviewed formulas',
    ],
    gated: [
      'Monthly recalibration — products re-rank as skin changes',
      'Protocol gating (active safety logic)',
      'Progress history & Baseline Snapshot',
    ],
  },
  {
    key: 'full' as PlanKey,
    label: 'Full Protocol',
    tagline: 'Complete 5-phase adaptive routine',
    price: '€89',
    priceNote: '/ month',
    perDay: '€2.97',
    badge: 'Recommended',
    features: [
      'All 5 protocol phases, built from your diagnosis',
      'Monthly recalibration — products re-rank as your skin shifts',
      'Protocol gating — actives unlock only when barrier is ready',
      'Baseline Snapshot + monthly progress score comparison',
      'Swap any product anytime — no questions asked',
      'Ships EU 3–5 business days',
    ],
    gated: [
      'Clinical-grade device integration',
    ],
  },
  {
    key: 'premium' as PlanKey,
    label: 'Premium Strategy',
    tagline: 'Full routine + clinical device',
    price: '€149',
    priceNote: '/ month',
    perDay: '€4.97',
    features: [
      'Everything in Full Protocol',
      'Clinical-grade device (LED or microcurrent) matched to your phase',
      'Priority recalibration within 48h of any skin event',
      'Exclusive ingredient unlocks (prescription-adjacent actives)',
    ],
    gated: [],
  },
];

// ── Slide 5A ─────────────────────────────────────────────────

function Slide5A({ onNext, pattern, topConcern, signalCount }) {

  // The "Scheduled Future Event" — creates temporal commitment BEFORE they subscribe
  const recalibrationDate = new Date();
  recalibrationDate.setDate(recalibrationDate.getDate() + 29);
  const dateStr = recalibrationDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full">
      <p className="slide-eyebrow mb-2">Why Strategy Matters</p>

      {/* Headline — identity shift */}
      <h2 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 400, lineHeight: 1.2, marginBottom: '0.875rem',
        color: 'hsl(var(--foreground))',
      }}>
        You're not buying skincare.
        <br />
        <em>You're running a protocol.</em>
      </h2>

      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.9375rem',
        color: 'hsl(var(--foreground-body))', lineHeight: 1.6,
        marginBottom: '1.5rem',
      }}>
        A one-time product match solves today's problem.
        An adaptive strategy solves next month's — and the month after that.
      </p>

      {/* ── Algorithm Credibility Banner ── */}
      <DiagnosisSummaryBanner
        pattern={pattern}
        topConcern={topConcern}
        signalCount={signalCount}
      />

      {/* ── Three value pillars ── */}
      <div className="space-y-3 mb-5">
        {[
          {
            icon: FlaskConical,
            title: 'Evidence Scaling',
            body: `You answered ${signalCount} signals. Each one added weight to the model. Subscription keeps that evidence accumulating — your confidence score grows every cycle.`,
            accent: 'hsl(var(--primary))',
          },
          {
            icon: ShieldCheck,
            title: 'Protocol Gating',
            body: 'Actives like retinoids and AHA are only unlocked when your barrier signals confirm readiness. Without ongoing assessment, there is no safety logic — just guesswork.',
            accent: '#a78bfa',
          },
          {
            icon: RefreshCw,
            title: 'Monthly Recalibration',
            body: 'Skin shifts with seasons, hormones, and stress. Your product ranking updates every 30 days based on a 3-question check-in. No new quiz. Just continuous precision.',
            accent: '#34d399',
          },
        ].map((pillar, i) => (
          <PillarCard key={pillar.title} pillar={pillar} index={i} />
        ))}
      </div>

      {/* ── Scheduled Future Event Banner ── */}
      {/* This is the psychological anchor — creates commitment BEFORE subscription */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border p-4 mb-6 flex items-center gap-3"
        style={{
          borderColor: 'hsl(var(--primary)/0.3)',
          background: 'hsl(var(--primary)/0.06)',
        }}
      >
        <Calendar size={20} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
        <div>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: '0.875rem', fontWeight: 700,
            color: 'hsl(var(--foreground))',
          }}>
            First recalibration: {dateStr}
          </p>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: '0.75rem',
            color: 'hsl(var(--foreground-hint))', lineHeight: 1.4,
          }}>
            Your protocol re-ranks in 29 days. Your diagnosis signals are ready.
          </p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="w-full rounded-2xl py-4 flex items-center justify-center gap-2"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1rem',
          border: 'none', cursor: 'pointer',
        }}
      >
        Choose Your Strategy →
      </motion.button>

      <TrustSignals />
    </div>
  );
}

// ── Slide 5B ─────────────────────────────────────────────────

function Slide5B({ onBack, signalCount }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('full');
  const selected = PLANS.find(p => p.key === selectedPlan)!;

  return (
    <div className="flex flex-col px-6 py-10 max-w-xl mx-auto w-full">
      {/* Back */}
      <button onClick={onBack}
        style={{
          fontFamily: "'DM Sans'", fontSize: '0.8125rem',
          color: 'hsl(var(--foreground-hint))',
          background: 'none', border: 'none', cursor: 'pointer',
          marginBottom: '1.25rem', padding: 0, alignSelf: 'flex-start',
        }}>
        ← Why this matters
      </button>

      <p className="slide-eyebrow mb-2">Choose Strategy Level</p>

      <h2 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(1.375rem, 3vw, 1.875rem)',
        fontWeight: 400, lineHeight: 1.2, marginBottom: '0.5rem',
        color: 'hsl(var(--foreground))',
      }}>
        Three depths. One diagnostic vector.
      </h2>

      {/* ── Progress Investment anchor ── */}
      {/* Endowment Effect: "You've already invested X signals. Don't waste them." */}
      <div className="rounded-xl border px-3 py-2.5 mb-5 flex items-center gap-2"
        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted)/0.3)' }}>
        <span style={{ fontSize: '1rem' }}>🧬</span>
        <p style={{
          fontFamily: "'DM Sans'", fontSize: '0.8125rem',
          color: 'hsl(var(--foreground-body))', lineHeight: 1.4,
        }}>
          Your diagnosis captured <strong>{signalCount} skin signals</strong>.
          Entry fulfills today. Subscription keeps them active next month.
        </p>
      </div>

      {/* ── Plan cards ── */}
      <div className="space-y-3 mb-5">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={selectedPlan === plan.key}
            onSelect={() => setSelectedPlan(plan.key)}
          />
        ))}
      </div>

      {/* ── Recalibration detail — Full/Premium only ── */}
      <AnimatePresence>
        {(selectedPlan === 'full' || selectedPlan === 'premium') && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border p-3.5 mb-5"
            style={{
              borderColor: 'hsl(var(--primary)/0.25)',
              background: 'hsl(var(--primary)/0.04)',
            }}
          >
            <p style={{
              fontFamily: "'DM Sans'", fontSize: '0.8125rem', fontWeight: 700,
              color: 'hsl(var(--primary))', marginBottom: '0.3rem',
            }}>
              How monthly recalibration works
            </p>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: '0.8125rem',
              color: 'hsl(var(--foreground-body))', lineHeight: 1.55,
            }}>
              Every 30 days, answer 3 check-in questions.
              Your precision signals re-weight automatically.
              Products re-rank. Actives gate or unlock based on barrier readiness.
              No new quiz. No manual adjustments.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Primary CTA ── */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-2xl py-4 mb-2"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1rem',
          border: 'none', cursor: 'pointer',
        }}
      >
        Notify Me When Available
        {' '}— {selected.price}{selected.priceNote ? ` ${selected.priceNote}` : ''}
        {selected.perDay ? ` (${selected.perDay}/day)` : ''}
      </motion.button>

      {/* ── Soft Cancel Reassurance (proactive objection removal) ── */}
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.75rem',
        color: 'hsl(var(--foreground-hint))',
        textAlign: 'center', lineHeight: 1.5, marginBottom: '0.75rem',
      }}>
        Pause, adjust, or cancel anytime.
        Your progress history and diagnosis never reset.
      </p>

      {/* ── Escape hatch for Entry ── */}
      {selectedPlan !== 'entry' && (
        <button
          onClick={() => setSelectedPlan('entry')}
          style={{
            fontFamily: "'DM Sans'", fontSize: '0.8125rem',
            color: 'hsl(var(--foreground-hint))',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'center', textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Start with Entry (€49, one-time, no subscription)
        </button>
      )}

      <TrustSignals />
    </div>
  );
}

// ── Root: SlideSubscribe ──────────────────────────────────────

export function SlideSubscribe() {
  const [subSlide, setSubSlide] = useState<'5A' | '5B'>('5A');
  const { scores, answers } = useDiagnosis();

  const topConcern = (() => {
    if (!scores) return 'Sensitivity';
    const entries = Object.entries(scores) as [string, number][];
    if (!entries.length) return 'Sensitivity';
    const [topKey, topScore] = entries.sort((a, b) => b[1] - a[1])[0];
    const MAP: Record<string, string> = {
      acne: 'Breakouts', oiliness: 'Oiliness', hydration: 'Dryness',
      sensitivity: 'Sensitivity', pigmentation: 'Pigmentation',
      texture: 'Texture', elasticity: 'Firmness', barrier: 'Barrier',
    };
    return `${MAP[topKey] ?? topKey} (${topScore}/100)`;
  })();

  const skinPattern: string = (answers?.hypothesis as string | undefined) ?? 'Hormonal Acne Cascade';
  const signalCount = Object.values(answers ?? {}).filter(Boolean).length;

  return (
    <AnimatePresence mode="wait">
      {subSlide === '5A' ? (
        <motion.div key="5A"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Slide5A
            onNext={() => setSubSlide('5B')}
            pattern={skinPattern}
            topConcern={topConcern}
            signalCount={signalCount}
          />
        </motion.div>
      ) : (
        <motion.div key="5B"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Slide5B onBack={() => setSubSlide('5A')} signalCount={signalCount} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SlideSubscribe;
```

---

## SHARED COMPONENTS (used across Slides 4 & 5)

```tsx
// Reusable — include in the same file or a shared components/results/ file

function DiagnosisSummaryBanner({ pattern, topConcern, signalCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border p-4 mb-5"
      style={{
        borderColor: 'hsl(var(--primary)/0.3)',
        background: 'hsl(var(--primary)/0.06)',
      }}
    >
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.6875rem', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'hsl(var(--primary))', marginBottom: '0.5rem',
      }}>
        Your Diagnosis
      </p>
      <div className="flex gap-5 flex-wrap">
        {[
          { label: 'Pattern', value: pattern },
          { label: 'Top concern', value: topConcern },
          { label: 'Signals', value: String(signalCount) },
        ].map((item, i) => (
          <div key={i}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.125rem', fontWeight: 600,
              color: 'hsl(var(--foreground))', lineHeight: 1.1,
            }}>
              {item.value}
            </p>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: '0.6875rem',
              color: 'hsl(var(--foreground-hint))', marginTop: '0.1rem',
            }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TrustSignals() {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4"
      style={{
        fontFamily: "'DM Sans'", fontSize: '0.75rem',
        color: 'hsl(var(--foreground-hint))',
      }}>
      <span>🔬 Dermatologist reviewed</span>
      <span>🔄 Cancel or pause anytime</span>
      <span>📦 Ships EU 3–5 days</span>
    </div>
  );
}

function PillarCard({ pillar, index }) {
  const Icon = pillar.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.08 }}
      className="rounded-2xl border p-4"
      style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="rounded-xl p-1.5" style={{ background: `${pillar.accent}18` }}>
          <Icon size={16} style={{ color: pillar.accent }} />
        </div>
        <p style={{
          fontFamily: "'DM Sans'", fontSize: '0.875rem', fontWeight: 700,
          color: 'hsl(var(--foreground))',
        }}>
          {pillar.title}
        </p>
      </div>
      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.8125rem',
        color: 'hsl(var(--foreground-body))', lineHeight: 1.55,
      }}>
        {pillar.body}
      </p>
    </motion.div>
  );
}

function PlanCard({ plan, selected, onSelect }) {
  return (
    <motion.button layout onClick={onSelect}
      className="w-full rounded-2xl border p-4 text-left transition-all"
      style={{
        borderColor: selected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        background: selected ? 'hsl(var(--primary)/0.07)' : 'hsl(var(--card))',
        boxShadow: selected ? '0 0 0 2px hsl(var(--primary)/0.25)' : 'none',
        outline: 'none', cursor: 'pointer',
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p style={{
            fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '0.9375rem',
            color: 'hsl(var(--foreground))',
          }}>
            {plan.label}
          </p>
          {plan.badge && (
            <span className="rounded-full px-2.5 py-0.5 text-xs" style={{
              background: 'hsl(var(--primary)/0.15)',
              color: 'hsl(var(--primary))',
              fontFamily: "'DM Sans'", fontWeight: 700,
            }}>
              {plan.badge}
            </span>
          )}
        </div>
        <div className="text-right">
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.375rem', fontWeight: 600, color: 'hsl(var(--foreground))',
          }}>
            {plan.price}
          </span>
          {plan.priceNote && (
            <span style={{
              fontFamily: "'DM Sans'", fontSize: '0.75rem',
              color: 'hsl(var(--foreground-hint))', marginLeft: '0.25rem',
            }}>
              {plan.priceNote}
            </span>
          )}
          {/* Per-day reframe */}
          {plan.perDay && selected && (
            <p style={{
              fontFamily: "'DM Sans'", fontSize: '0.6875rem',
              color: 'hsl(var(--primary))', marginTop: '0.1rem',
            }}>
              {plan.perDay}/day
            </p>
          )}
        </div>
      </div>

      <p style={{
        fontFamily: "'DM Sans'", fontSize: '0.8125rem',
        color: 'hsl(var(--foreground-hint))',
        marginBottom: selected ? '0.75rem' : 0,
      }}>
        {plan.tagline}
      </p>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 mb-3">
              {plan.features.map((f, i) => (
                <p key={i} style={{
                  fontFamily: "'DM Sans'", fontSize: '0.8125rem',
                  color: 'hsl(var(--foreground-body))', lineHeight: 1.4,
                  display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
                }}>
                  <span style={{ color: 'hsl(var(--primary))', flexShrink: 0 }}>✓</span>
                  {f}
                </p>
              ))}
            </div>
            {plan.gated.length > 0 && (
              <div className="rounded-xl border p-2.5 space-y-1"
                style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted)/0.4)' }}>
                <p style={{
                  fontFamily: "'DM Sans'", fontSize: '0.6875rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'hsl(var(--foreground-hint))', marginBottom: '0.25rem',
                }}>
                  Unlocks in higher tier
                </p>
                {plan.gated.map((g, i) => (
                  <p key={i} style={{
                    fontFamily: "'DM Sans'", fontSize: '0.8125rem',
                    color: 'hsl(var(--foreground-hint))', opacity: 0.6,
                    display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
                  }}>
                    <span style={{ flexShrink: 0 }}>🔒</span>{g}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

---

## BEHAVIORAL SPECIFICATIONS

### Outer Results navigation
- Slides 1–4: swipe / arrow navigation active as before
- Slide 5A / 5B: outer arrows **disabled** — inner CTA / back link only
  - Slide 5A: inner CTA → 5B
  - Slide 5B: "← Why this matters" → 5A
  - Slide 5B can also forward-swipe to... nothing (no next slide)

### Animation sequencing per slide
Each slide must stagger its content on enter:
- Eyebrow: 0ms
- Headline: 50ms
- Sub-copy: 100ms
- Cards/blocks: 150ms, 230ms, 310ms
- CTA: 500ms

This staggering is what makes the experience feel **earned**, not dumped.

### whyResults data shape (for Slide 4)

```ts
interface WhyResult {
  productId:       string;
  brand:           string;
  productName:     string;
  productType:     string;
  price:           string;
  phase:           string;          // e.g. "Phase 2"
  matchedAxes:     { axis: string; score: number; isHighest: boolean }[];
  keyIngredients:  string[];
  because:         string[];        // 2–3 bullets
  helps:           string[];        // 1–2 bullets
  protocol:        string[];        // 1 bullet with phase + frequency
}
```

---

## FILE SUMMARY

| File | Action |
|---|---|
| `src/components/results/SlideDiagnosisSummary.tsx` | FULL REDESIGN |
| `src/components/results/SlideAxisBreakdown.tsx` | FULL REDESIGN |
| `src/components/results/SlideProtocol.tsx` | EXTEND (confidence badge + skip warnings) |
| `src/components/results/SlideWhyProducts.tsx` | FULL REDESIGN (MatchBar + SubscribePullBanner) |
| `src/components/results/SlideSubscribe.tsx` | FULL REPLACEMENT (5A+5B combined) |
| `src/components/results/ResultsShell.tsx` | UPDATE (narrative progress labels) |

---

## DO NOT CHANGE

- Design tokens: `Cormorant Garamond`, `DM Sans`, all `hsl(var(--*))` color system
- `useDiagnosis()` context schema
- RadarChartComponent (existing)
- FaceMap SVG
- Shopify handle mappings + NotifyModal
- Any non-Results pages or components
