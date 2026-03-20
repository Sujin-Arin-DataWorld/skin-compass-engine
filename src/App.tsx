import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider, useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore } from "@/store/i18nStore";
import { brand } from "@/lib/designTokens";
import GdprConsentModal from "./components/GdprConsentModal";
import Index from "./pages/Index";
import Diagnosis from "./pages/Diagnosis";
import Results from "./pages/Results";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import FormulaDetail from "./pages/FormulaDetail";
import Cart from "./pages/Cart";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
// LabSelectionPage deprecated — merged into unified funnel at /results?slide=2
// import LabSelectionPage from "./pages/LabSelectionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { BottomNav } from "./components/BottomNav";

const queryClient = new QueryClient();

// Extracted inside BrowserRouter so useLocation is available
function AppInner() {
  const setSession = useAuthStore((s) => s.setSession);
  const { logout } = useAuthStore();
  const location = useLocation();
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();

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
    });

    // Keep Zustand in sync with every auth event (sign-in, sign-out, token refresh)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = (supabase as any).auth.onAuthStateChange(
      async (event: string, session: { user?: { id: string; app_metadata?: { provider?: string } } } | null) => {
        setSession((session?.user ?? null) as Parameters<typeof setSession>[0]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("profiles")
      .update({
        gdpr_consent: true,
        gdpr_consent_at: new Date().toISOString(),
      })
      .eq("id", gdprUserId);
    setGdprLoading(false);
    setShowGdpr(false);
    setGdprUserId(null);
  };

  const handleGdprDecline = async () => {
    setGdprLoading(true);

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
    setGdprLoading(false);
    setShowGdpr(false);
    setGdprUserId(null);
  };

  // /account has its own sidebar nav — hide the global BottomNav
  const hideBottomNav = location.pathname.startsWith("/account");

  return (
    <>
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
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
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
        <Route path="/about" element={<About />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideBottomNav && <BottomNav />}

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
    </>
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
