import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("humans:list");
    if (!payload) return errorResponse(404, "Missing read model: humans:list");
    return jsonResponse(payload);
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
