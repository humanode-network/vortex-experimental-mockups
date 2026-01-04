# Vortex Simulation — Alignment With Vortex 1.0 Paper (Audit Notes)

This document compares:

- `docs/paper/vortex-1.0-paper.md` (working reference copy) and
- the simulation docs (`docs/simulation/vortex-simulation-*.md`) and
- the current implementation (`functions/`, `db/schema.ts`, `src/`).

Goal: make it explicit what is **paper-aligned**, what is **deliberately simplified in v1**, and what is **not implemented yet**.

## Summary (high-signal)

- Proposal pool attention quorum is **paper: 22% engaged + ≥10% upvotes** vs **simulation v1: 22% engaged + ≥10% upvotes**.
- Chamber vote quorum is **paper: 33%** and **simulation v1: 33%** (aligned).
- Passing rule is **paper: 66.6% + 1** vs **simulation v1: 66.6% + 1** (aligned; strict supermajority).
- Vote weight via delegation is **paper: yes (governor power = 1 + delegations)** and **simulation v1: implemented for chamber vote weighting** (pool attention remains direct-only).
- Veto is **paper: yes** vs **simulation v1: implemented** (temporary slow-down with bounded applies).
- Chamber multiplier voting is **paper: yes (1–100, set by outsiders)** vs **simulation v1: implemented** (outsider submissions + aggregation updates canonical multipliers).
- Stage windows are **paper: vote stage = 1 week** vs **simulation v1: pool = 7 days, vote = 7 days (defaults; configurable)**.

## Detailed comparison

### Chambers

**Paper**

- Two chamber types: General Chamber (GC) + Specialization Chambers (SC).
- Chamber inception/dissolution is proposal-driven.
- Paper describes both SC-driven and GC-driven dissolution, including a “vote of censure” variant.

**Simulation v1 (current implementation)**

- Canonical chambers exist in `db/schema.ts` as `chambers` with `status = active | dissolved`.
- Chambers are seeded from `/sim-config.json` (`public/sim-config.json`) when the DB table is empty.
- Chamber create/dissolve exists as a **meta-governance proposal** action and is enforced as **General-only**:
  - `functions/api/command.ts` rejects meta-governance proposals unless `chamberId === "general"`.
- Dissolution is **General-only** (v1 rule) and does not delete history.

**Not yet modeled (paper)**

- SC-side dissolution flows and censure exclusions (“target chamber members not counted in quorum”).
- Chamber “sub-chambers” are removed from the paper reference copy by design decision (not in v1).

### Proposal pools (quorum of attention)

**Paper**

- Proposal pool is an attention filter:
  - “upvotes or downvotes from 22% of active governors”, and
  - “not less than 10% of upvotes”.
- Delegated votes are not counted in proposal pools.

**Simulation v1**

- Quorum math is implemented in `functions/_lib/poolQuorum.ts`:
  - `V1_POOL_ATTENTION_QUORUM_FRACTION = 0.22` (22%)
  - `V1_POOL_UPVOTE_FLOOR_FRACTION = 0.1` (10%)
- Pool voting is restricted to governors (addresses with at least one accepted proposal in any chamber).
- Delegation exists but is not applied to proposal-pool attention (pool votes remain direct-only, paper intent).

**Paper divergence (explicit)**

- Paper uses 22% attention; v1 simulation uses 22% attention.

### Chamber vote (quorum of vote + passing)

**Paper**

- Quorum: 33% of active governors vote.
- Passing: qualified majority “66.6% + 1” of cast votes (including delegated ones).

**Simulation v1**

- Quorum math is implemented in `functions/_lib/chamberQuorum.ts`:
  - `V1_CHAMBER_QUORUM_FRACTION = 0.33`
  - `V1_CHAMBER_PASSING_FRACTION = 2/3` (66.6%), applied as a strict “66.6% + 1 yes vote” rule
- Delegation is implemented and affects chamber vote aggregation:
  - vote weight = `1 + delegatedVoices`
  - a delegator’s voice only counts if that delegator did **not** cast a chamber vote themselves.

### Delegation

**Paper**

- Delegation exists and affects vote power aggregation:
  - governor power equals `1 + number_of_delegations`.
- Delegation is chamber-scoped: governors delegate within the same chamber.

**Simulation v1**

- Delegation graph + history are implemented:
  - `delegations` + `delegation_events` tables
  - commands: `delegation.set`, `delegation.clear`
- Delegation affects chamber vote aggregation only (pool attention remains direct-only).

### Veto

**Paper**

- Veto exists as a temporary slow-down mechanism.
- Veto power is tied to top LCM holders per chamber.

**Simulation v1**

- Implemented as a bounded “pending veto” window after a proposal passes chamber vote:
  - When vote quorum + passing are met, the proposal does not advance immediately.
  - The backend snapshots:
    - `vote_passed_at`, `vote_finalizes_at` (veto window end),
    - `veto_council` (one holder per chamber: top LCM holder),
    - `veto_threshold` (`floor(2/3*n) + 1`).
  - Veto votes are recorded during the window (`veto_votes` table).
  - If veto threshold is reached:
    - chamber votes are cleared
    - veto votes are cleared
    - `veto_count` increments
    - voting is paused for the veto delay window and then re-opens (via a future `updated_at`).
  - If the window ends without a veto:
    - the accepted proposal is finalized and advances to `build` (via `POST /api/clock/tick`).
  - Veto applies are bounded (`max = 2`); after that, accepted votes finalize immediately.

### CM and multipliers

**Paper**

- CM is awarded when a proposition is accepted; yes voters also input a numeric score (example scale 1–10).
- Chamber multipliers are set by outsiders (example scale 1–100).
- LCM/MCM/ACM relationships are defined with ACM as Σ(LCM × multiplier).

**Simulation v1**

- Yes-vote scoring exists, and CM awards are computed on pass:
  - `functions/api/command.ts` computes `avgScore` and awards a CM event once per proposal.
  - `lcmPoints = round(avgScore * 10)`, `mcmPoints = lcmPoints * multiplier`.
- Multipliers are stored on the canonical chamber record (`multiplierTimes10`) and can be updated via outsider submissions:
  - `chamber_multiplier_submissions` stores one submission per `(chamber, voter)`.
  - the chamber multiplier is updated to the rounded average of all submissions.
  - CM award history remains immutable; ACM/MCM views can be recomputed from `lcmPoints` and the current multipliers.

### Formation

**Paper**

- Formation is an execution layer; any bioauthorized human node can participate.

**Simulation v1**

- Formation actions exist (`formation.join`, `formation.milestone.submit`, `formation.milestone.requestUnlock`) and are gated by “active human node” eligibility (validator set membership).

### Courts and disputes

**Paper**

- Courts and disputes are described in `docs/paper/vortex-1.0-paper.md` (working reference copy, with an added section).

**Simulation v1**

- Courts are modeled and implemented as an off-chain dispute system with report/verdict commands and auditable case state.

### Invision

**Paper**

- “Deterrence” and transparency are described conceptually; this repo’s paper reference copy also includes an “Invision” section that matches the UI’s concept.

**Simulation v1**

- Invision exists as a derived “system state / reputation lens” endpoint and page (`GET /api/invision`).

## Action list (what to change next to be more paper-aligned)

1. Review whether any other pool quorum details differ from the paper.
