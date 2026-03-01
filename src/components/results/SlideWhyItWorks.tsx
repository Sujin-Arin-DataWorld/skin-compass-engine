import { motion } from "framer-motion";
import { DiagnosisResult, AXIS_LABELS, Product, AxisKey } from "@/engine/types";

const severityColor = (score: number) => {
  if (score <= 20) return "hsl(var(--severity-clear))";
  if (score <= 45) return "hsl(var(--severity-mild))";
  if (score <= 70) return "hsl(var(--severity-moderate))";
  return "hsl(var(--severity-severe))";
};

interface Props {
  result: DiagnosisResult;
}

const SlideWhyItWorks = ({ result }: Props) => {
  // Flatten all products from the bundle
  const allProducts: Product[] = Object.values(result.product_bundle).flat();
  // Take top 4 most relevant
  const displayed = allProducts.slice(0, 4);

  return (
    <div className="flex flex-1 flex-col px-6 py-12 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px]">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Why This Works For You
        </motion.p>
        <motion.p
          className="mt-1 text-sm text-muted-foreground"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              {/* Product info */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.brand}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{product.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{product.type}</p>
              </div>

              {/* Matched axes */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Matched to your profile
                </p>
                {product.target_axes.slice(0, 3).map((axis) => {
                  const score = Math.round(result.axis_scores[axis]);
                  return (
                    <div key={axis} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{AXIS_LABELS[axis]}</span>
                        <span style={{ color: severityColor(score) }}>{score}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, backgroundColor: severityColor(score) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Key ingredients */}
              <div className="space-y-1">
                {product.key_ingredients.slice(0, 3).map((ing) => (
                  <p key={ing} className="text-xs text-muted-foreground">
                    <span className="text-primary mr-1">✓</span>
                    {ing}
                  </p>
                ))}
              </div>

              <p className="text-sm font-medium text-foreground">€{product.price_eur}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlideWhyItWorks;
