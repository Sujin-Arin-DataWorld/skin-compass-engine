import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { usePerformanceMode } from '@/hooks/usePerformanceMode';
import { ThemeProvider, useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";
import { useSkinProfileStore } from "@/store/useSkinProfileStore";
import { useCartStore } from "@/store/cartStore";
import { brand } from "@/lib/designTokens";
import GdprConsentModal from "./components/GdprConsentModal";
import ErrorBoundary from "@/components/ErrorBoundary";

// ── Critical-path (static imports) ──────────────────────────────────────────
import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { BottomNav } from "./components/BottomNav";
import MobileDrawer from "./components/MobileDrawer";

// ── Heavy routes (lazy-loaded) ──────────────────────────────────────────────
const Diagnosis       = lazy(() => import("./pages/Diagnosis"));
const Results         = lazy(() => import("./pages/Results"));
const SkinAnalysisPage = lazy(() => import("./pages/SkinAnalysisPage"));
const Profile         = lazy(() => import("./pages/Profile"));
const Account         = lazy(() => import("./pages/Account"));
const AdminDashboard  = lazy(() => import("./pages/AdminDashboard"));
const Cart            = lazy(() => import("./pages/Cart"));
const Checkout        = lazy(() => import("./pages/Checkout"));
const Wishlist        = lazy(() => import("./pages/Wishlist"));
const Signup          = lazy(() => import("./pages/Signup"));
const About           = lazy(() => import("./pages/About"));
const Impressum       = lazy(() => import("./pages/Impressum"));
const Datenschutz     = lazy(() => import("./pages/Datenschutz"));
const Agb             = lazy(() => import("./pages/Agb"));
const FormulaDetail   = lazy(() => import("./pages/FormulaDetail"));

// ── Route-level loading spinner ─────────────────────────────────────────────
function RouteSpinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ssl-bg, #0d0d12)",
      }}
    >
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1.5px solid rgba(201,169,110,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1.5px solid transparent", borderTopColor: "#c9a96e",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 8, borderRadius: "50%",
            border: "1px solid transparent", borderTopColor: "#b76e79",
            animation: "spin 1.2s linear infinite reverse",
          }}
        />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const queryClient = new QueryClient();

