import { assertAdmin, createClockStore } from "../../_lib/clockStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    assertAdmin(context);
    const clock = createClockStore(context.env);
    return jsonResponse(await clock.advanceEra());
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status) return errorResponse(err.status, err.message);
    return errorResponse(500, err.message);
  }
};
