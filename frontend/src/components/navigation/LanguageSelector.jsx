import useAuth from "../../hooks/useAuth.js";
import { t, useLanguage } from "../../i18n/index.js";

// VI / EN segmented control (FD §6.8, §7.6). The choice goes through AuthContext.updateSupportLanguage(): a saved
// preference for a signed-in learner, a per-browser value otherwise. A failed save leaves the language unchanged.
const OPTIONS = [
  { code: "vi", title: "Tiếng Việt" },
  { code: "en", title: "English" },
];

export default function LanguageSelector() {
  const language = useLanguage();
  const { updateSupportLanguage } = useAuth();

  return (
    <div className="language-switcher" role="group" aria-label={t("common.supportLanguage")}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          className="language-button"
          type="button"
          aria-pressed={language === option.code}
          data-lang={option.code}
          title={option.title}
          onClick={() => updateSupportLanguage(option.code).catch(() => {})}
        >
          {option.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
