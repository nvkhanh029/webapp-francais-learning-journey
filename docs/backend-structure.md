# French Learning Web Application
## Backend Application Structure Specification

**Document status:** Baseline v1.0  
**Project type:** Web Application Development final project  
**Backend:** Python + Flask  
**Database access:** Python `sqlite3`  
**Persistent database:** SQLite  
**API base path:** `/api/v1`  
**Authentication:** Flask session cookie  
**Deployment target:** Local development and local demonstration  

---

## 1. Purpose

This document defines the internal backend application structure for the French Learning Web Application MVP.

It translates the frozen system architecture, database design, and API contract into an implementation-oriented Flask structure that can be followed consistently by all contributors.

The document defines:

- Flask application creation and initialization;
- API route and Blueprint organization;
- service/business-logic responsibilities;
- repository and SQLite access boundaries;
- authentication and session handling;
- request validation and error handling;
- application configuration;
- database initialization and static-content seeding;
- temporary Practice run state;
- shared localization behavior;
- backend testing strategy;
- implementation guardrails that preserve the agreed architecture.

This is a backend design document rather than an endpoint contract or database schema specification. Endpoint payloads remain governed by the API Contract, while tables, relationships, and constraints remain governed by the Database Design.

---

## 2. Scope

The backend structure supports the agreed learner-facing MVP:

- learner registration, login, logout, and current-user resolution;
- support-language preference;
- Dashboard aggregation;
- Grammar content;
- Vocabulary content;
- Verb Conjugation content;
- French Alphabet & Accents reference content;
- Mark as Learned;
- Review Later;
- Continue Learning;
- normal Practice;
- Mixed Practice;
- Practice submission and scoring;
- Basic Practice History summaries;
- current and longest streak calculations;
- static-content initialization and seeding.

The backend structure intentionally does not introduce:

- microservices;
- a separate authentication service;
- JWT authentication;
- Flask-Login;
- OAuth/social login;
- email verification or password-reset infrastructure;
- Redis or distributed caching;
- message queues;
- background-job infrastructure;
- an ORM such as SQLAlchemy;
- cloud/production deployment infrastructure;
- a migration framework for the initial local MVP;
- production monitoring or observability infrastructure.

These may be reconsidered only if the project scope or deployment model changes explicitly.

---

## 3. Backend Design Principles

### 3.1 Keep responsibilities separated

The runtime request path follows this structure:

```text
HTTP Request
    |
    v
Route / Blueprint
    |
    v
Service
    |
    v
Repository
    |
    v
db.py
    |
    v
SQLite
```

The major responsibilities are:

```text
Route / Blueprint
-> HTTP boundary

Service
-> business rules and application orchestration

Repository
-> SQL and persistent-data access

db.py
-> SQLite connection and transaction infrastructure
```

A route must not become a business-logic container.

A repository must not decide learner-facing business policy.

### 3.2 Keep business rules authoritative in Flask

React may perform convenience validation and display calculations, but Flask remains authoritative for:

- authenticated learner identity;
- input validation;
- ownership checks;
- learner-state transitions;
- Practice eligibility;
- Practice question selection;
- Practice scoring;
- completion timestamps and activity dates;
- progress and streak derivation;
- persistent writes.

### 3.3 Prefer explicit code over unnecessary abstraction

The backend should remain understandable to project contributors.

Do not introduce generic base repositories, dependency-injection frameworks, service containers, or additional architectural layers unless repeated implementation problems demonstrate a concrete need.

### 3.4 Keep the implementation replaceable behind stable contracts

The frontend depends on `/api/v1/...`, not on Flask modules, Python classes, SQL statements, or SQLite table shapes.

The backend structure should allow internal implementation to change without silently changing the API contract.

### 3.5 Separate persistent state from temporary interaction state

Persistent learner and curriculum state belongs in SQLite.

Temporary in-progress Practice metadata belongs in the in-memory Practice run store for the local MVP.

---

## 4. Recommended Backend Directory Structure

The recommended backend structure is:

```text
backend/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── db.py
│   ├── schema.sql
│   ├── auth_session.py
│   ├── validation.py
│   ├── errors.py
│   ├── localization.py
│   ├── practice_runs.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── me.py
│   │       ├── grammar.py
│   │       ├── vocabulary.py
│   │       ├── conjugation.py
│   │       ├── references.py
│   │       └── practice.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── dashboard_service.py
│   │   ├── grammar_service.py
│   │   ├── vocabulary_service.py
│   │   ├── conjugation_service.py
│   │   ├── reference_service.py
│   │   ├── learning_state_service.py
│   │   └── practice_service.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── learning_unit_repository.py
│   │   ├── grammar_repository.py
│   │   ├── vocabulary_repository.py
│   │   ├── conjugation_repository.py
│   │   ├── reference_repository.py
│   │   ├── learning_state_repository.py
│   │   └── practice_repository.py
│   │
│   └── seeding/
│       ├── __init__.py
│       ├── loaders.py
│       ├── validators.py
│       ├── transforms.py
│       └── writers.py
│
├── data/
│   ├── grammar/
│   ├── vocabulary/
│   ├── conjugation/
│   ├── reference/
│   └── questions/
│
├── instance/
│   └── app.db
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_content.py
│   ├── test_learning_state.py
│   ├── test_practice.py
│   ├── test_dashboard.py
│   └── test_seed_validation.py
│
├── init_db.py
├── seed.py
└── requirements.txt
```

