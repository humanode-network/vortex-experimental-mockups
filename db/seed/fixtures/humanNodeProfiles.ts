import type { HumanNode } from "./humanNodes.ts";
import { humanNodes } from "./humanNodes.ts";
import {
  formationStageLabel,
  getFormationProjectById,
  type FormationProject,
} from "./formation.ts";
import { getFactionById } from "./factions.ts";

export type ProofKey = "time" | "devotion" | "governance";

export type ProofSection = {
  title: string;
  items: { label: string; value: string }[];
};

export type GovernanceAction = {
  title: string;
  action: string;
  context: string;
  detail: string;
};

export type HistoryItem = {
  title: string;
  action: string;
  context: string;
  detail: string;
  date: string;
};

export type ProjectCard = {
  title: string;
  status: string;
  summary: string;
  chips: string[];
};

export type HeroStat = { label: string; value: string };

export type QuickDetail =
  | { label: "Tier"; value: string }
  | { label: string; value: string };

export type HumanNodeProfile = {
  id: string;
  name: string;
  governorActive: boolean;
  humanNodeActive: boolean;
  governanceSummary: string;
  heroStats: HeroStat[];
  quickDetails: QuickDetail[];
  proofSections: Record<ProofKey, ProofSection>;
  governanceActions: GovernanceAction[];
  projects: ProjectCard[];
  activity: HistoryItem[];
  history: string[];
};

export const proofToggleOptions: { key: ProofKey; label: string }[] = [
  { key: "time", label: "PoT" },
  { key: "devotion", label: "PoD" },
  { key: "governance", label: "PoG" },
];

const titleCaseTier = (tier: HumanNode["tier"]): string =>
  tier.charAt(0).toUpperCase() + tier.slice(1);

const nodeById = (id: string): HumanNode | undefined =>
  humanNodes.find((node) => node.id === id);

const defaultGovernanceActions: GovernanceAction[] = [
  {
    title: "EVM Dev Starter Kit",
    action: "Reviewed scope",
    context: "Engineering chamber",
    detail: "Left notes on SDK ergonomics and sandbox onboarding flow.",
  },
  {
    title: "Commitment staking",
    action: "Casted vote",
    context: "General chamber",
    detail: "Suggested UX framing for voluntary vs mandatory stake.",
  },
  {
    title: "Chamber policy refresh",
    action: "Commented",
    context: "General chamber",
    detail: "Proposed a short checklist for proposal compliance and clarity.",
  },
  {
    title: "Formation milestone sync",
    action: "Joined call",
    context: "Formation",
    detail: "Reviewed deliverables and helped unblock milestone planning.",
  },
  {
    title: "Spam mitigation debate",
    action: "Published note",
    context: "Economics chamber",
    detail: "Summarized trade-offs of fixed stakes vs voluntary commitments.",
  },
  {
    title: "Governance onboarding",
    action: "Hosted session",
    context: "Marketing",
    detail: "Walked new governors through pools, chambers, and Formation.",
  },
];

const defaultActivity: HistoryItem[] = [
  {
    title: "EVM Dev Starter Kit",
    action: "Reviewed scope",
    context: "Engineering chamber",
    detail: "Left notes on SDK ergonomics and sandbox onboarding flow.",
    date: "Epoch 214",
  },
  {
    title: "Commitment staking",
    action: "Casted vote",
    context: "General chamber",
    detail: "Suggested UX framing for voluntary vs mandatory stake.",
    date: "Epoch 209",
  },
  {
    title: "Chamber policy refresh",
    action: "Commented",
    context: "General chamber",
    detail: "Proposed a short checklist for proposal compliance and clarity.",
    date: "Epoch 205",
  },
  {
    title: "Spam mitigation debate",
    action: "Published note",
    context: "Economics chamber",
    detail: "Summarized trade-offs of fixed stakes vs voluntary commitments.",
    date: "Epoch 202",
  },
  {
    title: "Governance onboarding",
    action: "Hosted session",
    context: "Marketing",
    detail: "Walked new governors through pools, chambers, and Formation.",
    date: "Epoch 198",
  },
];

const projectToCard = (project: FormationProject): ProjectCard => ({
  title: project.title,
  status: `${project.focus} · ${formationStageLabel(project.stage)}`,
  summary: project.summary,
  chips: [
    `Budget: ${project.budget}`,
    `Milestones: ${project.milestones}`,
    `Team slots: ${project.teamSlots}`,
  ],
});

