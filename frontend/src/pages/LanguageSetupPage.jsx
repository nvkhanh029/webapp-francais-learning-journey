/*
  First-time Language Setup (route "/setup/language", authenticated, language not yet saved).

  Data:
  - Saving goes through AuthContext.updateSupportLanguage() -> PATCH /api/v1/me/preferences
    { support_language } (API Contract §7.1). Only "vi" and "en" are accepted; the backend returns
    `invalid_value` or `required` otherwise (§7.1).
  - A newly registered learner starts with support_language = null and is routed here (FR-LANG-02,
    API §6.1). Once a value is saved, RequireLanguage lets them through to the application.
  - Neither option is preselected: there is no silent default, so pressing Continue with no choice
    shows the validation message (FD §7.15).
  - This route deliberately sits outside RequireLanguage so it cannot redirect to itself (FD §4.3.2).
*/
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./LanguageSetupPage.module.css";

const OPTIONS = [
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "English" },
];

export default function LanguageSetupPage() {
  useLanguage();

  // The document title follows the shared language state.
  useEffect(() => {
    document.title = t("title.languageSetup");
  });
  const { updateSupportLanguage } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!selected) {
      setError({ title: t("setup.validationTitle"), text: t("setup.validationText") });
      return;
    }
    setSubmitting(true);
    try {
      await updateSupportLanguage(selected);
      navigate("/dashboard", { replace: true });
    } catch {
      // The saved preference is unchanged, so the learner stays here and can retry (FD §7.15).
      setError({ title: t("setup.serverTitle"), text: t("setup.serverText"), retryable: true });
    } finally {
      setSubmitting(false);
    }
  };

  // Arrow keys move between the two options and select, matching a radiogroup.
  const onKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : OPTIONS.length - 1;
    const next = (index + step) % OPTIONS.length;
    setSelected(OPTIONS[next].code);
    event.currentTarget.parentElement?.children[next]?.focus();
  };

  return (
    <div className={`page-body ${styles.page}`}>
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

            {error && (
              <div className="form-alert setup-alert" id="form-error" role="alert">
                <span className="material-symbols-outlined" aria-hidden="true">
                  error
                </span>
                <div>
                  <span className="form-alert-title">{error.title}</span> <span>{error.text}</span>
                  {error.retryable && (
                    <div className="form-alert-actions">
                      <button className="button-retry" type="button" onClick={onSubmit}>
                        {t("common.retry")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <fieldset className="language-group">
              <legend className="visually-hidden" id="language-group-label">
                {t("common.supportLanguage")}
              </legend>
              <div
                className="language-grid"
                role="radiogroup"
                aria-labelledby="language-group-label"
                aria-describedby={error ? "form-error" : undefined}
                id="language-options"
              >
                {OPTIONS.map((option, index) => {
                  const isSelected = selected === option.code;
                  return (
                    <div
                      className="language-option"
                      key={option.code}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected || (selected === null && index === 0) ? 0 : -1}
                      onClick={() => setSelected(option.code)}
                      onKeyDown={(event) => onKeyDown(event, index)}
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

            <div className="setup-actions">
              <button
                className="button button-primary"
                id="setup-submit"
                type="button"
                aria-busy={isSubmitting}
                onClick={onSubmit}
              >
                <span>{isSubmitting ? t("setup.submitting") : t("setup.submit")}</span>{" "}
                <span className="material-symbols-outlined" aria-hidden="true">
                  chevron_right
                </span>{" "}
                <span className="button-spinner" aria-hidden="true" hidden={!isSubmitting} />
              </button>
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
