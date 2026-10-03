// Behavior carried over from the raw UI prototype (language-setup-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by LanguageSetupPage.jsx.
import { t } from "../i18n/index.js";

export default function init() {
  // UI prototype only. No API request, session, or redirect is made here.
  (() => {
      // Copy read from the central string table (src/i18n/strings.js) each time it is used, so it
      // always follows the current language.
      const COPY = {
          get submit() { return t("setup.submit"); },
          get submitting() { return t("setup.submitting"); },
          get validationTitle() { return t("setup.validationTitle"); },
          get validationText() { return t("setup.validationText"); },
          get serverTitle() { return t("setup.serverTitle"); },
          get serverText() { return t("setup.serverText"); },
      };

      const options = Array.from(document.querySelectorAll(".language-option"));
      const submitButton = document.getElementById("setup-submit");
      const formError = document.getElementById("form-error");
      const formErrorTitle = formError.querySelector("[data-form-error-title]");
      const formErrorText = formError.querySelector("[data-form-error-text]");
      const formErrorRetry = formError.querySelector("[data-form-error-retry]");
      let selectedLang = null;

      /* ---------- Selection: single-choice radiogroup with roving tabindex ---------- */
      function selectOption(option, { moveFocus = false } = {}) {
          selectedLang = option.dataset.lang;
          options.forEach((candidate) => {
              const isSelected = candidate === option;
              candidate.setAttribute("aria-checked", String(isSelected));
              candidate.tabIndex = isSelected ? 0 : -1;
          });
          if (moveFocus) option.focus();
          showFormError(null); // Selecting a language clears a prior validation message.
      }

      options.forEach((option, index) => {
          option.addEventListener("click", () => selectOption(option));
          option.addEventListener("keydown", (event) => {
              if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  selectOption(option);
              } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  selectOption(options[(index + 1) % options.length], { moveFocus: true });
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  selectOption(options[(index - 1 + options.length) % options.length], { moveFocus: true });
              }
          });
      });

      /* ---------- Form-level error / validation ---------- */
      function showFormError(kind) {
          // kind: null (hide), "validation", or "server"
          formError.hidden = kind === null;
          formErrorRetry.hidden = kind !== "server";
          if (kind === "validation") {
              formErrorTitle.textContent = COPY.validationTitle;
              formErrorText.textContent = COPY.validationText;
          } else if (kind === "server") {
              formErrorTitle.textContent = COPY.serverTitle;
              formErrorText.textContent = COPY.serverText;
          }
      }

      function setSubmitting(isSubmitting) {
          submitButton.disabled = isSubmitting;
          submitButton.setAttribute("aria-busy", String(isSubmitting));
          submitButton.querySelector("[data-submit-label]").textContent =
              isSubmitting ? COPY.submitting : COPY.submit;
          submitButton.querySelector("[data-submit-icon]").hidden = isSubmitting;
          submitButton.querySelector("[data-submit-spinner]").hidden = !isSubmitting;
      }

      function handleSubmit(event) {
          if (submitButton.disabled) return;
          if (!selectedLang) {
              // Handled here: tell usePageScript not to follow the button's data-route.
              event.preventDefault();
              showFormError("validation");
              document.getElementById("language-options").focus();
              options[0].focus();
              return;
          }
          showFormError(null);
          // Integration point: setSubmitting(true), then
          // preferencesApi.updateSupportLanguage(selectedLang) i.e.
          // PATCH /api/v1/me/preferences { support_language: selectedLang }.
          //   success -> AuthContext.currentUser.support_language updates;
          //              route guards send the learner into the authenticated app
          //              (no extra confirmation screen, no return to Login/Register).
          //   failure -> setSubmitting(false); showFormError("server").
          // This prototype only demonstrates the pending state below.
      }

      submitButton.addEventListener("click", handleSubmit);
      formError.querySelector('[data-action="retry-submit"]').addEventListener("click", handleSubmit);

      /* ---------- Preview states (prototype only) ---------- */
      const preview = new URLSearchParams(window.location.search).get("preview");
      if (preview === "validation") showFormError("validation");
      if (preview === "server-error") {
          selectOption(options[0]);
          showFormError("server");
      }
      if (preview === "submitting") {
          selectOption(options[1]);
          setSubmitting(true);
      }
  })();

}
