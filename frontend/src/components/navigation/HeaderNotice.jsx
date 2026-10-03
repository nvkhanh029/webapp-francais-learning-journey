import { useEffect } from "react";

import { t, useLanguage } from "../../i18n/index.js";
import styles from "./HeaderNotice.module.css";

// Short-lived error message under the header for header actions that fail (logout or saving the language while the
// session stays valid, e.g. 403 csrf_failed). Renders nothing while `visible` is false; dismisses itself.
const VISIBLE_MS = 6000;

export default function HeaderNotice({ visible, onDismiss }) {
  useLanguage();
  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(onDismiss, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;
  return (
    <div className={styles.notice} role="alert" data-action-error>
      <span className="material-symbols-outlined" aria-hidden="true">
        error
      </span>
      <span>{t("common.actionError")}</span>
    </div>
  );
}
