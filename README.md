# Français Learning Journey

A self-paced French-learning web application for **Vietnamese speakers**, built as
a Web Application Development final project. Learners study French through
Grammar lessons, Vocabulary study units and Verb Conjugation lessons, check a
French Alphabet & Accents reference, then test themselves with Practice and
Mixed Practice. A Dashboard shows progress, the current streak and an activity
calendar, and Review Later keeps a personal list of units to revisit. The
interface and the learning support are available in Vietnamese (VI) and English
(EN).

Coding assistants working in this repository must follow [AGENTS.md](AGENTS.md).

## Screenshots

Screenshots have not been added yet. Planned list (to be added):

- [ ] Landing page
- [ ] Login and Register
- [ ] Language setup
- [ ] Dashboard (streak, activity calendar, module progress, Continue Learning)
- [ ] Grammar lesson
- [ ] Vocabulary study unit
- [ ] Conjugation lesson
- [ ] Practice question (multiple choice, fill in the blank, sentence ordering)
- [ ] Practice result
- [ ] Mixed Practice
- [ ] Review Later

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, `react-markdown` + `remark-gfm` (raw HTML disabled), CSS Modules, ESLint, Prettier |
| Backend | Python + Flask (`Flask>=3.1,<4`), `python-dotenv`, `pytest` |
| Database | SQLite through Python's `sqlite3`; no ORM |
| API | REST-style HTTP/JSON under `/api/v1` |
| Authentication | Flask signed session cookie (no JWT) |
| Content | Authored files in `backend/data/`, validated and seeded into SQLite |

```text
React -> /api/v1 HTTP/JSON -> Flask -> SQLite
                                         ^
backend/data/ -> validate / seed --------|
```

Inside Flask: `Route -> Service -> Repository -> db.py -> SQLite`. The frontend
never reads SQLite and never decides scores, streaks, "today" or learner
identity; the backend does.

## Features and status

Status was checked by reading the code on `main`, running the backend tests and
the frontend lint/build/tests. The app was **not** started in a browser while
writing this README, so end-to-end behavior is not verified here.

| Feature | Backend | Frontend (wired to the real API) |
|---|---|---|
| Register, Login, Logout, route guards | Implemented | Implemented |
| Support-language preference (VI/EN) and Language Setup | Implemented | Implemented |
| Dashboard (streak, activity calendar, module progress, Continue Learning, recent Practice) | Implemented | Implemented |
| Grammar lessons | Implemented | Implemented |
| Vocabulary (topics and study units) | Implemented | Implemented |
| Conjugation lessons | Implemented | Implemented |
| Reference (French Alphabet & Accents and other reference pages) | Implemented | Implemented |
| Mark as Learned, Review Later, Continue Learning | Implemented | Implemented |
| Practice (multiple choice, fill in the blank, sentence ordering; final submission, feedback, history) | Implemented | Implemented |
| Mixed Practice (questions drawn from units marked as learned) | Implemented | Implemented |
| Mixed Practice filters | **Not implemented** (the API rejects any `filters` key with `422`) | **Not implemented** (no filter UI) |
| Admin or teacher tools, public hosting, adaptive practice, JWT/ORM/Redis | Not implemented, out of the MVP scope | Not implemented, out of the MVP scope |

The Dashboard, Grammar, Vocabulary, Conjugation, Reference, Practice, Mixed
Practice and Review Later pages are on `main` and call the API through
`frontend/src/api/` (no `feat/frontend-wiring` branch exists on the remote any more).

## Project structure

```text
.
|-- AGENTS.md
|-- README.md
|-- backend/
|   |-- app/
|   |   |-- api/v1/          # Blueprints: auth, me, grammar, vocabulary, conjugation, references, practice
|   |   |-- services/        # business rules
|   |   |-- repositories/    # SQL
|   |   |-- seeding/         # loaders, validators, transforms, writers
|   |   |-- schema.sql       # SQLite schema
|   |   |-- auth_session.py  # session, CSRF same-origin check
|   |   |-- login_rate_limiter.py
|   |   |-- practice_runs.py # in-memory in-progress Practice runs
|   |   |-- clock.py         # server clock, Asia/Ho_Chi_Minh
|   |   `-- config.py, db.py, errors.py, validation.py, localization.py
|   |-- data/                # authored content: grammar, vocabulary, conjugation, reference, questions
|   |-- tests/               # pytest suite (isolated temporary databases)
|   |-- init_db.py
|   |-- seed.py
|   |-- requirements.txt
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- api/             # one module per API area + apiClient.js
|   |   |-- app/             # App, routes, providers, route guards
|   |   |-- components/      # common and navigation components
|   |   |-- context/         # AuthContext
|   |   |-- features/        # auth, dashboard, grammar, vocabulary, conjugation, learning, practice
|   |   |-- hooks/
|   |   |-- i18n/            # VI/EN strings
|   |   |-- layouts/
|   |   `-- pages/
|   |-- tests/               # node:test unit tests
|   |-- public/images/
|   |-- .env.example
|   |-- package.json, package-lock.json, vite.config.js
|   `-- README.md
|-- docs/                    # design baselines
`-- .github/                 # PR template and the Backend CI workflow
```

