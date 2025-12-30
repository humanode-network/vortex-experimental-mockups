import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { listProposals } from "../../_lib/proposalsStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../_lib/eraStore.ts";
import { getPoolVoteCounts } from "../../_lib/poolVotesStore.ts";
import { getChamberVoteCounts } from "../../_lib/chamberVotesStore.ts";
import { getFormationSummary } from "../../_lib/formationStore.ts";
import {
  parseProposalStageQuery,
  projectProposalListItem,
} from "../../_lib/proposalProjector.ts";
import { V1_ACTIVE_GOVERNORS_FALLBACK } from "../../_lib/v1Constants.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
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

    const projected = await Promise.all(
      proposals.map(async (proposal) => {
        const poolCounts =
          proposal.stage === "pool"
            ? await getPoolVoteCounts(context.env, proposal.id)
            : undefined;
        const chamberCounts =
          proposal.stage === "vote"
            ? await getChamberVoteCounts(context.env, proposal.id)
            : undefined;
        const formationSummary =
          proposal.stage === "build"
            ? await getFormationSummary(context.env, store, proposal.id).catch(
                () => null,
              )
            : null;
        return projectProposalListItem(proposal, {
          activeGovernors,
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
