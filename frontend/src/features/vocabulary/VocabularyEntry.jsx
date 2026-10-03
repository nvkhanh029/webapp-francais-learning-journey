import { t, useLanguage } from "../../i18n/index.js";

// One Vocabulary entry inside a Study Unit (FD §5.4.5, §7.9, §9.1).
//
// `french` is the entry (a word or a multi-word expression — a multi-word expression counts as one
// entry, not several words). `meaning` arrives already selected for the learner's support language
// (API §10.3), and `example_translation` likewise; the frontend never selects a `_vi`/`_en` column
// itself (FD §6.2, §9.1).
//
// `ipa` is optional and returns null when unavailable (API §10.3); `example_fr` and
// `example_translation` are optional too, so each block is omitted rather than rendered empty.
// IPA is marked lang="fr-fonipa" so it is not read as French text.
export default function VocabularyEntry({ entry }) {
  useLanguage();

  const hasExample = Boolean(entry.example_fr || entry.example_translation);

  return (
    <li className="entry">
      <div className="entry-line">
        <p className="entry-term" lang="fr">
          {entry.french}
        </p>
        {entry.ipa && (
          <p className="entry-ipa">
            <span className="visually-hidden">{t("vocab.ipa")} </span>
            <span lang="fr-fonipa">{entry.ipa}</span>
          </p>
        )}
      </div>
      <p className="entry-meaning">
        <span className="visually-hidden">{t("vocab.meaning")} </span>
        <span>{entry.meaning}</span>
      </p>
      {hasExample && (
        <div className="entry-example">
          {entry.example_fr && (
            <p className="example-fr">
              <span className="visually-hidden">{t("vocab.example")} </span>
              <span lang="fr">{entry.example_fr}</span>
            </p>
          )}
          {entry.example_translation && <p className="example-translation">{entry.example_translation}</p>}
        </div>
      )}
    </li>
  );
}
