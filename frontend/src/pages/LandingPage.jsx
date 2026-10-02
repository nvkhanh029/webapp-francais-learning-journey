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
      Static public Landing page prototype (route "/"), normalized against the approved
      Dashboard (DashboardPage) and frontend-design.md (FD) §7. Plain CSS, no build step,
      no script.

      Data and routing:
      - Links use href="#" with the target React route in data-route (FD §4.2).
        No routing, authentication, or API logic.
      - The lesson and progress previews are illustrative sample UI. Their values reuse
        the Dashboard sample data and the API Contract example lesson; they are not
        product claims and must not be backed by invented logic.

      Page-specific values (no shared token applies) are marked "Landing-only" below.

      Page sections:
      1. Header (public: brand + Login / Start)
      2. Hero with lesson preview
      3. Learning areas (Vocabulary, Grammar, Conjugation)
      4. Learning flow
      5. Tracking progress
      6. Final call to action
      7. Footer
*/
import styles from "./LandingPage.module.css";
import usePageScript from "../hooks/usePageScript.js";

export default function LandingPage() {
  const rootRef = usePageScript(null, { title: "Français Learning Journey | Học tiếng Pháp" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header */}
      <header className="site-header">
        <div className="page-container header-content">
          <a className="brand" href="#" data-route="/">
            <img alt="Linh vật bánh sừng bò đeo kính, tay cầm sách" className="brand-logo" src="/images/logo.png" />
            {" "}
            <span className="brand-name">
              Français Learning Journey
            </span>
          </a>
          <nav className="header-actions" aria-label="Tài khoản">
            <a className="button button-secondary button-compact" href="#" data-route="/login">
              Đăng nhập
            </a>
            {" "}
            <a className="button button-primary button-compact header-start" href="#" data-route="/register">
              Bắt đầu học
            </a>
          </nav>
        </div>
      </header>
      <main className="landing" id="main-content">
        {/* 2. Hero */}
        <section className="page-container landing-section hero" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-content">
              <p className="badge">
                Học tiếng Pháp theo cách của bạn
              </p>
              <h1 className="hero-title" id="hero-title">
                Học tiếng Pháp tự do, rõ ràng và có hệ thống
              </h1>
              <p className="hero-lead">
                Học Từ vựng, Ngữ pháp và Chia động từ theo từng bài, luyện tập sau khi học và theo dõi tiến độ của bạn.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#" data-route="/register">
                  <span>
                    Bắt đầu học
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_forward
                  </span>
                </a>
                {" "}
                <a className="button button-secondary" href="#" data-route="/login">
                  Đăng nhập
                </a>
              </div>
              <p className="hero-note">
                <span className="material-symbols-outlined" aria-hidden="true">
                  check_circle
                </span>
                {" "}
                <span>
                  Không khóa bài học. Học theo nhịp của riêng bạn.
                </span>
              </p>
            </div>
            {/* Illustrative lesson preview. Title and forms follow the API Contract example lesson. */}
            <figure className="card lesson-preview subject-grammar">
              <figcaption className="preview-header">
                <span className="badge">
                  Ngữ pháp
                </span>
                {" "}
                <span className="preview-caption">
                  Bài học mẫu
                </span>
              </figcaption>
              <div>
                <p className="preview-title" lang="fr">
                  Les articles définis
                </p>
                <p className="preview-subtitle">
                  Mạo từ xác định
                </p>
              </div>
              <ul className="plain-list preview-rules">
                <li className="preview-rule">
                  <span className="preview-form" lang="fr">
                    le
                  </span>
                  <span>
                    Giống đực, số ít
                  </span>
                </li>
                <li className="preview-rule">
                  <span className="preview-form" lang="fr">
                    la
                  </span>
                  <span>
                    Giống cái, số ít
                  </span>
                </li>
                <li className="preview-rule">
                  <span className="preview-form" lang="fr">
                    les
                  </span>
                  <span>
                    Số nhiều
                  </span>
                </li>
              </ul>
              <div className="preview-actions">
                <span className="preview-chip">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    task_alt
                  </span>
                  Đánh dấu đã học
                </span>
                {" "}
                <span className="preview-chip">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    bookmark
                  </span>
                  Xem lại sau
                </span>
                {" "}
                <span className="preview-chip">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    edit_note
                  </span>
                  Luyện tập
                </span>
              </div>
            </figure>
          </div>
        </section>
        {/* 3. Learning areas: same module order, icons, and accents as the Dashboard. */}
        <section className="page-container landing-section" aria-labelledby="modules-title">
          <div className="section-intro">
            <h2 className="landing-heading" id="modules-title">
              Bạn có thể học gì?
            </h2>
            <p className="section-description">
              Ba phần học chính, mỗi phần có nội dung học và bài luyện tập riêng.
            </p>
          </div>
          <ul className="plain-list module-grid">
            <li className="card subject-vocabulary">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">
                  style
                </span>
              </div>
              <h3 className="module-title">
                Từ vựng
              </h3>
              <p className="module-description">
                Mở rộng vốn từ theo chủ đề, ngữ cảnh và các nhóm từ thường gặp.
              </p>
              <ul className="plain-list module-points">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Đa dạng chủ đề từ vựng.
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Bảng chữ cái và dấu tiếng Pháp
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Luyện tập sau mỗi bài
                </li>
              </ul>
            </li>
            <li className="card subject-grammar">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">
                  draw
                </span>
              </div>
              <h3 className="module-title">
                Ngữ pháp
              </h3>
              <p className="module-description">
                Học các quy tắc và cấu trúc ngữ pháp theo từng nhóm.
              </p>
              <ul className="plain-list module-points">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Bài học sắp xếp theo phần và chương
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Lý thuyết kèm ví dụ trong từng bài
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Luyện tập sau mỗi bài
                </li>
              </ul>
            </li>
            <li className="card subject-conjugation">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">
                  schedule
                </span>
              </div>
              <h3 className="module-title">
                Chia động từ
              </h3>
              <p className="module-description">
                Học cách chia động từ theo thì, nhóm và các mẫu chia phổ biến.
              </p>
              <ul className="plain-list module-points">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Bài học sắp xếp theo từng thì
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Quy tắc và mẫu chia động từ trong từng bài
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  Luyện tập sau mỗi bài
                </li>
              </ul>
            </li>
          </ul>
        </section>
        {/* 4. Learning flow */}
        <section className="page-container landing-section" aria-labelledby="flow-title">
          <div className="section-intro">
            <p className="badge">
              Lộ trình mở
            </p>
            <h2 className="landing-heading" id="flow-title">
              Học theo nhịp của riêng bạn
            </h2>
            <p className="section-description">
              Bạn có thể học bất kỳ nội dung nào mà không cần hoàn thành bài trước.
            </p>
            <p className="section-note">
              Không có bài học bị khóa và không cần đạt điểm tối thiểu để mở nội dung tiếp theo.
            </p>
          </div>
          <ol className="plain-list steps">
            <li className="step">
              <div className="icon-tile icon-tile-compact" aria-hidden="true">
                <span className="material-symbols-outlined">
                  touch_app
                </span>
              </div>
              <div>
                <p className="step-number">
                  Bước 1
                </p>
                <h3 className="step-title">
                  Chọn nội dung muốn học
                </h3>
                <p className="step-description">
                  Chọn Từ vựng, Ngữ pháp hoặc Chia động từ theo nhu cầu của bạn.
                </p>
              </div>
            </li>
            <li className="step">
              <div className="icon-tile icon-tile-compact" aria-hidden="true">
                <span className="material-symbols-outlined">
                  article
                </span>
              </div>
              <div>
                <p className="step-number">
                  Bước 2
                </p>
                <h3 className="step-title">
                  Xem lý thuyết và ví dụ
                </h3>
                <p className="step-description">
                  Đọc nội dung bài học với phần giải thích và ví dụ.
                </p>
              </div>
            </li>
            <li className="step">
              <div className="icon-tile icon-tile-compact" aria-hidden="true">
                <span className="material-symbols-outlined">
                  quiz
                </span>
              </div>
              <div>
                <p className="step-number">
                  Bước 3
                </p>
                <h3 className="step-title">
                  Làm bài luyện tập
                </h3>
                <p className="step-description">
                  Trả lời câu hỏi trắc nghiệm, điền vào chỗ trống hoặc sắp xếp câu.
                </p>
              </div>
            </li>
            <li className="step">
              <div className="icon-tile icon-tile-compact" aria-hidden="true">
                <span className="material-symbols-outlined">
                  fact_check
                </span>
              </div>
              <div>
                <p className="step-number">
                  Bước 4
                </p>
                <h3 className="step-title">
                  Xem kết quả và đáp án
                </h3>
                <p className="step-description">
                  Sau khi nộp bài, xem câu nào đúng, câu nào sai và đáp án đúng.
                </p>
              </div>
            </li>
            <li className="step">
              <div className="icon-tile icon-tile-compact" aria-hidden="true">
                <span className="material-symbols-outlined">
                  insights
                </span>
              </div>
              <div>
                <p className="step-number">
                  Bước 5
                </p>
                <h3 className="step-title">
                  Theo dõi tiến độ
                </h3>
                <p className="step-description">
                  Đánh dấu bài đã học, lưu bài để xem lại sau và giữ chuỗi ngày học.
                </p>
              </div>
            </li>
          </ol>
        </section>
        {/* 5. Tracking progress */}
        <section className="page-container landing-section" aria-labelledby="tracking-title">
          <div className="tracking-grid">
            <div>
              <div className="section-intro">
                <h2 className="landing-heading" id="tracking-title">
                  Theo dõi quá trình học
                </h2>
                <p className="section-description">
                  Theo dõi tiến độ, tiếp tục nội dung đang học và duy trì thói quen luyện tập.
                </p>
              </div>
              <ul className="plain-list feature-list">
                <li className="feature-item">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      auto_stories
                    </span>
                  </div>
                  <div>
                    <h3 className="feature-title">
                      Tiến độ học tập
                    </h3>
                    <p className="feature-description">
                      Xem tiến độ Từ vựng, Ngữ pháp và Chia động từ theo số bài bạn đã đánh dấu đã học.
                    </p>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      menu_book
                    </span>
                  </div>
                  <div>
                    <h3 className="feature-title">
                      Tiếp tục học
                    </h3>
                    <p className="feature-description">
                      Quay lại bài bạn mở gần nhất nhưng chưa đánh dấu đã học.
                    </p>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      local_fire_department
                    </span>
                  </div>
                  <div>
                    <h3 className="feature-title">
                      Chuỗi ngày học
                    </h3>
                    <p className="feature-description">
                      Hoàn thành một bài luyện tập hoặc luyện tập tổng hợp mỗi ngày để giữ chuỗi ngày học.
                    </p>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      casino
                    </span>
                  </div>
                  <div>
                    <h3 className="feature-title">
                      Luyện tập tổng hợp
                    </h3>
                    <p className="feature-description">
                      Luyện tập với câu hỏi từ các bài bạn đã đánh dấu là đã học.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            {/* Illustrative progress preview; values mirror the Dashboard sample data. */}
            <figure className="card progress-preview">
              <figcaption className="card-heading">
                <div className="icon-tile icon-tile-compact" aria-hidden="true">
                  <span className="material-symbols-outlined">
                    auto_stories
                  </span>
                </div>
                <div>
                  <p className="preview-card-title">
                    Tiến độ học tập
                  </p>
                  <p className="card-subtitle">
                    Dữ liệu minh họa
                  </p>
                </div>
              </figcaption>
              <div className="preview-progress-list">
                <div className="subject-vocabulary">
                  <div className="progress-labels">
                    <span>
                      Từ vựng
                    </span>
                    {" "}
                    <span className="progress-value">
                      72%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-label="Tiến độ Từ vựng" aria-valuemax="100" aria-valuemin="0" aria-valuenow="72" style={{ "--progress": "72%" }}>
                    <div className="progress-fill" />
                  </div>
                </div>
                <div className="subject-grammar">
                  <div className="progress-labels">
                    <span>
                      Ngữ pháp
                    </span>
                    {" "}
                    <span className="progress-value">
                      62%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-label="Tiến độ Ngữ pháp" aria-valuemax="100" aria-valuemin="0" aria-valuenow="62" style={{ "--progress": "62%" }}>
                    <div className="progress-fill" />
                  </div>
                </div>
                <div className="subject-conjugation">
                  <div className="progress-labels">
                    <span>
                      Chia động từ
                    </span>
                    {" "}
                    <span className="progress-value">
                      48%
                    </span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-label="Tiến độ Chia động từ" aria-valuemax="100" aria-valuemin="0" aria-valuenow="48" style={{ "--progress": "48%" }}>
                    <div className="progress-fill" />
                  </div>
                </div>
              </div>
              <p className="preview-streak">
                <span>
                  Chuỗi ngày học
                </span>
                {" "}
                <span className="badge">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    local_fire_department
                  </span>
                  {" "}
                  <span>
                    14 ngày liên tiếp
                  </span>
                </span>
              </p>
            </figure>
          </div>
        </section>
        {/* 6. Final call to action */}
        <section className="page-container landing-section" aria-labelledby="cta-title">
          <div className="cta-panel">
            <img alt="Linh vật bánh sừng bò đeo kính, tay cầm sách" className="cta-mascot" src="/images/logo.png" />
            <h2 className="landing-heading" id="cta-title">
              Sẵn sàng bắt đầu học tiếng Pháp?
            </h2>
            <p className="cta-description">
              Tạo tài khoản và bắt đầu với nội dung bạn muốn học ngay hôm nay.
            </p>
            <a className="button button-primary" href="#" data-route="/register">
              <span>
                Bắt đầu học
              </span>
              {" "}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
            <p className="cta-login">
              Đã có tài khoản?
              {" "}
              <a className="text-link" href="#" data-route="/login">
                Đăng nhập
              </a>
            </p>
            <ul className="plain-list cta-highlights">
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  check
                </span>
                Tự do chọn nội dung
              </li>
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  check
                </span>
                Không khóa bài học
              </li>
            </ul>
          </div>
        </section>
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
    </div>
  );
}
