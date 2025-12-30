# Vortex Simulation Backend — State Machines (v1)

This document formalizes the **state machines, invariants, and derived metrics** the simulation backend enforces.

The UI can evolve, but these rules define what the simulation “means”.

## Conventions

- “Address” means a Substrate address string (the session identity).
- “Eligible” means “active Human Node” as returned by `GET /api/gate/status`.
- “Era” means the simulation’s governance accounting window.
- Command writes happen via `POST /api/command` only.

## Global invariants (v1)

### Write invariants

- Every command write requires:
  1. authenticated session
  2. eligibility (unless dev bypass is enabled)
  3. not globally write-frozen (admin state or `SIM_WRITE_FREEZE=true`)
  4. not action-locked for the address
  5. within rate limit + optional per-era quotas
- Idempotency is supported via `Idempotency-Key`. Reuse with different payload returns HTTP `409`.

### Read invariants

- Read endpoints are safe for unauthenticated users.
- “Clean-by-default” mode exists (`READ_MODELS_INLINE_EMPTY=true`) and pages must remain usable without seeded content.

## Proposal lifecycle (v1)

### Stages

The UI uses these stages:

- `draft`
- `pool` (proposal pool / attention)
- `vote` (chamber vote)
- `build` (formation)

In v1, stage is represented in the proposals list read model and may be auto-advanced by command evaluation.

### Pool voting (`pool.vote`)

Command:

- `type: "pool.vote"`
- `payload: { proposalId, direction: "up" | "down" }`

Invariants:

- One vote per `(proposalId, voterAddress)`.
- Re-voting overwrites the prior direction for that pair.
- The command returns updated up/down counts for the proposal.
- The command is rejected if the proposal is not in stage `pool` (HTTP `409`).

Derived metrics:

- Upvotes / downvotes are computed from `pool_votes`.
- Quorum thresholds are parameterized by:
  - active governors baseline (`SIM_ACTIVE_GOVERNORS` or per-era snapshot)
  - pool quorum constants (see `docs/vortex-simulation-v1-constants.md`)

Transition (implemented v1 behavior):

- When pool quorum is met, the backend updates the `proposals:list` read model:
  - stage `pool` → `vote`
  - it also ensures `proposals:${id}:chamber` exists (created as a minimal placeholder derived from the pool page payload if missing)

### Chamber voting (`chamber.vote`)

Command:

- `type: "chamber.vote"`
- `payload: { proposalId, choice: "yes" | "no" | "abstain", score?: number }`

Invariants:

- One vote per `(proposalId, voterAddress)`.
- `score` is only allowed when `choice === "yes"`.
- The command is rejected if the proposal is not in stage `vote` (HTTP `409`).

Derived metrics:

- yes/no/abstain totals are computed from `chamber_votes`.
- passing/quorum rules are parameterized by:
  - active governors baseline (`SIM_ACTIVE_GOVERNORS` or per-era snapshot)
  - vote quorum + passing constants (see `docs/vortex-simulation-v1-constants.md`)

Transition (implemented v1 behavior):

- When quorum + passing are met:
  - if the proposal is `formationEligible === true`, the backend updates the proposals list read model: stage `vote` → `build`
  - it also ensures `proposals:${id}:formation` exists (created as a minimal placeholder derived from the chamber page payload if missing)

### CM awarding (on pass)

Input:

- yes votes may include `score` (1–10).

Awarding rule (v1):

- When a proposal passes chamber vote, the backend records a single `cm_awards` row (unique per proposal).
- Award points are derived from the average yes `score` (exact mapping is a v1 constant).
- Human profiles are served as:
  - baseline CM numbers from read models
  - plus a delta derived from `cm_awards` overlays

## Formation (v1)

### Join (`formation.join`)

Command:

- `type: "formation.join"`
- `payload: { proposalId, role?: string }`

Invariants:

- Only allowed when proposal is in stage `build` (HTTP `409` otherwise).
- Team slots cannot exceed total.

### Milestone submit (`formation.milestone.submit`)

Command:

- `type: "formation.milestone.submit"`
- `payload: { proposalId, milestoneIndex, note?: string }`

Invariants:

- Only allowed in stage `build`.
- Milestone index must exist for the project.
- Submitting does not unlock funds in v1; it records a submission event.

### Unlock request (`formation.milestone.requestUnlock`)

Command:

- `type: "formation.milestone.requestUnlock"`
- `payload: { proposalId, milestoneIndex, note?: string }`

Invariants:

- Only allowed in stage `build`.
- Cannot request unlock for a milestone that is already unlocked.

## Courts (v1)

### Report (`court.case.report`)

Command:

- `type: "court.case.report"`
- `payload: { caseId, note?: string }`

Invariants:

- Reporting increments a reports counter and appends a report record.
- Cases have a status bucket surfaced to the UI (`jury`, `live`, `ended`).
- v1 does not attempt to model full legal procedure; it records actions and exposes a readable “proceedings” view.

### Verdict (`court.case.verdict`)

Command:

- `type: "court.case.verdict"`
- `payload: { caseId, verdict: "guilty" | "not_guilty" }`

Invariants:

- One verdict per `(caseId, voterAddress)`.
- Verdict is only allowed in allowed case statuses (v1 defines allowed states; enforced by the API).

## Era accounting (v1)

### Per-era counters

Each write command increments the per-era activity counter for the address in `era_user_activity`, by kind:

- pool votes
- chamber votes
- court actions
- formation actions

### Rollup (`POST /api/clock/rollup-era`)

Rollup computes:

- per-address status bucket for the current era window:
  - Ahead / Stable / Falling behind / At risk / Losing status
- next-era active governors baseline:
  - either configured constant or derived dynamically (if enabled)

Rollup invariants:

- Deterministic: given the same stored activity counters and constants, output is identical.
- Idempotent for a given era.

## What’s intentionally missing (v1)

Planned (v2+) and in-progress work, mapped to the implementation plan:

### Phase 12 — Proposal drafts + submission (done)

Commands:

- `proposal.draft.save`
- `proposal.draft.delete`
- `proposal.submitToPool`

Core invariants:

- Drafts are author-owned (default: not globally browseable).
- Submit is only allowed from `draft` stage.
- Submit enforces the wizard-required fields (exact list is defined in the API contract and validated by the command handler).

### Phase 13 — Eligibility via `Session::Validators`

Planned change:

- Eligibility is based on current validator set membership on mainnet (`Session::Validators`).
- `ImOnline::*` is not used for gating decisions in the simulation.

### Phase 14 — Canonical proposal tables + projections

Planned shift:

- Canonical proposal state lives in normalized tables (`proposals`, `proposal_drafts`, optional `proposal_stage_transitions`).
- DTOs remain stable; read endpoints are served from projections (compat mode can keep writing DTO payloads into `read_models` while migrating).

### Phase 15 — Deterministic transitions authority

Planned rule:

- All stage transitions are performed by a single transition authority and are event-backed.
- Invalid transitions return HTTP `409` and do not partially apply changes.

### Phase 16 — Time windows + automation

Planned additions:

- Scheduled era advancement/rollup (cron) with deterministic, idempotent behavior.
- Optional per-stage vote windows with a clear expiry policy (close/fail/extend rules are a v2 decision).

### Phase 17 — Delegation v1

Planned commands:

- `delegation.set`
- `delegation.clear`

Planned invariants:

- No self-delegation.
- No cycles (graph must remain acyclic).
- Delegation changes are event-backed so courts can reference full history.

### Future court hooks (beyond v1)

- Outcome hooks that affect Formation unlocks, reputation/cred flags, and visibility (simulation only).
