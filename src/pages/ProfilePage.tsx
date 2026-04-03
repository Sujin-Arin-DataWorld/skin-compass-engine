import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Eye, EyeOff, AlertTriangle, X, Loader2,
  ShieldAlert, Brain, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useProfile } from "@/hooks/useProfile";
import { useSkinAnalysisStore } from "@/store/skinAnalysisStore";
import { useSkinProfileStore } from "@/store/useSkinProfileStore";
import type { SkinAxis } from "@/types/skinProfile";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";
import { tokens, ctaTokens, ctaGlowToken, glassTokens, tierGradients } from "@/lib/designTokens";
import * as SwitchPrimitive from "@radix-ui/react-switch";

// ── i18n ──────────────────────────────────────────────────────────────────────
type LangKey = "en" | "de" | "ko";

const C = {
  title_journal: { ko: "스킨 저널", de: "Hautjournal", en: "Skin Journal" },
  member_since: { ko: "{date}부터 회원", de: "Mitglied seit {date}", en: "Member since {date}" },
  score_hub_title: { ko: "내 피부 점수", de: "Mein Haut-Score", en: "My Skin Score" },
  last_analysis: { ko: "마지막 분석: {d}일 전", de: "Letzte Analyse: vor {d} Tagen", en: "Last analysis: {d} days ago" },
  no_analysis: { ko: "아직 분석 없음", de: "Noch keine Analyse", en: "No analysis yet" },
  active_routine: { ko: "활성 루틴", de: "AKTIVE ROUTINE", en: "ACTIVE ROUTINE" },
  routine_steps: { ko: "{tier} · {n}단계", de: "{tier} · {n} Schritte", en: "{tier} · {n} steps" },
  skin_trend: { ko: "피부 트렌드", de: "HAUTTREND", en: "SKIN TREND" },
  trend_improving: { ko: "피부가 꾸준히 개선되고 있어요", de: "Ihre Haut verbessert sich stetig", en: "Your skin is steadily improving" },
  personal_info: { ko: "개인 정보", de: "Persönliche Daten", en: "Personal Information" },
  security: { ko: "보안", de: "Sicherheit", en: "Security" },
  privacy: { ko: "개인정보 설정", de: "Datenschutz-Einstellungen", en: "Privacy Settings" },
  ai_profiling: { ko: "AI 개인화 허용", de: "KI-Personalisierung erlauben", en: "Allow AI Personalization" },
  ai_profiling_desc: { ko: "GDPR 제21조 — 이의제기권", de: "DSGVO Art. 21 — Widerspruchsrecht", en: "GDPR Art. 21 — Right to Object" },
  bio_purge: { ko: "생체 데이터 삭제", de: "Biometrische Daten löschen", en: "Erase Biometric Data" },
  bio_purge_desc: { ko: "GDPR 제17조 — 모든 AI 분석 삭제", de: "DSGVO Art. 17 — Alle KI-Analysen löschen", en: "GDPR Art. 17 — Delete all AI analyses" },
  bio_purge_btn: { ko: "지금 삭제", de: "Jetzt löschen", en: "Erase Now" },
  danger_zone: { ko: "위험 구역", de: "Gefahrenzone", en: "Danger Zone" },
  danger_desc: { ko: "계정이 영구 삭제됩니다.", de: "Ihr Konto wird dauerhaft gelöscht.", en: "Your account will be permanently deleted." },
  delete_account: { ko: "계정 삭제", de: "Konto löschen", en: "Delete Account" },
  actions_edit: { ko: "프로필 편집", de: "Profil bearbeiten", en: "Edit Profile" },
  actions_privacy: { ko: "개인정보", de: "Datenschutz", en: "Privacy" },
  actions_language: { ko: "언어", de: "Sprache", en: "Language" },
  actions_logout: { ko: "로그아웃", de: "Abmelden", en: "Sign Out" },
  start_analysis: { ko: "첫 분석 시작 →", de: "Erste Analyse starten →", en: "Start First Analysis →" },
  first_name: { ko: "이름 *", de: "Vorname *", en: "First Name *" },
  last_name: { ko: "성 *", de: "Nachname *", en: "Last Name *" },
  phone: { ko: "전화번호 (선택)", de: "Telefon (optional)", en: "Phone (optional)" },
  birth_date: { ko: "생년월일", de: "Geburtsdatum", en: "Birth Date" },
  skin_type: { ko: "피부 타입", de: "Hauttyp", en: "Skin Type" },
  save: { ko: "저장", de: "Speichern", en: "Save Changes" },
  saving: { ko: "저장 중…", de: "Speichere…", en: "Saving…" },
  saved: { ko: "저장됨!", de: "Gespeichert!", en: "Saved!" },
  google_connected: { ko: "Google 계정 연결됨", de: "Google-Konto verbunden", en: "Connected with Google" },
  new_password: { ko: "새 비밀번호", de: "Neues Passwort", en: "New Password" },
  confirm_password: { ko: "비밀번호 확인", de: "Passwort bestätigen", en: "Confirm Password" },
  cancel: { ko: "취소", de: "Abbrechen", en: "Cancel" },
  tier_essential: { ko: "에센셜", de: "Essentiell", en: "Essential" },
  tier_complete: { ko: "완전 케어", de: "Vollpflege", en: "Complete" },
  tier_pro: { ko: "프로", de: "Profi", en: "Pro" },
} as const;

