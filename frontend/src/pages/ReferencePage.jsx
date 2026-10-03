/*
  Reference page (route "/basics/:referenceSlug", protected), currently French Alphabet & Accents.
  Rendered from GET /api/v1/references/{slug} (API Contract §12.2).

  Data:
  - Reference pages are not learning units. Opening one creates or changes no Mark as Learned,
    Review Later, Continue Learning, Practice, progress or streak state, so the response carries no
    learner `state` object and nothing on this page is recorded (API §12.2, Requirements §6.4).
  - `content` is one localized Markdown string rendered once through the approved renderer with raw
    HTML disabled (API §12.2, FD §9.3).
  - The page is reachable from the Vocabulary area, which supplies the slug from
    GET /api/v1/references, so no reference slug is hard-coded here (FD §7.9).
  - A slug that is not a valid reference page returns 404 reference_not_found and renders the error
    state (API §19).

  States (FD §6.6): LoadingState, ErrorState with retry, then breadcrumbs -> header -> content.
*/
import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import { getReference } from "../api/referenceApi.js";
import LearningContent from "../features/learning/LearningContent.jsx";
import useApiResource from "../hooks/useApiResource.js";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./ReferencePage.module.css";

export default function ReferencePage() {
  useLanguage();
  const { referenceSlug } = useParams();

  const fetchReference = useCallback(() => getReference(referenceSlug), [referenceSlug]);
  const { data: reference, isLoading, error, reload } = useApiResource(fetchReference, referenceSlug);

  const title = reference?.title ?? reference?.title_fr;
  const titleFr = reference?.title_fr;

  // The document title follows the page it is showing (FD §4.2, FD §9.4), falling back to the
  // reference page title while the item is still loading.
  useEffect(() => {
    document.title = title ? t("common.pageTitle", { title }) : t("title.reference");
  }, [title]);

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container reference-page reference-role" id="main-content">
        <div className="reference">
          <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
            <ol className="breadcrumb-list">
              <li>
                <Link className="crumb-link" to="/vocabulary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    local_library
                  </span>{" "}
                  <span>{t("common.referenceTitle")}</span>
                </Link>
              </li>
              {reference && (
                <li className="crumb-current-item">
                  <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                    chevron_right
                  </span>{" "}
                  <span className="crumb-current" aria-current="page" lang={titleFr ? "fr" : undefined}>
                    {title}
                  </span>
                </li>
              )}
            </ol>
          </nav>

          <LoadingState hidden={!isLoading} message={t("reference.loading")} />
          {error && (
            <ErrorState
              headingLevel={1}
              title={t("reference.loadError")}
              message={t("common.loadError")}
              onRetry={reload}
            />
          )}

          {reference && (
            <article aria-labelledby="reference-title">
              <header className="card reference-header">
                <div className="icon-tile" aria-hidden="true">
                  <span className="material-symbols-outlined">local_library</span>
                </div>
                <div className="reference-heading">
                  <p className="reference-label">
                    <span className="badge">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        menu_book
                      </span>{" "}
                      <span>{t("common.referenceTitle")}</span>
                    </span>
                  </p>
                  <h1 className="reference-title" id="reference-title" lang={titleFr ? "fr" : undefined}>
                    {title}
                  </h1>
                  {titleFr && reference.title && reference.title !== titleFr && (
                    <p className="title-support">{reference.title}</p>
                  )}
                  <p className="reference-note">{t("common.referenceDescription")}</p>
                </div>
              </header>

              <LearningContent content={reference.content} className="markdown-body reference-body" />

              <div className="reference-return">
                <Link className="button button-secondary" to="/vocabulary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_back
                  </span>{" "}
                  <span>{t("reference.backToVocabulary")}</span>
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
