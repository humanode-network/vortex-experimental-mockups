# Vortex Simulation Backend — Local Dev (Pages Functions)

This repo uses **Cloudflare Pages** for hosting. Backend endpoints live in **Pages Functions** under `functions/`.

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

Pages Functions run server-side; configure these via `wrangler pages dev` (local) or Pages project settings (deploy).

- `SESSION_SECRET` (required): used to sign `vortex_nonce` and `vortex_session` cookies.
- `DATABASE_URL` (required for Phase 2c+): Postgres connection string (v1 expects Neon-compatible serverless Postgres).
- `ADMIN_SECRET` (required for admin endpoints): must be provided via `x-admin-secret` header (unless `DEV_BYPASS_ADMIN=true`).

## Dev-only toggles

Until signature verification and chain gating are implemented:

- `DEV_BYPASS_SIGNATURE=true` to accept any signature.
- `DEV_BYPASS_GATE=true` to mark any signed-in user as eligible.
- `DEV_ELIGIBLE_ADDRESSES=addr1,addr2,...` allowlist for eligibility when `DEV_BYPASS_GATE` is false.
- `DEV_INSECURE_COOKIES=true` to allow auth cookies over plain HTTP (local dev only).
- `READ_MODELS_INLINE=true` to serve read endpoints from the in-repo mock seed (no DB required).
- `DEV_BYPASS_ADMIN=true` to allow admin endpoints locally without `ADMIN_SECRET`.

## Running locally (recommended)

1. Build the frontend: `yarn build`
2. Serve Pages output + functions:

`wrangler pages dev ./dist --compatibility-date=2024-11-01 --binding SESSION_SECRET=dev-secret --binding DEV_BYPASS_SIGNATURE=true --binding DEV_BYPASS_GATE=true`

Then open the provided local URL and call endpoints under `/api/*`.

Notes:

- `rsbuild dev` does not run Pages Functions; use `wrangler pages dev` for API work.
- Prefer `wrangler pages dev ... --local-protocol=https` for local dev so cookies behave like production.
- If `wrangler` fails with a permissions error writing under `~/.config/.wrangler`, run with a writable config dir, e.g.:
  - `XDG_CONFIG_HOME=$(pwd)/.config wrangler pages dev ...`

## DB (Phase 2c)

Once you have a Postgres DB, you can generate migrations and seed read-model payloads from today’s mocks:

- Generate migrations: `yarn db:generate`
- Apply migrations: `yarn db:migrate` (requires `DATABASE_URL`)
- Seed from mocks into `read_models`: `yarn db:seed` (requires `DATABASE_URL`)
