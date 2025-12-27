# Vortex Simulation Backend — Local Dev (Node API runner + UI proxy)

Production deploys the API as **Cloudflare Pages Functions** under `functions/`. Local development runs the same handlers in Node via `scripts/dev-api-node.mjs` so the UI can call `/api/*` without relying on `wrangler pages dev`.

## Endpoints (current skeleton)

- `GET /api/health`
- `POST /api/auth/nonce` → `{ address }` → `{ nonce }` (sets `vortex_nonce` cookie)
- `POST /api/auth/verify` → `{ address, nonce, signature }` (sets `vortex_session` cookie)
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/gate/status`
- Read endpoints (Phase 2c/4 bridge; backed by `read_models`):
  - `GET /api/chambers`
  - `GET /api/chambers/:id`
  - `GET /api/proposals?stage=...`
  - `GET /api/proposals/:id/pool`
  - `GET /api/proposals/:id/chamber`
  - `GET /api/proposals/:id/formation`
  - `GET /api/proposals/drafts`
  - `GET /api/proposals/drafts/:id`
  - `GET /api/courts`
  - `GET /api/courts/:id`
  - `GET /api/humans`
  - `GET /api/humans/:id`
  - `GET /api/factions`
  - `GET /api/factions/:id`
  - `GET /api/formation`
  - `GET /api/invision`
- `GET /api/my-governance`
- `GET /api/clock` (simulation time snapshot)
- `POST /api/clock/advance-era` (admin-only; increments era by 1)
- `POST /api/command` (write commands; gated)

## Required env vars

These env vars are read by the API runtime (Pages Functions in production, Node runner locally).

- `SESSION_SECRET` (required): used to sign `vortex_nonce` and `vortex_session` cookies.
- `DATABASE_URL` (required for Phase 2c+): Postgres connection string (v1 expects Neon-compatible serverless Postgres).
- `ADMIN_SECRET` (required for admin endpoints): must be provided via `x-admin-secret` header (unless `DEV_BYPASS_ADMIN=true`).
- `HUMANODE_RPC_URL` (required when `DEV_BYPASS_GATE` is false): JSON-RPC endpoint for Humanode mainnet (used for `ImOnline::*` reads with a safe fallback to `Session::Validators` in v1).

## Frontend build flags

- `VITE_SIM_AUTH` controls the sidebar wallet panel + client-side gating UI.
  - Default: enabled (set `VITE_SIM_AUTH=false` to disable).
  - Requires a Polkadot browser extension (polkadot{.js}) for message signing.

## Dev-only toggles

- `DEV_BYPASS_SIGNATURE=true` to accept any signature (demo/dev mode).
- `DEV_BYPASS_GATE=true` to mark any signed-in user as eligible (demo/dev mode).
- `DEV_ELIGIBLE_ADDRESSES=addr1,addr2,...` allowlist for eligibility when `DEV_BYPASS_GATE` is false.
- `DEV_INSECURE_COOKIES=true` to allow auth cookies over plain HTTP (local dev only).
- `READ_MODELS_INLINE=true` to serve read endpoints from the in-repo seed builder (no DB required).
- `READ_MODELS_INLINE_EMPTY=true` to force an empty read-model store (useful for “clean UI” local dev without touching a DB).
- `DEV_BYPASS_ADMIN=true` to allow admin endpoints locally without `ADMIN_SECRET`.

## Running locally (recommended)

### Option A (one command)

- `yarn dev:full` (starts a local API server on `:8788`, starts the app on rsbuild dev, and proxies `/api/*`).

### Option B (two terminals)

**Terminal 1 (API)**

1. Start the local API server (default port `8788`):

`yarn dev:api`

`yarn dev:api` starts with real signature verification and real gating by default. For a quick demo mode:

- `DEV_BYPASS_SIGNATURE=true DEV_BYPASS_GATE=true yarn dev:api`

**Terminal 2 (UI)**

2. Run the UI with a dev-server proxy to the API:

`yarn dev`

Open the provided local URL and call endpoints under `/api/*`.

Notes:

- `yarn dev` proxies `/api/*` to `http://127.0.0.1:8788` (config: `rsbuild.config.ts`).
- If you see `ECONNREFUSED` in the UI dev server logs, the backend is not running on `:8788` (start it with `yarn dev:api`).
- Real gating uses `DEV_BYPASS_GATE=false` and a bound `HUMANODE_RPC_URL`.
- The Node API runner defaults to **empty read models** when `DATABASE_URL` is not set (the UI should show “No … yet” on content pages).
- To use the seeded fixtures locally (no DB), run with `READ_MODELS_INLINE=true`.
- To force empty reads even if something is seeding locally, run with `READ_MODELS_INLINE_EMPTY=true`.

### Wrangler-based dev (optional)

`yarn dev:api:wrangler` runs `wrangler pages dev` against `./dist` and serves the same `/api/*` routes.

## DB (Phase 2c)

DB setup uses the read-model bridge seeded from `db/seed/fixtures/*`:

- Generate migrations: `yarn db:generate`
- Apply migrations: `yarn db:migrate` (requires `DATABASE_URL`)
- Seed into `read_models` and the `events` table: `yarn db:seed` (requires `DATABASE_URL`)
  - Also truncates `pool_votes`, `chamber_votes`, `cm_awards`, `idempotency_keys`, and Formation tables so repeated seeds stay deterministic.

### Clearing all data (keep schema)

To wipe the simulation data without dropping tables:

- `yarn db:clear` (requires `DATABASE_URL`)

This truncates the simulation tables and leaves the schema/migrations intact.

### Clean-by-default vs seeded content

- Clean-by-default: run without `READ_MODELS_INLINE` and without running `yarn db:seed` (or wipe a seeded DB via `yarn db:clear`).
- Seeded content: run `yarn db:seed` (DB mode) or `READ_MODELS_INLINE=true` (no DB).
