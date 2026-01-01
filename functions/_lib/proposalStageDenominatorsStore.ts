import { and, eq, inArray } from "drizzle-orm";

import { proposalStageDenominators } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { createClockStore } from "./clockStore.ts";

type Env = Record<string, string | undefined>;

export type ProposalDenominatorStage = "pool" | "vote";

export type ProposalStageDenominator = {
  proposalId: string;
  stage: ProposalDenominatorStage;
  era: number;
  activeGovernors: number;
  capturedAt: string;
};

const memory = new Map<string, ProposalStageDenominator>(); // key: `${proposalId}:${stage}`

export async function captureProposalStageDenominator(
  env: Env,
  input: {
    proposalId: string;
    stage: ProposalDenominatorStage;
    activeGovernors: number;
  },
): Promise<void> {
  const proposalId = input.proposalId.trim();
  const stage = input.stage;
  const activeGovernors = Math.max(0, Math.floor(input.activeGovernors));

  const clock = createClockStore(env);
  const { currentEra } = await clock.get();

  const capturedAt = new Date().toISOString();
  const row: ProposalStageDenominator = {
    proposalId,
    stage,
    era: currentEra,
    activeGovernors,
    capturedAt,
  };

  if (!env.DATABASE_URL) {
    const key = `${proposalId}:${stage}`;
    if (memory.has(key)) return;
    memory.set(key, row);
    return;
  }

  const db = createDb(env);
  await db
    .insert(proposalStageDenominators)
    .values({
      proposalId,
      stage,
      era: currentEra,
      activeGovernors,
      capturedAt: new Date(capturedAt),
    })
    .onConflictDoNothing({
      target: [
        proposalStageDenominators.proposalId,
        proposalStageDenominators.stage,
      ],
    });
}

export async function getProposalStageDenominator(
  env: Env,
  input: { proposalId: string; stage: ProposalDenominatorStage },
): Promise<ProposalStageDenominator | null> {
  const proposalId = input.proposalId.trim();
  const stage = input.stage;

  if (!env.DATABASE_URL) {
    return memory.get(`${proposalId}:${stage}`) ?? null;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      proposalId: proposalStageDenominators.proposalId,
      stage: proposalStageDenominators.stage,
      era: proposalStageDenominators.era,
      activeGovernors: proposalStageDenominators.activeGovernors,
      capturedAt: proposalStageDenominators.capturedAt,
    })
    .from(proposalStageDenominators)
    .where(
      and(
        eq(proposalStageDenominators.proposalId, proposalId),
        eq(proposalStageDenominators.stage, stage),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    proposalId: row.proposalId,
    stage: row.stage as ProposalDenominatorStage,
    era: row.era,
    activeGovernors: row.activeGovernors,
    capturedAt: row.capturedAt.toISOString(),
  };
}

export async function getProposalStageDenominatorMap(
  env: Env,
  input: { stage: ProposalDenominatorStage; proposalIds: string[] },
): Promise<Map<string, ProposalStageDenominator>> {
  const stage = input.stage;
  const proposalIds = input.proposalIds.map((id) => id.trim()).filter(Boolean);
  const map = new Map<string, ProposalStageDenominator>();

  if (proposalIds.length === 0) return map;

  if (!env.DATABASE_URL) {
    for (const proposalId of proposalIds) {
      const row = memory.get(`${proposalId}:${stage}`);
      if (row) map.set(proposalId, row);
    }
    return map;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      proposalId: proposalStageDenominators.proposalId,
      stage: proposalStageDenominators.stage,
      era: proposalStageDenominators.era,
      activeGovernors: proposalStageDenominators.activeGovernors,
      capturedAt: proposalStageDenominators.capturedAt,
    })
    .from(proposalStageDenominators)
    .where(
      and(
        eq(proposalStageDenominators.stage, stage),
        inArray(proposalStageDenominators.proposalId, proposalIds),
      ),
    );

  for (const row of rows) {
    map.set(row.proposalId, {
      proposalId: row.proposalId,
      stage: row.stage as ProposalDenominatorStage,
      era: row.era,
      activeGovernors: row.activeGovernors,
      capturedAt: row.capturedAt.toISOString(),
    });
  }
  return map;
}

export function clearProposalStageDenominatorsForTests(): void {
  memory.clear();
}
