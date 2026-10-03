/*
  Normal Practice (route "/practice/:unitSlug", protected).
  One generic Practice route shared by Grammar, Vocabulary and Conjugation (FD §4.6).

  Data:
  - The run comes from POST /api/v1/learning-units/{slug}/practice/start (API §15.1). Start creates no
    Practice History and exposes no correct answers (API §14, §15.1).
  - The subject accent, breadcrumb and "back to lesson" follow the `learning_unit` the Start response
    actually returns, so this page is not tied to Conjugation as the prototype was (API §15.1, FD §7.11).
  - Answers stay in React state and may be changed freely until final submission (API §17, FD §5.8).
    The backend calculates the score; nothing here computes it (FD §13.17).
  - Final submission goes to the shared endpoint and returns the full result feedback (API §17.2).

  Phases (FD §5.6): loading -> answering -> reviewing -> submitting -> result, plus error.
*/
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PracticeHeader from "../features/practice/PracticeHeader.jsx";
import { practiceErrorKeys } from "../features/practice/practiceErrors.js";
import PracticeResult from "../features/practice/PracticeResult.jsx";
import PracticeReview from "../features/practice/PracticeReview.jsx";
import QuestionRenderer from "../features/practice/QuestionRenderer.jsx";
import usePractice from "../hooks/usePractice.js";
import { t, useLanguage } from "../i18n/index.js";
import { moduleMeta } from "../utils/routeHelpers.js";
import styles from "./PracticePage.module.css";

export default function PracticePage() {
  useLanguage();

  // The document title follows the shared language state.
  useEffect(() => {
    document.title = t("title.practice");
  });
  const { unitSlug } = useParams();
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
    learningUnit,
    start,
    setAnswer,
    goTo,
    nextQuestion,
    previousQuestion,
    startReview,
    submit,
    restart,
  } = practice;

  // One start per unit. The token makes a StrictMode double-mount a no-op instead of a second POST
  // that would orphan a server-side run (API §18).
  useEffect(() => {
    if (unitSlug) start({ mode: "normal", slug: unitSlug, token: `normal:${unitSlug}` });
  }, [start, unitSlug]);

  const specificError = practiceErrorKeys(error);
  const module = moduleMeta(learningUnit?.unit_type);
  const answeredIds = questions
    .map((question, index) => (answers[question.question_id] !== undefined ? index : -1))
    .filter((index) => index >= 0);

  const isAnswering = phase === "answering";
  const isReviewing = phase === "reviewing";
  const isResult = phase === "result";
  const isBusy = phase === "loading" || phase === "submitting";

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container practice-page" id="main-content">
        <div className="practice-shell">
          {/* Breadcrumb and subject follow the real learning unit (API §15.1). */}
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              {module && (
                <li>
                  <Link className={`crumb-link ${module.subjectClass}`} to={module.path}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {module.icon}
                    </span>{" "}
                    <span>{t(module.labelKey)}</span>
                  </Link>
                </li>
              )}
              {learningUnit && (
                <>
                  <li>
                    <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                      chevron_right
                    </span>{" "}
                    <span className={`crumb-link crumb-mid ${module?.subjectClass ?? ""}`} lang="fr">
                      {learningUnit.title_fr ?? learningUnit.title}
                    </span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                      chevron_right
                    </span>{" "}
                    <span className="crumb-current" aria-current="page">
                      {t("common.practice")}
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <PracticeHeader
            title={learningUnit?.title_fr ?? learningUnit?.title ?? t("common.practice")}
            description={isResult ? null : t("practice.sessionIntro")}
            icon={module?.icon ?? "bolt"}
            subjectClass={module?.subjectClass ?? "subject-mixed"}
            totalQuestions={questions.length}
            answeredIds={answeredIds}
            currentIndex={currentIndex}
            onJumpTo={goTo}
          />

          {isBusy && <LoadingState message={t("practice.loading")} />}

          {/* A start failure, an already-finalized run or a lost run all land here. Retrying starts a new run. */}
          {phase === "error" && (
            <ErrorState
              headingLevel={1}
              title={specificError ? t(specificError.titleKey) : t("practice.loadError")}
              message={specificError ? t(specificError.textKey) : t("common.loadError")}
              onRetry={restart}
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
              {!canReview && (
                <p className="review-submit-hint">
                  {unansweredCount > 0 ? t("practice.missingNote") : t("practice.submitDisabledHint")}
                </p>
              )}
            </section>
          )}

          {isReviewing && (
            <PracticeReview
              questions={questions}
              answers={answers}
              submitError={phase === "reviewing" && error ? error : null}
              onEdit={(index) => {
                goTo(index);
                practice.backToAnswering();
              }}
            />
          )}

          {isReviewing && (
            <div className="review-actions">
              <button className="button button-secondary button-back" type="button" onClick={practice.backToAnswering}>
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
          )}

          {isResult && result && (
            <PracticeResult result={result} practiceType={result.practice_type ?? "normal"} onRetry={restart} />
          )}
        </div>
      </main>
    </div>
  );
}
