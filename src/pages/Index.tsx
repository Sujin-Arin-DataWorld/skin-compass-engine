import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  FlaskConical, ShieldCheck, Package, Sparkles,
  Droplets, ShieldAlert, Droplet, Timer, Sun, Layers, Shield, CircleDot, Leaf,
  ChevronLeft, ChevronRight, ShoppingBag, Check, Loader2,
  Camera, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import RecheckBanner from "@/features/results/components/RecheckBanner";
import { useI18nStore, phase1T } from "@/store/i18nStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import type { AxisKey, Product } from "@/engine/types";
import type { LucideIcon } from "lucide-react";
import { tokens, brand, button } from "@/lib/designTokens";
import AISkinAnalysisHero from "@/components/home/AISkinAnalysisHero";
import AIScanOverlay from "@/components/hero/AIScanOverlay";
import { HeroCtaButtons } from "@/components/hero/HeroCtaButtons";
import { SLIDE1_COPY, SLIDE2_COPY, HERO_CTA, type HeroLang } from "@/constants/hero-copy";

// ── New Modular Components ────────────────────────────────────────────────────
import { LandingHero } from "@/components/home/LandingHero";
import { TrustBadges } from "@/components/home/TrustBadges";
import { HowItWorks } from "@/components/home/HowItWorks";
import { InteractiveFunnel } from "@/components/home/InteractiveFunnel";
import { CommunityTrust } from "@/components/home/CommunityTrust";
import { StickyBottomCta } from "@/components/home/StickyBottomCta";

// ── Intent-based prefetching — preload lazy chunks on hover/touch ─────────────
const prefetchSkinAnalysis = () => { import("./SkinAnalysisPage"); };
const prefetchDiagnosis    = () => { import("./Diagnosis"); };

// ── Design tokens (consumed from designTokens.ts via tokens() helper) ─────────
const BRONZE = "var(--ssl-accent-deep)";  // kept for non-active icon fallback

// ── Concern map ───────────────────────────────────────────────────────────────
const CONCERN_KEYS = ["sebum", "sensitivity", "hydration", "aging", "pigment", "texture", "barrier", "pores", "neuro"] as const;
type ConcernKey = typeof CONCERN_KEYS[number];

const CONCERN_META: Record<ConcernKey, { axis: AxisKey; icon: LucideIcon }> = {
  sebum: { axis: "seb", icon: Droplets },
  sensitivity: { axis: "sen", icon: ShieldAlert },
  hydration: { axis: "hyd", icon: Droplet },
  aging: { axis: "aging", icon: Timer },
  pigment: { axis: "pigment", icon: Sun },
  texture: { axis: "texture", icon: Layers },
  barrier: { axis: "bar", icon: Shield },
  pores: { axis: "texture", icon: CircleDot },
  neuro: { axis: "sen", icon: Leaf },
};

// ── Hero slide images (2 slides: female model + male AI scan) ─────────────────
const HERO_IMAGES = [
  "/assets/hero-face.png",       // Slide 1: female model close-up
  "/assets/hero-ai-scan.png",    // Slide 2: male model + data overlay
];

type CartBtnState = "idle" | "adding" | "added";

