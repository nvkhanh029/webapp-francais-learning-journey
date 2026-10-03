import LearningUnitRow from "../learning/LearningUnitRow.jsx";

// One Conjugation Rule/Pattern Lesson inside its Tense (FD §5.4.6, §7.10).
//
// The whole row is the link to /conjugation/lessons/:slug. The Rule/Pattern Lesson — not an individual
// verb — is the progress and practice unit, so there is no per-verb state anywhere here.
export default function ConjugationLessonCard({ lesson }) {
  return (
    <LearningUnitRow
      variant="lesson"
      className="lesson-item"
      unit={lesson}
      to={`/conjugation/lessons/${lesson.slug}`}
    />
  );
}
