import { assertAdmin, createClockStore } from "../../_lib/clockStore.ts";
import { envBoolean } from "../../_lib/env.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { rollupEra } from "../../_lib/eraRollupStore.ts";
import {
  ensureEraSnapshot,
  setEraSnapshotActiveGovernors,
} from "../../_lib/eraStore.ts";
import { V1_ERA_SECONDS_DEFAULT } from "../../_lib/v1Constants.ts";

type Env = Record<string, string | undefined>;

function getEraSeconds(env: Env): number {
  const raw = env.SIM_ERA_SECONDS ?? "";
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return V1_ERA_SECONDS_DEFAULT;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    assertAdmin(context);

    const contentType = context.request.headers.get("content-type") ?? "";
    const body = contentType.toLowerCase().includes("application/json")
      ? ((await context.request.json().catch(() => null)) as {
          forceAdvance?: boolean;
          rollup?: boolean;
        } | null)
      : null;

    const forceAdvance = body?.forceAdvance === true;
    const shouldRollup = body?.rollup !== false;

    const clock = createClockStore(context.env);
    const snapshot = await clock.get();
    await ensureEraSnapshot(context.env, snapshot.currentEra).catch(() => {});

    const now = new Date();
    const eraSeconds = getEraSeconds(context.env);
    const updatedAt = new Date(snapshot.updatedAt);
    const dueByTime =
      Number.isFinite(updatedAt.getTime()) &&
      now.getTime() - updatedAt.getTime() >= eraSeconds * 1000;

    const due = forceAdvance || dueByTime;

    const rollup = shouldRollup
      ? await rollupEra(context.env, { era: snapshot.currentEra })
      : null;

    if (rollup && envBoolean(context.env, "SIM_DYNAMIC_ACTIVE_GOVERNORS")) {
      await setEraSnapshotActiveGovernors(context.env, {
        era: snapshot.currentEra + 1,
        activeGovernors: rollup.activeGovernorsNextEra,
      }).catch(() => {});
    }

    let advancedTo = snapshot.currentEra;
    let advanced = false;
    if (due) {
      const next = await clock.advanceEra();
      advancedTo = next.currentEra;
      advanced = advancedTo !== snapshot.currentEra;
      await ensureEraSnapshot(context.env, next.currentEra).catch(() => {});
    }

    return jsonResponse({
      ok: true as const,
      now: now.toISOString(),
      eraSeconds,
      due,
      advanced,
      fromEra: snapshot.currentEra,
      toEra: advancedTo,
      ...(rollup ? { rollup } : {}),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status) return errorResponse(err.status, err.message);
    return errorResponse(500, err.message);
  }
};
