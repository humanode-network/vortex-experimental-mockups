import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import { getPoolVoteCounts } from "../../../_lib/poolVotesStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../../_lib/eraStore.ts";
import { getProposal } from "../../../_lib/proposalsStore.ts";
import { projectPoolProposalPage } from "../../../_lib/proposalProjector.ts";
import { getProposalStageDenominator } from "../../../_lib/proposalStageDenominatorsStore.ts";
import { V1_ACTIVE_GOVERNORS_FALLBACK } from "../../../_lib/v1Constants.ts";
import { getSimConfig } from "../../../_lib/simConfig.ts";
import { resolveUserTierFromSimConfig } from "../../../_lib/userTier.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");

    const counts = await getPoolVoteCounts(context.env, id);
    const baseline =
      (await getActiveGovernorsForCurrentEra(context.env).catch(() => null)) ??
      V1_ACTIVE_GOVERNORS_FALLBACK;
    const activeGovernors =
      (
        await getProposalStageDenominator(context.env, {
          proposalId: id,
          stage: "pool",
        }).catch(() => null)
      )?.activeGovernors ?? baseline;

    const proposal = await getProposal(context.env, id);
    if (proposal) {
      const simConfig = await getSimConfig(
        context.env,
        context.request.url,
      ).catch(() => null);
      return jsonResponse(
        projectPoolProposalPage(proposal, {
          counts,
          activeGovernors,
          tier: await resolveUserTierFromSimConfig(
            simConfig,
            proposal.authorAddress,
          ),
        }),
      );
    }

    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`proposals:${id}:pool`);
    if (!payload)
      return errorResponse(404, `Missing read model: proposals:${id}:pool`);
    const patched = {
      ...(payload as Record<string, unknown>),
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      activeGovernors,
    };
    return jsonResponse(patched);
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
