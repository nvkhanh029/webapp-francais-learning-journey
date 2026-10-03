import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";
import { learningUnitPath, moduleMeta } from "../../utils/routeHelpers.js";
import AnswerFeedback from "./AnswerFeedback.jsx";
import ResultSummary from "./ResultSummary.jsx";

// The Practice Result screen (FD §7.13, FD §4.7).
//
// Rendered directly from the submit response; there is deliberately no reloadable result route,
// because the API has no endpoint that returns detailed per-question feedback later (FD §4.7).
//
// Every value shown comes from the response: `results[]`, each verdict's `correct`, `correct_count`,
// `total_questions`, `accuracy`, and for Mixed Practice `content_covered` (API §17.2, §17.3).
export default function PracticeResult({ result, practiceType, onRetry }) {
  useLanguage();

  const unit = result.learning_unit ?? null;
  // "Back to the lesson" must follow the real unit: `/practice/:slug` would restart the practice, so
  // the link is built from unit_type + slug like every other unit link (FD §7.11, API §23).
  const lessonPath = unit ? learningUnitPath(unit.unit_type, unit.slug) : null;
  const covered = result.content_covered ?? [];

  // Content Covered is current-result data, not persisted Practice History (API §17.3). It may be
  // grouped by module for display.
  const coveredByModule = covered.reduce((groups, item) => {
    const key = item.unit_type ?? "other";
    groups[key] = groups[key] ? [...groups[key], item] : [item];
    return groups;
  }, {});

  return (
    <>
      <section className="practice-section">
        <ResultSummary result={result} />
      </section>

      {/* Mixed Practice only: which learning units the questions came from (API §17.3). */}
      {practiceType === "mixed" && covered.length > 0 && (
        <section className="card practice-section">
          <div className="card-heading">
            <div className="icon-tile subject-mixed" aria-hidden="true">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <h2 className="section-title">{t("mixed.coveredTitle")}</h2>
              <p className="card-subtitle">{t("mixed.coveredText")}</p>
            </div>
          </div>
          <div className="covered-groups">
            {Object.entries(coveredByModule).map(([unitType, items]) => {
              // Each group is headed by its own module. A Mixed result has no `learning_unit`, so the
              // module has to be resolved per group rather than taken from the run.
              const groupModule = moduleMeta(unitType);
              return (
                <div key={unitType}>
                  <h3 className="section-title">{groupModule ? t(groupModule.labelKey) : t("common.practice")}</h3>
                  <ul className="covered-list">
                    {items.map((item) => (
                      <li key={item.slug} lang="fr">
                        {item.title_fr ?? item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card practice-section">
        <div className="card-heading result-list-heading">
          <div className="icon-tile" aria-hidden="true">
            <span className="material-symbols-outlined">rate_review</span>
          </div>
          <div>
            <h2 className="section-title">{t("practice.reviewEach")}</h2>
            <p className="card-subtitle">{t("practice.reviewEachText")}</p>
          </div>
        </div>
        <ol className="result-list">
          {(result.results ?? []).map((item, index) => (
            <AnswerFeedback key={item.question_id ?? index} result={item} index={index} />
          ))}
        </ol>
      </section>

      <div className="action-bar">
        <Link className="button button-secondary" to={lessonPath ?? "/dashboard"}>
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>{" "}
          <span>{unit ? t("practice.backToLesson") : t("common.backToDashboard")}</span>
        </Link>
        <button className="button button-secondary" type="button" onClick={onRetry}>
          <span className="material-symbols-outlined" aria-hidden="true">
            refresh
          </span>{" "}
          <span>{t("practice.retry")}</span>
        </button>
        <Link className="button button-primary" to="/dashboard">
          <span>{t("common.dashboard")}</span>{" "}
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>
    </>
  );
}
