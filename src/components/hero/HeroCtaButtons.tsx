// ═══════════════════════════════════════════════════════════════════════════════
// src/components/hero/HeroCtaButtons.tsx
// Premium dual CTA — sage-green gradient primary + shimmer + ghost secondary
// Mobile: centered column | Desktop: centered column (larger)
// ═══════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

interface HeroCtaButtonsProps {
  lang: 'ko' | 'en' | 'de';
  onPrimary: () => void;
  onSecondary: () => void;
}

const EASE_LUXURY = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } as const;

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
      className="flex flex-col items-center sm:items-start gap-3 w-full max-w-[320px] sm:max-w-[340px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE_LUXURY, delay: 0.4 }}
    >
      {/* ── Primary CTA: Sage-green gradient + shimmer ── */}
      <motion.button
        onClick={onPrimary}
        className="group relative w-full flex items-center justify-center gap-2.5 px-7 py-4 rounded-full overflow-hidden text-white font-semibold tracking-wide cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, var(--ssl-accent), var(--ssl-accent-deep))',
          boxShadow: '0 8px 32px rgba(94,139,104,0.35), 0 2px 8px rgba(45,107,74,0.2)',
        }}
        whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(94,139,104,0.45), 0 4px 12px rgba(45,107,74,0.3)' }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Shimmer sweep effect */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerSweep 3s ease-in-out infinite',
          }}
        />
        <Camera className="w-5 h-5 shrink-0 relative z-10" strokeWidth={2} />
        <span className="text-[15px] md:text-[16px] relative z-10">
          {copy.primary[lang]}
        </span>
      </motion.button>

      {/* ── Micro-copy: Safety & Trust ── */}
      <p className="text-[11px] md:text-[12px] font-medium text-white/65 tracking-wide mt-[-2px]">
        {copy.micro[lang]}
      </p>

      {/* ── Secondary CTA: Ghost text link with hover underline ── */}
      <motion.button
        onClick={onSecondary}
        className="text-[13px] md:text-[14px] font-medium text-white/80 tracking-wide transition-colors duration-300 hover:text-white mt-1 pt-2 border-b border-transparent hover:border-white/40"
        whileTap={{ scale: 0.97 }}
      >
        {copy.secondary[lang]}
      </motion.button>

      {/* CSS Keyframes for shimmer — injected once */}
      <style>{`
        @keyframes shimmerSweep {
          0%   { background-position: 200% 0; }
          50%  { background-position: -200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </motion.div>
  );
};
