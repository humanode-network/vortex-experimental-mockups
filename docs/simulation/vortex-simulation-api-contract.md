# Vortex Simulation Backend — API Contract v1

This document freezes the **JSON contracts** the backend serves so the UI can render from `/api/*` responses consistently.

Notes:

- These are **DTOs** (network-safe JSON), not React UI models.
- All DTOs are JSON-safe (no `ReactNode`, no `Date`, no functions).
- Read endpoints are served in two modes:
  - DB mode: reads from Postgres `read_models` (seeded by `scripts/db-seed.ts`) plus overlays from normalized tables (votes/formation/courts/era) and canonical domain tables where applicable.
  - Inline mode: `READ_MODELS_INLINE=true` serves the same payloads from the in-repo seed builder (`db/seed/readModels.ts`) for local dev/tests without a DB.
  - Empty mode: `READ_MODELS_INLINE_EMPTY=true` forces empty/default payloads (used for clean local dev and “no content yet” UX).

## Conventions

- IDs are stable slugs (e.g. `engineering`, `evm-dev-starter-kit`, `dato`).
- Timestamps are ISO strings.
- List endpoints return `{ items: [...] }` and may add cursors later.
- When the backing read-model entry does not exist, list endpoints return `{ items: [] }` (HTTP 200). Some singleton endpoints return a minimal empty object (documented below).
- Cursors are opaque and may be backed by different underlying stores (read models vs event log). Clients should treat `nextCursor` as an opaque string and pass it back unchanged.

## Auth + gating

Already implemented in `functions/api/*`:

