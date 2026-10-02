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
      Static Vocabulary browse prototype (VocabularyPage, route /vocabulary). App shell, tokens, and
      shared patterns follow the approved Dashboard (DashboardPage); French-first titles, page-hero,
      card interaction, and page states follow the current GrammarPage. frontend-design.md (FD) §4.5,
      §7.6, §7.9, §8, §9, §11. Plain CSS, no build step.

      Data:
      - The page is rendered from SAMPLE_VOCABULARY in the script below, which has the exact shape of
        GET /api/v1/vocabulary (API Contract §10.1): categories[] > topics[], each category
        { title_fr, title, topics }, each topic { slug, title_fr, title }. Nothing else is shown.
      - This page renders Category -> Topic only. Subtopics and Study Units belong to
        VocabularyTopicPage (GET /api/v1/vocabulary/topics/{topic_slug}); vocabulary entries belong
        to VocabularyStudyUnitPage. None of them are loaded or shown here.
      - Category is a grouping heading with no route. Topic cards are the only curriculum links
        (data-route="/vocabulary/topics/:topicSlug"). Links use href="#"; no routing or API logic.
      - The root endpoint carries no learner state, so Topic cards still show no learned / Review Later
        state. Learner state lives on Vocabulary Study Units.
      - The page-level Progress card mirrors GrammarPage. In this static prototype its 9/17 learned
        and 3 Review Later values come from SAMPLE_VOCABULARY_PROGRESS below, representing the
        learner-summary data that production receives from the existing Dashboard / Review Later APIs;
        they are not derived from GET /api/v1/vocabulary.
      - Category and Topic counts are still derived only from the root Vocabulary response arrays.
      - French is the target language: title_fr is the primary title (lang="fr") of every Category
        and Topic; the localized title is the support line beneath it. When the API falls back to
        title_fr for a missing translation (API §4.9), the support line is omitted.
      - Alphabet & Accents (Requirements §6.4, BR-11) is a reference entry, not a Category, Topic, or
        progress unit. It links to /basics/french-alphabet-accents (API §12.1 slug). The root
        Vocabulary response contains no reference metadata, so its labels are fixed UI copy from the
        VI/EN dictionary, and it stays visible in the loading, error, and empty states because it
        does not depend on this request.
      - Color by role (used the same way everywhere on this page):
          cream / white          structural surfaces (page, hero card, topic cards)
          dark brown             text and strong controls (topic arrow on hover/focus)
          blue (Vocabulary)      identity anchor: page icon, progress fill/value, category marker,
                                 content-count badges, topic hover border
          sage                   learned / completed learner state
          rose                   Review Later learner state + one decorative title glyph
          gold (croissant)       reference role only: Alphabet & Accents surface, icon, CTA
        Roles never rely on color alone: categories are headings (no box, no arrow), topics are
        bordered cards with an arrow, the reference carries a "Tài liệu tham khảo" label.

      Preview states (prototype only), via the URL query string:
        ?preview=loading       Vocabulary request loading
        ?preview=error         Vocabulary request failed
        ?preview=empty         categories is an empty array
        ?preview=not-started   progress is 0/17 with no Review Later units

      Page sections:
      1. Header (same component as the Dashboard, Vocabulary active)
      2. Page header: title, description, Vocabulary progress, Alphabet & Accents reference entry
      3. Page states: loading, error, empty
      4. Content summary
      5. Categories > Topics (rendered from templates)
      6. Footer
*/
import styles from "./VocabularyPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import init from "./VocabularyPage.script.js";

