import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, UserProfile } from "@/store/authStore";
import { useProductStore } from "@/store/productStore";
import { AXIS_LABELS, AXIS_KEYS, Product, LocalizedContent } from "@/engine/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

/* ── User Vector History Detail ── */
function UserVectorHistory({ user, onClose }: { user: UserProfile; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-primary/30 bg-card p-6 mb-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Vektor-Verlauf</p>
                    <p className="text-sm text-foreground font-medium mt-0.5">{user.firstName} {user.lastName} ({user.email})</p>
                </div>
                <button onClick={onClose} className="text-xs text-foreground/40 hover:text-foreground transition-colors">✕ Schließen</button>
            </div>

            {user.savedResults.length === 0 ? (
                <p className="text-sm text-foreground/40 italic py-4">Keine Diagnosen vorhanden.</p>
            ) : (
                <div className="space-y-4">
                    {user.savedResults.map((result, idx) => (
                        <div key={idx} className="rounded-xl border border-border p-4">
                            <p className="text-[0.65rem] font-bold tracking-widest uppercase text-foreground/40 mb-3">
                                Diagnose #{user.savedResults.length - idx}
                                {result.detected_patterns[0] && (
                                    <span className="ml-2 text-primary">· {result.detected_patterns[0].pattern.name_en}</span>
                                )}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1">
                                {AXIS_KEYS.map((key) => {
                                    const score = Math.round(result.axis_scores[key] ?? 0);
                                    return (
                                        <div key={key} className="flex items-center gap-1.5 py-0.5">
                                            <span className="text-[0.65rem] text-foreground/50 w-16 truncate">{AXIS_LABELS[key]}</span>
                                            <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
                                            </div>
                                            <span className="text-[0.65rem] font-bold text-foreground w-5 text-right">{score}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

/* ── Product Editor Section ── */
function ProductEditor() {
    const { products, updateProduct, resetProducts } = useProductStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50">
                    Produktverwaltung ({products.length})
                </p>
                <button
                    onClick={() => {
                        if (confirm("Möchten Sie wirklich alle Produkte auf den Standardwert zurücksetzen?")) {
                            resetProducts();
                        }
                    }}
                    className="text-xs font-semibold text-primary/70 hover:text-primary transition-colors"
                >
                    Auf Standard zurücksetzen
                </button>
            </div>

            {products.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-border/50 overflow-hidden">
                            <span className="text-xl">🧴</span>
                            <img src={`/productsimage/${p.id}.jpeg`} alt={p.name.en} className="absolute inset-0 w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div>
                            <p className="text-[0.6rem] font-bold tracking-widest uppercase text-primary">{p.brand} · {p.id}</p>
                            <p className="text-base font-medium text-foreground">{p.name.en}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/50 mb-1 block">Name (EN)</label>
                            <input
                                type="text"
                                value={p.name.en}
                                onChange={(e) => updateProduct(p.id, { name: { ...p.name, en: e.target.value } })}
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/50 mb-1 block">Name (DE)</label>
                            <input
                                type="text"
                                value={p.name.de}
                                onChange={(e) => updateProduct(p.id, { name: { ...p.name, de: e.target.value } })}
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/50 mb-1 block">Preis (€)</label>
                            <input
                                type="number"
                                step="any"
                                value={p.price}
                                onChange={(e) => updateProduct(p.id, { price: Number(e.target.value) })}
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/50 mb-1 block">Lagerbestand</label>
                            <select
                                value={p.stockStatus}
                                onChange={(e) => updateProduct(p.id, { stockStatus: e.target.value as any })}
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            >
                                <option value="available">Verfügbar</option>
                                <option value="out_of_stock">Ausverkauft</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/50 mb-1 block">Target Vector</label>
                            <div className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm text-primary font-medium flex items-center justify-between">
                                {AXIS_LABELS[p.targetVector]}
                                <span className="text-[0.6rem] uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">Fixed Matrix</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/50 mb-1 block">Vector Impact ({AXIS_LABELS[p.targetVector]})</label>
                            <input
                                type="number"
                                value={p.vectorImpact[p.targetVector] ?? 0}
                                onChange={(e) => updateProduct(p.id, { vectorImpact: { ...p.vectorImpact, [p.targetVector]: Number(e.target.value) } })}
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

/* ── Main Admin Dashboard ── */
export default function AdminDashboard() {
    const { isLoggedIn, userProfile, allUsers } = useAuthStore();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<"analysis" | "products">("analysis");

    // Compute aggregate data from real users
    const usersWithResults = allUsers.filter((u) => u.savedResults.length > 0);
    const totalDiagnoses = allUsers.reduce((sum, u) => sum + u.savedResults.length, 0);
    const avgScores = AXIS_KEYS.map((key) => {
        let total = 0, count = 0;
        allUsers.forEach((u) => {
            u.savedResults.forEach((r) => {
                total += r.axis_scores[key] ?? 0;
                count++;
            });
        });
        return { key, label: AXIS_LABELS[key], avg: count > 0 ? Math.round(total / count) : 0 };
    });
    const maxAvg = Math.max(...avgScores.map((a) => a.avg), 1);

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-28 pb-20 relative z-10" style={{ maxWidth: '960px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">Admin Dashboard</p>
                    <h1 className="font-display text-foreground mb-8" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300 }}>
                        {activeTab === "analysis" ? "Aggregierte Analyse" : "Produktverwaltung"}
                    </h1>

                    <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-card/50 border border-border/50 rounded-2xl w-max">
                        <button
                            onClick={() => setActiveTab("analysis")}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "analysis" ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}`}
                        >
                            Nutzer & Analysen
                        </button>
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "products" ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}`}
                        >
                            Produktverwaltung
                        </button>
                    </div>
                </motion.div>

                {activeTab === "analysis" ? (
                    <>
                        {/* Aggregate 10-Axis Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-6"
                        >
                            <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-5">
                                10-Dimensionen Durchschnitt (alle Nutzer)
                            </p>
                            {totalDiagnoses === 0 ? (
                                <p className="text-sm text-foreground/40 italic py-4">Noch keine Diagnosen vorhanden.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {avgScores.map((a, i) => (
                                        <motion.div
                                            key={a.key}
                                            className="flex items-center gap-3"
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.03 }}
                                        >
                                            <span className="text-xs text-foreground/60 flex-shrink-0" style={{ width: "clamp(4.5rem, 10vw, 6.5rem)" }}>{a.label}</span>
                                            <div className="flex-1 h-5 bg-border/30 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-primary"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(a.avg / maxAvg) * 100}%` }}
                                                    transition={{ duration: 0.8, delay: 0.2 + i * 0.04 }}
                                                />
                                            </div>
                                            <span className="text-sm font-display font-bold text-foreground w-8 text-right">{a.avg}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Selected User Vector History */}
                        <AnimatePresence>
                            {selectedUser && (
                                <UserVectorHistory user={selectedUser} onClose={() => setSelectedUser(null)} />
                            )}
                        </AnimatePresence>

                        {/* User List Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-2xl border border-border bg-card p-6 md:p-8"
                        >
                            <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-4">
                                Nutzerliste ({allUsers.length})
                            </p>

                            {allUsers.length === 0 ? (
                                <p className="text-sm text-foreground/40 italic py-4">Keine registrierten Nutzer.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="text-left py-2 text-[0.65rem] uppercase tracking-wider text-foreground/40 font-medium">Name</th>
                                                <th className="text-left py-2 text-[0.65rem] uppercase tracking-wider text-foreground/40 font-medium">E-Mail</th>
                                                <th className="text-left py-2 text-[0.65rem] uppercase tracking-wider text-foreground/40 font-medium hidden sm:table-cell">Mitglied seit</th>
                                                <th className="text-right py-2 text-[0.65rem] uppercase tracking-wider text-foreground/40 font-medium">Diagnosen</th>
                                                <th className="text-right py-2 text-[0.65rem] uppercase tracking-wider text-foreground/40 font-medium">Aktion</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allUsers.map((user) => (
                                                <tr key={user.email} className="border-b border-border/20 last:border-0 hover:bg-primary/[0.02] transition-colors">
                                                    <td className="py-3 text-foreground font-medium">{user.firstName} {user.lastName}</td>
                                                    <td className="py-3 text-foreground/60 text-xs">{user.email}</td>
                                                    <td className="py-3 text-foreground/50 text-xs hidden sm:table-cell">
                                                        {new Date(user.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                                                            {user.savedResults.length}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        {user.savedResults.length > 0 ? (
                                                            <button
                                                                onClick={() => setSelectedUser(selectedUser?.email === user.email ? null : user)}
                                                                className="text-xs text-primary hover:underline"
                                                            >
                                                                {selectedUser?.email === user.email ? "Ausblenden" : "Vektoren →"}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-foreground/30">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    </>
                ) : (
                    <ProductEditor />
                )}
            </main>

            <Footer />
        </div>
    );
}
