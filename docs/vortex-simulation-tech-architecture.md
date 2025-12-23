# Vortex Simulation Backend — Tech Architecture (Mapped to Processes)

This document maps the domain workflows in `docs/vortex-simulation-processes.md` onto an implementable technical architecture.

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

- **Chosen for v1: Postgres** (Neon or Supabase) for “proper” user history, analytics, and relational integrity.
- Optional later: D1 can be used for Cloudflare-only prototypes, but v1 should start on Postgres to avoid a DB migration during the community simulation.

Important: because the API runtime is Cloudflare Workers/Pages Functions (edge), v1 should use a Postgres provider that supports **serverless/HTTP connectivity** from edge runtimes.

- Recommended: **Neon Postgres** (works with `@neondatabase/serverless` + Drizzle).

### Libraries / tools

- **Drizzle ORM** (Postgres; can also target D1 if needed).
- **zod** (request validation).
- **viem** (or ethers) for signature verification and RPC reads.
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

If you later split into a monorepo, these become:

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

- Query Humanode mainnet RPC for online status via the chain’s **`im_online` pallet**.

### Reads

- `GET /api/feed?cursor=...&stage=...`
- `GET /api/chambers`
- `GET /api/chambers/:id`
- `GET /api/proposals?stage=...`
- `GET /api/proposals/:id`
- `GET /api/courts`
- `GET /api/courts/:id`
- `GET /api/humans/:id`
- `GET /api/me` (profile + eligibility snapshot)

### Writes (commands)

Prefer a single command endpoint so invariants are centralized:

- `POST /api/command` → `{ type, payload, idempotencyKey? }`

Examples:

- `proposal.draft.save`
- `proposal.submitToPool`
- `pool.vote` (upvote/downvote)
- `chamber.vote` (yes/no/abstain + optional CM score)
- `formation.join`
- `formation.milestone.submit`
- `formation.milestone.requestUnlock`
- `court.case.report`
- `court.case.verdict`
- `delegation.set`
- `delegation.clear`

## 5) Data model (tables) — minimal set

These tables support the workflows and auditability; you can start lean and expand.

### Identity / auth

- `users` (account): `id`, `address`, `displayName`, `createdAt`
- `auth_nonces`: `address`, `nonce`, `expiresAt`, `usedAt`
- `sessions` (if not JWT-only): `id`, `userId`, `expiresAt`

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

### Governance time

- `clock_state`: `currentEpoch`, `currentEra`, `updatedAt`
- `era_snapshots`: per-era aggregates (active governors, quorum baselines, etc.)
- `epoch_uptime`: optional (per address, per epoch/week) if you want Bioauth modeling

### Chambers + membership

- `chambers`: `id`, `name`, `multiplier`
- `chamber_membership`: `chamberId`, `userId`, `sinceEra`

### CM / tiers

- `cm_lcm`: (`userId`, `chamberId`, `lcm`)
- `tiers`: (`userId`, `tier`, `status`, `streaks`, `updatedAt`)

### Proposals

- `proposals`: `id`, `title`, `chamberId`, `stage`, `proposerUserId`, `createdAt`, `updatedAt`
- `proposal_drafts`: `proposalId`, structured form fields, `updatedAt`
- `pool_votes`: `proposalId`, `userId`, `direction` (+1/-1), `createdAt`
- `chamber_votes`: `proposalId`, `userId`, `vote` (yes/no/abstain), `cmScore?`, `createdAt`
- `proposal_stage_transitions`: `proposalId`, `fromStage`, `toStage`, `atEra`, `atTime`
- `proposal_attachments`: `proposalId`, `title`, `href`

### Formation

- `formation_projects`: `proposalId`, `stage`, `budgetTotal`, `budgetAllocated`, `teamSlotsTotal`, `teamSlotsFilled`
- `formation_team`: `proposalId`, `userId`, `role`, `status`
- `formation_milestones`: `proposalId`, `milestoneId`, `title`, `status`, `unlockAmount`, `acceptanceNotes`
- `formation_milestone_events`: submissions, disputes, unlock decisions

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

## 6) Mapping: processes → modules → APIs → tables/events

This section maps each workflow from `docs/vortex-simulation-processes.md` to concrete tech.

### 2.0 Authentication + gating

- **Module:** `auth`, `gate`
- **API:** `/api/auth/nonce`, `/api/auth/verify`, `/api/gate/status`
- **Tables:** `users`, `auth_nonces`, `eligibility_cache`
- **Events:** `auth.logged_in`, `gate.checked`

### 2.1 Onboarding (Human → Human Node → Governor)

- **Module:** `identity`, `eligibility`, `tiers`
- **API:** `GET /api/me` (derived view), optional admin `POST /api/admin/sync-eligibility`
- **Tables:** `users`, `eligibility_cache`, `tiers`
- **Events:** `human.verified`, `human_node.eligible`, `tier.updated`

### 2.2 Era rollup (cron)

- **Module:** `governanceTime`, `tiers`, `cm`, `proposals`, `feed`
- **API:** none (cron-triggered), optional admin `POST /api/clock/advance-era`
- **Tables:** `clock_state`, `era_snapshots`, `tiers`, `cm_lcm`, `proposal_stage_transitions`, `events`
- **Events:** `era.rolled`, `quorum.baseline_updated`, `proposal.advanced`

### 2.3 Proposal drafting (wizard)

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
- **Tables:** `chamber_votes`, `proposal_stage_transitions`, `cm_lcm`
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
- **Events:** none required (derived), but can emit `chamber.stats_updated` on rollup if you materialize.

### 2.10 Invision insights

- **Module:** `invision` (derived scoring)
- **API:** `GET /api/humans/:id` (includes insights)
- **Tables:** derived from `events`, proposals/courts/milestones; optionally `invision_snapshots`
- **Events:** `invision.updated` (optional)

## 7) Concurrency + integrity (why Durable Objects may be needed)

If multiple users vote at once, you must prevent:

- double-voting
- inconsistent quorum counters
- stage transitions happening twice

Two approaches:

- **DB constraints + transactions** (Postgres can do this well).
- **Durable Object per entity** (proposal/case) that serializes commands.

Recommendation:

- Start with DB constraints + transactions.
- Add DOs for high-contention entities (popular proposals) or if you want simpler correctness in Worker code.

## 8) Anti-abuse controls (even for eligible human nodes)

- Per-era action limits (proposal submissions, reports, etc.)
- Idempotency keys for commands (client retries)
- Rate limiting per address (Worker middleware)
- Court/report spam prevention (minimum stake is out-of-scope unless you later add it as a simulated rule)

## 9) Migration path from today’s mock data

- Keep the frontend pages as-is but replace `src/data/mock/*` reads with API reads incrementally.
- Start with read-only endpoints (`/api/chambers`, `/api/proposals`, `/api/feed`).
- Add auth + gate + disable buttons unless eligible.
- Then enable write commands for pool/vote first (most visible).
