/*
 Fonts and the logo still require an internet connection. -->
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
      Static Grammar browse prototype (GrammarPage, route /grammar). Visual system, app shell,
      and shared patterns follow the approved Dashboard (DashboardPage) and
      frontend-design.md (FD) §4.5, §7.6, §7.8, §8, §9, §11. Plain CSS, no build step.

      Data:
      - The page is rendered from SAMPLE_GRAMMAR in the script below, which has the exact
        shape of GET /api/v1/grammar (API Contract §9.1): parts[] > chapters[] > lessons[],
        each lesson { slug, title, title_fr, learned, review_later }. Nothing else is shown.
      - Part and Chapter are groups inside this page; only lessons link anywhere
        (data-route="/grammar/lessons/:slug"). Links use href="#"; no routing or API logic.
      - Counts and percentages are derived from the lesson booleans (see FD §15 note in the
        summary delivered with this file). Part numbers come from array order.
      - French is the target language, so title_fr is the primary title of every Part,
        Chapter, and Lesson (lang="fr") and the localized title is the support line below it.
        When the API falls back to title_fr for a missing translation (API §4.9), the
        support line is omitted rather than repeating the French.
      - Color by role (used the same way everywhere on this page):
          cream / white          structural surfaces (page, cards, Part header band)
          dark brown             text and strong controls (lesson arrow on hover/focus)
          blue (existing family) structure and information: Part number tile (solid),
                                 Chapter toggle (soft), content counts
          sage                   learned / completed (status, badge, finished chapter/part)
          rose                   Review Later, "revisit" (status, badge, lesson surface)
          gold (Grammar family)  small warmth only: page icon, progress fill, hover tint
                                 on lessons without a state, one decorative glyph
        Every state also has an icon and a text label; color is never the only signal.
      - Lesson state priority: Review Later > Learned. A lesson that is both keeps both
        badges, but the rose surface, border, status icon, and first badge belong to
        Review Later; the learned badge switches to a quieter outline style.
      - Expanding/collapsing Chapters is frontend-only UI state (API §9.1, FD §5.7).
      - Returning from a lesson: GrammarLessonPage's "Quay lại Ngữ pháp" control links back here
        with the current lesson slug encoded as a URL hash, e.g. #lesson-articles-indefinis (no
        API/backend change - the slug already comes from GET /api/v1/grammar). Once the Grammar
        data above has rendered, this page looks up that slug, opens its parent Chapter if it was
        collapsed, scrolls the lesson into view, and gives it a brief, non-color-only highlight
        (see restoreLessonContext() in the script and .lesson-item.is-returned in the CSS).

      Preview states (prototype only), via the URL query string:
        ?preview=loading       Grammar request loading
        ?preview=error         Grammar request failed
        ?preview=empty         parts is an empty array
        ?preview=not-started   no lesson learned or saved yet

      Try the return-from-lesson behavior by opening this file with a hash such as
      #lesson-articles-indefinis, or by using the "Quay lại Ngữ pháp" link on the lesson prototype.

      Page sections:
      1. Header (same component as the Dashboard, Grammar active)
      2. Page header: title, description, overall progress
      3. Page states: loading, error, empty
      4. Toolbar: content summary, expand/collapse all chapters
      5. Parts > Chapters > Lessons (rendered from templates)
      6. Footer
*/
import styles from "./GrammarPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./GrammarPage.script.js";

