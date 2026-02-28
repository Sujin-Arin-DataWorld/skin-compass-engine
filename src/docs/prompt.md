# ============================================================
#  LOVABLE PROMPT — SKIN STRATEGY LAB
#  Domain: skinstrategylab.de
#  Version: 1.0 | Shopify-ready | GDPR-compliant
# ============================================================

---

## 🎯 PROJECT OVERVIEW

Build a **clinical skin diagnosis web app** called **Skin Strategy Lab** at domain `skinstrategylab.de`.

The app guides users through a dermatology-grade skin assessment and delivers a personalized K-beauty skincare routine with tiered product bundles (€49 / €79–89 / Premium+Device).

**Design Language:** Dark luxury. Clinical precision. No fluff.
**Tone:** Scientific advisor, not beauty blogger.
**Primary Market:** German-speaking Europe (DE/AT/CH)

---

## 🏗️ TECH STACK & ARCHITECTURE

```
Framework:     React 18 + TypeScript
Styling:       Tailwind CSS (dark theme, custom design tokens)
Charts:        Recharts (animated radar chart)
State:         Zustand (global diagnosis state)
Routing:       React Router v6
Animations:    Framer Motion
Icons:         Lucide React
Fonts:         Inter (UI) + DM Serif Display (headings)
GDPR:          Cookie consent (custom component)
Shopify:       Buy Button JS SDK embed (future-ready mapping)
```

---

## 🎨 DESIGN TOKENS (Apply Globally)

```css
/* Core Palette */
--bg-primary:     #09090f;   /* deep space black */
--bg-secondary:   #111118;   /* card backgrounds */
--bg-elevated:    #1a1a26;   /* elevated surfaces */
--border-subtle:  #2a2a3a;   /* subtle borders */
--text-primary:   #f0f0f5;   /* main text */
--text-secondary: #8888aa;   /* muted text */
--text-muted:     #555570;   /* very muted */

/* Accent Colors */
--accent-cyan:    #00d4ff;   /* primary CTA, radar chart */
--accent-gold:    #d4a853;   /* premium tier, highlights */
--accent-rose:    #ff6b8a;   /* warnings, high severity */

/* Severity Colors */
--severity-clear:    #27ae60;
--severity-mild:     #f39c12;
--severity-moderate: #e67e22;
--severity-severe:   #e74c3c;

/* Urgency Colors */
--urgency-low:      #27ae60;
--urgency-medium:   #f39c12;
--urgency-high:     #e67e22;
--urgency-critical: #e74c3c;

/* Typography Scale */
--font-display:  'DM Serif Display', serif;
--font-body:     'Inter', sans-serif;
--text-xs:       0.75rem;
--text-sm:       0.875rem;
--text-base:     1rem;
--text-lg:       1.125rem;
--text-xl:       1.25rem;
--text-2xl:      1.5rem;
--text-3xl:      1.875rem;
--text-4xl:      2.25rem;
--text-hero:     3.5rem;

/* Spacing */
--space-screen:  max-width 960px, centered, padding 24px

/* Effects */
--glow-cyan:     0 0 20px rgba(0, 212, 255, 0.15);
--glow-gold:     0 0 20px rgba(212, 168, 83, 0.2);
```

---

## 📐 APP STRUCTURE & ROUTING

```
/                     → Landing Page
/diagnosis            → Diagnosis Flow (guided, multi-step)
/results              → Results & Recommendation Page
/about                → About (brand philosophy)
/impressum            → Impressum (GDPR - DE legal)
/datenschutz          → Datenschutzerklärung (GDPR - DE privacy)
```

---

## 📄 PAGE 1: LANDING PAGE (`/`)

### Layout

