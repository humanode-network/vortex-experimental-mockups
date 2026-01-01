import { assertAdmin, createClockStore } from "../../_lib/clockStore.ts";
import { rollupEra } from "../../_lib/eraRollupStore.ts";
import { setEraSnapshotActiveGovernors } from "../../_lib/eraStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    assertAdmin(context);

    const clock = createClockStore(context.env);
    const { currentEra } = await clock.get();

    let era = currentEra;
    const contentType = context.request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) {
      const body = (await context.request.json().catch(() => null)) as {
        era?: number;
      } | null;
      if (body && typeof body.era === "number") era = Math.floor(body.era);
    }

    const result = await rollupEra(context.env, {
      era,
      requestUrl: context.request.url,
    });

    await setEraSnapshotActiveGovernors(context.env, {
      era: era + 1,
      activeGovernors: result.activeGovernorsNextEra,
    }).catch(() => {});

    return jsonResponse({ ok: true as const, ...result });
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status) return errorResponse(err.status, err.message);
    return errorResponse(500, err.message);
  }
};
