# AGENTS.md

Operational instructions for coding AI working in this repository.

## 0. Current implementation phase: BACKEND ONLY

- Work on `backend/` only unless Vân Khánh explicitly authorizes frontend work.
- Do not implement, scaffold, refactor, or "prepare" frontend pages, components, routes, state, API clients, styles, mocks, dependencies, or Vite configuration yet.
- `frontend-design.md` is not an active implementation baseline until it is finalized.
- Backend work may be completed and merged without a frontend consumer if it satisfies the backend Definition of Done.

## 1. Documentation gate: no coding before all required baselines are available and read

For the current backend-only phase, do **not** begin coding until you can access and have read all of these files in full:

1. `requirements-and-analysis.md`
2. `system-architecture.md`
3. `database-design.md`
4. `api-contracts.md`
5. `backend-structure.md`
6. `repository-conventions.md`

At the start of a new coding session, verify that all six files are actually available to you. If working through a chat/coding assistant and one or more files have not been provided or cannot be opened, **stop and ask the contributor to send/upload the missing `.md` files before doing any implementation work**. Do not start from partial excerpts, memory, assumptions, or another contributor's summary.

Until the documentation gate is satisfied, do not:

- write or modify implementation code;
- scaffold new application files;
- propose a concrete patch as if the design were known;
- change schema, API behavior, dependencies, or architecture;
- infer missing requirements from general best practices.

Reading only the document that appears directly related to the assigned feature is not sufficient. The required baselines define cross-cutting constraints and must all be read before the first code change.

`docs/frontend-design.md` is **not** part of the current backend gate because it is not finalized and frontend work is not authorized. Once Vân Khánh declares the Frontend Design finalized and explicitly opens frontend development, it becomes an additional required baseline that must also be provided/read before frontend coding begins.

After the documentation gate is satisfied, use the baselines in this order when checking a task:

1. `docs/requirements-and-analysis.md`
2. `docs/system-architecture.md`
3. `docs/database-design.md`
4. `docs/api-contracts.md`
5. `docs/backend-structure.md`
6. `docs/frontend-design.md` - only after finalized and frontend work is authorized
7. `docs/repository-conventions.md`

Authority by concern:

| Concern | Source of truth |
|---|---|
| MVP scope, product behavior, business rules | Requirements & Analysis |
| System/responsibility/trust boundaries | System Architecture |
| Schema, constraints, persistence meaning | Database Design |
| `/api/v1` methods, paths, payloads, status codes, envelopes | API Contracts |
| Flask internal structure | Backend Structure |
| Frontend internal structure | Frontend Design once finalized |
| Git, repository, ownership, integration workflow | Repository Conventions |

If two baselines genuinely conflict, do not invent a resolution. Report the conflict to Vân Khánh.

### 1.1 Source boundary: do not autonomously fill gaps from the internet or model knowledge

The repository baselines and approved project source files are the authority for this project. **Missing project information is a blocker, not permission to research or invent a replacement.**

Unless Vân Khánh explicitly requests or approves external research for the current task, do **not** use web search, online tutorials, blogs, Stack Overflow, GitHub examples, other repositories, AI-generated references, textbooks not supplied to the project, or other external sources to define or expand:

- product scope or feature behavior;
- learning flows or business rules;
- architecture or responsibility boundaries;
- database schema or persistence semantics;
- API endpoints, payloads, error behavior, or authentication semantics;
- repository workflow or ownership rules;
- French curriculum structure or learning content;
- Grammar explanations, Vocabulary lists/meanings, Conjugation content, examples, translations, IPA, quiz prompts, answer keys, distractors, or accepted answers.

For authored learning content under `backend/data/`, use only:

1. source material already present in the repository/project;
2. source material explicitly supplied by the contributor for the task; or
3. an external source explicitly approved by Vân Khánh for that task.

If required learning content or a factual content source is missing, **stop and ask the contributor/Vân Khánh for the approved source**. Do not search the internet to fill the gap, even if the information seems standard or obvious.

General programming knowledge may be used only to implement the already-approved design. It must not be used to silently add features, change contracts, redesign the schema, alter business rules, or manufacture project content.

External technical documentation may be consulted only when all of the following are true:

- the six-document gate has already been satisfied;
- the task is already within approved scope;
- the lookup is only to understand the behavior/syntax of an already-approved technology or dependency;
- the external information does not override or reinterpret a project baseline; and
- no new dependency, architecture, public contract, or scope change is introduced from that lookup.

Prefer official documentation for such technical lookups. If an external source reveals that the documented design cannot be implemented as written, report the conflict to Vân Khánh instead of silently changing the design.

Do not cite external research as justification for overriding project docs. Do not treat “industry best practice” as a higher authority than an explicit project decision.

## 2. Scope control

The docs define the MVP. Do not expand or redefine scope on your own.

You may make ordinary implementation decisions without asking when they:

