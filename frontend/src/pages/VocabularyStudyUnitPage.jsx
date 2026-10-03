/*
  Vocabulary Study Unit page (route "/vocabulary/study-units/:unitSlug", protected).
  Rendered from GET /api/v1/vocabulary/study-units/{slug} (API Contract §10.3).

  Data:
  - Study Units navigate by their stable `learning_units.slug` (FD §13.2).
  - `entries` is a data-driven list: the number of vocabulary entries per Study Unit is not fixed, so
    the layout must not assume a count (FD §7.9). A multi-word expression is one entry, not several
    words (Database Design §8.5).
  - `meaning` and `example_translation` arrive already selected for the learner's support language;
    the frontend never picks a `_vi`/`_en` column (API §10.3, FD §6.2). `ipa`, `example_fr` and
    `example_translation` are optional and omitted when absent rather than rendered empty.
  - The GET does not update last_opened_at, so useLearningUnitState records the open afterwards
    (API §10.3, API §13.1).
  - Previous / Next have no API field. They are derived from the Study Unit list of this unit's own
    Topic, taken from GET /api/v1/vocabulary/topics/{topic_slug} in the order the API returns it, and
    never cross into another Topic (FD §7.11).
  - A slug that is not a valid Study Unit returns 404 and renders the error state (API §19).

  States (FD §6.6): LoadingState, ErrorState with retry, then breadcrumbs -> header -> entries ->
  actions -> previous/next.
*/
import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import NotFoundState from "../components/common/NotFoundState.jsx";
import { getVocabularyStudyUnit, getVocabularyTopic } from "../api/vocabularyApi.js";
import LearningUnitActions from "../features/learning/LearningUnitActions.jsx";
import LearningUnitHeader from "../features/learning/LearningUnitHeader.jsx";
import UnitNav from "../features/learning/UnitNav.jsx";
import VocabularyEntry from "../features/vocabulary/VocabularyEntry.jsx";
import useApiResource from "../hooks/useApiResource.js";
import useLearningUnitState from "../hooks/useLearningUnitState.js";
import { t, useLanguage } from "../i18n/index.js";
import { neighbours } from "../utils/siblingNav.js";
import styles from "./VocabularyStudyUnitPage.module.css";

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

export default function VocabularyStudyUnitPage() {
  useLanguage();
  const { unitSlug } = useParams();

  const fetchUnit = useCallback(() => getVocabularyStudyUnit(unitSlug), [unitSlug]);
  const { data: unit, isLoading, error, reload } = useApiResource(fetchUnit, unitSlug);

  // The document title follows the content item on screen: the support-language title when
  // the API returns one, otherwise the module title until the item loads (FD §4.2, FD §9.4).
  const itemTitle = unit?.title;
  useEffect(() => {
    document.title = t(itemTitle ? "common.pageTitle" : "title.vocabulary", { title: itemTitle ?? "" });
  }, [itemTitle]);

  // The Topic is only known from the Study Unit response, so its browse data is fetched for it. The
  // effect of an unset slug is a wasted request that resolves to null and is simply not used.
  const topicSlug = unit?.context?.topic?.slug;
  const fetchTopic = useCallback(
    () => (topicSlug ? getVocabularyTopic(topicSlug) : Promise.resolve(null)),
    [topicSlug],
  );
  const { data: topic } = useApiResource(fetchTopic, topicSlug ?? "");

  const unitState = useLearningUnitState(unit?.slug, unit?.state);
  const siblings = (topic?.subtopics ?? []).flatMap((subtopic) => subtopic?.study_units ?? []);
  const { previous, next } = neighbours(siblings, unitSlug);

  const entries = unit?.entries ?? [];

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container unit-page subject-vocabulary" id="main-content">
        <div className="unit">
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <Link className="crumb-link" to="/vocabulary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    style
                  </span>{" "}
                  <span>{t("common.vocabulary")}</span>
                </Link>
              </li>
              {unit?.context?.category && (
                <li className="crumb-category">
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <CrumbPair titleFr={unit.context.category.title_fr} title={unit.context.category.title} />
                </li>
              )}
              {topicSlug && (
                <li>
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <Link className="crumb-link crumb-topic" to={`/vocabulary/topics/${topicSlug}`}>
                    {unit?.context?.topic?.title_fr ?? unit?.context?.topic?.title}
                  </Link>
                </li>
              )}
              {unit && (
                <li className="crumb-current-item">
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <span className="crumb-current" aria-current="page" lang={unit.title_fr ? "fr" : undefined}>
                    {unit.title_fr ?? unit.title}
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
              backTo="/vocabulary"
              backLabel={t("common.vocabulary")}
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

          {unit && (
            <article aria-labelledby="unit-title">
              <LearningUnitHeader
                variant="unit"
                icon="style"
                titleId="unit-title"
                titleFr={unit.title_fr}
                title={unit.title}
                contextLabel={unit.context?.subtopic ? t("vocab.subtopicLabel") : null}
                contextTitle={unit.context?.subtopic?.title_fr ?? unit.context?.subtopic?.title}
                contextSupport={
                  unit.context?.subtopic && unit.context.subtopic.title !== unit.context.subtopic.title_fr
                    ? unit.context.subtopic.title
                    : null
                }
                learned={unitState.learned}
                reviewLater={unitState.reviewLater}
                metaItems={
                  <>
                    <li className="badge badge-info">{t("vocab.entriesCount", { n: entries.length })}</li>
                    {unitState.reviewLater && (
                      <li className="badge badge-review">
                        <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                          bookmark
                        </span>
                        <span>{t("common.reviewLater")}</span>
                      </li>
                    )}
                    {unitState.learned && (
                      <li className={`badge badge-learned${unitState.reviewLater ? " badge-quiet" : ""}`}>
                        <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                          check_circle
                        </span>
                        <span>{t("common.learned")}</span>
                      </li>
                    )}
                  </>
                }
              />

              <section className="unit-section">
                <div className="list-header">
                  <h2 className="list-title">{t("vocab.wordsHeading")}</h2>
                </div>
                {entries.length === 0 ? (
                  <p className="empty-text">{t("vocab.emptyUnit")}</p>
                ) : (
                  <ol className="entry-list">
                    {entries.map((entry, index) => (
                      <VocabularyEntry key={`${entry.french}-${index}`} entry={entry} />
                    ))}
                  </ol>
                )}
              </section>

              <LearningUnitActions
                variant="unit"
                className="unit-section"
                titleId="unit-actions-title"
                slug={unit.slug}
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
                practiceNoteKey="lesson.practiceNoteVocabulary"
              />

              <UnitNav variant="unit" unitType="vocabulary" previous={previous} next={next} />
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
