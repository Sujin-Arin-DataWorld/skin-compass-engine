import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const success = login(email, password);
        if (success) {
            navigate("/profile");
        } else {
            setError("Ungültige Anmeldedaten.");
        }
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
                        Anmelden
                    </h1>
                    <p className="text-sm text-foreground/60 mb-6">
                        Melden Sie sich bei Ihrem Skin Strategy Lab Konto an.
                    </p>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 mb-4">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                placeholder="Ihr Passwort"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-2xl py-3.5 text-sm font-bold tracking-wide uppercase transition-all"
                            style={{
                                background: "hsl(var(--primary))",
                                color: "hsl(var(--primary-foreground))",
                            }}
                        >
                            Anmelden
                        </button>

                        <p className="text-center text-xs text-foreground/40 pt-1">
                            Noch kein Konto?{" "}
                            <Link to="/signup" className="text-primary hover:underline">
                                Registrieren
                            </Link>
                        </p>
                    </form>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
