import { t, useLanguage } from "../../i18n/index.js";

// The Practice / Mixed Practice page header (FD §5.4.7, FD §7.12): source unit or Mixed Practice, the
// session intro, answered-question progress, and the stepper that jumps between questions.
//
// The subject class comes from the real `unit_type` of a normal run; Mixed Practice has no single
// learning unit (API §16.1) and keeps the mixed accent. Nothing here is hard-wired to one module.
//
// The progress bar counts answered questions rather than showing a percentage, because during Practice
// the meaningful quantity is how many questions are done out of the run's own total.
export default function PracticeHeader({
  title,
  description,
  icon,
  subjectClass,
  totalQuestions,
  answeredIds,
  currentIndex,
  onJumpTo,
  children,
}) {
  useLanguage();

  const answeredCount = answeredIds.length;
  const percent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <section className="card practice-header">
      <div className="practice-heading">
        <div className={`icon-tile icon-tile-solid ${subjectClass}`} aria-hidden="true">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="practice-heading-text">
          <h1 className="practice-title">{title}</h1>
          {description && <p className="practice-description">{description}</p>}
        </div>
      </div>

      <div className="practice-progress">
        <div className="progress-labels">
          <span>{t("practice.answered")}</span>
          <span className="progress-value">
            {t("practice.answeredCount", { answered: answeredCount, total: totalQuestions })}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={t("practice.answered")}
          aria-valuemin="0"
          aria-valuemax={totalQuestions}
          aria-valuenow={answeredCount}
          style={{ "--progress": `${percent}%` }}
        >
          <div className="progress-fill" />
        </div>
      </div>

      <nav className="stepper-row" aria-label={t("practice.questionList")}>
        <ol className="stepper">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const isAnswered = answeredIds.includes(index);
            const isCurrent = index === currentIndex;
            return (
              <li key={index}>
                <button
                  className={`step${isAnswered ? " is-answered" : ""}`}
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => onJumpTo(index)}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  {isAnswered && (
                    <span className="material-symbols-outlined" aria-hidden="true">
                      check
                    </span>
                  )}
                  <span className="visually-hidden">
                    {t("practice.stepLabel", {
                      n: index + 1,
                      state: t(isAnswered ? "practice.answeredState" : "practice.unansweredState"),
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <button
          className="button button-secondary button-compact finish-button"
          type="button"
          onClick={() => onJumpTo(totalQuestions - 1)}
        >
          <span>{t("practice.finish")}</span>
          <span className="material-symbols-outlined" aria-hidden="true">
            flag
          </span>
        </button>
      </nav>
      {children}
    </section>
  );
}
