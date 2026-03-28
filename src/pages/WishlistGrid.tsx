import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = "var(--ssl-accent)";
const BRONZE = "var(--ssl-accent-deep)";

type CartBtnState = "idle" | "adding" | "added";

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyWishlist({ de }: { de: boolean }) {
    return (
        <div
            className="flex flex-col items-center justify-center py-20 rounded-2xl
                bg-white/50 dark:bg-white/[0.02]
                border border-gray-200 dark:border-[rgba(45,107,74,0.08)]"
            style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{ background: "rgba(45,107,74,0.07)" }}
            >
                <Heart className="w-7 h-7" strokeWidth={1.5} style={{ color: "rgba(45,107,74,0.4)" }} />
            </div>

            <p className="text-base font-medium text-gray-800 dark:text-[#e8e8e8] mb-1.5">
                {de ? "Ihre Wunschliste ist leer" : "Your wishlist is empty"}
            </p>
            <p className="text-sm text-center max-w-xs mb-6 text-gray-500 dark:text-[var(--ssl-accent-deep)]">
                {de
                    ? "Führen Sie eine Analyse durch, um personalisierte Produktempfehlungen zu erhalten."
                    : "Complete an analysis to receive personalized product recommendations."}
            </p>

            <Link
                to="/diagnosis"
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: GOLD, color: "#F5F5F7" }}
            >
                {de ? "Analyse starten" : "Start Analysis"}
            </Link>
        </div>
    );
}

