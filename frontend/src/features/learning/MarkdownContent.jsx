import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// The single Markdown renderer for curriculum content (FD §9.3). GitHub-flavored Markdown (tables) through
// react-markdown with its default behavior: raw HTML in the content is shown as text, `rehype-raw` is not added,
// and `dangerouslySetInnerHTML` is never used.
const REMARK_PLUGINS = [remarkGfm];

export default function MarkdownContent({ children, className = "markdown-body" }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{children}</ReactMarkdown>
    </div>
  );
}
