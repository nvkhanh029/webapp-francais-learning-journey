import { t, useLanguage } from "../../i18n/index.js";

// The Dashboard greeting (FD §5.4.2, FD §7.7).
//
// The salutation is French, is never translated, and is marked lang="fr" (FD §9.4). Which one is
// shown is derived from Dashboard data only: the API exposes no first-visit field and gets none,
// so a first visit is `progress.*.learned` summing to 0 together with `streak.longest === 0`
// (API §8.1). A 30-day streak wins when it applies (FD §7.7).
const SALUTATIONS = {
  longStreak: "Coucou !",
  firstVisit: "Bienvenue !",
  returning: "Bonjour !",
};

const LONGEST_STREAK_THRESHOLD = 30;

export function greetingFor({ isFirstVisit, streakCurrent }) {
  if (streakCurrent >= LONGEST_STREAK_THRESHOLD) return SALUTATIONS.longStreak;
  if (isFirstVisit) return SALUTATIONS.firstVisit;
  return SALUTATIONS.returning;
}

// First visit: nothing learned in any module and no historical streak at all.
export function isFirstVisit({ progress, streak }) {
  const learned = ["vocabulary", "grammar", "conjugation"].reduce(
    (total, module) => total + (progress?.[module]?.learned ?? 0),
    0,
  );
  return learned === 0 && streak?.longest === 0;
}

export default function DashboardGreeting({ progress, streak }) {
  useLanguage();

  const salutation = greetingFor({
    isFirstVisit: isFirstVisit({ progress, streak }),
    streakCurrent: streak?.current ?? 0,
  });

  return (
    <section className="welcome dashboard-section" aria-labelledby="welcome-title">
      <h1 className="welcome-title" id="welcome-title">
        <span lang="fr">{salutation}</span> <span aria-hidden="true">✨</span>
      </h1>
      <p className="welcome-description">{t("dashboard.welcome")}</p>
    </section>
  );
}
