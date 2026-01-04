import { evaluateChamberQuorum } from "./chamberQuorum.ts";
import { evaluatePoolQuorum } from "./poolQuorum.ts";
import type {
  ProposalListItemDto,
  ChamberProposalPageDto,
  FormationProposalPageDto,
  PoolProposalPageDto,
  ProposalStageDatumDto,
} from "../../src/types/api.ts";
import type { ProposalDraftForm } from "./proposalDraftsStore.ts";
import { formatChamberLabel } from "./proposalDraftsStore.ts";
import type { ProposalRecord, ProposalStage } from "./proposalsStore.ts";
import {
  formatTimeLeftDaysHours,
  getStageRemainingSeconds,
} from "./stageWindows.ts";
import {
  V1_ACTIVE_GOVERNORS_FALLBACK,
  V1_CHAMBER_PASSING_FRACTION,
  V1_CHAMBER_QUORUM_FRACTION,
  V1_POOL_ATTENTION_QUORUM_FRACTION,
  V1_POOL_UPVOTE_FLOOR_FRACTION,
} from "./v1Constants.ts";
import type { HumanTier } from "./userTier.ts";

export function projectProposalListItem(
  proposal: ProposalRecord,
  input: {
    activeGovernors: number;
    tier?: HumanTier;
    now?: Date;
    voteWindowSeconds?: number;
    poolCounts?: { upvotes: number; downvotes: number };
    chamberCounts?: { yes: number; no: number; abstain: number };
    formationSummary?: {
      teamFilled: number;
      teamTotal: number;
      milestonesCompleted: number;
      milestonesTotal: number;
    };
  },
): ProposalListItemDto {
  const chamber = formatChamberLabel(proposal.chamberId);
  const date = proposal.createdAt.toISOString().slice(0, 10);
  const now = input.now ?? new Date();
  const formationEligible = getFormationEligibleFromPayload(proposal.payload);
  const tier: HumanTier = input.tier ?? "Nominee";

  const stageData =
    proposal.stage === "pool"
      ? projectPoolListStageData({
          activeGovernors: input.activeGovernors,
          counts: input.poolCounts ?? { upvotes: 0, downvotes: 0 },
        })
      : proposal.stage === "vote"
        ? projectVoteListStageData({
            activeGovernors: input.activeGovernors,
            counts: input.chamberCounts ?? { yes: 0, no: 0, abstain: 0 },
            timeLeft: (() => {
              if (
                !(
                  typeof input.voteWindowSeconds === "number" &&
                  input.voteWindowSeconds > 0
                )
              )
                return "3d 00h";
              const remaining = getStageRemainingSeconds({
                now,
                stageStartedAt: proposal.updatedAt,
                windowSeconds: input.voteWindowSeconds,
              });
              return remaining === 0
                ? "Ended"
                : formatTimeLeftDaysHours(remaining);
            })(),
          })
        : formationEligible
          ? projectBuildListStageData({
              summary: input.formationSummary ?? {
                teamFilled: 0,
                teamTotal: 0,
                milestonesCompleted: 0,
                milestonesTotal: 0,
              },
            })
          : projectPassedListStageData();

  const budget = formatBudget(getDraftForm(proposal.payload));
  const milestonesCount = getDraftForm(proposal.payload)?.timeline.length ?? 0;

  const ctaPrimary =
    proposal.stage === "pool"
      ? "Open proposal"
      : proposal.stage === "vote"
        ? "Open proposal"
        : formationEligible
          ? "Open project"
          : "Open proposal";

  const ctaSecondary =
    proposal.stage === "build" && formationEligible ? "Ping team" : "";

  const summaryPill =
    proposal.stage === "pool"
      ? `${milestonesCount} milestones`
      : proposal.stage === "vote"
        ? "Chamber vote"
        : formationEligible
          ? "Formation"
          : "Passed";

  return {
    id: proposal.id,
    title: proposal.title,
    meta: `${chamber} · ${tier} tier`,
    stage: proposal.stage,
    summaryPill,
    summary: proposal.summary,
    stageData,
    stats: [
      { label: "Budget ask", value: budget },
      { label: "Formation", value: formationEligible ? "Yes" : "No" },
    ],
    proposer: proposal.authorAddress,
    proposerId: proposal.authorAddress,
    chamber,
    tier,
    proofFocus: "pot",
    tags: [],
    keywords: [],
    date,
    votes:
      proposal.stage === "pool"
        ? (input.poolCounts?.upvotes ?? 0) + (input.poolCounts?.downvotes ?? 0)
        : proposal.stage === "vote"
          ? (input.chamberCounts?.yes ?? 0) +
            (input.chamberCounts?.no ?? 0) +
            (input.chamberCounts?.abstain ?? 0)
          : 0,
    activityScore: 0,
    ctaPrimary,
    ctaSecondary,
  };
}

