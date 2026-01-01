import { desc, eq, sql } from "drizzle-orm";

import { cmAwards } from "../../db/schema.ts";
import { listChambers } from "./chambersStore.ts";
import { createDb } from "./db.ts";
import { listCmAwards } from "./cmAwardsStore.ts";
import { V1_VETO_PASSING_FRACTION } from "./v1Constants.ts";

type Env = Record<string, string | undefined>;

export type VetoCouncilSnapshot = {
  members: string[];
  threshold: number;
};

function computeThreshold(memberCount: number): number {
  const n = Math.max(0, Math.floor(memberCount));
  if (n === 0) return 0;
  return Math.floor(n * V1_VETO_PASSING_FRACTION) + 1;
}

async function getTopLcmHolderForChamber(
  env: Env,
  chamberId: string,
): Promise<string | null> {
  const id = chamberId.trim().toLowerCase();
  if (!id) return null;

  if (!env.DATABASE_URL) {
    const awards = await listCmAwards(env, { chamberId: id });
    const totals = new Map<string, number>();
    for (const award of awards) {
      const proposer = award.proposerId.trim();
      if (!proposer) continue;
      totals.set(proposer, (totals.get(proposer) ?? 0) + award.lcmPoints);
    }
    let best: string | null = null;
    let bestPoints = -1;
    for (const [proposer, points] of totals.entries()) {
      if (points > bestPoints) {
        best = proposer;
        bestPoints = points;
      }
    }
    return best;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      proposerId: cmAwards.proposerId,
      lcm: sql<number>`sum(${cmAwards.lcmPoints})`,
    })
    .from(cmAwards)
    .where(eq(cmAwards.chamberId, id))
    .groupBy(cmAwards.proposerId)
    .orderBy(desc(sql<number>`sum(${cmAwards.lcmPoints})`))
    .limit(1);
  const top = rows[0]?.proposerId?.trim();
  return top ? top : null;
}

export async function computeVetoCouncilSnapshot(
  env: Env,
  requestUrl: string,
): Promise<VetoCouncilSnapshot> {
  const chambers = await listChambers(env, requestUrl, {
    includeDissolved: false,
  });

  const members = new Set<string>();
  for (const chamber of chambers) {
    const top = await getTopLcmHolderForChamber(env, chamber.id);
    if (top) members.add(top);
  }

  const list = Array.from(members);
  return { members: list, threshold: computeThreshold(list.length) };
}
