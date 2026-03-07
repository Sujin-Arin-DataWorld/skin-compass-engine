import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";
import { useProductStore } from "@/store/productStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

export default function Wishlist() {
    const { isLoggedIn } = useAuthStore();
    const { items, loading, toggle } = useWishlist();
    const { addItem } = useCartStore();
    const { language } = useI18nStore();
    const { products } = useProductStore();

    const de = language === "de";

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-24 pb-24 px-6 md:px-10 max-w-3xl mx-auto relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <Heart className="w-6 h-6 text-primary" />
                    <h1 className="font-display text-2xl md:text-3xl font-light text-foreground">
                        {de ? "Wunschliste" : "Wishlist"}
                    </h1>
                    {items.length > 0 && (
                        <span className="rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-xs font-bold text-primary">
                            {items.length}
                        </span>
                    )}
                </div>

                {/* Not logged in */}
                {!isLoggedIn && (
                    <div className="rounded-2xl border border-border/50 bg-card p-10 text-center">
                        <Heart className="w-10 h-10 text-foreground/20 mx-auto mb-4" />
                        <p className="text-foreground/60 text-sm mb-5">
                            {de
                                ? "Melden Sie sich an, um Produkte auf Ihrer Wunschliste zu speichern."
                                : "Sign in to save products to your wishlist."}
                        </p>
                        <Link
                            to="/login?redirect=/wishlist"
                            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            {de ? "Anmelden" : "Sign In"}
                        </Link>
                    </div>
                )}

                {/* Loading */}
                {isLoggedIn && loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-border/50 bg-card h-28 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty */}
                {isLoggedIn && !loading && items.length === 0 && (
                    <div className="rounded-2xl border border-border/50 bg-card p-10 text-center">
                        <Heart className="w-10 h-10 text-foreground/20 mx-auto mb-4" />
                        <p className="text-foreground/60 text-sm mb-5">
                            {de
                                ? "Ihre Wunschliste ist noch leer. Führen Sie eine Hautdiagnose durch und speichern Sie empfohlene Produkte."
                                : "Your wishlist is empty. Run a skin diagnosis and save recommended products."}
                        </p>
                        <Link
                            to="/diagnosis"
                            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            {de ? "Diagnose starten" : "Start Diagnosis"}
                        </Link>
                    </div>
                )}

                {/* Wishlist items */}
                {isLoggedIn && !loading && items.length > 0 && (
                    <motion.div layout className="space-y-4">
                        <AnimatePresence>
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4"
                                >
                                    {/* Product image */}
                                    <Link to={`/formula/${item.product_id}`} className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-xl bg-white dark:bg-white/5 border border-border/30 flex items-center justify-center overflow-hidden">
                                            {item.product_image ? (
                                                <img
                                                    src={item.product_image}
                                                    alt={item.product_name}
                                                    className="max-w-full max-h-full object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-foreground/5 rounded-xl" />
                                            )}
                                        </div>
                                    </Link>

                                    {/* Name + price */}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/formula/${item.product_id}`}>
                                            <p className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
                                                {item.product_name}
                                            </p>
                                        </Link>
                                        {item.price != null && (
                                            <p className="text-sm font-display text-foreground/70 mt-0.5">
                                                €{item.price}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {products.find((p) => p.id === item.product_id) && (
                                        <button
                                            onClick={() => {
                                                const product = products.find((p) => p.id === item.product_id);
                                                if (product) {
                                                    addItem(product);
                                                    toast.success(de ? "Zum Warenkorb hinzugefügt" : "Added to cart");
                                                }
                                            }}
                                            aria-label={de ? "Zum Warenkorb" : "Add to cart"}
                                            className="rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/15 p-2 transition-colors"
                                        >
                                            <ShoppingBag className="w-4 h-4 text-primary" />
                                        </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                toggle({
                                                    product_id: item.product_id,
                                                    product_name: item.product_name,
                                                    product_image: item.product_image,
                                                    price: item.price,
                                                })
                                            }
                                            aria-label={de ? "Entfernen" : "Remove"}
                                            className="rounded-full border border-border/50 hover:border-red-400/40 hover:bg-red-400/10 p-2 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-foreground/40 hover:text-red-400 transition-colors" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    );
}
