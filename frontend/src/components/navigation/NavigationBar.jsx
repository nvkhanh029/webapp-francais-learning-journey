import { useCallback, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth.js";
import { t, useLanguage } from "../../i18n/index.js";
import { navSectionForPath } from "../../utils/routeHelpers.js";
import LanguageSelector from "./LanguageSelector.jsx";
import MobileNavMenu, { MobileNavButton, useMobileNavDismiss } from "./MobileNavMenu.jsx";

// Authenticated header (FD §4.4, §7.6, §8.5): brand, main navigation, language selector, logout and the
// compact-width menu. Classes are styled by styles/shared.css and AppLayout.module.css.
const NAV_ITEMS = [
  { to: "/dashboard", labelKey: "common.dashboard" },
  { to: "/vocabulary", labelKey: "common.vocabulary" },
  { to: "/grammar", labelKey: "common.grammar" },
  { to: "/conjugation", labelKey: "common.conjugation" },
];

export default function NavigationBar() {
  useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const currentPath = navSectionForPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useMobileNavDismiss(menuOpen, closeMenu, menuButtonRef);
  // Close the menu whenever the route changes (adjusting state during render, not in an effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="site-header">
      <div className="page-container header-content">
        <div className="brand">
          <img alt={t("common.mascotAlt")} className="brand-logo" src="/images/logo.png" />
          <span className="brand-name">Français Learning Journey</span>
        </div>
        <nav className="main-nav" aria-label={t("common.mainNav")}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              className="nav-link"
              to={item.to}
              aria-current={currentPath === item.to ? "page" : undefined}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSelector />
          <button
            className="logout-button"
            type="button"
            aria-label={t("common.logout")}
            title={t("common.logout")}
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              logout
            </span>
            <span className="logout-label">{t("common.logout")}</span>
          </button>
          <MobileNavButton open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} buttonRef={menuButtonRef} />
        </div>
      </div>
      <MobileNavMenu open={menuOpen} items={NAV_ITEMS} currentPath={currentPath} onNavigate={closeMenu} />
    </header>
  );
}
