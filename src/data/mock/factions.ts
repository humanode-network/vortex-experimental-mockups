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
  roster: {
    humanNodeId: string;
    role: string;
    tag:
      | { kind: "acm"; value: number }
      | { kind: "mm"; value: number }
      | { kind: "text"; value: string };
  }[];
};

export const factions: Faction[] = [
  {
    id: "protocol-keepers",
    name: "Protocol Keepers",
    description:
      "Pushes for harder liveness guarantees and validator neutrality.",
    members: 24,
    votes: "24",
    acm: "1,800",
    focus: "Core protocol",
    goals: [
      "Guarantee validator neutrality and reduce reliance on trusted relays.",
      "Tighten liveness guarantees for sequencers and biometric checkpoints.",
    ],
    initiatives: [
      "Humanode EVM Dev Starter Kit & Testing Sandbox",
      "Validator neutrality charter",
      "Cross-shard liveness probes",
    ],
    roster: [
      {
        humanNodeId: "shahmeer",
        role: "Core protocol",
        tag: { kind: "acm", value: 184 },
      },
      {
        humanNodeId: "dato",
        role: "Reliability & ops",
        tag: { kind: "mm", value: 88 },
      },
      {
        humanNodeId: "andrei",
        role: "Infra & telemetry",
        tag: { kind: "text", value: "Votes 52" },
      },
    ],
  },
  {
    id: "formation-guild",
    name: "Formation Guild",
    description:
      "Wants Formation to own more budget and streamline squad approvals.",
    members: 18,
    votes: "18",
    acm: "1,500",
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
    roster: [
      {
        humanNodeId: "shannon",
        role: "Execution lead",
        tag: { kind: "acm", value: 173 },
      },
      {
        humanNodeId: "ekko",
        role: "Delivery ops",
        tag: { kind: "mm", value: 75 },
      },
      {
        humanNodeId: "petr",
        role: "Budget ops",
        tag: { kind: "text", value: "Votes 41" },
      },
    ],
  },
  {
    id: "mesh-vanguard",
    name: "Mesh Vanguard",
    description: "Advocates anonymous identities and stronger mesh privacy.",
    members: 16,
    votes: "16",
    acm: "1,400",
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
    roster: [
      {
        humanNodeId: "andrei",
        role: "Reliability",
        tag: { kind: "acm", value: 170 },
      },
      {
        humanNodeId: "dato",
        role: "Ops & incident drills",
        tag: { kind: "mm", value: 88 },
      },
      {
        humanNodeId: "sesh",
        role: "Security & hardening",
        tag: { kind: "text", value: "Votes 64" },
      },
    ],
  },
  {
    id: "treasury-collective",
    name: "Treasury Collective",
    description:
      "Advocates changing fee structures and treasury distributions.",
    members: 15,
    votes: "15",
    acm: "1,300",
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
    roster: [
      {
        humanNodeId: "fares",
        role: "Budget modeling",
        tag: { kind: "acm", value: 163 },
      },
      {
        humanNodeId: "petr",
        role: "Reporting cadence",
        tag: { kind: "mm", value: 77 },
      },
      {
        humanNodeId: "victor",
        role: "Policy liaison",
        tag: { kind: "text", value: "Votes 33" },
      },
    ],
  },
  {
    id: "guardian-circle",
    name: "Guardian Circle",
    description:
      "Expands mentorship and onboarding safety nets for new governors.",
    members: 12,
    votes: "12",
    acm: "900",
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
    roster: [
      {
        humanNodeId: "fiona",
        role: "Onboarding",
        tag: { kind: "acm", value: 148 },
      },
      {
        humanNodeId: "tony",
        role: "Community ops",
        tag: { kind: "text", value: "Votes 28" },
      },
      {
        humanNodeId: "temo",
        role: "UX & docs",
        tag: { kind: "mm", value: 66 },
      },
    ],
  },
  {
    id: "research-lab",
    name: "Research Lab",
    description:
      "Explores deterrence models and privacy-first biometrics research.",
    members: 15,
    votes: "15",
    acm: "1,100",
    focus: "Research",
    goals: [
      "Advance deterrence simulations for hostile scenarios.",
      "Prototype privacy-preserving biometric circuits.",
    ],
    initiatives: [
      "Commitment staking slashing conditions review",
      "Privacy circuit sprint",
      "Threat model atlas",
    ],
    roster: [
      {
        humanNodeId: "victor",
        role: "Legal research",
        tag: { kind: "acm", value: 160 },
      },
      {
        humanNodeId: "silis",
        role: "Risk analysis",
        tag: { kind: "mm", value: 81 },
      },
      {
        humanNodeId: "sesh",
        role: "Threat modeling",
        tag: { kind: "text", value: "Votes 47" },
      },
    ],
  },
];
