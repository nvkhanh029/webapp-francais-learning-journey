import { Link } from "react-router-dom";

import ProgressBar from "../../components/common/ProgressBar.jsx";
import { t, useLanguage } from "../../i18n/index.js";
import { modulePercent } from "../../utils/formatUtils.js";
import { moduleMeta } from "../../utils/routeHelpers.js";

// One module progress card (FD §5.4.2, FD §7.7): total badge, learned/total, percentage bar and a
// link to the module page. Counts come from `dashboard.progress[unit_type]`; the percentage is
// derived here (floor, clamped 0-100) and only displayed by the bar (FD §7.7, API §23).
//
// Vocabulary counts Study Units, never individual words (FD §7.7).
export default function ModuleProgressCard({ unitType, learned = 0, total = 0 }) {
  useLanguage();
  const module = moduleMeta(unitType);
  if (!module) return null;

  const titleId = `${unitType}-progress-title`;
  const percent = modulePercent(learned, total);

  return (
    <article className={`card skill-card ${module.subjectClass}`} aria-labelledby={titleId}>
      <div>
        <div className="skill-card-header">
          <div className="icon-tile" aria-hidden="true">
            <span className="material-symbols-outlined">{module.icon}</span>
          </div>
          <span className="badge">
            {total} {t("common.lessonWord", { n: total })}
          </span>
        </div>
        <h3 className="skill-title" id={titleId}>
          {t(module.labelKey)}
        </h3>
        <p className="skill-description">{t(module.descriptionKey)}</p>
      </div>
      <div className="skill-progress">
        <ProgressBar
          label={t("common.progress")}
          percent={percent}
          ariaLabel={t(module.progressLabelKey)}
        />
        <div className="skill-footer">
          <span className="skill-detail">{t("common.lessonsOf", { learned, total, n: total })}</span>{" "}
          <Link className="lesson-link" to={module.path}>
            {t("common.viewLessons")}
            {/* Repeated link text needs visually hidden context so each link is distinguishable (FD §11). */}
            <span className="visually-hidden">{t(module.labelKey)}</span>
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
