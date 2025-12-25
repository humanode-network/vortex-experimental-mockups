# Vortex Simulation Backend — v1 Constants

This file records the v1 decisions used by the simulation backend so implementation and tests share the same assumptions.

## Stack decisions

- **Database:** Postgres (v1 recommendation: **Neon**, for edge/serverless connectivity)
- **On-chain read source:** Humanode mainnet RPC (no Subscan dependency for v1)
- **Eligibility (“active Human Node”):** derived from mainnet RPC reads of `ImOnline::*` (with a safe fallback to `Session::Validators` in v1)

## Simulation time decisions

- **Era length:** configured off-chain by the simulation (not a chain parameter)
  - v1 value: **TBD** (the clock is advanced manually via `/api/clock/advance-era`)

## Current v1 progress checkpoints

- Backend exists in the repo (`functions/`, DB schema/migrations under `db/`, seed script under `scripts/`).
- Read endpoints exist and are wired to either:
  - Postgres-backed reads from `read_models` (requires `DATABASE_URL` + `yarn db:migrate && yarn db:seed`), or
  - Inline seed reads via `READ_MODELS_INLINE=true` (no DB required).
  - Empty reads via `READ_MODELS_INLINE_EMPTY=true` (clean UI; list endpoints return `{ items: [] }`).
- DB can be wiped without dropping schema via `yarn db:clear` (requires `DATABASE_URL`).
- Event log scaffold exists as `events` (append-only table) and `GET /api/feed` can be backed by it in DB mode.
