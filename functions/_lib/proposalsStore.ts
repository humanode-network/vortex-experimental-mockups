import { and, eq, sql } from "drizzle-orm";

import { proposals } from "../../db/schema.ts";
import { createDb } from "./db.ts";
type Env = Record<string, string | undefined>;

export type ProposalStage = "pool" | "vote" | "build";

export type ProposalRecord = {
  id: string;
  stage: ProposalStage;
  authorAddress: string;
  title: string;
  chamberId: string | null;
  summary: string;
  payload: unknown;
  vetoCount: number;
  votePassedAt: Date | null;
  voteFinalizesAt: Date | null;
  vetoCouncil: string[] | null;
  vetoThreshold: number | null;
  createdAt: Date;
  updatedAt: Date;
};

const memory = new Map<string, ProposalRecord>();

function normalizeVetoCouncil(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return null;
  const members = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  return members.length > 0 ? members : null;
}

export async function createProposal(
  env: Env,
  input: {
    id: string;
    stage: ProposalStage;
    authorAddress: string;
    title: string;
    chamberId: string | null;
    summary: string;
    payload: unknown;
    vetoCount?: number;
    votePassedAt?: Date | null;
    voteFinalizesAt?: Date | null;
    vetoCouncil?: string[] | null;
    vetoThreshold?: number | null;
  },
): Promise<ProposalRecord> {
  const now = new Date();
  const record: ProposalRecord = {
    id: input.id,
    stage: input.stage,
    authorAddress: input.authorAddress,
    title: input.title,
    chamberId: input.chamberId ?? null,
    summary: input.summary,
    payload: input.payload,
    vetoCount: input.vetoCount ?? 0,
    votePassedAt: input.votePassedAt ?? null,
    voteFinalizesAt: input.voteFinalizesAt ?? null,
    vetoCouncil: input.vetoCouncil ?? null,
    vetoThreshold: input.vetoThreshold ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (env.DATABASE_URL) {
    const db = createDb(env);
    await db.insert(proposals).values({
      id: record.id,
      stage: record.stage,
      authorAddress: record.authorAddress,
      title: record.title,
      chamberId: record.chamberId,
      summary: record.summary,
      payload: record.payload,
      vetoCount: record.vetoCount,
      votePassedAt: record.votePassedAt,
      voteFinalizesAt: record.voteFinalizesAt,
      vetoCouncil: record.vetoCouncil,
      vetoThreshold: record.vetoThreshold,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  memory.set(record.id, record);
  return record;
}

export async function updateProposalStage(
  env: Env,
  input: { proposalId: string; stage: ProposalStage },
): Promise<void> {
  const now = new Date();
  if (env.DATABASE_URL) {
    const db = createDb(env);
    await db
      .update(proposals)
      .set({ stage: input.stage, updatedAt: now })
      .where(eq(proposals.id, input.proposalId));
    return;
  }

  const existing = memory.get(input.proposalId);
  if (!existing) return;
  memory.set(input.proposalId, {
    ...existing,
    stage: input.stage,
    updatedAt: now,
  });
}

export async function setProposalVotePendingVeto(
  env: Env,
  input: {
    proposalId: string;
    passedAt: Date;
    finalizesAt: Date;
    vetoCouncil: string[];
    vetoThreshold: number;
  },
): Promise<void> {
  if (env.DATABASE_URL) {
    const db = createDb(env);
    await db
      .update(proposals)
      .set({
        votePassedAt: input.passedAt,
        voteFinalizesAt: input.finalizesAt,
        vetoCouncil: input.vetoCouncil,
        vetoThreshold: input.vetoThreshold,
      })
      .where(eq(proposals.id, input.proposalId));
    return;
  }

  const existing = memory.get(input.proposalId);
  if (!existing) return;
  memory.set(input.proposalId, {
    ...existing,
    votePassedAt: input.passedAt,
    voteFinalizesAt: input.finalizesAt,
    vetoCouncil: input.vetoCouncil,
    vetoThreshold: input.vetoThreshold,
  });
}

export async function clearProposalVotePendingVeto(
  env: Env,
  input: { proposalId: string },
): Promise<void> {
  if (env.DATABASE_URL) {
    const db = createDb(env);
    await db
      .update(proposals)
      .set({
        votePassedAt: null,
        voteFinalizesAt: null,
        vetoCouncil: null,
        vetoThreshold: null,
      })
      .where(eq(proposals.id, input.proposalId));
    return;
  }

  const existing = memory.get(input.proposalId);
  if (!existing) return;
  memory.set(input.proposalId, {
    ...existing,
    votePassedAt: null,
    voteFinalizesAt: null,
    vetoCouncil: null,
    vetoThreshold: null,
  });
}

export async function applyProposalVeto(
  env: Env,
  input: { proposalId: string; nextVoteStartsAt: Date },
): Promise<void> {
  if (env.DATABASE_URL) {
    const db = createDb(env);
    await db
      .update(proposals)
      .set({
        vetoCount: sql<number>`${proposals.vetoCount} + 1`,
        votePassedAt: null,
        voteFinalizesAt: null,
        vetoCouncil: null,
        vetoThreshold: null,
        updatedAt: input.nextVoteStartsAt,
      })
      .where(eq(proposals.id, input.proposalId));
    return;
  }

  const existing = memory.get(input.proposalId);
  if (!existing) return;
  memory.set(input.proposalId, {
    ...existing,
    vetoCount: existing.vetoCount + 1,
    votePassedAt: null,
    voteFinalizesAt: null,
    vetoCouncil: null,
    vetoThreshold: null,
    updatedAt: input.nextVoteStartsAt,
  });
}

export async function transitionProposalStage(
  env: Env,
  input: { proposalId: string; from: ProposalStage; to: ProposalStage },
): Promise<boolean> {
  if (
    !(
      (input.from === "pool" && input.to === "vote") ||
      (input.from === "vote" && input.to === "build")
    )
  ) {
    throw new Error("invalid_transition");
  }

  const now = new Date();
  if (env.DATABASE_URL) {
    const db = createDb(env);
    const res = await db
      .update(proposals)
      .set({ stage: input.to, updatedAt: now })
      .where(
        and(
          eq(proposals.id, input.proposalId),
          eq(proposals.stage, input.from),
        ),
      );
    return res.rowCount > 0;
  }

  const existing = memory.get(input.proposalId);
  if (!existing) return false;
  if (existing.stage !== input.from) return false;
  memory.set(input.proposalId, {
    ...existing,
    stage: input.to,
    updatedAt: now,
  });
  return true;
}

export async function getProposal(
  env: Env,
  proposalId: string,
): Promise<ProposalRecord | null> {
  if (env.DATABASE_URL) {
    const db = createDb(env);
    const rows = await db
      .select({
        id: proposals.id,
        stage: proposals.stage,
        authorAddress: proposals.authorAddress,
        title: proposals.title,
        chamberId: proposals.chamberId,
        summary: proposals.summary,
        payload: proposals.payload,
        vetoCount: proposals.vetoCount,
        votePassedAt: proposals.votePassedAt,
        voteFinalizesAt: proposals.voteFinalizesAt,
        vetoCouncil: proposals.vetoCouncil,
        vetoThreshold: proposals.vetoThreshold,
        createdAt: proposals.createdAt,
        updatedAt: proposals.updatedAt,
      })
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      stage: row.stage as ProposalStage,
      authorAddress: row.authorAddress,
      title: row.title,
      chamberId: row.chamberId ?? null,
      summary: row.summary,
      payload: row.payload,
      vetoCount: row.vetoCount ?? 0,
      votePassedAt: row.votePassedAt ?? null,
      voteFinalizesAt: row.voteFinalizesAt ?? null,
      vetoCouncil: normalizeVetoCouncil(row.vetoCouncil),
      vetoThreshold:
        typeof row.vetoThreshold === "number" ? row.vetoThreshold : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  return memory.get(proposalId) ?? null;
}

export async function listProposals(
  env: Env,
  input?: { stage?: ProposalStage | null },
): Promise<ProposalRecord[]> {
  const stage = input?.stage ?? null;
  if (env.DATABASE_URL) {
    const db = createDb(env);
    const base = db
      .select({
        id: proposals.id,
        stage: proposals.stage,
        authorAddress: proposals.authorAddress,
        title: proposals.title,
        chamberId: proposals.chamberId,
        summary: proposals.summary,
        payload: proposals.payload,
        vetoCount: proposals.vetoCount,
        votePassedAt: proposals.votePassedAt,
        voteFinalizesAt: proposals.voteFinalizesAt,
        vetoCouncil: proposals.vetoCouncil,
        vetoThreshold: proposals.vetoThreshold,
        createdAt: proposals.createdAt,
        updatedAt: proposals.updatedAt,
      })
      .from(proposals);
    const rows = stage
      ? await base.where(eq(proposals.stage, stage))
      : await base;
    return rows
      .map((row) => ({
        id: row.id,
        stage: row.stage as ProposalStage,
        authorAddress: row.authorAddress,
        title: row.title,
        chamberId: row.chamberId ?? null,
        summary: row.summary,
        payload: row.payload,
        vetoCount: row.vetoCount ?? 0,
        votePassedAt: row.votePassedAt ?? null,
        voteFinalizesAt: row.voteFinalizesAt ?? null,
        vetoCouncil: normalizeVetoCouncil(row.vetoCouncil),
        vetoThreshold:
          typeof row.vetoThreshold === "number" ? row.vetoThreshold : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const items = Array.from(memory.values());
  const filtered = stage ? items.filter((p) => p.stage === stage) : items;
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function clearProposalsForTests(): void {
  memory.clear();
}
