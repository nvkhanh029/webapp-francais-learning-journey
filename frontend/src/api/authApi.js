import apiClient from "./apiClient.js";

// Authentication and current user (API §6, §7). Each call returns the learner object { email, support_language }
// except logout and updateSupportLanguage.

export async function register(email, password) {
  const data = await apiClient.post("/auth/register", { email, password });
  return data.user;
}

export async function login(email, password) {
  const data = await apiClient.post("/auth/login", { email, password });
  return data.user;
}

// Idempotent: succeeds even without an active session (API §6.3).
export function logout() {
  return apiClient.post("/auth/logout");
}

export async function getCurrentUser() {
  const data = await apiClient.get("/me");
  return data.user;
}

// Resolves to { support_language }.
export function updateSupportLanguage(supportLanguage) {
  return apiClient.patch("/me/preferences", { support_language: supportLanguage });
}
