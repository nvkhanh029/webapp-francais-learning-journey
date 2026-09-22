# French Learning Web Application
## Repository Conventions and Integration Rules Specification

**Document status:** Baseline v1.0  
**Project type:** Web Application Development final project  
**Repository model:** Single Git repository with `frontend/`, `backend/`, and `docs/` boundaries  
**Frontend:** React + Vite  
**Backend:** Python + Flask  
**Persistent database:** SQLite  
**API base path:** `/api/v1`  
**Primary Git branch:** `main`  
**Preferred merge strategy:** Squash and merge  
**Deployment target:** Local development and local demonstration  

---

## 1. Purpose

This document defines the repository-wide implementation conventions and integration rules for the French Learning Web Application MVP.

It provides one shared baseline for how contributors organize files, name code and data, work with Git, manage local configuration, integrate the React frontend with the Flask backend, divide ownership across the six-person team, and merge independently developed work safely.

The document is intended to be used by all contributors, including AI-assisted coding workflows. Implementation should follow these conventions unless the team explicitly approves a change.

This specification does not replace the more detailed design artifacts for requirements, architecture, database structure, API behavior, backend structure, or frontend design. Instead, it defines the repository-level rules that allow those artifacts to be implemented consistently in one codebase.

---

## 2. Scope and Guiding Principles

### 2.1 Scope

This document defines:

- top-level repository organization;
- naming conventions across React/JavaScript, Python, API, database, content files, and Git branches;
- Git branch, commit, Pull Request, and merge conventions;
- environment, dependency, generated-file, and secret-management rules;
- frontend-backend communication and integration boundaries;
- six-member team ownership;
- merge readiness and integration checkpoints;
- repository-wide implementation guardrails.

Detailed frontend folders such as pages, components, hooks, context/state, and feature-level UI organization remain governed by the Frontend Design specification once finalized.

Detailed backend folders and responsibilities remain governed by the Backend Application Structure specification.

### 2.2 Guiding principles

The repository conventions should:

- remain simple enough for a six-person student project;
- keep frontend, backend, authored content, and documentation clearly separated;
- preserve the API as the stable React-Flask integration boundary;
- allow contributors to work on vertical feature slices independently;
- keep `main` runnable as work is integrated progressively;
- avoid committing machine-specific or generated files;
- make local setup reproducible for every contributor;
- prevent silent divergence between implementation and frozen design baselines;
- avoid unnecessary production-scale tooling or branching complexity.

The project intentionally does not introduce additional monorepo frameworks, release branches, Docker orchestration, generated API clients, or other infrastructure unless a later project need justifies them.

---

# 3. Repository Organization

## 3.1 Repository model

The project uses one Git repository.

The top-level boundaries are:

```text
frontend/
backend/
docs/
```

The frontend and backend remain separate application areas even though they live in the same repository. Their integration occurs through the `/api/v1` HTTP API rather than through direct module imports or shared database access.

This structure keeps local development simple while preserving clear architectural boundaries.

## 3.2 Recommended repository baseline

```text
french-learning-app/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── seeding/
│   │   └── ...
│   ├── data/
│   ├── instance/
│   ├── tests/
│   ├── .env.example
│   ├── init_db.py
│   ├── seed.py
│   └── requirements.txt
│
├── docs/
│   ├── requirements-and-analysis.md
│   ├── system-architecture.md
│   ├── database-design.md
│   ├── api-contracts.md
│   ├── backend-structure.md
│   ├── frontend-design.md
│   └── repository-conventions.md
│
├── .github/
│   └── pull_request_template.md
├── .editorconfig
├── .gitignore
└── README.md
```

The exact internal backend structure follows `backend-structure.md`.

The exact internal frontend structure should not be duplicated here; it will follow `frontend-design.md`.

## 3.3 Root-level responsibilities

### `README.md`

The root README is the human entry point to the repository.

It should contain only the information needed to understand and run the project, including:

- project summary;
- technology stack;
- high-level repository structure;
- prerequisites;
- frontend setup and run commands;
- backend setup and run commands;
- database initialization and seed commands;
- location of detailed design documents;
- contribution workflow summary.

It should not duplicate full API, database, or backend specifications.

### `docs/`

`docs/` contains the implementation baselines and project design specifications.

These documents are the authoritative references when implementation questions involve product requirements, architecture, persistence semantics, public API behavior, backend organization, frontend organization, or repository rules.

### `.github/`

The repository may use `.github/pull_request_template.md` to standardize Pull Request descriptions.

Additional GitHub-specific automation is optional and should be introduced only when useful.

## 3.4 No root package manager abstraction is required

The current project does not require a root `package.json`, Turborepo, Nx, or similar monorepo tooling.

Dependency ownership remains simple:

```text
frontend/package.json
backend/requirements.txt
```

Each application area manages its own dependencies.

---

# 4. Naming Conventions

## 4.1 General rule

The project does not force one naming style across every technology.

Each ecosystem uses a convention appropriate to that technology, while equivalent concepts remain semantically consistent across the project.

## 4.2 Repository directories and documentation

General directories use lowercase names:

```text
frontend/
backend/
docs/
components/
pages/
services/
repositories/
tests/
data/
```

Multi-word path names use `kebab-case` where needed:

```text
mixed-practice/
learning-state/
```

Documentation filenames use `kebab-case`:

```text
system-architecture.md
api-contracts.md
backend-structure.md
frontend-design.md
repository-conventions.md
```

Do not mix spaces, camelCase, snake_case, and PascalCase for equivalent documentation filenames.

## 4.3 React component and page names

React components and pages use `PascalCase`.

Examples:

