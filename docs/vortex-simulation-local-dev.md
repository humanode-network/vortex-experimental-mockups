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
  - `GET /api/courts`
  - `GET /api/courts/:id`
  - `GET /api/humans`
  - `GET /api/humans/:id`
- `GET /api/clock` (simulation time snapshot)
- `POST /api/clock/advance-era` (admin-only; increments era by 1)

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
- `READ_MODELS_INLINE=true` to serve read endpoints from the in-repo mock seed (no DB required).
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

### Wrangler-based dev (optional)

`yarn dev:api:wrangler` runs `wrangler pages dev` against `./dist` and serves the same `/api/*` routes.

## DB (Phase 2c)

DB setup uses the read-model bridge seeded from today’s mocks:

- Generate migrations: `yarn db:generate`
- Apply migrations: `yarn db:migrate` (requires `DATABASE_URL`)
- Seed from mocks into `read_models`: `yarn db:seed` (requires `DATABASE_URL`)
