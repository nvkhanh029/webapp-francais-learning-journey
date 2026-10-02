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
      Static Conjugation browse prototype (ConjugationPage, route /conjugation). Visual system,
      app shell, and shared patterns are the same implementation as the approved Dashboard and
      the normalized GrammarPage (GrammarPage), following frontend-design.md (FD) §4.5,
      §7.6, §7.10, §8.6, §9 and stitch-ui-guidelines.md. Plain CSS, no build step, no Tailwind.

      Data:
      - The page is rendered from SAMPLE_CONJUGATION in the script below, which has the shape of
        GET /api/v1/conjugation: tenses[] > lessons[], each lesson
        { slug, title_fr, title, learned, review_later }. Nothing else is shown.
      - Hierarchy is Tense > Rule / Pattern Lesson. A Tense is only a grouping section: it has no
        route, no progress, no state. Only lessons are learning units and link anywhere
        (data-route="/conjugation/lessons/:slug"). Individual verbs are never lessons.
      - Progress is the one aggregate the page shows, derived from the lesson booleans exactly
        as GrammarPage does (learned / total lessons). There is no per-Tense progress; a Tense
        only shows how many lessons it contains.
      - French is the target language, so title_fr is the primary title of every Tense and
        Lesson (lang="fr") and the localized title is the support line below it. When the API
        falls back to title_fr for a missing translation, the support line is omitted.
      - Color by role (same as GrammarPage):
          cream / white          structural surfaces
          dark brown             text and strong controls
          orange (Conjugation)   feature accent only: page icon tile, Tense icon tiles, progress
                                 fill, hover tint on lessons without a state
          blue                   structure and information: count badges, Tense toggle
          sage                   learned          rose   Review Later
        Every state also has an icon and a text label; color is never the only signal.
      - Lesson state priority: Review Later > Learned. A lesson that is both keeps both badges;
        the rose surface, accent strip and status icon belong to Review Later, the Review
        Later badge comes first, and the learned badge switches to a quieter outline style.
      - Opening/closing a Tense is frontend-only UI state (no request, no persistence).
      - Returning from a lesson: a URL hash such as #lesson-present-regular-er opens the parent
        Tense if collapsed, scrolls the lesson into view and highlights it briefly (same
        behavior as GrammarPage).

      Preview states (prototype only), via the URL query string:
        ?preview=loading       Conjugation request loading
        ?preview=error         Conjugation request failed
        ?preview=empty         tenses is an empty array
        ?preview=not-started   no lesson learned or saved yet

      Page sections:
      1. Header (same component as the Dashboard, Conjugation active)
      2. Page header: title, description, overall progress
      3. Page states: loading, error, empty
      4. Toolbar: content summary, expand/collapse all Tenses
      5. Tense sections > Lessons (rendered from templates)
      6. Footer
*/
import styles from "./ConjugationPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./ConjugationPage.script.js";

export default function ConjugationPage() {
  const rootRef = usePageScript(init, { title: "title.conjugation" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard, Conjugation active) */}
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
            <a className="nav-link" href="#" data-route="/conjugation" aria-current="page">
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
            <a className="mobile-nav-link" href="#" data-route="/conjugation" aria-current="page">
              {t("common.conjugation")}
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container conjugation-page subject-conjugation" id="main-content">
        {/* Announces context restored after returning from a lesson (see restoreLessonContext()). */}
        <p className="visually-hidden" role="status" aria-live="polite" data-live-region />
        {/* 2. Page header: fixed UI label (not a curriculum title). Progress and state totals are
             derived from the lesson booleans, the same way GrammarPage derives them.
        */}
        <section className="card page-hero page-section" aria-labelledby="page-title">
          <div className="hero-intro">
            <div className="icon-tile icon-tile-solid" aria-hidden="true">
              <span className="material-symbols-outlined">
                schedule
              </span>
            </div>
            <div>
              <h1 className="page-title" id="page-title">
                {t("common.conjugation")}
              </h1>
              <p className="page-description">
                {t("conj.description")}
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
            <div className="progress-track" role="progressbar" aria-label={t("common.progressConjugation")} aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-slot="track">
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
        {/* 3. Page states (FD §6.6). Shown instead of the Conjugation content. */}
        <div className="card page-state" data-page-state="loading" role="status" hidden>
          <div className="spinner" aria-hidden="true" />
          <p>
            {t("conj.loading")}
          </p>
        </div>
        <div className="card page-state" data-page-state="error" role="alert" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            cloud_off
          </span>
          <h2 className="page-state-title">
            {t("conj.loadError")}
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
            schedule
          </span>
          <h2 className="page-state-title">
            {t("conj.emptyTitle")}
          </h2>
          <p>
            {t("conj.emptyText")}
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
          </div>
        </div>
        <div data-conjugation-content hidden>
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
          {/* 5. Tenses, rendered from the API data with the templates below. */}
          <div className="tense-list" data-tense-list />
        </div>
      </main>
      {/* Tense: one card per tenses[] item. Title order: title_fr (primary), then title.
         The heading holds the disclosure button; the lessons live in the controlled region.
      */}
      <template id="tense-template" dangerouslySetInnerHTML={{ __html: `
        <section class="card tense">
            <h2 class="tense-heading">
                <button class="tense-summary" type="button" aria-expanded="true" data-slot="button">
                    <span class="icon-tile icon-tile-compact" aria-hidden="true">
                        <span class="material-symbols-outlined">schedule</span>
                    </span>
                    <span class="tense-titles">
                        <span class="tense-title" data-slot="title" lang="fr"></span>
                        <span class="title-support" data-slot="support"></span>
                    </span>
                    <span class="badge badge-info tense-count" data-slot="count"></span>
                    <span class="tense-toggle" aria-hidden="true">
                        <span class="material-symbols-outlined">expand_more</span>
                    </span>
                </button>
            </h2>
            <div class="tense-body" data-slot="body">
                <ul class="lesson-list" data-slot="lessons"></ul>
                <p class="empty-text" data-slot="empty" hidden>${t("conj.emptyTense")}</p>
            </div>
        </section>
    ` }} />
      {/* Lesson: the whole row is the link to /conjugation/lessons/:slug.
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