```text
DashboardPage.jsx
LoginPage.jsx
PracticePage.jsx
PracticeResult.jsx
ProgressCard.jsx
NavigationBar.jsx
```

Component identifiers follow the same style:

```js
function DashboardPage() {
  // ...
}
```

## 4.4 React custom hooks

Custom hooks use the `useCamelCase` pattern.

Examples:

```text
useAuth.js
usePractice.js
useSupportLanguage.js
```

Examples of identifiers:

```text
useAuth
usePractice
useDashboard
```

## 4.5 JavaScript variables and functions

Normal JavaScript variables and functions use `camelCase`.

Examples:

```text
currentUser
supportLanguage
practiceResult
loadDashboard
submitPractice
formatAccuracy
```

Boolean values should use descriptive prefixes when practical:

```text
isAuthenticated
isLearned
isLoading
isSubmitted
hasQuestions
hasError
canStartPractice
```

## 4.6 JavaScript constants

True application constants use `UPPER_SNAKE_CASE`.

Examples:

```text
API_BASE_PATH
DEFAULT_LANGUAGE
```

The use of JavaScript `const` alone does not require an uppercase name. Local values that are not reassigned should still follow normal `camelCase` naming.

## 4.7 Context and provider names

React contexts and providers use `PascalCase`.

Examples:

```text
AuthContext
LanguageContext
AuthProvider
```

## 4.8 Non-component JavaScript files

Non-component JavaScript modules use `camelCase` filenames.

Examples:

```text
apiClient.js
authApi.js
practiceApi.js
dateUtils.js
routeHelpers.js
```

## 4.9 CSS names

Plain CSS class names use `kebab-case`.

Examples:

```text
practice-card
practice-result
navigation-item
```

If CSS Modules are selected by the Frontend Design, component-scoped CSS files should match their component name, for example:

```text
PracticeCard.module.css
DashboardPage.module.css
```

The decision to use CSS Modules belongs to the Frontend Design and is not fixed by this document.

## 4.10 Python modules, functions, and variables

Python filenames/modules, functions, and variables use `snake_case`.

Examples:

```text
auth_service.py
learning_state_service.py
practice_runs.py
user_repository.py
get_current_user
calculate_streak
support_language
practice_run_id
```

## 4.11 Python classes

Python classes use `PascalCase`.

Examples:

```text
Config
InMemoryPracticeRunStore
```

## 4.12 Python constants

True Python constants use `UPPER_SNAKE_CASE`.

Examples:

```text
MIXED_PRACTICE_TARGET_SIZE
SUPPORTED_LANGUAGES
```

Business constants should remain near the business logic that owns them rather than being moved into environment configuration merely because they are constants.

## 4.13 Backend tests

Backend test modules use the `test_*.py` convention.

Examples:

```text
test_auth.py
test_practice.py
test_dashboard.py
test_learning_state.py
```

## 4.14 Frontend tests

If frontend automated tests are introduced, test files should use a consistent colocated or test-directory convention such as:

```text
LoginPage.test.jsx
PracticeResult.test.jsx
apiClient.test.js
```

The selected frontend test framework and final placement belong to the Frontend Design/testing setup.

## 4.15 Database naming

Database tables and columns use `snake_case`.

Examples:

```text
users
learning_units
user_learning_state
practice_sessions
support_language
learning_unit_id
completed_at
correct_count
sort_order
```

Existing database names defined by the Database Design must not be renamed merely to match frontend JavaScript naming.

## 4.16 API path naming

API path segments use lowercase names and `kebab-case` for multi-word concepts.

Examples:

```text
/api/v1/learning-units/{slug}/practice/start
/api/v1/mixed-practice/start
/api/v1/me/review-later
```

Do not use camelCase, PascalCase, or snake_case path segments for new API routes.

## 4.17 API JSON naming

API request and response fields use `snake_case`, consistent with the frozen API Contract.

Examples:

```text
support_language
practice_type
correct_count
total_questions
learning_unit
```

Frontend local variables may use `camelCase` when useful, but the wire contract itself remains `snake_case`.

## 4.18 Content slugs

Stable content slugs use lowercase `kebab-case`.

Examples:

```text
articles-definis
present-regular-er
metiers-professions-1
alimentation-1
```

Published/used slugs should remain stable because they are used in navigation, authored references, and API paths.

## 4.19 Environment variables

Environment variable names use `UPPER_SNAKE_CASE`.

Examples:

```text
SECRET_KEY
FLASK_APP
```

Frontend Vite variables, if later introduced, must follow Vite's `VITE_*` convention and must not contain secrets.

## 4.20 Abbreviations

Use descriptive names rather than unnecessary abbreviations.

Prefer:

```text
practiceSession
learning_unit_id
```

over:

```text
pracSess
lu_id
```

Common technical abbreviations such as `id`, `api`, `url`, and `db` are acceptable.

---

# 5. Git Workflow and Conventions

## 5.1 Long-lived branch model

The project uses one long-lived integration branch:

```text
main
```

A permanent `dev`/`develop` branch is not required for the current project.

Normal work occurs on short-lived branches that are merged into `main` through Pull Requests.

Conceptually:

```text
feature/*
fix/*
docs/*
refactor/*
test/*
chore/*
content/*
     |
     | Pull Request
     v
    main
```

## 5.2 Meaning of `main`

`main` represents the integrated, review-passed, runnable repository state.

Not every capability on `main` must already have both frontend and backend implementations. Backend capabilities may be merged independently when they satisfy their own contract and test requirements.

However, `main` must not knowingly contain broken integration, missing imports, invalid setup, unresolved merge conflicts, or production code that depends on non-existent prerequisites.

