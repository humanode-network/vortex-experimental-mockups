# Vortex Simulation Backend — Implementation Plan

This plan turns `docs/vortex-simulation-processes.md` + `docs/vortex-simulation-tech-architecture.md` into an executable roadmap that stays aligned with the current UI.

## Current status (what exists in the repo right now)

Implemented (v1 simulation backend):

- Cloudflare Pages Functions under `functions/`
- Auth + gate (wallet signature + mainnet eligibility):
  - `GET /api/health`
  - `POST /api/auth/nonce` (sets `vortex_nonce` cookie)
  - `POST /api/auth/verify` (sets `vortex_session` cookie; Substrate signature verification)
  - `POST /api/auth/logout`
  - `GET /api/me`
  - `GET /api/gate/status` (Humanode mainnet RPC gating; dev bypass supported)
- Cookie-signed nonce + session helpers (requires `SESSION_SECRET`)
- Dev toggles for local progress:
  - `DEV_BYPASS_SIGNATURE`, `DEV_BYPASS_GATE`, `DEV_ELIGIBLE_ADDRESSES`, `DEV_INSECURE_COOKIES`
- Local dev notes: `docs/vortex-simulation-local-dev.md`
- Test harness + CI:
  - `yarn test` (Node’s built-in test runner)
  - CI runs `yarn test` via `.github/workflows/code.yml`
  - API tests: `tests/api-*.test.js`
- v1 decisions + contracts (kept aligned with the UI):
  - v1 constants: `docs/vortex-simulation-v1-constants.md`
  - API contract: `docs/vortex-simulation-api-contract.md`
  - DTO types: `src/types/api.ts`
- Postgres (Drizzle) schema + migrations + seed scripts:
  - Drizzle config: `drizzle.config.ts`
  - Schema: `db/schema.ts`
  - Seed script: `scripts/db-seed.ts` (writes read-model payloads into `read_models` + seeds `events`)
  - DB scripts: `yarn db:generate`, `yarn db:migrate`, `yarn db:seed`
  - Clear script: `yarn db:clear` (wipe data, keep schema)
  - Seed tests: `tests/db-seed.test.js`, `tests/migrations.test.js`
- Read endpoints for all pages (Phase 4 read-model bridge):
  - `functions/api/*` serves Chambers, Proposals, Feed, Courts, Humans, Factions, Formation, Invision, My Governance
  - Clean-by-default mode supported (`READ_MODELS_INLINE_EMPTY=true`), with a shared UI empty state bar (`src/components/NoDataYetBar.tsx`)
- Event log backbone:
  - `events` table + schemas + projector; Feed can be served from DB events in DB mode
  - Tests: `tests/events-seed.test.js`, `tests/feed-event-projector.test.js`
- Write slices via `POST /api/command` (auth + gate + idempotency + live overlays):
  - Proposal pool voting (`pool.vote`) + pool → vote auto-advance
  - Chamber voting (`chamber.vote`) + CM awards + vote → build auto-advance (when Formation-eligible)
  - Formation v1 (`formation.join`, `formation.milestone.submit`, `formation.milestone.requestUnlock`)
  - Courts v1 (`court.case.report`, `court.case.verdict`)
  - Era snapshots + per-era activity counters (`/api/clock/*` + `/api/my-governance`)
  - Era rollups + tier statuses (`POST /api/clock/rollup-era`)
- Hardening + ops controls:
  - Rate limiting, per-era quotas, idempotency conflict detection
  - Admin tools: action locks, audit/inspection, stats, global write freeze
  - Tests: `tests/api-command-*.test.js`, `tests/api-admin-*.test.js`

Not implemented (intentional v1 gaps):

- Replacing transitional `read_models` with fully normalized domain tables + event-driven projections
- Time-windowed stage logic (vote windows, scheduled transitions) beyond manual/admin clock ops
- Delegation flows and any “real” forum/thread product (threads remain minimal)

## Guiding principles

- Ship a **thin vertical slice** first: auth → gate → read models → one write action → feed events.
- Keep domain logic **pure and shared** (state machine + events). The API is a thin adapter.
- Prefer **deterministic**, testable transitions; avoid “magic UI-only numbers”.
- Enforce gating on **every write**: “browse open, write gated”.
- Minimize UI churn: keep the frozen DTOs (`docs/vortex-simulation-api-contract.md` + `src/types/api.ts`) stable while the backend transitions from `read_models` to normalized tables + an event log.

