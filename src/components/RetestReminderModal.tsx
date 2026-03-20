/**
 * RetestReminderModal.tsx
 *
 * Polished confirmation modal shown when a logged-in user with prior history
 * clicks to start a new test. Displays last-test date, weeks elapsed, and
 * recommended re-test interval.
 *
 * Accessibility: focus trap, aria-modal, role="dialog", Escape key dismiss.
 * i18n: DE / EN / KO.
 * Design: uses existing CSS variables, Fraunces + Plus Jakarta Sans,
 *         supports dark/light mode via useTheme.
 */

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18nStore } from "@/store/i18nStore";

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = "en" | "de" | "ko";

interface RetestReminderModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  lastDiagnosedAt: string | null;
  radarScores?: Record<string, number> | null;
  skinTier?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RECOMMENDED_INTERVAL_WEEKS = 8;

// ── i18n copy ─────────────────────────────────────────────────────────────────

function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (lang === "ko") return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (lang === "de") return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getWeeksElapsed(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

const COPY = {
  eyebrow: {
    en: "Re-test Reminder",
    de: "Re-Test Erinnerung",
    ko: "재진단 알림",
  },
  title: {
    en: "Ready to see how your skin has changed?",
    de: "Bereit zu sehen, wie sich Ihre Haut verändert hat?",
    ko: "당신의 피부는 어떻게 달라졌을까요?",
  },
  lastTest: (date: string, lang: Lang): string => {
    const fmtDate = formatDate(date, lang);
    if (lang === "ko") return `마지막 분석: ${fmtDate}`;
    if (lang === "de") return `Letzte Analyse: ${fmtDate}`;
    return `You last took the test on ${fmtDate}.`;
  },
  weeksSince: (weeks: number, lang: Lang): string => {
    if (lang === "ko") return `마지막 진단 후 ${weeks}주가 지났습니다.`;
    if (lang === "de") return `Es sind ${weeks} Wochen seit Ihrem letzten Test vergangen.`;
    return `It has been ${weeks} week${weeks !== 1 ? "s" : ""} since your last test.`;
  },
  recommended: {
    en: `Our recommended testing interval is ${RECOMMENDED_INTERVAL_WEEKS} weeks.`,
    de: `Unser empfohlener Testintervall beträgt ${RECOMMENDED_INTERVAL_WEEKS} Wochen.`,
    ko: `권장 재진단 주기는 ${RECOMMENDED_INTERVAL_WEEKS}주입니다.`,
  },
  confirm: {
    en: "Yes, Test Now",
    de: "Ja, jetzt testen",
    ko: "네, 지금 테스트",
  },
  dismiss: {
    en: "Maybe Later",
    de: "Vielleicht später",
    ko: "나중에 할게요",
  },
} as const;

// ── Radar mini chart (SVG, purely cosmetic) ──────────────────────────────────

const RADAR_AXES = ["seb", "hyd", "bar", "sen", "acne", "pigment", "texture", "aging"] as const;

function MiniRadar({ scores }: { scores: Record<string, number> }) {
  const N = RADAR_AXES.length;
  const cx = 54, cy = 54, r = 42;
  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;
  const pt = (i: number, s: number) => ({
    x: cx + r * Math.min(1, Math.max(0, s / 100)) * Math.cos(angle(i)),
    y: cy + r * Math.min(1, Math.max(0, s / 100)) * Math.sin(angle(i)),
  });
  const pts = RADAR_AXES.map((a, i) => pt(i, scores[a] ?? 0));
  return (
    <svg viewBox="0 0 108 108" width="96" height="96" className="flex-shrink-0">
      {[0.3, 0.6, 1.0].map((lvl, gi) => (
        <polygon key={gi}
          points={RADAR_AXES.map((_, i) => { const a = angle(i); return `${cx + r * lvl * Math.cos(a)},${cy + r * lvl * Math.sin(a)}`; }).join(" ")}
          fill="none" stroke="var(--color-accent, #C9A96E)" strokeWidth="0.6" strokeOpacity="0.2" />
      ))}
      {RADAR_AXES.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
          stroke="var(--color-accent, #C9A96E)" strokeWidth="0.5" strokeOpacity="0.22" />
      ))}
      <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")}
        fill="var(--color-accent, #C9A96E)" fillOpacity="0.14" stroke="var(--color-accent, #C9A96E)" strokeWidth="1.5" strokeOpacity="0.8" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="var(--color-accent, #C9A96E)" fillOpacity="0.9" />)}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RetestReminderModal({
  isOpen, onConfirm, onDismiss, lastDiagnosedAt, radarScores, skinTier,
}: RetestReminderModalProps) {
  const { resolvedTheme } = useTheme();
  const { language } = useI18nStore();
  const lang = language as Lang;
  const isDark = resolvedTheme === "dark";
  const dialogRef = useRef<HTMLDivElement>(null);

  // ── Accent colors (match existing design tokens) ────────────────────────
  const GOLD = isDark ? "#c9a96e" : "#7A9E82";
  const GOLD_DEEP = isDark ? "var(--ssl-accent-deep)" : "#2D4F39";

  // ── Escape key dismiss ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onDismiss]);

  // ── Focus trap ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const container = dialogRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trapFocus);
    return () => window.removeEventListener("keydown", trapFocus);
  }, [isOpen]);

  // ── Backdrop click ──────────────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onDismiss(); },
    [onDismiss]
  );

  // ── Derived data ────────────────────────────────────────────────────────
  const weeksElapsed = lastDiagnosedAt ? getWeeksElapsed(lastDiagnosedAt) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: "rgba(13,13,18,0.75)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.eyebrow[lang]}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 420,
              borderRadius: 24,
              overflow: "hidden",
              border: `1px solid ${isDark ? "rgba(45,107,74,0.3)" : "rgba(45,79,57,0.2)"}`,
              background: isDark ? "rgba(20,20,32,0.97)" : "rgba(255,255,255,0.97)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              boxShadow: isDark
                ? "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(45,107,74,0.1)"
                : "0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(45,79,57,0.08)",
            }}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* Gold accent line */}
            <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

            {/* Close button */}
            <button
              onClick={onDismiss}
              aria-label="Close"
              style={{
                position: "absolute", top: 14, right: 14,
                background: "none", border: "none", cursor: "pointer",
                color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                padding: 6, borderRadius: "50%",
              }}
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div style={{ padding: "20px 24px 24px" }}>
              {/* Eyebrow */}
              <p style={{
                fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase",
                fontFamily: "var(--font-sans)", color: GOLD, marginBottom: 10,
              }}>
                {COPY.eyebrow[lang]}
              </p>

              {/* Title */}
              <h3 style={{
                fontSize: "1.45rem", fontWeight: 300, lineHeight: 1.35,
                fontFamily: "var(--font-display)",
                color: isDark ? "#e8e4df" : "#1a1a2e",
                marginBottom: 4,
              }}>
                {COPY.title[lang]}
              </h3>

              {/* Date line */}
              {lastDiagnosedAt && (
                <p style={{
                  fontSize: 12,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  fontFamily: "var(--font-sans)", fontWeight: 300,
                  marginBottom: 4,
                }}>
                  {COPY.lastTest(lastDiagnosedAt, lang)}
                </p>
              )}

              {/* Weeks elapsed */}
              {lastDiagnosedAt && weeksElapsed > 0 && (
                <p style={{
                  fontSize: 12,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  fontFamily: "var(--font-sans)", fontWeight: 300,
                  marginBottom: 4,
                }}>
                  {COPY.weeksSince(weeksElapsed, lang)}
                </p>
              )}

              {/* Recommended interval */}
              <p style={{
                fontSize: 12,
                color: GOLD,
                fontFamily: "var(--font-sans)", fontWeight: 400,
                marginBottom: 16, opacity: 0.85,
              }}>
                {COPY.recommended[lang]}
              </p>

              {/* Radar chart + tier */}
              {radarScores && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 16, borderRadius: 16,
                  padding: 16,
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: "1px solid rgba(45,107,74,0.15)", marginBottom: 20,
                }}>
                  <MiniRadar scores={radarScores} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase",
                      color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                      fontFamily: "var(--font-sans)", marginBottom: 4,
                    }}>
                      {lang === "ko" ? "피부 프로필" : lang === "de" ? "Hautprofil" : "Skin Profile"}
                    </p>
                    {skinTier && (
                      <p style={{
                        fontSize: 14, fontFamily: "var(--font-sans)",
                        color: isDark ? "#e8e4df" : "#1a1a1a", marginBottom: 6,
                      }}>
                        {skinTier}
                      </p>
                    )}
                    <p style={{
                      fontSize: 11,
                      color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                      fontFamily: "var(--font-sans)", lineHeight: 1.5, fontWeight: 300,
                    }}>
                      {lang === "ko" ? "변화를 추적하면 더 정밀한 맞춤 프로토콜이 가능합니다."
                        : lang === "de" ? "Verfolgen Sie Veränderungen für ein präziseres Protokoll."
                          : "Track changes to refine your personalised protocol."}
                    </p>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Primary: "Yes, Test Now" */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onConfirm}
                  style={{
                    width: "100%", padding: "14px 24px", borderRadius: 14, border: "none",
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                    color: isDark ? "#0d0d12" : "#fff",
                    fontSize: 13, fontFamily: "var(--font-sans)",
                    letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer",
                    boxShadow: `0 6px 24px ${isDark ? "rgba(45,107,74,0.3)" : "rgba(45,79,57,0.25)"}`,
                  }}
                >
                  {COPY.confirm[lang]}
                </motion.button>

                {/* Secondary: "Maybe Later" */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onDismiss}
                  style={{
                    width: "100%", padding: "12px 24px", borderRadius: 14,
                    border: `1px solid ${isDark ? "rgba(45,107,74,0.3)" : "rgba(45,79,57,0.2)"}`,
                    background: "transparent",
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)",
                    fontSize: 13, fontFamily: "var(--font-sans)",
                    letterSpacing: "0.06em", cursor: "pointer",
                  }}
                >
                  {COPY.dismiss[lang]}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
