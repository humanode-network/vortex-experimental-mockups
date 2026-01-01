import { and, eq, sql } from "drizzle-orm";

import { delegationEvents, delegations } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type Delegation = {
  chamberId: string;
  delegatorAddress: string;
  delegateeAddress: string;
  createdAt: string;
  updatedAt: string;
};

type StoredDelegation = {
  delegateeAddress: string;
  createdAt: string;
  updatedAt: string;
};
const memory = new Map<string, Map<string, StoredDelegation>>(); // chamberId -> delegator -> record

function normalizeChamberId(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAddress(value: string): string {
  return value.trim();
}

export async function getDelegation(
  env: Env,
  input: { chamberId: string; delegatorAddress: string },
): Promise<Delegation | null> {
  const chamberId = normalizeChamberId(input.chamberId);
  const delegatorAddress = normalizeAddress(input.delegatorAddress);

  if (!env.DATABASE_URL) {
    const byDelegator = memory.get(chamberId);
    const row = byDelegator?.get(delegatorAddress);
    if (!row) return null;
    return {
      chamberId,
      delegatorAddress,
      delegateeAddress: row.delegateeAddress,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  const db = createDb(env);
  const rows = await db
    .select({
      chamberId: delegations.chamberId,
      delegatorAddress: delegations.delegatorAddress,
      delegateeAddress: delegations.delegateeAddress,
      createdAt: delegations.createdAt,
      updatedAt: delegations.updatedAt,
    })
    .from(delegations)
    .where(
      and(
        eq(delegations.chamberId, chamberId),
        eq(delegations.delegatorAddress, delegatorAddress),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    chamberId: row.chamberId,
    delegatorAddress: row.delegatorAddress,
    delegateeAddress: row.delegateeAddress,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function setDelegation(
  env: Env,
  input: {
    chamberId: string;
    delegatorAddress: string;
    delegateeAddress: string;
  },
): Promise<Delegation> {
  const chamberId = normalizeChamberId(input.chamberId);
  const delegatorAddress = normalizeAddress(input.delegatorAddress);
  const delegateeAddress = normalizeAddress(input.delegateeAddress);

  if (!chamberId) throw new Error("delegation_chamber_missing");
  if (!delegatorAddress) throw new Error("delegation_delegator_missing");
  if (!delegateeAddress) throw new Error("delegation_delegatee_missing");
  if (delegatorAddress === delegateeAddress) throw new Error("delegation_self");

  await assertNoDelegationCycle(env, {
    chamberId,
    delegatorAddress,
    delegateeAddress,
  });

  const now = new Date();

  if (!env.DATABASE_URL) {
    const byDelegator =
      memory.get(chamberId) ?? new Map<string, StoredDelegation>();
    const existing = byDelegator.get(delegatorAddress);
    const createdAt = existing?.createdAt ?? now.toISOString();
    const updatedAt = now.toISOString();
    byDelegator.set(delegatorAddress, {
      delegateeAddress,
      createdAt,
      updatedAt,
    });
    memory.set(chamberId, byDelegator);
    return {
      chamberId,
      delegatorAddress,
      delegateeAddress,
      createdAt,
      updatedAt,
    };
  }

  const db = createDb(env);
  const existing = await db
    .select({
      createdAt: delegations.createdAt,
    })
    .from(delegations)
    .where(
      and(
        eq(delegations.chamberId, chamberId),
        eq(delegations.delegatorAddress, delegatorAddress),
      ),
    )
    .limit(1);
  const createdAt = existing[0]?.createdAt ?? now;

  await db
    .insert(delegations)
    .values({
      chamberId,
      delegatorAddress,
      delegateeAddress,
      createdAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [delegations.chamberId, delegations.delegatorAddress],
      set: { delegateeAddress, updatedAt: now },
    });

  await db.insert(delegationEvents).values({
    chamberId,
    delegatorAddress,
    delegateeAddress,
    type: "set",
    createdAt: now,
  });

  return {
    chamberId,
    delegatorAddress,
    delegateeAddress,
    createdAt: createdAt.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function clearDelegation(
  env: Env,
  input: { chamberId: string; delegatorAddress: string },
): Promise<{ cleared: boolean }> {
  const chamberId = normalizeChamberId(input.chamberId);
  const delegatorAddress = normalizeAddress(input.delegatorAddress);
  if (!chamberId) throw new Error("delegation_chamber_missing");
  if (!delegatorAddress) throw new Error("delegation_delegator_missing");

  if (!env.DATABASE_URL) {
    const byDelegator = memory.get(chamberId);
    if (!byDelegator) return { cleared: false };
    const cleared = byDelegator.delete(delegatorAddress);
    return { cleared };
  }

  const db = createDb(env);
  const existing = await db
    .select({ n: sql<number>`count(*)` })
    .from(delegations)
    .where(
      and(
        eq(delegations.chamberId, chamberId),
        eq(delegations.delegatorAddress, delegatorAddress),
      ),
    )
    .limit(1);
  const cleared = Number(existing[0]?.n ?? 0) > 0;
  if (!cleared) return { cleared: false };

  await db
    .delete(delegations)
    .where(
      and(
        eq(delegations.chamberId, chamberId),
        eq(delegations.delegatorAddress, delegatorAddress),
      ),
    );

  await db.insert(delegationEvents).values({
    chamberId,
    delegatorAddress,
    delegateeAddress: null,
    type: "clear",
    createdAt: new Date(),
  });

  return { cleared: true };
}

export async function getDelegationMapForChamber(
  env: Env,
  chamberIdInput: string,
): Promise<Map<string, string>> {
  const chamberId = normalizeChamberId(chamberIdInput);
  const map = new Map<string, string>(); // delegator -> delegatee

  if (!env.DATABASE_URL) {
    const byDelegator = memory.get(chamberId);
    if (!byDelegator) return map;
    for (const [delegator, record] of byDelegator.entries()) {
      map.set(delegator, record.delegateeAddress);
    }
    return map;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      delegatorAddress: delegations.delegatorAddress,
      delegateeAddress: delegations.delegateeAddress,
    })
    .from(delegations)
    .where(eq(delegations.chamberId, chamberId));
  for (const row of rows) {
    map.set(row.delegatorAddress, row.delegateeAddress);
  }
  return map;
}

export async function getDelegationWeightsForChamber(
  env: Env,
  input: { chamberId: string; excludedDelegators?: Set<string> },
): Promise<Map<string, number>> {
  const chamberId = normalizeChamberId(input.chamberId);
  const excluded = input.excludedDelegators ?? new Set<string>();
  const weights = new Map<string, number>(); // delegatee -> count

  const map = await getDelegationMapForChamber(env, chamberId);
  for (const [delegator, delegatee] of map.entries()) {
    if (excluded.has(delegator)) continue;
    weights.set(delegatee, (weights.get(delegatee) ?? 0) + 1);
  }
  return weights;
}

async function assertNoDelegationCycle(
  env: Env,
  input: {
    chamberId: string;
    delegatorAddress: string;
    delegateeAddress: string;
  },
): Promise<void> {
  const chamberId = input.chamberId;
  const delegatorAddress = input.delegatorAddress;
  const delegateeAddress = input.delegateeAddress;

  const map = await getDelegationMapForChamber(env, chamberId);
  map.set(delegatorAddress, delegateeAddress);

  const seen = new Set<string>();
  let current = delegateeAddress;
  while (true) {
    if (current === delegatorAddress) throw new Error("delegation_cycle");
    if (seen.has(current)) return;
    seen.add(current);
    const next = map.get(current);
    if (!next) return;
    current = next;
  }
}

export function clearDelegationsForTests(): void {
  memory.clear();
}
