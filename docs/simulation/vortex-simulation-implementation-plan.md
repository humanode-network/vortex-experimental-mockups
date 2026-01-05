# Vortex Simulation Backend — Implementation Plan

This plan turns `docs/simulation/vortex-simulation-processes.md` + `docs/simulation/vortex-simulation-tech-architecture.md` into an executable roadmap that stays aligned with the current UI.

For a paper-aligned module map (paper → docs → code), see `docs/simulation/vortex-simulation-modules.md`.

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
- Local dev notes: `docs/simulation/vortex-simulation-local-dev.md`
- Test harness + CI:
  - `yarn test` (Node’s built-in test runner)
  - CI runs `yarn test` via `.github/workflows/code.yml`
  - API tests: `tests/api-*.test.js`
- v1 decisions + contracts (kept aligned with the UI):
  - v1 constants: `docs/simulation/vortex-simulation-v1-constants.md`
  - API contract: `docs/simulation/vortex-simulation-api-contract.md`
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
  - Chamber voting (`chamber.vote`) + CM awards + vote → build auto-advance (quorum + passing; Formation is optional)
  - Formation v1 (`formation.join`, `formation.milestone.submit`, `formation.milestone.requestUnlock`)
  - Courts v1 (`court.case.report`, `court.case.verdict`)
  - Era snapshots + per-era activity counters (`/api/clock/*` + `/api/my-governance`)
  - Era rollups + tier statuses (`POST /api/clock/rollup-era`)
- Hardening + ops controls:
  - Rate limiting, per-era quotas, idempotency conflict detection
  - Admin tools: action locks, audit/inspection, stats, global write freeze
  - Tests: `tests/api-command-*.test.js`, `tests/api-admin-*.test.js`

Implemented (UI supporting the simulation backend):

- Proposal creation wizard v2 (template-driven):
  - Template registry: `src/pages/proposals/proposalCreation/templates/registry.ts`
  - Templates:
    - `project` (full flow: Essentials → Plan → Budget → Review)
    - `system` (General chamber only; skips budget: Setup → Rationale → Review)
  - Tests: `tests/proposal-wizard-template-registry.test.js`

Not implemented (intentional v1 gaps):

- Replacing transitional `read_models` with fully normalized domain tables + event-driven projections
- Time-windowed stage logic (vote windows, scheduled transitions) beyond manual/admin clock ops
- Delegation flows and any “real” forum/thread product (threads remain minimal)

## Guiding principles

- Ship a **thin vertical slice** first: auth → gate → read models → one write action → feed events.
- Keep domain logic **pure and shared** (state machine + events). The API is a thin adapter.
- Prefer **deterministic**, testable transitions; avoid “magic UI-only numbers”.
- Enforce gating on **every write**: “browse open, write gated”.
- Minimize UI churn: keep the frozen DTOs (`docs/simulation/vortex-simulation-api-contract.md` + `src/types/api.ts`) stable while the backend transitions from `read_models` to normalized tables + an event log.

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
17. **Phase 13 — Eligibility via `Session::Validators` (DONE)**
18. **Phase 14 — Canonical domain tables + projections (DONE)**
19. **Phase 15 — Deterministic state transitions (DONE)**
20. **Phase 16 — Time windows + automation (DONE)**
21. **Phase 17 — Chamber voting eligibility + Formation optionality (DONE)**
22. **Phase 18 — Chambers lifecycle (create/dissolve) (DONE)**
23. **Phase 19 — Chamber detail projections (DONE)**
24. **Phase 20 — Dissolved chamber enforcement (DONE)**
25. **Phase 21 — Chambers directory projections (pipeline/stats) (DONE)**
26. **Phase 22 — Meta-governance chamber.create seeding (backend) (DONE)**
27. **Phase 23 — Proposal drafts (UI ↔ backend) (DONE)**
28. **Phase 24 — Meta-governance proposal type (UI) (DONE)**
29. **Phase 25 — Proposal pages projected from canonical state (DONE)**
30. **Phase 26 — Proposal history timeline (DONE)**
31. **Phase 27 — Active governance v2 (derive and persist active governor set per era) (DONE)**
32. **Phase 28 — Quorum engine v2 (era-derived denominators + paper thresholds) (DONE)**
33. **Phase 29 — Delegation v1 (graph + history + chamber vote weighting) (DONE)**
34. **Phase 30 — Veto v1 (temporary slow-down + attempt limits) (DONE)**
35. **Phase 31 — Chamber multiplier voting v1 (outside-of-chamber aggregation) (DONE)**
36. **Phase 32 — Paper alignment audit pass (process-by-process)**
37. **Phase 33 — Testing readiness v3 (scenario harness + end-to-end validation) (IN PROGRESS)**
38. **Phase 34 — Meritocratic Measure (MM) v1 (post-V3, Formation delivery scoring)**
39. **Phase 35 — Proposal wizard v2 W1 (template runner + registry) (DONE)**
40. **Phase 36 — Proposal wizard v2 W2 (system.chamberCreate flow) (DONE — `system` template v1)**
41. **Phase 37 — Proposal wizard v2 W3 (backend discriminated drafts) (DONE)**
42. **Phase 38 — Proposal wizard v2 W4 (migrate drafts + simplify validation) (DONE)**
43. **Phase 39 — Proposal wizard v2 W5 (cleanup + extension points) (DONE)**

