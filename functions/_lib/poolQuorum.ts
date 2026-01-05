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

  // With very small active sets, ceil(active * quorum) can become 1 and cause
  // "single-vote advances"; require at least 2 engaged governors whenever there
  // is more than 1 active governor.
  const minEngaged = active > 1 ? 2 : 1;
  const engagedNeeded =
    active > 0 ? Math.max(minEngaged, Math.ceil(active * quorum)) : 0;
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