// ── Hero Slider ───────────────────────────────────────────────────────────────
function HeroSlider({ accent, accentDeep, isDark, language }: {
  accent: string;
  accentDeep: string;
  isDark: boolean;
  language: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Build 2-slide array from dedicated constants
  const lang = language as HeroLang;
  const slide1 = SLIDE1_COPY[lang] ?? SLIDE1_COPY.en;
  const slide2 = SLIDE2_COPY[lang] ?? SLIDE2_COPY.en;
  const allSlides: { id?: string; headline: string; sub: string }[] = [
    slide1,      // female model
    slide2,      // male model + AI scan overlay
  ];

  // No autoplay — manual swipe only
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 'clamp(360px, 78svh, 680px)' }}>
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full touch-pan-y">
          {HERO_IMAGES.map((img, i) => {
            // Robust slide identification via id field (not magic index)
            const isAIScanSlide = (allSlides[i] as { id?: string })?.id === 'ai-scan';
            // Ghost button color: adapt for light/dark + slide 4
            const ghostColor = (isAIScanSlide || isDark) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)';
            const ghostBorder = (isAIScanSlide || isDark) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

            return (
            <div key={i} className="relative flex-[0_0_100%] h-full min-w-0">
              {isAIScanSlide ? (
                <>
                  {/* Slide 2: dark base background (fullscreen) */}
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, #0a0d12 0%, #111418 50%, #0d1210 100%)"
                        : "linear-gradient(135deg, #0e1114 0%, #141a1e 50%, #0f1612 100%)",
                    }}
                  />
                  {/* Group: portrait + overlay + data tags — full size, no scale */}
                  <div
                    className="absolute inset-0 z-[1] md:translate-y-0"
                  >
                    <img
                      src={img}
                      alt={allSlides[i]?.headline ?? ""}
                      className="absolute inset-0 w-full h-full object-cover object-top md:translate-x-[13%] md:object-center"
                      loading="lazy"
                    />
                    {/* Overlay wrapper: data tags + scan line anchored to image */}
                    {current === i && (
                      <div className="absolute inset-0 z-[5] pointer-events-none">
                        <div className="absolute top-0 left-0 w-full md:left-[37%] md:w-[50%] h-full">
                          <AIScanOverlay />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <img
                  src={img}
                  alt={allSlides[i]?.headline ?? ""}
                  className={`absolute inset-0 w-full h-full object-cover ${i === 0 ? 'object-[center_15%] md:object-[92%_center]' : ''}`}
                  style={{ zIndex: 0 }}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              )}
              {/* Dark gradient overlay — mobile: bottom-heavy, desktop: left-to-right */}
              {isAIScanSlide ? (
                <>
                  {/* AI scan mobile gradient: starts at 50% for clean face/text zone split */}
                  <div
                    className="absolute inset-0 pointer-events-none md:hidden"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05) 65%, transparent 100%)",
                      zIndex: 2,
                    }}
                  />
                  {/* AI scan desktop gradient */}
                  <div
                    className="absolute inset-0 pointer-events-none hidden md:block"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.05) 100%)",
                      zIndex: 2,
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Mobile gradient: bottom-heavy for face visibility */}
                  <div
                    className="absolute inset-0 pointer-events-none md:hidden"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0.03) 100%)",
                      zIndex: 1,
                    }}
                  />
                  {/* Desktop gradient: left-to-right for landscape */}
                  <div
                    className="absolute inset-0 pointer-events-none hidden md:block"
                    style={{
                      background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)",
                      zIndex: 1,
                    }}
                  />
                </>
              )}
              {/* Dreamy mist overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isAIScanSlide
                    ? "radial-gradient(ellipse 50% 60% at 75% 30%, rgba(201,169,110,0.08) 0%, rgba(45,107,74,0.06) 50%, transparent 100%)"
                    : isDark
                      ? "radial-gradient(ellipse 70% 60% at 72% 25%, rgba(45,107,74,0.32) 0%, rgba(160,130,80,0.14) 55%, transparent 100%)"
                      : "radial-gradient(ellipse 70% 60% at 72% 25%, rgba(122,158,130,0.50) 0%, rgba(45,79,57,0.22) 55%, transparent 100%)",
                  zIndex: isAIScanSlide ? 3 : 2,
                  mixBlendMode: isAIScanSlide ? "normal" : isDark ? "screen" : "multiply",
                }}
              />
              {/* Soft inset border glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: isDark
                    ? "inset 0 0 140px rgba(45,107,74,0.22), inset 0 -60px 80px rgba(160,130,80,0.10)"
                    : "inset 0 0 140px rgba(122,158,130,0.28), inset 0 -60px 80px rgba(45,79,57,0.12)",
                  zIndex: isAIScanSlide ? 4 : 3,
                }}
              />
              {/* Text + CTA — sits in bottom zone */}
              <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-20 px-6 md:px-20 lg:px-28" style={{ zIndex: 10 }}>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 12 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-3 md:mb-4 notranslate"
                  style={{ color: accent, fontFamily: "var(--font-sans)" }}
                  translate="no"
                >
                  S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 16 }}
                  transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={`text-white ${(i === 0 || i === 1) ? 'text-[26px]' : 'text-3xl'} md:text-5xl lg:text-5xl xl:text-6xl leading-[1.15] ${isAIScanSlide ? 'mb-3' : 'mb-2 md:mb-5'} font-light`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {allSlides[i]?.headline?.split('\n').map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 12 }}
                  transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className={`text-white/80 text-sm md:text-lg leading-relaxed ${isAIScanSlide ? 'mb-6' : 'mb-3 md:mb-8'} max-w-lg break-keep`}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {allSlides[i]?.sub?.split('\n').map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </motion.p>
                {/* ── Premium Dual CTA (gold shimmer + glass) ── */}
                <div
                  onMouseEnter={() => { prefetchSkinAnalysis(); prefetchDiagnosis(); }}
                  onTouchStart={() => { prefetchSkinAnalysis(); prefetchDiagnosis(); }}
                >
                  <HeroCtaButtons
                    lang={lang}
                    onPrimary={() => { useDiagnosisStore.getState().reset(); navigate('/skin-analysis'); }}
                    onSecondary={() => { useDiagnosisStore.getState().reset(); navigate('/diagnosis'); }}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-3" style={{ zIndex: 20 }}>
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              minWidth: 0,
              minHeight: 0,
              padding: 0,
              width: current === i ? "1.25rem" : "0.375rem",
              height: "0.375rem",
              background: current === i ? accent : "rgba(255,255,255,0.45)",
            }}
          />
        ))}
      </div>
    </section>
  );
}