export default function VocabularyPage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Từ vựng" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Vocabulary active) */}
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
            <a className="nav-link" href="#" data-route="/vocabulary" aria-current="page">
              Từ vựng
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/grammar">
              Ngữ pháp
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/conjugation">
              Chia động từ
            </a>
          </nav>
          <div className="header-actions">
            <div className="language-switcher" role="group" aria-label="Ngôn ngữ hỗ trợ">
              <button className="language-button" type="button" aria-pressed="true" data-lang="vi" title="Tiếng Việt">
                VI
              </button>
              {" "}
              <button className="language-button" type="button" aria-pressed="false" data-lang="en" title="English">
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
            <a className="mobile-nav-link" href="#" data-route="/vocabulary" aria-current="page">
              Từ vựng
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/grammar">
              Ngữ pháp
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/conjugation">
              Chia động từ
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container vocabulary-page subject-vocabulary" id="main-content">
        {/* 2. Page header: fixed UI copy (not curriculum titles) + the reference entry. */}
        <section className="card page-hero page-section" aria-labelledby="page-title">
          <div className="hero-main">
            <div className="hero-intro">
              <div className="icon-tile icon-tile-solid" aria-hidden="true">
                <span className="material-symbols-outlined">
                  style
                </span>
              </div>
              <div>
                <h1 className="page-title" id="page-title">
                  Từ vựng
                  <span className="title-glyphs" lang="fr" aria-hidden="true">
                    <span>
                      à
                    </span>
                    {" "}
                    <span>
                      ê
                    </span>
                    {" "}
                    <span>
                      ô
                    </span>
                  </span>
                </h1>
                <p className="page-description">
                  Khám phá từ và cụm từ tiếng Pháp theo từng chủ đề, bắt đầu từ bất kỳ chủ đề nào bạn muốn.
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
              <div className="progress-track" role="progressbar" aria-label="Tiến độ Từ vựng" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-slot="track">
                <div className="progress-fill" />
              </div>
              <ul className="overview-states" aria-label="Trạng thái học tập">
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
          </div>
          {/* Alphabet & Accents: reference content, not a Category/Topic/progress unit (BR-11).
                 Route /basics/:referenceSlug (FD §4.2) with the API §12.1 slug.
          */}
          <a className="reference-card" href="#" data-route="/basics/french-alphabet-accents" aria-labelledby="reference-eyebrow reference-title" aria-describedby="reference-note">
            <span className="reference-eyebrow" id="reference-eyebrow">
              <span className="material-symbols-outlined" aria-hidden="true">
                local_library
              </span>
              {" "}
              <span>
                Tài liệu tham khảo
              </span>
            </span>
            {" "}
            <span className="reference-title" id="reference-title">
              Bảng chữ cái và dấu tiếng Pháp
            </span>
            {" "}
            <span className="reference-letters" lang="fr" aria-hidden="true">
              é è ê ë à ç ô
            </span>
            {" "}
            <span className="reference-note" id="reference-note">
              Kiến thức nền tảng để tra cứu bất cứ lúc nào, không tính vào tiến độ học tập.
            </span>
            {" "}
            <span className="reference-cta" aria-hidden="true">
              <span>
                Xem bảng chữ cái
              </span>
              {" "}
              <span className="material-symbols-outlined">
                arrow_forward
              </span>
            </span>
          </a>
        </section>
        {/* 3. Page states (FD §6.6). Shown instead of the Vocabulary content; the reference entry
             above stays available because it does not depend on this request.
        */}
        <div className="card page-state" data-page-state="loading" role="status" hidden>
          <div className="spinner" aria-hidden="true" />
          <p>
            Đang tải từ vựng…
          </p>
        </div>
        <div className="card page-state" data-page-state="error" role="alert" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            cloud_off
          </span>
          <h2 className="page-state-title">
            Không thể tải từ vựng
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
            style
          </span>
          <h2 className="page-state-title">
            Chưa có chủ đề từ vựng nào
          </h2>
          <p>
            Các chủ đề từ vựng sẽ xuất hiện ở đây khi được bổ sung. Trong lúc chờ, bạn có thể xem bảng chữ cái và dấu ở trên, hoặc học ngữ pháp và chia động từ.
          </p>
          <div className="explore-links">
            <a className="lesson-link subject-grammar" href="#" data-route="/grammar">
              Ngữ pháp
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
        <div data-vocabulary-content hidden>
          {/* 4. Content summary: array lengths of the response, nothing else. */}
          <ul className="toolbar-summary" data-summary aria-label="Nội dung" />
          {/* 5. Categories, rendered from the API data with the templates below. */}
          <div className="category-list" data-category-list />
        </div>
      </main>
      {/* Category: grouping section, one per categories[] item. Title order: title_fr, then title. */}
      <template id="category-template" dangerouslySetInnerHTML={{ __html: `
        <section class="category">
            <header class="category-header">
                <div class="category-heading">
                    <h2 class="category-title" data-slot="heading"><span data-slot="title" lang="fr"></span></h2>
                    <span class="title-support" data-slot="support"></span>
                </div>
                <span class="badge badge-info category-count" data-slot="count">0 chủ đề</span>
            </header>
            <ul class="topic-grid" data-slot="topics"></ul>
            <p class="empty-text" data-slot="empty" hidden>Danh mục này chưa có chủ đề nào.</p>
        </section>
    ` }} />
      {/* Topic: the whole card is the link to /vocabulary/topics/:slug. No learner state. */}
      <template id="topic-template" dangerouslySetInnerHTML={{ __html: `
        <li>
            <a class="topic-card" href="#" data-slot="link">
                <span class="topic-body">
                    <span class="topic-title" data-slot="title" lang="fr"></span>
                    <span class="title-support" data-slot="support"></span>
                </span>
                <span class="topic-arrow" aria-hidden="true">
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
