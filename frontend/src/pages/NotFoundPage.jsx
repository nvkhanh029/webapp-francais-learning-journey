/*
  Not-found page (route "*", frontend 404 fallback; FD §4.2, §4.8). Rendered for any unknown FRONTEND URL instead
  of a blank screen. It is not an API error page, an expired-session page, a network-error page or a permission
  page; /api/v1/... stays with Flask and never reaches it. Needs no data.

  Shell: the route sits outside the auth guards (FD §4.3), so the page may be shown to a guest or to a signed-in
  learner. It uses a neutral header: brand and the VI / EN switcher, with no main navigation, no logout and no
  Register button. Nothing in the header claims the invalid URL belongs to Grammar, Vocabulary or Conjugation.

  Recovery actions (supported destinations only):
  - Primary: /dashboard. RequireAuth already sends a guest who opens it on to /login.
  - Secondary: previous page (navigate(-1)); hidden when this is the first history entry.
  - No search, support form, report-a-link flow or feature directory (not in the MVP).

  Sections: Header, Not-found card, Footer.
*/
import { Link, useNavigate } from "react-router-dom";

import LanguageSelector from "../components/navigation/LanguageSelector.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
  useLanguage();
  useDocumentTitle("title.notFound");
  const navigate = useNavigate();
  // Same rule as the original page script: nothing to go back to when this is the first history entry.
  const canGoBack = window.history.length > 1;

  return (
    <div className={`app-page ${styles.page}`}>
      <header className="site-header">
        <div className="page-container header-content">
          <Link className="brand" to="/">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />{" "}
            <span className="brand-name">Français Learning Journey</span>
          </Link>
          <div className="header-actions">
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="not-found-main" id="main-content">
        <div className="page-container not-found-layout">
          <section className="card not-found-card" aria-labelledby="not-found-title">
            {/* Decorative: the heading and text carry the whole message. */}
            <img alt={t("common.mascotAlt")} className="not-found-mascot" src="/images/logo.png" />
            <p className="badge">
              <span className="material-symbols-outlined" aria-hidden="true">
                link_off
              </span>{" "}
              <span>{t("notFound.code")}</span>
            </p>
            <h1 className="not-found-title" id="not-found-title">
              {t("notFound.title")}
            </h1>
            <p className="not-found-lead">
              {t("notFound.text")}
              <br /> {t("notFound.hint")}
            </p>
            <div className="not-found-actions">
              <button
                className="button button-secondary"
                type="button"
                hidden={!canGoBack}
                onClick={() => navigate(-1)}
              >
                <span className="material-symbols-outlined icon-back" aria-hidden="true">
                  arrow_back
                </span>{" "}
                <span>{t("notFound.back")}</span>
              </button>{" "}
              <Link className="button button-primary" to="/dashboard">
                <span>{t("common.backToDashboard")}</span>{" "}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </section>
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
