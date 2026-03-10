import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRole?: "admin" | "user";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
    const { isLoggedIn, userProfile, setSession } = useAuthStore();
    const location = useLocation();

    // Only run the async session check when Zustand thinks the user is NOT logged in.
    // If isLoggedIn is already true (persisted from localStorage), skip the check.
    const [checking, setChecking] = useState(!isLoggedIn);

    useEffect(() => {
        if (isLoggedIn) {
            setChecking(false);
            return;
        }
        // Zustand says not logged in — verify with Supabase directly.
        // This covers the case where the Supabase session is valid but the
        // persist store hasn't hydrated yet (e.g. cross-tab sign-in, hard reload
        // with valid cookie but stale localStorage).
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSession(session.user);
            }
            setChecking(false);
        });
    }, [isLoggedIn, setSession]);

    // Show a minimal dark-screen loader while the async check runs.
    // Keeps the UX consistent with the rest of the dark-themed app.
    if (checking) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(160deg, #0d0d12 0%, #141420 40%, #1a1528 100%)",
            }} />
        );
    }

    if (!isLoggedIn) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (allowedRole && userProfile?.role !== allowedRole) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
