import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronDown, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useOrders, type OrderItem, type OrderRecord } from "@/hooks/useOrders";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";
import type { Product } from "@/engine/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = "#D4AF37";
const BRONZE = "#947E5C";

// ── Status stepper configuration ──────────────────────────────────────────────
const STEPS = [
    { key: "pending",   en: "Placed",    de: "Bestellt"   },
    { key: "paid",      en: "Confirmed", de: "Bestätigt"  },
    { key: "shipped",   en: "Shipped",   de: "Versandt"   },
    { key: "delivered", en: "Delivered", de: "Geliefert"  },
] as const;

const STATUS_INDEX: Record<string, number> = {
    pending: 0, paid: 1, shipped: 2, delivered: 3,
};

const STATUS_BADGE: Record<string, { bg: string; color: string; en: string; de: string }> = {
    pending:   { bg: "rgba(148,126,92,0.12)",  color: BRONZE,    en: "Pending",   de: "Ausstehend" },
    paid:      { bg: "rgba(59,130,246,0.12)",  color: "#60A5FA", en: "Confirmed", de: "Bezahlt"    },
    shipped:   { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B", en: "Shipped",   de: "Versandt"   },
    delivered: { bg: "rgba(34,197,94,0.12)",   color: "#22C55E", en: "Delivered", de: "Geliefert"  },
    cancelled: { bg: "rgba(239,68,68,0.12)",   color: "#EF4444", en: "Cancelled", de: "Storniert"  },
};

// ── Build a minimal Product from an OrderItem for "Buy Again" ─────────────────
function minimalProduct(item: OrderItem): Product {
    return {
        id:             item.product_id,
        name:           { en: item.product_name, de: item.product_name },
        brand:          "",
        phase:          "",
        type:           "",
        price_eur:      item.unit_price,
        price:          item.unit_price,
        tier:           [],
        shopify_handle: item.product_id,
        key_ingredients: [],
        target_axes:    [],
        for_skin:       [],
    };
}

// ── Horizontal status stepper ─────────────────────────────────────────────────
function StatusStepper({ status, de }: { status: string; de: boolean }) {
    // Special case: cancelled order
    if (status === "cancelled") {
        const badge = STATUS_BADGE.cancelled;
        return (
            <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.65rem] font-semibold"
                style={{ background: badge.bg, color: badge.color }}
            >
                {de ? badge.de : badge.en}
            </span>
        );
    }

    const activeIdx = STATUS_INDEX[status] ?? 0;

    return (
        <div className="flex items-start w-full">
            {STEPS.map((step, i) => {
                const done   = i < activeIdx;
                const active = i === activeIdx;

                return (
                    <div key={step.key} className="flex items-center flex-1 min-w-0">
                        {/* Step dot + label */}
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div
                                className="relative flex items-center justify-center rounded-full transition-all duration-300"
                                style={{
                                    width:  active ? "20px" : "16px",
                                    height: active ? "20px" : "16px",
                                    background: done || active
                                        ? GOLD
                                        : "transparent",
                                    border: `2px solid ${done || active ? GOLD : "rgba(148,126,92,0.25)"}`,
                                    boxShadow: active
                                        ? `0 0 0 4px rgba(212,175,55,0.15)`
                                        : "none",
                                }}
                            >
                                {done && (
                                    <Check
                                        className="text-[#0a0a0a]"
                                        style={{ width: "9px", height: "9px" }}
                                        strokeWidth={3}
                                    />
                                )}
                                {active && (
                                    <div
                                        className="rounded-full"
                                        style={{ width: "6px", height: "6px", background: "#0a0a0a" }}
                                    />
                                )}
                            </div>

                            <p
                                className="text-center leading-tight whitespace-nowrap"
                                style={{
                                    fontSize: "0.55rem",
                                    letterSpacing: "0.04em",
                                    color: done || active
                                        ? GOLD
                                        : "rgba(148,126,92,0.45)",
                                }}
                            >
                                {de ? step.de : step.en}
                            </p>
                        </div>

                        {/* Connector line (skip after last step) */}
                        {i < STEPS.length - 1 && (
                            <div
                                className="flex-1 mx-1 mb-5"
                                style={{
                                    height: "2px",
                                    background: i < activeIdx
                                        ? GOLD
                                        : "rgba(148,126,92,0.18)",
                                    transition: "background 0.3s",
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Order card (accordion) ────────────────────────────────────────────────────
function OrderCard({ order, de }: { order: OrderRecord; de: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const [buying,   setBuying]   = useState(false);

    const { addItem } = useCartStore();
    const { products } = useProductStore();

    const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;

    const handleBuyAgain = () => {
        setBuying(true);
        order.items.forEach((item) => {
            const found = products.find((p) => p.id === item.product_id);
            const product = found ?? minimalProduct(item);
            for (let q = 0; q < item.quantity; q++) {
                addItem(product);
            }
        });
        toast.success(
            de
                ? "Alle Artikel wurden zum Warenkorb hinzugefügt"
                : "All items added to cart",
            { description: de ? `${order.items.length} Produkt(e)` : `${order.items.length} product(s)` }
        );
        setBuying(false);
    };

    // tracking_number may exist on the DB row even though the TS type doesn't declare it
    const trackingNumber = (order as OrderRecord & { tracking_number?: string }).tracking_number;

    return (
        <div
            className="rounded-2xl overflow-hidden
                bg-white dark:bg-[#111]
                border border-gray-200 dark:border-[#1e1e1e]
                transition-all duration-200"
        >
            {/* ── Collapsed header ── */}
            <button
                className="w-full flex items-start justify-between gap-4 p-5 text-left
                    hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                {/* Left: order meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p
                            className="text-[0.6rem] tracking-widest uppercase font-semibold"
                            style={{ color: GOLD }}
                        >
                            {de ? "Bestell-Nr." : "Order #"}
                            {order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-semibold"
                            style={{ background: badge.bg, color: badge.color }}
                        >
                            {de ? badge.de : badge.en}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#947E5C]">
                        {new Date(order.created_at).toLocaleDateString(
                            de ? "de-DE" : "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" }
                        )}
                    </p>
                </div>

                {/* Right: total + chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-[#e8e8e8]">
                        €{order.total.toFixed(2)}
                    </p>
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <ChevronDown
                            className="w-4 h-4 text-gray-400 dark:text-[#947E5C]"
                            strokeWidth={1.5}
                        />
                    </motion.div>
                </div>
            </button>

            {/* ── Status stepper — always visible ── */}
            <div className="px-5 pb-4">
                <StatusStepper status={order.status} de={de} />
            </div>

            {/* ── Expanded content ── */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className="mx-5 mb-5 rounded-xl p-4 space-y-3
                                bg-gray-50 dark:bg-[rgba(255,255,255,0.025)]
                                border border-gray-200 dark:border-[#1e1e1e]"
                        >
                            {/* Item list */}
                            <div className="space-y-2.5">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-800 dark:text-[#e8e8e8]">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs mt-0.5 text-gray-500 dark:text-[#947E5C]">
                                                {de ? "Menge" : "Qty"}: {item.quantity}
                                                {" · "}
                                                €{item.unit_price.toFixed(2)}
                                                {" "}
                                                {de ? "/ Stück" : "/ ea."}
                                            </p>
                                        </div>
                                        <p
                                            className="text-sm font-semibold flex-shrink-0 text-gray-700 dark:text-[#e8e8e8]"
                                        >
                                            €{(item.unit_price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Divider + totals */}
                            <div
                                className="flex items-center justify-between pt-3 border-t
                                    border-gray-200 dark:border-[#2a2a2a]"
                            >
                                <span
                                    className="text-xs uppercase tracking-widest font-semibold
                                        text-gray-500 dark:text-[#947E5C]"
                                >
                                    {de ? "Gesamt" : "Total"}
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-[#e8e8e8]">
                                    €{order.total.toFixed(2)}
                                </span>
                            </div>

                            {/* Tracking number */}
                            <div
                                className="flex items-center justify-between py-2.5 px-3 rounded-lg
                                    bg-white dark:bg-[rgba(255,255,255,0.03)]
                                    border border-gray-200 dark:border-[#2a2a2a]"
                            >
                                <span
                                    className="text-[0.65rem] uppercase tracking-widest
                                        text-gray-500 dark:text-[#947E5C]"
                                >
                                    {de ? "Sendungsnummer" : "Tracking No."}
                                </span>
                                <span className="text-xs font-mono text-gray-700 dark:text-[#e8e8e8]">
                                    {trackingNumber ?? "—"}
                                </span>
                            </div>

                            {/* Buy Again */}
                            <button
                                onClick={handleBuyAgain}
                                disabled={buying}
                                className="w-full min-h-[44px] flex items-center justify-center gap-2
                                    rounded-xl text-sm font-semibold
                                    border border-[rgba(212,175,55,0.3)]
                                    hover:bg-[rgba(212,175,55,0.06)] dark:hover:bg-[rgba(212,175,55,0.08)]
                                    transition-colors disabled:opacity-60"
                                style={{ color: GOLD }}
                            >
                                <RefreshCw
                                    className={`w-3.5 h-3.5 ${buying ? "animate-spin" : ""}`}
                                    strokeWidth={1.5}
                                />
                                {de ? "Erneut kaufen" : "Buy Again"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyOrders({ de }: { de: boolean }) {
    return (
        <div
            className="flex flex-col items-center justify-center py-20 rounded-2xl
                bg-white/50 dark:bg-white/[0.02]
                border border-gray-200 dark:border-[rgba(212,175,55,0.08)]"
            style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{ background: "rgba(212,175,55,0.07)" }}
            >
                <ShoppingBag className="w-7 h-7" strokeWidth={1.5} style={{ color: "rgba(212,175,55,0.4)" }} />
            </div>

            <p className="text-base font-medium text-gray-800 dark:text-[#e8e8e8] mb-1.5">
                {de ? "Noch keine Bestellungen" : "No orders yet"}
            </p>
            <p className="text-sm text-center max-w-xs mb-6 text-gray-500 dark:text-[#947E5C]">
                {de
                    ? "Ihre Bestellungen werden hier angezeigt, sobald Sie etwas kaufen."
                    : "Your orders will appear here once you make a purchase."}
            </p>

            <Link
                to="/results"
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: GOLD, color: "#0a0a0a" }}
            >
                {de ? "Empfehlungen ansehen" : "View Recommendations"}
            </Link>
        </div>
    );
}

// ── OrdersPage ────────────────────────────────────────────────────────────────
export default function OrdersPage({ de }: { de: boolean }) {
    const { orders, loading } = useOrders();

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-32 rounded-2xl animate-pulse
                            bg-gray-100 dark:bg-[#111]
                            border border-gray-200 dark:border-[#1e1e1e]"
                    />
                ))}
            </div>
        );
    }

    // ── Empty ─────────────────────────────────────────────────────────────────
    if (orders.length === 0) return <EmptyOrders de={de} />;

    // ── Order list ────────────────────────────────────────────────────────────
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <p
                    className="text-[0.6rem] tracking-widest uppercase font-semibold"
                    style={{ color: GOLD }}
                >
                    {de ? "Bestellverlauf" : "Order History"}
                </p>
                <span className="text-xs" style={{ color: BRONZE }}>
                    {orders.length} {de ? "Bestellung(en)" : orders.length === 1 ? "order" : "orders"}
                </span>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} de={de} />
                ))}
            </div>
        </div>
    );
}
