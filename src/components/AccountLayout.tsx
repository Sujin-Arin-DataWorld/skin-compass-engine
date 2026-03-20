import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Activity, Package, Heart, MapPin, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";

export type TabId = "profile" | "history" | "orders" | "wishlist" | "address";

const GOLD = "var(--ssl-accent)";
const BRONZE = "var(--ssl-accent-deep)";

const TABS = [
    { id: "profile" as TabId, Icon: User, en: "My Profile", de: "Mein Profil" },
    { id: "history" as TabId, Icon: Activity, en: "Skin Analysis", de: "Hautanalyse" },
    { id: "orders" as TabId, Icon: Package, en: "Orders", de: "Bestellungen" },
    { id: "wishlist" as TabId, Icon: Heart, en: "Wishlist", de: "Wunschliste" },
    { id: "address" as TabId, Icon: MapPin, en: "Addresses", de: "Adressen" },
];

interface Props {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    children: ReactNode;
}

export default function AccountLayout({ activeTab, onTabChange, children }: Props) {
    const { userProfile, logout } = useAuthStore();
    const { language } = useI18nStore();
    const navigate = useNavigate();
    const de = language === "de";

    const initials = [userProfile?.firstName?.[0], userProfile?.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase() || "?";

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen" style={{ background: "#F5F5F7", color: "#e8e8e8" }}>

            {/* ── Desktop sidebar ─────────────────────────────────── */}
            <aside
                className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col z-40 select-none"
                style={{ background: "#0d0d0d", borderRight: "1px solid rgba(45,107,74,0.1)" }}
            >
                {/* Brand */}
                <div className="px-6 pt-8 pb-5" style={{ borderBottom: "1px solid rgba(45,107,74,0.08)" }}>
                    <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: BRONZE, textTransform: "uppercase" }}>
                        Skin Strategy Lab
                    </p>
                    <p style={{ fontFamily: "'Georgia', serif", fontSize: "1.05rem", color: GOLD, marginTop: "0.25rem" }}>
                        {de ? "Mein Konto" : "My Account"}
                    </p>
                </div>

                {/* User info */}
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(45,107,74,0.08)" }}>
                    {userProfile?.avatar ? (
                        <img
                            src={userProfile.avatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover mb-3"
                            style={{ border: `1.5px solid ${GOLD}` }}
                        />
                    ) : (
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center mb-3 text-xs font-bold"
                            style={{
                                background: "rgba(45,107,74,0.1)",
                                border: "1.5px solid rgba(45,107,74,0.4)",
                                color: GOLD,
                            }}
                        >
                            {initials}
                        </div>
                    )}
                    <p className="text-sm font-medium truncate" style={{ color: "#e8e8e8" }}>
                        {userProfile?.firstName} {userProfile?.lastName}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: BRONZE }}>
                        {userProfile?.email}
                    </p>
                </div>

                {/* Nav — gliding background pill via layoutId */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {TABS.map(({ id, Icon, en, de: deLabel }) => {
                        const active = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onTabChange(id)}
                                className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-200"
                                style={{ color: active ? GOLD : BRONZE }}
                            >
                                {/* Gliding pill — shared layoutId so framer-motion animates between tabs */}
                                {active && (
                                    <motion.div
                                        layoutId="sidebar-active-pill"
                                        className="absolute inset-0 rounded-lg"
                                        style={{
                                            background: "rgba(45,107,74,0.09)",
                                            borderLeft: `2px solid ${GOLD}`,
                                        }}
                                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                                    />
                                )}
                                <Icon className="relative w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                                <span
                                    className="relative"
                                    style={{ fontSize: "0.8125rem", fontWeight: active ? 600 : 400 }}
                                >
                                    {de ? deLabel : en}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Sign out */}
                <div
                    className="px-3 pb-6"
                    style={{ borderTop: "1px solid rgba(45,107,74,0.08)", paddingTop: "1rem" }}
                >
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 hover:bg-red-500/10"
                        style={{ color: BRONZE }}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                        <span style={{ fontSize: "0.8125rem" }}>{de ? "Abmelden" : "Sign Out"}</span>
                    </button>
                </div>
            </aside>

            {/* ── Main content ────────────────────────────────────── */}
            <main className="md:pl-56 pb-[72px] md:pb-0 min-h-screen">
                <div className="max-w-2xl mx-auto px-5 py-8 md:px-10 md:py-12">

                    {/* Personalized greeting header */}
                    <div className="mb-8 md:mb-10">
                        <p
                            style={{
                                fontSize: "0.55rem",
                                letterSpacing: "0.32em",
                                color: BRONZE,
                                textTransform: "uppercase",
                                marginBottom: "0.3rem",
                            }}
                        >
                            {de ? "Willkommen zurück" : "Welcome back"}
                        </p>
                        <h1
                            style={{
                                fontFamily: "'Georgia', serif",
                                fontSize: "1.6rem",
                                color: "#f0f0f0",
                                lineHeight: 1.2,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {userProfile?.firstName || (de ? "Ihr Konto" : "Your Account")}
                        </h1>
                    </div>

                    {children}
                </div>
            </main>

            {/* ── Mobile bottom tab bar — Glassmorphism ───────────── */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid"
                style={{
                    gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
                    // Glassmorphism: semi-transparent dark + blur
                    background: "rgba(10,10,10,0.82)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderTop: "1px solid rgba(45,107,74,0.12)",
                    height: "60px",
                    paddingBottom: "env(safe-area-inset-bottom)",
                }}
            >
                {TABS.map(({ id, Icon, en, de: deLabel }) => {
                    const active = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className="relative flex flex-col items-center justify-center gap-0.5 transition-colors duration-200"
                            style={{ color: active ? GOLD : BRONZE }}
                        >
                            {/* Gliding top-edge indicator */}
                            {active && (
                                <motion.div
                                    layoutId="mobile-active-indicator"
                                    className="absolute top-0 rounded-full"
                                    style={{
                                        width: "20px",
                                        height: "2px",
                                        background: GOLD,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                    }}
                                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                                />
                            )}
                            <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            <span
                                style={{
                                    fontSize: "0.5rem",
                                    letterSpacing: "0.04em",
                                    fontWeight: active ? 600 : 400,
                                }}
                            >
                                {de ? deLabel : en}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
