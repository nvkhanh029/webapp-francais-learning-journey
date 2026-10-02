/*
 Fonts and original illustrations still require an internet connection. -->
    <link href="https://fonts.googleapis.com" rel="preconnect">
    <link href="https://fonts.gstatic.com" crossorigin="" rel="preconnect">
    <link
        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&amp;display=swap"
        rel="stylesheet">
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet">
    <link
        href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,300..800;1,6..12,300..800&amp;display=swap"
        rel="stylesheet">

    <!--
      Static LanguageSetupPage prototype (route "/setup/language"), refined from a raw Stitch
      draft into the visual/interaction baseline established by DashboardPage, LoginPage,
      RegisterPage and LandingPage, per frontend-design.md (FD) §7.15 and
      claude/stitch-ui-guidelines.md. Plain CSS, no build step.

      Route/access (FD §4.3.2):
      - Authenticated learner whose saved support_language is still null. Inside RequireAuth but
        OUTSIDE RequireLanguage -> AppLayout, so this page intentionally does NOT use the full
        authenticated app shell (no Dashboard nav, no VI/EN language switcher, no logout). It uses
        a lightweight brand-only header, matching the public auth pages rather than the Dashboard.

      Scope:
      - One explicit choice: Vietnamese (vi) or English (en) as the SUPPORT language for
        interface/explanations. French remains the target language at all times (FR-LANG-03).
        No proficiency level, goals, schedule, or any other onboarding field (out of MVP scope).
      - No silent default. Neither option is preselected, and the vi read-time fallback
        (FR-LANG-07) is never presented as an already-saved choice. Continuing without a
        selection shows a validation message instead of proceeding.
      - No API request. The submit handler validates the selection and marks the integration
        point for PATCH /api/v1/me/preferences (API Contract §7.1). Routing after a successful
        save belongs to the app routing/integration layer (not implemented here).
      - Links use href="#" with the target React route in data-route (FD §4.2). data-route on the
        submit action is a placeholder for the post-setup destination, kept as a placeholder
        per the source Stitch draft's routing convention.

      Preview states (prototype only), via the URL query string:
        ?preview=validation      no selection, Continue pressed: validation error
        ?preview=server-error    PATCH failed after a valid selection: recoverable error
        ?preview=submitting      pending submit state (selection already made)

      Page-specific values (no shared token applies) are marked "Setup-only" below.

      Page sections:
      1. Header (brand only — no auth links, no authenticated app chrome)
      2. Setup card: eyebrow, heading, description, error banner, language choice, info note, submit
      3. Footer
*/
import styles from "./LanguageSetupPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./LanguageSetupPage.script.js";

export default function LanguageSetupPage() {
  const rootRef = usePageScript(init, { title: "title.languageSetup" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header: brand only (see the note in section 3 of the stylesheet above). */}
      <header className="site-header">
        <div className="page-container header-content">
          <span className="brand">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />
            {" "}
            <span className="brand-name">
              Français Learning Journey
            </span>
          </span>
        </div>
      </header>
      <main className="setup-main" id="main-content">
        <div className="page-container setup-layout">
          {/* 2. Setup card */}
          <div className="card setup-card">
            <div className="setup-heading">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">
                  translate
                </span>
              </div>
              <h1 className="setup-title" id="setup-title">
                {t("setup.title")}
              </h1>
              <p className="setup-lead">
                {t("setup.text")}
              </p>
            </div>
            {/* Form-level error: no selection on submit, or a failed save. Message text is
                     set by the script (validation vs. server-error copy differ).
            */}
            <div className="form-alert setup-alert" id="form-error" role="alert" hidden>
              <span className="material-symbols-outlined" aria-hidden="true">
                error
              </span>
              <div>
                <span className="form-alert-title" data-form-error-title />
                {" "}
                <span data-form-error-text />
                <div className="form-alert-actions" data-form-error-retry hidden>
                  <button className="button-retry" type="button" data-action="retry-submit">
                    {t("common.retry")}
                  </button>
                </div>
              </div>
            </div>
            {/* Language choice: single-selection radiogroup. Neither option is preselected
                     (no silent default); vi/en carry equal visual weight until chosen.
            */}
            <fieldset className="language-group">
              <legend className="visually-hidden" id="language-group-label">
                {t("common.supportLanguage")}
              </legend>
              <div className="language-grid" role="radiogroup" aria-labelledby="language-group-label" aria-describedby="form-error" id="language-options">
                <div className="language-option" data-lang="vi" role="radio" aria-checked="false" tabIndex="0">
                  <div className="language-option-header">
                    <span className="radio-indicator" aria-hidden="true">
                      <span className="material-symbols-outlined">
                        check
                      </span>
                    </span>
                    <p className="language-name">
                      Tiếng Việt
                    </p>
                  </div>
                </div>
                <div className="language-option" data-lang="en" role="radio" aria-checked="false" tabIndex="-1">
                  <div className="language-option-header">
                    <span className="radio-indicator" aria-hidden="true">
                      <span className="material-symbols-outlined">
                        check
                      </span>
                    </span>
                    <p className="language-name">
                      English
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
            {/* Fields map to PATCH /api/v1/me/preferences { support_language } (API Contract §7.1).
                     Not disabled by default: an unselected Continue press shows the validation
                     message below instead of silently doing nothing.
            */}
            <div className="setup-actions">
              <button className="button button-primary" id="setup-submit" type="button" data-route="/dashboard" aria-busy="false">
                <span data-submit-label>
                  {t("common.continue")}
                </span>
                {" "}
                <span className="material-symbols-outlined" aria-hidden="true" data-submit-icon>
                  chevron_right
                </span>
                {" "}
                <span className="button-spinner" aria-hidden="true" data-submit-spinner hidden />
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* 3. Footer */}
      <footer className="site-footer">
        <div className="page-container footer-content">
          <span className="material-symbols-outlined" aria-hidden="true">
            auto_stories
          </span>
          {" "}
          <span>
            {t("common.footer")}
          </span>
        </div>
      </footer>
    </div>
  );
}
