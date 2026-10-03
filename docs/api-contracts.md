# French Learning Web Application
## API Contract Specification

**Document status:** Baseline v1.0  
**Project type:** Web Application Development final project  
**API style:** REST-style HTTP API with JSON  
**API version:** v1  
**Base path:** `/api/v1`

---

## 1. Purpose

This document defines the API contract for the French Learning Web Application MVP.

It is intended to be used as the shared frontend-backend integration reference by all team members, including AI-assisted coding workflows. API implementation and frontend integration should follow this document unless the team explicitly approves a contract change.

The contract defines:

- HTTP methods and endpoint paths;
- authentication requirements;
- request payloads and parameters;
- success response shapes;
- expected error responses;
- backend business rules relevant to each endpoint;
- the main database data read or modified by each API area.

This document defines how the React frontend and Flask backend communicate. The API is intentionally designed for the local MVP and favors clear, stable contracts over unnecessary infrastructure or abstraction.

---

## 2. Scope

The API covers the learner-facing MVP:

- authentication;
- support-language preference;
- Dashboard data;
- Grammar content;
- Vocabulary content;
- Verb Conjugation content;
- French Alphabet & Accents reference content;
- learner progress state;
- Review Later;
- Continue Learning state;
- normal Practice;
- Mixed Practice;
- Basic Practice History data exposed on the Dashboard;
- current and longest streak data exposed on the Dashboard.

The following are not part of the core MVP API contract:

- Teacher/Admin APIs;
- classroom or assignment APIs;
- social login;
- email verification;
- password recovery;
- AI tutor APIs;
- adaptive/personalized practice APIs;
- full per-question practice-history APIs;
- advanced analytics APIs;
- cloud/deployment administration APIs.

Should Have features such as Review Practice and Verb Reference should receive their own contract additions only if they are selected for implementation. The Learning Activity Calendar has been selected and is specified in §8.2.

---

## 3. System Context

```text
React frontend
    |
    | HTTP + JSON
    v
/api/v1/...
    |
    v
Flask backend
    |
    | SQL
    v
SQLite database
```

The React frontend must not access SQLite directly. Flask owns database access, authentication, validation, scoring, and business-rule enforcement.

During local development, the React application should call relative `/api/v1/...` URLs through the Vite proxy rather than hard-coding a backend origin into application code.

---

## 4. Global API Conventions

### 4.1 Base Path and Versioning

All API endpoints use:

```text
/api/v1
```

`v1` represents the API contract version, not the product release version.

A breaking interface change should not silently change an existing v1 contract. If a genuinely breaking public contract is required later, introduce a new version or explicitly coordinate the migration across frontend and backend.

### 4.2 Content Type

Requests with a JSON body use:

```http
Content-Type: application/json
```

API responses use JSON.

### 4.3 Success Envelope

Successful responses use:

```json
{
  "data": {}
}
```

The value of `data` may be an object, array-containing object, or `null` where explicitly defined.

Do not add a redundant top-level `success: true` field.

### 4.4 Error Envelope

Errors use one consistent shape:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human-readable fallback message.",
    "details": {}
  }
}
```

Rules:

- `code` uses `snake_case` and is intended for frontend logic;
- `message` is a safe fallback message and must not leak implementation details;
- `details` contains optional structured validation information and otherwise returns `{}`.

For `validation_error` (`422`), `details` carries field-level codes so the frontend can show a localized message per field without parsing `message`:

```json
{
  "error": {
    "code": "validation_error",
    "message": "One or more fields are invalid.",
    "details": {
      "fields": {
        "email": "invalid_format",
        "password": "too_short"
      }
    }
  }
}
```

- `details.fields` maps a request field name (`snake_case`) or query-parameter name to one field-level code;
- field-level codes are stable `snake_case` identifiers. The backend returns exactly these:

  | Code | Meaning |
  |---|---|
  | `required` | The field is missing, `null`, or empty/blank after trimming (passwords are not trimmed) |
  | `invalid_type` | The value has the wrong JSON type (for example a number where a string is expected) |
  | `invalid_format` | The value is a string/text but not in the expected shape (an email without exactly one `@`, a non-numeric `year`/`month` query parameter) |
  | `invalid_value` | The value has the right type but is not allowed (a `support_language` other than `vi`/`en`, a `year`/`month` outside its range, an unknown or duplicate Practice `question_id`, an `item_id` that is not an option of the question) |
  | `too_short` | A non-empty string is shorter than the minimum length (a password under 8 characters) |
  | `future_month` | `month` of the Activity Calendar is later than the server's current month (§8.2) |
  | `no_fields` | None of the allowed fields of a partial update was supplied (§13.2) |

- `no_fields` is reported on **every** allowed field of that request, because no single field is at fault: `PATCH /me/learning-units/{slug}/state` with neither `learned` nor `review_later` returns `{"learned": "no_fields", "review_later": "no_fields"}`;
- all invalid fields of one request are reported together when the backend validates them together (for example `email` and `password` on register);
- field names inside a Practice submission use a path form such as `answers`, `answers[0].question_id`, `answers[0].answer`, or `answers[<question_id>].item_id` (the last form is used after the answers were matched to the run's questions);
- a request body that parses as JSON but is not a JSON object (an array, string, number, `null`) returns `422 validation_error` with `details` of `{}` (no `fields` key), because no field name applies;
- `message` remains a safe English fallback; the frontend translates from the field-level code and falls back to `message` for an unknown code;
- field-level codes never include submitted values, passwords, or implementation details.

### 4.5 HTTP Method Semantics

| Method | Use |
|---|---|
| `GET` | Read data only |
| `POST` | Create a resource or perform an explicit action |
| `PATCH` | Partially update an existing resource/state |
| `DELETE` | Reserved for future use when deletion is required |

### 4.6 Status Codes

| Status | Meaning in this API |
|---|---|
| `200 OK` | Successful read/action/update |
| `201 Created` | Resource/run/account created successfully |
| `400 Bad Request` | Malformed JSON or syntactically invalid request |
| `401 Unauthorized` | Authentication required or credentials invalid |
| `403 Forbidden` | Request explicitly not permitted; currently only `csrf_failed` (§4.7) |
| `404 Not Found` | Requested resource/run does not exist |
| `405 Method Not Allowed` | HTTP method is not supported for the route |
| `409 Conflict` | Request conflicts with current resource/application state |
| `422 Unprocessable Entity` | JSON parsed, but fields/values fail validation |
| `429 Too Many Requests` | Login rate limit exceeded (see §4.7) |
| `500 Internal Server Error` | Unexpected backend failure; no internal stack trace/details returned |

### 4.7 Authentication Model

The MVP uses a Flask session cookie, not JWT.

The session stores only the authenticated learner identity conceptually as:

```python
session["user_id"]
```

The frontend must never provide a `user_id` as authority for learner-owned operations.

Learner-owned endpoints use `/me/...`, and Flask resolves the current user from the authenticated session.

Recommended cookie settings for the local MVP:

```text
HttpOnly = true
SameSite = Lax
Secure = false on local HTTP
Secure = true when served through HTTPS
```

The following are required, not optional:

- **Session expiry.** An authenticated session must expire. The lifetime is a backend configuration value, not part of the API contract; the default is a **24-hour idle timeout** (every request refreshes the cookie, so a learner who keeps using the app stays signed in). A request made with an expired or missing session returns `401 not_authenticated`, and the frontend handles it as defined in Frontend Design §6.7.
- **Secure cookie in production.** Any deployment served over HTTPS must set the session cookie `Secure` flag. `Secure = false` is allowed only for local HTTP development and demonstration. The backend forces `Secure` on every request that arrives over HTTPS, and `SESSION_COOKIE_SECURE=1` forces it explicitly (for example behind a TLS-terminating proxy).
- **CSRF protection.** Because the session cookie authenticates state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`), the backend rejects cross-site state-changing requests with `403 csrf_failed` (details `{}`). `SameSite = Lax` and JSON-only request bodies remain as further layers, but are not the mechanism. The mechanism is a **same-origin check** that never changes a request or response shape and requires **nothing extra from the frontend** (no token, no custom header): browsers attach `Sec-Fetch-Site` and `Origin` themselves and page scripts cannot forge them. For a state-changing request, in order:
  1. an `Origin` listed in the backend setting `CSRF_TRUSTED_ORIGINS` (default: none) is allowed;
  2. if `Sec-Fetch-Site` is present, only `same-origin` or `none` is allowed; `same-site` and `cross-site` return `403 csrf_failed`;
  3. otherwise, if `Origin` is present, it must equal the request's own origin (`Origin: null` is rejected);
  4. a request with neither header is a non-browser client (curl, test client, scripts) and is allowed, because it carries no victim's ambient cookie.

  Safe methods (`GET`, `HEAD`, `OPTIONS`) are not checked. The check runs before authentication, so a cross-site request returns `403 csrf_failed` even when no session exists.
