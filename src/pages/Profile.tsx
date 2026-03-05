import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { AXIS_LABELS, AXIS_KEYS, Product } from "@/engine/types";
import type { Address } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

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
    const latestResult = diagnosisResult ?? userProfile?.savedResults[0] ?? null;
    const allProducts: Product[] = latestResult
        ? Object.values(latestResult.product_bundle).flat()
        : [];

    return (
        <div className="space-y-6">
            {/* 10-Axis Vector */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-4">
                    Mein Skin-Vektor (10 Achsen)
                </p>
                {latestResult ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AXIS_KEYS.map((key) => {
                            const score = Math.round(latestResult.axis_scores[key] ?? 0);
                            return (
                                <div key={key} className="flex items-center gap-2 py-1">
                                    <span className="text-xs text-foreground/60 flex-shrink-0" style={{ width: "clamp(5rem, 12vw, 7rem)" }}>
                                        {AXIS_LABELS[key]}
                                    </span>
                                    <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${score}%` }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-foreground w-6 text-right">{score}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-foreground/40 italic">
                        Noch keine Diagnose vorhanden.{" "}
                        <Link to="/diagnosis" className="text-primary hover:underline">Jetzt starten →</Link>
                    </p>
                )}
            </div>

            {/* 5 Formulas */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-4">
                    Meine Routine (5 Formeln)
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
                                        {product.name}
                                    </p>
                                </div>
                                <span className="text-xs text-foreground/40">€{product.price_eur}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-foreground/40 italic">Noch keine Produkte zugewiesen.</p>
                )}
            </div>

            {/* History count */}
            {userProfile && userProfile.savedResults.length > 1 && (
                <p className="text-xs text-foreground/40 text-center">
                    {userProfile.savedResults.length} Diagnosen gespeichert
                </p>
            )}
        </div>
    );
}

/* ── Address Book Tab ── */
function AddressBookTab() {
    const { userProfile, addAddress, removeAddress } = useAuthStore();
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ label: "", name: "", street: "", city: "", zip: "", country: "Deutschland" });

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
                    Keine Adressen gespeichert.
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
                        Entfernen
                    </button>
                </div>
            ))}

            {adding ? (
                <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-3">
                    <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Neue Adresse</p>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (z.B. Zuhause)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vollständiger Name *" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Straße und Hausnummer *" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    <div className="grid grid-cols-2 gap-3">
                        <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder="PLZ *" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Stadt *" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={handleAdd} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Speichern</button>
                        <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-4 py-2 text-sm text-foreground/60">Abbrechen</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="w-full rounded-2xl border border-dashed border-border py-4 text-sm text-foreground/50 hover:text-primary hover:border-primary/40 transition-colors"
                >
                    + Neue Adresse hinzufügen
                </button>
            )}
        </div>
    );
}

/* ── Order History Tab ── */
function OrderHistoryTab() {
    const { userProfile } = useAuthStore();
    const orders = userProfile?.orderHistory ?? [];

    const statusLabel: Record<string, string> = {
        pending: "Ausstehend",
        shipped: "Versendet",
        delivered: "Geliefert",
    };
    const statusColor: Record<string, string> = {
        pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
        shipped: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        delivered: "bg-green-500/15 text-green-600 dark:text-green-400",
    };

    if (orders.length === 0) {
        return (
            <p className="text-sm text-foreground/40 italic text-center py-10">
                Noch keine Bestellungen vorhanden.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs text-foreground/40 font-mono">{order.id}</p>
                            <p className="text-xs text-foreground/50 mt-0.5">
                                {new Date(order.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${statusColor[order.status]}`}>
                            {statusLabel[order.status]}
                        </span>
                    </div>
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                            <span className="text-sm text-foreground">{item.name} × {item.qty}</span>
                            <span className="text-sm text-foreground/60">€{item.price.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-end mt-2">
                        <span className="text-sm font-bold text-foreground">Gesamt: €{order.total.toFixed(2)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Main Profile Page ── */
export default function Profile() {
    const { isLoggedIn, userProfile, logout, updateProfile } = useAuthStore();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>("progress");
    const [editingName, setEditingName] = useState(false);
    const [firstName, setFirstName] = useState(userProfile?.firstName ?? "");
    const [lastName, setLastName] = useState(userProfile?.lastName ?? "");

    if (!isLoggedIn || !userProfile) {
        return (
            <div className="min-h-screen bg-background">
                <SilkBackground />
                <Navbar />
                <main className="pt-28 pb-20 px-6 max-w-md mx-auto relative z-10 text-center">
                    <p className="text-foreground text-lg font-semibold mb-4">Bitte melden Sie sich an.</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/login" className="rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                            Anmelden
                        </Link>
                        <Link to="/signup" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
                            Registrieren
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const handleSaveName = () => {
        updateProfile({ firstName, lastName });
        setEditingName(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-28 pb-20 px-6 md:px-10 max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">Mein Profil</p>
                    <h1 className="font-display text-foreground" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300 }}>
                        Willkommen, {userProfile.firstName || "User"}
                    </h1>
                    <p className="text-xs text-foreground/50 mt-1">
                        {userProfile.email} · Mitglied seit {new Date(userProfile.createdAt).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                    </p>
                </motion.div>

                {/* Personal Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6"
                >
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-3">Persönliche Daten</p>
                    {editingName ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Vorname" />
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nachname" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveName} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Speichern</button>
                                <button onClick={() => setEditingName(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60">Abbrechen</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium">{userProfile.firstName} {userProfile.lastName}</p>
                            <button onClick={() => setEditingName(true)} className="text-xs text-primary hover:underline">Bearbeiten</button>
                        </div>
                    )}
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-border/50 mb-6">
                    <TabButton active={activeTab === "progress"} label="Skin Progress" onClick={() => setActiveTab("progress")} />
                    <TabButton active={activeTab === "addresses"} label="Adressbuch" onClick={() => setActiveTab("addresses")} />
                    <TabButton active={activeTab === "orders"} label="Bestellungen" onClick={() => setActiveTab("orders")} />
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
                        onClick={() => { logout(); navigate("/"); }}
                        className="text-sm text-foreground/30 hover:text-foreground transition-colors"
                    >
                        Abmelden
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
