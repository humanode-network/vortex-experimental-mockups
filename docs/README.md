# Docs

This folder documents the **Vortex simulation backend** that powers the UI in this repo.

Docs are grouped by intent:

- `docs/simulation/` — core simulation specs, architecture, and implementation plan
- `docs/ops/` — operational runbook for the backend
- `docs/paper/` — working reference copy of the Vortex 1.0 paper

## Overview

This repo ships two pieces together:

1. A React UI mockup of Vortex (the “governance hub”)
2. An off-chain simulation backend served from `/api/*`

The simulation is **not** an on-chain implementation. Humanode mainnet is used only as an **eligibility gate** (read-only). All governance state (proposals, votes, courts, formation, reputation/CM, feed/history) is off-chain in Postgres and advanced with deterministic rules.

### On-chain vs off-chain boundary (v1)

- On-chain (read-only): determine whether an address is an **active Human Node**
- Off-chain (authoritative): everything else

### How the backend fits the UI

The UI reads from `/api/*`. The contract is kept stable so the backend can evolve without forcing UI churn:

- Contract source of truth: `docs/simulation/vortex-simulation-api-contract.md`
- TS DTO types used by the UI: `src/types/api.ts`

In v1, reads are backed by a transitional `read_models` table (and optional overlays from normalized tables), so pages can render without requiring the full normalized domain schema on day one.

### Write path (commands)

State-changing actions go through:

- `POST /api/command`

Guards applied to every command:

- signature-authenticated session
- active Human Node eligibility (cached with TTL)
- idempotency (optional `Idempotency-Key`)
- rate limiting (per IP and per address)
- per-era action quotas (optional)
- admin action locks (optional)
- global write freeze (optional)

### Local dev modes

- Recommended: `yarn dev:full` (UI + API + `/api/*` proxy)
- DB mode: `DATABASE_URL` + `yarn db:migrate && yarn db:seed`
- Inline seeded mode: `READ_MODELS_INLINE=true`
- Clean/empty mode: `READ_MODELS_INLINE_EMPTY=true` (pages show “No … yet”)

### TypeScript projects

The repo intentionally uses two TS projects:

- UI + shared client types: `tsconfig.json` (covers `src/` + `tests/`)
- Pages Functions API: `functions/tsconfig.json` (covers `functions/` + local helper `.d.ts` typing)

This keeps editor tooling for Cloudflare Pages Functions isolated while leaving the frontend TS config lean.

Goal: keep a tight, professional set of docs that answers:

- What is being built (scope, assumptions, non-goals)
- How it works (architecture, data model, state machines)
- How the UI talks to it (API contract)
- How to run and operate it (local dev, admin/ops runbook)
- What is implemented now vs intentionally deferred

## Reading order

1. `docs/simulation/vortex-simulation-scope-v1.md` — v1 scope, explicit non-goals, and what “done” means
2. `docs/simulation/vortex-simulation-modules.md` — module map (paper → docs → code)
3. `docs/simulation/vortex-simulation-processes.md` — domain processes to model (product-level)
4. `docs/simulation/vortex-simulation-proposal-wizard-architecture.md` — proposal wizard template architecture (project vs system flows)
5. `docs/simulation/vortex-simulation-state-machines.md` — formal state machines, invariants, and derived metrics
6. `docs/simulation/vortex-simulation-tech-architecture.md` — technical architecture (runtime + DB + API shape)
7. `docs/simulation/vortex-simulation-data-model.md` — DB tables and how reads/writes/events map to them
8. `docs/simulation/vortex-simulation-api-contract.md` — frozen DTO contracts consumed by the UI
9. `docs/simulation/vortex-simulation-local-dev.md` — local dev commands and env vars
10. `docs/ops/vortex-simulation-ops-runbook.md` — admin endpoints, safety controls, and operational workflows
11. `docs/simulation/vortex-simulation-implementation-plan.md` — phased plan + current status
12. `docs/simulation/vortex-simulation-v1-constants.md` — v1 constants shared by code and tests
13. `docs/paper/vortex-1.0-paper.md` — working, adapted reference copy of the Vortex 1.0 paper (used for audits)
14. `docs/simulation/vortex-simulation-paper-alignment.md` — paper vs simulation audit notes (what matches, what’s deferred)

## Doc conventions

### Voice and tone

- Write as “we / our system”, not “you should…”.
- Prefer precise language over persuasive language.
- Keep “why” in the doc where it matters (scope/ADR), not sprinkled everywhere.

### Truth hierarchy

- **API truth:** `docs/simulation/vortex-simulation-api-contract.md` + `src/types/api.ts`
- **Scope truth:** `docs/simulation/vortex-simulation-scope-v1.md`
- **Behavior truth:** `docs/simulation/vortex-simulation-state-machines.md` (rules + invariants)
- **Operational truth:** `docs/ops/vortex-simulation-ops-runbook.md`

### Status tags

When a section mixes implemented + planned behavior, label it explicitly:

- `Implemented (v1)`
- `Planned (v2+)`