### Proposal wizard v2 phases (Phases 35–39)

In parallel to the main backend phases, the proposal wizard is moving toward template-driven flows so that system-change proposals (like chamber creation) do not share project-only steps/fields.

Reference:

- `docs/simulation/vortex-simulation-proposal-wizard-architecture.md` (Wizard v2 track W1–W5)

Notes:

- These phases are primarily UI/schema refactors and can be executed after Phase 23 (drafts) without blocking the main governance modules.
- The goal is to avoid “one big form” drift and make system-change proposals (like chamber creation) collect only the fields required to create/render the chamber.

## Phase 0 — Lock v1 decisions (required before DB + real gate)

Locked for v1 (based on current decisions):

1. Database: **Postgres** (Neon-compatible serverless Postgres).
2. Gating source: **Humanode mainnet RPC** (no Subscan dependency for v1).
3. Active Human Node rule: address is in the current validator set (`Session::Validators`) on Humanode mainnet.
4. Era length: **configured by us off-chain** (a simulation constant), not a chain parameter.

Deliverable: a short “v1 constants” section committed to docs or config.

Tests:

- None required (doc-only), but we must record decisions so later tests can assert exact thresholds/constants.

## V3 — Testing readiness (what “ready to test” means)

V3 is the point where the simulation can be tested as a coherent system against the Vortex 1.0 model (and against our updated paper reference copy), not just as disconnected UI pages.

V3 is “ready for testing” when:

- All core governance modules required for chamber/proposal testing are implemented and wired end-to-end:
  - **active governance**: “active governors next era” is computed at rollup and persisted
  - **quorum engine**: pool + vote quorums use era-derived denominators and are consistent across endpoints/pages
  - **proposals**: draft → pool → vote → accepted is testable deterministically (Formation optional)
  - **chambers**: General + specialization chambers exist; creation/dissolution is proposal-driven (meta-governance)
  - **delegation**: chamber vote weighting works; pool attention remains direct-only
  - **veto**: temporary slow-down exists and is auditable/bounded
  - **multipliers**: outsider aggregation updates chamber multipliers without rewriting CM award history
- A paper alignment audit has been run process-by-process and deviations are explicitly recorded.
- A scenario harness exists so the above can be validated deterministically (API-level end-to-end tests; no browser required).

Not required for V3:

- Meritocratic Measure (MM). MM can be built after V3 without blocking proper testing of proposals/chambers/quorums/delegation/veto.

V3 phases (to reach testing readiness):

1. Phase 27 — Active governance v2
2. Phase 28 — Quorum engine v2
3. Phase 29 — Delegation v1
4. Phase 30 — Veto v1
5. Phase 31 — Chamber multiplier voting v1
6. Phase 32 — Paper alignment audit pass
7. Phase 33 — Testing readiness harness (scenario-driven)
8. Phase 34 — Meritocratic Measure (MM) v1 (post-V3)

## Phase 1 — Define contracts that mirror the UI (1–2 days)

The UI renders from `/api/*` reads. The contract is frozen so backend and frontend stay aligned while the implementation evolves.

Contract location:

- `docs/simulation/vortex-simulation-api-contract.md` (human-readable source of truth)
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
   - query eligibility via RPC (`Session::Validators` in v1)
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
    - the proposal stage is advanced in the canonical `proposals` table and mirrored into the `proposals:list` read model (compat)
    - if the chamber page read model is missing, it is created from the pool page payload
  - Pool voting is rejected when a proposal is no longer in the pool stage (HTTP 409)
  - ProposalPP UI calls `pool.vote` and refetches the pool page on success
- Not implemented yet:
  - centralized state machine for transitions (beyond v1 stage updates)

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
    - the proposal stage is advanced in the canonical `proposals` table and mirrored into the `proposals:list` read model (compat)
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
  - Era snapshot baseline updates:
    - rollups write next era’s `era_snapshots.active_governors` from `activeGovernorsNextEra`
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

## Phase 12 — Proposal drafts + submission (DONE)

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

## Phase 13 — Eligibility via `Session::Validators` (DONE)

Goal: gate writes based on the **current validator set** on Humanode mainnet (instead of attempting to infer “activeness” via `ImOnline::*`).

Deliverables:

- Mainnet gate reads:
  - Use `Session::Validators` as the single source of truth for “active Human Node” eligibility.
  - Store and cache the result in `eligibility_cache` (DB mode) or memory (no-DB mode), same as today.
- Error / reason codes:
  - Standardize on a single negative reason when not in the validator set (e.g. `not_in_validator_set`).
- Local dev:
  - Keep `DEV_BYPASS_GATE` and `DEV_ELIGIBLE_ADDRESSES` for local iteration.

Tests:

- `GET /api/gate/status` returns `eligible: true` when the address is included in the RPC-returned `Session::Validators`.
- Caching works (second call does not re-hit RPC in memory mode).
- Non-validator address returns `eligible: false` with the expected reason code.

## Phase 14 — Canonical domain tables + projections (DONE)

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

Current status:

