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
      Static Mixed Practice page prototype (route /mixed-practice).
      Sources: Requirements §8.3, §9 (Mixed Practice), frontend-design.md §4.6, §4.7, §5.8, §7.12, §8.7,
      the CURRENT normalized PracticePage (active answering / review / result interaction) and the
      CURRENT DashboardPage (Mixed Practice entry identity, app shell, tokens).

      One page, one route. Practice Result is NOT a separate route: pre-start, starting, answering,
      reviewing and result are phases of this same page (FD §4.7). There is no /mixed-practice/result.

      Decisions against the raw Stitch draft:
      - Optional Mixed Practice filters are REMOVED. They are "Should Have" (Requirements §9.4, §18.2), no
        CURRENT Project file selects them for implementation, so Mixed Practice must start without any
        configuration. (No difficulty / CEFR / weak-area / lesson selection either.)
      - No hard-coded 10 questions. The session size is data-driven (total_questions may be < 10); the
        prototype sample uses 7 questions. The stepper, progress and review all follow the real count.
      - No per-question source labels (Grammar / Vocabulary / Conjugation). The Start response does not
        expose them; the backend derives Content Covered after submit.
      - No fixed module / question-type quotas are implied anywhere in the copy.
      - Answering, Review, incomplete Review, submit error and Result reuse the practice-page patterns.
        "Hoàn thành bài" opens Review from ANY question; it is not the final submit.
      - Result adds "Nội dung đã luyện tập" (Content Covered): distinct learning units of THIS session
        (slug, unit_type, title_fr, localized title). French title is primary. Links only use supported
        routes (/grammar/lessons/{slug}, /vocabulary/study-units/{slug}, /conjugation/lessons/{slug}).
      - No pass/fail, no minimum score, no module-progress or "Mixed progress" copy, no timer / XP / hearts.
      - Mixed Practice is not a main navigation item, so no nav link is marked current.
      - Unavailable (no learned content) is an informational state, separate from the start error state.

      Data:
      - Question and result values below are SAMPLE data shaped like the Mixed Practice Start / Submit
        responses. Production components receive them from the API. The prototype never scores anything,
        never selects questions and never decides eligibility (backend is authoritative, FD §3.3, §13.17).
      - Links and buttons that navigate use href="#" with the target React route in data-route.
        No API, authentication, routing or persistence logic (FD §5.8: Practice state is temporary).

      Preview states (prototype only), via the URL query string:
        (none)                       pre-start, available
        ?preview=unavailable         no learned content, Mixed Practice not available
        ?preview=starting            session is being generated
        ?preview=start-error         session generation failed
        ?preview=answering           generated session, empty answers
        ?preview=answering-partial   generated session with some answers filled in
        ?preview=reviewing           review before final submit (all answered)
        ?preview=reviewing-incomplete  review with unanswered questions (final submit blocked)
        ?preview=submit-error        review with a failed final submit
        ?preview=result              submitted result + Content Covered

      Page sections:
      1. Header (with compact menu below 768px)
      2. Breadcrumbs
      3. Practice header (title, progress, question stepper)
      4. Pre-start and page states (available / unavailable / starting / start error)
      5. Answering phase
      6. Reviewing phase
      7. Result phase (summary, Content Covered, question review)
      8. Footer
*/
import styles from "./MixedPracticePage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import init from "./MixedPracticePage.script.js";

