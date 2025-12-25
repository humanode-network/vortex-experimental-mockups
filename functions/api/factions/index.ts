import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("factions:list");
    return jsonResponse(payload ?? { items: [] });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
