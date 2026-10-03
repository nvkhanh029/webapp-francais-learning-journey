import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";
import { learningUnitPath } from "../../utils/routeHelpers.js";

// Previous / Next learning-unit navigation (FD §7.11, FD §7.6 "Next / Previous" detail pattern).
//
// The API exposes no previous / next field or endpoint, so the neighbours are derived by the caller
// from the sibling list it already has (utils/siblingNav). Navigation is scoped to one sibling list
// and never crosses into another Chapter, Topic or Tense in the MVP (FD §7.11).
//
// Both slots always render so the two columns keep their width. A side with no neighbour becomes an
// unavailable card: an anchor with no href (so it is not focusable and cannot be activated) marked
// aria-disabled, carrying the "No previous/next" wording — never a link that looks clickable but
// does nothing.
//
// `variant` selects the class-name family: "lesson" for Grammar and Conjugation, "unit" for a
// Vocabulary Study Unit. The two families are styled by their own page CSS modules.
export default function UnitNav({ variant = "lesson", unitType, previous, next }) {
  useLanguage();

  const side = (kind, labelKey, neighbor, icon) => {
    const previousSide = kind === "previous";
    const titleClass = `${variant}-nav-title`;
    const supportClass = `${variant}-nav-support`;
    const body = neighbor ? (
      <>
        <span className={titleClass} lang="fr">
          {neighbor.title_fr}
        </span>{" "}
        {neighbor.title !== neighbor.title_fr && <span className={supportClass}>{neighbor.title}</span>}
      </>
    ) : (
      <span className={titleClass}>{t(previousSide ? "lesson.noPrevious" : "lesson.noNext")}</span>
    );

    const content = (
      <>
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>{" "}
        <span className={`${variant}-nav-text`}>
          <span className={`${variant}-nav-label`}>{t(labelKey)}</span> {body}
        </span>
      </>
    );

    const className = `${variant}-nav-link ${variant}-nav-${kind}`;
    const to = neighbor ? learningUnitPath(unitType, neighbor.slug) : null;

    // No href at all on the unavailable side: not focusable, not activatable, and honest about it.
    if (!to) {
      return (
        <a className={className} role="link" aria-disabled="true">
          {content}
        </a>
      );
    }
    return (
      <Link className={className} to={to}>
        {content}
      </Link>
    );
  };

  return (
    <nav className={`${variant}-nav`} aria-label={t("lesson.navigation")}>
      {side("previous", "lesson.previous", previous, "arrow_back")} {side("next", "lesson.next", next, "arrow_forward")}
    </nav>
  );
}