function tx(key: keyof typeof C, lang: LangKey, vars?: Record<string, string | number>): string {
  let s: string = C[key][lang] ?? C[key].en;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
}

// ── Zod schemas (unchanged business logic) ────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  skinType: z.string().optional(),
});
const passwordSchema = z.object({
  password: z.string().min(8),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type SaveState = "idle" | "saving" | "success";

// ── 2025 Score Ring (reusable) ────────────────────────────────────────────────
function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  const tier = score < 30 ? 'critical' : score < 70 ? 'attention' : score < 80 ? 'good' : 'excellent';
  const { gradient } = tierGradients[tier];
  const gradId = `profile-ring-${size}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={4} opacity={0.15} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.32} fontWeight={700} fill="currentColor"
        fontFamily="'Fraunces', serif"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >{Math.round(score)}</text>
    </svg>
  );
}

// ── Floating label input (2025 themed) ────────────────────────────────────────
function FloatingField({
  id, label, type = "text", value, onChange, onBlur,
  error, disabled, autoComplete, rightAdornment, tok, isDark,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void;
  error?: string; disabled?: boolean; autoComplete?: string;
  rightAdornment?: React.ReactNode;
  tok: ReturnType<typeof tokens>; isDark: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0 || type === "date";

  return (
    <div className="relative">
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        disabled={disabled} autoComplete={autoComplete}
        style={{
          width: "100%",
          padding: rightAdornment ? "1.2rem 2.75rem 0.4rem 0.875rem" : "1.2rem 0.875rem 0.4rem",
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${focused ? tok.accent : error ? "#EF4444" : tok.border}`,
          borderRadius: 10, fontSize: "0.875rem",
          color: tok.text, outline: "none",
          transition: "border-color 0.2s",
          opacity: disabled ? 0.5 : 1,
          colorScheme: type === "date" ? (isDark ? "dark" : "light") : undefined,
        }}
      />
      <label htmlFor={id} style={{
        position: "absolute", left: "0.875rem",
        top: floated ? "0.45rem" : "50%",
        transform: floated ? "none" : "translateY(-50%)",
        fontSize: floated ? "0.6rem" : "0.8125rem",
        letterSpacing: floated ? "0.08em" : "0",
        textTransform: floated ? "uppercase" : "none",
        color: focused ? tok.accent : tok.textSecondary,
        pointerEvents: "none", transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {label}
      </label>
      {rightAdornment && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightAdornment}</div>
      )}
      {error && (
        <p style={{ fontSize: "0.68rem", color: "#EF4444", marginTop: "0.3rem", paddingLeft: "0.125rem" }}>{error}</p>
      )}
    </div>
  );
}

// ── Skin type pills ───────────────────────────────────────────────────────────
const SKIN_TYPES = [
  { id: "normal", en: "Normal", de: "Normal", ko: "보통" },
  { id: "oily", en: "Oily", de: "Fettig", ko: "지성" },
  { id: "dry", en: "Dry", de: "Trocken", ko: "건성" },
  { id: "combination", en: "Combination", de: "Mischhaut", ko: "복합성" },
  { id: "sensitive", en: "Sensitive", de: "Empfindlich", ko: "민감성" },
];

