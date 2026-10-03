import { t, useLanguage } from "../../i18n/index.js";

// The streak card (FD §5.4.2, FD §7.7): current streak, the longest-streak badge and the tip that
// explains which activity keeps the streak.
//
// The flame is lit only when `streak.active_today` is true. It is never lit from `streak.current`
// alone, because a run retained from yesterday is not active today (FD §7.7, API §8.1). The
// `alt` text is the text alternative for the illustration and changes with the state.
const STREAK_IMAGE = {
  on: { src: "/images/streak-on.png", altKey: "dashboard.streakAltOn" },
  off: { src: "/images/streak-off.png", altKey: "dashboard.streakAltOff" },
};

export default function StreakCard({ streak }) {
  useLanguage();

  const current = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  const image = streak?.active_today ? STREAK_IMAGE.on : STREAK_IMAGE.off;

  return (
    <article className="card streak-card" aria-labelledby="streak-title">
      <h2 className="visually-hidden" id="streak-title">
        {t("landing.trackStreak")}
      </h2>
      <div className="streak-illustration">
        <img alt={t(image.altKey)} src={image.src} />
      </div>
      <div>
        <p className="streak-count">
          <span>{current}</span> <span>{t("common.daysInARow", { n: current })}</span>
        </p>
        <p className="badge streak-record">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            military_tech
          </span>{" "}
          <span>
            {t("dashboard.record")} {longest} {t("dashboard.recordDays", { n: longest })}
          </span>
        </p>
      </div>
      <div className="streak-divider" aria-hidden="true" />
      <div className="streak-tip">
        <span className="material-symbols-outlined" aria-hidden="true">
          tips_and_updates
        </span>
        <p>
          <span>{t("dashboard.tip")}</span> {t("dashboard.tipText")}
        </p>
      </div>
    </article>
  );
}