export function projectPoolProposalPage(
  proposal: ProposalRecord,
  input: {
    counts: { upvotes: number; downvotes: number };
    activeGovernors: number;
    tier?: HumanTier;
  },
): PoolProposalPageDto {
  const form = getDraftForm(proposal.payload);
  const chamber = formatChamberLabel(proposal.chamberId);
  const budget = formatBudget(form);
  const formationEligible = getFormationEligibleFromPayload(proposal.payload);
  const tier: HumanTier = input.tier ?? "Nominee";

  const activeGovernors = Math.max(
    0,
    Math.floor(input.activeGovernors ?? V1_ACTIVE_GOVERNORS_FALLBACK),
  );
  const attentionQuorum = V1_POOL_ATTENTION_QUORUM_FRACTION;
  const upvoteFloor = Math.max(
    1,
    Math.ceil(activeGovernors * V1_POOL_UPVOTE_FLOOR_FRACTION),
  );

  const rules = [
    `${Math.round(attentionQuorum * 100)}% attention from active governors required.`,
    `At least ${Math.round((upvoteFloor / Math.max(1, activeGovernors)) * 100)}% upvotes to move to chamber vote.`,
  ];

  return {
    title: proposal.title,
    proposer: proposal.authorAddress,
    proposerId: proposal.authorAddress,
    chamber,
    focus: "—",
    tier,
    budget,
    cooldown: "Withdraw cooldown: 12h",
    formationEligible,
    teamSlots: "1 / 3",
    milestones: String(form?.timeline.length ?? 0),
    upvotes: input.counts.upvotes,
    downvotes: input.counts.downvotes,
    attentionQuorum,
    activeGovernors,
    upvoteFloor,
    rules,
    attachments:
      form?.attachments
        .filter((a) => a.label.trim().length > 0)
        .map((a) => ({ id: a.id, title: a.label })) ?? [],
    teamLocked: [{ name: proposal.authorAddress, role: "Proposer" }],
    openSlotNeeds: [],
    milestonesDetail:
      form?.timeline.map((m, idx) => ({
        title: m.title.trim().length ? m.title : `Milestone ${idx + 1}`,
        desc: m.timeframe.trim().length ? m.timeframe : "Timeline TBD",
      })) ?? [],
    summary: form?.summary ?? proposal.summary,
    overview: form?.what ?? "",
    executionPlan:
      form?.how
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean) ?? [],
    budgetScope:
      form?.budgetItems
        .filter((b) => b.description.trim().length > 0)
        .map((b) => `${b.description}: ${b.amount} HMND`)
        .join("\n") ?? "",
    invisionInsight: {
      role: "Draft author",
      bullets: [
        "Submitted via the simulation backend proposal wizard.",
        "This is an off-chain governance simulation (not mainnet).",
      ],
    },
  };
}

export function projectChamberProposalPage(
  proposal: ProposalRecord,
  input: {
    counts: { yes: number; no: number; abstain: number };
    activeGovernors: number;
    now?: Date;
    voteWindowSeconds?: number;
  },
): ChamberProposalPageDto {
  const form = getDraftForm(proposal.payload);
  const chamber = formatChamberLabel(proposal.chamberId);
  const budget = formatBudget(form);
  const formationEligible = getFormationEligibleFromPayload(proposal.payload);

  const activeGovernors = Math.max(
    0,
    Math.floor(input.activeGovernors ?? V1_ACTIVE_GOVERNORS_FALLBACK),
  );
  const engagedGovernors =
    input.counts.yes + input.counts.no + input.counts.abstain;
  const now = input.now ?? new Date();
  const timeLeft = (() => {
    if (
      !(
        typeof input.voteWindowSeconds === "number" &&
        input.voteWindowSeconds > 0
      )
    )
      return "3d 00h";
    const remaining = getStageRemainingSeconds({
      now,
      stageStartedAt: proposal.updatedAt,
      windowSeconds: input.voteWindowSeconds,
    });
    return remaining === 0 ? "Ended" : formatTimeLeftDaysHours(remaining);
  })();

  return {
    title: proposal.title,
    proposer: proposal.authorAddress,
    proposerId: proposal.authorAddress,
    chamber,
    budget,
    formationEligible,
    teamSlots: "1 / 3",
    milestones: `${form?.timeline.length ?? 0}`,
    timeLeft,
    votes: input.counts,
    attentionQuorum: V1_CHAMBER_QUORUM_FRACTION,
    passingRule: `≥${(V1_CHAMBER_PASSING_FRACTION * 100).toFixed(1)}% + 1 yes within quorum`,
    engagedGovernors,
    activeGovernors,
    attachments:
      form?.attachments
        .filter((a) => a.label.trim().length > 0)
        .map((a) => ({ id: a.id, title: a.label })) ?? [],
    teamLocked: [{ name: proposal.authorAddress, role: "Proposer" }],
    openSlotNeeds: [],
    milestonesDetail:
      form?.timeline.map((m, idx) => ({
        title: m.title.trim().length ? m.title : `Milestone ${idx + 1}`,
        desc: m.timeframe.trim().length ? m.timeframe : "Timeline TBD",
      })) ?? [],
    summary: form?.summary ?? proposal.summary,
    overview: form?.what ?? "",
    executionPlan:
      form?.how
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean) ?? [],
    budgetScope:
      form?.budgetItems
        .filter((b) => b.description.trim().length > 0)
        .map((b) => `${b.description}: ${b.amount} HMND`)
        .join("\n") ?? "",
    invisionInsight: {
      role: "Draft author",
      bullets: [
        "Submitted via the simulation backend proposal wizard.",
        "This is an off-chain governance simulation (not mainnet).",
      ],
    },
  };
}