- **Login rate limiting.** `POST /api/v1/auth/login` limits repeated **failed** attempts. By default (backend configuration, not contract): at most **5** failed attempts per normalized email and **20** per client IP address within a **300-second** sliding window. When either limit is reached, the next login attempt returns `429 Too Many Requests` with error code `rate_limited`, a safe `message`, `details` of `{}`, and a `Retry-After` header holding the whole seconds (minimum 1) until another attempt is allowed. A blocked attempt is checked before the password is verified, is not counted as a further failure, and is identical for an existing and an unknown email, so the limiter does not reveal whether an email exists. A successful login clears the email counter (not the IP counter). The counters live in server process memory and reset when the Flask process restarts.
  - Known limitation: because the limit is per email, anyone who repeatedly fails logins for a victim's email can temporarily lock that learner out of logging in for up to the window.
  - Known limitation: the per-IP limit uses the client address Flask sees. Behind the Vite dev proxy, every browser request arrives from the proxy's address, so all developers/learners on that dev server share one IP counter.

### 4.8 Identifiers

Stable content navigation uses slugs:

- `learning_units.slug` for Grammar lessons, Vocabulary Study Units, and Conjugation lessons;
- `vocabulary_topics.slug` for Vocabulary Topic pages;
- `reference_pages.slug` for reference content.

Numeric question/item IDs may appear in Practice request/response payloads because they are technical identifiers for the current quiz interaction, not user-facing navigation identifiers.

Internal numeric database IDs must not be displayed to learners.

### 4.9 Localized Content

The learner's persisted `support_language` is either:

```text
vi
en
```

A newly registered learner may temporarily have `support_language = null`. Language-sensitive endpoints apply the read-time `vi` fallback defined in FR-LANG-07 (Requirements & Analysis §3.2); this document only specifies how that fallback surfaces in the API: the fallback is applied per-request and is never written back to `users.support_language`, and the frontend still routes `support_language === null` to first-time language setup rather than treating the fallback as a saved preference.

Language-sensitive endpoints return the selected or fallback support-language value through generic API fields such as:

```text
title
content
meaning
example_translation
prompt
explanation
```

The API should not normally expose both `_vi` and `_en` database columns to the frontend.

Where useful for learning/navigation, the French source title is also returned as:

```text
title_fr
```

If an optional localized title is missing, the backend may fall back to `title_fr`.

### 4.10 Date and Time Values

API timestamps should be machine-readable ISO 8601 strings with an offset when available, for example:

```text
2026-09-20T21:15:00+07:00
```

The frontend is responsible for presentation formatting.

**Server timezone and "today".** The application uses one server clock, in the fixed timezone `Asia/Ho_Chi_Minh` (UTC+07:00, no daylight saving), for every date-sensitive value:

- `completed_at` timestamps (serialized with the `+07:00` offset);
- `practice_sessions.activity_date`;
- streak calculation (`active_today`, current and longest streak);
- the Activity Calendar;
- the Dashboard `today` value.

Streak day boundaries are therefore midnight `Asia/Ho_Chi_Minh`. A user-configurable timezone remains outside the MVP scope. The frontend must not decide "today" from the browser clock for streak, calendar, or `active_today` purposes; it uses the `today` value returned by the Dashboard endpoint (§8.1).

Date-only values (`today.date`, calendar `days`) are ISO 8601 calendar dates, `YYYY-MM-DD`.

`practice_sessions.activity_date` is a backend persistence/grouping value for streak/activity calculations and does not need to be exposed in normal Practice History responses.

### 4.11 Derived Values

Do not duplicate values that can be reliably derived from source data.

Examples:

- Practice accuracy is derived from `correct_count / total_questions`;
- Dashboard Recent Practice Type is derived from the learning unit's `unit_type` or `mixed` practice type;
- Recent Practice display labels are derived from learning content;
- streak values are derived from completed `practice_sessions.activity_date` values.

---

## 5. Endpoint Summary

| Area | Method | Endpoint | Auth |
|---|---|---|---|
| Auth | POST | `/api/v1/auth/register` | Public |
| Auth | POST | `/api/v1/auth/login` | Public |
| Auth | POST | `/api/v1/auth/logout` | No active session required |
| Current User | GET | `/api/v1/me` | Authenticated |
| Preferences | PATCH | `/api/v1/me/preferences` | Authenticated |
| Dashboard | GET | `/api/v1/me/dashboard` | Authenticated |
| Activity Calendar | GET | `/api/v1/me/activity-calendar` | Authenticated |
| Grammar | GET | `/api/v1/grammar` | Authenticated |
| Grammar | GET | `/api/v1/grammar/lessons/{slug}` | Authenticated |
| Vocabulary | GET | `/api/v1/vocabulary` | Authenticated |
| Vocabulary | GET | `/api/v1/vocabulary/topics/{topic_slug}` | Authenticated |
| Vocabulary | GET | `/api/v1/vocabulary/study-units/{slug}` | Authenticated |
| Conjugation | GET | `/api/v1/conjugation` | Authenticated |
| Conjugation | GET | `/api/v1/conjugation/lessons/{slug}` | Authenticated |
| References | GET | `/api/v1/references` | Authenticated |
| References | GET | `/api/v1/references/{slug}` | Authenticated |
| Learner State | POST | `/api/v1/me/learning-units/{slug}/open` | Authenticated |
| Learner State | PATCH | `/api/v1/me/learning-units/{slug}/state` | Authenticated |
| Review Later | GET | `/api/v1/me/review-later` | Authenticated |
| Normal Practice | POST | `/api/v1/learning-units/{slug}/practice/start` | Authenticated |
| Mixed Practice | POST | `/api/v1/mixed-practice/start` | Authenticated |
| Practice Submit | POST | `/api/v1/practice/runs/{practice_run_id}/submit` | Authenticated |

---

# 6. Authentication and Current User

## 6.1 Register

### Contract

```http
POST /api/v1/auth/register
Content-Type: application/json
```

### Request

```json
{
  "email": "learner@example.com",
  "password": "example-password"
}
```

### Backend Rules

- trim leading/trailing whitespace from the email and normalize it to lowercase before validation, lookup, and insert;
- reject an empty email or a value that contains whitespace, does not contain exactly one `@`, or has an empty local or domain part;
- reject a duplicate normalized email;
- require a password of at least 8 characters; no additional password-complexity rule is required for the MVP;
- hash the password before storage;
- never store the plain-text password;
- create the user with `support_language = null`;
- automatically create the authenticated Flask session after successful registration.

### Success — `201 Created`

```json
{
  "data": {
    "user": {
      "email": "learner@example.com",
      "support_language": null
    }
  }
}
```

### Main Errors

| Status | Code | Condition |
|---|---|---|
| `400` | `invalid_json` | Malformed JSON |
| `422` | `validation_error` | Required fields invalid/missing; `details.fields` carries field-level codes (§4.4), for example `email: invalid_format`, `password: too_short` |
| `409` | `email_already_registered` | Normalized email already exists |
| `500` | `internal_error` | Unexpected failure |

### Data Used/Affected

- `users`
- Flask session cookie

---

## 6.2 Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

