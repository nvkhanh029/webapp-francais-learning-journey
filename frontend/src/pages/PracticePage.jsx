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
      Static Practice page prototype (frontend-design.md (FD) §4.6, §4.7, §5.8, §7.12, §7.13, §8.7).
      One page, one route (/practice/:unitSlug). Practice Result is NOT a separate route: answering,
      reviewing and result are phases of this same page (FD §4.7). Mixed Practice lives in MixedPracticePage.

      Normalized against the Dashboard baseline and stitch-ui-guidelines.md: shared tokens, container,
      page-padding scale, card / button / badge / progress / icon-tile / state-note / page-state
      patterns, breakpoints 640 / 768 / 1024, focus ring, reduced motion.

      Data:
      - Question and result values below are SAMPLE data shaped like the Practice Start / Submit responses.
        Production components receive them from the API. The prototype never scores anything: the result
        phase renders a fixed sample response as-is (backend is authoritative, FD §3.3, §13.17).
      - Links and buttons that navigate use href="#" with the target React route in data-route.
        No API, authentication, routing or persistence logic (FD §5.8: Practice state is temporary).

      Practice-specific exceptions (documented per stitch-ui-guidelines.md §9, tier 3):
      - Narrow focused column (max-width 52rem) instead of the 1280px dashboard grid.
      - Success / danger status roles (--color-success*, --color-danger*): FD §7.3 says to define them when
        Practice Result first needs them. They are never the only cue (icon + text + border style).
      - Answer option cards, fill-blank input, ordering chips, question stepper, result review rows.

      Preview states (prototype only), via the URL query string:
        (none)                    answering, empty answers
        ?preview=answering-partial  answering with some answers filled in
        ?preview=reviewing        review before final submit (all answered)
        ?preview=reviewing-incomplete  review with unanswered questions (final submit blocked)
        ?preview=submit-error     review with a failed final submit
        ?preview=result           submitted result (normal Practice)
        ?preview=loading          Practice loading state
        ?preview=error            Practice load error state

      Page sections:
      1. Header (with compact menu below 768px)
      2. Breadcrumbs
      3. Practice header (title, progress, question stepper)
      4. Page states (loading / error)
      5. Answering phase
      6. Reviewing phase
      7. Result phase
      8. Footer
*/
import styles from "./PracticePage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import init from "./PracticePage.script.js";

