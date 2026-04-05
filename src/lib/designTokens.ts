// ═══════════════════════════════════════════════════════════════════════════════
// designTokens.ts — Skin Strategy Lab Design System
// Palette: "Apple + Forest" (E)
// Light: Sage green on warm white  |  Dark: Pure Apple black + forest CTA
// ═══════════════════════════════════════════════════════════════════════════════

// ── BRAND COLORS ─────────────────────────────────────────────────────────────

export const brand = {
  light: {
    // Backgrounds
    bg: "#FAFAF8",          // page background — warm white
    bgCard: "rgba(255,255,255,0.72)",  // card glass
    bgSurface: "#F3F3EF",          // secondary surface (sections, modals)
    bgElevated: "#FFFFFF",          // elevated cards, popovers

    // Accent — sage green
    accent: "#5E8B68",          // primary accent (text, icons, active states)
    accentDeep: "#3D6B4A",          // CTA gradient end, hover states
    accentMuted: "#7A9E82",          // lighter sage — badges, subtle highlights
    accentBg: "rgba(94,139,104,0.06)",   // accent tinted backgrounds
    accentBorder: "rgba(94,139,104,0.15)",   // accent borders

    // Secondary — teal (professional / spa feel)
    secondary: "#5A8A8D",
    secondaryMuted: "#7AADAF",
    secondaryBg: "rgba(122,173,175,0.08)",

    // Text
    text: "#1B2838",          // primary text — near-black with blue tint
    textSecondary: "#6B7280",          // secondary / muted
    textTertiary: "#9CA3AF",          // hints, placeholders

    // Borders
    border: "rgba(0,0,0,0.08)",
    borderHover: "rgba(94,139,104,0.25)",
  },

  dark: {
    // Backgrounds — Apple pure black system
    bg: "#0A0A0A",          // page background — true Apple black
    bgCard: "rgba(28,28,30,0.65)",     // card glass
    bgSurface: "#1C1C1E",          // secondary surface (Apple systemGray6)
    bgElevated: "#2C2C2E",          // elevated cards (Apple systemGray5)

    // Accent — forest green (color lives ONLY in CTAs + active states)
    accent: "#4A9E68",          // primary accent — forest green, vibrant
    accentDeep: "#2D6B4A",          // CTA gradient start, deep forest
    accentMuted: "#3D8B5A",          // medium forest — hover states
    accentBg: "rgba(45,107,74,0.08)",
    accentBorder: "rgba(45,107,74,0.20)",

    // Secondary — teal (carried from light mode for consistency)
    secondary: "#87B6BC",
    secondaryMuted: "#6A9DA3",
    secondaryBg: "rgba(135,182,188,0.06)",

    // Text — Apple grayscale system
    text: "#F5F5F7",          // primary text — Apple white
    textSecondary: "#86868B",          // secondary (Apple systemGray)
    textTertiary: "#48484A",          // hints (Apple systemGray2)

    // Borders
    border: "rgba(255,255,255,0.06)",
    borderHover: "rgba(255,255,255,0.12)",
  },
} as const;


// ── GLASSMORPHISM ────────────────────────────────────────────────────────────
// Layered glass effects: nav > card > button (blur decreases, transparency increases)

export const glass = {
  // Navigation bars (top + bottom) — heaviest blur
  nav: {
    light: {
      background: "rgba(250,250,248,0.75)",
      backdropFilter: "blur(24px) saturate(1.4)",
      WebkitBackdropFilter: "blur(24px) saturate(1.4)",
      borderColor: "rgba(0,0,0,0.06)",
    },
    dark: {
      background: "rgba(10,10,10,0.78)",
      backdropFilter: "blur(24px) saturate(1.3)",
      WebkitBackdropFilter: "blur(24px) saturate(1.3)",
      borderColor: "rgba(255,255,255,0.04)",
    },
  },

  // Content cards — medium blur
  card: {
    light: {
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(20px) saturate(1.2)",
      WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      border: "1px solid rgba(94,139,104,0.08)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02)",
    },
    dark: {
      background: "rgba(28,28,30,0.55)",
      backdropFilter: "blur(20px) saturate(1.2)",
      WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)",
    },
  },

  // Ghost/secondary buttons — light blur
  button: {
    light: {
      background: "rgba(94,139,104,0.04)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(94,139,104,0.12)",
    },
    dark: {
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.06)",
    },
  },

  // Bottom sheet / modal overlay
  sheet: {
    light: {
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(32px) saturate(1.5)",
      WebkitBackdropFilter: "blur(32px) saturate(1.5)",
    },
    dark: {
      background: "rgba(20,20,22,0.92)",
      backdropFilter: "blur(32px) saturate(1.3)",
      WebkitBackdropFilter: "blur(32px) saturate(1.3)",
    },
  },
} as const;


