import { Link } from "react-router-dom";

import { t } from "../../i18n/index.js";

// Breadcrumb trail (FD §5.3). `items` is [{ label, to?, icon? }]; the last item is the current page and has
// no `to`. A leading `icon` is drawn inside the first link.
export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label={t("common.breadcrumb")}>
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={item.to ?? item.label}>
            {index > 0 && (
              <>
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>{" "}
              </>
            )}
            {item.to ? (
              <Link className="crumb-link" to={item.to}>
                {item.icon && (
                  <>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {item.icon}
                    </span>{" "}
                  </>
                )}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="crumb-current" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