```
[NAVBAR]
  Left: Logo — "Skin Strategy Lab" (DM Serif Display, --accent-cyan glow)
  Right: "Start Diagnosis" CTA button (cyan outline)

[HERO SECTION]
  Headline (DM Serif, 3.5rem):
    "Your Skin.
     Clinically Decoded."

  Subheadline (Inter, 1.25rem, --text-secondary):
    "A dermatology-grade skin assessment.
     Personalized K-beauty protocols.
     Delivered to your door."

  CTA Button: "Begin Your Skin Assessment →"
    Style: filled, --accent-cyan background, dark text, subtle glow
    onClick: navigate to /diagnosis

  Below CTA (small text): "120 clinical markers · 8 patterns · 5-phase protocol"

[PROOF SECTION — 3 columns, no card grid, spaced typography]
  01  "Clinical Precision"
      "10-axis scoring system based on IGA, TEWL and MASI clinical scales"

  02  "Personalized Protocol"
      "Phase 1–5 routine matched to your unique skin vector, not a generic type"

  03  "Curated K-Beauty"
      "Dermatologist-validated Korean formulas selected for European skin needs"

[HOW IT WORKS — 4 Steps, horizontal on desktop / vertical on mobile]
  Step 1: Context Setup (30 sec)
  Step 2: Symptom Check (3–5 min)
  Step 3: Instant Analysis
  Step 4: Your Protocol

[FOOTER]
  Links: Impressum · Datenschutz · © 2025 Skin Strategy Lab
```

---

## 📄 PAGE 2: DIAGNOSIS FLOW (`/diagnosis`)

### CRITICAL UX RULE: Guided Mode — ONE DECISION PER SCREEN

Each step fills the full viewport. Progress indicator at top (thin cyan line).

---

### STEP 0 — Context Screen

```
Title (DM Serif, 2rem): "First, tell us about your skin context"
Subtitle: "Select all that apply — this personalises your assessment"

Options (large tap targets, multi-select toggles):
  [ ] I shave regularly
  [ ] I wear makeup daily
  [ ] I experience hormonal fluctuations
  [ ] I work outdoors frequently
  [ ] I'm new to skincare
  [ ] I've recently had a cosmetic procedure
  [ ] I don't drink much water

State key: contexts[]

CTA: "Continue →"
```

---

### STEP 1 — Skin Type Screen

```
Title: "What's your baseline skin type?"
Subtitle: "Choose the option that best describes your skin on an average day"

Options (single select, large tiles with icon):
  ○ Dry          — "Tight, flaky, craves moisture"
  ○ Oily          — "Shiny, enlarged pores, breakout-prone"
  ○ Combination   — "Oily T-zone, drier cheeks"
  ○ Sensitive     — "Easily irritated, reactive"
  ○ Normal        — "Generally balanced"

State key: skin_type

CTA: "Continue →"
```

---

### STEP 2 — Symptom Checklist (8 Categories)

**Each category = 1 full screen.** Progress: "Category 3 of 8"

Category header layout:
```
[Category Number]  [Category Emoji + Name]
                   [Clinical context note — 1 line, --text-secondary]
```

Symptom items: checkbox list, comfortable line height, no cramping.

**All 8 categories with their 15 symptoms:**

