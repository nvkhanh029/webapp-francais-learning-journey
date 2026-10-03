import { Link } from "react-router-dom";

// Page-level state for a content slug the API does not know (404). Unlike ErrorState it offers no retry,
// because asking again cannot make the content appear; it links back to the list the learner came from.
export default function NotFoundState({ title, message, backTo, backLabel, headingLevel = 1 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="card page-state" data-page-state="not-found" role="alert">
      <span className="material-symbols-outlined" aria-hidden="true">
        search_off
      </span>
      <Heading className="page-state-title">{title}</Heading>
      <p>{message}</p>
      <Link className="button button-secondary button-compact" to={backTo}>
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>{" "}
        <span>{backLabel}</span>
      </Link>
    </div>
  );
}
