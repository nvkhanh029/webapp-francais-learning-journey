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
import ProgressBar from "../components/common/ProgressBar.jsx";
import styles from "./LandingPage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import { t } from "../i18n/index.js";

export default function LandingPage() {
  const rootRef = usePageScript(null, { title: "title.landing" });

  return (
    <div className={`page-body ${styles.page}`} ref={rootRef}>
      <main className="landing" id="main-content">
        {/* 2. Hero */}
        <section className="page-container landing-section hero" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-content">
              <p className="badge">
                {t("landing.heroEyebrow")}
              </p>
              <h1 className="hero-title" id="hero-title">
                {t("landing.heroTitle")}
              </h1>
              <p className="hero-lead">
                {t("landing.heroText")}
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#" data-route="/register">
                  <span>
                    {t("landing.start")}
                  </span>
                  {" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_forward
                  </span>
                </a>
                {" "}
                <a className="button button-secondary" href="#" data-route="/login">
                  {t("common.loginAction")}
                </a>
              </div>
              <p className="hero-note">
                <span className="material-symbols-outlined" aria-hidden="true">
                  check_circle
                </span>
                {" "}
                <span>
                  {t("landing.heroNote")}
                </span>
              </p>
            </div>
            {/* Illustrative lesson preview. Title and forms follow the API Contract example lesson. */}
            <figure className="card lesson-preview subject-grammar">
              <figcaption className="preview-header">
                <span className="badge">
                  {t("common.grammar")}
                </span>
                {" "}
                <span className="preview-caption">
                  {t("landing.sampleLesson")}
                </span>
              </figcaption>
              <div>
                <p className="preview-title" lang="fr">
                  Les articles définis
                </p>
                <p className="preview-subtitle">
                  {t("landing.definiteArticles")}
                </p>
              </div>
              <ul className="plain-list preview-rules">
                <li className="preview-rule">
                  <span className="preview-form" lang="fr">
                    le
                  </span>
                  <span>
                    {t("landing.masculineSingular")}
                  </span>
                </li>
                <li className="preview-rule">
                  <span className="preview-form" lang="fr">
                    la
                  </span>
                  <span>
                    {t("landing.feminineSingular")}
                  </span>
                </li>
                <li className="preview-rule">
                  <span className="preview-form" lang="fr">
                    les
                  </span>
                  <span>
                    {t("landing.plural")}
                  </span>
                </li>
              </ul>
              <div className="preview-actions">
                <span className="preview-chip">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    task_alt
                  </span>
                  {t("common.markLearned")}
                </span>
                {" "}
                <span className="preview-chip">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    bookmark
                  </span>
                  {t("common.reviewLater")}
                </span>
                {" "}
                <span className="preview-chip">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    edit_note
                  </span>
                  {t("common.practice")}
                </span>
              </div>
            </figure>
          </div>
        </section>
        {/* 3. Learning areas: same module order, icons, and accents as the Dashboard. */}
        <section className="page-container landing-section" aria-labelledby="modules-title">
          <div className="section-intro">
            <h2 className="landing-heading" id="modules-title">
              {t("landing.whatTitle")}
            </h2>
            <p className="section-description">
              {t("landing.whatText")}
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
                {t("common.vocabulary")}
              </h3>
              <p className="module-description">
                {t("dashboard.vocabularyText")}
              </p>
              <ul className="plain-list module-points">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.vocabularyVariety")}
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("common.alphabetTitle")}
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.practiceAfterEach")}
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
                {t("common.grammar")}
              </h3>
              <p className="module-description">
                {t("dashboard.grammarText")}
              </p>
              <ul className="plain-list module-points">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.grammarOrder")}
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.grammarTheory")}
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.practiceAfterEach")}
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
                {t("common.conjugation")}
              </h3>
              <p className="module-description">
                {t("dashboard.conjugationText")}
              </p>
              <ul className="plain-list module-points">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.conjugationOrder")}
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.conjugationRules")}
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                  {t("landing.practiceAfterEach")}
                </li>
              </ul>
            </li>
          </ul>
        </section>
        {/* 4. Learning flow */}
        <section className="page-container landing-section" aria-labelledby="flow-title">
          <div className="section-intro">
            <p className="badge">
              {t("landing.openPathTag")}
            </p>
            <h2 className="landing-heading" id="flow-title">
              {t("landing.openPathTitle")}
            </h2>
            <p className="section-description">
              {t("landing.openPathText")}
            </p>
            <p className="section-note">
              {t("landing.openPathNote")}
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
                  {t("landing.step1")}
                </p>
                <h3 className="step-title">
                  {t("landing.step1Title")}
                </h3>
                <p className="step-description">
                  {t("landing.step1Text")}
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
                  {t("landing.step2")}
                </p>
                <h3 className="step-title">
                  {t("landing.step2Title")}
                </h3>
                <p className="step-description">
                  {t("landing.step2Text")}
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
                  {t("landing.step3")}
                </p>
                <h3 className="step-title">
                  {t("landing.step3Title")}
                </h3>
                <p className="step-description">
                  {t("landing.step3Text")}
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
                  {t("landing.step4")}
                </p>
                <h3 className="step-title">
                  {t("landing.step4Title")}
                </h3>
                <p className="step-description">
                  {t("landing.step4Text")}
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
                  {t("landing.step5")}
                </p>
                <h3 className="step-title">
                  {t("landing.step5Title")}
                </h3>
                <p className="step-description">
                  {t("landing.step5Text")}
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
                  {t("landing.trackTitle")}
                </h2>
                <p className="section-description">
                  {t("landing.trackText")}
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
                      {t("common.learningProgress")}
                    </h3>
                    <p className="feature-description">
                      {t("landing.trackProgress")}
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
                      {t("common.continueLearning")}
                    </h3>
                    <p className="feature-description">
                      {t("landing.trackContinue")}
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
                      {t("landing.trackStreak")}
                    </h3>
                    <p className="feature-description">
                      {t("dashboard.tipText")}
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
                      {t("common.mixedPractice")}
                    </h3>
                    <p className="feature-description">
                      {t("landing.trackMixed")}
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
                    {t("common.learningProgress")}
                  </p>
                  <p className="card-subtitle">
                    {t("common.dataPending")}
                  </p>
                </div>
              </figcaption>
              <div className="preview-progress-list">
                <div className="subject-vocabulary">
                  <ProgressBar label={t("common.vocabulary")} percent={72} ariaLabel={t("common.progressVocabulary")} />
                </div>
                <div className="subject-grammar">
                  <ProgressBar label={t("common.grammar")} percent={62} ariaLabel={t("common.progressGrammar")} />
                </div>
                <div className="subject-conjugation">
                  <ProgressBar label={t("common.conjugation")} percent={48} ariaLabel={t("common.progressConjugation")} />
                </div>
              </div>
              <p className="preview-streak">
                <span>
                  {t("landing.trackStreak")}
                </span>
                {" "}
                <span className="badge">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    local_fire_department
                  </span>
                  {" "}
                  <span>
                    {t("common.daysInARowN", { n: 14 })}
                  </span>
                </span>
              </p>
            </figure>
          </div>
        </section>
        {/* 6. Final call to action */}
        <section className="page-container landing-section" aria-labelledby="cta-title">
          <div className="cta-panel">
            <img alt={t("common.mascotAlt")} className="cta-mascot" src="/images/logo.png" />
            <h2 className="landing-heading" id="cta-title">
              {t("landing.ctaTitle")}
            </h2>
            <p className="cta-description">
              {t("landing.ctaText")}
            </p>
            <a className="button button-primary" href="#" data-route="/register">
              <span>
                {t("landing.start")}
              </span>
              {" "}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
            <p className="cta-login">
              {t("common.hasAccount")}
              {" "}
              <a className="text-link" href="#" data-route="/login">
                {t("common.loginAction")}
              </a>
            </p>
            <ul className="plain-list cta-highlights">
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  check
                </span>
                {t("landing.freeChoice")}
              </li>
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  check
                </span>
                {t("landing.noLocks")}
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
