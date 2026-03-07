import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Check, Heart } from "lucide-react";
import { useI18nStore, translations } from "@/store/i18nStore";
import { toast } from "sonner";
import { DiagnosisResult, Product, AXIS_LABELS, AxisKey } from "@/engine/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/authStore";

function getBarColor(score: number): string {
  if (score >= 70) return "hsl(var(--severity-severe))";
  if (score >= 45) return "hsl(var(--severity-moderate))";
  if (score >= 20) return "hsl(var(--severity-mild))";
  return "hsl(var(--severity-clear))";
}

// Generate "because" / "helps" from product + result data
function generateWhyData(product: Product, result: DiagnosisResult) {
  const matchedAxes = product.target_axes.map((axis) => ({
    axis,
    score: Math.round(result.axis_scores[axis]),
    isHighest: axis === result.primary_concerns[0],
  }));

  const because = product.target_axes.slice(0, 2).map((axis) => {
    const score = Math.round(result.axis_scores[axis]);
    return `Your ${AXIS_LABELS[axis]} score is ${score}/100 — ${score > 60 ? "significantly elevated" : "moderately active"}`;
  });

  const helps = product.key_ingredients.slice(0, 2).map((ing) =>
    `${ing} targets the mechanisms driving your top concern`
  );

  const phaseLabel = product.phase || "Phase 1";

  // Map phase to icon and number
  let phaseIcon = "💧";
  let phaseNum = 1;
  let phaseName = "Cleanse";
  if (phaseLabel.includes("2")) { phaseIcon = "🌿"; phaseNum = 2; phaseName = "Prep"; }
  else if (phaseLabel.includes("3")) { phaseIcon = "🔬"; phaseNum = 3; phaseName = "Treat"; }
  else if (phaseLabel.includes("4")) { phaseIcon = "🛡"; phaseNum = 4; phaseName = "Seal"; }
  else if (phaseLabel.includes("5")) { phaseIcon = "☀️"; phaseNum = 5; phaseName = "Protect"; }

  return { matchedAxes, because, helps, phaseLabel, phaseIcon, phaseNum, phaseName };
}

interface Props {
  result: DiagnosisResult;
}