## Testing requirement (applies to every phase)

Each phase is considered “done” only when tests are added and run.

Testing layers:

1. **Unit tests** (pure TS): state machines, invariants, calculations (quorums, passing rules, tier rules).
2. **API integration tests**: call Pages Functions handlers with `Request` objects and assert status/JSON/cookies.
3. **DB integration tests** (once DB exists): migrations apply, basic queries work, constraints enforced.

Test execution policy:

- Add a `yarn test` script and run it after each feature batch.
- Keep CI in sync (extend `.github/workflows/code.yml` to run `yarn test` and `yarn build` once tests exist).

Tooling note: Pages Functions handlers are tested directly via `Request` objects (no browser/manual flow needed for API testing).

## Execution sequence (phases in order)

This is the order we’ll follow from now on, based on what’s already landed.

1. **Phase 0 — Lock v1 decisions (DONE)**
2. **Phase 1 — Freeze API contracts (DTOs) (DONE)**
3. **Phase 2a — API skeleton (DONE)**
4. **Phase 2b — Test harness for API + domain (DONE)**
5. **Phase 2c — DB skeleton + migrations + seed-from-fixtures (DONE)**
6. **Phase 3 — Auth + eligibility gate (DONE)**
7. **Phase 4 — Read models first (all pages, clean-by-default) (DONE)**
8. **Phase 5 — Event log backbone (DONE)**
9. **Phase 6 — First write slice (pool voting) (DONE)**
10. **Phase 7 — Chamber vote + CM awarding (DONE)**
11. **Phase 8 — Formation v1 (DONE)**
12. **Phase 9 — Courts v1 (DONE)**
13. **Phase 10a — Era snapshots + activity counters (DONE)**
14. **Phase 10b — Era rollups + tier statuses (DONE for v1)**
15. **Phase 11 — Hardening + moderation**
16. **Phase 12 — Proposal drafts + submission (DONE)**
17. **Phase 13 — Canonical domain tables + projections (PLANNED)**
18. **Phase 14 — Deterministic state transitions (PLANNED)**
19. **Phase 15 — Time windows + automation (PLANNED)**
20. **Phase 16 — Delegation v1 (PLANNED)**

## Phase 0 — Lock v1 decisions (required before DB + real gate)

Locked for v1 (based on current decisions):

1. Database: **Postgres** (Neon-compatible serverless Postgres).
2. Gating source: **Humanode mainnet RPC** (no Subscan dependency for v1).
3. Active Human Node rule: “active” derived via RPC reads from `ImOnline::*` (with a safe fallback to `Session::Validators` in v1).
4. Era length: **configured by us off-chain** (a simulation constant), not a chain parameter.

Deliverable: a short “v1 constants” section committed to docs or config.

Tests:

- None required (doc-only), but we must record decisions so later tests can assert exact thresholds/constants.

## Phase 1 — Define contracts that mirror the UI (1–2 days)

The UI renders from `/api/*` reads. The contract is frozen so backend and frontend stay aligned while the implementation evolves.

Contract location:

- `docs/vortex-simulation-api-contract.md` (human-readable source of truth)
- `src/types/api.ts` (TS source of truth for DTOs)

1. Define response DTOs that match the current UI needs:
   - Chambers directory card: id/name/multiplier + stats + pipeline.
   - Chamber detail: stage-filtered proposals + governors + threads/chat.
   - Proposals list: the exact data currently rendered in collapsed/expanded cards.
   - Proposal pages: PP / Chamber vote / Formation page models.
   - Courts list + courtroom page model.
   - Human nodes list + profile model.
   - Feed item model (the card layout currently used).
2. Decide how IDs work across the system (proposalId, chamberId, humanId) and make them consistent.

Deliverable: a short “API contract v1” section (types + endpoint list) that the backend must satisfy.

Tests:

- Add unit tests that validate DTO payload shapes against deterministic seed fixtures (smoke: “fixture data can be encoded into the DTOs without loss”).

## Phase 2a — API skeleton (DONE)

Delivered in this repo:

- Pages Functions routes: `health`, `auth`, `me`, `gate`
- Cookie-signed nonce/session (requires `SESSION_SECRET`)
- Dev bypass knobs while we build real auth/gate

Tests (implemented):

