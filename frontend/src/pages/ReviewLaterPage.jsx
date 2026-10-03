/*
  Review Later page (route "/review-later", protected).
  Rendered from GET /api/v1/me/review-later (API Contract §13.3).

  Data:
  - The endpoint returns only the authenticated learner's units with `review_later = true`, already
    ordered by curriculum order: module in the order grammar, vocabulary, conjugation, then the unit's
    position in its module (API §13.3). The page groups that list by `unit_type` for display and never
    re-sorts it, so removing and re-adding a unit does not change its place (API §13.3, FD §7.14).
  - `review_later` is not repeated per item because membership already implies it (API §13.3).
  - `learned` is shown per item and stays independent: Review Later never means "not learned"
    (FD §7.14, Requirements §12).
  - When the API has fallen back to `title_fr` for a missing translation, the localized line is hidden
    rather than repeating the French title (API §4.9).
  - Removal goes through PATCH /api/v1/me/learning-units/{slug}/state with `review_later: false`,
    which changes only that field and never touches `learned` (API §13.2).

  States (FD §6.6): LoadingState, ErrorState with retry, EmptyState when nothing is saved, otherwise the
  grouped list.
*/
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import { getReviewLater, updateLearningUnitState } from "../api/learningStateApi.js";
import useApiResource from "../hooks/useApiResource.js";
import { t, useLanguage } from "../i18n/index.js";
import { CURRICULUM_MODULE_ORDER, learningUnitPath, moduleMeta } from "../utils/routeHelpers.js";
import styles from "./ReviewLaterPage.module.css";

// Group the already-ordered list by module without reordering anything inside a group (API §13.3).
// Modules appear in the endpoint's curriculum order — grammar, vocabulary, conjugation — which is not
// the Dashboard card order, so the groups follow the curriculum sequence the API already used.
function groupByModule(items) {
  const byType = items.reduce((groups, item) => {
    const key = item.unit_type ?? "other";
    groups[key] = groups[key] ? [...groups[key], item] : [item];
    return groups;
  }, {});
  const ordered = CURRICULUM_MODULE_ORDER.filter((unitType) => byType[unitType]);
  const extras = Object.keys(byType).filter((unitType) => !CURRICULUM_MODULE_ORDER.includes(unitType));
  return [...ordered, ...extras].map((unitType) => ({ unitType, items: byType[unitType] }));
}