// ── CTA BUTTONS ──────────────────────────────────────────────────────────────
// Primary call-to-action — the only place color "pops"

export const cta = {
  light: {
    background: "linear-gradient(135deg, #6B9E76, #3D6B4A)",
    color: "#FFFFFF",
    boxShadow: "0 4px 20px rgba(61,107,74,0.20)",
    // Hover: glow ring + lift
    hoverBoxShadow: "0 0 0 4px rgba(94,139,104,0.12), 0 8px 32px rgba(61,107,74,0.28)",
    hoverTransform: "translateY(-1px)",
    // Press: sink + dim shadow
    activeBoxShadow: "0 2px 8px rgba(61,107,74,0.15)",
    activeTransform: "translateY(0px) scale(0.98)",
  },
  dark: {
    background: "#2D6B4A",           // solid forest green — Apple style
    color: "#F5F5F7",
    boxShadow: "0 4px 20px rgba(45,107,74,0.20)",
    // Hover: subtle glow
    hoverBoxShadow: "0 0 0 4px rgba(45,107,74,0.15), 0 8px 32px rgba(45,107,74,0.25)",
    hoverTransform: "translateY(-1px)",
    // Press
    activeBoxShadow: "0 2px 8px rgba(45,107,74,0.12)",
    activeTransform: "translateY(0px) scale(0.98)",
  },
} as const;


// ── BUTTON VARIANTS ──────────────────────────────────────────────────────────

export const button = {
  // Ghost / secondary button (Add to cart, secondary actions)
  ghost: {
    light: {
      background: "rgba(94,139,104,0.04)",
      border: "1px solid rgba(94,139,104,0.12)",
      color: "#3D6B4A",
      backdropFilter: "blur(12px)",
      // Hover
      hoverBackground: "rgba(94,139,104,0.10)",
      hoverBorder: "1px solid rgba(94,139,104,0.25)",
      hoverBoxShadow: "0 2px 12px rgba(94,139,104,0.08)",
      // Press
      activeBackground: "rgba(94,139,104,0.15)",
      activeTransform: "scale(0.98)",
    },
    dark: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      color: "#86868B",
      backdropFilter: "blur(12px)",
      // Hover — border lights up, text goes white
      hoverBackground: "rgba(255,255,255,0.06)",
      hoverBorder: "1px solid rgba(255,255,255,0.12)",
      hoverColor: "#F5F5F7",
      hoverBoxShadow: "0 2px 12px rgba(255,255,255,0.03)",
      // Press
      activeBackground: "rgba(255,255,255,0.08)",
      activeTransform: "scale(0.98)",
    },
  },

  // Accent ghost (for concern chips, active filter states)
  accentGhost: {
    light: {
      background: "rgba(94,139,104,0.06)",
      border: "1px solid rgba(94,139,104,0.20)",
      color: "#3D6B4A",
    },
    dark: {
      background: "rgba(45,107,74,0.08)",
      border: "1px solid rgba(45,107,74,0.25)",
      color: "#4A9E68",
    },
  },

  // Icon button (navbar icons, close buttons)
  icon: {
    light: {
      color: "#6B7280",
      hoverBackground: "rgba(0,0,0,0.04)",
      activeBackground: "rgba(0,0,0,0.08)",
    },
    dark: {
      color: "#86868B",
      hoverBackground: "rgba(255,255,255,0.06)",
      activeBackground: "rgba(255,255,255,0.10)",
    },
  },
} as const;


// ── PRODUCT CARDS ────────────────────────────────────────────────────────────

export const productCard = {
  light: {
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    // Hover — lift + border accent
    hoverBorder: "1px solid rgba(94,139,104,0.15)",
    hoverBoxShadow: "0 8px 32px rgba(0,0,0,0.06)",
    hoverTransform: "translateY(-2px)",
  },
  dark: {
    background: "rgba(28,28,30,0.5)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    boxShadow: "none",
    // Hover — subtle glow
    hoverBorder: "1px solid rgba(255,255,255,0.10)",
    hoverBoxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    hoverTransform: "translateY(-2px)",
  },
} as const;


// ── BOTTOM SHEET ─────────────────────────────────────────────────────────────

