import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { readSession } from "../../_lib/auth.ts";
import { getUserEraActivity } from "../../_lib/eraStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("my-governance:summary");
    const base =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {
            eraActivity: {
              era: "Era 0",
              required: 0,
              completed: 0,
              actions: [],
              timeLeft: "—",
            },
            myChamberIds: [],
          };

    const session = await readSession(context.request, context.env);
    if (!session) return jsonResponse(base);

    const era = await getUserEraActivity(context.env, {
      address: session.address,
    }).catch(() => null);
    if (!era) return jsonResponse(base);

    const baseEraActivity =
      base && typeof base === "object" && !Array.isArray(base)
        ? (base as Record<string, unknown>).eraActivity
        : null;
    const actions =
      baseEraActivity &&
      typeof baseEraActivity === "object" &&
      baseEraActivity !== null &&
      !Array.isArray(baseEraActivity) &&
      Array.isArray((baseEraActivity as Record<string, unknown>).actions)
        ? ((baseEraActivity as Record<string, unknown>).actions as Array<
            Record<string, unknown>
          >)
        : [];

    const nextActions = actions.map((action) => {
      const label = String(action.label ?? "");
      const required =
        typeof action.required === "number" ? action.required : 0;
      const done =
        label === "Pool votes"
          ? era.counts.poolVotes
          : label === "Chamber votes"
            ? era.counts.chamberVotes
            : label === "Court actions"
              ? era.counts.courtActions
              : 0;
      return { ...action, label, required, done };
    });

    const requiredTotal = nextActions.reduce((sum, action) => {
      return sum + (typeof action.required === "number" ? action.required : 0);
    }, 0);
    const completedTotal = nextActions.reduce(
      (sum, action) =>
        sum + (typeof action.done === "number" ? action.done : 0),
      0,
    );

    return jsonResponse({
      ...base,
      eraActivity: {
        ...(baseEraActivity as Record<string, unknown>),
        era: String(era.era),
        required: requiredTotal,
        completed: completedTotal,
        actions: nextActions,
      },
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
