import { useSyncExternalStore } from "react";

// Shared support-language state ("vi" | "en"). It is read synchronously the first time anything asks for
// it (before the first render) and document.documentElement.lang is set at that same point, so a page
// never paints in the wrong language.
export const LANGUAGES = ["vi", "en"];
export const DEFAULT_LANGUAGE = "vi";
const STORAGE_KEY = "supportLanguage";

let currentLanguage = null;
const subscribers = new Set();

function readStoredLanguage() {
  // Per-browser convenience for public pages (FD §5.5): only the language code is stored. For a signed-in learner
  // AuthContext applies currentUser.support_language on top of it, so this value never overrides the server.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function getLanguage() {
  if (currentLanguage === null) {
    currentLanguage = readStoredLanguage();
    document.documentElement.lang = currentLanguage;
  }
  return currentLanguage;
}

export function setLanguage(next) {
  if (!LANGUAGES.includes(next) || next === getLanguage()) return;
  currentLanguage = next;
  document.documentElement.lang = next;
  try {
    // See readStoredLanguage(). Saving the preference to the API is AuthContext.updateSupportLanguage().
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be blocked (private mode); the choice still applies for this session.
  }
  subscribers.forEach((listener) => listener(next));
}

export function subscribeLanguage(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

// Re-renders the calling component when the language changes.
export function useLanguage() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => DEFAULT_LANGUAGE);
}

// Evaluate once at import so the document language is correct before React renders anything.
getLanguage();
