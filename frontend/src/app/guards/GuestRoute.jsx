import { Navigate, Outlet } from "react-router-dom";

import { AUTH_GUARD_ENABLED } from "../../config.js";
import useAuth from "../../hooks/useAuth.js";
import GuardLoading from "./GuardLoading.jsx";

// Login and Register are for visitors without a session; an authenticated learner goes to the Dashboard
// (FD §4.3.3). RequireLanguage then sends a learner without a saved language to Language Setup.
export default function GuestRoute() {
  const { isAuthLoading, isAuthenticated } = useAuth();

  if (!AUTH_GUARD_ENABLED) return <Outlet />;
  if (isAuthLoading) return <GuardLoading />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
