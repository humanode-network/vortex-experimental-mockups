import { evaluateChamberQuorum } from "./chamberQuorum.ts";
import { evaluatePoolQuorum } from "./poolQuorum.ts";
import type { ProposalStage } from "./proposalsStore.ts";
import {
  V1_CHAMBER_PASSING_FRACTION,
  V1_CHAMBER_QUORUM_FRACTION,
  V1_POOL_ATTENTION_QUORUM_FRACTION,
  V1_POOL_UPVOTE_FLOOR_FRACTION,
} from "./v1Constants.ts";

export type ProposalStageTransition = {
  from: ProposalStage;
  to: ProposalStage;
};

export const PROPOSAL_TRANSITIONS: ProposalStageTransition[] = [
  { from: "pool", to: "vote" },
  { from: "vote", to: "build" },
];

export function canTransitionStage(
  from: ProposalStage,
  to: ProposalStage,
): boolean {
  return PROPOSAL_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function computePoolUpvoteFloor(activeGovernors: number): number {
  const active = Math.max(0, Math.floor(activeGovernors));
  return Math.max(1, Math.ceil(active * V1_POOL_UPVOTE_FLOOR_FRACTION));
}

export function shouldAdvancePoolToVote(input: {
  activeGovernors: number;
  counts: { upvotes: number; downvotes: number };
}): boolean {
  const upvoteFloor = computePoolUpvoteFloor(input.activeGovernors);
  const quorum = evaluatePoolQuorum(
    {
      attentionQuorum: V1_POOL_ATTENTION_QUORUM_FRACTION,
      activeGovernors: input.activeGovernors,
      upvoteFloor,
    },
    input.counts,
  );
  return quorum.shouldAdvance;
}

export function shouldAdvanceVoteToBuild(input: {
  activeGovernors: number;
  counts: { yes: number; no: number; abstain: number };
  minQuorum?: number;
}): boolean {
  const result = evaluateChamberQuorum(
    {
      quorumFraction: V1_CHAMBER_QUORUM_FRACTION,
      activeGovernors: input.activeGovernors,
      passingFraction: V1_CHAMBER_PASSING_FRACTION,
      minQuorum: input.minQuorum,
    },
    input.counts,
  );
  return result.shouldAdvance;
}
