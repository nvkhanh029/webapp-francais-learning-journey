// Build-time configuration read from Vite env variables.

// VITE_AUTH_GUARD=on turns the route guards (RequireAuth, RequireLanguage, GuestRoute) and the session check on.
// Anything else (the default) leaves every route open, so the static UI stays viewable without a backend.
export const AUTH_GUARD_ENABLED = import.meta.env.VITE_AUTH_GUARD === "on";
