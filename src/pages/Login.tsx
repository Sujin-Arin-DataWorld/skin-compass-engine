import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";

type Lang = "en" | "de" | "ko";

// ── Login page strings (self-contained — avoids translations.ko getter bug) ──
const LOGIN_I18N = {
    en: {
        title: "Secure Access",
        titleSignup: "Create Account",
        subtitle: "Your 10-Axis Skin Strategy is a clinical asset. Sign in to secure your precision data and unlock your personalized formula. Unsaved data will be lost.",
        subtitleSignup: "Create your Skin Strategy Lab account.",
        tabLogin: "Sign In",
        tabSignup: "Register",
        google: "Continue with Google",
        orEmail: "or continue with email",
        emailLabel: "E-Mail",
        emailPlaceholder: "your@email.com",
        passwordLabel: "Password",
        passwordPlaceholder: "Your Password",
        firstNameLabel: "First Name",
        firstNamePlaceholder: "Jane",
        lastNameLabel: "Last Name",
        lastNamePlaceholder: "Doe",
        gdprText: "I agree to the processing of sensitive data (facial images) and cross-border data transfer —",
        gdprLink: "Privacy Policy",
        gdprSuffix: "",
        submit: "Sign In",
        submitSignup: "Register",
        submitting: "Signing in…",
        submittingSignup: "Registering…",
        authError: "Invalid email or password.",
        noAccount: "Don't have an account?",
        alreadyAccount: "Already have an account?",
        confirmEmailTitle: "Confirm your e-mail",
        confirmEmailDesc: "We sent you a confirmation link. Please check your inbox.",
        confirmEmailBack: "Back to Sign In",
    },
    de: {
        title: "Sicherer Zugang",
        titleSignup: "Konto erstellen",
        subtitle: "Ihre 10-Dimensionen-Hautstrategie ist ein wertvolles Pflegeprofil. Melden Sie sich an, um Ihre präzisen Daten zu sichern und Ihre personalisierte Formel freizuschalten. Ungespeicherte Daten gehen verloren.",
        subtitleSignup: "Erstellen Sie Ihr Skin Strategy Lab Konto.",
        tabLogin: "Anmelden",
        tabSignup: "Registrieren",
        google: "Mit Google fortfahren",
        orEmail: "oder mit E-Mail fortfahren",
        emailLabel: "E-Mail",
        emailPlaceholder: "ihre@email.de",
        passwordLabel: "Passwort",
        passwordPlaceholder: "Ihr Passwort",
        firstNameLabel: "Vorname",
        firstNamePlaceholder: "Max",
        lastNameLabel: "Nachname",
        lastNamePlaceholder: "Mustermann",
        gdprText: "Ich stimme der Verarbeitung sensibler Daten (Gesichtsbilder) und der",
        gdprLink: "Datenschutzerklärung",
        gdprSuffix: "zu.",
        submit: "Anmelden",
        submitSignup: "Registrieren",
        submitting: "Wird angemeldet…",
        submittingSignup: "Wird registriert…",
        authError: "E-Mail oder Passwort ist falsch.",
        noAccount: "Noch kein Konto?",
        alreadyAccount: "Bereits ein Konto?",
        confirmEmailTitle: "E-Mail bestätigen",
        confirmEmailDesc: "Wir haben Ihnen einen Bestätigungslink geschickt. Bitte prüfen Sie Ihren Posteingang.",
        confirmEmailBack: "Zurück zur Anmeldung",
    },
    ko: {
        title: "안전한 접근",
        titleSignup: "계정 만들기",
        subtitle: "10축 피부 전략은 임상적 자산입니다. 로그인하여 정밀 데이터를 보호하고 맞춤 포뮬러를 확인하세요. 저장되지 않은 데이터는 사라집니다.",
        subtitleSignup: "Skin Strategy Lab 계정을 만드세요.",
        tabLogin: "로그인",
        tabSignup: "회원가입",
        google: "Google로 계속하기",
        orEmail: "또는 이메일로",
        emailLabel: "이메일",
        emailPlaceholder: "your@email.com",
        passwordLabel: "비밀번호",
        passwordPlaceholder: "비밀번호",
        firstNameLabel: "이름",
        firstNamePlaceholder: "홍",
        lastNameLabel: "성",
        lastNamePlaceholder: "길동",
        gdprText: "개인정보 처리방침, 민감정보(얼굴 사진) 처리 및 국외 이전(독일 서버)에 동의합니다 —",
        gdprLink: "개인정보 처리방침",
        gdprSuffix: "",
        submit: "로그인",
        submitSignup: "회원가입",
        submitting: "로그인 중…",
        submittingSignup: "가입 중…",
        authError: "이메일 또는 비밀번호가 올바르지 않습니다.",
        noAccount: "계정이 없으신가요?",
        alreadyAccount: "이미 계정이 있으신가요?",
        confirmEmailTitle: "이메일을 확인하세요",
        confirmEmailDesc: "확인 링크를 보내드렸습니다. 받은 편지함을 확인해 주세요.",
        confirmEmailBack: "로그인으로 돌아가기",
    },
} as const;

