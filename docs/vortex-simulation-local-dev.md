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
- `POST /api/clock/rollup-era` (admin-only; computes next-era active set + tier statuses)
- `POST /api/admin/users/lock` (admin-only; temporarily disables writes for an address)
- `POST /api/admin/users/unlock` (admin-only)
- `GET /api/admin/users/locks` (admin-only)
- `GET /api/admin/users/:address` (admin-only)
- `GET /api/admin/audit` (admin-only)
- `GET /api/admin/stats` (admin-only)
- `POST /api/admin/writes/freeze` (admin-only; toggles global write freeze)
- `POST /api/command` (write commands; gated)

## Required env vars

These env vars are read by the API runtime (Pages Functions in production, Node runner locally).

- `SESSION_SECRET` (required): used to sign `vortex_nonce` and `vortex_session` cookies.
- `DATABASE_URL` (required for Phase 2c+): Postgres connection string (v1 expects Neon-compatible serverless Postgres).
- `ADMIN_SECRET` (required for admin endpoints): must be provided via `x-admin-secret` header (unless `DEV_BYPASS_ADMIN=true`).
- Humanode mainnet RPC URL can be configured in either place:
  - `HUMANODE_RPC_URL` (recommended for deployments), or
  - `public/sim-config.json` via `humanodeRpcUrl` (repo-configured runtime value).

For convenience, this repo ships with a default `humanodeRpcUrl` pointing to the public Humanode mainnet explorer RPC.

Local dev note:

- When using the Node API runner (`yarn dev:api` / `yarn dev:full`), the API server exposes `GET /sim-config.json` by reading `public/sim-config.json`, so real gating works without setting `HUMANODE_RPC_URL`.

- Chamber voting bootstrap (optional):
  - `public/sim-config.json` → `genesisChamberMembers` can list initial eligible voters per `chamberId` (including `general`).
  - This is needed to allow the first specialization chamber votes before anyone has an accepted proposal.

- Chambers bootstrap (recommended):
  - `public/sim-config.json` → `genesisChambers` defines the initial chamber set (id/title/multiplier).
  - The backend auto-seeds these into the canonical `chambers` table when the table is empty.

- `SIM_ACTIVE_GOVERNORS` (optional): active governors baseline used for quorum math (defaults to `150`).
- `SIM_REQUIRED_POOL_VOTES` (optional): per-era required pool actions (defaults to `1`).
- `SIM_REQUIRED_CHAMBER_VOTES` (optional): per-era required chamber actions (defaults to `1`).
- `SIM_REQUIRED_COURT_ACTIONS` (optional): per-era required court actions (defaults to `0`).
- `SIM_REQUIRED_FORMATION_ACTIONS` (optional): per-era required formation actions (defaults to `0`).
- Era baseline updates: `/api/clock/rollup-era` sets the next era’s `activeGovernors` baseline from rollup results (`activeGovernorsNextEra`).
- `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP` (optional): per-minute IP limit for `POST /api/command` (defaults to `180`).
- `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS` (optional): per-minute address limit for `POST /api/command` (defaults to `60`).
- `SIM_MAX_POOL_VOTES_PER_ERA` (optional): maximum counted pool actions per era per address (unset/0 = unlimited).
- `SIM_MAX_CHAMBER_VOTES_PER_ERA` (optional): maximum counted chamber vote actions per era per address (unset/0 = unlimited).
- `SIM_MAX_COURT_ACTIONS_PER_ERA` (optional): maximum counted court actions per era per address (unset/0 = unlimited).
- `SIM_MAX_FORMATION_ACTIONS_PER_ERA` (optional): maximum counted formation actions per era per address (unset/0 = unlimited).
- `SIM_WRITE_FREEZE` (optional): if `true`, blocks all `POST /api/command` writes regardless of admin state (deploy-time kill switch).
- Phase 16 automation and time windows:
  - `SIM_ERA_SECONDS` (optional): tick “due” threshold in seconds (defaults to 7 days).
  - `SIM_ENABLE_STAGE_WINDOWS` (optional): when `true`, enforce per-stage pool/vote windows and compute `timeLeft` from canonical timestamps.
  - `SIM_POOL_WINDOW_SECONDS` (optional): pool stage window in seconds (defaults to 7 days).
  - `SIM_VOTE_WINDOW_SECONDS` (optional): vote stage window in seconds (defaults to 7 days).
  - `SIM_NOW_ISO` (optional): override “current time” for test/debug.

