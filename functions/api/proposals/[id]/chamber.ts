import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import { getChamberVoteCounts } from "../../../_lib/chamberVotesStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../../_lib/eraStore.ts";
import { getProposal } from "../../../_lib/proposalsStore.ts";
import { projectChamberProposalPage } from "../../../_lib/proposalProjector.ts";
import { V1_ACTIVE_GOVERNORS_FALLBACK } from "../../../_lib/v1Constants.ts";
import {
  getSimNow,
  getStageWindowSeconds,
  stageWindowsEnabled,
} from "../../../_lib/stageWindows.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");

    const counts = await getChamberVoteCounts(context.env, id);
    const activeGovernors =
      (await getActiveGovernorsForCurrentEra(context.env).catch(() => null)) ??
      V1_ACTIVE_GOVERNORS_FALLBACK;

    const proposal = await getProposal(context.env, id);
    if (proposal) {
      const now = getSimNow(context.env);
      return jsonResponse(
        projectChamberProposalPage(proposal, {
          counts,
          activeGovernors,
          now,
          voteWindowSeconds: stageWindowsEnabled(context.env)
            ? getStageWindowSeconds(context.env, "vote")
            : undefined,
        }),
      );
    }

    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`proposals:${id}:chamber`);
    if (!payload)
      return errorResponse(404, `Missing read model: proposals:${id}:chamber`);

    const typed = payload as Record<string, unknown>;
    const engagedGovernors = counts.yes + counts.no + counts.abstain;
    return jsonResponse({
      ...typed,
      votes: counts,
      engagedGovernors,
      activeGovernors,
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
