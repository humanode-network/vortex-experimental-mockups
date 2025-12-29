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
- Eligibility: Humanode mainnet RPC reads of `ImOnline::*` with a safe fallback to `Session::Validators`.
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

### Events and history

- Append-only `events` table.
- Feed can be served from DB events (DB mode).
- Admin actions also emit audit events.

### Era accounting

- Current era stored in DB (simulation clock).
- Per-era activity counters per address.
- Manual/admin era advance and era rollup endpoints.
- Rollup outputs:
  - per-address status bucket for the era window
  - computed next-era `activeGovernors` size (optionally written as the next baseline)

### Ops controls (public demo safety)

- Command rate limits (per IP + per address).
- Optional per-era action quotas (per address).
- Address-level action locks (admin).
- Global write freeze (admin) + deploy-time kill switch (`SIM_WRITE_FREEZE=true`).

## Not in scope (v1)

These are intentionally deferred:

- Fully normalized domain tables replacing the `read_models` bridge across all entities.
- Full event-driven projections (materialized read views) for every page.
- Time-based windows and scheduled transitions (vote windows, automatic rollovers) beyond manual/admin clock ops.
- Delegation flows (graph rules, UI, disputes beyond court-case text).
- A real forum/threads product (threads remain minimal and simulation-only).
- Bioauth epoch uptime as a first-class modeled subsystem (epochs are defined conceptually but not fully simulated as canonical state).
- “Real tokenomics”: rewards, balances, staking, slashing correctness.

## Sources of truth

- v1 constants: `docs/vortex-simulation-v1-constants.md`
- API contract: `docs/vortex-simulation-api-contract.md`
- State machines + invariants: `docs/vortex-simulation-state-machines.md`
- Implementation status: `docs/vortex-simulation-implementation-plan.md`
