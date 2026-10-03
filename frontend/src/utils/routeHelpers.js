// Route helpers shared by navigation and layouts (FD §4.2, §4.4).

// The three learning modules, keyed by the `unit_type` the API returns (API §4.8). One entry per
// module so navigation, the subject accent class, and the icon are derived from `unit_type` instead
// of being hard-coded per screen (FD §3.4, FD §7.3, FD §23).
export const LEARNING_MODULES = {
  vocabulary: {
    labelKey: "common.vocabulary",
    descriptionKey: "dashboard.vocabularyText",
    progressLabelKey: "common.progressVocabulary",
    subjectClass: "subject-vocabulary",
    icon: "style",
    path: "/vocabulary",
    unitPath: "/vocabulary/study-units",
  },
  grammar: {
    labelKey: "common.grammar",
    descriptionKey: "dashboard.grammarText",
    progressLabelKey: "common.progressGrammar",
    subjectClass: "subject-grammar",
    icon: "draw",
    path: "/grammar",
    unitPath: "/grammar/lessons",
  },
  conjugation: {
    labelKey: "common.conjugation",
    descriptionKey: "dashboard.conjugationText",
    progressLabelKey: "common.progressConjugation",
    subjectClass: "subject-conjugation",
    icon: "schedule",
    path: "/conjugation",
    unitPath: "/conjugation/lessons",
  },
};

// Dashboard module order: Vocabulary, Grammar, Conjugation (FD §7.7).
export const DASHBOARD_MODULE_ORDER = ["vocabulary", "grammar", "conjugation"];

// Presentation/navigation metadata for a `unit_type`, or null when the value is not one of the three
// modules. Callers must handle null rather than assume a module.
export function moduleMeta(unitType) {
  return LEARNING_MODULES[unitType] ?? null;
}

// Learner-facing route of one learning unit, built from `unit_type` + stable slug (FD §13.2, API §23).
// Returns null for an unknown module so a caller never links to a fabricated path.
export function learningUnitPath(unitType, slug) {
  const module = moduleMeta(unitType);
  if (!module || !slug) return null;
  return `${module.unitPath}/${slug}`;
}

// Main-navigation item (FD §4.4) that a path belongs to, or null when no item is current. Reference content
// (/basics/...) is reached from Vocabulary, so it keeps the Vocabulary item current. Practice, Mixed Practice
// and Review Later are not main-navigation items.
export function navSectionForPath(pathname) {
  if (pathname === "/dashboard") return "/dashboard";
  if (pathname === "/vocabulary" || pathname.startsWith("/vocabulary/") || pathname.startsWith("/basics/"))
    return "/vocabulary";
  if (pathname === "/grammar" || pathname.startsWith("/grammar/")) return "/grammar";
  if (pathname === "/conjugation" || pathname.startsWith("/conjugation/")) return "/conjugation";
  return null;
}