- stay inside documented behavior;
- preserve API/schema/architecture semantics;
- use the simplest compatible approach;
- do not add unnecessary dependencies or infrastructure.

Stop and ask Vân Khánh before implementing any change that would alter:

- MVP features, roles, flows, or business rules;
- API method/path/request/response/error/status/auth behavior;
- database schema meaning or persistence semantics;
- system responsibility/trust boundaries;
- authentication/session model;
- Practice scoring/finalization semantics;
- repository-wide architecture/workflow conventions;
- frontend architecture before its design is finalized.

A request from another contributor that contradicts the frozen docs is a change request, not permission to bypass them.

Approved design changes must update the relevant baseline document(s) before or with the code change. Do not let implementation become a competing source of truth.

Internal refactoring is allowed when externally observable behavior, persistence meaning, and documented boundaries stay unchanged.

## 3. Before editing

Before each task:

1. Run `git status` and identify the current branch.
2. Do not overwrite, revert, or reformat unrelated work.
3. Read the relevant docs above and confirm the documentation gate is satisfied.
4. Confirm the task does not depend on missing learning/content information that would require an unapproved external source.
5. Inspect existing implementation and tests before adding files/abstractions.
6. Identify the feature owner and any shared files affected.
7. Confirm the task does not require an unapproved contract/schema/scope/architecture change.
8. Prefer the smallest coherent change that fully solves the task.

For ambiguity that does not affect a frozen contract or boundary, choose the simplest compatible implementation and proceed. Escalate only when the decision changes scope, public behavior, persistence meaning, architecture, or ownership.

## 4. Backend setup / run / test

Run backend commands from `backend/`.

Fresh setup:

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Create local `backend/.env` from `.env.example` and set a real local `SECRET_KEY`. Never commit the real `.env` or secret.

For a fresh/reset local database only:

```bash
python init_db.py
python seed.py
```

Do not run destructive reset/reseed operations blindly against local learner data.

Run Flask:

```bash
flask --app app run --debug
```

Run tests:

```bash
pytest
```

For static-content changes: edit `backend/data/` -> run seed validation/reseed intentionally -> inspect the seed summary -> run relevant tests.

Tests must use isolated test databases, never normal `backend/instance/app.db`.

## 5. Ownership and shared areas

Ownership is by vertical feature slice, not by Flask layer. It defines primary responsibility/review accountability, not exclusive file permissions.

| Owner | Primary feature stream |
|---|---|
| Vân Khánh / Project Lead | Auth + User Preferences; architecture/docs/integration coordination |
| Member 2 | Dashboard + Learning State |
| Member 3 | Grammar; primary Content/Data Owner |
| Member 4 | Vocabulary |
| Member 5 | Conjugation + Reference |
| Member 6 | Practice + Mixed Practice |

A feature owner may change the route, service, repository/runtime state, and tests required by that feature.

Coordinate shared areas:

- `backend/data/` -> Content/Data Owner; feature owners define technical data requirements.
- `backend/seed.py`, `backend/app/seeding/` -> backend implementation owner(s).
- `backend/app/schema.sql` -> affected backend/database owner + Vân Khánh for semantic changes.
- API/DB/architecture docs -> Vân Khánh + affected owner(s).
- root `.gitignore`, `.editorconfig`, `README.md` -> Project Lead/shared review.

Meaningful changes in another owner's area should be coordinated with or reviewed by that owner.

## 6. Architectural guardrails

Preserve this backend path:

```text
HTTP request -> Route/Blueprint -> Service -> Repository -> db.py -> SQLite
```

Core rules:

- Use `create_app(test_config=None)`; do not create competing global Flask apps in feature modules.
- Routes stay thin: HTTP input/auth context -> service -> contract response.
- Business rules belong in services.
- Feature SQL belongs in repositories/database setup code, not routes/services.
- Repositories are grouped by data responsibility, not mechanically one file per table.
- Services own transaction boundaries; repository writes do not independently `commit()`.
- Use SQLite parameter binding; never interpolate user-controlled values into SQL.
- Enable `PRAGMA foreign_keys = ON` on every application connection.
- Backend validation remains authoritative.
- Learner identity comes from the Flask session; never trust client-provided `user_id`.
- Passwords are hashed; never store plaintext or expose password hashes.
- Keep `SECRET_KEY` outside committed source.
- Do not trust client-calculated Practice score, streak, completion time, activity date, or learner identity.
- In-progress Practice run metadata stays in the server-side in-memory store for the MVP.
- Starting Practice creates no Practice History; persist history only after valid final submission.
- Prevent duplicate completed history for one Practice run.
- Do not expose correct answers at Practice Start.
- `backend/data/` is the authoring source for static curriculum/question content; SQLite is the seeded runtime store.
- Do not manually edit generated `app.db` as the normal content workflow.
- Use stable slugs for authored/navigation identity and `sort_order` for curriculum order.
- Seed validation must happen before writes; validation failure must not leave partial seeded state.
- Do not silently wipe learner data during seeding.
- Do not generate or import French learning content from external/web sources unless Vân Khánh explicitly approves that source for the task. Missing content must be escalated, not auto-filled.

