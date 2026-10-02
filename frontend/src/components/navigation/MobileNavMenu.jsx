import { useEffect } from "react";
import { Link } from "react-router-dom";

import { t, useLanguage } from "../../i18n/index.js";

// Compact-width navigation (FD §8.5). The button sits in the header actions and the panel below the header
// bar, so they are two components that share the `open` state owned by NavigationBar.

export function MobileNavButton({ open, onToggle, buttonRef }) {
  useLanguage();
  return (
    <button
      ref={buttonRef}
      className="menu-button"
      type="button"
      aria-expanded={open}
      aria-controls="mobile-nav"
      aria-label={t(open ? "common.menuNavClose" : "common.menuNav")}
      onClick={onToggle}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {open ? "close" : "menu"}
      </span>
    </button>
  );
}

// Closes on Escape (returning focus to the button) and when the viewport widens to the full navigation.
export function useMobileNavDismiss(open, close, buttonRef) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = (event) => {
      if (event.matches) close();
    };
    document.addEventListener("keydown", onKeyDown);
    query.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      query.removeEventListener("change", onChange);
    };
  }, [open, close, buttonRef]);
}

export default function MobileNavMenu({ open, items, currentPath, onNavigate }) {
  useLanguage();
  return (
    <nav className="mobile-nav" id="mobile-nav" aria-label={t("common.mainNav")} hidden={!open}>
      <div className="page-container mobile-nav-list">
        {items.map((item) => (
          <Link
            key={item.to}
            className="mobile-nav-link"
            to={item.to}
            aria-current={currentPath === item.to ? "page" : undefined}
            onClick={onNavigate}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
