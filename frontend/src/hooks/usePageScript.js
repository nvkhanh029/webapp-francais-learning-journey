import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguage, setLanguage, useLanguage } from "../i18n/language.js";
import { t } from "../i18n/index.js";

// Runs a page's companion script (<Page>.script.js) against the DOM that the page renders, turns
// in-page links into React Router navigation, and connects the page to the shared VI/EN language state
// (src/i18n/language.js). No data fetching here.
//
// Language: the page component calls this hook, so it re-renders whenever the language changes and its
// JSX text (written with t(key)) is already in the right language in the first render. The page script
// runs in a layout effect, i.e. after React has committed the DOM and before the browser paints, so
// text it writes never shows a flash of the other language. onLanguageChange(callback) callbacks run in
// a layout effect right after React has committed the new language, again before paint.

/* ---------- Page script lifecycle ---------- */
// Per mounted DOM element: { cleanup, languageListeners }. A re-mount of the same element
// (StrictMode) reuses the record instead of running the script twice.
const registry = new WeakMap();

// Records every listener the script registers so a real unmount can remove them again.
function runTracked(init, context) {
  const records = [];
  const original = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function addTracked(type, listener, options) {
    records.push([this, type, listener, options]);
    return original.call(this, type, listener, options);
  };
  try {
    init(context);
  } finally {
    EventTarget.prototype.addEventListener = original;
  }
  return () => records.forEach(([target, type, listener, options]) => target.removeEventListener(type, listener, options));
}

// Header switcher: both buttons reflect the current language.
function syncSwitcher(root, language) {
  root.querySelectorAll(".language-button[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  });
}

export default function usePageScript(init, { title } = {}) {
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const language = useLanguage();

  // The document language and title follow the shared language state. Layout effect: set before paint.
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    if (title) document.title = t(title);
  }, [language, title]);

  // The page script. It reads getLanguage() and registers onLanguageChange(callback) to re-render.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || !init) return undefined;
    // StrictMode mounts, unmounts and re-mounts in development: run the script once per DOM element and
    // only tear it down when the element has really left the document.
    let record = registry.get(el);
    if (!record) {
      record = { cleanup: null, languageListeners: new Set(), language: getLanguage() };
      registry.set(el, record);
      const context = {
        getLanguage,
        onLanguageChange: (callback) => record.languageListeners.add(callback),
      };
      record.cleanup = runTracked(init, context);
    }
    return () => {
      window.setTimeout(() => {
        if (!el.isConnected) {
          const stored = registry.get(el);
          if (stored) stored.cleanup();
          registry.delete(el);
        }
      }, 0);
    };
  }, [init]);

  // Switcher state and script re-render on language change. Declared after the script effect so it runs
  // after the script's start-up render, and only calls the script when the language really changed.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    syncSwitcher(el, language);
    const record = registry.get(el);
    if (record && record.language !== language) {
      record.language = language;
      record.languageListeners.forEach((callback) => callback(language));
    }
  }, [language]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    // Page scripts' own click handlers run first (bubbling). A handler that fully handles a click on an
    // element with data-route must call event.preventDefault(); this delegated handler then skips navigation.
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const languageButton = event.target.closest(".language-button[data-lang]");
      if (languageButton && el.contains(languageButton)) {
        setLanguage(languageButton.dataset.lang);
        return;
      }
      const target = event.target.closest("a[href], [data-route]");
      if (!target || !el.contains(target) || target.getAttribute("aria-disabled") === "true") return;
      // A submit button inside a form belongs to the form's own submit handling, never to navigation.
      if (target.matches('button[type="submit"], input[type="submit"]') && target.closest("form")) return;
      const href = target.getAttribute("href");
      if (href && href.startsWith("/")) {
        event.preventDefault();
        navigate(href);
      } else if (target.dataset.route) {
        event.preventDefault();
        navigate(target.dataset.route);
      } else if (href === "#") {
        event.preventDefault();
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [navigate]);

  return rootRef;
}
