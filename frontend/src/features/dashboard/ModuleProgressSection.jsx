import { t, useLanguage } from "../../i18n/index.js";
import { DASHBOARD_MODULE_ORDER } from "../../utils/routeHelpers.js";
import ModuleProgressCard from "./ModuleProgressCard.jsx";

// The Learning progress group (FD §5.4.2, FD §7.7): one card per module, always in the order
// Vocabulary, Grammar, Conjugation — the same order as the Dashboard module cards and the main
// navigation (FD §4.4). The cards are rendered from the `progress` object as returned, so the
// section grows with the API rather than a fixed list (FD §3.4).
export default function ModuleProgressSection({ progress }) {
  useLanguage();

  return (
    <section className="dashboard-section skills-section" aria-labelledby="skills-title">
      <div className="section-heading">
        <div className="heading-with-icon">
          <span className="material-symbols-outlined section-icon" aria-hidden="true">
            auto_stories
          </span>
          <h2 className="section-title" id="skills-title">
            {t("common.learningProgress")}
          </h2>
        </div>
      </div>
      <div className="skills-grid">
        {DASHBOARD_MODULE_ORDER.map((unitType) => (
          <ModuleProgressCard
            key={unitType}
            unitType={unitType}
            learned={progress?.[unitType]?.learned ?? 0}
            total={progress?.[unitType]?.total ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
