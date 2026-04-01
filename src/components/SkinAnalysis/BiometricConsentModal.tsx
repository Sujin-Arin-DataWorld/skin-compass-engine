import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, X } from "lucide-react";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";
import { tokens, glassTokens } from "@/lib/designTokens";

const PREMIUM_CONSENT_DATA = {
  de: {
    badge: "Datenschutz",
    title: "Vorbereitung zur Hautanalyse",
    intro: "Um Ihnen die präzisesten kosmetischen Empfehlungen geben zu können, analysiert unsere KI Ihr Gesichtsfoto in Echtzeit.",
    bullets: [
      "Ihre Privatsphäre ist garantiert: Das Foto wird nach der Analyse sofort unwiderruflich gelöscht (Zero Data Retention).",
      "Es handelt sich um eine kosmetische Einschätzung, die keine professionelle medizinische Diagnose ersetzt.",
      "Die erzeugten numerischen Hautprofile werden verschlüsselt gespeichert.",
    ],
    checkboxCosmetic: 
      "Ich verstehe, dass dies eine kosmetische Analyse ist und keine professionelle medizinische Beratung ersetzt.",
    checkboxBiometric: 
      "Ich willige ausdrücklich in die Verarbeitung meiner biometrischen Gesichtsdaten gemäß Art. 9 Abs. 2 lit. a DSGVO ein.",
    accept: "Zustimmen & Kamera starten",
    privacyLink: "Vollständige Datenschutzerklärung",
    withdrawNote: "Sie können diese Einwilligung jederzeit widerrufen. Die Hautanalyse per Fragebogen steht Ihnen auch ohne diese Einwilligung zur Verfügung.",
  },
  en: {
    badge: "Privacy",
    title: "Premium Consultation Prep",
    intro: "To provide the most precise cosmetic recommendations, our AI analyzes your facial photo in real-time.",
    bullets: [
      "Your privacy is guaranteed: The photo is irreversibly deleted immediately after analysis (Zero Data Retention).",
      "This is a cosmetic assessment and does not replace professional medical diagnosis.",
      "Generated numerical skin profiles are stored encrypted.",
    ],
    checkboxCosmetic: 
      "I understand that this is a cosmetic analysis and does not replace professional medical advice.",
    checkboxBiometric: 
      "I explicitly consent to the processing of my biometric facial data under Article 9(2)(a) GDPR.",
    accept: "Agree & Start Camera",
    privacyLink: "Full Privacy Policy",
    withdrawNote: "You can withdraw this consent at any time. The questionnaire-based skin analysis remains available without this consent.",
  },
  ko: {
    badge: "개인정보 보호",
    title: "프리미엄 분석 준비",
    intro: "가장 정밀한 화장품 추천을 제공하기 위해 AI가 고객님의 얼굴 사진을 실시간으로 분석합니다.",
    bullets: [
      "완벽한 프라이버시: 분석 즉시 사진은 서버와 기기에서 영구 삭제됩니다 (Zero Data Retention).",
      "본 분석은 미용 목적이며 전문적인 의학적 진단을 대체하지 않습니다.",
      "추출된 수치형 피부 데이터는 안전하게 암호화되어 저장됩니다.",
    ],
    checkboxCosmetic: 
      "본 분석은 화장품 추천 목적이며, 전문적인 의학적 조언을 대체하지 않음을 이해합니다.",
    checkboxBiometric: 
      "GDPR 제9조 제2항 (a)호에 기반한 생체인식 얼굴 데이터 처리에 명시적으로 동의합니다.",
    accept: "동의 및 카메라 시작",
    privacyLink: "전체 개인정보 처리방침",
    withdrawNote: "이 동의는 언제든지 철회할 수 있습니다. 설문 기반 피부 분석은 이 동의 없이도 이용 가능합니다.",
  },
};

interface Phase2ModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export default function BiometricConsentModal({ isOpen, onAccept, onCancel }: Phase2ModalProps) {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tok = tokens(isDark);
  const glassTok = glassTokens(isDark);