- `GET /api/health` returns `{ ok: true }`.
- `POST /api/auth/nonce` returns a nonce and sets a `vortex_nonce` cookie.
- `POST /api/auth/verify`:
  - rejects invalid signatures when bypass is disabled
  - succeeds and sets `vortex_session` for valid signatures (or when bypass is enabled)
- `GET /api/me` reflects authentication state
- `GET /api/gate/status` returns `not_authenticated` when logged out

## Phase 2b — Test harness for API + domain (DONE)

Implementation:

- `tests/` folder + `yarn test` script are in place.
- Tests import Pages Functions handlers directly and exercise them with synthetic `Request` objects.
- CI runs `yarn test` (see `.github/workflows/code.yml`).

## Phase 2c — DB skeleton (1–3 days)

Implemented so far:

1. Drizzle config + Postgres schema:
   - `drizzle.config.ts`
   - `db/schema.ts`
   - generated migration under `db/migrations/`
2. Seed-from-mocks into `read_models`:
   - `db/seed/readModels.ts` (pure seed builder)
   - `scripts/db-seed.ts`
   - `yarn db:seed` (requires `DATABASE_URL`)
3. Tests:
   - `tests/migrations.test.js` asserts core tables are present in the migration.
   - `tests/db-seed.test.js` asserts the seed is deterministic, unique-keyed, and JSON-safe.
4. Transitional read endpoints (Phase 2c/4 bridge):
   - Read-model store: `functions/_lib/readModelsStore.ts` (DB mode via `DATABASE_URL` + inline mode via `READ_MODELS_INLINE=true`)
   - Endpoints: `GET /api/chambers`, `GET /api/proposals`, `GET /api/courts`, `GET /api/humans` (+ per-entity detail routes)
5. Simulation clock (admin-only for advancement):
   - `GET /api/clock`
   - `POST /api/clock/advance-era` (requires `ADMIN_SECRET` via `x-admin-secret`, unless `DEV_BYPASS_ADMIN=true`)

Ops checklist (to validate Phase 2c against a real DB):

- Create a Postgres DB (v1: Neon) and set `DATABASE_URL`.
- Run: `yarn db:migrate && yarn db:seed`.
- Verify reads are served from Postgres by unsetting `READ_MODELS_INLINE`.

Deliverable: deployed API that responds and can connect to the DB.

Tests:

- Migrations apply cleanly on a fresh DB.
- Seed job is idempotent (run twice yields the same IDs/state).
- Read endpoints return deterministic results from seeded data.

## Phase 3 — Auth + eligibility gate (3–7 days)

1. `POST /api/auth/nonce`:
   - store nonce with expiry
   - rate limit per IP/address
2. `POST /api/auth/verify`:
   - verify signature
   - create/find `users` row
   - create session cookie/JWT
3. `GET /api/gate/status`:
   - read session address
   - query eligibility via RPC (`ImOnline::*` with a safe fallback to `Session::Validators` in v1)
   - cache result with TTL (`eligibility_cache`)
4. Frontend wiring:
   - show wallet connect/disconnect + gate status in the sidebar (Polkadot extension)
   - disable all write buttons unless eligible (and show a short reason on hover)
   - allow non-eligible users to browse everything

Frontend flag:

- `VITE_SIM_AUTH` controls the sidebar wallet panel and client-side gating UI (default enabled; set `VITE_SIM_AUTH=false` to disable).

Deliverable: users can log in; the UI knows if they’re eligible; buttons are blocked for non-eligible users.

Tests:

- Nonce expires; nonce is single-use.
- Nonce issuance is rate-limited per IP.
- Signature verification passes for valid signatures and fails for invalid ones.
- Eligibility check caches with TTL and returns consistent `expiresAt`.
- Write endpoints that change state are introduced in later phases; Phase 3 only gates UI interactions and exposes `/api/me` + `/api/gate/status`.

## Phase 4 — Read models first (3–8 days)

Goal: keep the app fully read-model driven via `/api/*` while the backend transitions from the `read_models` bridge to normalized tables + an event log.

Read endpoints covered in this phase:

1. Chambers
   - `GET /api/chambers`
   - `GET /api/chambers/:id`
2. Proposals
   - `GET /api/proposals?stage=...`
   - `GET /api/proposals/:id/pool`
   - `GET /api/proposals/:id/chamber`
   - `GET /api/proposals/:id/formation`
   - `GET /api/proposals/drafts`
   - `GET /api/proposals/drafts/:id`
