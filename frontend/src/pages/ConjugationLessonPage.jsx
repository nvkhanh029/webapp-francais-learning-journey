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
      Static Conjugation lesson prototype (ConjugationLessonPage, route
      /conjugation/lessons/:lessonSlug). Cleaned up from a raw Stitch export; not a token-only
      pass. App shell, tokens and shared patterns are the same implementation as DashboardPage
      and the normalized GrammarLessonPage / VocabularyStudyUnitPage (learning-detail pattern,
      frontend-design.md FD §7.11): breadcrumbs -> title + learner state -> Markdown content ->
      contextual actions -> previous / next. Conjugation identity (orange subject family, French-
      first titles, Tense treatment, learner-state roles) follows the current ConjugationPage.
      Plain CSS, no build step.

      Data:
      - Rendered from SAMPLE_LESSON in the script below, which has the shape of
        GET /api/v1/conjugation/lessons/{slug}:
        { slug, title_fr, title, context: { tense: { title_fr, title } }, content,
          state: { learned, review_later } }.
        Nothing else is shown: no lesson number, level, difficulty, duration, mastery, verb count,
        exercise count, or separate rule / table / examples / notes fields.
      - content is ONE localized Markdown string. Production renders it once through
        features/learning/LearningContent (FD §9.3). This prototype has no Markdown parser, so the
        <template> elements at the end hold the HTML such a renderer produces. Styling targets plain
        Markdown elements (.markdown-body h2, h3, p, ul, ol, blockquote, table, hr, code, strong),
        never lesson-specific classes, so a lesson with a different structure renders without
        layout changes. The only renderer mapping assumed is the same as GrammarLessonPage:
        each <table> is wrapped in .table-scroll. The two sample lessons deliberately have different
        structures (a 3-column table + note first, versus a wide 6-column table with an ordered
        list and a rule) to prove that. Final curriculum text comes from the API / authored Markdown.
      - Because Markdown tables have no row headers, the first column is an ordinary cell; the pronoun
        column is not a scope="row" header. Raw HTML is not enabled in the renderer, so inline
        French inside Markdown cannot carry lang="fr" (same limitation as GrammarLessonPage).
        Titles, breadcrumbs and navigation, which are not Markdown, do carry lang="fr".
      - title_fr is the primary title (lang="fr"); the localized title is the support line. When the
        API has fallen back to title_fr the support line is omitted.
      - Breadcrumb: Chia động từ links to /conjugation. The Tense is a grouping label inside
        ConjugationPage with NO route in the MVP, so it is plain text, never a link. The current
        lesson is the aria-current item.
      - Color by role (same as ConjugationPage):
          cream / white   surfaces
          orange          Conjugation accent only: page icon tile, breadcrumb link, h2 marker bar,
                          list markers, inline forms, table header tint, Previous / Next hover
          blue            information (Markdown notes / blockquotes)
          sage            Learned          rose   Review Later
      - Learner-state priority: Review Later > Learned. Both stay visible; when both are true the
        Review Later badge comes first, the header takes the rose accent and the Learned box steps
        back to its outline form. State is text + icon + color, never color alone.
      - Actions (FD §5.4.3): Mark as Learned / Unmark, Review Later / remove, Practice. Practice is
        optional: secondary with a note until the lesson is learned, then the primary next step.
      - Recording the open: after the lesson GET succeeds, production calls
        POST /api/v1/me/learning-units/{slug}/open (useLearningUnitState). Not called here.
      - The action buttons update local preview state only. Production renders the `state` returned
        by PATCH /api/v1/me/learning-units/{slug}/state; the frontend is not the authority.
      - Previous / Next lesson: exactly the GrammarLessonPage pattern. The lesson API has no
        previous / next fields and none are assumed. Production fetches GET /api/v1/conjugation (the
        same browse data ConjugationPage uses), flattens tenses[].lessons[] once in the order the
        API returns it, and finds the current slug to get its neighbors. That includes crossing from
        the last lesson of one Tense into the first of the next. A side with no neighbor is hidden
        outright, never a disabled-looking control. SAMPLE_CONJUGATION_BROWSE below mirrors
        ConjugationPage's SAMPLE_CONJUGATION so the sample is consistent. The default sample
        (present-regular-er) is the first lesson, so "Bài trước" is unavailable;
        ?preview=alt-content lands mid-curriculum and shows both sides. Both slots always render:
        a missing side is an unavailable card, so the two columns never change width.
      - Example verbs are lesson content only. There is no per-verb state, Practice, or progress.
      - Links use href="#" with the target React route in data-route. No API or routing logic.

      Preview states (prototype only), via the URL query string:
        (none)                  learned only (matches the ConjugationPage sample for this lesson)
        ?preview=not-learned    neither state
        ?preview=review         Review Later only
        ?preview=both           learned + Review Later
        ?preview=alt-content    a different lesson and Markdown structure (wide table, both neighbors)
        ?preview=last           last lesson of the sample curriculum (Next unavailable)
        ?preview=loading        lesson request loading
        ?preview=error          lesson request failed

      Page sections:
      1. Header (same component as the Dashboard, Conjugation active)
      2. Breadcrumbs
      3. Page states: loading, error
      4. Lesson header: French title, support title, Tense context, learner state
      5. Lesson content (Markdown) + learning actions
      6. Previous / Next lesson navigation
      7. Footer
