import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { AXIS_LABELS, Product } from "@/engine/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

const PHASE_META: Record<string, { icon: string; name: string; desc: string }> = {
    "Phase 1": { icon: "💧", name: "Cleanse", desc: "Remove impurities without disrupting barrier integrity." },
    "Phase 2": { icon: "🌿", name: "Prep", desc: "Rebuild and reinforce the skin's moisture barrier." },
    "Phase 3": { icon: "🔬", name: "Treat", desc: "Address primary concerns with active ingredients." },
    "Phase 4": { icon: "🛡", name: "Seal", desc: "Lock in moisture and create a protective film." },
    "Phase 5": { icon: "☀️", name: "Protect", desc: "UV protection — always the final step." },
};

function makeMockProducts(): Product[] {
    return [
        { id: "p1", name: "Gentle Barrier Cleanser", brand: "DERMATICA", phase: "Phase 1", type: "Cleanser", price_eur: 24, tier: ["Entry", "Full", "Premium"], shopify_handle: "gentle-cleanser", key_ingredients: ["Ceramide NP", "Glycerin", "Panthenol"], target_axes: ["bar", "sen"], for_skin: ["sensitive", "combination"] },
        { id: "p2", name: "Barrier Repair Serum", brand: "SKINCEUTICALS", phase: "Phase 2", type: "Serum", price_eur: 42, tier: ["Full", "Premium"], shopify_handle: "barrier-serum", key_ingredients: ["Niacinamide 10%", "Madecassoside", "Hyaluronic Acid"], target_axes: ["bar", "hyd", "sen"], for_skin: ["sensitive", "dry"] },
        { id: "p3", name: "Anti-Blemish Treatment", brand: "PAULA'S CHOICE", phase: "Phase 3", type: "Treatment", price_eur: 36, tier: ["Full", "Premium"], shopify_handle: "blemish-treatment", key_ingredients: ["Salicylic Acid 2%", "Green Tea Extract"], target_axes: ["acne", "seb", "texture"], for_skin: ["oily", "combination"] },
        { id: "p4", name: "Recovery Moisturiser", brand: "LA ROCHE-POSAY", phase: "Phase 4", type: "Moisturiser", price_eur: 28, tier: ["Entry", "Full", "Premium"], shopify_handle: "recovery-moisturiser", key_ingredients: ["Shea Butter", "Thermal Water", "Ceramide AP"], target_axes: ["bar", "hyd"], for_skin: ["all"] },
        { id: "p5", name: "UV Shield SPF50+", brand: "HELIOCARE", phase: "Phase 5", type: "Sunscreen", price_eur: 32, tier: ["Entry", "Full", "Premium"], shopify_handle: "uv-shield", key_ingredients: ["Fernblock", "Zinc Oxide", "Vitamin E"], target_axes: ["pigment", "ox", "aging"], for_skin: ["all"] },
    ];
}

export default function FormulaDetail() {
    const { id } = useParams<{ id: string }>();
    const { result } = useDiagnosisStore();

    const product = useMemo(() => {
        if (result) {
            const all: Product[] = Object.values(result.product_bundle).flat();
            return all.find((p) => p.id === id) ?? null;
        }
        return makeMockProducts().find((p) => p.id === id) ?? null;
    }, [result, id]);

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

    const phaseMeta = PHASE_META[product.phase || "Phase 1"] ?? PHASE_META["Phase 1"];

    // Find lowest scoring axis this product targets
    const lowestTarget = product.target_axes.reduce((low, axis) => {
        const score = result?.axis_scores?.[axis] ?? 50;
        return score < (result?.axis_scores?.[low] ?? 50) ? axis : low;
    }, product.target_axes[0]);
    const lowestScore = Math.round(result?.axis_scores?.[lowestTarget] ?? 50);
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
                        <div className="w-48 h-48 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-sm">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain p-4" />
                            ) : (
                                <span className="text-6xl opacity-30">🧴</span>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="px-6 pb-6 border-t border-border/50">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mt-4 mb-1">{product.brand}</p>
                        <h1 className="font-display text-2xl md:text-3xl font-light text-foreground mb-1">{product.name}</h1>
                        <p className="text-foreground/60 text-sm mb-4">{product.type} · €{product.price_eur}</p>
                        <p className="text-foreground/70 text-sm leading-relaxed">{phaseMeta.desc}</p>
                    </div>
                </motion.div>

                {/* The Strategy Section */}
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
                    <p className="text-sm text-foreground/70 leading-relaxed">
                        This formula is projected to improve your {AXIS_LABELS[lowestTarget]} score by approximately <strong className="text-foreground">+{improvement} points</strong> within 30 days of consistent use. The key ingredients specifically target the mechanisms driving this vector.
                    </p>
                </motion.div>

                {/* Key Ingredients */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-8"
                >
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">Key Ingredients</p>
                    <div className="space-y-3">
                        {product.key_ingredients.map((ing) => (
                            <div key={ing} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                                <span className="text-primary text-sm">✓</span>
                                <span className="text-foreground text-sm font-medium">{ing}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Targeted Axes */}
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
            </main>

            <Footer />
        </div>
    );
}