export default function PracticePage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Luyện tập", lang: "vi" });

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
          {/* Practice is not a main navigation item (FD §4.4), so no link is marked current. */}
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
      <main className="page-container practice-page" id="main-content">
        <div className="practice-shell">
          {/* 2. Breadcrumbs. Normal Practice: module (link) > unit (link) > current page. */}
          <nav className="breadcrumbs" aria-label="Đường dẫn trang">
            <ol className="breadcrumb-list" data-crumbs="normal">
              <li>
                <a className="crumb-link subject-conjugation" href="#" data-route="/conjugation">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    schedule
                  </span>
                  {" "}
                  <span>
                    Chia động từ
                  </span>
                </a>
              </li>
              <li>
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <a className="crumb-link crumb-mid subject-conjugation" href="#" data-route="/conjugation/lessons/present-regular-er" lang="fr">
                  Les verbes réguliers en -ER
                </a>
              </li>
              <li>
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page">
                  Luyện tập
                </span>
              </li>
            </ol>
          </nav>
          {/* 3. Practice header. Progress and stepper are shown only while answering / reviewing. */}
          <section className="card practice-header" aria-labelledby="practice-title" data-practice-header>
            <div className="practice-heading">
              <div className="icon-tile icon-tile-solid subject-conjugation" aria-hidden="true" data-header-tile>
                <span className="material-symbols-outlined" data-header-icon>
                  schedule
                </span>
              </div>
              <div className="practice-heading-text">
                {/* Title is API-provided (title_fr); "Luyện tập tổng hợp" is fixed copy for Mixed Practice. */}
                <h1 className="practice-title" id="practice-title" data-practice-title lang="fr">
                  Les verbes réguliers en -ER
                </h1>
                <p className="practice-description" data-practice-description>
                  Trả lời tất cả câu hỏi, xem lại rồi nộp bài. Bạn có thể sửa câu trả lời bất cứ lúc nào trước khi nộp; đáp án đúng chỉ hiện sau khi bạn nộp bài.
                </p>
              </div>
            </div>
            <div className="practice-progress" data-progress-block>
              <div className="progress-labels">
                <span id="progress-label">
                  Đã trả lời
                </span>
                {" "}
                <span className="progress-value" data-answered-text>
                  0/6 câu
                </span>
              </div>
              <div className="progress-track" role="progressbar" aria-labelledby="progress-label" aria-valuemin="0" aria-valuemax="6" aria-valuenow="0" data-progressbar>
                <div className="progress-fill" data-progress-fill />
              </div>
              <nav className="stepper-row" aria-label="Danh sách câu hỏi" data-stepper-nav>
                <ol className="stepper" data-stepper />
                {/* Global action: ends the answering phase from ANY question and opens Review.
                             It is not the final submission (that stays in the Review phase).
                */}
                <button className="button button-secondary button-compact finish-button" type="button" data-action="finish">
                  <span>
                    Hoàn thành bài
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    fact_check
                  </span>
                </button>
              </nav>
            </div>
          </section>
          {/* 4. Page states (FD §6.6). Shown instead of the Practice content. */}
          <div className="card page-state" data-page-state="loading" role="status" hidden>
            <div className="spinner" aria-hidden="true" />
            <p>
              Đang tải bài luyện tập…
            </p>
          </div>
          <div className="card page-state" data-page-state="error" role="alert" hidden>
            <span className="material-symbols-outlined" aria-hidden="true">
              cloud_off
            </span>
            <h1 className="page-state-title">
              Không thể tải bài luyện tập
            </h1>
            <p>
              Đã có lỗi khi tải dữ liệu. Vui lòng thử lại.
            </p>
            <button className="button button-secondary button-compact" type="button" data-action="retry-page">
              Thử lại
            </button>
          </div>
          <div data-practice-content>
            {/* 5. Answering phase: one question at a time (markup generated by the script below). */}
            <section className="practice-section" data-phase="answering" aria-label="Làm bài luyện tập">
              <article className="card question-card" aria-labelledby="question-heading">
                <div className="question-meta">
                  <h2 className="question-number" id="question-heading" tabIndex="-1" data-question-heading>
                    Câu 1/6
                  </h2>
                  <span className="badge" data-question-type />
                </div>
                <p className="question-instruction" data-question-instruction />
                <div data-question-body />
                <p className="badge" role="status" data-answer-status />
              </article>
              <div className="question-nav">
                <button className="button button-secondary button-back" type="button" data-action="previous">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>
                  {" "}
                  <span>
                    Câu trước
                  </span>
                </button>
                {" "}
                <button className="button button-primary" type="button" data-action="next">
                  <span data-next-label>
                    Câu tiếp theo
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
              </div>
            </section>
            {/* 6. Reviewing phase: neutral summary of answers. Correctness is NOT revealed here. */}
            <section className="practice-section" data-phase="reviewing" aria-labelledby="review-title" hidden>
              <div className="card">
                <div className="card-heading">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      fact_check
                    </span>
                  </div>
                  <div>
                    <h2 className="section-title" id="review-title" tabIndex="-1">
                      Xem lại câu trả lời
                    </h2>
                    <p className="card-subtitle">
                      Kiểm tra lại trước khi nộp. Bạn vẫn có thể sửa từng câu.
                    </p>
                  </div>
                </div>
                <p className="state-note review-note">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    info
                  </span>
                  {" "}
                  <span>
                    Đáp án đúng và giải thích chỉ hiện sau khi bạn nộp bài. Nộp bài xong, kết quả sẽ được ghi lại trong lịch sử luyện tập.
                  </span>
                </p>
                {/* Shown while some questions are unanswered; final submit stays blocked. */}
                <div className="state-note review-note" role="status" data-review-incomplete hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    edit_note
                  </span>
                  <div className="state-note-body">
                    <strong data-incomplete-text />
                    {" "}
                    Hãy trả lời các câu còn thiếu để có thể nộp bài.
                    {" "}
                    <button className="button button-secondary button-compact" type="button" data-action="answer-missing">
                      <span data-missing-label>
                        Trả lời câu chưa làm
                      </span>
                    </button>
                  </div>
                </div>
                <ol className="review-list" data-review-list />
                {/* Final submit failed (FD §7.12): answers are kept, retry submits again. */}
                <div className="state-note state-note-danger submit-error" role="alert" data-submit-error hidden>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    error
                  </span>
                  <div className="state-note-body">
                    <strong>
                      Không thể nộp bài luyện tập
                    </strong>
                    {" "}
                    Câu trả lời của bạn vẫn được giữ lại. Vui lòng thử lại.
                    {" "}
                    <button className="button button-secondary button-compact" type="button" data-action="submit">
                      Thử lại
                    </button>
                  </div>
                </div>
                <p className="review-submit-hint" id="submit-hint" data-submit-hint hidden>
                  Trả lời hết các câu để nộp bài.
                </p>
                <div className="review-actions">
                  <button className="button button-secondary button-back" type="button" data-action="continue-editing">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_back
                    </span>
                    {" "}
                    <span>
                      Tiếp tục làm bài
                    </span>
                  </button>
                  {" "}
                  <button className="button button-primary" type="button" data-action="submit" data-submit-main aria-describedby="submit-hint">
                    <span data-submit-label>
                      Nộp bài luyện tập
                    </span>
                    {" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      send
                    </span>
                  </button>
                </div>
              </div>
            </section>
            {/* 7. Result phase: rendered from the (sample) Submit response. */}
            <section className="practice-section" data-phase="result" aria-labelledby="result-title" hidden>
              <div className="card result-summary">
                <div className="card-heading">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      emoji_events
                    </span>
                  </div>
                  <div>
                    <h2 className="section-title" id="result-title" tabIndex="-1">
                      Kết quả luyện tập
                    </h2>
                    <p className="card-subtitle">
                      Bạn đã hoàn thành bài luyện tập. Xem lại từng câu bên dưới để nắm chắc hơn nhé!
                    </p>
                  </div>
                </div>
                <div>
                  <p className="result-score">
                    <span className="result-count" data-result-count>
                      4/6
                    </span>
                    {" "}
                    <span className="result-count-label">
                      câu đúng
                    </span>
                  </p>
                </div>
                <div>
                  <div className="progress-labels">
                    <span id="accuracy-label">
                      Độ chính xác
                    </span>
                    {" "}
                    <span className="progress-value" data-result-accuracy>
                      67%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-labelledby="accuracy-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="67" data-result-bar>
                    <div className="progress-fill" />
                  </div>
                </div>
              </div>
              <div className="card practice-section" aria-labelledby="question-review-title">
                <div className="card-heading result-list-heading">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      rule
                    </span>
                  </div>
                  <div>
                    <h2 className="section-title" id="question-review-title">
                      Xem lại từng câu
                    </h2>
                    <p className="card-subtitle">
                      Câu trả lời của bạn, đáp án đúng và giải thích.
                    </p>
                  </div>
                </div>
                <ol className="result-list" data-result-list />
              </div>
              <div className="action-bar">
                <a className="button button-secondary button-back" href="#" data-action="back-to-learning" data-route="/conjugation/lessons/present-regular-er">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>
                  {" "}
                  <span>
                    Quay lại bài học
                  </span>
                </a>
                {" "}
                <a className="button button-secondary" href="#" data-route="/dashboard">
                  <span>
                    Về bảng điều khiển
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_forward
                  </span>
                </a>
                {" "}
                <button className="button button-primary" type="button" data-action="practice-again">
                  <span>
                    Luyện tập lại
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    replay
                  </span>
                </button>
              </div>
            </section>
          </div>
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
