import { t, useLanguage } from "../../i18n/index.js";
import RecentPracticeItem from "./RecentPracticeItem.jsx";

// The Recent Practice card (FD §5.4.2, FD §7.7): the small latest set of completed sessions returned
// by the Dashboard. It is shown as returned, newest first, with no pagination and no link to a full
// history — a separate Practice History page is not part of the MVP (Requirements §8.4, FD §4.4).
export default function RecentPracticeList({ sessions, todayDate }) {
  useLanguage();

  const rows = sessions ?? [];

  return (
    <section className="card recent-practice" aria-labelledby="recent-title">
      <div className="section-heading">
        <div className="card-heading">
          <div className="icon-tile history-icon" aria-hidden="true">
            <span className="material-symbols-outlined">history</span>
          </div>
          <div>
            <h2 className="section-title" id="recent-title">
              {t("dashboard.recentTitle")}
            </h2>
            <p className="card-subtitle">{t("dashboard.recentSubtitle")}</p>
          </div>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="empty-text">{t("dashboard.recentEmpty")}</p>
      ) : (
        <ul className="practice-list">
          {rows.map((session, index) => (
            // A session has no id in the contract, so the position in the returned list is the key.
            <RecentPracticeItem key={`${session.completed_at}-${index}`} session={session} todayDate={todayDate} />
          ))}
        </ul>
      )}
    </section>
  );
}
