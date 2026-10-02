import { t, useLanguage } from "../../i18n/index.js";

// Footer shared by every layout (FD §7.6).
export default function SiteFooter({ className = "" }) {
  useLanguage();
  return (
    <footer className={`site-footer ${className}`.trim()}>
      <div className="page-container footer-content">
        <span className="material-symbols-outlined" aria-hidden="true">
          auto_stories
        </span>
        <span>{t("common.footer")}</span>
      </div>
    </footer>
  );
}
