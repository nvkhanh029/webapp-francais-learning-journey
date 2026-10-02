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
      Static public Login page prototype (route "/login", guest-focused), normalized against
      the approved Dashboard (DashboardPage), its public sibling LandingPage, and
      frontend-design.md (FD) §7. Plain CSS, no build step.

      Scope:
      - Email + password login only (FD §5.4.1 LoginForm, API Contract §6.2). No social login,
        password recovery, "remember me", or roles (Requirements §19).
      - Invalid credentials use one generic message; the page never says whether the email
        exists (API Contract §6.2).
      - No API request, session handling, or redirect. The submit handler validates required
        fields and marks the integration point for authApi.login(). Redirecting an already
        authenticated learner belongs to the route guards (FD §4.3.3), not this page.
      - Links use href="#" with the target React route in data-route (FD §4.2).

      Preview states (prototype only), via the URL query string:
        ?preview=validation            empty-field errors
        ?preview=invalid-credentials   generic 401 invalid_credentials message
        ?preview=server-error          network / 5xx failure message
        ?preview=submitting            pending submit state

      Page-specific values (no shared token applies) are marked "Login-only" below.

      Page sections:
      1. Header (public: brand + Register)
      2. Login card: form panel + supporting panel with mascot
      3. Footer
*/
import styles from "./LoginPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./LoginPage.script.js";

export default function LoginPage() {
  const rootRef = usePageScript(init, { title: "title.login" });

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
            <a className="button button-secondary button-compact" href="#" data-route="/register">
              {t("common.registerAction")}
            </a>
          </nav>
        </div>
      </header>
      <main className="auth-main" id="main-content">
        <div className="page-container auth-layout">
          {/* 2. Login card */}
          <div className="card auth-card">
            <section className="auth-form-panel" aria-labelledby="login-title">
              <h1 className="auth-title" id="login-title" lang="fr">
                Content de te revoir !
              </h1>
              <p className="auth-lead">
                {t("auth.loginIntro")}
              </p>
              {/* Fields map to POST /api/v1/auth/login { email, password } (API Contract §6.2). */}
              <form className="login-form" id="login-form" noValidate>
                {/* Form-level error: generic invalid_credentials or network/server failure. */}
                <div className="form-alert" id="form-error" role="alert" hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    error
                  </span>
                  {" "}
                  <span data-form-error-text />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="login-email">
                    Email
                  </label>
                  {" "}
                  <input className="form-input" id="login-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck="false" placeholder="learner@example.com" required aria-invalid="false" />
                  <p className="field-error" id="email-error" hidden>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      error
                    </span>
                    {" "}
                    <span>
                      {t("common.emailRequired")}
                    </span>
                  </p>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="login-password">
                    {t("common.password")}
                  </label>
                  <div className="password-control">
                    <input className="form-input" id="login-password" name="password" type="password" autoComplete="current-password" placeholder={t("auth.passwordPlaceholder")} required aria-invalid="false" />
                    {" "}
                    <button className="password-toggle" id="password-toggle" type="button" aria-controls="login-password" aria-pressed="false" aria-label={t("common.showPassword")} title={t("common.showPassword")}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        visibility
                      </span>
                    </button>
                  </div>
                  <p className="field-error" id="password-error" hidden>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      error
                    </span>
                    {" "}
                    <span>
                      {t("common.passwordRequired")}
                    </span>
                  </p>
                </div>
                <button className="button button-primary login-submit" id="login-submit" type="submit" aria-busy="false">
                  <span data-submit-label>
                    {t("common.loginAction")}
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
                {t("auth.noAccount")}
                {" "}
                <a className="text-link" href="#" data-route="/register">
                  {t("common.registerAction")}
                </a>
              </p>
            </section>
            {/* Supporting context. Decorative only; the form does not depend on it. */}
            <aside className="auth-aside" aria-label={t("common.about")}>
              <div>
                <h2 className="aside-title">
                  {t("auth.loginAsideTitle")}
                </h2>
                <p className="aside-description">
                  {t("auth.loginAsideText")}
                </p>
              </div>
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