- `proposals` table exists (migration + schema).
- `proposal.submitToPool` writes a canonical proposal row (and only writes proposal DTOs into `read_models` when a `read_models` store is available).
- Proposal page reads prefer canonical proposals (pool/chamber/formation), falling back to `read_models` only for seeded legacy proposals.
- Pool → vote and vote → build auto-advance update the canonical proposal stage via compare-and-set transitions.

## Phase 15 — Deterministic state transitions (DONE)

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

Current status:

- A v1 state machine module exists (`functions/_lib/proposalStateMachine.ts`) with the core quorum-based advance rules.
- Commands validate stage against canonical proposals first (falling back to `read_models` for legacy seeded proposals).
- `pool.vote` and `chamber.vote` can auto-advance proposals even when `read_models` are missing, by using canonical proposal state as the source of truth.
- Canonical stage transitions are enforced via `transitionProposalStage(...)` (compare-and-set + transition validation), with coverage in tests.

## Phase 16 — Time windows + automation (DONE)

Goal: move from “admin-driven clock ops only” to scheduled simulation behavior.

Deliverables:

- Cron-based era ops:
  - a single “cron entrypoint” endpoint: `POST /api/clock/tick`
  - rollup the current era (idempotent)
  - optionally advance era when “due” (time-based; configurable)
- Optional vote windows:
  - ability to enable/disable stage windows via env (`SIM_ENABLE_STAGE_WINDOWS`)
  - reject new votes when `pool` or `vote` windows end (v1 behavior; no automatic stage change)
  - deterministic rule for “what happens on expiry” (v2 decision: auto-close/auto-reject vs “stuck”)

Tests:

- Clock advancement is idempotent and monotonic.
- Rollups remain deterministic even when scheduled.

Current status:

- `POST /api/clock/tick` exists and can run the rollup and (optionally) advance era when due.
- Stage windows are implemented behind `SIM_ENABLE_STAGE_WINDOWS`:
  - `pool.vote` and `chamber.vote` return HTTP `409` after the configured windows end.
  - `GET /api/proposals` and `GET /api/proposals/:id/chamber` compute `timeLeft` from the canonical proposal stage timestamp when enabled (`"Ended"` once the window is over).
  - `POST /api/clock/tick` emits a deduped feed event when a proposal’s `pool` or `vote` window has ended (and returns those in the `endedWindows` response field for visibility).

## Phase 17 — Chamber voting eligibility + Formation optionality (DONE)

Goal: align chambers with the Vortex 1.0 model:

- specialization chambers are votable only by humans who have an **accepted proposal in that chamber**
- General chamber is votable only by humans who have an **accepted proposal in any chamber**
- quorum fractions remain **global**, but denominators are **chamber-scoped** (active governors eligible for that chamber in the era, captured on stage entry)
- not all accepted proposals require Formation (Formation is optional)

Definitions (v1):

- “Accepted proposal” means: **passed chamber vote**.
- “Formation required” is a proposal-type property; acceptance does not imply a Formation project must exist.

Deliverables:

1. Chamber participation model
   - genesis participants/roles (seeded at genesis)
   - earned eligibility:
     - accepted proposal in chamber X → eligible to vote in X (specialization)
     - accepted proposal in any chamber → eligible to vote in General
   - no decay/expiration of eligibility (separate from “active governor next era” quorum baselines)
2. Enforce eligibility in writes
   - `chamber.vote` must reject when the voter is not eligible for the proposal’s lead chamber.
   - The rule applies to **General** and **specialization** chambers.
3. Decouple acceptance from Formation
   - chamber vote passing moves a proposal to “accepted” regardless of whether Formation is required.
   - Formation actions and Formation page behavior are enabled only when the proposal is Formation-required.

Tests:

- Eligibility enforcement:
  - voting in a specialization chamber without eligibility is rejected
  - voting in General without “any accepted proposal” is rejected
  - eligibility is granted after a proposal is accepted
- Formation optionality:
  - a non-Formation proposal can still become accepted
  - Formation actions are rejected when Formation is not required

Current status:

- Chamber membership table added:
  - schema: `db/schema.ts` (`chamber_memberships`)
  - migration: `db/migrations/0016_chamber_memberships.sql`
  - store: `functions/_lib/chamberMembershipsStore.ts`
- Eligibility is enforced in writes:
  - `POST /api/command` → `chamber.vote` rejects HTTP `403` when the voter is not eligible for the proposal’s lead chamber.
  - Dev bypass: `DEV_BYPASS_CHAMBER_ELIGIBILITY=true` (local/testing only).
- Genesis bootstrap:
  - `/sim-config.json` can list `genesisChamberMembers` to allow the first chamber votes before any proposals are accepted.
  - Tests/local dev can override config via `SIM_CONFIG_JSON`.
- Eligibility is granted on acceptance:
  - when a proposal passes chamber vote (vote → build), the proposer gains:
    - specialization membership for that chamber (if not `general`)
    - General eligibility (`general`)
- Acceptance is decoupled from Formation:
  - passing chamber vote advances vote → build regardless of Formation requirement
  - Formation state is only seeded when `formationEligible=true`
  - Formation commands are rejected when Formation is not required
- Tests:
  - `tests/api-chamber-eligibility.test.js`

