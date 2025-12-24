# Vortex Simulation Backend — Processes to Model

This document defines the domain processes the Vortex simulation backend models to match the UI mockups in this repo. This is not an on-chain implementation; it emulates “how Vortex would work” off-chain with deterministic rules + simulated time.

## 0.1) On-chain vs off-chain boundary (proto-vortex architecture)

Humanode mainnet provides the **identity/eligibility gate** (read-only verification). Everything else is off-chain:

- Off-chain: proposals, pools, votes, formation projects, courts, factions, reputation/cred, and the feed/event log.
- On-chain (read-only): whether an address is a valid/active Human Node / validator (and any relevant identity mapping and uptime signals).

This implies an architecture with:

- Off-chain authentication (wallet signature) + on-chain eligibility checks.
- An authoritative off-chain state machine for all governance flows.

## 0) Goals and non-goals

### Goals

- Provide a stateful backend that powers the UI pages (Feed, Proposals, Chambers, Formation, Courts, Human Nodes, My Governance, Invision, etc.).
- Model governance behavior with realistic **state transitions**, **eligibility**, and **time (epochs/eras)**.
- Produce an event stream for the Feed and per-entity histories (proposal history, court proceedings, human node activity).
- Keep all “facts” derived from canonical state (avoid UI-only hardcoded strings).
- Allow anyone to create an account, but **gate all write actions** (voting, reporting, submitting, joining, etc.) behind **active Human Node** status verified from Humanode mainnet.

### Non-goals

- No on-chain writes and no smart-contract integration for the simulation.
- No on-chain transactions. Wallet signatures are used **only** for authentication and gating.
- No token accounting correctness beyond the needs of the simulation UI.
- No full forum product (threads are simulated/limited).

## 1) Core concepts (entities)

### 1.1 Human identity + PoBU

- **Human**: unique participant; in the real system uniqueness comes from **PoBU**.
- **Human Node**: a verified human running a node; may also be a governor if eligible.

Simulation requirements:

- Uniqueness constraint: one “Human” → one “active identity” at a time.
- Identity statuses: verified, pending, restricted, revoked (for courts scenarios).
- Authentication: users authenticate by signing a nonce with the **same wallet they run their Human Node with**.
- Eligibility gating: anyone can browse, but action buttons are blocked unless the user is an **active Human Node** (verified via mainnet RPC).

#### Account vs eligibility

- **Account**: off-chain profile used for UI personalization/history; can be created by anyone.
- **Eligible actor**: an account that is currently an active Human Node; only eligible actors may perform state-changing actions.

Recommended modeling:

- `user` (account): `id`, `address`, `createdAt`, profile fields.
- `eligibility` (cached claim): `address`, `isActiveHumanNode`, `checkedAt`, `source` (`rpc`), `expiresAt`, and optional reason codes.

#### v1 eligibility source (RPC)

For v1 we use **Humanode mainnet RPC only** (no Subscan dependency).

Eligibility rule (v1): an address is an **active Human Node** if it is an **active validator** on mainnet (v1 reads the validator set via `Session::Validators`).

Implication:

- Browsing is open to everyone.
- Any state-changing action requires:
  1. proof of address control (wallet signature session), and
  2. a fresh “active validator” eligibility check (cached with TTL).

### 1.2 Governance time

- **Epoch**: Humanode Bioauth uptime accounting window.
- **Era**: Vortex governance accounting window.

Simulation requirements:

- A controllable clock: real-time, accelerated, or manual “advance era”.
- Snapshotting: per-era aggregates for participation, eligibility, and metrics.

#### Epoch (Bioauth)

Humanode splits chain time into **epochs** (≈ every ~4 hours). Epochs are used to account **human node uptime** for (simulated) fee distribution eligibility.

For the purposes of this simulation:

- A “week” is **42 epochs**.
- A human node must be Bioauthenticated for **42/42 epochs per week** to be eligible for fee distribution.

