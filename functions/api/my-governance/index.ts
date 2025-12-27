import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { readSession } from "../../_lib/auth.ts";
import { getUserEraActivity } from "../../_lib/eraStore.ts";
import {
  getEraRollupMeta,
  getEraUserStatus,
} from "../../_lib/eraRollupStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

function envInt(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number,
): number {
  const raw = env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;
  return Math.floor(n);
}

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

    const requiredByLabel: Record<string, number> = {
      "Pool votes": envInt(context.env, "SIM_REQUIRED_POOL_VOTES", 1),
      "Chamber votes": envInt(context.env, "SIM_REQUIRED_CHAMBER_VOTES", 1),
      "Court actions": envInt(context.env, "SIM_REQUIRED_COURT_ACTIONS", 0),
      "Formation actions": envInt(
        context.env,
        "SIM_REQUIRED_FORMATION_ACTIONS",
        0,
      ),
    };

    const session = await readSession(context.request, context.env);
    if (!session) {
      // Normalize the base model to the configured requirements (even for anon users).
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

      const normalizedActions = actions
        .map((action) => {
          const label = String(action.label ?? "");
          if (!(label in requiredByLabel)) return null;
          return {
            ...action,
            label,
            required: requiredByLabel[label],
          };
        })
        .filter(Boolean) as Array<Record<string, unknown>>;

      const requiredTotal = normalizedActions.reduce((sum, action) => {
        return (
          sum + (typeof action.required === "number" ? action.required : 0)
        );
      }, 0);

      return jsonResponse({
        ...base,
        eraActivity: {
          ...(baseEraActivity as Record<string, unknown>),
          required: requiredTotal,
          actions: normalizedActions,
        },
      });
    }

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

    const nextActions = actions
      .map((action) => {
        const label = String(action.label ?? "");
        if (!(label in requiredByLabel)) return null;
        const done =
          label === "Pool votes"
            ? era.counts.poolVotes
            : label === "Chamber votes"
              ? era.counts.chamberVotes
              : label === "Court actions"
                ? era.counts.courtActions
                : label === "Formation actions"
                  ? era.counts.formationActions
                  : 0;
        return { ...action, label, required: requiredByLabel[label], done };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const requiredTotal = nextActions.reduce((sum, action) => {
      return sum + (typeof action.required === "number" ? action.required : 0);
    }, 0);
    const completedTotal = nextActions.reduce(
      (sum, action) =>
        sum + (typeof action.done === "number" ? action.done : 0),
      0,
    );

    const rollupMeta = await getEraRollupMeta(context.env, {
      era: era.era,
    }).catch(() => null);
    const rollupUser = rollupMeta
      ? await getEraUserStatus(context.env, {
          era: rollupMeta.era,
          address: session.address,
        }).catch(() => null)
      : null;

    return jsonResponse({
      ...base,
      eraActivity: {
        ...(baseEraActivity as Record<string, unknown>),
        era: String(era.era),
        required: requiredTotal,
        completed: completedTotal,
        actions: nextActions,
      },
      ...(rollupMeta
        ? {
            rollup: {
              era: rollupMeta.era,
              rolledAt: rollupMeta.rolledAt,
              status: rollupUser?.status ?? "Losing status",
              requiredTotal: rollupMeta.requiredTotal,
              completedTotal: rollupUser?.completedTotal ?? 0,
              isActiveNextEra: rollupUser?.isActiveNextEra ?? false,
              activeGovernorsNextEra: rollupMeta.activeGovernorsNextEra,
            },
          }
        : {}),
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
