# Vortex Webapp Layout

Experimental Vortex interface built with React + Rsbuild, Tailwind-like utility styles, and shared UI components.

## Stack

- React with React Router
- Rsbuild
- Yarn (see `.node-version` for Node version)
- UI primitives in `src/components/primitives`
- Tailwind-style utilities via PostCSS

## Getting Started

```bash
corepack enable
yarn install
yarn dev
```

Dev server: http://localhost:3000

Landing: http://localhost:3000/
App: http://localhost:3000/app

## Simulation API (local)

The UI reads from `/api/*` (Cloudflare Pages Functions). For local development, run the API locally so the UI can reach it:

- One command: `yarn dev:full` (API on `:8788` + UI on `:3000` + `/api/*` proxy)
- Two terminals:
  - Terminal 1: `yarn dev:api`
  - Terminal 2: `yarn dev`

If only `yarn dev` runs, `/api/*` is not available and auth/gating/read pages will show an “API is not available” error.

## Scripts

- `yarn dev` – start the dev server
- `yarn dev:api` – run the Pages Functions API locally (Node runner)
- `yarn dev:full` – run UI + API together (recommended)
- `yarn dev:api:wrangler` – run the API via `wrangler pages dev` against `./dist`
- `yarn build` – build the app
- `yarn test` – run API/unit tests
- `yarn prettier:check` / `yarn prettier:fix`

## Project Structure

- `src/app` – App shell, routes, sidebar
- `src/components` – shared UI (Hint, PageHint, SearchBar) and primitives under `primitives/`
- `src/data` – glossary (vortexopedia), page hints/tutorial content
- `src/pages` – feature pages (proposals, human-nodes, formations, chambers, factions, courts, feed, profile, invision, etc.)
- `src/styles` – base/global styles
- `prolog/vortexopedia.pl` – Prolog version of the glossary data (for future integration)

## Shared Patterns

- **Hints**: `HintLabel` for inline glossary popups; `PageHint` for page-level help overlays.
- **Search**: `SearchBar` component standardizes the search row across pages.
- **Status/Stage bars**: proposal pages share a stage bar for Draft → Pool → Chamber vote → Formation.

## Notes

- Builds output to `dist/`.
- Keep glossary entries in sync between `src/data/vortexopedia.ts` and `prolog/vortexopedia.pl` if you edit definitions.
