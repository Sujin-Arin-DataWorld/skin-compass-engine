import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import type { HeroLang } from '@/constants/hero-copy';

interface StickyBottomCtaProps {
  lang: HeroLang;
  onPrimary: () => void;
}

export const StickyBottomCta = ({ lang, onPrimary }: StickyBottomCtaProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when user scrolls past 600px (roughly past Hero section)
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ctaText = {
    ko: '📸 AI 피부 분석 시작',
    en: '📸 Start AI Analysis',
    de: '📸 KI-Analyse starten'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden"
        >
          {/* ── Glassmorphism wrapper ── */}
          <div 
            className="w-full max-w-[400px] mx-auto rounded-full p-2"
            style={{ 
              background: 'rgba(255,255,255,0.7)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.05)',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            <button
              onClick={onPrimary}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full overflow-hidden text-[#111] font-semibold tracking-wide"
              style={{
                background: '#FAFAFA', // Solid ivory inside the glass
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              <Camera className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="text-[16px] whitespace-nowrap" style={{ fontFamily: "var(--font-sans)" }}>
                {ctaText[lang]}
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
