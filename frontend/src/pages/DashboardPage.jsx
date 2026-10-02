/*
 Fonts and original illustrations still require an internet connection. -->
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
      Static Dashboard prototype. It is the approved visual baseline described in
      frontend-design.md (FD) §7. Layout uses plain CSS with reusable component classes;
      no build step is needed.

      Data:
      - Sample values follow the shapes of GET /api/v1/me/dashboard and
        GET /api/v1/me/activity-calendar (API Contract §8.1, §8.2).
      - Elements marked data-pending-api use sample values for fields the API does not
        expose yet (FD §15). Do not back them with invented frontend logic.
      - Curriculum titles are the API Contract's example titles; production components
        receive them from the API.
      - Links use href="#" with the target React route in data-route. The language,
        logout, and practice buttons are placeholders. No API or authentication logic.
      - Keep progress text, aria-valuenow, and --progress equal (the script derives all
        three from data-learned / data-total).

      Preview states (prototype only), via the URL query string:
        ?preview=new-learner     new-learner response: Bienvenue greeting, empty states
        ?preview=long-streak     streak of 30 days: Coucou greeting
        ?preview=streak-off      current streak is 0: unlit flame illustration (sample data otherwise unchanged)
        ?preview=loading         Dashboard loading state
        ?preview=error           Dashboard error state
        ?preview=calendar-error  calendar month request failed

      Page sections:
      1. Header (with compact menu below 768px)
      2. Greeting
      3. Learning streak and practice calendar
      4. Continue learning
      5. Learning progress
      6. Strengthen your knowledge: Mixed Practice and Review Later
      7. Recent practice
      8. Footer
*/
import styles from "./DashboardPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import init from "./DashboardPage.script.js";

