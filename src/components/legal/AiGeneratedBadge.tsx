import { Sparkles } from "lucide-react";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";

const AI_BADGE_COPY = {
  de: "Generiert durch KI",
  en: "AI-Generated",
  ko: "AI 생성",
};

export default function AiGeneratedBadge({ className = "" }: { className?: string }) {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const lang = (language as keyof typeof AI_BADGE_COPY) || "en";
  const text = AI_BADGE_COPY[lang] ?? AI_BADGE_COPY.en;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 h-[24px] select-none ${className}`}
      style={{
        background: isDark ? "rgba(255,255,255,0.06)" : "#F0EDE8",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E1DB"}`,
        color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <Sparkles size={12} strokeWidth={2.5} />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          lineHeight: 1,
          paddingTop: "1px", // Optical alignment for uppercase small text
        }}
      >
        {text}
      </span>
    </div>
  );
}
