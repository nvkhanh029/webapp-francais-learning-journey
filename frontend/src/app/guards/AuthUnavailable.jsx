import { t, useLanguage } from "../../i18n/index.js";
import styles from "./AuthUnavailable.module.css";

// Shown by the guards when the initial GET /me failed for a reason other than 401 (server unreachable, 5xx). The
// learner is not sent to Login, because the session is unknown rather than missing; Retry repeats the session check.
export default function AuthUnavailable({ onRetry }) {
  useLanguage();
  return (
    <main className={styles.unavailable} id="main-content">
      <div className={styles.card} role="alert">
        <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
          cloud_off
        </span>
        <h1 className={styles.title}>{t("guard.unavailableTitle")}</h1>
        <p className={styles.text}>{t("guard.unavailableText")}</p>
        <button className={styles.retry} type="button" onClick={onRetry}>
          {t("common.retry")}
        </button>
      </div>
    </main>
  );
}