// ── Glass section card ────────────────────────────────────────────────────────
function GlassSection({ children, style, isDark }: {
  children: React.ReactNode; style?: React.CSSProperties;
  isDark: boolean; tok?: ReturnType<typeof tokens>;
}) {
  const glassTok = glassTokens(isDark);
  return (
    <div style={{
      borderRadius: 16, padding: "1.25rem",
      background: glassTok.card.background,
      backdropFilter: glassTok.card.backdropFilter,
      WebkitBackdropFilter: glassTok.card.WebkitBackdropFilter,
      border: glassTok.card.border,
      boxShadow: glassTok.card.boxShadow,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Delete confirmation modal (unchanged logic, 2025 themed) ──────────────────
function DeleteModal({
  lang, onClose, onConfirm, isDark, tok,
}: {
  lang: LangKey; onClose: () => void; onConfirm: () => Promise<void>;
  isDark: boolean; tok: ReturnType<typeof tokens>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const matches = confirmText === "DELETE";

  const handleConfirm = async () => { if (!matches) return; setDeleting(true); await onConfirm(); setDeleting(false); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
        style={{
          background: isDark ? 'rgba(20,20,20,0.97)' : 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: "1px solid rgba(239,68,68,0.3)", borderRadius: 18, padding: "1.75rem",
          maxWidth: 420, width: "100%",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} strokeWidth={1.5} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: tok.text }}>{tx('delete_account', lang)}</h2>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: tok.textSecondary }} strokeWidth={1.5} /></button>
        </div>
        <p style={{ fontSize: "0.8125rem", color: tok.textSecondary, lineHeight: 1.65, marginBottom: "1.25rem" }}>
          {tx('danger_desc', lang)}
        </p>
        <input
          value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
          style={{
            width: "100%", padding: "0.625rem 0.875rem",
            background: "rgba(239,68,68,0.06)", border: `1px solid ${matches ? "#EF4444" : "rgba(239,68,68,0.2)"}`,
            borderRadius: 8, fontSize: "0.875rem", color: tok.text, outline: "none",
            fontFamily: "monospace", letterSpacing: "0.12em",
          }}
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: `1px solid ${tok.border}`, color: tok.textSecondary }}>{tx('cancel', lang)}</button>
          <button onClick={handleConfirm} disabled={!matches || deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: matches ? "#EF4444" : "rgba(239,68,68,0.2)", color: "#fff" }}>
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {tx('delete_account', lang)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Bio-Data Purge Modal ──────────────────────────────────────────────────────
function DangerBioDataModal({
  lang, onClose, onConfirm, isDark, tok,
}: {
  lang: LangKey; onClose: () => void; onConfirm: () => Promise<void>;
  isDark: boolean; tok: ReturnType<typeof tokens>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const confirmWord = lang === 'de' ? 'LÖSCHEN' : lang === 'ko' ? '삭제' : 'DELETE';
  const matches = confirmText === confirmWord;

  const handleConfirm = async () => { if (!matches) return; setDeleting(true); await onConfirm(); setDeleting(false); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
        style={{
          background: isDark ? 'rgba(30,5,5,0.95)' : '#fff',
          border: "1px solid rgba(239,68,68,0.3)", borderRadius: 18, padding: "1.75rem",
          maxWidth: 420, width: "100%",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" style={{ color: "#EF4444" }} strokeWidth={1.5} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#EF4444" }}>{tx('bio_purge', lang)}</h2>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: tok.textSecondary }} strokeWidth={1.5} /></button>
        </div>
        <p style={{ fontSize: "0.8125rem", color: tok.textSecondary, lineHeight: 1.65, marginBottom: "1.25rem" }}>
          {tx('bio_purge_desc', lang)}
        </p>
        <p style={{ fontSize: "0.75rem", color: tok.text, marginBottom: "0.5rem" }}>
          {lang === 'de' ? `"${confirmWord}" eingeben:` : lang === 'ko' ? `"${confirmWord}" 입력:` : `Type "${confirmWord}":`}
        </p>
        <input
          value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={confirmWord}
          style={{
            width: "100%", padding: "0.625rem 0.875rem",
            background: "rgba(239,68,68,0.06)", border: `1px solid ${matches ? "#EF4444" : "rgba(239,68,68,0.2)"}`,
            borderRadius: 8, fontSize: "0.875rem", color: tok.text, outline: "none",
            fontFamily: "monospace", letterSpacing: "0.12em",
          }}
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: `1px solid ${tok.border}`, color: tok.textSecondary }}>{tx('cancel', lang)}</button>
          <button onClick={handleConfirm} disabled={!matches || deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: matches ? "#EF4444" : "rgba(239,68,68,0.2)", color: "#fff" }}>
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {tx('bio_purge', lang)}
          </button>
        </div>
      </motion.div>
    </div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage({ de }: { de: boolean }) {
  const { userProfile, logout } = useAuthStore();
  const { profile, loading, updateProfile, updatePassword } = useProfile();
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language as LangKey : 'en';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);

  const [activeSection, setActiveSection] = useState<'overview' | 'edit' | 'privacy'>('overview');
  const [profileSave, setProfileSave] = useState<SaveState>("idle");
  const [pwdSave, setPwdSave] = useState<SaveState>("idle");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bioDataPurgeOpen, setBioDataPurgeOpen] = useState(false);
  const [aiProfilingEnabled, setAiProfilingEnabled] = useState(true);

  // ── Score data from Supabase-persisted skin profile ─────────────────────────
  const { activeProfile } = useSkinProfileStore();
  const selectedTier = useRoutineStore(s => s.selectedTier);

  const overallScore = useMemo(() => {
    if (!activeProfile?.scores) return null;
    const values = Object.values(activeProfile.scores).filter(s => s > 0);
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(100 - avg); // Convert severity to health
  }, [activeProfile]);

  const topConcerns = useMemo(() => {
    if (!activeProfile?.scores) return [];
    return (Object.entries(activeProfile.scores) as [SkinAxis, number][])
      .filter(([k, v]) => v > 0 && k !== 'makeup_stability')
      .map(([k, v]) => ({ axis: k as string, score: Math.round(100 - v) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [activeProfile]);

  const tierLabel = useMemo(() => {
    const tierMap = { essential: tx('tier_essential', lang), complete: tx('tier_complete', lang), pro: tx('tier_pro', lang) };
    return tierMap[selectedTier ?? 'complete'] ?? tx('tier_complete', lang);
  }, [selectedTier, lang]);

  // ── Profile form ────────────────────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.id]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileSave("saving");
    const { error } = await updateProfile({
      firstName: values.firstName, lastName: values.lastName,
      phone: values.phone || undefined, birthDate: values.birthDate || undefined,
      skinType: values.skinType || undefined,
    });
    if (error) { toast.error(error); setProfileSave("idle"); }
    else { setProfileSave("success"); setTimeout(() => setProfileSave("idle"), 1500); }
  };

  // ── Password form ──────────────────────────────────────────────────────────
  const pwdForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onPwdSubmit = async (values: PasswordFormValues) => {
    setPwdSave("saving");
    const { error } = await updatePassword(values.password);
    if (error) { toast.error(error); setPwdSave("idle"); }
    else { setPwdSave("success"); pwdForm.reset(); setTimeout(() => setPwdSave("idle"), 1500); }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("delete_own_user");
    if (error) toast.error(error.message);
    else await logout();
  };

  // ── Purge bio-data ─────────────────────────────────────────────────────────
  const handlePurgeBiometricData = async () => {
    useSkinAnalysisStore.getState().clearSensitiveData();
    localStorage.removeItem("biometric_consent");
    localStorage.removeItem("biometric_consent_at");
    useSkinAnalysisStore.getState().resetAnalysis();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('user_skin_profiles').delete().eq('user_id', user.id);
      }
    } catch (e) { console.warn('[BioData Purge] Server purge failed:', e); }
    toast.success(tx('saved', lang));
    setBioDataPurgeOpen(false);
  };

  // ── AI Profiling toggle ────────────────────────────────────────────────────
  const handleToggleAiProfiling = async (checked: boolean) => {
    const prev = aiProfilingEnabled;
    setAiProfilingEnabled(checked);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('profiles').update({ metadata: { allow_ai_profiling: checked } }).eq('user_id', user.id);
      }
    } catch { setAiProfilingEnabled(prev); toast.error("Change failed."); }
  };

  const initials = (`${userProfile?.firstName?.[0] ?? ""}${userProfile?.lastName?.[0] ?? ""}`).toUpperCase() || "?";
  const isGoogle = userProfile?.provider === "google";

  // ── Fake trend data (would come from analysis history) ──────────────────────
  const trendData = [38, 42, 45, 48, 50, overallScore ?? 53];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: 640, margin: '0 auto',
      padding: 'clamp(16px, 4vw, 32px)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>

      {/* ═══ User Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}
      >
        {userProfile?.avatar ? (
          <img src={userProfile.avatar} alt={initials}
            style={{ width: 52, height: 52, borderRadius: 99, objectFit: 'cover', border: `2px solid ${tok.accent}` }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 99,
            background: ctaTok.background,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: isDark ? '#F5F5F7' : '#FFFFFF',
          }}>
            {initials}
          </div>
        )}
        <div>
          <p style={{
            fontSize: 18, fontWeight: 700, color: tok.text,
            fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
          }}>
            {userProfile?.firstName} {userProfile?.lastName}
          </p>
          <p style={{ fontSize: 13, color: tok.textSecondary }}>
            {tx('member_since', lang, { date: '2025' })}
          </p>
        </div>
      </motion.div>

      {/* ═══ Score Hub ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassSection isDark={isDark} style={{ textAlign: 'center' }}>
          {overallScore !== null ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: tok.text }}>
                <ScoreRing score={overallScore} size={120} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: tok.text, marginBottom: 4 }}>
                {tx('score_hub_title', lang)}
              </p>
              <p style={{ fontSize: 12, color: tok.textSecondary, marginBottom: 12 }}>
                {tx('last_analysis', lang, { d: '3' })}
              </p>
              {/* Top concern pills */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {topConcerns.map(c => {
                  const tier = c.score < 30 ? 'critical' : c.score < 70 ? 'attention' : 'good';
                  const { gradient } = tierGradients[tier];
                  return (
                    <span key={c.axis} style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 99,
                      background: `${gradient[0]}14`, color: gradient[0],
                      border: `1px solid ${gradient[0]}25`,
                    }}>
                      {c.axis} {c.score}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 14, color: tok.textSecondary, marginBottom: 12 }}>
                {tx('no_analysis', lang)}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/analysis'}
                style={{
                  padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: ctaTok.background, color: isDark ? '#F5F5F7' : '#FFFFFF',
                  fontSize: 13, fontWeight: 600,
                  boxShadow: ctaGlowToken(isDark),
                }}
              >
                {tx('start_analysis', lang)}
              </motion.button>
            </div>
          )}
        </GlassSection>
      </motion.div>

      {/* ═══ Active Routine Card ═══ */}
      {overallScore !== null && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassSection isDark={isDark}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: tok.accent, marginBottom: 4,
                }}>{tx('active_routine', lang)}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: tok.text }}>
                  {tx('routine_steps', lang, { tier: tierLabel, n: selectedTier === 'essential' ? 3 : selectedTier === 'pro' ? 6 : 5 })}
                </p>
              </div>
              <span style={{ fontSize: 24 }}>✨</span>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {(lang === 'ko'
                ? ['클렌저', '토너', '세럼', '크림', 'SPF']
                : lang === 'de'
                  ? ['Reinigung', 'Toner', 'Serum', 'Creme', 'SPF']
                  : ['Cleanser', 'Toner', 'Serum', 'Cream', 'SPF']
              ).map((s, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  color: tok.textSecondary,
                }}>
                  {i + 1}. {s}
                </span>
              ))}
            </div>
          </GlassSection>
        </motion.div>
      )}

      {/* ═══ Skin Trend ═══ */}
      {overallScore !== null && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassSection isDark={isDark}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: tok.accent, marginBottom: 12,
            }}>{tx('skin_trend', lang)}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, marginBottom: 8 }}>
              {trendData.map((v, i) => (
                <motion.div key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  style={{
                    flex: 1, borderRadius: '4px 4px 0 0',
                    background: i === trendData.length - 1 ? tok.accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: tok.textTertiary }}>Jan</span>
              <span style={{ fontSize: 11, color: tok.textTertiary }}>Mar</span>
              <span style={{ fontSize: 11, color: tok.accent, fontWeight: 600 }}>
                {lang === 'ko' ? '현재' : lang === 'de' ? 'Jetzt' : 'Now'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: tok.textSecondary, marginTop: 10 }}>
              {tx('trend_improving', lang)}
            </p>
          </GlassSection>
        </motion.div>
      )}

      {/* ═══ Account Actions List ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${tok.border}` }}>
          {[
            { label: tx('actions_edit', lang), icon: '👤', onClick: () => setActiveSection(activeSection === 'edit' ? 'overview' : 'edit') },
            { label: tx('actions_privacy', lang), icon: '🔒', onClick: () => setActiveSection(activeSection === 'privacy' ? 'overview' : 'privacy') },
            { label: tx('actions_language', lang), icon: '🌐', detail: lang === 'ko' ? '한국어' : lang === 'de' ? 'Deutsch' : 'English' },
            { label: tx('actions_logout', lang), icon: '→', danger: true, onClick: logout },
          ].map((item, i, arr) => (
            <div key={i}
              onClick={item.onClick}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', cursor: item.onClick ? 'pointer' : 'default',
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                borderBottom: i < arr.length - 1 ? `1px solid ${tok.border}` : 'none',
                transition: 'background 0.15s ease',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: item.danger ? '#CF6679' : tok.text }}>{item.label}</span>
              </div>
              {item.detail ? (
                <span style={{ fontSize: 13, color: tok.textTertiary }}>{item.detail}</span>
              ) : (
                <ChevronRight size={14} color={tok.textTertiary} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Expandable: Edit Profile Section ═══ */}
      <AnimatePresence>
        {activeSection === 'edit' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}
          >
            <GlassSection isDark={isDark}>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: tok.accent, marginBottom: 16,
              }}>{tx('personal_info', lang)}</p>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 rounded-xl animate-pulse"
                      style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  ))}
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Controller control={profileForm.control} name="firstName"
                      render={({ field, fieldState }) => (
                        <FloatingField id="firstName" label={tx('first_name', lang)}
                          value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                          error={fieldState.error?.message} autoComplete="given-name" tok={tok} isDark={isDark} />
                      )} />
                    <Controller control={profileForm.control} name="lastName"
                      render={({ field, fieldState }) => (
                        <FloatingField id="lastName" label={tx('last_name', lang)}
                          value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                          error={fieldState.error?.message} autoComplete="family-name" tok={tok} isDark={isDark} />
                      )} />
                  </div>
                  <Controller control={profileForm.control} name="phone"
                    render={({ field }) => (
                      <FloatingField id="phone" label={tx('phone', lang)} type="tel"
                        value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur}
                        autoComplete="tel" tok={tok} isDark={isDark} />
                    )} />
                  <Controller control={profileForm.control} name="birthDate"
                    render={({ field }) => (
                      <FloatingField id="birthDate" label={tx('birth_date', lang)} type="date"
                        value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur}
                        autoComplete="bday" tok={tok} isDark={isDark} />
                    )} />
                  <div>
                    <p style={{ fontSize: '0.65rem', color: tok.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                      {tx('skin_type', lang)}
                    </p>
                    <Controller control={profileForm.control} name="skinType"
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {SKIN_TYPES.map(st => {
                            const active = field.value === st.id;
                            return (
                              <button key={st.id} type="button" onClick={() => field.onChange(active ? "" : st.id)}
                                style={{
                                  padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem',
                                  border: `1px solid ${active ? tok.accent : tok.border}`,
                                  background: active ? `${tok.accent}12` : 'transparent',
                                  color: active ? tok.accent : tok.textSecondary, cursor: 'pointer',
                                }}>
                                {st[lang]}
                              </button>
                            );
                          })}
                        </div>
                      )} />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="submit" disabled={profileSave === 'saving'}
                      style={{
                        padding: '0.625rem 1.25rem', borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: profileSave === 'success' ? '#4ADE80' : ctaTok.background,
                        color: isDark ? '#F5F5F7' : '#FFFFFF', fontSize: '0.875rem', fontWeight: 600,
                      }}>
                      {profileSave === 'saving' ? tx('saving', lang) : profileSave === 'success' ? tx('saved', lang) : tx('save', lang)}
                    </button>
                  </div>
                </form>
              )}

              {/* Security section */}
              <div style={{ borderTop: `1px solid ${tok.border}`, marginTop: 20, paddingTop: 20 }}>
                <p style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: tok.accent, marginBottom: 16,
                }}>{tx('security', lang)}</p>

                {isGoogle ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12,
                    background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)',
                  }}>
                    <GoogleLogo />
                    <div>
                      <p style={{ fontSize: 13, color: tok.text, fontWeight: 500 }}>{tx('google_connected', lang)}</p>
                      <p style={{ fontSize: 12, color: tok.textSecondary, marginTop: 2 }}>{userProfile?.email}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} className="space-y-4">
                    <Controller control={pwdForm.control} name="password"
                      render={({ field, fieldState }) => (
                        <FloatingField id="new-password" label={tx('new_password', lang)} type={showPwd ? "text" : "password"}
                          value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                          error={fieldState.error?.message} autoComplete="new-password" tok={tok} isDark={isDark}
                          rightAdornment={
                            <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ color: tok.textSecondary, lineHeight: 0 }}>
                              {showPwd ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                            </button>
                          } />
                      )} />
                    <Controller control={pwdForm.control} name="confirm"
                      render={({ field, fieldState }) => (
                        <FloatingField id="confirm-password" label={tx('confirm_password', lang)} type={showConfirm ? "text" : "password"}
                          value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                          error={fieldState.error?.message} autoComplete="new-password" tok={tok} isDark={isDark}
                          rightAdornment={
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ color: tok.textSecondary, lineHeight: 0 }}>
                              {showConfirm ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                            </button>
                          } />
                      )} />
                    <div className="flex justify-end">
                      <button type="submit" disabled={pwdSave === 'saving'}
                        style={{
                          padding: '0.625rem 1.25rem', borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: pwdSave === 'success' ? '#4ADE80' : ctaTok.background,
                          color: isDark ? '#F5F5F7' : '#FFFFFF', fontSize: '0.875rem', fontWeight: 600,
                        }}>
                        {pwdSave === 'saving' ? tx('saving', lang) : pwdSave === 'success' ? tx('saved', lang) : tx('save', lang)}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Expandable: Privacy Section ═══ */}
      <AnimatePresence>
        {activeSection === 'privacy' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}
          >
            <GlassSection isDark={isDark}>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: tok.accent, marginBottom: 16,
              }}>{tx('privacy', lang)}</p>

              {/* AI Profiling Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${tok.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                  <Brain className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: tok.accent }} strokeWidth={1.5} />
                  <div>
                    <p style={{ fontSize: 13, color: tok.text, fontWeight: 500, marginBottom: 2 }}>{tx('ai_profiling', lang)}</p>
                    <p style={{ fontSize: 11, color: tok.textSecondary, lineHeight: 1.5 }}>{tx('ai_profiling_desc', lang)}</p>
                  </div>
                </div>
                <SwitchPrimitive.Root
                  checked={aiProfilingEnabled} onCheckedChange={handleToggleAiProfiling}
                  className="relative w-[42px] h-[24px] rounded-full transition-colors"
                  style={{ background: aiProfilingEnabled ? tok.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}>
                  <SwitchPrimitive.Thumb className="block w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: aiProfilingEnabled ? 'translateX(20px)' : 'translateX(2px)' }} />
                </SwitchPrimitive.Root>
              </div>

              {/* Bio-Data Purge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} strokeWidth={1.5} />
                <div>
                  <p style={{ fontSize: 13, color: tok.text, fontWeight: 500, marginBottom: 2 }}>{tx('bio_purge', lang)}</p>
                  <p style={{ fontSize: 11, color: tok.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>{tx('bio_purge_desc', lang)}</p>
                  <button onClick={() => setBioDataPurgeOpen(true)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)',
                    cursor: 'pointer',
                  }}>{tx('bio_purge_btn', lang)}</button>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ borderTop: `1px solid ${tok.border}`, marginTop: 20, paddingTop: 20 }}>
                <p style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#EF4444', marginBottom: 10,
                }}>{tx('danger_zone', lang)}</p>
                <p style={{ fontSize: 13, color: tok.textSecondary, lineHeight: 1.65, marginBottom: 12 }}>
                  {tx('danger_desc', lang)}
                </p>
                <button onClick={() => setDeleteOpen(true)} style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                  cursor: 'pointer',
                }}>{tx('delete_account', lang)}</button>
              </div>
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Modals ═══ */}
      <AnimatePresence>
        {deleteOpen && <DeleteModal lang={lang} isDark={isDark} tok={tok} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteAccount} />}
      </AnimatePresence>
      <AnimatePresence>
        {bioDataPurgeOpen && <DangerBioDataModal lang={lang} isDark={isDark} tok={tok} onClose={() => setBioDataPurgeOpen(false)} onConfirm={handlePurgeBiometricData} />}
      </AnimatePresence>
    </div>
  );
}
