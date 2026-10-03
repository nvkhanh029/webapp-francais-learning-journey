import { Navigate, Outlet } from "react-router-dom";

import { AUTH_GUARD_ENABLED } from "../../config.js";
import useAuth from "../../hooks/useAuth.js";
import AuthUnavailable from "./AuthUnavailable.jsx";
import GuardLoading from "./GuardLoading.jsx";

// Login and Register are for visitors without a session; an authenticated learner goes to the Dashboard
// (FD §4.3.3). RequireLanguage then sends a learner without a saved language to Language Setup.
export default function GuestRoute() {
  const { isAuthLoading, isAuthUnavailable, retryAuthCheck, isAuthenticated } = useAuth();

  if (!AUTH_GUARD_ENABLED) return <Outlet />;
  if (isAuthLoading) return <GuardLoading />;
  // The session check could not be completed (not a 401): do not guess, offer a retry.
  if (isAuthUnavailable) return <AuthUnavailable onRetry={retryAuthCheck} />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
