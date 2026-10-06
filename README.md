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

## Getting started

Backend, from `backend/`: create a virtual environment, install
`requirements.txt`, copy `.env.example` to `.env` with a locally generated
`SECRET_KEY`, then run `python init_db.py`, `python seed.py`, and
`flask --app app run --debug`.

Frontend, from `frontend/` in a separate terminal: run `npm ci`, set
`VITE_AUTH_GUARD=on` in `.env.local`, and run `npm run dev`. The development
server proxies `/api` requests to Flask at `http://127.0.0.1:5000`.

Detailed procedures are documented in [frontend/README.md](frontend/README.md)
and the design baselines listed above. Coding assistants contributing to this
repository are expected to follow [AGENTS.md](AGENTS.md).

## Team and licence

This project was completed by a six-member student team; individual
responsibilities are recorded in [AGENTS.md](AGENTS.md), Section 5. AI coding
assistants (Claude, Claude Code) were used in support of implementation,
documentation, and testing.

Licence: to be added. The repository currently contains no licence file.
