import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

// ── Trustpilot config ─────────────────────────────────────────────────────────
const TRUSTPILOT_BUSINESS_UNIT_ID = '69d2bef918012ef123c81d18';
const TRUSTPILOT_TEMPLATE_ID      = '56278e9abfbbba0bdcd568bc'; // Review Collector
const TRUSTPILOT_TOKEN            = '537cd804-2b36-42b0-ac08-229972e505ce';

// ── Behold config ─────────────────────────────────────────────────────────────
const BEHOLD_FEED_ID = 'J08oNpv7aSHY73AZmvaT';

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
      <div data-behold-id={BEHOLD_FEED_ID} />
    </motion.div>
  );
}


interface CommunityTrustProps {
  lang: 'ko' | 'en' | 'de';
}

const FALLBACK_COUNT = 0;

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
