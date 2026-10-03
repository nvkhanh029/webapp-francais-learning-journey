import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";

// The Mixed Practice entry card (FD §5.4.2, FD §7.7).
//
// `dashboard.mixed_practice.available` decides whether the Start CTA or the unavailable notice is
// shown; there is no separate availability endpoint and this card does not pre-check it
// (FD §5.4.7). When the learner does start one, MixedPracticePage treats the authoritative
// `409 mixed_practice_unavailable` the same way.
export default function MixedPracticeCard({ available }) {
  useLanguage();

  return (
    <article className="card mixed-card subject-mixed" aria-labelledby="mixed-title">
      <div className="mixed-card-header">
        <div>
          <h3 className="mixed-title" id="mixed-title">
            {t("common.mixedPractice")}
          </h3>
          <p className="mixed-description">{t("dashboard.mixedText")}</p>
        </div>
        <div className="icon-tile" aria-hidden="true">
          <span className="material-symbols-outlined">casino</span>
        </div>
      </div>
      {available ? (
        <div className="mixed-actions">
          <Link className="button button-primary" to="/mixed-practice">
            <span>{t("common.startPractice")}</span>{" "}
            <span className="material-symbols-outlined" aria-hidden="true">
              bolt
            </span>
          </Link>
        </div>
      ) : (
        <p className="state-note">
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>{" "}
          <span>{t("dashboard.mixedEmpty")}</span>
        </p>
      )}
    </article>
  );
}
