/*
  Dashboard (route "/dashboard", protected). The approved visual baseline of the application
  (frontend-design.md §7.7): greeting, streak + activity calendar, Continue Learning, module
  progress, Mixed Practice + Review Later, and Recent Practice.

  Data:
  - One GET /api/v1/me/dashboard supplies every section (API Contract §8.1), and
    GET /api/v1/me/activity-calendar supplies the calendar month (API §8.2). Nothing here is
    sample data and nothing is derived from a browser clock: "today" is always the server's
    `today.date` (API §4.10, FD §13.32).
  - Streak, progress, Continue Learning, Mixed Practice availability, the Review Later count and the
    Recent Practice subset are backend truth and are rendered as received (FD §3.3). Only display
    derivations are computed here: percentages (floor), accuracy (rounded) and the greeting.
  - The greeting has no API field; a first visit is derived exactly as FD §7.7 specifies.

  States (FD §7.7): the aggregate request renders LoadingState, then either ErrorState with a retry
  or the content. The calendar month has its own inline loading/error state and retry, so switching
  or failing a month never blocks the rest of the page.

  Page sections:
  1. Greeting
  2. Learning streak and practice calendar
  3. Continue learning
  4. Learning progress
  5. Strengthen your knowledge: Mixed Practice and Review Later
  6. Recent practice
*/
import { useEffect } from "react";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ActivityCalendar from "../features/dashboard/ActivityCalendar.jsx";
import ContinueLearningCard from "../features/dashboard/ContinueLearningCard.jsx";
import DashboardGreeting from "../features/dashboard/DashboardGreeting.jsx";
import MixedPracticeCard from "../features/dashboard/MixedPracticeCard.jsx";
import ModuleProgressSection from "../features/dashboard/ModuleProgressSection.jsx";
import RecentPracticeList from "../features/dashboard/RecentPracticeList.jsx";
import ReviewLaterCard from "../features/dashboard/ReviewLaterCard.jsx";
import StreakCard from "../features/dashboard/StreakCard.jsx";
import useDashboard from "../hooks/useDashboard.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  useLanguage();
  const { data, isLoading, error, reload } = useDashboard();

  // The page title follows the shared language state, as usePageScript did for the scripted pages.
  useEffect(() => {
    document.title = t("title.dashboard");
  });

  const todayDate = data?.today?.date;

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container dashboard" id="main-content">
        {isLoading && <LoadingState message={t("dashboard.loading")} />}
        {error && (
          <ErrorState
            headingLevel={1}
            title={t("dashboard.loadError")}
            message={t("common.loadError")}
            onRetry={reload}
          />
        )}
        {data && (
          <>
            {/* 1. Greeting */}
            <DashboardGreeting progress={data.progress} streak={data.streak} />

            {/* 2. Learning streak and practice calendar */}
            <section className="activity-overview dashboard-section" aria-label={t("dashboard.activityRegion")}>
              <StreakCard streak={data.streak} />
              <ActivityCalendar todayDate={todayDate} />
            </section>

            {/* 3. Continue learning */}
            <ContinueLearningCard continueLearning={data.continue_learning} />

            {/* 4. Learning progress */}
            <ModuleProgressSection progress={data.progress} />

            {/* 5. Strengthen your knowledge */}
            <section className="dashboard-section practice-section" aria-labelledby="practice-title">
              <div className="section-heading practice-heading">
                <div className="heading-with-icon">
                  <span className="material-symbols-outlined section-icon" aria-hidden="true">
                    category
                  </span>
                  <h2 className="section-title" id="practice-title">
                    {t("dashboard.strengthen")}
                  </h2>
                </div>
              </div>
              <div className="practice-grid">
                <MixedPracticeCard available={data.mixed_practice?.available} />
                <ReviewLaterCard count={data.review_later_count} />
              </div>
            </section>

            {/* 6. Recent practice */}
            <RecentPracticeList sessions={data.recent_practice} todayDate={todayDate} />
          </>
        )}
      </main>
    </div>
  );
}