```
─────────────────────────────────────────────────────────────────
Category 1 — 🔴 Breakouts & Acne
Clinical note: "Indicators of sebum dysregulation and follicular inflammation"

□ C1_01  Recurring breakouts appear regularly
□ C1_02  Breakouts concentrate on jaw, cheeks, or forehead
□ C1_03  Skin worsens before menstruation or hormonal shifts
□ C1_04  Breakouts appear where masks, helmets, or glasses sit
□ C1_05  Breakouts flare after exercise or sweating
□ C1_06  New skincare products trigger breakouts in specific areas
□ C1_07  Hard, deep nodules form under the skin
□ C1_08  Pus-filled inflammatory lesions appear frequently
□ C1_09  Small bumps form in non-inflamed areas
□ C1_10  Red marks remain for months after breakouts clear
□ C1_11  Sebum refills immediately after extraction
□ C1_12  Sebum production feels suddenly increased
□ C1_13  Stress immediately triggers skin reactions
□ C1_14  Sun exposure makes skin reactive and prone to breakouts
□ C1_15  Body acne (back or chest) appears alongside facial acne

─────────────────────────────────────────────────────────────────
Category 2 — 🟡 Oiliness & Makeup Wear
Clinical note: "Sebum overproduction and its effect on cosmetic stability"

□ C2_01  Face becomes shiny by mid-afternoon
□ C2_02  T-zone (forehead and nose) is noticeably oilier
□ C2_03  Sebum reappears within 2 hours of cleansing
□ C2_04  Makeup breaks down within 3–4 hours
□ C2_05  Foundation sinks into pores or lifts off skin
□ C2_06  Cushion and base products slide or pill
□ C2_07  Surface looks oily but underneath feels dry
□ C2_08  Excess sebum makes skin tone look dull
□ C2_09  Blotting powder doesn't prevent shine returning
□ C2_10  Makeup oxidises and darkens over time
□ C2_11  Nose and cheek area breaks down first
□ C2_12  Blurring and primer products don't last
□ C2_13  Oiliness is significantly worse in summer
□ C2_14  There's a stark difference between T-zone and cheek oiliness
□ C2_15  Under-eye concealer creases or migrates by evening

─────────────────────────────────────────────────────────────────
Category 3 — 🔵 Dryness & Dehydration
Clinical note: "Transepidermal water loss and NMF depletion patterns"

□ C3_01  Skin feels tight immediately after cleansing
□ C3_02  Moisturiser only lasts 1–2 hours before skin feels dry again
□ C3_03  Flaky skin is visibly lifting from the surface
□ C3_04  Makeup flakes or cracks on skin throughout the day
□ C3_05  Skin looks dull and lacklustre overall
□ C3_06  Fine lines become more pronounced when skin is dry
□ C3_07  Eye and lip contour areas feel especially dry
□ C3_08  Lip contour frequently cracks
□ C3_09  Dryness worsens significantly in winter, AC or heated rooms
□ C3_10  Sheet masks provide only temporary relief
□ C3_11  Skin feels stiff and constricted first thing in the morning
□ C3_12  Multiple layers of moisture products are needed to feel comfortable
□ C3_13  Skin loses moisture rapidly after application
□ C3_14  Skin looks thin and superficial capillaries are visible
□ C3_15  Skin noticeably tightens in dry environments (flights, etc.)

─────────────────────────────────────────────────────────────────
Category 4 — 🟠 Sensitivity & Redness
Clinical note: "Neurogenic inflammation, vascular hyperreactivity, and impaired tolerance"

□ C4_01  Skin flushes easily
□ C4_02  Face becomes red after cleansing
□ C4_03  Skin stings or burns
□ C4_04  Exfoliation causes prolonged irritation
□ C4_05  Acid-based actives (AHA/BHA/Vitamin C) cause stinging
□ C4_06  Retinol causes significant peeling or irritation
□ C4_07  Skin reacts to temperature changes
□ C4_08  Cold weather immediately causes redness
□ C4_09  Flushing after heat or exercise persists for over 30 minutes
□ C4_10  Stress visibly reddens the skin
□ C4_11  Trying a new product feels risky
□ C4_12  Fragrance and alcohol-based products cause reactions
□ C4_13  Skin itches frequently
□ C4_14  Redness and dryness appear simultaneously
□ C4_15  Visible red capillaries appear on cheeks or nose

─────────────────────────────────────────────────────────────────
Category 5 — 🟤 Pigmentation & Skintone
Clinical note: "Melanocyte hyperactivation, oxidative stress, and photodamage patterns"

□ C5_01  Spots and blemishes are gradually darkening
□ C5_02  Melasma (hormonally driven pigmentation) is present
□ C5_03  Post-acne dark marks (PIH) persist for months
□ C5_04  Skin tone is uneven
□ C5_05  Complexion looks dull and lacks radiance
□ C5_06  Colour deepens quickly after sun exposure
□ C5_07  The area beside the nose or around the mouth appears darker
□ C5_08  Dark circles have a brownish tone (melanin-type)
□ C5_09  Skin has an oxidised or grey cast
□ C5_10  Skin looks flat and lifeless even with makeup
□ C5_11  Neck and face are noticeably different in tone
□ C5_12  Central face zone (nose, cheeks) appears flushed or darker
□ C5_13  Spots and pigmentation are visibly increasing over time
□ C5_14  Pigmentation worsened during pregnancy or with hormonal medication
□ C5_15  Skin tans faster and more intensely than others in the same conditions

─────────────────────────────────────────────────────────────────
Category 6 — ⚪ Pores & Texture
Clinical note: "Follicular dilation, keratinisation disorder, and surface irregularity"

□ C6_01  Pores appear enlarged overall
□ C6_02  Nose pores are particularly enlarged and visible
□ C6_03  Cheek pores appear stretched vertically (sagging pores)
□ C6_04  Pores look dark or blocked with oxidised sebum
□ C6_05  Cream and foundation seem to "disappear" into pores
□ C6_06  Skin surface feels rough
□ C6_07  Skin surface is bumpy and uneven
□ C6_08  Unevenness is visible from the side profile
□ C6_09  Skin feels like there is a build-up of dead cells
□ C6_10  Skin texture shows clearly in photos
□ C6_11  Skin doesn't look clean even after cleansing
□ C6_12  Solidified sebum feels lodged inside pores
□ C6_13  Lighting accentuates skin texture and unevenness
□ C6_14  Pores become more visible after applying foundation
□ C6_15  Skin was once smoother — texture has noticeably worsened

─────────────────────────────────────────────────────────────────
Category 7 — 🔷 Wrinkles & Firmness
Clinical note: "Collagen loss, ECM degradation, and gravitational tissue changes"

□ C7_01  Fine lines around the eyes have increased
□ C7_02  Expression lines are deep when smiling
□ C7_03  Nasolabial folds and lip lines are deepening
□ C7_04  Neck lines are forming
□ C7_05  Jawline definition is softening
□ C7_06  Skin firmness is noticeably reduced
□ C7_07  Skin sags easily and lacks structural support
□ C7_08  Skin is thinning alongside loss of elasticity
□ C7_09  Pore size seems to be increasing as skin loses firmness
□ C7_10  Makeup settles into wrinkles throughout the day
□ C7_11  Skin is measurably less plump than before
□ C7_12  Facial contours look lower when viewed from the side
□ C7_13  Face puffs in the morning and sags by evening
□ C7_14  A second chin appears when looking downward
□ C7_15  Forehead lines have become deeper

─────────────────────────────────────────────────────────────────
Category 8 — ⚠️ Barrier & Recovery
Clinical note: "Stratum corneum integrity, recovery capacity, and sensitisation state"

□ C8_01  All products suddenly feel irritating
□ C8_02  Skin has become generally more reactive recently
□ C8_03  Redness, dryness and breakouts appear at the same time
□ C8_04  Changing products caused a significant skin reaction
□ C8_05  Skin remains unstable and doesn't settle
□ C8_06  Skin takes a long time to recover after exfoliation
□ C8_07  Skin became reactive after a laser or peel treatment
□ C8_08  Skin barrier feels weakened
□ C8_09  Very minor stimuli trigger a reaction
□ C8_10  Skin cannot retain moisture
□ C8_11  Skin heats up quickly and easily
□ C8_12  Physical exfoliation or massage has been performed frequently
□ C8_13  4 or more moisturising steps are needed to feel comfortable
□ C8_14  Products absorb poorly
□ C8_15  Skin feels tight or dry within 30 seconds of cleansing
```

