export type ChamberQuorumInputs = {
  quorumFraction: number; // fraction, e.g. 0.33
  activeGovernors: number; // denominator
  passingFraction: number; // fraction, e.g. 2/3
  minQuorum?: number; // absolute minimum engaged governors (optional)
};

export type ChamberCounts = { yes: number; no: number; abstain: number };

export type ChamberQuorumResult = {
  engaged: number;
  quorumNeeded: number;
  quorumMet: boolean;
  yesFraction: number;
  passMet: boolean;
  shouldAdvance: boolean;
};

export function evaluateChamberQuorum(
  inputs: ChamberQuorumInputs,
  counts: ChamberCounts,
): ChamberQuorumResult {
  const active = Math.max(0, Math.floor(inputs.activeGovernors));
  const quorumFraction = Math.max(0, Math.min(1, inputs.quorumFraction));
  const passingFraction = Math.max(0, Math.min(1, inputs.passingFraction));
  const minQuorum = Math.min(
    active,
    Math.max(0, Math.floor(inputs.minQuorum ?? 0)),
  );

  const yes = Math.max(0, counts.yes);
  const no = Math.max(0, counts.no);
  const abstain = Math.max(0, counts.abstain);
  const engaged = yes + no + abstain;

  const quorumNeeded =
    active > 0 ? Math.max(minQuorum, Math.ceil(active * quorumFraction)) : 0;
  const quorumMet = active > 0 ? engaged >= quorumNeeded : false;

  const yesFraction = engaged > 0 ? yes / engaged : 0;
  // Passing rule: strict supermajority (e.g. 66.6% + 1 yes vote within quorum).
  // In discrete votes this means: yes > passingFraction * engaged.
  const passNeeded =
    engaged > 0 ? Math.floor(engaged * passingFraction) + 1 : 0;
  const passMet = engaged > 0 ? yes >= passNeeded : false;

  return {
    engaged,
    quorumNeeded,
    quorumMet,
    yesFraction,
    passMet,
    shouldAdvance: quorumMet && passMet,
  };
}
