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

### Backend docs

- `docs/README.md` — doc map + conventions
- `docs/vortex-simulation-scope-v1.md` — v1 scope and explicit non-goals
- `docs/vortex-simulation-processes.md` — what the simulation models (epochs/eras, proposals, chambers, courts, formation)
- `docs/vortex-simulation-state-machines.md` — formal rules, invariants, derived metrics
- `docs/vortex-simulation-tech-architecture.md` — architecture + how the current repo maps to it
- `docs/vortex-simulation-data-model.md` — DB tables and how reads/writes/events map to them
- `docs/vortex-simulation-api-contract.md` — frozen `/api/*` DTO contracts consumed by the UI
- `docs/vortex-simulation-ops-runbook.md` — ops controls + admin endpoints
- `docs/vortex-simulation-implementation-plan.md` — phased roadmap and current progress
- `docs/vortex-simulation-local-dev.md` — local dev setup (Node runner, env vars, DB scripts)
- `docs/vortex-simulation-v1-constants.md` — v1 constants used by code/tests

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
- DB-backed dev requires `DATABASE_URL` + `yarn db:migrate && yarn db:seed` (see `docs/vortex-simulation-local-dev.md`).