### Request

```json
{
  "email": "learner@example.com",
  "password": "example-password"
}
```

### Success — `200 OK`

```json
{
  "data": {
    "user": {
      "email": "learner@example.com",
      "support_language": "vi"
    }
  }
}
```

### Business Rules

- trim leading/trailing whitespace from the email and normalize it to lowercase before lookup;
- require non-empty email and password input;
- verify the stored password hash;
- use a generic authentication error so the API does not reveal whether a specific email exists;
- create/refresh the authenticated Flask session after valid credentials;
- apply the login rate limit defined in §4.7;
- missing, `null`, or blank fields return `422 validation_error` with `details.fields` code `required`, and a non-string value returns `invalid_type` (§4.4); login performs no email-format check, so a badly formatted email fails as `401 invalid_credentials`, not as a validation error.

### Rate Limited — `429 Too Many Requests`

Response header: `Retry-After: <seconds>` (§4.7).

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Too many login attempts. Please try again later.",
    "details": {}
  }
}
```

### Invalid Credentials — `401 Unauthorized`

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid email or password.",
    "details": {}
  }
}
```

### Data Used/Affected

- `users`
- Flask session cookie

---

## 6.3 Logout

```http
POST /api/v1/auth/logout
```

### Success — `200 OK`

```json
{
  "data": {
    "logged_out": true
  }
}
```

### Business Rules

- logout does not require an active authenticated session;
- clear the Flask session if one exists;
- logout is idempotent from the client's perspective;
- repeated logout requests return the same successful result even when no authenticated session remains.

### Data Used/Affected

- Flask session cookie only

---

## 6.4 Get Current User

```http
GET /api/v1/me
```

### Success — `200 OK`

```json
{
  "data": {
    "user": {
      "email": "learner@example.com",
      "support_language": "vi"
    }
  }
}
```

A newly registered learner may receive:

```json
{
  "data": {
    "user": {
      "email": "learner@example.com",
      "support_language": null
    }
  }
}
```

The frontend uses `support_language === null` to route the learner to first-time language setup.

### Main Errors

```text
401 not_authenticated
500 internal_error
```

---

# 7. Language Preference

## 7.1 Update Support Language

```http
PATCH /api/v1/me/preferences
Content-Type: application/json
```

### Request

```json
{
  "support_language": "vi"
}
```

or:

```json
{
  "support_language": "en"
}
```

### Success — `200 OK`

```json
{
  "data": {
    "support_language": "vi"
  }
}
```

### Business Rules

- only `vi` and `en` are accepted;
- changing language must not reset progress, Practice History, streak, Review Later, or Continue Learning state;
- this endpoint changes only the learner's preference;
- an invalid or missing `support_language` returns `422 validation_error` with `details.fields.support_language` set to `invalid_value` or `required` (§4.4).

### Main Errors

```text
400 invalid_json
401 not_authenticated
422 validation_error
500 internal_error
```

### Data Used/Affected

- `users.support_language`

---

# 8. Dashboard

## 8.1 Get Dashboard Data

```http
GET /api/v1/me/dashboard
```

This is an aggregate read endpoint. It returns the data required by the authenticated Dashboard without exposing database-table structure to React.

### Success — `200 OK`

```json
{
  "data": {
    "today": {
      "date": "2026-09-20",
      "timezone": "Asia/Ho_Chi_Minh"
    },
    "streak": {
      "current": 3,
      "longest": 8,
      "active_today": true
    },
    "progress": {
      "grammar": {
        "learned": 4,
        "total": 20
      },
      "vocabulary": {
        "learned": 6,
        "total": 24
      },
      "conjugation": {
        "learned": 3,
        "total": 12
      }
    },
    "continue_learning": {
      "slug": "articles-definis",
      "unit_type": "grammar",
      "title_fr": "Les articles définis",
      "title": "Mạo từ xác định",
      "parent": {
        "kind": "chapter",
        "title_fr": "Les déterminants",
        "title": "Từ hạn định"
      },
      "position": {
        "index": 4,
        "total": 6
      }
    },
    "review_later_count": 3,
    "mixed_practice": {
      "available": true
    },
    "recent_practice": [
      {
        "practice_type": "normal",
        "completed_at": "2026-09-20T21:15:00+07:00",
        "correct_count": 8,
        "total_questions": 10,
        "learning_unit": {
          "slug": "articles-definis",
          "unit_type": "grammar",
          "title_fr": "Les articles définis"
        }
      },
      {
        "practice_type": "mixed",
        "completed_at": "2026-09-19T20:40:00+07:00",
        "correct_count": 7,
        "total_questions": 10,
        "learning_unit": null
      }
    ]
  }
}
```

### New Learner State

```json
{
  "data": {
    "today": {
      "date": "2026-09-20",
      "timezone": "Asia/Ho_Chi_Minh"
    },
    "streak": {
      "current": 0,
      "longest": 0,
      "active_today": false
    },
    "progress": {
      "grammar": { "learned": 0, "total": 20 },
      "vocabulary": { "learned": 0, "total": 24 },
      "conjugation": { "learned": 0, "total": 12 }
    },
    "continue_learning": null,
    "review_later_count": 0,
    "mixed_practice": {
      "available": false
    },
    "recent_practice": []
  }
}
```

### Business Rules

**Today**

- `today.date` is the server's current calendar date (`YYYY-MM-DD`) in `today.timezone`;
- `today.timezone` is always `Asia/Ho_Chi_Minh` in the MVP (§4.10);
- `today` uses the same clock as `completed_at`, `activity_date`, and the streak calculation, so `streak.active_today` and `today.date` can never disagree;
- the frontend uses `today.date` for the Activity Calendar's "current month" and "not yet" days instead of the browser clock.

**Progress**

- learned count comes from `user_learning_state.learned_at IS NOT NULL`;
- total count comes from available `learning_units` by module.

**Continue Learning**

Conceptually:

```text
learned_at IS NULL
AND last_opened_at IS NOT NULL
ORDER BY last_opened_at DESC
LIMIT 1
```

If no unfinished opened unit exists, return `null`.

Known limitation: `last_opened_at` is stored with **one-second resolution** (ISO 8601 without fractional seconds). If a learner opens two units within the same second, they tie and the ordering is not defined; either unit may be returned as `continue_learning`. This is accepted for the MVP because a human cannot meaningfully open two units in one second, and no tie-breaker field exists in the schema.

When present, the object carries the unit's place in the curriculum so the Dashboard can render "module • parent section" and "Lesson x/y":

- `parent.kind` is the grouping level of the unit's module: `chapter` for Grammar, `subtopic` for Vocabulary, `tense` for Conjugation;
- `parent.title_fr` and `parent.title` are the French and localized titles of that parent (same fallback rule as §4.9);
- `position.index` is the unit's 1-based position among the units of that same parent, ordered by `sort_order`;
- `position.total` is the number of units in that parent;
- `parent` and `position` are never `null` when `continue_learning` is not `null`.

**First visit**

There is no first-visit field and no new column. The frontend derives a first visit from Dashboard data: the sum of `progress.*.learned` is `0` and `streak.longest` is `0`.

**Mixed Practice Availability**

- `true` when the learner has at least one learning unit explicitly Marked as Learned;
- otherwise `false`.

**Recent Practice**

- return a small recent subset, such as 5-10 rows;
- sort by `completed_at DESC`;
- normal practice references its learning unit;
- mixed practice returns `learning_unit: null`;
- frontend derives percentage from stored counts;
- frontend derives the user-facing Type from `practice_type` and `unit_type`.

**Streak**

- derive from distinct `practice_sessions.activity_date` values;
- only completed normal or Mixed Practice sessions count;
- `streak.active_today` is `true` only when at least one completed Practice or Mixed Practice session has `activity_date` equal to `today.date`;
- if active today, current streak ends today;
- if not active today but active yesterday, retain the consecutive run ending yesterday;
- if active on neither today nor yesterday, current streak is `0`;
- longest streak is the maximum historical consecutive run.

### Data Used