## Phase 18 — Chambers lifecycle (create/dissolve) (DONE)

Goal: model chamber creation and dissolution per Vortex 1.0 as **General chamber** proposals.

Deliverables:

- Canonical `chambers` table (id, title, status, createdAt, dissolvedAt, multiplier, metadata).
- Commands/events for:
  - create chamber (General chamber proposal outcome)
  - dissolve chamber (General chamber proposal outcome; preserve history)
- Read endpoints (replace read-model-only chamber list/detail with canonical + projections).

Tests:

- Chamber create/dissolve changes canonical chamber status and read endpoints reflect it.
- Votes and proposals continue to resolve `chamberId` correctly when a chamber is dissolved (history preserved).

Current status:

- Canonical `chambers` table exists:
  - schema: `db/schema.ts`
  - migration: `db/migrations/0017_chambers.sql`
- Genesis chambers are configured via `public/sim-config.json` → `genesisChambers` and auto-seeded when the table is empty.
- Read endpoints are canonical:
  - `GET /api/chambers` builds from canonical chambers (empty in `READ_MODELS_INLINE_EMPTY=true` mode).
  - `GET /api/chambers/:id` resolves canonical chambers (still returns a minimal detail model in v1).
- Chamber lifecycle is simulated as a General-chamber proposal outcome:
  - accepted General proposals with `payload.metaGovernance.action` in `{ "chamber.create", "chamber.dissolve" }` create/dissolve chambers.
- Tests:
  - `tests/api-chambers-lifecycle.test.js`

## Phase 19 — Chamber detail projections (DONE)

Goal: make `GET /api/chambers/:id` a true projection from canonical state (no chamber read-model drift).

Deliverables:

- Project proposal status list from canonical proposals:
  - pool → upcoming
  - vote → live
  - build → ended (meta “Formation” vs “Passed” depends on `formationEligible`)
- Project chamber roster from canonical chamber memberships + genesis members:
  - specialization chamber roster = members for that chamber + genesis members for that chamber
  - General chamber roster = union of all memberships + genesis members
- Keep threads/chat placeholders as empty arrays (until the forum model exists).

Tests:

- `GET /api/chambers/:id` returns roster derived from memberships/genesis.

Current status:

- `GET /api/chambers/:id` is projected from canonical stores:
  - proposals come from canonical `proposals` (pool → upcoming, vote → live, build → ended)
  - roster comes from canonical `chamber_memberships` plus `genesisChamberMembers`
  - General roster is the union of all chamber memberships plus all genesis members
- Tests:
  - `tests/api-chamber-detail-projection.test.js`

## Phase 20 — Dissolved chamber enforcement (DONE)

Goal: define and enforce what “dissolved chamber” means for writes in v1.

v1 rule:

- dissolved chambers are not selectable for new proposal submissions
- proposals created before dissolution can finish their lifecycle (votes allowed)

Deliverables:

- `proposal.submitToPool` rejects drafts targeting a dissolved chamber.
- `chamber.vote` rejects votes only for the (should-not-exist) case where a proposal was created after the chamber was dissolved.
- Preserve history: dissolved chambers remain in canonical storage and can still be referenced by old proposals.

Tests:

- cannot submit a new proposal into a dissolved chamber
- voting remains possible on pre-existing proposals created before dissolution
- voting is rejected for proposals created after dissolution (defensive invariant)

Current status:

- Enforcement is implemented in `functions/api/command.ts`:
  - `proposal.submitToPool` returns:
    - `400` `invalid_chamber` when `draft.chamberId` is unknown
    - `409` `chamber_dissolved` when the chamber exists but is not active
  - `chamber.vote` returns `409` `chamber_dissolved` when `proposal.createdAt > chamber.dissolvedAt`
- Tests:
  - `tests/api-chamber-dissolution.test.js`

## Phase 21 — Chambers directory projections (pipeline/stats) (DONE)

Goal: ensure `GET /api/chambers` is a stable projection of canonical state across both DB mode and inline mode.

Deliverables:

- Pipeline counts (`pool/vote/build`) projected from canonical proposals.
- Chamber stats projected from canonical state:
  - governors: derived from canonical memberships + genesis members (General = union)
  - ACM/LCM/MCM: derived from CM awards + multipliers.
- Support `includeDissolved=true` query param (default remains active-only).

Tests:

- `GET /api/chambers` returns correct pipeline/stats in inline mode with canonical proposals + CM awards.
- `includeDissolved=true` includes dissolved chambers that are excluded by default.

Current status:

- `functions/api/chambers/index.ts` supports `includeDissolved=true`.
- Projections are implemented in `functions/_lib/chambersStore.ts` for both DB and inline mode.
- Tests:
  - `tests/api-chambers-index-projection.test.js`

## Phase 22 — Meta-governance chamber.create seeding (backend) (DONE)

Goal: allow chamber creation to be driven by a General proposal outcome and immediately become usable (no chicken-and-egg for voting).

Deliverables:

- Drafts can include an optional `metaGovernance` payload describing:
  - `chamber.create` (id/title/multiplier + optional `genesisMembers`)
  - `chamber.dissolve` (id)
- Submission validation:
  - meta-governance proposals must be in the General chamber
  - create rejects existing chambers; dissolve rejects unknown/already-dissolved chambers