// ── USP Strip ─────────────────────────────────────────────────────────────────
function UspStrip({ items, accent, isDark }: { items: { label: string }[]; accent: string; isDark: boolean }) {
  const icons = [FlaskConical, ShieldCheck, Package, Sparkles];
  return (
    <section className="border-b border-stone-100 dark:border-white/[0.06] bg-white dark:bg-transparent">
      <div className="mx-auto max-w-5xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map((item, i) => {
          const Icon = icons[i] ?? Sparkles;
          return (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'var(--ssl-accent-bg)' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--ssl-accent)' }} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">{item.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 9 Skin Concerns ───────────────────────────────────────────────────────────
function ConcernSection({
  title, sub, concernLabels, noProducts, products, cartStates, onAddToCart, accent, isDark, addLabel,
}: {
  title: string; sub: string;
  concernLabels: Record<ConcernKey, string>;
  noProducts: string;
  products: Product[];
  cartStates: Record<string, CartBtnState>;
  onAddToCart: (product: Product) => void;
  accent: string;
  isDark: boolean;
  addLabel: string;
}) {
  const [active, setActive] = useState<ConcernKey | null>(null);
  const { language } = useI18nStore();

  // designTokens — theme-aware values
  const theme = isDark ? brand.dark : brand.light;
  const ghostBtn = isDark ? button.accentGhost.dark : button.accentGhost.light;
  const idleBtn = isDark ? button.ghost.dark : button.ghost.light;

  const filteredProducts = active
    ? products.filter((p) => p.target_axes?.includes(CONCERN_META[active].axis))
    : [];

  return (
    <section className="bg-stone-50 dark:bg-transparent py-20 px-5 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <p className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4 notranslate" style={{ color: theme.accent }} translate="no">
            S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
          </p>
          <h2
            className="text-2xl md:text-3xl font-light mb-4"
            style={{ fontFamily: "var(--font-display)", color: theme.text }}
          >
            {title}
          </h2>
          <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: theme.textSecondary }}>{sub}</p>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-9 gap-3">
          {CONCERN_KEYS.map((key) => {
            const { icon: Icon } = CONCERN_META[key];
            const isActive = active === key;
            // Focus-dimming: when something is selected, dim the rest
            const isDimmed = active !== null && !isActive;

            return (
              <motion.button
                key={key}
                onClick={() => setActive(isActive ? null : key)}
                whileTap={{ scale: 0.96 }}
                className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  background: isActive ? ghostBtn.background : idleBtn.background,
                  border: isActive ? ghostBtn.border : idleBtn.border,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: isActive ? `0 4px 16px ${theme.accentBg}` : "none",
                  opacity: isDimmed ? 0.4 : 1,
                  filter: isDimmed ? "grayscale(40%)" : "none",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300"
                  style={{ background: isActive ? theme.accentBg : "rgba(148,126,92,0.07)" }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? theme.accent : theme.textTertiary }}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </div>
                <span
                  className="text-xs font-medium text-center leading-tight transition-colors duration-300"
                  style={{ color: isActive ? theme.accent : theme.textSecondary, fontFamily: "var(--font-sans)" }}
                >
                  {concernLabels[key]}
                </span>

                {/* Selection dot indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: theme.accent }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-6 pb-1">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-sm md:text-base py-8" style={{ color: theme.textTertiary }}>{noProducts}</p>
                ) : (
                  <div
                    className="flex gap-4 overflow-x-auto pb-3"
                    style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                  >
                    {filteredProducts.map((product) => {
                      const state = cartStates[product.id] ?? "idle";
                      const pn = product.name;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const name = typeof pn === "string" ? pn : ((pn as any)[language] ?? pn.de ?? pn.en);
                      return (
                        <div
                          key={product.id}
                          className="flex-shrink-0 w-44 md:w-52 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            scrollSnapAlign: "start",
                            background: theme.bgCard,
                            border: `1px solid ${theme.border}`,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
                          }}
                        >
                          <Link to={`/formula/${product.id}`}>
                            <div className="relative w-full aspect-square flex items-center justify-center p-3 overflow-hidden" style={{ background: isDark ? "rgba(0,0,0,0.12)" : "#fafaf8" }}>
                              <div className="w-12 h-12 rounded-full" style={{ background: theme.accentBg }} />
                              <img src={`/productsImage/${product.id}.jpg`} alt={name} className="absolute inset-0 w-full h-full object-contain p-3" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          </Link>
                          <div className="p-3">
                            <Link to={`/formula/${product.id}`}>
                              <p className="text-xs font-medium line-clamp-2 mb-1 leading-snug hover:opacity-70 transition-opacity" style={{ color: theme.text }}>
                                {name}
                              </p>
                            </Link>
                            <p className="text-sm font-medium mb-2" style={{ color: theme.accent }}>
                              €{(product.price ?? product.price_eur).toFixed(2)}
                            </p>
                            <button
                              onClick={() => onAddToCart(product)}
                              disabled={state === "adding"}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 disabled:opacity-50"
                              style={{
                                background: state === "added"
                                  ? "rgba(74,222,128,0.08)"
                                  : idleBtn.background,
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: state === "added"
                                  ? "1px solid rgba(74,222,128,0.3)"
                                  : idleBtn.border,
                                boxShadow: isDark ? "0 1px 8px rgba(45,107,74,0.05)" : "0 1px 8px rgba(94,139,104,0.06)",
                              }}
                            >
                              {state === "adding" && <Loader2 className="w-3 h-3 animate-spin" style={{ color: theme.textTertiary }} />}
                              {state === "added" && <Check className="w-3 h-3 text-green-500" strokeWidth={2} />}
                              {state === "idle" && <ShoppingBag className="w-3 h-3" style={{ color: theme.textTertiary }} strokeWidth={1.5} />}
                              <span style={{ color: state === "added" ? (isDark ? "#4ade80" : "#16a34a") : theme.textSecondary }}>
                                {state === "adding" ? "…" : state === "added" ? "✓" : addLabel}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Routine Showcase (La Mer stacked grid) ────────────────────────────────────
// ARCHITECT NOTE: This must be an ARRAY to align with the numeric index 'i' in the map loop.
// Fixed from previous implementation object key to array index.
const ROUTINE_MOOD_IMAGES = [
  '/assets/routines/beginner-mood.jpg',
  '/assets/routines/full-mood2.jpg',
  '/assets/routines/premium-mood.jpg',
];

// Fallback asset path if local images fail
const MOOD_IMAGE_FALLBACK = "/assets/routines/routine-placeholder.jpg"; // (Create this asset or use a color)

// Gradient Overlays optimized for light/dark mode text legibility
const overlayGradients = {
  // Light mode: Stronger bottom dimming to protect dark accent text (the green)
  light: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)",
  // Dark mode: Integrated, deeper dimming that looks premium with white text
  dark: "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.3) 100%)",
};

function RoutineShowcase({ title, sub, cards, products, cartStates, onAddToCart, accent, isDark, addLabel }: {
  title: string; sub: string;
  cards: { badge: string; title: string; desc: string; cta: string }[];
  products: Product[];
  cartStates: Record<string, CartBtnState>;
  onAddToCart: (product: Product) => void;
  accent: string;
  isDark: boolean;
  addLabel: string;
}) {
  const { language } = useI18nStore();
  
  const routineSlices = [
    products.slice(0, Math.min(products.length, 6)),
    products.slice(0, Math.min(products.length, 8)),
    products,
  ];

  return (
    <section className="py-20 px-5 md:px-10 bg-white dark:bg-transparent">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4 notranslate" style={{ color: accent }} translate="no">
            S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
          </p>
          <h2
            className="text-2xl md:text-3xl font-light text-gray-900 dark:text-gray-100 mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">{sub}</p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {cards.map((card, i) => {
            const rowProducts = routineSlices[i] ?? products;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8"
              >
                {/* Left: Mood image with title overlay */}
                <div
                  className="md:col-span-5 relative rounded-3xl overflow-hidden group bg-stone-100 dark:bg-black/10"
                  style={{ minHeight: "300px" }}
                >
                  {/* UPDATE: Added onError handling for Mood Images */}
                  <img
                    src={ROUTINE_MOOD_IMAGES[i]}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                    onError={(e) => {
                      // Architect Decision: If asset fails, apply placeholder asset or hide with a background color fallback.
                      e.currentTarget.onerror = null; // prevents infinite loop
                      e.currentTarget.src = MOOD_IMAGE_FALLBACK;
                      // Alternative: Hide the img and let the container background show (better for dynamic color background).
                      // e.currentTarget.style.opacity = '0';
                    }}
                  />
                  
                  {/* UPDATE: Conditional Dimmed Overlay for Contrast (Approached per specific feedback) */}
                  <div
                    className="absolute inset-0 transition-all duration-300"
                    style={{ 
                      // Apply stronger "light" overlay in Light Mode to protect dark text.
                      background: isDark ? overlayGradients.dark : overlayGradients.light,
                    }}
                  />
                  
                  <div className="absolute bottom-0 left-0 p-6 md:p-8">
                    <span
                      className="text-xs tracking-[0.2em] md:tracking-[0.25em] uppercase font-semibold block mb-2 drop-shadow-md"
                      style={{ color: accent, fontFamily: "var(--font-sans)" }}
                    >
                      {card.badge}
                    </span>
                    <h3
                      className="text-3xl lg:text-4xl font-light text-white whitespace-nowrap mb-2"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed max-w-[200px] whitespace-pre-line drop-shadow-md">{card.desc}</p>
                    
                    {/* FEEDBACK ADDRESS: The CTA Link contrast. We need either: */}
                    {/* 1. Use light accent text (white/very light green). (Current design uses standard accent). */}
                    {/* 2. Strengthen the overlay. I strengthened the overlay to the MAX (0.95), but dark green text is still hard. */}
                    {/* RECOMMENDATION: We SHOULD switch text to white with a text-shadow OR dynamic light accent if it is a moody image. */}
                    
                    <Link
                      to="/diagnosis"
                      onMouseEnter={prefetchDiagnosis}
                      onTouchStart={prefetchDiagnosis}
                      className="inline-flex items-center mt-6 text-sm md:text-base font-medium tracking-wide hover:opacity-75 transition-opacity drop-shadow-md"
                      style={{ 
                        // Architect Recommendation: Conditional text color.
                        // isDark ? accent : "white"
                        color: accent, 
                        fontFamily: "var(--font-sans)" 
                      }}
                    >
                      {card.cta} →
                    </Link>
                  </div>
                </div>

                {/* Right: Horizontal scroll product strip (Unchanged logic, styles for products added in previous turn) */}
                <div className="md:col-span-7 flex items-center">
                  {rowProducts.length === 0 ? (
                    <div className="flex items-center justify-center w-full h-48 rounded-2xl border border-dashed border-stone-200 dark:border-white/10">
                      <p className="text-sm text-gray-400">{language === "ko" ? "제품 준비 중" : language === "de" ? "Produkte kommen bald" : "Products coming soon"}</p>
                    </div>
                  ) : (
                    <div
                      className="flex gap-4 overflow-x-auto pb-3 w-full"
                      style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                    >
                      {rowProducts.map((product) => {
                        const state = cartStates[product.id] ?? "idle";
                        const pn = product.name;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const name = typeof pn === "string" ? pn : ((pn as any)[language] ?? pn.de ?? pn.en);
                        return (
                          <div
                            key={product.id}
                            className="flex-shrink-0 w-44 md:w-52 rounded-2xl overflow-hidden border border-stone-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-[rgba(94,139,104,0.1)] dark:hover:shadow-black/30 dark:hover:border-[var(--ssl-accent)]/25 active:scale-[0.98]"
                            style={{ scrollSnapAlign: "start" }}
                          >
                            <Link to={`/formula/${product.id}`}>
                              <div className="relative w-full aspect-square bg-stone-50 dark:bg-black/[0.12] flex items-center justify-center p-3 overflow-hidden">
                                <div className="w-12 h-12 rounded-full" style={{ background: "rgba(45,107,74,0.08)" }} />
                                <img src={`/productsImage/${product.id}.jpg`} alt={name} className="absolute inset-0 w-full h-full object-contain p-3 transition-opacity duration-300" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                            </Link>
                            <div className="p-3">
                              <Link to={`/formula/${product.id}`}>
                                <p className="text-xs font-medium line-clamp-2 text-gray-800 dark:text-gray-200 mb-1 leading-snug hover:opacity-70 transition-opacity">
                                  {name}
                                </p>
                              </Link>
                              <p className="text-sm font-medium mb-2" style={{ color: accent }}>
                                €{(product.price ?? product.price_eur).toFixed(2)}
                              </p>
                              <button
                                onClick={() => onAddToCart(product)}
                                disabled={state === "adding"}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 disabled:opacity-50"
                                style={{
                                  background: state === "added"
                                    ? "rgba(74,222,128,0.08)"
                                    : isDark ? "rgba(45,107,74,0.04)" : "rgba(94,139,104,0.04)",
                                  backdropFilter: "blur(12px)",
                                  WebkitBackdropFilter: "blur(12px)",
                                  border: state === "added"
                                    ? "1px solid rgba(74,222,128,0.3)"
                                    : isDark ? "1px solid rgba(45,107,74,0.12)" : "1px solid rgba(94,139,104,0.15)",
                                  boxShadow: isDark ? "0 1px 8px rgba(45,107,74,0.05)" : "0 1px 8px rgba(94,139,104,0.06)",
                                }}
                              >
                                {state === "adding" && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                                {state === "added" && <Check className="w-3 h-3 text-green-500" strokeWidth={2} />}
                                {state === "idle" && <ShoppingBag className="w-3 h-3 text-gray-400" strokeWidth={1.5} />}
                                <span className={state === "added" ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                                  {state === "adding" ? "…" : state === "added" ? "✓" : addLabel}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Diagnosis Banner ──────────────────────────────────────────────────────────
function DiagnosisBanner({ headline, sub, accent, accentDeep, isDark, language }: { headline: string; sub: string; accent: string; accentDeep: string; isDark: boolean; language: string }) {
  const navigate = useNavigate();
  const lang = language as HeroLang;

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "420px" }}>
      <img
        src="/assets/hero-face.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.1) 100%)" }}
      />
      <div className="relative flex flex-col justify-center items-start h-full min-h-[420px] px-8 md:px-20 lg:px-28">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-5 notranslate"
          style={{ color: accent }}
          translate="no"
        >
          S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-4xl md:text-5xl font-light mb-5 leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {headline.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.14 }}
          className="text-white/65 text-base md:text-lg mb-9 max-w-sm leading-relaxed whitespace-pre-line break-keep"
        >
          {sub}
        </motion.p>

        {/* ── Premium Dual CTA (gold shimmer + glass) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
        >
          <HeroCtaButtons
            lang={lang}
            onPrimary={() => { useDiagnosisStore.getState().reset(); navigate('/skin-analysis'); }}
            onSecondary={() => { useDiagnosisStore.getState().reset(); navigate('/diagnosis'); }}
          />
        </motion.div>
      </div>
    </section>
  );
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function Newsletter({
  headline, sub, placeholder, submit, gdprText, accent, accentDeep, isDark,
}: {
  headline: string; sub: string; placeholder: string; submit: string; gdprText: string; accent: string; accentDeep: string; isDark: boolean;
}) {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const { language } = useI18nStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !agreed) return;
    setDone(true);
    toast.success(language === "ko" ? "10% 할인 코드가 발송됩니다!" : language === "de" ? "10% Rabatt-Code wird gesendet!" : "10% discount code will be sent!");
  };

  return (
    <section className="bg-stone-50 dark:bg-transparent py-20 px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-lg text-center"
      >
        <p className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4 notranslate" style={{ color: accent }} translate="no">
          S<span>k</span>in S<span>t</span>rategy L<span>a</span>b
        </p>
        <h2
          className="text-2xl md:text-3xl font-light text-gray-900 dark:text-gray-100 mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {headline}
        </h2>
        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed whitespace-pre-line">{sub}</p>

        {done ? (
          <div className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
            <Check className="w-4 h-4" strokeWidth={2} /> {submit} ✓
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                required
                className="flex-1 rounded-full border border-stone-200 dark:border-white/15 bg-white dark:bg-white/[0.05] dark:backdrop-blur-sm px-5 py-3 text-sm md:text-base text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500/50 dark:focus:border-[var(--ssl-accent)]/50 transition-colors"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                className="shrink-0 rounded-full px-6 py-3 text-sm md:text-base font-semibold tracking-wide hover:shadow-[0_0_0_4px_rgba(94,139,104,0.12),0_8px_32px_rgba(45,79,57,0.3)] dark:hover:shadow-[0_0_0_4px_rgba(45,107,74,0.12),0_8px_32px_rgba(45,107,74,0.35)] active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                  color: isDark ? "#F5F5F7" : "#fff",
                  boxShadow: isDark ? "0 6px 20px rgba(45,107,74,0.35)" : "0 6px 20px rgba(45,79,57,0.28)",
                  border: "none", cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {submit}
              </motion.button>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer text-left">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded cursor-pointer accent-emerald-600 dark:accent-[var(--ssl-accent)]"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                {gdprText}{" "}
                <Link to="/datenschutz" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {language === 'ko' ? '개인정보 처리방침' : language === 'de' ? 'Datenschutz' : 'Privacy Policy'}
                </Link>
              </span>
            </label>
          </form>
        )}
      </motion.div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { language } = useI18nStore();
  const lang = language as HeroLang;
  const p1 = phase1T[language] ?? phase1T.de;
  const { products } = useProductStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  const [cartStates, setCartStates] = useState<Record<string, CartBtnState>>({});

  const handleAddToCart = useCallback((product: Product) => {
    setCartStates((prev) => ({ ...prev, [product.id]: "adding" }));
    addItem(product);
    setTimeout(() => {
      setCartStates((prev) => ({ ...prev, [product.id]: "added" }));
      toast.success(language === "ko" ? "장바구니에 추가되었습니다" : language === "de" ? "Zum Warenkorb hinzugefügt" : "Added to cart");
      setTimeout(() => {
        setCartStates((prev) => ({ ...prev, [product.id]: "idle" }));
      }, 1500);
    }, 320);
  }, [addItem, language]);

  return (
    <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#0A0D12]">
      <Navbar />
      <div className="h-12 md:h-[52px]" />
      <RecheckBanner />

      <main>
        <LandingHero lang={lang} />
        <HowItWorks lang={lang} />
        
        {/* Ihr Hautanliegen */}
        <InteractiveFunnel
          title={p1.home.concernTitle}
          sub={p1.home.concernSub}
          concernLabels={p1.concerns as Record<ConcernKey, string>}
          noProducts={p1.home.noProducts}
          products={products}
          cartStates={cartStates}
          onAddToCart={handleAddToCart}
          addLabel={language === "ko" ? "담기" : language === "de" ? "Hinzufügen" : "Add"}
        />

        {/* Routine Showcase ("Speziell für Sie") */}
        <RoutineShowcase
          title={p1.home.routineTitle}
          sub={p1.home.routineSub}
          cards={p1.home.routines as unknown as { badge: string; title: string; desc: string; cta: string }[]}
          products={products}
          cartStates={cartStates}
          onAddToCart={handleAddToCart}
          accent={isDark ? "var(--ssl-accent)" : "var(--ssl-accent-deep)"}
          isDark={isDark}
          addLabel={language === "ko" ? "담기" : language === "de" ? "Hinzufügen" : "Add"}
        />

        <CommunityTrust lang={lang} />
        
        <StickyBottomCta 
          lang={lang} 
          onPrimary={() => { useDiagnosisStore.getState().reset(); navigate('/skin-analysis'); }}
        />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
