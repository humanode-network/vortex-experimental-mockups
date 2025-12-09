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
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
      {
        label: "App",
        url: "/vortexopedia/vortex",
      },
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
    related: [
      "governor",
      "delegator",
      "proof_of_time_pot",
      "proof_of_human_existence",
      "tier1_nominee",
    ],
    examples: [
      "In the app you can treat “human node” as the base identity type; every governor profile is a specialized human node.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0/basis-of-vortex",
      },
    ],
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
    examples: [
      "Only cognitocrats can vote on matters of their specialization.",
    ],
    stages: ["global", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
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
    examples: [
      "Governors progress tiers via PoT/PoD merit rather than popularity.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 5,
    id: "local_determinism",
    name: "Local determinism",
    category: "governance",
    short:
      "Rejects ideology; values solutions that work efficiently regardless of political spectrum.",
    long: [
      "Denies ideology as a means for power; focuses on field-specific, workable solutions.",
      "As long as a solution works efficiently, its ideological alignment is irrelevant.",
    ],
    tags: ["principle", "governance", "pragmatism"],
    related: ["cognitocracy", "meritocracy"],
    examples: [
      "Chambers choose the most efficient fix, not an ideologically pure one.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 6,
    id: "constant_deterrence",
    name: "Constant deterrence",
    category: "governance",
    short:
      "Active, transparent guarding against centralization; emphasizes direct participation and active quorum.",
    long: [
      "Governors must actively seek and mitigate centralization threats and avoid excessive delegation.",
      "Requires transparent state visibility and active quorum: only active governors counted.",
    ],
    tags: ["principle", "governance", "deterrence", "decentralization"],
    related: ["active_quorum", "delegation", "cognitocracy"],
    examples: [
      "Governors monitor system state and vote directly to deter collusion.",
    ],
    stages: ["global", "chamber", "pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
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
    examples: [
      "Validators are individual humans; governance aims to reflect that base.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 8,
    id: "vortex_structure",
    name: "Vortex structure",
    category: "governance",
    short:
      "Three-part stack: proposal pools and voting chambers (legislative), Formation (executive).",
    long: [
      "Vortex consists of proposal pools and voting chambers in the legislative branch, and Formation in the executive branch.",
    ],
    tags: ["structure", "governance", "legislative", "executive"],
    related: ["proposal_pools", "voting_chambers", "formation"],
    examples: ["Proposal pools filter; chambers vote; Formation executes."],
    stages: ["pool", "chamber", "formation"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Structure",
    updated: "2025-12-04",
  },
  {
    ref: 9,
    id: "governor",
    name: "Governor (cognitocrat)",
    category: "governance",
    short:
      "Human node that meets governing requirements and participates in voting; reverts to non-governing if requirements lapse.",
    long: [
      "A human node who participates in voting procedures according to governing requirements.",
      "If requirements are not met, protocol converts them back to a non-governing human node automatically.",
    ],
    tags: ["role", "governor", "voting"],
    related: ["human_node", "delegator", "cognitocracy"],
    examples: ["Governor status is lost if era action thresholds are not met."],
    stages: ["chamber", "pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0/basis-of-vortex",
      },
    ],
    source: "Basis of Vortex – Roles",
    updated: "2025-12-04",
  },
  {
    ref: 10,
    id: "delegator",
    name: "Delegator",
    category: "governance",
    short: "Governor who delegates voting power to another governor.",
    long: [
      "A governor who decides to delegate their voting power to another governor.",
    ],
    tags: ["role", "delegation", "governor"],
    related: ["governor", "delegation"],
    examples: [
      "Governors may delegate votes in chamber stage but not in proposal pools.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0/basis-of-vortex",
      },
    ],
    source: "Basis of Vortex – Roles",
    updated: "2025-12-04",
  },
  {
    ref: 11,
    id: "proposal_pools",
    name: "Proposal pools",
    category: "governance",
    short:
      "Legislative attention filter where proposals gather support before chamber voting.",
    long: [
      "Part of the legislative branch; proposals enter pools to gather attention before advancing to chambers.",
    ],
    tags: ["pool", "governance", "attention"],
    related: ["vortex_structure", "voting_chambers", "formation"],
    examples: [
      "Proposals must clear attention thresholds in pools to reach chambers.",
    ],
    stages: ["pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Structure",
    updated: "2025-12-04",
  },
  {
    ref: 12,
    id: "formation",
    name: "Formation",
    category: "formation",
    short:
      "Executive branch for executing approved proposals, managing milestones, budget, and teams.",
    long: [
      "Formation belongs to the executive branch and handles execution of approved proposals.",
      "Covers milestones, budget usage, and team assembly.",
    ],
    tags: ["formation", "executive", "milestones", "budget", "team"],
    related: ["vortex_structure", "proposal_pools", "voting_chambers"],
    examples: [
      "An approved chamber proposal becomes a Formation project for delivery.",
    ],
    stages: ["formation"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Structure",
    updated: "2025-12-04",
  },
  {
    ref: 13,
    id: "technocracy",
    name: "Technocracy",
    category: "governance",
    short:
      "Decision-makers selected by technological knowledge; cognitocracy inherits innovation focus but rejects plutocratic traits.",
    long: [
      "Centers decision-making on technological expertise and innovation.",
      "Criticized for elitism via capital control; cognitocracy keeps innovation focus but discards plutocratic concentration.",
    ],
    tags: ["principle", "governance", "technology", "innovation"],
    related: ["cognitocracy", "meritocracy"],
    examples: [
      "Cognitocracy borrows the innovation drive of technocracy without the plutocratic tilt.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 14,
    id: "intellectual_barrier",
    name: "Intellectual barrier for voting rights",
    category: "governance",
    short:
      "Voting rights granted through demonstrated expertise and deployable proposals, not formal diplomas.",
    long: [
      "Introduces on-the-spot proof of expertise via proposals instead of third-party credentials.",
      "Aims to separate power from popularity and formal degrees.",
    ],
    tags: ["principle", "governance", "qualification", "expertise"],
    related: ["cognitocracy", "meritocracy"],
    examples: [
      "Governors earn voting rights by proving deployable innovation in their field.",
    ],
    stages: ["global", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 15,
    id: "direct_democracy",
    name: "Direct democracy",
    category: "governance",
    short:
      "Cognitocrats vote directly on issues without intermediaries to keep decisions aligned with active participants.",
    long: [
      "Relies on direct participation of cognitocrats for decisions.",
      "Keeps power with active governors rather than intermediaries.",
    ],
    tags: ["principle", "governance", "democracy", "delegation"],
    related: ["representative_democracy", "liquid_democracy", "cognitocracy"],
    examples: [
      "Cognitocrats vote directly in chambers to reflect active will.",
    ],
    stages: ["global", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 16,
    id: "representative_democracy",
    name: "Representative democracy",
    category: "governance",
    short:
      "Delegation to representatives for flexibility; in cognitocracy, only cognitocrats may delegate to other cognitocrats.",
    long: [
      "Allows targeted delegation when direct participation is not feasible.",
      "Seeks reduced polarization via issue-specific representation.",
    ],
    tags: ["principle", "governance", "democracy", "delegation"],
    related: [
      "direct_democracy",
      "liquid_democracy",
      "cognitocracy",
      "delegator",
    ],
    examples: ["Cognitocrats may delegate votes per issue to stay responsive."],
    stages: ["global", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 17,
    id: "liquid_democracy",
    name: "Liquid democracy (cognitocracy)",
    category: "governance",
    short:
      "Vote delegation among cognitocrats only, retractable at any time; no elections, voice stays dynamic.",
    long: [
      "Cognitocrats delegate only to other cognitocrats; delegation is retractable.",
      "Reduces polarization by enabling issue-specific support; adapts to changing preferences.",
    ],
    tags: ["principle", "governance", "delegation", "liquid_democracy"],
    related: [
      "direct_democracy",
      "representative_democracy",
      "cognitocracy",
      "delegator",
    ],
    examples: [
      "Delegated votes can be reclaimed at any moment, keeping representation aligned.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Principles",
    updated: "2025-12-04",
  },
  {
    ref: 18,
    id: "specialization_chamber",
    name: "Specialization Chamber (SC)",
    category: "governance",
    short:
      "Chamber for a specific field; only specialists with accepted proposals in that field vote on related matters.",
    long: [
      "Admits governors who proved creative merit in the chamber’s field.",
      "Shards legislation to maintain professionalism and efficiency.",
      "Invariant: 1 governor-cognitocrat = 1 vote.",
    ],
    tags: ["chamber", "specialization", "governance"],
    related: ["general_chamber", "vortex_structure"],
    examples: [
      "Programming chamber admits engineers whose proposals were accepted.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Chambers",
    updated: "2025-12-04",
  },
  {
    ref: 19,
    id: "general_chamber",
    name: "General Chamber (GC)",
    category: "governance",
    short:
      "Chamber comprising all cognitocrats; its rulings supersede SCs and can force admittance of proposals.",
    long: [
      "Includes all cognitocrat-governors regardless of specialization.",
      "Acts on system-wide proposals; can enforce acceptance of proposals declined in SCs.",
      "Harder to reach quorum than SCs.",
    ],
    tags: ["chamber", "general", "governance"],
    related: ["specialization_chamber"],
    examples: [
      "GC can override an SC by accepting a repeatedly declined proposal.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Chambers",
    updated: "2025-12-04",
  },
  {
    ref: 20,
    id: "chamber_inception",
    name: "Chamber inception",
    category: "governance",
    short:
      "Process to create a Specialization Chamber: proposed and voted by existing cognitocrats; initial members nominated; CM approach chosen.",
    long: [
      "Only an established governor-cognitocrat can propose forming an SC.",
      "Initial cognitocrats are nominated; Cognitocratic Measure approach is chosen at creation.",
    ],
    tags: ["process", "chamber", "governance"],
    related: ["specialization_chamber", "cognitocratic_measure"],
    examples: [
      "Formation of a new SC requires a proposal, vote, nominations, and CM setup.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Chambers",
    updated: "2025-12-04",
  },
  {
    ref: 21,
    id: "chamber_dissolution",
    name: "Chamber dissolution",
    category: "governance",
    short:
      "Ending an SC via SC or GC proposal; GC censure excludes targeted SC members from quorum.",
    long: [
      "Can be proposed inside the SC or in the GC.",
      "GC vote of censure excludes members of the targeted SC from quorum and voting.",
      "Penalties are contextual to the dissolution cause.",
    ],
    tags: ["process", "chamber", "governance"],
    related: ["specialization_chamber", "general_chamber"],
    examples: [
      "GC censure dissolves a corrupt SC; targeted members don’t count toward quorum.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Basis of Vortex – Chambers",
    updated: "2025-12-04",
  },
  {
    ref: 22,
    id: "quorum_of_attention",
    name: "Quorum of attention",
    category: "governance",
    short:
      "Proposal-pool quorum: 22% of active governors engaged AND at least 10% upvotes to advance to a chamber.",
    long: [
      "Applied in every proposal pool.",
      "Proposal advances when ≥22% of active governors engage and ≥10% of them upvote.",
      "Delegated votes do NOT count in proposal pools.",
    ],
    tags: ["quorum", "pool", "governance", "attention"],
    related: ["proposal_pools", "quorum_of_vote", "delegation_policy"],
    examples: [
      "A pool item with 24% engagement and 14% upvotes moves to chamber voting.",
    ],
    stages: ["pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 23,
    id: "quorum_of_vote",
    name: "Quorum of vote",
    category: "governance",
    short:
      "Chamber quorum: 33% participation; passing rule 66.6% + 1 yes within the quorum (≈22% of all active governors).",
    long: [
      "Chamber quorum is reached at 33% of active governors voting.",
      "Passing rule: 66.6% + 1 yes within the quorum (≈22% of active governors).",
      "Non-governing human nodes are not counted in quorum.",
      "Pulled-from-pool proposals get one week to be voted in chamber.",
    ],
    tags: ["quorum", "chamber", "governance", "voting"],
    related: ["quorum_of_attention", "delegation_policy", "veto_rights"],
    examples: [
      "A chamber vote with 35% turnout passes if 67% yes within that turnout.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 24,
    id: "delegation_policy",
    name: "Delegation and quorum policy",
    category: "governance",
    short:
      "Counts only active governors for quorum, while allowing non-active cognitocrats to delegate to active ones in the same chamber.",
    long: [
      "Only active governors count toward quorum.",
      "Non-active cognitocrats may delegate to an active cognitocrat in the same chamber.",
      "Balances elitism of active-only voting with broader delegated input.",
    ],
    tags: ["delegation", "quorum", "governance"],
    related: ["quorum_of_vote", "quorum_of_attention", "liquid_democracy"],
    examples: [
      "Non-active members delegate to active ones; delegated votes count in chamber stage, not in pools.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 25,
    id: "veto_rights",
    name: "Veto rights",
    category: "governance",
    short:
      "Temporary, breakable veto held by top-LCM cognitocrats per chamber; 66% + 1 veto sends a proposal back for two weeks (max twice).",
    long: [
      "Veto power is distributed to cognitocrats with highest LCM per chamber.",
      "If 66% + 1 veto, the proposal returns for 2 weeks; can be vetoed twice; third approval cannot be vetoed.",
      "Acts as deterrence against majority mistakes or attacks.",
    ],
    tags: ["veto", "governance", "deterrence", "lcm"],
    related: ["quorum_of_vote", "constant_deterrence"],
    examples: [
      "If vetoed twice, a third approval is final with no further veto allowed.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 26,
    id: "cognitocratic_measure",
    name: "Cognitocratic Measure (CM)",
    category: "governance",
    short:
      "Subjective numeric score received when a proposal is accepted; voters input a score (e.g., 1–10) that averages into CM.",
    long: [
      "Assigned to a cognitocrat when a chamber accepts their proposal.",
      "Voters supply a numeric score; the average becomes the CM for that proposal.",
      "Intended to signal perceived contribution size; does not directly grant mandate power.",
    ],
    tags: ["cm", "score", "contribution", "governance"],
    related: ["cognitocratic_measure_multiplier", "lcm", "mcm", "acm"],
    examples: [
      "A proposal passes with an average score of 8 → proposer receives CM=8.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 27,
    id: "cognitocratic_measure_multiplier",
    name: "Cognitocratic Measure multiplier",
    category: "governance",
    short:
      "Chamber-specific multiplier to normalize CM across specializations; set collectively by cognitocrats outside that chamber.",
    long: [
      "Each chamber has a multiplier to weight CM from that specialization.",
      "Average multiplier is set by all cognitocrats who have not received LCM in that chamber.",
      "Prevents direct comparison of raw CM across differing fields.",
    ],
    tags: ["cm", "multiplier", "chamber", "weighting"],
    related: ["cognitocratic_measure", "lcm", "mcm", "acm"],
    examples: [
      "Philosophy chamber multiplier 3 vs Finance chamber multiplier 5; same CM scales differently.",
    ],
    stages: ["cm"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 28,
    id: "lcm",
    name: "Local Cognitocratic Measure (LCM)",
    category: "governance",
    short:
      "CM accrued within a specific chamber before applying that chamber’s multiplier.",
    long: [
      "Represents contribution within a single chamber.",
      "Used as input to calculate MCM and ACM.",
    ],
    tags: ["cm", "lcm", "chamber"],
    related: ["mcm", "acm", "cognitocratic_measure_multiplier"],
    examples: ["5 LCM in Philosophy and 10 LCM in Finance before weighting."],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 29,
    id: "mcm",
    name: "Multiplied Cognitocratic Measure (MCM)",
    category: "governance",
    short: "LCM multiplied by its chamber’s multiplier.",
    long: [
      "Adjusts LCM by the chamber’s multiplier to reflect specialization value.",
      "Feeds into ACM.",
    ],
    tags: ["cm", "mcm", "chamber", "multiplier"],
    related: ["lcm", "acm", "cognitocratic_measure_multiplier"],
    examples: ["LCM 5 in Philosophy × multiplier 3 = 15 MCM."],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 30,
    id: "acm",
    name: "Absolute Cognitocratic Measure (ACM)",
    category: "governance",
    short:
      "Sum of all MCMs across chambers: ACM = Σ(LCM_chamber × Multiplier_chamber).",
    long: [
      "Aggregates contribution across all chambers after applying multipliers.",
      "Used to compare overall perceived contribution of a cognitocrat.",
    ],
    tags: ["cm", "acm", "aggregate", "governance"],
    related: ["lcm", "mcm", "cognitocratic_measure_multiplier"],
    examples: ["(3 LCM in Philosophy ×3) + (10 LCM in Finance ×5) = 65 ACM."],
    stages: ["cm", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 31,
    id: "multiplier_setting",
    name: "Multiplier setting process",
    category: "governance",
    short:
      "Cognitocrats set a 1–100 multiplier for chambers where they have no LCM; the average becomes the chamber multiplier.",
    long: [
      "Each cognitocrat can vote a multiplier (1–100) for chambers in which they hold no LCM.",
      "Average of submissions becomes the chamber’s multiplier.",
      "If a cognitocrat holds LCM in multiple chambers, they are locked out from setting multipliers in those chambers.",
    ],
    tags: ["process", "cm", "multiplier", "chamber"],
    related: ["cognitocratic_measure_multiplier", "lcm", "acm"],
    examples: [
      "A cognitocrat without LCM in Finance submits 70; combined with others sets the chamber multiplier.",
    ],
    stages: ["cm"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 32,
    id: "meritocratic_measure",
    name: "Meritocratic Measure (MM)",
    category: "formation",
    short:
      "Score awarded for participation and delivery in Formation projects; governors rate milestones and contributors.",
    long: [
      "Earned through contribution to Formation project milestones.",
      "Rated by governors when milestones are delivered.",
      "Signals execution merit separate from chamber governance CM.",
    ],
    tags: ["mm", "formation", "merit", "milestones", "rating"],
    related: ["formation", "formation_project", "cognitocratic_measure"],
    examples: [
      "A contributor receives MM based on governor ratings after a milestone delivery.",
    ],
    stages: ["formation"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Formation – Meritocratic Measure",
    updated: "2025-12-04",
  },
  {
    ref: 33,
    id: "proposition_rights",
    name: "Proposition rights",
    category: "governance",
    short:
      "Tier-based rights to make/promote proposals; tiers derive from PoT, PoD, PoG and do not change voting power.",
    long: [
      "Tiers are based on Proof-of-Time, Proof-of-Devotion, and Proof-of-Governance.",
      "Higher tiers unlock additional proposal types but do not add voting power.",
    ],
    tags: ["proposals", "tiers", "rights", "governance"],
    related: [
      "proof_of_time_pot",
      "proof_of_devotion_pod",
      "proof_of_governance_pog",
      "tier1_nominee",
      "tier2_ecclesiast",
      "tier3_legate",
      "tier4_consul",
      "tier5_citizen",
    ],
    examples: [
      "Tier progression unlocks proposal types without changing vote weight.",
    ],
    stages: ["chamber", "pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights",
    updated: "2025-12-04",
  },
  {
    ref: 34,
    id: "governing_era",
    name: "Governing era",
    category: "governance",
    short:
      "168-epoch (~1 month) period; a governor stays active by running a node 164/168 epochs and meeting action thresholds.",
    long: [
      "Era = 168 epochs; each epoch is ~4 hours.",
      "Active if bioauthenticated and node ran 164/168 epochs and required actions met in previous era.",
      "Required actions include voting/upvoting/downvoting proposals or chamber votes.",
    ],
    tags: ["era", "quorum", "activity", "governance"],
    related: ["governor", "proof_of_governance_pog"],
    examples: [
      "Passing era action threshold keeps a governor counted in quorums next era.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights",
    updated: "2025-12-04",
  },
  {
    ref: 35,
    id: "proof_of_time_pot",
    name: "Proof-of-Time (PoT)",
    category: "governance",
    short:
      "Longevity of being a human node and a governor; contributes to tier progression.",
    long: [
      "Tracks how long a human node and governor have been active.",
      "Used for tier progression and proposal rights.",
    ],
    tags: ["proof", "time", "longevity", "tier"],
    related: ["proof_of_devotion_pod", "proof_of_governance_pog"],
    examples: ["Longer node/governor uptime supports higher tiers."],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Proof types",
    updated: "2025-12-04",
  },
  {
    ref: 36,
    id: "proof_of_devotion_pod",
    name: "Proof-of-Devotion (PoD)",
    category: "governance",
    short:
      "Contribution via proposal approval in Vortex and participation in Formation projects.",
    long: [
      "Counts accepted proposals in Vortex.",
      "Counts participation in Formation projects.",
    ],
    tags: ["proof", "devotion", "proposals", "formation", "tier"],
    related: ["proof_of_time_pot", "proof_of_governance_pog"],
    examples: ["Accepted proposal + Formation participation advance PoD."],
    stages: ["global", "formation"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Proof types",
    updated: "2025-12-04",
  },
  {
    ref: 37,
    id: "proof_of_governance_pog",
    name: "Proof-of-Governance (PoG)",
    category: "governance",
    short:
      "Measures active governing streak and era actions to stay counted in quorums.",
    long: [
      "Longevity of being an active governor.",
      "Maintaining active governing status through required actions.",
    ],
    tags: ["proof", "governance", "quorum", "tier"],
    related: ["proof_of_time_pot", "proof_of_devotion_pod", "governing_era"],
    examples: [
      "Complete era action thresholds to retain active governor status.",
    ],
    stages: ["global", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Proof types",
    updated: "2025-12-04",
  },
  {
    ref: 38,
    id: "tier1_nominee",
    name: "Tier 1 · Nominee",
    category: "governance",
    short:
      "Entry tier: human node seeking voting rights; can join Formation and propose most items except restricted categories.",
    long: [
      "Requirements: Run a node.",
      "New actions: Make any proposal excluding fee distribution, monetary system, core infrastructure, administrative, DAO core; participate in Formation; start earning longevity as governor.",
    ],
    tags: ["tier", "nominee", "governance"],
    related: ["proof_of_time_pot", "proof_of_devotion_pod"],
    examples: [
      "Nominee can propose general items and join Formation but has no vote yet.",
    ],
    stages: ["pool", "formation"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Tiers",
    updated: "2025-12-04",
  },
  {
    ref: 39,
    id: "tier2_ecclesiast",
    name: "Tier 2 · Ecclesiast",
    category: "governance",
    short:
      "Unlocked when a nominee’s proposal is accepted; enables fee distribution and monetary modification proposals.",
    long: [
      "Requirements: Run a node; have a proposal accepted in Vortex.",
      "New available proposal types: Fee distribution; Monetary modification.",
    ],
    tags: ["tier", "ecclesiast", "governance"],
    related: ["proof_of_time_pot", "proof_of_devotion_pod"],
    examples: [
      "Ecclesiast can propose fee splits or monetary changes after first accepted proposal.",
    ],
    stages: ["chamber", "pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Tiers",
    updated: "2025-12-04",
  },
  {
    ref: 40,
    id: "tier3_legate",
    name: "Tier 3 · Legate",
    category: "governance",
    short:
      "Requires 1 year node + active governor, accepted proposal, and Formation participation; unlocks core infrastructure changes.",
    long: [
      "Requirements: Run a node for 1 year; be an active governor for 1 year; have a proposal accepted; participate in Formation.",
      "New available proposal types: Core infrastructure changes (e.g., cryptobiometrics, CVM control, delegation mechanics).",
    ],
    tags: ["tier", "legate", "governance"],
    related: [
      "proof_of_time_pot",
      "proof_of_devotion_pod",
      "proof_of_governance_pog",
    ],
    examples: [
      "Legate can propose core infrastructure changes after sustained activity and Formation work.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Tiers",
    updated: "2025-12-04",
  },
  {
    ref: 41,
    id: "tier4_consul",
    name: "Tier 4 · Consul",
    category: "governance",
    short:
      "Requires 2 years node + active governor, accepted proposal, Formation participation; unlocks administrative proposals.",
    long: [
      "Requirements: Run a node for 2 years; be an active governor for 2 years; have a proposal accepted; participate in Formation.",
      "New available proposal types: Administrative (e.g., human node types, governor tiers, Formation procedures).",
    ],
    tags: ["tier", "consul", "governance"],
    related: [
      "proof_of_time_pot",
      "proof_of_devotion_pod",
      "proof_of_governance_pog",
    ],
    examples: [
      "Consul can propose administrative changes after 2-year tenure and Formation work.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Tiers",
    updated: "2025-12-04",
  },
  {
    ref: 42,
    id: "tier5_citizen",
    name: "Tier 5 · Citizen",
    category: "governance",
    short:
      "Highest tier with unrestricted proposition rights (DAO core); requires long tenure and active governance.",
    long: [
      "Requirements: Run a node for 4 years; be a governor for 4 years; be an active governor for 3 years; have a proposal accepted; participate in Formation.",
      "New available proposal types: DAO core (e.g., proposal system values, voting protocol, human node/governor types).",
    ],
    tags: ["tier", "citizen", "governance"],
    related: [
      "proof_of_time_pot",
      "proof_of_devotion_pod",
      "proof_of_governance_pog",
    ],
    examples: [
      "Citizen tier can propose DAO core changes after long-term tenure and activity.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights – Tiers",
    updated: "2025-12-04",
  },
  {
    ref: 43,
    id: "gradual_decentralization",
    name: "Gradual decentralization",
    category: "governance",
    short:
      "Humanode core bootstraps Vortex/Formation while aiming for transparent, decentralized governance driven by active governors.",
    long: [
      "Core promotes transparency, builds decentralized governing processes, participates in community, and drafts proposals.",
      "Governance stack combines proposal pools, chambers, and Formation with PoT/PoD/PoH safeguards.",
    ],
    tags: ["decentralization", "governance", "transparency"],
    related: ["voter_apathy"],
    examples: [
      "Core designs the stack but expects governors to drive decisions as decentralization grows.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Discussion",
    updated: "2025-12-04",
  },
  {
    ref: 44,
    id: "voter_apathy",
    name: "Voter apathy",
    category: "governance",
    short:
      "Low participation can stall governance; Vortex requires activity to stay a governor and counts only active governors toward quorum.",
    long: [
      "Voter apathy can block quorums and delay decisions.",
      "Governors must meet monthly action thresholds or revert to non-governing.",
      "Quorum (33%) counts only active governors; non-participants are excluded.",
    ],
    tags: ["apathy", "quorum", "governance"],
    related: ["gradual_decentralization", "quorum_of_vote"],
    examples: [
      "Inactivity drops governor status; only active participants count toward quorum.",
    ],
    stages: ["chamber", "pool"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Discussion",
    updated: "2025-12-04",
  },
  {
    ref: 45,
    id: "iron_law_of_oligarchy",
    name: "Iron law of oligarchy",
    category: "governance",
    short:
      "Any organization tends toward elite control; Vortex counters via equal vote power, intellectual barriers, and delegation transparency.",
    long: [
      "Acknowledges inevitability of leadership classes; seeks balance between efficiency and democratic involvement.",
      "Combines equal voting power, intellectual barriers, and active quorum/delegation to limit oligarchic capture.",
    ],
    tags: ["oligarchy", "governance", "deterrence"],
    related: ["plutocracy_risk", "cognitocratic_populism"],
    examples: [
      "Equal votes plus tiers/intellectual barriers aim to temper oligarchic drift.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Discussion",
    updated: "2025-12-04",
  },
  {
    ref: 46,
    id: "plutocracy_risk",
    name: "Plutocracy risk",
    category: "governance",
    short:
      "Risk of capital holders influencing decisions; mitigated by no elections, equal vote power, and proposal merit barriers.",
    long: [
      "No elections or variable vote weights; all governors have equal vote power.",
      "Proposals must be accepted on merit, reducing impact of pure capital/media influence.",
    ],
    tags: ["plutocracy", "governance", "risk"],
    related: ["iron_law_of_oligarchy"],
    examples: [
      "Capital alone cannot buy vote weight; proposals need specialist acceptance.",
    ],
    stages: ["global", "chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Discussion",
    updated: "2025-12-04",
  },
  {
    ref: 47,
    id: "cognitocratic_populism",
    name: "Cognitocratic populism",
    category: "governance",
    short:
      "Populist influence is dampened by specialist voting and proof barriers; liquid delegation still allows crowd support.",
    long: [
      "Specialist-only voting and proposal acceptance reduce mass populist sway.",
      "Delegation remains liquid, so popular governors can accumulate delegations.",
    ],
    tags: ["populism", "governance", "delegation"],
    related: ["proof_of_devotion_pod"],
    examples: [
      "Populists must appeal to cognitocrats, not the mass public, to gain delegations.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Discussion",
    updated: "2025-12-04",
  },
  {
    ref: 48,
    id: "cognitocratic_drain",
    name: "Cognitocratic drain",
    category: "governance",
    short:
      "Chamber stagnation where innovation slows, risking lowered admission barriers, impractical proposals, or cartelization.",
    long: [
      "Too much implemented innovation can raise barriers to new creative proposals.",
      "Risks: lowered standards, non-practical proposals, or chamber cartelization.",
      "Mitigation: dissolve or merge chambers if innovation throughput drops.",
    ],
    tags: ["drain", "chamber", "innovation", "governance"],
    related: ["specialization_chamber", "chamber_dissolution"],
    examples: [
      "Merge or dissolve an SC if it stagnates and lowers its admission quality.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Discussion",
    updated: "2025-12-04",
  },
  {
    ref: 49,
    id: "chamber_vote",
    name: "Chamber vote",
    category: "governance",
    short:
      "Stage where governors cast binding votes on proposals that cleared proposal pools; requires quorum and passing threshold.",
    long: [
      "Proposals reaching attention quorum in a proposal pool advance to a chamber vote.",
      "Chamber voting counts delegations and requires a voting quorum (e.g., 33% of active governors).",
      "Passing typically needs ≥66.6% + 1 yes vote within quorum.",
    ],
    tags: ["vote", "chamber", "quorum", "governance"],
    related: [
      "proposal_pools",
      "quorum_of_vote",
      "quorum_of_attention",
      "delegation_policy",
    ],
    examples: [
      "A proposal that met pool attention quorum proceeds to chamber vote; if 66.6% + 1 yes within quorum, it passes.",
    ],
    stages: ["chamber"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Voting, Delegation and Quorum",
    updated: "2025-12-04",
  },
  {
    ref: 50,
    id: "governing_threshold",
    name: "Governing threshold",
    category: "governance",
    short:
      "Action quota and uptime requirement per era to remain an active governor counted in quorums.",
    long: [
      "A governor is active if bioauthenticated, node ran 164/168 epochs, and required actions were met in the previous era.",
      "Required actions per era include upvoting/downvoting proposals or voting on chamber proposals in Vortex.",
      "Meeting the threshold keeps the governor eligible to be counted in quorums for the upcoming era.",
    ],
    tags: ["threshold", "quorum", "activity", "governor"],
    related: [
      "governing_era",
      "governor",
      "quorum_of_vote",
      "quorum_of_attention",
    ],
    examples: [
      "If the action threshold is met and uptime is 164/168 epochs, the governor is counted as active in the next era’s quorum.",
    ],
    stages: ["global"],
    links: [
      {
        label: "Docs",
        url: "https://gitbook.humanode.io/vortex-1.0",
      },
    ],
    source: "Proposition rights",
    updated: "2025-12-04",
  },
];