The `seeding/` package may initially be smaller if the seed implementation is still short. However, the responsibilities of loading, validation, transformation, and database writing should remain conceptually separate so that `seed.py` does not become a single unmaintainable script.

The generated `instance/app.db` file is runtime data and should not be committed to Git.

---

## 5. Flask Application Factory and Startup Composition

### 5.1 Application factory

The Flask application shall use an application factory:

```python
create_app(test_config=None)
```

The factory is the composition point for backend infrastructure.

Conceptually:

```text
create_app()
    |
    +--> create Flask app
    +--> load configuration
    +--> create instance directory if needed
    +--> initialize database integration
    +--> initialize auth/session helpers
    +--> initialize temporary Practice run store
    +--> register API Blueprints
    +--> register error handlers
    |
    v
return app
```

The factory must not contain endpoint business logic, raw SQL queries, Practice scoring, or content-specific behavior.

### 5.2 Factory shape

Conceptually:

```python
from pathlib import Path
from flask import Flask

from .config import Config
from . import db
from .errors import register_error_handlers
from .auth_session import init_app as init_auth
from .api.v1 import register_blueprints
from .practice_runs import InMemoryPracticeRunStore


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    # Runtime-dependent configuration is resolved here.
    # DATABASE and SECRET_KEY are configured before requests are served.

    if test_config is not None:
        app.config.update(test_config)

    db.init_app(app)
    init_auth(app)
    register_error_handlers(app)
    register_blueprints(app)

    app.extensions["practice_run_store"] = InMemoryPracticeRunStore()

    return app
```

The exact import arrangement may vary during implementation, but the responsibility boundary should remain the same.

### 5.3 Test overrides

`create_app(test_config=None)` allows tests to override settings such as:

```text
TESTING
DATABASE
SECRET_KEY
```

Tests must not use the normal development `instance/app.db`.

---

## 6. Route and Blueprint Organization

### 6.1 General rule

Routes are the HTTP boundary.

A route may:

- receive the request;
- read path/query/body input;
- rely on the authenticated current user;
- call reusable validation helpers;
- call a service;
- return the API response and status code.

A route must not:

- contain raw SQL;
- calculate Practice scores;
- derive streaks;
- implement large learner-state rules;
- duplicate service logic;
- expose database rows directly as the API contract.

### 6.2 Blueprint modules

The API is organized into seven feature-oriented Blueprint modules.

| Module | Responsibility | Main Route Area |
|---|---|---|
| `auth.py` | register, login, logout | `/api/v1/auth/...` |
| `me.py` | current user, preferences, Dashboard, learner-owned state, Review Later | `/api/v1/me/...` |
| `grammar.py` | Grammar browse/detail | `/api/v1/grammar/...` |
| `vocabulary.py` | Vocabulary browse/topic/study-unit content | `/api/v1/vocabulary/...` |
| `conjugation.py` | Conjugation browse/detail | `/api/v1/conjugation/...` |
| `references.py` | reference content | `/api/v1/references/...` |
| `practice.py` | normal Practice start, Mixed Practice start, shared submission | multiple `/api/v1/...` Practice paths |

The route modules are grouped by API feature rather than one Python file per endpoint.

### 6.3 Dashboard placement

The Dashboard endpoint remains in `me.py` because it is a learner-owned `/me/dashboard` route.

Its business logic belongs in `dashboard_service.py`.

Route placement and service responsibility do not need to be one-to-one.

### 6.4 Practice placement

Normal Practice, Mixed Practice, and shared Practice submission remain in one `practice.py` route module because they share one run lifecycle:

```text
start
-> temporary run
-> final submission
-> scoring
-> persistence
```

### 6.5 Blueprint registration

`app/api/v1/__init__.py` should provide one registration function, conceptually:

```python
def register_blueprints(app):
    ...
```

This keeps Blueprint registration out of the application factory body.

---

## 7. Service / Business-Logic Layer

### 7.1 General responsibility

Services own application and business behavior.

A service may:

- coordinate multiple repositories;
- apply business rules;
- perform ownership and eligibility checks;
- derive API-oriented values;
- control transaction boundaries;
- call shared localization helpers;
- create/read temporary Practice runs where required;
- raise application-level API errors.

A service must not:

- use Flask route decorators;
- parse `request` directly;
- return Flask `Response` objects;
- call `jsonify`;
- embed raw SQL;
- trust client-calculated score, streak, identity, or timestamps.

### 7.2 Service modules

#### `auth_service.py`

Responsibilities:

