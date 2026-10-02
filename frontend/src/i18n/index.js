import { getLanguage } from "./language.js";
import { strings } from "./strings.js";

export { getLanguage, setLanguage, useLanguage, subscribeLanguage, LANGUAGES } from "./language.js";

const LOCALES = { vi: "vi-VN", en: "en-GB" };
const pluralRules = {};

export function localeFor(language = getLanguage()) {
  return LOCALES[language] || LOCALES.vi;
}

function pluralCategory(language, count) {
  pluralRules[language] ||= new Intl.PluralRules(localeFor(language));
  return pluralRules[language].select(count);
}

function fill(template, params) {
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in params)) return match;
    const value = params[name];
    return typeof value === "number" ? new Intl.NumberFormat(localeFor()).format(value) : String(value);
  });
}

// t(key, params): the string for the current language. A language entry is a string or, for plurals,
// { one, other } selected with params.n. Placeholders are written {name}. A missing key returns the key,
// so a gap is visible instead of silently rendering nothing.
export function t(key, params = {}) {
  const entry = strings[key];
  if (!entry) return key;
  const language = getLanguage();
  let value = entry[language] ?? entry.vi;
  if (value && typeof value === "object") {
    value = value[pluralCategory(language, params.n)] ?? value.other;
  }
  return fill(value, params);
}

/* ---------- Dates ---------- */
export function capitalize(text, language = getLanguage()) {
  return text.charAt(0).toLocaleUpperCase(localeFor(language)) + text.slice(1);
}

// Month name for a 0-based month index, e.g. "Tháng 5" / "May".
export function monthName(monthIndex, year = 2026) {
  const date = new Date(year, monthIndex, 1, 12);
  return capitalize(new Intl.DateTimeFormat(localeFor(), { month: "long" }).format(date));
}

// "12 tháng 5" / "12 May".
export function dayMonth(day, monthIndex, year = 2026) {
  return new Intl.DateTimeFormat(localeFor(), { day: "numeric", month: "long" }).format(new Date(year, monthIndex, day, 12));
}
