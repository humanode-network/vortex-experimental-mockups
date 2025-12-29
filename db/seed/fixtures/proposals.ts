import type { ReactNode } from "react";

import type { ProposalStage } from "@/types/stages";

export type ProposalStageDatum = {
  title: string;
  description: string;
  value: ReactNode;
  tone?: "ok" | "warn";
};

export type ProposalStat = {
  label: string;
  value: ReactNode;
};

export type ProposalListItem = {
  id: string;
  title: string;
  meta: string;
  stage: ProposalStage;
  summaryPill: string;
  summary: string;
  stageData: ProposalStageDatum[];
  stats: ProposalStat[];
  proposer: string;
  proposerId: string;
  chamber: string;
  tier: "Nominee" | "Ecclesiast" | "Legate" | "Consul" | "Citizen";
  proofFocus: "pot" | "pod" | "pog";
  tags: string[];
  keywords: string[];
  date: string;
  votes: number;
  activityScore: number;
  ctaPrimary: string;
  ctaSecondary: string;
};

export const proposals: ProposalListItem[] = [
  {
    id: "humanode-dreamscapes-visual-lore",
    title: "Humanode Dreamscapes: Visual Lore Series",
    meta: "Design chamber · Ecclesiast tier",
    stage: "pool",
    summaryPill: "8–10 artworks · 5 weeks",
    summary:
      "Commission a small series of high-quality surreal artworks that build Humanode/Vortex visual lore (culture fertilizer, not infographics).",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "18 / 6",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 16% engaged",
      },
      { title: "Votes casted", description: "Backing seats", value: "18" },
    ],
    stats: [
      { label: "Budget ask", value: "9k HMND" },
      { label: "Formation", value: "No" },
    ],
    proposer: "Fiona",
    proposerId: "fiona",
    chamber: "Design chamber",
    tier: "Ecclesiast",
    proofFocus: "pod",
    tags: ["Art", "Lore", "Culture"],
    keywords: [
      "dreamscapes",
      "lore",
      "art",
      "culture",
      "visual",
      "identity",
      "vortex",
      "humanode",
    ],
    date: "2026-01-10",
    votes: 24,
    activityScore: 70,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "biometric-account-recovery",
    title: "Biometric Account Recovery & Key Rotation Pallet",
    meta: "Engineering chamber · Citizen tier",
    stage: "pool",
    summaryPill: "8 weeks · audited pallet",
    summary:
      "Substrate pallet to let a verified human rotate keys / recover accounts via biometric identity, with strict rules and an external audit.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "44 / 7",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 34% engaged",
        tone: "ok",
      },
      { title: "Votes casted", description: "Backing seats", value: "44" },
    ],
    stats: [
      { label: "Budget ask", value: "34k HMND" },
      { label: "Formation", value: "Yes" },
    ],
    proposer: "Shahmeer",
    proposerId: "shahmeer",
    chamber: "Engineering chamber",
    tier: "Citizen",
    proofFocus: "pog",
    tags: ["Protocol", "Security", "UX"],
    keywords: [
      "biometric",
      "account",
      "recovery",
      "key",
      "rotation",
      "pallet",
      "substrate",
      "audit",
      "identity",
    ],
    date: "2026-01-08",
    votes: 51,
    activityScore: 93,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "tier-decay-v1",
    title: "Tier Decay v1",
    meta: "General chamber · Consul tier",
    stage: "vote",
    summaryPill: "Chamber vote",
    summary: "Keep high tiers reserved for active governors.",
    stageData: [
      {
        title: "Voting quorum",
        description: "Strict 33% active governors",
        value: "Met · 39%",
        tone: "ok",
      },
      {
        title: "Passing rule",
        description: "≥66.6% + 1 vote yes",
        value: "Current 71%",
        tone: "ok",
      },
      { title: "Time left", description: "Voting window", value: "2d 18h" },
    ],
    stats: [
      { label: "Budget ask", value: "13k HMND" },
      { label: "Formation", value: "Yes" },
    ],
    proposer: "Andrei",
    proposerId: "andrei",
    chamber: "General chamber",
    tier: "Consul",
    proofFocus: "pog",
    tags: ["Governance", "Tiers", "Policy"],
    keywords: [
      "tier",
      "decay",
      "inactive",
      "governor",
      "eras",
      "warnings",
      "rights",
      "vortex-1.0",
    ],
    date: "2026-01-07",
    votes: 58,
    activityScore: 84,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "evm-dev-starter-kit",
    title: "Humanode EVM Dev Starter Kit & Testing Sandbox",
    meta: "Engineering chamber · Legate tier",
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
    proposer: "Sesh",
    proposerId: "sesh",
    chamber: "Engineering chamber",
    tier: "Legate",
    proofFocus: "pod",
    tags: ["Dev tooling", "EVM", "Docs"],
    keywords: [
      "humanode",
      "evm",
      "dev",
      "starter",
      "kit",
      "sandbox",
      "faucet",
      "sdk",
      "template",
      "docs",
    ],
    date: "2026-01-06",
    votes: 35,
    activityScore: 91,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "humanode-ai-video-shorts",
    title: "Humanode AI Video Series: 3 Viral-Quality Shorts",
    meta: "Design chamber · Ecclesiast tier",
    stage: "pool",
    summaryPill: "3 videos · 6 weeks",
    summary:
      "Produce three premium-quality AI-powered short videos (30–90s) explaining Humanode and Vortex for X/TikTok/Shorts, including project files + asset pack.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "22 / 8",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 20% engaged",
        tone: "ok",
      },
      { title: "Votes casted", description: "Backing seats", value: "22" },
    ],
    stats: [
      { label: "Budget ask", value: "15k HMND" },
      { label: "Formation", value: "No" },
    ],
    proposer: "Tony",
    proposerId: "tony",
    chamber: "Design chamber",
    tier: "Ecclesiast",
    proofFocus: "pod",
    tags: ["Video", "Growth", "Design"],
    keywords: [
      "video",
      "ai",
      "shorts",
      "tiktok",
      "x",
      "sound",
      "storyboard",
      "assets",
      "vortex",
      "humanode",
    ],
    date: "2026-01-01",
    votes: 30,
    activityScore: 72,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "ai-video-launch-distribution-sprint",
    title: "AI Video Launch & Distribution Sprint",
    meta: "Marketing chamber · Ecclesiast tier",
    stage: "pool",
    summaryPill: "6 weeks · distribution playbook",
    summary:
      "Run a coordinated 6-week sprint to distribute Humanode AI videos across X/TikTok/Shorts/Telegram, with content kits, experiments, and a reusable launch playbook.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "21 / 7",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 19% engaged",
        tone: "ok",
      },
      { title: "Votes casted", description: "Backing seats", value: "21" },
    ],
    stats: [
      { label: "Budget ask", value: "18k HMND" },
      { label: "Formation", value: "Yes" },
    ],
    proposer: "Petr",
    proposerId: "petr",
    chamber: "Marketing chamber",
    tier: "Ecclesiast",
    proofFocus: "pod",
    tags: ["Growth", "Distribution", "Content ops"],
    keywords: [
      "distribution",
      "shorts",
      "tiktok",
      "x",
      "youtube",
      "telegram",
      "calendar",
      "playbook",
      "funnels",
    ],
    date: "2026-01-02",
    votes: 28,
    activityScore: 73,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "mev-safe-dex-v1-launch-sprint",
    title: "Humanode MEV-Safe DEX v1 + Launch Sprint",
    meta: "Engineering chamber · Consul tier",
    stage: "build",
    summaryPill: "Milestone 2 / 4",
    summary:
      "Ship a Humanode-native DEX with MEV protection, Biostaker + getHMND integrations, fees routed to Human Nodes, plus a 6-week launch sprint for real adoption.",
    stageData: [
      {
        title: "Budget allocated",
        description: "HMND",
        value: "98k / 245k",
      },
      {
        title: "Team slots",
        description: "Filled / Total",
        value: "3 / 5",
      },
      {
        title: "Progress",
        description: "Reported completion",
        value: "46%",
      },
    ],
    stats: [
      { label: "Budget ask", value: "245k HMND" },
      { label: "Audit", value: "In progress" },
    ],
    proposer: "Dato",
    proposerId: "dato",
    chamber: "Engineering chamber",
    tier: "Consul",
    proofFocus: "pog",
    tags: ["DeFi", "MEV", "Fees to nodes"],
    keywords: [
      "dex",
      "mev",
      "protected-swaps",
      "biostaker",
      "gethmnd",
      "fees",
      "audit",
      "liquidity",
      "launch",
    ],
    date: "2025-12-29",
    votes: 60,
    activityScore: 95,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "vortex-field-experiments-s1",
    title: "Vortex Field Experiments: Season 1",
    meta: "Marketing chamber · Ecclesiast tier",
    stage: "pool",
    summaryPill: "6 weeks · 3 experiments",
    summary:
      "Run a 6-week series of interactive governance experiments (puzzles, clinics, micro-bounties) to attract high-signal contributors into Vortex.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "28 / 9",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 25% engaged",
        tone: "ok",
      },
      { title: "Votes casted", description: "Backing seats", value: "28" },
    ],
    stats: [
      { label: "Budget ask", value: "24k HMND" },
      { label: "Formation", value: "Yes" },
    ],
    proposer: "Ekko",
    proposerId: "ekko",
    chamber: "Marketing chamber",
    tier: "Ecclesiast",
    proofFocus: "pod",
    tags: ["Growth", "Community", "Experiments"],
    keywords: [
      "marketing",
      "growth",
      "experiments",
      "puzzles",
      "clinics",
      "micro-bounties",
      "onboarding",
      "governance",
    ],
    date: "2026-01-05",
    votes: 37,
    activityScore: 76,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "fixed-governor-stake-spam-slashing",
    title: "Fixed Governor Stake & Spam Slashing Rule for Vortex",
    meta: "Economics chamber · Legate tier",
    stage: "vote",
    summaryPill: "Chamber vote",
    summary:
      "Introduce a fixed HMND stake to remain a governor plus a simple spam slashing curve, without changing voting power (still 1 human = 1 vote).",
    stageData: [
      {
        title: "Voting quorum",
        description: "Strict 33% active governors",
        value: "Met · 41%",
        tone: "ok",
      },
      {
        title: "Passing rule",
        description: "≥66.6% + 1 vote yes",
        value: "Current 58%",
        tone: "warn",
      },
      { title: "Time left", description: "Voting window", value: "11h 05m" },
    ],
    stats: [
      { label: "Budget ask", value: "18k HMND" },
      { label: "Formation", value: "Yes" },
    ],
    proposer: "Fares",
    proposerId: "fares",
    chamber: "Economics chamber",
    tier: "Legate",
    proofFocus: "pog",
    tags: ["Economics", "Governance", "Spam resistance"],
    keywords: [
      "stake",
      "slashing",
      "spam",
      "governor",
      "economics",
      "parameters",
      "incentives",
      "non-plutocratic",
    ],
    date: "2026-01-03",
    votes: 62,
    activityScore: 89,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "voluntary-commitment-staking",
    title: "Voluntary Governor Commitment Staking",
    meta: "General chamber · Legate tier",
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
    stats: [{ label: "Budget ask", value: "16k HMND" }],
    proposer: "Victor",
    proposerId: "victor",
    chamber: "General chamber",
    tier: "Legate",
    proofFocus: "pog",
    tags: ["Governance", "Economics", "Reputation"],
    keywords: [
      "governance",
      "commitment",
      "staking",
      "optional",
      "self-slash",
      "reputation",
      "non-plutocratic",
    ],
    date: "2026-01-04",
    votes: 52,
    activityScore: 88,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Add to agenda",
  },
];