`backend/instance/`, `backend/.env`, `backend/.venv/`, `frontend/.env.local`,
`frontend/node_modules/` and `frontend/dist/` are created locally and ignored by git.

## Getting started

### Prerequisites

- Git.
- Python **3.12** (the version CI uses). The backend test suite also passed on
  Python 3.11.15 when this README was written.
- Node.js and npm. `npm ci`, lint, build and tests were run with Node 22.22.0 and
  npm 10.9.4. The repository sets no `engines` field, so other versions are not verified.
- No separate database server: SQLite ships with Python.

```bash
git clone https://github.com/nvkhanh029/webapp-francais-learning-journey.git
cd webapp-francais-learning-journey
```

### Backend

Run these from `backend/`. Start the backend first, because the frontend proxies
to it.

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

Windows PowerShell 5.1 (one command per line; PowerShell 5.1 has no `&&`):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

If PowerShell blocks `Activate.ps1`, do not weaken the system-wide policy; call
`.\.venv\Scripts\python.exe` instead of `python` in the commands in this section.

Open `backend/.env` and paste the printed value after `SECRET_KEY=`. Use your own
secret and never commit `.env`. The server will not start normally without it.
`.env.example` also documents the optional `SESSION_COOKIE_SECURE=1` (for HTTPS
behind a TLS-terminating proxy); leave it unset for local HTTP.

Then create and seed the database (the same on every platform), and start Flask:

```bash
python init_db.py
python seed.py
flask --app app run --debug
```

Flask listens on `http://127.0.0.1:5000` by default. Starting the server was
**not verified** while writing this README.

`init_db.py` creates `backend/instance/app.db` and the schema, and keeps existing
data if run again. `seed.py` loads the authored content from `backend/data/`;
it refuses to replace static content that is already seeded.

### Frontend

In a second terminal, from the repository root.

macOS/Linux:

```bash
cd frontend
npm ci
echo "VITE_AUTH_GUARD=on" > .env.local
npm run dev
```

Windows PowerShell 5.1:

```powershell
cd frontend
npm ci
Set-Content -Path .env.local -Value "VITE_AUTH_GUARD=on" -Encoding ascii
npm run dev
```

`VITE_AUTH_GUARD=on` turns on the route guards and the session check against
`GET /api/v1/me`. **With the flag `off` (the default in `.env.example`) the guards
and the session check are skipped and every route is open**, so use `on` for
normal use. Restart `npm run dev` after changing it.

The Vite dev server uses port 5173 by default, and proxies `/api` to
`http://127.0.0.1:5000` (`frontend/vite.config.js`). Open `http://localhost:5173`.
Running the dev server was **not verified** while writing this README.

## Resetting the database

**Warning: this deletes every account and all learner progress, history and streaks.**
Stop Flask first, and back up `backend/instance/app.db` if you might want it back.

macOS/Linux, from `backend/`:

```bash
cp instance/app.db instance/app.db.bak
rm instance/app.db
python init_db.py
python seed.py
```

Windows PowerShell 5.1, from `backend/`:

```powershell
Copy-Item instance\app.db instance\app.db.bak
Remove-Item instance\app.db
python init_db.py
python seed.py
```

There is no `--reset` option and no automatic re-seed over existing content.

Expected `seed.py` summary for the current content (verified by seeding a
throwaway database):

| Content | Count |
|---|---|
| Grammar lessons | 6 |
| Vocabulary study units | 8 (75 entries) |
| Conjugation lessons | 13 |
| Reference pages | 3 |
| Questions | 141 (61 multiple choice, 48 fill in the blank, 32 sentence ordering) |

To check seeding without touching `app.db`, use a new scratch file:

```bash
python init_db.py --database instance/content-check.db
python seed.py --database instance/content-check.db
```

## Tests and quality checks

Run locally, from the folders shown.

Backend (`backend/`, virtual environment active):

```bash
python -m pytest -q
python seed.py --validate-only
```

`seed.py --validate-only` validates the authored sources without opening a
database. Its summary counts question source files (27), not questions; the 141
questions appear in the real seed summary. Tests use temporary databases and never
touch `backend/instance/app.db`.

Frontend (`frontend/`, after `npm ci`):

```bash
npm run lint
npm run build
npm test
```

Last results (clean checkout of `main`): `pytest` 545 passed; `seed.py --validate-only`
passed; `npm ci`, `npm run lint` and `npm run build` succeeded; `npm test` passed
(1 test, `frontend/tests/practiceApi.test.js`).

**What CI runs.** The only workflow is `.github/workflows/backend-ci.yml`
("Backend CI", Python 3.12, on pull requests to `main`, pushes to `main` and manual
runs). It runs `python -m pytest -q` and `python seed.py --validate-only` in
`backend/`.