*/
import styles from "./ConjugationLessonPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import init from "./ConjugationLessonPage.script.js";

export default function ConjugationLessonPage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Chia động từ", lang: "vi" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Conjugation stays active on lesson pages) */}
      <header className="site-header">
        <div className="page-container header-content">
          <div className="brand">
            <img alt="Linh vật bánh sừng bò đeo kính, tay cầm sách" className="brand-logo" src="/images/logo.png" />
            {" "}
            <span className="brand-name">
              Français Learning Journey
            </span>
          </div>
          <nav className="main-nav" aria-label="Điều hướng chính">
            <a className="nav-link" href="#" data-route="/dashboard">
              Bảng điều khiển
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/vocabulary">
              Từ vựng
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/grammar">
              Ngữ pháp
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/conjugation" aria-current="page">
              Chia động từ
            </a>
          </nav>
          <div className="header-actions">
            <div className="language-switcher" role="group" aria-label="Ngôn ngữ hỗ trợ">
              <button className="language-button" type="button" aria-pressed="true" title="Tiếng Việt">
                VI
              </button>
              {" "}
              <button className="language-button" type="button" aria-pressed="false" title="English">
                EN
              </button>
            </div>
            <button className="logout-button" type="button" aria-label="Đăng xuất" title="Đăng xuất">
              <span className="material-symbols-outlined" aria-hidden="true">
                logout
              </span>
              {" "}
              <span className="logout-label">
                Đăng xuất
              </span>
            </button>
            {" "}
            <button className="menu-button" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu điều hướng">
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </button>
          </div>
        </div>
        <nav className="mobile-nav" id="mobile-nav" aria-label="Điều hướng chính" hidden>
          <div className="page-container mobile-nav-list">
            <a className="mobile-nav-link" href="#" data-route="/dashboard">
              Bảng điều khiển
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/vocabulary">
              Từ vựng
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/grammar">
              Ngữ pháp
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/conjugation" aria-current="page">
              Chia động từ
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container lesson-page subject-conjugation" id="main-content">
        <div className="lesson" data-lesson>
          {/* 2. Breadcrumbs. Only "Chia động từ" is a link; the Tense is a grouping label with no
                 route in the MVP, so it is plain text. The current lesson is aria-current.
          */}
          <nav className="breadcrumbs" aria-label="Đường dẫn trang">
            <ol className="breadcrumb-list">
              <li>
                <a className="crumb-link" href="/conjugation#lesson-present-regular-er" data-route="/conjugation" data-slot="conjugation-return">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    schedule
                  </span>
                  {" "}
                  <span>
                    Chia động từ
                  </span>
                </a>
              </li>
              <li data-crumb="tense">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span>
                  <span lang="fr" data-slot="title">
                    Le présent de l'indicatif
                  </span>
                  {" "}
                  <span className="crumb-support" data-slot="support">
                    · Thì hiện tại
                  </span>
                </span>
              </li>
              <li className="crumb-current-item" data-crumb="lesson">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page" lang="fr" data-slot="title">
                  Les verbes réguliers en -ER
                </span>
              </li>
            </ol>
          </nav>
          {/* 3. Page states (FD §6.6). Shown instead of the lesson; no sample data behind them. */}
          <div className="card page-state" data-page-state="loading" role="status" hidden>
            <div className="spinner" aria-hidden="true" />
            <p>
              Đang tải bài học…
            </p>
          </div>
          <div className="card page-state" data-page-state="error" role="alert" hidden>
            <span className="material-symbols-outlined" aria-hidden="true">
              cloud_off
            </span>
            <h1 className="page-state-title">
              Không thể tải bài học
            </h1>
            <p>
              Đã có lỗi khi tải dữ liệu. Vui lòng thử lại.
            </p>
            <button className="button button-secondary button-compact" type="button" data-action="retry">
              Thử lại
            </button>
          </div>
          <article className="lesson-article" aria-labelledby="lesson-title" data-lesson-content>
            {/* 4. Lesson header: French title first, localized title second, Tense context,
                     learner state. Review Later is listed first: it has priority over Learned.
            */}
            <header className="card lesson-header">
              <div className="icon-tile icon-tile-solid" aria-hidden="true">
                <span className="material-symbols-outlined">
                  schedule
                </span>
              </div>
              <div className="lesson-heading">
                <h1 className="lesson-title" id="lesson-title" lang="fr" data-slot="title" />
                <p className="title-support" data-slot="support" />
                <p className="lesson-context" data-slot="context">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    event_note
                  </span>
                  {" "}
                  <span>
                    Thì:
                    {" "}
                    <span lang="fr" data-slot="title" />
                    <span data-slot="support" />
                  </span>
                </p>
                <ul className="state-badges" aria-label="Trạng thái bài học" data-slot="badges">
                  <li className="badge badge-review" data-slot="badge-review" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      bookmark
                    </span>
                    {" "}
                    <span>
                      Xem lại sau
                    </span>
                  </li>
                  <li className="badge badge-learned" data-slot="badge-learned" hidden>
                    <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                      check_circle
                    </span>
                    {" "}
                    <span>
                      Đã học
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
                  Trạng thái và luyện tập
                </h2>
                {/* Learned slot */}
                <button className="button button-primary button-toggle" type="button" data-action="mark-learned" hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {" "}
                  <span>
                    Đánh dấu đã học
                  </span>
                </button>
                <div className="state-box state-box-learned" data-slot="learned-box" hidden>
                  <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                    check_circle
                  </span>
                  <p className="state-box-text">
                    <strong>
                      Đã học
                    </strong>
                    Bạn đã đánh dấu bài này là đã học.
                  </p>
                  <button className="state-undo" type="button" data-action="unmark-learned">
                    Bỏ đánh dấu
                    <span className="visually-hidden">
                      đã học
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
                    Xem lại sau
                  </span>
                </button>
                <div className="state-box state-box-review" data-slot="review-box" hidden>
                  <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                    bookmark
                  </span>
                  <p className="state-box-text">
                    <strong>
                      Xem lại sau
                    </strong>
                    Bài này đang nằm trong danh sách xem lại.
                  </p>
                  <button className="state-undo" type="button" data-action="remove-review">
                    Bỏ lưu
                    <span className="visually-hidden">
                      khỏi Xem lại sau
                    </span>
                  </button>
                </div>
                {/* Practice: optional; primary only once the lesson is learned. */}
                <div className="practice-group">
                  <a className="button button-primary" href="#" data-route="/practice/present-regular-er" data-slot="practice">
                    <span>
                      Bắt đầu luyện tập
                    </span>
                    {" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      bolt
                    </span>
                  </a>
                  <p className="action-note" data-slot="practice-note" hidden>
                    Luyện tập giúp củng cố bài học và không bắt buộc để đánh dấu đã học.
                  </p>
                </div>
                <p className="visually-hidden" role="status" data-slot="announce" />
              </aside>
            </div>
            {/* 6. Previous / Next lesson navigation. STATIC sample: the lesson API has no
                     previous / next fields. Production derives the neighbors from the Conjugation
                     browse order (GET /api/v1/conjugation). Both slots always render: a side with
                     no neighbor becomes an unavailable card (aria-disabled, no href, not focusable).
            */}
            <nav className="lesson-nav" aria-label="Điều hướng bài học" data-lesson-nav>
              <a className="lesson-nav-link lesson-nav-previous" href="#" data-slot="nav-previous">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                {" "}
                <span className="lesson-nav-text">
                  <span className="lesson-nav-label">
                    Bài trước
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
                    Bài tiếp theo
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
      {/* 7. Footer */}
      <footer className="site-footer">
        <div className="page-container footer-content">
          <span className="material-symbols-outlined" aria-hidden="true">
            auto_stories
          </span>
          {" "}
          <span>
            Français Learning Journey • Hành trình chinh phục tiếng Pháp
          </span>
        </div>
      </footer>
      {/*      Rendered Markdown samples (prototype only). Each template is what LearningContent outputs for
      one lesson's `content` string: plain Markdown output (headings, paragraphs, emphasis, lists,
      blockquotes, tables, a rule, inline code) plus the .table-scroll wrapper. Sample text only;
      the real curriculum is authored Markdown from the API.

      */}
      <template id="content-present-regular-er" dangerouslySetInnerHTML={{ __html: `
        <p>Đây là nhóm động từ phổ biến nhất trong tiếng Pháp. Ở thì hiện tại, chúng đều chia theo cùng một mẫu:
            nắm quy tắc một lần là áp dụng được cho hàng trăm động từ.</p>

        <h2>Cách hình thành</h2>
        <ol>
            <li>Bỏ đuôi <code>-er</code> khỏi động từ nguyên mẫu để lấy <strong>gốc từ</strong>:
                <em>parler</em> → <em>parl-</em>.
            </li>
            <li>Thêm đuôi tương ứng với từng ngôi: <code>-e</code>, <code>-es</code>, <code>-e</code>,
                <code>-ons</code>, <code>-ez</code>, <code>-ent</code>.
            </li>
        </ol>

        <h2>Bảng chia mẫu: parler (nói)</h2>
        <div class="table-scroll" role="region" aria-label="Bảng chia động từ parler" tabindex="0">
            <table>
                <thead>
                    <tr>
                        <th scope="col">Đại từ</th>
                        <th scope="col">Đuôi</th>
                        <th scope="col">Dạng chia</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>je</td>
                        <td>-e</td>
                        <td>parl<strong>e</strong></td>
                    </tr>
                    <tr>
                        <td>tu</td>
                        <td>-es</td>
                        <td>parl<strong>es</strong></td>
                    </tr>
                    <tr>
                        <td>il / elle / on</td>
                        <td>-e</td>
                        <td>parl<strong>e</strong></td>
                    </tr>
                    <tr>
                        <td>nous</td>
                        <td>-ons</td>
                        <td>parl<strong>ons</strong></td>
                    </tr>
                    <tr>
                        <td>vous</td>
                        <td>-ez</td>
                        <td>parl<strong>ez</strong></td>
                    </tr>
                    <tr>
                        <td>ils / elles</td>
                        <td>-ent</td>
                        <td>parl<strong>ent</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <blockquote>
            <p><strong>Mẹo phát âm:</strong> Các đuôi <em>-e</em>, <em>-es</em> và <em>-ent</em> đều là âm câm. Vì vậy
                <em>je parle</em>, <em>tu parles</em>, <em>il parle</em> và <em>ils parlent</em> nghe giống hệt nhau:
                /paʁl/.
            </p>
        </blockquote>

        <h2>Một số động từ thường gặp</h2>
        <p>Các động từ dưới đây chia theo đúng mẫu trên:</p>
        <ul>
            <li><em>aimer</em> — yêu, thích: <em>j'aime</em>, <em>nous aimons</em></li>
            <li><em>travailler</em> — làm việc: <em>il travaille</em>, <em>vous travaillez</em></li>
            <li><em>regarder</em> — xem, nhìn: <em>tu regardes</em>, <em>ils regardent</em></li>
        </ul>
        <p>Trước nguyên âm hoặc <em>h</em> câm, <em>je</em> rút gọn thành <em>j'</em>: <em>j'aime</em>,
            <em>j'habite</em>.
        </p>

        <h2>Ví dụ trong câu</h2>
        <ol>
            <li><em>Je parle français tous les jours.</em><br>Tôi nói tiếng Pháp mỗi ngày.</li>
            <li><em>Nous travaillons à Hanoi.</em><br>Chúng tôi làm việc ở Hà Nội.</li>
            <li><em>Ils regardent un film.</em><br>Họ đang xem một bộ phim.</li>
        </ol>

        <h2>Lưu ý</h2>
        <blockquote>
            <p><strong>Thay đổi chính tả nhỏ:</strong> Một số động từ -ER đổi nhẹ để giữ nguyên cách phát âm, ví dụ
                <em>manger</em> → <em>nous mangeons</em> và <em>commencer</em> → <em>nous commençons</em>.
            </p>
        </blockquote>
    ` }} />
      {/* A different lesson with a different Markdown shape (?preview=alt-content): intro rule
         first, an ordered list, a wide table that scrolls inside its own box on narrow screens,
         an h3, a rule and an exception note.
      */}
      <template id="content-present-regular-re" dangerouslySetInnerHTML={{ __html: `
        <p>Nhóm này gồm các động từ có nguyên mẫu kết thúc bằng <code>-re</code>, phần lớn là <code>-dre</code>. Đuôi
            chia khác nhóm -ER ở ngôi số ít.</p>

        <h2>Đuôi chia</h2>
        <ol>
            <li>Bỏ đuôi <code>-re</code> để lấy gốc: <em>vendre</em> → <em>vend-</em>.</li>
            <li>Thêm đuôi: <code>-s</code>, <code>-s</code>, (không đuôi), <code>-ons</code>, <code>-ez</code>,
                <code>-ent</code>.
            </li>
        </ol>

        <h2>So sánh một số động từ</h2>
        <div class="table-scroll" role="region" aria-label="Bảng chia các động từ đuôi -RE" tabindex="0">
            <table>
                <thead>
                    <tr>
                        <th scope="col">Đại từ</th>
                        <th scope="col">vendre</th>
                        <th scope="col">attendre</th>
                        <th scope="col">répondre</th>
                        <th scope="col">perdre</th>
                        <th scope="col">entendre</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>je</td>
                        <td>vend<strong>s</strong></td>
                        <td>attend<strong>s</strong></td>
                        <td>répond<strong>s</strong></td>
                        <td>perd<strong>s</strong></td>
                        <td>entend<strong>s</strong></td>
                    </tr>
                    <tr>
                        <td>tu</td>
                        <td>vend<strong>s</strong></td>
                        <td>attend<strong>s</strong></td>
                        <td>répond<strong>s</strong></td>
                        <td>perd<strong>s</strong></td>
                        <td>entend<strong>s</strong></td>
                    </tr>
                    <tr>
                        <td>il / elle / on</td>
                        <td>vend</td>
                        <td>attend</td>
                        <td>répond</td>
                        <td>perd</td>
                        <td>entend</td>
                    </tr>
                    <tr>
                        <td>nous</td>
                        <td>vend<strong>ons</strong></td>
                        <td>attend<strong>ons</strong></td>
                        <td>répond<strong>ons</strong></td>
                        <td>perd<strong>ons</strong></td>
                        <td>entend<strong>ons</strong></td>
                    </tr>
                    <tr>
                        <td>vous</td>
                        <td>vend<strong>ez</strong></td>
                        <td>attend<strong>ez</strong></td>
                        <td>répond<strong>ez</strong></td>
                        <td>perd<strong>ez</strong></td>
                        <td>entend<strong>ez</strong></td>
                    </tr>
                    <tr>
                        <td>ils / elles</td>
                        <td>vend<strong>ent</strong></td>
                        <td>attend<strong>ent</strong></td>
                        <td>répond<strong>ent</strong></td>
                        <td>perd<strong>ent</strong></td>
                        <td>entend<strong>ent</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h3>Phát âm chữ -d</h3>
        <p>Ở ngôi số ít, chữ <em>d</em> cuối thân từ là âm câm: <em>il vend</em> đọc là /il vɑ̃/. Ở <em>nous</em>,
            <em>vous</em> và <em>ils / elles</em>, chữ <em>d</em> được đọc: <em>ils vendent</em> đọc là /il vɑ̃d/.
        </p>
        <blockquote>
            <p><strong>Mẹo nhỏ:</strong> Ngôi <em>il / elle / on</em> không có đuôi riêng, chỉ giữ nguyên chữ
                <em>d</em>: <em>il vend</em>, không viết <em>il vendt</em>.
            </p>
        </blockquote>

        <hr>

        <h2>Ví dụ</h2>
        <ol>
            <li><em>Elle vend des fleurs au marché.</em><br>Cô ấy bán hoa ở chợ.</li>
            <li><em>Nous attendons le bus.</em><br>Chúng tôi đang đợi xe buýt.</li>
            <li><em>Tu réponds à ton ami.</em><br>Bạn trả lời người bạn của mình.</li>
        </ol>
    ` }} />
    </div>
  );
}
