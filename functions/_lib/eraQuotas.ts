import { envInt } from "./env.ts";

type Env = Record<string, string | undefined>;

export type EraQuotaConfig = {
  maxPoolVotes: number | null;
  maxChamberVotes: number | null;
  maxCourtActions: number | null;
  maxFormationActions: number | null;
};

function normalizeLimit(value: number | undefined): number | null {
  if (value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function getEraQuotaConfig(env: Env): EraQuotaConfig {
  return {
    maxPoolVotes: normalizeLimit(envInt(env, "SIM_MAX_POOL_VOTES_PER_ERA")),
    maxChamberVotes: normalizeLimit(
      envInt(env, "SIM_MAX_CHAMBER_VOTES_PER_ERA"),
    ),
    maxCourtActions: normalizeLimit(
      envInt(env, "SIM_MAX_COURT_ACTIONS_PER_ERA"),
    ),
    maxFormationActions: normalizeLimit(
      envInt(env, "SIM_MAX_FORMATION_ACTIONS_PER_ERA"),
    ),
  };
}