export const bottomSheet = {
  light: {
    background: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    boxShadow: "0 -20px 60px rgba(0,0,0,0.08)",
    handleColor: "rgba(0,0,0,0.15)",
  },
  dark: {
    background: "#1C1C1E",
    borderRadius: "28px 28px 0 0",
    boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
    handleColor: "rgba(255,255,255,0.15)",
  },
} as const;


// ── FACE MAP (FaceMapStep-specific) ──────────────────────────────────────────

export const faceMap = {
  light: {
    imageBg: "#ed8748",       // warm copper behind face photo
    labelColor: "rgba(124,53,17,0.95)",
    labelActiveColor: "#2f1b0b",
    overlayStroke: "rgba(124,53,17,0.6)",
  },
  dark: {
    imageBg: "#1A1816",       // warm charcoal behind face photo
    labelColor: "rgba(212,200,160,0.85)",  // warm cream — readable
    labelActiveColor: "#D4B896",       // soft gold
    overlayStroke: "rgba(212,184,150,0.6)",
  },
} as const;


// ── TYPOGRAPHY ───────────────────────────────────────────────────────────────

export const typography = {
  fontDisplay: "var(--font-display)",  // headings
  fontSans: "var(--font-sans)",     // body, UI
  fontMono: "var(--font-mono)",     // code, data
} as const;


// ── RESPONSIVE BREAKPOINTS ───────────────────────────────────────────────────
// Use with useMediaQuery hook or CSS media queries

export const breakpoints = {
  xs: "440px",   // wide mobile (iPhone 16 Pro Max, Z Fold cover)
  sm: "640px",   // landscape phones
  md: "768px",   // tablets (this is the mobile/desktop split)
  lg: "1024px",  // small laptops
  xl: "1280px",  // desktops
  xxl: "1536px",  // large screens
} as const;


// ── RESPONSIVE SPACING ──────────────────────────────────────────────────────
// Use these with isMobile flag or CSS clamp()

export const spacing = {
  // Section padding — fluid for luxury breathing on OLED screens
  sectionPx: { mobile: "20px", desktop: "40px", clamp: "clamp(20px, 6vw, 40px)" },
  sectionPy: { mobile: "48px", desktop: "80px", clamp: "clamp(48px, 8vh, 80px)" },

  // Card padding
  cardPx: { mobile: "16px", desktop: "24px", clamp: "clamp(16px, 4vw, 24px)" },
  cardPy: { mobile: "16px", desktop: "20px", clamp: "clamp(16px, 2.5vw, 20px)" },

  // Component gaps — fluid
  gap: { mobile: "12px", desktop: "20px", clamp: "clamp(12px, 3vw, 20px)" },

  // Touch targets — 48px for high-DPR flagships (iPhone 16, Galaxy S26)
  touchMin: "48px",

  // Content max-width containment (Z Fold 6 inner display = 690px)
  // Always pair with margin-inline: auto for centering
  contentMaxWidth: {
    narrow: "480px",   // questionnaire steppers, login forms, single-column
    medium: "640px",   // product card grids (2-col on Z Fold), article content
    wide: "960px",   // full page containers, dashboard layouts
  },
} as const;


// ── ANIMATION TOKENS ─────────────────────────────────────────────────────────
// Framer Motion / CSS transition values

