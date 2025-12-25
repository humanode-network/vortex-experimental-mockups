import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing draft id");
    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`proposals:drafts:${id}`);
    if (!payload)
      return errorResponse(404, `Missing read model: proposals:drafts:${id}`);
    return jsonResponse(payload);
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
