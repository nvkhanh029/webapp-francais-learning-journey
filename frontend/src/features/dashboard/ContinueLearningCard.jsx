import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";
import { DASHBOARD_MODULE_ORDER, learningUnitPath, moduleMeta } from "../../utils/routeHelpers.js";

// The Continue Learning card (FD §5.4.2, FD §7.7, FD §13).
//
// Two states, both driven by `dashboard.continue_learning` (API §8.1):
//   - a unit to resume: the module, its parent section and its "Lesson x/y" position, plus a CTA to
//     the unit route. `parent` and `position` are always present when the object is not null (API §8.1).
//   - `null`: the explore state, a short heading and sentence plus links to the three modules.
// The card deliberately shows no completion percentage: a learning unit is learned or not, and there
// is no in-unit progress (FD §7.7).
export default function ContinueLearningCard({ continueLearning }) {
  useLanguage();

  if (!continueLearning) {
    return (
      <section className="card continue-card dashboard-section" aria-label={t("common.continueLearning")}>
        <div className="continue-content">
          <div className="continue-details">
            <p className="continue-eyebrow">
              <span className="material-symbols-outlined" aria-hidden="true">
                menu_book
              </span>{" "}
              <span>{t("common.continueLearning")}</span>
            </p>
            <h2 className="continue-title">{t("dashboard.continueEmptyTitle")}</h2>
            <p className="continue-lesson">{t("dashboard.continueEmptyText")}</p>
            <div className="explore-links">
              {DASHBOARD_MODULE_ORDER.map((unitType) => {
                const module = moduleMeta(unitType);
                return (
                  <Link key={unitType} className={`lesson-link ${module.subjectClass}`} to={module.path}>
                    {t(module.labelKey)}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const module = moduleMeta(continueLearning.unit_type);
  const unitPath = learningUnitPath(continueLearning.unit_type, continueLearning.slug);
  // The parent kind (chapter / subtopic / tense) only selects the parent's own localized title, which
  // the API already returns; the module label comes from unit_type (API §8.1).
  const parentTitle = continueLearning.parent?.title ?? continueLearning.parent?.title_fr;
  // The localized title is in the support language; only the French title (shown when there is no
  // localized one, or when the API fell back to it) is marked as French (API §4.9, FD §9.4).
  const parentIsFrench =
    !continueLearning.parent?.title || continueLearning.parent.title === continueLearning.parent.title_fr;
  const position = continueLearning.position;

  return (
    <section className="card continue-card dashboard-section" aria-label={t("common.continueLearning")}>
      <div className="continue-content">
        <div className="continue-details">
          <p className="continue-eyebrow">
            <span className="material-symbols-outlined" aria-hidden="true">
              menu_book
            </span>{" "}
            <span>{t("common.continueLearning")}</span> <span aria-hidden="true">✨</span>
          </p>
          <h2 className="continue-title">
            {module && <span>{`${t(module.labelKey)} • `}</span>}
            {parentTitle && <span lang={parentIsFrench ? "fr" : undefined}>{parentTitle}</span>}{" "}
            <span aria-hidden="true">🥐☕</span>
          </h2>
          <p className="continue-lesson">
            {position && <span>{t("dashboard.continueLesson", { n: position.index, total: position.total })}</span>}{" "}
            <span className="continue-lesson-title" lang="fr">
              «&nbsp;{continueLearning.title_fr}&nbsp;»
            </span>
          </p>
        </div>
        {unitPath && (
          <Link className="button button-primary continue-button" to={unitPath}>
            <span>{t("common.continueLearning")}</span>{" "}
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
