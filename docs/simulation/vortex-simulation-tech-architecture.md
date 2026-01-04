# Vortex Simulation Backend — Tech Architecture

This document maps `docs/simulation/vortex-simulation-processes.md` onto a technical architecture that fits this repo (React app + Cloudflare Pages Functions in production, with a Node runner for local dev).

For a paper-aligned “module map” that links product concepts to concrete code, start with `docs/simulation/vortex-simulation-modules.md`.

For the DB table inventory, see `docs/simulation/vortex-simulation-data-model.md`. For ops controls and admin endpoints, see `docs/ops/vortex-simulation-ops-runbook.md`.

## 1) Stack (recommended)

### Languages

- **TypeScript** end-to-end (web + API + shared domain engine).
- **SQL** for persistent state and analytics.

### Runtime + hosting

- **Cloudflare Pages**: existing frontend hosting.
- **Cloudflare Workers**: API runtime (REST + optional SSE).
- **Cron Triggers**: era rollups / scheduled jobs (implemented as an explicit `/api/clock/tick` endpoint that a scheduler calls).
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
  - canonical state where implemented (votes, formation, courts, era accounting, idempotency, sessions)
  - transitional `read_models` payloads for page DTOs while migrating toward canonical domain tables (v2)
  - append-only event log (feed/audit)
- **Scheduler**:
  - era boundary rollups (governor activity, quorums, tier statuses, CM updates)
  - optional era auto-advance when the era is “due” by configured time (`SIM_ERA_SECONDS`)
  - optional stage-window closure notifications (when `SIM_ENABLE_STAGE_WINDOWS=true`, `POST /api/clock/tick` emits a deduped feed event when a proposal’s pool/vote window ends)

### Key principle: authoritative writes

All state-changing actions go through the API and are validated against:

1. signature-authenticated user session
2. eligibility gate (active human node)
3. domain invariants (stage constraints, one-vote rules, etc.)

## 3) Suggested code modules (implementation shape)

This repo is currently a single frontend app. The backend can live alongside it as:

- `functions/api/*` (Pages Functions routes)
- `functions/_lib/*` (shared server helpers)
- `functions/cloudflare.d.ts` (local typing for `PagesFunction` in editors)
- `functions/tsconfig.json` (separate TS project for `functions/`)
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

- Query Humanode mainnet RPC for “active human node” status via `Session::Validators` (current validator set membership).

### Reads

- `GET /api/feed?cursor=...&stage=...`
- `GET /api/chambers`
- `GET /api/chambers/:id`
- `GET /api/proposals?stage=...`
- `GET /api/proposals/:id/pool`
- `GET /api/proposals/:id/chamber`
- `GET /api/proposals/:id/formation`
- `GET /api/proposals/:id/timeline`
- `GET /api/proposals/drafts`
- `GET /api/proposals/drafts/:id`
- `GET /api/courts`
- `GET /api/courts/:id`
- `GET /api/humans`
- `GET /api/humans/:id`
- `GET /api/clock` (simulation time)
- `GET /api/me` (profile + eligibility snapshot)

### Writes (commands)

Prefer a single command endpoint so invariants are centralized:

- `POST /api/command` → `{ type, payload, idempotencyKey? }`

Implemented in v1:

- `proposal.draft.save` (Phase 12)
- `proposal.draft.delete` (Phase 12)
- `proposal.submitToPool` (Phase 12)
- `pool.vote` (upvote/downvote)
- `chamber.vote` (yes/no/abstain + optional CM score 1–10 on yes votes)
- `formation.join`
- `formation.milestone.submit`
- `formation.milestone.requestUnlock`
- `court.case.report`
- `court.case.verdict`
- `delegation.set`
- `delegation.clear`

Planned (v2+) examples:

-

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

This allows early `GET /api/...` endpoints to serve the exact DTOs expected by `docs/simulation/vortex-simulation-api-contract.md` while we progressively replace `read_models` with real projections.

Local dev modes for reads:

- DB mode: reads start from `read_models` using `DATABASE_URL` and may prefer canonical domain tables where applicable (e.g. proposals).
- Inline fixtures: `READ_MODELS_INLINE=true` (no DB).
- Clean/empty mode: `READ_MODELS_INLINE_EMPTY=true` (list endpoints return `{ items: [] }` and singleton endpoints return minimal defaults).

