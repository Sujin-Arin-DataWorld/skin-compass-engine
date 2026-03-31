import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronDown, Check, RefreshCw, Undo2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOrders, type OrderItem, type OrderRecord } from "@/hooks/useOrders";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";
import { useI18nStore } from "@/store/i18nStore";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/engine/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = "var(--ssl-accent)";
const BRONZE = "var(--ssl-accent-deep)";

// ── Status stepper configuration ──────────────────────────────────────────────
const STEPS = [
    { key: "pending", en: "Placed", de: "Bestellt" },
    { key: "paid", en: "Confirmed", de: "Bestätigt" },
    { key: "shipped", en: "Shipped", de: "Versandt" },
    { key: "delivered", en: "Delivered", de: "Geliefert" },
] as const;

const STATUS_INDEX: Record<string, number> = {
    pending: 0, paid: 1, shipped: 2, delivered: 3,
};

const STATUS_BADGE: Record<string, { bg: string; color: string; en: string; de: string }> = {
    pending: { bg: "rgba(148,126,92,0.12)", color: BRONZE, en: "Pending", de: "Ausstehend" },
    paid: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", en: "Confirmed", de: "Bezahlt" },
    shipped: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", en: "Shipped", de: "Versandt" },
    delivered: { bg: "rgba(34,197,94,0.12)", color: "#22C55E", en: "Delivered", de: "Geliefert" },
    cancelled: { bg: "rgba(239,68,68,0.12)", color: "#EF4444", en: "Cancelled", de: "Storniert" },
};

// ── Phase 25 REV2: Cancellation eligibility (§ 356a BGB 2026) ─────────────────
const isEligibleForCancellation = (deliveredAt: string | null): boolean => {
  // 1. If not yet delivered (processing/shipped), user has the absolute right to cancel IMMEDIATELY.
  if (!deliveredAt) return true; 

  const deliveryDate = new Date(deliveredAt);
  if (isNaN(deliveryDate.getTime())) return false; // Safety check
  
  // 2. The window closes exactly 14 days after delivery, at 23:59:59 local time.
  const deadlineDate = new Date(deliveryDate.getTime() + (14 * 24 * 60 * 60 * 1000));
  deadlineDate.setHours(23, 59, 59, 999);
  
  return Date.now() <= deadlineDate.getTime();
};

