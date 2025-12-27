import { assertAdmin, createClockStore } from "../../_lib/clockStore.ts";
import { ensureEraSnapshot } from "../../_lib/eraStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    assertAdmin(context);
    const clock = createClockStore(context.env);
    const next = await clock.advanceEra();
    await ensureEraSnapshot(context.env, next.currentEra).catch(() => {});
    return jsonResponse(next);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status) return errorResponse(err.status, err.message);
    return errorResponse(500, err.message);
  }
};