### Governance time

Current repo:

- `clock_state`: `currentEra`, `updatedAt`

Implemented:

- `era_snapshots`: per-era aggregates (v1: `activeGovernors`)
- `era_user_activity`: per-era counters per address (pool/chamber/courts/formation actions)
- `era_rollups`: per-era rollup output (requirements + active set size for next era)
- `era_user_status`: per-era derived status per address (Ahead/Stable/At risk/etc.)
- `epoch_uptime`: optional (per address, per epoch/week) if Bioauth uptime is modeled in v1/v2

### Current tables (implemented)

- `read_models`: transitional DTO storage for the current UI
- `proposals`: canonical proposal rows (Phase 14)
- `chambers`: canonical chambers (Phase 18)
- `chamber_memberships`: voting eligibility granted by accepted proposals (Phase 17)
- `events`: append-only feed/audit log
- `pool_votes`: unique (proposalId, voterAddress) → up/down
- `chamber_votes`: unique (proposalId, voterAddress) → yes/no/abstain + optional `score` (1–10) on yes votes
- `cm_awards`: CM awards emitted when proposals pass (unique per proposal)
- `idempotency_keys`: stored responses for idempotent command retries
- `era_snapshots`: per-era aggregates (v1: active governors baseline)
- `era_user_activity`: per-era action counters per address
- `era_rollups`: per-era rollup output (requirements + active set size for next era)
- `era_user_status`: per-era derived status per address
- `formation_projects`: per-proposal Formation counters/baselines
- `formation_team`: extra Formation joiners (beyond seed baseline)
- `formation_milestones`: per-proposal milestone status (`todo`/`submitted`/`unlocked`)
- `formation_milestone_events`: append-only milestone submissions/unlock requests
- `proposal_drafts`: author-owned proposal drafts (Phase 12)
- `delegations`: chamber-scoped delegation graph (Phase 29)
- `delegation_events`: append-only delegation history (Phase 29)

### Optional future domain tables (v2+)

- `proposal_stage_transitions`: append-only transition history (v1 transitions exist, but are not stored as a dedicated transitions table)
- `proposal_attachments`: `proposalId`, `title`, `href`
- `cm_lcm`: per-chamber LCM materialization (v1 derives ACM deltas from `cm_awards`)
- `tiers`: materialized tier state (v1 derives statuses via era rollups)

Current repo behavior:

- `pool_votes` exists and is written via `POST /api/command` (`pool.vote`).
- `chamber_votes` exists and is written via `POST /api/command` (`chamber.vote`).
- `cm_awards` exists and is written when proposals pass chamber vote (derived from average yes `score`).
- Read pages overlay live counts:
  - `GET /api/proposals/:id/pool` overlays upvotes/downvotes from `pool_votes`
  - `GET /api/proposals/:id/chamber` overlays yes/no/abstain from `chamber_votes`
- Stage transitions are applied deterministically by a single transition authority:
  - canonical proposals are updated in `proposals`
  - compatibility DTO payloads in `read_models` may also be updated to keep the UI stable
- Proposal timeline is event-backed:
  - `GET /api/proposals/:id/timeline`
  - `events.type = "proposal.timeline.v1"`

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

Implemented (v1):

- Commands:
  - `court.case.report` (per-user report; updates `reports` + can open a live session)
  - `court.case.verdict` (guilty/not_guilty; one-per-user; only when live; ends after enough verdicts)
- Tables:
  - `court_cases`: current status + baseline report count (seeded from read model)
  - `court_reports`: per-user report uniqueness
  - `court_verdicts`: per-user verdicts
- Read overlay:
  - `GET /api/courts` and `GET /api/courts/:id` overlay live `reports` + `status` from stored state

Planned (later phases):

- `court_evidence`: `caseId`, `title`, `href`, `addedByUserId`, `createdAt`
- `court_outcomes`: `caseId`, `result`, `recommendationsJson`

### Delegation

Implemented (v1):

- Commands:
  - `delegation.set`
  - `delegation.clear`
- Tables:
  - `delegations`: `(chamber_id, delegator_address) → delegatee_address`
  - `delegation_events`: append-only history (`set` / `clear`)