- normalize registration/login email values;
- validate authentication-related business rules;
- detect duplicate normalized email during registration;
- hash passwords before persistence;
- verify stored password hashes during login;
- create the learner account through the user repository;
- return safe user data to the route layer.

Flask session creation/clearing does not belong in this service.

#### `user_service.py`

Responsibilities:

- current-user profile-oriented behavior;
- support-language preference update;
- user-facing model construction for `/me` and preference flows.

#### `dashboard_service.py`

Responsibilities:

- aggregate data from learner state, learning units, Practice sessions, and module content;
- derive module progress;
- derive Continue Learning;
- derive Review Later count;
- derive Mixed Practice availability;
- derive current streak;
- derive longest streak;
- build Recent Practice output.

There is intentionally no `dashboard_repository.py`. The Dashboard is an aggregate application view and should coordinate existing repositories instead of creating a repository tied to one screen.

#### `grammar_service.py`

Responsibilities:

- Grammar browse/detail application behavior;
- support-language-sensitive field selection;
- learner-state enrichment required by the API response.

#### `vocabulary_service.py`

Responsibilities:

- Vocabulary hierarchy/content application behavior;
- support-language-sensitive meanings/titles/examples;
- learner-state enrichment required by the API response.

#### `conjugation_service.py`

Responsibilities:

- Conjugation browse/detail application behavior;
- support-language-sensitive explanation/title selection;
- learner-state enrichment required by the API response.

#### `reference_service.py`

Responsibilities:

- reference-content lookup;
- support-language-sensitive response selection.

#### `learning_state_service.py`

Responsibilities:

- record learning-unit open actions;
- Mark as Learned / unmark behavior;
- Review Later add/remove behavior;
- preserve the independence of Learned and Review Later state;
- prevent duplicate or invalid learner-state transitions;
- ensure these actions do not create streak activity.

#### `practice_service.py`

Responsibilities cover the full Practice lifecycle.

Normal Practice start:

```text
validate learning unit
-> load seeded questions
-> ensure Practice is available
-> create temporary run
-> return questions without correct-answer information
```

Mixed Practice start:

```text
resolve current learner
-> find explicitly learned learning units
-> build eligible question pool
-> apply optional filters
-> select distinct questions without replacement
-> create temporary run
-> return questions without correct-answer information
```

Practice submission:

```text
resolve temporary run
-> verify ownership
-> verify not already submitted
-> verify submitted question set
-> validate answer shapes/items
-> load authoritative correct-answer data
-> calculate score
-> create one completed Practice summary transactionally
-> mark temporary run submitted
-> build result feedback
```

The client must never supply authoritative `correct_count`, `accuracy`, completion time, activity date, or streak values.

### 7.3 Services do not need equal size

A thin service is acceptable when a feature currently has little business logic.

Do not invent artificial service complexity only to make each service look symmetrical.

### 7.4 Business constants

Business constants belong near the business logic that owns them.

For example, the Mixed Practice target size belongs in `practice_service.py` or a closely related Practice module rather than in `config.py`.

---

## 8. Repository and SQLite Access

### 8.1 `db.py` responsibility

`db.py` provides database infrastructure rather than domain queries.

It should expose the conceptual responsibilities:

```text
get_db()
close_db()
transaction()
init_app(app)
```

`db.py` must not become a generic business-query layer.

### 8.2 Connection lifecycle

The backend should use one SQLite connection per Flask application context, normally corresponding to one request.

Conceptually:

```python
import sqlite3
from flask import current_app, g


def get_db():
    if "db" not in g:
        db = sqlite3.connect(current_app.config["DATABASE"])
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
        g.db = db

    return g.db
```

The connection is closed during application-context teardown.

### 8.3 Foreign-key enforcement

Every application SQLite connection must enable:

```sql
PRAGMA foreign_keys = ON;
```

Foreign-key enforcement must not depend on a one-time initialization command.

### 8.4 Row representation

Set:

```python
db.row_factory = sqlite3.Row
```

so repository code can access returned columns by name.

### 8.5 Repository modules

#### `user_repository.py`

Data access for:

- users by normalized email;
- users by ID;
- user creation;
- support-language preference updates.

Authentication-specific reads may include `password_hash`; normal current-user reads should select only fields required outside authentication.

#### `learning_unit_repository.py`

Shared learning-unit data access for:

- stable slug lookup;
- shared unit metadata;
- cross-module learning-unit identity;
- common unit counts required by progress/business logic.

This repository prevents repeated shared `learning_units` lookups from being reimplemented independently by Grammar, Vocabulary, Conjugation, learning-state, and Practice code.

#### `grammar_repository.py`

Grammar hierarchy/content SQL.

#### `vocabulary_repository.py`

Vocabulary hierarchy, Study Unit, and vocabulary-entry SQL.

#### `conjugation_repository.py`

Conjugation tense/lesson SQL.

#### `reference_repository.py`

Reference-page SQL.

#### `learning_state_repository.py`

Persistent learner/unit state SQL for:

- `learned_at`;
- Review Later state;
- `last_opened_at`;
- learner-state reads used by Continue Learning and related business logic.

