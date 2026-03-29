import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Star, Instagram } from 'lucide-react';

interface CommunityTrustProps {
  lang: 'ko' | 'en' | 'de';
}

const REVIEWS = [
  {
    name: "Sarah M.",
    date: "12 Oct 2025",
    text: {
      ko: "내 피부가 진짜 필요한게 뭔지 이제야 알았어요. 추천해준 앰플 3주째 쓰는데 붉은기가 완전히 사라졌습니다.",
      en: "Finally know what my skin actually needs. Using the recommended ampoule for 3 weeks and redness is gone.",
      de: "Endlich weiß ich, was meine Haut wirklich braucht. Nutze die Ampulle seit 3 Wochen und Rötungen sind weg."
    }
  },
  {
    name: "Elena K.",
    date: "04 Nov 2025",
    text: {
      ko: "피부과 갈 돈 아꼈어요! 분석 결과가 너무 정확해서 소름 돋았습니다. 완전 추천해요.",
      en: "Saved money on derm visits! The analysis was scarily accurate. Highly recommend.",
      de: "Geld für den Hautarzt gespart! Die Analyse war erschreckend genau. Sehr zu empfehlen."
    }
  },
  {
    name: "Julia W.",
    date: "18 Nov 2025",
    text: {
      ko: "지금까지 산 화장품 중에 제일 피부가 편안해요. 60초 스캔 한번으로 인생템 찾았습니다.",
      en: "Most comfortable my skin has ever felt. Found my holy grail products in 60 seconds.",
      de: "Meine Haut hat sich noch nie so gut angefühlt. Holy Grail Produkte in 60 Sekunden gefunden."
    }
  }
];

export const CommunityTrust = ({ lang }: CommunityTrustProps) => {
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  // Animate from 0 to 12847 over 2 seconds when in view
  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const target = 12847;
      const duration = 2000;
      
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function (easeOutExpo)
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCount(Math.floor(easeOut * target));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      window.requestAnimationFrame(step);
    }
  }, [isInView]);

  return (
    <section className="bg-[#0A0D12] py-24 md:py-32 border-t border-white/5 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        
        {/* ── 1. Live Counter ── */}
        <div ref={counterRef} className="text-center mb-24 md:mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h3 className="text-[52px] md:text-[80px] lg:text-[100px] font-bold text-white leading-none tracking-tighter" style={{ fontFamily: "var(--font-display)" }}>
              {count.toLocaleString()}
              <span className="text-[#5E8B68]">+</span>
            </h3>
            <p className="text-[15px] md:text-[18px] text-white/50 tracking-widest uppercase mt-4" style={{ fontFamily: "var(--font-sans)" }}>
              {lang === 'ko' ? '누적 AI 피부 분석 완료' : lang === 'de' ? 'Analysen durchgeführt' : 'Analyses Conducted'}
            </p>
          </motion.div>
        </div>

        {/* ── 2. Trustpilot Reviews ── */}
        <div className="mb-24 md:mb-32">
          <div className="flex flex-col items-center mb-12">
            <h4 className="text-2xl md:text-3xl font-light text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
              {lang === 'ko' ? '고객들이 증명합니다' : lang === 'de' ? 'Von echten Kunden geliebt' : 'Loved by real customers'}
            </h4>
            {/* Fake Trustpilot styling */}
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-xl tracking-tight">Trustpilot</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-[#00B67A] p-1.5 rounded-sm">
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="bg-white/[0.03] border border-white/5 rounded-[24px] p-8 flex flex-col justify-between"
              >
                <div className="flex gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-[#00B67A] fill-[#00B67A]" />
                  ))}
                </div>
                <p className="text-white/80 text-[15px] leading-relaxed mb-8 flex-grow">
                  "{review.text[lang]}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">{review.name}</span>
                  <span className="text-white/40 text-xs">{review.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 3. UGC Masonry Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-2xl font-light text-white" style={{ fontFamily: "var(--font-display)" }}>
              #SkinStrategyLab
            </h4>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Instagram className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Placeholder images. Replace with real UGC later. */}
            {[
              "beginner-mood.jpg",
              "full-mood2.jpg",
              "premium-mood.jpg",
              "routine-placeholder.jpg"
            ].map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative aspect-square rounded-[20px] overflow-hidden bg-white/5"
              >
                <img
                  src={`/assets/routines/${img}`}
                  alt="UGC"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
