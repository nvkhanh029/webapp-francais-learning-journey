# Français Learning Journey

A self-paced French-learning web application developed as a Web Application
Development final project. The planned learner experience combines Grammar,
Vocabulary and Verb Conjugation, with Vietnamese/English learning support.

**Current phase: backend-only development. This repository is a shared scaffold,
not the completed application.** Frontend Design and learner-facing feature
implementation are still team tasks.

## Project status

| Area | What is present |
|---|---|
| Repository | Six design baselines, AGENTS.md, ignore/editor settings, PR template and backend CI configuration |
| Backend foundation | Flask application factory, seven Blueprint shells, database/session/error/validation/localization helpers, in-memory Practice run store |
| SQLite | The 17-table schema and a non-destructive initialization command |
| Content preparation | Authoring templates, source validation, Vocabulary splitting and transactional fresh-database seed |
| Feature implementation | Auth, preferences, Dashboard, learner state, content endpoints and Practice business logic are **not implemented** |
| Curriculum | Templates only. The Content/Data Owner supplies approved demo content |
| Frontend | Intentionally deferred; `frontend/README.md` only |
| Verification | See [scaffold status and verification](docs/scaffold-status.md); a passing foundation check is not feature acceptance |

Existing files must be inspected and extended, not recreated in parallel.
Coding assistants must follow [AGENTS.md](AGENTS.md).

## Planned MVP capabilities

- Learner registration, login/logout and a saved VI/EN support-language preference.
- Free browsing of Grammar lessons, Vocabulary Study Units and Conjugation rule/pattern lessons; an Alphabet & Accents reference.
- Mark as Learned, Review Later, Continue Learning and Dashboard progress.
- Normal Practice and Mixed Practice from learned content, with Multiple Choice,
  Fill in the Blank and Sentence Ordering; final submission and answer feedback.
- Basic completed-Practice summaries, current streak and longest streak.

These are scope commitments, **not a list of already working features**.
Optional/Future features remain excluded unless the project lead opens them.

## Technology and architecture

| Concern | Approved direction |
|---|---|
| Frontend (later) | React + Vite, HTML/CSS/JavaScript |
| Backend | Python + Flask |
| Persistence | SQLite through Python `sqlite3`, no ORM |
| Interface | REST-style HTTP/JSON under `/api/v1` |
| Authentication | Flask session cookie, not JWT |
| Demonstration | Local development/local demonstration |

```text
React (later) -> /api/v1 HTTP/JSON -> Flask -> SQLite
                                      ^
backend/data/ -> load / validate / seed |
```

Inside Flask: `Route -> Service -> Repository -> db.py -> SQLite`.
Frontend must never read SQLite or decide authoritative scores/learner identity.

## Repository structure

