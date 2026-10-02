// Behavior carried over from the raw UI prototype (dashboard-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by DashboardPage.jsx.
import { t, monthName, localeFor } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, or application structure is added here.
  // Production components receive this data from the API (API Contract §8.1, §8.2).
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Sample "today" so the May design stays intact.
      const SAMPLE_TODAY = { year: 2026, month: 5, day: 24 };

      // Shape of GET /api/v1/me/activity-calendar?year=2026&month=5.
      // Only dates with at least one completed practice are listed; no session counts.
      const SAMPLE_CALENDAR = {
          year: 2026,
          month: 5,
          active_dates: [
              "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04",
              "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08",
              "2026-05-09", "2026-05-11", "2026-05-12", "2026-05-13",
              "2026-05-14", "2026-05-15", "2026-05-16", "2026-05-17",
              "2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21",
              "2026-05-22", "2026-05-23", "2026-05-24",
          ],
      };

      /* ---------- Greeting (FD §7.7) ---------- */
      function getGreeting({ isFirstVisit, streakCurrent }) {
          if (isFirstVisit) return "Bienvenue !";
          if (streakCurrent >= 30) return "Coucou !";
          return "Bonjour !";
      }

      /* ---------- Module progress: percentages derived from learned / total ---------- */
      function renderModuleProgress(card, learned, total) {
          // Floor with integer math and clamp to 0-100: "100%" appears only when every unit is learned.
          const percent = total > 0 ? Math.min(100, Math.max(0, Math.floor((learned * 100) / total))) : 0;
          card.dataset.learned = learned;
          card.dataset.total = total;
          card.querySelector(".progress-value").textContent = `${percent}%`;
          const track = card.querySelector(".progress-track");
          track.setAttribute("aria-valuenow", String(percent));
          track.style.setProperty("--progress", `${percent}%`);
          card.querySelector(".skill-detail").textContent = t("common.lessonsOf", { learned, total, n: total });
          card.querySelector("[data-total-text]").textContent = total;
      }

      function setView(container, view) {
          container.querySelectorAll("[data-view]").forEach((element) => {
              element.hidden = element.dataset.view !== view;
          });
      }

      const content = document.querySelector("[data-dashboard-content]");
      const pageStates = document.querySelectorAll("[data-page-state]");

      function showPageState(state) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== state;
          });
          content.hidden = state !== "content";
      }

      let streakCurrent = Number(document.querySelector("[data-streak-current]").textContent);
      // Sample streak.active_today (API §8.1): true while the learner has completed a Practice today.
      let streakActiveToday = true;
      let isFirstVisit = false;
      let calendarData = SAMPLE_CALENDAR;

      document.querySelectorAll("[data-module-progress]").forEach((card) => {
          renderModuleProgress(card, Number(card.dataset.learned), Number(card.dataset.total));
      });

      if (preview === "new-learner") {
          // Mirrors the API's New Learner State. First visit is inferred from it (FD §7.7).
          isFirstVisit = true;
          streakCurrent = 0;
          streakActiveToday = false;
          document.querySelector("[data-streak-current]").textContent = "0";
          document.querySelector("[data-streak-longest]").textContent = "0";
          document.querySelectorAll("[data-module-progress]").forEach((card) => {
              renderModuleProgress(card, 0, Number(card.dataset.total));
          });
          setView(document.querySelector(".continue-card"), "empty");
          setView(document.querySelector(".mixed-card"), "empty");
          setView(document.querySelector(".review-card"), "empty");
          setView(document.querySelector(".recent-practice"), "empty");
          calendarData = { year: 2026, month: 5, active_dates: [] };
      }

      if (preview === "long-streak") {
          streakCurrent = 30;
          document.querySelector("[data-streak-current]").textContent = "30";
          document.querySelector("[data-streak-longest]").textContent = "30";
      }

      if (preview === "streak-off") {
          // Off state only: no Practice completed today (streak.active_today === false) and the current streak is 0;
          // everything else stays sample data.
          streakCurrent = 0;
          streakActiveToday = false;
          document.querySelector("[data-streak-current]").textContent = "0";
      }

      // The unit words follow the numbers (1 day / 14 days).
      function renderStreakUnits() {
          const current = Number(document.querySelector("[data-streak-current]").textContent);
          const longest = Number(document.querySelector("[data-streak-longest]").textContent);
          document.querySelector("[data-streak-unit]").textContent = t("common.daysInARow", { n: current });
          document.querySelector("[data-streak-longest-unit]").textContent = t("dashboard.recordDays", { n: longest });
      }
      renderStreakUnits();

      // The flame is lit only when streak.active_today is true (FD §7.7); never from streak.current alone, so a
      // retained run that ended yesterday shows the unlit flame.
      const STREAK_IMAGE_SRC = { on: "/images/streak-on.png", off: "/images/streak-off.png" };
      function renderStreakImage() {
          const state = streakActiveToday ? "on" : "off";
          const streakImageElement = document.querySelector("[data-streak-image]");
          streakImageElement.setAttribute("src", STREAK_IMAGE_SRC[state]);
          streakImageElement.setAttribute("alt", t(state === "on" ? "dashboard.streakAltOn" : "dashboard.streakAltOff"));
      }
      renderStreakImage();

      document.querySelector("[data-greeting]").textContent = getGreeting({ isFirstVisit, streakCurrent });

      if (preview === "loading") showPageState("loading");
      if (preview === "error") showPageState("error");
      document.querySelector('[data-action="retry-page"]').addEventListener("click", () => showPageState("content"));


      /* ---------- Practice calendar (FD §7.7) ---------- */
      const card = document.querySelector(".activity-card");
      const days = card.querySelector(".calendar-days");
      const label = card.querySelector("#calendar-month");
      const summary = card.querySelector("[data-calendar-summary]");
      const layout = card.querySelector(".calendar-layout");
      const errorState = card.querySelector('[data-calendar-state="error"]');
      const previousButton = card.querySelector("#previous-month");
      const nextButton = card.querySelector("#next-month");
      const currentMonth = SAMPLE_TODAY.year * 12 + SAMPLE_TODAY.month - 1;
      let displayedMonth = currentMonth;

      function makeCell(day, className, description, isToday) {
          const cell = document.createElement("div");
          cell.className = `calendar-day ${className}`;
          cell.title = `${isToday ? `${t("dashboard.today")}, ` : ""}${day}: ${description}`;
          cell.append(String(day));
          const hidden = document.createElement("span");
          hidden.className = "visually-hidden";
          hidden.textContent = `${isToday ? ` (${t("dashboard.today").toLowerCase()})` : ""}: ${description}`;
          cell.append(hidden);
          if (isToday) cell.setAttribute("aria-current", "date");
          return cell;
      }

      function renderMonth() {
          const year = Math.floor(displayedMonth / 12);
          const month = displayedMonth % 12;
          const firstDay = new Date(year, month, 1, 12);
          const dayCount = new Date(year, month + 1, 0, 12).getDate();
          const isCurrentMonth = displayedMonth === currentMonth;
          const hasData = calendarData.year === year && calendarData.month === month + 1;

          label.textContent = monthName(month, year);
          label.title = new Intl.DateTimeFormat(localeFor(), { month: "long", year: "numeric" }).format(firstDay);
          nextButton.disabled = isCurrentMonth;
          nextButton.title = isCurrentMonth ? t("dashboard.currentMonth") : t("dashboard.nextMonth");

          // Unique practice days of the displayed month that are not in the future. The grid and the
          // summary below both read this set, so they always agree.
          const activeDays = new Set();
          if (hasData) {
              calendarData.active_dates.forEach((date) => {
                  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
                  if (!match || Number(match[1]) !== year || Number(match[2]) !== month + 1) return;
                  const day = Number(match[3]);
                  if (day < 1 || day > dayCount) return;
                  if (isCurrentMonth && day > SAMPLE_TODAY.day) return;
                  activeDays.add(day);
              });
          }
          const fragment = document.createDocumentFragment();
          for (let day = 1; day <= dayCount; day += 1) {
              const isToday = isCurrentMonth && day === SAMPLE_TODAY.day;
              let cell;
              if (!hasData) {
                  // Prototype only: real past months come from the API.
                  cell = makeCell(day, "activity-unavailable", t("dashboard.noSample"), false);
              } else if (isCurrentMonth && day > SAMPLE_TODAY.day) {
                  cell = makeCell(day, "activity-inactive", t("dashboard.notYet"), false);
              } else {
                  const isActive = activeDays.has(day);
                  cell = makeCell(
                      day,
                      isActive ? "activity-active" : "activity-inactive",
                      isActive ? t("dashboard.practiced") : t("dashboard.noPractice"),
                      isToday
                  );
              }
              // Monday is column 1. Following dates flow into the next grid cell.
              if (day === 1) cell.style.gridColumnStart = (firstDay.getDay() + 6) % 7 + 1;
              fragment.append(cell);
          }
          days.replaceChildren(fragment);

          if (!hasData) {
              summary.textContent = t("dashboard.noSampleSummary");
          } else if (activeDays.size === 0) {
              summary.textContent = t("dashboard.emptyMonth");
          } else {
              summary.innerHTML = t("dashboard.daysWithPractice", { n: activeDays.size });
          }
      }

      function setCalendarError(hasError) {
          errorState.hidden = !hasError;
          layout.hidden = hasError;
      }

      function changeMonth(offset) {
          const candidate = displayedMonth + offset;
          if (candidate > currentMonth) return; // Never request a future month.
          displayedMonth = candidate;
          renderMonth();
      }

      previousButton.addEventListener("click", () => changeMonth(-1));
      nextButton.addEventListener("click", () => changeMonth(1));
      card.querySelector('[data-action="retry-calendar"]').addEventListener("click", () => setCalendarError(false));
      renderMonth();
      if (preview === "calendar-error") setCalendarError(true);
      /* ---------- Language change: re-render this page's copy in place ---------- */
      onLanguageChange(() => {
          renderStreakImage();
          renderStreakUnits();
          document.querySelectorAll("[data-module-progress]").forEach((moduleCard) => {
              renderModuleProgress(moduleCard, Number(moduleCard.dataset.learned), Number(moduleCard.dataset.total));
          });
          renderMonth();
      });
  })();


}
