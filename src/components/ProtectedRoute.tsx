import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRole?: "admin" | "user";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
    const { isLoggedIn, userProfile } = useAuthStore();
    const location = useLocation();

    if (!isLoggedIn) {
        // Capture the location they were trying to go to
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (allowedRole && userProfile?.role !== allowedRole) {
        // If they are logged in but don't have the right role, bounce them to home or profile
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