```text
.
|-- AGENTS.md
|-- README.md
|-- backend/
|   |-- app/                 # factory, shared helpers, schema and feature placeholders
|   |   |-- api/v1/
|   |   |-- services/
|   |   |-- repositories/
|   |   `-- seeding/
|   |-- data/                # version-controlled templates and authored content
|   |-- tests/               # isolated foundation tests; feature test placeholders
|   |-- .env.example
|   |-- init_db.py
|   |-- seed.py
|   |-- pytest.ini
|   `-- requirements.txt
|-- frontend/                # deferred
|-- docs/                    # design baselines and operational notes
|-- .github/                 # PR template and backend-tests workflow
|-- .gitignore
`-- .editorconfig
```

`backend/instance/`, `backend/.env` and `.venv/` are created locally and ignored.

## Getting started - backend only

### 1. Prerequisites

Use Git and Python **3.12** for the team/CI baseline. The supplied foundation
also has partial verification on Python 3.13; see the verification note.
Node.js/npm and a running frontend are **not required in this phase**.
SQLite is provided by Python's standard library; no separate DB server is needed.

### 2. Clone or open the repository

For a new clone:

```bash
git clone https://github.com/nvkhanh029/webapp-francais-learning-journey.git
cd francais-learning-journey
```

### 3. Create and activate a virtual environment

From the repository root:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

```bat
.venv\Scripts\activate.bat
```

macOS/Linux:

```bash
source .venv/bin/activate
```

When PowerShell blocks activation, do not weaken a system-wide security policy.
Use `.\.venv\Scripts\python.exe` in place of `python` in the following commands,
or use Command Prompt activation. On macOS/Linux, `python3` may be needed to
create the environment; the activated environment supplies `python`.

### 4. Install the backend dependencies

All following commands run from **`backend/`**, with its environment active:

```bash
python -m pip install -r requirements.txt
```

The manifest uses the same bounded Flask/python-dotenv/pytest dependency ranges
as the previous scaffold. It is not a fully locked transitive dependency tree.
Do not commit `.venv/` or install project packages into the system Python.

### 5. Create local secret configuration

Copy the template **once**; do not overwrite an existing local `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bat
REM Windows Command Prompt
copy .env.example .env
```

```bash
# macOS/Linux
cp .env.example .env
```

Generate a value locally:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste the output after `SECRET_KEY=` in `backend/.env`. Each contributor uses
an individual local secret. Do not put it in source code, screenshots, a PR,
a chat prompt, or committed files. Missing/blank secrets make normal Flask
startup fail; test fixtures supply their own test-only value.

### 6. Initialize the database and check source data

```bash
python init_db.py
python seed.py --validate-only
python seed.py
```

The first command creates `backend/instance/app.db` and its schema. Repeating
initialization preserves existing data; it does not migrate changed tables.

Only `_template` files ship in this scaffold. An initial seed therefore prints
**"No authored content found"** and zero records. That is expected at this stage;
it is not evidence that demo content is ready.

Once approved source content is added, seeding a fresh initialized database
loads it. If static content already exists, the seed refuses to replace it.
**There is no `--reset`, automatic upsert or destructive reseed command in v3.**

For read-only content checks, use `python seed.py --validate-only`; it does not
open a database and it prints generated learning-unit slugs for question refs.

For a one-off seed check without touching learner data, choose a **new scratch
filename** under `instance/`:

```bash
python init_db.py --database instance/content-check.db
python seed.py --database instance/content-check.db
```

That filename must be fresh/empty. Do not delete or reset the real `app.db` to
make a check pass. Replacing a real development DB requires an explicit backup
and coordinated action with Flask stopped; tooling for this is deferred.

### 7. Run the foundation tests

```bash
python -m pytest -q
```

Run the entire suite before handoff/PR. Do not exclude Flask-marked tests to make
CI green. Tests use temporary databases and synthetic fixture content; they do
not depend on how many final lessons the Content Owner has authored.

The feature test files marked TODO are not completed tests. Each member must add
the tests required by their own API/business rules before merging that feature.

### 8. Start Flask

```bash
python -m flask --app app run --debug --port 5000
```

Keep the terminal open. This is a local development server only.
No learner-facing endpoints or HTML page are implemented by the scaffold.
Opening `/` therefore returns JSON **404**, not a landing page. A 404 at an
unimplemented endpoint does not mean its feature is ready or broken integration;
check the feature's implementation status first.

Do not run a Vite server or `npm install` yet. Frontend setup will be documented
when Frontend Design is finalized and implementation is authorized.

### Setup success checklist

- Dependency installation succeeds in the local virtual environment.
- `init_db.py` creates the expected schema without overwriting learner data.
- Source validation passes; zero canonical records are expected until content is added.
- **The full** `python -m pytest -q` suite passes after installing dependencies.
- Flask starts with the local `SECRET_KEY` and returns the shared JSON error envelope.

A successful setup does not implement Auth, Dashboard, Practice or any other
vertical feature. Those remain assigned team work.

## Content authoring

Start with [backend/data/README.md](backend/data/README.md). It defines the concrete
source-field mapping and templates for the Database Design's content strategy.
In particular, Vocabulary keeps string `category`, `topic`, `subtopic` and root
`topic_slug`; explicit keys/order fields complete the conceptual example.

The Content/Data Owner provides approved demo material. Tests contain synthetic
labels only; neither test fixtures nor templates are final curriculum.
After editing content, run:

```bash
python seed.py --validate-only
python -m pytest -q
```

## Team and development workflow

| Member | Vertical feature responsibility |
|---|---|
| Nguyễn Vân Khánh / Project Lead | Auth and User Preferences; shared design/integration coordination |
| Nguyễn An Khánh | Dashboard and Learning State |
| Phí Lê Bảo Linh | Grammar; primary owner of all authored demo content and quiz data |
| Trần Ngọc Hải | Vocabulary |
| Ngô Tuấn Duy | Conjugation and Reference |
| Nguyễn Danh Kiên | Practice and Mixed Practice |

Each member continues through their backend, tests, later frontend and real
integration. Shared files are coordinated, not independently reimplemented.

Use `main` plus short-lived task branches. New work starts from current `main`;
normal changes enter through a reviewed PR and **Squash and merge**. No permanent
`dev` branch is needed. Never force-push or rewrite shared history.

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/grammar-backend
```

Commit example: `feat(grammar): implement lesson detail endpoint`.
Content branch example: `content/demo-curriculum`; commit example:
`feat(content): add reviewed demo lessons`. `content/` is a branch prefix; use
one of the six supported commit types in Repository Conventions Section 5.6.

## Documentation

[AGENTS.md](AGENTS.md) is the coding-assistant entry point. It explains the reading
gate, ownership, prepared scaffold, scope limits and required handoff checks.

## Academic scope

The demo needs representative content, not a complete French course. No public
hosting, teacher/admin tools, JWT/ORM/Redis, adaptive practice or full per-question
history has been added. Only use learning material approved by the project lead.
