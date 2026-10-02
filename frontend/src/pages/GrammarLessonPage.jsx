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
      Static Grammar lesson prototype (GrammarLessonPage, route /grammar/lessons/:lessonSlug).
      App shell, tokens, and shared patterns follow DashboardPage; Grammar-specific color roles,
      French-first titles, and learner-state treatment follow the current GrammarPage.
      Structure follows the shared learning-detail pattern (frontend-design.md FD §7.11):
      breadcrumbs -> title + learner state -> Markdown content -> contextual actions.
      Plain CSS, no build step.

      Data:
      - Rendered from SAMPLE_LESSON in the script below, which has the exact shape of
        GET /api/v1/grammar/lessons/{slug} (API Contract §9.2):
        { slug, title_fr, title, context: { part, chapter }, content, state: { learned, review_later } }.
        Nothing else is shown: no level, position, duration, or previous/next lesson.
      - title_fr is the primary title (lang="fr"); the localized title is the support line.
        When the API has fallen back to title_fr (API §4.9) the support line is omitted.
      - Breadcrumb: Grammar links to /grammar. Part and Chapter are grouping labels only
        (FD §4.5); the API gives them no slug, so they are plain text, not links.
      - content is ONE localized Markdown string. Production renders it once through
        features/learning/LearningContent (FD §9.3). This prototype has no Markdown parser, so
        the <template> elements at the end hold the HTML such a renderer produces. Styling targets
        plain Markdown elements (.markdown-body h2, p, ul, ol, blockquote, table, hr, code), never
        lesson-specific classes, so any lesson structure renders without layout changes.
        The only renderer mapping assumed is wrapping each <table> in .table-scroll.
      - Color by role (same as GrammarPage):
          cream / white   surfaces        blue   information (Markdown notes/blockquotes)
          sage            Learned         rose   Review Later
          gold            small warmth only (page icon, h2 marker, list markers, inline forms)
      - Learner-state priority: Review Later > Learned. Both states stay visible; when both are
        true the Review Later badge comes first, the header takes the rose accent, and the
        Learned box switches to its quieter outline form.
      - Actions (FD §5.4.3): Mark as Learned / Unmark, Review Later / remove, Practice.
        Not learned: "Đánh dấu đã học" is the primary action and Practice is secondary with a
        note that it is optional. Learned: Practice becomes the primary next step.
      - Recording the open: after the lesson GET succeeds, production calls
        POST /api/v1/me/learning-units/{slug}/open (useLearningUnitState). Not called here.
      - The action buttons update local preview state only. Production updates the display from
        the PATCH /api/v1/me/learning-units/{slug}/state response (API §13.2).
      - Previous / Next lesson navigation: no previous_lesson/next_lesson fields are added or
        assumed. Production fetches GET /api/v1/grammar (the same Grammar browse data GrammarPage
        already uses) independently of how the lesson page was reached, flattens
        parts[].chapters[].lessons[] once in the order the API already returns it, and locates the
        current lesson by slug to derive previousLesson/nextLesson from its neighbors in that
        flat list. That is the only ordering rule; nothing is re-sorted in the frontend, and
        nothing is passed as in-memory navigation state, so a direct URL load or refresh of
        /grammar/lessons/{slug} still resolves Previous/Next correctly. Each destination links to
        the existing /grammar/lessons/{slug} route. This prototype has only two sample lessons
        with real content, so the sample data below still models the full curriculum (mirroring
        GrammarPage's SAMPLE_GRAMMAR) even though only two slugs actually render; the nav links use
        the same href="#" + data-route pattern as the rest of the in-app navigation. Both slots
        always render, so the two columns never change width: the first lesson shows
        "Không có bài trước" and the last lesson shows "Không có bài tiếp theo" as an unavailable
        card (aria-disabled, no href, not focusable, no hover). ?preview=first shows the
        "no Previous" state; ?preview=alt-content happens to land on the last lesson in the sample
        curriculum, which shows the "no Next" state.

      Preview states (prototype only), via the URL query string:
        (none)                  learned only (matches the GrammarPage sample for this lesson)
        ?preview=not-learned    neither state
        ?preview=review         Review Later only
        ?preview=both           learned + Review Later
        ?preview=first          first lesson of the sample curriculum (Previous unavailable)
        ?preview=alt-content    a different lesson and Markdown structure, no localized title
                                (last lesson: Next unavailable)
        ?preview=loading        lesson request loading
        ?preview=error          lesson request failed

      Page sections:
      1. Header (same component as the Dashboard, Grammar active)
      2. Breadcrumbs
      3. Page states: loading, error
      4. Lesson header: French title, support title, learner state
      5. Lesson content (Markdown) + learning actions
      6. Previous / Next lesson navigation (global curriculum order)
      7. Footer
*/
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import styles from "./GrammarLessonPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";
import init from "./GrammarLessonPage.script.js";

export default function GrammarLessonPage() {
  const rootRef = usePageScript(init, { title: "title.grammar" });

  return (
    <div className={`page-body ${styles.page}`} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Grammar stays active on lesson pages) */}
      <main className="page-container lesson-page subject-grammar" id="main-content">
        <div className="lesson" data-lesson>
          {/* 2. Breadcrumbs. Only "Ngữ pháp" is a link; Part and Chapter have no route (FD §4.5). */}
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <a className="crumb-link" href="/grammar#lesson-articles-indefinis" data-route="/grammar" data-slot="grammar-return">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    draw
                  </span>
                  {" "}
                  <span>
                    {t("common.grammar")}
                  </span>
                </a>
              </li>
              <li data-crumb="part">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span>
                  <span lang="fr" data-slot="title">
                    Le groupe du nom
                  </span>
                  {" "}
                  <span className="crumb-support" data-slot="support">
                    · Cụm danh từ
                  </span>
                </span>
              </li>
              <li data-crumb="chapter">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span>
                  <span lang="fr" data-slot="title">
                    Les déterminants
                  </span>
                  {" "}
                  <span className="crumb-support" data-slot="support">
                    · Từ hạn định
                  </span>
                </span>
              </li>
              <li className="crumb-current-item" data-crumb="lesson">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page" lang="fr" data-slot="title">
                  Les articles indéfinis
                </span>
              </li>
            </ol>
          </nav>
          {/* 3. Page states (FD §6.6). Shown instead of the lesson; no sample data behind them. */}
          <LoadingState hidden message={t("common.loadingLesson")} />
          <ErrorState hidden headingLevel={1} title={t("common.loadLessonError")} retryAction="retry" />
          <article className="lesson-article" aria-labelledby="lesson-title" data-lesson-content>
            {/* 4. Lesson header: French title first, localized title second, learner state. */}
            <header className="card lesson-header">
              <div className="icon-tile icon-tile-solid" aria-hidden="true">
                <span className="material-symbols-outlined">
                  draw
                </span>
              </div>
              <div className="lesson-heading">
                <h1 className="lesson-title" id="lesson-title" lang="fr" data-slot="title">
                  Les articles indéfinis
                </h1>
                <p className="title-support" data-slot="support">
                  Mạo từ bất định
                </p>
                {/* Review Later is listed first: it has priority over Learned. */}
                <ul className="state-badges" aria-label={t("common.lessonStatus")} data-slot="badges">
                  <li className="badge badge-review" data-slot="badge-review" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      bookmark
                    </span>
                    {" "}
                    <span>
                      {t("common.reviewLater")}
                    </span>
                  </li>
                  <li className="badge badge-learned" data-slot="badge-learned">
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
            {/* 5. Lesson content + learning actions */}
            <div className="lesson-body">
              <div className="card lesson-reading">
                {/* LearningContent renders lesson.content (Markdown) here. */}
                <div className="markdown-body" data-slot="content" />
              </div>
              <aside className="card lesson-actions" aria-labelledby="actions-title">
                <h2 className="actions-title" id="actions-title">
                  {t("lesson.statusHeading")}
                </h2>
                {/* Learned slot */}
                <button className="button button-primary button-toggle" type="button" data-action="mark-learned" hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {" "}
                  <span>
                    {t("common.markLearned")}
                  </span>
                </button>
                <div className="state-box state-box-learned" data-slot="learned-box">
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
                {/* Review Later slot (independent from Learned) */}
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
                {/* Practice: optional; primary only once the lesson is learned. */}
                <div className="practice-group">
                  <a className="button button-primary" href="#" data-route="/practice/articles-indefinis" data-slot="practice">
                    <span>
                      {t("common.startPractice")}
                    </span>
                    {" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      bolt
                    </span>
                  </a>
                  <p className="action-note" data-slot="practice-note" hidden>
                    {t("lesson.practiceNote")}
                  </p>
                </div>
                <p className="visually-hidden" role="status" data-slot="announce" />
              </aside>
            </div>
            {/* 6. Previous / Next lesson navigation. Derived from the Grammar browse
                     curriculum order (GET /api/v1/grammar, FD §4.5), not a separate frontend
                     ordering. Both slots always render: a side with no neighbor becomes an
                     unavailable card (aria-disabled, no href, not focusable), so the active card
                     never expands into the missing side.
            */}
            <nav className="lesson-nav" aria-label={t("lesson.navigation")} data-lesson-nav>
              <a className="lesson-nav-link lesson-nav-previous" href="#" data-slot="nav-previous">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                {" "}
                <span className="lesson-nav-text">
                  <span className="lesson-nav-label">
                    {t("lesson.previous")}
                  </span>
                  {" "}
                  <span className="lesson-nav-title" lang="fr" data-slot="title" />
                  {" "}
                  <span className="lesson-nav-support" data-slot="support" />
                </span>
              </a>
              {" "}
              <a className="lesson-nav-link lesson-nav-next" href="#" data-slot="nav-next">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
                {" "}
                <span className="lesson-nav-text">
                  <span className="lesson-nav-label">
                    {t("lesson.next")}
                  </span>
                  {" "}
                  <span className="lesson-nav-title" lang="fr" data-slot="title" />
                  {" "}
                  <span className="lesson-nav-support" data-slot="support" />
                </span>
              </a>
            </nav>
          </article>
        </div>
      </main>
      {/*      Rendered Markdown samples (prototype only). Each template is what LearningContent outputs for
      one lesson's `content` string. Everything inside is plain Markdown output (headings,
      paragraphs, emphasis, lists, blockquotes, a table, a rule, inline code) plus the .table-scroll
      wrapper. Raw HTML is not enabled, so inline French cannot carry lang="fr" here (see summary).

      */}
      <template id="content-articles-indefinis" dangerouslySetInnerHTML={{ __html: `
        <h2>Khi nào dùng mạo từ bất định?</h2>
        <p>Tương tự <em>a / an</em> trong tiếng Anh hay <em>một / vài</em> trong tiếng Việt, mạo từ bất định
            (<em>les articles indéfinis</em>) đứng trước danh từ khi:</p>
        <ul>
            <li><strong>Nhắc đến sự vật lần đầu</strong>, người nghe chưa biết cụ thể là vật nào.<br>
                <em>J'achète un livre.</em> — Tôi mua một quyển sách.
            </li>
            <li><strong>Nói về một cá thể bất kỳ</strong> trong một nhóm, không chỉ định cụ thể.<br>
                <em>C'est une table.</em> — Đây là một cái bàn.
            </li>
        </ul>
        <blockquote>
            <p><strong>Mẹo nhỏ:</strong> Danh từ tiếng Pháp luôn đi cùng mạo từ. Khi học từ mới, hãy học luôn
                <code>un</code> hoặc <code>une</code> để nhớ giống của từ đó.
            </p>
        </blockquote>

        <h2>Hình thái và cách hợp giống, số</h2>
        <p>Mạo từ bất định hợp với danh từ theo giống (đực/cái) và số (ít/nhiều):</p>
        <div class="table-scroll" role="region" aria-label="Bảng" tabindex="0">
            <table>
                <thead>
                    <tr>
                        <th scope="col">Mạo từ</th>
                        <th scope="col">Giống và số</th>
                        <th scope="col">Ví dụ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>un</strong> /œ̃/</td>
                        <td>Giống đực, số ít</td>
                        <td><em>un livre</em> — một quyển sách<br><em>un café</em> — một tách cà phê</td>
                    </tr>
                    <tr>
                        <td><strong>une</strong> /yn/</td>
                        <td>Giống cái, số ít</td>
                        <td><em>une maison</em> — một ngôi nhà<br><em>une pomme</em> — một quả táo</td>
                    </tr>
                    <tr>
                        <td><strong>des</strong> /de/</td>
                        <td>Số nhiều (cả giống đực và giống cái)</td>
                        <td><em>des croissants</em> — những chiếc bánh sừng bò<br><em>des amis</em> — những người bạn
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h3>Nối âm với des</h3>
        <p>Trước một nguyên âm hoặc <em>h</em> câm, chữ <em>s</em> của <code>des</code> được đọc nối thành /z/:
            <em>des amis</em> đọc là /de.za.mi/.
        </p>

        <h2>Lưu ý: mạo từ trong câu phủ định</h2>
        <p>Trong câu phủ định với <strong>ne … pas</strong>, các mạo từ <code>un</code>, <code>une</code>,
            <code>des</code> chuyển thành <code>de</code> (hoặc <code>d'</code> trước nguyên âm và <em>h</em> câm).
        </p>
        <ul>
            <li>Khẳng định: <em>J'ai <strong>un</strong> chien.</em> — Tôi có một con chó.</li>
            <li>Phủ định: <em>Je n'ai pas <strong>de</strong> chien.</em> — Tôi không có con chó nào.</li>
        </ul>
        <blockquote>
            <p><strong>Ngoại lệ:</strong> với động từ <em>être</em>, mạo từ giữ nguyên:
                <em>Ce n'est pas un problème.</em> — Đây không phải là một vấn đề.
            </p>
        </blockquote>

        <h2>Ví dụ</h2>
        <ol>
            <li><em>C'est un garçon très gentil.</em><br>Đó là một cậu bé rất tốt bụng.</li>
            <li><em>Elle a acheté une belle robe.</em><br>Cô ấy đã mua một chiếc váy đẹp.</li>
            <li><em>Il y a des fleurs dans le jardin.</em><br>Có những bông hoa trong khu vườn.</li>
            <li><em>Nous n'avons pas de voiture.</em><br>Chúng tôi không có xe hơi.</li>
        </ol>
    ` }} />
      {/* A different lesson with a different Markdown shape (?preview=alt-content). */}
      <template id="content-negation-jamais-plus-rien" dangerouslySetInnerHTML={{ __html: `
        <p>Ba cụm phủ định này dùng cùng khung với <strong>ne … pas</strong>, chỉ thay <em>pas</em> bằng một từ mang
            nghĩa cụ thể hơn.</p>
        <h2>Cấu trúc</h2>
        <ol>
            <li><code>ne</code> (hoặc <code>n'</code> trước nguyên âm) đứng trước động từ đã chia.</li>
            <li><code>jamais</code>, <code>plus</code> hoặc <code>rien</code> đứng ngay sau động từ.</li>
        </ol>
        <div class="table-scroll" role="region" aria-label="Bảng" tabindex="0">
            <table>
                <thead>
                    <tr>
                        <th scope="col">Cụm</th>
                        <th scope="col">Nghĩa</th>
                        <th scope="col">Ví dụ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>ne … jamais</strong></td>
                        <td>không bao giờ</td>
                        <td><em>Il ne mange jamais de viande.</em></td>
                    </tr>
                    <tr>
                        <td><strong>ne … plus</strong></td>
                        <td>không … nữa</td>
                        <td><em>Elle ne fume plus.</em></td>
                    </tr>
                    <tr>
                        <td><strong>ne … rien</strong></td>
                        <td>không … gì</td>
                        <td><em>Je ne vois rien.</em></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <h3>Ở thì passé composé</h3>
        <p>Hai phần phủ định bao quanh trợ động từ: <em>Je n'ai <strong>rien</strong> vu.</em> — Tôi không thấy gì
            cả.</p>
        <blockquote>
            <p>Trong văn nói thân mật, <em>ne</em> thường bị lược bỏ: <em>Je sais pas.</em></p>
        </blockquote>
    ` }} />
    </div>
  );
}
