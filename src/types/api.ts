// API DTO types for the off-chain Vortex simulation backend.
// These are JSON-safe (no ReactNode), and are frozen by docs/simulation/vortex-simulation-api-contract.md.

import type { FeedStage } from "./stages";

export type ProposalStageDto = "draft" | "pool" | "vote" | "build";
export type FeedStageDto = FeedStage;

export type ToneDto = "ok" | "warn";

export type ChamberPipelineDto = { pool: number; vote: number; build: number };
export type ChamberStatsDto = {
  governors: string;
  acm: string;
  mcm: string;
  lcm: string;
};
export type ChamberDto = {
  id: string;
  name: string;
  multiplier: number;
  stats: ChamberStatsDto;
  pipeline: ChamberPipelineDto;
};
export type GetChambersResponse = { items: ChamberDto[] };

export type FactionRosterTagDto =
  | { kind: "acm"; value: number }
  | { kind: "mm"; value: number }
  | { kind: "text"; value: string };
export type FactionRosterMemberDto = {
  humanNodeId: string;
  role: string;
  tag: FactionRosterTagDto;
};
export type FactionDto = {
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
export type GetFactionsResponse = { items: FactionDto[] };

export type ChamberProposalStageDto = "upcoming" | "live" | "ended";
export type ChamberProposalDto = {
  id: string;
  title: string;
  meta: string;
  summary: string;
  lead: string;
  nextStep: string;
  timing: string;
  stage: ChamberProposalStageDto;
};
export type ChamberGovernorDto = {
  id: string;
  name: string;
  tier: string;
  focus: string;
};
export type ChamberThreadDto = {
  id: string;
  title: string;
  author: string;
  replies: number;
  updated: string;
};
export type ChamberChatMessageDto = {
  id: string;
  author: string;
  message: string;
};
export type ChamberStageOptionDto = {
  value: ChamberProposalStageDto;
  label: string;
};
export type GetChamberResponse = {
  proposals: ChamberProposalDto[];
  governors: ChamberGovernorDto[];
  threads: ChamberThreadDto[];
  chatLog: ChamberChatMessageDto[];
  stageOptions: ChamberStageOptionDto[];
};

export type FormationMetricDto = {
  label: string;
  value: string;
  dataAttr: string;
};
export type FormationCategoryDto =
  | "all"
  | "research"
  | "development"
  | "social";
export type FormationStageDto = "live" | "gathering" | "completed";
export type FormationProjectDto = {
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
export type GetFormationResponse = {
  metrics: FormationMetricDto[];
  projects: FormationProjectDto[];
};

export type InvisionGovernanceMetricDto = { label: string; value: string };
export type InvisionGovernanceStateDto = {
  label: string;
  metrics: InvisionGovernanceMetricDto[];
};
export type InvisionEconomicIndicatorDto = {
  label: string;
  value: string;
  detail: string;
};
export type InvisionRiskSignalDto = {
  title: string;
  status: string;
  detail: string;
};
export type InvisionChamberProposalDto = {
  title: string;
  effect: string;
  sponsors: string;
};
export type GetInvisionResponse = {
  governanceState: InvisionGovernanceStateDto;
  economicIndicators: InvisionEconomicIndicatorDto[];
  riskSignals: InvisionRiskSignalDto[];
  chamberProposals: InvisionChamberProposalDto[];
};

export type MyGovernanceEraActionDto = {
  label: string;
  done: number;
  required: number;
};
export type MyGovernanceEraActivityDto = {
  era: string;
  required: number;
  completed: number;
  actions: MyGovernanceEraActionDto[];
  timeLeft: string;
};
export type GetMyGovernanceResponse = {
  eraActivity: MyGovernanceEraActivityDto;
  myChamberIds: string[];
  rollup?: {
    era: number;
    rolledAt: string;
    status: "Ahead" | "Stable" | "Falling behind" | "At risk" | "Losing status";
    requiredTotal: number;
    completedTotal: number;
    isActiveNextEra: boolean;
    activeGovernorsNextEra: number;
  };
};

export type GetClockResponse = {
  currentEra: number;
  activeGovernors: number;
  currentEraRollup?: {
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
};

export type ProposalStageDatumDto = {
  title: string;
  description: string;
  value: string;
  tone?: ToneDto;
};
export type ProposalStatDto = { label: string; value: string };
export type ProposalListItemDto = {
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
export type GetProposalsResponse = { items: ProposalListItemDto[] };

export type InvisionInsightDto = { role: string; bullets: string[] };

export type ProposalTimelineEventTypeDto =
  | "proposal.submitted"
  | "proposal.stage.advanced"
  | "proposal.vote.passed"
  | "proposal.vote.finalized"
  | "pool.vote"
  | "chamber.vote"
  | "veto.vote"
  | "veto.applied"
  | "formation.join"
  | "formation.milestone.submitted"
  | "formation.milestone.unlockRequested"
  | "chamber.created"
  | "chamber.dissolved";

export type ProposalTimelineItemDto = {
  id: string;
  type: ProposalTimelineEventTypeDto;
  title: string;
  detail?: string;
  actor?: string;
  timestamp: string;
};

export type GetProposalTimelineResponse = { items: ProposalTimelineItemDto[] };

export type ProposalDraftListItemDto = {
  id: string;
  title: string;
  chamber: string;
  tier: string;
  summary: string;
  updated: string;
};
export type GetProposalDraftsResponse = { items: ProposalDraftListItemDto[] };

export type ProposalDraftDetailDto = {
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

export type PoolProposalPageDto = {
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
  attentionQuorum: number;
  activeGovernors: number;
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

export type ChamberProposalPageDto = {
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

export type FormationProposalPageDto = {
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

export type CourtCaseStatusDto = "jury" | "live" | "ended";
export type CourtCaseDto = {
  id: string;
  title: string;
  subject: string;
  triggeredBy: string;
  status: CourtCaseStatusDto;
  reports: number;
  juryIds: string[];
  opened: string;
};
export type CourtCaseDetailDto = CourtCaseDto & {
  parties: { role: string; humanId: string; note?: string }[];
  proceedings: { claim: string; evidence: string[]; nextSteps: string[] };
};
export type GetCourtsResponse = { items: CourtCaseDto[] };

export type HumanTierDto =
  | "nominee"
  | "ecclesiast"
  | "legate"
  | "consul"
  | "citizen";
export type HumanNodeDto = {
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
export type GetHumansResponse = { items: HumanNodeDto[] };

export type ProofKeyDto = "time" | "devotion" | "governance";
export type ProofSectionDto = {
  title: string;
  items: { label: string; value: string }[];
};
export type HeroStatDto = { label: string; value: string };
export type QuickDetailDto = { label: string; value: string };
export type GovernanceActionDto = {
  title: string;
  action: string;
  context: string;
  detail: string;
};
export type HistoryItemDto = {
  title: string;
  action: string;
  context: string;
  detail: string;
  date: string;
};
export type ProjectCardDto = {
  title: string;
  status: string;
  summary: string;
  chips: string[];
};
export type HumanNodeProfileDto = {
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

export type FeedStageDatumDto = {
  title: string;
  description: string;
  value: string;
  tone?: ToneDto;
};
export type FeedStatDto = { label: string; value: string };
export type FeedItemDto = {
  id: string;
  title: string;
  meta: string;
  stage: FeedStageDto;
  summaryPill: string;
  summary: string;
  stageData?: FeedStageDatumDto[];
  stats?: FeedStatDto[];
  proposer?: string;
  proposerId?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  href?: string;
  timestamp: string;
};
export type GetFeedResponse = { items: FeedItemDto[]; nextCursor?: string };
