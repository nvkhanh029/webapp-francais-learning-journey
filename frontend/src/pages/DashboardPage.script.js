// Behavior carried over from the raw UI prototype (dashboard-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by DashboardPage.jsx.
export default function init() {
  // UI preview only. No fetching, authentication, or application structure is added here.
  // Production components receive this data from the API (API Contract §8.1, §8.2).
  (() => {
      const locale = document.documentElement.lang.startsWith("en") ? "en-US" : "vi-VN";
      const isEnglish = locale === "en-US";
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const COPY = isEnglish
          ? {
              currentMonth: "This is the current month",
              nextMonth: "Next month",
              today: "Today",
              practiced: "practiced",
              noPractice: "no practice",
              notYet: "not yet",
              daysWithPractice: (n) => `<span>${n} day${n === 1 ? "" : "s"}</span> with practice this month.`,
              emptyMonth: "No practice days this month yet.",
              noSample: "No sample data for this month",
              noSampleSummary: "This prototype has no sample data for this month.",
              menuOpen: "Close navigation menu",
              menuClosed: "Navigation menu",
          }
          : {
              currentMonth: "Đây là tháng hiện tại",
              nextMonth: "Tháng sau",
              today: "Hôm nay",
              practiced: "đã luyện tập",
              noPractice: "chưa luyện tập",
              notYet: "chưa tới",
              daysWithPractice: (n) => `<span>${n} ngày</span> có luyện tập trong tháng này.`,
              emptyMonth: "Chưa có ngày luyện tập nào trong tháng này.",
              noSample: "chưa có dữ liệu mẫu",
              noSampleSummary: "Bản mẫu chưa có dữ liệu cho tháng này.",
              menuOpen: "Đóng menu điều hướng",
              menuClosed: "Menu điều hướng",
          };

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
          const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
          card.dataset.learned = learned;
          card.dataset.total = total;
          card.querySelector(".progress-value").textContent = `${percent}%`;
          const track = card.querySelector(".progress-track");
          track.setAttribute("aria-valuenow", String(percent));
          track.style.setProperty("--progress", `${percent}%`);
          card.querySelector(".skill-detail").textContent = `${learned}/${total} bài`;
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
      let isFirstVisit = false;
      let calendarData = SAMPLE_CALENDAR;

      document.querySelectorAll("[data-module-progress]").forEach((card) => {
          renderModuleProgress(card, Number(card.dataset.learned), Number(card.dataset.total));
      });

      if (preview === "new-learner") {
          // Mirrors the API's New Learner State. First visit is inferred from it (FD §7.7).
          isFirstVisit = true;
          streakCurrent = 0;
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

      document.querySelector("[data-greeting]").textContent = getGreeting({ isFirstVisit, streakCurrent });

      if (preview === "loading") showPageState("loading");
      if (preview === "error") showPageState("error");
      document.querySelector('[data-action="retry-page"]').addEventListener("click", () => showPageState("content"));

      /* ---------- Compact navigation menu (FD §8.5) ---------- */
      const menuButton = document.querySelector(".menu-button");
      const mobileNav = document.getElementById("mobile-nav");
      const menuIcon = menuButton.querySelector(".material-symbols-outlined");

      function setMenu(open) {
          menuButton.setAttribute("aria-expanded", String(open));
          menuButton.setAttribute("aria-label", open ? COPY.menuOpen : COPY.menuClosed);
          menuIcon.textContent = open ? "close" : "menu";
          mobileNav.hidden = !open;
      }

      menuButton.addEventListener("click", () => setMenu(mobileNav.hidden));
      mobileNav.addEventListener("click", (event) => {
          if (event.target.closest("a")) setMenu(false);
      });
      document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && !mobileNav.hidden) {
              setMenu(false);
              menuButton.focus();
          }
      });
      window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
          if (event.matches) setMenu(false);
      });

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

      function capitalize(text) {
          return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
      }

      function makeCell(day, className, description, isToday) {
          const cell = document.createElement("div");
          cell.className = `calendar-day ${className}`;
          cell.title = `${isToday ? `${COPY.today}, ` : ""}${day}: ${description}`;
          cell.append(String(day));
          const hidden = document.createElement("span");
          hidden.className = "visually-hidden";
          hidden.textContent = `${isToday ? ` (${COPY.today.toLowerCase()})` : ""}: ${description}`;
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

          label.textContent = capitalize(new Intl.DateTimeFormat(locale, { month: "long" }).format(firstDay));
          label.title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(firstDay);
          nextButton.disabled = isCurrentMonth;
          nextButton.title = isCurrentMonth ? COPY.currentMonth : COPY.nextMonth;

          const activeDays = new Set(
              hasData ? calendarData.active_dates.map((date) => Number(date.slice(8, 10))) : []
          );
          const fragment = document.createDocumentFragment();
          for (let day = 1; day <= dayCount; day += 1) {
              const isToday = isCurrentMonth && day === SAMPLE_TODAY.day;
              let cell;
              if (!hasData) {
                  // Prototype only: real past months come from the API.
                  cell = makeCell(day, "activity-unavailable", COPY.noSample, false);
              } else if (isCurrentMonth && day > SAMPLE_TODAY.day) {
                  cell = makeCell(day, "activity-inactive", COPY.notYet, false);
              } else {
                  const isActive = activeDays.has(day);
                  cell = makeCell(
                      day,
                      isActive ? "activity-active" : "activity-inactive",
                      isActive ? COPY.practiced : COPY.noPractice,
                      isToday
                  );
              }
              // Monday is column 1. Following dates flow into the next grid cell.
              if (day === 1) cell.style.gridColumnStart = (firstDay.getDay() + 6) % 7 + 1;
              fragment.append(cell);
          }
          days.replaceChildren(fragment);

          if (!hasData) {
              summary.textContent = COPY.noSampleSummary;
          } else if (calendarData.active_dates.length === 0) {
              summary.textContent = COPY.emptyMonth;
          } else {
              summary.innerHTML = COPY.daysWithPractice(calendarData.active_dates.length);
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
  })();


}
