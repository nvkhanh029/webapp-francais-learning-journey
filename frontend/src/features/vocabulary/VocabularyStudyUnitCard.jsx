import LearningUnitRow from "../learning/LearningUnitRow.jsx";

// One Vocabulary Study Unit card on a Topic page (FD §5.4.5, §7.9).
//
// The whole card is the link to /vocabulary/study-units/:slug. The Study Unit — not an individual word
// — is the Vocabulary progress unit, so learner state belongs to the card and never to an entry
// (FD §7.7). Saved individual words are out of MVP scope (Requirements §12).
export default function VocabularyStudyUnitCard({ unit }) {
  return (
    <LearningUnitRow
      variant="unit"
      className="study-unit-card"
      unit={unit}
      to={`/vocabulary/study-units/${unit.slug}`}
    />
  );
}
