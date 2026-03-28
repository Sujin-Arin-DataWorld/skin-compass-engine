/**
 * About.tsx — Brand story & philosophy page
 *
 * Sections:
 *  1. Hero — full-bleed about1.jpg with brand tagline overlay
 *  2. Logo + brand pillars (4 icons)
 *  3. Brand manifesto (trilingual)
 *  4. Second image — about2.jpg
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Cpu, RefreshCw, FlaskConical, Droplets } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useI18nStore } from "@/store/i18nStore";
import { tokens } from "@/lib/designTokens";

// ── i18n ─────────────────────────────────────────────────────────────────────

const ABOUT_COPY = {
  ko: {
    pageTitle: "회사 소개 | SkinStrategyLab",
    heroTag: "About Us",
    heroHeadline: "당신의 평생\n피부 나침반",
    heroSub: "Skin Strategy Lab",
    pillars: [
      { icon: "cpu", label: "KI-gestützte\nPräzisions-Analyse", title: "AI 정밀 분석" },
      { icon: "cycle", label: "Intelligente\nZyklus-Steuerung", title: "적응형 피부 지능" },
      { icon: "flask", label: "Wissenschaftlich belegte\nWirksamkeit", title: "과학 기반 효능" },
      { icon: "drop", label: "Lückenlose\nTransparenz", title: "타협 없는 진실성" },
    ],
    manifesto: [
      "넘쳐나는 정보와 쏟아지는 신제품 속, 내 피부에 '진짜' 맞는 제품을 찾기란 쉽지 않습니다.",
      "Skin Strategy Lab은 AI 사진 분석, 생활습관 분석, 부위별 정밀 설문을 결합한 하이브리드 맞춤형 솔루션입니다.",
      "우리는 생애주기에 따라 변하는 당신의 피부결과 타입을 평생 추적 관찰하여, 지금 이 순간 가장 필요한 최적의 제품을 제안합니다.",
      "타협은 없습니다. 피부 임상 논문으로 검증된 성분, 투명하게 공개된 함량까지. 확실한 효과를 자부하며 엄선한 진짜 스킨케어만을 큐레이션합니다.",
      "믿고 살 수 있는 단 하나의 뷰티 플랫폼, 이제 Skin Strategy Lab을 믿고 당신의 피부를 맡겨보세요.",
    ],
    manifestoTitle: "당신의 평생 피부 나침반",
    sectionLabel: "Our Philosophy",
  },
  en: {
    pageTitle: "About Us | SkinStrategyLab",
    heroTag: "About Us",
    heroHeadline: "Your Lifelong\nSkincare Compass",
    heroSub: "Skin Strategy Lab",
    pillars: [
      { icon: "cpu", label: "Precision\nAI Analysis", title: "Precision AI Analysis" },
      { icon: "cycle", label: "Adaptive Skin\nIntelligence", title: "Adaptive Skin Intelligence" },
      { icon: "flask", label: "Science-Driven\nEfficacy", title: "Science-Driven Efficacy" },
      { icon: "drop", label: "Uncompromising\nIntegrity", title: "Uncompromising Integrity" },
    ],
    manifesto: [
      "Lost in a sea of endless beauty trends and new products? Finding what truly works for your skin shouldn\u2019t be a guessing game.",
      "Skin Strategy Lab is your complete hybrid personalized solution, combining AI photo analysis, lifestyle analysis, and targeted skin-zone surveys.",
      "We track your skin\u2019s evolving texture and type across every life stage, recommending exactly what you need, right when you need it.",
      "We don\u2019t compromise. Backed by clinical dermatology papers and fully transparent ingredient concentrations, we confidently curate only highly effective products that deliver undeniable results.",
      "Stop guessing\u2014trust our platform and experience skincare that truly works.",
    ],
    manifestoTitle: "Your Lifelong Skincare Compass",
    sectionLabel: "Our Philosophy",
  },
  de: {
    pageTitle: "Über uns | SkinStrategyLab",
    heroTag: "Über uns",
    heroHeadline: "Ihr lebenslanger\nHautpflege-Kompass",
    heroSub: "Skin Strategy Lab",
    pillars: [
      { icon: "cpu", label: "KI-gestützte\nPräzisions-Analyse", title: "KI-Präzisionsanalyse" },
      { icon: "cycle", label: "Intelligente\nZyklus-Steuerung", title: "Intelligente Zyklus-Steuerung" },
      { icon: "flask", label: "Wissenschaftlich belegte\nWirksamkeit", title: "Wissenschaftliche Wirksamkeit" },
      { icon: "drop", label: "Lückenlose\nTransparenz", title: "Lückenlose Transparenz" },
    ],
    manifesto: [
      "Verloren in der endlosen Flut von Beauty-Trends und neuen Produkten? Die richtige Pflege zu finden, sollte kein Rätselraten sein.",
      "Skin Strategy Lab ist Ihre hybride, personalisierte Lösung, die KI-Fotoanalyse mit Lebensstil-Analysen und gezielten Zonen-Fragebögen vereint.",
      "Wir begleiten Ihre sich verändernde Hautstruktur und Ihren Hauttyp in jeder Lebensphase und empfehlen stets genau das, was Sie in diesem Moment benötigen.",
      "Wir machen keine Kompromisse. Basierend auf dermatologischen Studien und absolut transparenten Wirkstoffkonzentrationen kuratieren wir voller Überzeugung nur hochwirksame Produkte, die echte Ergebnisse liefern.",
      "Vertrauen Sie unserer Plattform und erleben Sie Hautpflege, die wirklich funktioniert.",
    ],
    manifestoTitle: "Ihr lebenslanger Hautpflege-Kompass",
    sectionLabel: "Unsere Philosophie",
  },
} as const;

const ICON_MAP = {
  cpu: Cpu,
  cycle: RefreshCw,
  flask: FlaskConical,
  drop: Droplets,
} as const;

// ── Anim presets ──────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ── Component ───────────────────────────────────────────────────────────────

export default function About() {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tok = tokens(isDark);

  const copy = ABOUT_COPY[language as keyof typeof ABOUT_COPY] ?? ABOUT_COPY.en;

  useEffect(() => {
    const prev = document.title;
    document.title = copy.pageTitle;
    return () => { document.title = prev; };
  }, [copy.pageTitle]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: tok.bg }}>
      <Navbar />

      {/* ━━━ SECTION 1 — Hero image ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(420px, 75svh, 700px)" }}>
        <img
          src="/assets/about1.jpg"
          alt="Skin Strategy Lab"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(45,107,74,0.18) 0%, transparent 100%)"
              : "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(94,139,104,0.15) 0%, transparent 100%)",
          }}
        />

        {/* Hero text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 md:pb-20 px-6">
          <motion.p
            {...fadeUp(0)}
            className="text-[0.58rem] tracking-[0.35em] uppercase font-medium mb-4"
            style={{ color: tok.accent, fontFamily: "var(--font-sans)" }}
          >
            {copy.heroTag}
          </motion.p>
          <motion.h1
            {...fadeUp(0.1)}
            className="text-white text-center text-[clamp(28px,6vw,48px)] leading-[1.15] font-light mb-3 whitespace-pre-line"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {copy.heroHeadline}
          </motion.h1>
          <motion.p
            {...fadeUp(0.2)}
            className="text-white/50 text-sm tracking-[0.15em] uppercase"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {copy.heroSub}
          </motion.p>
        </div>
      </section>

      {/* ━━━ SECTION 2 — Logo + Pillars ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 md:py-28 px-6" style={{ background: tok.bg }}>
        <div style={{ maxWidth: '960px', marginInline: 'auto' }}>
          {/* Logo */}
          <motion.div {...fadeUp(0)} className="flex justify-center mb-16">
            <img
              src="/SSL.png"
              alt="Skin Strategy Lab"
              className="h-12 md:h-16 object-contain"
              style={{ filter: isDark ? "brightness(1.1)" : "none" }}
            />
          </motion.div>

          {/* 4 Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {copy.pillars.map((pillar, i) => {
              const Icon = ICON_MAP[pillar.icon as keyof typeof ICON_MAP];
              return (
                <motion.div
                  key={i}
                  {...fadeUp(0.08 * i)}
                  className="flex flex-col items-center text-center gap-4 p-5 rounded-2xl transition-all duration-300"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
                    border: `1px solid ${tok.border}`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: tok.accentBg, border: `1px solid ${tok.accentBorder}` }}
                  >
                    <Icon size={22} style={{ color: tok.accent }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: tok.text, fontFamily: "var(--font-sans)" }}
                    >
                      {pillar.title}
                    </p>
                    <p
                      className="text-[11px] leading-relaxed whitespace-pre-line"
                      style={{ color: tok.textSecondary, fontFamily: "var(--font-sans)" }}
                    >
                      {pillar.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 3 — Brand Manifesto ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="py-20 md:py-28 px-6"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(45,107,74,0.04) 0%, transparent 100%)"
            : "linear-gradient(180deg, rgba(94,139,104,0.04) 0%, transparent 100%)",
        }}
      >
        <div style={{ maxWidth: '640px', marginInline: 'auto' }}>
          <motion.p
            {...fadeUp(0)}
            className="text-[0.58rem] tracking-[0.35em] uppercase font-medium mb-6 text-center"
            style={{ color: tok.accent, fontFamily: "var(--font-sans)" }}
          >
            {copy.sectionLabel}
          </motion.p>
          <motion.h2
            {...fadeUp(0.06)}
            className="text-2xl md:text-3xl font-light text-center mb-12 leading-snug"
            style={{ fontFamily: "var(--font-display)", color: tok.text }}
          >
            {copy.manifestoTitle}
          </motion.h2>

          <div className="space-y-5">
            {copy.manifesto.map((para, i) => (
              <motion.p
                key={i}
                {...fadeUp(0.06 + i * 0.06)}
                className="text-[15px] leading-[1.9]"
                style={{ color: tok.textSecondary, fontFamily: "var(--font-sans)" }}
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 4 — Second image ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(300px, 50svh, 520px)" }}>
        <img
          src="/assets/about2.jpg"
          alt="Skin Strategy Lab — Curated skincare"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(13,13,18,1) 0%, rgba(13,13,18,0.3) 50%, rgba(0,0,0,0.1) 100%)"
              : "linear-gradient(to top, rgba(250,250,248,1) 0%, rgba(250,250,248,0.3) 50%, rgba(0,0,0,0.05) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(45,107,74,0.12) 0%, transparent 100%)"
              : "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(94,139,104,0.08) 0%, transparent 100%)",
          }}
        />
      </section>

      <Footer />
    </div>
  );
}
