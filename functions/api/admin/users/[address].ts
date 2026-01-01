import { assertAdmin } from "../../../_lib/clockStore.ts";
import { createActionLocksStore } from "../../../_lib/actionLocksStore.ts";
import { getEraQuotaConfig } from "../../../_lib/eraQuotas.ts";
import { getUserEraActivity } from "../../../_lib/eraStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";

export const onRequestGet: PagesFunction<{ address: string }> = async (
  context,
) => {
  try {
    assertAdmin(context);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    return errorResponse(status, (error as Error).message);
  }

  const address = (context.params.address ?? "").trim();
  if (!address) return errorResponse(400, "Missing address");

  const activity = await getUserEraActivity(context.env, { address });
  const quotas = getEraQuotaConfig(context.env);
  const lock = await createActionLocksStore(context.env).getActiveLock(address);

  const remaining = {
    poolVotes:
      quotas.maxPoolVotes === null
        ? null
        : Math.max(0, quotas.maxPoolVotes - activity.counts.poolVotes),
    chamberVotes:
      quotas.maxChamberVotes === null
        ? null
        : Math.max(0, quotas.maxChamberVotes - activity.counts.chamberVotes),
    courtActions:
      quotas.maxCourtActions === null
        ? null
        : Math.max(0, quotas.maxCourtActions - activity.counts.courtActions),
    formationActions:
      quotas.maxFormationActions === null
        ? null
        : Math.max(
            0,
            quotas.maxFormationActions - activity.counts.formationActions,
          ),
  };

  return jsonResponse({
    address,
    era: activity.era,
    counts: activity.counts,
    quotas,
    remaining,
    lock,
  });
};
