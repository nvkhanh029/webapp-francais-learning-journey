/*
 Fonts and the brand illustration still require an internet connection. -->
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
      Static ReviewLaterPage prototype (route /review-later, FD §4.2, §7.14).
      Reached from the Dashboard "Xem lại sau" card ("Mở danh sách xem lại").
      Same shell, tokens and patterns as DashboardPage; no Tailwind, no build step.

      Data:
      - Sample values follow GET /api/v1/me/review-later: data.items[] with
        slug, unit_type (grammar | vocabulary | conjugation), title_fr, title, learned.
        Membership in the list already means "saved"; there is no review_later field,
        and nothing else (dates, levels, scores, priority) is shown because the API has none.
      - Grouping by module and the total count are frontend presentation, derived from items[].
      - Review Later and Learned are independent: every item is saved; "Đã học" is shown
        only when learned is true and nothing negative is shown otherwise.
      - Links use href="#" with the target React route in data-route
        (grammar -> /grammar/lessons/:slug, vocabulary -> /vocabulary/study-units/:slug,
        conjugation -> /conjugation/lessons/:slug). The frontend maps unit_type to the route.
      - "Bỏ lưu" would call PATCH /api/v1/me/learning-units/{slug}/state with
        { "review_later": false }. In this prototype it only removes the sample row.
      - Review Later is not in the main navigation, so no main-nav item is current.

      Preview states (prototype only), via the URL query string:
        (none)                   populated list, mixed learned / not learned
        ?preview=single          one saved item (groups without items are omitted)
        ?preview=long-titles     very long French and localized titles
        ?preview=empty           items: []
        ?preview=loading         list loading state
        ?preview=error           list load failure

      Page sections:
      1. Header (same component as the Dashboard, no current item)
      2. Breadcrumbs: Dashboard > Xem lại sau
      3. Page header: title, short explanation, derived saved count
      4. Page states: loading, error, empty
      5. Module groups (Grammar, Vocabulary, Conjugation), each a card of saved rows
      6. Footer
*/
import styles from "./ReviewLaterPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./ReviewLaterPage.script.js";

