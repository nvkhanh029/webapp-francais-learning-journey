// Behavior carried over from the raw UI prototype (login-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by LoginPage.jsx.
export default function init() {
  // UI prototype only. No API request, session, or redirect is made here.
  (() => {
      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const COPY = {
          submit: "Đăng nhập",
          submitting: "Đang đăng nhập…",
          showPassword: "Hiện mật khẩu",
          hidePassword: "Ẩn mật khẩu",
          // Generic by contract: never reveal whether the email exists (API Contract §6.2).
          invalidCredentials: "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
          serverError: "Không thể đăng nhập lúc này. Vui lòng thử lại.",
      };

      const form = document.getElementById("login-form");
      const formError = document.getElementById("form-error");
      const formErrorText = formError.querySelector("[data-form-error-text]");
      const submitButton = document.getElementById("login-submit");
      const fields = [
          { input: document.getElementById("login-email"), error: document.getElementById("email-error"), trim: true },
          // The password is never trimmed: leading/trailing spaces are part of it.
          { input: document.getElementById("login-password"), error: document.getElementById("password-error"), trim: false },
      ];

      // Required-field validation (client-side only). aria-describedby is set only while
      // the message is visible: screen readers read referenced text even when hidden.
      function setFieldError(field, hasError) {
          field.input.setAttribute("aria-invalid", String(hasError));
          field.error.hidden = !hasError;
          if (hasError) {
              field.input.setAttribute("aria-describedby", field.error.id);
          } else {
              field.input.removeAttribute("aria-describedby");
          }
      }

      function showFormError(message) {
          formError.hidden = !message;
          formErrorText.textContent = message || "";
      }

      function setSubmitting(isSubmitting) {
          submitButton.disabled = isSubmitting;
          submitButton.setAttribute("aria-busy", String(isSubmitting));
          submitButton.querySelector("[data-submit-label]").textContent =
              isSubmitting ? COPY.submitting : COPY.submit;
          submitButton.querySelector("[data-submit-icon]").hidden = isSubmitting;
          submitButton.querySelector("[data-submit-spinner]").hidden = !isSubmitting;
      }

      function isFieldEmpty(field) {
          return (field.trim ? field.input.value.trim() : field.input.value) === "";
      }

      // The API only requires non-empty email and password; format and credentials are
      // checked by Flask.
      function validate() {
          let firstInvalid = null;
          fields.forEach((field) => {
              const isEmpty = isFieldEmpty(field);
              if (isEmpty) field.touched = true;
              setFieldError(field, isEmpty);
              if (isEmpty && !firstInvalid) firstInvalid = field.input;
          });
          return firstInvalid;
      }

      form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (submitButton.disabled) return;
          showFormError("");
          const firstInvalid = validate();
          if (firstInvalid) {
              firstInvalid.focus();
              return;
          }
          // Integration point (LoginForm, FD §5.4.1): setSubmitting(true), then
          // authApi.login({ email, password }).
          //   401 invalid_credentials  -> showFormError(COPY.invalidCredentials)
          //   network / other failure  -> showFormError(COPY.serverError)
          //   success                  -> AuthContext updates; route guards redirect.
          // Always setSubmitting(false) when the request settles.
      });

      // After a field has been flagged, re-check it as the learner types: the message
      // clears once the field is filled and returns if it is emptied again.
      fields.forEach((field) => {
          field.input.addEventListener("input", () => {
              if (!field.touched) return;
              setFieldError(field, isFieldEmpty(field));
          });
      });

      /* ---------- Show / hide password ---------- */
      const toggle = document.getElementById("password-toggle");
      const passwordInput = fields[1].input;
      toggle.addEventListener("click", () => {
          const isVisible = passwordInput.type === "text";
          passwordInput.type = isVisible ? "password" : "text";
          const label = isVisible ? COPY.showPassword : COPY.hidePassword;
          toggle.setAttribute("aria-pressed", String(!isVisible));
          toggle.setAttribute("aria-label", label);
          toggle.title = label;
          toggle.querySelector(".material-symbols-outlined").textContent =
              isVisible ? "visibility" : "visibility_off";
      });

      /* ---------- Preview states (prototype only) ---------- */
      const preview = new URLSearchParams(window.location.search).get("preview");
      if (preview === "validation") {
          fields.forEach((field) => {
              field.touched = true;
              setFieldError(field, true);
          });
      }
      if (preview === "invalid-credentials") showFormError(COPY.invalidCredentials);
      if (preview === "server-error") showFormError(COPY.serverError);
      if (preview === "submitting") {
          fields[0].input.value = "learner@example.com";
          fields[1].input.value = "example-password";
          setSubmitting(true);
      }
  })();

}
