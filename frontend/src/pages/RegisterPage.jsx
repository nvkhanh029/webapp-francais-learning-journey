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
      Static public Register page prototype (route "/register", guest-focused), normalized as the
      registration counterpart of LoginPage, against the approved Dashboard (DashboardPage),
      LandingPage, and frontend-design.md (FD) §7. Plain CSS, no build step.

      Scope:
      - Email + password registration only (Requirements FR-AUTH-01, API Contract §6.1).
        No confirm-password, name, username, role, support-language, consent checkboxes,
        social signup, or email verification.
      - Password rule: at least 8 characters, nothing else (no complexity rules, no strength meter).
      - Email rule mirrors the backend's basic check (API Contract §6.1): after trimming, not empty,
        no whitespace, exactly one "@", non-empty local and domain parts. Lowercasing and the
        duplicate check are the backend's job.
      - No API request, session handling, or redirect. The submit handler validates the fields and
        marks the integration point for authApi.register(). Success signs the learner in
        (FR-AUTH-02); the route guards then send support_language === null to /setup/language
        (FD §4.3). This page never says "please log in" after registering.
      - Links use href="#" with the target React route in data-route (FD §4.2).

      Preview states (prototype only), via the URL query string:
        ?preview=validation     empty-field errors
        ?preview=invalid        invalid email format + password shorter than 8 characters
        ?preview=email-taken    409 email_already_registered on the email field
        ?preview=server-error   network / 5xx failure message
        ?preview=submitting     pending submit state

      Everything in sections 1–3 and the auth-card rules in section 4 are copied unchanged from
      LoginPage so the two pages stay a matched pair. Register-only additions are marked
      "Register-only" below.

      Page sections:
      1. Header (public: brand + Login)
      2. Register card: form panel + supporting panel with mascot
      3. Footer
*/
import styles from "./RegisterPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./RegisterPage.script.js";

export default function RegisterPage() {
  const rootRef = usePageScript(init, { title: "title.register" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header */}
      <header className="site-header">
        <div className="page-container header-content">
          <a className="brand" href="#" data-route="/">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />
            {" "}
            <span className="brand-name">
              Français Learning Journey
            </span>
          </a>
          <nav className="header-actions" aria-label={t("common.account")}>
            <a className="button button-secondary button-compact" href="#" data-route="/login">
              {t("common.loginAction")}
            </a>
          </nav>
        </div>
      </header>
      <main className="auth-main" id="main-content">
        <div className="page-container auth-layout">
          {/* 2. Register card */}
          <div className="card auth-card">
            <section className="auth-form-panel" aria-labelledby="register-title">
              <h1 className="auth-title" id="register-title">
                {t("auth.registerTitle")}
              </h1>
              <p className="auth-lead">
                {t("auth.registerIntro")}
              </p>
              {/* Fields map to POST /api/v1/auth/register { email, password } (API Contract §6.1). */}
              <form className="auth-form" id="register-form" noValidate>
                {/* Form-level error: network/server failure or an unexpected 422. */}
                <div className="form-alert" id="form-error" role="alert" hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    error
                  </span>
                  {" "}
                  <span data-form-error-text />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="register-email">
                    Email
                  </label>
                  {" "}
                  <input className="form-input" id="register-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck="false" placeholder="learner@example.com" required aria-invalid="false" />
                  {/* Also used for 409 email_already_registered. */}
                  <p className="field-error" id="email-error" hidden>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      error
                    </span>
                    {" "}
                    <span data-error-text>
                      {t("common.emailRequired")}
                    </span>
                  </p>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="register-password">
                    {t("common.password")}
                  </label>
                  <div className="password-control">
                    <input className="form-input" id="register-password" name="password" type="password" autoComplete="new-password" placeholder={t("auth.registerPasswordPlaceholder")} required minLength="8" aria-invalid="false" aria-describedby="password-hint" />
                    {" "}
                    <button className="password-toggle" id="password-toggle" type="button" aria-controls="register-password" aria-pressed="false" aria-label={t("common.showPassword")} title={t("common.showPassword")}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        visibility
                      </span>
                    </button>
                  </div>
                  {/* The only password rule (FR-AUTH-01). Replaced by the error while invalid. */}
                  <p className="field-hint" id="password-hint">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      info
                    </span>
                    {" "}
                    <span>
                      {t("auth.passwordTooShort")}
                    </span>
                  </p>
                  <p className="field-error" id="password-error" hidden>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      error
                    </span>
                    {" "}
                    <span data-error-text>
                      {t("common.passwordRequired")}
                    </span>
                  </p>
                </div>
                <button className="button button-primary auth-submit" id="register-submit" type="submit" aria-busy="false">
                  <span data-submit-label>
                    {t("common.registerAction")}
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true" data-submit-icon>
                    arrow_forward
                  </span>
                  {" "}
                  <span className="button-spinner" aria-hidden="true" data-submit-spinner hidden />
                </button>
              </form>
              <p className="auth-switch">
                {t("common.hasAccount")}
                {" "}
                <a className="text-link" href="#" data-route="/login">
                  {t("common.loginAction")}
                </a>
              </p>
            </section>
            {/* Supporting context. Decorative only; the form does not depend on it. */}
            <aside className="auth-aside" aria-label={t("common.about")}>
              <div>
                <h2 className="aside-title">
                  {t("auth.registerAsideTitle")}
                </h2>
                <p className="aside-description">
                  {t("auth.registerAsideText")}
                </p>
              </div>
              <ul className="aside-benefits">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  {" "}
                  <span>
                    {t("auth.registerBenefit1")}
                  </span>
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  {" "}
                  <span>
                    {t("auth.registerBenefit2")}
                  </span>
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  {" "}
                  <span>
                    {t("auth.registerBenefit3")}
                  </span>
                </li>
              </ul>
              <img alt={t("common.mascotAlt")} className="auth-mascot" src="/images/logo.png" />
            </aside>
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