- On acceptance of a General `chamber.create` proposal:
  - create the canonical chamber entry
  - seed initial membership in `chamber_memberships` for:
    - proposer address (always)
    - `metaGovernance.genesisMembers` (optional)

Tests:

- A General `chamber.create` proposal can pass and produces a new chamber visible in `/api/chambers`.
- Seeded members can vote in the newly created chamber immediately.

Current status:

- Draft schema supports `metaGovernance` in `functions/_lib/proposalDraftsStore.ts`.
- `proposal.submitToPool` validates meta-governance payloads in `functions/api/command.ts`.
- On acceptance, the backend seeds `chamber_memberships` for proposer + genesis members.
- Tests:
  - `tests/api-command-chamber-create-members.test.js`

## Phase 23 — Proposal drafts (UI ↔ backend) (DONE)

Goal: make the proposal creation wizard use the real backend drafts so “drafts → submit → proposal” is end-to-end through the UI.

Deliverables:

- `src/pages/proposals/ProposalCreation.tsx` calls:
  - `proposal.draft.save` (create/update draft) instead of only localStorage
  - stores the server `draftId` locally to continue editing
- Drafts list and detail become the canonical entry point for submissions:
  - drafts created in the wizard show up under `/app/proposals/drafts`
  - “Submit to pool” uses `proposal.submitToPool` and navigates to `/app/proposals/:id/pp`

Tests:

- UI wiring is smoke-tested via API integration tests (draft save + submit already covered) plus a minimal client-side test if needed.

Current status:

- `src/pages/proposals/ProposalCreation.tsx` saves drafts via `proposal.draft.save` when the user is eligible and retains the `draftId` locally for continued edits.
- The wizard UI is split into `src/pages/proposals/proposalCreation/*` step components + storage/sync helpers (so the page orchestrator stays small).
- “Submit proposal” now saves (if needed) and submits via `proposal.submitToPool`, then navigates to `/app/proposals/:id/pp`.

## Phase 24 — Meta-governance proposal type (UI) (DONE)

Goal: expose meta-governance proposals in the proposal wizard so chambers can be created/dissolved without manual API calls.

Deliverables:

- Add a proposal “kind” selector:
  - normal proposals (any chamber)
  - General meta-governance:
    - create chamber
    - dissolve chamber
- Wizard writes `metaGovernance` into the draft payload and enforces the additional fields client-side.
- Meta-governance drafts can submit with zero budget items (budget is optional for system-change proposals).

Tests:

- UI submits a chamber.create draft that is accepted and results are visible on chambers pages.

Current status:

- `src/pages/proposals/proposalCreation/steps/EssentialsStep.tsx` exposes the “System change (General)” kind and collects `metaGovernance` fields.
- `draftIsSubmittable` allows meta-governance drafts to be submitted without budget items (still requires rules confirmations).
- Tests:
  - `tests/api-command-meta-governance-no-budget.test.js`

## Phase 25 — Proposal pages projected from canonical state (DONE)

Goal: ensure `/api/proposals` and proposal pages are projections from canonical proposals + overlays (not brittle, seed-only read models).

Deliverables:

- `/api/proposals` list is derived from canonical proposals with live overlays for votes, formation, and era context.
- `/api/proposals/:id/pp|chamber|formation` are derived from canonical proposal payloads and normalized tables (votes/formation).
- Eliminate “page-only summary/headers drift”: proposal pages should use the same structural sections across stages, populated from the canonical proposal payload.

Tests:

- Proposal list and proposal pages render from canonical state in inline mode and DB mode.

Current status:

- Read endpoints prefer canonical proposals (`proposals` table / in-memory store) and compute live overlays from normalized tables (pool votes, chamber votes, formation).
- Proposal stage pages share a consistent header component:
  - `src/components/ProposalPageHeader.tsx`
  - wired into:
    - `src/pages/proposals/ProposalPP.tsx`
    - `src/pages/proposals/ProposalChamber.tsx`
    - `src/pages/proposals/ProposalFormation.tsx`
- Tests:
  - `tests/api-proposals-canonical-precedence.test.js` (canonical proposal takes precedence over seeded read models).

## Phase 26 — Proposal history timeline (DONE)

Goal: make proposals auditable and explainable by exposing a single “what happened” timeline.

Deliverables:

- Event-backed proposal history:
  - submission
  - pool votes + threshold met
  - chamber votes + pass/fail
  - formation joins + milestone actions
  - court actions referencing the proposal (when applicable)
- A consistent timeline component in the UI (read-only).

Tests:

- Timeline output is deterministic given the same events.

Current status:

- Timeline events are stored in the append-only `events` table as `proposal.timeline.v1` entries keyed by proposal ID:
  - `functions/_lib/proposalTimelineStore.ts`
  - `functions/api/proposals/[id]/timeline.ts`
- Commands append timeline events for proposal lifecycle actions (submission, votes, stage advancement, formation actions, and chamber create/dissolve side-effects):
  - `functions/api/command.ts`
- Proposal pages render the timeline consistently:
  - `src/components/ProposalSections.tsx` → `ProposalTimelineCard`
  - `src/pages/proposals/ProposalPP.tsx`
  - `src/pages/proposals/ProposalChamber.tsx`
  - `src/pages/proposals/ProposalFormation.tsx`
