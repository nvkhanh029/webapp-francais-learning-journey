/*
  Vocabulary Topic page (route "/vocabulary/topics/:topicSlug", protected).
  Topic -> Subtopic -> Study Unit, rendered from
  GET /api/v1/vocabulary/topics/{topic_slug} (API Contract §10.2).

  Data:
  - Topics navigate by their stable `vocabulary_topics.slug`, never a numeric id (API §10.2,
    FD §13.2).
  - Subtopics are book-defined grouping data rendered inside this page; they need no page or API of
    their own (API §10.2, FD §4.5). Each Study Unit card shows its `learned` / `review_later` state
    as returned.
  - The Topic GET exposes no `progress` object, so the strip under the header is a summary of the
    Study Units this page already received rather than a separate aggregate — it counts only what is
    on screen and does not claim to be overall Vocabulary progress (API §10.2).
  - A slug that is not a valid Topic returns 404 topic_not_found and renders the error state
    (API §19).

  States (FD §6.6): LoadingState, ErrorState with retry, then breadcrumbs -> header -> subtopics.
*/
import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import { getVocabularyTopic } from "../api/vocabularyApi.js";
import OverviewPanel from "../features/learning/OverviewPanel.jsx";
import VocabularySubtopicSection from "../features/vocabulary/VocabularySubtopicSection.jsx";
import useApiResource from "../hooks/useApiResource.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./VocabularyTopicPage.module.css";

export default function VocabularyTopicPage() {
  useLanguage();
  const { topicSlug } = useParams();

  const fetchTopic = useCallback(() => getVocabularyTopic(topicSlug), [topicSlug]);
  const { data: topic, isLoading, error, reload } = useApiResource(fetchTopic, topicSlug);

  // The document title follows the content item on screen: the support-language title when
  // the API returns one, otherwise the module title until the item loads (FD §4.2, FD §9.4).
  const itemTitle = topic?.title;
  useEffect(() => {
    document.title = t(itemTitle ? "common.pageTitle" : "title.vocabulary", { title: itemTitle ?? "" });
  }, [itemTitle]);

  const subtopics = topic?.subtopics ?? [];
  const units = subtopics.flatMap((subtopic) => subtopic?.study_units ?? []);
  const learned = units.filter((unit) => unit.learned).length;
  const saved = units.filter((unit) => unit.review_later).length;
  const hasSupport = Boolean(topic?.title_fr && topic.title && topic.title !== topic.title_fr);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container topic-page subject-vocabulary" id="main-content">
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
            {topic?.context?.category && (
              <li className="crumb-category">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>{" "}
                <span>
                  <span lang={topic.context.category.title_fr ? "fr" : undefined}>
                    {topic.context.category.title_fr ?? topic.context.category.title}
                  </span>
                </span>
              </li>
            )}
            {topic && (
              <li>
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>{" "}
                <span className="crumb-current" aria-current="page" lang={topic.title_fr ? "fr" : undefined}>
                  {topic.title_fr ?? topic.title}
                </span>
              </li>
            )}
          </ol>
        </nav>

        <LoadingState hidden={!isLoading} message={t("vocab.loadingTopic")} />
        {error && (
          <ErrorState
            headingLevel={1}
            title={t("vocab.loadTopicError")}
            message={t("common.loadError")}
            onRetry={reload}
          />
        )}

        {topic && (
          <>
            <section className="card topic-header page-section">
              <div className="topic-intro">
                <div className="icon-tile icon-tile-solid" aria-hidden="true">
                  <span className="material-symbols-outlined">style</span>
                </div>
                <div className="topic-heading">
                  <h1 className="topic-title" id="topic-title" lang={topic.title_fr ? "fr" : undefined}>
                    {topic.title_fr ?? topic.title}
                  </h1>
                  {hasSupport && <p className="title-support">{topic.title}</p>}
                </div>
              </div>
              <OverviewPanel
                learned={learned}
                total={units.length}
                saved={saved}
                progressAriaLabel={t("vocab.topicProgress")}
                statusLabelKey="common.learningStatus"
              />
            </section>

            {units.length === 0 ? (
              <p className="empty-text">{t("vocab.emptyTopic")}</p>
            ) : (
              <>
                <ul className="toolbar-summary" aria-label={t("common.contentRegion")}>
                  <li className="badge badge-info">{t("vocab.subtopicsCount", { n: subtopics.length })}</li>
                </ul>
                <div className="subtopic-list">
                  {subtopics.map((subtopic, index) => (
                    <VocabularySubtopicSection
                      key={`subtopic-${index + 1}`}
                      subtopic={subtopic}
                      headingId={`vocab-subtopic-${index + 1}-title`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
