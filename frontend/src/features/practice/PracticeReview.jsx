import { t, useLanguage } from "../../i18n/index.js";
import { practiceErrorKeys } from "./practiceErrors.js";

// The review phase (FD §7.12): every answer listed with its question, with an edit action per question.
//
// The learner can review and change answers freely before final submission (API §17), which is exactly
// what this phase is for: nothing here is final, and the answers shown are the ones that will be sent.
// Correct answers are never shown at this stage (API §14, FD §7.12).
export default function PracticeReview({ questions, answers, onEdit, submitError }) {
  useLanguage();

  // The learner's own answer rendered as readable text per question type (FD §7.12).
  const answerText = (question) => {
    const answer = answers[question.question_id];
    if (!answer) return t("practice.reviewMissing");
    if (question.question_type === "mcq") {
      const chosen = (question.options ?? []).find((option) => option.item_id === answer.item_id);
      return chosen?.text ?? t("practice.reviewMissing");
    }
    if (question.question_type === "fill_blank") return answer.text;
    const byId = new Map((question.items ?? []).map((item) => [item.item_id, item.text]));
    return (answer.item_ids ?? [])
      .map((id) => byId.get(id))
      .filter(Boolean)
      .join(" ");
  };

  // incomplete_practice has its own wording; any other rejection keeps the generic one (API §17.5).
  const specificError = practiceErrorKeys(submitError);

  const typeLabel = { mcq: "practice.typeMcq", fill_blank: "practice.typeFill", ordering: "practice.typeOrdering" };

  return (
    <section className="practice-section">
      <div className="card">
        <div className="card-heading">
          <div className="icon-tile" aria-hidden="true">
            <span className="material-symbols-outlined">fact_check</span>
          </div>
          <div>
            <h2 className="section-title">{t("practice.reviewAnswers")}</h2>
            <p className="card-subtitle">{t("practice.reviewHint")}</p>
          </div>
        </div>

        <p className="state-note review-note">
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>{" "}
          <span>{t("practice.submitNote")}</span>
        </p>

        {/* A rejected submission keeps the answers and offers a retry rather than losing the work. */}
        {submitError && (
          <div className="state-note state-note-danger submit-error" role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>
            <div className="state-note-body">
              <strong>{t(specificError ? specificError.titleKey : "practice.submitErrorTitle")}</strong>
              <p>{t(specificError ? specificError.textKey : "practice.submitErrorText")}</p>
            </div>
          </div>
        )}

        <ol className="review-list">
          {questions.map((question, index) => (
            <li className="review-item" key={question.question_id}>
              <p className="review-type">
                {t("practice.reviewTypeLine", {
                  n: index + 1,
                  type: t(typeLabel[question.question_type] ?? "practice.typeMcq"),
                })}
              </p>
              <p className="review-prompt">{question.prompt}</p>
              <p className="review-answer">
                <span className="visually-hidden">{t("practice.reviewYourAnswer")} </span>
                <span lang={question.question_type === "mcq" ? "fr" : undefined}>{answerText(question)}</span>
              </p>
              <button className="button button-secondary button-compact" type="button" onClick={() => onEdit(index)}>
                <span>{t("practice.edit")}</span>
                <span className="visually-hidden">{t("practice.reviewActionContext", { n: index + 1 })}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