3. Feed
   - `GET /api/feed?cursor=...&stage=...` (cursor can land later; stage filtering is already supported)
4. Courts
   - `GET /api/courts`
   - `GET /api/courts/:id`
5. Human nodes
   - `GET /api/humans`
   - `GET /api/humans/:id`
6. Factions
   - `GET /api/factions`
   - `GET /api/factions/:id`
7. Singletons/dashboards
   - `GET /api/formation`
   - `GET /api/invision`
   - `GET /api/my-governance`

Frontend:

- Use the existing `src/lib/apiClient.ts` wrapper (typed helpers, error handling).
- Keep visuals stable; the data source remains `/api/*`.
- Empty-by-default UX: when the backend returns an empty list, pages show “No … yet” (no fixture fallbacks).

Deliverable: app renders from backend reads across all pages, with clean empty-state behavior by default.

Tests:

- API contract stability checks (seeded inline mode returns DTO-shaped payloads).
- Empty-mode checks: list endpoints return `{ items: [] }` and singleton endpoints return minimal defaults when the read-model store is empty (`READ_MODELS_INLINE_EMPTY=true`).

## Phase 5 — Event log (feed) as the backbone (2–6 days)

1. Create `events` table (append-only).
2. Define event types (union) and payload schemas (zod).
3. Implement a simple “projector”:
   - basic derived feed cards from events
   - cursors for pagination
4. Backfill initial events from seeded mock data (so the feed isn’t empty on day 1).
   - Use `db/seed/fixtures/*` as the deterministic starting point for the initial backfill.

Deliverable: feed is powered by real events; pages can also show histories from the event stream.

Tests:

- Events are append-only (no updates/deletes).
- Projector determinism: given the same event stream, derived feed cards are identical.

## Phase 6 — First write slice: Proposal pool voting (4–10 days)

1. Implement `POST /api/command` with:
   - auth required
   - gating required (`isActiveHumanNode`)
   - idempotency key support
2. Implement `pool.vote` command:
   - write pool vote with unique constraint (proposalId + voter address)
   - return updated upvote/downvote counts
   - overlay live counts in `GET /api/proposals/:id/pool`
   - compute quorum thresholds and stage transitions (pool → vote)
3. Frontend:
   - ProposalPP page upvote/downvote calls API
   - optimistic UI optional (but must reconcile)

Current status:

- Implemented:
  - `POST /api/command` + `pool.vote` with idempotency
  - `pool_votes` storage (DB mode) with in-memory fallback for tests/dev without a DB
  - Proposal pool page reads overlay the live vote counts
  - Pool quorum evaluator (`evaluatePoolQuorum`) and pool → vote auto-advance when thresholds are met
    - the proposal stage is advanced by updating the `proposals:list` read model
    - if the chamber page read model is missing, it is created from the pool page payload
  - Pool voting is rejected when a proposal is no longer in the pool stage (HTTP 409)
  - ProposalPP UI calls `pool.vote` and refetches the pool page on success
- Not implemented yet:
  - writing normalized proposal state transitions (beyond the UI read models)

Deliverable: users can perform one real action (pool vote) and see it in metrics + feed.

Tests:

- One vote per user per proposal (idempotency + uniqueness).
- Pool metrics computed correctly from votes + era baselines.
- Stage transition triggers exactly once when thresholds are met.

## Phase 7 — Chamber vote (decision) + CM awarding (5–14 days)

1. Add `chamber.vote` command:
   - yes/no/abstain
   - quorum + passing rule evaluation
   - emit events
2. On pass:
   - transition to Formation if eligible
   - award CM (LCM per chamber) and recompute derived ACM
3. Frontend:
   - ProposalChamber becomes real

Deliverable: end-to-end proposal lifecycle from pool → vote (pass/fail) is operational.

Tests:

- Vote constraints (one vote per user, valid choices).
- Quorum + passing calculation accuracy (including rounding rules like 66.6%).
- CM awarding updates LCM/MCM/ACM deterministically after acceptance.

Current status:

