import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Check, CheckCircle2, ChevronDown, Flag, PackageOpen } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { useAnalysisStore } from "@/store/analysisStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { AXIS_LABELS, Product } from "@/engine/types";
import { toast } from "sonner";
import { useI18nStore } from "@/store/i18nStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";
import CompatibilityBadge from "@/components/product/CompatibilityBadge";
import { formatGrundpreis } from "@/utils/priceUtils";
import MedicalDisclaimer from '@/components/legal/MedicalDisclaimer';
import AiGeneratedBadge from '@/components/legal/AiGeneratedBadge';

const PHASE_META: Record<string, { icon: string; name: string; desc: string }> = {
    "1": { icon: "💧", name: "Cleanse", desc: "Remove impurities without disrupting barrier integrity." },
    "2": { icon: "🌿", name: "Prep",    desc: "Rebuild and reinforce the skin's moisture barrier." },
    "3": { icon: "🔬", name: "Target",  desc: "Address primary concerns with active ingredients." },
    "4": { icon: "🛡", name: "Seal",    desc: "Lock in moisture and create a protective film." },
    "5": { icon: "☀️", name: "Protect", desc: "UV protection — always the final step." },
    "Device": { icon: "✨", name: "Device", desc: "Professional device to amplify protocol results." },
};

// Normalize phase strings like "Phase1", "Phase 1", "Phase2A", "Phase3_Acne", "Device" → key for PHASE_META
function getPhaseKey(phase: string): string {
    if (!phase) return "1";
    if (phase === "Device") return "Device";
    const match = phase.match(/(\d)/);
    return match ? match[1] : "1";
}

// ── Skeleton loader for INCI section (Anti-CLS) ──────────────────────────────
function InciSkeleton() {
    return (
        <div className="space-y-2 py-2" aria-hidden="true">
            <div className="h-4 w-3/4 rounded-md bg-muted/50 animate-pulse" />
            <div className="h-4 w-full rounded-md bg-muted/50 animate-pulse" />
            <div className="h-4 w-5/6 rounded-md bg-muted/50 animate-pulse" />
            <div className="h-4 w-2/3 rounded-md bg-muted/50 animate-pulse" />
        </div>
    );
}

