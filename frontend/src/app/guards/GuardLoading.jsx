import { t, useLanguage } from "../../i18n/index.js";
import styles from "./GuardLoading.module.css";

export default function GuardLoading() {
  useLanguage();
  return (
    <div className={styles.loading} role="status">
      <div className={styles.spinner} aria-hidden="true" />
      <span>{t("common.loading")}</span>
    </div>
  );
}
