import { z } from "zod";

import { readSession } from "../_lib/auth.ts";
import { checkEligibility } from "../_lib/gate.ts";
import { errorResponse, jsonResponse, readJson } from "../_lib/http.ts";
import {
  getIdempotencyResponse,
  storeIdempotencyResponse,
} from "../_lib/idempotencyStore.ts";
import { castPoolVote } from "../_lib/poolVotesStore.ts";
import { appendFeedItemEvent } from "../_lib/appendEvents.ts";
import { createReadModelsStore } from "../_lib/readModelsStore.ts";
import { evaluatePoolQuorum } from "../_lib/poolQuorum.ts";

const poolVoteSchema = z.object({
  type: z.literal("pool.vote"),
  payload: z.object({
    proposalId: z.string().min(1),
    direction: z.enum(["up", "down"]),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

type CommandInput = z.infer<typeof poolVoteSchema>;

export const onRequestPost: PagesFunction = async (context) => {
  let body: unknown;
  try {
    body = await readJson(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const parsed = poolVoteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Invalid command", {
      issues: parsed.error.issues,
    });
  }

  const session = await readSession(context.request, context.env);
  if (!session) return errorResponse(401, "Not authenticated");

  const gate = await checkEligibility(context.env, session.address);
  if (!gate.eligible) {
    return errorResponse(403, gate.reason ?? "not_eligible", { gate });
  }

  const input: CommandInput = parsed.data;
  const headerKey =
    context.request.headers.get("idempotency-key") ??
    context.request.headers.get("x-idempotency-key") ??
    undefined;
  const idempotencyKey = headerKey ?? input.idempotencyKey;
  const requestForIdem = { type: input.type, payload: input.payload };

  if (idempotencyKey) {
    const hit = await getIdempotencyResponse(context.env, {
      key: idempotencyKey,
      address: session.address,
      request: requestForIdem,
    });
    if ("conflict" in hit && hit.conflict) {
      return errorResponse(409, "Idempotency key conflict");
    }
    if (hit.hit) return jsonResponse(hit.response);
  }

  const readModels = await createReadModelsStore(context.env).catch(() => null);
  if (readModels) {
    const stage = await getProposalStage(readModels, input.payload.proposalId);
    if (stage && stage !== "pool") {
      return errorResponse(409, "Proposal is not in pool stage", { stage });
    }
  }

  const direction = input.payload.direction === "up" ? 1 : -1;
  const counts = await castPoolVote(context.env, {
    proposalId: input.payload.proposalId,
    voterAddress: session.address,
    direction,
  });

  const response = {
    ok: true as const,
    type: input.type,
    proposalId: input.payload.proposalId,
    direction: input.payload.direction,
    counts,
  };

  if (idempotencyKey) {
    await storeIdempotencyResponse(context.env, {
      key: idempotencyKey,
      address: session.address,
      request: requestForIdem,
      response,
    });
  }

  await appendFeedItemEvent(context.env, {
    stage: "pool",
    actorAddress: session.address,
    entityType: "proposal",
    entityId: input.payload.proposalId,
    payload: {
      id: `pool-vote:${input.payload.proposalId}:${session.address}:${Date.now()}`,
      title: "Pool vote cast",
      meta: "Proposal pool · Vote",
      stage: "pool",
      summaryPill: input.payload.direction === "up" ? "Upvote" : "Downvote",
      summary: `Recorded a ${input.payload.direction}vote in the proposal pool.`,
      stats: [
        { label: "Upvotes", value: String(counts.upvotes) },
        { label: "Downvotes", value: String(counts.downvotes) },
      ],
      ctaPrimary: "Open proposal",
      href: `/app/proposals/${input.payload.proposalId}/pp`,
      timestamp: new Date().toISOString(),
    },
  });

  const advanced =
    readModels &&
    (await maybeAdvancePoolProposalToVote(readModels, {
      proposalId: input.payload.proposalId,
      counts,
    }));

  if (advanced) {
    await appendFeedItemEvent(context.env, {
      stage: "vote",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `pool-advance:${input.payload.proposalId}:${Date.now()}`,
        title: "Proposal advanced",
        meta: "Chamber vote",
        stage: "vote",
        summaryPill: "Advanced",
        summary: "Attention quorum met; proposal moved to chamber vote.",
        stats: [
          { label: "Upvotes", value: String(counts.upvotes) },
          {
            label: "Engaged",
            value: String(counts.upvotes + counts.downvotes),
          },
        ],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${input.payload.proposalId}/chamber`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return jsonResponse(response);
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function getProposalStage(
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  proposalId: string,
): Promise<string | null> {
  const listPayload = await store.get("proposals:list");
  if (!isRecord(listPayload)) return null;
  const items = listPayload.items;
  if (!Array.isArray(items)) return null;
  const item = items.find(
    (entry) => isRecord(entry) && entry.id === proposalId,
  );
  if (!item || !isRecord(item)) return null;
  return typeof item.stage === "string" ? item.stage : null;
}

async function maybeAdvancePoolProposalToVote(
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  input: { proposalId: string; counts: { upvotes: number; downvotes: number } },
): Promise<boolean> {
  if (!store.set) return false;

  const poolPayload = await store.get(`proposals:${input.proposalId}:pool`);
  if (!isRecord(poolPayload)) return false;
  const attentionQuorum = poolPayload.attentionQuorum;
  const activeGovernors = poolPayload.activeGovernors;
  const upvoteFloor = poolPayload.upvoteFloor;
  if (
    typeof attentionQuorum !== "number" ||
    typeof activeGovernors !== "number" ||
    typeof upvoteFloor !== "number"
  ) {
    return false;
  }

  const quorum = evaluatePoolQuorum(
    { attentionQuorum, activeGovernors, upvoteFloor },
    input.counts,
  );
  if (!quorum.shouldAdvance) return false;

  const listPayload = await store.get("proposals:list");
  if (!isRecord(listPayload)) return false;
  const items = listPayload.items;
  if (!Array.isArray(items)) return false;

  const chamberPayload = await ensureChamberProposalPage(
    store,
    input.proposalId,
    poolPayload,
  );
  const voteStageData = buildVoteStageData(chamberPayload);

  let changed = false;
  const nextItems = items.map((item) => {
    if (!isRecord(item) || item.id !== input.proposalId) return item;
    if (item.stage !== "pool") return item;
    changed = true;
    return {
      ...item,
      stage: "vote",
      summaryPill: "Chamber vote",
      stageData: voteStageData ?? item.stageData,
    };
  });
  if (!changed) return false;

  await store.set("proposals:list", { ...listPayload, items: nextItems });
  return true;
}

async function ensureChamberProposalPage(
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  proposalId: string,
  poolPayload: Record<string, unknown>,
): Promise<unknown> {
  const existing = await store.get(`proposals:${proposalId}:chamber`);
  if (existing) return existing;
  if (!store.set) return existing;

  const generated = buildChamberProposalPageFromPool(poolPayload);
  await store.set(`proposals:${proposalId}:chamber`, generated);
  return generated;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function buildChamberProposalPageFromPool(
  poolPayload: Record<string, unknown>,
): Record<string, unknown> {
  const activeGovernors = asNumber(poolPayload.activeGovernors, 0);
  return {
    title: asString(poolPayload.title, "Proposal"),
    proposer: asString(poolPayload.proposer, "Unknown"),
    proposerId: asString(poolPayload.proposerId, "unknown"),
    chamber: asString(poolPayload.chamber, "General chamber"),
    budget: asString(poolPayload.budget, "—"),
    formationEligible: asBoolean(poolPayload.formationEligible, false),
    teamSlots: asString(poolPayload.teamSlots, "—"),
    milestones: asString(poolPayload.milestones, "—"),
    timeLeft: "3d 00h",
    votes: { yes: 0, no: 0, abstain: 0 },
    attentionQuorum: 0.33,
    passingRule: "≥66.6% + 1 yes within quorum",
    engagedGovernors: 0,
    activeGovernors,
    attachments: asArray(poolPayload.attachments),
    teamLocked: asArray(poolPayload.teamLocked),
    openSlotNeeds: asArray(poolPayload.openSlotNeeds),
    milestonesDetail: asArray(poolPayload.milestonesDetail),
    summary: asString(poolPayload.summary, ""),
    overview: asString(poolPayload.overview, ""),
    executionPlan: asArray<string>(poolPayload.executionPlan),
    budgetScope: asString(poolPayload.budgetScope, ""),
    invisionInsight: isRecord(poolPayload.invisionInsight)
      ? poolPayload.invisionInsight
      : { role: "—", bullets: [] },
  };
}

function buildVoteStageData(payload: unknown): Array<{
  title: string;
  description: string;
  value: string;
  tone?: "ok" | "warn";
}> | null {
  if (!isRecord(payload)) return null;
  const attentionQuorum = payload.attentionQuorum;
  const activeGovernors = payload.activeGovernors;
  const engagedGovernors = payload.engagedGovernors;
  const passingRule = payload.passingRule;
  const timeLeft = payload.timeLeft;
  const votes = payload.votes;
  if (
    typeof attentionQuorum !== "number" ||
    typeof activeGovernors !== "number" ||
    typeof engagedGovernors !== "number" ||
    typeof passingRule !== "string" ||
    typeof timeLeft !== "string" ||
    !isRecord(votes)
  ) {
    return null;
  }

  const yes = Number(votes.yes ?? 0);
  const no = Number(votes.no ?? 0);
  const abstain = Number(votes.abstain ?? 0);
  const total = Math.max(0, yes) + Math.max(0, no) + Math.max(0, abstain);
  const yesPct = total > 0 ? (yes / total) * 100 : 0;

  const quorumNeeded = Math.ceil(
    Math.max(0, activeGovernors) * attentionQuorum,
  );
  const quorumPct =
    activeGovernors > 0 ? (engagedGovernors / activeGovernors) * 100 : 0;
  const quorumMet = engagedGovernors >= quorumNeeded;

  return [
    {
      title: "Voting quorum",
      description: `Strict ${Math.round(attentionQuorum * 100)}% active governors`,
      value: `${quorumMet ? "Met" : "Needs"} · ${Math.round(quorumPct)}%`,
      tone: quorumMet ? "ok" : "warn",
    },
    {
      title: "Passing rule",
      description: passingRule,
      value: `Current ${Math.round(yesPct)}%`,
      tone: yesPct >= 66.6 ? "ok" : "warn",
    },
    { title: "Time left", description: "Voting window", value: timeLeft },
  ];
}
