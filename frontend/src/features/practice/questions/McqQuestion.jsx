import { t, useLanguage } from "../../../i18n/index.js";

// Multiple Choice (FD §5.4.7, FD §7.12, API §14.1).
//
// Native radios inside a fieldset: arrow keys move the selection and Space selects, with no custom key
// handling. Each option is a large card with a letter badge and a selected-state check mark, and the
// selected state is carried by more than colour (FD §11).
//
// The answer is the option's `item_id`, which is what the contract expects on submit (API §17.1).
// `is_correct` is never present at this stage: the Start response must not expose it (API §14.1).
export default function McqQuestion({ question, answer, onAnswer }) {
  useLanguage();

  return (
    <fieldset className="option-list" aria-describedby="prompt">
      <legend className="visually-hidden">{t("practice.optionsLegend", { n: question.question_number })}</legend>
      {(question.options ?? []).map((option, index) => {
        const selected = answer?.item_id === option.item_id;
        return (
          <label className="option" key={option.item_id}>
            <input
              type="radio"
              name={`question-${question.question_id}`}
              value={option.item_id}
              checked={selected}
              onChange={() => onAnswer({ item_id: option.item_id })}
            />
            <span className="option-box">
              <span className="option-letter" aria-hidden="true">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text" lang="fr">
                {option.text}
              </span>
              <span className="option-check" aria-hidden="true">
                <span className="material-symbols-outlined">check</span>
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
