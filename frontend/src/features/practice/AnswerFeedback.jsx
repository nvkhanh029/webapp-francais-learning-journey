import { t, useLanguage } from "../../i18n/index.js";

// Per-question answer feedback on the Result screen (FD §7.13).
//
// Everything shown here comes from the submit response: `correct`, the submitted answer, the correct
// answer and the optional `explanation` (API §17.2). The correct and incorrect states are carried by
// text and an icon as well as colour, never colour alone (FD §7.13, FD §11).
//
// The learner's own submitted answer is shaped per question type in the response, so each type renders
// its own form rather than a guessed one.
const TYPE_LABEL_KEY = {
  mcq: "practice.typeMcq",
  fill_blank: "practice.typeFill",
  ordering: "practice.typeOrdering",
};

function AnswerText({ value, question }) {
  if (value === null || value === undefined) return t("practice.reviewMissing");

  // MCQ and Fill Blank answer an item id or a text value.
  if (typeof value === "object" && "text" in value && !("items" in value)) return value.text;
  if (typeof value === "object" && "item_id" in value) {
    const chosen = (question.options ?? []).find((option) => option.item_id === value.item_id);
    return chosen?.text ?? String(value.item_id);
  }
  // Ordering submits an ordered list of pieces.
  if (typeof value === "object" && "items" in value) {
    return value.items.map((item) => item.text).join(" ");
  }
  if (Array.isArray(value)) {
    const byId = new Map((question.items ?? []).map((item) => [item.item_id, item.text]));
    return value
      .map((id) => byId.get(id))
      .filter(Boolean)
      .join(" ");
  }
  return String(value);
}

// The correct answer for a Fill Blank question arrives as a list of accepted answers.
function CorrectAnswer({ answer }) {
  if (answer && typeof answer === "object" && "accepted_answers" in answer) {
    return answer.accepted_answers.join(", ");
  }
  return <AnswerText value={answer} question={{}} />;
}

export default function AnswerFeedback({ result, index }) {
  useLanguage();

  const isCorrect = Boolean(result.correct);

  return (
    <li className={`result-item ${isCorrect ? "is-correct" : "is-incorrect"}`}>
      <div className="result-item-header">
        <div>
          <h3 className="question-number">
            {t("practice.questionNumber", { n: result.question_number ?? index + 1 })}
          </h3>
          <p className="review-type">{t(TYPE_LABEL_KEY[result.question_type] ?? "practice.typeMcq")}</p>
        </div>
        <span className="result-status">
          <span className="material-symbols-outlined icon-filled" aria-hidden="true">
            {isCorrect ? "check_circle" : "cancel"}
          </span>
          {t(isCorrect ? "practice.resultCorrect" : "practice.resultIncorrect")}
        </span>
      </div>

      <p className="result-prompt">{result.prompt}</p>

      <dl className="answer-facts">
        <div className="answer-fact">
          <dt>{t("practice.yourAnswerLabel")}</dt>
          <dd lang={result.question_type === "mcq" ? "fr" : undefined}>
            <AnswerText value={result.submitted_answer} question={result} />
          </dd>
        </div>
        <div className="answer-fact">
          <dt>{t("practice.correctAnswer")}</dt>
          <dd lang="fr">
            <CorrectAnswer answer={result.correct_answer} />
          </dd>
        </div>
      </dl>

      {result.explanation && (
        <p className="state-note explanation">
          <span className="material-symbols-outlined" aria-hidden="true">
            lightbulb
          </span>
          <span>
            <strong>{t("practice.explanation")}</strong> {result.explanation}
          </span>
        </p>
      )}
    </li>
  );
}
