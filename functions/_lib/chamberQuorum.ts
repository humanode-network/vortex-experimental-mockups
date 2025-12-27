export type ChamberQuorumInputs = {
  quorumFraction: number; // fraction, e.g. 0.33
  activeGovernors: number; // denominator
  passingFraction: number; // fraction, e.g. 2/3
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

  const yes = Math.max(0, counts.yes);
  const no = Math.max(0, counts.no);
  const abstain = Math.max(0, counts.abstain);
  const engaged = yes + no + abstain;

  const quorumNeeded = active > 0 ? Math.ceil(active * quorumFraction) : 0;
  const quorumMet = active > 0 ? engaged >= quorumNeeded : false;

  const yesFraction = engaged > 0 ? yes / engaged : 0;
  const passMet =
    engaged > 0 ? yesFraction >= passingFraction && yes >= 1 : false;

  return {
    engaged,
    quorumNeeded,
    quorumMet,
    yesFraction,
    passMet,
    shouldAdvance: quorumMet && passMet,
  };
}
