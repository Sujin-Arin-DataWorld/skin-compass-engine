import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useProfile } from "@/hooks/useProfile";
import { useOrders } from "@/hooks/useOrders";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { useI18nStore, translations } from "@/store/i18nStore";
import RadarChart from "@/components/diagnosis/RadarChart";
import { AXIS_LABELS, AXIS_KEYS, Product } from "@/engine/types";
import type { Address } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";
import { useTheme } from "next-themes";
import { Moon, Sun, Globe } from "lucide-react";

/* ── Settings Controls ── */
export function GlobalSettings() {
    const { theme, setTheme } = useTheme();
    const { language, toggleLanguage } = useI18nStore();

    return (
        <div className="flex gap-4 justify-center mt-6">
            <button
                onClick={toggleLanguage}
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)] transition-colors hover:border-primary/40 bg-card/50 shadow-sm"
            >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{language}</span>
            </button>
            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40 bg-card/50 shadow-sm"
            >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
        </div>
    );
}

type Tab = "progress" | "addresses" | "orders";

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${active ? "text-primary" : "text-foreground/50 hover:text-foreground/70"
                }`}
        >
            {label}
            {active && (
                <motion.div
                    layoutId="profile-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
            )}
        </button>
    );
}

/* ── Skin Progress Tab ── */
function SkinProgressTab() {
    const diagnosisResult = useDiagnosisStore((s) => s.result);
    const { userProfile } = useAuthStore();
    const { language } = useI18nStore();
    const t = translations[language];

    const latestResult = diagnosisResult ?? userProfile?.savedResults[0] ?? null;
    const previousResult = userProfile?.savedResults[1] ?? null; // For historical trend tracking

    const allProducts: Product[] = latestResult
        ? Object.values(latestResult.product_bundle).flat()
        : [];

    return (
        <div className="space-y-6">
            {/* 10-Axis Vector Radar Chart */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 text-center">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-2">
                    {t.myVector}
                </p>
                {latestResult ? (
                    <div className="mt-4 flex flex-col items-center">
                        <RadarChart result={latestResult} />

                        {previousResult && (
                            <div className="mt-6 flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2">
                                <span className="text-xs text-foreground/60 font-medium">{t.profileTab.progressDetected}</span>
                                <span className="text-xs font-bold text-primary">{t.profileTab.vectorOptimized}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-foreground/40 italic py-10">
                        {t.noDiagnosis}{" "}
                        <Link to="/diagnosis" className="text-primary hover:underline">{t.startNow}</Link>
                    </p>
                )}
            </div>

            {/* 5 Formulas */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-4">
                    {t.myRoutine}
                </p>
                {allProducts.length > 0 ? (
                    <div className="space-y-2.5">
                        {allProducts.slice(0, 5).map((product) => (
                            <Link
                                key={product.id}
                                to={`/formula/${product.id}`}
                                className="flex items-center gap-4 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors group"
                            >
                                <div className="w-11 h-11 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg opacity-40">🧴</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[0.6rem] font-bold tracking-widest uppercase text-primary">{product.brand}</p>
                                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                        {product.name.en}
                                    </p>
                                </div>
                                <span className="text-xs text-foreground/40">€{product.price_eur}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-foreground/40 italic">{t.profileTab.noProducts}</p>
                )}
            </div>

            {/* History count */}
            {userProfile && userProfile.savedResults.length > 1 && (
                <p className="text-xs text-foreground/40 text-center">
                    {userProfile.savedResults.length} {t.diagnosesSaved}
                </p>
            )}

            {/* ── Diagnosis Timeline ── */}
            {userProfile && userProfile.savedResults.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-4">
                        {language === "ko" ? "진단 타임라인" : language === "de" ? "Diagnose-Timeline" : "Diagnosis Timeline"}
                    </p>

                    <div className="relative">
                        {/* Vertical timeline line */}
                        <div
                            className="absolute left-3 top-2 bottom-2 w-px"
                            style={{ background: "hsl(var(--border))" }}
                        />

                        <div className="space-y-4">
                            {userProfile.savedResults.slice(0, 5).map((saved, idx) => {
                                const date = saved.engineVersion
                                    ? new Date().toLocaleDateString(
                                        language === "ko" ? "ko-KR" : language === "de" ? "de-DE" : "en-GB",
                                        { day: "numeric", month: "short", year: "numeric" }
                                    )
                                    : "—";

                                const topAxis = saved.primary_concerns?.[0] ?? "sen";
                                const routineProducts: Product[] = saved.product_bundle
                                    ? Object.values(saved.product_bundle).flat()
                                    : [];
                                const specialCarePicks: Product[] = saved.special_care_picks ?? [];

                                return (
                                    <div key={idx} className="relative pl-8">
                                        {/* Timeline dot */}
                                        <div
                                            className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2"
                                            style={{
                                                borderColor: idx === 0 ? "hsl(var(--primary))" : "hsl(var(--border))",
                                                background: idx === 0 ? "hsl(var(--primary))" : "hsl(var(--card))",
                                            }}
                                        />

                                        {/* Entry card */}
                                        <div
                                            className="rounded-xl border p-3"
                                            style={{
                                                borderColor: idx === 0 ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.5)",
                                                background: idx === 0 ? "hsl(var(--primary) / 0.04)" : "transparent",
                                            }}
                                        >
                                            {/* Date + Primary Axis */}
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[0.65rem] font-bold tracking-widest uppercase"
                                                    style={{ color: idx === 0 ? "hsl(var(--primary))" : "hsl(var(--foreground-hint))" }}
                                                >
                                                    {date}
                                                </p>
                                                <span className="text-[0.6rem] font-medium px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: "hsl(var(--muted))",
                                                        color: "hsl(var(--foreground-hint))",
                                                    }}
                                                >
                                                    {language === "ko" ? "주요 관심사" : language === "de" ? "Hauptfokus" : "Primary"}: {topAxis}
                                                </span>
                                            </div>

                                            {/* Base Routine */}
                                            {routineProducts.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-[0.55rem] font-bold tracking-[0.12em] uppercase mb-1"
                                                        style={{ color: "hsl(var(--foreground-hint))" }}
                                                    >
                                                        {language === "ko" ? "시스템 기본 루틴" : language === "de" ? "System-Basisroutine" : "System Base Routine"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {routineProducts.slice(0, 5).map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="text-[0.65rem] px-2 py-0.5 rounded-md"
                                                                style={{
                                                                    background: "hsl(var(--muted) / 0.5)",
                                                                    color: "hsl(var(--foreground))",
                                                                }}
                                                            >
                                                                {p.brand}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Special Care Add-ons */}
                                            {specialCarePicks.length > 0 && (
                                                <div>
                                                    <p className="text-[0.55rem] font-bold tracking-[0.12em] uppercase mb-1"
                                                        style={{ color: "hsl(var(--primary))" }}
                                                    >
                                                        {language === "ko" ? "맞춤 특수 케어" : language === "de" ? "Spezial-Pflege Add-ons" : "My Special Care Add-ons"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {specialCarePicks.map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="text-[0.65rem] px-2 py-0.5 rounded-md"
                                                                style={{
                                                                    background: "hsl(var(--primary) / 0.1)",
                                                                    color: "hsl(var(--primary))",
                                                                    border: "1px solid hsl(var(--primary) / 0.2)",
                                                                }}
                                                            >
                                                                {p.brand} — {p.name.en}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Address Book Tab ── */
function AddressBookTab() {
    const { userProfile, addAddress, removeAddress } = useAuthStore();
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ label: "", name: "", street: "", city: "", zip: "", country: "Deutschland" });

    const { language } = useI18nStore();
    const t = translations[language];

    const handleAdd = () => {
        if (!form.name || !form.street || !form.city || !form.zip) return;
        const addr: Address = { id: Date.now().toString(), ...form };
        addAddress(addr);
        setForm({ label: "", name: "", street: "", city: "", zip: "", country: "Deutschland" });
        setAdding(false);
    };

    const addresses = userProfile?.addresses ?? [];

    return (
        <div className="space-y-4">
            {addresses.length === 0 && !adding && (
                <p className="text-sm text-foreground/40 italic text-center py-6">
                    {t.profileTab.noAddresses}
                </p>
            )}

            {addresses.map((addr) => (
                <div key={addr.id} className="rounded-2xl border border-border bg-card p-5 relative">
                    {addr.label && (
                        <span className="text-[0.6rem] font-bold tracking-widest uppercase text-primary">{addr.label}</span>
                    )}
                    <p className="text-sm text-foreground font-medium mt-1">{addr.name}</p>
                    <p className="text-sm text-foreground/60">{addr.street}</p>
                    <p className="text-sm text-foreground/60">{addr.zip} {addr.city}, {addr.country}</p>
                    <button
                        onClick={() => removeAddress(addr.id)}
                        className="absolute top-4 right-4 text-xs text-foreground/30 hover:text-red-400 transition-colors"
                    >
                        {t.profileTab.remove}
                    </button>
                </div>
            ))}

            {adding ? (
                <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-3">
                    <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">{t.profileTab.newAddress}</p>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={t.profileTab.labelHome} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.profileTab.fullName} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder={t.profileTab.street} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    <div className="grid grid-cols-2 gap-3">
                        <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder={t.profileTab.zip} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={t.profileTab.city} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={handleAdd} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">{t.profileTab.save}</button>
                        <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-4 py-2 text-sm text-foreground/60">{t.profileTab.cancel}</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="w-full rounded-2xl border border-dashed border-border py-4 text-sm text-foreground/50 hover:text-primary hover:border-primary/40 transition-colors"
                >
                    {t.profileTab.addAddress}
                </button>
            )}
        </div>
    );
}

/* ── Order History Tab ── */
function OrderHistoryTab() {
    const { orders, loading } = useOrders();
    const { language } = useI18nStore();
    const t = translations[language];

    const statusLabel: Record<string, string> = {
        pending: t.profileTab.pending,
        shipped: t.profileTab.shipped,
        delivered: t.profileTab.delivered,
    };
    const statusColor: Record<string, string> = {
        pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
        shipped: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        delivered: "bg-green-500/15 text-green-600 dark:text-green-400",
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <p className="text-sm text-foreground/40 italic text-center py-10">
                {t.profileTab.noOrders}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs text-foreground/40 font-mono">{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-foreground/50 mt-0.5">
                                {new Date(order.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${statusColor[order.status]}`}>
                            {statusLabel[order.status]}
                        </span>
                    </div>
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                            <span className="text-sm text-foreground">{item.product_name} × {item.quantity}</span>
                            <span className="text-sm text-foreground/60">€{item.unit_price.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-end mt-2">
                        <span className="text-sm font-bold text-foreground">{t.profileTab.total} €{order.total.toFixed(2)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Main Profile Page ── */
export default function Profile() {
    const { isLoggedIn, userProfile, logout } = useAuthStore();
    const { updateProfile } = useProfile();
    const { language } = useI18nStore();
    const t = translations[language];
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>("progress");
    const [editingName, setEditingName] = useState(false);
    const [saving, setSaving] = useState(false);
    const [firstName, setFirstName] = useState(userProfile?.firstName ?? "");
    const [lastName, setLastName] = useState(userProfile?.lastName ?? "");

    if (!isLoggedIn || !userProfile) {
        return (
            <div className="min-h-screen bg-background">
                <SilkBackground />
                <Navbar />
                <main className="pt-28 pb-20 px-6 max-w-md mx-auto relative z-10 text-center">
                    <p className="text-foreground text-lg font-semibold mb-4">{t.profileTab.pleaseLogin}</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/login" className="rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                            {t.login}
                        </Link>
                        <Link to="/signup" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
                            {t.signUp}
                        </Link>
                    </div>

                    {/* Settings Panel for Guests */}
                    <div className="mt-12 pt-12 border-t border-border/30">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">App Settings</p>
                        <GlobalSettings />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const handleSaveName = async () => {
        setSaving(true);
        await updateProfile({ firstName, lastName });
        setSaving(false);
        setEditingName(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-28 pb-20 px-6 md:px-10 max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">{t.profile}</p>
                    <h1 className="hero-serif text-foreground" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300 }}>
                        {t.welcome}, {userProfile.firstName || "User"}
                    </h1>
                    <p className="text-xs text-foreground/50 mt-1">
                        {userProfile.email} · {new Date(userProfile.createdAt).toLocaleDateString(language === "en" ? "en-US" : "de-DE", { month: "long", year: "numeric" })}
                    </p>
                </motion.div>

                {/* Personal Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6"
                >
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-3">{t.personalInfo}</p>
                    {editingName ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t.profileTab.firstName} />
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t.profileTab.lastName} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveName} disabled={saving} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">{saving ? "…" : t.profileTab.save}</button>
                                <button onClick={() => setEditingName(false)} disabled={saving} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60 disabled:opacity-50">{t.profileTab.cancel}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium">{userProfile.firstName} {userProfile.lastName}</p>
                            <button onClick={() => setEditingName(true)} className="text-xs text-primary hover:underline">{t.profileTab.edit}</button>
                        </div>
                    )}
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-border/50 mb-6">
                    <TabButton active={activeTab === "progress"} label={t.skinProgress} onClick={() => setActiveTab("progress")} />
                    <TabButton active={activeTab === "addresses"} label={t.addressBook} onClick={() => setActiveTab("addresses")} />
                    <TabButton active={activeTab === "orders"} label={t.orders} onClick={() => setActiveTab("orders")} />
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "progress" && <SkinProgressTab />}
                        {activeTab === "addresses" && <AddressBookTab />}
                        {activeTab === "orders" && <OrderHistoryTab />}
                    </motion.div>
                </AnimatePresence>

                {/* Logout */}
                <div className="text-center mt-10">
                    <button
                        onClick={async () => { await logout(); navigate("/"); }}
                        className="text-sm text-foreground/30 hover:text-foreground transition-colors"
                    >
                        {t.logout}
                    </button>
                </div>

                {/* Settings Panel for Authenticated Users */}
                <div className="mt-12 pt-12 border-t border-border/30 text-center">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">App Settings</p>
                    <GlobalSettings />
                </div>
            </main>

            <Footer />
        </div>
    );
}