- Semantics:
  - delegation affects **chamber vote weighting** only
  - proposal-pool attention remains direct-only
  - a delegator’s voice only counts if the delegator did **not** cast a chamber vote themselves

### Feed / audit trail

- `events` (append-only):
  - `id`, `type`, `actorUserId?`, `entityType`, `entityId`, `payloadJson`, `createdAt`

In the current repo implementation, `events` exists as an append-only Postgres table and `GET /api/feed` can be served from it in DB mode.

## 6) Mapping: processes → modules → APIs → tables/events

This section maps each workflow from `docs/simulation/vortex-simulation-processes.md` to concrete tech.

### 2.0 Authentication + gating

- **Module:** `auth`, `gate`
- **API:** `/api/auth/nonce`, `/api/auth/verify`, `/api/gate/status`
- **Tables:** `users`, `auth_nonces`, `eligibility_cache`
- **Events:** `auth.logged_in`, `gate.checked`

### 2.0b Request hardening (rate limits + action locks)

- **Module:** `hardening`
- **API:**
  - `POST /api/command` (rate limited per IP + per address)
  - `POST /api/command` (optional per-era quotas for counted actions)
  - `POST /api/admin/users/lock`, `POST /api/admin/users/unlock` (admin-only)
  - `GET /api/admin/users/locks`, `GET /api/admin/users/:address` (inspection)
  - `GET /api/admin/audit` (admin actions audit log)
  - `GET /api/admin/stats` (ops metrics snapshot)
  - `POST /api/admin/writes/freeze` (toggle global write freeze)
- **Tables:**
  - `api_rate_limits` (DB mode)
  - `era_user_activity` (per-era counters used for quota enforcement and rollups)
  - `user_action_locks` (DB mode)
  - `events` (DB mode; admin actions are logged as `admin.action.v1`)
  - `admin_state` (DB mode; write freeze flag)
- **Notes:**
  - Rate limiting and action locks are enforced server-side for all state changes so the simulation stays usable during community testing.
  - Era quotas enforce a cap on new counted actions (vote/report/join) while still allowing edits (changing a vote) without consuming additional quota.
  - Admin actions are appended to an audit log (memory mode for local dev, `events` table for DB mode).
  - A write freeze can be toggled via admin endpoints (and overridden by a deploy-time env kill switch).

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

- **Module:** `clock`, `eraStore`
- **API:** `GET /api/clock`, `POST /api/clock/advance-era`
- **Tables:** `clock_state`, `era_snapshots`, `era_user_activity`

Planned:

- **Module:** `governanceTime`, `tiers`, `cm`, `proposals`, `feed`
- **Tables:** `tiers` (or equivalent tier status table), proposal aggregates, `events`
- **Events:** `era.rolled`, `quorum.baseline_updated`, `proposal.advanced`

### 2.3 Proposal drafting (wizard)

Current repo:

- **Module:** `proposals.draft`
- **API:** `POST /api/command` (`proposal.draft.save`, `proposal.submitToPool`)
- **Tables:** `proposal_drafts`, `proposals`
- **Events:** timeline entries in `events` (`proposal.timeline.v1`)

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
- **API:** `POST /api/command` (`court.case.report`, `court.case.verdict`)
- **Tables:** `court_cases`, `court_reports`, `court_verdicts`
- **Events:** `court.case_opened`, `court.report_added`, `court.session_live`, `court.verdict_cast`, `court.case_closed`

### 2.8 Delegation management

- **Module:** `delegation`
- **API:** `POST /api/command` (`delegation.set`, `delegation.clear`)
- **Tables:** `delegations`, `delegation_events`
- **Events:** `delegation.set`, `delegation.cleared`

### 2.9 Chambers directory + chamber detail

- **Module:** `chambers`
- **API:** `GET /api/chambers`, `GET /api/chambers/:id`
- **Tables:** `chambers`, `chamber_memberships`, `proposals` (derived counts), optional `read_models` fallback
- **Events:** chamber create/dissolve side-effects are appended via proposal timeline events (and/or feed events, depending on stage)

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
- Next migrations continue moving from `read_models` to canonical tables + event-backed projections, while keeping DTOs stable.