- `GET /api/health` → `{ ok: true, service: string, time: string }`
- `POST /api/auth/nonce` → `{ address }` → `{ nonce }` (+ `vortex_nonce` cookie)
- `POST /api/auth/verify` → `{ address, nonce, signature }` (+ `vortex_session` cookie)
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/gate/status`

Eligibility (v1):

- The backend checks Humanode mainnet RPC and considers an address eligible if it is in the current validator set (`Session::Validators`).
- The Humanode RPC URL is resolved in this order:
  1. `HUMANODE_RPC_URL` (Pages Functions runtime env)
  2. `/sim-config.json` → `humanodeRpcUrl` (repo-configured runtime config served from `public/`)
- If neither is configured, the gate returns `eligible: false` with `reason: "rpc_not_configured"`.

Chamber voting eligibility (v1):

- `chamber.vote` is additionally restricted by **chamber membership**:
  - specialization chamber `X`: eligible if the human has at least one accepted proposal in `X`
  - General chamber: eligible if the human has at least one accepted proposal in any chamber
- Genesis bootstrap is configured via `/sim-config.json` → `genesisChamberMembers` (a mapping of `chamberId -> [addresses]` treated as eligible from day one).

Chambers (v1):

- Chambers are canonical (`chambers` table).
- Genesis chambers are configured via `/sim-config.json` → `genesisChambers` and are auto-seeded when the table is empty.

## Write endpoints (Phase 6+)

### `POST /api/command`

All state-changing operations are routed through a single command endpoint. Each command requires:

- a valid session cookie (`vortex_session`)
- eligibility (active human node via RPC gating), unless dev bypass is enabled

Idempotency:

- Clients may pass an `Idempotency-Key` (or `idempotency-key`) header.
- If the same key is sent again with the same request body, the stored response is returned.
- If the same key is re-used with a different request body, the API returns HTTP `409`.

Rate limiting:

- `POST /api/command` is rate limited:
  - per IP: `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP` (default `180`)
  - per address: `SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS` (default `60`)
- When rate limited, the API returns HTTP `429`:

```json
{
  "error": {
    "message": "Rate limited",
    "scope": "ip | address",
    "retryAfterSeconds": 30,
    "resetAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Action locks:

- Writes can be temporarily disabled for an address via admin action locks (`user_action_locks`).
- When locked, the API returns HTTP `403`:

```json
{
  "error": {
    "message": "Action locked",
    "code": "action_locked",
    "lock": {
      "address": "5f... (lowercased)",
      "reason": "optional",
      "lockedUntil": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

Era quotas:

- Writes can be capped per era per address (to prevent spam while the community tests the simulation).
- Limits are configured via env vars:
  - `SIM_MAX_POOL_VOTES_PER_ERA`
  - `SIM_MAX_CHAMBER_VOTES_PER_ERA`
  - `SIM_MAX_COURT_ACTIONS_PER_ERA`
  - `SIM_MAX_FORMATION_ACTIONS_PER_ERA`
- When a quota is exceeded, the API returns HTTP `429`:

```json
{
  "error": {
    "message": "Era quota exceeded",
    "code": "era_quota_exceeded",
    "era": 0,
    "kind": "poolVotes | chamberVotes | courtActions | formationActions",
    "limit": 1,
    "used": 1
  }
}
```

Additional implemented commands (Phase 12):

- `proposal.draft.save`
- `proposal.draft.delete`
- `proposal.submitToPool`
  These are gated the same way as other writes (session + eligibility).

#### Command: `proposal.draft.save`

Request:

```ts
type ProposalDraftFormPayload = {
  templateId?: "project" | "system";
  title: string;
  chamberId: string;
  summary: string;
  what: string;
  why: string;
  how: string;
  metaGovernance?: {
    action: "chamber.create" | "chamber.dissolve";
    chamberId: string;
    title?: string;
    multiplier?: number;
    genesisMembers?: string[];
  };
  timeline: { id: string; title: string; timeframe: string }[];
  outputs: { id: string; label: string; url: string }[];
  budgetItems: { id: string; description: string; amount: string }[];
  aboutMe: string;
  attachments: { id: string; label: string; url: string }[];
  agreeRules: boolean;
  confirmBudget: boolean;
};

Notes:

- This is the v1 “single big form” draft payload used by the current wizard implementation.
- `templateId` is optional; if omitted the backend infers `"system"` when `metaGovernance` is present, otherwise `"project"`.
- The backend now validates drafts using a template-aware discriminant (project vs system) so system proposals can omit project-only fields; missing fields are normalized to defaults for storage.
- Planned (v2+): drafts will continue to evolve into a template-driven discriminated union (project vs system-change flows), with full backend/schema separation. The target architecture and rollout phases are documented in:
  - `docs/simulation/vortex-simulation-proposal-wizard-architecture.md`

type ProposalDraftSaveCommand = {
  type: "proposal.draft.save";
  payload: { draftId?: string; form: ProposalDraftFormPayload };
  idempotencyKey?: string;
};
```

Response:

```ts
type ProposalDraftSaveResponse = {
  ok: true;
  type: "proposal.draft.save";
  draftId: string;
  updatedAt: string;
};
```

Notes:

- If `draftId` is omitted, the backend generates a new draft ID.

#### Command: `proposal.draft.delete`

Request:

```ts
type ProposalDraftDeleteCommand = {
  type: "proposal.draft.delete";
  payload: { draftId: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type ProposalDraftDeleteResponse = {
  ok: true;
  type: "proposal.draft.delete";
  draftId: string;
  deleted: boolean;
};
```

#### Command: `proposal.submitToPool`

Request:

```ts
type ProposalSubmitToPoolCommand = {
  type: "proposal.submitToPool";
  payload: { draftId: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type ProposalSubmitToPoolResponse = {
  ok: true;
  type: "proposal.submitToPool";
  draftId: string;
  proposalId: string;
};
```

Notes:

- Submission validates that required fields are present (same constraints as the UI wizard).
- The chamber must be valid and active:
  - if `draft.chamberId` is unknown, the API returns HTTP `400` with `code: "invalid_chamber"`.
  - if `draft.chamberId` points to a dissolved chamber, the API returns HTTP `409` with `code: "chamber_dissolved"`.
- On success, the backend:
  - creates a new proposal in the proposal pool by writing `proposals:list` and `proposals:${proposalId}:pool` read models,
  - marks the draft as submitted so it no longer appears under drafts.

#### Command: `pool.vote`

Request:

```ts
type PoolVoteDirection = "up" | "down";
type PoolVoteCommand = {
  type: "pool.vote";
  payload: { proposalId: string; direction: PoolVoteDirection };
  idempotencyKey?: string;
};
```

Response:

```ts
type PoolVoteResponse = {
  ok: true;
  type: "pool.vote";
  proposalId: string;
  direction: PoolVoteDirection;
  counts: { upvotes: number; downvotes: number };
};
```

Notes:

- If the proposal is not currently in the pool stage, the API returns HTTP `409` (the pool phase is closed once the proposal advances).
- Pool eligibility is enforced (paper-aligned):
  - only governors can upvote/downvote in proposal pools
  - specialization pools are additionally chamber-scoped:
    - voting requires eligibility for that chamber (accepted proposal in that chamber) or genesis membership
    - General pool voting requires eligibility in any chamber (accepted proposal in any chamber) or genesis membership
  - when ineligible, the API returns HTTP `403` with `code: "pool_vote_ineligible"` and the target `chamberId`
- When pool quorum thresholds are met, the backend auto-advances the proposal from **pool → vote** by updating the `proposals:list` read model.
  - If `proposals:${proposalId}:chamber` does not exist yet, it is created from the pool page payload as a minimal placeholder so the UI can render the chamber vote view.

#### Command: `chamber.vote`

Request:

```ts
type ChamberVoteChoice = "yes" | "no" | "abstain";
type ChamberVoteCommand = {
  type: "chamber.vote";
  payload: { proposalId: string; choice: ChamberVoteChoice; score?: number };
  idempotencyKey?: string;
};
```

Response:

```ts
type ChamberVoteResponse = {
  ok: true;
  type: "chamber.vote";
  proposalId: string;
  choice: ChamberVoteChoice;
  counts: { yes: number; no: number; abstain: number };
};
```

Notes:

- If the proposal is not currently in the vote stage, the API returns HTTP `409`.
- If the proposal is assigned to a dissolved chamber and was created after the chamber was dissolved, the API returns HTTP `409` with `code: "chamber_dissolved"`.
- Chamber eligibility is enforced (paper-aligned):
  - voting in a specialization chamber requires an accepted proposal in that chamber
  - voting in General requires an accepted proposal in any chamber
  - when ineligible, the API returns HTTP `403` with `code: "chamber_vote_ineligible"` and the target `chamberId`
- `score` is optional and only allowed when `choice === "yes"` (HTTP `400` otherwise). This is the v1 CM input.
- The chamber page read endpoint overlays live vote totals from stored votes (so `votes` and `engagedGovernors` update immediately).
- When quorum + passing are met, the backend either:
  - advances immediately to **build**, or
  - opens a bounded **veto window** and marks the proposal as “passed (pending veto)”.
    - If a veto window is opened, the proposal is finalized to **build** by `POST /api/clock/tick` once the window ends (unless veto is applied).
- When a proposal passes, CM is awarded off-chain:
  - the average `score` across yes votes is converted into points
  - a CM award record is stored in `cm_awards` (unique per proposal)
  - `/api/humans` and `/api/humans/:id` overlay the derived ACM delta from awards

#### Command: `veto.vote`

Veto exists as a bounded, temporary slow-down window after a proposal passes chamber vote.

Request:

```ts
type VetoVoteChoice = "veto" | "keep";
type VetoVoteCommand = {
  type: "veto.vote";
  payload: { proposalId: string; choice: VetoVoteChoice };
  idempotencyKey?: string;
};
```

Response:

```ts
type VetoVoteResponse = {
  ok: true;
  type: "veto.vote";
  proposalId: string;
  choice: VetoVoteChoice;
  counts: { veto: number; keep: number };
  threshold: number;
};
```

Notes:

- This command is only valid when a proposal is in `vote` stage and a veto window is open (HTTP `409` otherwise).
- Only veto holders can cast this vote (HTTP `403` otherwise).
- If `counts.veto >= threshold`, the backend:
  - clears chamber votes and veto votes for the proposal
  - increments `veto_count`
  - pauses voting for the veto delay window (then the vote stage re-opens automatically)
  - emits feed + timeline events for auditability

#### Command: `chamber.multiplier.submit`

Multiplier voting is used to set chamber multipliers based on outsider submissions.

Request:

```ts
type ChamberMultiplierSubmitCommand = {
  type: "chamber.multiplier.submit";
  payload: { chamberId: string; multiplierTimes10: number }; // 1..100 (represents 0.1..10.0)
  idempotencyKey?: string;
};
```

Response:

```ts
type ChamberMultiplierSubmitResponse = {
  ok: true;
  type: "chamber.multiplier.submit";
  chamberId: string;
  submission: { multiplierTimes10: number };
  aggregate: { submissions: number; avgTimes10: number | null };
  applied: null | {
    updated: boolean;
    prevMultiplierTimes10: number;
    nextMultiplierTimes10: number;
  };
};
```

Notes:

- Only governors can submit multipliers (HTTP `403` otherwise).
- Submissions are outsiders-only:
  - if an address has LCM history in the target chamber, submission is rejected (HTTP `400`).
- Aggregation (v1): average of all submissions for the chamber, rounded to an integer.
- The canonical chamber multiplier (`chambers.multiplier_times10`) is updated to the aggregate average.

#### Command: `delegation.set`

Request:

```ts
type DelegationSetCommand = {
  type: "delegation.set";
  payload: { chamberId: string; delegateeAddress: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type DelegationSetResponse = {
  ok: true;
  type: "delegation.set";
  chamberId: string;
  delegatorAddress: string;
  delegateeAddress: string;
  updatedAt: string;
};
```

Notes:

- Delegation is chamber-scoped (v1): a user can set one delegatee per chamber.
- Cycles and self-delegation are rejected (HTTP `400`).
- Delegator eligibility is enforced:
  - for General: delegator must be a governor (has an accepted proposal in any chamber)
  - for a specialization chamber: delegator must be eligible in that chamber
- Delegatee eligibility is enforced:
  - for General: delegatee must be a governor (has an accepted proposal in any chamber)
  - for a specialization chamber: delegatee must be eligible in that chamber

#### Command: `delegation.clear`

Request:

```ts
type DelegationClearCommand = {
  type: "delegation.clear";
  payload: { chamberId: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type DelegationClearResponse = {
  ok: true;
  type: "delegation.clear";
  chamberId: string;
  delegatorAddress: string;
  cleared: boolean;
};
```

#### Command: `formation.join`

Request:

```ts
type FormationJoinCommand = {
  type: "formation.join";
  payload: { proposalId: string; role?: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type FormationJoinResponse = {
  ok: true;
  type: "formation.join";
  proposalId: string;
  teamSlots: { filled: number; total: number };
};
```

Notes:

- If the proposal is not currently in the build stage, the API returns HTTP `409`.
- If the proposal does not require Formation (`formationEligible === false`), the API returns HTTP `409` with `code: "formation_not_required"`.
- If team slots are full, the API returns HTTP `409`.
- This command emits a feed event (stage: `build`).

#### Command: `formation.milestone.submit`

Request:

```ts
type FormationMilestoneSubmitCommand = {
  type: "formation.milestone.submit";
  payload: { proposalId: string; milestoneIndex: number; note?: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type FormationMilestoneSubmitResponse = {
  ok: true;
  type: "formation.milestone.submit";
  proposalId: string;
  milestoneIndex: number;
  milestones: { completed: number; total: number };
};
```

Notes:

- If the proposal is not currently in the build stage, the API returns HTTP `409`.
- If the proposal does not require Formation (`formationEligible === false`), the API returns HTTP `409` with `code: "formation_not_required"`.
- `milestoneIndex` is 1-based.
- Submitting does not automatically increase `completed` until it is unlocked.
- This command emits a feed event (stage: `build`).

#### Command: `formation.milestone.requestUnlock`

Request:

```ts
type FormationMilestoneRequestUnlockCommand = {
  type: "formation.milestone.requestUnlock";
  payload: { proposalId: string; milestoneIndex: number };
  idempotencyKey?: string;
};
```

Response:

```ts
type FormationMilestoneRequestUnlockResponse = {
  ok: true;
  type: "formation.milestone.requestUnlock";
  proposalId: string;
  milestoneIndex: number;
  milestones: { completed: number; total: number };
};
```

Notes:

- If the proposal is not currently in the build stage, the API returns HTTP `409`.
- If the proposal does not require Formation (`formationEligible === false`), the API returns HTTP `409` with `code: "formation_not_required"`.
- Unlocking requires a prior submit (HTTP `409` if not submitted).
- Double-unlock is rejected (HTTP `409`).
- This command emits a feed event (stage: `build`).

## Read endpoints

These endpoints are implemented under `functions/api/*`.

In v1, most reads start from `read_models` (DB mode) or the inline seed (inline mode), then apply overlays from normalized state (votes, formation, courts, era) and canonical tables where needed.

Proposals note:

- Proposal endpoints may prefer canonical proposals (Phase 14+) and fall back to `read_models` for seeded legacy payloads:
  - `GET /api/proposals`
  - `GET /api/proposals/:id/pool`
  - `GET /api/proposals/:id/chamber`
  - `GET /api/proposals/:id/formation`

## Admin/simulation endpoints

These endpoints are intended for simulation control (local dev, cron jobs, and admin tools).

- All admin endpoints require `x-admin-secret: $ADMIN_SECRET` unless `DEV_BYPASS_ADMIN=true`.

- `GET /api/clock`
- `POST /api/clock/advance-era`
- `POST /api/clock/rollup-era` (computes per-era statuses and next-era active governor set)
- `POST /api/clock/tick` (automation hook: rollup + optional era auto-advance)
- `POST /api/admin/users/lock` (temporarily disables writes for an address)
- `POST /api/admin/users/unlock`
- `GET /api/admin/users/locks` (lists active locks)
- `GET /api/admin/users/:address` (inspection: era counters, quotas, remaining, lock)
- `GET /api/admin/audit` (admin actions audit log)
- `GET /api/admin/stats` (admin operational stats)
- `POST /api/admin/writes/freeze` (toggle write freeze)

### `POST /api/clock/tick`

This is the simulation “cron” entrypoint. It is safe to call repeatedly; rollups are idempotent per-era and era advancement is guarded by a “due” check unless forced.

Request:

```ts
type PostClockTickRequest = {
  forceAdvance?: boolean; // advance even if the era is not due
  rollup?: boolean; // default true
};
```

Response:

```ts
type PostClockTickResponse = {
  ok: true;
  now: string;
  eraSeconds: number;
  due: boolean;
  advanced: boolean;
  fromEra: number;
  toEra: number;
  endedWindows?: Array<{
    proposalId: string;
    stage: "pool" | "vote";
    endedAt: string;
    emitted: boolean; // true only once per (proposalId, stage, endedAt)
  }>;
  rollup?: {
    era: number;
    rolledAt: string;
    requirements: {
      poolVotes: number;
      chamberVotes: number;
      courtActions: number;
      formationActions: number;
    };
    requiredTotal: number;
    activeGovernorsNextEra: number;
    usersRolled: number;
    statusCounts: Record<
      "Ahead" | "Stable" | "Falling behind" | "At risk" | "Losing status",
      number
    >;
  };
};
```

Notes:

- When `SIM_ENABLE_STAGE_WINDOWS=true`, `POST /api/clock/tick` can also emit (deduped) feed events when a proposal’s pool/vote window has ended, and returns those in `endedWindows` for visibility/debugging.
- When a proposal passes chamber vote and enters a veto window, `POST /api/clock/tick` finalizes it to `build` once the veto window ends (unless veto has been applied).

### `POST /api/admin/users/lock`

```ts
type PostAdminUserLockRequest = {
  address: string;
  lockedUntil: string; // ISO timestamp
  reason?: string;
};

type PostAdminUserLockResponse = { ok: true };
```

### `POST /api/admin/users/unlock`

```ts
type PostAdminUserUnlockRequest = { address: string };
type PostAdminUserUnlockResponse = { ok: true };
```

### `GET /api/admin/users/locks`

```ts
type GetAdminUserLocksResponse = {
  items: Array<{ address: string; lockedUntil: string; reason: string | null }>;
};
```

### `GET /api/admin/users/:address`

```ts
type EraQuotaConfigDto = {
  maxPoolVotes: number | null;
  maxChamberVotes: number | null;
  maxCourtActions: number | null;
  maxFormationActions: number | null;
};

type GetAdminUserResponse = {
  address: string;
  era: number;
  counts: {
    poolVotes: number;
    chamberVotes: number;
    courtActions: number;
    formationActions: number;
  };
  quotas: EraQuotaConfigDto;
  remaining: {
    poolVotes: number | null;
    chamberVotes: number | null;
    courtActions: number | null;
    formationActions: number | null;
  };
  lock: { address: string; lockedUntil: string; reason: string | null } | null;
};
```

### `GET /api/admin/audit`

```ts
type AdminAuditActionDto = "user.lock" | "user.unlock";
type AdminAuditItemDto = {
  id: string;
  action: AdminAuditActionDto;
  targetAddress: string;
  lockedUntil?: string;
  reason?: string | null;
  timestamp: string;
};

type GetAdminAuditResponse = {
  items: AdminAuditItemDto[];
  nextCursor?: string; // DB mode uses event seq
};
```

### `POST /api/admin/writes/freeze`

```ts
type PostAdminWritesFreezeRequest = { enabled: boolean };
type PostAdminWritesFreezeResponse = { ok: true; writesFrozen: boolean };
```

### `GET /api/admin/stats`

The response is intended for ops/debugging. It can evolve, but it stays JSON-safe and stable enough for manual inspection.

```ts
type GetAdminStatsResponse = {
  currentEra: number;
  writesFrozen: boolean;
  config: {
    rateLimitsPerMinute: {
      perIpPerMinute: number;
      perAddressPerMinute: number;
    };
    eraQuotas: {
      maxPoolVotes: number | null;
      maxChamberVotes: number | null;
      maxCourtActions: number | null;
      maxFormationActions: number | null;
    };
    dynamicActiveGovernors: boolean;
  };
};
```

### `GET /api/clock`

```ts
type GoverningStatusDto =
  | "Ahead"
  | "Stable"
  | "Falling behind"
  | "At risk"
  | "Losing status";

type EraRollupMetaDto = {
  era: number;
  rolledAt: string;
  requiredTotal: number;
  requirements: {
    poolVotes: number;
    chamberVotes: number;
    courtActions: number;
    formationActions: number;
  };
  activeGovernorsNextEra: number;
};

type GetClockResponse = {
  currentEra: number;
  activeGovernors: number;
  currentEraRollup?: EraRollupMetaDto;
};
```

### Chambers

#### `GET /api/chambers`

Returns the chambers directory cards.

```ts
type ChamberPipelineDto = { pool: number; vote: number; build: number };
type ChamberStatsDto = {
  governors: string;
  acm: string;
  mcm: string;
  lcm: string;
};
type ChamberDto = {
  id: string;
  name: string;
  multiplier: number;
  stats: ChamberStatsDto;
  pipeline: ChamberPipelineDto;
};

type GetChambersResponse = { items: ChamberDto[] };
```

Query params:

- `includeDissolved=true` (optional): include dissolved chambers in the list (default is active-only).

#### `GET /api/chambers/:id`

Returns the chamber detail model.

```ts
type ChamberProposalStageDto = "upcoming" | "live" | "ended";
type ChamberProposalDto = {
  id: string;
  title: string;
  meta: string;
  summary: string;
  lead: string;
  nextStep: string;
  timing: string;
  stage: ChamberProposalStageDto;
};

type ChamberGovernorDto = {
  id: string;
  name: string;
  tier: string;
  focus: string;
};
type ChamberThreadDto = {
  id: string;
  title: string;
  author: string;
  replies: number;
  updated: string;
};
type ChamberChatMessageDto = { id: string; author: string; message: string };
type ChamberStageOptionDto = { value: ChamberProposalStageDto; label: string };

type GetChamberResponse = {
  proposals: ChamberProposalDto[];
  governors: ChamberGovernorDto[];
  threads: ChamberThreadDto[];
  chatLog: ChamberChatMessageDto[];
  stageOptions: ChamberStageOptionDto[];
};
```

Notes:

- In v1, `governors` is projected from canonical membership (`chamber_memberships`) plus `/sim-config.json` → `genesisChamberMembers`.
- In v1, `proposals` is projected from canonical proposals:
  - pool → `upcoming`
  - vote → `live`
  - build → `ended` (meta may render as “Formation” or “Passed” depending on `formationEligible`).

### Factions

#### `GET /api/factions`

```ts
type FactionRosterTagDto =
  | { kind: "acm"; value: number }
  | { kind: "mm"; value: number }
  | { kind: "text"; value: string };

type FactionRosterMemberDto = {
  humanNodeId: string;
  role: string;
  tag: FactionRosterTagDto;
};

type FactionDto = {
  id: string;
  name: string;
  description: string;
  members: number;
  votes: string;
  acm: string;
  focus: string;
  goals: string[];
  initiatives: string[];
  roster: FactionRosterMemberDto[];
};

type GetFactionsResponse = { items: FactionDto[] };
```

#### `GET /api/factions/:id`

Returns `FactionDto`.

### Formation

#### `GET /api/formation`

```ts
type FormationMetricDto = { label: string; value: string; dataAttr: string };
type FormationCategoryDto = "all" | "research" | "development" | "social";
type FormationStageDto = "live" | "gathering" | "completed";

type FormationProjectDto = {
  id: string;
  title: string;
  focus: string;
  proposer: string;
  summary: string;
  category: FormationCategoryDto;
  stage: FormationStageDto;
  budget: string;
  milestones: string;
  teamSlots: string;
};

type GetFormationResponse = {
  metrics: FormationMetricDto[];
  projects: FormationProjectDto[];
};
```

### Invision

#### `GET /api/invision`

```ts
type InvisionGovernanceMetricDto = { label: string; value: string };
type InvisionGovernanceStateDto = {
  label: string;
  metrics: InvisionGovernanceMetricDto[];
};
type InvisionEconomicIndicatorDto = {
  label: string;
  value: string;
  detail: string;
};
type InvisionRiskSignalDto = { title: string; status: string; detail: string };
type InvisionChamberProposalDto = {
  title: string;
  effect: string;
  sponsors: string;
};

type GetInvisionResponse = {
  governanceState: InvisionGovernanceStateDto;
  economicIndicators: InvisionEconomicIndicatorDto[];
  riskSignals: InvisionRiskSignalDto[];
  chamberProposals: InvisionChamberProposalDto[];
};
```

### My governance

#### `GET /api/my-governance`

```ts
type MyGovernanceEraActionDto = {
  label: string;
  done: number;
  required: number;
};
type MyGovernanceEraActivityDto = {
  era: string;
  required: number;
  completed: number;
  actions: MyGovernanceEraActionDto[];
  timeLeft: string;
};

type GetMyGovernanceResponse = {
  eraActivity: MyGovernanceEraActivityDto;
  myChamberIds: string[];
  rollup?: {
    era: number;
    rolledAt: string;
    status: GoverningStatusDto;
    requiredTotal: number;
    completedTotal: number;
    isActiveNextEra: boolean;
    activeGovernorsNextEra: number;
  };
};
```

Notes:

- Anonymous users get the base `read_models` payload.
- When authenticated, the backend overlays `eraActivity.era` and each action’s `done` count from `era_user_activity` for the current era.
- Per-era action counters are incremented only on first-time actions per entity (e.g. changing a vote does not count as another action).
- If the current era has been rolled up, the response includes a `rollup` object derived from `era_rollups` and `era_user_status`.

### Proposals (list)

#### `GET /api/proposals?stage=pool|vote|build|draft`

Returns the proposals page cards (collapsed/expanded content comes from this DTO).

```ts
type ProposalStageDto = "draft" | "pool" | "vote" | "build";
type ProposalToneDto = "ok" | "warn";

type ProposalStageDatumDto = {
  title: string;
  description: string;
  value: string;
  tone?: ProposalToneDto;
};
type ProposalStatDto = { label: string; value: string };

type ProposalListItemDto = {
  id: string;
  title: string;
  meta: string;
  stage: ProposalStageDto;
  summaryPill: string;
  summary: string;
  stageData: ProposalStageDatumDto[];
  stats: ProposalStatDto[];
  proposer: string;
  proposerId: string;
  chamber: string;
  tier: "Nominee" | "Ecclesiast" | "Legate" | "Consul" | "Citizen";
  proofFocus: "pot" | "pod" | "pog";
  tags: string[];
  keywords: string[];
  date: string;
  votes: number;
  activityScore: number;
  ctaPrimary: string;
  ctaSecondary: string;
};

type GetProposalsResponse = { items: ProposalListItemDto[] };
```

### Proposal pages

These endpoints map 1:1 to the current stage pages in the UI.

#### `GET /api/proposals/:id/pool`

```ts
type InvisionInsightDto = { role: string; bullets: string[] };

type PoolProposalPageDto = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  focus: string;
  tier: string;
  budget: string;
  cooldown: string;
  formationEligible: boolean;
  teamSlots: string;
  milestones: string;
  upvotes: number;
  downvotes: number;
  attentionQuorum: number; // e.g. 0.22
  activeGovernors: number; // era baseline
  upvoteFloor: number;
  rules: string[];
  attachments: { id: string; title: string }[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  invisionInsight: InvisionInsightDto;
};
```

#### `GET /api/proposals/:id/chamber`

```ts
type ChamberProposalPageDto = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  budget: string;
  formationEligible: boolean;
  teamSlots: string;
  milestones: string;
  timeLeft: string;
  votes: { yes: number; no: number; abstain: number };
  attentionQuorum: number;
  passingRule: string;
  engagedGovernors: number;
  activeGovernors: number;
  attachments: { id: string; title: string }[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  invisionInsight: InvisionInsightDto;
};
```

#### `GET /api/proposals/:id/formation`

```ts
type FormationProposalPageDto = {
  title: string;
  chamber: string;
  proposer: string;
  proposerId: string;
  budget: string;
  timeLeft: string;
  teamSlots: string;
  milestones: string;
  progress: string;
  stageData: { title: string; description: string; value: string }[];
  stats: { label: string; value: string }[];
  lockedTeam: { name: string; role: string }[];
  openSlots: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  attachments: { id: string; title: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  invisionInsight: InvisionInsightDto;
};
```

#### `GET /api/proposals/:id/timeline`

Returns the event-backed “what happened” timeline for a proposal.

```ts
type ProposalTimelineEventTypeDto =
  | "proposal.submitted"
  | "proposal.stage.advanced"
  | "pool.vote"
  | "chamber.vote"
  | "formation.join"
  | "formation.milestone.submitted"
  | "formation.milestone.unlockRequested"
  | "chamber.created"
  | "chamber.dissolved";

type ProposalTimelineItemDto = {
  id: string;
  type: ProposalTimelineEventTypeDto;
  title: string;
  detail?: string;
  actor?: string;
  timestamp: string; // ISO
};

type GetProposalTimelineResponse = { items: ProposalTimelineItemDto[] };
```

Notes:

- Optional query string: `?limit=...` (default `100`, max `500`).
- Backed by the append-only `events` table:
  - `events.type = "proposal.timeline.v1"`
  - `events.entityType = "proposal"`
  - `events.entityId = proposalId`

Notes:

- The payload is overlaid with Formation state:
  - `teamSlots`, `milestones`, and `progress` are computed from stored Formation state.
  - joined team members are appended to `lockedTeam` (as short addresses).

#### Command: `court.case.report`

Request:

```ts
type CourtCaseReportCommand = {
  type: "court.case.report";
  payload: { caseId: string };
  idempotencyKey?: string;
};
```

Response:

```ts
type CourtCaseReportResponse = {
  ok: true;
  type: "court.case.report";
  caseId: string;
  reports: number;
  status: "jury" | "live" | "ended";
};
```

Notes:

- If the case ID is unknown, the API returns HTTP `404`.
- Reports are per-user (reporting twice does not increment the count).
- Status can transition **jury → live** once enough reports are collected (v1 threshold).
- Emits a feed event (stage: `courts`).

#### Command: `court.case.verdict`

Request:

```ts
type CourtCaseVerdictCommand = {
  type: "court.case.verdict";
  payload: { caseId: string; verdict: "guilty" | "not_guilty" };
  idempotencyKey?: string;
};
```

Response:

```ts
type CourtCaseVerdictResponse = {
  ok: true;
  type: "court.case.verdict";
  caseId: string;
  verdict: "guilty" | "not_guilty";
  status: "jury" | "live" | "ended";
  totals: { guilty: number; notGuilty: number };
};
```

Notes:

- Verdicts are only allowed when the case is **live** (HTTP `409` otherwise).
- Verdicts are one-per-user (re-voting updates the voter’s verdict).
- Status can transition **live → ended** once enough distinct verdicts are collected (v1 threshold).
- Emits a feed event (stage: `courts`).

### Proposal drafts

#### `GET /api/proposals/drafts`

```ts
type ProposalDraftListItemDto = {
  id: string;
  title: string;
  chamber: string;
  tier: string;
  summary: string;
  updated: string;
};

type GetProposalDraftsResponse = { items: ProposalDraftListItemDto[] };
```

#### `GET /api/proposals/drafts/:id`

```ts
type ProposalDraftDetailDto = {
  title: string;
  proposer: string;
  chamber: string;
  focus: string;
  tier: string;
  budget: string;
  formationEligible: boolean;
  teamSlots: string;
  milestonesPlanned: string;
  summary: string;
  rationale: string;
  budgetScope: string;
  invisionInsight: InvisionInsightDto;
  checklist: string[];
  milestones: string[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  attachments: { title: string; href: string }[];
};
```

### Courts

#### `GET /api/courts`

```ts
type CourtCaseStatusDto = "jury" | "live" | "ended";
type CourtCaseDto = {
  id: string;
  title: string;
  subject: string;
  triggeredBy: string;
  status: CourtCaseStatusDto;
  reports: number;
  juryIds: string[];
  opened: string; // dd/mm/yyyy
};

type GetCourtsResponse = { items: CourtCaseDto[] };
```

#### `GET /api/courts/:id`

```ts
type CourtCaseDetailDto = CourtCaseDto & {
  parties: { role: string; humanId: string; note?: string }[];
  proceedings: { claim: string; evidence: string[]; nextSteps: string[] };
};
```

### Human nodes

#### `GET /api/humans`

```ts
type HumanTierDto = "nominee" | "ecclesiast" | "legate" | "consul" | "citizen";
type HumanNodeDto = {
  id: string;
  name: string;
  role: string;
  chamber: string;
  factionId: string;
  tier: HumanTierDto;
  acm: number;
  mm: number;
  memberSince: string;
  formationCapable?: boolean;
  active: boolean;
  formationProjectIds?: string[];
  tags: string[];
};

type GetHumansResponse = { items: HumanNodeDto[] };
```

#### `GET /api/humans/:id`

Mirrors `db/seed/fixtures/humanNodeProfiles.ts` but remains JSON-safe.

```ts
type ProofKeyDto = "time" | "devotion" | "governance";
type ProofSectionDto = {
  title: string;
  items: { label: string; value: string }[];
};
type HeroStatDto = { label: string; value: string };
type QuickDetailDto = { label: string; value: string };
type GovernanceActionDto = {
  title: string;
  action: string;
  context: string;
  detail: string;
};
type HistoryItemDto = {
  title: string;
  action: string;
  context: string;
  detail: string;
  date: string;
};
type ProjectCardDto = {
  title: string;
  status: string;
  summary: string;
  chips: string[];
};

type HumanNodeProfileDto = {
  id: string;
  name: string;
  governorActive: boolean;
  humanNodeActive: boolean;
  governanceSummary: string;
  heroStats: HeroStatDto[];
  quickDetails: QuickDetailDto[];
  proofSections: Record<ProofKeyDto, ProofSectionDto>;
  governanceActions: GovernanceActionDto[];
  projects: ProjectCardDto[];
  activity: HistoryItemDto[];
  history: string[];
};
```

### Feed

#### `GET /api/feed?cursor=...&stage=...`

```ts
type FeedStageDto = "pool" | "vote" | "build" | "courts" | "thread" | "faction";
type FeedToneDto = "ok" | "warn";

type FeedStageDatumDto = {
  title: string;
  description: string;
  value: string;
  tone?: FeedToneDto;
};

type FeedStatDto = { label: string; value: string };

type FeedItemDto = {
  id: string;
  title: string;
  meta: string;
  stage: FeedStageDto;
  summaryPill: string;
  summary: string; // plain text or Markdown
  stageData?: FeedStageDatumDto[];
  stats?: FeedStatDto[];
  proposer?: string;
  proposerId?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  href?: string;
  timestamp: string;
};

type GetFeedResponse = { items: FeedItemDto[]; nextCursor?: string };
```