## 5.3 Branch naming

Short-lived branches use the following prefixes:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
refactor/<short-description>
test/<short-description>
chore/<short-description>
content/<short-description>
```

Examples:

```text
feature/login-page
feature/mixed-practice
feature/grammar-api
fix/practice-scoring
docs/frontend-design
refactor/auth-service
test/auth-endpoints
chore/project-scaffold
content/grammar-basics
content/vocabulary-food
content/present-tense-questions
```

The description after `/` uses `kebab-case`.

Branch names should describe the work, not the contributor.

Avoid names such as:

```text
huyen-branch
member-2
new
final
final2
test-branch
```

## 5.4 Branch creation

New work should normally begin from the latest `main`.

Conceptually:

```text
latest main
    |
    +--> short-lived task branch
```

Long dependency chains of feature branches should be avoided when practical.

## 5.5 Branch scope

One branch and one Pull Request should represent one coherent change.

A branch may include multiple files and multiple architectural layers when they belong to the same feature.

For example, a backend Practice feature may legitimately modify its route, service, repository, runtime store, and tests in the same PR.

Unrelated features should not be bundled into one branch merely because the same contributor is implementing them.

## 5.6 Commit message format

Commit messages follow a simplified Conventional Commits format:

```text
<type>(optional-scope): <short description>
```

Supported types:

```text
feat
fix
docs
refactor
test
chore
```

Examples:

```text
feat(auth): add login endpoint
feat(practice): add mixed practice start flow
fix(dashboard): correct streak calculation
docs(api): clarify practice submit contract
refactor(auth): move validation into service
test(practice): add submission scoring tests
chore: update gitignore
```

Commit messages should be written in English for consistency with source code, filenames, API terminology, and project documentation.

## 5.7 Commit scope

A commit should represent one logical change that can be explained clearly in one sentence.

Avoid meaningless commit descriptions such as:

```text
update
fix
done
final
new code
abc
```

Intermediate commits are allowed on task branches, but the final Pull Request should have a coherent purpose.

## 5.8 Pull Request requirement

Normal changes enter `main` through Pull Requests.

Direct pushes to `main` are not part of the normal workflow.

A Pull Request should be focused enough to review, test, and revert without including unrelated work.

## 5.9 Pull Request title

Pull Request titles should follow the same type-based naming style as commit messages when practical.

Examples:

```text
feat(auth): implement login flow
fix(practice): prevent duplicate submission
docs(repo): define repository workflow
content(grammar): add article demo lessons
```

This keeps squash-merged history readable.

## 5.10 Pull Request description baseline

The repository may use the following template:

```md
## Summary
What does this PR change?

## Related Area
Frontend / Backend / Database / Content / Docs

## Testing
- [ ] Relevant tests pass
- [ ] Application runs locally
- [ ] Manual flow checked where applicable

## Contract / Design Changes
- [ ] No contract/design change
- [ ] Relevant documentation updated
```

## 5.11 Review baseline

Normal PRs should receive at least one teammate review before merge when an appropriate reviewer is available.

The project lead should review changes that affect:

- API contracts;
- database design or persistence semantics;
- system architecture;
- repository-wide configuration;
- cross-feature integration rules;
- frozen requirements.

Trivial documentation corrections or non-functional cleanup may use lighter review when the project lead determines that additional review would add little value.

## 5.12 Merge method

The preferred merge method for normal task PRs is:

```text
Squash and merge
```

This keeps `main` history focused on completed changes rather than preserving every intermediate branch commit.

Rebase-based workflows are not required for the current team.

## 5.13 Branch cleanup

Merged short-lived branches should be deleted.

The repository should not accumulate obsolete completed feature branches.

## 5.14 Synchronizing a branch with `main`

If `main` changes while a contributor is working, the contributor should synchronize the latest `main` into the task branch before merging when those changes affect integration.

For the current team, merging latest `main` into a task branch is acceptable and simpler than requiring history-rewriting rebase workflows.

Force-pushing shared or protected branches should be avoided.

## 5.15 Protected `main`

When repository settings allow it, `main` should be protected against accidental direct changes.

Recommended protections include:

- require a Pull Request before merge;
- require at least one approval for normal PRs;
- require conversation resolution where supported;
- block force pushes;
- block branch deletion;
- require the automated backend status check once the CI workflow has run successfully and the check is available in GitHub.

CI is used in this repository to run automated backend checks on Pull Requests and selected pushes.

Once the CI workflow has run successfully at least once, the corresponding backend test status check should be added as a required status check for `main`.

---

# 6. Environment, Dependencies, and Generated Files

## 6.1 Core rule

Files that define shared source, configuration, dependency requirements, or reproducible setup are version controlled.

Files that contain secrets, machine-specific state, installed dependencies, generated build output, runtime databases, or caches are not committed.

## 6.2 Backend environment file

Local backend secrets may be stored in:

```text
backend/.env
```

The real `.env` file is local only and must not be committed.

The repository should commit:

```text
backend/.env.example
```

Example:

```env
SECRET_KEY=replace-with-your-local-secret
```

Each contributor creates their own `backend/.env` from the example template.

## 6.3 Flask `SECRET_KEY`

`SECRET_KEY` must come from the runtime environment and must never be hard-coded or committed.

Missing required secret configuration should fail clearly during backend startup rather than silently using an insecure default.

## 6.4 Frontend environment variables

The MVP frontend does not require an API base URL environment variable.

Frontend application code calls relative paths under:

```text
/api/v1/...
```

The Vite development proxy forwards `/api` requests to Flask.

If Vite environment variables are introduced later, values prefixed with `VITE_` must be treated as client-visible configuration and must never contain secrets.

## 6.5 Backend `config.py`

`backend/app/config.py` contains safe application defaults that vary by runtime environment.

Examples include:

```python
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False
```

Machine-specific absolute paths and secrets must not be hard-coded there.

Business rules that are not environment-dependent should remain with the business logic that owns them rather than being moved into environment configuration.

## 6.6 Database path

The generated SQLite database is located at:

```text
backend/instance/app.db
```

The path should be derived from the Flask application instance path rather than from a machine-specific absolute filesystem path.

## 6.7 Debug mode

Debug behavior should be selected at runtime for development.

Do not hard-code a permanent `DEBUG = True` application setting.

## 6.8 Python virtual environment

The recommended local Python virtual environment is:

```text
backend/.venv/
```

It is local machine state and must not be committed.

Every contributor creates their own environment and installs dependencies from the committed backend dependency definition.

## 6.9 Python dependency manifest

The repository commits:

```text
backend/requirements.txt
```

Conceptually:

```text
requirements.txt
    -> install
    -> local .venv/
