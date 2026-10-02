import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import * as authApi from "../api/authApi.js";
import { ApiError, setUnauthorizedHandler } from "../api/apiClient.js";
import { AUTH_GUARD_ENABLED } from "../config.js";
import { setLanguage } from "../i18n/language.js";

// Application-wide authentication state (FD §5.5): the current learner and their support_language.
//
// status: "checking"        the initial GET /me has not finished (route guards wait, FD §4.3.4)
//         "authenticated"   currentUser is set
//         "unauthenticated" no session (GET /me answered 401)
//         "unavailable"     GET /me failed for another reason (network, 5xx): the session is unknown, so the guards
//                           show a "cannot reach the server" state with a retry instead of redirecting to Login
//
// With VITE_AUTH_GUARD off there is no session check, so the static UI works without a backend; the status is
// then "unauthenticated" and the guards let every route through.
export const AuthContext = createContext(null);

const UNAUTHENTICATED = { status: "unauthenticated", currentUser: null };
const CHECKING = { status: "checking", currentUser: null };
const UNAVAILABLE = { status: "unavailable", currentUser: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState(AUTH_GUARD_ENABLED ? CHECKING : UNAUTHENTICATED);

  const setAuthenticated = useCallback((currentUser) => setState({ status: "authenticated", currentUser }), []);
  const clearSession = useCallback(
    () => setState((previous) => (previous.status === "unauthenticated" ? previous : UNAUTHENTICATED)),
    [],
  );

  // GET /me: 401 means "no session"; any other failure leaves the session unknown.
  const checkSession = useCallback(
    (isCancelled) =>
      authApi
        .getCurrentUser()
        .then((user) => !isCancelled() && setAuthenticated(user))
        .catch((error) => {
          if (isCancelled()) return;
          if (error instanceof ApiError && error.isUnauthorized) clearSession();
          else setState(UNAVAILABLE);
        }),
    [setAuthenticated, clearSession],
  );

  // Initial session check.
  useEffect(() => {
    if (!AUTH_GUARD_ENABLED) return undefined;
    let cancelled = false;
    checkSession(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [checkSession]);

  // Retry button of the "cannot reach the server" state.
  const retryAuthCheck = useCallback(() => {
    setState(CHECKING);
    checkSession(() => false);
  }, [checkSession]);

  // An expired session on any later request signs the learner out of the UI (FD §6.7).
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // The server preference replaces the per-browser language once a learner is known (FD §5.5).
  const supportLanguage = state.currentUser?.support_language ?? null;
  useEffect(() => {
    if (supportLanguage) setLanguage(supportLanguage);
  }, [supportLanguage]);

  const login = useCallback(
    async (email, password) => {
      const user = await authApi.login(email, password);
      setAuthenticated(user);
      return user;
    },
    [setAuthenticated],
  );

  const register = useCallback(
    async (email, password) => {
      const user = await authApi.register(email, password);
      setAuthenticated(user);
      return user;
    },
    [setAuthenticated],
  );

  // Logout is idempotent on the server; the learner is signed out locally even if the request fails. The one
  // exception is 403 csrf_failed: the request was rejected, so the server session is still valid and stays
  // untouched. Resolves to true when the learner was signed out locally, false when the session was kept.
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (error instanceof ApiError && error.isCsrfFailed) return false;
      // Anything else: nothing to recover, the local session state is cleared below either way.
    }
    clearSession();
    return true;
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const user = await authApi.getCurrentUser();
    setAuthenticated(user);
    return user;
  }, [setAuthenticated]);

  // Authenticated: PATCH /me/preferences, then follow the confirmed value. Otherwise (public pages, or the static UI
  // without a session) only the per-browser language changes.
  const updateSupportLanguage = useCallback(
    async (language) => {
      if (state.status !== "authenticated") {
        setLanguage(language);
        return language;
      }
      const { support_language: saved } = await authApi.updateSupportLanguage(language);
      setState((previous) =>
        previous.currentUser
          ? { ...previous, currentUser: { ...previous.currentUser, support_language: saved } }
          : previous,
      );
      setLanguage(saved);
      return saved;
    },
    [state.status],
  );

  const value = useMemo(
    () => ({
      currentUser: state.currentUser,
      isAuthLoading: state.status === "checking",
      isAuthenticated: state.status === "authenticated",
      isAuthUnavailable: state.status === "unavailable",
      retryAuthCheck,
      login,
      register,
      logout,
      refreshUser,
      updateSupportLanguage,
      updateLanguage: updateSupportLanguage,
    }),
    [state, retryAuthCheck, login, register, logout, refreshUser, updateSupportLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
