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

Should Have features such as Review Practice, Verb Reference, and Learning Activity Calendar should receive their own contract additions only if they are selected for implementation.

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
| `403 Forbidden` | Authenticated but explicitly not permitted |
| `404 Not Found` | Requested resource/run does not exist |
| `405 Method Not Allowed` | HTTP method is not supported for the route |
| `409 Conflict` | Request conflicts with current resource/application state |
| `422 Unprocessable Entity` | JSON parsed, but fields/values fail validation |
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
| Grammar | GET | `/api/v1/grammar` | Authenticated |
| Grammar | GET | `/api/v1/grammar/lessons/{slug}` | Authenticated |
| Vocabulary | GET | `/api/v1/vocabulary` | Authenticated |
| Vocabulary | GET | `/api/v1/vocabulary/topics/{topic_slug}` | Authenticated |
| Vocabulary | GET | `/api/v1/vocabulary/study-units/{slug}` | Authenticated |
| Conjugation | GET | `/api/v1/conjugation` | Authenticated |
| Conjugation | GET | `/api/v1/conjugation/lessons/{slug}` | Authenticated |
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
| `422` | `validation_error` | Required fields invalid/missing |
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
- create/refresh the authenticated Flask session after valid credentials.

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
- this endpoint changes only the learner's preference.

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
      "title": "Mạo từ xác định"
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

### Data Used

- `vocabulary_categories`
- `vocabulary_topics`

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

## 12.1 Get Reference Page

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

---

## 17.3 Mixed Practice Result

### Success — `200 OK`

```json
{
  "data": {
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
activity_date = backend local calendar date
correct_count = backend-calculated count
total_questions = run question count
```

Mixed Practice persists conceptually:

```text
practice_type = mixed
learning_unit_id = NULL
completed_at = backend current timestamp
activity_date = backend local calendar date
correct_count = backend-calculated count
total_questions = run question count
```

The backend does not persist per-question submitted-answer snapshots for the MVP.

Incomplete or abandoned practice creates no `practice_sessions` row and therefore creates no Practice History or streak activity.

---

## 17.5 Practice Submission Errors

### Incomplete Practice — `422 Unprocessable Entity`

```json
{
  "error": {
    "code": "incomplete_practice",
    "message": "All questions must be answered before submitting practice.",
    "details": {
      "missing_count": 1
    }
  }
}
```

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
    "message": "This practice session is no longer available. Please start a new practice.",
    "details": {}
  }
}
```

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
| `validation_error` | 422 | Parsed request fails field validation |
| `not_authenticated` | 401 | Authenticated session required |
| `invalid_credentials` | 401 | Login credentials invalid |
| `email_already_registered` | 409 | Registration email conflicts with existing account |
| `learning_unit_not_found` | 404 | Learning unit slug is not valid for the requested resource/action |
| `topic_not_found` | 404 | Vocabulary Topic slug not found |
| `reference_not_found` | 404 | Reference slug not found |
| `practice_unavailable` | 409 | Learning unit exists but normal Practice cannot be started |
| `mixed_practice_unavailable` | 409 | No eligible Mixed Practice questions are available |
| `invalid_mixed_filters` | 422 | Mixed filter values are invalid |
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

---

# 21. API-to-Database Traceability

| API Area | Main Persistent Data |
|---|---|
| Register/Login/Me | `users` |
| Language Preference | `users.support_language` |
| Dashboard Progress | `learning_units`, `user_learning_state` |
| Dashboard Streak/Recent Practice | `practice_sessions` |
| Continue Learning | `user_learning_state.last_opened_at`, `learned_at`, `learning_units` |
| Grammar | `grammar_parts`, `grammar_chapters`, `grammar_lessons`, `learning_units` |
| Vocabulary | `vocabulary_categories`, `vocabulary_topics`, `vocabulary_subtopics`, `vocabulary_study_units`, `vocabulary_words`, `learning_units` |
| Conjugation | `conjugation_tenses`, `conjugation_lessons`, `learning_units` |
| Reference | `reference_pages` |
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
| Basic Practice History | Dashboard `recent_practice` |
| French Alphabet & Accents | Reference endpoint |

---

# 23. Frontend Integration Responsibilities

The frontend is responsible for presentation and interaction state, not persistence/business authority.

Examples of frontend responsibilities:

- routing between pages;
- expanding/collapsing Grammar Chapters and Conjugation Tenses;
- rendering Markdown content;
- formatting timestamps for display;
- calculating display percentages when only source counts are provided;
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

GET   /api/v1/grammar
GET   /api/v1/grammar/lessons/{slug}

GET   /api/v1/vocabulary
GET   /api/v1/vocabulary/topics/{topic_slug}
GET   /api/v1/vocabulary/study-units/{slug}

GET   /api/v1/conjugation
GET   /api/v1/conjugation/lessons/{slug}

GET   /api/v1/references/{slug}

POST  /api/v1/me/learning-units/{slug}/open
PATCH /api/v1/me/learning-units/{slug}/state
GET   /api/v1/me/review-later

POST  /api/v1/learning-units/{slug}/practice/start
POST  /api/v1/mixed-practice/start
POST  /api/v1/practice/runs/{practice_run_id}/submit
```

This baseline is sufficient to support the agreed learner-facing MVP without adding separate APIs for Progress, Continue Learning, full Practice History, or module-specific learner-state updates.
