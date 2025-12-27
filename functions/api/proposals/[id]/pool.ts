import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import { getPoolVoteCounts } from "../../../_lib/poolVotesStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../../_lib/eraStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");
    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`proposals:${id}:pool`);
    if (!payload)
      return errorResponse(404, `Missing read model: proposals:${id}:pool`);
    const counts = await getPoolVoteCounts(context.env, id);
    const activeGovernors =
      (await getActiveGovernorsForCurrentEra(context.env).catch(() => null)) ??
      (payload as Record<string, unknown>).activeGovernors ??
      0;
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
