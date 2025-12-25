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
    id: "delegation-removal-supporters",
    name: "Delegation removal supporters",
    description:
      "End delegation. Direct votes only. No proxy power, no silent capture.",
    members: 19,
    votes: "19",
    acm: "1,420",
    focus: "Governance design",
    goals: [
      "Remove proxy power and enforce direct participation as the default.",
      "Reduce governance capture vectors and make outcomes legible.",
    ],
    initiatives: [
      "Tier Decay v1",
      "Delegation removal v1",
      "Quorum transparency checklist",
    ],
    roster: [
      {
        humanNodeId: "andrei",
        role: "Governance systems",
        tag: { kind: "acm", value: 176 },
      },
      {
        humanNodeId: "petr",
        role: "Policy ops",
        tag: { kind: "mm", value: 74 },
      },
      {
        humanNodeId: "victor",
        role: "Rules & definitions",
        tag: { kind: "text", value: "Votes 46" },
      },
    ],
  },
  {
    id: "validator-subsidies",
    name: "Validator subsidies",
    description:
      "Subsidize validators to improve uptime, geographic spread, and operator diversity.",
    members: 22,
    votes: "22",
    acm: "1,610",
    focus: "Network reliability",
    goals: [
      "Improve uptime and reduce single-region concentration.",
      "Make validator operations sustainable for smaller operators.",
    ],
    initiatives: [
      "Uptime subsidy model v1",
      "Geographic diversity grants",
      "Operator onboarding playbook",
    ],
    roster: [
      {
        humanNodeId: "dato",
        role: "Reliability & ops",
        tag: { kind: "acm", value: 188 },
      },
      {
        humanNodeId: "shannon",
        role: "Operator programs",
        tag: { kind: "mm", value: 82 },
      },
      {
        humanNodeId: "ekko",
        role: "Telemetry & dashboards",
        tag: { kind: "text", value: "Votes 39" },
      },
    ],
  },
  {
    id: "formal-verification-maxis",
    name: "Formal verification maxis",
    description:
      "Specs and proofs before upgrades. Verified safety over “ship now, patch later.”",
    members: 17,
    votes: "17",
    acm: "1,780",
    focus: "Engineering & security",
    goals: [
      "Require clear specs and review before upgrades.",
      "Prefer verified safety over “ship now, patch later.”",
    ],
    initiatives: [
      "Biometric Account Recovery & Key Rotation Pallet",
      "Audit playbook v1",
      "Formal spec templates",
    ],
    roster: [
      {
        humanNodeId: "sesh",
        role: "Security reviews",
        tag: { kind: "acm", value: 194 },
      },
      {
        humanNodeId: "shahmeer",
        role: "Protocol engineering",
        tag: { kind: "mm", value: 91 },
      },
      {
        humanNodeId: "fares",
        role: "Risk modeling",
        tag: { kind: "text", value: "Votes 44" },
      },
    ],
  },
  {
    id: "anti-ai-slop-conglomerate",
    name: "Anti-AI-slop conglomerate",
    description:
      "Enforce a quality bar: human-made outputs, citations, review, and zero spam.",
    members: 14,
    votes: "14",
    acm: "980",
    focus: "Quality & culture",
    goals: [
      "Reduce low-effort spam and improve signal in proposals and threads.",
      "Normalize review, citations, and clear acceptance criteria.",
    ],
    initiatives: [
      "Fixed Governor Stake & Spam Slashing Rule for Vortex",
      "Proposal quality checklist",
      "Review culture sprint",
    ],
    roster: [
      {
        humanNodeId: "silis",
        role: "Quality bar",
        tag: { kind: "acm", value: 152 },
      },
      {
        humanNodeId: "temo",
        role: "UX clarity",
        tag: { kind: "mm", value: 68 },
      },
      {
        humanNodeId: "victor",
        role: "Policy language",
        tag: { kind: "text", value: "Votes 31" },
      },
    ],
  },
  {
    id: "social-media-awareness",
    name: "Social media awareness",
    description:
      "Turn governance into signal: distribution, creators, campaigns, and measurable reach.",
    members: 16,
    votes: "16",
    acm: "1,120",
    focus: "Growth & distribution",
    goals: [
      "Make governance legible to outsiders without dumbing it down.",
      "Run repeatable campaigns and track measurable outcomes.",
    ],
    initiatives: [
      "Vortex Field Experiments: Season 1",
      "Humanode AI Video Series: 3 Viral-Quality Shorts",
      "AI Video Launch & Distribution Sprint",
    ],
    roster: [
      {
        humanNodeId: "tony",
        role: "Community ops",
        tag: { kind: "acm", value: 139 },
      },
      {
        humanNodeId: "dima",
        role: "Campaign execution",
        tag: { kind: "mm", value: 63 },
      },
      {
        humanNodeId: "petr",
        role: "Narrative & copy",
        tag: { kind: "text", value: "Votes 22" },
      },
    ],
  },
  {
    id: "local-voting-adoption-movement",
    name: "Local voting adoption movement",
    description:
      "Run local pilots and onboard communities into on-chain voting with real turnout.",
    members: 20,
    votes: "20",
    acm: "1,260",
    focus: "Adoption",
    goals: [
      "Bootstrap real participation with local pilots and clear onboarding.",
      "Turn “read-only spectators” into active governors over time.",
    ],
    initiatives: [
      "Local pilot playbook v1",
      "Onboarding cohorts",
      "Voluntary Governor Commitment Staking",
    ],
    roster: [
      {
        humanNodeId: "fiona",
        role: "Onboarding",
        tag: { kind: "acm", value: 148 },
      },
      {
        humanNodeId: "victor",
        role: "Local governance policy",
        tag: { kind: "mm", value: 79 },
      },
      {
        humanNodeId: "shannon",
        role: "Field ops",
        tag: { kind: "text", value: "Votes 27" },
      },
    ],
  },
];

export const getFactionById = (id: string | undefined): Faction | undefined =>
  (id ? factions.find((faction) => faction.id === id) : undefined) ?? undefined;
