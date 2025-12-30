# Vortex Experimental Mockups

This repo ships:

1. A React UI mockup of Vortex (Humanode governance hub)
2. An off-chain “simulation backend” served from `/api/*` (Cloudflare Pages Functions)

Humanode mainnet is used only as a read-only eligibility gate; all simulated governance state lives off-chain.

## Stack

- React with React Router
- Rsbuild
- Tailwind v4 (via PostCSS) + token-driven CSS (`src/styles/base.css`)
- Yarn (Node version: `.node-version`)
- Pages Functions API in `functions/` + Postgres via Drizzle

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

The UI reads from `/api/*` (Cloudflare Pages Functions). For local dev, run the API locally so the UI can reach it:

- One command: `yarn dev:full` (API on `:8788` + UI on `:3000` + `/api/*` proxy)
- Two terminals:
  - Terminal 1: `yarn dev:api`
  - Terminal 2: `yarn dev`

If only `yarn dev` runs, `/api/*` is not available and auth/gating/read pages will show an “API is not available” error.

### Backend docs

- Start here: `docs/README.md`
- API contract: `docs/vortex-simulation-api-contract.md`
- Local dev: `docs/vortex-simulation-local-dev.md`
- Scope and rules: `docs/vortex-simulation-scope-v1.md`, `docs/vortex-simulation-state-machines.md`

## Scripts

- `yarn dev` – start the dev server
- `yarn dev:api` – run the Pages Functions API locally (Node runner)
- `yarn dev:full` – run UI + API together (recommended)
- `yarn dev:api:wrangler` – run the API via `wrangler pages dev` against `./dist`
- `yarn build` – build the app
- `yarn test` – run API/unit tests
- `yarn prettier:check` / `yarn prettier:fix`

## Type checking

- UI + client types: `yarn exec tsc -p tsconfig.json --noEmit`
- Pages Functions API: `yarn exec tsc -p functions/tsconfig.json --noEmit`

## Project Structure

- `src/app` – App shell, routes, sidebar
- `src/components` – shared UI (Hint, PageHint, SearchBar) and primitives under `primitives/`
- `src/data` – glossary (vortexopedia), page hints/tutorial content
- `src/pages` – feature pages (proposals, human-nodes, formations, chambers, factions, courts, feed, profile, invision, etc.)
- `src/styles` – base/global styles
- `functions/` – Pages Functions API (`/api/*`) + shared server helpers
- `db/` – Drizzle schema + migrations + seed builders
- `scripts/` – DB seed/clear + local API runner
- `prolog/vortexopedia.pl` – Prolog glossary mirror
- `public/landing/` – landing page assets (see `public/landing/README.md`)

## Shared Patterns

- **Hints**: `HintLabel` for inline glossary popups; `PageHint` for page-level help overlays.
- **Search**: `SearchBar` component standardizes the search row across pages.
- **Status/Stage bars**: proposal pages share a stage bar for Draft → Pool → Chamber vote → Formation.

## Notes

- `dist/` is generated build output.
- Keep glossary entries in sync between `src/data/vortexopedia.ts` and `prolog/vortexopedia.pl` if you edit definitions.
- DB-backed dev requires `DATABASE_URL` + `yarn db:migrate && yarn db:seed` (see `docs/vortex-simulation-local-dev.md`).
