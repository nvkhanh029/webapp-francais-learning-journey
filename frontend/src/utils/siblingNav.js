// Previous / next helpers for learning units (FD §7.11).
//
// The API has no previous / next field and no previous / next endpoint (API §23), so the frontend
// derives the neighbours from the sibling list it already has, in the order the API returned it.
//
// Navigation is scoped to one sibling list: the lessons of the same Grammar Chapter, the Study Units
// of the same Vocabulary Topic, the lessons of the same Conjugation Tense. It deliberately does not
// cross into another Chapter, Topic or Tense in the MVP (FD §7.11). When the sibling list is not
// available — a direct deep link before the browse data has loaded — the caller passes what it has
// and both sides are simply absent rather than guessed.

// `{ previous, next }` for `slug` inside `items`, or two nulls when the slug is not in the list.
export function neighbours(items, slug) {
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex((item) => item?.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? list[index - 1] : null,
    next: index + 1 < list.length ? list[index + 1] : null,
  };
}

// Flatten a Grammar browse response into one entry per Chapter, each paired with its Part and its own
// lesson list. Lets a lesson page find its own Chapter without re-walking the Part tree on render.
export function grammarChapters(parts) {
  return (parts ?? []).flatMap((part) =>
    (part?.chapters ?? []).map((chapter) => ({
      part,
      chapter,
      lessons: chapter?.lessons ?? [],
    })),
  );
}

// The Part, Chapter and sibling lesson list that contain `slug`. Returns empty values when the slug
// is not in the browse data, so a caller renders no context instead of an invented one.
export function grammarLocation(parts, slug) {
  const found = grammarChapters(parts).find((entry) => entry.lessons.some((lesson) => lesson?.slug === slug));
  return found ?? { part: null, chapter: null, lessons: [] };
}

// The Tense that contains `slug` in a Conjugation browse response, or null.
export function tenseForSlug(tenses, slug) {
  return (tenses ?? []).find((tense) => (tense?.lessons ?? []).some((lesson) => lesson?.slug === slug)) ?? null;
}
