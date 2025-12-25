export type ProposalStage = "upcoming" | "live" | "ended";

export type ChamberProposal = {
  id: string;
  title: string;
  meta: string;
  summary: string;
  lead: string;
  nextStep: string;
  timing: string;
  stage: ProposalStage;
};

export type Governor = {
  id: string;
  name: string;
  tier: string;
  focus: string;
};

export type Thread = {
  id: string;
  title: string;
  author: string;
  replies: number;
  updated: string;
};

export type ChatMessage = {
  id: string;
  author: string;
  message: string;
};

export const proposalStageOptions: { value: ProposalStage; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "ended", label: "Ended" },
];

export const chamberProposals: ChamberProposal[] = [
  {
    id: "evm-dev-starter-kit",
    title: "Humanode EVM Dev Starter Kit & Testing Sandbox",
    meta: "Legate · Engineering chamber",
    summary:
      "Starter kit + sandbox so developers can deploy EVM dApps on Humanode in under 30 minutes.",
    lead: "Sesh",
    nextStep: "Formation · Milestone 1 in progress",
    timing: "Live · Week 3/12",
    stage: "live",
  },
  {
    id: "voluntary-commitment-staking",
    title: "Voluntary Governor Commitment Staking",
    meta: "Legate · General chamber",
    summary:
      "Optional commitment staking + opt-in self-slashing without changing governance access or voting power.",
    lead: "Victor",
    nextStep: "Chamber vote",
    timing: "Live · 3d 12h",
    stage: "live",
  },
];

export const chamberGovernors: Governor[] = [
  { id: "shahmeer", name: "Shahmeer", tier: "Citizen", focus: "Engineering" },
  { id: "dato", name: "Dato", tier: "Consul", focus: "Infra" },
  { id: "andrei", name: "Andrei", tier: "Consul", focus: "Observability" },
  { id: "victor", name: "Victor", tier: "Legate", focus: "Policy" },
  { id: "fares", name: "Fares", tier: "Legate", focus: "Economics" },
  { id: "sesh", name: "Sesh", tier: "Legate", focus: "Security" },
];

export const chamberThreads: Thread[] = [
  {
    id: "thread-1",
    title: "EVM Dev Starter Kit — scope & milestone review",
    author: "Sesh",
    replies: 7,
    updated: "1h ago",
  },
  {
    id: "thread-2",
    title: "Commitment staking — UX + slashing conditions",
    author: "Victor",
    replies: 12,
    updated: "3h ago",
  },
];

export const chamberChatLog: ChatMessage[] = [
  {
    id: "chat-1",
    author: "Sesh",
    message: "SDK API surface draft is ready — looking for review on naming.",
  },
  {
    id: "chat-2",
    author: "Victor",
    message: "Added notes on voluntary vs mandatory stake framing for the UI.",
  },
  {
    id: "chat-3",
    author: "Sesh",
    message:
      "Sandbox + faucet flow: what’s the simplest onboarding UX we want?",
  },
];

export default chamberProposals;
