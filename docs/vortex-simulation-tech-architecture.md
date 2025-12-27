# Vortex Simulation Backend — Tech Architecture

This document maps `docs/vortex-simulation-processes.md` onto a technical architecture that fits this repo (React app + Cloudflare Pages Functions in production, with a Node runner for local dev).

## 1) Stack (recommended)

### Languages

- **TypeScript** end-to-end (web + API + shared domain engine).
- **SQL** for persistent state and analytics.

### Runtime + hosting

- **Cloudflare Pages**: existing frontend hosting.
- **Cloudflare Workers**: API runtime (REST + optional SSE).
- **Cron Triggers**: era rollups / scheduled jobs.
- **Durable Objects (optional but recommended)**: race-free state transitions for voting/pool/court actions.

### Database

- **Chosen for v1: Postgres** (Neon-compatible serverless Postgres) for user history, analytics, and relational integrity.

Important: because the API runtime is Cloudflare Workers/Pages Functions (edge), v1 should use a Postgres provider that supports **serverless/HTTP connectivity** from edge runtimes.

- Recommended: **Neon Postgres** (works with `@neondatabase/serverless` + Drizzle).

### Libraries / tools

- **Drizzle ORM** (Postgres).
- **zod** (request validation; used as needed).
- **@polkadot/util-crypto** (+ **@polkadot/keyring** in tests) for Substrate signature verification and SS58 address handling.
- **wrangler** for Workers deployment (already in repo).

### External reads (gating)

- Humanode mainnet via **RPC** (v1).

## 2) High-level architecture

### Components

- **Web app (React/TS/Tailwind)**: UI + calls API.
- **API (Worker)**:
  - `auth`: nonce + signature verification
  - `gate`: mainnet eligibility checks + TTL caching
  - `commands`: apply state transitions (write operations)
  - `reads`: serve derived views (feed, proposal pages, profiles)
- **Domain engine (shared TS module)**:
  - pure functions implementing state machines, invariants, and event emission
  - no network calls; no DB calls
- **DB**:
  - canonical state (users, proposals, votes, courts, etc.)
  - append-only event log (feed/audit)
- **Scheduler**:
  - era boundary rollups (governor activity, quorums, tier statuses, CM updates)

### Key principle: authoritative writes

All state-changing actions go through the API and are validated against:

1. signature-authenticated user session
2. eligibility gate (active human node)
3. domain invariants (stage constraints, one-vote rules, etc.)

## 3) Suggested code modules (implementation shape)

This repo is currently a single frontend app. The backend can live alongside it as:

- `functions/api/*` (Pages Functions routes)
- `functions/_lib/*` (shared server helpers)
- `db/*` (Drizzle schema + migrations)
- `scripts/*` (seed/import jobs)
- `src/server/domain/*` (future: shared domain engine)

If the repo is later split into a monorepo, these become:

- `packages/domain`
- `apps/api`
- `apps/web`

## 4) API surface (v1)

### Authentication

- `POST /api/auth/nonce` → `{ address }` → `{ nonce }`
- `POST /api/auth/verify` → `{ address, nonce, signature }` → session cookie/JWT
- `POST /api/auth/logout`

### Gating

- `GET /api/gate/status` → `{ eligible: boolean, reason?: string, expiresAt: string }`

Eligibility source (v1):

- Query Humanode mainnet RPC for “active human node” status via `ImOnline::*` (with a safe fallback to `Session::Validators` in v1).

### Reads

- `GET /api/feed?cursor=...&stage=...`
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
- `GET /api/me` (profile + eligibility snapshot)

### Writes (commands)

Prefer a single command endpoint so invariants are centralized:

- `POST /api/command` → `{ type, payload, idempotencyKey? }`

Examples:

- `proposal.draft.save`
- `proposal.submitToPool`
- `pool.vote` (upvote/downvote)
- `chamber.vote` (yes/no/abstain + optional CM score 1–10 on yes votes)
- `formation.join`
- `formation.milestone.submit`
- `formation.milestone.requestUnlock`
- `court.case.report`
- `court.case.verdict`
- `delegation.set`
- `delegation.clear`

## 5) Data model (tables) — minimal set

These tables support the workflows and auditability; the system starts lean and expands as features move off the `read_models` bridge.

### Identity / auth

- `users` (account): `id`, `address`, `displayName`, `createdAt`
- `auth_nonces`: `address`, `nonce`, `expiresAt`, `usedAt`
- `sessions` (if not JWT-only): `id`, `userId`, `expiresAt`
- `idempotency_keys`: stores request/response pairs for `POST /api/command` retries

### Eligibility cache (mainnet gating)

- `eligibility_cache`:
  - `address`
  - `isActiveHumanNode` (boolean)
  - `checkedAt`, `checkedAtBlock?`
  - `source` (`rpc`)
  - `expiresAt`
  - `reasonCode?`

### Transitional read models (Phase 2c → Phase 4 bridge)

To avoid rewriting the UI while we build normalized tables + an event log, we seed mock-equivalent payloads into a single table:

