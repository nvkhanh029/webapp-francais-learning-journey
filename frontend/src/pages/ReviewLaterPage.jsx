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
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Breadcrumbs from "../components/common/Breadcrumbs.jsx";
import styles from "./ReviewLaterPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./ReviewLaterPage.script.js";

export default function ReviewLaterPage() {
  const rootRef = usePageScript(init, { title: "title.reviewLater" });

  return (
    <div className={`page-body ${styles.page}`} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Review Later has no main-nav item, so none is current) */}
      <main className="page-container review-page" id="main-content">
        {/* 2. Breadcrumbs: the way back to the Dashboard card this page is opened from. */}
        <Breadcrumbs items={[{ label: t("common.dashboard"), to: "/dashboard", icon: "arrow_back" }, { label: t("common.reviewLater") }]} />
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
        <LoadingState hidden message={t("review.loading")} />
        <ErrorState hidden headingLevel={2} title={t("review.loadError")} retryAction="retry-page" />
        {/* items: [] — one page-level empty state instead of empty module sections. */}
        <EmptyState hidden icon="bookmark_added" headingLevel={2} titleTabIndex={-1} title={t("review.emptyTitle")} message={t("review.emptyText")}>
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
        </EmptyState>
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
    </div>
  );
}
