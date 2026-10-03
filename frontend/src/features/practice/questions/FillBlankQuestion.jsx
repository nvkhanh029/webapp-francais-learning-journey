import { useState } from "react";

import { t, useLanguage } from "../../../i18n/index.js";

// Fill in the Blank (FD §5.4.7, FD §7.12, API §14.2).
//
// The answer is the typed text, which is what the contract expects on submit (API §17.1). No accepted
// answers are exposed at this stage (API §14.2).
//
// The French character buttons are an input convenience for the accented vowels and ligatures the
// target language needs (FD §7.4 lists the diacritics that must be typeable). They insert at the caret
// rather than appending, and each carries an accessible name.
const FRENCH_CHARS = ["é", "è", "ê", "à", "â", "ç", "î", "ô", "œ"];

export default function FillBlankQuestion({ question, answer, onAnswer, onInvalid }) {
  useLanguage();
  const [touched, setTouched] = useState(false);
  const value = answer?.text ?? "";
  const showError = touched && value.trim() === "";

  const insert = (character) => {
    const next = `${value}${character}`;
    onAnswer({ text: next });
    onInvalid?.(false);
  };

  return (
    <div>
      <label className="field-label" htmlFor={`fill-${question.question_id}`}>
        {t("practice.yourAnswerLabel")}
      </label>
      <input
        className="text-input"
        id={`fill-${question.question_id}`}
        type="text"
        lang="fr"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
        placeholder={t("practice.typeInFrench")}
        value={value}
        aria-describedby={`prompt fill-error-${question.question_id}`}
        aria-invalid={showError || undefined}
        onChange={(event) => {
          onAnswer({ text: event.target.value });
          setTouched(true);
        }}
      />
      <p className="field-error" id={`fill-error-${question.question_id}`} hidden={!showError}>
        <span className="material-symbols-outlined" aria-hidden="true">
          error
        </span>
        {t("practice.fillEmptyError")}
      </p>

      <div className="char-helper" role="group" aria-label={t("practice.frenchChars")}>
        <p className="char-helper-label">{t("practice.frenchChars")}</p>
        <div className="char-list">
          {FRENCH_CHARS.map((character) => (
            <button
              className="char-button"
              key={character}
              type="button"
              lang="fr"
              aria-label={t("practice.insertChar", { char: character })}
              onClick={() => insert(character)}
            >
              {character}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
