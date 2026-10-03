import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";

// The Review Later card (FD §5.4.2, FD §7.7): the saved-unit count and a link to /review-later.
// At zero the count is replaced by a short hint on how to save a unit, but the list link stays
// available (FD §7.7). The count itself is backend truth; nothing is derived here.
export default function ReviewLaterCard({ count = 0 }) {
  useLanguage();

  return (
    <article className="card review-card" aria-labelledby="review-title">
      <div>
        <div className="review-card-header">
          <div>
            <h3 className="review-title" id="review-title">
              {t("common.reviewLater")}
            </h3>
            <p className="review-description">{t("dashboard.reviewText")}</p>
          </div>
          <div className="icon-tile" aria-hidden="true">
            <span className="material-symbols-outlined">bookmark_added</span>
          </div>
        </div>
        {count === 0 ? (
          <p className="empty-text review-empty">{t("dashboard.reviewEmpty")}</p>
        ) : (
          <p className="review-counter">
            <span className="review-count">{count}</span>{" "}
            <span className="review-count-label">{t("dashboard.savedLessons", { n: count })}</span>
          </p>
        )}
      </div>
      <div className="review-action">
        <Link className="button button-secondary" to="/review-later">
          <span>{t("dashboard.openReviewList")}</span>{" "}
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}
