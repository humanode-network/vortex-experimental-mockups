import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing chamber id");
    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`chambers:${id}`);
    if (!payload)
      return errorResponse(404, `Missing read model: chambers:${id}`);
    return jsonResponse(payload);
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
