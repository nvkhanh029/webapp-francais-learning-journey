# Français Learning Journey

## Introduction

**Français Learning Journey** is a self-paced French-learning web application
developed as a final project for a Web Application Development course. It is
designed for Vietnamese speakers learning French, with the user interface and
learning support available in both Vietnamese (VI) and English (EN).

The application follows a simple pedagogical flow: learn freely, practise,
receive feedback, track progress, and maintain a regular study habit. It defines
a single user role, the learner, and places no prerequisite restrictions on
content — all lessons may be browsed freely. The authoritative product scope and
business rules are specified in
[docs/requirements-and-analysis.md](docs/requirements-and-analysis.md).

## Objectives

- Provide an accessible, topic-based way to study French outside a rigid
  course sequence.
- Cover three core learning areas: Grammar, Vocabulary, and Verb Conjugation,
  with a French Alphabet & Accents reference.
- Support self-assessment through Practice and Mixed Practice with structured
  feedback.
- Help learners sustain progress through Dashboard statistics, streaks, and a
  Review Later list.

## Key features

- Account registration, login and logout; VI/EN support-language preference.
- Grammar lessons, Vocabulary topics and study units, and Conjugation lessons.
- Mark as Learned, Review Later, and Continue Learning.
- Practice quizzes (multiple choice, fill in the blank, sentence ordering)
  with final submission, feedback, and history.
- Mixed Practice drawn from previously learned units.
- Dashboard with module progress, current and longest streaks, activity
  calendar, and recent Practice.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, CSS Modules |
| Backend | Python + Flask, `pytest` |
| Database | SQLite via Python `sqlite3`; no ORM |
| API | REST-style HTTP/JSON under `/api/v1` |
| Authentication | Flask signed session cookie (no JWT) |
| Content | Authored files in `backend/data/`, validated and seeded into SQLite |

System interaction:

```text
React -> /api/v1 HTTP/JSON -> Flask -> SQLite
```

Within the backend, requests flow through
`Route → Service → Repository → db.py → SQLite`. The frontend does not access
the database and does not determine scores, streaks, dates, or learner identity;
these are computed authoritatively by the backend.

## Repository structure

```text
.
|-- backend/    # Flask application, SQLite schema, authored content, tests, seed scripts
|-- frontend/   # Learner-facing UI implemented in React + Vite
|-- docs/       # Design baselines: requirements, architecture, API, database, structure
|-- AGENTS.md   # Working instructions for coding assistants
`-- .github/    # Pull request template and Backend CI workflow
```

## Documentation

| Document | Content |
|---|---|
| [docs/requirements-and-analysis.md](docs/requirements-and-analysis.md) | MVP scope, user roles, flows, and business rules |
| [docs/system-architecture.md](docs/system-architecture.md) | System layers and responsibility boundaries |
| [docs/database-design.md](docs/database-design.md) | SQLite schema, constraints, and seeding strategy |
| [docs/api-contracts.md](docs/api-contracts.md) | `/api/v1` endpoints, payloads, and error behaviour |
| [docs/backend-structure.md](docs/backend-structure.md) | Internal organisation of the Flask codebase |
| [docs/frontend-design.md](docs/frontend-design.md) | Frontend routes, pages, and behaviour |
| [docs/repository-conventions.md](docs/repository-conventions.md) | Branching, commits, and review workflow |
| [backend/data/README.md](backend/data/README.md) | Learning-content authoring guide |
| [frontend/README.md](frontend/README.md) | Frontend scripts and the authentication-guard flag |
| [AGENTS.md](AGENTS.md) | Instructions for coding assistants |

## How to run

### Prerequisites

- Git.
- Python 3.12 and Node.js with npm.
- No separate database server is required; SQLite ships with Python.

### Terminal 1 — backend

Run these from `backend/`. The backend must be started first, as the frontend
proxies API requests to it.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

On Windows PowerShell, use `python -m venv .venv`,
`.\.venv\Scripts\Activate.ps1`, and `Copy-Item .env.example .env` in place of
the corresponding lines above.

Paste the printed value after `SECRET_KEY=` in `backend/.env`. Each machine
uses its own secret; the file is never committed. Then initialise and start
the server (same on every platform):

```bash
python init_db.py
python seed.py
flask --app app run --debug
```

Flask listens on `http://127.0.0.1:5000` by default. Leave this terminal
running.

### Terminal 2 — frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
echo "VITE_AUTH_GUARD=on" > .env.local
npm run dev
```

`VITE_AUTH_GUARD=on` enables the route guards and the session check against
`GET /api/v1/me`; restart `npm run dev` after changing it. The Vite
development server runs on port 5173 by default and forwards `/api` to
`http://127.0.0.1:5000`. Open `http://localhost:5173` in the browser.

Detailed procedures are documented in [frontend/README.md](frontend/README.md)
and the design baselines listed above. Coding assistants contributing to this
repository are expected to follow [AGENTS.md](AGENTS.md).

## Team and licence

This project was completed by a six-member student team; individual
responsibilities are recorded in [AGENTS.md](AGENTS.md), Section 5. AI coding
assistants (Claude, Claude Code) were used in support of implementation,
documentation, and testing.

Licence: to be added. The repository currently contains no licence file.
