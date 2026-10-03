import MarkdownContent from "./MarkdownContent.jsx";

// The one place learning content is rendered (FD §9.3).
//
// Curriculum and reference content arrives from the API as localized Markdown and is passed through
// the single approved renderer (`react-markdown` + `remark-gfm`, raw HTML disabled). Grammar,
// Vocabulary and Conjugation content must never be parsed separately, and this component never uses
// dangerouslySetInnerHTML for content (FD §9.3).
//
// The surrounding card/panel is left to the caller, because the reference page renders the same
// content without one.
export default function LearningContent({ content, className = "markdown-body" }) {
  if (!content) return null;
  return <MarkdownContent className={className}>{content}</MarkdownContent>;
}
