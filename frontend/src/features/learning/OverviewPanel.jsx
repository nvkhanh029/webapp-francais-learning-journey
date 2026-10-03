import { t, useLanguage } from "../../i18n/index.js";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { modulePercent } from "../../utils/formatUtils.js";

// The overview strip at the top of a module browse page (FD §7.8, §7.9, §7.10): overall progress plus
// the two learner-state counts.
//
// The percentage is derived here as floor(learned / total) clamped to 0-100 so "100%" appears only
// when every unit is learned (FD §7.7). The counts themselves are backend truth (API §8.1, §9.1,
// §10.1) and are only summed for display, never recomputed from database-like data (FD §3.3).
export default function OverviewPanel({
  learned,
  total,
  saved,
  progressAriaLabel,
  statusLabelKey = "common.lessonStatus",
}) {
  useLanguage();

  const isComplete = total > 0 && learned === total;

  return (
    <div className={`overview-panel${isComplete ? " is-complete" : ""}`}>
      <ProgressBar label={t("common.progress")} percent={modulePercent(learned, total)} ariaLabel={progressAriaLabel} />
      <ul className="overview-states" aria-label={t(statusLabelKey)}>
        <li className="badge badge-learned">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            check_circle
          </span>{" "}
          <span>
            {t("common.learnedColon")} {t("common.fraction", { learned, total })}
          </span>
        </li>
        <li className="badge badge-review">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            bookmark
          </span>{" "}
          <span>
            {t("common.reviewLaterColon")} {t("common.count", { n: saved })}
          </span>
        </li>
      </ul>
    </div>
  );
}
