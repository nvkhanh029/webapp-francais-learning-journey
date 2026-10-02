import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Runs a page's companion script (<Page>.script.js) against the DOM that the page renders, turns
// in-page links into React Router navigation, and owns the shared VI/EN language state for the
// raw-UI prototype pages. No data fetching here.

/* ---------- Shared language state ("vi" | "en") ---------- */
const LANGUAGES = ["vi", "en"];
const DEFAULT_LANGUAGE = "vi";
const STORAGE_KEY = "supportLanguage";

let currentLanguage = null;
const languageSubscribers = new Set();

function readStoredLanguage() {
  // PROTOTYPE STORAGE: the final source of the support language (learner profile / API,
  // AuthContext.currentUser.support_language, FD §5.5) is not decided yet. Replace this read
  // and the write in setLanguage() when it is.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function getLanguage() {
  if (currentLanguage === null) currentLanguage = readStoredLanguage();
  return currentLanguage;
}

export function setLanguage(next) {
  if (!LANGUAGES.includes(next) || next === getLanguage()) return;
  currentLanguage = next;
  try {
    // PROTOTYPE STORAGE: see readStoredLanguage(). Replace with the preference update call later.
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be blocked (private mode); the choice still applies for this session.
  }
  languageSubscribers.forEach((listener) => listener(next));
}

/* ---------- Fixed copy with an English counterpart (VI -> EN) ----------
   Only strings whose English text is already defined by the project: FD §4.4 / §9.4 terminology and
   the English copy already present in the page scripts. Anything else stays Vietnamese until its
   English text is supplied. Move to i18n/en.js when the i18n dictionaries are implemented. */
const STATIC_EN = {
  "Bảng điều khiển": "Dashboard",
  "Từ vựng": "Vocabulary",
  "Ngữ pháp": "Grammar",
  "Chia động từ": "Conjugation",
  "Đăng xuất": "Log out",
  "Ngôn ngữ hỗ trợ": "Support language",
  "Điều hướng chính": "Main navigation",
  "Menu điều hướng": "Navigation menu",
  "Đóng menu điều hướng": "Close navigation menu",
  "Thử lại": "Try again",
  "Xem lại sau": "Review Later",
  "Danh sách xem lại": "Review list",
  "Mở danh sách xem lại": "Open review list",
  "Đã học": "Learned",
  "Đã học:": "Learned:",
  "Xem lại sau:": "Review Later:",
  "Đánh dấu đã học": "Mark as learned",
  "Bắt đầu luyện tập": "Start practice",
  "Luyện tập": "Practice",
  "Luyện tập tổng hợp": "Mixed Practice",
  "Tổng hợp": "Mixed",
  "Luyện tập gần đây": "Recent practice",
  "Lịch luyện tập": "Practice calendar",
  "Chuỗi ngày học": "Learning streak",
  "Củng cố kiến thức": "Strengthen your knowledge",
  "Tiến độ": "Progress",
  "Tiến độ học tập": "Learning progress",
  "Tiến độ Từ vựng": "Progress: Vocabulary",
  "Tiến độ Ngữ pháp": "Progress: Grammar",
  "Tiến độ Chia động từ": "Progress: Conjugation",
  "Tiếp tục học": "Continue learning",
  "Xem bài học": "View lessons",
  "Mẹo nhỏ:": "Tip:",
  "Kỷ lục:": "Longest:",
  "ngày liên tiếp": "days in a row",
  "ngày": "days",
  "bài": "lessons",
  "Tháng sau": "Next month",
  "Đây là tháng hiện tại": "This is the current month",
  "Hôm nay lúc 09:30": "Today at 09:30",
  "Hôm qua lúc 18:15": "Yesterday at 18:15",
  "13 tháng 5 lúc 21:00": "13 May at 21:00",
};
const TRANSLATED_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
const PAGE_TITLE_PREFIX = "Français Learning Journey | ";

function translatePageTitle(title, language) {
  if (language !== "en" || !title.startsWith(PAGE_TITLE_PREFIX)) return title;
  const english = STATIC_EN[title.slice(PAGE_TITLE_PREFIX.length)];
  return english ? `${PAGE_TITLE_PREFIX}${english}` : title;
}

// Static markup translator. Keeps the original Vietnamese so switching back restores it exactly.
function createTranslator(root) {
  const textOriginals = new Map(); // Text node -> original value
  const attributeOriginals = new Map(); // Element -> { attribute: original value }

  function translateText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest('[lang="fr"], script, style')) return;
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    const english = trimmed ? STATIC_EN[trimmed] : undefined;
    if (english === undefined) return;
    textOriginals.set(node, raw);
    node.nodeValue = raw.replace(trimmed, english);
  }

  function translateAttributes(element) {
    if (element.closest('[lang="fr"]')) return;
    TRANSLATED_ATTRIBUTES.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      const english = value ? STATIC_EN[value.trim()] : undefined;
      if (english === undefined) return;
      const saved = attributeOriginals.get(element) || {};
      saved[attribute] = value;
      attributeOriginals.set(element, saved);
      element.setAttribute(attribute, english);
    });
  }

  function translateTree(start) {
    if (start.nodeType === Node.TEXT_NODE) {
      translateText(start);
      return;
    }
    if (start.nodeType !== Node.ELEMENT_NODE) return;
    translateAttributes(start);
    const walker = document.createTreeWalker(start, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) translateText(node);
      else translateAttributes(node);
    }
  }

  let observer = null;

  return {
    // Vietnamese is the source language: restore everything that was translated.
    toVietnamese() {
      if (observer) observer.disconnect();
      observer = null;
      textOriginals.forEach((original, node) => {
        node.nodeValue = original;
      });
      attributeOriginals.forEach((saved, element) => {
        Object.entries(saved).forEach(([attribute, value]) => element.setAttribute(attribute, value));
      });
      textOriginals.clear();
      attributeOriginals.clear();
    },
    // English: translate what is there now, then translate nodes the page script adds later.
    toEnglish() {
      translateTree(root);
      if (observer) return;
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((added) => translateTree(added));
          if (mutation.type === "characterData") translateText(mutation.target);
        });
      });
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    },
    dispose() {
      this.toVietnamese();
    },
  };
}

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

  // Document language and title follow the shared language state.
  useEffect(() => {
    const previous = { title: document.title, lang: document.documentElement.lang };
    const apply = (language) => {
      document.documentElement.lang = language;
      if (title) document.title = translatePageTitle(title, language);
    };
    apply(getLanguage());
    languageSubscribers.add(apply);
    return () => {
      languageSubscribers.delete(apply);
      document.title = previous.title;
      document.documentElement.lang = previous.lang;
    };
  }, [title]);

  // The page script. It reads getLanguage() and registers onLanguageChange(callback) to re-render.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !init) return undefined;
    // StrictMode mounts, unmounts and re-mounts in development: run the script once per DOM element and
    // only tear it down when the element has really left the document.
    let record = registry.get(el);
    if (!record) {
      record = { cleanup: null, languageListeners: new Set() };
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

  // Static copy, switcher state and script re-render on language change. Declared after the script
  // effect so content the script renders at start-up is translated too.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const translator = createTranslator(el);
    const apply = (language) => {
      syncSwitcher(el, language);
      if (language === "en") translator.toEnglish();
      else translator.toVietnamese();
    };
    apply(getLanguage());
    const onChange = (language) => {
      apply(language);
      const record = registry.get(el);
      if (record) record.languageListeners.forEach((callback) => callback(language));
    };
    languageSubscribers.add(onChange);
    return () => {
      languageSubscribers.delete(onChange);
      translator.dispose();
    };
  }, []);

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
