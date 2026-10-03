/*
  Vocabulary browse page (route "/vocabulary", protected).
  Category -> Topic cards rendered from GET /api/v1/vocabulary (API Contract §10.1).

  Data:
  - The browse endpoint returns overall `progress` plus Category/Topic metadata, and deliberately
    stops at Topic so the first Vocabulary screen does not load the whole hierarchy (API §10.1). The
    frontend cannot count Study Units from this payload and must not estimate it, which is why the
    header percentage comes from `progress` rather than from the listed topics (FD §7.9).
  - The Alphabet & Accents entry takes its slug and title from GET /api/v1/references (API §12.1)
    instead of hard-coding `french-alphabet-accents` (FD §7.9). It is reference content, not a
    learning unit: it contributes no progress (Requirements §6.4).
  - Vocabulary progress counts Study Units, never individual words (FD §7.7).

  States (FD §6.6): LoadingState, ErrorState with retry, EmptyState when there are no categories,
  otherwise the category list.
*/
import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import { getReferences } from "../api/referenceApi.js";
import { getVocabulary } from "../api/vocabularyApi.js";
import OverviewPanel from "../features/learning/OverviewPanel.jsx";
import VocabularyCategorySection from "../features/vocabulary/VocabularyCategorySection.jsx";
import useApiResource from "../hooks/useApiResource.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./VocabularyPage.module.css";

export default function VocabularyPage() {
  useLanguage();

  // The document title follows the shared language state.
  useEffect(() => {
    document.title = t("title.vocabulary");
  });
  const fetchVocabulary = useCallback(() => getVocabulary(), []);
  const fetchReferences = useCallback(() => getReferences(), []);
  const vocabulary = useApiResource(fetchVocabulary);
  const references = useApiResource(fetchReferences);

  const { data, isLoading, error, reload } = vocabulary;
  const categories = data?.categories ?? [];
  const progress = data?.progress ?? { learned: 0, total: 0 };
  // The reference index is a separate read; the entry simply does not appear if it has not loaded.
  const reference = references.data?.references?.[0] ?? null;
  const isEmpty = !isLoading && !error && categories.length === 0;

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container vocabulary-page subject-vocabulary" id="main-content">
        <section className="card page-hero page-section">
          <div className="hero-main">
            <PageHeader icon="style" title={t("common.vocabulary")} description={t("vocab.description")} />
            {!isEmpty && (
              <OverviewPanel
                learned={progress.learned}
                total={progress.total}
                saved={0}
                progressAriaLabel={t("common.progressVocabulary")}
                statusLabelKey="common.learningStatus"
              />
            )}
          </div>

          {/* Reference entry point. Data-driven, never a hard-coded slug (FD §7.9). */}
          {reference && (
            <Link
              className="reference-card"
              to={`/basics/${reference.slug}`}
              aria-labelledby="reference-eyebrow reference-title"
              aria-describedby="reference-note"
            >
              <span className="reference-eyebrow" id="reference-eyebrow">
                <span className="material-symbols-outlined" aria-hidden="true">
                  local_library
                </span>{" "}
                <span>{t("common.referenceTitle")}</span>
              </span>{" "}
              <span className="reference-title" id="reference-title">
                {reference.title ?? reference.title_fr}
              </span>{" "}
              <span className="reference-letters" lang="fr" aria-hidden="true">
                é è ê ë à ç ô
              </span>{" "}
              <span className="reference-note" id="reference-note">
                {t("common.referenceDescription")}
              </span>{" "}
              <span className="reference-cta" aria-hidden="true">
                <span>{t("vocab.viewAlphabet")}</span> <span className="material-symbols-outlined">arrow_forward</span>
              </span>
            </Link>
          )}
        </section>

        {isLoading && <LoadingState message={t("vocab.loading")} />}
        {error && (
          <ErrorState headingLevel={1} title={t("vocab.loadError")} message={t("common.loadError")} onRetry={reload} />
        )}
        {isEmpty && (
          <EmptyState icon="style" title={t("vocab.emptyTitle")} message={t("vocab.emptyText")} headingLevel={1}>
            <div className="explore-links">
              <Link className="lesson-link subject-grammar" to="/grammar">
                {t("common.grammar")}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>{" "}
              <Link className="lesson-link subject-conjugation" to="/conjugation">
                {t("common.conjugation")}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </EmptyState>
        )}

        {data && !isEmpty && (
          <>
            <ul className="toolbar-summary" aria-label={t("common.contentRegion")}>
              <li className="badge badge-info">{t("vocab.categoriesCount", { n: categories.length })}</li>
            </ul>
            <div className="category-list">
              {categories.map((category, index) => (
                <VocabularyCategorySection
                  key={`category-${index + 1}`}
                  category={category}
                  headingId={`vocab-category-${index + 1}-title`}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
