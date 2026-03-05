import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

export default function Signup() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gdprAccepted, setGdprAccepted] = useState(false);
    const signup = useAuthStore((s) => s.signup);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gdprAccepted) return;
        signup({ firstName, lastName, email, password });
        navigate("/profile");
    };

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-28 pb-20 px-6 max-w-md mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border bg-card p-8"
                >
                    <h1
                        className="font-display text-foreground mb-1"
                        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300 }}
                    >
                        Konto erstellen
                    </h1>
                    <p className="text-sm text-foreground/60 mb-6">
                        Erstellen Sie Ihr Skin Strategy Lab Konto.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                                    Vorname
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                    placeholder="Max"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                                    Nachname
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                    placeholder="Mustermann"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                                E-Mail
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                placeholder="ihre@email.de"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                                Passwort
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                placeholder="Min. 8 Zeichen"
                            />
                        </div>

                        {/* GDPR Checkbox */}
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="gdpr"
                                checked={gdprAccepted}
                                onChange={(e) => setGdprAccepted(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-border accent-primary"
                                required
                            />
                            <label htmlFor="gdpr" className="text-xs text-foreground/70 leading-relaxed">
                                Ich stimme der{" "}
                                <Link to="/datenschutz" className="text-primary hover:underline">
                                    Datenschutzerklärung
                                </Link>{" "}
                                zu.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!gdprAccepted}
                            className="w-full rounded-2xl py-3.5 text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: "hsl(var(--primary))",
                                color: "hsl(var(--primary-foreground))",
                            }}
                        >
                            Registrieren
                        </button>

                        <p className="text-center text-xs text-foreground/40 pt-1">
                            Bereits ein Konto?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                Anmelden
                            </Link>
                        </p>
                    </form>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