const getProjectsForNode = (node: HumanNode | undefined): ProjectCard[] =>
  (node?.formationProjectIds ?? [])
    .map((projectId) => getFormationProjectById(projectId))
    .filter((project): project is FormationProject => Boolean(project))
    .map(projectToCard);

const createProfile = (input: {
  id: string;
  invisionScore: number;
  delegationShare: string;
  proposalsCreated: string;
  governanceSummary: string;
  proofSections: Record<ProofKey, ProofSection>;
  history?: string[];
  activity?: HistoryItem[];
}): HumanNodeProfile => {
  const node = nodeById(input.id);
  const name = node?.name ?? input.id;
  const acm = node?.acm ?? 0;
  const mm = node?.mm ?? 0;
  const tier = node?.tier ?? "nominee";
  const memberSince = node?.memberSince ?? "—";
  const active = node?.active ?? true;
  const factionName =
    (node?.factionId ? getFactionById(node.factionId)?.name : undefined) ?? "—";
  const projects = getProjectsForNode(node);

  return {
    id: input.id,
    name,
    governorActive: active,
    humanNodeActive: active,
    governanceSummary: input.governanceSummary,
    heroStats: [
      { label: "ACM", value: acm.toString() },
      { label: "MM", value: mm.toString() },
      { label: "Invision score", value: `${input.invisionScore} / 100` },
      { label: "Member since", value: memberSince },
    ],
    quickDetails: [
      { label: "Tier", value: titleCaseTier(tier) },
      { label: "Faction", value: factionName },
      { label: "Delegation share", value: input.delegationShare },
      { label: "Proposals created", value: input.proposalsCreated },
    ],
    proofSections: input.proofSections,
    governanceActions: defaultGovernanceActions,
    projects,
    activity: input.activity ?? defaultActivity,
    history:
      input.history ??
      (input.activity ?? defaultActivity)
        .slice(0, 3)
        .map((item) => `${item.date} · ${item.action} ${item.title}`),
  };
};

