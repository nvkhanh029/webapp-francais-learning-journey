/*
  Frontend 404 (route "*").

  An unknown URL renders a learner-friendly page instead of a blank screen (FD §4.8). Because
  BrowserRouter uses normal-looking paths, the dev server must serve the SPA entry point for unknown
  non-API paths so refreshing a nested route does not produce a server-level 404; API paths under
  /api/v1/... continue to be handled by Flask through the Vite proxy (FD §4.8).

  This page is outside both layouts, so it keeps its own header and footer.
*/
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { t, useLanguage } from "../i18n/index.js";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
  useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t("title.notFound");
  });

  // History back where there is somewhere to go; otherwise the Dashboard is the only useful target.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  return (
    <div className={`app-page ${styles.page}`}>
      <header className="site-header">
        <div className="page-container header-content">
          <Link className="brand" to="/">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />{" "}
            <span className="brand-name">Français Learning Journey</span>
          </Link>
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
              <button className="button button-secondary" type="button" onClick={goBack}>
                <span className="material-symbols-outlined icon-back" aria-hidden="true">
                  arrow_back
                </span>{" "}
                <span>{t("notFound.back")}</span>
              </button>{" "}
              {/* RequireAuth already sends a guest who reaches a protected route to Login, so the
                  Dashboard link is the primary way onward from here. */}
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
