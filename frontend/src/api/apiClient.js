// The one place that talks HTTP to Flask (FD §6.2). Feature API modules call it; pages never call fetch directly.
//
// - relative /api/v1 URLs only (the Vite proxy forwards them, FD §6.4);
// - the session cookie travels with same-origin requests; no token is stored (FD §6.7);
// - the success envelope { data } is unwrapped and the error envelope { error } becomes an ApiError (API §4.3, §4.4);
// - wire snake_case field names are kept in both directions (FD §6.2).

const BASE_PATH = "/api/v1";

// Normalized failure of any API call.
//   status   HTTP status, or 0 when no response arrived (network failure)
//   code     machine-readable code from the API error envelope, or "network_error" / "invalid_response" / "http_error"
//   message  safe fallback message from the API (never shown as the only copy; the UI localizes by code)
//   details  structured details from the envelope ({} when absent)
//   fields   details.fields for 422 validation_error: field name -> field-level code (API §4.4)
//   retryAfterSeconds  from the Retry-After header of a 429, when present
export class ApiError extends Error {
  constructor({ status, code, message, details = {}, retryAfterSeconds = null }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.fields = details && typeof details.fields === "object" && details.fields !== null ? details.fields : {};
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isUnauthorized() {
    return this.status === 401 && this.code === "not_authenticated";
  }

  get isRateLimited() {
    return this.status === 429;
  }
}

// AuthContext registers a handler so an expired or missing session (401 not_authenticated) clears the current user
// and lets the route guards send the learner to Login (FD §6.7). invalid_credentials from login is not a session
// failure and does not trigger it.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function buildUrl(path, query) {
  const url = `${BASE_PATH}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([name, value]) => {
    if (value !== undefined && value !== null) params.append(name, String(value));
  });
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

function parseRetryAfter(response) {
  const seconds = Number(response.headers.get("Retry-After"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function request(method, path, { query, body } = {}) {
  const init = { method, credentials: "same-origin", headers: { Accept: "application/json" } };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path, query), init);
  } catch {
    throw new ApiError({ status: 0, code: "network_error", message: "The server could not be reached." });
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const envelope = payload && typeof payload.error === "object" && payload.error !== null ? payload.error : null;
    const error = new ApiError({
      status: response.status,
      code: envelope?.code || "http_error",
      message: envelope?.message || response.statusText || "The request failed.",
      details: envelope?.details ?? {},
      retryAfterSeconds: response.status === 429 ? parseRetryAfter(response) : null,
    });
    if (error.isUnauthorized && unauthorizedHandler) unauthorizedHandler(error);
    throw error;
  }

  if (payload === null || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiError({ status: response.status, code: "invalid_response", message: "The server sent an unexpected response." });
  }
  return payload.data;
}

export const apiClient = {
  get: (path, query) => request("GET", path, { query }),
  post: (path, body) => request("POST", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
};

export default apiClient;
