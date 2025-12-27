import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import { getChamberVoteCounts } from "../../../_lib/chamberVotesStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../../_lib/eraStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");
    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`proposals:${id}:chamber`);
    if (!payload)
      return errorResponse(404, `Missing read model: proposals:${id}:chamber`);

    const counts = await getChamberVoteCounts(context.env, id);
    const typed = payload as Record<string, unknown>;
    const activeGovernors =
      (await getActiveGovernorsForCurrentEra(context.env).catch(() => null)) ??
      (typeof typed.activeGovernors === "number" ? typed.activeGovernors : 0);
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
