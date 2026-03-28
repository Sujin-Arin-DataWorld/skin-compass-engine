// ═══════════════════════════════════════════════════════════════════════════════
// src/constants/hero-copy.ts
// Single source of truth for ALL hero slide copy & CTA labels
// ═══════════════════════════════════════════════════════════════════════════════

// ── Slide 1 (Female model — warm, discovery) ─────────────────────────────────
export const SLIDE1_COPY = {
  ko: {
    headline: "피부가 원하는 것,\n처음으로 정확히 압니다",
    sub: "60초 AI 분석으로 당신만의\n스킨케어 루틴을 찾아보세요.",
  },
  en: {
    headline: "Finally, skincare that\nknows your skin",
    sub: "Your personal skincare routine—\nin 60 seconds, with AI.",
  },
  de: {
    headline: "Endlich genau wissen,\nwas Ihre Haut braucht.",
    sub: "In 60 Sekunden zur perfekten Hautpflege\npersonalisiert durch KI.",
  },
} as const;

// ── Slide 2 (Male model + AI scan data overlay) ──────────────────────────────
export const SLIDE2_COPY = {
  ko: {
    id: 'ai-scan',
    headline: "당신의 피부에는\n더 정확한 답이 필요합니다",
    sub: "사진 한 장, AI가 찾아드립니다.",
  },
  en: {
    id: 'ai-scan',
    headline: "Your Skin Deserves\na Precise Answer",
    sub: "One photo. AI finds it.",
  },
  de: {
    id: 'ai-scan',
    headline: "Ihre Haut verdient\neine präzise Antwort",
    sub: "Ein Foto. KI findet sie.",
  },
} as const;

// ── Unified CTA — ALL slides identical ───────────────────────────────────────
export const HERO_CTA = {
  primary: {
    ko: '60초 AI 피부 분석',
    en: '60s AI Skin Analysis',
    de: 'KI-Hautanalyse in 60 Sek.',
  },
  secondary: {
    ko: '카메라 없이 시작하기',
    en: 'Start without camera',
    de: 'Ohne Kamera starten',
  },
} as const;

export type HeroLang = keyof typeof HERO_CTA.primary;