export const motion = {
  // Spring presets for framer-motion
  spring: {
    snappy: { type: "spring", stiffness: 400, damping: 30 },
    smooth: { type: "spring", stiffness: 300, damping: 28 },
    bouncy: { type: "spring", stiffness: 500, damping: 25 },
  },

  // CSS transition strings
  transition: {
    fast: "all 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
    normal: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    slow: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
    color: "color 0.2s ease, background 0.2s ease, border-color 0.2s ease",
    shadow: "box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    transform: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  },

  // Reduced motion — always wrap animations
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
} as const;


// ── HELPER: get mode-aware tokens ────────────────────────────────────────────
// Usage: const t = tokens(isDark);
//        <div style={{ background: t.bg, color: t.text }}>

export function tokens(isDark: boolean) {
  return isDark ? brand.dark : brand.light;
}

export function glassTokens(isDark: boolean) {
  return {
    nav: isDark ? glass.nav.dark : glass.nav.light,
    card: isDark ? glass.card.dark : glass.card.light,
    button: isDark ? glass.button.dark : glass.button.light,
    sheet: isDark ? glass.sheet.dark : glass.sheet.light,
  };
}

export function ctaTokens(isDark: boolean) {
  return isDark ? cta.dark : cta.light;
}

export function buttonTokens(isDark: boolean) {
  return {
    ghost: isDark ? button.ghost.dark : button.ghost.light,
    accentGhost: isDark ? button.accentGhost.dark : button.accentGhost.light,
    icon: isDark ? button.icon.dark : button.icon.light,
  };
}


// ── TAILWIND CSS CLASS GENERATORS ────────────────────────────────────────────
// For components using Tailwind classes instead of inline styles

export const tw = {
  // CTA button (primary)
  cta: `
    inline-flex items-center justify-center
    rounded-full px-8 py-3.5
    text-sm font-semibold tracking-wide
    transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
    hover:-translate-y-0.5
    active:translate-y-0 active:scale-[0.98]
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-offset-2
  `.replace(/\s+/g, " ").trim(),

  // Ghost button
  ghost: `
    inline-flex items-center justify-center
    rounded-xl px-5 py-2.5
    text-sm font-medium
    backdrop-blur-[12px]
    transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
    active:scale-[0.98]
  `.replace(/\s+/g, " ").trim(),

  // Product card
  card: `
    rounded-2xl overflow-hidden
    transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
    hover:-translate-y-0.5
    active:scale-[0.99]
  `.replace(/\s+/g, " ").trim(),

  // Icon button
  iconBtn: `
    flex items-center justify-center
    h-10 w-10 rounded-full shrink-0
    transition-colors duration-150
  `.replace(/\s+/g, " ").trim(),

  // Glass nav
  nav: `
    backdrop-blur-[24px] backdrop-saturate-[1.4]
  `.replace(/\s+/g, " ").trim(),
} as const;


// ── CSS CUSTOM PROPERTIES (inject into :root) ────────────────────────────────
// Optional: inject these as CSS variables for non-React components

export const cssVarsLight = `
  --ssl-bg: ${brand.light.bg};
  --ssl-bg-card: ${brand.light.bgCard};
  --ssl-bg-surface: ${brand.light.bgSurface};
  --ssl-accent: ${brand.light.accent};
  --ssl-accent-deep: ${brand.light.accentDeep};
  --ssl-text: ${brand.light.text};
  --ssl-text-secondary: ${brand.light.textSecondary};
  --ssl-text-tertiary: ${brand.light.textTertiary};
  --ssl-border: ${brand.light.border};
`;

export const cssVarsDark = `
  --ssl-bg: ${brand.dark.bg};
  --ssl-bg-card: ${brand.dark.bgCard};
  --ssl-bg-surface: ${brand.dark.bgSurface};
  --ssl-accent: ${brand.dark.accent};
  --ssl-accent-deep: ${brand.dark.accentDeep};
  --ssl-text: ${brand.dark.text};
  --ssl-text-secondary: ${brand.dark.textSecondary};
  --ssl-text-tertiary: ${brand.dark.textTertiary};
  --ssl-border: ${brand.dark.border};
`;


// ── TIER GRADIENTS (2025 Redesign — Gradient Score Rings) ────────────────────

export type ScoreTier = 'excellent' | 'good' | 'attention' | 'critical';

export const tierGradients: Record<ScoreTier, { color: string; gradient: [string, string] }> = {
  excellent: { color: '#4ECDC4', gradient: ['#4ECDC4', '#2BAE66'] },
  good:      { color: '#5E8B68', gradient: ['#5E8B68', '#8FC49F'] },
  attention: { color: '#C9A96E', gradient: ['#C9A96E', '#E8D5A3'] },
  critical:  { color: '#E8A87C', gradient: ['#E8A87C', '#CF6679'] },
};


// ── CTA GLOW (2025 Redesign — Premium Button Glow Shadows) ──────────────────

export const ctaGlow = {
  light: '0 8px 24px rgba(94,139,104,0.3), 0 2px 8px rgba(94,139,104,0.15)',
  dark: '0 8px 24px rgba(74,158,104,0.25), 0 2px 8px rgba(74,158,104,0.15)',
} as const;

export function ctaGlowToken(isDark: boolean) {
  return isDark ? ctaGlow.dark : ctaGlow.light;
}


// ── GLASS CARD HOVER (2025 Redesign — Hoverable Glass Cards) ────────────────

export const glassCardHover = {
  light: {
    hoverBg: 'rgba(255,255,255,0.85)',
    hoverTransform: 'translateY(-2px)',
    hoverShadow: '0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
  },
  dark: {
    hoverBg: 'rgba(28,28,30,0.70)',
    hoverTransform: 'translateY(-2px)',
    hoverShadow: '0 12px 40px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
  },
} as const;

export function glassCardHoverTokens(isDark: boolean) {
  return isDark ? glassCardHover.dark : glassCardHover.light;
}