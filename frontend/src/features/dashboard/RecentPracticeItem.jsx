import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";
import { formatActivityDate } from "../../utils/dateUtils.js";
import { accuracyPercent } from "../../utils/formatUtils.js";
import { learningUnitPath, moduleMeta } from "../../utils/routeHelpers.js";

// One Recent Practice row (FD §5.4.2, FD §7.7). It is a list row, never a table row (FD §8.4).
//
// The Type is derived from `practice_type` and `unit_type`, never stored on the frontend
// (API §4.11, API §23): a normal session shows its module and links back to the learning unit, a
// mixed session shows the single "Mixed Practice" label with no link (API §8.1). Accuracy is
// derived from the stored counts and rounded for display (FD §7.7). `todayDate` is the Dashboard's
// server today, so "Today"/"yesterday" never come from the browser clock (API §4.10).
export default function RecentPracticeItem({ session, todayDate }) {
  useLanguage();

  const isMixed = session.practice_type === "mixed";
  const unit = session.learning_unit;
  const module = isMixed ? null : moduleMeta(unit?.unit_type);
  const typeLabel = isMixed ? t("common.mixedPractice") : module ? t(module.labelKey) : t("common.mixedPractice");
  const unitPath = isMixed ? null : learningUnitPath(unit?.unit_type, unit?.slug);

  const percent = accuracyPercent(session.correct_count, session.total_questions);
  const isPerfect = percent === 100;
  const completed = formatActivityDate(session.completed_at, todayDate);

  const title = isMixed ? typeLabel : t("dashboard.recentModule", { module: typeLabel, title: unit?.title_fr ?? "" });

  return (
    <li className={`practice-item ${isMixed ? "subject-mixed" : (module?.subjectClass ?? "")}`}>
      <div className="practice-info">
        <div className="icon-tile" aria-hidden="true">
          <span className="material-symbols-outlined">{isMixed ? "casino" : (module?.icon ?? "menu_book")}</span>
        </div>
        <div className="practice-details">
          {/* Titles clamp to two lines; the full text stays available as a title attribute (FD §7.7). */}
          <h3 className="practice-title" title={title}>
            {unitPath ? (
              <>
                <span className="practice-type">{t("dashboard.moduleLabel", { module: typeLabel })}</span>{" "}
                <Link className="practice-link" to={unitPath} lang="fr">
                  {unit.title_fr}
                </Link>
              </>
            ) : (
              <span className="practice-type">{typeLabel}</span>
            )}
          </h3>
          {completed && (
            <p className="practice-date">
              <span className="material-symbols-outlined" aria-hidden="true">
                schedule
              </span>{" "}
              <time dateTime={completed.dateTime}>{completed.label}</time>
            </p>
          )}
        </div>
      </div>
      <div className="practice-result">
        {/* A perfect score gets the accent colour in addition to the number, never colour alone (FD §7.7). */}
        <span className={`practice-score${isPerfect ? " is-perfect" : ""}`}>{`${percent}%`}</span>{" "}
        <span className="practice-correct">
          {t("practice.scoreSummary", { correct: session.correct_count, total: session.total_questions })}
        </span>
      </div>
    </li>
  );
}
