import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AUTH_GUARD_ENABLED } from "../../config.js";
import useAuth from "../../hooks/useAuth.js";
import GuardLoading from "./GuardLoading.jsx";

// Protected routes need an authenticated learner (FD §4.3.1). This is a navigation decision only; Flask enforces
// authentication on every protected endpoint. Waits for the first session check so there is no redirect flicker.
export default function RequireAuth() {
  const { isAuthLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!AUTH_GUARD_ENABLED) return <Outlet />;
  if (isAuthLoading) return <GuardLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