  const lang = (language as keyof typeof PREMIUM_CONSENT_DATA) || "en";
  const content = PREMIUM_CONSENT_DATA[lang] ?? PREMIUM_CONSENT_DATA.en;

  const [checkCosmetic, setCheckCosmetic] = useState(false);
  const [checkBio, setCheckBio] = useState(false);

  // Reset checkboxes when modal opens
  useEffect(() => {
    if (isOpen) {
      setCheckCosmetic(false);
      setCheckBio(false);
    }
  }, [isOpen]);

  const allChecked = checkCosmetic && checkBio;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-20 md:pb-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative w-full max-w-[440px] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl"
            style={{
              background: glassTok.card.background,
              backdropFilter: glassTok.card.backdropFilter,
              WebkitBackdropFilter: glassTok.card.WebkitBackdropFilter,
              border: glassTok.card.border,
            }}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: tok.textSecondary }}
            >
              <X size={16} />
            </button>

            {/* Header: Icon and Badge in one row */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isDark ? "rgba(74, 158, 104, 0.15)" : "rgba(74, 158, 104, 0.1)", border: `1px solid rgba(74, 158, 104, 0.3)` }}
              >
                <Shield size={20} color="#4A9E68" />
              </div>
              <span 
                className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm"
                style={{ 
                  background: isDark ? "rgba(74, 158, 104, 0.2)" : "rgba(74, 158, 104, 0.1)", 
                  color: "#4A9E68",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {content.badge}
              </span>
            </div>

            <h2 
              className="text-xl md:text-2xl font-light mb-2"
              style={{ fontFamily: "var(--font-display)", color: tok.text }}
            >
              {content.title}
            </h2>
            
            <p className="text-sm mb-5 pb-5 border-b" style={{ fontFamily: "var(--font-sans)", color: tok.textSecondary, borderBottomColor: tok.border, lineHeight: 1.5 }}>
              {content.intro}
            </p>

            {/* Bullets */}
            <div className="space-y-3 mb-6">
              {content.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: tok.accent }} />
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: tok.textSecondary, lineHeight: 1.5 }}>
                    {bullet}
                  </p>
                </div>
              ))}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 mb-6 bg-black/5 dark:bg-black/20 rounded-xl p-4 border border-black/5 dark:border-white/5">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={checkCosmetic}
                  onChange={(e) => setCheckCosmetic(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-400 focus:ring-primary/50 shrink-0 cursor-pointer transition-all"
                  style={{ accentColor: "#4A9E68" }}
                />
                <span className="text-xs transition-colors" style={{ color: checkCosmetic ? tok.text : tok.textSecondary, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
                  {content.checkboxCosmetic}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={checkBio}
                  onChange={(e) => setCheckBio(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-400 focus:ring-primary/50 shrink-0 cursor-pointer transition-all"
                  style={{ accentColor: "#4A9E68" }}
                />
                <span className="text-xs transition-colors" style={{ color: checkBio ? tok.text : tok.textSecondary, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
                  {content.checkboxBiometric}
                </span>
              </label>
            </div>

            {/* Action */}
            <button
              onClick={() => {
                if (allChecked) {
                  localStorage.setItem("biometric_consent", "true");
                  localStorage.setItem("biometric_consent_at", new Date().toISOString());
                  onAccept();
                }
              }}
              disabled={!allChecked}
              className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: allChecked ? tok.text : tok.border,
                color: allChecked ? tok.bg : tok.textSecondary,
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 600,
                opacity: allChecked ? 1 : 0.6,
                cursor: allChecked ? "pointer" : "not-allowed",
              }}
            >
              {content.accept}
              {allChecked && <ArrowRight size={16} />}
            </button>
            
            <div className="mt-5 text-center flex flex-col items-center gap-2">
              <a href="/datenschutz" target="_blank" className="text-[11px] underline underline-offset-2 transition-colors" style={{ color: tok.textSecondary, fontFamily: "var(--font-sans)" }}>
                {content.privacyLink}
              </a>
              <p className="text-[10px] max-w-[90%] text-center" style={{ color: tok.textTertiary, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                {content.withdrawNote}
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
