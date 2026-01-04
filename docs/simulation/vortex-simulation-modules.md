# Vortex Simulation — Modules (Paper → Docs → Code)

This document defines the major modules we are building, based on:

- the Vortex 1.0 paper reference (`docs/paper/vortex-1.0-paper.md`)
- the simulation domain docs (`docs/simulation/vortex-simulation-processes.md`, `docs/simulation/vortex-simulation-state-machines.md`)
- the current repo implementation (frontend under `src/`, backend under `functions/`, DB in `db/`).

Goal: keep a stable long-term architecture where each module has:

- a clear responsibility boundary
- an API surface (read endpoints and/or commands)
- canonical state (tables) + append-only history (events)
- tests that pin behavior

## Module index

1. Identity & Sessions (auth)
2. Eligibility Gate (mainnet read)
3. Simulation Config (runtime config + genesis bootstrap)
4. Clock & Era Accounting (simulation time)
5. Quorum Engine (pool + chamber vote math)
6. Proposals (drafts → pool → vote → build)
7. Chambers (catalog + membership + meta-governance)
8. Cognitocratic Measure (CM) (LCM/MCM/ACM projection)
9. Formation (execution layer)
10. Courts (disputes)
11. Feed & Events (audit + activity stream)
12. Invision (insights)
13. Human Profiles (directory + detail)
14. Admin & Safety Controls (public demo hardening)
15. Tiers & Proposition Rights (governor ladder)
16. Delegation (voice delegation + weighting)
17. Veto (temporary slow-down)
18. Chamber Multiplier Voting (outside-of-chamber aggregation)
19. Meritocratic Measure (MM) (Formation delivery merit)

Where possible we keep “domain logic” in pure helpers under `functions/_lib/*` so it can later be extracted into a shared domain package.

---

## 1) Identity & Sessions (auth)

**Paper intent**

- Prove address control to perform governance actions.

**Backend**

- Endpoints:
  - `POST /api/auth/nonce`
  - `POST /api/auth/verify`
  - `POST /api/auth/logout`
  - `GET /api/me`
- Core files:
  - `functions/_lib/auth.ts`, `functions/_lib/nonceStore.ts`
  - `functions/_lib/signatures.ts`, `functions/_lib/tokens.ts`, `functions/_lib/cookies.ts`
  - `functions/api/auth/*.ts`, `functions/api/me.ts`
- State:
  - cookie-backed nonce + session

**Frontend**

- Core files:
  - `src/app/auth/AuthContext.tsx`
  - `src/lib/polkadotExtension.ts`
  - `src/lib/apiClient.ts`

**Tests**

- `tests/api-auth-nonce.test.js`
- `tests/api-auth-signature.test.js`
- `tests/api-auth.test.js`
- `tests/auth-ui-connect-errors.test.js`

---

## 2) Eligibility Gate (mainnet read)

**Paper intent**

- Only real Humanode participants should be able to take actions.

**Simulation v1 rule**

- Eligible if the address is in Humanode mainnet `Session::Validators`.

**Backend**

- Endpoint:
  - `GET /api/gate/status`
- Core files:
  - `functions/_lib/gate.ts`, `functions/_lib/humanodeRpc.ts`, `functions/_lib/simConfig.ts`
  - `functions/api/gate/status.ts`
- State:
  - cached eligibility (DB mode) + TTL; falls back to memory in non-DB mode

**Frontend**

- Status is consumed by the auth UI and used to gate UI actions.

**Tests**

- `tests/api-gate.test.js`
- `tests/api-gate-rpc.test.js`

---

## 3) Simulation Config (runtime config + genesis bootstrap)

**Paper intent**

- Genesis membership exists (initial governors and initial chambers).

**Backend**

- Source:
  - `/sim-config.json` (`public/sim-config.json`)
- Core files:
  - `functions/_lib/simConfig.ts`
- Responsibilities:
  - provide a runtime Humanode RPC URL fallback
  - seed the initial chamber set (when empty)
  - provide genesis chamber members for early voting eligibility

**Frontend**

- Reads `/sim-config.json` implicitly through backend behavior (not directly).

---

## 4) Clock & Era Accounting (simulation time)

**Paper intent**

- Only active governors are counted in quorum baselines; participation matters across time windows.

**Backend**

- Endpoints:
  - `GET /api/clock`
  - `POST /api/clock/tick`
  - `POST /api/clock/advance-era`
  - `POST /api/clock/rollup-era`
