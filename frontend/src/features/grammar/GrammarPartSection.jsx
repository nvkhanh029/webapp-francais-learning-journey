import { t, useLanguage } from "../../i18n/index.js";
import { modulePercent } from "../../utils/formatUtils.js";
import GrammarChapterSection from "./GrammarChapterSection.jsx";

// One Grammar Part (FD §5.4.4, FD §7.8). Part is the top grouping level; its Chapters are grouped
// inside it and are not routes (FD §4.5).
//
// Each Part carries its own progress across all of its lessons, derived here as floor(learned/total)
// clamped to 0-100 so "100%" appears only when every lesson is learned (FD §7.7). The backend remains
// authoritative for the counts; this is display only (FD §3.3).
export default function GrammarPartSection({ part, index }) {
  useLanguage();

  const chapters = part?.chapters ?? [];
  const lessons = chapters.flatMap((chapter) => chapter?.lessons ?? []);
  const learned = lessons.filter((lesson) => lesson.learned).length;
  const isComplete = lessons.length > 0 && learned === lessons.length;
  const headingId = `grammar-part-${index + 1}-title`;
  const hasSupport = Boolean(part.title_fr && part.title && part.title !== part.title_fr);
  const percent = modulePercent(learned, lessons.length);

  return (
    <section className="card part" aria-labelledby={headingId}>
      <div className="part-header">
        <div className="part-heading">
          <div className="icon-tile icon-tile-solid icon-tile-blue part-number" aria-hidden="true">
            {index + 1}
          </div>
          <div className="part-titles">
            <h2 className="part-title" id={headingId}>
              <span className="visually-hidden">{t("grammar.partPosition", { n: index + 1 })} </span>
              <span lang={part.title_fr ? "fr" : undefined}>{part.title_fr ?? part.title}</span>
            </h2>
            {hasSupport && <span className="title-support">{part.title}</span>}
          </div>
        </div>
        <div className={`part-progress${isComplete ? " is-complete" : ""}`}>
          <div className="progress-labels">
            <span>{t("common.lessonsOf", { learned, total: lessons.length, n: lessons.length })}</span>
            <span className="progress-value">{`${percent}%`}</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={t("common.progressOf", { title: part.title_fr ?? part.title })}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={percent}
            style={{ "--progress": `${percent}%` }}
          >
            <div className="progress-fill" />
          </div>
        </div>
      </div>
      <div className="part-body">
        <ul className="chapter-list">
          {chapters.map((chapter, chapterIndex) => (
            <GrammarChapterSection
              key={`${headingId}-${chapterIndex}`}
              chapter={chapter}
              headingId={`${headingId}-chapter-${chapterIndex + 1}`}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
