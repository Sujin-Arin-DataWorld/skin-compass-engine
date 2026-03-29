// ═══════════════════════════════════════════════════════════════════════════════
// src/components/hero/HeroCtaButtons.tsx
// Premium dual CTA — sage-green primary + glass morphism secondary
// Mobile: horizontal row | Desktop: horizontal row (larger)
// ═══════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

interface HeroCtaButtonsProps {
  lang: 'ko' | 'en' | 'de';
  onPrimary: () => void;
  onSecondary: () => void;
}

const EASE_LUXURY = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;

export const HeroCtaButtons = ({ lang, onPrimary, onSecondary }: HeroCtaButtonsProps) => {
  const copy = {
    primary: { ko: 'AI 피부 분석 시작', en: 'Start AI Analysis', de: 'KI-Analyse starten' },
    secondary: { ko: '또는 질문으로 시작하기 ➔', en: 'or Start Questionnaire ➔', de: 'oder Fragebogen starten ➔' },
    micro: { 
      ko: '🔒 100% 데이터 보호 규정 준수 & 무료', 
      en: '🔒 100% GDPR-compliant & Free', 
      de: '🔒 100% DSGVO-konform & Kostenlos' 
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-3 w-full max-w-[280px] sm:max-w-[320px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE_LUXURY, delay: 0.4 }}
    >
      {/* ── Primary CTA: Solid pill-shape ── */}
      <motion.button
        onClick={onPrimary}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full overflow-hidden text-[#111] font-semibold tracking-wide"
        style={{
          background: '#FAFAFA', // Warm ivory/off-white for high contrast and clinical trust
          boxShadow: '0 8px 32px rgba(250,250,250,0.15)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Camera className="w-5 h-5 shrink-0" strokeWidth={2} />
        <span className="text-[15px] md:text-[16px]">
          {copy.primary[lang]}
        </span>
      </motion.button>

      {/* ── Micro-copy: Safety & Trust ── */}
      <p className="text-[11px] md:text-[12px] font-medium text-white/60 tracking-wide mt-[-2px]">
        {copy.micro[lang]}
      </p>

      {/* ── Secondary CTA: Ghost text link ── */}
      <motion.button
        onClick={onSecondary}
        className="text-[13px] md:text-[14px] font-medium text-white/70 tracking-wide transition-colors duration-300 hover:text-white mt-1 pt-2"
        whileTap={{ scale: 0.97 }}
      >
        {copy.secondary[lang]}
      </motion.button>
    </motion.div>
  );
};