```

The manifest is version-controlled; the installed environment is not.

## 6.10 Frontend dependencies

The repository commits:

```text
frontend/package.json
frontend/package-lock.json
```

The repository does not commit:

```text
frontend/node_modules/
```

Conceptually:

```text
package.json + package-lock.json
    -> npm install / npm ci
    -> local node_modules/
```

When a contributor intentionally adds or changes an npm dependency, both `package.json` and the resulting `package-lock.json` should be committed together.

## 6.11 Frontend build output

Generated Vite build output is not committed:

```text
frontend/dist/
```

Build output should be recreated from committed source and dependency definitions.

## 6.12 Static content versus generated SQLite state

Version-controlled authored content lives under:

```text
backend/data/
├── grammar/
├── vocabulary/
├── conjugation/
├── reference/
└── questions/
```

These source files are committed.

Generated runtime database state is not committed:

```text
backend/instance/app.db
```

The expected flow is:

```text
schema + source content
        |
        v
init_db.py + seed.py
        |
        v
backend/instance/app.db
```

Contributors should not use manual edits to `app.db` as the normal content-authoring workflow.

## 6.13 Caches, test artifacts, and logs

Generated files such as the following should not be committed:

```text
__pycache__/
*.pyc
.pytest_cache/
.coverage
htmlcov/
*.log
```

## 6.14 Project-wide `.gitignore`

The monorepo uses one root `.gitignore` as the primary project-wide ignore source.

A baseline is:

```gitignore
# Environment / secrets
**/.env
**/.env.*
!**/.env.example

# Frontend dependencies and build output
frontend/node_modules/
frontend/dist/
frontend/coverage/

# Backend virtual environment and runtime data
backend/.venv/
backend/instance/

# Python generated files
__pycache__/
*.py[cod]
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log

# OS-generated files
.DS_Store
Thumbs.db
```

Generated tools may initially create nested `.gitignore` files. The project scaffold should consolidate rules into the root file where practical so contributors have one obvious location for project-wide ignore behavior.

## 6.15 `.editorconfig`

The repository should commit a root `.editorconfig` for shared whitespace, encoding, and line-ending behavior.

A simple baseline may include:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
```

File-type-specific indentation may be added when needed.

## 6.16 Vite proxy configuration

`frontend/vite.config.js` is committed shared integration configuration.

During local development, it should proxy `/api` requests to the local Flask server.

Conceptually:

```js
server: {
  proxy: {
    "/api": {
      target: "http://127.0.0.1:5000"
    }
  }
}
```

Application components must not repeat or hard-code the backend origin.

---

# 7. Frontend-Backend Integration Rules

## 7.1 Authoritative integration boundary

The API Contract is the authoritative frontend-backend integration specification.

Runtime communication follows:

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
    | SQL when persistent data is required
    v
SQLite
```

The frontend must not access SQLite, backend repositories, or Python modules directly.

## 7.2 Relative API paths

Frontend application code uses relative API paths:

```text
/api/v1/...
```

Do not hard-code a normal local backend origin such as:

```text
http://127.0.0.1:5000
http://localhost:5000
```

inside components or feature code.

## 7.3 Shared frontend API layer

HTTP communication should be centralized in a shared frontend API layer rather than reimplemented independently in every page/component.

Conceptually:

```text
Page / Component
      |
      v
Feature API function
      |
      v
Shared API client
      |
      v
fetch()
```

The exact frontend folder placement is defined by the Frontend Design.

## 7.4 Shared API client responsibility

The shared API client should centralize common HTTP behavior such as:

- `/api/v1` base-path handling;
- JSON request headers;
- session-cookie request behavior;
- JSON parsing;
- HTTP success/error detection;
- API error normalization;
- network failure normalization.

The shared client must not own backend business rules such as Practice scoring, streak calculation, or Mixed Practice eligibility.

## 7.5 Success envelope

Frontend code consumes the shared API success envelope defined by the API Contract:

```json
{
  "data": {}
}
```

Individual endpoints must not invent incompatible success wrappers.

## 7.6 Error envelope

Frontend code consumes the shared API error envelope:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human-readable fallback message.",
    "details": {}
  }
}
```

Frontend control logic should use stable `error.code` values rather than comparing exact human-readable error-message text.

## 7.7 HTTP status handling

Frontend request handling must inspect HTTP success/status explicitly.

A request library call resolving successfully at the network level does not imply that the server returned a successful HTTP status.

The shared API layer should retain enough normalized information for feature code to distinguish relevant statuses and error codes.

## 7.8 Authentication

Authentication uses the Flask session cookie.

