// Behavior carried over from the raw UI prototype (register-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by RegisterPage.jsx.
export default function init() {
  // UI prototype only. No API request, session, or redirect is made here.
  (() => {
      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const COPY = {
          submit: "Đăng ký",
          submitting: "Đang tạo tài khoản…",
          showPassword: "Hiện mật khẩu",
          hidePassword: "Ẩn mật khẩu",
          emailRequired: "Vui lòng nhập email.",
          emailInvalid: "Vui lòng nhập email hợp lệ.",
          passwordRequired: "Vui lòng nhập mật khẩu.",
          passwordTooShort: "Mật khẩu phải có ít nhất 8 ký tự.",
          // 409 email_already_registered (API Contract §6.1).
          emailTaken: "Email này đã được đăng ký.",
          // Unexpected 422 validation_error (client checks mirror the backend, so rare).
          invalidRequest: "Thông tin đăng ký chưa hợp lệ. Vui lòng kiểm tra lại.",
          serverError: "Không thể đăng ký lúc này. Vui lòng thử lại.",
      };

      const MIN_PASSWORD_LENGTH = 8;

      const form = document.getElementById("register-form");
      const formError = document.getElementById("form-error");
      const formErrorText = formError.querySelector("[data-form-error-text]");
      const submitButton = document.getElementById("register-submit");
      const passwordHint = document.getElementById("password-hint");

      // Same basic rule as the backend (API Contract §6.1): after trimming, no whitespace,
      // exactly one "@", non-empty local and domain parts. No stricter check than Flask's.
      function checkEmail(value) {
          const email = value.trim();
          if (!email) return COPY.emailRequired;
          if (!/^[^\s@]+@[^\s@]+$/.test(email)) return COPY.emailInvalid;
          return "";
      }

      // Only rule: at least 8 characters (no complexity rules for the MVP).
      function checkPassword(value) {
          if (!value) return COPY.passwordRequired;
          if (value.length < MIN_PASSWORD_LENGTH) return COPY.passwordTooShort;
          return "";
      }

      const fields = [
          {
              input: document.getElementById("register-email"),
              error: document.getElementById("email-error"),
              check: checkEmail,
          },
          {
              input: document.getElementById("register-password"),
              error: document.getElementById("password-error"),
              check: checkPassword,
              hint: passwordHint,
          },
      ];
      const [emailField, passwordField] = fields;

      // Shows or clears one field message. aria-describedby points at the visible
      // message only (the password hint while valid, the error while invalid).
      function setFieldError(field, message) {
          const hasError = Boolean(message);
          field.input.setAttribute("aria-invalid", String(hasError));
          field.error.hidden = !hasError;
          if (hasError) field.error.querySelector("[data-error-text]").textContent = message;
          if (field.hint) field.hint.hidden = hasError;

          const describedBy = hasError ? field.error.id : field.hint ? field.hint.id : "";
          if (describedBy) {
              field.input.setAttribute("aria-describedby", describedBy);
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

      // Validates every field so all messages show together; returns the first invalid input.
      function validate() {
          let firstInvalid = null;
          fields.forEach((field) => {
              const message = field.check(field.input.value);
              field.touched = true;
              setFieldError(field, message);
              if (message && !firstInvalid) firstInvalid = field.input;
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
          // Integration point (RegisterPage): setSubmitting(true), then
          // authApi.register({ email: email.trim(), password }).
          //   409 email_already_registered -> setFieldError(emailField, COPY.emailTaken); focus email
          //   422 validation_error         -> showFormError(COPY.invalidRequest)
          //   network / other failure      -> showFormError(COPY.serverError)
          //   201 success                  -> AuthContext updates (learner is signed in);
          //                                   route guards send support_language === null
          //                                   to /setup/language. No "please log in" step.
          // Always setSubmitting(false) when the request settles.
      });

      // After a field has been flagged, re-check it as the learner types: the message
      // updates (e.g. required -> too short) and clears once the value is valid. A 409
      // message on the email field clears as soon as the email is edited.
      fields.forEach((field) => {
          field.input.addEventListener("input", () => {
              if (!field.touched) return;
              setFieldError(field, field.check(field.input.value));
          });
      });

      /* ---------- Show / hide password (same as Login) ---------- */
      const toggle = document.getElementById("password-toggle");
      const passwordInput = passwordField.input;
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
      if (preview === "validation") validate();
      if (preview === "invalid") {
          emailField.input.value = "learner@";
          passwordField.input.value = "short";
          validate();
      }
      if (preview === "email-taken") {
          emailField.input.value = "learner@example.com";
          passwordField.input.value = "example-password";
          emailField.touched = true;
          setFieldError(emailField, COPY.emailTaken);
      }
      if (preview === "server-error") showFormError(COPY.serverError);
      if (preview === "submitting") {
          emailField.input.value = "learner@example.com";
          passwordField.input.value = "example-password";
          setSubmitting(true);
      }
  })();

}
