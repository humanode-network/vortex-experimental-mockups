import { and, eq, sql } from "drizzle-orm";

import { vetoVotes } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type VetoVoteChoice = "veto" | "keep";

export type VetoVoteCounts = {
  veto: number;
  keep: number;
};

type StoredVetoVote = { choice: VetoVoteChoice };
const memoryVotes = new Map<string, Map<string, StoredVetoVote>>();

export async function hasVetoVote(
  env: Env,
  input: { proposalId: string; voterAddress: string },
): Promise<boolean> {
  const voter = input.voterAddress.trim();
  if (!env.DATABASE_URL) {
    const byVoter = memoryVotes.get(input.proposalId);
    if (!byVoter) return false;
    return byVoter.has(voter);
  }

  const db = createDb(env);
  const existing = await db
    .select({ choice: vetoVotes.choice })
    .from(vetoVotes)
    .where(
      and(
        eq(vetoVotes.proposalId, input.proposalId),
        eq(vetoVotes.voterAddress, voter),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function castVetoVote(
  env: Env,
  input: {
    proposalId: string;
    voterAddress: string;
    choice: VetoVoteChoice;
  },
): Promise<{ counts: VetoVoteCounts; created: boolean }> {
  const voter = input.voterAddress.trim();
  const now = new Date();

  if (!env.DATABASE_URL) {
    const byVoter =
      memoryVotes.get(input.proposalId) ?? new Map<string, StoredVetoVote>();
    const created = !byVoter.has(voter);
    byVoter.set(voter, { choice: input.choice });
    memoryVotes.set(input.proposalId, byVoter);
    return { counts: countMemory(input.proposalId), created };
  }

  const db = createDb(env);
  const existing = await db
    .select({ choice: vetoVotes.choice })
    .from(vetoVotes)
    .where(
      and(
        eq(vetoVotes.proposalId, input.proposalId),
        eq(vetoVotes.voterAddress, voter),
      ),
    )
    .limit(1);
  const created = existing.length === 0;
  await db
    .insert(vetoVotes)
    .values({
      proposalId: input.proposalId,
      voterAddress: voter,
      choice: input.choice,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [vetoVotes.proposalId, vetoVotes.voterAddress],
      set: { choice: input.choice, updatedAt: now },
    });

  return { counts: await getVetoVoteCounts(env, input.proposalId), created };
}

export async function getVetoVoteCounts(
  env: Env,
  proposalId: string,
): Promise<VetoVoteCounts> {
  if (!env.DATABASE_URL) return countMemory(proposalId);

  const db = createDb(env);
  const rows = await db
    .select({
      veto: sql<number>`sum(case when ${vetoVotes.choice} = 'veto' then 1 else 0 end)`,
      keep: sql<number>`sum(case when ${vetoVotes.choice} = 'keep' then 1 else 0 end)`,
    })
    .from(vetoVotes)
    .where(eq(vetoVotes.proposalId, proposalId));
  const row = rows[0];
  return { veto: Number(row?.veto ?? 0), keep: Number(row?.keep ?? 0) };
}

export async function clearVetoVotesForProposal(
  env: Env,
  proposalId: string,
): Promise<void> {
  if (!env.DATABASE_URL) {
    memoryVotes.delete(proposalId);
    return;
  }

  const db = createDb(env);
  await db.delete(vetoVotes).where(eq(vetoVotes.proposalId, proposalId));
}

export function clearVetoVotesForTests(): void {
  memoryVotes.clear();
}

function countMemory(proposalId: string): VetoVoteCounts {
  const byVoter = memoryVotes.get(proposalId);
  if (!byVoter) return { veto: 0, keep: 0 };
  let veto = 0;
  let keep = 0;
  for (const v of byVoter.values()) {
    if (v.choice === "veto") veto += 1;
    if (v.choice === "keep") keep += 1;
  }
  return { veto, keep };
}
