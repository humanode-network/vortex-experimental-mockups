import { eq, sql } from "drizzle-orm";

import { poolVotes } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

type Direction = 1 | -1;

type Counts = { upvotes: number; downvotes: number };

const memoryVotes = new Map<string, Map<string, Direction>>();

export async function castPoolVote(
  env: Env,
  input: { proposalId: string; voterAddress: string; direction: Direction },
): Promise<Counts> {
  if (!env.DATABASE_URL) {
    const byVoter =
      memoryVotes.get(input.proposalId) ?? new Map<string, Direction>();
    byVoter.set(input.voterAddress.toLowerCase(), input.direction);
    memoryVotes.set(input.proposalId, byVoter);
    return countMemory(input.proposalId);
  }

  const db = createDb(env);
  const now = new Date();
  await db
    .insert(poolVotes)
    .values({
      proposalId: input.proposalId,
      voterAddress: input.voterAddress,
      direction: input.direction,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [poolVotes.proposalId, poolVotes.voterAddress],
      set: { direction: input.direction, updatedAt: now },
    });

  return await getPoolVoteCounts(env, input.proposalId);
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