- Tests:
  - `tests/api-proposal-timeline.test.js`

## Phase 27 — Active governance v2 (derive and persist active governor set per era) (DONE)

Goal: define “active governor” precisely, derive it at rollup, and persist it as the canonical basis for quorums and UI denominators.

Deliverables:

- Define “active governor” for era N as a composition of:
  - eligibility gate (active Human Node / validator address), and
  - previous-era governing activity (configured per-era requirements), so the system can compute “active for next era”.
- Persist the active set size and (optionally) membership:
  - `activeGovernorsBaseline` (count) becomes the era denominator source of truth.
  - Optional: persist a membership list for audit/debug (not required for v2 quorums, but useful for ops).
- Ensure `POST /api/clock/rollup-era` is the single place that computes next-era baselines, and all reads consume those baselines (no divergent denominators across endpoints/pages).

Tests:

- Unit tests for “active governor” derivation from:
  - gate status + era activity counters + requirements.
- API integration tests to ensure:
  - `GET /api/clock` returns the same baseline that proposal/courts/pages use for denominators.

Current status:

- Era activity counters are stored per era (in-memory or Postgres):
  - `functions/_lib/eraStore.ts`
- `rollupEra` computes per-address status and the next-era active denominator, and persists both:
  - `functions/_lib/eraRollupStore.ts` writes:
    - `era_rollups.active_governors_next_era`
    - `era_user_status.is_active_next_era`
- “Active next era” is computed as:
  - meets the configured activity requirements for the rolled-up era, AND
  - is a Humanode validator (membership in `Session::Validators`) unless explicitly bypassed for local dev.
- The Humanode validator set is read via RPC:
  - `functions/_lib/humanodeRpc.ts` (`state_getStorage` for `Session::Validators`)
- The rollup endpoint also updates the next era’s snapshot baseline so proposal/quorum reads stay consistent:
  - `functions/api/clock/rollup-era.ts`
  - `functions/api/clock/tick.ts`
- Address handling is case-sensitive:
  - SS58 addresses are not lowercased anywhere; addresses are treated as opaque identifiers and only `trim()` is applied.

Tests:

- `tests/api-era-rollup.test.js` (rollup is idempotent and computes counts)
- `tests/api-era-rollup-validator-gate.test.js` (active governors are filtered by `Session::Validators`)

## Phase 28 — Quorum engine v2 (era-derived denominators + paper thresholds) (DONE)

Goal: drive all quorum math from the active-governor denominator computed in Phase 27, and decide paper-alignment thresholds.

Deliverables:

- Make pool + chamber quorum evaluation use a single explicit denominator source per proposal stage:
  - Stage-entry denominator snapshots stored in `proposal_stage_denominators` (one row per `(proposalId, stage)` for `pool` and `vote`).
  - When a snapshot exists, quorum math and UI denominators use it (prevents drift when eras advance mid-stage).
  - If a snapshot is missing (legacy data), fall back to the current era baseline.
- Decide and document paper-alignment knobs:
  - pool attention quorum: aligned to paper `22%` (v1)
  - vote window: aligned to paper `7 days`
- Ensure UI surfaces that show “X / needed” and “% / threshold%” derive from the same denominator snapshot (no mixed sources).

Tests:

- Unit tests for quorum math against explicit denominators (pool + chamber).
- API integration tests to ensure:
  - denominators shown on proposal pages are stable across era rollups (no drift)
  - stage transitions evaluate thresholds against the same denominator they display.

Implemented:

- `db/schema.ts` + migration: `proposal_stage_denominators`
- `functions/_lib/proposalStageDenominatorsStore.ts` (DB-backed, with memory fallback when `DATABASE_URL` is not set)
- `functions/api/command.ts` captures denominators at stage entry and uses them for advancement checks
- `functions/api/proposals/*` reads prefer stage denominators for pool/vote pages and list items
- Test: `tests/api-quorum-stage-denominators.test.js`

## Phase 29 — Delegation v1 (graph + history + chamber vote weighting) (DONE)

Goal: implement delegation as a first-class module so chamber votes can aggregate weight, while proposal pool attention remains strictly direct.

Deliverables:

- `delegations` (canonical graph) + `delegation_events` (append-only history).
- Commands:
  - `delegation.set`
  - `delegation.clear`
- Invariants:
  - no self-delegation
  - no cycles
  - at most one delegatee per delegator per chamber
- Chamber vote weighting:
  - vote weight = `1 + delegatedVoices` (paper intent)
  - delegation affects chamber vote counts/quorum math, but not pool attention mechanics.
  - a delegator’s voice only counts if the delegator did **not** cast a chamber vote themselves.

Tests:

- Unit tests for cycle detection and vote weight aggregation.
- API integration tests for set/clear + weighted chamber vote aggregation.

Implemented:

- Tables + migrations:
  - `db/schema.ts`: `delegations`, `delegation_events`
  - `db/migrations/0019_delegations.sql`
- Store:
  - `functions/_lib/delegationsStore.ts`
- Commands:
  - `POST /api/command`: `delegation.set`, `delegation.clear`
