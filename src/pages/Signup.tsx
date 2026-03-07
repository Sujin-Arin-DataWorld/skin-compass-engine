import { Navigate } from "react-router-dom";

// All signup functionality now lives on the unified auth page.
export default function Signup() {
    return <Navigate to="/login?tab=signup" replace />;
}
