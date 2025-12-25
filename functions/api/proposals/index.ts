import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("proposals:list");
    if (!payload) return jsonResponse({ items: [] });

    const url = new URL(context.request.url);
    const stage = url.searchParams.get("stage");
    if (!stage) return jsonResponse(payload);

    const typed = payload as { items?: { stage?: string }[] };
    const items = (typed.items ?? []).filter((p) => p.stage === stage);
    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