export function projectFormationProposalPage(
  proposal: ProposalRecord,
  input: {
    summary: {
      teamFilled: number;
      teamTotal: number;
      milestonesCompleted: number;
      milestonesTotal: number;
    };
    joiners: { address: string; role?: string | null }[];
  },
): FormationProposalPageDto {
  const form = getDraftForm(proposal.payload);
  const chamber = formatChamberLabel(proposal.chamberId);
  const budget = formatBudget(form);

  const teamSlots = `${input.summary.teamFilled} / ${input.summary.teamTotal}`;
  const milestones = `${input.summary.milestonesCompleted} / ${input.summary.milestonesTotal}`;
  const progress =
    input.summary.milestonesTotal > 0
      ? `${Math.round((input.summary.milestonesCompleted / input.summary.milestonesTotal) * 100)}%`
      : "0%";

  return {
    title: proposal.title,
    chamber,
    proposer: proposal.authorAddress,
    proposerId: proposal.authorAddress,
    budget,
    timeLeft: "12w",
    teamSlots,
    milestones,
    progress,
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "0 / —" },
      { title: "Team slots", description: "Filled / Total", value: teamSlots },
      {
        title: "Milestones",
        description: "Completed / Total",
        value: milestones,
      },
    ],
    stats: [{ label: "Lead chamber", value: chamber }],
    lockedTeam: [
      { name: shortenAddress(proposal.authorAddress), role: "Proposer" },
      ...input.joiners.map((entry) => ({
        name: shortenAddress(entry.address),
        role: entry.role ?? "Contributor",
      })),
    ],
    openSlots: [],
    milestonesDetail:
      form?.timeline.map((m, idx) => ({
        title: m.title.trim().length ? m.title : `Milestone ${idx + 1}`,
        desc: m.timeframe.trim().length ? m.timeframe : "Timeline TBD",
      })) ?? [],
    attachments:
      form?.attachments
        .filter((a) => a.label.trim().length > 0)
        .map((a) => ({ id: a.id, title: a.label })) ?? [],
    summary: form?.summary ?? proposal.summary,
    overview: form?.what ?? "",
    executionPlan:
      form?.how
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean) ?? [],
    budgetScope:
      form?.budgetItems
        .filter((b) => b.description.trim().length > 0)
        .map((b) => `${b.description}: ${b.amount} HMND`)
        .join("\n") ?? "",
    invisionInsight: {
      role: "Draft author",
      bullets: [
        "Submitted via the simulation backend proposal wizard.",
        "This is an off-chain governance simulation (not mainnet).",
      ],
    },
  };
}

function projectPoolListStageData(input: {
  activeGovernors: number;
  counts: { upvotes: number; downvotes: number };
}): ProposalStageDatumDto[] {
  const attentionQuorum = V1_POOL_ATTENTION_QUORUM_FRACTION;
  const upvoteFloor = Math.max(
    1,
    Math.ceil(
      Math.max(0, input.activeGovernors) * V1_POOL_UPVOTE_FLOOR_FRACTION,
    ),
  );
  const quorum = evaluatePoolQuorum(
    { attentionQuorum, activeGovernors: input.activeGovernors, upvoteFloor },
    input.counts,
  );
  const engagedPct =
    input.activeGovernors > 0
      ? (quorum.engaged / input.activeGovernors) * 100
      : 0;
  return [
    {
      title: "Pool momentum",
      description: "Upvotes / Downvotes",
      value: `${input.counts.upvotes} / ${input.counts.downvotes}`,
    },
    {
      title: "Attention quorum",
      description: `${Math.round(attentionQuorum * 100)}% active or ≥10% upvotes`,
      value: `${quorum.shouldAdvance ? "Met" : "Needs"} · ${Math.round(engagedPct)}% engaged`,
      tone: quorum.shouldAdvance ? "ok" : "warn",
    },
    {
      title: "Upvote floor",
      description: `${upvoteFloor} needed`,
      value: `${input.counts.upvotes} / ${upvoteFloor}`,
      tone: input.counts.upvotes >= upvoteFloor ? "ok" : "warn",
    },
  ];
}