- Core files:
  - `functions/_lib/clockStore.ts`, `functions/_lib/eraStore.ts`, `functions/_lib/eraRollupStore.ts`
  - `functions/_lib/eraQuotas.ts`, `functions/_lib/stageWindows.ts`, `functions/_lib/v1Constants.ts`
  - `functions/api/clock/*.ts`
- State:
  - current era, per-era activity counters, era rollup results, next-era baselines

**Frontend**

- Used by “My Governance” and for quorum denominators on proposal pages.
- Pages:
  - `src/pages/MyGovernance.tsx`

**Tests**

- `tests/api-era-activity.test.js`
- `tests/api-era-rollup.test.js`
- `tests/api-my-governance-rollup.test.js`
- `tests/api-stage-windows.test.js`
- `tests/api-clock-tick.test.js`

---

## 5) Quorum Engine (pool + chamber vote math)

**Paper intent**

- Pool: quorum of attention (engagement + upvote floor).
- Vote: quorum of vote + passing threshold.
- Delegation affects vote weight (not implemented in v1).

**Backend**

- Core files:
  - `functions/_lib/poolQuorum.ts`
  - `functions/_lib/chamberQuorum.ts`
  - `functions/_lib/proposalStateMachine.ts`
  - `functions/_lib/v1Constants.ts`
- Note:
  - The quorum engine is driven by an era-specific “active governors baseline”, then filtered to the proposal’s chamber eligibility set (General = any governor; specialization = members eligible for that chamber).

**Tests**

- `tests/pool-quorum.test.js`
- `tests/chamber-quorum.test.js`
- `tests/proposal-stage-transition.test.js`

---

## 6) Proposals (drafts → pool → vote → build)

**Paper intent**

- Proposal pool filters attention; chamber vote decides acceptance; Formation is optional for execution.

**Backend**

- Read endpoints:
  - `GET /api/proposals`
  - `GET /api/proposals/:id/pool`
  - `GET /api/proposals/:id/chamber`
  - `GET /api/proposals/:id/formation`
  - `GET /api/proposals/:id/timeline`
  - `GET /api/proposals/drafts`
  - `GET /api/proposals/drafts/:id`
- Write path:
  - `POST /api/command`
    - `proposal.draft.save`
    - `proposal.draft.delete`
    - `proposal.submitToPool`
    - `pool.vote`
    - `chamber.vote`
- Core files:
  - `functions/api/proposals/*`
  - `functions/api/command.ts`
  - `functions/_lib/proposalDraftsStore.ts`, `functions/_lib/proposalsStore.ts`
  - `functions/_lib/poolVotesStore.ts`, `functions/_lib/chamberVotesStore.ts`
  - `functions/_lib/proposalProjector.ts`, `functions/_lib/proposalTimelineStore.ts`
- State:
  - canonical `proposals` + `proposal_drafts`
  - votes tables
  - timeline events in `events` (`proposal.timeline.v1`)

**Frontend**

- Pages:
  - `src/pages/proposals/Proposals.tsx`
  - `src/pages/proposals/ProposalCreation.tsx`
  - `src/pages/proposals/ProposalDrafts.tsx`
  - `src/pages/proposals/ProposalDraft.tsx`
  - `src/pages/proposals/ProposalPP.tsx`
  - `src/pages/proposals/ProposalChamber.tsx`
  - `src/pages/proposals/ProposalFormation.tsx`
- Shared UI:
  - `src/components/ProposalPageHeader.tsx`
  - `src/components/ProposalSections.tsx`
  - `src/lib/apiClient.ts`

**Wizard architecture**

- v1 uses a “single big form” draft payload with optional `metaGovernance`.
- Planned (v2+): migrate to a template-driven wizard (project vs system flows) with a discriminated draft schema:
  - `docs/simulation/vortex-simulation-proposal-wizard-architecture.md`

**Tests**

- `tests/api-command-drafts.test.js`
- `tests/api-command-pool-vote.test.js`
- `tests/api-command-chamber-vote.test.js`
- `tests/api-proposals-canonical-precedence.test.js`
- `tests/api-proposal-timeline.test.js`

---

## 7) Chambers (catalog + membership + meta-governance)

**Paper intent**

- General + specialization chambers; chamber creation/dissolution is proposal-driven.

**Simulation v1 rule**

- Chamber creation/dissolution is modeled as a meta-governance proposal outcome in the General chamber.
- Voting eligibility is earned by accepted proposals (paper-aligned eligibility rule).

**Backend**

- Endpoints:
  - `GET /api/chambers`
  - `GET /api/chambers/:id`
