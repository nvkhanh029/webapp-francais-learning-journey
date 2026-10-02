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
      Static Vocabulary Study Unit prototype (VocabularyStudyUnitPage, route
      /vocabulary/study-units/:unitSlug). Cleaned up from a raw Stitch export; not a token-only
      pass. App shell, tokens, and shared patterns follow the approved Dashboard (DashboardPage);
      Vocabulary identity (blue, French-first titles, breadcrumb and heading treatment) follows the
      current VocabularyPage / VocabularyTopicPage; learner-state treatment (learned / Review
      Later, state box, undo control, action slots) follows GrammarLessonPage, the approved
      learning-detail page (frontend-design.md (FD) §7.11). Plain CSS, no build step, no Tailwind.

      Data:
      - Rendered from SAMPLE_UNIT in the script below, the shape of the Vocabulary Study Unit
        response (GET /api/v1/vocabulary/study-units/{slug}):
        { slug, title_fr, title,
          context: { category, topic: { slug, ... }, subtopic }   (each with title_fr + title),
          entries[]: { french, meaning, ipa | null, example_fr | null, example_translation | null },
          state: { learned, review_later } }.
        Nothing else is shown: no audio, word-level state, level, difficulty, mastery, time
        estimate, or percentage. The Study Unit is the only progress unit (Requirements §6.2, §10).
      - The list is data-driven. The sample has 18 entries only to stress-test the layout; nothing
        below depends on that number (the count badge is entries.length). The sample curriculum
        agrees with VocabularyPage / VocabularyTopicPage / Dashboard (Topic "alimentation-1",
        Study Unit "pain-viennoiseries-1"). Production content comes from the API.
      - Optional fields: ipa, example_fr, and example_translation that are null are simply not
        rendered: no placeholders, no reserved space, so entries have natural heights.
      - IPA: the sample stores bare IPA and the UI wraps it in slashes. Confirm the stored form
        with the API contract before implementation.
      - Breadcrumb: Từ vựng links to /vocabulary; the Topic links to
        /vocabulary/topics/{context.topic.slug}. Category has no route in the MVP, so it is text.
        Subtopic has no route and no slug: it appears only as a context line in the header.
      - French is the target language: title_fr and entry.french are primary (lang="fr"); the
        localized title / meaning / example translation are the support text.
      - Learner-state priority: Review Later > Learned. Both stay visible. When both are true the
        Review Later badge comes first, the header takes the rose accent, and the Learned box steps
        back to its outline form. State is text + icon + color, never color alone.
      - Actions apply to the whole Study Unit, never to a single word. They sit after the list:
        the learner studies first, then decides. The header shows state only (badges).
        Not learned: "Đánh dấu đã học" is the primary action and Practice is secondary with a note
        that it is optional. Learned: Practice becomes the primary next step.
      - Recording the open: after the GET succeeds, production calls
        POST /api/v1/me/learning-units/{slug}/open (useLearningUnitState). Not called here.
      - The action buttons update local preview state only. Production renders the `state` from the
        PATCH /api/v1/me/learning-units/{slug}/state response; the frontend is not the authority.
      - Previous / Next Study Unit: both slots always render, so the two columns never change
        width. A side with no neighbor is an unavailable card ("Không có bài trước" /
        "Không có bài tiếp theo"): aria-disabled, no href, not focusable, no hover.
      - Links use href="#" with the target React route in data-route. No API or routing logic.

      Preview states (prototype only), via the URL query string:
        (none)                  learned only (matches the VocabularyTopicPage sample)
        ?preview=not-learned    neither state
        ?preview=review         Review Later only
        ?preview=both           learned + Review Later
        ?preview=short          a short list of entries (data-driven length)
        ?preview=empty          entries is an empty array
        ?preview=first          no previous Study Unit (Previous is unavailable)
        ?preview=last           no next Study Unit (Next is unavailable)
        ?preview=loading        Study Unit request loading
        ?preview=error          Study Unit request failed

      Page sections:
      1. Header (same component as the Dashboard, Vocabulary active)
      2. Breadcrumbs
      3. Page states: loading, error
      4. Study Unit header: French title, support title, context, count, learner state
      5. Vocabulary entries
      6. Learning actions
      7. Footer
