import { setLanguage, t, useLanguage } from "../../i18n/index.js";

// VI / EN segmented control (FD §6.8, §7.6). It writes the shared language state; once AuthContext exists the
// write goes through updateSupportLanguage().
const OPTIONS = [
  { code: "vi", title: "Tiếng Việt" },
  { code: "en", title: "English" },
];

export default function LanguageSelector() {
  const language = useLanguage();

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
          onClick={() => setLanguage(option.code)}
        >
          {option.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