Do not introduce JWT, Flask-Login, SQLAlchemy/ORM, Redis, microservices, queues/background infrastructure, Docker/orchestration, migration frameworks, or other production-scale tooling without an approved architecture change.

## 7. API and database rules

The API Contract is the stable React-Flask boundary.

- Base path: `/api/v1`.
- Match documented methods, paths, parameters, payloads, status codes, and business rules exactly.
- JSON fields use `snake_case`.
- Success envelope: `{"data": ...}`.
- Error envelope: `{"error": {"code": ..., "message": ..., "details": ...}}`.
- Do not expose raw SQLite rows as API models.
- Do not silently add/remove/rename/change contract fields or HTTP semantics.
- Do not leak stack traces, SQL errors, secrets, hashes, internal paths, or implementation details.
- Use stable slugs for learner-facing content lookup where the contract defines them.

`docs/database-design.md` defines database meaning; `backend/app/schema.sql` implements it. Do not change tables, relationships, constraints, nullable/required semantics, slug identity, learner-state meaning, Practice-history/streak semantics, or static-vs-runtime boundaries as incidental implementation details.

If a feature needs a new field/relationship or a changed contract, follow the change-approval flow in Section 2.

## 8. Files that must not be committed

Never commit secrets, machine-local state, installed dependencies, generated runtime/build output, caches, or logs.

At minimum:

```text
**/.env
**/.env.*              except **/.env.example
backend/.venv/
backend/instance/
frontend/node_modules/
frontend/dist/
frontend/coverage/
__pycache__/
*.py[cod]
.pytest_cache/
.coverage
htmlcov/
*.log
.DS_Store
Thumbs.db
```

Especially never commit `backend/.env` or `backend/instance/app.db`.

Before handoff/commit, inspect `git status` and confirm generated/local files are not staged.

## 9. Git / commit / PR rules

- `main` is the only long-lived integration branch. Do not create a permanent `dev`/`develop` branch unless the baseline is deliberately changed.
- Start work from the latest `main`.
- Use short-lived branches: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`, `content/` + kebab-case description.
- One branch/PR = one coherent change.
- Normal changes enter `main` through Pull Requests; direct push to `main` is not normal workflow.
- Preferred merge method: **Squash and merge**.
- Delete merged short-lived branches.
- If relevant `main` changes landed, sync the task branch, resolve conflicts there, and rerun affected checks.
- Do not resolve semantic conflicts by blindly choosing one side.
- Every merge must leave `main` runnable.

Commit messages use simplified Conventional Commits in English:

```text
<type>(optional-scope): <short description>
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

Examples:

```text
feat(auth): add login endpoint
fix(practice): prevent duplicate submission
test(dashboard): add streak cases
chore: update gitignore
```

Avoid messages such as `update`, `fix`, `done`, `final`, or `new code`.

Normal PRs should have at least one teammate review when available. Vân Khánh should review API, database-semantic, architecture, repository-wide config/integration, or frozen-requirement changes.

AI agents must not commit, push, force-push, merge, or open a PR unless the user explicitly asks for that Git action.

## 10. Definition of Done

A backend change is ready for handoff/PR only when all applicable checks pass:

- [ ] Stays within documented MVP scope.
- [ ] Uses only approved project/content sources; no unapproved web-derived learning content or inferred requirements were introduced.
- [ ] Matches relevant Requirements, Architecture, Database, API, and Backend Structure rules.
- [ ] Preserves route -> service -> repository/runtime responsibility boundaries.
- [ ] Enforces relevant validation, authorization, ownership, and business rules server-side.
- [ ] API method/path/status/payload/envelope behavior matches the contract.
- [ ] Relevant tests were added/updated and pass.
- [ ] Flask still starts.
- [ ] `python init_db.py` / `python seed.py` still work when DB/content/seeding was affected.
- [ ] Seed validation is clean when authored content was affected.
- [ ] No secrets, runtime DBs, virtualenvs, dependencies, caches, logs, or generated output are staged.
- [ ] `git diff` contains only intended task changes.
- [ ] Any approved contract/schema/architecture/scope change has matching baseline-doc updates.
- [ ] Shared/cross-owner changes received required coordination/review.
- [ ] Merge would keep `main` runnable.

Frontend implementation is **not** required for backend completion during the current backend-only phase.

## 11. AI handoff

When finishing a task, report concisely:

1. what changed;
2. files changed;
3. tests/checks run and results;
4. any approved contract/schema/doc change;
5. blockers or required human decisions;
6. a recommended Conventional Commit message.

Do not turn optional redesign ideas into required follow-up work when the existing documented design is sufficient.
