# Vortex Simulation Backend — Data Model (v1)

This document explains how v1 state is stored in Postgres and how that storage maps onto reads, writes, and the feed.

The schema is implemented in `db/schema.ts` with migrations under `db/migrations/`.

## Design principles

- Keep an **append-only event log** for audit and feed.
- Keep **write state** in normalized tables where it matters (votes, formation, courts, era counters).
- Keep the UI stable via a transitional **read-model bridge** (`read_models`) until full projections exist.

## Transitional read model bridge

### `read_models`

Purpose:

- Store JSON payloads that directly match the DTOs in `docs/vortex-simulation-api-contract.md`.

Modes:

- DB mode: read from `read_models` in Postgres (requires `DATABASE_URL`).
- Inline seeded mode: `READ_MODELS_INLINE=true` serves the same payloads without a DB.
- Clean-by-default mode: `READ_MODELS_INLINE_EMPTY=true` forces empty/default payloads.

In v1, many pages are primarily served from `read_models`, with live overlays from normalized tables.

## Identity and gating

### Users

- `users`: off-chain account records keyed by address.

### Eligibility cache

- `eligibility_cache`: TTL cached RPC results for `GET /api/gate/status`.

## Events and audit

### `events`

Append-only event stream used for:

- feed items
- admin audit trail
- per-entity history pages (v1: proposal timeline)

In v1, events are emitted both by user commands and by admin endpoints.

In v1, proposal history is stored as `events` entries:

- `events.type = "proposal.timeline.v1"`
- `events.entityType = "proposal"`
- `events.entityId = <proposalId>`

## Votes

### Pool votes

- `pool_votes`: one row per `(proposalId, voterAddress)` representing the latest up/down direction.

### Chamber votes

- `chamber_votes`: one row per `(proposalId, voterAddress)` representing the latest yes/no/abstain choice.
- Optional `score` is stored for yes votes (v1 CM input).

### CM awards

- `cm_awards`: one row per proposal that passes chamber vote, derived from the average yes `score`.

## Proposal drafts (Phase 12)

Proposal creation is stored as author-owned drafts:

- `proposal_drafts`: one row per draft:
  - `id` (draft slug)
  - `author_address`
  - `payload` (the wizard form, JSON)
  - `submitted_at` / `submitted_proposal_id` once submitted into the pool

## Proposals (Phase 14)

Canonical proposals table (first step away from `read_models` as source of truth):

- `proposals`: one row per proposal:
  - `id` (proposal slug)
  - `stage` (`pool | vote | build` in v1)
  - `author_address`
  - `title`, `summary`, `chamber_id`
  - `payload` (jsonb; stage-agnostic proposal content in v1, derived from the draft payload)
  - `created_at`, `updated_at`

In Phase 14, reads begin preferring this table (with `read_models` as a compatibility fallback for seeded legacy DTOs).

## Chambers (Phase 18–21)

Canonical chambers live in:

- `chambers`:
  - `id`, `title`
  - `status` (`active | dissolved`)
  - `multiplierTimes10` (integer; e.g. `15` = `1.5`)
  - `createdByProposalId`, `dissolvedByProposalId`
  - `metadata` (jsonb; room for future fields without schema churn)

Voting eligibility (paper-aligned, v1-enforced) is stored in:

- `chamber_memberships`:
  - primary key `(chamberId, address)`
  - `grantedByProposalId` (when the membership was granted via an accepted proposal)
  - `source` (v1: `accepted_proposal`)

Dissolution never deletes history. It changes chamber status and restricts new writes (e.g., new proposals) while preserving audit trails.

## Formation

Formation stores the mutable parts that can’t remain a static mock:

- `formation_projects`: per-proposal counters/baselines
- `formation_team`: additional joiners and roles
- `formation_milestones`: per-milestone status (`todo`/`submitted`/`unlocked`)
- `formation_milestone_events`: append-only milestone action history

## Courts

Courts store:

- `court_cases`: case headers and status bucket
- `court_reports`: per-address reports (and optional notes)
- `court_verdicts`: per-address verdicts (guilty/not guilty)

## Era tracking

Era tracking supports “My Governance” and rollups:

- `clock_state`: current era
- `era_snapshots`: per-era aggregates (v1: active governors baseline)
- `era_user_activity`: per-era action counters per address, used for:
  - quotas
  - my-governance progress
  - rollups
- `era_rollups`: per-era rollup output (computed status buckets and next-era counts)
- `era_user_status`: per-address derived rollup status for a specific era

## Ops controls

### Idempotency

- `idempotency_keys`: stored request/response pairs keyed by idempotency key.

### Rate limiting

- `api_rate_limits`: per-IP and per-address buckets for `POST /api/command`.

### Action locks

- `user_action_locks`: temporary write bans for an address (admin-controlled).

### Global write freeze

- `admin_state`: small key/value store for global toggles (including write freeze).

## What’s expected to change in v2+

- Continue migrating away from the read-model bridge (`read_models`) so all pages are served from canonical tables + projections.
- Add delegation tables and history:
  - `delegations`
  - `delegation_events`
- Add veto and multiplier-setting state (if modeled as first-class tables in v2):
  - `veto_events` (or `proposal_vetoes`)
  - `chamber_multiplier_submissions`
- Add Meritocratic Measure (MM) history (Formation delivery scoring):
  - `mm_awards` (or equivalent per-milestone ratings + derived totals)
