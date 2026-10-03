import { t, useLanguage } from "../../i18n/index.js";
import ConjugationLessonCard from "./ConjugationLessonCard.jsx";

// One Conjugation Tense group (FD §5.4.6, §7.10).
//
// The hierarchy is Tense -> Rule/Pattern Lesson, and Tense is grouping metadata rather than a
// progress unit or a route: it is opened and closed in the browser and needs no API call (API §11.1).
// The Rule/Pattern Lesson is the progress and practice unit.
//
// Conjugation lesson cards keep their vertical accent bar, unlike Grammar (FD §7.8, §7.10); that is
// handled by ConjugationPage.module.css, not here.
export default function TenseSection({ tense, headingId }) {
  useLanguage();

  const lessons = tense?.lessons ?? [];
  const learned = lessons.filter((lesson) => lesson.learned).length;
  const isComplete = lessons.length > 0 && learned === lessons.length;
  const hasSupport = Boolean(tense.title_fr && tense.title && tense.title !== tense.title_fr);

  return (
    <section className="card tense" aria-labelledby={headingId}>
      <div className="tense-header">
        <div className="tense-heading">
          <h2 className="tense-title" id={headingId} lang={tense.title_fr ? "fr" : undefined}>
            {tense.title_fr ?? tense.title}
          </h2>
          {hasSupport && <span className="title-support">{tense.title}</span>}
        </div>
        <span className={`badge tense-count ${isComplete ? "badge-learned" : "badge-info"}`}>
          <span className="material-symbols-outlined icon-filled" aria-hidden="true" hidden={!isComplete}>
            check_circle
          </span>
          <span>{t("common.lessonsOf", { learned, total: lessons.length, n: lessons.length })}</span>
        </span>
      </div>
      <div className="tense-body">
        <ul className="lesson-list" hidden={lessons.length === 0}>
          {lessons.map((lesson) => (
            <ConjugationLessonCard key={lesson.slug} lesson={lesson} />
          ))}
        </ul>
        {lessons.length === 0 && <p className="empty-text">{t("conj.emptyTense")}</p>}
      </div>
    </section>
  );
}