What to model:

- Per human node: `bioauthEpochsThisWeek` and `isFeeEligibleThisWeek`.
- Optional: missed epochs reasons (offline / bioauth failed / restricted).

#### Era (Governance window)

Vortex uses **eras** as the governance accounting window. An era is the unit that determines:

- Whether a governor is counted as an **active governor for the next era**.
- Whether that governor is counted in **quorum baselines** in the next era (pool/vote thresholds).

What to model:

- Per human: `actionsCompletedThisEra`, `actionsRequiredThisEra`, and derived `isActiveGovernorNextEra`.
- An era boundary “rollup” that freezes counts and updates quorum baselines for the next era.

### 1.3 Chambers

Chambers are specialization-based governance domains in the UI:

- Design
- Engineering
- Economics
- Marketing
- General
- Product

Simulation requirements:

- Chamber membership (who belongs where; can be multiple).
- Chamber multipliers (for CM math).
- Per-chamber pipeline counts: pool / vote / formation.

### 1.4 Cognitocratic Measure (CM)

CM is a reputation-like contribution score:

- **LCM**: local CM earned in a specific chamber.
- **Multiplier (M)**: chamber multiplier.
- **MCM**: LCM × M.
- **ACM**: Σ MCM across chambers.

Simulation requirements:

- A deterministic scoring event: when a proposition is accepted, the proposer earns CM.
- Optional “review score” input (1–10) from voters for the accepted proposal.
- Recompute ACM from LCM + multipliers (no manual ACM editing).

### 1.5 Tiers + proposition rights

Tier ladder (UI uses): Nominee → Ecclesiast → Legate → Consul → Citizen.

Simulation requirements:

- Tier progression rules (PoT / PoD / PoG–like requirements).
- Tier decay + statuses (Ahead / Stable / Falling behind / At risk / Losing status).
- Eligibility gating (what actions are available by tier).

### 1.6 Delegation

- Delegator chooses a delegatee for representation (still 1 human = 1 vote conceptually).

Simulation requirements:

- Delegation graph (one delegator → one delegatee; cycles disallowed).
- Delegation metadata for courts (events, timing windows, alleged abuse scenarios).
- Ability to toggle delegation on/off for a simulation era.

### 1.7 Proposals

Proposal lifecycle stages shown in the UI:

- Draft
- Proposal pool (attention)
- Chamber vote
- Formation (execution)

Simulation requirements:

- Stage transitions with gates: pool thresholds, vote window rules, formation eligibility.
- Per-stage metrics shown in UI (quorums, floors, vote split, budgets, milestones, team slots).
- Attachments metadata (links only; no file storage required for the simulation).

### 1.8 Formation (execution layer)

Formation manages implementation after approval:

- Project status: gathering / live / completed
- Milestones with unlocks (tranches)
- Team slots (filled/open)

Simulation requirements:

- Milestone definitions and acceptance criteria.
- Milestone completion events (deliverable posted, challenged, approved).
- Partial release / conditional release flows (via courts or chamber decision).

### 1.9 Courts

Courts handle disputes:

- Delegation disputes
- Milestone completion contested
- Identity integrity disputes (PoBU anomalies)

Simulation requirements:

- Case states: Jury / Session live / Ended.
- Reporting (N reports) and proceedings sections (claim, evidence, planned actions).
- Verdict capture: Guilty / Not guilty (mock UI) and outcome effects (recommendations, sanctions flags, milestone withholding, etc.).

### 1.10 Factions

Factions are off-chain-aligned groupings:

- Membership lists / roster highlights
- Initiatives linked to proposals

Simulation requirements:

- Join/leave, membership counts, “focus”, roster highlights.
- Initiative tracking (references to proposals and their states).

### 1.11 Feed (event stream)

Feed aggregates events across the system:

- proposal events (created, moved stage, quorum met, vote updates)
- formation events (milestone posted, tranche released, team joined)
- courts events (case opened, reports count changes, session live, verdict)
- threads events (reply count changes)
- faction events (initiative started, membership changes)