- Implemented:
  - `chamber.vote` command via `POST /api/command` (auth + gate + idempotency)
  - `chamber_votes` storage (DB mode) with in-memory fallback for tests/dev without a DB
  - Chamber page reads overlay live vote counts in `GET /api/proposals/:id/chamber`
  - Vote → build auto-advance when quorum + passing are met and `formationEligible === true`
    - the proposal stage is advanced by updating the `proposals:list` read model
    - if the formation page read model is missing, it is generated from the chamber page payload
  - CM awarding v1:
    - `score` (1–10) can be attached to yes votes
    - when a proposal passes, the average yes score is converted into CM points and recorded in `cm_awards`
    - human ACM is derived as a baseline from read models plus a delta from `cm_awards` (overlaid in `/api/humans*`)
- Not implemented yet:
  - rejection / fail path and time-based vote windows
  - richer CM economy (per-chamber breakdowns, ACM/LCM/MCM surfaces across all pages, parameter tuning)

## Phase 8 — Formation v1 (execution) (5–14 days)

1. Formation project row is created when proposal enters Formation.
2. `formation.join` fills team slots.
3. `formation.milestone.submit` records deliverables.
4. `formation.milestone.requestUnlock` emits an event; acceptance can be mocked initially.
5. Formation metrics and pages read from DB/events.

Deliverable: Formation pages become real and emit feed events.

Tests:

- Team slots cannot exceed total.
- Milestone unlock rules enforced (cannot unlock before request; cannot double-unlock).

Current status:

- Implemented:
  - Formation tables: `formation_projects`, `formation_team`, `formation_milestones`, `formation_milestone_events`
  - Commands:
    - `formation.join`
    - `formation.milestone.submit`
    - `formation.milestone.requestUnlock`
  - Formation read overlays in `GET /api/proposals/:id/formation` (team slots + milestone counts + progress)
  - Minimal UI wiring on the Formation proposal page (actions call `/api/command`)
- Tests:
  - `tests/api-command-formation.test.js`

## Phase 9 — Courts v1 (disputes) (5–14 days)

1. `court.case.report` creates or increments cases.
2. Case state machine: Jury → Session live → Ended (driven by time or thresholds).
3. `court.case.verdict` records guilty/not-guilty.
4. Outcome hooks (v1):
   - hold/release a milestone unlock request
   - flag identity as “restricted” (simulation only)

Deliverable: courts flow works and affects off-chain simulation outcomes.

Tests:

- Case state machine transitions are valid only.
- Verdict is single-per-user and only allowed in appropriate case states.
- Outcome hooks apply the intended flags (hold/release/restrict).

Current status:

- Implemented:
  - Courts tables: `court_cases`, `court_reports`, `court_verdicts`
  - Commands:
    - `court.case.report`
    - `court.case.verdict`
  - Courts read overlays:
    - `GET /api/courts`
    - `GET /api/courts/:id`
  - Minimal UI wiring:
    - Courtroom `Report` action and verdict buttons call `/api/command`
- Tests:
  - `tests/api-command-courts.test.js`

## Phase 10a — Era snapshots + activity counters (DONE)

Goal: make “time” and “activity” real, without changing UI contracts.

Implemented:

- Tables:
  - `era_snapshots` (per-era aggregates, including `activeGovernors`)
  - `era_user_activity` (per-era counters for actions)
- Active governors baseline:
  - `SIM_ACTIVE_GOVERNORS` (or `VORTEX_ACTIVE_GOVERNORS`) sets the default baseline.
  - Defaults to `150` if unset/invalid.
- `POST /api/clock/advance-era` ensures the next `era_snapshots` row exists.
- Proposal page overlays:
  - `GET /api/proposals/:id/pool` and `GET /api/proposals/:id/chamber` override `activeGovernors` from the current era snapshot.
- My Governance overlay:
  - `GET /api/my-governance` returns the base read model for anonymous users.
  - When authenticated, the response overlays per-era `done` counts from `era_user_activity` (mapped by action label).
- Era counters are incremented only on first-time actions:
  - Vote updates do not inflate era activity (e.g. changing an upvote to a downvote stays a single action).

Tests:

- `tests/api-era-activity.test.js` (per-era action counting and reset across `advance-era`).

## Phase 10b — Era rollups + tier statuses (DONE for v1)

1. Implement cron rollup:
   - freeze era action counts
   - compute `isActiveGovernorNextEra`
   - compute tier decay + statuses (Ahead/Stable/Falling behind/At risk/Losing status)
   - update quorum baselines
2. Store `era_snapshots` and emit `era.rolled` events.

Deliverable: system “moves” with time and feels like governance.

Tests:

- Rollup is deterministic and idempotent for a given era window.
- Tier status mapping (Ahead/Stable/Falling behind/At risk/Losing status) matches policy.

