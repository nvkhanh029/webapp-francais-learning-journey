/*
  Language Setup page (route "/setup/language"; FD §4.3.2, §7.15). For an authenticated learner whose saved
  support_language is still null: inside RequireAuth but outside RequireLanguage -> AppLayout, so it uses a
  lightweight brand-only header instead of the full app shell.

  Continue saves the choice with AuthContext.updateSupportLanguage() (PATCH /api/v1/me/preferences, API §7.1) and
  then goes to the Dashboard; a failed save shows a recoverable error with a retry button.

  One explicit choice: Vietnamese (vi) or English (en) as the SUPPORT language. French remains the target language
  (FR-LANG-03). Neither option is preselected, and the vi read-time fallback (FR-LANG-07) is never presented as an
  already-saved choice: Continue without a selection shows a validation message.

  Preview states (UI review aid), via the URL query string:
    ?preview=validation      no selection, Continue pressed: validation error
    ?preview=server-error    save failed after a valid selection: recoverable error
    ?preview=submitting      pending submit state (selection already made)
*/
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { SubmitButton } from "../features/auth/AuthFormParts.jsx";
import { ApiError } from "../api/apiClient.js";
import { rateLimitMessage } from "../features/auth/useRateLimit.js";
import useAuth from "../hooks/useAuth.js";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./LanguageSetupPage.module.css";

const OPTIONS = [
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "English" },
];

function initialState(preview) {
  return {
    selected: preview === "server-error" ? "vi" : preview === "submitting" ? "en" : null,
    error: preview === "validation" ? "validation" : preview === "server-error" ? "server" : null,
    submitting: preview === "submitting",
  };
}

export default function LanguageSetupPage() {
  useLanguage();
  useDocumentTitle("title.languageSetup");
  const { updateSupportLanguage } = useAuth();
  const navigate = useNavigate();
  const preview = useSearchParams()[0].get("preview");
  const [initial] = useState(() => initialState(preview));
  const [selected, setSelected] = useState(initial.selected);
  // error: null, "validation" (nothing selected) or "server" (the save failed).
  const [error, setError] = useState(initial.error);
  const [submitting, setSubmitting] = useState(initial.submitting);
  // Set when the save was answered with 429: its message replaces the generic save-error text.
  const [rateLimit, setRateLimit] = useState(null);
  const optionRefs = useRef([]);

  function select(index, { moveFocus = false } = {}) {
    setSelected(OPTIONS[index].code);
    setError(null); // Selecting a language clears a prior message.
    if (moveFocus) optionRefs.current[index].focus();
  }

  function handleKeyDown(event, index) {
    const last = OPTIONS.length - 1;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      select(index);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      select(index === last ? 0 : index + 1, { moveFocus: true });
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      select(index === 0 ? last : index - 1, { moveFocus: true });
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!selected) {
      setError("validation");
      optionRefs.current[0].focus();
      return;
    }
    setError(null);
    setRateLimit(null);
    setSubmitting(true);
    try {
      await updateSupportLanguage(selected);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      // Any failure keeps the learner here with their choice intact. A 401 also clears the session, and the route
      // guard then sends the learner to Login.
      if (error instanceof ApiError && error.isRateLimited) setRateLimit(rateLimitMessage(error.retryAfterSeconds));
      setError("server");
      setSubmitting(false);
    }
  }

  return (
    <div className={`app-page ${styles.page}`}>
      {/* Header: brand only (no auth links, no authenticated app chrome). */}
      <header className="site-header">
        <div className="page-container header-content">
          <span className="brand">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />{" "}
            <span className="brand-name">Français Learning Journey</span>
          </span>
        </div>
      </header>
      <main className="setup-main" id="main-content">
        <div className="page-container setup-layout">
          <div className="card setup-card">
            <div className="setup-heading">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">translate</span>
              </div>
              <h1 className="setup-title" id="setup-title">
                {t("setup.title")}
              </h1>
              <p className="setup-lead">{t("setup.text")}</p>
            </div>
            {/* Form-level error: no selection on submit, or a failed save. */}
            <div className="form-alert setup-alert" id="form-error" role="alert" hidden={!error}>
              <span className="material-symbols-outlined" aria-hidden="true">
                error
              </span>
              <div>
                <span className="form-alert-title">{error && t(`setup.${error}Title`)}</span>{" "}
                <span>
                  {error === "server" && rateLimit
                    ? t(rateLimit.key, rateLimit.params)
                    : error && t(`setup.${error}Text`)}
                </span>
                <div className="form-alert-actions" hidden={error !== "server"}>
                  <button className="button-retry" type="button" onClick={handleSubmit}>
                    {t("common.retry")}
                  </button>
                </div>
              </div>
            </div>
            {/* Single-selection radiogroup with roving tabindex. Neither option is preselected (no silent
                default); vi/en carry equal visual weight until chosen. */}
            <fieldset className="language-group">
              <legend className="visually-hidden" id="language-group-label">
                {t("common.supportLanguage")}
              </legend>
              <div
                className="language-grid"
                role="radiogroup"
                aria-labelledby="language-group-label"
                aria-describedby="form-error"
                id="language-options"
              >
                {OPTIONS.map((option, index) => {
                  const isSelected = selected === option.code;
                  return (
                    <div
                      key={option.code}
                      className="language-option"
                      data-lang={option.code}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected || (selected === null && index === 0) ? 0 : -1}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      onClick={() => select(index)}
                      onKeyDown={(event) => handleKeyDown(event, index)}
                    >
                      <div className="language-option-header">
                        <span className="radio-indicator" aria-hidden="true">
                          <span className="material-symbols-outlined">check</span>
                        </span>
                        <p className="language-name">{option.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
            {/* Not disabled by default: an unselected Continue press shows the validation message instead of
                silently doing nothing. */}
            <div className="setup-actions">
              <SubmitButton
                id="setup-submit"
                type="button"
                className=""
                icon="chevron_right"
                submitting={submitting}
                label={t("setup.submit")}
                submittingLabel={t("setup.submitting")}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <div className="page-container footer-content">
          <span className="material-symbols-outlined" aria-hidden="true">
            auto_stories
          </span>{" "}
          <span>{t("common.footer")}</span>
        </div>
      </footer>
    </div>
  );
}
