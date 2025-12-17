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

## Scripts

- `yarn dev` – start the dev server
- `yarn build` – build the app
- `yarn exec tsc --noEmit` – type-check

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
