/*
  Register page (route "/register", guest-focused; FD §7, §5.4.1). Email + password only (FR-AUTH-01). After a
  successful registration the learner is signed in (FR-AUTH-02) and the route guards send
  support_language === null to /setup/language (FD §4.3); this page never says "please log in".

  Preview states (UI review aid), via the URL query string, handled by RegisterForm:
    ?preview=validation     empty-field errors
    ?preview=invalid        invalid email format + password shorter than 8 characters
    ?preview=email-taken    409 email_already_registered on the email field
    ?preview=server-error   network / 5xx failure message
    ?preview=submitting     pending submit state

  Sections: Register card (form panel + supporting panel with mascot). Header and footer come from PublicLayout.
*/
import { Link } from "react-router-dom";

import RegisterForm from "../features/auth/RegisterForm.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./RegisterPage.module.css";

const BENEFIT_KEYS = ["auth.registerBenefit1", "auth.registerBenefit2", "auth.registerBenefit3"];

export default function RegisterPage() {
  useLanguage();
  useDocumentTitle("title.register");

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
                {t("common.hasAccount")}{" "}
                <Link className="text-link" to="/login">
                  {t("common.loginAction")}
                </Link>
              </p>
            </section>
            {/* Supporting context. Decorative only; the form does not depend on it. */}
            <aside className="auth-aside" aria-label={t("common.about")}>
              <div>
                <h2 className="aside-title">{t("auth.registerAsideTitle")}</h2>
                <p className="aside-description">{t("auth.registerAsideText")}</p>
              </div>
              <ul className="aside-benefits">
                {BENEFIT_KEYS.map((key) => (
                  <li key={key}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      check_circle
                    </span>{" "}
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <img alt={t("common.mascotAlt")} className="auth-mascot" src="/images/logo.png" />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
