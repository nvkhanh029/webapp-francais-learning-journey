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
      Static NotFoundPage prototype (route "*", frontend 404 fallback), normalized against the
      approved Dashboard (DashboardPage), the focused Login page (LoginPage), and
      frontend-design.md (FD) §4.2, §4.8, §7. Plain CSS, no build step.

      Role:
      - Rendered by React Router for any unknown FRONTEND URL, instead of a blank screen
        (FD §4.8). It is not an API error page, an expired-session page, a network-error page,
        or a permission page. /api/v1/... stays with Flask and never reaches this page.
      - Needs no data: no API call, session check, request metadata, or personalization.

      Shell:
      - The route sits outside the auth guards (FD §4.3), so the page may be shown to a guest
        or to a signed-in learner. It therefore uses a neutral shell: brand only, with no main
        navigation, no language selector, no logout, and no Register button. Nothing in the
        header claims the invalid URL belongs to Grammar, Vocabulary, or Conjugation.

      Recovery actions (supported destinations only):
      - Primary: "/dashboard" (data-route). RequireAuth (FD §4.3.1) already sends a guest who
        opens it on to /login, so this page needs no auth-aware branching.
      - Secondary: previous page. React integration: navigate(-1), and hide the button when
        location.key === "default" (nothing to go back to). The static script below mimics that.
      - No search, support form, report-a-link flow, or feature directory (not in the MVP).
      - Links use href="#" with the target React route in data-route (FD §4.2).

      Fixed copy is frontend-owned and belongs in the VI/EN dictionaries (FD §9.1).

      Page sections:
      1. Header (brand only)
      2. Not-found card
      3. Footer
*/
import styles from "./NotFoundPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./NotFoundPage.script.js";

export default function NotFoundPage() {
  const rootRef = usePageScript(init, { title: "title.notFound" });

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
        </div>
      </header>
      <main className="not-found-main" id="main-content">
        <div className="page-container not-found-layout">
          {/* 2. Not-found card */}
          <section className="card not-found-card" aria-labelledby="not-found-title">
            {/* Decorative: the heading and text carry the whole message. */}
            <img alt={t("common.mascotAlt")} className="not-found-mascot" src="/images/logo.png" />
            <p className="badge">
              <span className="material-symbols-outlined" aria-hidden="true">
                link_off
              </span>
              {" "}
              <span>
                {t("notFound.code")}
              </span>
            </p>
            <h1 className="not-found-title" id="not-found-title">
              {t("notFound.title")}
            </h1>
            <p className="not-found-lead">
              {t("notFound.text")}
              <br />
              {" "}
              {t("notFound.hint")}
            </p>
            <div className="not-found-actions">
              <button className="button button-secondary" type="button" data-action="go-back">
                <span className="material-symbols-outlined icon-back" aria-hidden="true">
                  arrow_back
                </span>
                {" "}
                <span>
                  {t("notFound.back")}
                </span>
              </button>
              {" "}
              <a className="button button-primary" href="#" data-route="/dashboard">
                <span>
                  {t("common.backToDashboard")}
                </span>
                {" "}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </a>
            </div>
          </section>
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
