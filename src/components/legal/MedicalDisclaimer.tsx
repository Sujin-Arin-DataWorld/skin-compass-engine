import { Info } from "lucide-react";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";
import { tokens } from "@/lib/designTokens";

const DISCLAIMER_COPY = {
  de: {
    text: "Diese KI-gestützte Hautanalyse dient ausschließlich kosmetischen und informativen Zwecken und stellt keine medizinische Diagnose, Beratung oder Behandlung dar. Die empfohlenen Produkte sind kosmetische Mittel und keine Arzneimittel. Bei Hauterkrankungen oder medizinischen Beschwerden konsultieren Sie bitte stets einen Dermatologen.",
    label: "Kosmetische Analyse",
  },
  en: {
    text: "This AI-powered skin analysis is provided exclusively for cosmetic and informational purposes and does not constitute a medical analysis, consultation, or treatment. The recommended products are cosmetic products, not pharmaceuticals. For skin conditions or medical concerns, please always consult a dermatologist.",
    label: "Cosmetic Analysis",
  },
  ko: {
    text: "본 AI 기반 피부 분석은 오로지 미용 및 정보 제공의 목적으로만 제공되며, 의학적 진단, 상담 또는 치료를 대체하지 않습니다. 추천된 제품은 의약품이 아닌 화장품입니다. 피부 질환이나 의학적 문제가 있는 경우 반드시 피부과 전문의와 상담하십시오.",
    label: "미용 분석",
  },
};

export default function MedicalDisclaimer({ className = "" }: { className?: string }) {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tok = tokens(isDark);

  const lang = (language as keyof typeof DISCLAIMER_COPY) || "en";
  const content = DISCLAIMER_COPY[lang] ?? DISCLAIMER_COPY.en;

  return (
    <div
      className={`w-full ${className}`}
      style={{
        background: isDark ? "rgba(26, 31, 46, 0.4)" : "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${tok.border}`,
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3 mx-auto w-full max-w-[960px]">
        <div 
          className="shrink-0 mt-0.5 p-1 rounded-full"
          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
        >
          <Info size={14} color={tok.textSecondary} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="mb-0.5"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 600,
              color: tok.text,
              letterSpacing: "0.02em",
            }}
          >
            {content.label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              color: tok.textSecondary,
              lineHeight: 1.5,
              wordWrap: "break-word",
            }}
          >
            {content.text}
          </p>
        </div>
      </div>
    </div>
  );
}
