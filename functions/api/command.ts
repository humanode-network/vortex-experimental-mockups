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
import { appendProposalTimelineItem } from "../_lib/proposalTimelineStore.ts";
import { createReadModelsStore } from "../_lib/readModelsStore.ts";
import { evaluatePoolQuorum } from "../_lib/poolQuorum.ts";
import {
  castChamberVote,
  getChamberYesScoreAverage,
  clearChamberVotesForProposal,
} from "../_lib/chamberVotesStore.ts";
import { evaluateChamberQuorum } from "../_lib/chamberQuorum.ts";
import { awardCmOnce, hasLcmHistoryInChamber } from "../_lib/cmAwardsStore.ts";
import {
  joinFormationProject,
  ensureFormationSeed,
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
  setProposalVotePendingVeto,
  getProposal,
  transitionProposalStage,
  applyProposalVeto,
} from "../_lib/proposalsStore.ts";
import {
  captureProposalStageDenominator,
  getProposalStageDenominator,
} from "../_lib/proposalStageDenominatorsStore.ts";
import { clearDelegation, setDelegation } from "../_lib/delegationsStore.ts";
import {
  ensureChamberMembership,
  hasAnyChamberMembership,
  hasChamberMembership,
} from "../_lib/chamberMembershipsStore.ts";
import { getActiveGovernorsDenominatorForChamberCurrentEra } from "../_lib/chamberActiveDenominators.ts";
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
  V1_VETO_DELAY_SECONDS_DEFAULT,
  V1_VETO_MAX_APPLIES,
} from "../_lib/v1Constants.ts";
import { computeVetoCouncilSnapshot } from "../_lib/vetoCouncilStore.ts";
import {
  castVetoVote,
  clearVetoVotesForProposal,
} from "../_lib/vetoVotesStore.ts";
import { finalizeAcceptedProposalFromVote } from "../_lib/proposalFinalizer.ts";
import {
  formatTimeLeftDaysHours,
  getSimNow,
  getStageDeadlineIso,
  getStageRemainingSeconds,
  getStageWindowSeconds,
  isStageOpen,
  stageWindowsEnabled,
} from "../_lib/stageWindows.ts";
import { envBoolean } from "../_lib/env.ts";
import { getSimConfig } from "../_lib/simConfig.ts";
import { resolveUserTierFromSimConfig } from "../_lib/userTier.ts";
import { addressesReferToSameKey } from "../_lib/address.ts";
import {
  createChamberFromAcceptedGeneralProposal,
  dissolveChamberFromAcceptedGeneralProposal,
  getChamber,
  parseChamberGovernanceFromPayload,
  setChamberMultiplierTimes10,
} from "../_lib/chambersStore.ts";
import {
  getChamberMultiplierAggregate,
  upsertChamberMultiplierSubmission,
} from "../_lib/chamberMultiplierSubmissionsStore.ts";

function getGenesisMembersForDenominators(
  simConfig: Awaited<ReturnType<typeof getSimConfig>> | null,
  chamberId: string,
): string[] | null {
  const genesis = simConfig?.genesisChamberMembers;
  if (!genesis) return null;
  const normalized = chamberId.trim().toLowerCase();
  if (normalized === "general") return Object.values(genesis).flat();
  return genesis[normalized] ?? null;
}

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

