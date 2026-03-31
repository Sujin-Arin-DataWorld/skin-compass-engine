/**
 * HowItWorks — Skin Strategy Lab
 *
 * Architecture:
 *  - FLOW array defines all step data (fully typed via FlowStep)
 *  - StepCard handles per-step rendering + animations
 *  - Animations: Staggered Slide-Up per text element + Count-Up for step numbers
 *  - Image layouts: isDualPhone (Step 1) | secondImage (Step 3) | single phone (Step 2)
 *  - All floating image animations use `will-change: transform` for GPU compositing
 *  - Images use loading="lazy" + explicit dimensions to prevent CLS
 *  - Mobile: smaller phones, reduced padding, touch-friendly tap targets
 */

import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from 'next-themes';
import { tokens } from '@/lib/designTokens';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import { Camera, Cpu, ClipboardList, type LucideIcon } from 'lucide-react';
import type { HeroLang } from '@/constants/hero-copy';

// ─── Mounted hook (Firefox iOS hydration fix) ────────────────────────────────
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HowItWorksProps { lang: HeroLang; }

interface FlowStep {
  icon: LucideIcon;
  num: string;
  image: string;
  secondImage?: string;
  isDualPhone?: boolean;
  title: Record<string, string>;
  desc: Record<string, string>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FLOW: FlowStep[] = [
  {
    icon: ClipboardList,
    num: "01",
    image: "/assets/how-step-lifestyle.png",
    secondImage: "/assets/how-step-sleep.png",
    isDualPhone: true,
    title: { ko: "라이프스타일 분석", en: "Lifestyle Check", de: "Lebensstil-Check" },
    desc: {
      ko: "수면, 수분 섭취, 스트레스 등 8가지 질문으로 당신만의 피부 프로필을 만듭니다.",
      en: "8 quick questions about sleep, hydration & stress to build your unique skin profile.",
      de: "8 kurze Fragen zu Schlaf, Hydration & Stress für Ihr einzigartiges Hautprofil.",
    },
  },
  {
    icon: Camera,
    num: "02",
    image: "/assets/how-step-scan.png",
    title: { ko: "60초 스마트 스캔*", en: "60s Smart Scan*", de: "60s Smart-Scan*" },
    desc: {
      ko: "별도 앱 설치 없이 스마트폰 카메라로 얼굴 전체를 가볍게 스캔합니다.",
      en: "Lightly sweep your face with your smartphone camera. No app needed.",
      de: "Scannen Sie Ihr Gesicht einfach mit der Smartphone-Kamera. Keine App nötig.",
    },
  },
  {
    icon: Cpu,
    num: "03",
    image: "/assets/how-step-results.png",
    secondImage: "/assets/about2.jpg",
    title: { ko: "맞춤형 루틴 제안", en: "Your Personal Routine", de: "Ihre persönliche Routine" },
    desc: {
      ko: "AI가 분석한 데이터를 바탕으로 완벽하게 조합된 5가지 K-뷰티 루틴을 제안합니다.",
      en: "Based on AI analysis, we suggest a perfectly matched 5-step K-Beauty routine.",
      de: "Basierend auf der KI-Analyse empfehlen wir eine perfekt abgestimmte 5-Schritt K-Beauty-Routine.",
    },
  },
];

// ─── Stagger variants ─────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const LUXURY_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: LUXURY_EASE },
  },
};

// ─── Count-Up hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, isInView: boolean) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState('00');

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionVal, target, {
      duration: 0.8,
      ease: 'easeOut',
      delay: 0.1,
    });
    const unsub = motionVal.on('change', (v) => {
      setDisplay(String(Math.round(v)).padStart(2, '0'));
    });
    return () => { controls.stop(); unsub(); };
  }, [isInView, motionVal, target]);

  return display;
}

// ─── Floating animation config ───────────────────────────────────────────────