#### `practice_repository.py`

Practice persistence/query SQL for:

- questions;
- question items;
- eligible Practice question reads;
- completed `practice_sessions` summaries;
- Practice History/streak source reads.

`questions`, `question_items`, and `practice_sessions` do not require separate repositories for the MVP because they belong to the same Practice data responsibility.

### 8.6 Repository does not equal database table

Repositories are grouped by data/domain responsibility rather than one file per table.

Do not create repositories mechanically for every table.

### 8.7 Parameter binding

SQL must use SQLite parameter binding:

```python
row = get_db().execute(
    "SELECT id, email FROM users WHERE email = ?",
    (email,),
).fetchone()
```

Do not build SQL by interpolating frontend/user values into SQL strings.

### 8.8 Transaction ownership

Repository write functions must not call `commit()` independently.

The service layer owns the business transaction boundary.

Conceptually:

```python
from contextlib import contextmanager


@contextmanager
def transaction():
    db = get_db()

    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
```

A service may then perform:

```text
BEGIN business action
-> repository write A
-> repository write B
-> repository write C
-> COMMIT
```

If any write fails:

```text
ROLLBACK
```

This prevents half-completed multi-step writes.

### 8.9 No generic query abstraction by default

Do not add generic `BaseRepository`, `query_service`, or large `query_db()` abstraction layers unless repeated real duplication justifies them.

Direct, explicit repository SQL is preferred for the current MVP.

---

## 9. Authentication and Session Handling

### 9.1 Authentication model

The MVP uses Flask session-cookie authentication.

The authenticated learner identity is represented conceptually as:

```python
session["user_id"]
```

The frontend must never provide a `user_id` as authority for learner-owned operations.

### 9.2 `auth_session.py`

`auth_session.py` separates Flask session mechanics from authentication business logic.

It should own the conceptual helpers:

```text
load_current_user()
start_user_session(user_id)
end_user_session()
login_required
init_app(app)
```

### 9.3 Starting a session

After successful registration or login:

```python
session.clear()
session["user_id"] = user_id
```

Only the learner identity should be stored in the session for the MVP.

Do not store:

- plaintext passwords;
- password hashes;
- full user records;
- Practice answer state;
- persistent learner progress.

### 9.4 Loading the current learner

For each request, the backend may resolve:

```text
session["user_id"]
-> user_repository session-safe lookup
-> g.current_user
```

A session-safe current-user lookup should not unnecessarily carry `password_hash` through the application.

### 9.5 Protected endpoints

Protected routes use a shared `@login_required` decorator.

If there is no authenticated current learner, the API returns the contract-defined `401 not_authenticated` error rather than redirecting to an HTML login page.

### 9.6 Logout

Logout clears the Flask session:

```python
session.clear()
```

Logout does not require an active session.

Repeated logout requests remain successful from the client's perspective so the operation is idempotent.

### 9.7 Password handling

Use Werkzeug password helpers:

```text
generate_password_hash()
check_password_hash()
```

Do not store plaintext passwords.

Do not expose password hashes through API responses, logs, or learner-facing errors.

### 9.8 Cookie settings

For the local MVP:

```text
HttpOnly = true
SameSite = Lax
Secure = false on local HTTP
```

If the application is later served through HTTPS:

```text
Secure = true
```

### 9.9 No JWT / Flask-Login layer

The current one-role learner MVP does not require JWT or Flask-Login.

Built-in Flask sessions plus the shared auth/session helper are sufficient.

---

## 10. Validation and Error Handling

### 10.1 Validation ownership

Validation is divided into three levels.

| Level | Responsibility |
|---|---|
| Route / `validation.py` | JSON syntax, request shape, field type, reusable field rules |
| Service | business rules, current state, ownership, eligibility, cross-record invariants |
| SQLite | foreign keys, uniqueness, NOT NULL and relational constraints |

### 10.2 `validation.py`

`validation.py` provides reusable request-input helpers, conceptually including:

```text
get_json_body()
require_string(...)
require_boolean(...)
validate_email(...)
validate_support_language(...)
```

It may also contain reusable shape validation for structured Practice requests where appropriate.

It must not become the owner of business rules such as:

- whether an email already exists;
- whether Mixed Practice is available;
- whether a run belongs to the current learner;
- whether a Practice run has already been submitted.

These belong in services.

### 10.3 HTTP validation semantics

Use the API Contract semantics consistently:

```text
400
-> malformed / syntactically invalid JSON

422
-> JSON parsed successfully, but fields/shapes/values are invalid

401
-> authentication required or credentials invalid

403
-> authenticated but explicitly not permitted, when such a contract case exists

404
-> requested resource/run does not exist

409
-> request conflicts with current application/resource state

500
-> unexpected backend failure
```

### 10.4 `errors.py`

Define one application-level error type conceptually:

```python
class ApiError(Exception):
    ...
```

It carries:

```text
HTTP status
machine-readable code
safe message
optional details object
```

