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

## Notes

- Fixed interface text lives in `src/i18n/strings.js` and is read with `t()`;
  curriculum text comes from the API.
- Markdown content is rendered by one component using `react-markdown` and
  `remark-gfm` with raw HTML disabled (Frontend Design §9.3). Commit
  `package-lock.json` together with any dependency change.
- Never commit `node_modules/`, `dist/` or `coverage/`.

Backend contributors do not need Node.js, npm, or a running frontend for
backend-only work.
