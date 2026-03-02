import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosisResult, Product, AXIS_LABELS, AxisKey } from "@/engine/types";

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

  return { matchedAxes, because, helps, phaseLabel };
}

interface Props {
  result: DiagnosisResult;
}

const SlideWhyProducts = ({ result }: Props) => {
  const allProducts: Product[] = Object.values(result.product_bundle).flat();
  const displayed = allProducts.slice(0, 5);

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-xl">
        <motion.p className="slide-eyebrow mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Personalized Selection
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
          {displayed.length} formulas matched to your vector
        </motion.h2>

        <motion.p className="slide-body mb-10" style={{ color: "#D1D1D1" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          Each product was selected because of specific signals in your diagnosis — not because of your skin type alone.
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
            One-time vs. Adaptive
          </p>
          <p className="slide-body" style={{ lineHeight: 1.55 }}>
            These products are matched to your skin <em>today</em>.
            Next month, your barrier may shift, or a new active may unlock.
            The subscription keeps the match current.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

function EnhancedProductCard({ product, result, index }: { product: Product; result: DiagnosisResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { matchedAxes, because, helps, phaseLabel } = generateWhyData(product, result);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <p className="slide-eyebrow" style={{ fontSize: "0.625rem", letterSpacing: "0.18em", marginBottom: "0.35rem" }}>
          {product.brand}
        </p>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden p-2">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs">No Image</div>
                )}
              </div>
              {/* Texture feel overlay */}
              {product.texture_feel && (
                <div
                  className="absolute -bottom-2 left-0 right-0 mx-auto w-max max-w-[96px] rounded-full px-2 py-0.5 text-center"
                  style={{
                    background: "hsl(var(--primary) / 0.15)",
                    border: "1px solid hsl(var(--primary) / 0.25)",
                    fontSize: "0.6rem",
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
            </div>
            <div className="mt-1">
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                {product.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#D1D1D1", marginTop: "0.2rem" }}>
                {product.type}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>
              €{product.price_eur}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-xs mt-1 inline-block"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                color: "hsl(var(--primary))",
                fontWeight: 700,
              }}
            >
              {phaseLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Matched axes bars */}
      <div className="px-5 pb-4 border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <p className="slide-eyebrow mt-3 mb-2.5" style={{ letterSpacing: "0.1em" }}>
          Matched to your profile
        </p>
        <div className="space-y-2">
          {matchedAxes.map(({ axis, score, isHighest }) => (
            <div key={axis} className="flex items-center gap-2">
              <p style={{
                fontSize: "0.75rem",
                color: "#D1D1D1",
                width: "70px",
                flexShrink: 0,
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
                color: isHighest ? "hsl(var(--primary))" : "#D1D1D1",
                width: "28px",
                textAlign: "right" as const,
              }}>
                {score}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key ingredients */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {product.key_ingredients.slice(0, 3).map((ing) => (
          <span key={ing} style={{ fontSize: "0.75rem", color: "#D1D1D1" }}>
            ✓ {ing}
          </span>
        ))}
      </div>

      {/* Expandable "Why this works" */}
      <div className="border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
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
          <span>Why this works for you</span>
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
                <p className="slide-eyebrow mb-1.5" style={{ letterSpacing: "0.1em" }}>Because we observed</p>
                {because.map((b, i) => (
                  <p key={i} className="slide-body" style={{ lineHeight: 1.6, color: "#D1D1D1", fontFamily: b.includes("/100") ? "'Courier New', Courier, monospace" : "inherit" }}>· {b}</p>
                ))}
              </div>
              <div>
                <p className="slide-eyebrow mb-1.5" style={{ letterSpacing: "0.1em" }}>This product helps by</p>
                {helps.map((h, i) => (
                  <p key={i} className="slide-body" style={{ lineHeight: 1.6, color: "#D1D1D1" }}>✓ {h}</p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default SlideWhyProducts;
