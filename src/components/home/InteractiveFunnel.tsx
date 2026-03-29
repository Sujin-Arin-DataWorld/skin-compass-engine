import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ShoppingBag, Loader2, Droplets, ShieldAlert, Droplet, Timer, Sun, Layers, Shield, CircleDot, Leaf } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import type { LucideIcon } from 'lucide-react';
import type { AxisKey, Product } from '@/engine/types';

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

type CartBtnState = "idle" | "adding" | "added";

interface InteractiveFunnelProps {
  title: string;
  sub: string;
  concernLabels: Record<ConcernKey, string>;
  noProducts: string;
  products: Product[];
  cartStates: Record<string, CartBtnState>;
  onAddToCart: (product: Product) => void;
  addLabel: string;
}

export const InteractiveFunnel = ({
  title, sub, concernLabels, noProducts, products, cartStates, onAddToCart, addLabel
}: InteractiveFunnelProps) => {
  const [active, setActive] = useState<ConcernKey | null>(null);
  const { language } = useI18nStore();

  const filteredProducts = active
    ? products.filter((p) => p.target_axes?.includes(CONCERN_META[active].axis))
    : [];

  return (
    <section className="bg-[#FBFBFB] dark:bg-[#0A0D12] py-20 px-5 md:px-10 border-t border-black/5 dark:border-white/5">
      <div className="mx-auto max-w-5xl">
        {/* ── Title Area ── */}
        <div className="text-center mb-10 md:mb-14">
          <h2
            className="text-[28px] md:text-3xl lg:text-4xl font-light mb-4 text-[#111] dark:text-[#EAEAEA]"
            style={{ fontFamily: '"SF Pro Display", var(--font-display)' }}
          >
            {title}
          </h2>
          <p className="text-base md:text-[17px] text-[#666] dark:text-[#888] max-w-xl mx-auto leading-relaxed" style={{ fontFamily: '"Inter", var(--font-sans)' }}>
            {sub}
          </p>
        </div>

        {/* ── Masonry/Flex Chips ── */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-3xl mx-auto">
          {CONCERN_KEYS.map((key) => {
            const { icon: Icon } = CONCERN_META[key];
            const isActive = active === key;
            const isDimmed = active !== null && !isActive;

            return (
              <motion.button
                key={key}
                onClick={() => setActive(isActive ? null : key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2.5 px-5 py-3 md:px-6 md:py-3.5 rounded-full transition-all duration-300 border backdrop-blur-md ${
                  isActive 
                    ? "bg-[#5E8B68] border-[#5E8B68] text-white shadow-lg shadow-[#5E8B68]/20" 
                    : "bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10 text-[#333] dark:text-[#CCC] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{
                  opacity: isDimmed ? 0.45 : 1,
                  filter: isDimmed ? "grayscale(30%)" : "none",
                }}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-white" : "text-[#666] dark:text-[#888]"}`} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[14px] md:text-[15px] font-medium tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-sans)" }}>
                  {concernLabels[key]}
                </span>
                
                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-white ml-1"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Accordion Results ── */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 40 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Buttery spring-like ease
              className="overflow-hidden"
            >
              {/* Success Banner */}
              <div className="flex items-center gap-2 bg-[#F2F7F4] dark:bg-[#121A15] border border-[#5E8B68]/20 text-[#3D6B4A] dark:text-[#5E8B68] px-5 py-3 rounded-2xl mb-6 w-fit mx-auto shadow-sm">
                <Check className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-[14px] font-medium tracking-wide">
                  {filteredProducts.length} {language === 'ko' ? '개의 제품을 찾았습니다' : language === 'de' ? `Produkte für ${concernLabels[active]} gefunden` : `Products found for ${concernLabels[active]}`}
                </span>
              </div>

              {/* Product Carousel */}
              <div className="pb-1">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-[15px] py-8 text-[#888]">{noProducts}</p>
                ) : (
                  <div
                    className="flex gap-4 md:gap-5 overflow-x-auto pb-6 px-2 scrollbar-none"
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
                          className="flex-shrink-0 w-[180px] md:w-[220px] rounded-[24px] overflow-hidden transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5"
                          style={{ scrollSnapAlign: "center" }}
                        >
                          <Link to={`/formula/${product.id}`} className="block relative w-full aspect-square p-4 bg-[#F8F9FA] dark:bg-[#0A0D12] group">
                            <img 
                              src={`/productsImage/${product.id}.jpg`} 
                              alt={name} 
                              className="absolute inset-0 w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110" 
                              loading="lazy" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                            />
                          </Link>
                          
                          <div className="p-4 md:p-5">
                            <Link to={`/formula/${product.id}`}>
                              <p className="text-[13px] md:text-[14px] font-medium line-clamp-2 mb-1.5 leading-snug hover:opacity-70 transition-opacity text-[#222] dark:text-[#EEE]">
                                {name}
                              </p>
                            </Link>
                            <p className="text-[15px] font-semibold mb-4 text-[#5E8B68]">
                              €{(product.price ?? product.price_eur).toFixed(2)}
                            </p>
                            
                            <button
                              onClick={() => onAddToCart(product)}
                              disabled={state === "adding"}
                              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 disabled:opacity-50 ${
                                state === "added" 
                                  ? "bg-[#F2F7F4] dark:bg-[#121A15] text-[#3D6B4A] dark:text-[#5E8B68] border border-[#5E8B68]/30"
                                  : "bg-[#FAFAFA] dark:bg-[#1A1A1A] text-[#111] dark:text-[#EAEAEA] border border-black/5 dark:border-white/5 hover:bg-[#F0F0F0] dark:hover:bg-[#222]"
                              }`}
                            >
                              {state === "adding" && <Loader2 className="w-[14px] h-[14px] animate-spin text-[#888]" />}
                              {state === "added" && <Check className="w-[14px] h-[14px]" strokeWidth={2.5} />}
                              {state === "idle" && <ShoppingBag className="w-[14px] h-[14px] text-[#666] dark:text-[#999]" strokeWidth={1.5} />}
                              <span>
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
};
