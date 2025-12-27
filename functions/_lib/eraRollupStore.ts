import { eq, sql } from "drizzle-orm";

import { eraRollups, eraUserStatus } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { listEraUserActivity } from "./eraStore.ts";

type Env = Record<string, string | undefined>;

export type GoverningStatus =
  | "Ahead"
  | "Stable"
  | "Falling behind"
  | "At risk"
  | "Losing status";

export type EraRequirements = {
  poolVotes: number;
  chamberVotes: number;
  courtActions: number;
  formationActions: number;
};

export type EraRollupResult = {
  era: number;
  rolledAt: string;
  requirements: EraRequirements;
  requiredTotal: number;
  activeGovernorsNextEra: number;
  usersRolled: number;
  statusCounts: Record<GoverningStatus, number>;
};

type StoredRollup = {
  era: number;
  requirements: EraRequirements;
  requiredTotal: number;
  activeGovernorsNextEra: number;
  rolledAt: string;
};

const memoryRollups = new Map<number, StoredRollup>();
const memoryUserStatuses = new Map<string, { status: GoverningStatus }>(); // key: `${era}:${address}`

export async function rollupEra(
  env: Env,
  input: { era: number },
): Promise<EraRollupResult> {
  const existing = await getEraRollup(env, input.era);
  if (existing) {
    const statusCounts = await getEraStatusCounts(env, input.era);
    const usersRolled = await getEraUsersRolled(env, input.era);
    return {
      era: existing.era,
      rolledAt: existing.rolledAt,
      requirements: existing.requirements,
      requiredTotal: existing.requiredTotal,
      activeGovernorsNextEra: existing.activeGovernorsNextEra,
      usersRolled,
      statusCounts,
    };
  }

  const requirements = getRequirements(env);
  const requiredTotal = sumRequirements(requirements);

  const activityRows = await listEraUserActivity(env, { era: input.era });
  const userStatuses = activityRows.map((row) => {
    const completedTotal =
      row.poolVotes +
      row.chamberVotes +
      row.courtActions +
      row.formationActions;
    const status = computeGoverningStatus(completedTotal, requiredTotal);
    const isActiveNextEra = isActiveByRequirements(row, requirements);
    return {
      address: row.address,
      status,
      completedTotal,
      isActiveNextEra,
      ...row,
    };
  });

  const activeGovernorsNextEra = userStatuses.filter(
    (u) => u.isActiveNextEra,
  ).length;

  const rolledAt = new Date().toISOString();
  await storeEraRollup(env, {
    era: input.era,
    requirements,
    requiredTotal,
    activeGovernorsNextEra,
    rolledAt,
    userStatuses,
  });

  const statusCounts = userStatuses.reduce(
    (acc, u) => {
      acc[u.status] += 1;
      return acc;
    },
    {
      Ahead: 0,
      Stable: 0,
      "Falling behind": 0,
      "At risk": 0,
      "Losing status": 0,
    } as Record<GoverningStatus, number>,
  );

  return {
    era: input.era,
    rolledAt,
    requirements,
    requiredTotal,
    activeGovernorsNextEra,
    usersRolled: userStatuses.length,
    statusCounts,
  };
}

export function clearEraRollupsForTests() {
  memoryRollups.clear();
  memoryUserStatuses.clear();
}

function computeGoverningStatus(
  completed: number,
  required: number,
): GoverningStatus {
  if (required <= 0) return "Stable";
  if (completed >= required + 2) return "Ahead";
  if (completed >= required) return "Stable";
  const ratio = completed / required;
  if (ratio >= 0.75) return "Falling behind";
  if (ratio >= 0.55) return "At risk";
  return "Losing status";
}

function isActiveByRequirements(
  counts: EraRequirements,
  required: EraRequirements,
): boolean {
  if (required.poolVotes > 0 && counts.poolVotes < required.poolVotes)
    return false;
  if (required.chamberVotes > 0 && counts.chamberVotes < required.chamberVotes)
    return false;
  if (required.courtActions > 0 && counts.courtActions < required.courtActions)
    return false;
  if (
    required.formationActions > 0 &&
    counts.formationActions < required.formationActions
  )
    return false;
  return true;
}

async function getEraRollup(
  env: Env,
  era: number,
): Promise<StoredRollup | null> {
  if (!env.DATABASE_URL) {
    return memoryRollups.get(era) ?? null;
  }
  const db = createDb(env);
  const rows = await db
    .select({
      era: eraRollups.era,
      requiredPoolVotes: eraRollups.requiredPoolVotes,
      requiredChamberVotes: eraRollups.requiredChamberVotes,
      requiredCourtActions: eraRollups.requiredCourtActions,
      requiredFormationActions: eraRollups.requiredFormationActions,
      requiredTotal: eraRollups.requiredTotal,
      activeGovernorsNextEra: eraRollups.activeGovernorsNextEra,
      rolledAt: eraRollups.rolledAt,
    })
    .from(eraRollups)
    .where(eq(eraRollups.era, era))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    era: row.era,
    requirements: {
      poolVotes: row.requiredPoolVotes,
      chamberVotes: row.requiredChamberVotes,
      courtActions: row.requiredCourtActions,
      formationActions: row.requiredFormationActions,
    },
    requiredTotal: row.requiredTotal,
    activeGovernorsNextEra: row.activeGovernorsNextEra,
    rolledAt: row.rolledAt.toISOString(),
  };
}

