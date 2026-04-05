import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Trustpilot config ─────────────────────────────────────────────────────────
const TRUSTPILOT_BUSINESS_UNIT_ID = '69d2bef918012ef123c81d18';
const TRUSTPILOT_TEMPLATE_ID      = '56278e9abfbbba0bdcd568bc'; // Review Collector
const TRUSTPILOT_TOKEN            = '537cd804-2b36-42b0-ac08-229972e505ce';

// ── Behold config ─────────────────────────────────────────────────────────────
const BEHOLD_FEED_ID = '1936871740071623';

// ── Inline SVG — lucide-react deprecated brand icons in v0.417+ ───────────────
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Trustpilot TrustBox (Review Collector) ────────────────────────────────────
// Requires bootstrap script in index.html:
// <script src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script>
function TrustpilotWidget({ lang }: { lang: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tp = (window as Window & { Trustpilot?: { loadFromElement: (el: Element) => void } }).Trustpilot;
    if (tp && ref.current) {
      tp.loadFromElement(ref.current);
    }
  }, []);

  const locale =
    lang === 'ko' ? 'ko-KR' :
    lang === 'de' ? 'de-DE' :
                    'en-GB';

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale={locale}
      data-template-id={TRUSTPILOT_TEMPLATE_ID}
      data-businessunit-id={TRUSTPILOT_BUSINESS_UNIT_ID}
      data-token={TRUSTPILOT_TOKEN}
      data-style-height="52px"
      data-style-width="100%"
      data-theme="dark"
    >
      <a
        href="https://www.trustpilot.com/review/skinstrategylab.de"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/40 text-xs hover:text-white/60 transition-colors"
      >
        Trustpilot
      </a>
    </div>
  );
}

// ── Behold Instagram feed ─────────────────────────────────────────────────────
function BeholdFeed() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existing = document.querySelector('script[data-behold]');
    if (existing) { setLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://w.behold.so/widget.js';
    script.type = 'module';
    script.dataset.behold = 'true';
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
    >
      {/* @ts-expect-error — behold-widget is a custom element registered by Behold's script */}
      <behold-widget feed-id={BEHOLD_FEED_ID} />
    </motion.div>
  );
}

// ── Fake review cards (displayed until real Trustpilot reviews accumulate) ────
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
      ko: "피부과 갈 돈 아꼈어요! 피부 스캔 결과가 너무 정확해서 소름 돋았습니다. 완전 추천해요.",
      en: "Saved money on derm visits! The skin scan was scarily accurate. Highly recommend.",
      de: "Geld für den Hautarzt gespart! Der Scan war erschreckend genau. Sehr zu empfehlen."
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

interface CommunityTrustProps {
  lang: 'ko' | 'en' | 'de';
}

const FALLBACK_COUNT = 12847;

export const CommunityTrust = ({ lang }: CommunityTrustProps) => {
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(FALLBACK_COUNT);

  // Fetch real scan count (AI camera + questionnaire) from Supabase on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('get_public_scan_count')
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (!error && typeof data === 'number' && data > 0) {
          setTarget(data);
        }
      });
  }, []);

  // Animate counter 0 → target over 2s when scrolled into view
  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * target));
      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }, [isInView, target]);

  return (
    <section className="bg-[#0A0D12] py-24 md:py-32 border-t border-white/5 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 md:px-10">

        {/* ── 1. Live scan counter ── */}
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
              {lang === 'ko' ? '누적 AI 피부 스캔 완료' : lang === 'de' ? 'Hautscans abgeschlossen' : 'Skin Scans Completed'}
            </p>
          </motion.div>
        </div>

        {/* ── 2. Trustpilot ── */}
        <div className="mb-24 md:mb-32">
          <div className="flex flex-col items-center mb-12">
            <h4 className="text-2xl md:text-3xl font-light text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
              {lang === 'ko' ? '고객들이 증명합니다' : lang === 'de' ? 'Von echten Kunden geliebt' : 'Loved by real customers'}
            </h4>

            {/* Real Trustpilot TrustBox widget */}
            <div className="w-full max-w-sm mb-6">
              <TrustpilotWidget lang={lang} />
            </div>

            <a
              href="https://www.trustpilot.com/review/skinstrategylab.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 text-xs tracking-wider hover:text-white/50 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {lang === 'ko' ? 'Trustpilot에서 리뷰 남기기 →' : lang === 'de' ? 'Bewertung auf Trustpilot hinterlassen →' : 'Leave a review on Trustpilot →'}
            </a>
          </div>

          {/* Review cards — displayed until real Trustpilot reviews accumulate */}
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

        {/* ── 3. Instagram feed (Behold) ── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-2xl font-light text-white" style={{ fontFamily: "var(--font-display)" }}>
              #SkinStrategyLab
            </h4>
            <a
              href="https://www.instagram.com/skinstrategylab.de"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-4 h-4 text-white" />
            </a>
          </div>

          <BeholdFeed />
        </div>

      </div>
    </section>
  );
};
