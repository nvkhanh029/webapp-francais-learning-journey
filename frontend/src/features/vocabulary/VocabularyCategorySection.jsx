import { t, useLanguage } from "../../i18n/index.js";
import VocabularyTopicSection from "./VocabularyTopicSection.jsx";

// One Vocabulary Category on the browse page (FD §5.4.5, §7.9).
//
// The hierarchy is Category -> Topic -> Subtopic -> Study Unit, but only Category, Topic and Study Unit
// get routes; Subtopic is grouping data rendered inside the Topic page and needs no page or API of its
// own (API §10.2, FD §4.5).
export default function VocabularyCategorySection({ category, headingId }) {
  useLanguage();

  const topics = category?.topics ?? [];
  const hasTitleFr = Boolean(category.title_fr);
  const hasSupport = hasTitleFr && Boolean(category.title) && category.title !== category.title_fr;

  return (
    <section className="category" aria-labelledby={headingId}>
      <header className="category-header">
        <div className="category-heading">
          <h2 className="category-title" id={headingId}>
            <span lang={hasTitleFr ? "fr" : undefined}>{category.title_fr ?? category.title}</span>
          </h2>
          {hasSupport && <span className="title-support">{category.title}</span>}
        </div>
        <span className="badge badge-info category-count">{t("vocab.topicsCount", { n: topics.length })}</span>
      </header>
      <ul className="topic-grid" hidden={topics.length === 0}>
        {topics.map((topic) => (
          <VocabularyTopicSection key={topic.slug} topic={topic} />
        ))}
      </ul>
      {topics.length === 0 && <p className="empty-text">{t("vocab.emptyCategory")}</p>}
    </section>
  );
}