export default function ReviewLaterPage() {
  const rootRef = usePageScript(init, { title: "title.reviewLater" });

  return (
    <div className={`app-page ${styles.page}`} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Review Later has no main-nav item, so none is current) */}
      <header className="site-header">
        <div className="page-container header-content">
          <div className="brand">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />
            {" "}
            <span className="brand-name">
              Français Learning Journey
            </span>
          </div>
          <nav className="main-nav" aria-label={t("common.mainNav")}>
            <a className="nav-link" href="#" data-route="/dashboard">
              {t("common.dashboard")}
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/vocabulary">
              {t("common.vocabulary")}
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/grammar">
              {t("common.grammar")}
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/conjugation">
              {t("common.conjugation")}
            </a>
          </nav>
          <div className="header-actions">
            <div className="language-switcher" role="group" aria-label={t("common.supportLanguage")}>
              <button className="language-button" type="button" aria-pressed="true" data-lang="vi" title="Tiếng Việt">
                VI
              </button>
              {" "}
              <button className="language-button" type="button" aria-pressed="false" data-lang="en" title="English">
                EN
              </button>
            </div>
            <button className="logout-button" type="button" aria-label={t("common.logout")} title={t("common.logout")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                logout
              </span>
              {" "}
              <span className="logout-label">
                {t("common.logout")}
              </span>
            </button>
            {" "}
            <button className="menu-button" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label={t("common.menuNav")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </button>
          </div>
        </div>
        <nav className="mobile-nav" id="mobile-nav" aria-label={t("common.mainNav")} hidden>
          <div className="page-container mobile-nav-list">
            <a className="mobile-nav-link" href="#" data-route="/dashboard">
              {t("common.dashboard")}
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/vocabulary">
              {t("common.vocabulary")}
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/grammar">
              {t("common.grammar")}
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/conjugation">
              {t("common.conjugation")}
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container review-page" id="main-content">
        {/* 2. Breadcrumbs: the way back to the Dashboard card this page is opened from. */}
        <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
          <ol className="breadcrumb-list">
            <li>
              <a className="crumb-link" href="#" data-route="/dashboard">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                {" "}
                <span>
                  {t("common.dashboard")}
                </span>
              </a>
            </li>
            <li>
              <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                chevron_right
              </span>
              {" "}
              <span className="crumb-current" aria-current="page">
                {t("common.reviewLater")}
              </span>
            </li>
          </ol>
        </nav>
        {/* 3. Page header. The count is derived from items.length; no new API field. */}
        <header className="review-header">
          <div className="icon-tile" aria-hidden="true">
            <span className="material-symbols-outlined">
              bookmark_added
            </span>
          </div>
          <div className="review-header-text">
            <div className="review-heading-row">
              <h1 className="review-page-title">
                {t("common.reviewLater")}
              </h1>
              <span className="badge" data-total hidden />
            </div>
            <p className="review-page-description">
              {t("dashboard.reviewText")}
            </p>
          </div>
        </header>
        {/* 4. Page-level states (FD §6.6). Shown instead of the list; no sample data behind them. */}
        <div className="card page-state" data-page-state="loading" role="status" hidden>
          <div className="spinner" aria-hidden="true" />
          <p>
            {t("review.loading")}
          </p>
        </div>
        <div className="card page-state" data-page-state="error" role="alert" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            cloud_off
          </span>
          <h2 className="page-state-title">
            {t("review.loadError")}
          </h2>
          <p>
            {t("common.loadError")}
          </p>
          <button className="button button-secondary button-compact" type="button" data-action="retry-page">
            {t("common.retry")}
          </button>
        </div>
        {/* items: [] — one page-level empty state instead of empty module sections. */}
        <div className="card page-state" data-page-state="empty" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            bookmark_added
          </span>
          <h2 className="page-state-title" tabIndex="-1">
            {t("review.emptyTitle")}
          </h2>
          <p>
            {t("review.emptyText")}
          </p>
          <div className="explore-links">
            <a className="lesson-link subject-vocabulary" href="#" data-route="/vocabulary">
              {t("common.vocabulary")}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
            {" "}
            <a className="lesson-link subject-grammar" href="#" data-route="/grammar">
              {t("common.grammar")}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
            {" "}
            <a className="lesson-link subject-conjugation" href="#" data-route="/conjugation">
              {t("common.conjugation")}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
          </div>
        </div>
        {/* 5. Module groups, rendered from items[] (script below). Groups with no items are omitted. */}
        <div className="review-groups" data-review-content hidden />
        {/* One group card per module. Unit rows are cloned into [data-slot="items"]. */}
        <template id="group-template" dangerouslySetInnerHTML={{ __html: `
            <section class="card review-group" data-group>
                <div class="group-heading">
                    <div class="icon-tile icon-tile-compact" aria-hidden="true">
                        <span class="material-symbols-outlined" data-slot="icon"></span>
                    </div>
                    <h2 class="section-title" data-slot="title"></h2>
                    <span class="badge" data-slot="count"></span>
                </div>
                <ul class="review-list" role="list" data-slot="items"></ul>
            </section>
        ` }} />
        {/* One saved learning unit. Open (link) and remove (button) are separate controls.
             The Learned badge is rendered only when learned is true.
        */}
        <template id="item-template" dangerouslySetInnerHTML={{ __html: `
            <li class="review-item" data-item>
                <div class="review-info">
                    <h3 class="review-title" lang="fr" data-slot="title-fr"></h3>
                    <p class="review-support" data-slot="title"></p>
                    <p class="review-state" data-slot="learned" hidden>
                        <span class="badge badge-learned">
                            <span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>
                            <span data-slot="learned-text"></span>
                        </span>
                    </p>
                </div>
                <div class="review-actions">
                    <a class="lesson-link review-open" href="#" data-slot="open">
                        <span data-slot="open-text"></span>
                        <span class="visually-hidden" data-slot="open-context"></span>
                        <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                    </a>
                    <button class="button button-secondary button-compact button-toggle review-remove" type="button"
                        data-action="remove-review">
                        <span class="material-symbols-outlined" aria-hidden="true">bookmark_remove</span>
                        <span data-slot="remove-text"></span>
                        <span class="visually-hidden" data-slot="remove-context"></span>
                    </button>
                </div>
            </li>
        ` }} />
      </main>
      {/* Prototype-only confirmation (announced politely). Not part of the API flow. */}
      <div className="toast" id="toast" role="status" aria-live="polite" aria-atomic="true">
        <span className="material-symbols-outlined" aria-hidden="true">
          bookmark_remove
        </span>
        {" "}
        <span id="toast-message" />
      </div>
      {/* 6. Footer */}
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
