import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../api/apiClient.js";
import useAuth from "../../hooks/useAuth.js";
import { t, useLanguage } from "../../i18n/index.js";
import { fieldErrorsFromApi, normalizeEmail, postAuthPath } from "./authHelpers.js";
import { FieldError, FormAlert, PasswordField, SubmitButton } from "./AuthFormParts.jsx";

// Register form (FD §5.4.1). Fields map to POST /api/v1/auth/register { email, password } (API §6.1), sent through
// AuthContext.register(). The email is trimmed and lowercased; the password is sent exactly as typed. A successful
// registration signs the learner in, so they go straight to Language Setup (support_language is null).
//
// Preview states (UI review aid): ?preview=validation | invalid | email-taken | server-error | submitting.
// They only set the initial state of the form; nothing is sent to the API.
const MIN_PASSWORD_LENGTH = 8;

// Same basic rule as the backend (API §6.1): after trimming, no whitespace, exactly one "@", non-empty local and
// domain parts. Each check returns a string-table key, or "" when the value is valid.
function checkEmail(value) {
  const email = value.trim();
  if (!email) return "common.emailRequired";
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return "auth.emailInvalid";
  return "";
}

// Only rule: at least 8 characters, counted on the untrimmed value (no complexity rules for the MVP).
function checkPassword(value) {
  if (!value) return "common.passwordRequired";
  if (value.length < MIN_PASSWORD_LENGTH) return "auth.passwordTooShort";
  return "";
}

const CHECKS = { email: checkEmail, password: checkPassword };

function initialState(preview) {
  const prefilled = preview === "email-taken" || preview === "submitting";
  const state = {
    email: prefilled ? "learner@example.com" : "",
    password: prefilled ? "example-password" : "",
    errors: { email: "", password: "" },
    touched: { email: false, password: false },
    formError: preview === "server-error" ? "auth.registerServerError" : null,
    submitting: preview === "submitting",
  };
  if (preview === "invalid") {
    state.email = "learner@";
    state.password = "short";
  }
  if (preview === "validation" || preview === "invalid") {
    state.errors = { email: checkEmail(state.email), password: checkPassword(state.password) };
    state.touched = { email: true, password: true };
  }
  if (preview === "email-taken") {
    state.errors.email = "auth.emailTaken";
    state.touched.email = true;
  }
  return state;
}

export default function RegisterForm() {
  useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const preview = useSearchParams()[0].get("preview");
  const [initial] = useState(() => initialState(preview));
  const [values, setValues] = useState({ email: initial.email, password: initial.password });
  // errors hold string-table keys (or { text } for an API message with no matching key), translated at render so
  // they follow a language change.
  const [errors, setErrors] = useState(initial.errors);
  // A field is touched once a submit validated it; from then on it is re-checked as the learner types, so a
  // message updates (required -> too short) and a server message (email taken) clears on the next edit.
  const [touched, setTouched] = useState(initial.touched);
  const [formError, setFormError] = useState(initial.formError);
  const [submitting, setSubmitting] = useState(initial.submitting);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    if (touched[name]) setErrors((current) => ({ ...current, [name]: CHECKS[name](value) }));
  }

  function showFieldErrors(next) {
    setErrors((current) => ({ ...current, ...next }));
    setTouched((current) => ({
      ...current,
      email: current.email || "email" in next,
      password: current.password || "password" in next,
    }));
    if (next.email) emailRef.current.focus();
    else if (next.password) passwordRef.current.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    // Validate every field so all messages show together.
    const next = { email: checkEmail(values.email), password: checkPassword(values.password) };
    setErrors(next);
    setTouched({ email: true, password: true });
    if (next.email) return emailRef.current.focus();
    if (next.password) return passwordRef.current.focus();

    setSubmitting(true);
    try {
      const user = await register(normalizeEmail(values.email), values.password);
      navigate(postAuthPath(user), { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && error.code === "email_already_registered") {
        showFieldErrors({ email: "auth.emailTaken" });
      } else if (error instanceof ApiError && error.status === 422 && error.code === "validation_error") {
        const fieldErrors = fieldErrorsFromApi(error);
        if (Object.keys(fieldErrors).length > 0) showFieldErrors(fieldErrors);
        else setFormError("auth.invalidRequest");
      } else {
        setFormError("auth.registerServerError");
      }
    }
  }

  const messageOf = (error) => (!error ? null : typeof error === "string" ? t(error) : error.text);
  const emailError = messageOf(errors.email);
  const passwordError = messageOf(errors.password);

  return (
    <form className="auth-form" id="register-form" noValidate onSubmit={handleSubmit}>
      {/* Form-level error: network/server failure or an unexpected 422. */}
      <FormAlert message={formError && t(formError)} />
      <div className="form-field">
        <label className="form-label" htmlFor="register-email">
          Email
        </label>{" "}
        <input
          className="form-input"
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="learner@example.com"
          required
          ref={emailRef}
          value={values.email}
          onChange={(event) => change("email", event.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {/* Also used for 409 email_already_registered. */}
        <FieldError id="email-error" message={emailError} />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="register-password">
          {t("common.password")}
        </label>
        <PasswordField
          id="register-password"
          value={values.password}
          onChange={(value) => change("password", value)}
          autoComplete="new-password"
          placeholder={t("auth.registerPasswordPlaceholder")}
          minLength={MIN_PASSWORD_LENGTH}
          invalid={Boolean(passwordError)}
          describedBy={passwordError ? "password-error" : "password-hint"}
          inputRef={passwordRef}
        />
        {/* The only password rule (FR-AUTH-01). Replaced by the error while invalid. */}
        <p className="field-hint" id="password-hint" hidden={Boolean(passwordError)}>
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>{" "}
          <span>{t("auth.passwordTooShort")}</span>
        </p>
        <FieldError id="password-error" message={passwordError} />
      </div>
      <SubmitButton
        id="register-submit"
        className="auth-submit"
        submitting={submitting}
        label={t("auth.registerSubmit")}
        submittingLabel={t("auth.registerSubmitting")}
      />
    </form>
  );
}
