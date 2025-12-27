import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { getAcmDelta } from "../../_lib/cmAwardsStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("humans:list");
    if (!payload) return jsonResponse({ items: [] });
    const typed = payload as { items?: Array<Record<string, unknown>> };
    const items = Array.isArray(typed.items) ? typed.items : [];

    const nextItems = await Promise.all(
      items.map(async (item) => {
        const id = typeof item.id === "string" ? item.id : null;
        if (!id) return item;
        const delta = await getAcmDelta(context.env, id);
        const base = typeof item.acm === "number" ? item.acm : 0;
        return { ...item, acm: base + delta };
      }),
    );

    return jsonResponse({ ...typed, items: nextItems });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