// Extracted inside BrowserRouter so useLocation is available
function AppInner() {
  const setSession = useAuthStore((s) => s.setSession);
  const { logout } = useAuthStore();
  const location = useLocation();
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();

  // Performance mode — injects .low-performance body class for CSS-level GPU drain suppression
  // Uses "user" on MotionConfig (not "always") to avoid breaking onAnimationComplete callbacks
  const { reducedMotion } = usePerformanceMode();
  useEffect(() => {
    document.body.classList.toggle('low-performance', reducedMotion);
  }, [reducedMotion]);

  // Sync HTML lang attribute for i18n CSS rules ([lang="ko"], etc.)
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // ── Sync design-token CSS custom properties onto :root ───────────────────
  useEffect(() => {
    const isDark = resolvedTheme === "dark";
    const t = isDark ? brand.dark : brand.light;
    const root = document.documentElement.style;

    root.setProperty("--ssl-bg",             t.bg);
    root.setProperty("--ssl-bg-card",        t.bgCard);
    root.setProperty("--ssl-bg-surface",     t.bgSurface);
    root.setProperty("--ssl-bg-elevated",    t.bgElevated);
    root.setProperty("--ssl-accent",         t.accent);
    root.setProperty("--ssl-accent-deep",    t.accentDeep);
    root.setProperty("--ssl-accent-muted",   t.accentMuted);
    root.setProperty("--ssl-accent-bg",      t.accentBg);
    root.setProperty("--ssl-accent-border",  t.accentBorder);
    root.setProperty("--ssl-secondary",      t.secondary);
    root.setProperty("--ssl-secondary-muted",t.secondaryMuted);
    root.setProperty("--ssl-secondary-bg",   t.secondaryBg);
    root.setProperty("--ssl-text",           t.text);
    root.setProperty("--ssl-text-secondary", t.textSecondary);
    root.setProperty("--ssl-text-tertiary",  t.textTertiary);
    root.setProperty("--ssl-border",         t.border);
    root.setProperty("--ssl-border-hover",   t.borderHover);
  }, [resolvedTheme]);

  // ── GDPR gate state ──────────────────────────────────────────────────────
  const [showGdpr, setShowGdpr] = useState(false);
  const [gdprUserId, setGdprUserId] = useState<string | null>(null);
  const [gdprLoading, setGdprLoading] = useState(false);

  useEffect(() => {
    // Sync persisted state with the actual Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
      // Also fetch skin profile on mount if already signed in (Step 4 guide requirement)
      if (session?.user) {
        useSkinProfileStore.getState().fetchActiveProfile(session.user.id);
      }
    });

    // Keep Zustand in sync with every auth event (sign-in, sign-out, token refresh)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = (supabase as any).auth.onAuthStateChange(
      async (event: string, session: { user?: { id: string; app_metadata?: { provider?: string } } } | null) => {
        setSession((session?.user ?? null) as Parameters<typeof setSession>[0]);

        // ── Skin profile persistence: fetch on sign-in, clear on sign-out ──
        const skinProfileStore = useSkinProfileStore.getState();
        if (event === "SIGNED_IN" && session?.user) {
          skinProfileStore.fetchActiveProfile(session.user.id);

          // ── BUG 5 fix: persist pending analysis saved before login ──
          // Uses localStorage (not sessionStorage) to survive cross-tab OAuth
          try {
            const pendingRaw = localStorage.getItem('ssl_pending_analysis');
            if (pendingRaw) {
              const pending = JSON.parse(pendingRaw);
              // Only process if saved within last 30 minutes
              if (pending?.scores && Date.now() - (pending.timestamp || 0) < 30 * 60 * 1000) {
                console.log('[App] Found pending analysis, saving to DB...');
                const s = pending.scores;
                // Derive skin type
                const skinType = s.sen >= 65 ? 'sensitive' : s.seb >= 65 && s.hyd >= 50 ? 'oily' : s.hyd <= 35 && s.seb <= 35 ? 'dry' : s.seb >= 50 && s.hyd <= 45 ? 'combination' : 'normal';
                // Derive concerns
                const concerns: string[] = [];
                if (s.acne >= 50) concerns.push('acne');
                if (s.hyd <= 40) concerns.push('dehydration');
                if (s.pigment >= 50) concerns.push('pigmentation');
                if (s.sen >= 55) concerns.push('sensitivity');
                if (s.aging >= 50) concerns.push('aging');

                await skinProfileStore.saveAnalysisResult({
                  userId: session.user.id,
                  scores: s,
                  skinType: skinType as 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal',
                  primaryConcerns: concerns as ('acne' | 'dehydration' | 'pigmentation' | 'sensitivity' | 'aging')[],
                  analysisMethod: 'camera',
                  confidenceScore: pending.hasLifestyle ? 0.92 : 0.75,
                });
                console.log('[App] Pending analysis saved successfully');
              }
              // NOTE: Do NOT remove ssl_pending_analysis here.
              // SkinAnalysisPage needs it to restore the results UI after redirect.
              // SkinAnalysisPage will remove it after restoring the Zustand store.
            }
          } catch (e) {
            console.warn('[App] Pending analysis save failed:', e);
            // Don't remove — SkinAnalysisPage may still need it for UI restoration
          }
        }
        if (event === "SIGNED_OUT") {
          skinProfileStore.clearProfile();
          // Also clear cart Zustand state on sign-out (covers token expiry, manual sign-out, etc.)
          try { useCartStore.getState().clear(); } catch { /* safe */ }
        }

        // ── GDPR gate: trigger for all non-email social sign-ins (Google, Apple, etc.)
        if (
          event === "SIGNED_IN" &&
          session?.user?.app_metadata?.provider !== "email"
        ) {
          const userId = session.user.id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("gdpr_consent")
            .eq("id", userId)
            .single();

          // Show modal if consent has not been recorded yet
          if (!profile?.gdpr_consent) {
            setGdprUserId(userId);
            setShowGdpr(true);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession]);

  const handleGdprAccept = async () => {
    if (!gdprUserId) return;
    setGdprLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("profiles")
        .update({
          gdpr_consent: true,
          gdpr_consent_at: new Date().toISOString(),
        })
        .eq("id", gdprUserId);
      setShowGdpr(false);
      setGdprUserId(null);
    } catch (err) {
      console.error("[App] GDPR accept save failed:", err);
      // Non-fatal: close modal anyway so the user isn't stuck
      setShowGdpr(false);
      setGdprUserId(null);
    } finally {
      setGdprLoading(false);
    }
  };

  const handleGdprDecline = async () => {
    setGdprLoading(true);
    try {
      if (gdprUserId) {
        // 1. Mark the profile so the rejection is auditable even if step 2 fails
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("profiles")
          .update({
            gdpr_rejected: true,
            gdpr_rejected_at: new Date().toISOString(),
          })
          .eq("id", gdprUserId);

        // 2. Permanently delete the auth user via a SECURITY DEFINER RPC.
        //    SQL to create it (run once in Supabase Dashboard → SQL Editor):
        //
        //    CREATE OR REPLACE FUNCTION public.delete_own_user()
        //    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
        //    BEGIN
        //      DELETE FROM auth.users WHERE id = auth.uid();
        //    END;
        //    $$;
        //    GRANT EXECUTE ON FUNCTION public.delete_own_user() TO authenticated;
        //
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await (supabase as any).rpc("delete_own_user");

        if (deleteError) {
          // RPC not yet created or failed — user stays rejected in profiles.
          // They are effectively locked out since gdpr_rejected = true.
          // Clean up happens when an admin runs a deferred deletion job.
          console.warn("delete_own_user RPC failed:", deleteError.message);
        }
      }
      // Always sign out regardless of deletion outcome
      await logout();
    } catch (err) {
      console.error("[App] GDPR decline failed:", err);
      // Force logout even if DB operations failed
      try { await logout(); } catch { window.location.href = "/"; }
    } finally {
      setGdprLoading(false);
      setShowGdpr(false);
      setGdprUserId(null);
    }
  };

  // /account has its own sidebar nav — hide the global BottomNav
  const hideBottomNav = location.pathname.startsWith("/account");

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<RouteSpinner />}>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* ProtectedRoute temporarily removed for local dev */}
        <Route path="/diagnosis" element={<Diagnosis />} />
        <Route path="/results" element={<Results />} />
        {/* /lab deprecated — redirect to unified funnel Slide 2 (Lab & Special Care) */}
        <Route path="/lab" element={<Navigate to="/results?slide=2" replace />} />
        <Route path="/formula/:id" element={<FormulaDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* OAuth callback — must be public (not behind ProtectedRoute) */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/profile"
          element={
            <ErrorBoundary>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </ErrorBoundary>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* AI skin camera analysis — public route (camera requires HTTPS) */}
        <Route path="/skin-analysis" element={<SkinAnalysisPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb" element={<Agb />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>

      {!hideBottomNav && <BottomNav />}
      <MobileDrawer />

      {/* GDPR consent modal — blocks UI until accepted or declined */}
      <AnimatePresence>
        {showGdpr && (
          <GdprConsentModal
            onAccept={handleGdprAccept}
            onDecline={handleGdprDecline}
            loading={gdprLoading}
          />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