The frontend does not create, persist, or send JWT/bearer tokens for the MVP.

The browser carries the session cookie for same-origin `/api/v1/...` requests through the Vite proxy.

Frontend authentication state must ultimately be derived from the backend session, for example through the current-user API, rather than from a client-only `loggedIn` flag.

## 7.9 Learner identity

Learner-owned operations do not accept a frontend-provided `user_id` as identity authority.

Flask resolves the authenticated learner from the server-side session.

Frontend requests use `/me/...` endpoints where defined by the API Contract.

## 7.10 Slugs and learner-facing identifiers

Stable content slugs are used for learner-facing navigation and content lookup where defined by the API Contract.

Database primary keys are not used as a substitute for stable learner-facing navigation identifiers.

## 7.11 API models, not database models

The frontend consumes API response models rather than raw SQLite rows or database table shapes.

For localized content, the backend returns the localized API fields defined by the contract rather than requiring React to select raw `_vi`/`_en` database columns.

## 7.12 Frontend versus backend validation

Frontend validation may improve usability and provide immediate feedback.

Backend validation remains authoritative for security-sensitive, persistence-sensitive, and business-sensitive behavior.

Frontend validation must never be treated as a replacement for backend validation.

## 7.13 Parallel development against the contract

Frontend and backend contributors may work in parallel when both implement the frozen API Contract.

Conceptually:

```text
             API Contract
             /          \
            /            \
       Frontend          Backend
       implements        implements
            \            /
             \          /
              Integration
```

## 7.14 Temporary frontend mock data

Temporary frontend fixtures or mocks are allowed while an endpoint is not yet available.

Mock response shapes must match the API Contract rather than introducing frontend-specific unofficial response models.

Temporary mocks may support component development or tests, but final production integration must use the real backend API.

A feature should not be considered integrated while its production path still depends on fake data.

## 7.15 Contract changes

If implementation reveals that a contract change is necessary, neither frontend nor backend should silently introduce an incompatible shape.

The expected change flow is:

```text
discover integration need
        |
        v
check requirement/design impact
        |
        v
agree contract change
        |
        v
update affected design documents
        |
        v
frontend/backend implement the same contract
```

Breaking changes include, for example:

- endpoint path or HTTP method changes;
- removed or renamed response fields;
- field-type changes;
- new required request fields;
- changed success/error envelope behavior;
- changed authentication semantics;
- changed status-code meaning.

## 7.16 Independent backend completion

A backend endpoint may be reviewed and merged before a frontend consumer exists when it:

- matches the API Contract;
- validates requests correctly;
- enforces the required authentication and business rules;
- reads/writes persistence correctly;
- returns the documented success/error structures and status codes;
- passes relevant backend tests;
- can be exercised independently through automated tests or an HTTP client.

Backend completion and full learner-facing feature integration are separate milestones.

## 7.17 Real integration check

Once both frontend and backend exist, the feature must be exercised through the real stack.

For persistent state, integration checks should verify that state remains correct after refresh/reload rather than only after local React state changes.

---

# 8. Team Ownership

## 8.1 Ownership model

The project has six contributors.

Ownership is organized primarily by vertical feature slice rather than by technical layer.

A feature owner is expected to understand and remain responsible for the feature across its backend, frontend, and integration stages.

Ownership defines primary responsibility and review accountability; it does not create exclusive file permissions.

Shared backend infrastructure is treated as cross-cutting foundation rather than as a separate feature stream. The Project Lead coordinates this foundation, while affected feature owners may modify shared files when their feature requires a coherent change.

## 8.2 Six-member ownership baseline

| Member | Primary feature stream | Additional responsibility |
|---|---|---|
| **Member 1 - Project Lead** | Auth and User Preferences | Shared Backend Foundation; architecture/docs/integration coordination |
| **Member 2** | Dashboard and Learning State | - |
| **Member 3** | Grammar | Primary Content/Data Owner for authored demo content and quiz data |
| **Member 4** | Vocabulary | - |
| **Member 5** | Conjugation and Reference | - |
| **Member 6** | Practice and Mixed Practice | Practice runtime-state ownership |

Actual contributor names may replace the member labels in team planning material without changing the ownership model.

## 8.3 Member 1 - Project Lead: Auth, User Preferences, and Shared Backend Foundation

Primary API area:

```text
POST  /api/v1/auth/register
POST  /api/v1/auth/login
POST  /api/v1/auth/logout
GET   /api/v1/me
PATCH /api/v1/me/preferences
```

Primary feature backend chain includes the relevant auth/current-user routes, services, repositories, session handling, validation, and tests.

`backend/app/auth_session.py` belongs directly to this feature ownership because it implements the agreed Flask session/current-user mechanics used by Auth and protected learner endpoints.

Later frontend ownership includes registration/login flows, authenticated-user state, and support-language preference/setup behavior as defined by the Frontend Design.

In addition to the Auth feature stream, the Project Lead is the primary coordinator for shared backend foundation that is not naturally owned by one feature, including:

```text
backend/app/__init__.py
backend/app/config.py
backend/app/db.py
backend/app/errors.py
backend/app/validation.py
backend/app/localization.py
backend/init_db.py
backend/app/schema.sql
backend/seed.py
backend/app/seeding/
```

The initial repository scaffold already provides baseline implementations or structures for these areas. Project Lead responsibility is to keep them consistent with the approved design and coordinate cross-feature changes; it does not mean recreating them for each feature or becoming the only contributor allowed to edit them.

When a feature requires a shared-foundation change, the affected feature owner may implement that change as part of the same coherent task. The Project Lead should coordinate or review meaningful changes because they can affect multiple feature streams.

Examples include:

