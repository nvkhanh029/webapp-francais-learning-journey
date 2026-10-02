# Frontend

React + Vite implementation of the learner-facing UI. The design baseline is
[`docs/frontend-design.md`](../docs/frontend-design.md); the API it consumes is
defined in [`docs/api-contracts.md`](../docs/api-contracts.md).

The UI exists: `package.json`, the committed `package-lock.json`, `vite.config.js`
and `src/` (pages, features, API client, i18n, styles) are in this directory.
Extend the existing code rather than scaffolding a new app.

## Run

```bash
cd frontend
npm ci
npm run dev
```

The dev server proxies `/api` to the Flask backend at `http://127.0.0.1:5000`
(`vite.config.js`), so start the backend first. Code uses relative `/api/v1/...`
URLs only.

## Scripts

```bash
npm run dev      # Vite dev server with the /api proxy
npm run build    # production build into dist/
npm run lint     # eslint (react, react-hooks)
npm run format   # prettier --write (src/i18n/strings.js is excluded)
```

Run `npm run lint` and `npm run build` before committing frontend changes.

## Auth guard flag

`VITE_AUTH_GUARD` (see `.env.example`) switches the route guards and the
session check on or off:

- `off` (default): every route is open and no session check is made, so the
  static UI is viewable without a backend.
- `on`: `RequireAuth`, `RequireLanguage` and `GuestRoute` behave as in
  Frontend Design §4.3, using `GET /api/v1/me` for the session check. The
  backend must be running.

Set it in a local `frontend/.env.local` (not committed), for example
`VITE_AUTH_GUARD=on`, and restart the dev server.

## Notes

- Fixed interface text lives in `src/i18n/strings.js` and is read with `t()`;
  curriculum text comes from the API.
- Markdown content is rendered by one component using `react-markdown` and
  `remark-gfm` with raw HTML disabled (Frontend Design §9.3). Commit
  `package-lock.json` together with any dependency change.
- Never commit `node_modules/`, `dist/` or `coverage/`.

Backend contributors do not need Node.js, npm, or a running frontend for
backend-only work.
