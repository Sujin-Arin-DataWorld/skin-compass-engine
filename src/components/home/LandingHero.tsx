import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroCtaButtons } from '@/components/hero/HeroCtaButtons';
import { SLIDE1_COPY, type HeroLang } from '@/constants/hero-copy';

interface LandingHeroProps {
  lang: HeroLang;
}

// ── Stagger variants for text elements ──
const containerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const itemV = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export const LandingHero = ({ lang }: LandingHeroProps) => {
  const navigate = useNavigate();
  const copy = SLIDE1_COPY[lang];

  return (
    <section className="relative w-full overflow-hidden max-h-[850px] bg-[#0A0D12]" style={{ height: 'clamp(400px, 85svh, 850px)' }}>
      {/* ── Background Image — desktop: pushed right for text space ── */}
      <img
        src="/assets/hero-face.png"
        alt="AI Skincare Analysis"
        className="absolute inset-0 w-full h-full object-cover object-[center_30%] md:object-center md:w-[120%] md:max-w-none md:translate-x-[12%]"
        loading="eager"
        decoding="async"
      />

      {/* ── Mobile Gradient: bottom-heavy for text protection ── */}
      <div
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{ background: 'linear-gradient(to top, rgba(10,13,18,0.97) 0%, rgba(10,13,18,0.85) 25%, rgba(10,13,18,0.55) 45%, rgba(10,13,18,0.25) 65%, transparent 80%)' }}
      />

      {/* ── Desktop Gradient: left-to-right for landscape ── */}
      <div
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{ background: 'linear-gradient(to right, rgba(10,13,18,0.88) 0%, rgba(10,13,18,0.45) 50%, rgba(10,13,18,0.08) 75%, transparent 100%)' }}
      />

      {/* ── Dreamy mist overlay for luxury tech feel ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 72% 25%, rgba(160,130,80,0.15) 0%, rgba(45,107,74,0.15) 55%, transparent 100%)",
          mixBlendMode: "screen",
          isolation: "isolate",
        }}
      />

      {/* ── Content Layer ── */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-end pb-14 sm:pb-16 md:pb-24 lg:pb-28 px-6 md:px-20 lg:px-28 z-10 w-full md:max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={containerV}
      >
        {/* Brand Label */}
        <motion.p
          variants={itemV}
          className="text-[11px] md:text-[12px] tracking-[0.3em] uppercase font-medium mb-2 md:mb-4 notranslate"
          style={{
            color: 'var(--ssl-accent)',
            fontFamily: "var(--font-sans)",
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          }}
          translate="no"
        >
          S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={itemV}
          className="text-white text-[27px] sm:text-[34px] md:text-5xl lg:text-6xl leading-[1.15] mb-2.5 md:mb-5 font-light"
          style={{
            fontFamily: 'var(--font-display)',
            textShadow: '0 2px 30px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.35)',
            hyphens: 'none',
            WebkitHyphens: 'none',
            wordBreak: 'keep-all',
          }}
        >
          {copy.headline.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={itemV}
          className="text-white/85 text-[14px] sm:text-[15px] md:text-[19px] leading-relaxed mb-6 md:mb-10 max-w-lg font-light tracking-wide"
          style={{
            fontFamily: '"Inter", var(--font-sans)',
            textShadow: '0 1px 16px rgba(0,0,0,0.4)',
            hyphens: 'none',
            WebkitHyphens: 'none',
            wordBreak: 'keep-all',
          }}
        >
          {copy.sub.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.p>

        {/* ── The CTA Hook ── */}
        <motion.div variants={itemV}>
          <HeroCtaButtons
            lang={lang}
            onPrimary={() => navigate('/skin-analysis')}
            onSecondary={() => navigate('/diagnosis')}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