Current status:

- Implemented:
  - `POST /api/clock/rollup-era` (admin/simulation endpoint)
  - `GET /api/clock` includes `activeGovernors` and `currentEraRollup` when a rollup exists
  - `GET /api/my-governance` includes `rollup` for authenticated users when the current era is rolled
  - Rollup tables: `era_rollups`, `era_user_status`
  - Configurable per-era requirements via env:
    - `SIM_REQUIRED_POOL_VOTES` (default `1`)
    - `SIM_REQUIRED_CHAMBER_VOTES` (default `1`)
    - `SIM_REQUIRED_COURT_ACTIONS` (default `0`)
    - `SIM_REQUIRED_FORMATION_ACTIONS` (default `0`)
  - Optional dynamic baseline:
    - `SIM_DYNAMIC_ACTIVE_GOVERNORS=true` writes next era’s `era_snapshots.active_governors` from rollup results
- Tests:
  - `tests/api-era-rollup.test.js`
  - `tests/api-my-governance-rollup.test.js`

Notes:

- Tier decay is tracked separately (future iteration) — v1 rollups compute per-era status + next-era active set only.

## Phase 11 — Hardening + moderation (DONE for v1)

- Rate limiting (per IP/address) and anti-spam (per-era quotas).
- Auditability: make all state transitions and changes event-backed.
- Admin tools: manual “advance era”, seed data, freeze/unfreeze.
- Observability: logs + basic metrics for rollups and gating failures.
- Moderation controls (off-chain):
  - temporary action lock for a user
  - court-driven restrictions flags (simulation)

Current status:

- `POST /api/command` rate limiting:
  - per IP: `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP`
  - per address: `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS`
  - storage: `api_rate_limits` (DB mode) or in-memory buckets (inline mode)
- Per-era quotas (anti-spam):
  - `SIM_MAX_POOL_VOTES_PER_ERA`
  - `SIM_MAX_CHAMBER_VOTES_PER_ERA`
  - `SIM_MAX_COURT_ACTIONS_PER_ERA`
  - `SIM_MAX_FORMATION_ACTIONS_PER_ERA`
  - enforcement uses the same “counted actions” as rollups (`era_user_activity`)
- Action locks:
  - storage: `user_action_locks` (DB mode) or in-memory locks (inline mode)
  - enforcement: all `POST /api/command` writes return HTTP `403` when locked
  - admin endpoints:
    - `POST /api/admin/users/lock`
    - `POST /api/admin/users/unlock`
  - inspection endpoints:
    - `GET /api/admin/users/locks`
    - `GET /api/admin/users/:address`
  - audit:
    - `GET /api/admin/audit`
    - DB mode logs as `events.type = "admin.action.v1"`
- Operational admin endpoints:
  - `GET /api/admin/stats` (basic metrics + config snapshot)
  - `POST /api/admin/writes/freeze` (toggle write-freeze state)
  - deploy-time kill switch: `SIM_WRITE_FREEZE=true`
- Tests:
  - `tests/api-command-rate-limit.test.js`
  - `tests/api-command-action-lock.test.js`
  - `tests/api-command-era-quotas.test.js`
  - `tests/api-admin-tools.test.js`
  - `tests/api-admin-write-freeze.test.js`

Notes:

- `POST /api/clock/*` remains the admin surface for simulation time operations; `POST /api/admin/*` is for moderation/ops.

## Suggested implementation order (lowest risk / highest value)

1. Auth + gate
2. Read models for Chambers + Proposals + Feed
3. Event log
4. Pool voting
5. Chamber voting + CM awarding
6. Formation
7. Courts
8. Era rollups + tier statuses

## Milestone definition for “proto-vortex launch”

Minimum viable proto-vortex for community:

- Login with wallet signature
- Eligibility gate from mainnet
- Read-only browsing for all users
- Eligible users can:
  - upvote/downvote in pool
  - vote yes/no/abstain in chamber vote
- Feed shows real events
- Era rollup runs at least manually (admin endpoint)

## Notes specific to the current UI

- The UI already has the key surfaces for v1:
  - `ProposalCreation` wizard (draft), ProposalPP (pool), ProposalChamber (vote), ProposalFormation (formation), Courts/Courtroom (courts).
- Keep returning API payloads that match the frozen DTOs so UI components remain stable.