CTA per category: "Next Category →" | Final category: "Analyse My Skin →"

---

### STEP 3 — Loading / Analysis Screen

```
Full screen, dark background.

Animated sequence (2–3 seconds total):
  [0.0s] "Mapping your symptom profile..." (fade in)
  [0.8s] "Scoring 10 clinical axes..." (crossfade)
  [1.6s] "Detecting high-risk patterns..." (crossfade)
  [2.4s] "Building your protocol..." (crossfade)

Visual: Animated radar chart silhouette loading in (skeleton → real data)
Then navigate to /results
```

---

## 📄 PAGE 3: RESULTS PAGE (`/results`)

### Layout Structure (top to bottom, single column, max-width 960px)

---

#### SECTION A — Pattern Banner

```
[Full-width banner, no card]

If urgency = CRITICAL:
  Banner color: dark red tint (#1a0505)
  Icon: ⚠️
  Text: "Critical Pattern Detected — [Pattern Name EN]"
  Subtext: Clinical explanation (1–2 sentences)

If urgency = HIGH:
  Banner color: dark amber tint (#1a1005)

If no patterns:
  Banner: "No critical risk patterns detected. Proceed with your protocol."
  Color: dark green tint
```

---

#### SECTION B — Pattern Name & Clinical Summary

```
[No card. Pure typography.]

Eyebrow text (small caps, --accent-cyan):
  "YOUR SKIN PATTERN"

Headline (DM Serif, 2.5rem, white):
  [Primary pattern name in English]
  e.g. "Dehydrated Oily Skin Pattern"

Body text (Inter, 1rem, --text-secondary, max 3 sentences):
  [clinical_explanation_en from detected pattern, or generic summary if no pattern]

If multiple patterns detected:
  Show primary pattern in headline.
  Below: "Additional patterns identified:" → list as small tags
```

