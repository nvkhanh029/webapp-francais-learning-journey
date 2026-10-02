import { Navigate, Outlet } from "react-router-dom";

import { AUTH_GUARD_ENABLED } from "../../config.js";
import useAuth from "../../hooks/useAuth.js";

// An authenticated learner who has not saved a support language goes to first-time Language Setup (FD §4.3.2).
// Language Setup itself is outside this guard so it does not redirect to itself. Used inside RequireAuth.
export default function RequireLanguage() {
  const { currentUser } = useAuth();

  if (!AUTH_GUARD_ENABLED) return <Outlet />;
  if (currentUser && currentUser.support_language === null) return <Navigate to="/setup/language" replace />;
  return <Outlet />;
}
