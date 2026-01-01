import { eq, sql } from "drizzle-orm";

import { chambers, cmAwards } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type CmAwardInput = {
  proposalId: string;
  proposerId: string;
  chamberId: string;
  avgScore: number | null;
  lcmPoints: number;
  chamberMultiplierTimes10: number;
  mcmPoints: number;
};

export type CmAcmTotals = { acmPoints: number };

const memoryAwardsByProposal = new Map<string, CmAwardInput>();
const memoryAcmByProposer = new Map<string, number>();

export async function listCmAwards(
  env: Env,
  input?: { chamberId?: string | null; proposerIds?: string[] | null },
): Promise<CmAwardInput[]> {
  const chamberId = (input?.chamberId ?? null)?.trim().toLowerCase() ?? null;
  const proposerIds = input?.proposerIds ?? null;
  const proposerSet = proposerIds ? new Set(proposerIds) : null;

  if (!env.DATABASE_URL) {
    return Array.from(memoryAwardsByProposal.values()).filter((award) => {
      if (chamberId && award.chamberId !== chamberId) return false;
      if (proposerSet && !proposerSet.has(award.proposerId)) return false;
      return true;
    });
  }

  const db = createDb(env);
  const rows = await db
    .select({
      proposalId: cmAwards.proposalId,
      proposerId: cmAwards.proposerId,
      chamberId: cmAwards.chamberId,
      avgScore: cmAwards.avgScore,
      lcmPoints: cmAwards.lcmPoints,
      chamberMultiplierTimes10: cmAwards.chamberMultiplierTimes10,
      mcmPoints: cmAwards.mcmPoints,
    })
    .from(cmAwards);

  return rows
    .map((row) => ({
      proposalId: row.proposalId,
      proposerId: row.proposerId,
      chamberId: String(row.chamberId).trim().toLowerCase(),
      avgScore: row.avgScore === null ? null : Number(row.avgScore),
      lcmPoints: row.lcmPoints,
      chamberMultiplierTimes10: row.chamberMultiplierTimes10,
      mcmPoints: row.mcmPoints,
    }))
    .filter((award) => {
      if (chamberId && award.chamberId !== chamberId) return false;
      if (proposerSet && !proposerSet.has(award.proposerId)) return false;
      return true;
    });
}

export async function awardCmOnce(
  env: Env,
  input: CmAwardInput,
): Promise<void> {
  if (!env.DATABASE_URL) {
    if (memoryAwardsByProposal.has(input.proposalId)) return;
    memoryAwardsByProposal.set(input.proposalId, input);
    const prev = memoryAcmByProposer.get(input.proposerId) ?? 0;
    memoryAcmByProposer.set(input.proposerId, prev + input.mcmPoints);
    return;
  }

  const db = createDb(env);
  await db
    .insert(cmAwards)
    .values({
      proposalId: input.proposalId,
      proposerId: input.proposerId,
      chamberId: input.chamberId,
      avgScore: input.avgScore === null ? null : Math.round(input.avgScore),
      lcmPoints: input.lcmPoints,
      chamberMultiplierTimes10: input.chamberMultiplierTimes10,
      mcmPoints: input.mcmPoints,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: cmAwards.proposalId });
}

export async function hasLcmHistoryInChamber(
  env: Env,
  input: { proposerId: string; chamberId: string },
): Promise<boolean> {
  const proposerId = input.proposerId.trim();
  const chamberId = input.chamberId.trim().toLowerCase();
  if (!proposerId || !chamberId) return false;

  if (!env.DATABASE_URL) {
    for (const award of memoryAwardsByProposal.values()) {
      if (award.proposerId !== proposerId) continue;
      if (award.chamberId !== chamberId) continue;
      return true;
    }
    return false;
  }

  const db = createDb(env);
  const rows = await db
    .select({ proposalId: cmAwards.proposalId })
    .from(cmAwards)
    .where(
      sql`${cmAwards.proposerId} = ${proposerId} and ${cmAwards.chamberId} = ${chamberId}`,
    )
    .limit(1);
  return Boolean(rows[0]);
}

export async function getAcmDelta(
  env: Env,
  proposerId: string,
): Promise<number> {
  if (!env.DATABASE_URL) {
    const { getChamberMultiplierTimes10 } = await import("./chambersStore.ts");
    let sum = 0;
    for (const award of memoryAwardsByProposal.values()) {
      if (award.proposerId !== proposerId) continue;
      const times10 = await getChamberMultiplierTimes10(
        env,
        "https://local.test/api/internal",
        award.chamberId,
      );
      sum += Math.round((award.lcmPoints * times10) / 10);
    }
    return sum;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      sum: sql<number>`coalesce(sum(round(${cmAwards.lcmPoints} * coalesce(${chambers.multiplierTimes10}, ${cmAwards.chamberMultiplierTimes10}, 10) / 10.0)), 0)`,
    })
    .from(cmAwards)
    .leftJoin(chambers, eq(chambers.id, cmAwards.chamberId))
    .where(eq(cmAwards.proposerId, proposerId));
  return Number(rows[0]?.sum ?? 0);
}

export async function clearCmAwardsForTests() {
  memoryAwardsByProposal.clear();
  memoryAcmByProposer.clear();
}