Services may raise `ApiError` for expected application failures.

### 10.5 Global error envelope

All API errors use:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human-readable fallback message.",
    "details": {}
  }
}
```

Field-validation errors may populate `details` with structured field information.

### 10.6 Global handlers

`register_error_handlers(app)` should register handlers for:

- `ApiError`;
- routing-level `404`;
- method-level `405`;
- unexpected `500` failures.

Unexpected exceptions should be logged server-side while returning only the safe `internal_error` response to the client.

### 10.7 Do not leak implementation details

Learner-facing errors must not expose:

- Python stack traces;
- SQL statements;
- SQLite exceptions;
- secret keys;
- password hashes;
- filesystem paths;
- internal configuration values.

### 10.8 Expected database conflicts

Database constraints remain the final integrity defense.

Expected persistence conflicts should be translated into application-level behavior without exposing raw `sqlite3` exceptions through the API.

The repository should not define HTTP status codes or API response envelopes.

---

## 11. Configuration

### 11.1 `config.py`

`config.py` contains non-secret application defaults that vary by runtime environment rather than business rules.

For the local MVP:

```python
class Config:
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
```

### 11.2 Database path

The generated database is located at:

```text
backend/instance/app.db
```

The application factory derives the path from `app.instance_path` rather than a machine-specific absolute path.

Conceptually:

```python
from pathlib import Path

app.config["DATABASE"] = Path(app.instance_path) / "app.db"
```

### 11.3 Secret key

`SECRET_KEY` must come from the runtime environment and must not be committed to source control.

The application should fail fast during startup if a required secret is missing.

Conceptually:

```python
secret_key = os.environ.get("SECRET_KEY")

if not secret_key:
    raise RuntimeError(
        "SECRET_KEY environment variable is required."
    )

app.config["SECRET_KEY"] = secret_key
```

This is a configuration/startup error, not a learner-facing API error.

### 11.4 Optional `.env` convenience

A local `.env` file may be used if the team chooses to use `python-dotenv` or Flask's environment-file support.

If used:

```text
.env
-> local only; gitignored

.env.example
-> safe template; may be committed
```

The architecture requirement is simply that real secrets remain outside committed source code.

### 11.5 Test configuration

Tests override settings through `create_app(test_config=...)` rather than requiring separate production-style config classes.

A separate `DevelopmentConfig`, `TestingConfig`, and `ProductionConfig` hierarchy is not required for the current local MVP.

### 11.6 Debug mode

Do not hard-code `DEBUG = True` in application configuration.

Development debugging should be selected at runtime, for example through Flask CLI options.

### 11.7 Business rules are not environment configuration

Do not place product rules such as:

```text
Mixed Practice target size = 10
```

inside `config.py` unless they genuinely become environment-dependent behavior.

---

## 12. Database Initialization and Static-Content Seeding

### 12.1 Separation of responsibilities

The setup commands remain conceptually separate:

```text
python init_db.py
python seed.py
```

`init_db.py` creates the database schema.

`seed.py` validates and populates static curriculum/reference content.

### 12.2 `schema.sql`

`app/schema.sql` defines the SQLite schema, including:

- tables;
- primary keys;
- foreign keys;
- uniqueness constraints;
- checks and other database-level integrity rules required by the Database Design.

### 12.3 `init_db.py`

`init_db.py` is a command-line entry script for schema creation.

Conceptually:

```text
resolve configured database path
-> create/open SQLite database
-> enable foreign keys
-> execute schema.sql
-> close connection
```

It does not populate curriculum content.

Any destructive reset behavior must be explicit.

If a reset option such as `--reset` is implemented, it must not occur silently during a normal initialization or seed command.

### 12.4 Static source of truth

Static learning content is authored under:

```text
backend/data/
├── grammar/
├── vocabulary/
├── conjugation/
├── reference/
└── questions/
```

These files are the authoring source of truth.

The generated SQLite database is the runtime query store.

Contributors should not normally edit seeded static curriculum directly inside `app.db`.

### 12.5 Seed responsibilities

The seed process performs:

```text
load
-> transform
-> validate
-> insert transactionally
-> print summary
```

Recommended internal responsibility split:

```text
loaders.py
-> read JSON and Markdown source files

transforms.py
-> normalize/derive seed-time structures
-> generate Vocabulary Study Units
-> derive ordering-question positions

validators.py
-> validate all source structures and cross-references

writers.py
-> execute static-content inserts

seed.py
-> orchestrate the whole pipeline
```

### 12.6 Validate before writing

The seed workflow must load and validate all static content before modifying the database.

Conceptually:

```text
Load all source content
        |
        v
Generate Vocabulary Study Units
        |
        v
Validate structure and references
        |
        +---- validation error ---> stop; write nothing
        |
        v
Begin transaction
        |
        v
Insert static content
        |
        +---- database error -----> rollback
        |
        v
Commit
        |
        v
