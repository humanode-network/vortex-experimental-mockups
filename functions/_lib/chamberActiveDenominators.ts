import { and, eq } from "drizzle-orm";

import { eraRollups, eraUserStatus } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { createClockStore } from "./clockStore.ts";
import {
  listAllChamberMembers,
  listChamberMembers,
} from "./chamberMembershipsStore.ts";
import { getActiveAddressesForNextEraFromRollup } from "./eraRollupStore.ts";

type Env = Record<string, string | undefined>;

export async function getEligibleGovernorAddressesForChamber(
  env: Env,
  input: { chamberId: string; genesisMembers?: string[] | null },
): Promise<Set<string>> {
  const chamberId = input.chamberId.trim().toLowerCase();
  const out = new Set<string>();

  const members =
    chamberId === "general"
      ? await listAllChamberMembers(env)
      : await listChamberMembers(env, chamberId);
  for (const address of members) out.add(address.trim());

  for (const address of input.genesisMembers ?? []) out.add(address.trim());

  out.delete("");
  return out;
}

export async function getActiveGovernorAddressesForCurrentEra(
  env: Env,
): Promise<Set<string> | null> {
  const clock = createClockStore(env);
  const { currentEra } = await clock.get();
  const priorEra = currentEra - 1;
  if (priorEra < 0) return null;

  if (!env.DATABASE_URL) {
    return getActiveAddressesForNextEraFromRollup(env, { era: priorEra });
  }

  const db = createDb(env);
  const rollupExists = await db
    .select({ era: eraRollups.era })
    .from(eraRollups)
    .where(eq(eraRollups.era, priorEra))
    .limit(1);
  if (!rollupExists[0]) return null;

  const rows = await db
    .select({ address: eraUserStatus.address })
    .from(eraUserStatus)
    .where(
      and(
        eq(eraUserStatus.era, priorEra),
        eq(eraUserStatus.isActiveNextEra, true),
      ),
    );

  return new Set(rows.map((r) => r.address.trim()).filter(Boolean));
}

export async function getActiveGovernorsDenominatorForChamberCurrentEra(
  env: Env,
  input: {
    chamberId: string;
    fallbackActiveGovernors: number;
    genesisMembers?: string[] | null;
  },
): Promise<number> {
  const chamberId = input.chamberId.trim().toLowerCase();

  const eligible = await getEligibleGovernorAddressesForChamber(env, {
    chamberId,
    genesisMembers: input.genesisMembers ?? null,
  });

  const eligibleCount = eligible.size;
  if (eligibleCount === 0) return 0;

  const activeSet = await getActiveGovernorAddressesForCurrentEra(env);
  if (!activeSet) {
    return Math.max(0, Math.min(input.fallbackActiveGovernors, eligibleCount));
  }

  let activeInChamber = 0;
  for (const address of activeSet) {
    if (eligible.has(address.trim())) activeInChamber += 1;
  }

  return Math.max(0, Math.min(activeInChamber, eligibleCount));
}
