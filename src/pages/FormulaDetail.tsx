import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Check } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { AXIS_LABELS, Product } from "@/engine/types";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";
import CompatibilityBadge from "@/components/product/CompatibilityBadge";

const PHASE_META: Record<string, { icon: string; name: string; desc: string }> = {
    "1": { icon: "💧", name: "Cleanse", desc: "Remove impurities without disrupting barrier integrity." },
    "2": { icon: "🌿", name: "Prep", desc: "Rebuild and reinforce the skin's moisture barrier." },
    "3": { icon: "🔬", name: "Treat", desc: "Address primary concerns with active ingredients." },
    "4": { icon: "🛡", name: "Seal", desc: "Lock in moisture and create a protective film." },
    "5": { icon: "☀️", name: "Protect", desc: "UV protection — always the final step." },
    "Device": { icon: "✨", name: "Device", desc: "Clinical device to amplify protocol results." },
};

// Normalize phase strings like "Phase1", "Phase 1", "Phase2A", "Phase3_Acne", "Device" → key for PHASE_META
function getPhaseKey(phase: string): string {
    if (!phase) return "1";
    if (phase === "Device") return "Device";
    const match = phase.match(/(\d)/);
    return match ? match[1] : "1";
}


export default function FormulaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { result } = useDiagnosisStore();
    const { products } = useProductStore();
    const { addItem, items } = useCartStore();
    const [added, setAdded] = useState(false);
    const inCart = items.some((i) => i.product.id === id);

    const product = useMemo(() => {
        if (result) {
            const all: Product[] = Object.values(result.product_bundle).flat();
            return all.find((p) => p.id === id) ?? null;
        }
        return products.find((p) => p.id === id) ?? null;
    }, [result, id, products]);

    if (!product) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-foreground text-lg font-semibold mb-2">Formula not found</p>
                    <Link to="/results" className="text-primary hover:underline text-sm">← Back to Report</Link>
                </div>
            </div>
        );
    }

    const phaseMeta = PHASE_META[getPhaseKey(product.phase)] ?? PHASE_META["1"];

    const effectivePrice = product.price ?? product.price_eur;

    // Find lowest scoring axis this product targets
    const lowestTarget = product.target_axes.length > 0
        ? product.target_axes.reduce((low, axis) => {
            const score = result?.axis_scores?.[axis] ?? 50;
            return score < (result?.axis_scores?.[low] ?? 50) ? axis : low;
        }, product.target_axes[0])
        : null;
    const lowestScore = lowestTarget ? Math.round(result?.axis_scores?.[lowestTarget] ?? 50) : 50;
    const improvement = Math.min(25, Math.round(lowestScore * 0.2));

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-24 pb-20 px-6 md:px-10 max-w-3xl mx-auto relative z-10">
                {/* Back Navigation */}
                <Link
                    to="/results"
                    className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground mb-8 transition-colors"
                >
                    ← Back to Report
                </Link>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border overflow-hidden bg-card mb-8"
                >
                    {/* Phase Badge */}
                    <div className="px-6 pt-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
                            <span className="text-lg">{phaseMeta.icon}</span>
                            <span className="text-xs font-bold tracking-widest uppercase text-primary">{product.phase} · {phaseMeta.name}</span>
                        </span>
                    </div>

                    {/* Product Image Area */}
                    <div className="flex items-center justify-center py-12 px-8">
                        <div className="relative w-48 h-48 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden">
                            <span className="text-6xl opacity-30">🧴</span>
                            <img src={`/productsImage/${product.id}.jpg`} alt={product.name.en} className="absolute inset-0 w-full h-full object-contain p-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="px-6 pb-6 border-t border-border/50">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mt-4 mb-1">{product.brand}</p>
                        <h1 className="font-display text-2xl md:text-3xl font-light text-foreground mb-1">{product.name.en}</h1>
                        <p className="text-foreground/60 text-sm mb-4">{product.type} · €{effectivePrice}</p>
                        <p className="text-[#1A1A1A] dark:text-gray-300 text-sm leading-relaxed mb-6 font-medium">{product.description?.en || phaseMeta.desc}</p>

                        {/* Buy Button Action */}
                        <button
                            onClick={() => {
                                addItem(product);
                                setAdded(true);
                                if (navigator.vibrate) navigator.vibrate(20);
                                toast.success("Added to cart", {
                                    action: { label: "View Cart", onClick: () => navigate("/cart") },
                                });
                                setTimeout(() => setAdded(false), 2000);
                            }}
                            className="w-full rounded-2xl py-3.5 font-bold tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2"
                            style={{
                                fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)",
                                background: added || inCart ? "transparent" : "hsl(var(--primary))",
                                color: added || inCart ? "var(--ssl-accent)" : "hsl(var(--primary-foreground))",
                                border: added || inCart ? "2px solid var(--ssl-accent)" : "2px solid transparent",
                                boxShadow: added || inCart ? "none" : undefined,
                            }}
                        >
                            {added || inCart
                                ? <><Check className="w-4 h-4" /> In Cart</>
                                : <><ShoppingBag className="w-4 h-4" /> Add to Cart</>
                            }
                        </button>
                    </div>
                </motion.div>

                {/* AI Compatibility Analysis — expanded badge */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <CompatibilityBadge product={product} variant="expanded" />
                </motion.section>

                {/* The Strategy Section */}
                {lowestTarget && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-3xl border border-primary/20 bg-primary/[0.03] p-6 md:p-8 mb-8"
                    >
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">The Strategy</p>
                        <h2 className="font-display text-xl md:text-2xl font-light text-foreground leading-snug mb-4">
                            Targeting your <span className="text-primary font-medium">{AXIS_LABELS[lowestTarget]}</span> with personalized precision.
                        </h2>
                        <div className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border/50 mb-4">
                            <div className="flex-1">
                                <p className="text-xs text-foreground/50 mb-1">Current {AXIS_LABELS[lowestTarget]} Score</p>
                                <div className="w-full h-2 bg-border/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${lowestScore}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    />
                                </div>
                            </div>
                            <span className="font-display text-2xl font-bold text-foreground">{lowestScore}</span>
                        </div>
                        {product.vectorImpact && Object.keys(product.vectorImpact).length > 0 ? (
                            <p className="text-sm text-[#1A1A1A] dark:text-gray-300 leading-relaxed font-medium">
                                Based on your {lowestScore} {AXIS_LABELS[lowestTarget]} score, this product is mapped to shift this vector by <strong className="text-primary">{(product.vectorImpact[lowestTarget] ?? 0) > 0 ? '+' : ''}{product.vectorImpact[lowestTarget] ?? 0} points</strong>. The key ingredients precisely trigger the mechanisms required for this clinical improvement.
                            </p>
                        ) : (
                            <p className="text-sm text-[#1A1A1A] dark:text-gray-300 leading-relaxed font-medium">
                                This formula is projected to improve your {AXIS_LABELS[lowestTarget]} score by approximately <strong className="text-foreground">+{improvement} points</strong> within 30 days of consistent use. The key ingredients specifically target the mechanisms driving this vector.
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Usage Instructions */}
                {(product.howToUse?.en || product.howToUse?.de) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-8"
                    >
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">How to Use</p>
                        <p className="text-[#1A1A1A] dark:text-gray-300 text-sm leading-relaxed font-medium">
                            {product.howToUse.en || product.howToUse.de}
                        </p>
                    </motion.div>
                )}

                {/* Key Ingredients */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-8"
                >
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4 flex items-center justify-between">
                        <span>Full Ingredients (INCI)</span>
                        <span className="text-foreground/40 text-[0.6rem]">ACTIVE CONCENTRATIONS</span>
                    </p>
                    <div className="flex flex-wrap gap-x-1.5 gap-y-2 text-[#1A1A1A] dark:text-gray-300 text-sm font-medium leading-relaxed">
                        {(product.ingredients || product.key_ingredients).map((ing, i, arr) => (
                            <span key={`${ing}-${i}`}>
                                {ing}{i < arr.length - 1 ? ',' : ''}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Targeted Axes */}
                {product.target_axes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-12"
                    >
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">Targeting Vectors</p>
                        <div className="flex flex-wrap gap-2">
                            {product.target_axes.map((axis) => (
                                <span key={axis} className="rounded-full px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                    {AXIS_LABELS[axis]} · {Math.round(result?.axis_scores?.[axis] ?? 50)}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    );
}
