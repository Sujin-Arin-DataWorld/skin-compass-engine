import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore, translations } from "@/store/i18nStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const login = useAuthStore((s) => s.login);
    const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
    const { language } = useI18nStore();
    const t = translations[language];
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/profile";

    const [isRedirecting, setIsRedirecting] = useState(false);

    // Scroll to top on mount to ensure Google auth button is visible
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleGoogleLogin = () => {
        loginWithGoogle();
        executeRedirect();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const success = login(email, password);
        if (success) {
            executeRedirect();
        } else {
            setError("Invalid credentials.");
        }
    };

    const executeRedirect = () => {
        setIsRedirecting(true);
        // Add a 500ms liquid fade transition before navigating natively
        setTimeout(() => {
            navigate(redirectTo);
        }, 500);
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
                        className="hero-serif text-foreground mb-1"
                        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300 }}
                    >
                        {t.loginPage.title}
                    </h1>
                    <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: "var(--color-gold-text)", textShadow: "0 0 10px rgba(148, 126, 92, 0.2)" }}>
                        {t.loginPage.subtitle}
                    </p>

                    {/* Google OAuth - Absolute Top Position */}
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full rounded-full py-3.5 px-4 mb-6 flex items-center justify-center gap-3 bg-white dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#1A1A1A] text-[#1A1A1A] dark:text-[#E2E8F0] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="hero-serif font-medium tracking-wide text-[15px]">{t.loginPage.google}</span>
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-[0.5px] bg-border" />
                        <span className="text-xs text-muted-foreground uppercase tracking-widest px-2">{t.loginPage.orEmail}</span>
                        <div className="flex-1 h-[0.5px] bg-border" />
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 mb-4">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                                {t.loginPage.emailLabel}
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                placeholder={t.loginPage.emailPlaceholder}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                                {t.loginPage.passwordLabel}
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                                placeholder={t.loginPage.passwordPlaceholder}
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
                            {t.loginPage.submit}
                        </button>

                        <p className="text-center text-xs text-foreground/40 pt-1">
                            {t.loginPage.noAccount}{" "}
                            <Link to="/signup" className="text-primary hover:underline">
                                {t.loginPage.register}
                            </Link>
                        </p>
                    </form>
                </motion.div>
            </main>

            {/* Liquid Transition Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isRedirecting ? 1 : 0 }}
                style={{ pointerEvents: isRedirecting ? "auto" : "none" }}
                className="fixed inset-0 z-50 bg-background"
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>
    );
}
