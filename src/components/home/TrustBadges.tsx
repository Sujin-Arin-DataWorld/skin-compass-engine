import { motion } from 'framer-motion';
import { ShieldCheck, Target, FlaskConical, Globe } from 'lucide-react';
import type { HeroLang } from '@/constants/hero-copy';

interface TrustBadgesProps {
  lang: HeroLang;
}

const BADGES = [
  { icon: FlaskConical, ko: "코리안 사이언스", en: "Korean Science", de: "Korean Science" },
  { icon: ShieldCheck, ko: "더마 테스트 완료", en: "Derma-tested", de: "Derma-getestet" },
  { icon: Globe, ko: "메이드 인 코리아", en: "Made in Korea", de: "Made in Korea" },
  { icon: Target, ko: "맞춤형 솔루션", en: "Personalized", de: "Personalisiert" },
];

export const TrustBadges = ({ lang }: TrustBadgesProps) => {
  return (
    <section className="w-full bg-[#FAFAFA] dark:bg-[#0A0D12] border-y border-black/5 dark:border-white/5 relative z-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {BADGES.map((badge, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center gap-2.5 md:gap-3 text-center"
            >
              <badge.icon className="w-6 h-6 md:w-7 md:h-7 opacity-70 text-[#111] dark:text-[#EAEAEA]" strokeWidth={1.25} />
              <span className="text-[12px] md:text-[13px] font-medium tracking-wide text-[#333] dark:text-[#CCC] uppercase" style={{ fontFamily: "var(--font-sans)" }}>
                {badge[lang]}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};
