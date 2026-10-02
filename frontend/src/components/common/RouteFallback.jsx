import { t, useLanguage } from "../../i18n/index.js";
import LoadingState from "./LoadingState.jsx";
import styles from "./RouteFallback.module.css";

// Suspense fallback of the lazily loaded route pages.
export default function RouteFallback() {
  useLanguage();
  return (
    <main className={`page-container ${styles.fallback}`}>
      <LoadingState message={t("common.loading")} />
    </main>
  );
}