- Core files:
  - `functions/_lib/chambersStore.ts`
  - `functions/_lib/chamberMembershipsStore.ts`
  - `functions/api/chambers/*`
  - `functions/api/command.ts` (meta-governance side-effects)
- State:
  - `chambers` (canonical)
  - `chamber_memberships` (eligibility)

**Frontend**

- Pages:
  - `src/pages/chambers/Chambers.tsx`
  - `src/pages/chambers/Chamber.tsx`

**Tests**

- `tests/api-chambers-lifecycle.test.js`
- `tests/api-chamber-eligibility.test.js`
- `tests/api-chamber-dissolution.test.js`
- `tests/api-chambers-index-projection.test.js`
- `tests/api-chamber-detail-projection.test.js`

---

## 8) Cognitocratic Measure (CM) (LCM/MCM/ACM projection)

**Paper intent**

- Yes voters submit an additional numeric score; proposer receives CM based on the average.
- Multipliers map chamber value to global contribution; ACM is aggregate.

**Simulation v1**

- CM is awarded once per passed proposal via yes-vote score average.
- Multipliers are configured on canonical chambers (no multiplier voting yet).

**Backend**

- Core files:
  - `functions/_lib/cmAwardsStore.ts`
  - `functions/api/command.ts` (award on pass)

**Tests**

- `tests/chamber-votes-score.test.js`

---

## 9) Formation (execution layer)

**Paper intent**

- Formation is an execution layer; any bioauthorized human node can participate.

**Simulation v1**

- Formation is optional per proposal (`formationEligible`).

**Backend**

- Endpoint:
  - `GET /api/formation`
  - `GET /api/proposals/:id/formation`
- Commands:
  - `formation.join`
  - `formation.milestone.submit`
  - `formation.milestone.requestUnlock`
- Core files:
  - `functions/_lib/formationStore.ts`
  - `functions/api/formation/index.ts`

**Frontend**

- Pages:
  - `src/pages/formation/Formation.tsx`
  - proposal stage pages render Formation sections

**Tests**

- `tests/api-command-formation.test.js`

---

## 10) Courts (disputes)

**Paper reference**

- Courts and disputes are described in `docs/paper/vortex-1.0-paper.md` (working reference copy, with an added section).

**Backend**

- Endpoints:
  - `GET /api/courts`
  - `GET /api/courts/:id`
- Commands:
  - `court.case.report`
  - `court.case.verdict`
- Core files:
  - `functions/_lib/courtsStore.ts`
  - `functions/api/courts/*`

**Frontend**

- Pages:
  - `src/pages/courts/Courts.tsx`
  - `src/pages/courts/Courtroom.tsx`

**Tests**

- `tests/api-command-courts.test.js`

---

## 11) Feed & Events (audit + activity stream)

**Paper intent**

- “Constant deterrence” requires transparency and auditability.

**Backend**

- Endpoint:
  - `GET /api/feed`
- Core files:
  - `functions/_lib/eventsStore.ts`, `functions/_lib/eventSchemas.ts`
  - `functions/_lib/feedEventProjector.ts`
  - `functions/_lib/appendEvents.ts`
- State:
  - append-only `events` table

**Frontend**

- Page:
  - `src/pages/feed/Feed.tsx`

**Tests**

- `tests/api-feed.test.js`
- `tests/feed-event-projector.test.js`
- `tests/events-seed.test.js`

---

## 12) Invision (insights)

**Paper reference**

- The paper motivates transparency/deterrence; “Invision” is our name for the insights surface in the UI and is described in `docs/paper/vortex-1.0-paper.md` (working reference copy, with an added section).

**Backend**

- Endpoint:
  - `GET /api/invision`
- Core files:
  - `functions/api/invision/index.ts`

**Frontend**

- Page:
  - `src/pages/invision/Invision.tsx`

---

## 13) Human Profiles (directory + detail)

**Backend**

- Endpoints:
  - `GET /api/humans`
  - `GET /api/humans/:id`
  - `GET /api/my-governance`
- Core files:
  - `functions/api/humans/*`
  - `functions/api/my-governance/index.ts`
  - `functions/_lib/userStore.ts`

**Frontend**

- Pages:
  - `src/pages/human-nodes/HumanNodes.tsx`
  - `src/pages/human-nodes/HumanNode.tsx`
  - `src/pages/MyGovernance.tsx`

---

## 14) Admin & Safety Controls (public demo hardening)

**Backend**

