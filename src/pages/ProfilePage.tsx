import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useProfile } from "@/hooks/useProfile";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = "var(--ssl-accent)";
const BRONZE = "var(--ssl-accent-deep)";

const CARD: React.CSSProperties = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(45,107,74,0.12)",
    borderRadius: "16px",
    padding: "1.5rem",
};

// ── Zod schemas ───────────────────────────────────────────────────────────────
const profileSchema = z.object({
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    lastName: z.string().min(1, "Nachname ist erforderlich"),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    skinType: z.string().optional(),
});

const passwordSchema = z
    .object({
        password: z.string().min(8, "Mindestens 8 Zeichen"),
        confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
        message: "Passwörter stimmen nicht überein",
        path: ["confirm"],
    });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type SaveState = "idle" | "saving" | "success";

// ── Floating label input ──────────────────────────────────────────────────────
function FloatingField({
    id, label, type = "text", value, onChange, onBlur,
    error, disabled, autoComplete, rightAdornment,
}: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    onBlur?: () => void;
    error?: string;
    disabled?: boolean;
    autoComplete?: string;
    rightAdornment?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    const floated = focused || value.length > 0 || type === "date";

    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => { setFocused(false); onBlur?.(); }}
                disabled={disabled}
                autoComplete={autoComplete}
                style={{
                    width: "100%",
                    padding: rightAdornment
                        ? "1.2rem 2.75rem 0.4rem 0.875rem"
                        : "1.2rem 0.875rem 0.4rem",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${focused ? GOLD : error ? "#EF4444" : "rgba(45,107,74,0.18)"}`,
                    borderRadius: "10px",
                    fontSize: "0.875rem",
                    color: "#e8e8e8",
                    outline: "none",
                    transition: "border-color 0.2s",
                    opacity: disabled ? 0.5 : 1,
                    colorScheme: type === "date" ? "dark" : undefined,
                }}
            />
            <label
                htmlFor={id}
                style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: floated ? "0.45rem" : "50%",
                    transform: floated ? "none" : "translateY(-50%)",
                    fontSize: floated ? "0.6rem" : "0.8125rem",
                    letterSpacing: floated ? "0.08em" : "0",
                    textTransform: floated ? "uppercase" : "none",
                    color: focused ? GOLD : BRONZE,
                    pointerEvents: "none",
                    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                {label}
            </label>
            {rightAdornment && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {rightAdornment}
                </div>
            )}
            {error && (
                <p style={{ fontSize: "0.68rem", color: "#EF4444", marginTop: "0.3rem", paddingLeft: "0.125rem" }}>
                    {error}
                </p>
            )}
        </div>
    );
}

// ── Skin type pills ───────────────────────────────────────────────────────────
const SKIN_TYPES = [
    { id: "normal", en: "Normal", de: "Normal" },
    { id: "oily", en: "Oily", de: "Fettig" },
    { id: "dry", en: "Dry", de: "Trocken" },
    { id: "combination", en: "Combination", de: "Mischhaut" },
    { id: "sensitive", en: "Sensitive", de: "Empfindlich" },
];

function SkinTypePills({
    value, onChange, de,
}: {
    value: string; onChange: (v: string) => void; de: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map(({ id, en, de: deLabel }) => {
                const active = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onChange(active ? "" : id)}
                        style={{
                            padding: "0.3rem 0.75rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            border: `1px solid ${active ? GOLD : "rgba(148,126,92,0.3)"}`,
                            background: active ? "rgba(45,107,74,0.12)" : "transparent",
                            color: active ? GOLD : BRONZE,
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {de ? deLabel : en}
                    </button>
                );
            })}
        </div>
    );
}

// ── Save button with micro-interaction ───────────────────────────────────────
function SaveButton({ state, de }: { state: SaveState; de: boolean }) {
    const bg = state === "success" ? "#4ADE80" : GOLD;
    return (
        <button
            type="submit"
            disabled={state === "saving"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors duration-300"
            style={{ color: "#F5F5F7", background: bg }}
        >
            {state === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {state === "success" && <Check className="w-3.5 h-3.5" />}
            {state === "saving"
                ? (de ? "Speichere…" : "Saving…")
                : state === "success"
                    ? (de ? "Gespeichert!" : "Saved!")
                    : (de ? "Änderungen speichern" : "Save Changes")}
        </button>
    );
}

// ── Google logo SVG ───────────────────────────────────────────────────────────
function GoogleLogo({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" fill="#4285F4" />
            <path d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z" fill="#34A853" />
            <path d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" fill="#FBBC05" />
            <path d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335" />
        </svg>
    );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
    de, onClose, onConfirm,
}: {
    de: boolean; onClose: () => void; onConfirm: () => Promise<void>;
}) {
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const matches = confirmText === "DELETE";

    const handleConfirm = async () => {
        if (!matches) return;
        setDeleting(true);
        await onConfirm();
        setDeleting(false);
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
                style={{
                    background: "#111",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "18px",
                    padding: "1.75rem",
                    maxWidth: "420px",
                    width: "100%",
                }}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} strokeWidth={1.5} />
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#f0f0f0" }}>
                            {de ? "Konto löschen" : "Delete Account"}
                        </h2>
                    </div>
                    <button onClick={onClose}>
                        <X className="w-4 h-4" style={{ color: BRONZE }} strokeWidth={1.5} />
                    </button>
                </div>

                <p style={{ fontSize: "0.8125rem", color: BRONZE, lineHeight: 1.65, marginBottom: "1.25rem" }}>
                    {de
                        ? "Diese Aktion kann nicht rückgängig gemacht werden. Alle Analysen, Bestellungen und gespeicherten Produkte werden dauerhaft gelöscht."
                        : "This action cannot be undone. All analyses, orders, and saved products will be permanently deleted."}
                </p>

                <p style={{ fontSize: "0.75rem", color: "#e8e8e8", marginBottom: "0.5rem" }}>
                    {de ? 'Gib "DELETE" ein zur Bestätigung:' : 'Type "DELETE" to confirm:'}
                </p>
                <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        background: "rgba(239,68,68,0.06)",
                        border: `1px solid ${matches ? "#EF4444" : "rgba(239,68,68,0.2)"}`,
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        color: "#e8e8e8",
                        outline: "none",
                        fontFamily: "monospace",
                        letterSpacing: "0.12em",
                        transition: "border-color 0.2s",
                    }}
                />

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: BRONZE }}
                    >
                        {de ? "Abbrechen" : "Cancel"}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!matches || deleting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: matches ? "#EF4444" : "rgba(239,68,68,0.2)", color: "#fff" }}
                    >
                        {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {de ? "Konto löschen" : "Delete Account"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────
export default function ProfilePage({ de }: { de: boolean }) {
    const { userProfile, logout } = useAuthStore();
    const { profile, loading, updateProfile, updatePassword } = useProfile();

    const [profileSave, setProfileSave] = useState<SaveState>("idle");
    const [pwdSave, setPwdSave] = useState<SaveState>("idle");
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // ── Profile form ─────────────────────────────────────────────────────────
    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { firstName: "", lastName: "", phone: "", birthDate: "", skinType: "" },
    });

    useEffect(() => {
        if (loading) return;
        profileForm.reset({
            firstName: userProfile?.firstName ?? "",
            lastName: userProfile?.lastName ?? "",
            phone: profile?.phone ?? "",
            birthDate: profile?.birth_date ?? "",
            skinType: profile?.skin_type ?? "",
        });
        // Reset once when profile data arrives
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, profile?.id]);

    const onProfileSubmit = async (values: ProfileFormValues) => {
        setProfileSave("saving");
        const { error } = await updateProfile({
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone || undefined,
            birthDate: values.birthDate || undefined,
            skinType: values.skinType || undefined,
        });
        if (error) {
            toast.error(error);
            setProfileSave("idle");
        } else {
            setProfileSave("success");
            setTimeout(() => setProfileSave("idle"), 1500);
        }
    };

    // ── Password form ────────────────────────────────────────────────────────
    const pwdForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "", confirm: "" },
    });

    const onPwdSubmit = async (values: PasswordFormValues) => {
        setPwdSave("saving");
        const { error } = await updatePassword(values.password);
        if (error) {
            toast.error(error);
            setPwdSave("idle");
        } else {
            setPwdSave("success");
            pwdForm.reset();
            setTimeout(() => setPwdSave("idle"), 1500);
        }
    };

    // ── Delete account ───────────────────────────────────────────────────────
    const handleDeleteAccount = async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).rpc("delete_own_user");
        if (error) {
            toast.error(error.message);
        } else {
            await logout();
        }
    };

    const initials = (
        `${userProfile?.firstName?.[0] ?? ""}${userProfile?.lastName?.[0] ?? ""}`
    ).toUpperCase() || "?";

    const isGoogle = userProfile?.provider === "google";

    return (
        <div className="space-y-6">

            {/* ── Card 1: Personal Information ── */}
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <div style={CARD}>
                    <p style={{
                        fontSize: "0.6rem", letterSpacing: "0.28em",
                        color: GOLD, textTransform: "uppercase", fontWeight: 600,
                        marginBottom: "1.25rem",
                    }}>
                        {de ? "Persönliche Daten" : "Personal Information"}
                    </p>

                    {/* Avatar + name row */}
                    <div className="flex items-center gap-4 mb-6">
                        {userProfile?.avatar ? (
                            <img
                                src={userProfile.avatar}
                                alt={initials}
                                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                                style={{ border: `2px solid rgba(45,107,74,0.5)` }}
                            />
                        ) : (
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                                style={{
                                    background: "rgba(45,107,74,0.1)",
                                    border: `2px solid rgba(45,107,74,0.3)`,
                                    color: GOLD,
                                }}
                            >
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p style={{ fontSize: "0.9375rem", color: "#e8e8e8", fontWeight: 500 }}>
                                {userProfile?.firstName} {userProfile?.lastName}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: BRONZE, marginTop: "0.1rem" }}>
                                {userProfile?.email}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Controller
                                    control={profileForm.control}
                                    name="firstName"
                                    render={({ field, fieldState }) => (
                                        <FloatingField
                                            id="firstName"
                                            label={de ? "Vorname *" : "First Name *"}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            error={fieldState.error?.message}
                                            autoComplete="given-name"
                                        />
                                    )}
                                />
                                <Controller
                                    control={profileForm.control}
                                    name="lastName"
                                    render={({ field, fieldState }) => (
                                        <FloatingField
                                            id="lastName"
                                            label={de ? "Nachname *" : "Last Name *"}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            error={fieldState.error?.message}
                                            autoComplete="family-name"
                                        />
                                    )}
                                />
                            </div>

                            <Controller
                                control={profileForm.control}
                                name="phone"
                                render={({ field }) => (
                                    <FloatingField
                                        id="phone"
                                        label={de ? "Telefon (optional)" : "Phone (optional)"}
                                        type="tel"
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        autoComplete="tel"
                                    />
                                )}
                            />

                            <Controller
                                control={profileForm.control}
                                name="birthDate"
                                render={({ field }) => (
                                    <FloatingField
                                        id="birthDate"
                                        label={de ? "Geburtsdatum" : "Birth Date"}
                                        type="date"
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        autoComplete="bday"
                                    />
                                )}
                            />

                            <div>
                                <p style={{ fontSize: "0.65rem", color: BRONZE, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                                    {de ? "Hauttyp" : "Skin Type"}
                                </p>
                                <Controller
                                    control={profileForm.control}
                                    name="skinType"
                                    render={({ field }) => (
                                        <SkinTypePills
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                            de={de}
                                        />
                                    )}
                                />
                            </div>

                            <div className="flex justify-end pt-1">
                                <SaveButton state={profileSave} de={de} />
                            </div>
                        </div>
                    )}
                </div>
            </form>

            {/* ── Card 2: Security ── */}
            <div style={CARD}>
                <p style={{
                    fontSize: "0.6rem", letterSpacing: "0.28em",
                    color: GOLD, textTransform: "uppercase", fontWeight: 600,
                    marginBottom: "1.25rem",
                }}>
                    {de ? "Sicherheit" : "Security"}
                </p>

                {isGoogle ? (
                    <div
                        className="flex items-center gap-3 p-3.5 rounded-xl"
                        style={{ background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)" }}
                    >
                        <GoogleLogo />
                        <div>
                            <p style={{ fontSize: "0.8125rem", color: "#e8e8e8", fontWeight: 500 }}>
                                {de ? "Google-Konto verbunden" : "Connected with Google"}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: BRONZE, marginTop: "0.1rem" }}>
                                {userProfile?.email}
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} className="space-y-4">
                        <Controller
                            control={pwdForm.control}
                            name="password"
                            render={({ field, fieldState }) => (
                                <FloatingField
                                    id="new-password"
                                    label={de ? "Neues Passwort" : "New Password"}
                                    type={showPwd ? "text" : "password"}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    error={fieldState.error?.message}
                                    autoComplete="new-password"
                                    rightAdornment={
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd(!showPwd)}
                                            style={{ color: BRONZE, lineHeight: 0 }}
                                        >
                                            {showPwd
                                                ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                                                : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                                        </button>
                                    }
                                />
                            )}
                        />
                        <Controller
                            control={pwdForm.control}
                            name="confirm"
                            render={({ field, fieldState }) => (
                                <FloatingField
                                    id="confirm-password"
                                    label={de ? "Passwort bestätigen" : "Confirm Password"}
                                    type={showConfirm ? "text" : "password"}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    error={fieldState.error?.message}
                                    autoComplete="new-password"
                                    rightAdornment={
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            style={{ color: BRONZE, lineHeight: 0 }}
                                        >
                                            {showConfirm
                                                ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                                                : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                                        </button>
                                    }
                                />
                            )}
                        />
                        <div className="flex justify-end">
                            <SaveButton state={pwdSave} de={de} />
                        </div>
                    </form>
                )}
            </div>

            {/* ── Card 3: Danger Zone ── */}
            <div style={{ ...CARD, borderColor: "rgba(239,68,68,0.2)" }}>
                <p style={{
                    fontSize: "0.6rem", letterSpacing: "0.28em",
                    color: "#EF4444", textTransform: "uppercase", fontWeight: 600,
                    marginBottom: "0.75rem",
                }}>
                    {de ? "Gefahrenzone" : "Danger Zone"}
                </p>
                <p style={{ fontSize: "0.8125rem", color: BRONZE, lineHeight: 1.65, marginBottom: "1.1rem" }}>
                    {de
                        ? "Dein Konto wird dauerhaft gelöscht. Alle Analysen, Bestellungen und gespeicherten Produkte werden entfernt."
                        : "Your account will be permanently deleted. All analyses, orders, and saved products will be removed."}
                </p>
                <button
                    onClick={() => setDeleteOpen(true)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-red-500/10"
                    style={{ color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                    {de ? "Konto löschen" : "Delete Account"}
                </button>
            </div>

            {/* Delete modal */}
            <AnimatePresence>
                {deleteOpen && (
                    <DeleteModal
                        de={de}
                        onClose={() => setDeleteOpen(false)}
                        onConfirm={handleDeleteAccount}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
