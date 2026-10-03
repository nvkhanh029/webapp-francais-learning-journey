import { useLayoutEffect } from "react";

import { t, useLanguage } from "../i18n/index.js";

// Sets document.title from a string-table key and keeps it in the current support language. The document `lang`
// attribute is maintained by i18n/language.js.
export default function useDocumentTitle(titleKey) {
  const language = useLanguage();
  useLayoutEffect(() => {
    document.title = t(titleKey);
  }, [titleKey, language]);
}