export default function GrammarPage() {
  const rootRef = usePageScript(init, { title: "title.grammar" });

  return (
    <div className={`app-page ${styles.page}`} ref={rootRef}>
      {/* 1. Header */}
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
            <a className="nav-link" href="#" data-route="/grammar" aria-current="page">
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
            <a className="mobile-nav-link" href="#" data-route="/grammar" aria-current="page">
              {t("common.grammar")}
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/conjugation">
              {t("common.conjugation")}
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container grammar-page subject-grammar" id="main-content">
        {/* Announces context restored after returning from a lesson (see restoreLessonContext()).
             Scrolling and the highlight below are visual only, so this is the non-visual signal
             required alongside them.
        */}
        <p className="visually-hidden" role="status" aria-live="polite" data-live-region />
        {/* 2. Page header: fixed UI label (not a curriculum title). Progress and state totals
             are derived from the data.
        */}
        <section className="card page-hero page-section" aria-labelledby="page-title">
          <div className="hero-intro">
            <div className="icon-tile icon-tile-solid" aria-hidden="true">
              <span className="material-symbols-outlined">
                draw
              </span>
            </div>
            <div>
              <h1 className="page-title" id="page-title">
                {t("common.grammar")}
                <span className="title-glyphs" lang="fr" aria-hidden="true">
                  <span>
                    é
                  </span>
                  {" "}
                  <span>
                    ç
                  </span>
                  {" "}
                  <span>
                    à
                  </span>
                </span>
              </h1>
              <p className="page-description">
                {t("grammar.description")}
              </p>
            </div>
          </div>
          <div className="overview-panel" data-overview hidden>
            <div className="progress-labels">
              <span>
                {t("common.progress")}
              </span>
              {" "}
              <span className="progress-value" data-slot="percent">
                0%
              </span>
            </div>
            <div className="progress-track" role="progressbar" aria-label={t("common.progressGrammar")} aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-slot="track">
              <div className="progress-fill" />
            </div>
            <ul className="overview-states" aria-label={t("common.lessonStatus")}>
              <li className="badge badge-learned">
                <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                  check_circle
                </span>
                {" "}
                <span>
                  {t("common.learnedColon")}
                  {" "}
                  <span data-slot="count">
                    {t("common.fraction", { learned: 0, total: 0 })}
                  </span>
                </span>
              </li>
              <li className="badge badge-review">
                <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                  bookmark
                </span>
                {" "}
                <span>
                  {t("common.reviewLaterColon")}
                  {" "}
                  <span data-slot="review-count">
                    {t("common.count", { n: 0 })}
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </section>
        {/* 3. Page states (FD §6.6). Shown instead of the Grammar content. */}
        <div className="card page-state" data-page-state="loading" role="status" hidden>
          <div className="spinner" aria-hidden="true" />
          <p>
            {t("grammar.loading")}
          </p>
        </div>
        <div className="card page-state" data-page-state="error" role="alert" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            cloud_off
          </span>
          <h2 className="page-state-title">
            {t("grammar.loadError")}
          </h2>
          <p>
            {t("common.loadError")}
          </p>
          <button className="button button-secondary button-compact" type="button" data-action="retry">
            {t("common.retry")}
          </button>
        </div>
        <div className="card page-state" data-page-state="empty" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            menu_book
          </span>
          <h2 className="page-state-title">
            {t("grammar.emptyTitle")}
          </h2>
          <p>
            {t("grammar.emptyText")}
          </p>
          <div className="explore-links">
            <a className="lesson-link subject-vocabulary" href="#" data-route="/vocabulary">
              {t("common.vocabulary")}
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
        <div data-grammar-content hidden>
          {/* 4. Toolbar */}
          <div className="toolbar">
            <ul className="toolbar-summary" data-summary aria-label={t("common.contentRegion")} />
            <button className="button button-secondary button-compact toggle-all" type="button" data-action="toggle-all">
              <span className="material-symbols-outlined" aria-hidden="true" data-slot="icon">
                unfold_less
              </span>
              {" "}
              <span data-slot="label">
                {t("common.collapseAll")}
              </span>
            </button>
          </div>
          {/* 5. Parts, rendered from the API data with the templates below. */}
          <div className="part-list" data-part-list />
        </div>
      </main>
      {/* Part: one card per parts[] item. Title order: title_fr (primary), then title. */}
      <template id="part-template" dangerouslySetInnerHTML={{ __html: `
        <section class="card part">
            <div class="part-header">
                <div class="part-heading">
                    <div class="icon-tile icon-tile-solid icon-tile-blue part-number" aria-hidden="true"
                        data-slot="number">1</div>
                    <div class="part-titles">
                        <h2 class="part-title" data-slot="heading"><span class="visually-hidden"
                                data-slot="position">${t("grammar.partPosition", { n: 1 }).trim()} </span><span data-slot="title" lang="fr"></span></h2>
                        <span class="title-support" data-slot="support"></span>
                    </div>
                </div>
                <div class="part-progress">
                    <div class="progress-labels">
                        <span data-slot="count">${t("common.lessonsOf", { learned: 0, total: 0, n: 0 })}</span>
                        <span class="progress-value" data-slot="percent">0%</span>
                    </div>
                    <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                        aria-valuenow="0" data-slot="track">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
            <div class="part-body">
                <ul class="chapter-list" data-slot="chapters"></ul>
            </div>
        </section>
    ` }} />
      {/* Chapter: collapsible group inside a Part (frontend-only open state). */}
      <template id="chapter-template" dangerouslySetInnerHTML={{ __html: `
        <li>
            <details class="chapter" open>
                <summary class="chapter-summary">
                    <span class="chapter-toggle" aria-hidden="true">
                        <span class="material-symbols-outlined">expand_more</span>
                    </span>
                    <span class="chapter-heading">
                        <h3 class="chapter-title" data-slot="title" lang="fr"></h3>
                        <span class="title-support" data-slot="support"></span>
                    </span>
                    <span class="badge badge-info chapter-count" data-slot="count-badge"><span
                            class="material-symbols-outlined icon-filled" aria-hidden="true" data-slot="count-icon"
                            hidden>check_circle</span><span data-slot="count">${t("common.lessonsOf", { learned: 0, total: 0, n: 0 })}</span><span
                            class="visually-hidden"> ${t("common.learnedLower")}</span></span>
                </summary>
                <ul class="lesson-list" data-slot="lessons"></ul>
                <p class="empty-text" data-slot="empty" hidden>${t("grammar.emptyChapter")}</p>
            </details>
        </li>
    ` }} />
      {/* Lesson: the whole row is the link to /grammar/lessons/:slug.
         State classes: is-learned (sage), is-saved (rose, whenever review_later is true).
         Review Later has priority: its badge comes first and its styling wins; in a dual-state
         lesson the learned badge becomes the quiet outline variant.
      */}
      <template id="lesson-template" dangerouslySetInnerHTML={{ __html: `
        <li>
            <a class="lesson-item" href="#" data-slot="link">
                <span class="lesson-status" aria-hidden="true">
                    <span class="material-symbols-outlined" data-slot="status">radio_button_unchecked</span>
                </span>
                <span class="lesson-body">
                    <span class="lesson-title" data-slot="title" lang="fr"></span>
                    <span class="title-support" data-slot="support"></span>
                    <span class="lesson-meta" data-slot="meta">
                        <span class="badge badge-review" data-slot="review-later" hidden>
                            <span class="material-symbols-outlined icon-filled" aria-hidden="true">bookmark</span>
                            <span>${t("common.reviewLater")}</span>
                        </span>
                        <span class="badge badge-learned" data-slot="learned" hidden>
                            <span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>
                            <span>${t("common.learned")}</span>
                        </span>
                    </span>
                </span>
                <span class="lesson-arrow" aria-hidden="true">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </span>
            </a>
        </li>
    ` }} />
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