---

#### SECTION C — Radar Chart

```
[Animated radar chart — Recharts RadarChart]

Configuration:
  - 6 axes only: Sebum · Hydration · Barrier · Sensitivity · Acne · Aging
  - Dark background (#111118)
  - Chart stroke: --accent-cyan
  - Fill: rgba(0, 212, 255, 0.15)
  - Reference rings at 20, 45, 70 (dashed, gray)
  - Animate on mount: enter from center, expand outward (500ms ease-out)
  - Each axis label shows value in small text (e.g. "Sebum 78")
  - Axis labels colored by severity:
    ≤20 → --severity-clear
    ≤45 → --severity-mild
    ≤70 → --severity-moderate
    >70  → --severity-severe

Component structure:
  <RadarChart width={500} height={400} data={radarData}>
    <PolarGrid stroke="#2a2a3a" />
    <PolarAngleAxis dataKey="axis" tick={{ fill: 'white', fontSize: 12 }} />
    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#555570' }} />
    <Radar dataKey="score" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15}
           animationBegin={0} animationDuration={500} animationEasing="ease-out" />
  </RadarChart>
```

---

#### SECTION D — Phase-Based Protocol Explanation

```
[No card grid. Vertical accordion or clean stacked list.]

Section heading: "Your 5-Phase Protocol"
Subheading: "Applied in this exact order, morning and evening."

For each active phase (1–5 + Device if applicable):

  [Phase indicator line — horizontal rule with phase label]
  Phase 1 — Cleanse
  Phase 2 — Prep & Barrier
  Phase 3 — Target [Primary concern]
  Phase 4 — Seal
  Phase 5 — Protect (Always)
  Device (conditional: aging score ≥ 46 only)

  Under each phase label:
    Why this phase matters for YOUR skin — 1 sentence, clinical tone
    e.g. Phase 2: "Your barrier score of 78 indicates active ceramide depletion.
                   Layering humectants before occlusive agents is essential."
```

---

#### SECTION E — Strategy Box (Pricing Tiers)

```
[3-column layout on desktop, stacked on mobile]
[Clean borders, no heavy cards]

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ENTRY          │  │   FULL           │  │   PREMIUM        │
│   Routine        │  │   Protocol       │  │   Strategy       │
│                  │  │                  │  │                  │
│   €49            │  │   €79–89         │  │   €149+          │
│                  │  │                  │  │                  │
│  • Cleanser      │  │  + Full serum    │  │  + Device        │
│  • Hydration     │  │  + Barrier boost │  │  + Premium serums│
│  • Suncare       │  │  + Target serum  │  │  + Priority ship │
│                  │  │                  │  │                  │
│  [Select Entry]  │  │  [Select Full] ★ │  │  [Select Premium]│
└─────────────────┘  └─────────────────┘  └─────────────────┘

- FULL is pre-selected and marked as "Recommended"
- Selecting a tier updates the product list below in real-time
- Prices are estimates; "Calculated at checkout"
```

---