## Post-v1 roadmap (v2+)

v1 is a complete, community-playable simulation slice. The next phases focus on replacing transitional components (`read_models`-driven state) with canonical domain tables and a fuller write model, while keeping the current UI DTOs stable.

### Phase 12 — Proposal drafts + submission (DONE)

Goal: make the ProposalCreation wizard a real write path (drafts stored in DB, submitted into the pool), without requiring a backend redesign.

Deliverables:

- Commands (via `POST /api/command`):
  - `proposal.draft.save` (create/update a draft)
  - `proposal.draft.delete`
  - `proposal.submitToPool` (transition a draft into `pool`)
- Reads:
  - `GET /api/proposals/drafts`
  - `GET /api/proposals/drafts/:id`
  - drafts appear as real data (not seed-only) in DB mode
- Minimal validation that matches the wizard gates (required fields for submission).
- Emit events:
  - `proposal.draft.saved`, `proposal.submittedToPool`

Tests:

- Draft save is idempotent (Idempotency-Key) and never duplicates.
- Submission enforces required fields and stage (`draft` → `pool` only).
- Non-eligible users can browse drafts only if explicitly allowed (default: drafts are private to the author).

Current status:

- `proposal_drafts` table exists (migration + schema).
- `POST /api/command` implements `proposal.draft.save`, `proposal.draft.delete`, `proposal.submitToPool`.
- Draft read endpoints support author-owned drafts in DB mode and memory drafts in non-DB mode, with fixture fallback in `READ_MODELS_INLINE=true`.
- ProposalCreation UI saves drafts via the backend and submits drafts into the proposal pool.
- Tests added: `tests/api-command-drafts.test.js`.

### Phase 13 — Canonical domain tables + projections (PLANNED)

Goal: start migrating away from `read_models` as the “source of truth” by introducing canonical tables for entities that are actively mutated (starting with proposals).

Deliverables:

- Introduce canonical tables (v1 order):
  - `proposals` (canonical state: stage, chamber, proposer, formation eligibility, etc.)
  - `proposal_drafts` (author-owned draft write model)
  - optional: `proposal_stage_transitions` (append-only, derived from events)
- Add a projector layer that generates the existing read DTOs from canonical tables/events, writing either:
  - derived DTO payloads into `read_models` (compat mode), or
  - serving DTOs directly from projector queries (preferred once stable).

Tests:

- Projection determinism: same canonical inputs → identical DTO outputs.
- Backwards compatibility: existing endpoints continue returning the same DTO shape.

### Phase 14 — Deterministic state transitions (PLANNED)

Goal: centralize all proposal stage logic in a single, testable state machine (rather than scattered “read model patching”).

Deliverables:

- A single transition authority for proposals:
  - `draft` → `pool` (submit)
  - `pool` → `vote` (quorum met)
  - `vote` → `build` (passing met + formation eligible)
  - explicit fail paths (v2 decision): `pool`/`vote` rejection or expiry
- All transitions emit events and are enforced (HTTP `409` on invalid transition).

Tests:

- Transition matrix coverage (allowed vs forbidden transitions).
- Regression tests for quorum and rounding edges (e.g. 66.6%).

### Phase 15 — Time windows + automation (PLANNED)

Goal: move from “admin-driven clock ops only” to scheduled simulation behavior.

Deliverables:

- Cron-based era ops:
  - auto-advance era on schedule (if enabled)
  - auto-rollup era and persist rollup results
- Optional vote windows:
  - automatic close on `pool` and `vote` windows
  - deterministic rule for “what happens on expiry” (v2 decision)

Tests:

- Clock advancement is idempotent and monotonic.
- Rollups remain deterministic even when scheduled.

### Phase 16 — Delegation v1 (PLANNED)

Goal: implement delegation as an off-chain simulation feature (needed for courts/disputes and future quorum weighting experiments), without changing the fundamental “1 human = 1 vote” model.

Deliverables:

- Delegation model:
  - `delegations` (delegator → delegatee)
  - cycle prevention
  - optional metadata: sinceEra, note, public/private visibility
- Commands:
  - `delegation.set`, `delegation.clear`
- Reads:
  - surfaced in profile + My Governance as informational metadata (v1)
- Court hooks:
  - delegation disputes can reference real delegation history/events.

Tests:

- Cycle detection and invariants (no self-delegation; no loops).
- Idempotent set/clear semantics.
