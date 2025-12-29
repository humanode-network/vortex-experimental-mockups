import { createClockStore } from "../../_lib/clockStore.ts";
import { getActiveGovernorsForCurrentEra } from "../../_lib/eraStore.ts";
import { getEraRollupMeta } from "../../_lib/eraRollupStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const clock = createClockStore(context.env);
    const snapshot = await clock.get();
    const activeGovernors = await getActiveGovernorsForCurrentEra(context.env);
    const rollup = await getEraRollupMeta(context.env, {
      era: snapshot.currentEra,
    }).catch(() => null);
    return jsonResponse({
      ...snapshot,
      activeGovernors,
      ...(rollup ? { currentEraRollup: rollup } : {}),
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
