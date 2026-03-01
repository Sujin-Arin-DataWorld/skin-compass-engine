import { motion } from "framer-motion";
import { DiagnosisResult, AXIS_LABELS, Product, AxisKey } from "@/engine/types";

function getBarColor(score: number): string {
  if (score >= 70) return "hsl(var(--severity-severe))";
  if (score >= 45) return "hsl(var(--severity-moderate))";
  if (score >= 20) return "hsl(var(--severity-mild))";
  return "hsl(var(--severity-clear))";
}

interface Props {
  result: DiagnosisResult;
}

const SlideWhyItWorks = ({ result }: Props) => {
  const allProducts: Product[] = Object.values(result.product_bundle).flat();
  const displayed = allProducts.slice(0, 4);

  return (
    <div className="results-slide flex flex-1 flex-col px-6 py-12 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">
        <motion.p
          className="slide-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Why This Works For You
        </motion.p>
        <motion.p
          className="slide-body mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Each product matched to your specific skin vector
        </motion.p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {displayed.map((product, i) => (
            <motion.div
              key={product.id}
              className="rounded-xl border border-border p-5 space-y-4"
              style={{ background: 'hsl(var(--card))' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              {/* Product info */}
              <div>
                <p className="slide-eyebrow" style={{ fontSize: '0.6875rem', letterSpacing: '0.12em' }}>{product.brand}</p>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginTop: '0.25rem' }}>{product.name}</p>
                <p className="slide-body" style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>{product.type}</p>
              </div>

              {/* Matched axes */}
              <div className="space-y-1.5">
                <p className="section-header" style={{ marginBottom: '0.5rem' }}>
                  Matched to your profile
                </p>
                {product.target_axes.slice(0, 3).map((axis) => {
                  const score = Math.round(result.axis_scores[axis]);
                  return (
                    <div key={axis} className="flex items-center gap-2">
                      <span style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))', width: '90px', flexShrink: 0 }}>
                        {AXIS_LABELS[axis]}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, backgroundColor: getBarColor(score) }}
                        />
                      </div>
                      <span className="score-number" style={{ fontSize: '0.875rem', color: getBarColor(score), width: '28px', textAlign: 'right' as const }}>
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Key ingredients */}
              <div className="space-y-1">
                {product.key_ingredients.slice(0, 3).map((ing) => (
                  <p key={ing} style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground-body))' }}>
                    <span className="text-primary mr-1">✓</span>
                    {ing}
                  </p>
                ))}
              </div>

              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>€{product.price_eur}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlideWhyItWorks;