*/
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import styles from "./VocabularyStudyUnitPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./VocabularyStudyUnitPage.script.js";

export default function VocabularyStudyUnitPage() {
  const rootRef = usePageScript(init, { title: "title.vocabulary" });

  return (
    <div className={`page-body ${styles.page}`} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Vocabulary stays active on Study Unit pages) */}
      <main className="page-container unit-page subject-vocabulary" id="main-content">
        <div className="unit" data-unit>
          {/* 2. Breadcrumbs. Từ vựng and the Topic are links (real routes); Category is context
                 text with no route; the current Study Unit is not a link. Subtopic is not part of
                 the trail: it has no route and appears only in the header.
          */}
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <a className="crumb-link" href="#" data-route="/vocabulary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    style
                  </span>
                  {" "}
                  <span>
                    {t("common.vocabulary")}
                  </span>
                </a>
              </li>
              <li className="crumb-category" data-crumb="category">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span>
                  <span lang="fr" data-slot="title" />
                  <span className="crumb-support" data-slot="support" />
                </span>
              </li>
              <li data-crumb="topic">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <a className="crumb-link crumb-topic" href="#" data-slot="topic-link">
                  <span lang="fr" data-slot="title" />
                </a>
              </li>
              <li className="crumb-current-item" data-crumb="unit">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page" lang="fr" data-slot="title" />
              </li>
            </ol>
          </nav>
          {/* 3. Page states (FD §6.6). Shown instead of the Study Unit; no sample data behind them. */}
          <LoadingState hidden message={t("common.loadingLesson")} />
          <ErrorState hidden headingLevel={1} title={t("common.loadLessonError")} retryAction="retry" />
          <article aria-labelledby="unit-title" data-unit-content>
            {/* 4. Study Unit header: French title first, localized title second, context, count,
                     learner state. The count is entries.length, not an API field.
            */}
            <header className="card unit-header">
              <div className="icon-tile icon-tile-solid" aria-hidden="true">
                <span className="material-symbols-outlined">
                  style
                </span>
              </div>
              <div className="unit-heading">
                <h1 className="unit-title" id="unit-title" lang="fr" data-slot="title" />
                <p className="title-support" data-slot="support" />
                <p className="unit-context" data-slot="context">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    folder_open
                  </span>
                  {" "}
                  <span>
                    {t("vocab.subtopicLabel")}
                    {" "}
                    <span lang="fr" data-slot="title" />
                    <span data-slot="support" />
                  </span>
                </p>
                {/* Count first, then Review Later (priority), then Learned. */}
                <ul className="unit-meta" aria-label={t("vocab.unitInfo")}>
                  <li className="badge badge-info" data-slot="count" />
                  <li className="badge badge-review" data-slot="badge-review" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      bookmark
                    </span>
                    {" "}
                    <span>
                      {t("common.reviewLater")}
                    </span>
                  </li>
                  <li className="badge badge-learned" data-slot="badge-learned" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      check_circle
                    </span>
                    {" "}
                    <span>
                      {t("common.learned")}
                    </span>
                  </li>
                </ul>
              </div>
            </header>
            {/* 5. Vocabulary entries, rendered from entries[] with the template below. */}
            <section className="unit-section" aria-labelledby="entries-title">
              <div className="list-header">
                <h2 className="list-title" id="entries-title">
                  {t("vocab.wordsHeading")}
                </h2>
              </div>
              <ol className="entry-list" data-entry-list />
              <p className="empty-text" data-entry-empty hidden>
                {t("vocab.emptyUnit")}
              </p>
            </section>
            {/* 6. Learning actions: apply to the whole Study Unit, never to a single word. */}
            <aside className="card unit-actions unit-section" aria-labelledby="actions-title">
              <h2 className="actions-title" id="actions-title">
                {t("lesson.statusHeading")}
              </h2>
              <div className="actions-grid">
                {/* Learned slot */}
                <div>
                  <button className="button button-primary button-toggle" type="button" data-action="mark-learned" hidden>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      check
                    </span>
                    {" "}
                    <span>
                      {t("common.markLearned")}
                    </span>
                  </button>
                  <div className="state-box state-box-learned" data-slot="learned-box" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      check_circle
                    </span>
                    <p className="state-box-text">
                      <strong>
                        {t("common.learned")}
                      </strong>
                      {t("lesson.learnedNote")}
                    </p>
                    <button className="state-undo" type="button" data-action="unmark-learned">
                      {t("lesson.unmark")}
                      <span className="visually-hidden">
                        {t("common.learnedLower")}
                      </span>
                    </button>
                  </div>
                </div>
                {/* Review Later slot (independent from Learned) */}
                <div>
                  <button className="button button-secondary button-toggle" type="button" data-action="save-review">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      bookmark
                    </span>
                    {" "}
                    <span>
                      {t("common.reviewLater")}
                    </span>
                  </button>
                  <div className="state-box state-box-review" data-slot="review-box" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      bookmark
                    </span>
                    <p className="state-box-text">
                      <strong>
                        {t("common.reviewLater")}
                      </strong>
                      {t("lesson.savedNote")}
                    </p>
                    <button className="state-undo" type="button" data-action="remove-review">
                      {t("lesson.unsave")}
                      <span className="visually-hidden">
                        {t("lesson.fromReviewLater")}
                      </span>
                    </button>
                  </div>
                </div>
                {/* Practice: optional; primary only once the Study Unit is learned. */}
                <div className="practice-group">
                  <a className="button button-primary" href="#" data-slot="practice">
                    <span>
                      {t("common.startPractice")}
                    </span>
                    {" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      bolt
                    </span>
                  </a>
                  <p className="action-note" data-slot="practice-note" hidden>
                    {t("lesson.practiceNoteVocabulary")}
                  </p>
                </div>
              </div>
              <p className="visually-hidden" role="status" data-slot="announce" />
            </aside>
            {/* 7. Previous / Next Study Unit. Adjacent Study Units only (no Category or Subtopic
                     navigation). Both slots always render: a side with no neighbor becomes an
                     unavailable card (aria-disabled, no href, not focusable), so the active card
                     never expands into the missing side.
            */}
            <nav className="unit-nav" aria-label={t("lesson.navigation")} data-unit-nav>
              <a className="unit-nav-link unit-nav-previous" href="#" data-slot="nav-previous">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                {" "}
                <span className="unit-nav-text">
                  <span className="unit-nav-label">
                    {t("lesson.previous")}
                  </span>
                  {" "}
                  <span className="unit-nav-title" lang="fr" data-slot="title" />
                  {" "}
                  <span className="unit-nav-support" data-slot="support" />
                </span>
              </a>
              {" "}
              <a className="unit-nav-link unit-nav-next" href="#" data-slot="nav-next">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
                {" "}
                <span className="unit-nav-text">
                  <span className="unit-nav-label">
                    {t("lesson.next")}
                  </span>
                  {" "}
                  <span className="unit-nav-title" lang="fr" data-slot="title" />
                  {" "}
                  <span className="unit-nav-support" data-slot="support" />
                </span>
              </a>
            </nav>
          </article>
        </div>
      </main>
      {/* Vocabulary entry: one per entries[] item. The French word/expression is the term; IPA,
         the example, and its translation are removed from the DOM when null (no placeholders).
      */}
      <template id="entry-template" dangerouslySetInnerHTML={{ __html: `
        <li class="entry">
            <div class="entry-line">
                <p class="entry-term" lang="fr" data-slot="french"></p>
                <p class="entry-ipa" data-slot="ipa"><span class="visually-hidden">${t("vocab.ipa")} </span><span
                        lang="fr-fonipa" data-slot="ipa-text"></span></p>
            </div>
            <p class="entry-meaning"><span class="visually-hidden">${t("vocab.meaning")} </span><span data-slot="meaning"></span></p>
            <div class="entry-example" data-slot="example">
                <p class="example-fr"><span class="visually-hidden">${t("vocab.example")} </span><span lang="fr"
                        data-slot="example-fr"></span></p>
                <p class="example-translation" data-slot="example-translation"></p>
            </div>
        </li>
    ` }} />
    </div>
  );
}
