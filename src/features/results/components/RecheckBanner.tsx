/**
 * RecheckBanner.tsx
 *
 * Phase 6 Step 3 — In-app 4-week re-check reminder banner.
 *
 * States:
 *  none     — < 21 days since last diagnosis → renders nothing
 *  upcoming — 21–27 days → subtle gold banner
 *  due      — 28–59 days → prominent banner with CTA
 *  overdue  — ≥ 60 days  → amber urgent banner
 *
 * Dismiss: "Remind me later" stores a 7-day expiry in localStorage
 * under the key `ssl_recheck_dismissed_until`.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";

// ─── Types ────────────────────────────────────────────────────────────────────

type BannerState = "none" | "upcoming" | "due" | "overdue";
type Lang = "ko" | "en" | "de";

// ─── Constants ────────────────────────────────────────────────────────────────

const DISMISS_KEY = "ssl_recheck_dismissed_until";

const COPY = {
  upcoming: {
    en: "Your 4-week re-check is coming up!",
    de: "Ihr 4-Wochen Re-Check steht bevor!",
    ko: "4주 재진단이 곧 다가와요!",
  },
  due: {
    en: "Time for a re-check! See how your skin has changed.",
    de: "Zeit für einen Re-Check! Sehen Sie, wie sich Ihre Haut verändert hat.",
    ko: "재진단 시간이에요! 피부 변화를 확인해보세요.",
  },
  overdue: (weeks: number): Record<Lang, string> => ({
    en: `It's been ${weeks} weeks since your last check. Time to re-evaluate your skin.`,
    de: `Es sind ${weeks} Wochen seit Ihrem letzten Check vergangen. Zeit für eine Neubewertung.`,
    ko: `마지막 진단 후 ${weeks}주가 지났어요. 피부 상태를 다시 확인해보세요.`,
  }),
  cta: {
    en: "Start re-check →",
    de: "Re-Check starten →",
    ko: "재진단 시작 →",
  },
  dismiss: {
    en: "Remind me later",
    de: "Später erinnern",
    ko: "나중에 알려줘",
  },
} as const;

// ─── Dismiss helpers ──────────────────────────────────────────────────────────

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() < new Date(raw).getTime();
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(DISMISS_KEY, expiry);
  } catch { /* noop */ }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecheckBanner() {
  const { isLoggedIn } = useAuthStore();
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = resolvedTheme === "dark";
  const lang = language as Lang;

  const [bannerState, setBannerState] = useState<BannerState>("none");
  const [weeksSince, setWeeksSince] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || isDismissed()) return;

    let cancelled = false;

    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user || cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("diagnosis_history")
        .select("diagnosed_at")
        .eq("user_id", user.id)
        .order("diagnosed_at", { ascending: false })
        .limit(1)
        .single();

      if (cancelled || !data) return;

      const daysSince = (Date.now() - new Date(data.diagnosed_at).getTime()) / 86_400_000;
      const weeks = Math.floor(daysSince / 7);
      setWeeksSince(weeks);

      if (daysSince < 21) {
        setBannerState("none");
      } else if (daysSince < 28) {
        setBannerState("upcoming");
        setVisible(true);
      } else if (daysSince < 60) {
        setBannerState("due");
        setVisible(true);
      } else {
        setBannerState("overdue");
        setVisible(true);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const handleDismiss = () => {
    persistDismiss();
    setVisible(false);
  };

  if (!isLoggedIn || bannerState === "none") return null;

  const getMessage = (): string => {
    if (bannerState === "overdue") return COPY.overdue(weeksSince)[lang];
    return COPY[bannerState][lang];
  };

  const isUrgent    = bannerState === "overdue";
  const borderColor = isUrgent ? "hsl(var(--warning))" : "hsl(var(--accent-gold))";
  const textColor   = isUrgent ? "hsl(var(--warning))" : "hsl(var(--accent-gold))";
  const bgColor     = isDark
    ? (isUrgent ? "rgba(245,158,11,0.07)" : "rgba(201,169,110,0.07)")
    : (isUrgent ? "rgba(245,158,11,0.05)" : "rgba(201,169,110,0.06)");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            borderBottom: `1px solid ${borderColor}40`,
            borderLeft: `3px solid ${borderColor}`,
            background: bgColor,
            padding: "10px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            fontFamily: "'DM Sans', sans-serif",
            borderRadius: "0 8px 8px 0",
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: 15, flexShrink: 0 }}>
            {isUrgent ? "⏰" : "✨"}
          </span>

          {/* Message */}
          <p style={{
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: isDark ? "rgba(245,240,232,0.82)" : "rgba(26,26,46,0.75)",
            minWidth: 160,
            margin: 0,
          }}>
            {getMessage()}
          </p>

          {/* CTA — only for due / overdue */}
          {(bannerState === "due" || bannerState === "overdue") && (
            <button
              onClick={() => navigate("/diagnosis")}
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${borderColor}60`,
                color: textColor,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {COPY.cta[lang]}
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            style={{
              flexShrink: 0,
              fontSize: 10,
              color: "hsl(var(--muted-foreground))",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              opacity: 0.7,
            }}
          >
            {COPY.dismiss[lang]}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
