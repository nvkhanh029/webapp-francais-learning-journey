import { useState } from "react";

import { t, useLanguage } from "../../i18n/index.js";
import useAuth from "../../hooks/useAuth.js";
import { fieldErrorText } from "./LoginForm.jsx";

// Registration (FD §5.4.1, API §6.1). Submitting creates the account and signs the learner in, so the
// guards take over afterwards: GuestRoute would send them to the Dashboard, and RequireLanguage to
// first-time Language Setup because a new account starts with `support_language = null` (API §6.1).
//
// One generic message is used for every failure so the page never reveals whether an email is already
// registered through its wording alone; the per-field codes still drive the messages under each input
// (FD §6.5, API §4.4).
function registerErrorText(error) {
  if (!error) return null;
  const fields = error && typeof error.fields === "object" && error.fields !== null ? error.fields : {};
  if (Object.keys(fields).length > 0) return null; // shown per field instead
  if (error.code === "email_already_registered") return t("auth.emailTaken");
  if (error.isRateLimited) return t("auth.rateLimited");
  return t("auth.requestFailed");
}

export default function RegisterForm() {
  useLanguage();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const fields = error && typeof error.fields === "object" && error.fields !== null ? error.fields : {};

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Convenience validation only. The backend re-validates and its result is what is shown
    // (FD §12.7).
    const nextFields = {};
    if (!email.trim()) nextFields.email = "required";
    if (!password) nextFields.password = "required";
    else if (password.length < 8) nextFields.password = "too_short";
    if (Object.keys(nextFields).length > 0) {
      setError({ fields: nextFields });
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim(), password);
    } catch (cause) {
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  };

  const formError = registerErrorText(error);

  return (
    <>
      <div className="form-alert" id="form-error" role="alert" hidden={!formError}>
        <span className="material-symbols-outlined" aria-hidden="true">
          error
        </span>{" "}
        <span>{formError}</span>
      </div>
      <form className="auth-form" id="register-form" noValidate onSubmit={onSubmit}>
        <div className="form-field">
          <label className="form-label" htmlFor="register-email">
            Email
          </label>
          <input
            className="form-input"
            id="register-email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="learner@example.com"
            required
            value={email}
            aria-invalid={fields.email ? "true" : undefined}
            aria-describedby={fields.email ? "register-email-error" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="field-error" id="register-email-error" hidden={!fields.email}>
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>{" "}
            <span>{fieldErrorText(fields.email, "email")}</span>
          </p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="register-password">
            {t("common.password")}
          </label>
          <div className="password-control">
            <input
              className="form-input"
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("auth.registerPasswordPlaceholder")}
              required
              minLength="8"
              value={password}
              aria-invalid={fields.password ? "true" : undefined}
              aria-describedby={fields.password ? "register-password-error" : "password-hint"}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="password-toggle"
              id="register-password-toggle"
              type="button"
              aria-controls="register-password"
              aria-pressed={showPassword}
              aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
              title={showPassword ? t("common.hidePassword") : t("common.showPassword")}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                visibility
              </span>
            </button>
          </div>
          <p className="field-hint" id="password-hint">
            <span className="material-symbols-outlined" aria-hidden="true">
              info
            </span>{" "}
            <span>{t("auth.passwordTooShort")}</span>
          </p>
          <p className="field-error" id="register-password-error" hidden={!fields.password}>
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>{" "}
            <span>{fieldErrorText(fields.password, "password")}</span>
          </p>
        </div>

        <button
          className="button button-primary register-submit"
          id="register-submit"
          type="submit"
          aria-busy={isSubmitting}
        >
          <span>{isSubmitting ? t("auth.registerSubmitting") : t("auth.registerSubmit")}</span>{" "}
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
          <span className="button-spinner" aria-hidden="true" hidden={!isSubmitting} />
        </button>
      </form>
    </>
  );
}
