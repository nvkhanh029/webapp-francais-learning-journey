import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AUTH_GUARD_ENABLED } from "../../config.js";
import useAuth from "../../hooks/useAuth.js";
import AuthUnavailable from "./AuthUnavailable.jsx";
import GuardLoading from "./GuardLoading.jsx";

// Protected routes need an authenticated learner (FD §4.3.1). This is a navigation decision only; Flask enforces
// authentication on every protected endpoint. Waits for the first session check so there is no redirect flicker.
export default function RequireAuth() {
  const { isAuthLoading, isAuthenticated, isAuthError, retryAuth } = useAuth();
  const location = useLocation();

  if (!AUTH_GUARD_ENABLED) return <Outlet />;
  if (isAuthLoading) return <GuardLoading />;
  // The session could not be determined: block protected content and offer a retry rather than
  // redirecting to Login, which would wrongly imply the learner is signed out (FD §6.7).
  if (isAuthError) return <AuthUnavailable isRetrying={isAuthLoading} onRetry={retryAuth} />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
