/*
  Login page (route "/login", guest-focused; FD §7, §5.4.1). Email + password only: no social login, password
  recovery, "remember me" or roles (Requirements §19). Invalid credentials use one generic message; the page never
  says whether the email exists (API §6.2). Redirecting an already authenticated learner belongs to the route
  guards (FD §4.3.3), not this page.

  Preview states (UI review aid), via the URL query string, handled by LoginForm:
    ?preview=validation            empty-field errors
    ?preview=invalid-credentials   generic 401 invalid_credentials message
    ?preview=server-error          network / 5xx failure message
    ?preview=submitting            pending submit state

  Sections: Login card (form panel + supporting panel with mascot). Header and footer come from PublicLayout.
*/
import { Link } from "react-router-dom";

import LoginForm from "../features/auth/LoginForm.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  useLanguage();
  useDocumentTitle("title.login");

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
