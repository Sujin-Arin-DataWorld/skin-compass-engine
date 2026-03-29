import { useRef } from 'react';
import { useTheme } from 'next-themes';
import { tokens } from '@/lib/designTokens';
import { motion, useInView } from 'framer-motion';
import { Camera, Cpu, ClipboardList } from 'lucide-react';
import type { HeroLang } from '@/constants/hero-copy';

interface HowItWorksProps {
  lang: HeroLang;
}

const FLOW = [
  {
    icon: ClipboardList,
    num: "01",
    image: "/assets/how-step-lifestyle.png",
    title: { ko: "라이프스타일 분석", en: "Lifestyle Check", de: "Lebensstil-Check" },
    desc: {
      ko: "수면, 수분 섭취, 스트레스 등 5가지 질문으로 당신만의 피부 프로필을 만듭니다.",
      en: "5 quick questions about sleep, hydration & stress to build your unique skin profile.",
      de: "5 kurze Fragen zu Schlaf, Hydration & Stress für Ihr einzigartiges Hautprofil.",
    }
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
    }
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
    }
  }
];

const StepCard = ({ step, lang, isDark, index }: {
  step: typeof FLOW[0], lang: HeroLang, isDark: boolean, index: number
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const t = tokens(isDark);
  const isReversed = index % 2 !== 0; // Alternate image left/right on desktop

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center ${isReversed ? 'lg:direction-rtl' : ''}`}
    >
      {/* Text Side */}
      <div className={`space-y-5 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
        {/* Step number + Icon row */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}` }}
          >
            <step.icon
              className="w-5 h-5"
              style={{ color: t.accent }}
              strokeWidth={1.5}
            />
          </div>
          <span
            className="text-[13px] tracking-[0.2em] uppercase font-medium"
            style={{ color: t.textTertiary, fontFamily: 'var(--font-sans)' }}
          >
            {lang === 'ko' ? `단계` : lang === 'de' ? `Schritt` : `Step`} {step.num}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-2xl md:text-3xl lg:text-[34px] leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: t.text, fontWeight: 300 }}
        >
          {step.title[lang]}
        </h3>

        {/* Description */}
        <p
          className="text-[16px] md:text-[17px] leading-relaxed font-light max-w-md"
          style={{ color: t.textSecondary }}
        >
          {step.desc[lang]}
        </p>
      </div>

      {/* Image Side */}
      <div className={`flex justify-center ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
        {step.secondImage ? (
          /* Dual-image layout: phone mockup + product photo */
          <div className="relative w-full max-w-[380px] md:max-w-[420px] h-[340px] md:h-[420px]">
            {/* Product photo — background, larger, rounded */}
            <div
              className="absolute right-0 bottom-0 w-[65%] h-[85%] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
              style={{ border: `1px solid ${t.border}` }}
            >
              <img
                src={step.secondImage}
                alt="K-Beauty Routine"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Phone mockup — foreground, overlapping left */}
            <div
              className="absolute left-0 top-0 w-[150px] md:w-[180px] aspect-[1/2.16] rounded-[36px] md:rounded-[44px] border-[7px] md:border-[9px] overflow-hidden bg-black shadow-[0_20px_56px_rgba(0,0,0,0.25)] z-10"
              style={{ borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[50px] md:w-[62px] h-[16px] md:h-[20px] bg-black rounded-full z-20" />
              <img
                src={step.image}
                alt={step.title[lang]}
                className="absolute inset-0 w-full h-full object-cover z-10"
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          /* Single phone mockup */
          <div
            className="w-[200px] md:w-[240px] aspect-[1/2.16] rounded-[40px] md:rounded-[48px] border-[8px] md:border-[10px] overflow-hidden relative bg-black shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
            style={{ borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[60px] md:w-[72px] h-[18px] md:h-[22px] bg-black rounded-full z-20" />
            <img
              src={step.image}
              alt={step.title[lang]}
              className="absolute inset-0 w-full h-full object-cover z-10"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const HowItWorks = ({ lang }: HowItWorksProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = tokens(isDark);

  return (
    <section
      className="w-full py-20 md:py-28 overflow-hidden border-t relative transition-colors duration-500"
      style={{ background: t.bgSurface, borderColor: t.border }}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-16">

        {/* Title */}
        <div className="text-center w-full max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[32px] md:text-5xl tracking-normal font-light"
            style={{ fontFamily: 'var(--font-display)', color: t.text }}
          >
            {lang === 'ko' ? '어떻게 작동하나요?' : lang === 'de' ? 'Wie es funktioniert' : 'How it works'}
          </motion.h2>
        </div>

        {/* Step Cards — each step has text + image together */}
        <div className="space-y-20 md:space-y-28 lg:space-y-32">
          {FLOW.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              lang={lang}
              isDark={isDark}
              index={i}
            />
          ))}
        </div>

        {/* Medical Disclaimer Footnote */}
        <div
          className="text-[11px] text-neutral-400 tracking-wide mt-24 mb-12 max-w-2xl mx-auto text-center font-light leading-relaxed opacity-70"
        >
          {lang === 'ko'
            ? "* 안내: AI 피부 분석은 오직 미용 목적으로만 제공됩니다. 이는 의학적 진단이 아니며, 피부과 전문의의 상담을 대체하지 않습니다."
            : lang === 'de'
              ? "* Hinweis: Die KI-Hautanalyse dient ausschließlich kosmetischen Zwecken. Sie stellt keine medizinische Diagnose dar und ersetzt nicht die Beratung durch einen Dermatologen."
              : "* Note: The AI skin analysis is for cosmetic purposes only. It does not constitute a medical diagnosis and does not replace consultation with a dermatologist."
          }
        </div>

      </div>
    </section>
  );
};
