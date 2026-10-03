import { t, monthName, useLanguage, weekdayLabels } from "../../i18n/index.js";
import useActivityCalendar from "../../hooks/useActivityCalendar.js";
import { parseIsoDate } from "../../utils/dateUtils.js";

// The Learning Activity Calendar card (FD §5.4.2, FD §7.7).
//
// `todayDate` is the Dashboard's server `today.date` (API §8.1). It is the only "now" used here: the
// grid opens on the server's current month, "not yet" days are decided against it, and today carries
// aria-current="date". The browser clock is never consulted (FD §13.32, API §4.10).
//
// The API returns only the unique active dates of the month and carries no per-day count and no
// intensity (API §8.2), so each day is one of exactly three states: active, no practice, not yet.
// Weeks start on Monday.
const DAY_STATES = {
  active: { className: "activity-active", labelKey: "dashboard.practiced" },
  inactive: { className: "activity-inactive", labelKey: "dashboard.noPractice" },
  notYet: { className: "activity-inactive", labelKey: "dashboard.notYet" },
};

export default function ActivityCalendar({ todayDate }) {
  useLanguage();
  const calendar = useActivityCalendar(todayDate);
  const { year, month, isCurrentMonth, data, isLoading, error, goToPreviousMonth, goToNextMonth, reload } = calendar;

  const today = parseIsoDate(todayDate);
  const activeDays = new Set(
    (data?.days ?? []).filter((day) => /^(\d{4})-(\d{2})-(\d{2})$/.test(day)).map((day) => Number(day.slice(-2))),
  );
  const dayCount = new Date(year, month + 1, 0, 12).getDate();
  // Monday is column 1. Date.UTC keeps the weekday of the 1st independent of the browser timezone.
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const firstDayColumn = (firstWeekday + 6) % 7 + 1;

  const cells = [];
  for (let day = 1; day <= dayCount; day += 1) {
    const isToday = isCurrentMonth && today?.day === day;
    // Only a day after today in the current month can be "not yet"; earlier months are all past.
    const isNotYet = isCurrentMonth && today !== null && day > today.day;
    const state = isNotYet ? DAY_STATES.notYet : activeDays.has(day) ? DAY_STATES.active : DAY_STATES.inactive;
    const stateLabel = t(state.labelKey);
    cells.push(
      <div
        key={day}
        className={`calendar-day ${state.className}`}
        style={day === 1 ? { gridColumnStart: firstDayColumn } : undefined}
        title={`${isToday ? `${t("dashboard.today")}, ` : ""}${day}: ${stateLabel}`}
        aria-current={isToday ? "date" : undefined}
      >
        {day}
        {/* Text alternative for the colour-coded state (FD §11): never rely on colour alone. */}
        <span className="visually-hidden">
          {`${isToday ? ` (${t("dashboard.today")})` : ""}: ${stateLabel}`}
        </span>
      </div>,
    );
  }

  return (
    <article className="card activity-card" aria-labelledby="activity-title">
      <div className="activity-card-header">
        <div className="card-heading">
          <div className="icon-tile calendar-icon" aria-hidden="true">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <div>
            <h2 className="section-title" id="activity-title">
              {t("dashboard.calendarTitle")}
            </h2>
            <p className="card-subtitle">{t("dashboard.calendarSubtitle")}</p>
          </div>
        </div>
        <div className="month-navigation" role="group" aria-label={t("dashboard.chooseMonth")}>
          <button
            className="month-button"
            id="previous-month"
            type="button"
            aria-label={t("dashboard.previousMonth")}
            aria-controls="activity-calendar-days"
            title={t("dashboard.previousMonth")}
            onClick={goToPreviousMonth}
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>{" "}
          <span className="month-badge" id="calendar-month" aria-live="polite" aria-atomic="true">
            {monthName(month, year)}
          </span>{" "}
          <button
            className="month-button"
            id="next-month"
            type="button"
            aria-label={t("dashboard.nextMonth")}
            aria-controls="activity-calendar-days"
            // A future month is rejected by the API (API §8.2), so the control stops at the current month.
            disabled={isCurrentMonth}
            title={isCurrentMonth ? t("dashboard.currentMonth") : t("dashboard.nextMonth")}
            onClick={goToNextMonth}
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </div>
      </div>

      {/* The month request has its own loading and error state with a retry action and never blocks
          the rest of the Dashboard (FD §7.7). */}
      {isLoading && (
        <div className="calendar-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>{t("common.loading")}</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="calendar-state" role="alert">
          <p>{t("dashboard.calendarError")}</p>
          <button className="button button-secondary button-compact" type="button" onClick={reload}>
            {t("common.retry")}
          </button>
        </div>
      )}

      <div className="calendar-layout" hidden={Boolean(error) || isLoading} aria-busy={isLoading}>
        <div className="calendar">
          <div className="calendar-weekdays" aria-hidden="true">
            {weekdayLabels().map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="calendar-days" id="activity-calendar-days">
            {cells}
          </div>
        </div>
        <div className="calendar-summary">
          <p>
            {activeDays.size === 0
              ? t("dashboard.emptyMonth")
              : `${t("dashboard.daysCount", { n: activeDays.size })} ${t("dashboard.daysWithPracticeText")}`}
          </p>
          <div className="calendar-legend">
            <div className="legend-row">
              <span className="legend-swatch activity-active" aria-hidden="true" />{" "}
              <span>{t("dashboard.legendPracticed")}</span>
            </div>
            <div className="legend-row legend-row-muted">
              <span className="legend-swatch activity-inactive" aria-hidden="true" />{" "}
              <span>{t("dashboard.legendNone")}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