Simulation requirements:

- Append-only event log with typed events.
- Derived “cards” per stage for UI consumption.
- Pagination + filtering by stage/category.

## 2) Processes to implement (workflows)

Each workflow below should be implemented as a state machine + event emissions.

### 2.0 Authentication + gating (read-only vs write)

Login:

- Client requests a nonce for an address.
- Client signs the nonce with the Human Node wallet.
- Backend verifies signature, issues a session (cookie/JWT).

Eligibility check (authoritative gating):

- Backend checks Humanode mainnet data via **RPC queries** (v1).
- Backend caches the eligibility result with a short TTL (e.g. 10–30 minutes) and re-checks on demand.

Two proofs (explicit):

- Proof A: “User controls address X” (nonce + signature; SIWE-style but chain-agnostic).
- Proof B: “Address X is an active Human Node” (mainnet read via RPC; v1 reads `Session::Validators`).

Eligibility claim (cached):

- `isValidator` / `isActiveHumanNode`: boolean
- `validatorId` (if applicable)
- `checkedAtBlock` or `checkedAtTime`
- `eligibilityExpiresAt` (TTL)

Rule:

- Everyone can browse and read.
- Any write action requires `isActiveHumanNode === true` at the moment of the action.

Recommended API surface (v1):

- `POST /api/auth/nonce` → returns nonce for `address`
- `POST /api/auth/verify` → verifies signature, returns session
- `GET /api/gate/status` → returns `{ eligible: boolean, reason?: string, expiresAt: string }`

### 2.1 Onboarding (Human → Human Node → Governor)

- Create human identity (PoBU verified).
- Enable node running status and uptime tracking.
- Determine governor eligibility for the era (meets uptime + action minima).

Outputs:

- Human node profile stats (PoT/PoD/PoG-like)
- Governor status pill (Active / Not active)

### 2.2 Era rollup (the simulation “cron”)

At each era boundary:

- Close voting windows that expired.
- Evaluate pool thresholds and advance eligible proposals.
- Compute governor activity (actions done vs required).
- Update tier decay streaks + derive status (Ahead/Stable/etc.).
- Recompute CM aggregates and chamber stats.

Outputs:

- Updated “My Governance” metrics and statuses.
- Updated chamber directory metrics/pipelines.
- Feed events: era boundary, status changes, proposals moved.

### 2.3 Proposal drafting (multi-step wizard)

- Create draft with required fields (Who/What/Why/When/Where/How/How much, attachments optional).
- Save draft any time.
- Validate for submission only at final step.

Outputs:

- Draft appears in Drafts list.
- Draft → Pool submission event.

### 2.4 Proposal pool (attention / signaling)

Actions:

- Upvote / downvote (with rules acknowledgment).
- Comment / “watch” (optional, if modeled).

Gates:

- Attention quorum: engaged governors >= threshold (absolute and/or %).
- Upvote floor: upvotes >= threshold (absolute and/or %).

Outputs:

- Pool metrics (engaged vs needed; upvotes vs needed; % values).
- Pool → Chamber vote transition event when gates met.

### 2.5 Chamber vote (decision)

Actions:

- Vote yes/no/abstain (direct or delegated).
- Optionally attach a “CM score” for proposer (1–10) as part of vote.

Gates:

- Voting quorum met.
- Passing rule met (e.g. ≥66.6% yes among cast votes, within quorum).

Outputs:

- Vote split + % displayed on proposal page and in cards.
- If passed and formation eligible: move to Formation.
- If failed: close proposal (Ended/Rejected) and emit event.

### 2.6 Formation execution (projects)

Actions:

- Join project (fill team slot).
- Mark milestone “ready for review”.
- Submit deliverable links (attachments).
- Request tranche unlock.

Gates:

- Milestone acceptance (reviewers / chamber / court ruling).

