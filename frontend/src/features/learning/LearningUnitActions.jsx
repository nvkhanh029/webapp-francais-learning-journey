import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";

// The contextual action block of a learning-unit detail page (FD §5.4.3, FD §7.11):
// Mark as Learned / Unmark, Review Later / remove, and the Practice entry point.
//
// Each control shows either its action or the resulting state, so the confirmed backend value is what
// is displayed — the frontend never asserts learned/saved state on its own (FD §3.3, API §13.2).
// Review Later is independent from Learned: neither toggle reads or writes the other field.
//
// Practice is optional in the MVP (Requirements §8.3), so it stays secondary with a short note until
// the unit is learned, then becomes the primary next step.
export default function LearningUnitActions({
  variant = "lesson",
  className = "",
  titleId,
  slug,
  learned,
  reviewLater,
  isLearnedPending,
  isReviewPending,
  error,
  announcement,
  onMarkLearned,
  onUnmarkLearned,
  onSaveForReview,
  onRemoveFromReview,
  practiceNoteKey = "lesson.practiceNote",
}) {
  useLanguage();

  return (
    <aside className={`card ${variant}-actions ${className}`.trim()} aria-labelledby={titleId}>
      <h2 className="actions-title" id={titleId}>
        {t("lesson.statusHeading")}
      </h2>

      {/* Learned */}
      {learned ? (
        <div className="state-box state-box-learned">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            check_circle
          </span>
          <p className="state-box-text">
            <strong>{t("common.learned")}</strong>
            {t("lesson.learnedNote")}
          </p>
          <button className="state-undo" type="button" disabled={isLearnedPending} onClick={onUnmarkLearned}>
            {t("lesson.unmark")}
            <span className="visually-hidden">{t("common.learnedLower")}</span>
          </button>
        </div>
      ) : (
        <button
          className="button button-primary button-toggle"
          type="button"
          disabled={isLearnedPending}
          onClick={onMarkLearned}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            check
          </span>{" "}
          <span>{t("common.markLearned")}</span>
        </button>
      )}

      {/* Review Later — independent from Learned */}
      {reviewLater ? (
        <div className="state-box state-box-review">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            bookmark
          </span>
          <p className="state-box-text">
            <strong>{t("common.reviewLater")}</strong>
            {t("lesson.savedNote")}
          </p>
          <button className="state-undo" type="button" disabled={isReviewPending} onClick={onRemoveFromReview}>
            {t("lesson.unsave")}
            <span className="visually-hidden">{t("lesson.fromReviewLater")}</span>
          </button>
        </div>
      ) : (
        <button
          className="button button-secondary button-toggle"
          type="button"
          disabled={isReviewPending}
          onClick={onSaveForReview}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            bookmark
          </span>{" "}
          <span>{t("common.reviewLater")}</span>
        </button>
      )}

      <div className="practice-group">
        <Link className={`button ${learned ? "button-primary" : "button-secondary"}`} to={`/practice/${slug}`}>
          <span>{t("common.startPractice")}</span>{" "}
          <span className="material-symbols-outlined" aria-hidden="true">
            bolt
          </span>
        </Link>
        {!learned && <p className="action-note">{t(practiceNoteKey)}</p>}
      </div>

      {/* A failed mutation keeps the learner on the page with their state unchanged (FD §6.7). */}
      {error && (
        <div className="state-note" role="alert">
          <span className="material-symbols-outlined" aria-hidden="true">
            error
          </span>{" "}
          <span>{t("common.loadError")}</span>
        </div>
      )}

      {/* Confirmed changes are announced without moving focus (FD §11). */}
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </aside>
  );
}
