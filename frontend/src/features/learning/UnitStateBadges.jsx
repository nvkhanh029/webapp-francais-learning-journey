import { t, useLanguage } from "../../i18n/index.js";

// The Learned / Review Later badge pair for one learning unit (FD §7.6).
//
// Review Later has priority over Learned: it is listed first and keeps the stronger styling. When a
// unit is both learned and saved, the Learned badge drops to the quiet outline variant so the two
// badges do not compete. The rule is identical on all three modules — the Grammar lesson list, the
// Vocabulary Topic Study Unit list and the Conjugation lesson list.
//
// Both badges are text + icon + colour, never colour alone (FD §11). `size` picks the compact list
// form used inside a browse list.
export default function UnitStateBadges({ learned, reviewLater, className = "state-badges", label }) {
  useLanguage();
  const showAny = learned || reviewLater;

  if (!showAny) return null;

  return (
    <ul className={className} aria-label={label ?? t("common.lessonStatus")}>
      {reviewLater && (
        <li className="badge badge-review">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            bookmark
          </span>{" "}
          <span>{t("common.reviewLater")}</span>
        </li>
      )}
      {learned && (
        <li className={`badge badge-learned${reviewLater ? " badge-quiet" : ""}`}>
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            check_circle
          </span>{" "}
          <span>{t("common.learned")}</span>
        </li>
      )}
    </ul>
  );
}
