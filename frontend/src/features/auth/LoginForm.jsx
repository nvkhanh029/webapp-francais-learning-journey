import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import useAuth from "../../hooks/useAuth.js";
import { t, useLanguage } from "../../i18n/index.js";
import { loginErrorMessage, normalizeEmail, postAuthPath } from "./authHelpers.js";
import { FieldError, FormAlert, PasswordField, SubmitButton } from "./AuthFormParts.jsx";

// Login form (FD §5.4.1). Fields map to POST /api/v1/auth/login { email, password } (API §6.2), sent through
// AuthContext.login(). On success the learner goes to the Dashboard, or to Language Setup while no support language
// is saved.
//
// Preview states (UI review aid): ?preview=validation | invalid-credentials | server-error | submitting.
// They only set the initial state of the form; nothing is sent to the API.
function initialState(preview) {
  return {
    email: preview === "submitting" ? "learner@example.com" : "",
    password: preview === "submitting" ? "example-password" : "",
    flagged: { email: preview === "validation", password: preview === "validation" },
    formError:
      preview === "invalid-credentials"
        ? { key: "auth.invalidCredentials" }
        : preview === "server-error"
          ? { key: "auth.loginServerError" }
          : null,
    submitting: preview === "submitting",
  };
}

export default function LoginForm() {
  useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const preview = useSearchParams()[0].get("preview");
  const [initial] = useState(() => initialState(preview));
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);
  // A field is flagged once a submit found it empty; from then on it is re-checked as the learner types.
  const [flagged, setFlagged] = useState(initial.flagged);
  const [formError, setFormError] = useState(initial.formError);
  const [submitting, setSubmitting] = useState(initial.submitting);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // The API only requires a non-empty email and password; format and credentials are checked by Flask.
  // The password is never trimmed: leading and trailing spaces are part of it.
  const emailMissing = flagged.email && email.trim() === "";
  const passwordMissing = flagged.password && password === "";

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    const missing = { email: email.trim() === "", password: password === "" };
    setFlagged((current) => ({
      email: current.email || missing.email,
      password: current.password || missing.password,
    }));
    if (missing.email) return emailRef.current.focus();
    if (missing.password) return passwordRef.current.focus();

    setSubmitting(true);
    try {
      const user = await login(normalizeEmail(email), password);
      navigate(postAuthPath(user), { replace: true });
    } catch (error) {
      // The entered email and password stay in the form (also after a 429).
      setFormError(loginErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" id="login-form" noValidate onSubmit={handleSubmit}>
      {/* Form-level error: generic invalid_credentials or network/server failure. */}
      <FormAlert message={formError && t(formError.key, formError.params)} />
      <div className="form-field">
        <label className="form-label" htmlFor="login-email">
          Email
        </label>{" "}
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
          ref={emailRef}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailMissing}
          aria-describedby={emailMissing ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={emailMissing ? t("common.emailRequired") : null} />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="login-password">
          {t("common.password")}
        </label>
        <PasswordField
          id="login-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder={t("auth.passwordPlaceholder")}
          invalid={passwordMissing}
          describedBy={passwordMissing ? "password-error" : undefined}
          inputRef={passwordRef}
        />
        <FieldError id="password-error" message={passwordMissing ? t("common.passwordRequired") : null} />
      </div>
      <SubmitButton
        id="login-submit"
        className="login-submit"
        submitting={submitting}
        label={t("auth.loginSubmit")}
        submittingLabel={t("auth.loginSubmitting")}
      />
    </form>
  );
}