Print summary
```

The database must not be left half-seeded.

### 12.7 Seed validation

The seed implementation enforces the validation rules defined by the Database Design, including:

- valid JSON;
- required fields;
- required VI/EN learning content;
- unique stable slugs;
- valid hierarchy references;
- valid and non-duplicated sibling `sort_order`;
- valid unit/question types;
- question-type-specific structure;
- question references to known learning-unit slugs.

### 12.8 Stable slug references

Content source files should use stable slugs rather than numeric database IDs.

For example:

```json
{
  "learning_unit_slug": "articles-definis"
}
```

The seed process resolves the slug to the generated SQLite foreign key.

### 12.9 Vocabulary transformation

Vocabulary source subtopics may be transformed into balanced Study Units according to the Database Design.

The transform must preserve source order and must not invent semantic regrouping.

Questions are validated only after the complete in-memory learning-unit list, including generated Vocabulary Study Units, is known.

### 12.10 Learner-generated state is not seeded

The static curriculum seed does not create normal learner runtime data such as:

- real users;
- learner completion state;
- Review Later state;
- Practice History;
- streak state.

Test/demo fixtures, if needed, must remain separate from the canonical curriculum seed.

### 12.11 Reseeding behavior

`seed.py` must not silently delete learner data or silently recreate the database.

During local development, destructive recreate-and-reseed is acceptable only as an explicit developer action.

Once learner progress exists against frozen content, automated reseeding must not silently rebalance or redefine existing published Study Units.

### 12.12 Seed output

A successful seed should print a concise summary by content area so contributors can detect missing content quickly.

Seed output should distinguish blocking errors from non-blocking warnings.

---

## 13. Temporary Practice Run State

### 13.1 Purpose

A Practice run represents an in-progress quiz between Practice Start and final Practice Submit.

It is temporary runtime state and is distinct from the persistent `practice_sessions` table.

### 13.2 Storage

For the local MVP, temporary Practice runs are stored in server-side process memory.

They are not stored in SQLite.

### 13.3 Store module

`app/practice_runs.py` provides the temporary store implementation.

Recommended class:

```python
class InMemoryPracticeRunStore:
    ...
```

The store instance should be attached to the Flask application, conceptually:

```python
app.extensions["practice_run_store"] = InMemoryPracticeRunStore()
```

Avoid a module-level global `PRACTICE_RUNS = {}` as the primary architecture because application-factory-created test apps should receive isolated stores.

### 13.4 Run identifier

Generate `practice_run_id` using UUID4:

```python
str(uuid4())
```

The run identifier is not a persistent database primary key.

### 13.5 Run fields

A run stores only the information required to validate the final submission:

```text
practice_run_id
user_id
practice_type
learning_unit_id          # normal Practice only
selected_question_ids
submitted
```

Mixed Practice uses `learning_unit_id = None` because one run may cover multiple learning units.

### 13.6 Answers remain frontend interaction state

The temporary run does not persist the learner's changing answers.

The learner may change answers in React until final submission.

The final submitted answer payload is the authoritative attempt input for scoring.

### 13.7 Ownership validation

A run ID is not authorization.

On submission, the backend must verify that the run belongs to the authenticated learner before using it.

### 13.8 Duplicate-submission protection

A completed run remains in memory with:

```text
submitted = true
```

rather than being deleted immediately.

This allows a repeated submission to be recognized as an already-finalized run instead of appearing to be an unknown run.

### 13.9 Finalization ordering

A Practice run must not become permanently `submitted = true` before its completed Practice summary has been written successfully.

Conceptually:

```text
validate run and answers
-> calculate result
-> persist completed practice_sessions row transactionally
-> mark run submitted
-> return result
```

If the persistent write fails, the run should remain retryable rather than being incorrectly finalized without history.

### 13.10 In-process concurrency

The in-memory store should use a small in-process locking mechanism so that two simultaneous final submissions for the same run cannot both create completed Practice history.

The exact lock implementation is an internal detail.

The required behavior is:

```text
check submitted state
+
completed-history write
+
submitted transition
```

must be serialized sufficiently for the local single-process MVP.

No distributed lock, Redis, or distributed transaction is required.

### 13.11 Restart limitation

If Flask restarts, unfinished in-memory runs are lost.

A later submission for the lost run returns the contract-defined missing/expired-run response and the learner must start a new Practice.

This is acceptable for the local MVP because unfinished Practice:

- is not Practice History;
- does not contribute to streak;
- has not created a persistent learner score.

A future deployed system may replace the in-memory implementation behind the same conceptual Practice-run interface without changing the learner-facing flow.

---

## 14. Shared Localization Helper

### 14.1 Purpose

Grammar, Vocabulary, Conjugation, Reference, and Practice content repeatedly need support-language-sensitive values.

The localization rule should not be independently reimplemented in every service.

### 14.2 `localization.py`

`app/localization.py` provides small pure helpers for backend localization behavior.

Conceptual responsibilities include:

```text
resolve_support_language(...)
select localized value/title/content where appropriate
```

The helper does not own persistence, HTTP routing, or user preference updates.

### 14.3 Language resolution

Persisted learner support-language values are:

```text
vi
en
```

A newly registered learner may temporarily have:

```text
support_language = null
```

The `null → vi` read-time fallback behavior is defined in FR-LANG-07 (Requirements & Analysis). `localization.py` is the single implementation point for that fallback so it is not reimplemented per-service:

```text
null -> vi fallback (read-time only, never persisted)
vi   -> vi
 en  -> en
