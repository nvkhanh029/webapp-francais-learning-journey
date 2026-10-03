import { useState } from "react";

import { t, useLanguage } from "../../i18n/index.js";
import useAuth from "../../hooks/useAuth.js";

// Localized text for a failed submit, chosen from the API error code rather than the message
// (repository-conventions §7.6, FD §6.5).
//
// `429 rate_limited` is not an authentication failure: it never clears the session and never
// redirects to Login, and the entered email is kept (FD §6.7). The wait comes from
// `ApiError.retryAfterSeconds`, parsed by the API client from the Retry-After header, so the learner
// gets an approximate time instead of a bare "later" (FD §6.7).
export function loginErrorText(error) {
  if (!error) return null;
  if (error.isRateLimited) {
    const seconds = error.retryAfterSeconds;
    if (Number.isFinite(seconds) && seconds >= 60) {
      return t("auth.rateLimitedWait", { minutes: Math.max(1, Math.round(seconds / 60)) });
    }
    if (Number.isFinite(seconds) && seconds > 0) {
      return t("auth.rateLimitedSeconds", { seconds });
    }
    return t("auth.rateLimited");
  }
  if (error.isUnauthorized || error.code === "invalid_credentials") return t("auth.invalidCredentials");
  // 403 csrf_failed, a validation error, and anything unexpected all land here: one generic message
  // that never says whether the email exists.
  return t("auth.requestFailed");
}

// Turns a `validation_error` details map into { field: code } for the per-field messages (FD §6.5).
function fieldsOf(error) {
  return error && typeof error.fields === "object" && error.fields !== null ? error.fields : {};
}

export function fieldErrorText(code, field = "email") {
  switch (code) {
    case "required":
      // The same `required` code applies to both fields, so the field decides the wording.
      return t(field === "password" ? "common.passwordRequired" : "common.emailRequired");
    case "too_short":
      return t("auth.passwordTooShort");
    case "invalid_format":
      return t(field === "password" ? "auth.passwordTooLong" : "auth.emailInvalid");
    default:
      // An unknown code falls back to the generic message rather than showing nothing.
      return t("auth.requestFailed");
  }
}

export default function LoginForm() {
  useLanguage();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const fields = fieldsOf(error);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Frontend validation is convenience only; the backend result is authoritative (FD §12.7,
    // system-architecture §4.1). Every empty field is reported at once so a learner is not sent
    // through one error per submit.
    const missing = {};
    if (!email.trim()) missing.email = "required";
    if (!password) missing.password = "required";
    if (Object.keys(missing).length > 0) {
      setError({ fields: missing });
      return;
    }

    setSubmitting(true);
    try {
      // On success the guards take over: GuestRoute sends the learner to the Dashboard, or
      // RequireLanguage to first-time Language Setup when support_language is still null (FD §4.3).
      await login(email.trim(), password);
    } catch (cause) {
      // The entered email is deliberately kept so a rate-limited or failed attempt can be retried.
      setError(cause);
    } finally {
      setSubmitting(false);
    }
  };

  // A validation_error is reported per field; every other failure gets one form-level message.
  const hasFieldErrors = Object.keys(fields).length > 0;
  const formError = hasFieldErrors ? null : loginErrorText(error);

  return (
    <>
      <div className="form-alert" id="form-error" role="alert" hidden={!formError}>
        <span className="material-symbols-outlined" aria-hidden="true">
          error
        </span>{" "}
        <span>{formError}</span>
      </div>
      <form className="login-form" id="login-form" noValidate onSubmit={onSubmit}>
        <div className="form-field">
          <label className="form-label" htmlFor="login-email">
            Email
          </label>
          <input
            className="form-input"
            id="login-email"
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
            aria-describedby={fields.email ? "email-error" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="field-error" id="email-error" hidden={!fields.email}>
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>{" "}
            <span>{fieldErrorText(fields.email, "email")}</span>
          </p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="login-password">
            {t("common.password")}
          </label>
          <div className="password-control">
            <input
              className="form-input"
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.passwordPlaceholder")}
              required
              value={password}
              aria-invalid={fields.password ? "true" : undefined}
              aria-describedby={fields.password ? "password-error" : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="password-toggle"
              id="password-toggle"
              type="button"
              aria-controls="login-password"
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
          <p className="field-error" id="password-error" hidden={!fields.password}>
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>{" "}
            <span>{fieldErrorText(fields.password, "password")}</span>
          </p>
        </div>

        <button className="button button-primary login-submit" id="login-submit" type="submit" aria-busy={isSubmitting}>
          <span data-submit-label>{isSubmitting ? t("auth.loginSubmitting") : t("auth.loginSubmit")}</span>{" "}
          <span className="material-symbols-outlined" aria-hidden="true" data-submit-icon>
            arrow_forward
          </span>
          <span className="button-spinner" aria-hidden="true" data-submit-spinner hidden={!isSubmitting} />
        </button>
      </form>
    </>
  );
}