## Frontend build flags

- `VITE_SIM_AUTH` controls the sidebar wallet panel + client-side gating UI.
  - Default: enabled (set `VITE_SIM_AUTH=false` to disable).
  - Requires a Substrate wallet browser extension (polkadot{.js}) for message signing with Humanode (HMND) SS58 addresses.

## Dev-only toggles

- `DEV_BYPASS_SIGNATURE=true` to accept any signature (demo/dev mode).
- `DEV_BYPASS_GATE=true` to mark any signed-in user as eligible (demo/dev mode).
- `DEV_BYPASS_CHAMBER_ELIGIBILITY=true` to skip chamber membership checks for `chamber.vote` (demo/dev mode).
- `DEV_ELIGIBLE_ADDRESSES=addr1,addr2,...` allowlist for eligibility when `DEV_BYPASS_GATE` is false.
- `DEV_INSECURE_COOKIES=true` to allow auth cookies over plain HTTP (local dev only).
- `READ_MODELS_INLINE=true` to serve read endpoints from the in-repo seed builder (no DB required).
- `READ_MODELS_INLINE_EMPTY=true` to force an empty read-model store (useful for “clean UI” local dev without touching a DB).
- `DEV_BYPASS_ADMIN=true` to allow admin endpoints locally without `ADMIN_SECRET`.
- `SIM_CONFIG_JSON='{"humanodeRpcUrl":"...","genesisChamberMembers":{"engineering":["5..."]}}'` to override `/sim-config.json` in tests or local dev.

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
- Real gating uses `DEV_BYPASS_GATE=false` and a configured Humanode mainnet RPC URL (env var or `public/sim-config.json`).
- The Node API runner defaults to **empty read models** when `DATABASE_URL` is not set (the UI should show “No … yet” on content pages).
- To use the seeded fixtures locally (no DB), run with `READ_MODELS_INLINE=true`.
- To force empty reads even if something is seeding locally, run with `READ_MODELS_INLINE_EMPTY=true`.

### Wrangler-based dev (optional)

`yarn dev:api:wrangler` runs `wrangler pages dev` against `./dist` and serves the same `/api/*` routes.

## Type checking

- UI + client types: `yarn exec tsc -p tsconfig.json --noEmit`
- Pages Functions API: `yarn exec tsc -p functions/tsconfig.json --noEmit`

## DB (Phase 2c)

DB setup uses the read-model bridge seeded from `db/seed/fixtures/*`:

- Generate migrations: `yarn db:generate`
- Apply migrations: `yarn db:migrate` (requires `DATABASE_URL`)
- Seed into `read_models` and the `events` table: `yarn db:seed` (requires `DATABASE_URL`)
  - Also truncates `chambers`, `chamber_memberships`, `pool_votes`, `chamber_votes`, `cm_awards`, `idempotency_keys`, Formation tables, Courts tables, and Era tables so repeated seeds stay deterministic.

### Clearing all data (keep schema)

To wipe the simulation data without dropping tables:

- `yarn db:clear` (requires `DATABASE_URL`)

This truncates the simulation tables and leaves the schema/migrations intact.

### Clean-by-default vs seeded content

- Clean-by-default: run without `READ_MODELS_INLINE` and without running `yarn db:seed` (or wipe a seeded DB via `yarn db:clear`).
- Seeded content: run `yarn db:seed` (DB mode) or `READ_MODELS_INLINE=true` (no DB).
