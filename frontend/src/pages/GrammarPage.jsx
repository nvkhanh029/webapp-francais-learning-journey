/*
  Grammar browse page (route "/grammar", protected).
  Part -> Chapter -> Lesson hierarchy rendered from GET /api/v1/grammar (API Contract §9.1).

  Data:
  - The browse endpoint returns metadata only, already ordered by sort_order, with `learned` /
    `review_later` per lesson (API §9.1). Titles come from the API; none is hard-coded here
    (FD §3.4). The response is rendered as received, so added Parts/Chapters/Lessons appear without a
    code change.
  - Part and Chapter are grouping structures inside this page, not routes (FD §4.5). Collapsing a
    Chapter is frontend-only UI state and costs no API call (API §9.1).
  - The percentage is derived as floor(learned / total) clamped to 0-100 (FD §7.7); the counts stay
    backend truth (FD §3.3).

  States (FD §6.6): LoadingState, ErrorState with retry, EmptyState when there are no lessons at all,
  otherwise the part list.
*/
import { useCallback } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import { getGrammar } from "../api/grammarApi.js";
import GrammarPartSection from "../features/grammar/GrammarPartSection.jsx";
import OverviewPanel from "../features/learning/OverviewPanel.jsx";
import useApiResource from "../hooks/useApiResource.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./GrammarPage.module.css";

export default function GrammarPage() {
  useLanguage();
  const fetchGrammar = useCallback(() => getGrammar(), []);
  const { data, isLoading, error, reload } = useApiResource(fetchGrammar);

  const parts = data?.parts ?? [];
  const lessons = parts.flatMap((part) => (part?.chapters ?? []).flatMap((chapter) => chapter?.lessons ?? []));
  const learned = lessons.filter((lesson) => lesson.learned).length;
  const saved = lessons.filter((lesson) => lesson.review_later).length;
  // Same rule as the other browse pages: a response with no Parts or no lessons at all is the empty
  // state, not a page of empty groups.
  const isEmpty = !isLoading && !error && (parts.length === 0 || lessons.length === 0);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container grammar-page subject-grammar" id="main-content">
        <p className="visually-hidden">{t("grammar.description")}</p>
        <section className="card page-hero page-section">
          <PageHeader icon="draw" title={t("common.grammar")} description={t("grammar.description")} />
          {!isEmpty && (
            <OverviewPanel
              learned={learned}
              total={lessons.length}
              saved={saved}
              progressAriaLabel={t("common.progressGrammar")}
            />
          )}
        </section>

        {isLoading && <LoadingState message={t("grammar.loading")} />}
        {error && (
          <ErrorState
            headingLevel={1}
            title={t("grammar.loadError")}
            message={t("common.loadError")}
            onRetry={reload}
          />
        )}
        {isEmpty && (
          <EmptyState icon="draw" title={t("grammar.emptyTitle")} message={t("grammar.emptyText")} headingLevel={1}>
            <div className="explore-links">
              <Link className="lesson-link subject-vocabulary" to="/vocabulary">
                {t("common.vocabulary")}
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
            <div className="toolbar">
              <ul className="toolbar-summary" aria-label={t("common.contentRegion")}>
                <li className="badge badge-info">{t("grammar.partsCount", { n: parts.length })}</li>
                <li className="badge badge-info">
                  {t("grammar.chaptersCount", {
                    n: parts.reduce((total_, part) => total_ + (part?.chapters?.length ?? 0), 0),
                  })}
                </li>
                <li className="badge badge-info">{t("grammar.lessonsCount", { n: lessons.length })}</li>
              </ul>
            </div>
            <div className="part-list">
              {parts.map((part, index) => (
                <GrammarPartSection key={`part-${index + 1}`} part={part} index={index} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