// ── Phase 25: Withdrawal Modal (2-step Framer Motion) ─────────────────────────
function WithdrawalModal({
    order, de, onClose, onSuccess,
}: {
    order: OrderRecord; de: boolean; onClose: () => void; onSuccess: () => void;
}) {
    const [step, setStep] = useState(1);
    const [isCancelling, setIsCancelling] = useState(false);
    const { language } = useI18nStore();
    const { userProfile } = useAuthStore();

    const handleConfirmWithdrawal = async () => {
        try {
            setIsCancelling(true);

            // 1. Backend Mutation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('orders')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: 'BGB §356a User Withdrawal',
                })
                .eq('id', order.id)
                .eq('user_id', userProfile?.userId ?? '');

            if (error) throw error;

            // 2. Success Feedback
            toast.success(
                language === 'de' ? 'Vertrag erfolgreich widerrufen.' :
                language === 'ko' ? '계약이 성공적으로 철회되었습니다.' :
                'Contract successfully cancelled.',
                { description: de ? `Bestell-Nr. ${order.id.slice(0, 8).toUpperCase()}` : `Order #${order.id.slice(0, 8).toUpperCase()}` }
            );
            onSuccess();
        } catch (err) {
            console.error('Cancellation error:', err);
            toast.error(
                language === 'de' ? 'Fehler bei der Stornierung. Bitte kontaktieren Sie den Support.' :
                language === 'ko' ? '취소 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.' :
                'Error processing cancellation. Please contact support.'
            );
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="w-full max-w-[440px] rounded-2xl overflow-hidden
                    bg-white dark:bg-[#111]
                    border border-gray-200 dark:border-[#2a2a2a]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2">
                        <Undo2 className="w-5 h-5" strokeWidth={1.5} style={{ color: GOLD }} />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e8e8]">
                            {de ? "Vertrag widerrufen" : "Withdraw from Contract"}
                        </h2>
                    </div>
                    <button onClick={onClose}>
                        <X className="w-4 h-4 text-gray-400 dark:text-[var(--ssl-accent-deep)]" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Steps */}
                <div className="p-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {step === 1 && (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500 dark:text-[var(--ssl-accent-deep)] mb-3">
                                        {de ? "Bitte überprüfen Sie Ihre Daten:" : "Please review your details:"}
                                    </p>

                                    <div className="rounded-xl p-4 bg-gray-50 dark:bg-[rgba(255,255,255,0.025)] border border-gray-200 dark:border-[#2a2a2a] space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-gray-500 dark:text-[var(--ssl-accent-deep)]">
                                                {de ? "Bestell-Nr." : "Order #"}
                                            </span>
                                            <span className="text-xs font-mono text-gray-900 dark:text-[#e8e8e8]">
                                                {order.id.slice(0, 8).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-gray-500 dark:text-[var(--ssl-accent-deep)]">
                                                {de ? "Bestelldatum" : "Order Date"}
                                            </span>
                                            <span className="text-xs text-gray-900 dark:text-[#e8e8e8]">
                                                {new Date(order.created_at).toLocaleDateString(de ? 'de-DE' : 'en-GB')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-gray-500 dark:text-[var(--ssl-accent-deep)]">
                                                {de ? "Betrag" : "Amount"}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-[#e8e8e8]">
                                                €{order.total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        {order.items.map((item, i) => (
                                            <p key={i} className="text-xs text-gray-600 dark:text-[#ccc]">
                                                {item.quantity}× {item.product_name}
                                            </p>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setStep(2)}
                                        className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                                        style={{ background: GOLD, color: '#F5F5F7' }}
                                    >
                                        {de ? "Weiter" : "Continue"}
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-700 dark:text-[#e8e8e8] leading-relaxed">
                                        {de
                                            ? "Hiermit widerrufe ich den Vertrag über die Lieferung der oben genannten Waren gemäß § 355 BGB."
                                            : "I hereby withdraw from the contract for the delivery of the above goods pursuant to § 355 BGB."}
                                    </p>

                                    <p className="text-xs text-gray-500 dark:text-[var(--ssl-accent-deep)] leading-relaxed">
                                        {de
                                            ? "Sie erhalten eine Bestätigung per E-Mail. Die Erstattung erfolgt innerhalb von 14 Tagen nach Eingang der Rücksendung."
                                            : "You will receive a confirmation by email. The refund will be processed within 14 days of receiving the returned goods."}
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                                border border-gray-200 dark:border-[#2a2a2a]
                                                text-gray-600 dark:text-[var(--ssl-accent-deep)]"
                                        >
                                            {de ? "Zurück" : "Back"}
                                        </button>
                                        <button
                                            onClick={handleConfirmWithdrawal}
                                            disabled={isCancelling}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60 flex items-center justify-center gap-2"
                                            style={{ background: '#EF4444', color: '#fff' }}
                                        >
                                            {isCancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            {de ? "Widerruf bestätigen" : "Confirm Withdrawal"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

// ── Build a minimal Product from an OrderItem for "Buy Again" ─────────────────
function minimalProduct(item: OrderItem): Product {
    return {
        id: item.product_id,
        name: { en: item.product_name, de: item.product_name },
        brand: "",
        phase: "",
        type: "",
        price_eur: item.unit_price,
        price: item.unit_price,
        tier: [],
        shopify_handle: item.product_id,
        key_ingredients: [],
        target_axes: [],
        for_skin: [],
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
                const done = i < activeIdx;
                const active = i === activeIdx;

                return (
                    <div key={step.key} className="flex items-center flex-1 min-w-0">
                        {/* Step dot + label */}
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div
                                className="relative flex items-center justify-center rounded-full transition-all duration-300"
                                style={{
                                    width: active ? "20px" : "16px",
                                    height: active ? "20px" : "16px",
                                    background: done || active
                                        ? GOLD
                                        : "transparent",
                                    border: `2px solid ${done || active ? GOLD : "rgba(148,126,92,0.25)"}`,
                                    boxShadow: active
                                        ? `0 0 0 4px rgba(45,107,74,0.15)`
                                        : "none",
                                }}
                            >
                                {done && (
                                    <Check
                                        className="text-[#F5F5F7]"
                                        style={{ width: "9px", height: "9px" }}
                                        strokeWidth={3}
                                    />
                                )}
                                {active && (
                                    <div
                                        className="rounded-full"
                                        style={{ width: "6px", height: "6px", background: "#F5F5F7" }}
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
    const [buying, setBuying] = useState(false);
    const [withdrawalOpen, setWithdrawalOpen] = useState(false);

    const { addItem } = useCartStore();
    const { products } = useProductStore();

    const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
    // Don't show cancel button if already cancelled, otherwise check eligibility
    const canCancel = order.status !== 'cancelled' && isEligibleForCancellation(order.delivered_at);

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
                    <p className="text-xs text-gray-500 dark:text-[var(--ssl-accent-deep)]">
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
                            className="w-4 h-4 text-gray-400 dark:text-[var(--ssl-accent-deep)]"
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
                                            <p className="text-xs mt-0.5 text-gray-500 dark:text-[var(--ssl-accent-deep)]">
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
                                        text-gray-500 dark:text-[var(--ssl-accent-deep)]"
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
                                        text-gray-500 dark:text-[var(--ssl-accent-deep)]"
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
                                    border border-[rgba(45,107,74,0.3)]
                                    hover:bg-[rgba(45,107,74,0.06)] dark:hover:bg-[rgba(45,107,74,0.08)]
                                    transition-colors disabled:opacity-60"
                                style={{ color: GOLD }}
                            >
                                <RefreshCw
                                    className={`w-3.5 h-3.5 ${buying ? "animate-spin" : ""}`}
                                    strokeWidth={1.5}
                                />
                                {de ? "Erneut kaufen" : "Buy Again"}
                            </button>

                            {/* Phase 25: Widerrufsbutton (§ 356a BGB 2026) */}
                            {canCancel && (
                                <button
                                    onClick={() => setWithdrawalOpen(true)}
                                    className="w-full min-h-[44px] flex items-center justify-center gap-2
                                        rounded-xl text-sm font-semibold
                                        border border-red-200 dark:border-red-900/50
                                        bg-red-50/50 dark:bg-red-950/20
                                        text-red-600 dark:text-red-400
                                        hover:bg-red-100/50 dark:hover:bg-red-950/40
                                        transition-colors"
                                >
                                    <Undo2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {de ? "Vertrag widerrufen" : "Withdraw from Contract"}
                                </button>
                            )}
                        </div>

                        {/* Withdrawal Modal */}
                        <AnimatePresence>
                            {withdrawalOpen && (
                                <WithdrawalModal
                                    order={order}
                                    de={de}
                                    onClose={() => setWithdrawalOpen(false)}
                                    onSuccess={() => { setWithdrawalOpen(false); window.location.reload(); }}
                                />
                            )}
                        </AnimatePresence>
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
                border border-gray-200 dark:border-[rgba(45,107,74,0.08)]"
            style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{ background: "rgba(45,107,74,0.07)" }}
            >
                <ShoppingBag className="w-7 h-7" strokeWidth={1.5} style={{ color: "rgba(45,107,74,0.4)" }} />
            </div>

            <p className="text-base font-medium text-gray-800 dark:text-[#e8e8e8] mb-1.5">
                {de ? "Noch keine Bestellungen" : "No orders yet"}
            </p>
            <p className="text-sm text-center max-w-xs mb-6 text-gray-500 dark:text-[var(--ssl-accent-deep)]">
                {de
                    ? "Ihre Bestellungen werden hier angezeigt, sobald Sie etwas kaufen."
                    : "Your orders will appear here once you make a purchase."}
            </p>

            <Link
                to="/results"
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: GOLD, color: "#F5F5F7" }}
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
