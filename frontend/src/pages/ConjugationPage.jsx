/*
  Verb Conjugation browse page (route "/conjugation", protected).
  Tense -> Rule/Pattern Lesson hierarchy rendered from GET /api/v1/conjugation (API Contract §11.1).

  Data:
  - The browse endpoint returns metadata only, ordered by sort_order, with `learned` / `review_later`
    per lesson (API §11.1). Titles come from the API; none is hard-coded here (FD §3.4).
  - Tense is grouping metadata, not a progress unit and not a route: it opens and closes in the browser
    and costs no API call (API §11.1, FD §4.5). The Rule/Pattern Lesson is the progress unit.
  - Individual verbs are lesson content only; there is no per-verb state or verb reference in the MVP
    (Requirements §6.3).

  States (FD §6.6): LoadingState, ErrorState with retry, EmptyState when there are no lessons at all,
  otherwise the tense list.
*/
import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import { getConjugation } from "../api/conjugationApi.js";
import TenseSection from "../features/conjugation/TenseSection.jsx";
import OverviewPanel from "../features/learning/OverviewPanel.jsx";
import useApiResource from "../hooks/useApiResource.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./ConjugationPage.module.css";

export default function ConjugationPage() {
  useLanguage();

  // The document title follows the shared language state.
  useEffect(() => {
    document.title = t("title.conjugation");
  });
  const fetchConjugation = useCallback(() => getConjugation(), []);
  const { data, isLoading, error, reload } = useApiResource(fetchConjugation);

  const tenses = data?.tenses ?? [];
  const lessons = tenses.flatMap((tense) => tense?.lessons ?? []);
  const learned = lessons.filter((lesson) => lesson.learned).length;
  const saved = lessons.filter((lesson) => lesson.review_later).length;
  const isEmpty = !isLoading && !error && (tenses.length === 0 || lessons.length === 0);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container conjugation-page subject-conjugation" id="main-content">
        <p className="visually-hidden">{t("conj.description")}</p>
        <section className="card page-hero page-section">
          <PageHeader icon="schedule" title={t("common.conjugation")} description={t("conj.description")} />
          {!isEmpty && (
            <OverviewPanel
              learned={learned}
              total={lessons.length}
              saved={saved}
              progressAriaLabel={t("common.progressConjugation")}
            />
          )}
        </section>

        {isLoading && <LoadingState message={t("conj.loading")} />}
        {error && (
          <ErrorState headingLevel={1} title={t("conj.loadError")} message={t("common.loadError")} onRetry={reload} />
        )}
        {isEmpty && (
          <EmptyState icon="schedule" title={t("conj.emptyTitle")} message={t("conj.emptyText")} headingLevel={1}>
            <div className="explore-links">
              <Link className="lesson-link subject-vocabulary" to="/vocabulary">
                {t("common.vocabulary")}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>{" "}
              <Link className="lesson-link subject-grammar" to="/grammar">
                {t("common.grammar")}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </EmptyState>
        )}

        {data && !isEmpty && (
          <>
            <div className="toolbar">
              <ul className="toolbar-summary" aria-label={t("common.contentRegion")}>
                <li className="badge badge-info">{t("conj.tensesCount", { n: tenses.length })}</li>
                <li className="badge badge-info">{t("common.lessonsN", { n: lessons.length })}</li>
              </ul>
            </div>
            <div className="tense-list">
              {tenses.map((tense, index) => (
                <TenseSection key={`tense-${index + 1}`} tense={tense} headingId={`tense-${index + 1}-title`} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