const SlideWhyProducts = ({ result }: Props) => {
  const allProducts: Product[] = Object.values(result.product_bundle).flat();
  const displayed = allProducts.slice(0, 5);
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-xl">
        <motion.p className="slide-eyebrow mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {t.results.personalizedSelection}
        </motion.p>
        <motion.h2
          className="font-display"
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "hsl(var(--foreground))",
            marginBottom: "0.75rem",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {displayed.length} {t.results.formulasMatched}
        </motion.h2>

        <motion.p className="slide-body mb-10" style={{ color: "#D1D1D1" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {t.results.selectionReason}
        </motion.p>

        {/* Product cards */}
        <div className="space-y-8">
          {displayed.map((product, i) => (
            <EnhancedProductCard key={product.id} product={product} result={result} index={i} />
          ))}
        </div>

        {/* Subscribe pull banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 rounded-2xl border p-6"
          style={{
            borderColor: "hsl(var(--primary) / 0.3)",
            background: "hsl(var(--primary) / 0.05)",
          }}
        >
          <p className="slide-eyebrow mb-1" style={{ color: "hsl(var(--primary))" }}>
            {t.results.oneTimeVsAdaptive}
          </p>
          <p className="slide-body" style={{ lineHeight: 1.55 }}>
            {t.results.adaptiveReason}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

function EnhancedProductCard({ product, result, index }: { product: Product; result: DiagnosisResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const { matchedAxes, because, helps, phaseLabel, phaseIcon, phaseNum, phaseName } = generateWhyData(product, result);
  const { addItem, items } = useCartStore();
  const navigate = useNavigate();
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;
  const inCart = items.some((i) => i.product.id === product.id);
  const { isLoggedIn } = useAuthStore();
  const { toggle, isWished } = useWishlist();
  const wished = isWished(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border overflow-hidden flex flex-col md:flex-row relative"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {/* 1/3 Image Block (Top on Mobile, Left on Desktop) */}
      <div className="w-full md:w-1/3 p-5 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-black/20 border-b md:border-b-0 md:border-r" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        {/* Floating Badge */}
        <div className="absolute top-4 right-4 md:left-4 md:right-auto bg-white/90 dark:bg-black/60 backdrop-blur-md border border-border/50 shadow-sm rounded-full px-3 py-1 flex items-center gap-1.5 z-10">
          <span style={{ fontSize: "0.875rem" }}>{phaseIcon}</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "hsl(var(--foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>{phaseNum}. {phaseName}</span>
        </div>

        <Link to={`/formula/${product.id}`} className="block relative w-full aspect-square max-w-[160px] mx-auto group cursor-pointer">
          <div className="w-full h-full bg-white dark:bg-white/5 rounded-xl shadow-sm flex items-center justify-center p-4 transition-transform duration-300 group-hover:scale-105">
            {product.image ? (
              <img src={product.image} alt={product.name.en} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-[#1A1A1A] dark:text-gray-300 text-xs">No Image</div>
            )}
          </div>

          {/* Texture feel overlay */}
          {product.texture_feel && (
            <div
              className="absolute -bottom-3 left-0 right-0 mx-auto w-max max-w-[120px] rounded-full px-3 py-1 text-center shadow-sm"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                border: "1px solid hsl(var(--primary) / 0.25)",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "hsl(var(--primary))",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {product.texture_feel}
            </div>
          )}
        </Link>
      </div>

      {/* 2/3 Data Block (Bottom on Mobile, Right on Desktop) */}
      <div className="w-full md:w-2/3 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <p className="slide-eyebrow" style={{ fontSize: "0.625rem", letterSpacing: "0.18em", marginBottom: "0.35rem", color: "hsl(var(--primary))" }}>
            {product.brand}
          </p>
          <div className="flex items-start justify-between gap-4">
            <div className="mt-1">
              <p className="dark:text-white" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1A1A1A", lineHeight: 1.2 }}>
                {product.name.en}
              </p>
              <p className="dark:text-gray-400" style={{ fontSize: "0.8125rem", color: "#4A4A4A", marginTop: "0.2rem" }}>
                {product.type}
              </p>
            </div>
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <p className="font-display dark:text-white" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1A1A1A" }}>
                  €{product.price_eur}
                </p>
                {isLoggedIn && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggle({
                        product_id: product.id,
                        product_name: product.name.en,
                        product_image: product.image ?? null,
                        price: product.price_eur ?? null,
                      });
                    }}
                    aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Heart
                      className="w-4 h-4 transition-colors"
                      style={{
                        fill: wished ? "hsl(var(--primary))" : "none",
                        stroke: wished ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.4)",
                      }}
                    />
                  </button>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addItem(product);
                  setAdded(true);
                  if (navigator.vibrate) navigator.vibrate(20);
                  toast.success(
                    language === "de" ? "Zum Warenkorb hinzugefügt" : "Added to cart",
                    { action: { label: language === "de" ? "Warenkorb" : "View Cart", onClick: () => navigate("/cart") } }
                  );
                  setTimeout(() => setAdded(false), 2000);
                }}
                className="rounded-full px-3 py-1.5 font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1"
                style={{
                  fontSize: "clamp(0.6rem, 1.5vw, 0.65rem)",
                  background: added || inCart ? "transparent" : "hsl(var(--primary))",
                  color: added || inCart ? "#D4AF37" : "hsl(var(--primary-foreground))",
                  border: added || inCart ? "1px solid #D4AF37" : "1px solid transparent",
                }}
              >
                {added || inCart
                  ? <><Check className="w-3 h-3" />{language === "de" ? "Im Warenkorb" : "Added"}</>
                  : <><ShoppingBag className="w-3 h-3" />{language === "de" ? "Warenkorb" : "Add to Cart"}</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Matched axes bars */}
        <div className="px-5 pb-4 border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          <p className="slide-eyebrow mt-3 mb-2.5 dark:text-white uppercase tracking-widest text-xs" style={{ letterSpacing: "0.1em", textTransform: "none", color: "#1A1A1A" }}>
            Matched to your profile
          </p>
          <div className="space-y-2">
            {matchedAxes.map(({ axis, score, isHighest }) => (
              <div key={axis} className="flex items-center gap-2">
                <p className="dark:text-gray-400" style={{
                  fontSize: "0.75rem",
                  width: "70px",
                  flexShrink: 0,
                  color: "#4A4A4A"
                }}>
                  {AXIS_LABELS[axis]}
                </p>
                <div className="flex-1 rounded-full" style={{ height: "4px", background: "hsl(var(--border))" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="h-full rounded-full"
                    style={{ background: isHighest ? "hsl(var(--primary))" : "hsl(var(--foreground-hint) / 0.5)" }}
                  />
                </div>
                <p style={{
                  fontSize: "0.75rem",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontWeight: 700,
                  color: isHighest ? "hsl(var(--primary))" : "#4A4A4A",
                  width: "28px",
                  textAlign: "right" as const,
                }} className={!isHighest ? "dark:text-gray-400" : ""}>
                  {score}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key ingredients */}
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {product.key_ingredients.slice(0, 3).map((ing) => (
            <span key={ing} style={{ fontSize: "0.75rem", color: "#4A4A4A" }} className="dark:text-gray-400 font-medium">
              ✓ {ing}
            </span>
          ))}
        </div>

        {/* Expandable "Why this works" */}
        <div className="border-t mt-auto" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "hsl(var(--primary))",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span>{t.results.whyThisWorks}</span>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              ↓
            </motion.span>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="px-5 pb-5 space-y-4 overflow-hidden"
              >
                <div>
                  <p className="slide-eyebrow mb-1.5 dark:text-white" style={{ letterSpacing: "0.1em", color: "#1A1A1A" }}>{t.results.becauseObserved}</p>
                  {because.map((b, i) => (
                    <p key={i} className="slide-body dark:text-gray-300" style={{ lineHeight: 1.6, color: "#1A1A1A", fontFamily: b.includes("/100") ? "'Courier New', Courier, monospace" : "inherit" }}>· {b}</p>
                  ))}
                </div>
                <div>
                  <p className="slide-eyebrow mb-1.5 dark:text-white" style={{ letterSpacing: "0.1em", color: "#1A1A1A" }}>{t.results.helpsBy}</p>
                  {helps.map((h, i) => (
                    <p key={i} className="slide-body dark:text-gray-300" style={{ lineHeight: 1.6, color: "#1A1A1A" }}>✓ {h}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default SlideWhyProducts;
