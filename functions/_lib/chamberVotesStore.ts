import { and, eq, sql } from "drizzle-orm";

import { chamberVotes } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { getDelegationWeightsForChamber } from "./delegationsStore.ts";

type Env = Record<string, string | undefined>;

export type ChamberVoteChoice = 1 | 0 | -1;

export type ChamberVoteCounts = {
  yes: number;
  no: number;
  abstain: number;
};

type StoredChamberVote = { choice: ChamberVoteChoice; score?: number | null };
const memoryVotes = new Map<string, Map<string, StoredChamberVote>>();

export async function hasChamberVote(
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
    .select({ choice: chamberVotes.choice })
    .from(chamberVotes)
    .where(
      and(
        eq(chamberVotes.proposalId, input.proposalId),
        eq(chamberVotes.voterAddress, voterAddress),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function castChamberVote(
  env: Env,
  input: {
    proposalId: string;
    voterAddress: string;
    choice: ChamberVoteChoice;
    score?: number | null;
    chamberId?: string;
  },
): Promise<{ counts: ChamberVoteCounts; created: boolean }> {
  if (!env.DATABASE_URL) {
    const byVoter =
      memoryVotes.get(input.proposalId) ?? new Map<string, StoredChamberVote>();
    const voterKey = input.voterAddress.trim();
    const created = !byVoter.has(voterKey);
    byVoter.set(voterKey, {
      choice: input.choice,
      score: input.score ?? null,
    });
    memoryVotes.set(input.proposalId, byVoter);
    return {
      counts: await getChamberVoteCounts(env, input.proposalId, {
        chamberId: input.chamberId,
      }),
      created,
    };
  }

  const db = createDb(env);
  const voterAddress = input.voterAddress.trim();
  const existing = await db
    .select({ choice: chamberVotes.choice })
    .from(chamberVotes)
    .where(
      and(
        eq(chamberVotes.proposalId, input.proposalId),
        eq(chamberVotes.voterAddress, voterAddress),
      ),
    )
    .limit(1);
  const created = existing.length === 0;
  const now = new Date();
  await db
    .insert(chamberVotes)
    .values({
      proposalId: input.proposalId,
      voterAddress,
      choice: input.choice,
      score: input.score ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [chamberVotes.proposalId, chamberVotes.voterAddress],
      set: { choice: input.choice, score: input.score ?? null, updatedAt: now },
    });

  return {
    counts: await getChamberVoteCounts(env, input.proposalId, {
      chamberId: input.chamberId,
    }),
    created,
  };
}

export async function getChamberVoteCounts(
  env: Env,
  proposalId: string,
  input?: { chamberId?: string },
): Promise<ChamberVoteCounts> {
  const chamberId = input?.chamberId?.trim().toLowerCase();
  if (!env.DATABASE_URL) {
    return chamberId
      ? countWeightedFromMemory(env, proposalId, chamberId)
      : countMemory(proposalId);
  }

  const db = createDb(env);
  if (!chamberId) {
    const rows = await db
      .select({
        yes: sql<number>`sum(case when ${chamberVotes.choice} = 1 then 1 else 0 end)`,
        no: sql<number>`sum(case when ${chamberVotes.choice} = -1 then 1 else 0 end)`,
        abstain: sql<number>`sum(case when ${chamberVotes.choice} = 0 then 1 else 0 end)`,
      })
      .from(chamberVotes)
      .where(eq(chamberVotes.proposalId, proposalId));

    const row = rows[0];
    return {
      yes: Number(row?.yes ?? 0),
      no: Number(row?.no ?? 0),
      abstain: Number(row?.abstain ?? 0),
    };
  }

  const voteRows = await db
    .select({
      voterAddress: chamberVotes.voterAddress,
      choice: chamberVotes.choice,
    })
    .from(chamberVotes)
    .where(eq(chamberVotes.proposalId, proposalId));

  const voters = new Set(voteRows.map((r) => r.voterAddress));
  const weights = await getDelegationWeightsForChamber(env, {
    chamberId,
    excludedDelegators: voters,
  });

  let yes = 0;
  let no = 0;
  let abstain = 0;
  for (const row of voteRows) {
    const w = 1 + (weights.get(row.voterAddress) ?? 0);
    if (row.choice === 1) yes += w;
    if (row.choice === -1) no += w;
    if (row.choice === 0) abstain += w;
  }
  return { yes, no, abstain };
}

export async function clearChamberVotesForTests() {
  memoryVotes.clear();
}

export async function clearChamberVotesForProposal(
  env: Env,
  proposalId: string,
): Promise<void> {
  if (!env.DATABASE_URL) {
    memoryVotes.delete(proposalId);
    return;
  }

  const db = createDb(env);
  await db.delete(chamberVotes).where(eq(chamberVotes.proposalId, proposalId));
}

function countMemory(proposalId: string): ChamberVoteCounts {
  const byVoter = memoryVotes.get(proposalId);
  if (!byVoter) return { yes: 0, no: 0, abstain: 0 };
  let yes = 0;
  let no = 0;
  let abstain = 0;
  for (const vote of byVoter.values()) {
    if (vote.choice === 1) yes += 1;
    if (vote.choice === -1) no += 1;
    if (vote.choice === 0) abstain += 1;
  }
  return { yes, no, abstain };
}

async function countWeightedFromMemory(
  env: Env,
  proposalId: string,
  chamberId: string,
): Promise<ChamberVoteCounts> {
  const byVoter = memoryVotes.get(proposalId);
  if (!byVoter) return { yes: 0, no: 0, abstain: 0 };

  const voters = new Set<string>(byVoter.keys());
  const weights = await getDelegationWeightsForChamber(env, {
    chamberId,
    excludedDelegators: voters,
  });

  let yes = 0;
  let no = 0;
  let abstain = 0;
  for (const [voter, vote] of byVoter.entries()) {
    const w = 1 + (weights.get(voter) ?? 0);
    if (vote.choice === 1) yes += w;
    if (vote.choice === -1) no += w;
    if (vote.choice === 0) abstain += w;
  }
  return { yes, no, abstain };
}

export async function getChamberYesScoreAverage(
  env: Env,
  proposalId: string,
): Promise<number | null> {
  if (!env.DATABASE_URL) return getYesScoreAverageFromMemory(proposalId);

  const db = createDb(env);
  const rows = await db
    .select({
      avg: sql<number | null>`avg(${chamberVotes.score})`,
    })
    .from(chamberVotes)
    .where(
      sql`${chamberVotes.proposalId} = ${proposalId} and ${chamberVotes.choice} = 1`,
    );
  const avg = rows[0]?.avg ?? null;
  return avg === null ? null : Number(avg);
}

function getYesScoreAverageFromMemory(proposalId: string): number | null {
  const byVoter = memoryVotes.get(proposalId);
  if (!byVoter) return null;
  let sum = 0;
  let n = 0;
  for (const vote of byVoter.values()) {
    if (vote.choice !== 1) continue;
    if (typeof vote.score !== "number") continue;
    sum += vote.score;
    n += 1;
  }
  if (n === 0) return null;
  return sum / n;
}