- Vocabulary-specific seed transformation changes coordinated with Member 4;
- authored-question validation changes coordinated with Member 6;
- Grammar source-loading requirements coordinated with Member 3;
- schema-semantic changes coordinated with every affected feature owner before implementation.

The Project Lead also coordinates:

- frozen design baselines;
- API/database/architecture change decisions;
- repository conventions;
- shared integration decisions;
- repository-wide setup changes;
- final integration and demo readiness.

## 8.4 Member 2 - Dashboard and Learning State

Primary API area:

```text
GET   /api/v1/me/dashboard
POST  /api/v1/me/learning-units/{slug}/open
PATCH /api/v1/me/learning-units/{slug}/state
GET   /api/v1/me/review-later
```

This ownership includes the relevant learner-state persistence, dashboard aggregation, review-later behavior, continue-learning/open behavior, and related tests.

Later frontend ownership includes Dashboard and learner-state interactions defined by the Frontend Design.

## 8.5 Member 3 - Grammar and Content/Data ownership

Primary Grammar API area:

```text
GET /api/v1/grammar
GET /api/v1/grammar/lessons/{slug}
```

Member 3 owns the Grammar route/service/repository/test chain and later the Grammar frontend slice.

Member 3 is also the primary Content/Data Owner for authored demonstration content under:

```text
backend/data/
├── grammar/
├── vocabulary/
├── conjugation/
├── reference/
└── questions/
```

The content scope is representative demo content rather than a complete French curriculum.

The dataset should be sufficient to demonstrate the required content structures and core behavior, including representative Grammar, Vocabulary, Conjugation, Reference content, the three Practice question types, normal Practice, Mixed Practice, and VI/EN support where required.

## 8.6 Content/Data Owner boundaries

The Content/Data Owner owns authored source content, not the persistence/runtime engine itself.

The role does not independently own:

- `schema.sql`;
- database table design;
- `seed.py` implementation;
- seeding loaders/validators/transforms/writers;
- Practice scoring code;
- API route contracts;
- generated `app.db` state.

If authored content requires a new technical field or structure, the Content/Data Owner raises the requirement to the relevant feature owner and Project Lead before changing the data model.

## 8.7 Member 4 - Vocabulary

Primary API area:

```text
GET /api/v1/vocabulary
GET /api/v1/vocabulary/topics/{topic_slug}
GET /api/v1/vocabulary/study-units/{slug}
```

Member 4 owns the Vocabulary route/service/repository/test chain and later the Vocabulary frontend slice.

Member 4 also helps define/confirm the technical source-data requirements that the Content/Data Owner must follow for Vocabulary authored content.

If Vocabulary behavior requires a change to shared seed transformation or validation logic, Member 4 may implement the required change in the shared seed infrastructure with Project Lead coordination/review.

## 8.8 Member 5 - Conjugation and Reference

Primary API area:

```text
GET /api/v1/conjugation
GET /api/v1/conjugation/lessons/{slug}
GET /api/v1/references/{slug}
```

Member 5 owns the relevant Conjugation and Reference backend chains, tests, and later frontend slices.

Member 5 helps define/confirm the technical source-data requirements for authored Conjugation and Reference content.

If these features require a coherent shared loader/validator/seed change, Member 5 may implement it with Project Lead coordination/review.

## 8.9 Member 6 - Practice and Mixed Practice

Primary API area:

```text
POST /api/v1/learning-units/{slug}/practice/start
POST /api/v1/mixed-practice/start
POST /api/v1/practice/runs/{practice_run_id}/submit
```

Member 6 owns the Practice route/service/repository/runtime-store/test chain, including:

- normal Practice start behavior;
- Mixed Practice selection and eligibility;
- temporary Practice run state;
- answer validation;
- scoring;
- final submission;
- completed Practice persistence;
- duplicate-submission prevention;
- related history/streak effects defined by the approved design.

`backend/app/practice_runs.py` belongs primarily to Member 6 because it is Practice-specific runtime infrastructure rather than general repository-wide infrastructure.

Later frontend ownership includes the Practice interaction flow and results presentation defined by the Frontend Design.

Member 6 also helps define/confirm the technical authored-question format that the Content/Data Owner follows. If question-source validation requires shared seed-validator changes, Member 6 may implement them with Project Lead coordination/review.

## 8.10 Feature ownership spans backend layers

Backend ownership is not divided so that one contributor only writes routes, another only writes services, and another only writes repositories.

A feature owner may modify all layers needed for that feature:

```text
Route
  -> Service
  -> Repository
  -> Database/runtime state
  -> Tests
```

Later, the same contributor continues through:

```text
React UI
  -> Frontend API layer
  -> Real backend endpoint
```

This vertical-slice model is intentional so every contributor understands one complete system path.

A feature may also require a small change to shared infrastructure. Such a change should remain part of the same coherent feature task when appropriate, while receiving the coordination/review required for shared areas.

## 8.11 Content source versus seed engine ownership

Responsibility is separated as follows:

```text
backend/data/
-> Content/Data Owner (Member 3)

backend/seed.py
backend/app/seeding/
-> Shared backend implementation
-> Project Lead coordinates
-> Affected feature owner may implement required feature-specific changes
```

The Content/Data Owner maintains valid authored source files.

The shared seed implementation maintains the mechanisms that load, transform, validate, and write those sources into SQLite.

The Project Lead provides primary coordination for the seed engine because it affects multiple content areas, but seed implementation is not exclusive to the Project Lead. Affected feature owners should make or review feature-specific seed changes when they are the people best placed to verify the behavior.

The Content/Data Owner does not automatically become responsible for seed-engine code merely because the authored source files live under `backend/data/`.

