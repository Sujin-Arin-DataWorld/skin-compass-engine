import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroCtaButtons } from '@/components/hero/HeroCtaButtons';
import { SLIDE1_COPY, type HeroLang } from '@/constants/hero-copy';

interface LandingHeroProps {
  lang: HeroLang;
}

export const LandingHero = ({ lang }: LandingHeroProps) => {
  const navigate = useNavigate();
  const copy = SLIDE1_COPY[lang];

  return (
    <section className="relative w-full overflow-hidden h-[85svh] md:h-[92svh] max-h-[850px] bg-[#0A0D12]">
      {/* ── Background Layer ── */}
      <img
        src="/assets/hero-face.png"
        alt="AI Skincare Analysis"
        className="absolute inset-0 w-full h-full object-cover object-[center_15%] md:object-[92%_center]"
        loading="eager"
      />

      {/* ── Gradients & Shadows for text legibility ── */}
      <div 
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{ background: 'linear-gradient(to top, rgba(10,13,18,0.95) 0%, rgba(10,13,18,0.65) 40%, rgba(10,13,18,0.1) 70%, transparent 100%)' }}
      />
      <div 
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{ background: 'linear-gradient(to right, rgba(10,13,18,0.85) 0%, rgba(10,13,18,0.4) 55%, transparent 100%)' }}
      />
      
      {/* Dreamy mist overlay for luxury tech feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 72% 25%, rgba(160,130,80,0.15) 0%, rgba(45,107,74,0.15) 55%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Content Layer ── */}
      <div className="absolute inset-0 flex flex-col justify-end md:justify-center pb-12 md:pb-0 px-6 md:px-20 lg:px-28 z-10 w-full md:max-w-3xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase font-medium mb-3 md:mb-5 text-[#EAEAEA]/80 notranslate"
          style={{ fontFamily: "var(--font-sans)" }}
          translate="no"
        >
          S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-[28px] md:text-5xl lg:text-6xl leading-[1.15] mb-3 md:mb-5 font-light"
          style={{ fontFamily: '"SF Pro Display", var(--font-display)' }}
        >
          {copy.headline.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/80 text-sm md:text-[19px] leading-relaxed mb-8 md:mb-12 max-w-lg break-keep font-light tracking-wide"
          style={{ fontFamily: '"Inter", var(--font-sans)' }}
        >
          {copy.sub.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.p>

        {/* ── The CTA Hook ── */}
        <HeroCtaButtons
          lang={lang}
          onPrimary={() => navigate('/skin-analysis')}
          onSecondary={() => navigate('/diagnosis')}
        />
      </div>
    </section>
  );
};
