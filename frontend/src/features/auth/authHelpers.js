import { ApiError } from "../../api/apiClient.js";

// Pure helpers shared by the auth forms.

// Email is trimmed and lowercased before it is sent (API §6.1, §6.2). The password is never touched.
export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

// Where a learner goes right after login or registration: Dashboard, or first-time Language Setup while no support
// language is saved (FD §4.3.2).
export function postAuthPath(user) {
  return user && user.support_language ? "/dashboard" : "/setup/language";
}

// Login failure -> { key, params } for t() (API §6.2).
//   401 invalid_credentials -> generic message (never says whether the email exists)
//   429 rate_limited        -> "too many attempts", with the wait when Retry-After was sent
//   anything else (network, 5xx, unexpected) -> the server-error message
export function loginErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 && error.code === "invalid_credentials") return { key: "auth.invalidCredentials" };
    if (error.isRateLimited) {
      const seconds = error.retryAfterSeconds;
      if (!seconds) return { key: "auth.loginRateLimited" };
      return seconds >= 60
        ? { key: "auth.loginRateLimitedMinutes", params: { n: Math.ceil(seconds / 60) } }
        : { key: "auth.loginRateLimitedSeconds", params: { n: Math.ceil(seconds) } };
    }
  }
  return { key: "auth.loginServerError" };
}

// Field-level validation codes (API §4.4) -> string-table keys, per request field.
const FIELD_CODE_KEYS = {
  email: {
    required: "common.emailRequired",
    invalid_type: "auth.emailInvalid",
    invalid_format: "auth.emailInvalid",
    invalid_value: "auth.emailInvalid",
  },
  password: {
    required: "common.passwordRequired",
    too_short: "auth.passwordTooShort",
    invalid_type: "auth.passwordInvalid",
    invalid_format: "auth.passwordInvalid",
    invalid_value: "auth.passwordInvalid",
  },
};

// 422 validation_error -> { email?, password? } where each value is a string-table key, or { text } with the API's
// fallback message for a code the table does not know (API §4.4). Empty when no known field is named.
export function fieldErrorsFromApi(error) {
  const result = {};
  Object.keys(FIELD_CODE_KEYS).forEach((name) => {
    const code = error.fields[name];
    if (typeof code !== "string") return;
    const key = FIELD_CODE_KEYS[name][code];
    result[name] = key || { text: error.message };
  });
  return result;
}
