import LearningContent from "../learning/LearningContent.jsx";

// The Grammar lesson body (FD §5.4.4, §7.11, §9.3).
//
// `content` is one localized Markdown string returned by GET /api/v1/grammar/lessons/{slug}
// (API §9.2). It is rendered once through the single approved Markdown renderer with raw HTML
// disabled, so authored structure stays plain Markdown (FD §9.3).
//
// Grammar content deliberately has no Grammar-specific styling hooks: the CSS targets plain Markdown
// elements (headings, paragraphs, lists, tables, blockquotes) so a lesson with a different structure
// renders without layout changes (FD §9.3).
export default function GrammarLessonContent({ content }) {
  return (
    <div className="card lesson-reading">
      <LearningContent content={content} />
    </div>
  );
}
