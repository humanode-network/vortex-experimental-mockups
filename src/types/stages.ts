export const proposalStages = [
  "draft",
  "pool",
  "vote",
  "build",
  "final",
  "archived",
] as const;

export type ProposalStage = (typeof proposalStages)[number];

export const feedStages = [
  "pool",
  "vote",
  "build",
  "thread",
  "courts",
  "faction",
] as const;

export type FeedStage = (typeof feedStages)[number];

export type Stage = ProposalStage | FeedStage;

export type StageChipKind =
  | "proposal_pool"
  | "chamber_vote"
  | "formation"
  | "thread"
  | "courts"
  | "faction"
  | "draft"
  | "final"
  | "archived";

export const stageToChipKind = {
  draft: "draft",
  pool: "proposal_pool",
  vote: "chamber_vote",
  build: "formation",
  final: "final",
  archived: "archived",
  thread: "thread",
  courts: "courts",
  faction: "faction",
} as const satisfies Record<Stage, StageChipKind>;

export const stageLabel = {
  draft: "Draft",
  pool: "Proposal pool",
  vote: "Chamber vote",
  build: "Formation",
  final: "Final vote",
  archived: "Archived",
  thread: "Thread",
  courts: "Courts",
  faction: "Faction",
} as const satisfies Record<Stage, string>;

export const proposalStageToChipKind: Record<ProposalStage, StageChipKind> =
  stageToChipKind;

export const feedStageToChipKind: Record<FeedStage, StageChipKind> =
  stageToChipKind;

export const proposalStageLabel: Record<ProposalStage, string> = stageLabel;

export const feedStageLabel: Record<FeedStage, string> = stageLabel;

export function stageChipKindForStage(stage: Stage) {
  return stageToChipKind[stage];
}

export function stageLabelForStage(stage: Stage) {
  return stageLabel[stage];
}

export function stageChipKindForProposalStage(stage: ProposalStage) {
  return stageChipKindForStage(stage);
}

export function stageChipKindForFeedStage(stage: FeedStage) {
  return stageChipKindForStage(stage);
}
