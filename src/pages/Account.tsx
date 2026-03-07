import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DiagnosisHistoryPage from "@/pages/DiagnosisHistoryPage";
import { useI18nStore } from "@/store/i18nStore";
import AccountLayout, { type TabId } from "@/components/AccountLayout";
import ProfilePage from "@/pages/ProfilePage";
import AddressManager from "@/pages/AddressManager";
import WishlistGrid from "@/pages/WishlistGrid";
import OrdersPage from "@/pages/OrdersPage";


// ── Skeleton loader ───────────────────────────────────────────────────────
// Mirrors AccountLayout's structure so there's zero layout shift on load.
function AccountSkeleton() {
    const shimmer: React.CSSProperties     = { background: "rgba(255,255,255,0.04)" };
    const goldShimmer: React.CSSProperties = { background: "rgba(212,175,55,0.08)" };

    return (
        <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
            {/* Sidebar */}
            <aside
                className="hidden md:flex w-56 flex-col flex-shrink-0"
                style={{ background: "#0d0d0d", borderRight: "1px solid rgba(212,175,55,0.1)" }}
            >
                <div className="px-6 pt-8 pb-5 space-y-2" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                    <div className="h-1.5 w-20 rounded animate-pulse" style={goldShimmer} />
                    <div className="h-3.5 w-28 rounded animate-pulse" style={goldShimmer} />
                </div>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                    <div className="w-9 h-9 rounded-full animate-pulse mb-3" style={goldShimmer} />
                    <div className="h-2.5 w-28 rounded animate-pulse mb-1.5" style={shimmer} />
                    <div className="h-2 w-36 rounded animate-pulse" style={shimmer} />
                </div>
                <div className="px-3 py-4 space-y-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-9 rounded-lg animate-pulse" style={shimmer} />
                    ))}
                </div>
            </aside>

            {/* Content area */}
            <main className="flex-1 px-5 py-8 md:px-10 md:py-12">
                <div className="max-w-2xl space-y-5">
                    {/* Greeting shimmer — mirrors AccountLayout greeting header */}
                    <div className="mb-8 md:mb-10 space-y-2">
                        <div className="h-1.5 w-24 rounded animate-pulse" style={goldShimmer} />
                        <div className="h-6 w-40 rounded animate-pulse" style={shimmer} />
                    </div>
                    <div className="h-2 w-24 rounded animate-pulse" style={goldShimmer} />
                    <div className="h-36 rounded-2xl animate-pulse" style={{ ...shimmer, border: "1px solid rgba(212,175,55,0.07)" }} />
                    <div className="h-28 rounded-2xl animate-pulse" style={{ ...shimmer, border: "1px solid rgba(212,175,55,0.07)" }} />
                    <div className="h-20 rounded-2xl animate-pulse" style={{ ...shimmer, border: "1px solid rgba(212,175,55,0.07)" }} />
                </div>
            </main>

            {/* Mobile bottom bar — matches glassmorphism style */}
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] animate-pulse"
                style={{
                    background: "rgba(10,10,10,0.82)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderTop: "1px solid rgba(212,175,55,0.1)",
                }}
            />
        </div>
    );
}

// ── Valid tab IDs ─────────────────────────────────────────────────────────
const VALID_TABS: TabId[] = ["profile", "history", "orders", "wishlist", "address"];

// ── Account Page ───────────────────────────────────────────────────────────
export default function Account() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { language } = useI18nStore();
    const [sessionLoading, setSessionLoading] = useState(true);
    const de = language === "de";

    // Derive active tab from ?tab= URL param — supports deep-linking
    const tabParam  = searchParams.get("tab") as TabId | null;
    const activeTab: TabId = VALID_TABS.includes(tabParam as TabId) ? (tabParam as TabId) : "profile";

    const setActiveTab = (tab: TabId) => {
        setSearchParams({ tab }, { replace: true });
    };

    // Guard: redirect to login if no active session; show skeleton while resolving
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/login?redirect=/account");
            } else {
                setSessionLoading(false);
            }
        });
    }, [navigate]);

    if (sessionLoading) return <AccountSkeleton />;

    const CONTENT: Record<TabId, ReactNode> = {
        profile:  <ProfilePage de={de} />,
        history:  <DiagnosisHistoryPage de={de} />,
        orders:   <OrdersPage de={de} />,
        wishlist: <WishlistGrid de={de} />,
        address:  <AddressManager de={de} />,
    };

    return (
        <AccountLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {CONTENT[activeTab]}
                </motion.div>
            </AnimatePresence>
        </AccountLayout>
    );
}
