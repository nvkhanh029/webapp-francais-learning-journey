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
      Static Vocabulary Topic prototype (VocabularyTopicPage, route /vocabulary/topics/:topicSlug).
      Cleaned up from a raw Stitch export; not a token-only pass (see summary delivered with this
      file). App shell, tokens, and shared patterns follow the approved Dashboard (DashboardPage);
      Vocabulary-specific visual language (blue identity, French-first titles, card interaction)
      follows the current VocabularyPage; learner-state treatment (learned / Review Later) follows
      the current GrammarPage's lesson rows. frontend-design.md (FD) §4.5, §6.6, §7.6, §7.9, §8,
      §9, §11. stitch-ui-guidelines.md. Plain CSS, no build step.

      Data:
      - The page is rendered from SAMPLE_TOPIC in the script below, which has the exact shape of
        GET /api/v1/vocabulary/topics/{topic_slug} (API Contract §10.2):
        { slug, title_fr, title, context: { category }, subtopics[] }, each subtopic
        { title_fr, title, study_units[] }, each study unit
        { slug, title_fr, title, learned, review_later }. Nothing else is shown: no word counts,
        durations, difficulty, CEFR level, last-studied date, scores, unit numbers, exercise
        totals, or lock state, and no Topic-level progress aggregate (FD rule: don't invent fields
        or derive frontend-authoritative progress the API doesn't expose).
      - Hierarchy on this page: Topic -> Subtopic (grouping only, no route) -> Study Unit (the
        Vocabulary progress/learning unit, links to /vocabulary/study-units/:slug). Category is
        shown only as breadcrumb context; it has no route in the MVP, so it is never a link.
        Vocabulary entries belong to VocabularyStudyUnitPage and are not loaded or shown here.
      - The sample Topic/Category reuse VocabularyPage's own sample curriculum
        (categories[0] "La nourriture et la restauration" > topics[0] "L'alimentation (1)",
        slug "alimentation-1") and its first Study Unit slug ("pain-viennoiseries-1") matches the
        one already referenced from Dashboard's Recent Practice row, so the three prototypes agree
        on the same sample curriculum instead of inventing unrelated data.
      - French is the target language: title_fr is the primary title (lang="fr") of the Topic and
        of every Subtopic and Study Unit; the localized title is the support line beneath it. When
        the API falls back to title_fr for a missing translation (API §4.9), the support line is
        omitted (see the "tâches-menageres"-style item in SAMPLE_TOPIC).
      - Learner state (learned / review_later) lives on Study Units only, exactly as the API
        exposes it. Subtopics carry no state of their own and are never rendered as cards with a
        badge, arrow, or click target - only as section headings, the same open-heading treatment
        VocabularyPage already uses for Category.
      - State color roles, semantics, and priority match GrammarPage exactly: sage = Learned,
        rose = Review Later, both an icon and a text label (never color alone). When a Study Unit
        is both learned and saved for review, Review Later gets the stronger visual claim (status
        icon, accent strip, first badge); the Learned badge steps back to a quiet outline so both
        stay visible.
      - Color by role, otherwise (same values as VocabularyPage):
          cream / white     structural surfaces (page, topic header card, Study Unit cards)
          dark brown        text and strong controls (Study Unit arrow on hover/focus)
          blue (Vocabulary) identity anchor: page icon tile, Subtopic marker bar, content-count
                            badges, Study Unit hover accent when it carries no learner state yet
          sage / rose       learner state only (see above)
        Blue never competes with the state colors: an unlearned, unsaved Study Unit hovers blue
        (Vocabulary identity); a learned or saved one keeps its state color on hover instead.

      Preview states (prototype only), via the URL query string:
        ?preview=loading       Topic request loading
        ?preview=error         Topic request failed
        ?preview=empty         subtopics is an empty array

      Page sections:
      1. Header (same component as the Dashboard, Vocabulary active)
      2. Breadcrumbs: Vocabulary (link) > Category (context, no route) > current Topic
      3. Page states: loading, error
      4. Topic header: French title, localized title, short instructional note
      5. Content summary + Subtopics > Study Units (rendered from templates)
      6. Footer
*/
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import styles from "./VocabularyTopicPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./VocabularyTopicPage.script.js";

export default function VocabularyTopicPage() {
  const rootRef = usePageScript(init, { title: "title.vocabulary" });

  return (
    <div className={`page-body ${styles.page}`} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Vocabulary stays active on the Topic page) */}
      <main className="page-container topic-page subject-vocabulary" id="main-content">
        <div data-topic>
          {/* 2. Breadcrumbs. Only "Từ vựng" is a link; Category is contextual text with no
                 route (do not invent /vocabulary/categories/...); the current Topic is not a link.
          */}
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <a className="crumb-link" href="#" data-route="/vocabulary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    style
                  </span>
                  {t("common.vocabulary")}
                </a>
              </li>
              <li className="crumb-category" data-crumb="category">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span>
                  <span lang="fr" data-slot="title" />
                  <span data-slot="support" />
                </span>
              </li>
              <li data-crumb="topic">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page" lang="fr" data-slot="title" />
              </li>
            </ol>
          </nav>
          {/* 3. Page states (FD §6.6). Shown instead of the Topic. */}
          <LoadingState hidden message={t("vocab.loadingTopic")} />
          <ErrorState hidden headingLevel={1} title={t("vocab.loadTopicError")} retryAction="retry" />
          <div data-topic-content>
            {/* 4. Topic header: French title primary, localized title secondary, short
                     instructional note. No hero illustration, no fake stats.
            */}
            <section className="card topic-header page-section" aria-labelledby="topic-title">
              <div className="topic-intro">
                <div className="icon-tile icon-tile-solid" aria-hidden="true">
                  <span className="material-symbols-outlined">
                    style
                  </span>
                </div>
                <div className="topic-heading">
                  <h1 className="topic-title" id="topic-title" lang="fr" data-slot="title" />
                  <p className="title-support" data-slot="support" />
                </div>
              </div>
              <div className="overview-panel" data-overview>
                <ProgressBar label={t("common.progress")} percent={0} ariaLabel={t("vocab.topicProgress")} valueProps={{ "data-slot": "percent" }} trackProps={{ "data-slot": "track" }} />
                <ul className="overview-states" aria-label={t("common.learningStatus")}>
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
            {/* 5. Content summary + Subtopics, rendered from the API data with the templates
                     below.
            */}
            <ul className="toolbar-summary" data-summary aria-label={t("common.contentRegion")} />
            <section aria-labelledby="topic-title" className="subtopic-list" data-subtopic-list />
            <p className="empty-text" data-topic-empty hidden>
              {t("vocab.emptyTopic")}
            </p>
          </div>
        </div>
      </main>
      {/* Subtopic: grouping section, one per subtopics[] item. Never a card, never a click target. */}
      <template id="subtopic-template" dangerouslySetInnerHTML={{ __html: `
        <section aria-labelledby="">
            <header class="subtopic-header">
                <div class="subtopic-heading">
                    <h2 class="subtopic-title" data-slot="heading">
                        <span data-slot="title" lang="fr"></span>
                    </h2>
                    <span class="title-support" data-slot="support"></span>
                </div>

                <span class="badge badge-info subtopic-count" data-slot="count">
                    ${t("common.unitsOf", { learned: 0, total: 0, n: 0 })}
                </span>
            </header>
            <ul class="study-unit-grid" data-slot="units"></ul>
            <p class="empty-text subtopic-empty" data-slot="empty" hidden>${t("vocab.emptySubtopic")}
            </p>
        </section>
    ` }} />
      {/* Study Unit: the whole card is the link to /vocabulary/study-units/:slug.
         State classes: is-learned (sage), is-saved (rose, whenever review_later is true).
         Review Later has priority: its badge comes first and its styling wins; in a dual-state
         Study Unit the learned badge becomes the quiet outline variant.
      */}
      <template id="study-unit-template" dangerouslySetInnerHTML={{ __html: `
        <li>
            <a class="study-unit-card" href="#" data-slot="link">
                <span class="unit-status" aria-hidden="true">
                    <span class="material-symbols-outlined" data-slot="status">radio_button_unchecked</span>
                </span>
                <span class="unit-body">
                    <span class="unit-title" data-slot="title" lang="fr"></span>
                    <span class="title-support" data-slot="support"></span>
                    <span class="unit-meta" data-slot="meta">
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
                <span class="unit-arrow" aria-hidden="true">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </span>
            </a>
        </li>
    ` }} />
    </div>
  );
}
