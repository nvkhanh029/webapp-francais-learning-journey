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
        badges, but the rose surface, accent strip, status icon, and first badge belong to
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
import init from "./GrammarPage.script.js";

export default function GrammarPage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Ngữ pháp", lang: "vi" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header */}
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
            <a className="nav-link" href="#" data-route="/grammar" aria-current="page">
              Ngữ pháp
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/conjugation">
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
            <a className="mobile-nav-link" href="#" data-route="/grammar" aria-current="page">
              Ngữ pháp
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/conjugation">
              Chia động từ
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
                Ngữ pháp
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
                Học các quy tắc và cấu trúc ngữ pháp theo từng phần và chương, bắt đầu từ bất kỳ bài nào bạn muốn.
              </p>
            </div>
          </div>
          <div className="overview-panel" data-overview hidden>
            <div className="progress-labels">
              <span>
                Tiến độ
              </span>
              {" "}
              <span className="progress-value" data-slot="percent">
                0%
              </span>
            </div>
            <div className="progress-track" role="progressbar" aria-label="Tiến độ Ngữ pháp" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-slot="track">
              <div className="progress-fill" />
            </div>
            <ul className="overview-states" aria-label="Trạng thái bài học">
              <li className="badge badge-learned">
                <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                  check_circle
                </span>
                {" "}
                <span>
                  Đã học:
                  {" "}
                  <span data-slot="count">
                    0/0 bài
                  </span>
                </span>
              </li>
              <li className="badge badge-review">
                <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                  bookmark
                </span>
                {" "}
                <span>
                  Xem lại sau:
                  {" "}
                  <span data-slot="review-count">
                    0 bài
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
            Đang tải ngữ pháp…
          </p>
        </div>
        <div className="card page-state" data-page-state="error" role="alert" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            cloud_off
          </span>
          <h2 className="page-state-title">
            Không thể tải ngữ pháp
          </h2>
          <p>
            Đã có lỗi khi tải dữ liệu. Vui lòng thử lại.
          </p>
          <button className="button button-secondary button-compact" type="button" data-action="retry">
            Thử lại
          </button>
        </div>
        <div className="card page-state" data-page-state="empty" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            menu_book
          </span>
          <h2 className="page-state-title">
            Chưa có bài ngữ pháp nào
          </h2>
          <p>
            Các bài ngữ pháp sẽ xuất hiện ở đây khi được bổ sung. Trong lúc chờ, bạn có thể học từ vựng hoặc chia động từ.
          </p>
          <div className="explore-links">
            <a className="lesson-link subject-vocabulary" href="#" data-route="/vocabulary">
              Từ vựng
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
            {" "}
            <a className="lesson-link subject-conjugation" href="#" data-route="/conjugation">
              Chia động từ
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
          </div>
        </div>
        <div data-grammar-content hidden>
          {/* 4. Toolbar */}
          <div className="toolbar">
            <ul className="toolbar-summary" data-summary aria-label="Nội dung" />
            <button className="button button-secondary button-compact toggle-all" type="button" data-action="toggle-all">
              <span className="material-symbols-outlined" aria-hidden="true" data-slot="icon">
                unfold_less
              </span>
              {" "}
              <span data-slot="label">
                Thu gọn tất cả
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
                                data-slot="position">Phần 1: </span><span data-slot="title" lang="fr"></span></h2>
                        <span class="title-support" data-slot="support"></span>
                    </div>
                </div>
                <div class="part-progress">
                    <div class="progress-labels">
                        <span data-slot="count">0/0 bài</span>
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
                            hidden>check_circle</span><span data-slot="count">0/0 bài</span><span
                            class="visually-hidden"> đã học</span></span>
                </summary>
                <ul class="lesson-list" data-slot="lessons"></ul>
                <p class="empty-text" data-slot="empty" hidden>Chương này chưa có bài học nào.</p>
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
                            <span>Xem lại sau</span>
                        </span>
                        <span class="badge badge-learned" data-slot="learned" hidden>
                            <span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>
                            <span>Đã học</span>
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
            Français Learning Journey • Hành trình chinh phục tiếng Pháp
          </span>
        </div>
      </footer>
    </div>
  );
}