// ── Wishlist card ─────────────────────────────────────────────────────────────
function WishlistCard({
    item, de, hasProduct, cartState, onToggle, onAddToCart,
}: {
    item: ReturnType<typeof useWishlist>["items"][number];
    de: boolean;
    hasProduct: boolean;
    cartState: CartBtnState;
    onToggle: () => void;
    onAddToCart: () => void;
}) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
            className="relative group flex flex-col rounded-2xl overflow-hidden
                bg-white dark:bg-[#111]
                border border-gray-200 dark:border-[#1e1e1e]
                hover:border-[rgba(45,107,74,0.4)] dark:hover:border-[rgba(45,107,74,0.3)]
                transition-all duration-300"
        >
            {/* Heart toggle — top right, spring physics pop */}
            <motion.button
                onClick={onToggle}
                whileTap={{ scale: 0.72 }}
                transition={{ type: "spring", stiffness: 600, damping: 14 }}
                aria-label={de ? "Aus der Wunschliste entfernen" : "Remove from wishlist"}
                className="absolute top-3 right-3 z-10
                    w-11 h-11 rounded-full flex items-center justify-center
                    bg-white/90 dark:bg-black/70 backdrop-blur-sm
                    border border-gray-200 dark:border-white/10
                    transition-colors hover:bg-red-50 dark:hover:bg-red-500/15
                    shadow-sm"
            >
                <Heart
                    className="w-4 h-4"
                    style={{ fill: "#EF4444", stroke: "#EF4444" }}
                    strokeWidth={1.5}
                />
            </motion.button>

            {/* Product image */}
            <Link to={`/formula/${item.product_id}`} tabIndex={-1}>
                <div
                    className="w-full aspect-square flex items-center justify-center overflow-hidden
                        bg-gray-50 dark:bg-[#0d0d0d]"
                >
                    {item.product_image ? (
                        <img
                            src={item.product_image}
                            alt={item.product_name}
                            loading="lazy"
                            className="w-full h-full object-contain p-5
                                transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div
                            className="w-16 h-16 rounded-full"
                            style={{ background: "rgba(45,107,74,0.08)" }}
                        />
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex flex-col flex-1 gap-2 p-4">
                <Link to={`/formula/${item.product_id}`}>
                    <p className="text-sm font-medium leading-snug line-clamp-2
                        text-gray-900 dark:text-[#e8e8e8]
                        hover:opacity-75 transition-opacity">
                        {item.product_name}
                    </p>
                </Link>

                {item.price != null && (
                    <p className="text-sm font-semibold" style={{ color: GOLD }}>
                        €{item.price.toFixed(2)}
                    </p>
                )}

                {/* Add to cart button */}
                <button
                    onClick={onAddToCart}
                    disabled={!hasProduct || cartState === "adding"}
                    className={`mt-auto flex items-center justify-center gap-2
                        w-full min-h-[44px] py-2 rounded-xl
                        text-xs font-semibold
                        transition-all duration-300
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${cartState === "added"
                            ? "border border-green-500/40 bg-green-50 dark:bg-green-500/10"
                            : "border border-gray-200 dark:border-[#2a2a2a] hover:border-[rgba(45,107,74,0.5)] dark:hover:border-[rgba(45,107,74,0.4)]"
                        }`}
                >
                    {cartState === "adding" && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 dark:text-[var(--ssl-accent-deep)]" />
                    )}
                    {cartState === "added" && (
                        <Check className="w-3.5 h-3.5" style={{ color: "#4ADE80" }} strokeWidth={2} />
                    )}
                    {cartState === "idle" && (
                        <ShoppingBag
                            className="w-3.5 h-3.5 text-gray-500 dark:text-[var(--ssl-accent-deep)]"
                            strokeWidth={1.5}
                        />
                    )}
                    <span
                        className={cartState === "added"
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-[var(--ssl-accent-deep)]"}
                    >
                        {cartState === "adding"
                            ? (de ? "Füge hinzu…" : "Adding…")
                            : cartState === "added"
                                ? (de ? "Hinzugefügt!" : "Added!")
                                : (de ? "In den Warenkorb" : "Add to Cart")}
                    </span>
                </button>
            </div>
        </motion.article>
    );
}

// ── WishlistGrid ──────────────────────────────────────────────────────────────
export default function WishlistGrid({ de }: { de: boolean }) {
    const { items, loading, toggle } = useWishlist();
    const { addItem } = useCartStore();
    const { products } = useProductStore();

    const [cartStates, setCartStates] = useState<Record<string, CartBtnState>>({});

    const handleAddToCart = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        setCartStates((prev) => ({ ...prev, [productId]: "adding" }));
        addItem(product);

        setTimeout(() => {
            setCartStates((prev) => ({ ...prev, [productId]: "added" }));
            toast.success(de ? "Zum Warenkorb hinzugefügt" : "Added to cart");

            setTimeout(() => {
                setCartStates((prev) => ({ ...prev, [productId]: "idle" }));
            }, 1500);
        }, 320);
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="aspect-[3/4] rounded-2xl animate-pulse
                            bg-gray-100 dark:bg-[#111]
                            border border-gray-200 dark:border-[#1e1e1e]"
                    />
                ))}
            </div>
        );
    }

    // ── Empty state ────────────────────────────────────────────────────────────
    if (items.length === 0) return <EmptyWishlist de={de} />;

    // ── Grid ──────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <p
                    className="text-[0.6rem] tracking-widest uppercase font-semibold"
                    style={{ color: GOLD }}
                >
                    {de ? "Gespeicherte Produkte" : "Saved Products"}
                </p>
                <span className="text-xs" style={{ color: BRONZE }}>
                    {items.length} {de ? "Artikel" : items.length === 1 ? "item" : "items"}
                </span>
            </div>

            <AnimatePresence mode="popLayout">
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const product = products.find((p) => p.id === item.product_id);
                        return (
                            <WishlistCard
                                key={item.id}
                                item={item}
                                de={de}
                                hasProduct={!!product}
                                cartState={cartStates[item.product_id] ?? "idle"}
                                onToggle={() =>
                                    toggle({
                                        product_id: item.product_id,
                                        product_name: item.product_name,
                                        product_image: item.product_image,
                                        price: item.price,
                                    })
                                }
                                onAddToCart={() => handleAddToCart(item.product_id)}
                            />
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
