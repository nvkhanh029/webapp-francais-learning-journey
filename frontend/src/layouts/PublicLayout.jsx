import { Link, Outlet, useLocation } from "react-router-dom";

import SiteFooter from "../components/navigation/SiteFooter.jsx";
import { t, useLanguage } from "../i18n/index.js";
import styles from "./PublicLayout.module.css";

// Header actions of the public pages: each page offers the other entry point (FD §4.2).
function HeaderActions({ pathname }) {
  if (pathname === "/") {
    return (
      <nav className="header-actions" aria-label={t("common.account")}>
        <Link className="button button-secondary button-compact" to="/login">
          {t("common.loginAction")}
        </Link>
        <Link className="button button-primary button-compact header-start" to="/register">
          {t("landing.start")}
        </Link>
      </nav>
    );
  }
  const isLogin = pathname === "/login";
  return (
    <nav className="header-actions" aria-label={t("common.account")}>
      <Link className="button button-secondary button-compact" to={isLogin ? "/register" : "/login"}>
        {t(isLogin ? "common.registerAction" : "common.loginAction")}
      </Link>
    </nav>
  );
}

// Frame of the public pages (Landing, Login, Register): brand, page-specific actions, routed page, footer.
export default function PublicLayout() {
  useLanguage();
  const { pathname } = useLocation();
  // The auth pages fill the screen with their own main area, so their footer has no top margin.
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className={`app-page ${styles.layout}`}>
      <header className="site-header">
        <div className="page-container header-content">
          <Link className="brand" to="/">
            <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />
            <span className="brand-name">Français Learning Journey</span>
          </Link>
          <HeaderActions pathname={pathname} />
        </div>
      </header>
      <div className="page-body">
        <Outlet />
      </div>
      <SiteFooter className={isAuthPage ? styles.footerFlush : ""} />
    </div>
  );
}
