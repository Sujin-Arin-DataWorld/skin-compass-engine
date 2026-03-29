// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT FIX — Desktop: full-bleed image + gradient overlay (no black gap)
// Mobile: CSS Grid vertical stack (image row + text row, no text-face overlap)
// Both layouts in one component, switched via Tailwind md: breakpoint
// ═══════════════════════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { HeroCtaButtons } from '@/components/hero/HeroCtaButtons';
import { SLIDE1_COPY, type HeroLang } from '@/constants/hero-copy';

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_BG = '#0A0D12';

const LUXURY_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const containerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemV = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: LUXURY_EASE } },
};

const noMotionItem = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0, ease: LUXURY_EASE } },
};

// ── Gradient values ───────────────────────────────────────────────────────────

const DESKTOP_GRADIENT = `linear-gradient(to right,
  ${HERO_BG} 0%,
  ${HERO_BG} 28%,
  rgba(10,13,18,0.92) 38%,
  rgba(10,13,18,0.55) 50%,
  rgba(10,13,18,0.10) 60%,
  transparent 68%
)`;

const MOBILE_BRIDGE_GRADIENT = `linear-gradient(to top,
  ${HERO_BG} 0%,
  rgba(10,13,18,0.6) 50%,
  transparent 100%
)`;

const MIST_OVERLAY =
  'radial-gradient(ellipse 70% 60% at 72% 25%, rgba(160,130,80,0.15) 0%, rgba(45,107,74,0.15) 55%, transparent 100%)';

// ── Shared text blocks (DRY) ──────────────────────────────────────────────────

interface TextBlockProps {
  copy: { headline: string; sub: string };
  lang: HeroLang;
  item: typeof itemV;
  isDesktop: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}

function HeroTextBlock({ copy, lang, item, isDesktop, onPrimary, onSecondary }: TextBlockProps) {
  return (
    <>
      {/* Brand Label */}
      <motion.p
        variants={item}
        className={`tracking-[0.3em] uppercase font-medium notranslate ${
          isDesktop ? 'text-[12px] mb-4' : 'text-[11px] mb-3'
        }`}
        style={{
          color: 'var(--ssl-accent)',
          fontFamily: 'var(--font-sans)',
          ...(isDesktop && { textShadow: '0 1px 8px rgba(0,0,0,0.4)' }),
        }}
        translate="no"
      >
        S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
      </motion.p>

      {/* Headline */}
      <motion.h1
        variants={item}
        className={`text-white leading-[1.15] font-light ${
          isDesktop
            ? 'text-5xl lg:text-6xl mb-5'
            : 'text-[27px] sm:text-[34px] mb-3'
        }`}
        style={{
          fontFamily: 'var(--font-display)',
          ...(isDesktop && {
            textShadow: '0 2px 30px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.35)',
          }),
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
        variants={item}
        className={`text-white/85 leading-relaxed max-w-lg font-light tracking-wide ${
          isDesktop
            ? 'text-[19px] mb-10'
            : 'text-[14px] sm:text-[15px] mb-6'
        }`}
        style={{
          fontFamily: '"Inter", var(--font-sans)',
          ...(isDesktop && {
            textShadow: '0 1px 16px rgba(0,0,0,0.4)',
          }),
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

      {/* CTA Buttons */}
      <motion.div variants={item}>
        <HeroCtaButtons
          lang={lang}
          onPrimary={onPrimary}
          onSecondary={onSecondary}
        />
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface LandingHeroProps {
  lang: HeroLang;
}

export const LandingHero = ({ lang }: LandingHeroProps) => {
  const navigate = useNavigate();
  const copy = SLIDE1_COPY[lang];
  const prefersReduced = useReducedMotion();
  const item = prefersReduced ? noMotionItem : itemV;

  const onPrimary = () => navigate('/skin-analysis');
  const onSecondary = () => navigate('/diagnosis');

  return (
    <section className="relative w-full overflow-hidden" aria-label="Hero">

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT (below md): CSS Grid — image row + text row
          Image shows the face clearly. Text in separate row, no overlap.
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid md:hidden" style={{ gridTemplateRows: '33svh auto' }}>

        {/* Row 1: Image */}
        <div className="relative overflow-hidden">
          <img
            src="/assets/hero-face-mobile.png"
            alt="AI-powered skin analysis — woman with natural, glowing skin"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center center' }}
            loading="eager"
            /* @ts-expect-error fetchPriority is valid HTML but TS may not recognize it */
            fetchpriority="high"
          />
          {/* Gradient bridge: blends image bottom into text panel */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: MOBILE_BRIDGE_GRADIENT }}
          />
        </div>

        {/* Row 2: Text content — normal document flow, never overlaps face */}
        <div className="px-6 pt-4 pb-2" style={{ background: HERO_BG }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={prefersReduced ? undefined : containerV}
            className="flex flex-col"
          >
            <HeroTextBlock
              copy={copy}
              lang={lang}
              item={item}
              isDesktop={false}
              onPrimary={onPrimary}
              onSecondary={onSecondary}
            />
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT (md and above): Full-bleed image + gradient overlay
          Image fills entire hero. Gradient creates dark left zone for text.
          No separate dark div. Zero black gap possible.
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:block relative w-full"
        style={{ height: 'min(100svh, 960px)' }}
      >
        {/* Full-bleed background image */}
        <img
          src="/assets/hero-face-desktop.png?v=3"
          alt="AI-powered skin analysis — woman with natural, glowing skin"
          className="absolute top-0 bottom-0 h-full w-[125%] max-w-none object-cover transform -translate-x-[20%]"
          style={{ objectPosition: 'center center' }}
          loading="eager"
          /* @ts-expect-error fetchPriority is valid HTML but TS may not recognize it */
          fetchpriority="high"
        />

        {/* Gradient overlay — dark left zone for text, face visible on right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: DESKTOP_GRADIENT }}
        />

        {/* Dreamy mist overlay for luxury tech feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: MIST_OVERLAY,
            mixBlendMode: 'screen',
            isolation: 'isolate',
          }}
        />

        {/* Content — positioned on left side, z-index above overlays */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end pb-20 lg:pb-28 px-20 lg:px-28 z-10 max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={prefersReduced ? undefined : containerV}
        >
          <HeroTextBlock
            copy={copy}
            lang={lang}
            item={item}
            isDesktop={true}
            onPrimary={onPrimary}
            onSecondary={onSecondary}
          />
        </motion.div>
      </div>
    </section>
  );
};
