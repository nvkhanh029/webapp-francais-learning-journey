import { t } from "../../i18n/index.js";

// Page-level loading state (FD §6.6). `hidden` lets a page keep the block in the DOM and toggle it.
export default function LoadingState({ message, hidden = false }) {
  return (
    <div className="card page-state" data-page-state="loading" role="status" hidden={hidden}>
      <div className="spinner" aria-hidden="true" />
      <p>{message ?? t("common.loading")}</p>
    </div>
  );
}
