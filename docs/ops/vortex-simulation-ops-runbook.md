# Vortex Simulation Backend — Ops Runbook (v1)

This document is the operational reference for running the simulation backend as a public demo: safety controls, admin endpoints, and data reset workflows.

## Local vs production runtime

- Production: Cloudflare Pages Functions (`functions/`)
- Local: Node runner (`yarn dev:api`) with the UI proxy (`yarn dev` / `yarn dev:full`)

Local dev details: `docs/simulation/vortex-simulation-local-dev.md`.

## Admin auth

Admin endpoints require an `x-admin-secret` header with `ADMIN_SECRET`, unless `DEV_BYPASS_ADMIN=true` is set for local dev.

## Safety controls (writes)

Write commands run through `POST /api/command`. The system supports four layers of write blocking:

1. **Deploy-time kill switch**: `SIM_WRITE_FREEZE=true`
2. **Admin global freeze**: `POST /api/admin/writes/freeze`
3. **Address action locks**: `POST /api/admin/users/lock` / `unlock`
4. **Rate limiting / quotas**:
   - per-minute command rate limits (IP + address)
   - optional per-era action quotas

## Admin endpoints (v1)

### Time (simulation clock)

- `GET /api/clock`
- `POST /api/clock/advance-era`
- `POST /api/clock/rollup-era`

### Moderation / ops

- `GET /api/admin/stats`
- `POST /api/admin/writes/freeze`
- `POST /api/admin/users/lock`
- `POST /api/admin/users/unlock`
- `GET /api/admin/users/locks`
- `GET /api/admin/users/:address`
- `GET /api/admin/audit`

Details of request/response DTOs: `docs/simulation/vortex-simulation-api-contract.md`.

## Incident playbooks

### Stop all writes immediately

Options, from strongest to weakest:

1. Set `SIM_WRITE_FREEZE=true` in the deployment environment and redeploy.
2. Call `POST /api/admin/writes/freeze` with `{ freeze: true }`.
3. Lock a specific address via `POST /api/admin/users/lock`.

### Rate-limit abuse / spam

Adjust:

- `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP`
- `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS`
- optional per-era quotas:
  - `SIM_MAX_POOL_VOTES_PER_ERA`
  - `SIM_MAX_CHAMBER_VOTES_PER_ERA`
  - `SIM_MAX_COURT_ACTIONS_PER_ERA`
  - `SIM_MAX_FORMATION_ACTIONS_PER_ERA`

### Inspect a suspicious user

Use:

- `GET /api/admin/users/:address` to view:
  - gate status cache (if present)
  - action locks
  - per-era counters
  - recent audit events (DB mode)

### Audit what happened

- `GET /api/admin/audit`

In DB mode, admin actions are also logged to the `events` table as `admin.action.v1`.

## Data reset workflows

### Clean UI (no content) without touching the DB

Run with:

- `READ_MODELS_INLINE_EMPTY=true`

List endpoints return `{ items: [] }` and singleton endpoints return minimal defaults.

### Wipe simulation data in Postgres (keep schema)

Run:

- `yarn db:clear`

This truncates simulation tables and keeps migrations/schema intact.

### Seed deterministic demo content

Run:

- `yarn db:seed`

This populates `read_models` and seeds the initial event stream.

## Operational metrics

`GET /api/admin/stats` returns a small snapshot intended for dashboards:

- current era
- active governors baseline
- configured rate limits / quotas
- write-freeze state
- basic counts (events, votes, cases)

## Known v1 limitations

- Many list/detail reads are served from `read_models` and overlaid with live counters.
- This is deliberate: it keeps the UI contract stable while normalized domain tables and event-driven projections evolve.