export default function MixedPracticePage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Luyện tập tổng hợp", lang: "vi" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header. Mixed Practice is not a main navigation item (FD §4.4): no link is marked current. */}
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
          {/* 2. Breadcrumbs: Mixed Practice has no learning unit, so the trail returns to the Dashboard. */}
          <nav className="breadcrumbs" aria-label="Đường dẫn trang">
            <ol className="breadcrumb-list">
              <li>
                <a className="crumb-link" href="#" data-route="/dashboard">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>
                  {" "}
                  <span>
                    Bảng điều khiển
                  </span>
                </a>
              </li>
              <li>
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page">
                  Luyện tập tổng hợp
                </span>
              </li>
            </ol>
          </nav>
          {/* 3. Practice header. The progress block and question stepper are shown only while answering
                 (stepper) and answering / reviewing (progress). Their length follows total_questions.
          */}
          <section className="card practice-header" aria-labelledby="practice-title">
            <div className="practice-heading">
              <div className="icon-tile icon-tile-solid subject-mixed" aria-hidden="true">
                <span className="material-symbols-outlined">
                  casino
                </span>
              </div>
              <div className="practice-heading-text">
                <h1 className="practice-title" id="practice-title">
                  Luyện tập tổng hợp
                </h1>
                <p className="practice-description" data-practice-description>
                  Tối đa 10 câu hỏi ngẫu nhiên từ các bài bạn đã đánh dấu là đã học.
                </p>
              </div>
            </div>
            <div className="practice-progress" data-progress-block hidden>
              <div className="progress-labels">
                <span id="progress-label">
                  Đã trả lời
                </span>
                {" "}
                <span className="progress-value" data-answered-text>
                  0/0 câu
                </span>
              </div>
              <div className="progress-track" role="progressbar" aria-labelledby="progress-label" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" data-progressbar>
                <div className="progress-fill" />
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
          {/* 4a. Pre-start, available: a focused introduction. No configuration, no filters. */}
          <section className="card practice-section" data-phase="prestart" aria-labelledby="prestart-title">
            <div className="card-heading">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">
                  bolt
                </span>
              </div>
              <div>
                <h2 className="section-title" id="prestart-title" tabIndex="-1">
                  Sẵn sàng luyện tập
                </h2>
                <p className="card-subtitle">
                  Một thử thách nhỏ để củng cố kiến thức!
                </p>
              </div>
            </div>
            <ul className="prestart-list">
              <li className="prestart-item">
                <span className="material-symbols-outlined" aria-hidden="true">
                  task_alt
                </span>
                <div>
                  <p className="prestart-item-title">
                    Chỉ từ bài đã học
                  </p>
                  <p className="prestart-item-text">
                    Câu hỏi chỉ lấy từ các bài bạn đã đánh dấu là đã học.
                  </p>
                </div>
              </li>
              <li className="prestart-item">
                <span className="material-symbols-outlined" aria-hidden="true">
                  quiz
                </span>
                <div>
                  <p className="prestart-item-title">
                    Tối đa 10 câu hỏi
                  </p>
                  <p className="prestart-item-text">
                    Nếu chưa có đủ câu hỏi phù hợp, bạn sẽ nhận ít hơn 10 câu và không có câu nào bị lặp lại.
                  </p>
                </div>
              </li>
              <li className="prestart-item">
                <span className="material-symbols-outlined" aria-hidden="true">
                  category
                </span>
                <div>
                  <p className="prestart-item-title">
                    Nhiều dạng nội dung
                  </p>
                  <p className="prestart-item-text">
                    Câu hỏi có thể thuộc Ngữ pháp, Từ vựng và Chia động từ, tùy vào những bài bạn đã học.
                  </p>
                </div>
              </li>
            </ul>
            <p className="state-note prestart-note">
              <span className="material-symbols-outlined" aria-hidden="true">
                info
              </span>
              {" "}
              <span>
                Không cần đạt điểm tối thiểu. Hoàn thành bài luyện tập là đủ để tính vào chuỗi ngày học.
              </span>
            </p>
            <div className="action-bar">
              <button className="button button-primary" type="button" data-action="start">
                <span>
                  Bắt đầu luyện tập
                </span>
                {" "}
                <span className="material-symbols-outlined" aria-hidden="true">
                  bolt
                </span>
              </button>
            </div>
          </section>
          {/* 4b. Unavailable: normal informational state (mixed_practice.available is false). Not an error.
                 Eligibility is decided by the backend; this state is only a preview.
          */}
          <section className="card page-state" data-phase="unavailable" aria-labelledby="unavailable-title" hidden>
            <span className="material-symbols-outlined" aria-hidden="true">
              info
            </span>
            <h2 className="page-state-title" id="unavailable-title" tabIndex="-1">
              Chưa thể luyện tập tổng hợp
            </h2>
            <p>
              Hãy đánh dấu ít nhất một bài là đã học để bắt đầu luyện tập tổng hợp.
            </p>
            <p className="page-state-label" id="unavailable-links-label">
              Xem bài học
            </p>
            <div className="page-state-actions" role="group" aria-labelledby="unavailable-links-label">
              <a className="button button-secondary button-compact" href="#" data-route="/grammar">
                <span className="material-symbols-outlined" aria-hidden="true">
                  draw
                </span>
                {" "}
                <span>
                  Ngữ pháp
                </span>
              </a>
              {" "}
              <a className="button button-secondary button-compact" href="#" data-route="/vocabulary">
                <span className="material-symbols-outlined" aria-hidden="true">
                  style
                </span>
                {" "}
                <span>
                  Từ vựng
                </span>
              </a>
              {" "}
              <a className="button button-secondary button-compact" href="#" data-route="/conjugation">
                <span className="material-symbols-outlined" aria-hidden="true">
                  schedule
                </span>
                {" "}
                <span>
                  Chia động từ
                </span>
              </a>
            </div>
          </section>
          {/* 4c. Starting: the Start request is in flight (session generation). */}
          <section className="card page-state" data-phase="starting" role="status" aria-live="polite" hidden>
            <div className="spinner" aria-hidden="true" />
            <p>
              Đang tạo bài luyện tập…
            </p>
          </section>
          {/* 4d. Start error: a real request failure, distinct from "unavailable". */}
          <section className="card page-state" data-phase="start-error" role="alert" hidden>
            <span className="material-symbols-outlined" aria-hidden="true">
              cloud_off
            </span>
            <h2 className="page-state-title" tabIndex="-1">
              Không thể tải bài luyện tập
            </h2>
            <p>
              Đã có lỗi khi tạo bài luyện tập. Vui lòng thử lại.
            </p>
            <button className="button button-secondary button-compact" type="button" data-action="start">
              Thử lại
            </button>
          </section>
          {/* 5. Answering phase: one question at a time (markup generated by the script below).
                 Same structure as practice-page. No per-question source labels: the Start response does not
                 provide them.
          */}
          <section className="practice-section" data-phase="answering" aria-label="Làm bài luyện tập" hidden>
            <article className="card question-card" aria-labelledby="question-heading">
              <div className="question-meta">
                <h2 className="question-number" id="question-heading" tabIndex="-1" data-question-heading>
                  Câu 1
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
          {/* 7. Result phase: rendered from the (sample) Submit response. Not a separate route. */}
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
                  <span className="result-count" data-result-count />
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
                  <span className="progress-value" data-result-accuracy />
                </div>
                <div className="progress-track" role="progressbar" aria-labelledby="accuracy-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-result-bar>
                  <div className="progress-fill" />
                </div>
              </div>
            </div>
            {/* Content Covered (Requirements §9.2): distinct learning units represented by THIS session,
                     from the Submit response. Not all learned units, not the filters, not a guessed mix.
            */}
            <div className="card practice-section" aria-labelledby="covered-title">
              <div className="card-heading">
                <div className="icon-tile subject-mixed" aria-hidden="true">
                  <span className="material-symbols-outlined">
                    category
                  </span>
                </div>
                <div>
                  <h2 className="section-title" id="covered-title">
                    Nội dung đã luyện tập
                  </h2>
                  <p className="card-subtitle">
                    Các bài có câu hỏi trong lần luyện tập này.
                  </p>
                </div>
              </div>
              <div className="covered-groups" data-covered-groups />
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
            {/* No single source lesson exists, so there is no "Quay lại bài học" action. */}
            <div className="action-bar">
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