export default function ReviewLaterPage() {
  useLanguage();

  // The document title follows the shared language state.
  useEffect(() => {
    document.title = t("title.reviewLater");
  });
  const fetchItems = useCallback(() => getReviewLater(), []);
  const { data, isLoading, error, reload, refresh } = useApiResource(fetchItems);

  const [pendingSlug, setPendingSlug] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState(null);

  const items = data?.items ?? [];
  const groups = groupByModule(items);
  const isEmpty = !isLoading && !error && items.length === 0;

  // Remove from Review Later through the shared learner-state endpoint. Only `review_later` is sent, so
  // the unit's learned state is untouched (API §13.2).
  const remove = async (item) => {
    setPendingSlug(item.slug);
    setActionError(null);
    try {
      await updateLearningUnitState(item.slug, { review_later: false });
      setAnnouncement(t("review.removed"));
      // The list itself is backend truth, so it is refetched rather than patched locally (FD §3.3).
      // refresh() keeps the list on screen while it re-reads, so removing a unit never flashes the
      // loading state.
      refresh();
    } catch (cause) {
      setActionError(cause);
    } finally {
      setPendingSlug(null);
    }
  };

  return (
    <div className={`page-body ${styles.page}`}>
      <main className="page-container review-page" id="main-content">
        <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
          <ol className="breadcrumb-list">
            <li>
              <Link className="crumb-link" to="/dashboard">
                <span className="material-symbols-outlined" aria-hidden="true">
                  bookmark
                </span>{" "}
                <span>{t("common.dashboard")}</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                chevron_right
              </span>{" "}
              <span className="crumb-current" aria-current="page">
                {t("common.reviewLater")}
              </span>
            </li>
          </ol>
        </nav>

        <header className="review-header">
          <div className="icon-tile" aria-hidden="true">
            <span className="material-symbols-outlined">bookmark_added</span>
          </div>
          <div className="review-header-text">
            <div className="review-heading-row">
              <h1 className="review-page-title">{t("common.reviewLater")}</h1>
              {items.length > 0 && <span className="badge">{t("review.total", { n: items.length })}</span>}
            </div>
            <p className="review-page-description">{t("review.description")}</p>
          </div>
        </header>

        {isLoading && <LoadingState message={t("review.loading")} />}
        {error && (
          <ErrorState headingLevel={1} title={t("review.loadError")} message={t("common.loadError")} onRetry={reload} />
        )}
        {actionError && (
          <div className="state-note" role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>{" "}
            <span>{t("common.loadError")}</span>
          </div>
        )}

        {isEmpty && (
          <EmptyState icon="bookmark" title={t("review.emptyTitle")} message={t("review.emptyText")} headingLevel={1}>
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
          <div className="review-groups">
            {groups.map((group) => {
              const module = moduleMeta(group.unitType);
              return (
                <section
                  className="card review-group"
                  key={group.unitType}
                  aria-labelledby={`review-${group.unitType}`}
                >
                  <div className="group-heading">
                    <div className="icon-tile icon-tile-compact" aria-hidden="true">
                      <span className="material-symbols-outlined">{module?.icon ?? "menu_book"}</span>
                    </div>
                    <h2 className="section-title" id={`review-${group.unitType}`}>
                      {module ? t(module.labelKey) : t("common.reviewLater")}
                    </h2>
                    <span className="badge">{t("review.groupCount", { n: group.items.length })}</span>
                  </div>
                  <ul className="review-list" role="list">
                    {group.items.map((item) => {
                      const path = learningUnitPath(item.unit_type, item.slug);
                      // Hidden when the API fell back to title_fr, so the French title is not repeated.
                      const hasSupport = Boolean(item.title_fr && item.title && item.title !== item.title_fr);
                      return (
                        <li className="review-item" key={`${item.unit_type}-${item.slug}`}>
                          <div className="review-info">
                            <h3 className="review-title" lang="fr">
                              {item.title_fr ?? item.title}
                            </h3>
                            {hasSupport && <p className="review-support">{item.title}</p>}
                            {item.learned && (
                              <p className="review-state">
                                <span className="badge badge-learned">
                                  <span className="material-symbols-outlined icon-filled" aria-hidden="true">
                                    check_circle
                                  </span>
                                  <span>{t("common.learned")}</span>
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="review-actions">
                            {path && (
                              <Link className="lesson-link review-open" to={path}>
                                <span>{t("review.openLesson")}</span>
                                {/* Repeated link text needs context; the French title carries its own language. */}
                                <span className="visually-hidden" lang="fr">
                                  {item.title_fr ?? item.title}
                                </span>
                                <span className="material-symbols-outlined" aria-hidden="true">
                                  arrow_forward
                                </span>
                              </Link>
                            )}
                            <button
                              className="button button-secondary button-compact button-toggle review-remove"
                              type="button"
                              disabled={pendingSlug === item.slug}
                              onClick={() => remove(item)}
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">
                                bookmark_remove
                              </span>
                              <span>{t("review.remove")}</span>
                              <span className="visually-hidden" lang="fr">
                                {` ${item.title_fr ?? item.title}`}
                              </span>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {/* Removal is confirmed politely without moving focus (FD §11). */}
        <div className="toast" role="status" aria-live="polite" aria-atomic="true">
          <span className="material-symbols-outlined" aria-hidden="true">
            bookmark_remove
          </span>{" "}
          <span>{announcement}</span>
        </div>
      </main>
    </div>
  );
}
