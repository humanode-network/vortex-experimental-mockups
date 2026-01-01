import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import { getChamberVoteCounts } from "../../../_lib/chamberVotesStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../../_lib/eraStore.ts";
import { getProposal } from "../../../_lib/proposalsStore.ts";
import { projectChamberProposalPage } from "../../../_lib/proposalProjector.ts";
import { getProposalStageDenominator } from "../../../_lib/proposalStageDenominatorsStore.ts";
import { V1_ACTIVE_GOVERNORS_FALLBACK } from "../../../_lib/v1Constants.ts";
import {
  getSimNow,
  getStageWindowSeconds,
  stageWindowsEnabled,
} from "../../../_lib/stageWindows.ts";

function normalizeChamberId(chamberLabel: string): string {
  const match = chamberLabel.trim().match(/^([A-Za-z]+)/);
  return (match?.[1] ?? chamberLabel).toLowerCase();
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");

    const baseline =
      (await getActiveGovernorsForCurrentEra(context.env).catch(() => null)) ??
      V1_ACTIVE_GOVERNORS_FALLBACK;
    const activeGovernors =
      (
        await getProposalStageDenominator(context.env, {
          proposalId: id,
          stage: "vote",
        }).catch(() => null)
      )?.activeGovernors ?? baseline;

    const proposal = await getProposal(context.env, id);
    if (proposal) {
      const counts = await getChamberVoteCounts(context.env, id, {
        chamberId: (proposal.chamberId ?? "general").toLowerCase(),
      });
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
    const chamberId =
      normalizeChamberId(String(typed.chamber ?? "general")) || "general";
    const counts = await getChamberVoteCounts(context.env, id, { chamberId });
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