// ── Omnibus Directive: Verified Purchase Badge (WCAG AAA) ─────────────────────
function VerifiedPurchaseBadge({ className = "" }: { className?: string }) {
    const { language } = useI18nStore();
    const text = language === "de"
        ? "Verifizierter Kauf"
        : language === "ko"
            ? "인증된 구매"
            : "Verified Purchase";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide
                bg-emerald-50 text-emerald-700 border border-emerald-200
                dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50
                ${className}`}
        >
            <CheckCircle2 className="w-2.5 h-2.5" />
            {text}
        </span>
    );
}

// ── DSA Report Button ─────────────────────────────────────────────────────────
function DsaReportButton() {
    const { language } = useI18nStore();
    const label = language === "de"
        ? "Dieses Produkt melden"
        : language === "ko"
            ? "이 제품 신고"
            : "Report this product";

    return (
        <button
            onClick={() => toast.info(
                language === "de"
                    ? "Vielen Dank für Ihre Meldung. Wir werden diese prüfen."
                    : language === "ko"
                        ? "신고해 주셔서 감사합니다. 검토하겠습니다."
                        : "Thank you for your report. We will review it."
            )}
            className="flex items-center gap-1.5 text-[10px] text-foreground/30 hover:text-destructive transition-colors mt-8"
        >
            <Flag className="w-3 h-3" />
            {label}
        </button>
    );
}


export default function FormulaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { language } = useI18nStore();
    const { result } = useAnalysisStore();
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
    // @ts-expect-error Volume might not be typed on the lean product interface
    const basicPriceText = formatGrundpreis(effectivePrice, product.volume_ml);

    const hasInci = (product.ingredients && product.ingredients.length > 0) || product.key_ingredients.length > 0;

    // i18n labels
    const accordionTitle = language === "de"
        ? "Zusammensetzung & Sicherheit"
        : language === "ko"
            ? "성분 & 안전 정보"
            : "Formula Details & Safety";

    const paoLabel = language === "de"
        ? "Verwendbar nach dem Öffnen"
        : language === "ko"
            ? "개봉 후 사용기한"
            : "Period After Opening";

    const euResponsibleLabel = language === "de"
        ? "EU-Verantwortliche Person"
        : language === "ko"
            ? "EU 책임자"
            : "EU Responsible Person";

    const dsaSellerLabel = language === "de"
        ? "Verkauf und Versand durch"
        : language === "ko"
            ? "판매 및 배송"
            : "Sold and shipped by";

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

            <main className="pt-24 pb-20 relative z-10" style={{ maxWidth: '960px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)' }}>
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
                        <div className="text-foreground/60 text-sm mb-1">
                            {product.type} · €{effectivePrice}
                            {basicPriceText && (
                                <span className="block text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
                                    {basicPriceText}
                                </span>
                            )}
                        </div>

                        {/* DSA KYBC Transparency — Seller Info */}
                        <p className="text-[11px] text-muted-foreground tracking-wide mt-1 mb-4">Verkauf und Versand durch: {(product as any).brand_name || 'Partner Brand'}</p>

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
                    {/* EU AI Act Art. 50 transparency */}
                    <AiGeneratedBadge />
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
                                Based on your {lowestScore} {AXIS_LABELS[lowestTarget]} score, this product is mapped to shift this vector by <strong className="text-primary">{(product.vectorImpact[lowestTarget] ?? 0) > 0 ? '+' : ''}{product.vectorImpact[lowestTarget] ?? 0} points</strong>. The key ingredients precisely trigger the mechanisms required for this professional improvement.
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

                {/* ── Phase 22: A11y Accordion — Zusammensetzung & Sicherheit ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-3xl border border-border bg-card mb-8 overflow-hidden"
                >
                    <Accordion.Root type="single" collapsible defaultValue="formula-safety">
                        <Accordion.Item value="formula-safety">
                            <Accordion.Trigger
                                className="w-full flex items-center justify-between p-6 md:p-8 text-left group
                                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:rounded-t-3xl
                                    transition-colors hover:bg-muted/30"
                            >
                                <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary">
                                    {accordionTitle}
                                </p>
                                <ChevronDown
                                    className="w-4 h-4 text-foreground/40 transition-transform duration-200 group-data-[state=open]:rotate-180"
                                    strokeWidth={1.5}
                                />
                            </Accordion.Trigger>
                            <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-6">
                                    {/* Full INCI List */}
                                    <div>
                                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/50 mb-3 flex items-center justify-between">
                                            <span>Full Ingredients (INCI)</span>
                                            <span className="text-foreground/30 text-[0.6rem]">ACTIVE CONCENTRATIONS</span>
                                        </p>
                                        {hasInci ? (
                                            <div className="flex flex-wrap gap-x-1.5 gap-y-2 text-[#1A1A1A] dark:text-gray-300 text-sm font-medium leading-relaxed">
                                                {(product.ingredients || product.key_ingredients).map((ing, i, arr) => (
                                                    <span key={`${ing}-${i}`}>
                                                        {ing}{i < arr.length - 1 ? ',' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <InciSkeleton />
                                        )}
                                    </div>

                                    {/* EU Cosmetics Regulation (MANDATORY ADDITION) */}
                                    <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                                        <div className="flex items-center gap-1 mt-4">
                                            <PackageOpen className="w-3.5 h-3.5 text-muted-foreground"/> 
                                            <span className="text-[10px] text-muted-foreground ml-1">{(product as any).pao_months || '12'}M</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-2">
                                            EU-Verantwortliche Person: {(product as any).eu_responsible_person || 'Skin Strategy Lab, Kurfürstenstraße 14, 60486 Frankfurt am Main'}
                                        </p>
                                    </div>
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>
                </motion.div>

                {/* Targeted Axes */}
                {product.target_axes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-8"
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

                {/* Verified Purchase Badge — future use with reviews */}
                {/* When reviews are implemented, render: <VerifiedPurchaseBadge /> next to each verified review */}
                <VerifiedPurchaseBadge className="hidden" />

                {/* Legal: MDR/HWG Medical Disclaimer */}
                <MedicalDisclaimer />

                {/* DSA Notice & Action (MANDATORY ADDITION) */}
                <button className="flex items-center gap-1.5 text-[10px] text-foreground/30 hover:text-destructive transition-colors mt-8"><Flag className="w-3 h-3" /> Dieses Produkt melden</button>
            </main>

            <Footer />
        </div>
    );
}
