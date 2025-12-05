export type VortexopediaTerm = {
  ref: number;
  id: string;
  name: string;
  category: string;
  short: string;
  long: string[];
  tags: string[];
  related: string[];
  examples: string[];
  stages: string[];
  links: { label: string; url: string }[];
  source: string;
  updated: string;
};

export const vortexopediaTerms: VortexopediaTerm[] = [
  {
    ref: 1,
    id: "vortex",
    name: "Vortex",
    category: "governance",
    short:
      "Main governing body of the Humanode network with cognitocratic egalitarian voting among human validators.",
    long: [
      "Vortex is the on-chain governing body that gradually absorbs the authority of Humanode Core and disperses it among human nodes.",
      "It is designed so that each governor has equal formal voting power, relying on cryptobiometrics to ensure that every governor is a unique living human.",
      "Vortex is implemented as a stack of proposal pools, voting chambers and the Formation executive layer.",
    ],
    tags: ["governance", "dao", "humanode", "vortex"],
    related: [
      "vortex-structure",
      "cognitocracy",
      "proposal-pools",
      "specialization-chamber",
      "general-chamber",
      "formation",
      "governor",
      "human_node",
    ],
    examples: [
      "Changing fee distribution on Humanode via a Vortex proposal voted in the relevant chamber.",
    ],
    stages: ["chamber", "pool", "formation"],
    links: [
      { label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" },
      { label: "App", url: "/vortexopedia/vortex" },
    ],
    source: "gitbook:vortex-1.0:synopsis",
    updated: "2025-12-04",
  },
  {
    ref: 2,
    id: "human_node",
    name: "Human node",
    category: "governance",
    short:
      "A uniquely biometric-verified person who runs a validator node, participates in consensus, and earns fees, but may or may not participate in governance.",
    long: [
      "Defined as a person who has undergone cryptobiometric processing and runs a node in the Humanode network.",
      "Receives network transaction fees as a validator.",
      "Does not necessarily participate in governance (non-governing by default).",
      "Can become a Governor by meeting governance participation requirements.",
    ],
    tags: ["role", "humanode", "validator", "sybil_resistance"],
    related: ["governor", "delegator", "proof_of_time_pot", "proof_of_human_existence", "tier1_nominee"],
    examples: [
      "In the app you can treat “human node” as the base identity type; every governor profile is a specialized human node.",
    ],
    stages: ["global"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0/basis-of-vortex" }],
    source: "Basis of Vortex – Vortex Roles",
    updated: "2025-12-04",
  },
  {
    ref: 3,
    id: "cognitocracy",
    name: "Cognitocracy",
    category: "governance",
    short:
      "Legislative model where only those who can bring constructive, deployable innovation get voting rights (cognitocrats/governors).",
    long: [
      "Grants voting rights only to those who have proven professional, creative merit in a specialization.",
      "Cognitocrat and governor are interchangeable; one cannot be a governor without being a cognitocrat.",
    ],
    tags: ["principle", "governance", "voting_rights", "specialization"],
    related: ["meritocracy", "governor", "human_node", "vortex"],
    examples: ["Only cognitocrats can vote on matters of their specialization."],
    stages: ["global", "chamber"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 4,
    id: "meritocracy",
    name: "Meritocracy",
    category: "governance",
    short:
      "Concentrates power in those with proof of proficiency; Vortex evaluates innovation merit separately from functional work.",
    long: [
      "Aims to concentrate decision-making in hands of those with proven proficiency.",
      "Vortex uses PoT and PoD to emancipate governors from Nominee to Citizen.",
    ],
    tags: ["principle", "governance", "merit"],
    related: ["cognitocracy", "proof_of_time_pot", "proof_of_devotion_pod"],
    examples: ["Governors progress tiers via PoT/PoD merit rather than popularity."],
    stages: ["global"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 5,
    id: "local_determinism",
    name: "Local determinism",
    category: "governance",
    short: "Rejects ideology; values solutions that work efficiently regardless of political spectrum.",
    long: [
      "Denies ideology as a means for power; focuses on field-specific, workable solutions.",
      "As long as a solution works efficiently, its ideological alignment is irrelevant.",
    ],
    tags: ["principle", "governance", "pragmatism"],
    related: ["cognitocracy", "meritocracy"],
    examples: ["Chambers choose the most efficient fix, not an ideologically pure one."],
    stages: ["global"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 6,
    id: "constant_deterrence",
    name: "Constant deterrence",
    category: "governance",
    short: "Active, transparent guarding against centralization; emphasizes direct participation and active quorum.",
    long: [
      "Governors must actively seek and mitigate centralization threats and avoid excessive delegation.",
      "Requires transparent state visibility and active quorum: only active governors counted.",
    ],
    tags: ["principle", "governance", "deterrence", "decentralization"],
    related: ["active_quorum", "delegation", "cognitocracy"],
    examples: ["Governors monitor system state and vote directly to deter collusion."],
    stages: ["global", "chamber", "pool"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 7,
    id: "power_detachment_resilience",
    name: "Power detachment resilience",
    category: "governance",
    short:
      "Minimizes gap between validation power and governance by ensuring one-human-one-node and maximizing validator participation.",
    long: [
      "Addresses power concentration common in capital-based protocols.",
      "Ensures each node is an individual with equal validation power; governors are validators; seeks high validator governance participation.",
    ],
    tags: ["principle", "governance", "decentralization", "equality"],
    related: ["human_node", "governor", "active_quorum"],
    examples: ["Validators are individual humans; governance aims to reflect that base."],
    stages: ["global"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 8,
    id: "vortex_structure",
    name: "Vortex structure",
    category: "governance",
    short: "Three-part stack: proposal pools and voting chambers (legislative), Formation (executive).",
    long: [
      "Vortex consists of proposal pools and voting chambers in the legislative branch, and Formation in the executive branch.",
    ],
    tags: ["structure", "governance", "legislative", "executive"],
    related: ["proposal_pools", "voting_chambers", "formation"],
    examples: ["Proposal pools filter; chambers vote; Formation executes."],
    stages: ["pool", "chamber", "formation"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Structure",
    updated: "2025-12-04",
  },
  {
    ref: 9,
    id: "governor",
    name: "Governor (cognitocrat)",
    category: "governance",
    short: "Human node that meets governing requirements and participates in voting; reverts to non-governing if requirements lapse.",
    long: [
      "A human node who participates in voting procedures according to governing requirements.",
      "If requirements are not met, protocol converts them back to a non-governing human node automatically.",
    ],
    tags: ["role", "governor", "voting"],
    related: ["human_node", "delegator", "cognitocracy"],
    examples: ["Governor status is lost if era action thresholds are not met."],
    stages: ["chamber", "pool"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0/basis-of-vortex" }],
    source: "Basis of Vortex – Roles",
    updated: "2025-12-04",
  },
  {
    ref: 10,
    id: "delegator",
    name: "Delegator",
    category: "governance",
    short: "Governor who delegates voting power to another governor.",
    long: ["A governor who decides to delegate their voting power to another governor."],
    tags: ["role", "delegation", "governor"],
    related: ["governor", "delegation"],
    examples: ["Governors may delegate votes in chamber stage but not in proposal pools."],
    stages: ["chamber"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0/basis-of-vortex" }],
    source: "Basis of Vortex – Roles",
    updated: "2025-12-04",
  },
  {
    ref: 11,
    id: "proposal_pools",
    name: "Proposal pools",
    category: "governance",
    short: "Legislative attention filter where proposals gather support before chamber voting.",
    long: [
      "Part of the legislative branch; proposals enter pools to gather attention before advancing to chambers.",
    ],
    tags: ["pool", "governance", "attention"],
    related: ["vortex_structure", "voting_chambers", "formation"],
    examples: ["Proposals must clear attention thresholds in pools to reach chambers."],
    stages: ["pool"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Structure",
    updated: "2025-12-04",
  },
  {
    ref: 12,
    id: "formation",
    name: "Formation",
    category: "formation",
    short: "Executive branch for executing approved proposals, managing milestones, budget, and teams.",
    long: [
      "Formation belongs to the executive branch and handles execution of approved proposals.",
      "Covers milestones, budget usage, and team assembly.",
    ],
    tags: ["formation", "executive", "milestones", "budget", "team"],
    related: ["vortex_structure", "proposal_pools", "voting_chambers"],
    examples: ["An approved chamber proposal becomes a Formation project for delivery."],
    stages: ["formation"],
    links: [{ label: "Docs", url: "https://gitbook.humanode.io/vortex-1.0" }],
    source: "Basis of Vortex – Structure",
    updated: "2025-12-04",
  },
];
