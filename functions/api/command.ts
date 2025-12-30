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
import {
  castChamberVote,
  getChamberYesScoreAverage,
} from "../_lib/chamberVotesStore.ts";
import { evaluateChamberQuorum } from "../_lib/chamberQuorum.ts";
import { awardCmOnce } from "../_lib/cmAwardsStore.ts";
import {
  joinFormationProject,
  ensureFormationSeed,
  buildV1FormationSeedFromProposalPayload,
  getFormationMilestoneStatus,
  isFormationTeamMember,
  requestFormationMilestoneUnlock,
  submitFormationMilestone,
} from "../_lib/formationStore.ts";
import {
  castCourtVerdict,
  hasCourtReport,
  hasCourtVerdict,
  reportCourtCase,
} from "../_lib/courtsStore.ts";
import {
  getActiveGovernorsForCurrentEra,
  incrementEraUserActivity,
  getUserEraActivity,
} from "../_lib/eraStore.ts";
import {
  createApiRateLimitStore,
  getCommandRateLimitConfig,
} from "../_lib/apiRateLimitStore.ts";
import { getRequestIp } from "../_lib/requestIp.ts";
import { createActionLocksStore } from "../_lib/actionLocksStore.ts";
import { getEraQuotaConfig } from "../_lib/eraQuotas.ts";
import { hasPoolVote } from "../_lib/poolVotesStore.ts";
import { hasChamberVote } from "../_lib/chamberVotesStore.ts";
import { createAdminStateStore } from "../_lib/adminStateStore.ts";
import {
  deleteDraft,
  draftIsSubmittable,
  formatChamberLabel,
  getDraft,
  markDraftSubmitted,
  proposalDraftFormSchema,
  upsertDraft,
} from "../_lib/proposalDraftsStore.ts";
import {
  createProposal,
  getProposal,
  transitionProposalStage,
} from "../_lib/proposalsStore.ts";
import { randomHex } from "../_lib/random.ts";
import {
  computePoolUpvoteFloor,
  shouldAdvancePoolToVote,
  shouldAdvanceVoteToBuild,
} from "../_lib/proposalStateMachine.ts";
import {
  V1_ACTIVE_GOVERNORS_FALLBACK,
  V1_CHAMBER_PASSING_FRACTION,
  V1_CHAMBER_QUORUM_FRACTION,
  V1_POOL_ATTENTION_QUORUM_FRACTION,
} from "../_lib/v1Constants.ts";
import { ensureFormationSeedFromInput } from "../_lib/formationStore.ts";
import {
  formatTimeLeftDaysHours,
  getSimNow,
  getStageDeadlineIso,
  getStageRemainingSeconds,
  getStageWindowSeconds,
  isStageOpen,
  stageWindowsEnabled,
} from "../_lib/stageWindows.ts";

