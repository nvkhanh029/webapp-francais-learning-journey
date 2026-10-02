import useAuth from "../../hooks/useAuth.js";
import { setLanguage, t, useLanguage } from "../../i18n/index.js";

// VI / EN segmented control (FD §6.8, §7.6). The choice goes through AuthContext.updateSupportLanguage(): a saved
// preference for a signed-in learner, a per-browser value otherwise. A failed save leaves the language unchanged.
//
// A signed-in learner who has not saved a language yet (Language Setup, or a 404 reached before setup) only changes
// the display language, per browser: saving a preference is the Continue button's job on Language Setup (no silent
// default, FD §7.15).
const OPTIONS = [
  { code: "vi", title: "Tiếng Việt" },
  { code: "en", title: "English" },
];

// onError (optional) is called when saving the preference fails, so the host can show a message.
export default function LanguageSelector({ onError }) {
  const language = useLanguage();
  const { currentUser, updateSupportLanguage } = useAuth();
  const hasNoSavedLanguage = currentUser !== null && currentUser.support_language === null;

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
          onClick={() =>
            hasNoSavedLanguage ? setLanguage(option.code) : updateSupportLanguage(option.code).catch(() => onError?.())
          }
        >
          {option.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