## 8.12 Shared file ownership

Shared or cross-cutting files require coordination rather than exclusive ownership.

| Area | Primary coordination / ownership |
|---|---|
| `frontend/` | Relevant frontend/feature owner after Frontend Design |
| `backend/app/api/v1/` | Relevant feature owner |
| `backend/app/services/` | Relevant feature owner |
| `backend/app/repositories/` | Relevant feature owner |
| `backend/tests/` | Relevant feature owner; shared fixtures coordinated when cross-cutting |
| `backend/data/` | Member 3 - Content/Data Owner |
| `backend/app/__init__.py`, `config.py`, `db.py`, `errors.py`, `validation.py`, `localization.py` | Project Lead - Shared Backend Foundation coordination |
| `backend/app/auth_session.py` | Member 1 - Auth and User Preferences |
| `backend/app/practice_runs.py` | Member 6 - Practice and Mixed Practice |
| `backend/init_db.py` | Project Lead - Shared Backend Foundation coordination |
| `backend/seed.py`, `backend/app/seeding/` | Project Lead coordination + affected feature owner(s) |
| `backend/app/schema.sql` | Project Lead + affected backend owner(s) for semantic changes |
| `docs/api-contracts.md` | Project Lead + affected frontend/backend owners |
| `docs/database-design.md` | Project Lead + affected backend owners |
| `docs/system-architecture.md` | Project Lead + affected owners |
| `docs/frontend-design.md` | Project Lead + affected frontend owners |
| root `.gitignore`, `.editorconfig`, `README.md`, `AGENTS.md` | Project Lead/shared review |

## 8.13 Editing outside a primary ownership area

Contributors may edit files outside their primary area when a coherent change requires it.

Meaningful changes to another owner's area should be reviewed by or coordinated with that owner.

Meaningful changes to shared backend foundation should be coordinated with the Project Lead and any directly affected feature owner.

Ownership exists to improve consistency and accountability, not to block collaboration or create a single-person bottleneck.

## 8.14 `CODEOWNERS`

A GitHub `CODEOWNERS` file is optional and is not required for the current six-person team.

Manual reviewer assignment and the ownership table in this document are sufficient unless the team later finds automated review routing useful.

---

# 9. Merge and Integration Rules

## 9.1 Merge readiness versus full feature completion

A change may be merge-ready before its entire learner-facing vertical slice is complete.

In particular:

```text
Backend implementation complete
        !=
Full learner-facing feature integrated
```

Backend completion means the backend capability is independently correct and contract-compatible.

Full feature integration means the real React frontend calls the real Flask backend and the complete behavior works through the system.

## 9.2 `main` must remain runnable

Every merge must preserve a runnable repository state.

It is acceptable for `main` to contain completed backend endpoints that do not yet have frontend consumers.

It is not acceptable to merge code that knowingly breaks startup, imports, build behavior, database setup, or existing working integration.

## 9.3 Backend Definition of Done

A backend PR is merge-ready when all applicable items are satisfied:

- implementation matches the frozen Requirements, System Architecture, Database Design, API Contract, and Backend Structure;
- the route/service/repository/runtime chain works as designed;
- relevant validation and business rules are enforced;
- relevant backend tests pass;
- API paths, methods, status codes, success envelopes, and error envelopes match the contract;
- Flask can still start;
- database initialization/seeding still works when affected;
- no secrets, runtime databases, installed dependencies, or other generated local files are committed.

Frontend implementation is not required for backend merge readiness.

## 9.4 Content/Data Definition of Done

A content PR is merge-ready when applicable checks are satisfied:

- source files use the approved structure;
- required fields are present;
- slugs and cross-references are valid;
- seed validation succeeds;
- seeding can complete successfully;
- representative demo content required by the PR exists;
- quiz answer keys and ordering data are internally consistent;
- generated `app.db` state is not committed.

Technical validation does not replace human review of French spelling, translations, question clarity, or answer correctness.

## 9.5 Frontend Definition of Done

Once frontend development begins, a frontend PR is merge-ready when applicable checks are satisfied:

- implementation follows the Frontend Design;
- backend calls use the shared frontend API layer;
- API consumption matches the frozen contract;
- the frontend build succeeds;
- relevant loading/error states are handled;
- production feature code does not depend on temporary fake data;
- required backend endpoints already exist on `main` when the frontend PR depends on them.

## 9.6 Feature Integration Definition of Done

A cross-boundary feature is integrated only after the real frontend and backend have been exercised together.

For persistence-sensitive behavior, integration should verify that state remains correct after page refresh or a new request rather than relying only on temporary React state.

## 9.7 Dependency order

Prerequisites should be integrated before dependent work.

Conceptually:

```text
dependency PR
    |
    v
   main
    |
    v
dependent branch updates from main
    |
    v
dependent PR
```

Contributors should avoid duplicating another feature's logic merely because its prerequisite branch has not yet merged.

## 9.8 Shared-file conflicts

If a task branch conflicts with new work on `main`, the contributor should:

```text
sync latest main
-> resolve conflict on the task branch
-> re-run affected tests/checks
-> push the resolved branch
-> continue review/merge
```

Conflict resolution involving another contributor's logic should be coordinated with that contributor when necessary.

Do not resolve conflicts by blindly choosing one side without understanding the semantic change.

## 9.9 API, schema, requirement, and architecture changes

Changes that affect public API behavior, database meaning, frozen requirements, or responsibility boundaries are special cases.

Expected flow:

```text
identify design conflict or required change
        |
        v
Project Lead + affected owner(s) review
        |
        v
update relevant baseline document(s)
        |
        v
implement compatible changes
        |
        v
test and merge
```

