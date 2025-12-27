import { eq, sql } from "drizzle-orm";

import { cmAwards } from "../../db/schema.ts";
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

export async function getAcmDelta(
  env: Env,
  proposerId: string,
): Promise<number> {
  if (!env.DATABASE_URL) return memoryAcmByProposer.get(proposerId) ?? 0;

  const db = createDb(env);
  const rows = await db
    .select({
      sum: sql<number>`coalesce(sum(${cmAwards.mcmPoints}), 0)`,
    })
    .from(cmAwards)
    .where(eq(cmAwards.proposerId, proposerId));
  return Number(rows[0]?.sum ?? 0);
}

export async function clearCmAwardsForTests() {
  memoryAwardsByProposal.clear();
  memoryAcmByProposer.clear();
}
