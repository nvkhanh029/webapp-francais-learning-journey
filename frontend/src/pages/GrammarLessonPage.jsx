/*
  Grammar lesson page (route "/grammar/lessons/:lessonSlug", protected).
  Part -> Chapter -> Lesson detail (FD §7.11) rendered from
  GET /api/v1/grammar/lessons/{slug} (API Contract §9.2).

  Data:
  - `content` is one localized Markdown string, rendered once through the approved Markdown renderer
    with raw HTML disabled (API §9.2, FD §9.3).
  - `state` (learned / review_later) comes from the GET and changes only through PATCH
    /api/v1/me/learning-units/{slug}/state; the frontend is not the authority (FD §3.3, API §13.2).
  - The GET does not update last_opened_at, so useLearningUnitState records the open afterwards
    (API §9.2, API §13.1).
  - Previous / Next have no API field. They are derived from the lesson list of this lesson's own
    Chapter, taken from GET /api/v1/grammar in the order the API returns it, and never cross into
    another Chapter (FD §7.11).
  - A slug that is not a valid Grammar lesson returns 404 and renders the error state (API §20.5).

  States (FD §6.6): LoadingState, ErrorState with retry, then header -> content -> actions ->
  previous/next. The breadcrumb trail appears as soon as the browse data identifies the Part and
  Chapter, because it comes from that response rather than from the lesson response.
*/
import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import NotFoundState from "../components/common/NotFoundState.jsx";
import { getGrammar, getGrammarLesson } from "../api/grammarApi.js";
import GrammarLessonContent from "../features/grammar/GrammarLessonContent.jsx";
import LearningUnitActions from "../features/learning/LearningUnitActions.jsx";
import LearningUnitHeader from "../features/learning/LearningUnitHeader.jsx";
import UnitNav from "../features/learning/UnitNav.jsx";
import useApiResource from "../hooks/useApiResource.js";
import useLearningUnitState from "../hooks/useLearningUnitState.js";
import { t, useLanguage } from "../i18n/index.js";
import { grammarLocation, neighbours } from "../utils/siblingNav.js";
import styles from "./GrammarLessonPage.module.css";

// One breadcrumb segment: the French title with its localized support title after a middot.
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

export default function GrammarLessonPage() {
  useLanguage();
  const { lessonSlug } = useParams();

  const fetchLesson = useCallback(() => getGrammarLesson(lessonSlug), [lessonSlug]);
  const { data: lesson, isLoading, error, reload } = useApiResource(fetchLesson, lessonSlug);

  // The document title follows the content item on screen: the support-language title when
  // the API returns one, otherwise the module title until the item loads (FD §4.2, FD §9.4).
  const itemTitle = lesson?.title;
  useEffect(() => {
    document.title = t(itemTitle ? "common.pageTitle" : "title.grammar", { title: itemTitle ?? "" });
  }, [itemTitle]);
  // The browse response is only needed to locate this lesson's sibling list for previous / next.
  const fetchBrowse = useCallback(() => getGrammar(), []);
  const { data: browse } = useApiResource(fetchBrowse);

  const unitState = useLearningUnitState(lesson?.slug, lesson?.state);
  const { part, chapter, lessons } = grammarLocation(browse?.parts, lessonSlug);
  const { previous, next } = neighbours(lessons, lessonSlug);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container lesson-page subject-grammar" id="main-content">
        <div className={`lesson${unitState.learned ? " is-learned" : ""}${unitState.reviewLater ? " is-saved" : ""}`}>
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <Link className="crumb-link" to="/grammar">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    draw
                  </span>{" "}
                  <span>{t("common.grammar")}</span>
                </Link>
              </li>
              {part && (
                <li>
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <CrumbPair titleFr={part.title_fr} title={part.title} />
                </li>
              )}
              {chapter && (
                <li>
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <CrumbPair titleFr={chapter.title_fr} title={chapter.title} />
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
              backTo="/grammar"
              backLabel={t("common.grammar")}
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
                icon="draw"
                titleId="lesson-title"
                titleFr={lesson.title_fr}
                title={lesson.title}
                contextLabel={chapter ? `${t("grammar.partLabel")} ${t("grammar.chapterLabel")}` : null}
                contextTitle={chapter?.title_fr ?? chapter?.title}
                contextSupport={chapter && chapter.title !== chapter.title_fr ? chapter.title : null}
                learned={unitState.learned}
                reviewLater={unitState.reviewLater}
              />

              <div className="lesson-body">
                <GrammarLessonContent content={lesson.content} />
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

              <UnitNav variant="lesson" unitType="grammar" previous={previous} next={next} />
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
