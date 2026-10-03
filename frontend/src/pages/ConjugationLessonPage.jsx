/*
  Conjugation lesson page (route "/conjugation/lessons/:lessonSlug", protected).
  Tense -> Rule/Pattern Lesson detail (FD §7.11) rendered from
  GET /api/v1/conjugation/lessons/{slug} (API Contract §11.2).

  Data:
  - `content` is one localized Markdown string containing the rule/pattern explanation, the
    conjugation pattern or table, example verbs and notes. It is rendered once through the approved
    Markdown renderer with raw HTML disabled (API §11.2, FD §9.3), which is why there is no separate
    table component: the table is part of that Markdown.
  - `state` comes from the GET and changes only through PATCH .../state; the frontend is not the
    authority (FD §3.3, API §13.2). The open is recorded afterwards by useLearningUnitState
    (API §13.1).
  - Previous / Next have no API field. They are derived from the lesson list of this lesson's own
    Tense and never cross into another Tense in the MVP (FD §7.11).
  - A slug that is not a valid Conjugation lesson returns 404 and renders the error state (API §20.5).

  Example verbs are lesson content only: there is no per-verb state, Practice or progress, and a
  searchable Verb Reference is outside the MVP (Requirements §6.3).
*/
import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import NotFoundState from "../components/common/NotFoundState.jsx";
import { getConjugation, getConjugationLesson } from "../api/conjugationApi.js";
import LearningContent from "../features/learning/LearningContent.jsx";
import LearningUnitActions from "../features/learning/LearningUnitActions.jsx";
import LearningUnitHeader from "../features/learning/LearningUnitHeader.jsx";
import UnitNav from "../features/learning/UnitNav.jsx";
import useApiResource from "../hooks/useApiResource.js";
import useLearningUnitState from "../hooks/useLearningUnitState.js";
import { t, useLanguage } from "../i18n/index.js";
import { neighbours, tenseForSlug } from "../utils/siblingNav.js";
import styles from "./ConjugationLessonPage.module.css";

function CrumbPair({ titleFr, title }) {
  return (
    <span>
      <span lang={titleFr ? "fr" : undefined}>{titleFr ?? title}</span>
      {titleFr && title && title !== titleFr && (
        <>
          {" "}
          <span className="crumb-support">{`· ${title}`}</span>
        </>
      )}
    </span>
  );
}

export default function ConjugationLessonPage() {
  useLanguage();
  const { lessonSlug } = useParams();

  const fetchLesson = useCallback(() => getConjugationLesson(lessonSlug), [lessonSlug]);
  const { data: lesson, isLoading, error, reload } = useApiResource(fetchLesson, lessonSlug);

  // The document title follows the content item on screen: the support-language title when
  // the API returns one, otherwise the module title until the item loads (FD §4.2, FD §9.4).
  const itemTitle = lesson?.title;
  useEffect(() => {
    document.title = t(itemTitle ? "common.pageTitle" : "title.conjugation", { title: itemTitle ?? "" });
  }, [itemTitle]);
  const fetchBrowse = useCallback(() => getConjugation(), []);
  const { data: browse } = useApiResource(fetchBrowse);

  const unitState = useLearningUnitState(lesson?.slug, lesson?.state);
  const tense = tenseForSlug(browse?.tenses, lessonSlug);
  const { previous, next } = neighbours(tense?.lessons, lessonSlug);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container lesson-page subject-conjugation" id="main-content">
        <div className={`lesson${unitState.learned ? " is-learned" : ""}${unitState.reviewLater ? " is-saved" : ""}`}>
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <Link className="crumb-link" to="/conjugation">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    schedule
                  </span>{" "}
                  <span>{t("common.conjugation")}</span>
                </Link>
              </li>
              {tense && (
                <li>
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  {/* The Tense is a grouping label with no route in the MVP, so it is plain text. */}
                  <CrumbPair titleFr={tense.title_fr} title={tense.title} />
                </li>
              )}
              {lesson && (
                <li className="crumb-current-item">
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <span className="crumb-current" aria-current="page" lang={lesson.title_fr ? "fr" : undefined}>
                    {lesson.title_fr ?? lesson.title}
                  </span>
                </li>
              )}
            </ol>
          </nav>

          <LoadingState hidden={!isLoading} message={t("common.loadingLesson")} />
          {error && error.status === 404 && (
            <NotFoundState
              title={t("common.lessonNotFoundTitle")}
              message={t("common.lessonNotFoundText")}
              backTo="/conjugation"
              backLabel={t("common.conjugation")}
            />
          )}
          {error && error.status !== 404 && (
            <ErrorState
              headingLevel={1}
              title={t("common.loadLessonError")}
              message={t("common.loadError")}
              onRetry={reload}
            />
          )}

          {lesson && (
            <article className="lesson-article" aria-labelledby="lesson-title">
              <LearningUnitHeader
                icon="schedule"
                titleId="lesson-title"
                titleFr={lesson.title_fr}
                title={lesson.title}
                contextLabel={tense ? t("conj.tenseLabel") : null}
                contextTitle={tense?.title_fr ?? tense?.title}
                contextSupport={tense && tense.title !== tense.title_fr ? tense.title : null}
                learned={unitState.learned}
                reviewLater={unitState.reviewLater}
              />

              <div className="lesson-body">
                <div className="card lesson-reading">
                  <LearningContent content={lesson.content} />
                </div>
                <LearningUnitActions
                  titleId="lesson-actions-title"
                  slug={lesson.slug}
                  learned={unitState.learned}
                  reviewLater={unitState.reviewLater}
                  isLearnedPending={unitState.isLearnedPending}
                  isReviewPending={unitState.isReviewPending}
                  error={unitState.error}
                  announcement={unitState.announcement}
                  onMarkLearned={unitState.markLearned}
                  onUnmarkLearned={unitState.unmarkLearned}
                  onSaveForReview={unitState.saveForReview}
                  onRemoveFromReview={unitState.removeFromReview}
                />
              </div>

              <UnitNav variant="lesson" unitType="conjugation" previous={previous} next={next} />
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
