# Vortex Simulation Backend — Scope (v1)

This document defines the **v1 scope** of the Vortex simulation backend shipped from this repo. It makes the boundary between “implemented now” vs “intentionally deferred” explicit.

## Purpose

Ship a community-playable governance simulation that:

- Uses Humanode mainnet only as a read-only **eligibility gate**
- Runs all governance logic off-chain with deterministic rules
- Produces an auditable history (events + derived read views)
- Powers the UI exclusively via `/api/*`

## Hard boundary (on-chain vs off-chain)

- On-chain (read-only): determine whether an address is an **active Human Node**
- Off-chain (authoritative): everything else (proposals, votes, courts, formation, CM/tiers, feed/history)

## What “done” means for v1

v1 is “done” when:

- The UI can run clean-by-default with empty content and still be usable (no mock-only fallbacks).
- A signed-in, eligible address can execute end-to-end actions and see them reflected:
  - pool voting
  - chamber voting
  - formation join + milestone actions
  - courts reporting + verdict
- The feed is event-backed and reflects real actions.
- Era accounting exists:
  - per-era counters are tracked
  - rollup produces status buckets and next-era active set size
- Safety controls exist for a public demo:
  - rate limits
  - per-era quotas
  - action locks
  - write freeze
- Tests cover the above behavior.

## Implemented (v1)

### Identity and gating

- Session auth: wallet signs a nonce (Substrate signature verification).
- Eligibility: Humanode mainnet RPC reads of `Session::Validators` (current validator set membership).
- Cached gate status with TTL; browsing is open, writes are gated.

### Reads

- `/api/*` read endpoints exist for all UI pages.
- Read-model bridge exists:
  - DB mode reads from Postgres `read_models`
  - inline seeded mode (`READ_MODELS_INLINE=true`)
  - clean-by-default empty mode (`READ_MODELS_INLINE_EMPTY=true`)

### Writes (command-based)

- All writes route through `POST /api/command`.
- Commands implemented in v1:
  - `pool.vote`
  - `chamber.vote` (yes/no/abstain + optional score on yes)
  - `formation.join`
  - `formation.milestone.submit`
  - `formation.milestone.requestUnlock`
  - `court.case.report`
  - `court.case.verdict`
  - `proposal.draft.save`
  - `proposal.draft.delete`
  - `proposal.submitToPool`

Note on proposal wizard UX:

- v1 includes a working proposal wizard and supports meta-governance payloads for chamber creation/dissolution.
- Planned (v2+): restructure the wizard into template-driven flows so system-change proposals (like chamber creation) do not share project-only steps/fields:
  - `docs/simulation/vortex-simulation-proposal-wizard-architecture.md`

### Events and history

- Append-only `events` table.
- Feed can be served from DB events (DB mode).
- Proposal pages expose a per-proposal timeline (`GET /api/proposals/:id/timeline`) backed by `events` entries of type `proposal.timeline.v1`.
- Admin actions also emit audit events.

### Era accounting

- Current era stored in DB (simulation clock).
- Per-era activity counters per address.
- Manual/admin era advance and era rollup endpoints.
- Rollup outputs:
  - per-address status bucket for the era window
  - computed next-era `activeGovernors` size (optionally written as the next baseline)

### Canonical proposals and deterministic transitions

- Canonical proposals exist in `proposals` (with `read_models` as a compatibility fallback).
- Stage transitions are deterministic and centralized (single transition authority) and enforced by the write path.
- Optional time windows exist for stage expiry and “time left” UX.

### Canonical chambers and membership

- Chambers are canonical in `chambers` (seeded from `/sim-config.json`).
- Chamber voting eligibility is enforced via `chamber_memberships`:
  - specialization chamber: requires at least one accepted proposal in that chamber
  - general chamber: requires at least one accepted proposal in any chamber
- Meta-governance proposals in the General chamber can create/dissolve chambers (v1 simulation rule).

### Ops controls (public demo safety)

- Command rate limits (per IP + per address).
- Optional per-era action quotas (per address).
- Address-level action locks (admin).
- Global write freeze (admin) + deploy-time kill switch (`SIM_WRITE_FREEZE=true`).

## Not in scope (v1)

These are intentionally deferred:

- Completing the migration away from the `read_models` bridge for all entities (full projections across every page).
- Delegation flows (graph rules, UI, disputes beyond court-case text).
- Veto rights (and any “slow-down” mechanics for repeatedly approved proposals).
- Chamber multiplier-setting mechanics (including “outside-of-chamber” voting).
- Meritocratic Measure (MM) as a first-class modeled subsystem (Formation delivery scoring and MM history).
- A real forum/threads product (threads remain minimal and simulation-only).
- Bioauth epoch uptime as a first-class modeled subsystem (epochs are defined conceptually but not fully simulated as canonical state).
- “Real tokenomics”: rewards, balances, staking, slashing correctness.

## Planned after v1 (v2+)

These are the next build targets after v1 (see `docs/simulation/vortex-simulation-implementation-plan.md` for the full phased checklist):

- Delegation v1 (set/clear + history + court references).
- Veto v1 (paper-aligned) and a minimal “proposal sent back” lifecycle.
- Chamber multipliers v1 (paper-aligned “outside-of-chamber” multiplier voting).
- Meritocratic Measure v1 (Formation delivery ratings → MM history and Invision signals).
- More event-backed projections (less `read_models`).

## Sources of truth

- v1 constants: `docs/simulation/vortex-simulation-v1-constants.md`
- API contract: `docs/simulation/vortex-simulation-api-contract.md`
- State machines + invariants: `docs/simulation/vortex-simulation-state-machines.md`
- Implementation status: `docs/simulation/vortex-simulation-implementation-plan.md`