export const humanNodeProfilesById: Record<string, HumanNodeProfile> = {
  dato: createProfile({
    id: "dato",
    invisionScore: 78,
    delegationShare: "2.4%",
    proposalsCreated: "7",
    governanceSummary:
      "Operator-minded governor focused on protocol readiness, observability, and keeping milestone execution predictable across chambers.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "3 Y · 3 M" },
          { label: "Governor for", value: "2 Y · 7 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "2 Y · 4 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
    history: [
      "Epoch 214 · Reviewed EVM sandbox milestone scope",
      "Epoch 209 · Voted on commitment staking proposal",
      "Epoch 205 · Hosted governance onboarding session",
    ],
  }),
  victor: createProfile({
    id: "victor",
    invisionScore: 81,
    delegationShare: "1.9%",
    proposalsCreated: "5",
    governanceSummary:
      "Legal-focused governor translating protocol changes into clear rules, summaries, and policies that chambers can enforce consistently.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "2 Y · 10 M" },
          { label: "Governor for", value: "2 Y · 1 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "No" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "1 Y · 9 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  temo: createProfile({
    id: "temo",
    invisionScore: 69,
    delegationShare: "0.4%",
    proposalsCreated: "0",
    governanceSummary:
      "Early-stage governor with a product/UX lens, focused on making proposals and chambers easier to scan and understand.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "0 Y · 9 M" },
          { label: "Governor for", value: "0 Y · 6 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "No" },
          { label: "Participated in formation?", value: "No" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "0 Y · 5 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  dima: createProfile({
    id: "dima",
    invisionScore: 65,
    delegationShare: "0.6%",
    proposalsCreated: "1",
    governanceSummary:
      "Security apprentice governor contributing audits, incident playbooks, and review notes for high-risk proposals.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "2 Y · 7 M" },
          { label: "Governor for", value: "1 Y · 2 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "No" },
          { label: "Participated in formation?", value: "No" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "1 Y · 0 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  tony: createProfile({
    id: "tony",
    invisionScore: 71,
    delegationShare: "0.8%",
    proposalsCreated: "2",
    governanceSummary:
      "Community-facing governor focused on onboarding, comms clarity, and getting more humans from reading to voting.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "3 Y · 1 M" },
          { label: "Governor for", value: "1 Y · 6 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "0 Y · 10 M" },
          { label: "Active governor?", value: "No" },
        ],
      },
    },
  }),
  sesh: createProfile({
    id: "sesh",
    invisionScore: 90,
    delegationShare: "3.1%",
    proposalsCreated: "9",
    governanceSummary:
      "Security council lead with a bias for hardening: threat models, incident response, and ruthless clarity in proposal scope.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "4 Y · 6 M" },
          { label: "Governor for", value: "3 Y · 2 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "3 Y · 0 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  petr: createProfile({
    id: "petr",
    invisionScore: 76,
    delegationShare: "1.1%",
    proposalsCreated: "4",
    governanceSummary:
      "Treasury operations governor focused on budget readability, reporting cadence, and keeping Formation tranches accountable.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "1 Y · 9 M" },
          { label: "Governor for", value: "1 Y · 2 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "0 Y · 9 M" },
          { label: "Active governor?", value: "No" },
        ],
      },
    },
  }),
  shannon: createProfile({
    id: "shannon",
    invisionScore: 88,
    delegationShare: "2.2%",
    proposalsCreated: "6",
    governanceSummary:
      "Formation logistics consul keeping squads aligned, milestones realistic, and the execution layer moving without drama.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "0 Y · 11 M" },
          { label: "Governor for", value: "0 Y · 11 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "0 Y · 10 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  shahmeer: createProfile({
    id: "shahmeer",
    invisionScore: 94,
    delegationShare: "3.8%",
    proposalsCreated: "12",
    governanceSummary:
      "Protocol steward with long-range perspective, focused on stability, upgrades, and keeping Vortex rules legible as the network scales.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "4 Y · 2 M" },
          { label: "Governor for", value: "3 Y · 6 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "3 Y · 2 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  fiona: createProfile({
    id: "fiona",
    invisionScore: 79,
    delegationShare: "1.4%",
    proposalsCreated: "3",
    governanceSummary:
      "Community builder pushing clear guides, better onboarding, and practical rituals that keep governors active across eras.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "2 Y · 4 M" },
          { label: "Governor for", value: "1 Y · 8 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "1 Y · 6 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  silis: createProfile({
    id: "silis",
    invisionScore: 80,
    delegationShare: "1.0%",
    proposalsCreated: "4",
    governanceSummary:
      "Legal ops legate focused on risk framing, clear proposal requirements, and reducing ambiguity that causes chamber churn.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "2 Y · 5 M" },
          { label: "Governor for", value: "1 Y · 11 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "No" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "0 Y · 10 M" },
          { label: "Active governor?", value: "No" },
        ],
      },
    },
  }),
  ekko: createProfile({
    id: "ekko",
    invisionScore: 75,
    delegationShare: "0.9%",
    proposalsCreated: "2",
    governanceSummary:
      "Formation coordinator keeping projects on track and translating chamber decisions into clean milestone checklists.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "2 Y · 11 M" },
          { label: "Governor for", value: "1 Y · 5 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "1 Y · 1 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  andrei: createProfile({
    id: "andrei",
    invisionScore: 86,
    delegationShare: "2.7%",
    proposalsCreated: "8",
    governanceSummary:
      "Infra-first consul focused on monitoring, reliability, and turning protocol goals into measurable operating standards.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "3 Y · 7 M" },
          { label: "Governor for", value: "2 Y · 5 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "2 Y · 2 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
  fares: createProfile({
    id: "fares",
    invisionScore: 84,
    delegationShare: "2.0%",
    proposalsCreated: "6",
    governanceSummary:
      "Economics legate focused on budgets, incentives, and keeping proposal asks aligned with measurable outcomes.",
    proofSections: {
      time: {
        title: "Proof-of-Time",
        items: [
          { label: "Human node for", value: "3 Y · 9 M" },
          { label: "Governor for", value: "2 Y · 0 M" },
        ],
      },
      devotion: {
        title: "Proof-of-Devotion",
        items: [
          { label: "Proposal accepted?", value: "Yes" },
          { label: "Participated in formation?", value: "Yes" },
        ],
      },
      governance: {
        title: "Proof-of-Governance",
        items: [
          { label: "Actively governed", value: "1 Y · 10 M" },
          { label: "Active governor?", value: "Yes" },
        ],
      },
    },
  }),
};

export const myProfileId = "dato";
export const myProfile = humanNodeProfilesById[myProfileId];

export const getHumanNodeProfile = (id: string | undefined): HumanNodeProfile =>
  (id ? humanNodeProfilesById[id] : undefined) ?? myProfile;
