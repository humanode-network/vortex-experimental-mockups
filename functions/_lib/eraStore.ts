import { and, eq, sql } from "drizzle-orm";

import { eraSnapshots, eraUserActivity } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { V1_ACTIVE_GOVERNORS_FALLBACK } from "./v1Constants.ts";
import { createClockStore } from "./clockStore.ts";

type Env = Record<string, string | undefined>;

type UserEraCounts = {
  poolVotes: number;
  chamberVotes: number;
  courtActions: number;
  formationActions: number;
};

type Snapshot = { era: number; activeGovernors: number };

const memoryEraSnapshots = new Map<number, Snapshot>();
const memoryEraActivity = new Map<string, UserEraCounts>(); // key: `${era}:${address}`

export async function listEraUserActivity(
  env: Env,
  input: { era: number },
): Promise<Array<{ address: string } & UserEraCounts>> {
  if (!env.DATABASE_URL) {
    const rows: Array<{ address: string } & UserEraCounts> = [];
    for (const [key, counts] of memoryEraActivity.entries()) {
      if (!key.startsWith(`${input.era}:`)) continue;
      const address = key.split(":").slice(1).join(":");
      rows.push({ address, ...counts });
    }
    return rows;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      address: eraUserActivity.address,
      poolVotes: eraUserActivity.poolVotes,
      chamberVotes: eraUserActivity.chamberVotes,
      courtActions: eraUserActivity.courtActions,
      formationActions: eraUserActivity.formationActions,
    })
    .from(eraUserActivity)
    .where(eq(eraUserActivity.era, input.era));
  return rows.map((r) => ({
    address: r.address,
    poolVotes: r.poolVotes,
    chamberVotes: r.chamberVotes,
    courtActions: r.courtActions,
    formationActions: r.formationActions,
  }));
}

export async function ensureEraSnapshot(
  env: Env,
  era: number,
): Promise<Snapshot> {
  if (!env.DATABASE_URL) {
    const existing = memoryEraSnapshots.get(era);
    if (existing) return existing;
    const snap = { era, activeGovernors: getActiveGovernorsBaseline(env) };
    memoryEraSnapshots.set(era, snap);
    return snap;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      era: eraSnapshots.era,
      activeGovernors: eraSnapshots.activeGovernors,
    })
    .from(eraSnapshots)
    .where(eq(eraSnapshots.era, era))
    .limit(1);
  if (rows[0]) {
    return {
      era: rows[0].era ?? era,
      activeGovernors: rows[0].activeGovernors,
    };
  }

  const snap = { era, activeGovernors: getActiveGovernorsBaseline(env) };
  await db.insert(eraSnapshots).values({
    era: snap.era,
    activeGovernors: snap.activeGovernors,
    createdAt: new Date(),
  });
  return snap;
}

export async function setEraSnapshotActiveGovernors(
  env: Env,
  input: { era: number; activeGovernors: number },
): Promise<void> {
  const era = input.era;
  const activeGovernors = input.activeGovernors;
  await ensureEraSnapshot(env, era);

  if (!env.DATABASE_URL) {
    memoryEraSnapshots.set(era, { era, activeGovernors });
    return;
  }

  const db = createDb(env);
  await db
    .insert(eraSnapshots)
    .values({ era, activeGovernors, createdAt: new Date() })
    .onConflictDoUpdate({
      target: eraSnapshots.era,
      set: { activeGovernors },
    });
}

export async function getActiveGovernorsForCurrentEra(
  env: Env,
): Promise<number> {
  const clock = createClockStore(env);
  const { currentEra } = await clock.get();
  const snap = await ensureEraSnapshot(env, currentEra);
  return snap.activeGovernors;
}

export async function incrementEraUserActivity(
  env: Env,
  input: { address: string; delta: Partial<UserEraCounts> },
): Promise<void> {
  const clock = createClockStore(env);
  const { currentEra } = await clock.get();
  const address = input.address.trim();
  await ensureEraSnapshot(env, currentEra);

  const delta: UserEraCounts = {
    poolVotes: input.delta.poolVotes ?? 0,
    chamberVotes: input.delta.chamberVotes ?? 0,
    courtActions: input.delta.courtActions ?? 0,
    formationActions: input.delta.formationActions ?? 0,
  };

  if (!env.DATABASE_URL) {
    const key = `${currentEra}:${address}`;
    const prev = memoryEraActivity.get(key) ?? {
      poolVotes: 0,
      chamberVotes: 0,
      courtActions: 0,
      formationActions: 0,
    };
    memoryEraActivity.set(key, {
      poolVotes: prev.poolVotes + delta.poolVotes,
      chamberVotes: prev.chamberVotes + delta.chamberVotes,
      courtActions: prev.courtActions + delta.courtActions,
      formationActions: prev.formationActions + delta.formationActions,
    });
    return;
  }

  const db = createDb(env);
  const now = new Date();
  await db
    .insert(eraUserActivity)
    .values({
      era: currentEra,
      address,
      poolVotes: delta.poolVotes,
      chamberVotes: delta.chamberVotes,
      courtActions: delta.courtActions,
      formationActions: delta.formationActions,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [eraUserActivity.era, eraUserActivity.address],
      set: {
        poolVotes: sql`${eraUserActivity.poolVotes} + ${delta.poolVotes}`,
        chamberVotes: sql`${eraUserActivity.chamberVotes} + ${delta.chamberVotes}`,
        courtActions: sql`${eraUserActivity.courtActions} + ${delta.courtActions}`,
        formationActions: sql`${eraUserActivity.formationActions} + ${delta.formationActions}`,
        updatedAt: now,
      },
    });
}

export async function getUserEraActivity(
  env: Env,
  input: { address: string },
): Promise<{ era: number; counts: UserEraCounts; activeGovernors: number }> {
  const clock = createClockStore(env);
  const { currentEra } = await clock.get();
  const snap = await ensureEraSnapshot(env, currentEra);
  const address = input.address.trim();

  if (!env.DATABASE_URL) {
    const key = `${currentEra}:${address}`;
    const counts = memoryEraActivity.get(key) ?? {
      poolVotes: 0,
      chamberVotes: 0,
      courtActions: 0,
      formationActions: 0,
    };
    return { era: currentEra, counts, activeGovernors: snap.activeGovernors };
  }

  const db = createDb(env);
  const rows = await db
    .select({
      poolVotes: eraUserActivity.poolVotes,
      chamberVotes: eraUserActivity.chamberVotes,
      courtActions: eraUserActivity.courtActions,
      formationActions: eraUserActivity.formationActions,
    })
    .from(eraUserActivity)
    .where(
      and(
        eq(eraUserActivity.era, currentEra),
        eq(eraUserActivity.address, address),
      ),
    )
    .limit(1);
  const row = rows[0];
  const counts: UserEraCounts = {
    poolVotes: row?.poolVotes ?? 0,
    chamberVotes: row?.chamberVotes ?? 0,
    courtActions: row?.courtActions ?? 0,
    formationActions: row?.formationActions ?? 0,
  };
  return { era: currentEra, counts, activeGovernors: snap.activeGovernors };
}

export function clearEraForTests() {
  memoryEraSnapshots.clear();
  memoryEraActivity.clear();
}

function getActiveGovernorsBaseline(env: Env): number {
  const raw = env.SIM_ACTIVE_GOVERNORS ?? env.VORTEX_ACTIVE_GOVERNORS ?? "";
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  return V1_ACTIVE_GOVERNORS_FALLBACK;
}
