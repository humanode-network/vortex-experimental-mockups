export type PoolQuorumInputs = {
  attentionQuorum: number; // fraction, e.g. 0.2
  activeGovernors: number; // denominator
  upvoteFloor: number; // absolute number of upvotes required
};

export type PoolCounts = { upvotes: number; downvotes: number };

export type PoolQuorumResult = {
  engaged: number;
  engagedNeeded: number;
  attentionMet: boolean;
  upvoteMet: boolean;
  shouldAdvance: boolean;
};

export function evaluatePoolQuorum(
  inputs: PoolQuorumInputs,
  counts: PoolCounts,
): PoolQuorumResult {
  const active = Math.max(0, Math.floor(inputs.activeGovernors));
  const engaged = Math.max(0, counts.upvotes) + Math.max(0, counts.downvotes);
  const quorum = Math.max(0, Math.min(1, inputs.attentionQuorum));

  const engagedNeeded = active > 0 ? Math.ceil(active * quorum) : 0;
  const attentionMet = active > 0 ? engaged >= engagedNeeded : false;
  const upvoteMet =
    Math.max(0, counts.upvotes) >= Math.max(0, inputs.upvoteFloor);

  return {
    engaged,
    engagedNeeded,
    attentionMet,
    upvoteMet,
    shouldAdvance: attentionMet && upvoteMet,
  };
}
