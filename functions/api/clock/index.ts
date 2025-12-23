import { createClockStore } from "../../_lib/clockStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const clock = createClockStore(context.env);
    return jsonResponse(await clock.get());
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
