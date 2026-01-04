import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { listProposals } from "../../_lib/proposalsStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../_lib/eraStore.ts";
import { getPoolVoteCounts } from "../../_lib/poolVotesStore.ts";
import { getChamberVoteCounts } from "../../_lib/chamberVotesStore.ts";
import { getFormationSummary } from "../../_lib/formationStore.ts";
import { getProposalStageDenominatorMap } from "../../_lib/proposalStageDenominatorsStore.ts";
import {
  parseProposalStageQuery,
  projectProposalListItem,
} from "../../_lib/proposalProjector.ts";
import { V1_ACTIVE_GOVERNORS_FALLBACK } from "../../_lib/v1Constants.ts";
import { getSimConfig } from "../../_lib/simConfig.ts";
import { resolveUserTierFromSimConfig } from "../../_lib/userTier.ts";
import {
  getSimNow,
  getStageWindowSeconds,
  stageWindowsEnabled,
} from "../../_lib/stageWindows.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const now = getSimNow(context.env);
    const voteWindowSeconds = stageWindowsEnabled(context.env)
      ? getStageWindowSeconds(context.env, "vote")
      : undefined;
    const url = new URL(context.request.url);
    const stage = url.searchParams.get("stage");

    const listPayload = await store.get("proposals:list");
    const readModelItems =
      listPayload &&
      typeof listPayload === "object" &&
      !Array.isArray(listPayload) &&
      Array.isArray((listPayload as { items?: unknown[] }).items)
        ? ((listPayload as { items: unknown[] }).items.filter(
            (entry) =>
              entry && typeof entry === "object" && !Array.isArray(entry),
          ) as Array<Record<string, unknown>>)
        : [];

    const activeGovernors =
      (await getActiveGovernorsForCurrentEra(context.env).catch(() => null)) ??
      V1_ACTIVE_GOVERNORS_FALLBACK;

    const stageQuery =
      stage === "draft" ? null : parseProposalStageQuery(stage ?? null);
    const proposals =
      stage === "draft"
        ? []
        : await listProposals(context.env, { stage: stageQuery });
    const simConfig = await getSimConfig(
      context.env,
      context.request.url,
    ).catch(() => null);

    const poolDenominators = await getProposalStageDenominatorMap(context.env, {
      stage: "pool",
      proposalIds: proposals.filter((p) => p.stage === "pool").map((p) => p.id),
    });
    const voteDenominators = await getProposalStageDenominatorMap(context.env, {
      stage: "vote",
      proposalIds: proposals.filter((p) => p.stage === "vote").map((p) => p.id),
    });

    const projected = await Promise.all(
      proposals.map(async (proposal) => {
        const formationEligible = (() => {
          const payload = proposal.payload;
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
        })();

        const poolCounts =
          proposal.stage === "pool"
            ? await getPoolVoteCounts(context.env, proposal.id)
            : undefined;
        const chamberCounts =
          proposal.stage === "vote"
            ? await getChamberVoteCounts(context.env, proposal.id, {
                chamberId: (proposal.chamberId ?? "general").toLowerCase(),
              })
            : undefined;
        const formationSummary =
          proposal.stage === "build" && formationEligible
            ? await getFormationSummary(context.env, store, proposal.id).catch(
                () => null,
              )
            : null;
        const stageDenominator =
          proposal.stage === "pool"
            ? poolDenominators.get(proposal.id)?.activeGovernors
            : proposal.stage === "vote"
              ? voteDenominators.get(proposal.id)?.activeGovernors
              : undefined;
        return projectProposalListItem(proposal, {
          activeGovernors: stageDenominator ?? activeGovernors,
          tier: await resolveUserTierFromSimConfig(
            simConfig,
            proposal.authorAddress,
          ),
          now,
          voteWindowSeconds,
          poolCounts,
          chamberCounts,
          formationSummary: formationSummary ?? undefined,
        });
      }),
    );

    const projectedIds = new Set(projected.map((item) => item.id));
    const merged = [
      ...readModelItems.filter((item) => !projectedIds.has(String(item.id))),
      ...projected,
    ];

    const filtered = stage
      ? merged.filter((item) => String(item.stage) === stage)
      : merged;

    return jsonResponse({ items: filtered });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
