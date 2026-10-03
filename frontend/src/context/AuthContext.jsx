import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import * as authApi from "../api/authApi.js";
import { setUnauthorizedHandler } from "../api/apiClient.js";
import { AUTH_GUARD_ENABLED } from "../config.js";
import { setLanguage } from "../i18n/language.js";

// Application-wide authentication state (FD §5.5): the current learner and their support_language.
//
// status: "checking"        the initial GET /me has not finished (route guards wait, FD §4.3.4)
//         "authenticated"   currentUser is set
//         "unauthenticated" GET /me answered 401 not_authenticated — the learner is signed out
//         "error"           GET /me failed for any other reason, so the session is UNKNOWN
//
// Only a 401 proves the learner is signed out. A network failure, a 5xx, a 403 or a 429 must not be
// treated as "signed out": that would send a learner with a valid session to Login, or show a login
// form while the backend is down. In that case the guards block protected content and offer a retry
// (FD §6.7).
//
// With VITE_AUTH_GUARD off there is no session check, so the static UI works without a backend; the
// status is then "unauthenticated" and the guards let every route through.
export const AuthContext = createContext(null);

const UNAUTHENTICATED = { status: "unauthenticated", currentUser: null, error: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState(
    AUTH_GUARD_ENABLED ? { status: "checking", currentUser: null, error: null } : UNAUTHENTICATED,
  );
  // Bumped by retryAuth() to repeat the initial session check.
  const [attempt, setAttempt] = useState(0);

  const setAuthenticated = useCallback(
    (currentUser) => setState({ status: "authenticated", currentUser, error: null }),
    [],
  );
  const clearSession = useCallback(
    () => setState((previous) => (previous.status === "unauthenticated" ? previous : UNAUTHENTICATED)),
    [],
  );
  const setUnknown = useCallback((error) => setState({ status: "error", currentUser: null, error }), []);

  // Initial session check.
  useEffect(() => {
    if (!AUTH_GUARD_ENABLED) return undefined;
    let cancelled = false;
    authApi
      .getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setAuthenticated(user);
      })
      .catch((error) => {
        if (cancelled) return;
        // Only a real 401 means signed out; anything else leaves the session unknown (FD §6.7).
        if (error?.isUnauthorized) clearSession();
        else setUnknown(error);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, setAuthenticated, clearSession, setUnknown]);

  // An expired session on any later request signs the learner out of the UI (FD §6.7). A 403
  // csrf_failed deliberately does not reach here: the session is still valid, so it must not clear it.
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

  // Logout is idempotent on the server; the learner is signed out locally even if the request fails.
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Nothing to recover: the local session state is cleared below either way.
    }
    clearSession();
  }, [clearSession]);

  // Re-reads the current user. Throws on failure so a caller can show its own message; the session
  // state is not changed here.
  const refreshUser = useCallback(async () => {
    const user = await authApi.getCurrentUser();
    setAuthenticated(user);
    return user;
  }, [setAuthenticated]);

  // Retries the initial session check after a non-401 failure (FD §6.7).
  const retryAuth = useCallback(() => {
    setState({ status: "checking", currentUser: null, error: null });
    setAttempt((current) => current + 1);
  }, []);

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
      // The session state could not be determined; protected routes must stay blocked (FD §6.7).
      isAuthError: state.status === "error",
      authError: state.error,
      retryAuth,
      login,
      register,
      logout,
      refreshUser,
      updateSupportLanguage,
      updateLanguage: updateSupportLanguage,
    }),
    [state, retryAuth, login, register, logout, refreshUser, updateSupportLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