- `read_models`: `{ key, payload (jsonb), updatedAt }`

This allows early `GET /api/...` endpoints to serve the exact DTOs expected by `docs/vortex-simulation-api-contract.md` while we progressively replace `read_models` with real projections.

Local dev modes for reads:

- DB mode: read from `read_models` using `DATABASE_URL`.
- Inline fixtures: `READ_MODELS_INLINE=true` (no DB).
- Clean/empty mode: `READ_MODELS_INLINE_EMPTY=true` (list endpoints return `{ items: [] }` and singleton endpoints return minimal defaults).

### Governance time

Current repo:

- `clock_state`: `currentEra`, `updatedAt`

Planned:

- `era_snapshots`: per-era aggregates (active governors, quorum baselines, etc.)
- `epoch_uptime`: optional (per address, per epoch/week) if Bioauth uptime is modeled in v1/v2

### Current tables (implemented)

- `read_models`: transitional DTO storage for the current UI
- `events`: append-only feed/audit log
- `pool_votes`: unique (proposalId, voterAddress) → up/down
- `chamber_votes`: unique (proposalId, voterAddress) → yes/no/abstain + optional `score` (1–10) on yes votes
- `cm_awards`: CM awards emitted when proposals pass (unique per proposal)
- `idempotency_keys`: stored responses for idempotent command retries
- `formation_projects`: per-proposal Formation counters/baselines
- `formation_team`: extra Formation joiners (beyond seed baseline)
- `formation_milestones`: per-proposal milestone status (`todo`/`submitted`/`unlocked`)
- `formation_milestone_events`: append-only milestone submissions/unlock requests

### Planned normalized domain tables (not implemented yet)

- `chambers`: `id`, `name`, `multiplier`
- `chamber_membership`: `chamberId`, `userId`, `sinceEra`
- `proposals`: `id`, `title`, `chamberId`, `stage`, `proposerUserId`, `createdAt`, `updatedAt`
- `proposal_drafts`: `proposalId`, structured form fields, `updatedAt`
- `proposal_stage_transitions`: `proposalId`, `fromStage`, `toStage`, `atEra`, `atTime`
- `proposal_attachments`: `proposalId`, `title`, `href`
- `cm_lcm`: (`userId`, `chamberId`, `lcm`)
- `tiers`: (`userId`, `tier`, `status`, `streaks`, `updatedAt`)

Current repo behavior:

- `pool_votes` exists and is written via `POST /api/command` (`pool.vote`).
- `chamber_votes` exists and is written via `POST /api/command` (`chamber.vote`).
- `cm_awards` exists and is written when proposals pass chamber vote (derived from average yes `score`).
- Read pages overlay live counts:
  - `GET /api/proposals/:id/pool` overlays upvotes/downvotes from `pool_votes`
  - `GET /api/proposals/:id/chamber` overlays yes/no/abstain from `chamber_votes`
- Stage transitions are currently applied by updating `read_models` entries (until normalized tables + projections land).

### Formation

Implemented (v1):

- Commands:
  - `formation.join` fills team slots (capped by total).
  - `formation.milestone.submit` marks a milestone as submitted (does not increase completion yet).
  - `formation.milestone.requestUnlock` unlocks a submitted milestone (mock acceptance for v1).
- Read overlay:
  - `GET /api/proposals/:id/formation` overlays `teamSlots`, `milestones`, and `progress` from Formation state.
- Tables:
  - `formation_projects`: `proposalId`, totals + baselines derived from the Formation read model
  - `formation_team`: `(proposalId, memberAddress)` join records (beyond the baseline)
  - `formation_milestones`: `(proposalId, milestoneIndex)` state
  - `formation_milestone_events`: append-only milestone events

### Courts

- `court_cases`: `id`, `status`, `openedAt`, `subject`, `trigger`, `linkedEntityType`, `linkedEntityId`
- `court_reports`: `caseId`, `userId`, `createdAt`
- `court_evidence`: `caseId`, `title`, `href`, `addedByUserId`, `createdAt`
- `court_verdicts`: `caseId`, `userId`, `verdict`, `createdAt`
- `court_outcomes`: `caseId`, `result`, `recommendationsJson`

### Delegation

- `delegations`: `delegatorUserId`, `delegateeUserId`, `createdAt`, `revokedAt?`
- `delegation_events`: append-only changes for audit/courts

### Feed / audit trail

- `events` (append-only):
  - `id`, `type`, `actorUserId?`, `entityType`, `entityId`, `payloadJson`, `createdAt`

In the current repo implementation, `events` exists as an append-only Postgres table and `GET /api/feed` can be served from it in DB mode.

## 6) Mapping: processes → modules → APIs → tables/events

This section maps each workflow from `docs/vortex-simulation-processes.md` to concrete tech.

### 2.0 Authentication + gating

- **Module:** `auth`, `gate`
- **API:** `/api/auth/nonce`, `/api/auth/verify`, `/api/gate/status`
- **Tables:** `users`, `auth_nonces`, `eligibility_cache`
- **Events:** `auth.logged_in`, `gate.checked`

