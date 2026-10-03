/*
  Login (route "/login", guest-focused).

  Submits through AuthContext.login() -> POST /api/v1/auth/login (API Contract §6.2). On success the
  route guards take over: GuestRoute sends a signed-in learner to the Dashboard, and RequireLanguage
  routes a learner whose support_language is still null to first-time Language Setup (FD §4.3).

  Error handling follows the contract rather than the message text (FD §6.5):
  - `401 invalid_credentials` gets one generic message that never says whether the email exists.
  - `422 validation_error` is reported per field through `details.fields`.
  - `429 rate_limited` is not an authentication failure: it keeps the entered email, never clears the
    session and never redirects, and uses `Retry-After` to say roughly how long to wait (FD §6.7).
  - `403 csrf_failed` and anything unexpected get one generic message; the session is untouched.

  No credential is ever stored in the browser: authentication is the Flask session cookie (FD §6.7).
*/
import { useEffect } from "react";
import { Link } from "react-router-dom";

import LoginForm from "../features/auth/LoginForm.jsx";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  useLanguage();

  useEffect(() => {
    document.title = t("title.login");
  });

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="auth-main" id="main-content">
        <div className="page-container auth-layout">
          <div className="card auth-card">
            <section className="auth-form-panel" aria-labelledby="login-title">
              <h1 className="auth-title" id="login-title" lang="fr">
                Content de te revoir !
              </h1>
              <p className="auth-lead">{t("auth.loginIntro")}</p>
              <LoginForm />
              <p className="auth-switch">
                {t("auth.noAccount")}{" "}
                <Link className="text-link" to="/register">
                  {t("common.registerAction")}
                </Link>
              </p>
            </section>
            {/* Supporting context. Decorative only; the form does not depend on it. */}
            <aside className="auth-aside" aria-label={t("common.about")}>
              <div>
                <h2 className="aside-title">{t("auth.loginAsideTitle")}</h2>
                <p className="aside-description">{t("auth.loginAsideText")}</p>
              </div>
              <img alt={t("common.mascotAlt")} className="auth-mascot" src="/images/logo.png" />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
