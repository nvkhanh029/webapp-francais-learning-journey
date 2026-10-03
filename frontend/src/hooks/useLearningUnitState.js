import { useCallback, useEffect, useRef, useState } from "react";

import { openLearningUnit, updateLearningUnitState } from "../api/learningStateApi.js";
import { t } from "../i18n/index.js";

// Owns the learner-state interactions shared by every learning-unit page (FD §5.6):
// recording the open, Mark as Learned / Unmark, and Review Later add / remove.
//
// The backend is the only authority for this state. The hook keeps no mirrored copy of `learned` /
// `review_later`: it renders `serverState` exactly as the GET returned it, and only after a PATCH
// confirms a change does the parent refetch and hand down the new value (FD §3.3, API §13.2).
// PATCH semantics mean only the supplied field changes, so marking learned never disturbs
// Review Later and vice versa (API §13.2).
export default function useLearningUnitState(slug, serverState) {
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [attempt, setAttempt] = useState(0);
  // Remembers the slug already recorded, so a StrictMode double-mount does not repeat the POST.
  const recordedSlug = useRef(null);

  // Record the open after the unit loaded successfully (API §13.1). This GET does not update
  // last_opened_at, so the explicit open action is what feeds Continue Learning. Recording it is
  // best-effort: a failure must not block reading the lesson, so it is not surfaced as page state.
  useEffect(() => {
    if (!slug || recordedSlug.current === slug) return undefined;
    recordedSlug.current = slug;
    openLearningUnit(slug).catch(() => {
      // Intentionally ignored; the learner still sees the lesson.
    });
    return undefined;
  }, [slug, attempt]);

  const run = useCallback(
    async (action, patch, announceKey) => {
      setPendingAction(action);
      setError(null);
      try {
        const payload = await updateLearningUnitState(slug, patch);
        setAnnouncement(t(announceKey));
        return payload?.state ?? null;
      } catch (cause) {
        setError(cause);
        return null;
      } finally {
        setPendingAction(null);
      }
    },
    [slug],
  );

  const markLearned = useCallback(() => run("learned", { learned: true }, "lesson.marked"), [run]);
  const unmarkLearned = useCallback(() => run("unlearned", { learned: false }, "lesson.unmarked"), [run]);
  const saveForReview = useCallback(
    () => run("review", { review_later: true }, "lesson.savedMessage"),
    [run],
  );
  const removeFromReview = useCallback(
    () => run("unreview", { review_later: false }, "lesson.removedMessage"),
    [run],
  );

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return {
    learned: Boolean(serverState?.learned),
    reviewLater: Boolean(serverState?.review_later),
    isLearnedPending: pendingAction === "learned" || pendingAction === "unlearned",
    isReviewPending: pendingAction === "review" || pendingAction === "unreview",
    error,
    announcement,
    retry,
    markLearned,
    unmarkLearned,
    saveForReview,
    removeFromReview,
  };
}