```

The `null -> vi` fallback is read-time behavior only.

It must not automatically persist `vi` into the user's preference.

### 14.4 Localized response models

Repositories may return the internal fields required by the service.

Services use the localization helper to construct API-oriented fields such as:

```text
title
content
meaning
example_translation
prompt
explanation
```

The frontend should not normally receive both internal `_vi` and `_en` columns simply because they exist in SQLite.

Where the API Contract permits it, an optional localized title may fall back to `title_fr`.

---

## 15. Backend Testing Strategy

### 15.1 Goal

Backend tests should protect the business rules and integration contracts that would be expensive to discover manually after multiple contributors merge work.

The testing strategy focuses on behavior rather than achieving artificial line-coverage targets.

### 15.2 Tools

Use:

```text
pytest
Flask test client
isolated temporary SQLite database
```

### 15.3 Test isolation

Each test or test group should use an isolated test application created through:

```python
create_app(test_config=...)
```

Tests must not modify the normal development `instance/app.db`.

A test configuration may use a test-only secret value because it is not a real runtime credential.

The Practice run store must also be isolated per test application.

### 15.4 `conftest.py`

`tests/conftest.py` should provide reusable fixtures for:

- test Flask app;
- test client;
- temporary database;
- schema initialization;
- representative seeded test content;
- authenticated learner setup where useful.

Test fixture data should be small and representative rather than requiring the complete final curriculum.

### 15.5 Authentication tests

Test at minimum:

- successful registration;
- normalized email uniqueness;
- password minimum rule;
- automatic session after registration;
- successful login;
- invalid credentials;
- protected endpoint without session;
- current-user resolution;
- logout;
- repeated logout remains successful;
- password hashes never appear in normal user responses.

### 15.6 Learner-state tests

Test at minimum:

- open action updates Continue Learning source state;
- Mark as Learned changes progress source state;
- repeated completion action does not duplicate progress;
- unmark behavior works according to the contract;
- Review Later add/remove behavior;
- Learned and Review Later remain independent;
- learner-state actions do not create Practice History or streak activity.

### 15.7 Practice tests

Test at minimum:

- normal Practice start;
- no correct-answer information at Practice Start;
- Practice unavailable when no usable seeded questions exist;
- Mixed Practice uses learned units only;
- Mixed Practice never widens into unlearned content;
- optional Mixed filters narrow eligible content correctly if implemented;
- selected questions are distinct;
- final submission question set must match the run;
- MCQ scoring;
- Fill Blank matching rules;
- Ordering scoring;
- incomplete Practice rejection;
- run ownership validation;
- completed Practice creates exactly one `practice_sessions` row;
- repeated submission is rejected as already submitted;
- invalid submission creates no history;
- Mixed Practice result derives `content_covered` from the actual selected questions.

### 15.8 Dashboard tests

Test at minimum:

- module progress counts;
- Continue Learning selection;
- Mixed Practice availability;
- Recent Practice ordering;
- normal vs Mixed Recent Practice representation;
- current streak behavior;
- longest streak behavior;
- multiple completed Practice sessions on one day count as one streak day.

Streak tests should use deterministic test data rather than depending on the real current date wherever practical.

### 15.9 Content/API tests

Test representative behavior for:

- Grammar localized detail;
- Vocabulary localized content;
- Conjugation localized detail;
- Reference localized content;
- stable slug lookup;
- support-language fallback when the saved preference is `null`.

### 15.10 Error-contract tests

For important failure paths, assert both:

```text
HTTP status
+
error.code / error envelope shape
```

Do not test only the human-readable message.

### 15.11 Seed validation tests

Seed tests should cover representative failures such as:

- duplicate slug;
- missing required translation;
- unknown parent/reference;
- invalid `sort_order`;
- invalid question type;
- invalid MCQ correct-option count;
- empty Fill Blank accepted answers;
- invalid Ordering pieces;
- unknown learning-unit slug in a question file.

A failed validation test must demonstrate that no partial content write is committed.

---

## 16. Backend Development Workflow

A normal fresh local backend setup is conceptually:

```text
create/activate Python virtual environment
        |
        v
install requirements
        |
        v
set SECRET_KEY environment variable
        |
        v
python init_db.py
        |
        v
python seed.py
        |
        v
