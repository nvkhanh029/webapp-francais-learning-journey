/*
  Mixed Practice (route "/mixed-practice", protected).

  Data:
  - The run comes from POST /api/v1/mixed-practice/start (API §16.1). Mixed Practice draws questions
    only from learning units the learner has explicitly Marked as Learned (API §16, Requirements §9.1).
  - Mixed Practice has no single learning unit, so the Start response carries none (API §16.1) and the
    page keeps the Mixed accent throughout. After submission the response adds `content_covered`, which
    is current-result data only and is not persisted Practice History (API §17.3).
  - Filters are a deferred Should Have feature: any `filters` key returns 422 invalid_mixed_filters, so
    the request body stays empty (API §16.2). No filter UI is offered.
  - The page does not pre-check availability. It calls start and treats the authoritative
    `409 mixed_practice_unavailable` as the answer, showing the same inline notice (FD §5.4.7).
  - Answers stay in React state until final submission; the backend scores everything (API §17,
    FD §13.17).

  Phases (FD §5.6): prestart -> starting -> answering -> reviewing -> submitting -> result, plus
  start-error and unavailable.
*/
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PracticeHeader from "../features/practice/PracticeHeader.jsx";
import PracticeResult from "../features/practice/PracticeResult.jsx";
import PracticeReview from "../features/practice/PracticeReview.jsx";
import QuestionRenderer from "../features/practice/QuestionRenderer.jsx";
import usePractice from "../hooks/usePractice.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./MixedPracticePage.module.css";

// The pre-start explanation. These are fixed UI notes, not content returned by the API.
const PRESTART_NOTES = [
  { icon: "casino", titleKey: "mixed.readyTitle", textKey: "mixed.readyText" },
  { icon: "school", titleKey: "mixed.onlyLearnedTitle", textKey: "mixed.onlyLearnedText" },
  { icon: "shuffle", titleKey: "mixed.maxTitle", textKey: "mixed.maxText" },
];

