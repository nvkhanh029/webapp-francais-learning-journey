import { t, useLanguage } from "../../i18n/index.js";
import VocabularyStudyUnitCard from "./VocabularyStudyUnitCard.jsx";

// One Vocabulary Subtopic group on a Topic page (FD §5.4.5, §7.9).
//
// A Subtopic is book-defined grouping data preserved inside a Topic; it has no page and no API of its
// own (API §10.2). It holds one or more Study Units, which are the Vocabulary progress units.
//
// The Study Unit cards keep their vertical accent bar, unlike Grammar lesson cards (FD §7.8, §7.9).
export default function VocabularySubtopicSection({ subtopic, headingId }) {
  useLanguage();

  const units = subtopic?.study_units ?? [];
  const learned = units.filter((unit) => unit.learned).length;
  const hasTitleFr = Boolean(subtopic.title_fr);
  const hasSupport = hasTitleFr && Boolean(subtopic.title) && subtopic.title !== subtopic.title_fr;

  return (
    <section aria-labelledby={headingId}>
      <header className="subtopic-header">
        <div className="subtopic-heading">
          <h2 className="subtopic-title" id={headingId}>
            <span lang={hasTitleFr ? "fr" : undefined}>{subtopic.title_fr ?? subtopic.title}</span>
          </h2>
          {hasSupport && <span className="title-support">{subtopic.title}</span>}
        </div>
        <span className="badge badge-info subtopic-count">
          {t("common.unitsOf", { learned, total: units.length, n: units.length })}
        </span>
      </header>
      <ul className="study-unit-grid" hidden={units.length === 0}>
        {units.map((unit) => (
          <VocabularyStudyUnitCard key={unit.slug} unit={unit} />
        ))}
      </ul>
      {units.length === 0 && <p className="empty-text subtopic-empty">{t("vocab.emptySubtopic")}</p>}
    </section>
  );
}
