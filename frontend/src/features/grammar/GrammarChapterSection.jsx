import { t, useLanguage } from "../../i18n/index.js";
import LearningUnitRow from "../learning/LearningUnitRow.jsx";

// One Grammar Chapter inside a Part (FD §5.4.4, FD §7.8).
//
// A Chapter is a collapsible group, not a route of its own: the hierarchy is Part -> Chapter -> Lesson
// and Part/Chapter are grouping structures inside the Grammar browse page (FD §4.5). Expanding and
// collapsing is therefore frontend-only UI state and needs no API call (API §9.1).
//
// The chapter's count badge switches to the learned treatment once every lesson in it is learned, so
// completion is visible without opening it. Each lesson row links to /grammar/lessons/:slug and, per
// FD §7.8, carries no vertical accent bar — Grammar shows the module accent through the status shape,
// badges and hover tint only.
//
// `headingId` is supplied by the parent Part because a Chapter has no stable slug of its own
// (API §9.1 returns titles and lessons only), and the heading needs a unique id for labelling.
export default function GrammarChapterSection({ chapter, headingId }) {
  useLanguage();

  const lessons = chapter?.lessons ?? [];
  const learned = lessons.filter((lesson) => lesson.learned).length;
  const isComplete = lessons.length > 0 && learned === lessons.length;
  const hasSupport = Boolean(chapter.title_fr && chapter.title && chapter.title !== chapter.title_fr);

  return (
    <li>
      <details className="chapter" open>
        <summary className="chapter-summary">
          <span className="chapter-toggle" aria-hidden="true">
            <span className="material-symbols-outlined">expand_more</span>
          </span>
          <span className="chapter-heading">
            <h3 className="chapter-title" id={headingId} lang={chapter.title_fr ? "fr" : undefined}>
              {chapter.title_fr ?? chapter.title}
            </h3>
            {hasSupport && <span className="title-support">{chapter.title}</span>}
          </span>
          <span className={`badge chapter-count ${isComplete ? "badge-learned" : "badge-info"}`}>
            <span className="material-symbols-outlined icon-filled" aria-hidden="true" hidden={!isComplete}>
              check_circle
            </span>
            <span>{t("common.lessonsOf", { learned, total: lessons.length, n: lessons.length })}</span>
            <span className="visually-hidden"> {t("common.learnedLower")}</span>
          </span>
        </summary>
        <ul className="lesson-list" hidden={lessons.length === 0}>
          {lessons.map((lesson) => (
            <LearningUnitRow
              key={lesson.slug}
              variant="lesson"
              className="lesson-item"
              unit={lesson}
              to={`/grammar/lessons/${lesson.slug}`}
            />
          ))}
        </ul>
        {lessons.length === 0 && <p className="empty-text">{t("grammar.emptyChapter")}</p>}
      </details>
    </li>
  );
}
