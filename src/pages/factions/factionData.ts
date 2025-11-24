export type Faction = {
  id: string;
  name: string;
  description: string;
  members: number;
  votes: string;
  acm: string;
  focus: string;
  goals: string[];
  initiatives: string[];
};

export const factions: Faction[] = [
  {
    id: "protocol-keepers",
    name: "Protocol Keepers",
    description:
      "Pushes for harder liveness guarantees and validator neutrality.",
    members: 61,
    votes: "28",
    acm: "6,850",
    focus: "Core protocol",
    goals: [
      "Guarantee validator neutrality and reduce reliance on trusted relays.",
      "Tighten liveness guarantees for sequencers and biometric checkpoints.",
    ],
    initiatives: [
      "Sequencer redundancy rollout",
      "Validator neutrality charter",
      "Cross-shard liveness probes",
    ],
  },
  {
    id: "formation-guild",
    name: "Formation Guild",
    description:
      "Wants Formation to own more budget and streamline squad approvals.",
    members: 54,
    votes: "21",
    acm: "5,120",
    focus: "Execution & delivery",
    goals: [
      "Delegate more discretionary budget to guild leads.",
      "Shorten the path from proposal to active squad.",
    ],
    initiatives: [
      "Guild ops stack rollout",
      "Squad fast-track pilot",
      "Formation mentorship lane",
    ],
  },
  {
    id: "mesh-vanguard",
    name: "Mesh Vanguard",
    description: "Advocates anonymous identities and stronger mesh privacy.",
    members: 48,
    votes: "19",
    acm: "4,930",
    focus: "Reliability & ops",
    goals: [
      "Enable anonymous identities inside the mesh without sacrificing quorum.",
      "Harden telemetry privacy and reduce metadata leakage.",
    ],
    initiatives: [
      "Mesh privacy enhancements",
      "Anonymous identity pilot",
      "Telemetry minimisation program",
    ],
  },
  {
    id: "treasury-collective",
    name: "Treasury Collective",
    description:
      "Advocates changing fee structures and treasury distributions.",
    members: 37,
    votes: "14",
    acm: "4,110",
    focus: "Economics",
    goals: [
      "Rebalance civic vs ops disbursements.",
      "Align incentives with participation thresholds.",
    ],
    initiatives: [
      "Fee split recalibration",
      "Treasury transparency dashboard",
      "Participation-weighted rewards",
    ],
  },
  {
    id: "guardian-circle",
    name: "Guardian Circle",
    description:
      "Expands mentorship and onboarding safety nets for new governors.",
    members: 29,
    votes: "9",
    acm: "3,220",
    focus: "Mentorship",
    goals: [
      "Reduce churn in new governor cohorts.",
      "Provide safe escalation paths for governance disputes.",
    ],
    initiatives: [
      "Mentorship cohorts",
      "Guardian hotline",
      "Onboarding playbooks",
    ],
  },
  {
    id: "research-lab",
    name: "Research Lab",
    description:
      "Explores deterrence models and privacy-first biometrics research.",
    members: 33,
    votes: "12",
    acm: "3,780",
    focus: "Research",
    goals: [
      "Advance deterrence simulations for hostile scenarios.",
      "Prototype privacy-preserving biometric circuits.",
    ],
    initiatives: [
      "Deterrence sim lab",
      "Privacy circuit sprint",
      "Threat model atlas",
    ],
  },
];
