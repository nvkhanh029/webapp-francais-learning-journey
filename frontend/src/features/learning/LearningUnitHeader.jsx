import { t, useLanguage } from "../../i18n/index.js";
import UnitStateBadges from "./UnitStateBadges.jsx";

// The title block of a learning-unit detail page (FD §5.4.3, FD §7.11): module icon tile, the
// French title as the primary heading, the localized title as the support line, the parent-section
// context line, and the learner-state badges.
//
// French is the target language, so `title_fr` is the primary title (marked lang="fr") and the
// localized title sits underneath (FD §9.4). When the API has fallen back to `title_fr` because a
// translation is missing (API §4.9) there is nothing to say twice, so the support line is omitted.
//
// `contextLabel` / `contextTitle` describe the parent grouping — "Tense:" for Conjugation, or a
// category/topic line for Vocabulary. `variant` picks the class family: "lesson" for Grammar and
// Conjugation, "unit" for a Vocabulary Study Unit.
export default function LearningUnitHeader({
  variant = "lesson",
  icon,
  titleId,
  titleFr,
  title,
  contextLabel,
  contextTitle,
  contextSupport,
  learned,
  reviewLater,
  metaItems,
}) {
  useLanguage();

  const hasTitleFr = Boolean(titleFr);
  const primaryTitle = titleFr ?? title;
  const hasSupport = hasTitleFr && Boolean(title) && title !== titleFr;

  return (
    <header className={`card ${variant}-header`}>
      <div className="icon-tile icon-tile-solid" aria-hidden="true">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className={`${variant}-heading`}>
        <h1 className={`${variant}-title`} id={titleId} lang={hasTitleFr ? "fr" : undefined}>
          {primaryTitle}
        </h1>
        {hasSupport && <p className="title-support">{title}</p>}
        {(contextTitle || metaItems) && (
          <p className={`${variant}-context`}>
            {contextTitle && (
              <>
                <span className="material-symbols-outlined" aria-hidden="true">
                  event_note
                </span>{" "}
                <span>
                  {contextLabel} {contextTitle}
                  {contextSupport && <span>{` · ${contextSupport}`}</span>}
                </span>
              </>
            )}
          </p>
        )}
        {metaItems ? (
          <ul className="unit-meta" aria-label={t("vocab.unitInfo")}>
            {metaItems}
          </ul>
        ) : (
          <UnitStateBadges
            className="state-badges"
            label={t("common.lessonStatus")}
            learned={learned}
            reviewLater={reviewLater}
          />
        )}
      </div>
    </header>
  );
}
