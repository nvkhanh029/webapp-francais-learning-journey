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
      <p className="review-type">
        {t("practice.reviewTypeLine", {
          n: result.question_number ?? index + 1,
          type: t(TYPE_LABEL_KEY[result.question_type] ?? "practice.typeMcq"),
        })}
      </p>
      <p className="review-prompt">{result.prompt}</p>

      <div className="feedback-row">
        <span className="badge">
          <span className="material-symbols-outlined" aria-hidden="true">
            {isCorrect ? "check_circle" : "cancel"}
          </span>{" "}
          <span>{t(isCorrect ? "practice.resultCorrect" : "practice.resultIncorrect")}</span>
        </span>
      </div>

      <p className="feedback-answer">
        <span className="visually-hidden">{t("practice.reviewYourAnswer")} </span>
        <span lang={result.question_type === "mcq" ? "fr" : undefined}>
          <AnswerText value={result.submitted_answer} question={result} />
        </span>
      </p>

      {!isCorrect && (
        <p className="feedback-correct">
          <span className="visually-hidden">{t("practice.correctAnswer")} </span>
          <CorrectAnswer answer={result.correct_answer} />
        </p>
      )}

      {result.explanation && (
        <p className="feedback-explanation">
          <strong>{t("practice.explanation")}</strong> {result.explanation}
        </p>
      )}
    </li>
  );
}
