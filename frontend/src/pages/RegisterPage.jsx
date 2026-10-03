/*
  Register (route "/register", guest-focused).

  Submits through AuthContext.register() -> POST /api/v1/auth/register (API Contract §6.1).
  Registration signs the learner in automatically (FR-AUTH-02), so the guards take over afterwards:
  GuestRoute would send them to the Dashboard, and RequireLanguage to first-time Language Setup
  because a new account starts with support_language = null (FD §4.3).

  Errors follow the contract, not the message text (FD §6.5): `409 email_already_registered` and any
  other failure share one generic wording, so the page never confirms an address through its copy
  alone; `422 validation_error` is reported per field through `details.fields`.

  The public area uses Vietnamese by default (FR-LANG-01), and the page runs before any language has
  been saved, so the copy comes from the per-browser language the i18n module already resolves.
*/
import { useEffect } from "react";
import { Link } from "react-router-dom";

import RegisterForm from "../features/auth/RegisterForm.jsx";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./RegisterPage.module.css";

const BENEFITS = ["auth.registerBenefit1", "auth.registerBenefit2", "auth.registerBenefit3"];

export default function RegisterPage() {
  useLanguage();

  useEffect(() => {
    document.title = t("title.register");
  });

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="auth-main" id="main-content">
        <div className="page-container auth-layout">
          <div className="card auth-card">
            <section className="auth-form-panel" aria-labelledby="register-title">
              <h1 className="auth-title" id="register-title">
                {t("auth.registerTitle")}
              </h1>
              <p className="auth-lead">{t("auth.registerIntro")}</p>
              <RegisterForm />
              <p className="auth-switch">
                {t("auth.hasAccount")}{" "}
                <Link className="text-link" to="/login">
                  {t("common.loginAction")}
                </Link>
              </p>
            </section>
            {/* Supporting context. Decorative only. */}
            <aside className="auth-aside" aria-label={t("common.about")}>
              <div>
                <h2 className="aside-title">{t("auth.registerAsideTitle")}</h2>
                <p className="aside-description">{t("auth.registerAsideText")}</p>
                <ul className="aside-benefits">
                  {BENEFITS.map((key) => (
                    <li key={key}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        check_circle
                      </span>
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <img alt={t("common.mascotAlt")} className="auth-mascot" src="/images/logo.png" />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
