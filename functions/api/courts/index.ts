import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { getCourtOverlay } from "../../_lib/courtsStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("courts:list");
    if (!payload) return jsonResponse({ items: [] });
    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    )
      return jsonResponse({ items: [] });

    const record = payload as Record<string, unknown>;
    const items = Array.isArray(record.items) ? record.items : [];

    const nextItems = await Promise.all(
      items.map(async (item) => {
        if (!item || typeof item !== "object" || Array.isArray(item))
          return item;
        const row = item as Record<string, unknown>;
        const id = typeof row.id === "string" ? row.id : null;
        if (!id) return item;
        try {
          const overlay = await getCourtOverlay(context.env, store, id);
          return { ...row, status: overlay.status, reports: overlay.reports };
        } catch {
          return item;
        }
      }),
    );

    return jsonResponse({ ...record, items: nextItems });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