function projectVoteListStageData(input: {
  activeGovernors: number;
  counts: { yes: number; no: number; abstain: number };
  timeLeft: string;
}): ProposalStageDatumDto[] {
  const quorumFraction = V1_CHAMBER_QUORUM_FRACTION;
  const passingFraction = V1_CHAMBER_PASSING_FRACTION;
  const result = evaluateChamberQuorum(
    { quorumFraction, activeGovernors: input.activeGovernors, passingFraction },
    input.counts,
  );
  const quorumPct =
    input.activeGovernors > 0
      ? (result.engaged / input.activeGovernors) * 100
      : 0;
  return [
    {
      title: "Voting quorum",
      description: `Strict ${Math.round(quorumFraction * 100)}% active governors`,
      value: `${result.quorumMet ? "Met" : "Needs"} · ${Math.round(quorumPct)}%`,
      tone: result.quorumMet ? "ok" : "warn",
    },
    {
      title: "Passing",
      description: "≥66.6% yes",
      value: `${Math.round(result.yesFraction * 1000) / 10}% yes`,
      tone: result.passMet ? "ok" : "warn",
    },
    { title: "Time left", description: "Voting window", value: input.timeLeft },
  ];
}

function projectBuildListStageData(input: {
  summary: {
    teamFilled: number;
    teamTotal: number;
    milestonesCompleted: number;
    milestonesTotal: number;
  };
}): ProposalStageDatumDto[] {
  const teamValue = `${input.summary.teamFilled} / ${input.summary.teamTotal}`;
  const milestonesValue = `${input.summary.milestonesCompleted} / ${input.summary.milestonesTotal}`;
  const pct =
    input.summary.milestonesTotal > 0
      ? (input.summary.milestonesCompleted / input.summary.milestonesTotal) *
        100
      : 0;
  return [
    { title: "Team slots", description: "Filled / Total", value: teamValue },
    {
      title: "Milestones",
      description: "Completed / Total",
      value: milestonesValue,
    },
    {
      title: "Progress",
      description: "Milestones",
      value: `${Math.round(pct)}%`,
      tone: pct >= 50 ? "ok" : "warn",
    },
  ];
}

function projectPassedListStageData(): ProposalStageDatumDto[] {
  return [
    {
      title: "Accepted",
      description: "Passed chamber vote",
      value: "Yes",
      tone: "ok",
    },
    {
      title: "Formation",
      description: "Execution stage",
      value: "Not required",
    },
  ];
}

function getDraftForm(payload: unknown): ProposalDraftForm | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return null;
  const record = payload as Partial<ProposalDraftForm>;
  if (typeof record.title !== "string") return null;
  if (!Array.isArray(record.timeline) || !Array.isArray(record.budgetItems))
    return null;
  return record as ProposalDraftForm;
}

function getFormationEligibleFromPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return true;
  const record = payload as Record<string, unknown>;
  if (record.templateId === "system") return false;
  if (
    typeof record.metaGovernance === "object" &&
    record.metaGovernance !== null &&
    !Array.isArray(record.metaGovernance)
  )
    return false;
  if (typeof record.formationEligible === "boolean")
    return record.formationEligible;
  if (typeof record.formation === "boolean") return record.formation;
  return true;
}

function formatBudget(form: ProposalDraftForm | null): string {
  if (!form) return "—";
  const total = form.budgetItems.reduce((sum, item) => {
    const n = Number(item.amount);
    if (!Number.isFinite(n) || n <= 0) return sum;
    return sum + n;
  }, 0);
  return total > 0 ? `${total.toLocaleString()} HMND` : "—";
}

export function parseProposalStageQuery(
  value: string | null,
): ProposalStage | null {
  if (!value) return null;
  if (value === "pool" || value === "vote" || value === "build") return value;
  return null;
}

function shortenAddress(address: string): string {
  const normalized = address.trim();
  if (normalized.length <= 12) return normalized;
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
}
