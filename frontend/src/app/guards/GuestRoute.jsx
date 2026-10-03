import { Navigate, Outlet } from "react-router-dom";

import { AUTH_GUARD_ENABLED } from "../../config.js";
import useAuth from "../../hooks/useAuth.js";
import AuthUnavailable from "./AuthUnavailable.jsx";
import GuardLoading from "./GuardLoading.jsx";

// Login and Register are for visitors without a session; an authenticated learner goes to the Dashboard
// (FD §4.3.3). RequireLanguage then sends a learner without a saved language to Language Setup.
export default function GuestRoute() {
  const { isAuthLoading, isAuthenticated, isAuthError, retryAuth } = useAuth();

  if (!AUTH_GUARD_ENABLED) return <Outlet />;
  if (isAuthLoading) return <GuardLoading />;
  // The session could not be determined: block protected content and offer a retry rather than
  // redirecting to Login, which would wrongly imply the learner is signed out (FD §6.7).
  if (isAuthError) return <AuthUnavailable isRetrying={isAuthLoading} onRetry={retryAuth} />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