### 2.1 Onboarding (Human → Human Node → Governor)

Current repo:

- **Module:** `auth`, `gate`
- **API:** `GET /api/me`, `GET /api/gate/status`
- **Tables:** `users`, `eligibility_cache`

Planned:

- **Module:** `identity`, `eligibility`, `tiers`
- **Tables:** `tiers`
- **Events:** `tier.updated`

### 2.2 Era rollup (cron)

Current repo:

- **Module:** `clock`
- **API:** `GET /api/clock`, `POST /api/clock/advance-era`
- **Tables:** `clock_state`

Planned:

- **Module:** `governanceTime`, `tiers`, `cm`, `proposals`, `feed`
- **Tables:** `era_snapshots`, `tiers`, `cm_lcm`, `proposal_stage_transitions`, `events`
- **Events:** `era.rolled`, `quorum.baseline_updated`, `proposal.advanced`

### 2.3 Proposal drafting (wizard)

Planned:

- **Module:** `proposals.draft`
- **API:** `POST /api/command` (`proposal.draft.save`, `proposal.submitToPool`)
- **Tables:** `proposal_drafts`, `proposals`, `proposal_stage_transitions`, `proposal_attachments`
- **Events:** `proposal.draft_saved`, `proposal.submitted_to_pool`

### 2.4 Proposal pool (attention)

- **Module:** `proposals.pool`
- **API:** `POST /api/command` (`pool.vote`)
- **Tables:** `pool_votes`, `events`
- **Derived:** pool quorum metrics computed from votes + era snapshot baselines
- **Events:** `pool.vote_cast`, `pool.quorum_met`, `proposal.moved_to_vote`

### 2.5 Chamber vote (decision)

- **Module:** `proposals.vote`, `cm`
- **API:** `POST /api/command` (`chamber.vote`)
- **Tables:** `chamber_votes`, `cm_awards`, `events` (+ transitional `read_models` stage updates)
- **Events:** `vote.cast`, `vote.quorum_met`, `proposal.passed`, `proposal.rejected`, `cm.awarded`

### 2.6 Formation execution (projects)

- **Module:** `formation`
- **API:** `POST /api/command` (`formation.join`, `formation.milestone.submit`, `formation.milestone.requestUnlock`)
- **Tables:** `formation_projects`, `formation_team`, `formation_milestones`, `formation_milestone_events`
- **Events:** `formation.joined`, `formation.milestone_submitted`, `formation.unlock_requested`, `formation.milestone_accepted`

### 2.7 Courts (case lifecycle)

- **Module:** `courts`
- **API:** `POST /api/command` (`court.case.report`, `court.case.verdict`, `court.evidence.add`)
- **Tables:** `court_cases`, `court_reports`, `court_evidence`, `court_verdicts`, `court_outcomes`
- **Events:** `court.case_opened`, `court.report_added`, `court.session_live`, `court.verdict_cast`, `court.case_closed`

### 2.8 Delegation management

- **Module:** `delegation`
- **API:** `POST /api/command` (`delegation.set`, `delegation.clear`)
- **Tables:** `delegations`, `delegation_events`
- **Events:** `delegation.set`, `delegation.cleared`

### 2.9 Chambers directory + chamber detail

- **Module:** `chambers` (read models)
- **API:** `GET /api/chambers`, `GET /api/chambers/:id`
- **Tables:** `chambers`, `chamber_membership`, `era_snapshots`, `cm_lcm`, plus proposal aggregates
- **Events:** none required (derived), but `chamber.stats_updated` can be emitted on rollup if stats are materialized.

### 2.10 Invision insights

- **Module:** `invision` (derived scoring)
- **API:** `GET /api/humans/:id` (includes insights)
- **Tables:** derived from `events`, proposals/courts/milestones; optionally `invision_snapshots`
- **Events:** `invision.updated` (optional)

## 7) Concurrency + integrity (why Durable Objects may be needed)

If multiple users vote at once, race conditions must be prevented:

- double-voting
- inconsistent quorum counters
- stage transitions happening twice

Two approaches:

- **DB constraints + transactions** (Postgres can do this well).
- **Durable Object per entity** (proposal/case) that serializes commands.

Recommendation:

- Start with DB constraints + transactions.
- Add DOs for high-contention entities (popular proposals) or for simpler correctness in Worker code.

## 8) Anti-abuse controls (even for eligible human nodes)

- Per-era action limits (proposal submissions, reports, etc.)
- Idempotency keys for commands (client retries)
- Rate limiting per address (Worker middleware)
- Court/report spam prevention (minimum stake is out-of-scope unless added as a simulated rule)

## 9) Migration path from today’s mock data

- The frontend renders from `/api/*` reads; mock data is not part of the runtime anymore.
- Transitional read-model payloads are maintained as seed fixtures in `db/seed/fixtures/*` (and stored in Postgres `read_models` in DB mode).
- Next migrations are about moving from `read_models` to normalized tables + event log, then turning on write commands (pool/vote first).