const poolVoteSchema = z.object({
  type: z.literal("pool.vote"),
  payload: z.object({
    proposalId: z.string().min(1),
    direction: z.enum(["up", "down"]),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const chamberVoteSchema = z.object({
  type: z.literal("chamber.vote"),
  payload: z.object({
    proposalId: z.string().min(1),
    choice: z.enum(["yes", "no", "abstain"]),
    score: z.number().int().min(1).max(10).optional(),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const formationJoinSchema = z.object({
  type: z.literal("formation.join"),
  payload: z.object({
    proposalId: z.string().min(1),
    role: z.string().min(1).optional(),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const formationMilestoneSubmitSchema = z.object({
  type: z.literal("formation.milestone.submit"),
  payload: z.object({
    proposalId: z.string().min(1),
    milestoneIndex: z.number().int().min(1),
    note: z.string().min(1).optional(),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const formationMilestoneUnlockSchema = z.object({
  type: z.literal("formation.milestone.requestUnlock"),
  payload: z.object({
    proposalId: z.string().min(1),
    milestoneIndex: z.number().int().min(1),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const courtReportSchema = z.object({
  type: z.literal("court.case.report"),
  payload: z.object({
    caseId: z.string().min(1),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const courtVerdictSchema = z.object({
  type: z.literal("court.case.verdict"),
  payload: z.object({
    caseId: z.string().min(1),
    verdict: z.enum(["guilty", "not_guilty"]),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const proposalDraftSaveSchema = z.object({
  type: z.literal("proposal.draft.save"),
  payload: z.object({
    draftId: z.string().min(1).optional(),
    form: proposalDraftFormSchema,
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const proposalDraftDeleteSchema = z.object({
  type: z.literal("proposal.draft.delete"),
  payload: z.object({
    draftId: z.string().min(1),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const proposalSubmitToPoolSchema = z.object({
  type: z.literal("proposal.submitToPool"),
  payload: z.object({
    draftId: z.string().min(1),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const commandSchema = z.discriminatedUnion("type", [
  poolVoteSchema,
  chamberVoteSchema,
  formationJoinSchema,
  formationMilestoneSubmitSchema,
  formationMilestoneUnlockSchema,
  courtReportSchema,
  courtVerdictSchema,
  proposalDraftSaveSchema,
  proposalDraftDeleteSchema,
  proposalSubmitToPoolSchema,
]);

type CommandInput = z.infer<typeof commandSchema>;

export const onRequestPost: PagesFunction = async (context) => {
  let body: unknown;
  try {
    body = await readJson(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Invalid command", {
      issues: parsed.error.issues,
    });
  }

  const session = await readSession(context.request, context.env);
  if (!session) return errorResponse(401, "Not authenticated");
  const sessionAddress = session.address;

  const gate = await checkEligibility(
    context.env,
    sessionAddress,
    context.request.url,
  );
  if (!gate.eligible) {
    return errorResponse(403, gate.reason ?? "not_eligible", { gate });
  }

  if (context.env.SIM_WRITE_FREEZE === "true") {
    return errorResponse(503, "Writes are temporarily disabled", {
      code: "writes_frozen",
    });
  }
  const adminState = await createAdminStateStore(context.env)
    .get()
    .catch(() => ({ writesFrozen: false }));
  if (adminState.writesFrozen) {
    return errorResponse(503, "Writes are temporarily disabled", {
      code: "writes_frozen",
    });
  }

  const locks = createActionLocksStore(context.env);
  const activeLock = await locks.getActiveLock(sessionAddress);
  if (activeLock) {
    return errorResponse(403, "Action locked", {
      code: "action_locked",
      lock: activeLock,
    });
  }

  const rateLimits = createApiRateLimitStore(context.env);
  const rateConfig = getCommandRateLimitConfig(context.env);
  const requestIp = getRequestIp(context.request);

  if (requestIp) {
    const ipLimit = await rateLimits.consume({
      bucket: `command:ip:${requestIp}`,
      limit: rateConfig.perIpPerMinute,
      windowSeconds: 60,
    });
    if (!ipLimit.ok) {
      return errorResponse(429, "Rate limited", {
        scope: "ip",
        retryAfterSeconds: ipLimit.retryAfterSeconds,
        resetAt: ipLimit.resetAt,
      });
    }
  }

  const addressLimit = await rateLimits.consume({
    bucket: `command:address:${session.address}`,
    limit: rateConfig.perAddressPerMinute,
    windowSeconds: 60,
  });
  if (!addressLimit.ok) {
    return errorResponse(429, "Rate limited", {
      scope: "address",
      retryAfterSeconds: addressLimit.retryAfterSeconds,
      resetAt: addressLimit.resetAt,
    });
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
  const activeGovernorsBaseline = await getActiveGovernorsForCurrentEra(
    context.env,
  ).catch(() => null);

  const quotas = getEraQuotaConfig(context.env);

  async function enforceEraQuota(input: {
    kind: "poolVotes" | "chamberVotes" | "courtActions" | "formationActions";
    wouldCount: boolean;
  }): Promise<Response | null> {
    if (!input.wouldCount) return null;
    const limit =
      input.kind === "poolVotes"
        ? quotas.maxPoolVotes
        : input.kind === "chamberVotes"
          ? quotas.maxChamberVotes
          : input.kind === "courtActions"
            ? quotas.maxCourtActions
            : quotas.maxFormationActions;
    if (limit === null) return null;

    const activity = await getUserEraActivity(context.env, {
      address: sessionAddress,
    });
    const used = activity.counts[input.kind] ?? 0;
    if (used >= limit) {
      return errorResponse(429, "Era quota exceeded", {
        code: "era_quota_exceeded",
        era: activity.era,
        kind: input.kind,
        limit,
        used,
      });
    }
    return null;
  }
  if (
    input.type === "pool.vote" ||
    input.type === "chamber.vote" ||
    input.type === "formation.join" ||
    input.type === "formation.milestone.submit" ||
    input.type === "formation.milestone.requestUnlock"
  ) {
    const requiredStage =
      input.type === "pool.vote"
        ? "pool"
        : input.type === "chamber.vote"
          ? "vote"
          : "build";
    const stage =
      (await getProposal(context.env, input.payload.proposalId))?.stage ??
      (readModels
        ? await getProposalStage(readModels, input.payload.proposalId)
        : null);
    if (!stage) return errorResponse(404, "Unknown proposal");
    if (stage !== requiredStage) {
      return errorResponse(409, "Proposal is not in the required stage", {
        stage,
        requiredStage,
      });
    }
  }

  if (input.type === "proposal.draft.save") {
    const record = await upsertDraft(context.env, {
      authorAddress: sessionAddress,
      draftId: input.payload.draftId,
      form: input.payload.form,
    });

    const response = {
      ok: true as const,
      type: input.type,
      draftId: record.id,
      updatedAt: record.updatedAt.toISOString(),
    };

    if (idempotencyKey) {
      await storeIdempotencyResponse(context.env, {
        key: idempotencyKey,
        address: sessionAddress,
        request: requestForIdem,
        response,
      });
    }

    return jsonResponse(response);
  }

  if (input.type === "proposal.draft.delete") {
    const deleted = await deleteDraft(context.env, {
      authorAddress: sessionAddress,
      draftId: input.payload.draftId,
    });

    const response = {
      ok: true as const,
      type: input.type,
      draftId: input.payload.draftId,
      deleted,
    };

    if (idempotencyKey) {
      await storeIdempotencyResponse(context.env, {
        key: idempotencyKey,
        address: sessionAddress,
        request: requestForIdem,
        response,
      });
    }

    return jsonResponse(response);
  }

  if (input.type === "proposal.submitToPool") {
    const draft = await getDraft(context.env, {
      authorAddress: sessionAddress,
      draftId: input.payload.draftId,
    });
    if (!draft) return errorResponse(404, "Draft not found");
    if (draft.submittedAt || draft.submittedProposalId) {
      return errorResponse(409, "Draft already submitted");
    }
    if (!draftIsSubmittable(draft.payload)) {
      return errorResponse(400, "Draft is not ready for submission", {
        code: "draft_not_submittable",
      });
    }

    const now = new Date();
    const baseSlug = draft.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    const proposalId = `${baseSlug || "proposal"}-${randomHex(2)}`;

    await createProposal(context.env, {
      id: proposalId,
      stage: "pool",
      authorAddress: sessionAddress,
      title: draft.title,
      chamberId: draft.chamberId ?? null,
      summary: draft.summary,
      payload: draft.payload,
    });

    const chamber = formatChamberLabel(draft.chamberId);
    const budgetTotal = draft.payload.budgetItems.reduce((sum, item) => {
      const n = Number(item.amount);
      if (!Number.isFinite(n) || n <= 0) return sum;
      return sum + n;
    }, 0);
    const budget =
      budgetTotal > 0 ? `${budgetTotal.toLocaleString()} HMND` : "—";

    const activeGovernors =
      typeof activeGovernorsBaseline === "number"
        ? activeGovernorsBaseline
        : V1_ACTIVE_GOVERNORS_FALLBACK;
    const attentionQuorum = V1_POOL_ATTENTION_QUORUM_FRACTION;
    const upvoteFloor = computePoolUpvoteFloor(activeGovernors);

    const poolPagePayload = {
      title: draft.title,
      proposer: sessionAddress,
      proposerId: sessionAddress,
      chamber,
      focus: "—",
      tier: "Nominee",
      budget,
      cooldown: "Withdraw cooldown: 12h",
      formationEligible: true,
      teamSlots: "1 / 3",
      milestones: String(draft.payload.timeline.length),
      upvotes: 0,
      downvotes: 0,
      attentionQuorum,
      activeGovernors,
      upvoteFloor,
      rules: [
        `${Math.round(attentionQuorum * 100)}% attention from active governors required.`,
        `At least ${Math.round((upvoteFloor / activeGovernors) * 100)}% upvotes to move to chamber vote.`,
      ],
      attachments: draft.payload.attachments
        .filter((a) => a.label.trim().length > 0)
        .map((a) => ({ id: a.id, title: a.label })),
      teamLocked: [{ name: sessionAddress, role: "Proposer" }],
      openSlotNeeds: [],
      milestonesDetail: draft.payload.timeline.map((m, idx) => ({
        title: m.title.trim().length ? m.title : `Milestone ${idx + 1}`,
        desc: m.timeframe.trim().length ? m.timeframe : "Timeline TBD",
      })),
      summary: draft.payload.summary,
      overview: draft.payload.what,
      executionPlan: draft.payload.how
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      budgetScope: draft.payload.budgetItems
        .filter((b) => b.description.trim().length > 0)
        .map((b) => `${b.description}: ${b.amount} HMND`)
        .join("\n"),
      invisionInsight: {
        role: "Draft author",
        bullets: [
          "Submitted via the simulation backend proposal wizard.",
          "This is an off-chain governance simulation (not mainnet).",
        ],
      },
    };

    const listPayload = readModels?.set
      ? await readModels.get("proposals:list")
      : null;
    const existingItems =
      readModels?.set &&
      isRecord(listPayload) &&
      Array.isArray(listPayload.items)
        ? listPayload.items
        : [];

    const listItem = {
      id: proposalId,
      title: draft.title,
      meta: `${chamber} · Nominee tier`,
      stage: "pool",
      summaryPill: `${draft.payload.timeline.length} milestones`,
      summary: draft.payload.summary,
      stageData: [
        {
          title: "Pool momentum",
          description: "Upvotes / Downvotes",
          value: "0 / 0",
        },
        {
          title: "Attention quorum",
          description: "20% active or ≥10% upvotes",
          value: "Needs · 0% engaged",
          tone: "warn",
        },
        { title: "Votes casted", description: "Backing seats", value: "0" },
      ],
      stats: [
        { label: "Budget ask", value: budget },
        { label: "Formation", value: "Yes" },
      ],
      proposer: sessionAddress,
      proposerId: sessionAddress,
      chamber,
      tier: "Nominee",
      proofFocus: "pot",
      tags: [],
      keywords: [],
      date: now.toISOString().slice(0, 10),
      votes: 0,
      activityScore: 0,
      ctaPrimary: "Open proposal",
      ctaSecondary: "",
    };

    if (readModels?.set) {
      await readModels.set("proposals:list", {
        ...(isRecord(listPayload) ? listPayload : {}),
        items: [...existingItems, listItem],
      });
      await readModels.set(`proposals:${proposalId}:pool`, poolPagePayload);
    }

    await markDraftSubmitted(context.env, {
      authorAddress: sessionAddress,
      draftId: input.payload.draftId,
      proposalId,
    });

    const response = {
      ok: true as const,
      type: input.type,
      draftId: input.payload.draftId,
      proposalId,
    };

    if (idempotencyKey) {
      await storeIdempotencyResponse(context.env, {
        key: idempotencyKey,
        address: sessionAddress,
        request: requestForIdem,
        response,
      });
    }

    await appendFeedItemEvent(context.env, {
      stage: "pool",
      actorAddress: sessionAddress,
      entityType: "proposal",
      entityId: proposalId,
      payload: {
        id: `proposal-submitted:${proposalId}:${Date.now()}`,
        title: "Proposal submitted",
        meta: "Proposal pool · New",
        stage: "pool",
        summaryPill: "Submitted",
        summary: `Submitted "${draft.title}" to the proposal pool.`,
        stats: [{ label: "Budget ask", value: budget }],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${proposalId}/pp`,
        timestamp: new Date().toISOString(),
      },
    });

    return jsonResponse(response);
  }

  if (input.type === "pool.vote") {
    const proposal = await getProposal(context.env, input.payload.proposalId);
    if (
      proposal &&
      stageWindowsEnabled(context.env) &&
      proposal.stage === "pool"
    ) {
      const now = getSimNow(context.env);
      const windowSeconds = getStageWindowSeconds(context.env, "pool");
      if (
        !isStageOpen({
          now,
          stageStartedAt: proposal.updatedAt,
          windowSeconds,
        })
      ) {
        return errorResponse(409, "Pool window ended", {
          code: "stage_closed",
          stage: "pool",
          endedAt: getStageDeadlineIso({
            stageStartedAt: proposal.updatedAt,
            windowSeconds,
          }),
          timeLeft: formatTimeLeftDaysHours(
            getStageRemainingSeconds({
              now,
              stageStartedAt: proposal.updatedAt,
              windowSeconds,
            }),
          ),
        });
      }
    }

    const wouldCount = !(await hasPoolVote(context.env, {
      proposalId: input.payload.proposalId,
      voterAddress: sessionAddress,
    }));
    const quotaError = await enforceEraQuota({
      kind: "poolVotes",
      wouldCount,
    });
    if (quotaError) return quotaError;

    const direction = input.payload.direction === "up" ? 1 : -1;
    const { counts, created } = await castPoolVote(context.env, {
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
      (readModels &&
        (await maybeAdvancePoolProposalToVote(readModels, {
          proposalId: input.payload.proposalId,
          counts,
          activeGovernorsBaseline,
        }))) ||
      (await maybeAdvancePoolProposalToVoteCanonical(context.env, {
        proposalId: input.payload.proposalId,
        counts,
        activeGovernorsBaseline,
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

    if (created) {
      await incrementEraUserActivity(context.env, {
        address: session.address,
        delta: { poolVotes: 1 },
      }).catch(() => {});
    }

    return jsonResponse(response);
  }

  if (input.type === "formation.join") {
    if (!readModels) return errorResponse(500, "Read models store unavailable");
    const wouldCount = !(await isFormationTeamMember(context.env, {
      proposalId: input.payload.proposalId,
      memberAddress: session.address,
    }));
    const quotaError = await enforceEraQuota({
      kind: "formationActions",
      wouldCount,
    });
    if (quotaError) return quotaError;

    let summary;
    let created = false;
    try {
      const result = await joinFormationProject(context.env, readModels, {
        proposalId: input.payload.proposalId,
        memberAddress: session.address,
        role: input.payload.role ?? null,
      });
      summary = result.summary;
      created = result.created;
    } catch (error) {
      const message = (error as Error).message;
      if (message === "team_full")
        return errorResponse(409, "Formation team is full");
      return errorResponse(400, "Unable to join formation project", {
        code: message,
      });
    }

    const response = {
      ok: true as const,
      type: input.type,
      proposalId: input.payload.proposalId,
      teamSlots: { filled: summary.teamFilled, total: summary.teamTotal },
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
      stage: "build",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `formation-join:${input.payload.proposalId}:${session.address}:${Date.now()}`,
        title: "Joined formation project",
        meta: "Formation",
        stage: "build",
        summaryPill: "Joined",
        summary: "Joined the formation project team (mock).",
        stats: [
          {
            label: "Team slots",
            value: `${summary.teamFilled} / ${summary.teamTotal}`,
          },
        ],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${input.payload.proposalId}/formation`,
        timestamp: new Date().toISOString(),
      },
    });

    if (created) {
      await incrementEraUserActivity(context.env, {
        address: session.address,
        delta: { formationActions: 1 },
      }).catch(() => {});
    }

    return jsonResponse(response);
  }

  if (input.type === "formation.milestone.submit") {
    if (!readModels) return errorResponse(500, "Read models store unavailable");
    const status = await getFormationMilestoneStatus(context.env, readModels, {
      proposalId: input.payload.proposalId,
      milestoneIndex: input.payload.milestoneIndex,
    }).catch(() => null);
    const wouldCount =
      status !== null && status !== "submitted" && status !== "unlocked";
    const quotaError = await enforceEraQuota({
      kind: "formationActions",
      wouldCount,
    });
    if (quotaError) return quotaError;

    let summary;
    let created = false;
    try {
      const result = await submitFormationMilestone(context.env, readModels, {
        proposalId: input.payload.proposalId,
        milestoneIndex: input.payload.milestoneIndex,
        actorAddress: session.address,
        note: input.payload.note ?? null,
      });
      summary = result.summary;
      created = result.created;
    } catch (error) {
      const message = (error as Error).message;
      if (message === "milestone_out_of_range")
        return errorResponse(400, "Milestone index is out of range");
      if (message === "milestone_already_unlocked")
        return errorResponse(409, "Milestone is already unlocked");
      return errorResponse(400, "Unable to submit milestone", {
        code: message,
      });
    }

    const response = {
      ok: true as const,
      type: input.type,
      proposalId: input.payload.proposalId,
      milestoneIndex: input.payload.milestoneIndex,
      milestones: {
        completed: summary.milestonesCompleted,
        total: summary.milestonesTotal,
      },
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
      stage: "build",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `formation-milestone-submit:${input.payload.proposalId}:${input.payload.milestoneIndex}:${Date.now()}`,
        title: "Milestone submitted",
        meta: "Formation",
        stage: "build",
        summaryPill: `M${input.payload.milestoneIndex}`,
        summary: "Submitted a milestone deliverable for review (mock).",
        stats: [
          {
            label: "Milestones",
            value: `${summary.milestonesCompleted} / ${summary.milestonesTotal}`,
          },
        ],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${input.payload.proposalId}/formation`,
        timestamp: new Date().toISOString(),
      },
    });

    if (created) {
      await incrementEraUserActivity(context.env, {
        address: session.address,
        delta: { formationActions: 1 },
      }).catch(() => {});
    }

    return jsonResponse(response);
  }

  if (input.type === "formation.milestone.requestUnlock") {
    if (!readModels) return errorResponse(500, "Read models store unavailable");
    const quotaError = await enforceEraQuota({
      kind: "formationActions",
      wouldCount: true,
    });
    if (quotaError) return quotaError;

    let summary;
    let created = false;
    try {
      const result = await requestFormationMilestoneUnlock(
        context.env,
        readModels,
        {
          proposalId: input.payload.proposalId,
          milestoneIndex: input.payload.milestoneIndex,
          actorAddress: session.address,
        },
      );
      summary = result.summary;
      created = result.created;
    } catch (error) {
      const message = (error as Error).message;
      if (message === "milestone_out_of_range")
        return errorResponse(400, "Milestone index is out of range");
      if (message === "milestone_not_submitted")
        return errorResponse(409, "Milestone must be submitted first");
      if (message === "milestone_already_unlocked")
        return errorResponse(409, "Milestone is already unlocked");
      return errorResponse(400, "Unable to request unlock", { code: message });
    }

    const response = {
      ok: true as const,
      type: input.type,
      proposalId: input.payload.proposalId,
      milestoneIndex: input.payload.milestoneIndex,
      milestones: {
        completed: summary.milestonesCompleted,
        total: summary.milestonesTotal,
      },
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
      stage: "build",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `formation-milestone-unlock:${input.payload.proposalId}:${input.payload.milestoneIndex}:${Date.now()}`,
        title: "Milestone unlocked",
        meta: "Formation",
        stage: "build",
        summaryPill: `M${input.payload.milestoneIndex}`,
        summary: "Milestone marked as unlocked (mock).",
        stats: [
          {
            label: "Milestones",
            value: `${summary.milestonesCompleted} / ${summary.milestonesTotal}`,
          },
        ],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${input.payload.proposalId}/formation`,
        timestamp: new Date().toISOString(),
      },
    });

    if (created) {
      await incrementEraUserActivity(context.env, {
        address: session.address,
        delta: { formationActions: 1 },
      }).catch(() => {});
    }

    return jsonResponse(response);
  }

  if (input.type === "court.case.report") {
    if (!readModels) return errorResponse(500, "Read models store unavailable");
    const wouldCount = !(await hasCourtReport(context.env, {
      caseId: input.payload.caseId,
      reporterAddress: session.address,
    }));
    const quotaError = await enforceEraQuota({
      kind: "courtActions",
      wouldCount,
    });
    if (quotaError) return quotaError;

    let overlay;
    let created = false;
    try {
      const result = await reportCourtCase(context.env, readModels, {
        caseId: input.payload.caseId,
        reporterAddress: session.address,
      });
      overlay = result.overlay;
      created = result.created;
    } catch (error) {
      const code = (error as Error).message;
      if (code === "court_case_missing")
        return errorResponse(404, "Unknown case");
      return errorResponse(400, "Unable to report case", { code });
    }

    const response = {
      ok: true as const,
      type: input.type,
      caseId: input.payload.caseId,
      reports: overlay.reports,
      status: overlay.status,
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
      stage: "courts",
      actorAddress: session.address,
      entityType: "court_case",
      entityId: input.payload.caseId,
      payload: {
        id: `court-report:${input.payload.caseId}:${session.address}:${Date.now()}`,
        title: "Court case reported",
        meta: "Courts",
        stage: "courts",
        summaryPill: "Report",
        summary: "Filed a report for a court case (mock).",
        stats: [{ label: "Reports", value: String(overlay.reports) }],
        ctaPrimary: "Open courtroom",
        href: `/app/courts/${input.payload.caseId}`,
        timestamp: new Date().toISOString(),
      },
    });

    if (created) {
      await incrementEraUserActivity(context.env, {
        address: session.address,
        delta: { courtActions: 1 },
      }).catch(() => {});
    }

    return jsonResponse(response);
  }

  if (input.type === "court.case.verdict") {
    if (!readModels) return errorResponse(500, "Read models store unavailable");
    const wouldCount = !(await hasCourtVerdict(context.env, {
      caseId: input.payload.caseId,
      voterAddress: session.address,
    }));
    const quotaError = await enforceEraQuota({
      kind: "courtActions",
      wouldCount,
    });
    if (quotaError) return quotaError;

    let overlay;
    let created = false;
    try {
      const result = await castCourtVerdict(context.env, readModels, {
        caseId: input.payload.caseId,
        voterAddress: session.address,
        verdict: input.payload.verdict,
      });
      overlay = result.overlay;
      created = result.created;
    } catch (error) {
      const code = (error as Error).message;
      if (code === "court_case_missing")
        return errorResponse(404, "Unknown case");
      if (code === "case_not_live")
        return errorResponse(409, "Case is not live");
      return errorResponse(400, "Unable to cast verdict", { code });
    }

    const response = {
      ok: true as const,
      type: input.type,
      caseId: input.payload.caseId,
      verdict: input.payload.verdict,
      status: overlay.status,
      totals: {
        guilty: overlay.verdicts.guilty,
        notGuilty: overlay.verdicts.notGuilty,
      },
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
      stage: "courts",
      actorAddress: session.address,
      entityType: "court_case",
      entityId: input.payload.caseId,
      payload: {
        id: `court-verdict:${input.payload.caseId}:${session.address}:${Date.now()}`,
        title: "Verdict cast",
        meta: "Courtroom",
        stage: "courts",
        summaryPill:
          input.payload.verdict === "guilty" ? "Guilty" : "Not guilty",
        summary: "Cast a verdict in a courtroom session (mock).",
        stats: [
          { label: "Guilty", value: String(overlay.verdicts.guilty) },
          { label: "Not guilty", value: String(overlay.verdicts.notGuilty) },
        ],
        ctaPrimary: "Open courtroom",
        href: `/app/courts/${input.payload.caseId}`,
        timestamp: new Date().toISOString(),
      },
    });

    if (created) {
      await incrementEraUserActivity(context.env, {
        address: session.address,
        delta: { courtActions: 1 },
      }).catch(() => {});
    }

    return jsonResponse(response);
  }

  if (input.type !== "chamber.vote") {
    return errorResponse(400, "Unsupported command");
  }

  const proposal = await getProposal(context.env, input.payload.proposalId);
  if (
    proposal &&
    stageWindowsEnabled(context.env) &&
    proposal.stage === "vote"
  ) {
    const now = getSimNow(context.env);
    const windowSeconds = getStageWindowSeconds(context.env, "vote");
    if (
      !isStageOpen({
        now,
        stageStartedAt: proposal.updatedAt,
        windowSeconds,
      })
    ) {
      return errorResponse(409, "Voting window ended", {
        code: "stage_closed",
        stage: "vote",
        endedAt: getStageDeadlineIso({
          stageStartedAt: proposal.updatedAt,
          windowSeconds,
        }),
        timeLeft: formatTimeLeftDaysHours(
          getStageRemainingSeconds({
            now,
            stageStartedAt: proposal.updatedAt,
            windowSeconds,
          }),
        ),
      });
    }
  }

  if (input.payload.choice !== "yes" && input.payload.score !== undefined) {
    return errorResponse(400, "Score is only allowed for yes votes");
  }

  const wouldCount = !(await hasChamberVote(context.env, {
    proposalId: input.payload.proposalId,
    voterAddress: session.address,
  }));
  const quotaError = await enforceEraQuota({
    kind: "chamberVotes",
    wouldCount,
  });
  if (quotaError) return quotaError;

  const choice =
    input.payload.choice === "yes" ? 1 : input.payload.choice === "no" ? -1 : 0;
  const { counts, created } = await castChamberVote(context.env, {
    proposalId: input.payload.proposalId,
    voterAddress: session.address,
    choice,
    score:
      input.payload.choice === "yes" ? (input.payload.score ?? null) : null,
  });

  const response = {
    ok: true as const,
    type: input.type,
    proposalId: input.payload.proposalId,
    choice: input.payload.choice,
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
    stage: "vote",
    actorAddress: session.address,
    entityType: "proposal",
    entityId: input.payload.proposalId,
    payload: {
      id: `chamber-vote:${input.payload.proposalId}:${session.address}:${Date.now()}`,
      title: "Chamber vote cast",
      meta: "Chamber vote",
      stage: "vote",
      summaryPill:
        input.payload.choice === "yes"
          ? "Yes"
          : input.payload.choice === "no"
            ? "No"
            : "Abstain",
      summary: "Recorded a vote in chamber stage.",
      stats: [
        { label: "Yes", value: String(counts.yes) },
        { label: "No", value: String(counts.no) },
        { label: "Abstain", value: String(counts.abstain) },
      ],
      ctaPrimary: "Open proposal",
      href: `/app/proposals/${input.payload.proposalId}/chamber`,
      timestamp: new Date().toISOString(),
    },
  });

  const advanced =
    (readModels &&
      (await maybeAdvanceVoteProposalToBuild(context.env, readModels, {
        proposalId: input.payload.proposalId,
        counts,
        activeGovernorsBaseline,
      }))) ||
    (await maybeAdvanceVoteProposalToBuildCanonical(context.env, readModels, {
      proposalId: input.payload.proposalId,
      counts,
      activeGovernorsBaseline,
    }));

  if (advanced) {
    const avgScore =
      (await getChamberYesScoreAverage(
        context.env,
        input.payload.proposalId,
      )) ?? null;
    await appendFeedItemEvent(context.env, {
      stage: "build",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `vote-pass:${input.payload.proposalId}:${Date.now()}`,
        title: "Proposal passed",
        meta: "Formation",
        stage: "build",
        summaryPill: "Passed",
        summary: "Chamber vote passed; proposal moved to Formation.",
        stats: [
          ...(avgScore !== null
            ? [{ label: "Avg CM", value: avgScore.toFixed(1) }]
            : []),
          { label: "Yes", value: String(counts.yes) },
          {
            label: "Engaged",
            value: String(counts.yes + counts.no + counts.abstain),
          },
        ],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${input.payload.proposalId}/formation`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (created) {
    await incrementEraUserActivity(context.env, {
      address: session.address,
      delta: { chamberVotes: 1 },
    }).catch(() => {});
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
  input: {
    proposalId: string;
    counts: { upvotes: number; downvotes: number };
    activeGovernorsBaseline: number | null;
  },
): Promise<boolean> {
  if (!store.set) return false;

  const poolPayload = await store.get(`proposals:${input.proposalId}:pool`);
  if (!isRecord(poolPayload)) return false;
  const attentionQuorum = poolPayload.attentionQuorum;
  const activeGovernors =
    typeof input.activeGovernorsBaseline === "number"
      ? input.activeGovernorsBaseline
      : poolPayload.activeGovernors;
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

async function maybeAdvancePoolProposalToVoteCanonical(
  env: Record<string, string | undefined>,
  input: {
    proposalId: string;
    counts: { upvotes: number; downvotes: number };
    activeGovernorsBaseline: number | null;
  },
): Promise<boolean> {
  const proposal = await getProposal(env, input.proposalId);
  if (!proposal) return false;
  if (proposal.stage !== "pool") return false;

  const activeGovernors =
    typeof input.activeGovernorsBaseline === "number"
      ? input.activeGovernorsBaseline
      : V1_ACTIVE_GOVERNORS_FALLBACK;

  const shouldAdvance = shouldAdvancePoolToVote({
    activeGovernors,
    counts: input.counts,
  });
  if (!shouldAdvance) return false;

  return transitionProposalStage(env, {
    proposalId: input.proposalId,
    from: "pool",
    to: "vote",
  });
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
    attentionQuorum: V1_CHAMBER_QUORUM_FRACTION,
    passingRule: `≥${(V1_CHAMBER_PASSING_FRACTION * 100).toFixed(1)}% + 1 yes within quorum`,
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
      tone: yesPct >= V1_CHAMBER_PASSING_FRACTION * 100 ? "ok" : "warn",
    },
    { title: "Time left", description: "Voting window", value: timeLeft },
  ];
}

async function maybeAdvanceVoteProposalToBuild(
  env: Record<string, string | undefined>,
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  input: {
    proposalId: string;
    counts: { yes: number; no: number; abstain: number };
    activeGovernorsBaseline: number | null;
  },
): Promise<boolean> {
  if (!store.set) return false;

  const chamberPayload = await store.get(
    `proposals:${input.proposalId}:chamber`,
  );
  if (!isRecord(chamberPayload)) return false;

  const attentionQuorum = chamberPayload.attentionQuorum;
  const activeGovernors =
    typeof input.activeGovernorsBaseline === "number"
      ? input.activeGovernorsBaseline
      : chamberPayload.activeGovernors;
  const formationEligible = chamberPayload.formationEligible;
  if (
    typeof attentionQuorum !== "number" ||
    typeof activeGovernors !== "number" ||
    typeof formationEligible !== "boolean"
  ) {
    return false;
  }

  const quorum = evaluateChamberQuorum(
    {
      quorumFraction: attentionQuorum,
      activeGovernors,
      passingFraction: V1_CHAMBER_PASSING_FRACTION,
    },
    input.counts,
  );
  if (!quorum.shouldAdvance) return false;
  if (!formationEligible) return false;

  const listPayload = await store.get("proposals:list");
  if (!isRecord(listPayload)) return false;
  const items = listPayload.items;
  if (!Array.isArray(items)) return false;

  await ensureFormationProposalPage(store, input.proposalId, chamberPayload);
  await ensureFormationSeed(env, store, input.proposalId);

  let changed = false;
  const nextItems = items.map((item) => {
    if (!isRecord(item) || item.id !== input.proposalId) return item;
    if (item.stage !== "vote") return item;
    changed = true;
    return { ...item, stage: "build", summaryPill: "Formation" };
  });
  if (!changed) return false;

  await store.set("proposals:list", { ...listPayload, items: nextItems });

  const proposerId = asString(chamberPayload.proposerId, "");
  const chamberLabel = asString(chamberPayload.chamber, "");
  const chamberId = normalizeChamberId(chamberLabel);
  const multiplierTimes10 = await getChamberMultiplierTimes10(store, chamberId);
  const avgScore =
    (await getChamberYesScoreAverage(env, input.proposalId)) ?? null;

  if (proposerId && avgScore !== null) {
    const lcmPoints = Math.round(avgScore * 10);
    const mcmPoints = Math.round((lcmPoints * multiplierTimes10) / 10);
    await awardCmOnce(env, {
      proposalId: input.proposalId,
      proposerId,
      chamberId,
      avgScore,
      lcmPoints,
      chamberMultiplierTimes10: multiplierTimes10,
      mcmPoints,
    });
  }

  return true;
}

async function maybeAdvanceVoteProposalToBuildCanonical(
  env: Record<string, string | undefined>,
  store: Awaited<ReturnType<typeof createReadModelsStore>> | null,
  input: {
    proposalId: string;
    counts: { yes: number; no: number; abstain: number };
    activeGovernorsBaseline: number | null;
  },
): Promise<boolean> {
  const proposal = await getProposal(env, input.proposalId);
  if (!proposal) return false;
  if (proposal.stage !== "vote") return false;

  const activeGovernors =
    typeof input.activeGovernorsBaseline === "number"
      ? input.activeGovernorsBaseline
      : V1_ACTIVE_GOVERNORS_FALLBACK;

  const shouldAdvance = shouldAdvanceVoteToBuild({
    activeGovernors,
    counts: input.counts,
  });
  if (!shouldAdvance) return false;

  if (!getFormationEligibleFromProposalPayload(proposal.payload)) return false;

  const transitioned = await transitionProposalStage(env, {
    proposalId: input.proposalId,
    from: "vote",
    to: "build",
  });
  if (!transitioned) return false;

  const seed = buildV1FormationSeedFromProposalPayload(proposal.payload);
  await ensureFormationSeedFromInput(env, {
    proposalId: input.proposalId,
    seed,
  });

  const avgScore =
    (await getChamberYesScoreAverage(env, input.proposalId)) ?? null;
  const chamberId = (proposal.chamberId ?? "general").toLowerCase();
  const multiplierTimes10 = store
    ? await getChamberMultiplierTimes10(store, chamberId)
    : 10;

  if (avgScore !== null) {
    const lcmPoints = Math.round(avgScore * 10);
    const mcmPoints = Math.round((lcmPoints * multiplierTimes10) / 10);
    await awardCmOnce(env, {
      proposalId: input.proposalId,
      proposerId: proposal.authorAddress,
      chamberId,
      avgScore,
      lcmPoints,
      chamberMultiplierTimes10: multiplierTimes10,
      mcmPoints,
    });
  }

  return true;
}

function getFormationEligibleFromProposalPayload(payload: unknown): boolean {
  if (!isRecord(payload)) return true;
  if (typeof payload.formationEligible === "boolean")
    return payload.formationEligible;
  if (typeof payload.formation === "boolean") return payload.formation;
  return true;
}

async function ensureFormationProposalPage(
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  proposalId: string,
  chamberPayload: Record<string, unknown>,
): Promise<void> {
  const existing = await store.get(`proposals:${proposalId}:formation`);
  if (existing) return;
  if (!store.set) return;
  await store.set(
    `proposals:${proposalId}:formation`,
    buildFormationProposalPageFromChamber(chamberPayload),
  );
}

function buildFormationProposalPageFromChamber(
  chamberPayload: Record<string, unknown>,
): Record<string, unknown> {
  return {
    title: asString(chamberPayload.title, "Proposal"),
    chamber: asString(chamberPayload.chamber, "General chamber"),
    proposer: asString(chamberPayload.proposer, "Unknown"),
    proposerId: asString(chamberPayload.proposerId, "unknown"),
    budget: asString(chamberPayload.budget, "—"),
    timeLeft: "12w",
    teamSlots: asString(chamberPayload.teamSlots, "0 / 0"),
    milestones: asString(chamberPayload.milestones, "0 / 0"),
    progress: "0%",
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "0 / —" },
      { title: "Team slots", description: "Filled / Total", value: "0 / —" },
      { title: "Milestones", description: "Completed / Total", value: "0 / —" },
    ],
    stats: [{ label: "Lead chamber", value: asString(chamberPayload.chamber) }],
    lockedTeam: asArray(chamberPayload.teamLocked),
    openSlots: asArray(chamberPayload.openSlotNeeds),
    milestonesDetail: asArray(chamberPayload.milestonesDetail),
    attachments: asArray(chamberPayload.attachments),
    summary: asString(chamberPayload.summary, ""),
    overview: asString(chamberPayload.overview, ""),
    executionPlan: asArray(chamberPayload.executionPlan),
    budgetScope: asString(chamberPayload.budgetScope, ""),
    invisionInsight: isRecord(chamberPayload.invisionInsight)
      ? chamberPayload.invisionInsight
      : { role: "—", bullets: [] },
  };
}

function normalizeChamberId(chamberLabel: string): string {
  const match = chamberLabel.trim().match(/^([A-Za-z]+)/);
  return (match?.[1] ?? chamberLabel).toLowerCase();
}

async function getChamberMultiplierTimes10(
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  chamberId: string,
): Promise<number> {
  const payload = await store.get("chambers:list");
  if (!isRecord(payload)) return 10;
  const items = payload.items;
  if (!Array.isArray(items)) return 10;
  const entry = items.find(
    (item) =>
      isRecord(item) &&
      (item.id === chamberId ||
        (typeof item.name === "string" &&
          item.name.toLowerCase() === chamberId)),
  );
  if (!isRecord(entry)) return 10;
  const mult = entry.multiplier;
  if (typeof mult !== "number") return 10;
  return Math.round(mult * 10);
}
