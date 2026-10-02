import { t } from "../../i18n/index.js";

// Page-level error state (FD §6.6) with a retry action. `headingLevel` is the heading rank of `title`
// (1 when the state replaces the whole page content, 2 when it sits under the page's own h1).
// `retryAction` is the data-action value the page script listens for until the retry is a real callback.
export default function ErrorState({
  title,
  message = t("common.loadError"),
  headingLevel = 2,
  retryLabel = t("common.retry"),
  onRetry,
  retryAction,
  hidden = false,
}) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="card page-state" data-page-state="error" role="alert" hidden={hidden}>
      <span className="material-symbols-outlined" aria-hidden="true">
        cloud_off
      </span>
      <Heading className="page-state-title">{title}</Heading>
      <p>{message}</p>
      {(onRetry || retryAction) && (
        <button className="button button-secondary button-compact" type="button" data-action={retryAction} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
