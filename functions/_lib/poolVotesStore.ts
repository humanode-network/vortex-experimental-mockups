import { and, eq, sql } from "drizzle-orm";

import { poolVotes } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

type Direction = 1 | -1;

type Counts = { upvotes: number; downvotes: number };

const memoryVotes = new Map<string, Map<string, Direction>>();

export async function hasPoolVote(
  env: Env,
  input: { proposalId: string; voterAddress: string },
): Promise<boolean> {
  const voterAddress = input.voterAddress.trim();
  if (!env.DATABASE_URL) {
    const byVoter = memoryVotes.get(input.proposalId);
    if (!byVoter) return false;
    return byVoter.has(voterAddress);
  }
  const db = createDb(env);
  const existing = await db
    .select({ direction: poolVotes.direction })
    .from(poolVotes)
    .where(
      and(
        eq(poolVotes.proposalId, input.proposalId),
        eq(poolVotes.voterAddress, voterAddress),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function castPoolVote(
  env: Env,
  input: { proposalId: string; voterAddress: string; direction: Direction },
): Promise<{ counts: Counts; created: boolean }> {
  if (!env.DATABASE_URL) {
    const byVoter =
      memoryVotes.get(input.proposalId) ?? new Map<string, Direction>();
    const key = input.voterAddress.trim();
    const created = !byVoter.has(key);
    byVoter.set(key, input.direction);
    memoryVotes.set(input.proposalId, byVoter);
    return { counts: countMemory(input.proposalId), created };
  }

  const db = createDb(env);
  const voterAddress = input.voterAddress.trim();
  const existing = await db
    .select({ direction: poolVotes.direction })
    .from(poolVotes)
    .where(
      and(
        eq(poolVotes.proposalId, input.proposalId),
        eq(poolVotes.voterAddress, voterAddress),
      ),
    )
    .limit(1);
  const created = existing.length === 0;
  const now = new Date();
  await db
    .insert(poolVotes)
    .values({
      proposalId: input.proposalId,
      voterAddress,
      direction: input.direction,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [poolVotes.proposalId, poolVotes.voterAddress],
      set: { direction: input.direction, updatedAt: now },
    });

  return { counts: await getPoolVoteCounts(env, input.proposalId), created };
}

export async function getPoolVoteCounts(
  env: Env,
  proposalId: string,
): Promise<Counts> {
  if (!env.DATABASE_URL) return countMemory(proposalId);
  const db = createDb(env);
  const rows = await db
    .select({
      upvotes: sql<number>`sum(case when ${poolVotes.direction} = 1 then 1 else 0 end)`,
      downvotes: sql<number>`sum(case when ${poolVotes.direction} = -1 then 1 else 0 end)`,
    })
    .from(poolVotes)
    .where(eq(poolVotes.proposalId, proposalId));

  const row = rows[0];
  return {
    upvotes: Number(row?.upvotes ?? 0),
    downvotes: Number(row?.downvotes ?? 0),
  };
}

export async function clearPoolVotesForTests() {
  memoryVotes.clear();
}

function countMemory(proposalId: string): Counts {
  const byVoter = memoryVotes.get(proposalId);
  if (!byVoter) return { upvotes: 0, downvotes: 0 };
  let upvotes = 0;
  let downvotes = 0;
  for (const direction of byVoter.values()) {
    if (direction === 1) upvotes += 1;
    if (direction === -1) downvotes += 1;
  }
  return { upvotes, downvotes };
}
