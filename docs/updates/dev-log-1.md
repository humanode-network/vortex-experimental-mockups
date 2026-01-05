# Dev Log #1 — Vortex Simulator v0.1

**Date:** 2025-12-24

## TL;DR

This update turns Vortex from a **UI-only mock** into a **stateful governance simulator** with a real backend:

- Wallet auth (signature-based) + **real Humanode mainnet gating**
- Proposal drafts + multi-step wizard (project vs system/meta-governance flows)
- Proposal pools → chamber voting → acceptance (with real quorums/thresholds)
- Chamber lifecycle automation (create/dissolve via General chamber proposals)
- Formation execution for project proposals (team slots + milestones)
- Courts/disputes + a canonical event timeline/feed
- Admin tools for moderation/ops (freeze, user locks, audit trail)

## What changed (as features)

### 1) A real backend exists now

Previous master was mostly front-end mock data. This release adds a working simulation backend (Pages Functions) that the UI talks to via `/api/*`, including:

- Command API for actions (`pool.vote`, `chamber.vote`, `formation.join`, court actions, admin actions)
- Read endpoints for every page model (proposals, chambers, courts, humans, factions, formation, invision, my-governance)
- A canonical event stream (feed + per-proposal timeline) so the UI reflects what actually happened, in order

### 2) Real Humanode mainnet gating (validator-only actions)

The simulator now supports a “real gate” mode: anyone can browse, but actions are blocked unless the connected wallet is an **active validator** on Humanode mainnet.

Under the hood, gating reads the mainnet validator set (via RPC) and caches results so the UI can show:

- Wallet status (connected / disconnected)
- Gate status (active / not active)

### 3) Proposal creation is now “drafts + templates”

The proposal wizard is no longer a single hardcoded form. It supports:

- **Drafts**: save anytime, resume later, submit when ready
- **Project proposals**: “execute something” (may go into Formation after acceptance)
- **System/meta-governance proposals**: “change the system” (e.g. create/dissolve a chamber)

This matters because system proposals should be realized immediately by the simulator (they change the system state), while project proposals represent broader execution work.

### 4) Proposal Pools work (quorum of attention)

Each proposal enters the appropriate pool first. Governors can upvote/downvote.

- Proposals advance from pool → chamber vote when they meet the attention threshold.
- Vote updates are idempotent and counted toward per-era action quotas.

### 5) Chamber voting works (quorum + 66.6% + 1)

Once a proposal reaches chamber vote, governors vote **yes/no/abstain**.

- Quorum is derived from the active-governor denominator for that chamber/era.
- Passing is the strict rule: **66.6% + 1 vote** among those voting.
- Optional vote scoring on “yes” is used for cognitocratic measure (CM) flows.

### 6) System proposals can create/dissolve chambers (and they appear in the UI)

The biggest “it feels real” change: a General-chamber system proposal can be:

Draft → Proposal Pool → Chamber Vote → **Passed** → chamber is created/dissolved

When a chamber is created, the simulator seeds initial membership (genesis members + proposer), and the new chamber appears on `/app/chambers` immediately.

### 7) Formation is now an execution module (for project proposals)

For proposals that require Formation:

- Formation pages exist and derive from the accepted proposal
- Team slots can be filled (join)
- Milestones can be submitted and unlocks requested (mock execution loop)

System proposals bypass Formation by design.

### 8) Courts/disputes are stateful

Courts now support a real “case lifecycle” in the simulator:

- Reports increment and can move cases through statuses
- Verdicts are restricted by case status (e.g. only when live)
- Case events show up in feed/timelines

### 9) My Governance is backed by era logic

There’s a real concept of “era activity” in the backend now:

- Actions count toward an era (with quotas)
- Rollups produce per-user status for the next era
- Denominators for quorums are snapshotted per stage so they don’t drift mid-vote

### 10) Admin tooling exists (so the demo can be run safely)

Basic moderation/ops endpoints were added for the simulator:

- Freeze writes (temporary global pause)
- Lock/unlock users (block actions)
- Audit log for admin actions

## How to try it (quick)

- Local full-stack (UI + Functions): run `yarn dev:full`.
- If `/api/*` is missing: use the Pages Functions flow described in `docs/vortex-simulation-local-dev.md`.

## What’s next

This v0.1 milestone is “the simulator exists”. Next work should focus on deepening correctness and closing the remaining “paper vs simulator” gaps:

- Active governance rules and quorums fully derived from era rollups
- Completing the module set for end-to-end realism (delegation, veto UX, more proposal types)
- Hardening persistence mode (Postgres) and deployment configuration
