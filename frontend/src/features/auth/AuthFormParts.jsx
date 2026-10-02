import { useState } from "react";

import { t } from "../../i18n/index.js";

// Small presentational pieces shared by LoginForm, RegisterForm and LanguageSetupPage. They only render markup;
// the forms own the state.

// Form-level error banner. Always rendered (hidden when empty) so the role="alert" region exists before it fills.
export function FormAlert({ message }) {
  return (
    <div className="form-alert" id="form-error" role="alert" hidden={!message}>
      <span className="material-symbols-outlined" aria-hidden="true">
        error
      </span>{" "}
      <span>{message}</span>
    </div>
  );
}

// Message under one field. Rendered hidden when there is no message.
export function FieldError({ id, message }) {
  return (
    <p className="field-error" id={id} hidden={!message}>
      <span className="material-symbols-outlined" aria-hidden="true">
        error
      </span>{" "}
      <span>{message}</span>
    </p>
  );
}

// Password input with the show / hide toggle. The password is passed through untouched (never trimmed).
export function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  invalid,
  describedBy,
  minLength,
  inputRef,
}) {
  const [visible, setVisible] = useState(false);
  const label = t(visible ? "common.hidePassword" : "common.showPassword");
  return (
    <div className="password-control">
      <input
        className="form-input"
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        minLength={minLength}
        ref={inputRef}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />{" "}
      <button
        className="password-toggle"
        type="button"
        aria-controls={id}
        aria-pressed={visible}
        aria-label={label}
        title={label}
        onClick={() => setVisible((current) => !current)}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

// Primary submit button with the pending state (spinner, busy, disabled).
export function SubmitButton({
  id,
  className,
  submitting,
  label,
  submittingLabel,
  icon = "arrow_forward",
  onClick,
  type = "submit",
}) {
  return (
    <button
      className={`button button-primary ${className}`.trim()}
      id={id}
      type={type}
      aria-busy={submitting}
      disabled={submitting}
      onClick={onClick}
    >
      <span>{submitting ? submittingLabel : label}</span>{" "}
      {submitting ? (
        <span className="button-spinner" aria-hidden="true" />
      ) : (
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}