const delegationSetSchema = z.object({
  type: z.literal("delegation.set"),
  payload: z.object({
    chamberId: z.string().min(1),
    delegateeAddress: z.string().min(1),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const delegationClearSchema = z.object({
  type: z.literal("delegation.clear"),
  payload: z.object({
    chamberId: z.string().min(1),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const vetoVoteSchema = z.object({
  type: z.literal("veto.vote"),
  payload: z.object({
    proposalId: z.string().min(1),
    choice: z.enum(["veto", "keep"]),
  }),
  idempotencyKey: z.string().min(8).optional(),
});

const chamberMultiplierSubmitSchema = z.object({
  type: z.literal("chamber.multiplier.submit"),
  payload: z.object({
    chamberId: z.string().min(1),
    multiplierTimes10: z.number().int().min(1).max(100),
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
  delegationSetSchema,
  delegationClearSchema,
  vetoVoteSchema,
  chamberMultiplierSubmitSchema,
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

    const chamberId = (draft.chamberId ?? "").trim().toLowerCase();
    if (chamberId && chamberId !== "general") {
      const chamber = await getChamber(
        context.env,
        context.request.url,
        chamberId,
      );
      if (!chamber) {
        return errorResponse(400, "Unknown chamber", {
          code: "invalid_chamber",
          chamberId,
        });
      }
      if (chamber.status !== "active") {
        return errorResponse(409, "Chamber is dissolved", {
          code: "chamber_dissolved",
          chamberId,
          status: chamber.status,
          dissolvedAt: chamber.dissolvedAt?.toISOString() ?? null,
        });
      }
    }

    const meta = (() => {
      const payload = draft.payload as Record<string, unknown> | null;
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        return null;
      const mg = payload.metaGovernance;
      if (!mg || typeof mg !== "object" || Array.isArray(mg)) return null;
      const record = mg as Record<string, unknown>;
      const action = typeof record.action === "string" ? record.action : "";
      if (action !== "chamber.create" && action !== "chamber.dissolve")
        return { invalid: true as const };

      const id = typeof record.chamberId === "string" ? record.chamberId : "";
      const title = typeof record.title === "string" ? record.title : "";
      const multiplier =
        typeof record.multiplier === "number" ? record.multiplier : null;
      const genesisMembersRaw = record.genesisMembers;
      const genesisMembers = Array.isArray(genesisMembersRaw)
        ? genesisMembersRaw
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      return {
        action,
        id,
        title,
        multiplier,
        genesisMembers,
      } as const;
    })();

    if (meta?.invalid) {
      return errorResponse(400, "Invalid meta-governance payload", {
        code: "invalid_meta_governance",
      });
    }

    if (meta && meta.action) {
      if (chamberId !== "general") {
        return errorResponse(
          400,
          "Meta-governance proposals must use General chamber",
          {
            code: "meta_governance_requires_general",
          },
        );
      }

      const targetId = meta.id.trim().toLowerCase();
      if (!targetId || targetId === "general") {
        return errorResponse(400, "Invalid target chamber", {
          code: "invalid_meta_chamber",
        });
      }

      const existing = await getChamber(
        context.env,
        context.request.url,
        targetId,
      );

      if (meta.action === "chamber.create") {
        if (existing) {
          return errorResponse(409, "Chamber already exists", {
            code: "chamber_exists",
            chamberId: targetId,
            status: existing.status,
          });
        }
        if (!meta.title.trim()) {
          return errorResponse(400, "Chamber title is required", {
            code: "invalid_meta_chamber",
          });
        }
        if (meta.multiplier !== null && !(meta.multiplier > 0)) {
          return errorResponse(400, "Multiplier must be > 0", {
            code: "invalid_meta_chamber",
          });
        }
      } else {
        if (!existing) {
          return errorResponse(400, "Unknown chamber", {
            code: "invalid_chamber",
            chamberId: targetId,
          });
        }
        if (existing.status !== "active") {
          return errorResponse(409, "Chamber is already dissolved", {
            code: "chamber_dissolved",
            chamberId: targetId,
            status: existing.status,
            dissolvedAt: existing.dissolvedAt?.toISOString() ?? null,
          });
        }
      }
    }

    const normalizedChamberId = meta ? "general" : draft.chamberId;

    await createProposal(context.env, {
      id: proposalId,
      stage: "pool",
      authorAddress: sessionAddress,
      title: draft.title,
      chamberId: normalizedChamberId ?? null,
      summary: draft.summary,
      payload: draft.payload,
    });

    const chamber = formatChamberLabel(normalizedChamberId ?? null);
    const budgetTotal = draft.payload.budgetItems.reduce((sum, item) => {
      const n = Number(item.amount);
      if (!Number.isFinite(n) || n <= 0) return sum;
      return sum + n;
    }, 0);
    const budget =
      budgetTotal > 0 ? `${budgetTotal.toLocaleString()} HMND` : "—";

    const poolChamberId = (normalizedChamberId ?? "general")
      .trim()
      .toLowerCase();
    const simConfig = await getSimConfig(
      context.env,
      context.request.url,
    ).catch(() => null);
    const authorTier = await resolveUserTierFromSimConfig(
      simConfig,
      sessionAddress,
    );
    const genesisMembers = getGenesisMembersForDenominators(
      simConfig,
      poolChamberId,
    );
    const poolActiveGovernors =
      await getActiveGovernorsDenominatorForChamberCurrentEra(context.env, {
        chamberId: poolChamberId || "general",
        fallbackActiveGovernors:
          typeof activeGovernorsBaseline === "number"
            ? activeGovernorsBaseline
            : V1_ACTIVE_GOVERNORS_FALLBACK,
        genesisMembers,
      });
    const attentionQuorum = V1_POOL_ATTENTION_QUORUM_FRACTION;
    const upvoteFloor = computePoolUpvoteFloor(poolActiveGovernors);

    const formationEligible = getFormationEligibleFromProposalPayload(
      draft.payload,
    );

    const poolPagePayload = {
      title: draft.title,
      proposer: sessionAddress,
      proposerId: sessionAddress,
      chamber,
      focus: "—",
      tier: authorTier,
      budget,
      cooldown: "Withdraw cooldown: 12h",
      formationEligible,
      templateId: isRecord(draft.payload)
        ? draft.payload.templateId
        : undefined,
      metaGovernance: isRecord(draft.payload)
        ? draft.payload.metaGovernance
        : undefined,
      teamSlots: "1 / 3",
      milestones: String(draft.payload.timeline.length),
      upvotes: 0,
      downvotes: 0,
      attentionQuorum,
      activeGovernors: poolActiveGovernors,
      upvoteFloor,
      rules: [
        `${Math.round(attentionQuorum * 100)}% attention from active governors required.`,
        poolActiveGovernors > 0
          ? `At least ${Math.round((upvoteFloor / poolActiveGovernors) * 100)}% upvotes to move to chamber vote.`
          : "At least 0% upvotes to move to chamber vote.",
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
      meta: `${chamber} · ${authorTier} tier`,
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
        { label: "Formation", value: formationEligible ? "Yes" : "No" },
      ],
      proposer: sessionAddress,
      proposerId: sessionAddress,
      chamber,
      tier: authorTier,
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

    await captureProposalStageDenominator(context.env, {
      proposalId,
      stage: "pool",
      activeGovernors: poolActiveGovernors,
    }).catch(() => {});

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

    await appendProposalTimelineItem(context.env, {
      proposalId,
      stage: "pool",
      actorAddress: sessionAddress,
      item: {
        id: `timeline:proposal-submitted:${proposalId}:${randomHex(4)}`,
        type: "proposal.submitted",
        title: "Proposal submitted",
        detail: `Submitted to ${chamber}`,
        actor: sessionAddress,
        timestamp: new Date().toISOString(),
      },
    });

    return jsonResponse(response);
  }

  if (input.type === "delegation.set") {
    const chamberId = input.payload.chamberId.trim().toLowerCase();
    const delegateeAddress = input.payload.delegateeAddress.trim();

    const isDelegatorEligible =
      chamberId === "general"
        ? await hasAnyChamberMembership(context.env, sessionAddress)
        : await hasChamberMembership(context.env, {
            address: sessionAddress,
            chamberId,
          });
    if (!isDelegatorEligible) {
      return errorResponse(400, "Delegator is not eligible for delegation", {
        code: "delegator_not_eligible",
        chamberId,
      });
    }

    const isDelegateeEligible =
      chamberId === "general"
        ? await hasAnyChamberMembership(context.env, delegateeAddress)
        : await hasChamberMembership(context.env, {
            address: delegateeAddress,
            chamberId,
          });
    if (!isDelegateeEligible) {
      return errorResponse(400, "Delegatee is not eligible for delegation", {
        code: "delegatee_not_eligible",
        chamberId,
      });
    }

    let record;
    try {
      record = await setDelegation(context.env, {
        chamberId,
        delegatorAddress: sessionAddress,
        delegateeAddress,
      });
    } catch (error) {
      const code = (error as Error).message;
      return errorResponse(400, "Unable to set delegation", { code });
    }

    const response = {
      ok: true as const,
      type: input.type,
      chamberId: record.chamberId,
      delegatorAddress: record.delegatorAddress,
      delegateeAddress: record.delegateeAddress,
      updatedAt: record.updatedAt,
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
      entityType: "delegation",
      entityId: `${record.chamberId}:${record.delegatorAddress}`,
      payload: {
        id: `delegation-set:${record.chamberId}:${record.delegatorAddress}:${Date.now()}`,
        title: "Delegation set",
        meta: "Delegation",
        stage: "vote",
        summaryPill: "Delegated",
        summary: `Delegated voting power in ${record.chamberId} chamber.`,
        stats: [{ label: "Delegatee", value: record.delegateeAddress }],
        ctaPrimary: "Open My Governance",
        href: "/app/my-governance",
        timestamp: new Date().toISOString(),
      },
    });

    return jsonResponse(response);
  }

  if (input.type === "delegation.clear") {
    const chamberId = input.payload.chamberId.trim().toLowerCase();

    let cleared;
    try {
      cleared = await clearDelegation(context.env, {
        chamberId,
        delegatorAddress: sessionAddress,
      });
    } catch (error) {
      const code = (error as Error).message;
      return errorResponse(400, "Unable to clear delegation", { code });
    }

    const response = {
      ok: true as const,
      type: input.type,
      chamberId,
      delegatorAddress: sessionAddress,
      cleared: cleared.cleared,
    };

    if (idempotencyKey) {
      await storeIdempotencyResponse(context.env, {
        key: idempotencyKey,
        address: session.address,
        request: requestForIdem,
        response,
      });
    }

    return jsonResponse(response);
  }

  if (input.type === "chamber.multiplier.submit") {
    const chamberId = input.payload.chamberId.trim().toLowerCase();
    const multiplierTimes10 = input.payload.multiplierTimes10;

    const chamber = await getChamber(
      context.env,
      context.request.url,
      chamberId,
    );
    if (!chamber) {
      return errorResponse(400, "Unknown chamber", {
        code: "invalid_chamber",
        chamberId,
      });
    }
    if (chamber.status !== "active") {
      return errorResponse(409, "Chamber is dissolved", {
        code: "chamber_dissolved",
        chamberId,
      });
    }

    const simConfig = await getSimConfig(context.env, context.request.url);
    const genesis = simConfig?.genesisChamberMembers ?? null;
    const hasGenesisMembership = (() => {
      if (!genesis) return false;
      for (const list of Object.values(genesis)) {
        if (list.some((addr) => addr.trim() === sessionAddress)) return true;
      }
      return false;
    })();

    const isGovernor =
      hasGenesisMembership ||
      (await hasAnyChamberMembership(context.env, sessionAddress));
    if (!isGovernor) {
      return errorResponse(403, "Only governors can set chamber multipliers", {
        code: "not_governor",
      });
    }

    const hasLcmHere = await hasLcmHistoryInChamber(context.env, {
      proposerId: sessionAddress,
      chamberId,
    });
    if (hasLcmHere) {
      return errorResponse(400, "Multiplier voting is outsiders-only", {
        code: "multiplier_outsider_required",
        chamberId,
      });
    }

    const { submission } = await upsertChamberMultiplierSubmission(
      context.env,
      {
        chamberId,
        voterAddress: sessionAddress,
        multiplierTimes10,
      },
    );

    const aggregate = await getChamberMultiplierAggregate(context.env, {
      chamberId,
    });

    const applied =
      typeof aggregate.avgTimes10 === "number"
        ? await setChamberMultiplierTimes10(context.env, context.request.url, {
            id: chamberId,
            multiplierTimes10: aggregate.avgTimes10,
          })
        : null;

    const response = {
      ok: true as const,
      type: input.type,
      chamberId,
      submission: {
        multiplierTimes10: submission.multiplierTimes10,
      },
      aggregate,
      applied: applied
        ? {
            updated: applied.updated,
            prevMultiplierTimes10: applied.prevTimes10,
            nextMultiplierTimes10: applied.nextTimes10,
          }
        : null,
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
      actorAddress: sessionAddress,
      entityType: "chamber",
      entityId: `multiplier:${chamberId}`,
      payload: {
        id: `chamber-multiplier-submit:${chamberId}:${sessionAddress}:${Date.now()}`,
        title: "Multiplier submitted",
        meta: "Chambers · CM",
        stage: "vote",
        summaryPill: "Multiplier",
        summary: `Submitted a chamber multiplier for ${chamberId}.`,
        stats: [
          { label: "Submitted", value: String(submission.multiplierTimes10) },
          ...(typeof aggregate.avgTimes10 === "number"
            ? [{ label: "Avg", value: String(aggregate.avgTimes10) }]
            : []),
        ],
        ctaPrimary: "Open chambers",
        href: "/app/chambers",
        timestamp: new Date().toISOString(),
      },
    });

    return jsonResponse(response);
  }

  if (input.type === "veto.vote") {
    const proposalId = input.payload.proposalId;
    const proposal = await getProposal(context.env, proposalId);
    if (!proposal) return errorResponse(404, "Unknown proposal");
    if (proposal.stage !== "vote") {
      return errorResponse(409, "Proposal is not in chamber vote stage", {
        code: "stage_invalid",
        stage: proposal.stage,
      });
    }

    const now = getSimNow(context.env);
    if (!proposal.votePassedAt || !proposal.voteFinalizesAt) {
      return errorResponse(409, "No veto window is open for this proposal", {
        code: "veto_not_open",
      });
    }
    if (now.getTime() >= proposal.voteFinalizesAt.getTime()) {
      return errorResponse(409, "Veto window ended", {
        code: "veto_window_ended",
        finalizesAt: proposal.voteFinalizesAt.toISOString(),
      });
    }

    const council = proposal.vetoCouncil ?? [];
    const threshold = proposal.vetoThreshold ?? 0;
    if (council.length === 0 || threshold <= 0) {
      return errorResponse(409, "Veto is not enabled for this proposal", {
        code: "veto_disabled",
      });
    }
    if (!council.includes(sessionAddress)) {
      return errorResponse(403, "Not eligible to cast a veto vote", {
        code: "not_veto_holder",
      });
    }

    const { counts, created } = await castVetoVote(context.env, {
      proposalId,
      voterAddress: sessionAddress,
      choice: input.payload.choice,
    });

    const response = {
      ok: true as const,
      type: input.type,
      proposalId,
      choice: input.payload.choice,
      counts,
      threshold,
    };

    if (idempotencyKey) {
      await storeIdempotencyResponse(context.env, {
        key: idempotencyKey,
        address: session.address,
        request: requestForIdem,
        response,
      });
    }

    await appendProposalTimelineItem(context.env, {
      proposalId,
      stage: "vote",
      actorAddress: sessionAddress,
      item: {
        id: `timeline:veto-vote:${proposalId}:${sessionAddress}:${randomHex(4)}`,
        type: "veto.vote",
        title: "Veto vote cast",
        detail: input.payload.choice === "veto" ? "Veto" : "Keep",
        actor: sessionAddress,
        timestamp: now.toISOString(),
      },
    });

    if (counts.veto >= threshold) {
      await clearVetoVotesForProposal(context.env, proposalId).catch(() => {});
      await clearChamberVotesForProposal(context.env, proposalId).catch(
        () => {},
      );

      const nextVoteStartsAt = new Date(
        now.getTime() + V1_VETO_DELAY_SECONDS_DEFAULT * 1000,
      );
      await applyProposalVeto(context.env, { proposalId, nextVoteStartsAt });

      await appendFeedItemEvent(context.env, {
        stage: "vote",
        actorAddress: session.address,
        entityType: "proposal",
        entityId: proposalId,
        payload: {
          id: `veto-applied:${proposalId}:${Date.now()}`,
          title: "Veto applied",
          meta: "Veto",
          stage: "vote",
          summaryPill: "Vetoed",
          summary:
            "Veto threshold met; chamber vote is reset and voting is paused.",
          stats: [
            { label: "Veto votes", value: `${counts.veto} / ${threshold}` },
          ],
          ctaPrimary: "Open proposal",
          href: `/app/proposals/${proposalId}/chamber`,
          timestamp: now.toISOString(),
        },
      });

      await appendProposalTimelineItem(context.env, {
        proposalId,
        stage: "vote",
        actorAddress: null,
        item: {
          id: `timeline:veto-applied:${proposalId}:${randomHex(4)}`,
          type: "veto.applied",
          title: "Veto applied",
          detail: `Voting resumes at ${nextVoteStartsAt.toISOString()}`,
          actor: "system",
          timestamp: now.toISOString(),
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
  }

  if (input.type === "pool.vote") {
    const poolEligibilityError = await enforcePoolVoteEligibility(
      context.env,
      readModels,
      {
        proposalId: input.payload.proposalId,
        voterAddress: sessionAddress,
      },
      context.request.url,
    );
    if (poolEligibilityError) return poolEligibilityError;

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
          timeLeft: (() => {
            const remaining = getStageRemainingSeconds({
              now,
              stageStartedAt: proposal.updatedAt,
              windowSeconds,
            });
            return remaining === 0
              ? "Ended"
              : formatTimeLeftDaysHours(remaining);
          })(),
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

    await appendProposalTimelineItem(context.env, {
      proposalId: input.payload.proposalId,
      stage: "pool",
      actorAddress: session.address,
      item: {
        id: `timeline:pool-vote:${input.payload.proposalId}:${session.address}:${randomHex(4)}`,
        type: "pool.vote",
        title: "Pool vote cast",
        detail: input.payload.direction === "up" ? "Upvote" : "Downvote",
        actor: session.address,
        timestamp: new Date().toISOString(),
      },
    });

    const storedPoolDenominator = await getProposalStageDenominator(
      context.env,
      {
        proposalId: input.payload.proposalId,
        stage: "pool",
      },
    ).catch(() => null);
    const poolChamberId = await getProposalChamberIdForPool(
      context.env,
      readModels,
      { proposalId: input.payload.proposalId },
    );
    const simConfig = await getSimConfig(
      context.env,
      context.request.url,
    ).catch(() => null);
    const genesisMembers = getGenesisMembersForDenominators(
      simConfig,
      poolChamberId,
    );
    const poolDenominator =
      storedPoolDenominator?.activeGovernors ??
      (await getActiveGovernorsDenominatorForChamberCurrentEra(context.env, {
        chamberId: poolChamberId,
        fallbackActiveGovernors:
          typeof activeGovernorsBaseline === "number"
            ? activeGovernorsBaseline
            : V1_ACTIVE_GOVERNORS_FALLBACK,
        genesisMembers,
      }));
    if (!storedPoolDenominator) {
      await captureProposalStageDenominator(context.env, {
        proposalId: input.payload.proposalId,
        stage: "pool",
        activeGovernors: poolDenominator,
      }).catch(() => {});
    }

    const canonicalAdvanced = await maybeAdvancePoolProposalToVoteCanonical(
      context.env,
      {
        proposalId: input.payload.proposalId,
        counts,
        activeGovernors: poolDenominator,
      },
    );
    const readModelAdvanced =
      !canonicalAdvanced &&
      readModels &&
      (await maybeAdvancePoolProposalToVote(readModels, {
        proposalId: input.payload.proposalId,
        counts,
        activeGovernors: poolDenominator,
      }));
    const advanced = canonicalAdvanced || Boolean(readModelAdvanced);

    if (advanced) {
      const voteDenominator =
        await getActiveGovernorsDenominatorForChamberCurrentEra(context.env, {
          chamberId: poolChamberId,
          fallbackActiveGovernors:
            typeof activeGovernorsBaseline === "number"
              ? activeGovernorsBaseline
              : V1_ACTIVE_GOVERNORS_FALLBACK,
          genesisMembers,
        });
      await captureProposalStageDenominator(context.env, {
        proposalId: input.payload.proposalId,
        stage: "vote",
        activeGovernors: voteDenominator,
      }).catch(() => {});

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

      await appendProposalTimelineItem(context.env, {
        proposalId: input.payload.proposalId,
        stage: "vote",
        actorAddress: session.address,
        item: {
          id: `timeline:pool-advance:${input.payload.proposalId}:${randomHex(4)}`,
          type: "proposal.stage.advanced",
          title: "Advanced to chamber vote",
          detail: "Attention quorum met",
          actor: "system",
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
    const formationGate = await requireFormationEnabled(context.env, {
      proposalId: input.payload.proposalId,
    });
    if (!formationGate.ok) return formationGate.error;
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

    await appendProposalTimelineItem(context.env, {
      proposalId: input.payload.proposalId,
      stage: "build",
      actorAddress: session.address,
      item: {
        id: `timeline:formation-join:${input.payload.proposalId}:${session.address}:${randomHex(4)}`,
        type: "formation.join",
        title: "Joined formation project",
        detail: input.payload.role
          ? `Role: ${input.payload.role}`
          : "Joined as contributor",
        actor: session.address,
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
    const formationGate = await requireFormationEnabled(context.env, {
      proposalId: input.payload.proposalId,
    });
    if (!formationGate.ok) return formationGate.error;
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

    await appendProposalTimelineItem(context.env, {
      proposalId: input.payload.proposalId,
      stage: "build",
      actorAddress: session.address,
      item: {
        id: `timeline:formation-milestone-unlock:${input.payload.proposalId}:${input.payload.milestoneIndex}:${randomHex(4)}`,
        type: "formation.milestone.unlockRequested",
        title: `Unlock requested (M${input.payload.milestoneIndex})`,
        detail: "Requested unlock for milestone payout (mock)",
        actor: session.address,
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
    const formationGate = await requireFormationEnabled(context.env, {
      proposalId: input.payload.proposalId,
    });
    if (!formationGate.ok) return formationGate.error;
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
  if (proposal && proposal.stage !== "vote") {
    return errorResponse(409, "Proposal is not in chamber vote stage", {
      code: "stage_invalid",
      stage: proposal.stage,
    });
  }

  if (proposal && proposal.stage === "vote") {
    const now = getSimNow(context.env);
    if (proposal.votePassedAt && proposal.voteFinalizesAt) {
      if (now.getTime() < proposal.voteFinalizesAt.getTime()) {
        return errorResponse(409, "Vote already passed (pending veto)", {
          code: "vote_pending_veto",
          finalizesAt: proposal.voteFinalizesAt.toISOString(),
        });
      }
    }
    if (now.getTime() < proposal.updatedAt.getTime()) {
      return errorResponse(409, "Voting is paused", {
        code: "vote_paused",
        resumesAt: proposal.updatedAt.toISOString(),
      });
    }
  }

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
        timeLeft: (() => {
          const remaining = getStageRemainingSeconds({
            now,
            stageStartedAt: proposal.updatedAt,
            windowSeconds,
          });
          return remaining === 0 ? "Ended" : formatTimeLeftDaysHours(remaining);
        })(),
      });
    }
  }

  if (proposal) {
    const chamberId = (proposal.chamberId ?? "general").toLowerCase();
    if (chamberId !== "general") {
      const chamber = await getChamber(
        context.env,
        context.request.url,
        chamberId,
      );
      if (chamber?.status === "dissolved" && chamber.dissolvedAt) {
        const proposalCreatedAt = proposal.createdAt.getTime();
        const dissolvedAt = chamber.dissolvedAt.getTime();
        if (proposalCreatedAt > dissolvedAt) {
          return errorResponse(409, "Chamber is dissolved", {
            code: "chamber_dissolved",
            chamberId,
            dissolvedAt: chamber.dissolvedAt.toISOString(),
          });
        }
      }
    }
  }

  const eligibilityError = await enforceChamberVoteEligibility(
    context.env,
    readModels,
    {
      proposalId: input.payload.proposalId,
      voterAddress: session.address,
    },
    context.request.url,
  );
  if (eligibilityError) return eligibilityError;

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

  const chamberIdForVote = await getProposalChamberIdForVote(
    context.env,
    readModels,
    { proposalId: input.payload.proposalId },
  );
  const choice =
    input.payload.choice === "yes" ? 1 : input.payload.choice === "no" ? -1 : 0;
  const { counts, created } = await castChamberVote(context.env, {
    proposalId: input.payload.proposalId,
    voterAddress: session.address,
    choice,
    score:
      input.payload.choice === "yes" ? (input.payload.score ?? null) : null,
    chamberId: chamberIdForVote,
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

  await appendProposalTimelineItem(context.env, {
    proposalId: input.payload.proposalId,
    stage: "vote",
    actorAddress: session.address,
    item: {
      id: `timeline:chamber-vote:${input.payload.proposalId}:${session.address}:${randomHex(4)}`,
      type: "chamber.vote",
      title: "Chamber vote cast",
      detail:
        input.payload.choice === "yes"
          ? `Yes${input.payload.score ? ` (score ${input.payload.score})` : ""}`
          : input.payload.choice === "no"
            ? "No"
            : "Abstain",
      actor: session.address,
      timestamp: new Date().toISOString(),
    },
  });

  const storedVoteDenominator = await getProposalStageDenominator(context.env, {
    proposalId: input.payload.proposalId,
    stage: "vote",
  }).catch(() => null);
  const simConfig = await getSimConfig(context.env, context.request.url).catch(
    () => null,
  );
  const genesisMembers = getGenesisMembersForDenominators(
    simConfig,
    chamberIdForVote,
  );
  const voteDenominator =
    storedVoteDenominator?.activeGovernors ??
    (await getActiveGovernorsDenominatorForChamberCurrentEra(context.env, {
      chamberId: chamberIdForVote,
      fallbackActiveGovernors:
        typeof activeGovernorsBaseline === "number"
          ? activeGovernorsBaseline
          : V1_ACTIVE_GOVERNORS_FALLBACK,
      genesisMembers,
    }));
  if (!storedVoteDenominator) {
    await captureProposalStageDenominator(context.env, {
      proposalId: input.payload.proposalId,
      stage: "vote",
      activeGovernors: voteDenominator,
    }).catch(() => {});
  }

  const canonicalOutcome = await maybeAdvanceVoteProposalToBuildCanonical(
    context.env,
    {
      proposalId: input.payload.proposalId,
      counts,
      activeGovernors: voteDenominator,
    },
    context.request.url,
  );

  const readModelAdvanced =
    canonicalOutcome.status === "none" &&
    readModels &&
    (await maybeAdvanceVoteProposalToBuild(context.env, readModels, {
      proposalId: input.payload.proposalId,
      counts,
      activeGovernors: voteDenominator,
      requestUrl: context.request.url,
    }));

  const advanced =
    canonicalOutcome.status === "advanced" || Boolean(readModelAdvanced);

  if (canonicalOutcome.status === "pending_veto") {
    await appendFeedItemEvent(context.env, {
      stage: "vote",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `vote-pass-pending-veto:${input.payload.proposalId}:${Date.now()}`,
        title: "Proposal passed (pending veto)",
        meta: "Chamber vote",
        stage: "vote",
        summaryPill: "Passed",
        summary:
          "Chamber vote passed; the proposal is in the veto window before acceptance is finalized.",
        stats: [
          { label: "Yes", value: String(counts.yes) },
          {
            label: "Engaged",
            value: String(counts.yes + counts.no + counts.abstain),
          },
          {
            label: "Veto",
            value: `${canonicalOutcome.vetoCouncilSize} holders · ${canonicalOutcome.vetoThreshold} needed`,
          },
        ],
        ctaPrimary: "Open proposal",
        href: `/app/proposals/${input.payload.proposalId}/chamber`,
        timestamp: new Date().toISOString(),
      },
    });

    await appendProposalTimelineItem(context.env, {
      proposalId: input.payload.proposalId,
      stage: "vote",
      actorAddress: session.address,
      item: {
        id: `timeline:vote-pass-pending-veto:${input.payload.proposalId}:${randomHex(4)}`,
        type: "proposal.vote.passed",
        title: "Chamber vote passed",
        detail: `Pending veto until ${canonicalOutcome.finalizesAt}`,
        actor: "system",
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (advanced) {
    const avgScore =
      canonicalOutcome.status === "advanced"
        ? canonicalOutcome.avgScore
        : ((await getChamberYesScoreAverage(
            context.env,
            input.payload.proposalId,
          )) ?? null);
    const formationEligible =
      canonicalOutcome.status === "advanced"
        ? canonicalOutcome.formationEligible
        : await (async () => {
            if (!readModels) return true;
            const chamberPayload = await readModels.get(
              `proposals:${input.payload.proposalId}:chamber`,
            );
            if (isRecord(chamberPayload)) {
              const meta = parseChamberGovernanceFromPayload(chamberPayload);
              if (meta) return false;
              if (typeof chamberPayload.formationEligible === "boolean") {
                return chamberPayload.formationEligible;
              }
            }
            const poolPayload = await readModels.get(
              `proposals:${input.payload.proposalId}:pool`,
            );
            if (isRecord(poolPayload)) {
              const meta = parseChamberGovernanceFromPayload(poolPayload);
              if (meta) return false;
              if (typeof poolPayload.formationEligible === "boolean") {
                return poolPayload.formationEligible;
              }
            }
            return true;
          })();

    await appendFeedItemEvent(context.env, {
      stage: "build",
      actorAddress: session.address,
      entityType: "proposal",
      entityId: input.payload.proposalId,
      payload: {
        id: `vote-pass:${input.payload.proposalId}:${Date.now()}`,
        title: "Proposal accepted",
        meta: "Chamber vote",
        stage: "build",
        summaryPill: "Accepted",
        summary: "Chamber vote finalized; proposal is now accepted.",
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
        href: formationEligible
          ? `/app/proposals/${input.payload.proposalId}/formation`
          : `/app/proposals/${input.payload.proposalId}/chamber`,
        timestamp: new Date().toISOString(),
      },
    });

    await appendProposalTimelineItem(context.env, {
      proposalId: input.payload.proposalId,
      stage: "build",
      actorAddress: session.address,
      item: {
        id: `timeline:vote-pass:${input.payload.proposalId}:${randomHex(4)}`,
        type: "proposal.stage.advanced",
        title: "Advanced to accepted",
        detail: "Chamber vote finalized",
        actor: "system",
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
    activeGovernors: number;
  },
): Promise<boolean> {
  if (!store.set) return false;

  const poolPayload = await store.get(`proposals:${input.proposalId}:pool`);
  if (!isRecord(poolPayload)) return false;
  const attentionQuorum = poolPayload.attentionQuorum;
  const activeGovernors = input.activeGovernors;
  const upvoteFloor = computePoolUpvoteFloor(activeGovernors);
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
    {
      activeGovernors,
    },
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
    activeGovernors: number;
  },
): Promise<boolean> {
  const proposal = await getProposal(env, input.proposalId);
  if (!proposal) return false;
  if (proposal.stage !== "pool") return false;

  const shouldAdvance = shouldAdvancePoolToVote({
    activeGovernors: input.activeGovernors,
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
  input: { activeGovernors: number },
): Promise<unknown> {
  const existing = await store.get(`proposals:${proposalId}:chamber`);
  if (existing) return existing;
  if (!store.set) return existing;

  const generated = buildChamberProposalPageFromPool(poolPayload);
  (generated as Record<string, unknown>).activeGovernors =
    input.activeGovernors;
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
    templateId: poolPayload.templateId,
    metaGovernance: poolPayload.metaGovernance,
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

async function upsertChamberReadModel(
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  input: {
    action: "create" | "dissolve";
    id: string;
    title?: string;
    multiplier?: number;
  },
): Promise<void> {
  if (!store.set) return;
  const listPayload = await store.get("chambers:list");
  const existing =
    isRecord(listPayload) && Array.isArray(listPayload.items)
      ? listPayload.items
      : [];

  const normalizedId = input.id.trim().toLowerCase();
  const nextItems = existing.filter(
    (item) => !isRecord(item) || String(item.id).toLowerCase() !== normalizedId,
  );

  if (input.action === "create") {
    const multiplier =
      typeof input.multiplier === "number" && Number.isFinite(input.multiplier)
        ? input.multiplier
        : 1;
    nextItems.push({
      id: normalizedId,
      name: input.title?.trim() || normalizedId,
      multiplier,
      stats: { governors: "0", acm: "0", mcm: "0", lcm: "0" },
      pipeline: { pool: 0, vote: 0, build: 0 },
      status: "active",
    });

    await store.set(`chambers:${normalizedId}`, {
      proposals: [],
      governors: [],
      threads: [],
      chatLog: [],
      stageOptions: [
        { value: "upcoming", label: "Upcoming" },
        { value: "live", label: "Live" },
        { value: "ended", label: "Ended" },
      ],
    });
  }

  await store.set("chambers:list", {
    ...(isRecord(listPayload) ? listPayload : {}),
    items: nextItems,
  });
}

async function maybeAdvanceVoteProposalToBuild(
  env: Record<string, string | undefined>,
  store: Awaited<ReturnType<typeof createReadModelsStore>>,
  input: {
    proposalId: string;
    counts: { yes: number; no: number; abstain: number };
    activeGovernors: number;
    requestUrl: string;
  },
): Promise<boolean> {
  if (!store.set) return false;

  const chamberPayload = await store.get(
    `proposals:${input.proposalId}:chamber`,
  );
  if (!isRecord(chamberPayload)) return false;

  const attentionQuorum = chamberPayload.attentionQuorum;
  const activeGovernors = input.activeGovernors;
  let meta = parseChamberGovernanceFromPayload(chamberPayload);
  let poolPayload: Record<string, unknown> | null = null;
  if (!meta) {
    const candidate = await store.get(`proposals:${input.proposalId}:pool`);
    if (isRecord(candidate)) {
      poolPayload = candidate;
      meta = parseChamberGovernanceFromPayload(candidate);
    }
  }
  const formationEligible = meta
    ? false
    : typeof chamberPayload.formationEligible === "boolean"
      ? chamberPayload.formationEligible
      : poolPayload && typeof poolPayload.formationEligible === "boolean"
        ? poolPayload.formationEligible
        : true;
  if (
    typeof attentionQuorum !== "number" ||
    typeof activeGovernors !== "number" ||
    typeof formationEligible !== "boolean"
  ) {
    return false;
  }

  const minQuorum =
    env.SIM_ACTIVE_GOVERNORS || env.VORTEX_ACTIVE_GOVERNORS
      ? undefined
      : activeGovernors > 1
        ? 2
        : undefined;

  const quorum = evaluateChamberQuorum(
    {
      quorumFraction: attentionQuorum,
      activeGovernors,
      passingFraction: V1_CHAMBER_PASSING_FRACTION,
      minQuorum,
    },
    input.counts,
  );
  if (!quorum.shouldAdvance) return false;

  const listPayload = await store.get("proposals:list");
  if (!isRecord(listPayload)) return false;
  const items = listPayload.items;
  if (!Array.isArray(items)) return false;

  if (meta?.action === "chamber.create" && meta.title && meta.id) {
    await createChamberFromAcceptedGeneralProposal(env, input.requestUrl, {
      id: meta.id,
      title: meta.title,
      multiplier: meta.multiplier,
      proposalId: input.proposalId,
    });

    await upsertChamberReadModel(store, {
      action: "create",
      id: meta.id,
      title: meta.title,
      multiplier: meta.multiplier,
    });

    const genesisMembers = (() => {
      const source =
        (chamberPayload.metaGovernance as { genesisMembers?: unknown }) ??
        (poolPayload?.metaGovernance as { genesisMembers?: unknown });
      const raw = source?.genesisMembers;
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean);
    })();

    const proposerId = asString(chamberPayload.proposerId, "").trim();
    const memberSet = new Set<string>(genesisMembers);
    if (proposerId) memberSet.add(proposerId);
    for (const address of memberSet) {
      await ensureChamberMembership(env, {
        address,
        chamberId: meta.id,
        grantedByProposalId: input.proposalId,
        source: "chamber_genesis",
      });
    }
  }

  if (meta?.action === "chamber.dissolve" && meta.id) {
    await dissolveChamberFromAcceptedGeneralProposal(env, input.requestUrl, {
      id: meta.id,
      proposalId: input.proposalId,
    });

    await upsertChamberReadModel(store, {
      action: "dissolve",
      id: meta.id,
    });
  }

  if (formationEligible) {
    await ensureFormationProposalPage(store, input.proposalId, chamberPayload);
    await ensureFormationSeed(env, store, input.proposalId);
  }

  let changed = false;
  const nextItems = items.map((item) => {
    if (!isRecord(item) || item.id !== input.proposalId) return item;
    if (item.stage !== "vote") return item;
    changed = true;
    return {
      ...item,
      stage: "build",
      summaryPill: formationEligible ? "Formation" : "Passed",
    };
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
  input: {
    proposalId: string;
    counts: { yes: number; no: number; abstain: number };
    activeGovernors: number;
  },
  requestUrl: string,
): Promise<
  | { status: "none" }
  | {
      status: "pending_veto";
      finalizesAt: string;
      vetoCouncilSize: number;
      vetoThreshold: number;
    }
  | { status: "advanced"; formationEligible: boolean; avgScore: number | null }
> {
  const proposal = await getProposal(env, input.proposalId);
  if (!proposal) return { status: "none" };
  if (proposal.stage !== "vote") return { status: "none" };
  if (proposal.votePassedAt && proposal.voteFinalizesAt) {
    const now = getSimNow(env);
    if (now.getTime() < proposal.voteFinalizesAt.getTime()) {
      return { status: "none" };
    }
  }

  const minQuorum =
    env.SIM_ACTIVE_GOVERNORS || env.VORTEX_ACTIVE_GOVERNORS
      ? undefined
      : input.activeGovernors > 1
        ? 2
        : undefined;

  const shouldAdvance = shouldAdvanceVoteToBuild({
    activeGovernors: input.activeGovernors,
    counts: input.counts,
    minQuorum,
  });
  if (!shouldAdvance) return { status: "none" };

  const vetoCount = proposal.vetoCount ?? 0;
  if (vetoCount < V1_VETO_MAX_APPLIES) {
    const snapshot = await computeVetoCouncilSnapshot(env, requestUrl);
    if (snapshot.members.length > 0 && snapshot.threshold > 0) {
      const now = getSimNow(env);
      const finalizesAt = new Date(
        now.getTime() + V1_VETO_DELAY_SECONDS_DEFAULT * 1000,
      );
      await clearVetoVotesForProposal(env, proposal.id).catch(() => {});
      await setProposalVotePendingVeto(env, {
        proposalId: proposal.id,
        passedAt: now,
        finalizesAt,
        vetoCouncil: snapshot.members,
        vetoThreshold: snapshot.threshold,
      });
      return {
        status: "pending_veto",
        finalizesAt: finalizesAt.toISOString(),
        vetoCouncilSize: snapshot.members.length,
        vetoThreshold: snapshot.threshold,
      };
    }
  }

  const finalized = await finalizeAcceptedProposalFromVote(env, {
    proposalId: proposal.id,
    requestUrl,
  });
  if (!finalized.ok) return { status: "none" };

  return {
    status: "advanced",
    formationEligible: finalized.formationEligible,
    avgScore: finalized.avgScore,
  };
}

function getFormationEligibleFromProposalPayload(payload: unknown): boolean {
  if (!isRecord(payload)) return true;
  if (payload.templateId === "system") return false;
  if (
    typeof payload.metaGovernance === "object" &&
    payload.metaGovernance !== null &&
    !Array.isArray(payload.metaGovernance)
  )
    return false;
  if (typeof payload.formationEligible === "boolean")
    return payload.formationEligible;
  if (typeof payload.formation === "boolean") return payload.formation;
  return true;
}

async function requireFormationEnabled(
  env: Record<string, string | undefined>,
  input: { proposalId: string },
): Promise<
  | { ok: true }
  | {
      ok: false;
      error: Response;
    }
> {
  const proposal = await getProposal(env, input.proposalId);
  if (!proposal) return { ok: true };
  if (proposal.stage !== "build") {
    return {
      ok: false,
      error: errorResponse(409, "Proposal is not in formation stage", {
        code: "stage_invalid",
        stage: proposal.stage,
      }),
    };
  }
  if (!getFormationEligibleFromProposalPayload(proposal.payload)) {
    return {
      ok: false,
      error: errorResponse(409, "Formation is not required for this proposal", {
        code: "formation_not_required",
      }),
    };
  }
  return { ok: true };
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

async function enforceChamberVoteEligibility(
  env: Record<string, string | undefined>,
  readModels: Awaited<ReturnType<typeof createReadModelsStore>> | null,
  input: { proposalId: string; voterAddress: string },
  requestUrl: string,
): Promise<Response | null> {
  if (envBoolean(env, "DEV_BYPASS_CHAMBER_ELIGIBILITY")) return null;

  const simConfig = await getSimConfig(env, requestUrl);
  const genesis = simConfig?.genesisChamberMembers;

  const chamberId = await getProposalChamberIdForVote(env, readModels, {
    proposalId: input.proposalId,
  });
  const voterAddress = input.voterAddress.trim();

  const hasGenesisMembership = async (
    targetChamberId: string,
  ): Promise<boolean> => {
    if (!genesis) return false;
    const members = genesis[targetChamberId.toLowerCase()] ?? [];
    for (const member of members) {
      if (await addressesReferToSameKey(member, voterAddress)) return true;
    }
    return false;
  };
  const hasAnyGenesisMembership = async (): Promise<boolean> => {
    if (!genesis) return false;
    for (const members of Object.values(genesis)) {
      for (const member of members) {
        if (await addressesReferToSameKey(member, voterAddress)) return true;
      }
    }
    return false;
  };

  if (chamberId === "general") {
    // Bootstrap: if the user is explicitly configured with a tier, treat them as eligible in General.
    const tier = await resolveUserTierFromSimConfig(simConfig, voterAddress);
    if (tier !== "Nominee") return null;

    return null;
  }

  const eligible = await hasChamberMembership(env, {
    address: voterAddress,
    chamberId,
  });
  if (!eligible && !(await hasGenesisMembership(chamberId))) {
    return errorResponse(403, "Not eligible to vote in this chamber", {
      code: "chamber_vote_ineligible",
      chamberId,
    });
  }
  return null;
}

async function enforcePoolVoteEligibility(
  env: Record<string, string | undefined>,
  readModels: Awaited<ReturnType<typeof createReadModelsStore>> | null,
  input: { proposalId: string; voterAddress: string },
  requestUrl: string,
): Promise<Response | null> {
  if (envBoolean(env, "DEV_BYPASS_CHAMBER_ELIGIBILITY")) return null;

  const simConfig = await getSimConfig(env, requestUrl);
  const genesis = simConfig?.genesisChamberMembers;

  const chamberId = await getProposalChamberIdForPool(env, readModels, {
    proposalId: input.proposalId,
  });
  const voterAddress = input.voterAddress.trim();

  const hasAnyGenesisMembership = async (): Promise<boolean> => {
    if (!genesis) return false;
    for (const members of Object.values(genesis)) {
      for (const member of members) {
        if (await addressesReferToSameKey(member, voterAddress)) return true;
      }
    }
    return false;
  };

  const hasGenesisMembership = async (target: string): Promise<boolean> => {
    const members = genesis?.[target]?.map((m) => m.trim()) ?? [];
    for (const member of members) {
      if (await addressesReferToSameKey(member, voterAddress)) return true;
    }
    return false;
  };

  if (chamberId === "general") {
    // Bootstrap: if the user is explicitly configured with a tier, treat them as eligible in General.
    const tier = await resolveUserTierFromSimConfig(simConfig, voterAddress);
    if (tier !== "Nominee") return null;

    const eligible =
      (await hasAnyChamberMembership(env, voterAddress)) ||
      (await hasChamberMembership(env, {
        address: voterAddress,
        chamberId: "general",
      })) ||
      (await hasAnyGenesisMembership());
    if (!eligible) {
      return errorResponse(403, "Not eligible to vote in the proposal pool", {
        code: "pool_vote_ineligible",
        chamberId,
      });
    }
    return null;
  }

  const eligible =
    (await hasChamberMembership(env, { address: voterAddress, chamberId })) ||
    (await hasGenesisMembership(chamberId));
  if (!eligible) {
    return errorResponse(403, "Not eligible to vote in the proposal pool", {
      code: "pool_vote_ineligible",
      chamberId,
    });
  }
  return null;
}

async function getProposalChamberIdForVote(
  env: Record<string, string | undefined>,
  readModels: Awaited<ReturnType<typeof createReadModelsStore>> | null,
  input: { proposalId: string },
): Promise<string> {
  const proposal = await getProposal(env, input.proposalId);
  if (proposal) return (proposal.chamberId ?? "general").toLowerCase();

  if (!readModels) return "general";

  const chamberPayload = await readModels.get(
    `proposals:${input.proposalId}:chamber`,
  );
  if (isRecord(chamberPayload)) {
    const label = asString(chamberPayload.chamber, "");
    const normalized = normalizeChamberId(label);
    return normalized || "general";
  }

  const listPayload = await readModels.get("proposals:list");
  if (isRecord(listPayload) && Array.isArray(listPayload.items)) {
    const entry = listPayload.items.find(
      (item) => isRecord(item) && item.id === input.proposalId,
    );
    if (isRecord(entry)) {
      const label = asString(entry.chamber, asString(entry.meta, ""));
      const normalized = normalizeChamberId(label);
      return normalized || "general";
    }
  }

  return "general";
}

async function getProposalChamberIdForPool(
  env: Record<string, string | undefined>,
  readModels: Awaited<ReturnType<typeof createReadModelsStore>> | null,
  input: { proposalId: string },
): Promise<string> {
  const proposal = await getProposal(env, input.proposalId);
  if (proposal) return (proposal.chamberId ?? "general").toLowerCase();

  if (!readModels) return "general";

  const poolPayload = await readModels.get(
    `proposals:${input.proposalId}:pool`,
  );
  if (isRecord(poolPayload)) {
    const label = asString(poolPayload.chamber, "");
    const normalized = normalizeChamberId(label);
    return normalized || "general";
  }

  const listPayload = await readModels.get("proposals:list");
  if (isRecord(listPayload) && Array.isArray(listPayload.items)) {
    const entry = listPayload.items.find(
      (item) => isRecord(item) && item.id === input.proposalId,
    );
    if (isRecord(entry)) {
      const label = asString(entry.chamber, asString(entry.meta, ""));
      const normalized = normalizeChamberId(label);
      return normalized || "general";
    }
  }

  return "general";
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
