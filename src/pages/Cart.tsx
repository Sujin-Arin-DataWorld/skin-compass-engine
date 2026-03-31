import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useOrders } from "@/hooks/useOrders";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";
import { useI18nStore } from "@/store/i18nStore";
import { formatGrundpreis } from "@/utils/priceUtils";

export default function Cart() {
  const { items, removeItem, updateQty, clear, totalItems, totalPrice } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const { language } = useI18nStore();
  
  const CHECKOUT_LABELS = {
    de: "Zahlungspflichtig bestellen",
    en: "Order with obligation to pay",
    ko: "결제 의무 주문하기", // Literal Korean translation of German law requirement
  };
  const checkoutText = CHECKOUT_LABELS[language as keyof typeof CHECKOUT_LABELS] || CHECKOUT_LABELS.en;
  const { placeOrder } = useOrders();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to complete your purchase.");
      navigate("/login?redirect=/cart");
      return;
    }

    setPlacing(true);
    const { orderId, error } = await placeOrder(items);
    setPlacing(false);

    if (error || !orderId) {
      toast.error(error ?? "Could not place order. Please try again.");
      return;
    }

    clear();
    toast.success(`Order ${orderId.slice(0, 8).toUpperCase()} placed!`, {
      description: "Check your profile for order details.",
    });
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      <SilkBackground />
      <Navbar />

      <main className="pt-24 pb-20 relative z-10" style={{ maxWidth: '960px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)' }}>
        <Link
          to="/results"
          className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground mb-8 transition-colors"
        >
          ← Back to Results
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-light text-foreground">
            Your Cart
          </h1>
          {totalItems() > 0 && (
            <span className="rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-xs font-bold text-primary">
              {totalItems()} item{totalItems() !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-card p-12 text-center"
          >
            <ShoppingBag className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60 text-sm mb-6">Your cart is empty.</p>
            <Link
              to="/results"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              View Recommendations <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Cart items */}
            <div className="space-y-3 mb-6">
              <AnimatePresence>
                {items.map((item) => {
                  const price = item.product.price ?? item.product.price_eur;
                  // @ts-expect-error Volume might not be typed on the lean product interface, but exists in DB
                  const basicPriceText = formatGrundpreis(price, item.product.volume_ml);
                  
                  return (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -60 }}
                      className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4"
                    >
                      {/* Image / placeholder */}
                      <div className="relative w-16 h-16 rounded-xl bg-primary/8 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <span className="text-2xl">🧴</span>
                        <img src={`/productsimage/${item.product.id}.jpeg`} alt={item.product.name.en} className="absolute inset-0 w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-primary mb-0.5">
                          {item.product.brand}
                        </p>
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {item.product.name.en}
                        </p>
                        <p className="text-xs text-foreground/50 mt-0.5">{item.product.type}</p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQty(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0 min-w-[70px]">
                        <p className="font-display text-base font-bold text-foreground">
                          €{(price * item.quantity).toFixed(2)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-foreground/40">€{price} each</p>
                        )}
                        {basicPriceText && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
                            {basicPriceText}
                          </p>
                        )}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-card p-6 mb-4"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                <p className="text-sm text-foreground/60">Subtotal ({totalItems()} items)</p>
                <p className="font-display text-lg font-bold text-foreground">
                  €{totalPrice().toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-foreground/60">Shipping (EU)</p>
                <p className="text-sm text-foreground/60">Calculated at checkout</p>
              </div>
              <p className="text-xs text-foreground/40 mb-6">Free shipping on orders over €60</p>

              <button
                onClick={handleCheckout}
                disabled={placing}
                className="w-full rounded-2xl py-4 font-bold text-xs sm:text-sm tracking-wide uppercase bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex flex-wrap items-center justify-center gap-2 px-4 disabled:opacity-60 leading-tight"
              >
                {placing ? (
                  <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Placing Order…</>
                ) : (
                  <><span className="text-center">{checkoutText}</span> <ArrowRight className="w-4 h-4 shrink-0" /></>
                )}
              </button>

              <p className="text-xs text-foreground/40 text-center mt-3">
                Secure checkout · Cancel anytime · Ships EU 3–5 days
              </p>
            </motion.div>

            {/* Clear cart */}
            <button
              onClick={() => {
                clear();
                toast.info("Cart cleared.");
              }}
              className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors underline underline-offset-2 mx-auto block"
            >
              Clear cart
            </button>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