async function getEraStatusCounts(
  env: Env,
  era: number,
): Promise<Record<GoverningStatus, number>> {
  const base: Record<GoverningStatus, number> = {
    Ahead: 0,
    Stable: 0,
    "Falling behind": 0,
    "At risk": 0,
    "Losing status": 0,
  };
  if (!env.DATABASE_URL) {
    for (const [key, value] of memoryUserStatuses.entries()) {
      if (!key.startsWith(`${era}:`)) continue;
      base[value.status] += 1;
    }
    return base;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      status: eraUserStatus.status,
      n: sql<number>`count(*)`,
    })
    .from(eraUserStatus)
    .where(eq(eraUserStatus.era, era))
    .groupBy(eraUserStatus.status);
  for (const row of rows) {
    const status = String(row.status) as GoverningStatus;
    if (status in base) base[status] = Number(row.n ?? 0);
  }
  return base;
}

async function getEraUsersRolled(env: Env, era: number): Promise<number> {
  if (!env.DATABASE_URL) {
    let n = 0;
    for (const key of memoryUserStatuses.keys()) {
      if (key.startsWith(`${era}:`)) n += 1;
    }
    return n;
  }
  const db = createDb(env);
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(eraUserStatus)
    .where(eq(eraUserStatus.era, era));
  return Number(rows[0]?.n ?? 0);
}

async function storeEraRollup(
  env: Env,
  input: {
    era: number;
    requirements: EraRequirements;
    requiredTotal: number;
    activeGovernorsNextEra: number;
    rolledAt: string;
    userStatuses: Array<
      EraRequirements & {
        address: string;
        status: GoverningStatus;
        requiredTotal: number;
        completedTotal: number;
        isActiveNextEra: boolean;
      }
    >;
  },
): Promise<void> {
  if (!env.DATABASE_URL) {
    memoryRollups.set(input.era, {
      era: input.era,
      requirements: input.requirements,
      requiredTotal: input.requiredTotal,
      activeGovernorsNextEra: input.activeGovernorsNextEra,
      rolledAt: input.rolledAt,
    });
    for (const u of input.userStatuses) {
      memoryUserStatuses.set(`${input.era}:${u.address.toLowerCase()}`, {
        status: u.status,
      });
    }
    return;
  }

  const db = createDb(env);
  const now = new Date(input.rolledAt);
  await db
    .insert(eraRollups)
    .values({
      era: input.era,
      requiredPoolVotes: input.requirements.poolVotes,
      requiredChamberVotes: input.requirements.chamberVotes,
      requiredCourtActions: input.requirements.courtActions,
      requiredFormationActions: input.requirements.formationActions,
      requiredTotal: input.requiredTotal,
      activeGovernorsNextEra: input.activeGovernorsNextEra,
      rolledAt: now,
    })
    .onConflictDoNothing({ target: eraRollups.era });

  if (input.userStatuses.length === 0) return;
  await db
    .insert(eraUserStatus)
    .values(
      input.userStatuses.map((u) => ({
        era: input.era,
        address: u.address.toLowerCase(),
        status: u.status,
        requiredTotal: input.requiredTotal,
        completedTotal: u.completedTotal,
        isActiveNextEra: u.isActiveNextEra,
        poolVotes: u.poolVotes,
        chamberVotes: u.chamberVotes,
        courtActions: u.courtActions,
        formationActions: u.formationActions,
        createdAt: now,
      })),
    )
    .onConflictDoNothing({
      target: [eraUserStatus.era, eraUserStatus.address],
    });
}

function sumRequirements(req: EraRequirements): number {
  return (
    req.poolVotes + req.chamberVotes + req.courtActions + req.formationActions
  );
}

function getRequirements(env: Env): EraRequirements {
  return {
    poolVotes: envInt(env, "SIM_REQUIRED_POOL_VOTES", 1),
    chamberVotes: envInt(env, "SIM_REQUIRED_CHAMBER_VOTES", 1),
    courtActions: envInt(env, "SIM_REQUIRED_COURT_ACTIONS", 0),
    formationActions: envInt(env, "SIM_REQUIRED_FORMATION_ACTIONS", 0),
  };
}

function envInt(env: Env, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;
  return Math.floor(n);
}
