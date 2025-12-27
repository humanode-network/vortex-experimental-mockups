# Vortex Simulation Backend — v1 Constants

This file records the v1 decisions used by the simulation backend so implementation and tests share the same assumptions.

## Stack decisions

- **Database:** Postgres (v1 recommendation: **Neon**, for edge/serverless connectivity)
- **On-chain read source:** Humanode mainnet RPC (no Subscan dependency for v1)
- **Eligibility (“active Human Node”):** derived from mainnet RPC reads of `ImOnline::*` (with a safe fallback to `Session::Validators` in v1)

## Simulation time decisions

- **Era length:** configured off-chain by the simulation (not a chain parameter)
  - v1 value: **TBD** (the clock is advanced manually via `/api/clock/advance-era`)
- **Per-era activity requirements:** configured off-chain by env vars (v1 defaults)
  - `SIM_REQUIRED_POOL_VOTES=1`
  - `SIM_REQUIRED_CHAMBER_VOTES=1`
  - `SIM_REQUIRED_COURT_ACTIONS=0`
  - `SIM_REQUIRED_FORMATION_ACTIONS=0`

## Current v1 progress checkpoints

- Backend exists in the repo (`functions/`, DB schema/migrations under `db/`, seed script under `scripts/`).
- Read endpoints exist and are wired to either:
  - Postgres-backed reads from `read_models` (requires `DATABASE_URL` + `yarn db:migrate && yarn db:seed`), or
  - Inline seed reads via `READ_MODELS_INLINE=true` (no DB required).
  - Empty reads via `READ_MODELS_INLINE_EMPTY=true` (clean UI; list endpoints return `{ items: [] }`).
- DB can be wiped without dropping schema via `yarn db:clear` (requires `DATABASE_URL`).
- Event log scaffold exists as `events` (append-only table) and `GET /api/feed` can be backed by it in DB mode.
- Phase 6 write slice exists:
  - `POST /api/command` supports `pool.vote` (auth + gate + idempotency).
  - `pool_votes` stores one vote per address per proposal and `GET /api/proposals/:id/pool` overlays live counts.
  - Pool quorum evaluation exists (`evaluatePoolQuorum`) and proposals auto-advance from pool → vote by updating the `proposals:list` read model.
- Phase 7 write slice exists:
  - `POST /api/command` supports `chamber.vote` (auth + gate + idempotency).
  - `chamber_votes` stores one vote per address per proposal and `GET /api/proposals/:id/chamber` overlays live counts.
  - Vote quorum + passing evaluation exists (`evaluateChamberQuorum`) and proposals can auto-advance from vote → build when Formation-eligible.
  - CM awards v1 are recorded in `cm_awards` when proposals pass (derived from average yes `score`), and `/api/humans*` overlays ACM deltas from awards.
- Phase 8 write slice exists:
  - Formation tables exist:
    - `formation_projects`, `formation_team`, `formation_milestones`, `formation_milestone_events`
  - `POST /api/command` supports:
    - `formation.join`
    - `formation.milestone.submit`
    - `formation.milestone.requestUnlock`
  - `GET /api/proposals/:id/formation` overlays live Formation state (team slots, milestones, progress).
- Phase 9 write slice exists:
  - Courts tables exist:
    - `court_cases`, `court_reports`, `court_verdicts`
  - `POST /api/command` supports:
    - `court.case.report`
    - `court.case.verdict`
  - `GET /api/courts` and `GET /api/courts/:id` overlay live `reports` and `status`.
- Phase 10a write slice exists:
  - Era tracking tables exist:
    - `era_snapshots` (per-era active governors baseline)
    - `era_user_activity` (per-era action counters per address)
  - Active governors baseline defaults to `150` and can be configured via `SIM_ACTIVE_GOVERNORS` (or `VORTEX_ACTIVE_GOVERNORS`).
  - `GET /api/my-governance` overlays per-era `done` counts for authenticated users.
- Phase 10b write slice exists:
  - `POST /api/clock/rollup-era` computes:
    - per-era governing status buckets (Ahead/Stable/Falling behind/At risk/Losing status)
    - `activeGovernorsNextEra` based on configured requirements
  - Rollup output is stored in:
    - `era_rollups`, `era_user_status`
