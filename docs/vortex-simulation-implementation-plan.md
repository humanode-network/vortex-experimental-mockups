# Vortex Simulation Backend — Implementation Plan

This plan turns `docs/vortex-simulation-processes.md` + `docs/vortex-simulation-tech-architecture.md` into an executable roadmap that stays aligned with the current UI.

## Current status (what exists in the repo right now)

Implemented (backend skeleton):

- Cloudflare Pages Functions under `functions/`
- Minimal API routes:
  - `GET /api/health`
  - `POST /api/auth/nonce` (sets `vortex_nonce` cookie)
  - `POST /api/auth/verify` (sets `vortex_session` cookie; Substrate signature verification is supported in Phase 3)
  - `POST /api/auth/logout`
  - `GET /api/me`
  - `GET /api/gate/status` (dev bypass available; real RPC gating supported in Phase 3)
- Cookie-signed nonce + session helpers (requires `SESSION_SECRET`)
- Dev toggles for local progress:
  - `DEV_BYPASS_SIGNATURE`, `DEV_BYPASS_GATE`, `DEV_ELIGIBLE_ADDRESSES`, `DEV_INSECURE_COOKIES`
- Local dev notes: `docs/vortex-simulation-local-dev.md`
- Test harness + CI:
  - `yarn test` (Node’s built-in test runner)
  - CI runs `yarn test` via `.github/workflows/code.yml`
  - API tests: `tests/api-*.test.js`
- v1 decisions + contracts:
  - v1 constants: `docs/vortex-simulation-v1-constants.md`
  - API contract: `docs/vortex-simulation-api-contract.md`
  - DTO types: `src/types/api.ts`
- Postgres scaffolding (Phase 2c done):
  - Drizzle config: `drizzle.config.ts`
  - Schema: `db/schema.ts`
  - Initial migration: `db/migrations/0000_nosy_mastermind.sql`
  - Seed script: `scripts/db-seed.ts` (writes mock-equivalent payloads into `read_models`)
  - Read endpoints (Phase 2c/4 bridge): `functions/api/chambers/*`, `functions/api/proposals/*`, `functions/api/feed/*`, `functions/api/courts/*`, `functions/api/humans/*`
  - DB scripts: `yarn db:generate`, `yarn db:migrate`, `yarn db:seed`
  - Seed tests: `tests/db-seed.test.js`, `tests/migrations.test.js`
- Phase 3 tests: `tests/api-auth-signature.test.js`, `tests/api-gate-rpc.test.js`
  - Nonce + rate limit tests: `tests/api-auth-nonce.test.js`

Not implemented:

- Event-log powered feed + domain state machines + any write commands
- Normalized tables/projections beyond the transitional `read_models` bridge

## Guiding principles

- Ship a **thin vertical slice** first: auth → gate → read models → one write action → feed events.
- Keep domain logic **pure and shared** (state machine + events). The API is a thin adapter.
- Prefer **deterministic**, testable transitions; avoid “magic UI-only numbers”.
- Enforce gating on **every write**: “browse open, write gated”.
- Minimize UI churn: start by making API responses **match the shapes** currently provided by `src/data/mock/*`, then gradually improve.

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
2. **Phase 1 — Freeze API contracts (DTOs) to match `src/data/mock/*` (DONE)**
3. **Phase 2a — API skeleton (DONE)**
4. **Phase 2b — Test harness for API + domain (DONE)**
5. **Phase 2c — DB skeleton + migrations + seed-from-mocks (DONE)**
6. **Phase 3 — Auth + eligibility gate (DONE)**
7. **Phase 4 — Read models first (Chambers/Proposals/Feed)**
8. **Phase 5 — Event log backbone**
9. **Phase 6 — First write slice (pool voting)**
10. **Phase 7 — Chamber vote + CM awarding**
11. **Phase 8 — Formation v1**
12. **Phase 9 — Courts v1**
13. **Phase 10 — Era rollups + tier statuses**
14. **Phase 11 — Hardening + moderation**

## Phase 0 — Lock v1 decisions (required before DB + real gate)

Locked for v1 (based on current decisions):

1. Database: **Postgres** (Neon/Supabase).
2. Gating source: **Humanode mainnet RPC** (no Subscan dependency for v1).
3. Active Human Node rule: “active” derived via RPC reads from `ImOnline::*` (with a safe fallback to `Session::Validators` in v1).
4. Era length: **configured by us off-chain** (a simulation constant), not a chain parameter.

Deliverable: a short “v1 constants” section committed to docs or config.

Tests:

- None required (doc-only), but we must record decisions so later tests can assert exact thresholds/constants.

## Phase 1 — Define contracts that mirror the UI (1–2 days)

The UI is currently driven by `src/data/mock/*` (e.g. proposals list cards, proposal pages, chamber detail). Start by freezing the “API contract” so backend and frontend can meet in the middle.

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

- Add unit tests that validate DTO shapes against the existing mocks (smoke: “mock data can be encoded into the DTOs without loss”).

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

Goal: replace `src/data/mock/*` progressively with API reads, with minimal UI refactor.

1. `GET /api/chambers`:
   - return chamber list + multipliers + computed stats
   - match `src/data/mock/chambers.ts` shape first
2. `GET /api/proposals?stage=...`:
   - return proposal list cards for the Proposals page
   - match `src/data/mock/proposals.ts` shape first
3. `GET /api/proposals/:id`:
   - return proposal page model for ProposalPP/Chamber/Formation
   - match `src/data/mock/proposalPages.ts` getters first
4. `GET /api/feed?cursor=...`:
   - return feed items from the `read_models` bridge first (`feed:list`)
   - feed derived from `events` lands in Phase 5

Frontend:

- Use the existing `src/lib/apiClient.ts` wrapper (typed helpers, error handling).
- Swap one page at a time from mock imports to API reads; keep a dev fallback flag if needed.

Deliverable: app renders from backend reads (at least Chambers + Proposals + Feed).

Tests:

- DTO compatibility snapshot tests (API payload matches mock-driven shape).
- Pagination cursors stable (no duplicates/missing items across pages).

## Phase 5 — Event log (feed) as the backbone (2–6 days)

1. Create `events` table (append-only).
2. Define event types (union) and payload schemas (zod).
3. Implement a simple “projector”:
   - basic derived feed cards from events
   - cursors for pagination
4. Backfill initial events from seeded mock data (so the feed isn’t empty on day 1).

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
   - write pool vote with unique constraint (proposalId + userId)
   - emit `pool.vote_cast`
   - update/compute pool metrics
   - if gates met, emit `proposal.moved_to_vote` + transition record
3. Frontend:
   - ProposalPP page upvote/downvote calls API
   - optimistic UI optional (but must reconcile)

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

## Phase 10 — Era rollups + tier statuses (ongoing)

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

## Phase 11 — Hardening + moderation (ongoing)

- Rate limiting (per IP/address) and anti-spam (per-era quotas).
- Auditability: make all state transitions and changes event-backed.
- Admin tools: manual “advance era”, seed data, freeze/unfreeze.
- Observability: logs + basic metrics for rollups and gating failures.
- Moderation controls (off-chain):
  - temporary action lock for a user
  - court-driven restrictions flags (simulation)

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
- Start by returning API payloads that match the existing mock getters (`src/data/mock/proposalPages.ts`, etc.) to avoid rewriting UI components.
- Migrate page-by-page: keep visuals stable while the data source shifts from `src/data/mock/*` to `/api/*`.
