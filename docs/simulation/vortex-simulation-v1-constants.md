# Vortex Simulation Backend — v1 Constants

This file records the v1 decisions used by the simulation backend so implementation and tests share the same assumptions.

## Stack decisions

- **Database:** Postgres (v1 recommendation: **Neon**, for edge/serverless connectivity)
- **On-chain read source:** Humanode mainnet RPC (no Subscan dependency for v1)
- **Eligibility (“active Human Node”):** derived from mainnet RPC reads of `Session::Validators` (current validator set membership). The Humanode RPC URL is configured via `HUMANODE_RPC_URL` or `public/sim-config.json`.

## Simulation time decisions

- **Era length:** configured off-chain by the simulation (not a chain parameter)
  - v1 default: **7 days** (can still be advanced manually via `/api/clock/advance-era`)
  - vote/pool stage windows default to:
    - pool: **7 days**
    - vote: **7 days**
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
  - Vote quorum + passing evaluation exists (`evaluateChamberQuorum`) and proposals auto-advance from vote → build when quorum + passing are met.
  - Formation is optional: formation state is only seeded/usable when `formationEligible` is true on the proposal payload.
  - CM awards v1 are recorded in `cm_awards` when proposals pass (derived from average yes `score`), and `/api/humans*` overlays ACM deltas from awards.
- Phase 8 write slice exists:
  - Formation tables exist:
    - `formation_projects`, `formation_team`, `formation_milestones`, `formation_milestone_events`
  - `POST /api/command` supports:
    - `formation.join`
    - `formation.milestone.submit`
    - `formation.milestone.requestUnlock`
  - `GET /api/proposals/:id/formation` overlays live Formation state (team slots, milestones, progress).
  - Formation commands are rejected when a proposal does not require Formation (`formationEligible=false`).
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
  - Quorum denominators are chamber-scoped:
    - when no prior era rollup exists, denominators use `min(activeGovernorsBaseline, eligibleGovernorsInChamber)`
    - when a prior era rollup exists, denominators use the rollup’s active set filtered to `eligibleGovernorsInChamber`
  - `GET /api/clock` returns the current era + active governors baseline (used as the fallback cap when rollups are missing).
  - `GET /api/my-governance` overlays per-era `done` counts for authenticated users.
- Phase 10b write slice exists:
  - `POST /api/clock/rollup-era` computes:
    - per-era governing status buckets (Ahead/Stable/Falling behind/At risk/Losing status)
    - `activeGovernorsNextEra` based on configured requirements
    - next era baseline update (next era uses `activeGovernorsNextEra`)
  - Rollup output is stored in:
    - `era_rollups`, `era_user_status`

- Phase 17 write slice exists:
  - Chamber vote eligibility is enforced (paper-aligned):
    - Specialization chamber: vote requires an accepted proposal in that chamber.
    - General chamber: vote requires an accepted proposal in any chamber.
  - Genesis bootstrap for the first votes can be configured via `public/sim-config.json` (`genesisChamberMembers`).
  - Eligibility is persisted in `chamber_memberships` and granted when a proposal is accepted (vote → build transition).
  - Dev bypass: `DEV_BYPASS_CHAMBER_ELIGIBILITY=true` disables chamber-membership checks (local/testing only).

- Phase 18 write slice exists:
  - Chambers are canonical in `chambers` (auto-seeded from `public/sim-config.json` → `genesisChambers`).
  - General-chamber proposal outcomes can create/dissolve chambers (simulated via proposal payload `metaGovernance`).

## Paper alignment notes (v1)

- Pool attention quorum:
  - paper: **22% engaged** + **≥10% upvotes**
  - simulation v1: **22% engaged** + **≥10% upvotes**
- Vote quorum (33%) is aligned; passing uses **66.6% + 1 yes vote within quorum** in v1.
- Delegation and veto are implemented in v1 (vote-weight aggregation + veto slow-down).
- Chamber multiplier voting is implemented in v1; Meritocratic Measure (MM) is not implemented yet.

## Post-v1 roadmap (v2+)

v1 constants are intentionally kept small and testable. The simulation already includes drafts, canonical proposals/chambers, deterministic transitions, optional time windows, and proposal timelines.

The next paper-aligned expansions (v2+) are:

- Meritocratic Measure (MM) from Formation delivery/review.

Source of truth: `docs/simulation/vortex-simulation-implementation-plan.md`.