#### SECTION F — Product List (Dynamic, by selected tier)

```
[Clean vertical list — NOT a card grid]

For each recommended product (grouped by phase):

  [Phase label — small, --accent-cyan]
  Phase 1 — Cleanse

  [Product row]
    Left:  Brand tag (small, --text-secondary) | Product name (white, medium weight)
    Right: "€XX" | [Add to Cart] button (outline, small)

  Key ingredients (1 line, --text-muted, small)
  Why it's in your protocol (1 sentence — match to active axes)

[Add to Cart] button behavior:
  - Currently: opens Shopify Buy Button embed in modal (Shopify Buy Button JS)
  - Shopify product handle is mapped: product.shopify_handle
  - If Shopify not connected: show "Notify when available" email capture

[Total estimate line at bottom of list]:
  "Estimated total: €XX — Final price confirmed at checkout"
```

---

#### SECTION G — Active Flags & Clinical Alerts

```
[Only shown if active_flags array is not empty]
[Minimal — text only, no heavy UI]

"Clinical Notes for Your Skin:"

For each flag:

  BARRIER_EMERGENCY:
    "⚠️ Barrier Emergency Protocol Active
     Pause all active ingredients (acids, retinol) for a minimum of 2 weeks.
     Focus exclusively on Phases 1, 2B, and 4 until skin stabilises."

  ACTIVE_INGREDIENT_PAUSE:
    "⚠️ Exfoliation Pause Required
     Your barrier shows signs of over-processing.
     Remove all exfoliants from your routine for 4 weeks."

  HORMONAL_ACNE_PROTOCOL:
    "ℹ️ Hormonal Pattern Detected
     Track your skin cycle alongside your menstrual cycle.
     Niacinamide 10%+ is most effective during the luteal phase."

  DERMATOLOGIST_REFERRAL:
    "⚕️ Professional Consultation Advised
     Your acne severity (IGA Grade 3+) may benefit from medical treatment.
     This protocol addresses topical management only."

  ANTIOXIDANT_PRIORITY:
    "☀️ Photoprotection is Non-Negotiable
     Your oxidative pattern requires SPF50+ every day, including winter.
     Vitamin C must be applied before sunscreen."

  DEVICE_RECOMMENDED:
    "💡 EMS/LED Device Can Accelerate Results
     Your aging score indicates collagen matrix activity.
     A microcurrent or LED device, used 3× weekly, significantly
     amplifies the effectiveness of your Phase 3 serums."
```

---

#### SECTION H — Restart CTA

```
[Bottom of page]

"Skin changes. Reassess in 6–8 weeks."
Link: "Restart Assessment" → /diagnosis
```

---

## 📄 PAGE 4: IMPRESSUM (`/impressum`)

```
[Static page, legal placeholder]

Title: "Impressum"

Content block:
  Angaben gemäß § 5 TMG

  [Name / Unternehmensname]: [PLACEHOLDER]
  [Adresse]: [PLACEHOLDER]
  [Kontakt]: [PLACEHOLDER]
  [E-Mail]: [PLACEHOLDER]

  Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
  [PLACEHOLDER]

  Haftungsausschluss / Disclaimer:
  Die Inhalte dieser Website dienen ausschließlich zu Informationszwecken
  und ersetzen keine ärztliche Beratung oder Diagnose.
```

---

## 📄 PAGE 5: DATENSCHUTZ (`/datenschutz`)

```
[Static page, GDPR placeholder]

Title: "Datenschutzerklärung"

Sections:
  1. Verantwortlicher [PLACEHOLDER]
  2. Erhebung und Speicherung personenbezogener Daten
     — Hinweis: Diese Website setzt keine Tracking-Cookies ohne Einwilligung ein.
  3. Cookies
     — Notwendige Cookies: [Liste]
     — Analyse-Cookies: Nur nach Einwilligung
  4. Ihre Rechte (DSGVO Art. 15–22)
  5. Kontakt Datenschutzbeauftragter [PLACEHOLDER]
```

---

## 🍪 COOKIE CONSENT SYSTEM