**What CI does not run.** Frontend install, lint, build and `npm test`, and any
Python linter. Run the frontend checks locally before committing frontend changes.

## API and documentation index

Endpoints, payloads, status codes and error codes are defined in
[docs/api-contracts.md](docs/api-contracts.md). The base path is `/api/v1`; success
responses use `{"data": ...}` and errors use `{"error": {"code", "message", "details"}}`.

| File | Purpose |
|---|---|
| [docs/requirements-and-analysis.md](docs/requirements-and-analysis.md) | MVP scope, roles, product behavior and business rules |
| [docs/system-architecture.md](docs/system-architecture.md) | System layers and responsibility/trust boundaries |
| [docs/database-design.md](docs/database-design.md) | SQLite schema, constraints and content/seed strategy |
| [docs/api-contracts.md](docs/api-contracts.md) | The `/api/v1` contract between React and Flask |
| [docs/backend-structure.md](docs/backend-structure.md) | Flask internal structure |
| [docs/frontend-design.md](docs/frontend-design.md) | Frontend structure, routes, pages and behavior |
| [docs/repository-conventions.md](docs/repository-conventions.md) | Git workflow, branches, commits, ownership |
| [backend/data/README.md](backend/data/README.md) | How content under `backend/data/` is authored |
| [frontend/README.md](frontend/README.md) | Frontend scripts and the auth-guard flag |
| [AGENTS.md](AGENTS.md) | Instructions for coding assistants |

## Security notes

- **Session:** a Flask signed cookie holding only the learner id; `HttpOnly`,
  `SameSite=Lax`, and `Secure` whenever the request arrives over HTTPS (or when
  `SESSION_COOKIE_SECURE=1`). The session lifetime is 24 hours and each request
  renews it, so it is an idle timeout.
- **CSRF:** every `POST`/`PUT`/`PATCH`/`DELETE` must be same-origin, checked from
  the browser's `Sec-Fetch-Site`/`Origin` headers; cross-site requests get `403`
  `csrf_failed`. No token is sent by the frontend. Extra origins can be allowed
  through `CSRF_TRUSTED_ORIGINS` in `backend/app/config.py`.
- **Login rate limit:** after 5 failed logins for one email within 5 minutes
  (20 per client address) the API answers `429` with a `Retry-After` header.
- Passwords are stored hashed; the learner id comes from the session, never from
  the client; Practice score, streak and dates are computed by the server.
- Keep `SECRET_KEY` out of source control.

## Known limitations

- Sentence Ordering questions have no source sentence to translate: the contract
  has no field for it, so the learner orders the French items from an instruction.
- Fill-in-the-blank answers are matched after trimming and case folding only, so
  they are strict on accents (`é` is not `e`).
- Login lockout is per email: someone who keeps failing for an email address
  locks that address out for the window. The rate limiter and the in-progress
  Practice runs live in process memory, so limits are per process and are lost on
  restart.
- Some content has no English title (for example the Conjugation lesson
  `futur-simple-futur-proche`). How every screen falls back was not verified.
- The UI loads Google Fonts (Be Vietnam Pro, Nunito Sans, Material Symbols) from
  the network; offline, fonts and icons fall back to browser defaults (not verified offline).
- Mixed Practice filters are not implemented.
- Local development and demonstration only; no public hosting.

## Team and license

Team and responsibilities (as stated by the project lead). "Responsible for" means
module ownership. One person now implements and approves everything, see
[AGENTS.md](AGENTS.md) section 5 for the original plan versus the actual split.

| Member | Responsible for |
|---|---|
| Nguyễn Vân Khánh / Project Lead | Ideas, design documents (`docs/`) and the project skeleton. Backend: shared components (schema, seed, configuration, shared structure) and the Reference page content; later integration work (Vietnam-time clock, session hardening, CSRF check, login rate limit, Dashboard "today", activity calendar, Reference index). Frontend: the whole interface; main owner of the React foundation (app structure, shared components, i18n) and API integration (API client, authentication, route guards, wiring pages to the backend) |
| Nguyễn An Khánh | Backend: Authentication (Auth) and Dashboard |
| Phí Lê Bảo Linh | Backend: the Grammar module in full (code, content and quiz questions) |
| Trần Ngọc Hải | Backend: the Vocabulary module in full (code, content and quiz questions) and the Conjugation content. Frontend: supports the React and API integration work |
| Ngô Tuấn Duy | Backend: code for Reference and Conjugation (no content) |
| Nguyễn Danh Kiên | Backend: code for Practice and Mixed Practice (no content) |

The team used AI assistants (Claude, Claude Code) for coding, documentation and testing.

License: to be added (the repository has no license file).

Workflow: short-lived branches from `main`, reviewed pull requests, Squash and
merge; see [docs/repository-conventions.md](docs/repository-conventions.md).
