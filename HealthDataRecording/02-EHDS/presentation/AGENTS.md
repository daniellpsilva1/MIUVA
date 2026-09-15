# EHDS Presentation

## Commands

- `npm ci` — install dev dependencies
- `npm run dev` — local static server at http://localhost:4173/
- `npm run lint` — ESLint on first-party JS
- `npm test` — Playwright tests (Chromium)
- `npm run test:headed` — Playwright tests with visible browser
- `npm run export:handbook` — generate revised handbook PDF via Playwright
- `node --check js/presentation.js` — syntax check

## Structure

- `index.html` — 10-slide Reveal.js presentation
- `handbook.html` — in-depth handbook (web + PDF source)
- `css/base.css` — shared fonts and tokens
- `css/theme.css` — presentation theme
- `css/handbook.css` — handbook reading and print layout
- `js/presentation.js` — Reveal config, interactions, dialogs
- `scripts/serve.mjs` — local static server (port 4173)
- `scripts/export-handbook.mjs` — PDF export via Playwright Chromium
- `tests/` — Playwright content, interaction, and handbook specs
- `lib/` — vendored Reveal.js 6.0.2 (do not modify)

## Verification

Run `npm run lint && npm test` before committing. The presentation must work
offline (no external font/script requests) and under a subdirectory path.