const FLOAT_BACK = { y: [0, -9, 0], transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' as const } };
const FLOAT_FRONT = { y: [0, 9, 0], transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' as const } };
const FLOAT_BG = { y: [0, -6, 0], transition: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' as const } };
const FLOAT_PHONE = { y: [0, 8, 0], transition: { repeat: Infinity, duration: 5.5, ease: 'easeInOut' as const } };

// ─── StepLabel ────────────────────────────────────────────────────────────────

const StepLabel = memo(({ lang, num, isInView }: { lang: HeroLang; num: string; isInView: boolean }) => {
  const target = parseInt(num, 10);
  const displayNum = useCountUp(target, isInView);
  const label = lang === 'ko' ? '단계' : lang === 'de' ? 'Schritt' : 'Step';
  return <span>{label} {displayNum}</span>;
});
StepLabel.displayName = 'StepLabel';

// ─── StepCard ─────────────────────────────────────────────────────────────────

const StepCard = memo(({ step, lang, isDark, index }: {
  step: FlowStep; lang: HeroLang; isDark: boolean; index: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const t = tokens(isDark);
  const isReversed = index % 2 !== 0;

  // Phone border color from design token
  const phoneBorderColor = isDark ? '#252528' : '#1a1919';
  const backPhoneBorderColor = isDark ? '#17171a' : '#040404';

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center`}
    >
      {/* ── Text Side ── */}
      <div className={`space-y-4 md:space-y-5 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>

        {/* Icon + Step badge */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 md:gap-4">
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}` }}
          >
            <step.icon
              className="w-4 h-4 md:w-5 md:h-5"
              style={{ color: t.accent }}
              strokeWidth={1.5}
            />
          </div>
          <span
            className="text-[12px] md:text-[13px] tracking-[0.18em] md:tracking-[0.2em] uppercase font-medium"
            style={{ color: t.textTertiary, fontFamily: 'var(--font-sans)' }}
          >
            <StepLabel lang={lang} num={step.num} isInView={isInView} />
          </span>
        </motion.div>

        {/* Title */}
        <motion.h3
          variants={itemVariants}
          className="text-[22px] sm:text-2xl md:text-3xl lg:text-[34px] leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: t.text, fontWeight: 300 }}
        >
          {step.title[lang]}
        </motion.h3>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-[15px] md:text-[16px] lg:text-[17px] leading-relaxed font-light max-w-md"
          style={{ color: t.textSecondary }}
        >
          {step.desc[lang]}
        </motion.p>
      </div>

      {/* ── Image Side ── */}
      <motion.div
        variants={itemVariants}
        className={`flex justify-center ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}
      >
        {step.isDualPhone ? (
          /* ── Dual-phone layout (Step 01) ── */
          <div
            className="relative w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px] h-[320px] sm:h-[380px] md:h-[440px] mx-auto mt-[10px]"
            style={{ willChange: 'transform' }}
          >
            {/* Back phone */}
            <motion.div
              className="absolute right-0 top-[12%] md:-right-[5%] md:top-[8%] z-0"
              animate={{ y: FLOAT_BACK.y }}
              transition={FLOAT_BACK.transition}
              style={{ willChange: 'transform' }}
            >
              <div
                className="relative w-[145px] sm:w-[165px] md:w-[200px] aspect-[1/2.16] rounded-[32px] md:rounded-[44px] border-[6px] md:border-[8px] overflow-hidden bg-black shadow-[0_16px_32px_rgba(0,0,0,0.15)] opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-500"
                style={{
                  borderColor: backPhoneBorderColor,
                  transform: 'rotate(8deg)',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  WebkitTransform: 'rotate(8deg) translateZ(0)',
                }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[36px] md:w-[48px] h-[11px] md:h-[16px] bg-black rounded-full z-20" />
                <img
                  src={step.secondImage}
                  alt={step.title[lang]}
                  width={200}
                  height={432}
                  className="absolute inset-0 w-full h-full object-cover z-10 opacity-90"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </motion.div>

            {/* Front phone */}
            <motion.div
              className="absolute left-0 bottom-[0%] md:-left-[5%] md:-bottom-[2%] z-10"
              animate={{ y: FLOAT_FRONT.y }}
              transition={FLOAT_FRONT.transition}
              style={{ willChange: 'transform' }}
            >
              <div
                className="relative w-[165px] sm:w-[185px] md:w-[220px] aspect-[1/2.16] rounded-[36px] md:rounded-[48px] border-[8px] md:border-[10px] overflow-hidden bg-black shadow-[0_24px_56px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-500"
                style={{
                  borderColor: phoneBorderColor,
                  transform: 'rotate(-5deg)',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  WebkitTransform: 'rotate(-5deg) translateZ(0)',
                }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44px] md:w-[62px] h-[14px] md:h-[20px] bg-black rounded-full z-20" />
                <img
                  src={step.image}
                  alt={step.title[lang]}
                  width={220}
                  height={475}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </motion.div>
          </div>

        ) : step.secondImage ? (
          /* ── Dual image: phone + product photo (Step 03) ── */
          <div
            className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[420px] h-[280px] sm:h-[320px] md:h-[420px]"
            style={{ willChange: 'transform' }}
          >
            {/* Background product photo */}
            <motion.div
              className="absolute right-0 bottom-0 w-[65%] h-[85%] rounded-2xl md:rounded-3xl z-0"
              animate={{ y: FLOAT_BG.y }}
              transition={FLOAT_BG.transition}
              style={{ willChange: 'transform' }}
            >
              <div
                className="w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                style={{ border: `1px solid ${t.border}` }}
              >
                <img
                  src={step.secondImage}
                  alt="K-Beauty Routine"
                  width={280}
                  height={360}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </motion.div>

            {/* Foreground phone mockup */}
            <motion.div
              className="absolute left-0 top-0 z-10"
              animate={{ y: FLOAT_PHONE.y }}
              transition={FLOAT_PHONE.transition}
              style={{ willChange: 'transform' }}
            >
              <div
                className="relative w-[120px] sm:w-[140px] md:w-[180px] aspect-[1/2.16] rounded-[32px] md:rounded-[44px] border-[7px] md:border-[9px] overflow-hidden bg-black shadow-[0_20px_56px_rgba(0,0,0,0.25)]"
                style={{
                  borderColor: isDark ? '#1C1C1E' : '#1a1919',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)',
                }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44px] md:w-[62px] h-[14px] md:h-[20px] bg-black rounded-full z-20" />
                <img
                  src={step.image}
                  alt={step.title[lang]}
                  width={180}
                  height={389}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </motion.div>
          </div>

        ) : (
          /* ── Single phone mockup (Step 02) ── */
          <motion.div
            animate={{ y: FLOAT_FRONT.y }}
            transition={FLOAT_FRONT.transition}
            style={{ willChange: 'transform' }}
          >
            <div
              className="w-[180px] sm:w-[200px] md:w-[240px] aspect-[1/2.16] rounded-[36px] md:rounded-[48px] border-[8px] md:border-[10px] overflow-hidden relative bg-black shadow-[0_16px_48px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform duration-500"
              style={{
                borderColor: phoneBorderColor,
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitTransform: 'translateZ(0)',
              }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[54px] md:w-[72px] h-[16px] md:h-[22px] bg-black rounded-full z-20" />
              <img
                src={step.image}
                alt={step.title[lang]}
                width={240}
                height={518}
                className="absolute inset-0 w-full h-full object-cover z-10"
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});
StepCard.displayName = 'StepCard';

// ─── Section header variants ─────────────────────────────────────────────────

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: LUXURY_EASE },
  },
};

const dividerVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1, opacity: 1,
    transition: { duration: 0.9, delay: 0.15, ease: LUXURY_EASE },
  },
};

// ─── HowItWorks (exported) ────────────────────────────────────────────────────

export const HowItWorks = ({ lang }: HowItWorksProps) => {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const t = tokens(isDark);

  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });

  const headingText =
    lang === 'ko' ? '어떻게 작동하나요?' :
      lang === 'de' ? 'Wie es funktioniert' :
        'How it works';

  return (
    <section
      className="w-full pt-[76px] pb-20 md:pt-[108px] md:pb-28 overflow-hidden border-t relative transition-colors duration-500"
      style={{
        background: t.bgSurface,
        borderColor: t.border,
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease, background-color 0.5s ease, border-color 0.5s ease',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-12 lg:px-16">

        {/* ── Section Header ── */}
        <div ref={headerRef} className="text-center w-full max-w-3xl mx-auto mb-6 md:mb-17 space-y-4">
          <motion.p
            initial="hidden"
            animate={headerInView ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: LUXURY_EASE } },
            }}
            className="text-[11px] md:text-[12px] tracking-[0.25em] uppercase font-medium"
            style={{ color: t.accent, fontFamily: 'var(--font-sans)' }}
          >
            {lang === 'ko' ? '분석 과정' : lang === 'de' ? 'Der Ablauf' : 'The Process'}
          </motion.p>

          <motion.h2
            initial="hidden"
            animate={headerInView ? 'visible' : 'hidden'}
            variants={headerVariants}
            className="text-[28px] sm:text-[34px] md:text-5xl tracking-normal font-light"
            style={{ fontFamily: 'var(--font-display)', color: t.text }}
          >
            {headingText}
          </motion.h2>

          {/* Decorative divider */}
          <motion.div
            initial="hidden"
            animate={headerInView ? 'visible' : 'hidden'}
            variants={dividerVariants}
            className="mx-auto h-px w-16 md:w-20 origin-center"
            style={{ background: `linear-gradient(to right, transparent, ${t.accent}, transparent)` }}
          />
        </div>

        {/* ── Step Cards ── */}
        <div className="space-y-20 md:space-y-28 lg:space-y-32">
          {FLOW.map((step, i) => (
            <StepCard
              key={step.num}
              step={step}
              lang={lang}
              isDark={isDark}
              index={i}
            />
          ))}
        </div>

        {/* ── Medical Disclaimer ── */}
        <div
          className="text-[11px] text-neutral-400 tracking-wide mt-24 mb-8 max-w-2xl mx-auto text-center font-light leading-relaxed opacity-70"
        >
          {lang === 'ko'
            ? '* 안내: 본 스킨 매핑 결과는 오직 미용 및 피부 관리 정보 목적으로만 참고용으로 제공됩니다. 이는 의학적 평가이나 진단을 대체하지 않으며, 특정 질환에 대해서는 피부과 전문의 상담을 권장합니다.'
            : lang === 'de'
              ? '* Hinweis: Das KI-Gesichtsmapping dient ausschließlich informativen und kosmetischen Pflegezwecken. Es ist kein Ersatz für professionelle medizinische Beratung oder Diagnose.'
              : '* Note: The AI skin mapping is provided for cosmetic information purposes only. It does not replace professional medical consultation or analysis.'
          }
        </div>

      </div>
    </section>
  );
};