Outputs:

- Formation metrics (budget allocated, milestones, progress).
- Formation stage changes (gathering/live/completed).
- Feed events for milestone progression.

### 2.7 Courts (case lifecycle)

Inputs (create case):

- Reports threshold reached or manual court filing.
- Link to target entity: delegation incident / proposal milestone / identity anomaly.

Actions:

- Add report (increments reports count).
- Add evidence links (structured list).
- Jury “votes” guilty/not guilty (mock).

Outputs:

- Case status transitions (Jury → Session live → Ended).
- Recommendations/sanctions flags that can affect:
  - delegation visibility / restrictions
  - milestone payout hold/release
  - identity restriction flags

### 2.8 Delegation management

Actions:

- Delegate to another human.
- Remove delegation.
- Update delegation terms metadata (optional).

Constraints:

- Prevent cycles.
- Apply effective delegation at the era snapshot (so votes are consistent).

Outputs:

- Delegation events in feed and for courts evidence.

### 2.9 Chamber directory + chamber detail

Directory:

- Show per-chamber multipliers and stats (governors, ACM/LCM/MCM).
- Show pipeline counts (pool/vote/formation).

Detail:

- Filter proposals by stage (Upcoming/Live/Ended).
- Governor roster (derived from chamber membership + tier).
- Threads/chat mock (optional).

Outputs:

- Stable derived views from the canonical state (no duplicated counters).

### 2.10 Invision insights (reputation / risk panel)

For humans/proposers:

- Aggregated historical performance metrics (approved/abandoned, milestones, delays, slashing, vote participation, delegations).

Simulation requirements:

- Deterministic scoring function producing a “confidence” and a “risk” label.
- Update on era rollups and major events (proposal accepted, milestone contested, court verdict).

## 3) State + invariants (must stay consistent)

- One human = one vote (delegation only changes _who casts_, not weight).
- Chamber multipliers are used in CM calculations; ACM is derived, not manually edited.
- Proposal stage transitions must be monotonic and recorded (audit trail).
- Court outcomes must not silently mutate history; always emit events and keep a case record.
- All UI “labels” should be derived from IDs/enums in canonical data (avoid free-text drift).
- “Browse is open, write is gated”: any state-changing command must be rejected unless the actor is an active Human Node at execution time.

## 4) Suggested simulation architecture (implementation shape)

### 4.1 Modules

- `identity`: humans, PoBU status
- `governanceTime`: epoch/era clock + rollups
- `chambers`: membership, multipliers, stats derivation
- `cm`: LCM/MCM/ACM computation
- `tiers`: progression + decay + status labels
- `delegation`: edges + events
- `proposals`: drafts + pool + vote + formation transitions
- `formation`: projects, milestones, team slots, tranches
- `courts`: cases, reports, verdicts, recommendations
- `feed`: event store + derived feed cards

### 4.2 Data flow

- Write operations produce **events** and mutate **canonical state**.
- Read APIs serve either:
  - canonical state (proposals, chambers, humans), or
  - derived views (feed cards, stats, metrics) computed from canonical state + events.

### 4.3 Back-end stack (practical)

- API: Cloudflare Workers (or Pages Functions)
- DB: Postgres (Neon/Supabase) or Cloudflare D1 (v1 OK)
- Event log: append-only `events` table (feed + audit trail)
- Jobs: Cron triggers for era rollups
- Optional: Durable Objects for race-free updates (double-vote prevention, counters, quorum snapshots)

### 4.3 Determinism knobs

- Seeded random generator for “simulated activity” (optional autopopulation).
- Manual override controls for testing scenarios (force quorum met, force court verdict, etc.).

## 5) Next step: pick “v1 processes”

If we scope a first backend v1 that matches the current UI, the minimum set is:

- Era rollup
- Proposals: draft → pool → vote → formation transitions
- Chamber stats + multipliers + CM computation
- Courts: case open + status + verdict
- Feed event stream
