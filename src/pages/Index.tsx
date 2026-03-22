import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  FlaskConical, ShieldCheck, Package, Sparkles,
  Droplets, ShieldAlert, Droplet, Timer, Sun, Layers, Shield, CircleDot, Leaf,
  ChevronLeft, ChevronRight, ShoppingBag, Check, Loader2,
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
import type { AxisKey, Product } from "@/engine/types";
import type { LucideIcon } from "lucide-react";
import { tokens } from "@/lib/designTokens";

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

// ── Hero slide images ─────────────────────────────────────────────────────────
const HERO_IMAGES = [
  "/assets/hero-face.png",
  "/assets/hero-model.png",
  "/assets/kbeauty-lineup.png",
];

type CartBtnState = "idle" | "adding" | "added";

// ── Hero Slider ───────────────────────────────────────────────────────────────
function HeroSlider({ slides, accent, accentDeep, isDark }: { slides: { headline: string; sub: string; cta: string }[], accent: string, accentDeep: string, isDark: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "min(75svh, 720px)" }}>
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full touch-pan-y">
          {HERO_IMAGES.map((img, i) => (
            <div key={i} className="relative flex-[0_0_100%] h-full min-w-0">
              <img
                src={img}
                alt={slides[i]?.headline ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
                loading={i === 0 ? "eager" : "lazy"}
              />
              {/* Dark gradient: left-to-right text readability */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)", zIndex: 1 }}
              />
              {/* Dreamy mist overlay — sage green (light) / champagne gold (dark) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isDark
                    ? "radial-gradient(ellipse 70% 60% at 72% 25%, rgba(45,107,74,0.32) 0%, rgba(160,130,80,0.14) 55%, transparent 100%)"
                    : "radial-gradient(ellipse 70% 60% at 72% 25%, rgba(122,158,130,0.50) 0%, rgba(45,79,57,0.22) 55%, transparent 100%)",
                  zIndex: 2,
                  mixBlendMode: isDark ? "screen" : "multiply",
                }}
              />
              {/* Soft inset border glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: isDark
                    ? "inset 0 0 140px rgba(45,107,74,0.22), inset 0 -60px 80px rgba(160,130,80,0.10)"
                    : "inset 0 0 140px rgba(122,158,130,0.28), inset 0 -60px 80px rgba(45,79,57,0.12)",
                  zIndex: 3,
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 px-8 md:px-20 lg:px-28" style={{ zIndex: 4 }}>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 12 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4"
                  style={{ color: accent, fontFamily: "var(--font-sans)" }}
                >
                  Skin Strategy Lab
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 16 }}
                  transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="text-white text-4xl md:text-5xl lg:text-5xl xl:text-6xl leading-[1.15] mb-5 font-light break-keep"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {slides[i]?.headline?.split('\n').map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
                      {idx < arr.length - 1 && (
                        <>
                          <br className="hidden md:block" />
                          <span className="md:hidden"> </span>
                        </>
                      )}
                    </span>
                  ))}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 12 }}
                  transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg break-keep"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {slides[i]?.sub?.split('\n').map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
                      {idx < arr.length - 1 && (
                        <>
                          <br className="hidden md:block" />
                          <span className="md:hidden"> </span>
                        </>
                      )}
                    </span>
                  ))}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: current === i ? 1 : 0, y: current === i ? 0 : 10 }}
                  transition={{ duration: 0.5, delay: 0.24 }}
                >
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/diagnosis"
                      className="inline-flex items-center rounded-full px-8 py-3.5 text-sm md:text-base font-semibold tracking-wide hover:shadow-[0_0_0_4px_rgba(94,139,104,0.12),0_8px_32px_rgba(45,79,57,0.3)] dark:hover:shadow-[0_0_0_4px_rgba(45,107,74,0.12),0_8px_32px_rgba(45,107,74,0.35)] active:scale-[0.97] active:shadow-[0_2px_12px_rgba(45,79,57,0.2)] dark:active:shadow-[0_2px_12px_rgba(45,107,74,0.15)]"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                        color: isDark ? "#F5F5F7" : "#fff",
                        boxShadow: isDark ? "0 6px 24px rgba(45,107,74,0.35)" : "0 6px 24px rgba(45,79,57,0.3)",
                        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {slides[i]?.cta}
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ))}
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
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

  const filteredProducts = active
    ? products.filter((p) => p.target_axes?.includes(CONCERN_META[active].axis))
    : [];

  return (
    <section className="bg-stone-50 dark:bg-transparent py-20 px-5 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <p className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4" style={{ color: accent }}>
            Skin Strategy Lab
          </p>
          <h2
            className="text-2xl md:text-3xl font-light text-gray-900 dark:text-gray-100 mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">{sub}</p>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-9 gap-3">
          {CONCERN_KEYS.map((key) => {
            const { icon: Icon } = CONCERN_META[key];
            const isActive = active === key;
            return (
              <motion.button
                key={key}
                onClick={() => setActive(isActive ? null : key)}
                whileTap={{ scale: 0.93 }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200"
                style={{
                  borderColor: isActive ? accent : "transparent",
                  background: isActive ? 'var(--ssl-accent-bg)' : 'transparent',
                  backdropFilter: isActive ? "blur(8px)" : "none",
                  WebkitBackdropFilter: isActive ? "blur(8px)" : "none",
                  boxShadow: isActive
                    ? (isDark ? "0 2px 12px rgba(45,107,74,0.08)" : "0 2px 12px rgba(94,139,104,0.08)")
                    : "none",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: isActive ? (isDark ? "rgba(45,107,74,0.12)" : "rgba(94,139,104,0.12)") : "rgba(148,126,92,0.07)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? accent : BRONZE }} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-center leading-tight" style={{ color: isActive ? accent : "#9a9a9a" }}>
                  {concernLabels[key]}
                </span>
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
                  <p className="text-center text-sm md:text-base py-8" style={{ color: BRONZE }}>{noProducts}</p>
                ) : (
                  <div
                    className="flex gap-4 overflow-x-auto pb-3"
                    style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                  >
                    {filteredProducts.map((product) => {
                      const state = cartStates[product.id] ?? "idle";
                      const name = typeof product.name === "string" ? product.name : (product.name.de ?? product.name.en);
                      return (
                        <div
                          key={product.id}
                          className="flex-shrink-0 w-44 md:w-52 rounded-2xl overflow-hidden border border-stone-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-[rgba(94,139,104,0.1)] dark:hover:shadow-black/30 dark:hover:border-[var(--ssl-accent)]/25 active:scale-[0.98]"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <Link to={`/formula/${product.id}`}>
                            <div className="relative w-full aspect-square bg-stone-50 dark:bg-black/[0.12] flex items-center justify-center p-3 overflow-hidden">
                              <div className="w-12 h-12 rounded-full" style={{ background: "rgba(45,107,74,0.08)" }} />
                              <img src={`/productsimage/${product.id}.jpeg`} alt={name} className="absolute inset-0 w-full h-full object-contain p-3" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Routine Showcase (La Mer stacked grid) ────────────────────────────────────
const ROUTINE_MOOD_IMAGES = [
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=800&q=80",
];

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
          <p className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4" style={{ color: accent }}>
            Skin Strategy Lab
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
                  className="md:col-span-5 relative rounded-3xl overflow-hidden"
                  style={{ minHeight: "300px" }}
                >
                  <img
                    src={ROUTINE_MOOD_IMAGES[i]}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0) 100%)" }}
                  />
                  <div className="absolute bottom-0 left-0 p-6 md:p-8">
                    <span
                      className="text-xs tracking-[0.2em] md:tracking-[0.25em] uppercase font-semibold block mb-2 drop-shadow-md"
                      style={{ color: accent, fontFamily: "var(--font-sans)" }}
                    >
                      {card.badge}
                    </span>
                    <h3
                      className="text-3xl lg:text-4xl font-light text-white whitespace-nowrap"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed max-w-[200px] whitespace-pre-line">{card.desc}</p>
                    <Link
                      to="/diagnosis"
                      className="inline-flex items-center mt-5 text-sm md:text-base font-medium tracking-wide hover:opacity-75 transition-opacity drop-shadow-md"
                      style={{ color: accent, fontFamily: "var(--font-sans)" }}
                    >
                      {card.cta} →
                    </Link>
                  </div>
                </div>

                {/* Right: Horizontal scroll product strip */}
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
                        const name = typeof product.name === "string" ? product.name : (product.name.de ?? product.name.en);
                        return (
                          <div
                            key={product.id}
                            className="flex-shrink-0 w-44 md:w-52 rounded-2xl overflow-hidden border border-stone-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-[rgba(94,139,104,0.1)] dark:hover:shadow-black/30 dark:hover:border-[var(--ssl-accent)]/25 active:scale-[0.98]"
                            style={{ scrollSnapAlign: "start" }}
                          >
                            <Link to={`/formula/${product.id}`}>
                              <div className="relative w-full aspect-square bg-stone-50 dark:bg-black/[0.12] flex items-center justify-center p-3 overflow-hidden">
                                <div className="w-12 h-12 rounded-full" style={{ background: "rgba(45,107,74,0.08)" }} />
                                <img src={`/productsimage/${product.id}.jpeg`} alt={name} className="absolute inset-0 w-full h-full object-contain p-3" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
function DiagnosisBanner({ headline, sub, cta, accent, accentDeep, isDark }: { headline: string; sub: string; cta: string, accent: string, accentDeep: string, isDark: boolean }) {
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
          className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-5"
          style={{ color: accent }}
        >
          Skin Strategy Lab
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-4xl md:text-5xl font-light mb-5 leading-tight whitespace-nowrap break-keep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {headline}
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              to="/diagnosis"
              className="inline-flex items-center rounded-full px-8 py-3.5 text-sm md:text-base font-semibold tracking-wide hover:shadow-[0_0_0_4px_rgba(94,139,104,0.12),0_8px_32px_rgba(45,79,57,0.3)] dark:hover:shadow-[0_0_0_4px_rgba(45,107,74,0.12),0_8px_32px_rgba(45,107,74,0.35)] active:scale-[0.97]"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                color: isDark ? "#F5F5F7" : "#fff",
                boxShadow: isDark ? "0 8px 32px rgba(45,107,74,0.45)" : "0 8px 32px rgba(45,79,57,0.35)",
                transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {cta}
            </Link>
          </motion.div>
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
        <p className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4" style={{ color: accent }}>
          Skin Strategy Lab
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
                  Datenschutz
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
  const t = tokens(isDark);
  const accent = t.accent;
  const accentDeep = t.accentDeep;
  const { language } = useI18nStore();
  const p1 = phase1T[language] ?? phase1T.de;
  const { products } = useProductStore();
  const { addItem } = useCartStore();

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
    <div className="min-h-screen bg-white dark:bg-transparent">
      <Navbar />
      <div className="h-16" />
      <RecheckBanner />

      <main>
        <HeroSlider slides={p1.home.hero as unknown as { headline: string; sub: string; cta: string }[]} accent={accent} accentDeep={accentDeep} isDark={isDark} />
        <UspStrip items={p1.home.usp as unknown as { label: string }[]} accent={accent} isDark={isDark} />
        {isDark && <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }} />}
        <ConcernSection
          title={p1.home.concernTitle}
          sub={p1.home.concernSub}
          concernLabels={p1.concerns as Record<ConcernKey, string>}
          noProducts={p1.home.noProducts}
          products={products}
          cartStates={cartStates}
          onAddToCart={handleAddToCart}
          accent={accent}
          isDark={isDark}
          addLabel={language === "ko" ? "담기" : language === "de" ? "Hinzufügen" : "Add"}
        />
        {isDark && <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }} />}
        <RoutineShowcase
          title={p1.home.routineTitle}
          sub={p1.home.routineSub}
          cards={p1.home.routines as unknown as { badge: string; title: string; desc: string; cta: string }[]}
          products={products}
          cartStates={cartStates}
          onAddToCart={handleAddToCart}
          accent={accent}
          isDark={isDark}
          addLabel={language === "ko" ? "담기" : language === "de" ? "Hinzufügen" : "Add"}
        />
        <DiagnosisBanner
          headline={p1.home.bannerHeadline}
          sub={p1.home.bannerSub}
          cta={p1.home.bannerCta}
          accent={accent}
          accentDeep={accentDeep}
          isDark={isDark}
        />
        <Newsletter
          headline={p1.home.newsletterHeadline}
          sub={p1.home.newsletterSub}
          placeholder={p1.home.newsletterPlaceholder}
          submit={p1.home.newsletterSubmit}
          gdprText={p1.home.newsletterGdpr}
          accent={accent}
          accentDeep={accentDeep}
          isDark={isDark}
        />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