Implementation should not silently establish a competing source of truth while documentation remains outdated.

Internal refactoring is allowed when it preserves the approved contracts and responsibility boundaries.

## 9.10 Progressive integration

Independent feature PRs should be merged progressively when they are ready.

The team should not wait until the end of the project to combine six large branches at once.

Small, coherent, independently tested PRs reduce merge risk and allow later contributors to work from a more complete `main` baseline.

## 9.11 Integration checkpoints

Recommended project checkpoints are:

```text
Checkpoint A
Repository scaffold + database init/seed runnable

Checkpoint B
Backend feature PRs progressively merged

Checkpoint C
Backend + representative demo content work together

Checkpoint D
Frontend shared foundation merged

Checkpoint E
Each frontend vertical slice integrates with its real backend

Checkpoint F
Full MVP smoke test before submission/demo
```

These are team checkpoints, not additional permanent branches.

## 9.12 Final MVP smoke test

Before `main` is considered demo-ready, the team should verify a representative end-to-end learner flow such as:

```text
register / login
      |
      v
choose support language
      |
      v
browse Grammar / Vocabulary / Conjugation
      |
      v
open a learning unit
      |
      v
mark learned / review later
      |
      v
normal Practice
      |
      v
submit + result
      |
      v
Dashboard updates
      |
      v
Mixed Practice
      |
      v
logout / login again
      |
      v
persistent state remains correct
```

Detailed automated tests remain responsible for finer-grained backend behavior; the smoke test verifies that the major layers connect correctly.

## 9.13 Vertical owner responsibility through integration

A feature owner's responsibility does not stop when the backend PR merges.

The expected lifecycle is:

```text
Backend implementation
        |
        v
Frontend implementation
        |
        v
Real frontend-backend integration
        |
        v
Feature complete
```

This rule supports the project goal that each contributor understands one complete web-application flow rather than only one technical layer.

## 9.14 Stage definitions

| Stage | Definition of Done |
|---|---|
| Backend | Contract-compatible endpoint/business logic/tests merged |
| Content | Valid authored source + successful seed workflow |
| Frontend | UI implemented against the real agreed contract |
| Feature Integration | Real React-Flask flow works |
| MVP Integration | Representative end-to-end learner flow works |

---

# 10. Repository Implementation Guardrails

All contributors should preserve the following repository-wide rules:

1. Use one repository with clear `frontend/`, `backend/`, and `docs/` boundaries.
2. Do not make React depend directly on SQLite, Python modules, backend repositories, or raw database rows.
3. Use the frozen `/api/v1` contract as the frontend-backend integration boundary.
4. Use relative `/api/v1/...` requests through the Vite development proxy; do not scatter backend origins across frontend code.
5. Centralize frontend HTTP behavior through the shared API layer once the Frontend Design is implemented.
6. Preserve the shared `{ "data": ... }` success envelope and `{ "error": ... }` error envelope.
7. Use Flask session authentication; do not introduce JWT/bearer-token authentication without an approved architecture change.
8. Never treat a frontend-provided `user_id` as authoritative learner identity.
9. Keep backend validation authoritative even when frontend validation exists.
10. Keep secrets out of committed code and files; use runtime environment variables and a safe `.env.example` template.
11. Commit dependency manifests and lock files; do not commit installed dependencies or local virtual environments.
12. Commit authored static content under `backend/data/`; do not commit generated `backend/instance/app.db`.
13. Do not manually edit generated SQLite state as the normal curriculum-authoring workflow.
14. Use one long-lived `main` branch and short-lived typed task branches.
15. Use focused Pull Requests and prefer Squash and merge.
16. Do not silently change API contracts, database semantics, or architecture boundaries during implementation.
17. Organize team ownership by vertical feature slice rather than by Flask architectural layer.
18. Member 3 is the primary authored Content/Data Owner; feature owners remain responsible for the technical data requirements of their own feature.
19. Backend PRs may merge before frontend implementation when they are independently contract-correct and tested.
20. Frontend code that depends on an endpoint should not be merged as final production integration before the compatible backend capability exists on `main`.
21. Resolve shared-file conflicts on task branches and re-test before merge.
22. Integrate progressively; do not postpone all cross-team merging until the end of the project.
23. Each feature owner remains responsible through real frontend-backend integration.
24. Keep project tooling proportional to the MVP; do not add monorepo frameworks, release-branch complexity, CI infrastructure, container orchestration, or other tooling without a concrete need.

---

# 11. Baseline Summary

The repository baseline is intentionally lightweight:

```text
One Git repository
|
+-- frontend/     React + Vite
|
+-- backend/      Flask + SQLite + authored source-content pipeline
|
+-- docs/         frozen design and implementation specifications
|
+-- main          single long-lived integration branch
```

Normal contribution flow:

```text
latest main
    |
    v
short-lived typed branch
    |
    v
focused implementation
    |
    v
relevant tests / validation
    |
    v
Pull Request + review
    |
    v
Squash and merge
    |
    v
main remains runnable
```

Team implementation is organized into six vertical ownership streams so each contributor can follow one feature across backend, frontend, and real integration.

Static authored learning content is maintained separately from generated SQLite runtime data, and one primary Content/Data Owner maintains the representative demo dataset while feature owners define the technical requirements their data must satisfy.

The API Contract remains the stable integration agreement between React and Flask. Repository conventions exist to preserve that agreement, reduce unnecessary merge conflict, and keep implementation reproducible and understandable throughout the project.

This document is the repository-level implementation baseline for the MVP. Changes to these conventions should be deliberate, coordinated, and proportionate to a concrete project need.