export default function DashboardPage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Bảng điều khiển", lang: "vi" });

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
            <a className="nav-link" href="#" data-route="/dashboard" aria-current="page">
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
            <a className="mobile-nav-link" href="#" data-route="/dashboard" aria-current="page">
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
            <a className="mobile-nav-link" href="#" data-route="/conjugation">
              Chia động từ
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container dashboard" id="main-content">
        {/* Page-level states (FD §7.7). Shown instead of the content while loading or on error. */}
        <div className="card page-state" data-page-state="loading" role="status" hidden>
          <div className="spinner" aria-hidden="true" />
          <p>
            Đang tải bảng điều khiển…
          </p>
        </div>
        <div className="card page-state" data-page-state="error" role="alert" hidden>
          <span className="material-symbols-outlined" aria-hidden="true">
            cloud_off
          </span>
          <h1 className="page-state-title">
            Không thể tải bảng điều khiển
          </h1>
          <p>
            Đã có lỗi khi tải dữ liệu. Vui lòng thử lại.
          </p>
          <button className="button button-secondary button-compact" type="button" data-action="retry-page">
            Thử lại
          </button>
        </div>
        <div data-dashboard-content>
          {/* 2. Greeting: Coucou for a streak of 30+ days, Bienvenue on first visit, otherwise Bonjour. */}
          <section className="welcome dashboard-section" aria-labelledby="welcome-title">
            <h1 className="welcome-title" id="welcome-title">
              <span lang="fr" data-greeting>
                Bonjour !
              </span>
              {" "}
              <span aria-hidden="true">
                ✨
              </span>
            </h1>
            <p className="welcome-description">
              Sẵn sàng cùng chiếc bánh sừng bò học thêm tiếng Pháp hôm nay nào!
            </p>
          </section>
          {/* 3. Learning streak and practice calendar */}
          <section className="activity-overview dashboard-section" aria-label="Chuỗi ngày học và lịch luyện tập">
            <article className="card streak-card" aria-labelledby="streak-title">
              <div className="streak-illustration">
                <img alt="Ngọn lửa biểu thị chuỗi ngày học" data-streak-image src="/images/streak-on.png" />
              </div>
              <div>
                <p className="streak-count">
                  <span data-streak-current>
                    14
                  </span>
                  {" "}
                  ngày liên tiếp
                </p>
                <p className="badge streak-record">
                  <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                    military_tech
                  </span>
                  {" "}
                  <span>
                    Kỷ lục:
                    {" "}
                    <span data-streak-longest>
                      28
                    </span>
                    {" "}
                    ngày
                  </span>
                </p>
              </div>
              <div className="streak-divider" aria-hidden="true" />
              <div className="streak-tip">
                <span className="material-symbols-outlined" aria-hidden="true">
                  tips_and_updates
                </span>
                <p>
                  <span>
                    Mẹo nhỏ:
                  </span>
                  {" "}
                  Hoàn thành một bài luyện tập hoặc luyện tập tổng hợp mỗi ngày để giữ chuỗi ngày học.
                </p>
              </div>
            </article>
            <article className="card activity-card" aria-labelledby="activity-title">
              <div className="activity-card-header">
                <div className="card-heading">
                  <div className="icon-tile calendar-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      calendar_month
                    </span>
                  </div>
                  <div>
                    <h2 className="section-title" id="activity-title">
                      Lịch luyện tập
                    </h2>
                    <p className="card-subtitle">
                      Những ngày bạn đã luyện tập để giữ chuỗi
                    </p>
                  </div>
                </div>
                <div className="month-navigation" role="group" aria-label="Chọn tháng">
                  <button className="month-button" id="previous-month" type="button" aria-label="Tháng trước" aria-controls="activity-calendar-days" title="Tháng trước">
                    <span aria-hidden="true">
                      &lsaquo;
                    </span>
                  </button>
                  {" "}
                  <span className="month-badge" id="calendar-month" aria-live="polite" aria-atomic="true">
                    Tháng 5
                  </span>
                  {" "}
                  <button className="month-button" id="next-month" type="button" aria-label="Tháng sau" aria-controls="activity-calendar-days" title="Đây là tháng hiện tại" disabled>
                    <span aria-hidden="true">
                      &rsaquo;
                    </span>
                  </button>
                </div>
              </div>
              <div className="calendar-state" data-calendar-state="error" role="alert" hidden>
                <p>
                  Không thể tải lịch luyện tập của tháng này.
                </p>
                <button className="button button-secondary button-compact" type="button" data-action="retry-calendar">
                  Thử lại
                </button>
              </div>
              <div className="calendar-layout">
                <div className="calendar">
                  <div className="calendar-weekdays" aria-hidden="true">
                    <span>
                      T2
                    </span>
                    {" "}
                    <span>
                      T3
                    </span>
                    {" "}
                    <span>
                      T4
                    </span>
                    {" "}
                    <span>
                      T5
                    </span>
                    {" "}
                    <span>
                      T6
                    </span>
                    {" "}
                    <span>
                      T7
                    </span>
                    {" "}
                    <span>
                      CN
                    </span>
                  </div>
                  {/* Day cells are generated from activity-calendar data (script below). */}
                  <div className="calendar-days" id="activity-calendar-days" />
                </div>
                <div className="calendar-summary">
                  <p data-calendar-summary>
                    <span>
                      23 ngày
                    </span>
                    {" "}
                    có luyện tập trong tháng này.
                  </p>
                  <div className="calendar-legend">
                    <div className="legend-row">
                      <span className="legend-swatch activity-active" aria-hidden="true" />
                      {" "}
                      <span>
                        Đã luyện tập
                      </span>
                    </div>
                    <div className="legend-row legend-row-muted">
                      <span className="legend-swatch activity-inactive" aria-hidden="true" />
                      {" "}
                      <span>
                        Chưa luyện tập / Chưa tới
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>
          {/* 4. Continue learning */}
          <section className="card continue-card dashboard-section" aria-label="Tiếp tục học">
            <div className="continue-content" data-view="populated">
              <div className="continue-details">
                <p className="continue-eyebrow">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    menu_book
                  </span>
                  {" "}
                  <span>
                    Tiếp tục học
                  </span>
                  {" "}
                  <span aria-hidden="true">
                    ✨
                  </span>
                </p>
                {/* Parent section and position are pending API fields (FD §15). */}
                <h2 className="continue-title">
                  <span>
                    Ngữ pháp •
                    &nbsp;
                  </span>
                  <span lang="fr" data-pending-api="continue_learning.parent">
                    L'adjectif qualificatif et l'adjectif numéral
                  </span>
                  &nbsp;
                  <span aria-hidden="true">
                    🥐☕
                  </span>
                </h2>
                <p className="continue-lesson">
                  <span data-pending-api="continue_learning.position">
                    Bài 4/6:
                  </span>
                  {" "}
                  <span className="continue-lesson-title" lang="fr">
                    «
                    &nbsp;
                    Autres emplois des adjectifs qualificatifs
                    &nbsp;
                    »
                  </span>
                </p>
              </div>
              <a className="button button-primary continue-button" href="#" data-route="/grammar/lessons/:lessonSlug">
                <span>
                  Tiếp tục học
                </span>
                {" "}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </a>
            </div>
            {/* Explore state when continue_learning is null. */}
            <div className="continue-content" data-view="empty" hidden>
              <div className="continue-details">
                <p className="continue-eyebrow">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    menu_book
                  </span>
                  {" "}
                  <span>
                    Tiếp tục học
                  </span>
                </p>
                <h2 className="continue-title">
                  Chưa có bài học đang học dở
                </h2>
                <p className="continue-lesson">
                  Hãy chọn một bài để bắt đầu. Bài bạn mở gần nhất sẽ xuất hiện ở đây.
                </p>
                <div className="explore-links">
                  <a className="lesson-link subject-vocabulary" href="#" data-route="/vocabulary">
                    Từ vựng
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_forward
                    </span>
                  </a>
                  {" "}
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
            </div>
          </section>
          {/* 5. Learning progress: one card per module, same structure, subject color class.
                 Percentages are derived from data-learned / data-total.
          */}
          <section className="dashboard-section skills-section" aria-labelledby="skills-title">
            <div className="section-heading">
              <div className="heading-with-icon">
                <span className="material-symbols-outlined section-icon" aria-hidden="true">
                  auto_stories
                </span>
                <h2 className="section-title" id="skills-title">
                  Tiến độ học tập
                </h2>
              </div>
            </div>
            <div className="skills-grid">
              {/* Vocabulary: counted in Study Units */}
              <article className="card skill-card subject-vocabulary" aria-labelledby="vocabulary-title" data-module-progress data-learned="18" data-total="25">
                <div>
                  <div className="skill-card-header">
                    <div className="icon-tile" aria-hidden="true">
                      <span className="material-symbols-outlined">
                        style
                      </span>
                    </div>
                    <span className="badge">
                      <span data-total-text>
                        25
                      </span>
                      {" "}
                      bài
                    </span>
                  </div>
                  <h3 className="skill-title" id="vocabulary-title">
                    Từ vựng
                  </h3>
                  <p className="skill-description">
                    Mở rộng vốn từ theo chủ đề, ngữ cảnh và các nhóm từ thường gặp.
                  </p>
                </div>
                <div className="skill-progress">
                  <div className="progress-labels">
                    <span>
                      Tiến độ
                    </span>
                    {" "}
                    <span className="progress-value">
                      72%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-label="Tiến độ Từ vựng" aria-valuemax="100" aria-valuemin="0" aria-valuenow="72" style={{ "--progress": "72%" }}>
                    <div className="progress-fill" />
                  </div>
                  <div className="skill-footer">
                    <span className="skill-detail">
                      18/25 bài
                    </span>
                    {" "}
                    <a className="lesson-link" href="#" data-route="/vocabulary">
                      Xem bài học
                      <span className="visually-hidden">
                        Từ vựng
                      </span>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </article>
              {/* Grammar */}
              <article className="card skill-card subject-grammar" aria-labelledby="grammar-title" data-module-progress data-learned="8" data-total="13">
                <div>
                  <div className="skill-card-header">
                    <div className="icon-tile" aria-hidden="true">
                      <span className="material-symbols-outlined">
                        draw
                      </span>
                    </div>
                    <span className="badge">
                      <span data-total-text>
                        13
                      </span>
                      {" "}
                      bài
                    </span>
                  </div>
                  <h3 className="skill-title" id="grammar-title">
                    Ngữ pháp
                  </h3>
                  <p className="skill-description">
                    Học các quy tắc và cấu trúc ngữ pháp theo từng nhóm.
                  </p>
                </div>
                <div className="skill-progress">
                  <div className="progress-labels">
                    <span>
                      Tiến độ
                    </span>
                    {" "}
                    <span className="progress-value">
                      62%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-label="Tiến độ Ngữ pháp" aria-valuemax="100" aria-valuemin="0" aria-valuenow="62" style={{ "--progress": "62%" }}>
                    <div className="progress-fill" />
                  </div>
                  <div className="skill-footer">
                    <span className="skill-detail">
                      8/13 bài
                    </span>
                    {" "}
                    <a className="lesson-link" href="#" data-route="/grammar">
                      Xem bài học
                      <span className="visually-hidden">
                        Ngữ pháp
                      </span>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </article>
              {/* Conjugation */}
              <article className="card skill-card subject-conjugation" aria-labelledby="conjugation-title" data-module-progress data-learned="12" data-total="25">
                <div>
                  <div className="skill-card-header">
                    <div className="icon-tile" aria-hidden="true">
                      <span className="material-symbols-outlined">
                        schedule
                      </span>
                    </div>
                    <span className="badge">
                      <span data-total-text>
                        25
                      </span>
                      {" "}
                      bài
                    </span>
                  </div>
                  <h3 className="skill-title" id="conjugation-title">
                    Chia động từ
                  </h3>
                  <p className="skill-description">
                    Học cách chia động từ theo thì, nhóm và các mẫu chia phổ biến.
                  </p>
                </div>
                <div className="skill-progress">
                  <div className="progress-labels">
                    <span>
                      Tiến độ
                    </span>
                    {" "}
                    <span className="progress-value">
                      48%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-label="Tiến độ Chia động từ" aria-valuemax="100" aria-valuemin="0" aria-valuenow="48" style={{ "--progress": "48%" }}>
                    <div className="progress-fill" />
                  </div>
                  <div className="skill-footer">
                    <span className="skill-detail">
                      12/25 bài
                    </span>
                    {" "}
                    <a className="lesson-link" href="#" data-route="/conjugation">
                      Xem bài học
                      <span className="visually-hidden">
                        Chia động từ
                      </span>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </section>
          {/* 6. Strengthen your knowledge: Mixed Practice and Review Later */}
          <section className="dashboard-section practice-section" aria-labelledby="practice-title">
            <div className="section-heading practice-heading">
              <div className="heading-with-icon">
                <span className="material-symbols-outlined section-icon" aria-hidden="true">
                  category
                </span>
                <h2 className="section-title" id="practice-title">
                  Củng cố kiến thức
                </h2>
              </div>
            </div>
            <div className="practice-grid">
              <article className="card mixed-card subject-mixed" aria-labelledby="mixed-title">
                <div className="mixed-card-header">
                  <div>
                    <h3 className="mixed-title" id="mixed-title">
                      Luyện tập tổng hợp
                    </h3>
                    <p className="mixed-description">
                      Tối đa 10 câu hỏi ngẫu nhiên từ các bài bạn đã đánh dấu là đã học. Một thử thách nhỏ để củng cố kiến thức!
                    </p>
                  </div>
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      casino
                    </span>
                  </div>
                </div>
                <div className="mixed-actions" data-view="populated">
                  <button className="button button-primary" type="button" data-route="/mixed-practice">
                    <span>
                      Bắt đầu luyện tập
                    </span>
                    {" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      bolt
                    </span>
                  </button>
                </div>
                {/* Shown when mixed_practice.available is false. */}
                <p className="state-note" data-view="empty" hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    info
                  </span>
                  {" "}
                  <span>
                    Hãy đánh dấu ít nhất một bài là đã học để bắt đầu luyện tập tổng hợp.
                  </span>
                </p>
              </article>
              <article className="card review-card" aria-labelledby="review-title">
                <div>
                  <div className="review-card-header">
                    <div>
                      <h3 className="review-title" id="review-title">
                        Xem lại sau
                      </h3>
                      <p className="review-description">
                        Các bài bạn đã lưu để xem lại khi cần.
                      </p>
                    </div>
                    <div className="icon-tile" aria-hidden="true">
                      <span className="material-symbols-outlined">
                        bookmark_added
                      </span>
                    </div>
                  </div>
                  <p className="review-counter" data-view="populated">
                    <span className="review-count">
                      12
                    </span>
                    {" "}
                    <span className="review-count-label">
                      bài đã lưu
                    </span>
                  </p>
                  {/* Shown when review_later_count is 0. */}
                  <p className="empty-text review-empty" data-view="empty" hidden>
                    Chưa có bài nào. Chọn “Xem lại sau” trong một bài học để lưu bài đó vào đây.
                  </p>
                </div>
                <div className="review-action">
                  <a className="button button-secondary" href="#" data-route="/review-later">
                    <span>
                      Mở danh sách xem lại
                    </span>
                    {" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </article>
            </div>
          </section>
          {/* 7. Recent practice: rows follow recent_practice[]. Normal rows show Type + title_fr,
                 linked to the learning unit; Mixed rows show one label without a link.
          */}
          <section className="card recent-practice" aria-labelledby="recent-title">
            <div className="section-heading">
              <div className="card-heading">
                <div className="icon-tile history-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">
                    history
                  </span>
                </div>
                <div>
                  <h2 className="section-title" id="recent-title">
                    Luyện tập gần đây
                  </h2>
                  <p className="card-subtitle">
                    Kết quả các lần luyện tập mới nhất
                  </p>
                </div>
              </div>
            </div>
            <ul className="practice-list" data-view="populated">
              <li className="practice-item subject-vocabulary">
                <div className="practice-info">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      style
                    </span>
                  </div>
                  <div className="practice-details">
                    <h3 className="practice-title" title="Từ vựng: Le pain et les viennoiseries — Partie 1">
                      <span className="practice-type">
                        Từ vựng:
                      </span>
                      {" "}
                      <a className="practice-link" href="#" data-route="/vocabulary/study-units/pain-viennoiseries-1" lang="fr">
                        Le pain et les viennoiseries — Partie 1
                      </a>
                    </h3>
                    <p className="practice-date">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        schedule
                      </span>
                      {" "}
                      <time dateTime="2026-05-24T09:30:00+07:00">
                        Hôm nay lúc 09:30
                      </time>
                    </p>
                  </div>
                </div>
                <div className="practice-result">
                  <span className="practice-score">
                    95%
                  </span>
                  {" "}
                  <span className="practice-correct">
                    Đúng 19/20 câu
                  </span>
                </div>
              </li>
              <li className="practice-item subject-grammar">
                <div className="practice-info">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      draw
                    </span>
                  </div>
                  <div className="practice-details">
                    <h3 className="practice-title" title="Ngữ pháp: Les articles définis">
                      <span className="practice-type">
                        Ngữ pháp:
                      </span>
                      {" "}
                      <a className="practice-link" href="#" data-route="/grammar/lessons/articles-definis" lang="fr">
                        Les articles définis
                      </a>
                    </h3>
                    <p className="practice-date">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        schedule
                      </span>
                      {" "}
                      <time dateTime="2026-05-23T18:15:00+07:00">
                        Hôm qua lúc 18:15
                      </time>
                    </p>
                  </div>
                </div>
                <div className="practice-result">
                  <span className="practice-score">
                    88%
                  </span>
                  {" "}
                  <span className="practice-correct">
                    Đúng 14/16 câu
                  </span>
                </div>
              </li>
              <li className="practice-item subject-conjugation">
                <div className="practice-info">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      schedule
                    </span>
                  </div>
                  <div className="practice-details">
                    <h3 className="practice-title" title="Chia động từ: Les verbes réguliers en -ER">
                      <span className="practice-type">
                        Chia động từ:
                      </span>
                      {" "}
                      <a className="practice-link" href="#" data-route="/conjugation/lessons/present-regular-er" lang="fr">
                        Les verbes réguliers en -ER
                      </a>
                    </h3>
                    <p className="practice-date">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        schedule
                      </span>
                      {" "}
                      <time dateTime="2026-05-13T21:00:00+07:00">
                        13 tháng 5 lúc 21:00
                      </time>
                    </p>
                  </div>
                </div>
                <div className="practice-result">
                  <span className="practice-score">
                    75%
                  </span>
                  {" "}
                  <span className="practice-correct">
                    Đúng 15/20 câu
                  </span>
                </div>
              </li>
              <li className="practice-item subject-mixed">
                <div className="practice-info">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      casino
                    </span>
                  </div>
                  <div className="practice-details">
                    <h3 className="practice-title" title="Luyện tập tổng hợp">
                      <span className="practice-type">
                        Luyện tập tổng hợp
                      </span>
                    </h3>
                    <p className="practice-date">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        schedule
                      </span>
                      {" "}
                      <time dateTime="2026-05-12T20:40:00+07:00">
                        12 tháng 5 lúc 20:40
                      </time>
                    </p>
                  </div>
                </div>
                <div className="practice-result">
                  <span className="practice-score is-perfect">
                    100%
                  </span>
                  {" "}
                  <span className="practice-correct">
                    Đúng 10/10 câu
                  </span>
                </div>
              </li>
            </ul>
            {/* Shown when recent_practice is empty. */}
            <p className="empty-text" data-view="empty" hidden>
              Chưa có lần luyện tập nào. Kết quả sẽ xuất hiện ở đây sau khi bạn hoàn thành một bài luyện tập.
            </p>
          </section>
        </div>
      </main>
      {/* 8. Footer */}
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