- Weighted chamber vote counts:
  - `functions/_lib/chamberVotesStore.ts` uses `delegations` to compute weighted `{ yes, no, abstain }` when `chamberId` is known.
- Tests:
  - `tests/delegations-cycle.test.js`
  - `tests/api-delegation-weighted-votes.test.js`

## Phase 30 — Veto v1 (temporary slow-down + attempt limits) (DONE)

Goal: implement a paper-aligned temporary veto slow-down that is auditable and bounded.

Deliverables:

- Command(s) to record veto actions and the required threshold to trigger them.
- Proposal state machine extension:
  - veto sends proposal back for a cool-down window
  - veto attempt count is bounded; after N approvals no veto applies.
- Timeline + feed events for veto actions.

Tests:

- Unit tests for veto attempt counting and state transitions.
- API integration tests for veto flows and timeline output.

Implemented:

- DB:
  - Migration: `db/migrations/0020_veto.sql`
  - Tables/columns: `db/schema.ts` (`proposals` veto fields + `veto_votes`)
- Veto council derivation (paper intent: top LCM holders):
  - `functions/_lib/vetoCouncilStore.ts` computes one holder per chamber (highest accumulated LCM from `cm_awards`).
  - Threshold is computed as `floor(2/3*n) + 1` and snapshotted onto the proposal.
- Veto voting:
  - `functions/_lib/vetoVotesStore.ts` stores votes in `veto_votes` (DB mode) with a safe in-memory fallback.
  - `POST /api/command`: `veto.vote` records votes, emits timeline events, and applies veto when threshold is reached.
- Stage behavior:
  - When chamber vote passes, the proposal can enter a pending-veto window (`vote_passed_at` / `vote_finalizes_at`).
  - `POST /api/clock/tick` finalizes to `build` once the veto window ends (if no veto was applied).
  - Veto is bounded per proposal (`veto_count` max applies = 2).
- Tests:
  - `tests/api-veto.test.js`
  - `tests/migrations.test.js` asserts `veto_votes` table exists

## Phase 31 — Chamber multiplier voting v1 (outside-of-chamber aggregation) (DONE)

Goal: implement paper-aligned multiplier setting (outsiders-only aggregation) without rewriting historical CM awards.

Deliverables:

- Multiplier submissions table + aggregation rule (v1: simple average + rounding).
- Outsider rule enforcement (cannot submit for chambers where the address has LCM history).
- Multiplier change history events.

Tests:

- Unit tests for outsider eligibility and aggregation.
- API tests that multipliers affect MCM/ACM views without mutating prior award events.

Implemented:

- DB:
  - Migration: `db/migrations/0021_chamber_multiplier_submissions.sql`
  - Table: `chamber_multiplier_submissions` (one submission per `(chamber_id, voter_address)`)
- Store:
  - `functions/_lib/chamberMultiplierSubmissionsStore.ts`
- Command:
  - `POST /api/command`: `chamber.multiplier.submit`
  - outsiders-only enforcement (LCM history blocks submissions)
  - aggregation rule: rounded average applied to `chambers.multiplier_times10`
- Views:
  - CM awards remain immutable; ACM/MCM views are recomputed using current multipliers
- Tests:
  - `tests/api-chamber-multiplier-voting.test.js`

## Phase 32 — Paper alignment audit pass (process-by-process)

Goal: run a deliberate paper-vs-simulation audit for every major process and reconcile docs/constants before “production-like” testing.

Deliverables:

- Update `docs/simulation/vortex-simulation-paper-alignment.md` with the resolved decisions.
- Update `docs/simulation/vortex-simulation-v1-constants.md` if thresholds change.
- Update UI copy/labels where the paper language is more precise.

Tests:

- None required (doc-only), but any behavior changes required by the audit must ship with tests in the relevant phase.

## Phase 33 — Testing readiness v3 (scenario harness + end-to-end validation) (IN PROGRESS)

Goal: add a deterministic, repeatable testing harness that validates the full governance loop across modules without relying on browser-driven manual testing.

Deliverables:

- A small set of “golden flow” scenarios, expressed as API calls:
  - proposal draft → submit → pool votes → advance → chamber vote → pass/fail → (optional) Formation actions
  - General meta-governance proposal that creates a specialization chamber (and grants genesis membership as configured)
  - era rollup produces the next-era active-governor baseline used in quorum denominators
  - delegation impacts chamber vote weighting (but not pool attention mechanics)
  - veto sends an accepted proposal back through the bounded slow-down flow
  - multiplier voting affects MCM/ACM views without rewriting award events
  - MM updates on Formation delivery scoring and appears in My Governance/Invision
- Optional: a scriptable seed “scenario pack” for manual UI verification in DB mode (kept separate from production seed).

Tests:

- Add scenario-based integration tests that:
  - set up a minimal DB state
  - execute command sequences
  - assert invariants and derived values at each step (statuses, denominators, stage transitions, event logs).

Current status:

- Added a baseline scenario test for project proposals:
  - `tests/scenario-governance-loop.test.js`

## Phase 34 — Meritocratic Measure (MM) v1 (post-V3, Formation delivery scoring)

Goal: model delivery merit earned through Formation in a way that can feed into tiers and Invision, without blocking the core governance loop testing.

