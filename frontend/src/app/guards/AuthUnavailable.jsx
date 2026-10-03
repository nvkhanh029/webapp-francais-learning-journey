import { t, useLanguage } from "../../i18n/index.js";
import styles from "./GuardLoading.module.css";

// Shown when the session check failed for a reason other than "not signed in" (FD §6.7).
//
// The backend could not be reached, or answered 5xx / 403 / 429. The session is therefore unknown, so
// protected content and the redirect to Login both stay blocked and the learner is offered a retry
// instead of being shown a login form. Public pages that need no session stay usable.
export default function AuthUnavailable({ onRetry, isRetrying }) {
  useLanguage();

  return (
    <div className={styles.loading} role="alert">
      <span className="material-symbols-outlined" aria-hidden="true">
        cloud_off
      </span>
      <p className={styles.message}>{t("auth.serverUnavailableText")}</p>
      <button className="button button-secondary" type="button" disabled={isRetrying} onClick={onRetry}>
        {isRetrying ? t("common.loading") : t("common.retry")}
      </button>
    </div>
  );
}
