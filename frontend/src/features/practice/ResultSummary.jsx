import { t, useLanguage } from "../../i18n/index.js";

// The result summary block (FD §7.13).
//
// Reads the submit response exactly as the contract defines it: the counts are `correct_count` and
// `total_questions`, the per-question verdict is `correct`, the list is `results[]`, and the overall
// `accuracy` is a number the UI rounds to a whole percent for display (API §17.2, FD §7.13). The
// frontend never recomputes the score and never requests a different field name (FD §13.17).
//
// The result is presented as encouraging and informative rather than pass/fail, because Practice does
// not gate progress or access (Requirements §8.3, FD §7.13).
export default function ResultSummary({ result }) {
  useLanguage();

  const correct = result.correct_count ?? 0;
  const total = result.total_questions ?? 0;
  // The API returns `accuracy`; display rounds it to a whole percent (FD §7.7, FD §7.13).
  const percent = Math.round(result.accuracy ?? 0);

  return (
    <div className="card result-summary">
      <div className="card-heading">
        <div className="icon-tile" aria-hidden="true">
          <span className="material-symbols-outlined">celebration</span>
        </div>
        <div>
          <h2 className="section-title">{t("practice.resultTitle")}</h2>
          <p className="card-subtitle">{t("practice.resultText")}</p>
        </div>
      </div>

      <div>
        <p className="result-score">
          <span className="result-count">{percent}%</span>{" "}
          <span className="result-count-label">{t("practice.scoreSummary", { correct, total })}</span>
        </p>
        <p className="visually-hidden">{t("practice.accuracy")}</p>
      </div>
    </div>
  );
}
