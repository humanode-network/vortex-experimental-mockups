# Vortex Simulation Backend — API Contract v1 (Phase 1)

This document freezes the **JSON contracts** the backend must serve so the current mock-driven UI can migrate to API reads with minimal churn.

Notes:

- These are **DTOs** (network-safe JSON), not React UI models.
- Anywhere the UI currently uses `ReactNode` in `src/data/mock/*`, the API will return **strings** (plain text or Markdown) and the UI will render them.
- This contract is defined now, but most read endpoints are not implemented yet. In Phase 2c/4 we will initially serve these DTOs from the `read_models` table seeded by `scripts/db-seed.ts`.

## Conventions

- IDs are stable slugs (e.g. `engineering`, `evm-dev-starter-kit`, `dato`).
- Timestamps are ISO strings.
- List endpoints return `{ items: [...] }` and may add cursors later.

## Auth + gating

Already implemented in `functions/api/*`:

- `GET /api/health` → `{ ok: true, service: string, time: string }`
- `POST /api/auth/nonce` → `{ address }` → `{ nonce }` (+ `vortex_nonce` cookie)
- `POST /api/auth/verify` → `{ address, nonce, signature }` (+ `vortex_session` cookie)
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/gate/status`

Eligibility (v1):

- The backend checks Humanode mainnet RPC and considers an address eligible if it is **active in `im_online`**.

## Read endpoints (to implement next)

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

Mirrors `src/data/mock/humanNodeProfiles.ts` but remains JSON-safe.

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
type FeedStageDto = "pool" | "vote" | "build" | "courts" | "thread";
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