- `learning_units`
- `user_learning_state`
- `practice_sessions`
- module-specific content tables for labels when required

---

## 8.2 Get Activity Calendar

```http
GET /api/v1/me/activity-calendar?year=2026&month=9
```

Returns the Learning Activity Calendar data for one calendar month. It is separate from the Dashboard aggregate so that switching months does not reload the rest of the Dashboard.

### Query Parameters

| Parameter | Type | Rules |
|---|---|---|
| `year` | integer | required; whole number from `1000` to `9999` |
| `month` | integer | required; whole number from `1` to `12` |

Validation (`422 validation_error`, all failing parameters reported together in `details.fields`):

| Case | `details.fields.<name>` |
|---|---|
| parameter missing or blank | `required` |
| not a whole number (`abc`, `9.5`, `2026-09`) | `invalid_format` |
| whole number outside the range above (`month=13`, `year=999`) | `invalid_value` |
| `month` later than the server's current month | `future_month` (see Business Rules) |

### Success — `200 OK`

```json
{
  "data": {
    "year": 2026,
    "month": 9,
    "days": [
      "2026-09-02",
      "2026-09-19",
      "2026-09-20"
    ]
  }
}
```

### Business Rules

- `days` contains the **unique active dates** of the requested month, as `YYYY-MM-DD` strings in ascending order;
- a date is active when at least one completed normal or Mixed Practice session of the authenticated learner has that `activity_date` (the same source and definition as the streak, §8.1);
- the response carries no per-day session count and no intensity value; each date appears once however many sessions were completed that day;
- a month with no activity returns `"days": []`;
- the months are calendar months in `Asia/Ho_Chi_Minh` (§4.10);
- a month later than the current month (compared as year and month against the server's `today`) is rejected with `422 validation_error` and `details.fields.month` set to `future_month`; the check runs only after `year` and `month` are valid, and past months, including months before the learner's first activity, are allowed;
- the endpoint is read-only and never writes progress, streak, or activity state;
- days that are not in `days` are "no practice" or "not yet" days; the frontend decides which using `today.date` from §8.1.

### Main Errors

```text
401 not_authenticated
422 validation_error
500 internal_error
```

### Data Used

- `practice_sessions`

---

# 9. Grammar Content

## 9.1 Browse Grammar

```http
GET /api/v1/grammar
```

### Success — `200 OK`

```json
{
  "data": {
    "parts": [
      {
        "title_fr": "Le groupe du nom",
        "title": "Cụm danh từ",
        "chapters": [
          {
            "title_fr": "Les déterminants",
            "title": "Từ hạn định",
            "lessons": [
              {
                "slug": "articles-definis",
                "title_fr": "Les articles définis",
                "title": "Mạo từ xác định",
                "learned": true,
                "review_later": false
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Business Rules

- return metadata only; do not include full Markdown lesson content;
- backend orders Parts, Chapters, and Lessons by `sort_order`;
- API does not need to expose `sort_order` if arrays are already correctly ordered;
- expanding/collapsing Chapters is frontend-only UI behavior and does not require another API call.

### Data Used

- `grammar_parts`
- `grammar_chapters`
- `grammar_lessons`
- `learning_units`
- `user_learning_state`

---

## 9.2 Get Grammar Lesson

```http
GET /api/v1/grammar/lessons/{slug}
```

### Success — `200 OK`

```json
{
  "data": {
    "slug": "articles-definis",
    "title_fr": "Les articles définis",
    "title": "Mạo từ xác định",
    "context": {
      "part": {
        "title_fr": "Le groupe du nom",
        "title": "Cụm danh từ"
      },
      "chapter": {
        "title_fr": "Les déterminants",
        "title": "Từ hạn định"
      }
    },
    "content": "## Quy tắc\n\n...",
    "state": {
      "learned": false,
      "review_later": false
    }
  }
}
```

### Business Rules

- `content` is localized Markdown selected by the backend;
- a slug that exists for another module is still `404` for this Grammar resource;
- this GET does not update `last_opened_at`; the frontend calls the shared learner-state `open` action after the learning unit is opened successfully.

---

# 10. Vocabulary Content

## 10.1 Browse Vocabulary Categories and Topics

```http
GET /api/v1/vocabulary
```

### Success — `200 OK`

```json
{
  "data": {
    "progress": {
      "learned": 6,
      "total": 24
    },
    "categories": [
      {
        "title_fr": "La nourriture et la restauration",
        "title": "Ẩm thực và nhà hàng",
        "topics": [
          {
            "slug": "alimentation-1",
            "title_fr": "L'alimentation (1)",
            "title": "Thực phẩm (1)"
          }
        ]
      }
    ]
  }
}
```

This endpoint intentionally stops at Topic metadata. A Topic has its own navigable page so the first Vocabulary screen does not load the complete hierarchy and all Study Units at once.

### Business Rules

- `progress.learned` is the number of Vocabulary Study Units the learner has Marked as Learned (`user_learning_state.learned_at IS NOT NULL`);
- `progress.total` is the number of available Vocabulary Study Units;
- progress counts Study Units, never individual words; it equals `progress.vocabulary` in the Dashboard (§8.1);
- the browse payload carries no Study Unit list, so the overall Vocabulary progress cannot be derived from it by the frontend; the backend supplies it;
- the percentage is derived by the frontend.

### Data Used

- `vocabulary_categories`
- `vocabulary_topics`
- `vocabulary_study_units`
- `learning_units`
- `user_learning_state`

---

## 10.2 Get Vocabulary Topic

```http
GET /api/v1/vocabulary/topics/{topic_slug}
```

Example:

```http
GET /api/v1/vocabulary/topics/alimentation-1
```

### Success — `200 OK`

```json
{
  "data": {
    "slug": "alimentation-1",
    "title_fr": "L'alimentation (1)",
    "title": "Thực phẩm (1)",
    "context": {
      "category": {
        "title_fr": "La nourriture et la restauration",
        "title": "Ẩm thực và nhà hàng"
      }
    },
    "subtopics": [
      {
        "title_fr": "Le pain et les viennoiseries",
        "title": "Bánh mì và bánh ngọt",
        "study_units": [
          {
            "slug": "pain-viennoiseries-1",
            "title_fr": "Le pain et les viennoiseries — Partie 1",
            "title": "Bánh mì và bánh ngọt — Phần 1",
            "learned": false,
            "review_later": false
          }
        ]
      }
    ]
  }
}
```

### Business Rules

- Topic navigation uses the stable `vocabulary_topics.slug`, not a numeric database ID;
- Subtopics are grouping data and do not require their own page/API in the MVP;
- Study Units are the Vocabulary progress units.

---

## 10.3 Get Vocabulary Study Unit

```http
GET /api/v1/vocabulary/study-units/{slug}
```

### Success — `200 OK`

```json
{
  "data": {
    "slug": "pain-viennoiseries-1",
    "title_fr": "Le pain et les viennoiseries — Partie 1",
    "title": "Bánh mì và bánh ngọt — Phần 1",
    "context": {
      "category": {
        "title_fr": "La nourriture et la restauration",
        "title": "Ẩm thực và nhà hàng"
      },
      "topic": {
        "slug": "alimentation-1",
        "title_fr": "L'alimentation (1)",
        "title": "Thực phẩm (1)"
      },
      "subtopic": {
        "title_fr": "Le pain et les viennoiseries",
        "title": "Bánh mì và bánh ngọt"
      }
    },
    "entries": [
      {
        "french": "le pain",
        "meaning": "bánh mì",
        "ipa": "/lə pɛ̃/",
        "example_fr": "J'achète du pain.",
        "example_translation": "Tôi mua bánh mì."
      },
      {
        "french": "la baguette",
        "meaning": "bánh mì baguette",
        "ipa": null,
        "example_fr": null,
        "example_translation": null
      }
    ],
    "state": {
      "learned": false,
      "review_later": false
    }
  }
}
```

### Business Rules

- `meaning` is selected from `meaning_vi` or `meaning_en` according to the learner's support language;
- `example_translation` is selected from `example_vi` or `example_en`;
- `ipa` is optional and returns `null` when unavailable;
- only standard IPA belongs in the `ipa` field;
- this GET does not itself update `last_opened_at`.

### Data Used

- `vocabulary_categories`
- `vocabulary_topics`
- `vocabulary_subtopics`
- `vocabulary_study_units`
- `vocabulary_words`
- `learning_units`
- `user_learning_state`

---

# 11. Verb Conjugation Content

## 11.1 Browse Conjugation

```http
GET /api/v1/conjugation
```

### Success — `200 OK`

```json
{
  "data": {
    "tenses": [
      {
        "title_fr": "Présent",
        "title": "Thì hiện tại",
        "lessons": [
          {
            "slug": "present-regular-er",
            "title_fr": "Les verbes réguliers en -ER",
            "title": "Động từ có quy tắc đuôi -ER",
            "learned": true,
            "review_later": false
          },
          {
            "slug": "present-regular-ir",
            "title_fr": "Les verbes réguliers en -IR",
            "title": "Động từ có quy tắc đuôi -IR",
            "learned": false,
            "review_later": true
          }
        ]
      }
    ]
  }
}
```

### Business Rules

- hierarchy is Tense -> Rule/Pattern Lesson;
- Tense is grouping metadata, not a progress unit;
- opening/closing a Tense list is frontend-only UI behavior;
- Rule/Pattern Lesson is the progress/practice unit.

---

## 11.2 Get Conjugation Lesson

```http
GET /api/v1/conjugation/lessons/{slug}
```

### Success — `200 OK`

```json
{
  "data": {
    "slug": "present-regular-er",
    "title_fr": "Les verbes réguliers en -ER",
    "title": "Động từ có quy tắc đuôi -ER",
    "context": {
      "tense": {
        "title_fr": "Présent",
        "title": "Thì hiện tại"
      }
    },
    "content": "## Formation\n\n...",
    "state": {
      "learned": true,
      "review_later": false
    }
  }
}
```

`content` is localized Markdown containing the rule/pattern explanation, conjugation pattern/table, examples, and supporting notes.

### Data Used

- `conjugation_tenses`
- `conjugation_lessons`
- `learning_units`
- `user_learning_state`

---

# 12. Reference Content

## 12.1 List Reference Pages

```http
GET /api/v1/references
```

Returns the index of available reference pages so the frontend does not hard-code reference slugs or titles.

### Success — `200 OK`

```json
{
  "data": {
    "references": [
      {
        "slug": "french-alphabet-accents",
        "title_fr": "Alphabet français et accents",
        "title": "Bảng chữ cái và dấu trong tiếng Pháp"
      }
    ]
  }
}
```

### Business Rules

- return metadata only; do not include Markdown `content`;
- order by `reference_pages.sort_order`;
- `title` is localized using the rules in §4.9;
- reference pages are not learning units, so the response contains no learner `state` and the call changes no learner state, progress, or streak;
- the MVP seeds one entry, French Alphabet & Accents; the array may grow without a contract change.

### Data Used

- `reference_pages`

---

## 12.2 Get Reference Page

```http
GET /api/v1/references/{slug}
```

French Alphabet & Accents:

```http
GET /api/v1/references/french-alphabet-accents
```

### Success — `200 OK`

```json
{
  "data": {
    "slug": "french-alphabet-accents",
    "title_fr": "Alphabet français et accents",
    "title": "Bảng chữ cái và dấu trong tiếng Pháp",
    "content": "## Alphabet français\n\n..."
  }
}
```

### Business Rules

Reference pages are not learning units.

Opening this endpoint must not create or change:

- Mark as Learned state;
- Review Later state;
- Continue Learning state;
- Practice availability/history;
- progress;
- streak activity.

The response therefore contains no learner `state` object.

### Data Used

- `reference_pages`

---

# 13. Learner State

## 13.1 Record Learning Unit Open

```http
POST /api/v1/me/learning-units/{slug}/open
```

### Request

No body required.

### Success — `200 OK`

```json
{
  "data": {
    "slug": "articles-definis",
    "opened": true
  }
}
```

### Business Rules

- find the learning unit by stable slug;
- create `user_learning_state` if it does not yet exist;
- otherwise update the existing learner/unit row;
- set `last_opened_at` to the current backend time;
- do not automatically mark the unit as learned;
- do not change Review Later;
- do not create Practice History or streak activity.

### Data Used/Affected

- `learning_units`
- `user_learning_state`

---

## 13.2 Update Learning Unit State

```http
PATCH /api/v1/me/learning-units/{slug}/state
Content-Type: application/json
```

### Mark as Learned

```json
{
  "learned": true
}
```

### Unmark

```json
{
  "learned": false
}
```

### Add Review Later

```json
{
  "review_later": true
}
```

### Update Both

```json
{
  "learned": true,
  "review_later": true
}
```

### Success — `200 OK`

```json
{
  "data": {
    "slug": "articles-definis",
    "state": {
      "learned": true,
      "review_later": true
    }
  }
}
```

### PATCH Semantics

Only supplied fields change.

Example:

```json
{
  "review_later": true
}
```

must not modify the current learned state.

### Backend Rules

- allowed fields are `learned` and `review_later` only;
- values must be booleans;
- at least one supported field must be supplied;
- `learned: true` sets `learned_at` if the unit is not already learned;
- repeating `learned: true` must not create another progress unit or duplicate row;
- `learned: false` clears `learned_at`;
- Review Later is independent from learned state;
- Mark/Unmark and Review Later changes never create streak activity.

### Main Errors

```text
400 invalid_json
401 not_authenticated
404 learning_unit_not_found
422 validation_error
500 internal_error
```

---

## 13.3 Get Review Later List

```http
GET /api/v1/me/review-later
```

### Success — `200 OK`

```json
{
  "data": {
    "items": [
      {
        "slug": "articles-definis",
        "unit_type": "grammar",
        "title_fr": "Les articles définis",
        "title": "Mạo từ xác định",
        "learned": true
      },
      {
        "slug": "pain-viennoiseries-1",
        "unit_type": "vocabulary",
        "title_fr": "Le pain et les viennoiseries — Partie 1",
        "title": "Bánh mì và bánh ngọt — Phần 1",
        "learned": false
      }
    ]
  }
}
```

Empty state:

```json
{
  "data": {
    "items": []
  }
}
```

`review_later` is not repeated on each item because membership in this endpoint already implies `review_later = true`.

### Business Rules

- return only the authenticated learner's units with `review_later = true`, regardless of learned state;
- order items by **curriculum order**, not by the time they were saved: first by module in the order `grammar`, `vocabulary`, `conjugation`, then by the unit's position in that module's curriculum (parent `sort_order` chain, then the unit's own `sort_order`, the same order as the corresponding browse endpoint);
- the order is deterministic and does not change when a unit is opened, marked as learned, or re-saved;
- the frontend may group the already-ordered list by `unit_type` for display without re-sorting.

---

# 14. Practice Question Representation

The MVP supports:

```text
mcq
fill_blank
ordering
```

The Start endpoints expose only learner-facing question data. They must not expose correct-answer metadata before final submission.

## 14.1 MCQ

```json
{
  "question_id": 101,
  "question_number": 1,
  "question_type": "mcq",
  "prompt": "Chọn mạo từ phù hợp.",
  "options": [
    { "item_id": 1001, "text": "le" },
    { "item_id": 1002, "text": "la" },
    { "item_id": 1003, "text": "les" }
  ]
}
```

Do not expose `is_correct`.

## 14.2 Fill in the Blank

```json
{
  "question_id": 102,
  "question_number": 2,
  "question_type": "fill_blank",
  "prompt": "Điền từ thích hợp: Je ___ étudiant."
}
```

Do not expose accepted answers before submission.

## 14.3 Sentence Ordering

```json
{
  "question_id": 103,
  "question_number": 3,
  "question_type": "ordering",
  "prompt": "Sắp xếp thành câu đúng.",
  "items": [
    { "item_id": 1032, "text": "français" },
    { "item_id": 1031, "text": "Je" },
    { "item_id": 1033, "text": "parle" }
  ]
}
```

The backend shall shuffle the learner-facing item order before returning the question. If a shuffle produces the canonical correct sequence, the backend must change the order so the initial learner-facing arrangement is not already correct. Do not expose `correct_position`.

### Localized `prompt` and the Ordering source sentence (known limitation)

Every question exposes one localized `prompt` selected by the backend for the learner's support language (§4.9). Practice keeps this single `prompt` field; no second source-sentence field is added.

For `ordering` questions the `prompt` is an instruction (for example "Sắp xếp thành câu đúng."). The contract has no field that carries a native-language source sentence to translate, so an Ordering question cannot show one. This is a **known limitation for the demo**: the learner orders the French `items` from the instruction and the `items` themselves. Adding a source sentence would be a contract and schema change and requires a separate approved change.

---

# 15. Normal Practice

## 15.1 Start Normal Practice

```http
POST /api/v1/learning-units/{slug}/practice/start
```

### Request

No body required.

### Success — `201 Created`

```json
{
  "data": {
    "practice_run_id": "8fd41b92-87cd-4c38-a876-8ae752d21e08",
    "practice_type": "normal",
    "learning_unit": {
      "slug": "articles-definis",
      "unit_type": "grammar",
      "title_fr": "Les articles définis",
      "title": "Mạo từ xác định"
    },
    "total_questions": 3,
    "questions": [
      {
        "question_id": 101,
        "question_number": 1,
        "question_type": "mcq",
        "prompt": "Chọn mạo từ phù hợp.",
        "options": [
          { "item_id": 1001, "text": "le" },
          { "item_id": 1002, "text": "la" },
          { "item_id": 1003, "text": "les" }
        ]
      },
      {
        "question_id": 102,
        "question_number": 2,
        "question_type": "fill_blank",
        "prompt": "Điền từ thích hợp: Je ___ étudiant."
      },
      {
        "question_id": 103,
        "question_number": 3,
        "question_type": "ordering",
        "prompt": "Sắp xếp thành câu đúng.",
        "items": [
          { "item_id": 1032, "text": "français" },
          { "item_id": 1031, "text": "Je" },
          { "item_id": 1033, "text": "parle" }
        ]
      }
    ]
  }
}
```

### Business Rules

- normal Practice uses questions linked to the selected learning unit;
- for the MVP, return the learning unit's seeded questions in `questions.sort_order`;
- learner answers are held in frontend state and may be changed freely before final submission;
- starting Practice does not create a `practice_sessions` history row;
- no correct-answer information is returned at Start.

### Main Errors

```text
401 not_authenticated
404 learning_unit_not_found
409 practice_unavailable
500 internal_error
```

`practice_unavailable` is used when the learning unit exists but has no usable seeded questions.

---

# 16. Mixed Practice

## 16.1 Start Mixed Practice

```http
POST /api/v1/mixed-practice/start
Content-Type: application/json
```

The core MVP may send no body or an empty body object:

```json
{}
```

### Eligibility Rule

Mixed Practice uses questions only from learning units that the current learner has explicitly **Marked as Learned**.

Database interpretation:

```text
user_learning_state.learned_at IS NOT NULL
```

### Selection Rules

1. find the current learner's Marked as Learned learning units;
2. find questions linked to those units;
3. apply optional Mixed Practice filters if enabled;
4. use a target size of **10 questions** for the MVP;
5. when at least 10 eligible distinct questions exist, select 10 randomly without replacement;
6. when fewer than 10 eligible distinct questions exist, use all available eligible distinct questions;
7. do not enforce a fixed quota by module or question type;
8. never repeat questions merely to reach 10;
9. never widen the pool to unlearned or otherwise filtered-out content.

### Success — `201 Created`

```json
{
  "data": {
    "practice_run_id": "4b04246e-b237-47d3-9ad4-9b314be06c58",
    "practice_type": "mixed",
    "total_questions": 10,
    "questions": [
      {
        "question_id": 101,
        "question_number": 1,
        "question_type": "mcq",
        "prompt": "Chọn mạo từ phù hợp.",
        "options": [
          { "item_id": 1001, "text": "le" },
          { "item_id": 1002, "text": "la" }
        ]
      },
      {
        "question_id": 204,
        "question_number": 2,
        "question_type": "fill_blank",
        "prompt": "Điền từ tiếng Pháp phù hợp."
      }
    ]
  }
}
```

The in-progress question objects do not need to expose their source learning unit. Source information is still known to the backend and is used to generate `content_covered` after submission.

### Unavailable — `409 Conflict`

```json
{
  "error": {
    "code": "mixed_practice_unavailable",
    "message": "Mark some learning content as learned before starting Mixed Practice.",
    "details": {}
  }
}
```

---

## 16.2 Optional Mixed Practice Filters — Should Have

> **Implementation status: not implemented (deferred).** Filters are a Should Have feature and the backend does not implement them. Any request body for `POST /api/v1/mixed-practice/start` that contains a `filters` key, whatever its value, returns `422 invalid_mixed_filters` (message `Mixed Practice filters are not supported.`, `details` `{}`) and starts no run. The rules below describe the intended future behavior only; a body without `filters`, or an empty body, starts Mixed Practice normally. Implementing filters requires no contract change beyond removing this note.

The endpoint remains the same:

```http
POST /api/v1/mixed-practice/start
Content-Type: application/json
```

### Request

```json
{
  "filters": {
    "modules": [
      "grammar",
      "vocabulary"
    ],
    "question_types": [
      "mcq",
      "fill_blank"
    ]
  }
}
```

### Allowed Values

`modules`:

```text
grammar
vocabulary
conjugation
```

`question_types`:

```text
mcq
fill_blank
ordering
```

### Rules

- filters only narrow the already-learned eligible pool;
- at least one module and one question type must remain selected;
- selecting individual learning units is outside MVP scope;
- if no eligible questions match, return `409 mixed_practice_unavailable`;
- if fewer than the target number match, use all available distinct eligible questions.

Invalid empty or unsupported filter values return `422 invalid_mixed_filters`.

---

# 17. Shared Practice Submission

## 17.1 Submit Practice

Normal and Mixed Practice use the same submission endpoint:

```http
POST /api/v1/practice/runs/{practice_run_id}/submit
Content-Type: application/json
```

The learner may change answers freely before this request. The answers present in this final request determine the session result.

### Request

```json
{
  "answers": [
    {
      "question_id": 101,
      "answer": {
        "item_id": 1001
      }
    },
    {
      "question_id": 102,
      "answer": {
        "text": "suis"
      }
    },
    {
      "question_id": 103,
      "answer": {
        "item_ids": [1031, 1033, 1032]
      }
    }
  ]
}
```

### Answer Shapes

| Question Type | Final Answer Shape |
|---|---|
| MCQ | `{ "item_id": <id> }` |
| Fill Blank | `{ "text": "..." }` |
| Ordering | `{ "item_ids": [<id>, ...] }` |

### Backend Validation

Before scoring, verify:

- the practice run exists;
- it belongs to the authenticated learner;
- it has not already been submitted;
- submitted question IDs exactly match the run's question set;
- every question has an answer;
- each answer shape matches the question type;
- submitted item IDs belong to the relevant question;
- for an Ordering answer, `item_ids` contains exactly all items for that question, with the same item count as the question, no missing items, and no duplicate item IDs.

The backend must calculate the score. The client must never submit trusted `correct_count`, `accuracy`, completion date, or streak data.

### Fill Blank Matching

For the MVP:

- trim leading/trailing whitespace;
- ignore letter case;
- preserve significance of French spelling;
- preserve accents;
- preserve apostrophes;
- accept additional variants only when explicitly stored/configured as accepted answers.

### Sentence Ordering Matching

For the MVP:

- the submitted `item_ids` array must be a complete permutation of the question's ordering items;
- each item ID must appear exactly once;
- the answer is correct only when the submitted sequence matches the sequence obtained by sorting the question items by ascending `correct_position`.

---

## 17.2 Normal Practice Result

### Success — `200 OK`

```json
{
  "data": {
    "practice_run_id": "8fd41b92-87cd-4c38-a876-8ae752d21e08",
    "practice_type": "normal",
    "learning_unit": {
      "slug": "articles-definis",
      "unit_type": "grammar",
      "title_fr": "Les articles définis",
      "title": "Mạo từ xác định"
    },
    "correct_count": 2,
    "total_questions": 3,
    "accuracy": 66.7,
    "results": [
      {
        "question_id": 101,
        "question_number": 1,
        "question_type": "mcq",
        "prompt": "Chọn mạo từ phù hợp.",
        "correct": true,
        "submitted_answer": {
          "item_id": 1001,
          "text": "le"
        },
        "correct_answer": {
          "item_id": 1001,
          "text": "le"
        },
        "explanation": "Danh từ này là giống đực số ít nên dùng le."
      },
      {
        "question_id": 102,
        "question_number": 2,
        "question_type": "fill_blank",
        "prompt": "Điền từ thích hợp: Je ___ étudiant.",
        "correct": false,
        "submitted_answer": {
          "text": "es"
        },
        "correct_answer": {
          "accepted_answers": ["suis"]
        },
        "explanation": "Với je, động từ être ở présent là suis."
      },
      {
        "question_id": 103,
        "question_number": 3,
        "question_type": "ordering",
        "prompt": "Sắp xếp thành câu đúng.",
        "correct": true,
        "submitted_answer": {
          "items": [
            { "item_id": 1031, "text": "Je" },
            { "item_id": 1033, "text": "parle" },
            { "item_id": 1032, "text": "français" }
          ]
        },
        "correct_answer": {
          "items": [
            { "item_id": 1031, "text": "Je" },
            { "item_id": 1033, "text": "parle" },
            { "item_id": 1032, "text": "français" }
          ]
        },
        "explanation": null
      }
    ]
  }
}
```

`results` is current Result-state response data. It is not required to be persisted as per-question history.

The result echoes `practice_run_id` (the run that was just submitted) in both the normal and the Mixed result. It is informational: it is not a persisted `practice_sessions.id` (§18).

---

## 17.3 Mixed Practice Result

### Success — `200 OK`

```json
{
  "data": {
    "practice_run_id": "8fd41b92-87cd-4c38-a876-8ae752d21e08",
    "practice_type": "mixed",
    "correct_count": 7,
    "total_questions": 10,
    "accuracy": 70,
    "content_covered": [
      {
        "slug": "articles-definis",
        "unit_type": "grammar",
        "title_fr": "Les articles définis",
        "title": "Mạo từ xác định"
      },
      {
        "slug": "pain-viennoiseries-1",
        "unit_type": "vocabulary",
        "title_fr": "Le pain et les viennoiseries — Partie 1",
        "title": "Bánh mì và bánh ngọt — Phần 1"
      },
      {
        "slug": "present-regular-er",
        "unit_type": "conjugation",
        "title_fr": "Les verbes réguliers en -ER",
        "title": "Động từ có quy tắc đuôi -ER"
      }
    ],
    "results": [
      {
        "question_id": 101,
        "question_number": 1,
        "question_type": "mcq",
        "prompt": "Chọn mạo từ phù hợp.",
        "correct": true,
        "submitted_answer": {
          "item_id": 1001,
          "text": "le"
        },
        "correct_answer": {
          "item_id": 1001,
          "text": "le"
        },
        "explanation": null
      }
    ]
  }
}
```

### `content_covered` Rules

- derive from the actual questions in the current Mixed Practice run;
- contain distinct learning units only;
- use human-readable titles and stable slugs;
- may be grouped by module in the frontend;
- do not persist the full composition in Basic Practice History.

---

## 17.4 Practice Completion Persistence

Only after a valid final submission is scored should the backend create one `practice_sessions` row.

Normal Practice persists conceptually:

```text
practice_type = normal
learning_unit_id = selected learning unit
completed_at = backend current timestamp
activity_date = backend calendar date in Asia/Ho_Chi_Minh
correct_count = backend-calculated count
total_questions = run question count
```

Mixed Practice persists conceptually:

```text
practice_type = mixed
learning_unit_id = NULL
completed_at = backend current timestamp
activity_date = backend calendar date in Asia/Ho_Chi_Minh
correct_count = backend-calculated count
total_questions = run question count
```

`completed_at` and `activity_date` are read from the same single clock (§4.10), so a session's `activity_date` is always the `Asia/Ho_Chi_Minh` calendar date of its `completed_at`.

The backend does not persist per-question submitted-answer snapshots for the MVP.

Incomplete or abandoned practice creates no `practice_sessions` row and therefore creates no Practice History or streak activity.

---

## 17.5 Practice Submission Errors

### Incomplete Practice — `422 Unprocessable Entity`

```json
{
  "error": {
    "code": "incomplete_practice",
    "message": "Every question in the practice run must have exactly one submitted answer.",
    "details": {
      "answers": "Answers must contain exactly one entry for every question."
    }
  }
}
```

- the backend returns this one `details` shape, `{"answers": "<fixed safe sentence>"}`, for **every** mismatch between the submitted `question_id` set and the run's question set: a missing answer, an unknown question id, or an extra question id. It does not return `missing_count`; the frontend must not rely on a count and treats `details` as informational;
- a malformed answer entry (wrong type, duplicate `question_id`, bad answer shape) is not `incomplete_practice`; it returns `422 validation_error` with path-form field names (§4.4);
- the run is checked first: an unknown/other learner's run returns `404 practice_run_not_found` and an already submitted run returns `409 practice_already_submitted` before the answers are examined;
- the `message` text is a safe fallback and is not contractual; the frontend branches on `code`.

### Already Submitted — `409 Conflict`

```json
{
  "error": {
    "code": "practice_already_submitted",
    "message": "This practice run has already been submitted.",
    "details": {}
  }
}
```

### Missing/Expired Run — `404 Not Found`

```json
{
  "error": {
    "code": "practice_run_not_found",
    "message": "Practice run was not found or has expired.",
    "details": {}
  }
}
```

The `message` text is not contractual (the frontend branches on `code` and shows its own localized text). The same response is returned for an unknown id, an expired run, and a run owned by another learner, so a run id cannot be probed.

---

# 18. Temporary Practice Run State

`practice_run_id` represents temporary runtime state for an in-progress Practice session. It is not the same as a persisted `practice_sessions.id`.

For the local MVP, a server-side in-memory store is acceptable.

A run needs only enough temporary information to validate the final submission, conceptually:

```text
practice_run_id
user_id
practice_type
learning_unit_id (normal only)
selected question IDs
submitted flag
```

For Mixed Practice, the selected question IDs also allow the backend to derive `content_covered` for the current Result response.

The temporary run does not need to persist learner answers because answers are submitted once at final submission.

### Runtime Limitation

If the Flask process restarts, in-memory runs may be lost. A learner with an in-progress quiz may need to start again.

For the local MVP this is acceptable because:

- incomplete runs are not Practice History;
- incomplete runs do not affect streak;
- no persistent learner score is lost because completion has not occurred.

A future deployed system may replace this with persistent/cache-backed session state without changing the learner-facing Practice flow.

---

# 19. Error Code Catalogue

The following codes are the main contract-level codes. Additional narrowly scoped validation codes may be added if they preserve the global error envelope.

| Code | Typical Status | Meaning |
|---|---:|---|
| `invalid_json` | 400 | Request body is malformed JSON |
| `validation_error` | 422 | Parsed request fails field validation; `details.fields` carries field-level codes (§4.4) |
| `rate_limited` | 429 | Login rate limit exceeded (§4.7); `Retry-After` header carries the wait in seconds |
| `csrf_failed` | 403 | State-changing request rejected by the same-origin check (§4.7); details `{}` |
| `not_authenticated` | 401 | Authenticated session required |
| `invalid_credentials` | 401 | Login credentials invalid |
| `email_already_registered` | 409 | Registration email conflicts with existing account |
| `learning_unit_not_found` | 404 | Learning unit slug is not valid for the requested resource/action |
| `topic_not_found` | 404 | Vocabulary Topic slug not found |
| `reference_not_found` | 404 | Reference slug not found |
| `practice_unavailable` | 409 | Learning unit exists but normal Practice cannot be started |
| `mixed_practice_unavailable` | 409 | No eligible Mixed Practice questions are available |
| `invalid_mixed_filters` | 422 | Mixed filter values are invalid; currently returned for any `filters` key because filters are not implemented (§16.2) |
| `practice_run_not_found` | 404 | Temporary practice run is missing/expired |
| `practice_already_submitted` | 409 | Run was already finalized |
| `incomplete_practice` | 422 | Not all run questions have final answers |
| `internal_error` | 500 | Unexpected backend failure |

---

# 20. Security and Validation Rules

The backend must enforce the following regardless of frontend behavior:

1. Never store plain-text passwords.
2. Use password hashing/verification functions appropriate for Flask/Werkzeug.
3. Normalize email before registration uniqueness checks and login lookup.
4. Never trust a frontend-provided `user_id` for learner-owned state.
5. Validate that every learning-unit slug belongs to the resource/module being requested.
6. Validate all enum-like values against explicit allowlists.
7. Do not expose correct Practice answers at Practice Start.
8. Do not trust client-calculated score, accuracy, completion time, or streak values.
9. Derive `completed_at` and `activity_date` on the backend.
10. Ensure a practice run belongs to the authenticated user before accepting submission.
11. Prevent one run from creating duplicate `practice_sessions` rows.
12. Do not return stack traces, SQL errors, secret keys, password hashes, or other internal details in API errors.
13. Keep the Flask `SECRET_KEY` outside committed source code.
14. Use same-origin frontend/backend behavior through the local Vite proxy for the MVP.
15. Expire authenticated sessions; the lifetime is a backend configuration value (§4.7).
16. Set the `Secure` session-cookie flag whenever the application is served over HTTPS (§4.7).
17. Protect state-changing requests against cross-site request forgery (§4.7).
18. Rate-limit repeated failed login attempts (§4.7).
19. Return field-level codes in `validation_error` `details.fields` and never include submitted values (§4.4).
20. Derive `today`, `completed_at`, `activity_date`, and streaks from one server clock in `Asia/Ho_Chi_Minh` (§4.10).

---

# 21. API-to-Database Traceability

| API Area | Main Persistent Data |
|---|---|
| Register/Login/Me | `users` |
| Language Preference | `users.support_language` |
| Dashboard Progress | `learning_units`, `user_learning_state` |
| Dashboard Streak/Recent Practice | `practice_sessions` |
| Activity Calendar | `practice_sessions` (distinct `activity_date`) |
| Continue Learning | `user_learning_state.last_opened_at`, `learned_at`, `learning_units` |
| Grammar | `grammar_parts`, `grammar_chapters`, `grammar_lessons`, `learning_units` |
| Vocabulary | `vocabulary_categories`, `vocabulary_topics`, `vocabulary_subtopics`, `vocabulary_study_units`, `vocabulary_words`, `learning_units` |
| Conjugation | `conjugation_tenses`, `conjugation_lessons`, `learning_units` |
| Reference (index and page) | `reference_pages` |
| Mark as Learned / Review Later | `user_learning_state` |
| Practice Questions | `questions`, `question_items` |
| Completed Practice Summary | `practice_sessions` |
| Mixed Eligibility | `user_learning_state.learned_at`, `questions`, `learning_units` |

Temporary Practice runs are runtime state and are intentionally not represented as a permanent MVP database table.

---

# 22. Requirement Traceability — Core MVP

| Core Requirement | API Coverage |
|---|---|
| Register / Login / Logout | Auth endpoints |
| VI / EN support language | `/me`, `/me/preferences`, localized responses |
| Grammar learning | Grammar browse/detail endpoints |
| Vocabulary learning | Vocabulary browse/topic/study-unit endpoints |
| Verb Conjugation learning | Conjugation browse/detail endpoints |
| Three question types | Practice question representation and shared submit |
| Quiz result feedback | Practice Submit Result response |
| Progress tracking | learner-state PATCH + Dashboard |
| Current streak | Dashboard |
| Mixed Practice | Mixed Start + shared Submit |
| Review Later | learner-state PATCH + `/me/review-later` |
| Continue Learning | learning-unit Open action + Dashboard |
| Longest streak | Dashboard |
| Learning Activity Calendar (Should Have, selected) | `/me/activity-calendar` |
| Basic Practice History | Dashboard `recent_practice` |
| French Alphabet & Accents | Reference index + Reference page endpoints |

---

# 23. Frontend Integration Responsibilities

The frontend is responsible for presentation and interaction state, not persistence/business authority.

Examples of frontend responsibilities:

- routing between pages;
- expanding/collapsing Grammar Chapters and Conjugation Tenses;
- rendering Markdown content;
- formatting timestamps for display;
- calculating display percentages when only source counts are provided (including Practice accuracy, rounded for display from the returned counts or `accuracy`);
- deriving Previous/Next lesson links from the sibling lists already returned by the Grammar, Vocabulary Topic, and Conjugation browse/detail endpoints; no Previous/Next field or endpoint exists;
- deriving the first-visit greeting from Dashboard data (§8.1);
- deriving Activity Calendar grid cells (weeks, "no practice", "not yet") from `days` and `today.date`;
- reading Mixed Practice availability from the Dashboard `mixed_practice.available` value rather than from a separate endpoint;
- translating field-level validation codes (§4.4) into localized messages;
- keeping current Practice answers in React state before final submission;
- allowing Back/Next/review behavior before submitting a quiz;
- mapping `unit_type` to frontend routes;
- grouping Mixed `content_covered` by module for display if desired;
- showing localized UI labels from frontend translation resources.

Examples of backend responsibilities:

- authentication and learner identity;
- database access;
- language-sensitive content selection;
- progress/state persistence;
- Mixed Practice eligibility and question selection;
- Practice answer validation and scoring;
- Practice completion/history persistence;
- streak calculations;
- enforcement of business rules.

---

# 24. Change Control

This document is the MVP API baseline after Requirements and Database Design review.

Before changing an existing endpoint contract, check whether the proposed change affects:

- a frozen Must Have requirement;
- database schema or data rules;
- frontend route/page assumptions;
- Practice scoring or streak behavior;
- learner-state semantics;
- existing response consumers.

A contract change should be reflected consistently in all affected design documents before implementation branches diverge.

Additive optional features may extend v1 when they do not break existing callers. Breaking changes should be coordinated explicitly rather than introduced silently.

---

# 25. MVP API Baseline

The core API baseline is:

```text
POST  /api/v1/auth/register
POST  /api/v1/auth/login
POST  /api/v1/auth/logout
GET   /api/v1/me

PATCH /api/v1/me/preferences
GET   /api/v1/me/dashboard
GET   /api/v1/me/activity-calendar

GET   /api/v1/grammar
GET   /api/v1/grammar/lessons/{slug}

GET   /api/v1/vocabulary
GET   /api/v1/vocabulary/topics/{topic_slug}
GET   /api/v1/vocabulary/study-units/{slug}

GET   /api/v1/conjugation
GET   /api/v1/conjugation/lessons/{slug}

GET   /api/v1/references
GET   /api/v1/references/{slug}

POST  /api/v1/me/learning-units/{slug}/open
PATCH /api/v1/me/learning-units/{slug}/state
GET   /api/v1/me/review-later

POST  /api/v1/learning-units/{slug}/practice/start
POST  /api/v1/mixed-practice/start
POST  /api/v1/practice/runs/{practice_run_id}/submit
```

This baseline is sufficient to support the agreed learner-facing MVP without adding separate APIs for Progress, Continue Learning, full Practice History, Previous/Next navigation, or module-specific learner-state updates.
