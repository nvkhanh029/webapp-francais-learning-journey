import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";

// One learning unit inside a browse list (FD §7.8, §7.9, §7.10): the whole row is the link to the
// unit, showing the French title, the localized support title, and the learner-state badges.
//
// French is the target language, so `title_fr` is the primary title (lang="fr") and the localized
// title sits underneath; when the API has fallen back to `title_fr` for a missing translation
// (API §4.9) there is nothing to repeat, so the support line is dropped.
//
// `is-learned` / `is-saved` drive the row's accent treatment, and Review Later has priority: its badge
// is listed first and, when a unit is both learned and saved, the Learned badge takes the quiet
// outline variant so the two do not compete (FD §7.6). The status icon repeats that state as a shape
// so it is never colour alone (FD §11).
//
// `variant` selects the class family used by the surrounding page CSS: "lesson" for the Grammar and
// Conjugation lists, "unit" for the Vocabulary Topic Study Unit list.
export default function LearningUnitRow({ variant = "lesson", className, unit, to }) {
  useLanguage();

  const learned = Boolean(unit.learned);
  const reviewLater = Boolean(unit.review_later);
  const hasTitleFr = Boolean(unit.title_fr);
  const hasSupport = hasTitleFr && Boolean(unit.title) && unit.title !== unit.title_fr;
  const rowClass = [className, learned ? "is-learned" : "", reviewLater ? "is-saved" : ""].filter(Boolean).join(" ");

  return (
    <li>
      <Link className={rowClass} to={to}>
        <span className={`${variant}-status`} aria-hidden="true">
          <span className="material-symbols-outlined">{learned ? "check_circle" : "radio_button_unchecked"}</span>
        </span>
        <span className={`${variant}-body`}>
          <span className={`${variant}-title`} lang={hasTitleFr ? "fr" : undefined}>
            {unit.title_fr ?? unit.title}
          </span>
          {hasSupport && <span className="title-support">{unit.title}</span>}
          {(learned || reviewLater) && (
            <span className={`${variant}-meta`}>
              {reviewLater && (
                <span className="badge badge-review">
                  <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                    bookmark
                  </span>
                  <span>{t("common.reviewLater")}</span>
                </span>
              )}
              {learned && (
                <span className={`badge badge-learned${reviewLater ? " badge-quiet" : ""}`}>
                  <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                    check_circle
                  </span>
                  <span>{t("common.learned")}</span>
                </span>
              )}
            </span>
          )}
        </span>
        <span className={`${variant}-arrow`} aria-hidden="true">
          <span className="material-symbols-outlined">arrow_forward</span>
        </span>
      </Link>
    </li>
  );
}
