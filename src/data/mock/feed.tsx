import type { ReactNode } from "react";

import { HintLabel } from "@/components/Hint";
import type { FeedStage } from "@/types/stages";

export type FeedItem = {
  id: string;
  title: string;
  meta: string;
  stage: FeedStage;
  summaryPill: string;
  summary: ReactNode;
  stageData?: {
    title: string;
    description: string;
    value: ReactNode;
    tone?: "ok" | "warn";
  }[];
  stats?: { label: string; value: ReactNode }[];
  proposer?: string;
  proposerId?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  href?: string;
  timestamp: string; // ISO string
};

export const feedItems: FeedItem[] = [
  {
    id: "voluntary-commitment-staking",
    title: "Voluntary Governor Commitment Staking",
    meta: "Governance chamber · Consul tier",
    stage: "vote",
    summaryPill: "No mandatory stake",
    summary:
      "Optional HMND commitment staking with opt-in self-slashing, without changing voting power (1 human = 1 vote).",
    stageData: [
      {
        title: "Voting quorum",
        description: "Strict 33% active governors",
        value: "Met · 35%",
        tone: "ok",
      },
      {
        title: "Passing rule",
        description: "≥66.6% + 1 vote yes",
        value: "Current 86%",
        tone: "ok",
      },
      { title: "Time left", description: "Voting window", value: "3d 12h" },
    ],
    stats: [
      { label: "Budget ask", value: "16k HMND" },
      { label: "Votes casted", value: "52" },
    ],
    proposer: "Mira",
    proposerId: "mira",
    ctaPrimary: "Open proposal",
    ctaSecondary: "Add to agenda",
    href: "/app/proposals/voluntary-commitment-staking/chamber",
    timestamp: "2026-01-06T12:10:00Z",
  },
  {
    id: "evm-dev-starter-kit",
    title: "Humanode EVM Dev Starter Kit & Testing Sandbox",
    meta: "Protocol chamber · Legate tier",
    stage: "build",
    summaryPill: "Milestone 1 / 3",
    summary:
      "EVM dev starter kit + public testing sandbox so developers can deploy dApps on Humanode in under 30 minutes.",
    stageData: [
      {
        title: "Budget allocated",
        description: "HMND",
        value: "18k / 180k",
      },
      {
        title: "Team slots",
        description: "Taken / Total",
        value: "1 / 3",
      },
      {
        title: "Progress",
        description: "Reported completion",
        value: "24%",
      },
    ],
    stats: [
      { label: "Budget ask", value: "180k HMND" },
      { label: "Duration", value: "12 weeks" },
    ],
    proposer: "Jonas",
    proposerId: "jonas",
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
    href: "/app/proposals/evm-dev-starter-kit/formation",
    timestamp: "2026-01-05T09:00:00Z",
  },
  {
    id: "delegation-dispute",
    title: "Courts: Delegation Dispute #44",
    meta: "Courts · Jury · Awaiting statement",
    stage: "courts",
    summaryPill: "Jury",
    summary: "Delegation dispute filed; statement requested before review.",
    stats: [
      { label: "Status", value: "Awaiting statement" },
      { label: "ETA", value: "Review in 1d" },
    ],
    ctaPrimary: "Open appeal",
    ctaSecondary: "Track",
    href: "/app/courts",
    timestamp: "2025-04-02T06:45:00Z",
  },
  {
    id: "protocol-council-thread",
    title: "Protocol Council Thread",
    meta: "Protocol chamber · Thread",
    stage: "thread",
    summaryPill: "Protocol chamber",
    summary: "Incident review for redundant checkpoints · new replies.",
    ctaPrimary: "Open thread",
    ctaSecondary: "Mark read",
    href: "/app/chambers/protocol-engineering",
    timestamp: "2025-03-30T05:10:00Z",
  },
  {
    id: "protocol-keepers-thread",
    title: "Protocol Keepers Thread",
    meta: "Faction · Protocol Keepers",
    stage: "thread",
    summaryPill: "Faction thread",
    summary: "Privacy sprint planning · new replies.",
    ctaPrimary: "Open thread",
    ctaSecondary: "Mark read",
    href: "/app/factions/protocol-keepers",
    timestamp: "2025-03-26T04:00:00Z",
  },
  {
    id: "formation-guild",
    title: "Formation Guild Update",
    meta: "Faction · Formation Guild",
    stage: "faction",
    summaryPill: "Slots open",
    summary: (
      <span>
        Votes: 18 · <HintLabel termId="acm">ACM</HintLabel>: 1,500 · Ops slots
        open for guild initiatives.
      </span>
    ),
    ctaPrimary: "Open faction",
    ctaSecondary: "Follow",
    href: "/app/factions/formation-guild",
    timestamp: "2025-03-20T20:00:00Z",
  },
];

export default feedItems;
