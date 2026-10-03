import { Link } from "react-router-dom";

import { useLanguage } from "../../i18n/index.js";

// One Vocabulary Topic card on the browse page (FD §5.4.5, §7.9).
//
// Topics carry no learner state: the Study Unit is the Vocabulary progress unit, and the browse
// payload stops at Topic metadata on purpose so the first Vocabulary screen does not load the whole
// hierarchy (API §10.1). The Topic's own page shows its Subtopics and Study Units.
export default function VocabularyTopicSection({ topic }) {
  useLanguage();

  const hasTitleFr = Boolean(topic.title_fr);
  const hasSupport = hasTitleFr && Boolean(topic.title) && topic.title !== topic.title_fr;

  return (
    <li>
      <Link className="topic-card" to={`/vocabulary/topics/${topic.slug}`}>
        <span className="topic-body">
          <span className="topic-title" lang={hasTitleFr ? "fr" : undefined}>
            {topic.title_fr ?? topic.title}
          </span>
          {hasSupport && <span className="title-support">{topic.title}</span>}
        </span>
        <span className="topic-arrow" aria-hidden="true">
          <span className="material-symbols-outlined">arrow_forward</span>
        </span>
      </Link>
    </li>
  );
}
