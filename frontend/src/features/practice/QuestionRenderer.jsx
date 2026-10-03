import { Fragment } from "react";

import { t, useLanguage } from "../../i18n/index.js";
import FillBlankQuestion from "./questions/FillBlankQuestion.jsx";
import McqQuestion from "./questions/McqQuestion.jsx";
import OrderingQuestion from "./questions/OrderingQuestion.jsx";

// Selects the answer UI by `question_type` (FD §5.4.7).
//
// Keeping the choice here rather than inside the Practice page means a new question type is added in
// one place instead of rewriting the Practice screen. The three supported types are mcq, fill_blank
// and ordering (API §14).
const RENDERERS = {
  mcq: McqQuestion,
  fill_blank: FillBlankQuestion,
  ordering: OrderingQuestion,
};

const INSTRUCTION_KEY = {
  mcq: "practice.instructionMcq",
  fill_blank: "practice.instructionFill",
  ordering: "practice.instructionOrdering",
};

const TYPE_LABEL_KEY = {
  mcq: "practice.typeMcq",
  fill_blank: "practice.typeFill",
  ordering: "practice.typeOrdering",
};

const BLANK_RUN = /_{2,}/g;

// The authored prompt marks the gap with a run of underscores. Rendering it as a real element gives
// the blank a visible slot and a text alternative, without enabling raw HTML in content (FD §9.3): the
// text is split here and composed as React children, never injected as markup.
function Prompt({ prompt }) {
  const parts = String(prompt ?? "").split(BLANK_RUN);
  return (
    <p className="question-prompt" id="prompt">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span className="blank" key={index}>
            <span className="visually-hidden">{t("practice.blank")}</span>
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </p>
  );
}

// One question card: heading, type badge, the single localized prompt, then the type-specific answer
// UI (FD §7.12).
//
// Every question type exposes exactly one localized `prompt` (API §14). For an Ordering question that
// prompt is an instruction and the contract carries no native-language source sentence, so none is
// shown or invented (FD §7.12, documented limitation).
export default function QuestionRenderer({ question, index, total, answer, onAnswer, onInvalid }) {
  useLanguage();

  const Renderer = RENDERERS[question.question_type];
  if (!Renderer) return null;

  return (
    <article className="card question-card" aria-labelledby="question-number">
      <div className="question-meta">
        <h2 className="question-number" id="question-number">
          {t("practice.questionOf", { n: index + 1, total })}
        </h2>
        <span className="badge">{t(TYPE_LABEL_KEY[question.question_type])}</span>
      </div>
      <p className="question-instruction">{t(INSTRUCTION_KEY[question.question_type])}</p>
      <div className="answer-area">
        <Prompt prompt={question.prompt} />
        <Renderer question={question} answer={answer} onAnswer={onAnswer} onInvalid={onInvalid} />
      </div>
    </article>
  );
}