flask --app app run --debug
```

Tests run separately through:

```text
pytest
```

Static content changes normally follow:

```text
edit version-controlled source files
-> run seed validation/reseed workflow intentionally
-> verify seed summary
-> run relevant tests
```

Do not manually treat the generated SQLite file as the normal curriculum authoring interface.

---

## 17. Implementation Guardrails

All backend contributors should preserve the following rules.

1. **Use the application factory.** Do not create competing global Flask app instances in feature modules.
2. **Keep routes thin.** HTTP parsing and service invocation belong in routes; business rules do not.
3. **Keep business rules in services.** Do not duplicate authoritative rules in routes, repositories, or React.
4. **Keep SQL in repositories and database/setup code.** Services and routes must not contain feature SQL.
5. **Do not make one repository per table mechanically.** Group repositories by data responsibility.
6. **Do not add `dashboard_repository.py` merely because Dashboard exists.** Dashboard service aggregates existing data sources.
7. **Repositories do not commit independently.** Services own transaction boundaries.
8. **Use parameter binding for SQL values.** Do not concatenate user-controlled values into SQL.
9. **Enable SQLite foreign keys for every application connection.**
10. **Learner identity comes from the Flask session.** Never trust a frontend-supplied `user_id` for learner-owned actions.
11. **Do not expose password hashes.** Keep authentication-only data out of normal API models.
12. **Do not store plaintext passwords.** Use Werkzeug password hashing/verification.
13. **Keep the real `SECRET_KEY` outside committed source code.**
14. **Use the global API error envelope.** Do not invent endpoint-specific top-level error shapes.
15. **Do not leak stack traces, SQL errors, secrets, or internal paths to the frontend.**
16. **Frontend validation does not replace backend validation.**
17. **Do not trust client-calculated Practice score, streak, completion time, or activity date.**
18. **Do not expose correct answers at Practice Start.**
19. **Persist completed Practice only after valid final submission.** Starting a run creates no Practice History.
20. **Prevent duplicate completed history from one Practice run.**
21. **Keep in-progress Practice runs separate from persistent `practice_sessions`.**
22. **Do not persist temporary Practice answers for the MVP.** They remain React interaction state until final submission.
23. **Do not silently wipe learner data during seeding.** Any destructive reset must be explicit.
24. **Static curriculum source files are authoritative before seeding.** Do not use manual edits to `app.db` as the normal content workflow.
25. **Use stable slugs in authored content references.** Do not author source files around generated database IDs.
26. **Do not use database IDs as curriculum order.** Use `sort_order`.
27. **Centralize support-language fallback behavior.** Do not reimplement it independently in each feature.
28. **Do not place business constants in environment configuration without a real environment-specific need.**
29. **Do not introduce JWT, Redis, SQLAlchemy, microservices, or production-scale infrastructure without an explicit architecture change.**
30. **When implementation conflicts with a frozen requirement, database rule, or API contract, resolve the design conflict before allowing competing code paths to become established.**

---

## 18. Change Control

This document is the backend implementation-structure baseline for the MVP.

Before changing the backend structure, determine whether the proposed change affects:

- the `/api/v1` contract;
- database schema or persistence semantics;
- authentication/session behavior;
- business-rule ownership;
- learner-state semantics;
- Practice scoring or finalization;
- static-content source/seed behavior;
- temporary versus persistent state boundaries;
- frontend integration assumptions.

Changes that alter public API behavior, database meaning, or system responsibility boundaries must be coordinated with the corresponding design artifacts before implementation branches diverge.

Internal refactoring is allowed when it preserves the agreed contracts and responsibility boundaries.

Do not reopen frozen Must Have product scope merely to justify a backend technology or abstraction change.

---

## 19. Backend Baseline Summary

The backend implementation baseline is:

```text
                           Flask Application
                                 |
                         create_app(test_config)
                                 |
          +----------------------+----------------------+
          |                      |                      |
          v                      v                      v
      Configuration         Shared helpers         API Blueprints
                              /   |   \
                             /    |    \
                       auth/session |  validation/errors
                                   |
                              localization
                                   |
                                   v
                              Route layer
                                   |
                                   v
                              Service layer
                                   |
                    +--------------+--------------+
                    |                             |
                    v                             v
              Repository layer            Practice run store
                    |                      in-process memory
                    v
                   db.py
                    |
                    v
                 SQLite
```

Persistent data path:

```text
Route
-> Service
-> Repository
-> db.py
-> SQLite
```

Temporary Practice path:

```text
Practice Service
<-> InMemoryPracticeRunStore
```

Static content setup path:

```text
Version-controlled data files
-> load
-> transform
-> validate
-> transactional seed
-> SQLite
```

Core backend ownership:

```text
Routes
-> HTTP boundary

Services
-> business rules and orchestration

Repositories
-> SQL and persistent-data access

db.py
-> connection + transaction infrastructure

auth_session.py
-> Flask session/current-user mechanics

validation.py
-> reusable request-input validation

errors.py
-> consistent API error handling

localization.py
-> shared support-language selection

practice_runs.py
-> temporary in-progress Practice metadata

init_db.py / seed.py
-> deterministic local database setup

tests/
-> business-rule and contract protection
```

This structure is intentionally sufficient for the agreed local MVP. It should remain explicit, testable, and understandable rather than growing additional infrastructure that the current product scope does not require.
