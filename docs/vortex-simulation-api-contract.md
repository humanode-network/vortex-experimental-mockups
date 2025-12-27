# Vortex Simulation Backend — API Contract v1

This document freezes the **JSON contracts** the backend serves so the UI can render from `/api/*` responses consistently.

Notes:

- These are **DTOs** (network-safe JSON), not React UI models.
- All DTOs are JSON-safe (no `ReactNode`, no `Date`, no functions).
- Read endpoints are served in two modes:
  - DB mode: reads from Postgres `read_models` (seeded by `scripts/db-seed.ts`).
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

- The backend checks Humanode mainnet RPC and considers an address eligible if it is “active” per `ImOnline::*` (with a safe fallback to `Session::Validators` in v1).

## Write endpoints (Phase 6+)

### `POST /api/command`

All state-changing operations are routed through a single command endpoint. Each command requires:

- a valid session cookie (`vortex_session`)
- eligibility (active human node via RPC gating), unless dev bypass is enabled

Idempotency:

- Clients may pass an `Idempotency-Key` (or `idempotency-key`) header.
- If the same key is sent again with the same request body, the stored response is returned.
- If the same key is re-used with a different request body, the API returns HTTP `409`.

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
- `score` is optional and only allowed when `choice === "yes"` (HTTP `400` otherwise). This is the v1 CM input.
- The chamber page read endpoint overlays live vote totals from stored votes (so `votes` and `engagedGovernors` update immediately).
- When quorum + passing are met **and** `formationEligible === true`, the backend auto-advances the proposal from **vote → build** by updating the `proposals:list` read model.
  - If `proposals:${proposalId}:formation` does not exist yet, it is created as a minimal placeholder derived from the chamber page payload so the Formation page can render.
- When a proposal passes, CM is awarded off-chain:
  - the average `score` across yes votes is converted into points
  - a CM award record is stored in `cm_awards` (unique per proposal)
  - `/api/humans` and `/api/humans/:id` overlay the derived ACM delta from awards

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

- Unlocking requires a prior submit (HTTP `409` if not submitted).
- Double-unlock is rejected (HTTP `409`).
- This command emits a feed event (stage: `build`).

## Read endpoints

These endpoints are implemented under `functions/api/*` and read from `read_models` (DB mode) or the inline seed (inline mode).

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
};
```

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
  attentionQuorum: number; // e.g. 0.2
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

Notes:

- The read-model payload is overlaid with Formation state:
  - `teamSlots`, `milestones`, and `progress` are computed from stored Formation state.
  - joined team members are appended to `lockedTeam` (as short addresses).

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
