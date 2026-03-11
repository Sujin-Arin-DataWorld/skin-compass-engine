// src/pages/AuthCallback.tsx
// Dedicated OAuth callback handler — receives the Google redirect, waits for
// Supabase to exchange the PKCE code for a session, then navigates to the
// intended destination.
//
// WHY THIS PAGE EXISTS:
//   loginWithGoogle() redirects to <origin>/auth/callback?redirect=<path>.
//   This page is NOT behind ProtectedRoute, so it can safely process the
//   Supabase session before navigating the user to a protected destination.
//   Without this, Google OAuth returns to a protected page that immediately
//   bounces the user back to /login (race condition).

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const GOLD    = "#c9a96e";
const ROSE    = "#b76e79";
const PAGE_BG = "linear-gradient(160deg, #0d0d12 0%, #141420 40%, #1a1528 100%)";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let resolved = false;

    const go = () => {
      if (resolved) return;
      resolved = true;
      const dest = searchParams.get("redirect");
      // Guard against open-redirect: only allow relative paths
      const to = dest && dest.startsWith("/") ? decodeURIComponent(dest) : "/account";
      navigate(to, { replace: true });
    };

    // 1. Listen for Supabase auth state — fires when PKCE code exchange completes.
    //    App.tsx also has an onAuthStateChange listener that calls setSession()
    //    (updates Zustand isLoggedIn) BEFORE this handler fires because App.tsx
    //    registers its listener first on mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        go();
      } else if (event === "SIGNED_OUT" && !resolved) {
        navigate("/login?error=auth_cancelled", { replace: true });
      }
    });

    // 2. Fallback: session might already be set if the PKCE exchange completed
    //    synchronously before this effect ran (uncommon but possible).
    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (err) {
        setError(err.message);
        return;
      }
      if (session) go();
    });

    // 3. Timeout safety net — if nothing resolves in 15 s, surface an error.
    const timer = setTimeout(() => {
      if (!resolved) setError("인증 시간이 초과되었습니다. 다시 시도해 주세요.");
    }, 15_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", background: PAGE_BG,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <p style={{ color: ROSE, fontSize: 14, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
          {error}
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "none", border: `1px solid ${GOLD}`,
            color: GOLD, borderRadius: 24, padding: "10px 24px",
            cursor: "pointer", fontSize: 13, letterSpacing: "0.08em",
          }}>
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: PAGE_BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400&display=swap');
      `}</style>

      {/* Dual-ring spinner — matches Phase 03 scanning animation style */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1.5px solid rgba(201,169,110,0.12)`,
        }} />
        <motion.div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1.5px solid transparent", borderTopColor: GOLD,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          style={{
            position: "absolute", inset: 10, borderRadius: "50%",
            border: "1px solid transparent", borderTopColor: ROSE,
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "'RIDIBatang', 'Cormorant Garamond', serif",
          fontSize: 20, fontWeight: 300, color: GOLD,
          letterSpacing: "0.06em", marginBottom: 8,
        }}>
          로그인 처리 중…
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em",
        }}>
          잠시만 기다려 주세요
        </p>
      </div>
    </div>
  );
}
