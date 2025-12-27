import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { getCourtOverlay } from "../../_lib/courtsStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing case id");
    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`courts:${id}`);
    if (!payload) return errorResponse(404, `Missing read model: courts:${id}`);

    let overlay;
    try {
      overlay = await getCourtOverlay(context.env, store, id);
    } catch {
      overlay = null;
    }

    if (!overlay) return jsonResponse(payload);
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return jsonResponse(payload);
    const record = payload as Record<string, unknown>;
    return jsonResponse({
      ...record,
      status: overlay.status,
      reports: overlay.reports,
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
