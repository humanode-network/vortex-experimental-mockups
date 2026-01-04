import { getSimConfig } from "./simConfig.ts";
import { addressesReferToSameKey } from "./address.ts";

export type HumanTier =
  | "Nominee"
  | "Ecclesiast"
  | "Legate"
  | "Consul"
  | "Citizen";

export async function resolveUserTierFromSimConfig(
  simConfig: Awaited<ReturnType<typeof getSimConfig>> | null,
  address: string,
): Promise<HumanTier> {
  const tiers = simConfig?.genesisUserTiers;
  if (tiers) {
    const key = address.trim();
    const exact = tiers[key];
    if (exact) return exact;
    for (const [candidate, tier] of Object.entries(tiers)) {
      if (await addressesReferToSameKey(candidate, key)) return tier;
    }
  }
  return "Nominee";
}

export async function getUserTier(
  env: Record<string, string | undefined>,
  requestUrl: string,
  address: string,
): Promise<HumanTier> {
  const simConfig = await getSimConfig(env, requestUrl).catch(() => null);
  return await resolveUserTierFromSimConfig(simConfig, address);
}