```
[Appears on first visit, bottom of screen]

Component: <CookieConsentBanner />

Design:
  - Dark bar at bottom of viewport
  - Background: #111118, border-top: 1px solid #2a2a3a
  - Text (--text-secondary): "We use necessary cookies for site functionality.
    With your consent, we also use analytics cookies."
  - Two buttons:
    [Accept All]     → filled, --accent-cyan
    [Necessary Only] → outline, --text-secondary
  - Link: "Mehr erfahren" → /datenschutz

Behavior:
  - Stores consent in localStorage: { analytics: bool, timestamp: ISO }
  - Does NOT set analytics cookies until explicit "Accept All"
  - Banner hidden after choice, with option to revoke in footer
```

---

## 🔗 SHOPIFY INTEGRATION (FUTURE-READY)

```javascript
// Shopify Buy Button SDK Integration
// Load in index.html:
// <script src="https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js"></script>

// Product handle mapping (from Score Engine v3)
const SHOPIFY_HANDLES = {
  "biplain_cleanser":     "biplain-greenbean-foam-cleanser",
  "drg_cleanser_oily":   "drg-ph-balancing-cleanser",
  "torriden_serum":      "torriden-dive-in-low-molecular-hyaluronic-acid-serum",
  "snature_toner":       "snature-aqua-oasis-toner",
  "aestura_cream":       "aestura-atobarrier365-cream",
  "snature_squalane":    "snature-aqua-squalane-serum",
  "manyo_bifida":        "manyo-bifida-biome-complex-ampoule",
  "bioheal_probioderm":  "bioheal-boh-probioderm-collagen-remodeling-serum",
  "cosrx_bha":           "cosrx-bha-blackhead-power-liquid",
  "bringgreen_teatree":  "bring-green-teatree-cica-soothing-toner",
  "missha_vitac":        "missha-vita-c-plus-spot-correcting-and-firming-ampoule",
  "cellfusionc_toning":  "cell-fusion-c-toning-c-dark-spot-serum",
  "iope_retinol":        "iope-retinol-super-bounce-serum",
  "bioheal_collagen":    "bioheal-boh-probioderm-collagen-remodeling-intensive-serum",
  "drg_soothing_cream":  "drg-red-blemish-clear-soothing-cream",
  "snature_moistcream":  "snature-aqua-squalane-moisture-cream",
  "cellfusionc_sun":     "cell-fusion-c-laser-sunscreen-100-spf50",
  "drg_sunscreen":       "drg-green-mild-up-sun-plus-spf50",
  "medicube_booster":    "medicube-age-r-booster-pro-ems-device",
  "mamicare_device":     "mamicare-homecare-led-device"
}

// Buy Button embed (per product):
function embedBuyButton(shopifyHandle: string, containerId: string) {
  const client = ShopifyBuy.buildClient({
    domain: 'skinstrategylab.myshopify.com',  // connect your store
    storefrontAccessToken: 'YOUR_TOKEN_HERE'
  });
  ShopifyBuy.UI.onReady(client).then((ui) => {
    ui.createComponent('product', {
      handle: shopifyHandle,
      node: document.getElementById(containerId),
      options: {
        product: {
          buttonDestination: 'cart',
          layout: 'vertical',
          contents: { img: false, title: false, price: true }
        }
      }
    });
  });
}
```

---

## 🧠 DIAGNOSIS ENGINE (EMBED AS TYPESCRIPT MODULE)

Translate the Python `score_engine_v3.py` logic into a TypeScript module:

