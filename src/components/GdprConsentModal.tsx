/**
 * GdprConsentModal
 *
 * Shown once to users who sign in via Google OAuth for the first time.
 * EU/DE GDPR law requires explicit consent even when a third-party provider
 * (Google) has already authenticated the user — Google's own consent only
 * covers Google's services, not ours.
 *
 * On accept  → records gdpr_consent = true in the profiles table, closes modal.
 * On decline → signs the user out, closes modal.
 *
 * The `gdpr_consent` column must exist in the profiles table:
 *   ALTER TABLE profiles
 *     ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false,
 *     ADD COLUMN IF NOT EXISTS gdpr_consent_at timestamptz;
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, X, Loader2 } from "lucide-react";
import { useI18nStore } from "@/store/i18nStore";

interface Props {
    onAccept: () => Promise<void>;
    onDecline: () => Promise<void>;
    loading?: boolean;
}

const COPY = {
    en: {
        badge: "Data & Privacy",
        title: "Before you continue",
        intro: "To use Skin Strategy Lab, we need your consent to collect and process the following personal data in accordance with the GDPR (EU 2016/679):",
        bullets: [
            "Account data: name and email address (via Google)",
            "Skin profile data: analysis results, axis scores, and skin tier",
            "Usage data: wishlist, order history, and saved addresses",
            "Facial images for AI skin analysis (instantly deleted after processing, never stored)",
        ],
        purpose: "This data is used exclusively to personalise your skin protocol and improve recommendations. It is never sold to third parties.",
        policy: "Read our full Privacy Policy",
        accept: "Accept & Continue",
        decline: "Decline & Sign Out",
        note: "You can withdraw consent at any time from your Account settings.",
    },
    de: {
        badge: "Datenschutz & DSGVO",
        title: "Bevor Sie fortfahren",
        intro: "Um Skin Strategy Lab zu nutzen, benötigen wir Ihre Einwilligung zur Erhebung und Verarbeitung folgender personenbezogener Daten gemäß DSGVO (EU 2016/679):",
        bullets: [
            "Kontodaten: Name und E-Mail-Adresse (via Google)",
            "Hautprofil: Analyseergebnisse, Dimensions-Scores und Hauttyp",
            "Nutzungsdaten: Wunschliste, Bestellhistorie und gespeicherte Adressen",
            "Gesichtsbilder für KI-Hautanalyse (sofort nach Verarbeitung gelöscht, niemals gespeichert)",
        ],
        purpose: "Diese Daten werden ausschließlich zur Personalisierung Ihres Hautprotokolls und zur Verbesserung der Empfehlungen verwendet. Sie werden niemals an Dritte verkauft.",
        policy: "Vollständige Datenschutzerklärung lesen",
        accept: "Zustimmen & Fortfahren",
        decline: "Ablehnen & Abmelden",
        note: "Sie können Ihre Einwilligung jederzeit in den Kontoeinstellungen widerrufen.",
    },
    ko: {
        badge: "데이터 및 개인정보",
        title: "계속하기 전에",
        intro: "Skin Strategy Lab을 이용하려면 GDPR(EU 2016/679) 및 개인정보 보호법에 따라 다음 개인정보의 수집·처리·국외 이전에 동의해 주셔야 합니다. 개인정보 국외 이전 동의: 독일 프랑크푸르트 서버에 안전하게 전송 및 보관됩니다.",
        bullets: [
            "계정 정보: 이름 및 이메일 주소 (Google 연동)",
            "피부 프로필: 분석 결과, 축 점수, 피부 등급",
            "이용 정보: 위시리스트, 주문 내역, 저장된 주소",
            "AI 피부 분석을 위한 얼굴 사진 (처리 후 즉시 삭제, 서버 저장 없음)",
        ],
        purpose: "이 데이터는 오직 맞춤형 피부 프로토콜 및 추천 개선을 위해 사용됩니다. 제3자에게 판매되지 않습니다.",
        policy: "전체 개인정보 처리방침 보기",
        accept: "동의 및 계속",
        decline: "거부 및 로그아웃",
        note: "계정 설정에서 언제든지 동의를 철회할 수 있습니다.",
    },
};

export default function GdprConsentModal({ onAccept, onDecline, loading = false }: Props) {
    const { language } = useI18nStore();
    const t = language === "ko" ? COPY.ko : language === "de" ? COPY.de : COPY.en;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: "#0d0d0d",
                    border: "1px solid rgba(45,107,74,0.2)",
                    boxShadow: "0 0 60px rgba(45,107,74,0.08)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-6 py-5"
                    style={{ borderBottom: "1px solid rgba(45,107,74,0.1)" }}
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(45,107,74,0.1)" }}
                    >
                        <ShieldCheck className="w-4 h-4" style={{ color: "var(--ssl-accent)" }} />
                    </div>
                    <div>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "var(--ssl-accent-deep)", textTransform: "uppercase" }}>
                            {t.badge}
                        </p>
                        <p style={{ fontFamily: "'Georgia', serif", fontSize: "1.05rem", color: "var(--ssl-accent)", lineHeight: 1.2 }}>
                            {t.title}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <p style={{ fontSize: "0.8125rem", color: "#b0b0b0", lineHeight: 1.65 }}>
                        {t.intro}
                    </p>

                    <ul className="space-y-2">
                        {t.bullets.map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                                <span
                                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: "var(--ssl-accent)" }}
                                />
                                <span style={{ fontSize: "0.8125rem", color: "#e8e8e8", lineHeight: 1.5 }}>{item}</span>
                            </li>
                        ))}
                    </ul>

                    <p style={{ fontSize: "0.75rem", color: "var(--ssl-accent-deep)", lineHeight: 1.6 }}>
                        {t.purpose}
                    </p>

                    <Link
                        to="/datenschutz"
                        className="inline-flex items-center gap-1 text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
                        style={{ color: "var(--ssl-accent)" }}
                    >
                        {t.policy} →
                    </Link>
                </div>

                {/* Actions */}
                <div
                    className="px-6 pb-6 pt-4 space-y-3"
                    style={{ borderTop: "1px solid rgba(45,107,74,0.08)" }}
                >
                    <button
                        onClick={onAccept}
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: "var(--ssl-accent)", color: "#F5F5F7" }}
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                            : t.accept
                        }
                    </button>

                    <button
                        onClick={onDecline}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-70 disabled:opacity-50"
                        style={{ color: "var(--ssl-accent-deep)", border: "1px solid rgba(148,126,92,0.25)" }}
                    >
                        <X className="w-3 h-3 inline mr-1.5 mb-0.5" />
                        {t.decline}
                    </button>

                    <p style={{ fontSize: "0.65rem", color: "rgba(148,126,92,0.6)", textAlign: "center", lineHeight: 1.5 }}>
                        {t.note}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