Deliverables:

- MM events tied to Formation milestone outcomes (review scoring + aggregation).
- Per-address MM views and Invision signals.

Tests:

- Unit tests for MM aggregation.
- API tests for MM visibility in `GET /api/my-governance` and `GET /api/invision`.

Proposal wizard v2 track (Phases 35–39)

The current UI implementation supports meta-governance, but it still uses a largely “single big form” shape that mixes project fields with system-change fields. For long-term maintainability (and a cleaner chamber-creation UX), the wizard is moving to a template-driven design where proposal types have distinct step flows and payload shapes.

Reference:

- `docs/simulation/vortex-simulation-proposal-wizard-architecture.md` (Wizard v2 track W1–W5)

Track summary (high-level):

- A template runner + registry so proposal types can define their own steps.
- A dedicated `system.chamberCreate` flow that only collects fields needed to create and render a chamber.
- A discriminated union draft schema in the backend, with compatibility for legacy drafts during migration.

Phases:

- Phase 35–39 (Proposal wizard v2 W1–W5), as listed in the execution sequence above.

## Phase 35 — Proposal wizard v2 W1 (template runner + registry) (DONE)

Goal: extract the proposal creation flow into a template runner so different proposal kinds can have different step flows without turning `ProposalCreation.tsx` into a branching monolith.

Deliverables:

- A template registry that is safe to import from Node tests (no JSX in the template layer).
- A template runner in `src/pages/proposals/ProposalCreation.tsx` that delegates:
  - step order + labels
  - step-to-step navigation constraints (Next/Back)
  - submit gating (`canSubmit`)
- Persist template id in local draft storage.

Current status:

- Template registry:
  - `src/pages/proposals/proposalCreation/templates/registry.ts`
  - `src/pages/proposals/proposalCreation/templates/types.ts`
- Templates implemented:
  - `src/pages/proposals/proposalCreation/templates/project.ts`
  - `src/pages/proposals/proposalCreation/templates/system.ts`
- Runner integration:
  - `src/pages/proposals/ProposalCreation.tsx`
  - local storage helpers: `src/pages/proposals/proposalCreation/storage.ts`
- Tests:
  - `tests/proposal-wizard-template-registry.test.js`

## Phase 36 — Proposal wizard v2 W2 (system.chamberCreate flow) (DONE — `system` template v1)

Goal: make chamber creation proposals feel like system proposals (not project proposals), while still producing a payload the backend can accept today.

Deliverables:

- A dedicated **system** flow that:
  - forces `chamberId = "general"`
  - skips the Budget step
  - hides project-only optional sections (timeline/outputs) for system proposals
- Keep `metaGovernance` in the draft payload so existing backend finalizers apply.

Current status:

- UI “Kind” selector switches the template:
  - `project` (Essentials → Plan → Budget → Review)
  - `system` (Setup → Rationale → Review)
- `metaGovernance` fields are still collected in Essentials (action, chamber id, title, multiplier, genesis members).

## Phase 37 — Proposal wizard v2 W3 (backend discriminated drafts) (DONE)

Goal: stop requiring project-oriented fields for system proposals and make backend validation match the template.

Deliverables:

- Add a discriminant to the stored draft payload (`templateId`) and validate as a union.
- Separate required fields per draft kind:
  - `project`: keeps project-required text + budget checks.
  - `system`: requires system action fields; project-only fields can be omitted.
- Normalize missing system fields to defaults so payloads remain stable for existing UI readers.

Current status:

- `proposalDraftFormSchema` is now a template-aware discriminated union with preprocessing:
  - `project` vs `system` templates
  - template inference when `templateId` is missing
  - defaults applied for optional system fields
- Draft storage normalizes payloads via the schema so later consumers always see consistent arrays/strings.
- Tests:
  - `tests/api-command-system-draft-minimal.test.js`

## Phase 38 — Proposal wizard v2 W4 (migrate drafts + simplify validation) (DONE)

Goal: migrate stored drafts (DB + local) so the UI and backend no longer carry legacy branches.

Deliverables:

- Migration strategy:
  - Map old drafts to `project` by default.
  - Map drafts with `metaGovernance` to `system`.
- Simplify template logic by removing “mixed” validation branches.

Tests:

- Migration tests and a small “legacy draft still loads” smoke check.

Current status:

- Draft payloads are normalized on read:
  - DB: `listDrafts`/`getDraft` backfill `templateId` when missing.
  - Memory: legacy payloads are normalized and cached.
- Project wizard validation no longer handles system proposals.
- Tests:
  - `tests/proposal-draft-migration.test.js`

## Phase 39 — Proposal wizard v2 W5 (cleanup + extension points) (DONE)

Goal: keep the wizard extensible without reintroducing branching logic everywhere.

Deliverables:

- Add extension points for additional system actions without inflating the project flow.
- Keep system-specific fields out of the project flow.

Tests:

- Wizard system template validation (project fields are no longer required).

Current status:

- System action metadata is centralized in `systemActions.ts`.
- System proposals no longer require project-only fields (`what/why`).
- System review summary renders only system-specific fields.
- Tests:
  - `tests/proposal-wizard-system-template.test.js`