- Endpoints:
  - `GET /api/admin/stats`
  - `GET /api/admin/audit`
  - `GET /api/admin/users/:address`
  - `GET /api/admin/users/locks`
  - `POST /api/admin/users/lock`
  - `POST /api/admin/users/unlock`
  - `POST /api/admin/writes/freeze`
- Core files:
  - `functions/_lib/apiRateLimitStore.ts`
  - `functions/_lib/idempotencyStore.ts`
  - `functions/_lib/actionLocksStore.ts`
  - `functions/_lib/adminAuditStore.ts`
  - `functions/_lib/adminStateStore.ts`

**Tests**

- `tests/api-admin-tools.test.js`
- `tests/api-admin-write-freeze.test.js`
- `tests/api-command-rate-limit.test.js`
- `tests/api-command-action-lock.test.js`
- `tests/api-command-era-quotas.test.js`

---

## 15) Tiers & Proposition Rights (governor ladder)

**Paper intent**

- Proposition rights are not equal across all governors; they are tied to tiers and merit (PoT/PoD/PoG–like paths).
- Tiers do not change the “1 human = 1 vote” invariant; they change what can be proposed.

**Simulation v1**

- Tier labels and status buckets are surfaced in the UI and derived through era rollups.
- Proposition rights are not fully enforced across all proposal types yet (v2+ hardening).

**Backend**

- Endpoints:
  - `GET /api/my-governance`
  - `POST /api/clock/rollup-era`
- Core files:
  - `functions/_lib/eraRollupStore.ts`
  - `functions/_lib/eraQuotas.ts`
  - `functions/api/my-governance/index.ts`

**Frontend**

- Page:
  - `src/pages/MyGovernance.tsx`

**Tests**

- `tests/api-my-governance-rollup.test.js`
- `tests/api-era-rollup.test.js`

---

## 16) Delegation (voice delegation + weighting)

**Paper intent**

- Delegation exists and affects vote aggregation (delegatee voting power grows with delegations).

**Simulation status**

Implemented in v1:

- Delegation graph + invariants (no cycles, no self-delegation), chamber-scoped.
- Delegation history events (auditable).
- Chamber vote weight aggregation:
  - vote weight = `1 + delegatedVoices`
  - a delegator’s voice only counts if the delegator did **not** cast a chamber vote themselves
  - delegation affects chamber voting only; pool attention remains direct-only.

---

## 17) Veto (temporary slow-down)

**Paper intent**

- Veto exists as a temporary slow-down mechanism, tied to top LCM holders per chamber.

**Simulation status**

Implemented in v1:

- When a chamber vote passes, the proposal can enter a **veto window** (instead of advancing immediately).
- Veto holders are derived from CM data:
  - One holder per chamber: the address with the highest accumulated **LCM** in that chamber (from `cm_awards`).
  - The veto council is snapshotted onto the proposal at vote-pass time (`proposals.veto_council`).
- Threshold:
  - `floor(2/3 * councilSize) + 1` veto votes are required.
- If the threshold is met during the veto window:
  - chamber votes are cleared
  - veto votes are cleared
  - proposal `veto_count` increments
  - voting is paused for `2 weeks` and then re-opens (proposal `updated_at` is set to the re-open time).
- If the veto window ends without a veto:
  - the proposal is finalized and advanced to `build` by `POST /api/clock/tick`.
- Max veto applies per proposal: `2` (after that, vote-pass finalizes immediately).

---

## 18) Chamber Multiplier Voting (outside-of-chamber aggregation)

**Paper intent**

- Chamber multipliers should be set by cognitocrats outside the chamber (scale 1–100).

**Simulation status**

Implemented in v1:

- Outsider submissions are stored in `chamber_multiplier_submissions` (one per `(chamber_id, voter_address)`).
- Command: `POST /api/command` → `chamber.multiplier.submit`.
- Outsider rule enforcement:
  - an address cannot submit for a chamber where it has LCM history (`cm_awards` as proposer).
- Aggregation rule (v1): rounded average of submissions is applied to `chambers.multiplier_times10`.
- CM award history remains immutable; ACM/MCM views are computed using the current chamber multipliers.

---

## 19) Meritocratic Measure (MM) (Formation delivery merit)

**Paper intent**

- MM represents delivery merit earned through Formation participation.

**Simulation status**

- Not implemented as a first-class subsystem in v1 (the UI can still show Formation progress).

Planned deliverables (v2+):

- MM events tied to Formation milestone outcomes
- aggregation into per-address MM views
- Invision signals that incorporate MM without changing voting power
