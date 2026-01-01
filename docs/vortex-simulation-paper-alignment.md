# Vortex Simulation — Alignment With Vortex 1.0 Paper (Audit Notes)

This document compares:

- `docs/vortex-1.0-paper.md` (working reference copy) and
- the simulation docs (`docs/vortex-simulation-*.md`) and
- the current implementation (`functions/`, `db/schema.ts`, `src/`).

Goal: make it explicit what is **paper-aligned**, what is **deliberately simplified in v1**, and what is **not implemented yet**.

## Summary (high-signal)

- Proposal pool attention quorum is **paper: 22% engaged + ≥10% upvotes** vs **simulation v1: 20% engaged + ≥10% upvotes**.
- Chamber vote quorum is **paper: 33%** and **simulation v1: 33%** (aligned).
- Passing rule is **paper: 66% + 1** vs **simulation v1: ≥ 2/3 (66.6%)** (close/aligned in spirit, slightly different wording).
- Vote weight via delegation is **paper: yes (governor power = 1 + delegations)** vs **simulation v1: delegation not implemented**.
- Veto is **paper: yes** vs **simulation v1: not implemented**.
- Chamber multiplier voting is **paper: yes (1–100, set by outsiders)** vs **simulation v1: multipliers are configured/controlled via canonical chamber records**.
- Stage windows are **paper: vote stage = 1 week** vs **simulation v1: pool = 7 days, vote = 3 days (defaults; configurable)**.

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
  - `V1_POOL_ATTENTION_QUORUM_FRACTION = 0.2` (20%)
  - `V1_POOL_UPVOTE_FLOOR_FRACTION = 0.1` (10%)
- Delegation is not implemented, so all pool votes are direct.

**Paper divergence (explicit)**

- Paper uses 22% attention; v1 simulation uses 20% attention.

### Chamber vote (quorum of vote + passing)

**Paper**

- Quorum: 33% of active governors vote.
- Passing: qualified majority “66% + 1” of cast votes (including delegated ones).

**Simulation v1**

- Quorum math is implemented in `functions/_lib/chamberQuorum.ts`:
  - `V1_CHAMBER_QUORUM_FRACTION = 0.33`
  - `V1_CHAMBER_PASSING_FRACTION = 2/3` (66.6%)
- Delegation is not implemented, so all chamber votes are direct.

### Delegation

**Paper**

- Delegation exists and affects vote power aggregation:
  - governor power equals `1 + number_of_delegations`.
- Paper contains two claims about delegation scope:
  - delegation is “specialized” (same chamber), and
  - delegation is “permissionless” (any human node to any governor).
    This is internally inconsistent and needs a chosen v1 interpretation.

**Simulation v1**

- Delegation is not implemented.
- Courts can reference delegation disputes at the narrative level, but there is no delegation graph/history yet.

### Veto

**Paper**

- Veto exists as a temporary slow-down mechanism.
- Veto power is tied to top LCM holders per chamber.

**Simulation v1**

- Not implemented.

### CM and multipliers

**Paper**

- CM is awarded when a proposition is accepted; yes voters also input a numeric score (example scale 1–10).
- Chamber multipliers are set by outsiders (example scale 1–100).
- LCM/MCM/ACM relationships are defined with ACM as Σ(LCM × multiplier).

**Simulation v1**

- Yes-vote scoring exists, and CM awards are computed on pass:
  - `functions/api/command.ts` computes `avgScore` and awards a CM event once per proposal.
  - `lcmPoints = round(avgScore * 10)`, `mcmPoints = lcmPoints * multiplier`.
- Multipliers are stored on the canonical chamber record (`multiplierTimes10`) and are not voted on yet.

### Formation

**Paper**

- Formation is an execution layer; any bioauthorized human node can participate.

**Simulation v1**

- Formation actions exist (`formation.join`, `formation.milestone.submit`, `formation.milestone.requestUnlock`) and are gated by “active human node” eligibility (validator set membership).

### Courts and disputes

**Paper**

- Courts and disputes are described in `docs/vortex-1.0-paper.md` (working reference copy, with an added section).

**Simulation v1**

- Courts are modeled and implemented as an off-chain dispute system with report/verdict commands and auditable case state.

### Invision

**Paper**

- “Deterrence” and transparency are described conceptually; this repo’s paper reference copy also includes an “Invision” section that matches the UI’s concept.

**Simulation v1**

- Invision exists as a derived “system state / reputation lens” endpoint and page (`GET /api/invision`).

## Action list (what to change next to be more paper-aligned)

1. Decide delegation interpretation (same-chamber vs global), then implement:
   - `delegation.set`, `delegation.clear`
   - delegation history events
   - chamber vote weighting (1 + delegated voices)
2. Implement veto v1 (event-backed, temporary, limited attempts).
3. Implement chamber multiplier voting (outsider submissions → aggregation → multipliers).
4. Decide whether to adopt paper’s 22% attention quorum (vs current 20%).