export default function MixedPracticePage() {
  useLanguage();
  const practice = usePractice();
  const {
    phase,
    questions,
    answers,
    currentIndex,
    currentQuestion,
    result,
    error,
    unansweredCount,
    canReview,
    start,
    setAnswer,
    goTo,
    nextQuestion,
    previousQuestion,
    startReview,
    backToAnswering,
    submit,
    reset,
  } = practice;
  // 0 before the first run; bumped by "Practice again" so a genuinely new run is started.
  const [attempt, setAttempt] = useState(0);

  const isUnavailable = Boolean(error?.code === "mixed_practice_unavailable");
  const isStarting = phase === "loading" || phase === "submitting";
  const isAnswering = phase === "answering";
  const isReviewing = phase === "reviewing";
  const isResult = phase === "result";
  const isPrestart = phase === "idle";

  const begin = () => start({ mode: "mixed", token: `mixed:${attempt}` });

  // A StrictMode double-mount must not mint a second server-side run (API §18), which the token in
  // `start` guarantees. This effect only reacts to a deliberate retry after an attempt.
  useEffect(() => {
    if (attempt > 0) begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a retry is driven by `attempt` alone.
  }, [attempt]);

  const answeredIds = questions
    .map((question, index) => (answers[question.question_id] !== undefined ? index : -1))
    .filter((index) => index >= 0);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container practice-page" id="main-content">
        <div className="practice-shell">
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <Link className="crumb-link subject-mixed" to="/dashboard">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>{" "}
                  <span>{t("common.dashboard")}</span>
                </Link>
              </li>
              <li>
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>{" "}
                <span className="crumb-current" aria-current="page">
                  {t("common.mixedPractice")}
                </span>
              </li>
            </ol>
          </nav>

          <PracticeHeader
            title={t("common.mixedPractice")}
            description={isResult ? null : t("practice.mixedIntro")}
            icon="casino"
            subjectClass="subject-mixed"
            totalQuestions={questions.length}
            answeredIds={answeredIds}
            currentIndex={currentIndex}
            onJumpTo={goTo}
          />

          {/* Pre-start: what Mixed Practice does, then an explicit Start. */}
          {isPrestart && (
            <section className="practice-section">
              <div className="card">
                <div className="card-heading">
                  <div className="icon-tile" aria-hidden="true">
                    <span className="material-symbols-outlined">casino</span>
                  </div>
                  <div>
                    <h2 className="section-title">{t("mixed.readyTitle")}</h2>
                    <p className="card-subtitle">{t("mixed.readyText")}</p>
                  </div>
                </div>
                <ul className="prestart-list">
                  {PRESTART_NOTES.map((note) => (
                    <li className="prestart-item" key={note.titleKey}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {note.icon}
                      </span>
                      <div>
                        <p className="prestart-item-title">{t(note.titleKey)}</p>
                        <p className="prestart-item-text">{t(note.textKey)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="state-note prestart-note">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    info
                  </span>{" "}
                  <span>{t("mixed.noMinimum")}</span>
                </p>
                <div className="action-bar">
                  <button className="button button-primary" type="button" onClick={begin}>
                    <span>{t("common.startPractice")}</span>{" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      bolt
                    </span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {isStarting && <LoadingState message={t("mixed.creating")} />}

          {/* The authoritative eligibility answer: no learned unit means no Mixed Practice (API §16.1). */}
          {isUnavailable && (
            <section className="card page-state" role="status">
              <span className="material-symbols-outlined" aria-hidden="true">
                info
              </span>
              <h2 className="page-state-title">{t("mixed.unavailableTitle")}</h2>
              <p>{t("mixed.unavailableText")}</p>
              <p className="page-state-label" />
              <div className="page-state-actions">
                <Link className="button button-secondary button-compact" to="/dashboard">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>{" "}
                  <span>{t("common.backToDashboard")}</span>
                </Link>
              </div>
            </section>
          )}

          {/* Any other start failure. */}
          {phase === "error" && !isUnavailable && (
            <ErrorState
              headingLevel={1}
              title={t("mixed.createError")}
              message={t("mixed.createError")}
              onRetry={() => setAttempt((count) => count + 1)}
            />
          )}

          {isAnswering && currentQuestion && (
            <section className="practice-section" aria-label={t("practice.questionRegion")}>
              <QuestionRenderer
                question={currentQuestion}
                index={currentIndex}
                total={questions.length}
                answer={answers[currentQuestion.question_id]}
                onAnswer={(value) => setAnswer(currentQuestion.question_id, value)}
              />
              <div className="question-nav">
                <button
                  className="button button-secondary button-back"
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={previousQuestion}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>{" "}
                  <span>{t("practice.previous")}</span>
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button className="button button-primary" type="button" onClick={nextQuestion}>
                    <span>{t("practice.next")}</span>{" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                ) : (
                  <button className="button button-primary" type="button" disabled={!canReview} onClick={startReview}>
                    <span>{t("practice.reviewAnswers")}</span>{" "}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                )}
              </div>
              {!canReview && <p className="review-submit-hint">{t("practice.missingNote")}</p>}
              {unansweredCount > 0 && (
                <p className="review-submit-hint">{t("practice.unansweredCount", { n: unansweredCount })}</p>
              )}
            </section>
          )}

          {isReviewing && (
            <>
              <PracticeReview
                questions={questions}
                answers={answers}
                submitError={error}
                onEdit={(index) => {
                  goTo(index);
                  backToAnswering();
                }}
              />
              <div className="review-actions">
                <button className="button button-secondary button-back" type="button" onClick={backToAnswering}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>{" "}
                  <span>{t("practice.answerAction")}</span>
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  disabled={!canReview || phase === "submitting"}
                  onClick={submit}
                >
                  <span>{phase === "submitting" ? t("practice.submitting") : t("practice.submit")}</span>{" "}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    send
                  </span>
                </button>
              </div>
            </>
          )}

          {isResult && result && (
            <PracticeResult
              result={result}
              practiceType="mixed"
              onRetry={() => {
                reset();
                setAttempt((count) => count + 1);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