function getLp(language: Lang) {
    return LOGIN_I18N[language] ?? LOGIN_I18N.en;
}

// ── Zod schemas (language-agnostic, errors translated at render) ──────────
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const signupSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    gdpr: z.literal(true, { errorMap: () => ({ message: "required" }) }),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

// ── Shared field styles ───────────────────────────────────────────────────
const inputCls =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

// ── Google button ─────────────────────────────────────────────────────────
function GoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full rounded-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A] text-[#1A1A1A] dark:text-[#E2E8F0] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="hero-serif font-medium tracking-wide text-[15px]">{label}</span>
        </button>
    );
}

function Divider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-[0.5px] bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest px-2">{label}</span>
            <div className="flex-1 h-[0.5px] bg-border" />
        </div>
    );
}

// ── Tab styles ────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 py-2.5 text-sm font-bold tracking-wide rounded-xl transition-all ${active
                ? "bg-card border border-[var(--ssl-accent-deep)] dark:border-[var(--ssl-accent)] text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)]"
                : "text-foreground/40 hover:text-foreground/70"
                }`}
        >
            {children}
        </button>
    );
}

// ── Login form ────────────────────────────────────────────────────────────
function LoginForm({ lang, onSuccess, onGoogleClick }: { lang: Lang; onSuccess: () => void; onGoogleClick: () => void }) {
    const login = useAuthStore((s) => s.login);
    const [authError, setAuthError] = useState("");
    const lp = getLp(lang);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (values: LoginValues) => {
        setAuthError("");
        const success = await login(values.email, values.password);
        if (!success) setAuthError(lp.authError);
        else onSuccess();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <GoogleButton label={lp.google} onClick={onGoogleClick} />
            <Divider label={lp.orEmail} />

            {authError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                    <p className="text-sm text-red-400">{authError}</p>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                    {lp.emailLabel}
                </label>
                <input type="email" className={inputCls} placeholder={lp.emailPlaceholder} {...register("email")} />
                <FieldError message={errors.email?.message} />
            </div>
            <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">
                    {lp.passwordLabel}
                </label>
                <input type="password" className={inputCls} placeholder={lp.passwordPlaceholder} {...register("password")} />
                <FieldError message={errors.password?.message} />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl py-3.5 text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-50"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
                {isSubmitting ? lp.submitting : lp.submit}
            </button>
        </form>
    );
}

// ── Signup form ───────────────────────────────────────────────────────────
function SignupForm({ lang, onEmailSent, onSuccess, onGoogleClick }: { lang: Lang; onEmailSent: () => void; onSuccess: () => void; onGoogleClick: () => void }) {
    const signup = useAuthStore((s) => s.signup);
    const [authError, setAuthError] = useState("");
    const lp = getLp(lang);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { gdpr: undefined as unknown as true },
    });

    const onSubmit = async (values: SignupValues) => {
        setAuthError("");
        const { error, needsEmailConfirmation } = await signup({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
        });

        if (error) { setAuthError(error); return; }
        if (needsEmailConfirmation) onEmailSent();
        else onSuccess();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <GoogleButton label={lp.google} onClick={onGoogleClick} />
            <Divider label={lp.orEmail} />

            {authError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                    <p className="text-sm text-red-400">{authError}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">{lp.firstNameLabel}</label>
                    <input type="text" className={inputCls} placeholder={lp.firstNamePlaceholder} {...register("firstName")} />
                    <FieldError message={errors.firstName?.message} />
                </div>
                <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">{lp.lastNameLabel}</label>
                    <input type="text" className={inputCls} placeholder={lp.lastNamePlaceholder} {...register("lastName")} />
                    <FieldError message={errors.lastName?.message} />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">{lp.emailLabel}</label>
                <input type="email" className={inputCls} placeholder={lp.emailPlaceholder} {...register("email")} />
                <FieldError message={errors.email?.message} />
            </div>
            <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-foreground/60 mb-1.5">{lp.passwordLabel}</label>
                <input type="password" className={inputCls} placeholder={lp.passwordPlaceholder} {...register("password")} />
                <FieldError message={errors.password?.message} />
            </div>

            <div className="flex items-start gap-3 pt-1">
                <input
                    type="checkbox"
                    id="gdpr"
                    {...register("gdpr")}
                    className="mt-1 h-4 w-4 rounded border-border accent-primary"
                />
                <label htmlFor="gdpr" className="text-xs text-foreground/70 leading-relaxed">
                    {lp.gdprText}{" "}
                    <Link to="/datenschutz" className="text-primary hover:underline">
                        {lp.gdprLink}
                    </Link>
                    {lp.gdprSuffix ? ` ${lp.gdprSuffix}` : ""}
                </label>
            </div>
            <FieldError message={errors.gdpr?.message} />

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl py-3.5 text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-50"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
                {isSubmitting ? lp.submittingSignup : lp.submitSignup}
            </button>
        </form>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Login() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoggedIn, loginWithGoogle } = useAuthStore();
    const { language } = useI18nStore();
    const lang = (["en", "de", "ko"].includes(language) ? language : "en") as Lang;
    const lp = getLp(lang);

    const tabParam = searchParams.get("tab");
    const redirectTo = searchParams.get("redirect") || "/account";

    const [activeTab, setActiveTab] = useState<"login" | "signup">(
        tabParam === "signup" ? "signup" : "login"
    );
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    if (isLoggedIn) return <Navigate to={redirectTo} replace />;

    const executeRedirect = () => {
        setIsRedirecting(true);
        setTimeout(() => navigate(redirectTo), 500);
    };

    const handleGoogleClick = async () => {
        setIsRedirecting(true);
        await loginWithGoogle(redirectTo);
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-background">
                <SilkBackground />
                <Navbar />
                <main className="pt-28 pb-20 relative z-10" style={{ maxWidth: '480px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-border bg-card p-8 text-center"
                    >
                        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">✉️</span>
                        </div>
                        <h2 className="hero-serif text-foreground mb-2" style={{ fontSize: "1.5rem", fontWeight: 300 }}>
                            {lp.confirmEmailTitle}
                        </h2>
                        <p className="text-sm text-foreground/60 leading-relaxed mb-6">
                            {lp.confirmEmailDesc}
                        </p>
                        <button onClick={() => setActiveTab("login")} className="text-sm text-primary hover:underline">
                            {lp.confirmEmailBack}
                        </button>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <SilkBackground />
            <Navbar />

            <main className="pt-28 pb-20 relative z-10" style={{ maxWidth: '480px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border bg-card p-8"
                >
                    {/* Header */}
                    <h1
                        className="hero-serif text-foreground mb-1"
                        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300 }}
                    >
                        {activeTab === "login" ? lp.title : lp.titleSignup}
                    </h1>
                    <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: "var(--color-gold-text)" }}>
                        {activeTab === "login" ? lp.subtitle : lp.subtitleSignup}
                    </p>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1 rounded-2xl bg-muted/30 mb-6">
                        <TabButton active={activeTab === "login"} onClick={() => setActiveTab("login")}>
                            {lp.tabLogin}
                        </TabButton>
                        <TabButton active={activeTab === "signup"} onClick={() => setActiveTab("signup")}>
                            {lp.tabSignup}
                        </TabButton>
                    </div>

                    {/* Forms */}
                    {activeTab === "login" ? (
                        <LoginForm lang={lang} onSuccess={executeRedirect} onGoogleClick={handleGoogleClick} />
                    ) : (
                        <SignupForm
                            lang={lang}
                            onEmailSent={() => setEmailSent(true)}
                            onSuccess={executeRedirect}
                            onGoogleClick={handleGoogleClick}
                        />
                    )}

                    {/* Footer link */}
                    <p className="text-center text-xs text-foreground/40 pt-4">
                        {activeTab === "login" ? (
                            <>
                                {lp.noAccount}{" "}
                                <button type="button" onClick={() => setActiveTab("signup")} className="text-primary hover:underline">
                                    {lp.tabSignup}
                                </button>
                            </>
                        ) : (
                            <>
                                {lp.alreadyAccount}{" "}
                                <button type="button" onClick={() => setActiveTab("login")} className="text-primary hover:underline">
                                    {lp.tabLogin}
                                </button>
                            </>
                        )}
                    </p>
                </motion.div>
            </main>

            {/* Liquid fade overlay */}
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