```typescript
// src/engine/scoreEngine.ts

export const AXES = ['seb','hyd','bar','sen','ox','acne','pigment','texture','aging','makeup_stability'];

export interface SymptomWeight { [axis: string]: number }
export interface Symptom { id: string; text: string; weights: SymptomWeight }

export const SYMPTOMS: { [id: string]: Symptom } = {
  // Paste all 120 symptoms with exact weights from score_engine_v3.py
  // Example:
  "C1_01": { id: "C1_01", text: "Recurring breakouts appear regularly",
              weights: { acne: 0.9, seb: 0.5 } },
  "C1_07": { id: "C1_07", text: "Hard, deep nodules form under the skin",
              weights: { acne: 0.9, sen: 0.2 } },
  "C8_03": { id: "C8_03", text: "Redness, dryness and breakouts appear simultaneously",
              weights: { bar: 0.9, sen: 0.6, hyd: 0.5, acne: 0.4 } },
  "C8_15": { id: "C8_15", text: "Skin feels tight within 30 seconds of cleansing",
              weights: { bar: 1.0, hyd: 0.7 } },
  // ... all 120 entries
}

// High-risk pattern detection (8 patterns from engine)
export interface RiskPattern {
  id: string; name: string; name_en: string;
  required: string[]; optional: string[]; min_optional: number;
  axis_boosts: { [axis: string]: number };
  clinical_en: string; flag: string; urgency: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
}

export const HIGH_RISK_PATTERNS: RiskPattern[] = [
  { id: "PATTERN_BARRIER_TRIAD", name_en: "Compromised Barrier Triad",
    required: ["C8_03","C8_01"], optional: ["C4_14","C3_02","C8_08","C8_15"],
    min_optional: 2, axis_boosts: { bar: 1.5, sen: 1.3, hyd: 1.2 },
    clinical_en: "Simultaneous redness, dryness and breakouts signal Sensitized Skin Syndrome.",
    flag: "BARRIER_EMERGENCY", urgency: "CRITICAL" },
  // ... all 8 patterns
]

export function runDiagnosis(
  symptoms: string[], contexts: string[], skinType: string
): DiagnosisResult { ... }  // implement full pipeline
```

---

## 📱 RESPONSIVE RULES

```
Mobile (<768px):
  - Category screens: full-screen scroll
  - Radar chart: 300×300
  - Strategy box: stacked vertically, Full pre-selected
  - Product list: single column
  - Tier selector: horizontal swipe

Tablet (768–1024px):
  - 2-column product list
  - Side-by-side radar + bar chart

Desktop (>1024px):
  - Max-width 960px, centered
  - 3-column strategy box
  - Radar chart 480×480
```

---

## ✅ DELIVERABLES CHECKLIST

- [ ] Landing page with hero + proof + steps
- [ ] Guided multi-step diagnosis flow (Step 0–3)
- [ ] 120-symptom checklist (all 8 categories, EN text)
- [ ] Loading animation screen
- [ ] Results page: pattern banner + clinical summary
- [ ] Animated radar chart (6 axes, Recharts)
- [ ] Phase protocol section (1–5 + Device)
- [ ] Strategy box (3 tiers, dynamic)
- [ ] Dynamic product list (Shopify handle mapping)
- [ ] Active flags / clinical alerts section
- [ ] TypeScript engine module (translate from Python)
- [ ] Cookie consent banner (GDPR-compliant)
- [ ] Impressum page (placeholder)
- [ ] Datenschutz page (placeholder)
- [ ] Shopify Buy Button integration hooks
- [ ] Mobile responsive
- [ ] Dark luxury aesthetic throughout
- [ ] Domain: skinstrategylab.de (configure in deployment)

---

## ⚠️ CRITICAL CONSTRAINTS

1. **NO card grid overload** — use typography hierarchy and whitespace
2. **ONE decision per screen** in diagnosis flow
3. **Radar chart MUST animate** on results page load
4. **Device section ONLY shows** if aging axis score ≥ 46
5. **Phase 5 (Suncare) ALWAYS included** in every bundle
6. **GDPR**: No analytics cookies without explicit consent
7. **Clinical tone throughout** — no "glowy skin queen" language
8. **Shopify handles must be wired** even if store is not yet live (show "coming soon" state gracefully)
9. **skinstrategylab.de** must appear in footer, meta tags, and og:url
10. **All symptom IDs (C1_01 through C8_15) must be preserved** in engine for backend continuity

---

*End of Lovable Prompt — Skin Strategy Lab v1.0*
*Score Engine v3 | 120 Symptoms | 10 Axes | 8 Risk Patterns | Phase 1–5 + Device*
