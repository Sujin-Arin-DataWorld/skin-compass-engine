// ═══════════════════════════════════════════════════════════════════════════════
// src/components/hero/HeroCtaButtons.tsx
// Premium dual CTA — sage-green primary + glass morphism secondary
// Mobile: horizontal row | Desktop: horizontal row (larger)
// ═══════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Camera, ClipboardList } from 'lucide-react';

interface HeroCtaButtonsProps {
  lang: 'ko' | 'en' | 'de';
  onPrimary: () => void;
  onSecondary: () => void;
}

const EASE_LUXURY = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;

export const HeroCtaButtons = ({ lang, onPrimary, onSecondary }: HeroCtaButtonsProps) => {
  const copy = {
    primary: { ko: '60초 AI 피부 분석', en: '60s AI Skin Analysis', de: 'KI-Analyse in 60 Sek.' },
    secondary: { ko: '카메라 없이 시작', en: 'Without camera', de: 'Ohne Kamera' },
  };

  return (
    <motion.div
      // Mobile: row, gap-2 | Desktop: row, gap-3
      className="flex flex-row gap-2 md:gap-3 items-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE_LUXURY, delay: 0.4 }}
    >
      {/* ── Primary CTA: sage-green gradient ── */}
      <motion.button
        onClick={onPrimary}
        className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-7 py-2.5 md:py-3.5 rounded-full overflow-hidden text-white font-semibold whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #5E8B68, #3D6B4A)',
          boxShadow: '0 4px 16px rgba(45,79,57,0.3)',
        }}
        whileTap={{ scale: 0.97 }}
      >
        <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" strokeWidth={2} />
        <span className="text-[12px] md:text-[15px] tracking-tight">
          {copy.primary[lang]}
        </span>
      </motion.button>

      {/* ── Secondary CTA: Glass Morphism ── */}
      <motion.button
        onClick={onSecondary}
        className="flex items-center justify-center gap-1 md:gap-2 px-3.5 md:px-6 py-2.5 md:py-3.5 rounded-full
                   border border-white/25 text-white/85
                   text-[11px] md:text-[14px] font-medium tracking-tight whitespace-nowrap
                   transition-colors duration-300 hover:border-white/40 hover:text-white"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.97 }}
      >
        <ClipboardList className="opacity-70 w-3 h-3 md:w-4 md:h-4 shrink-0" strokeWidth={1.5} />
        <span>{copy.secondary[lang]}</span>
      </motion.button>
    </motion.div>
  );
};
