import { and, eq, sql } from "drizzle-orm";

import { chamberMultiplierSubmissions } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type ChamberMultiplierSubmission = {
  chamberId: string;
  voterAddress: string;
  multiplierTimes10: number;
  createdAt: Date;
  updatedAt: Date;
};

const memory = new Map<string, ChamberMultiplierSubmission>();

function keyFor(chamberId: string, voterAddress: string): string {
  return `${chamberId.trim().toLowerCase()}:${voterAddress.trim()}`;
}

export async function upsertChamberMultiplierSubmission(
  env: Env,
  input: {
    chamberId: string;
    voterAddress: string;
    multiplierTimes10: number;
  },
): Promise<{ submission: ChamberMultiplierSubmission; created: boolean }> {
  const chamberId = input.chamberId.trim().toLowerCase();
  const voterAddress = input.voterAddress.trim();
  const multiplierTimes10 = Math.floor(input.multiplierTimes10);

  const now = new Date();

  if (!env.DATABASE_URL) {
    const k = keyFor(chamberId, voterAddress);
    const existing = memory.get(k);
    if (existing) {
      const next: ChamberMultiplierSubmission = {
        ...existing,
        multiplierTimes10,
        updatedAt: now,
      };
      memory.set(k, next);
      return { submission: next, created: false };
    }
    const created: ChamberMultiplierSubmission = {
      chamberId,
      voterAddress,
      multiplierTimes10,
      createdAt: now,
      updatedAt: now,
    };
    memory.set(k, created);
    return { submission: created, created: true };
  }

  const db = createDb(env);

  const existingRows = await db
    .select({
      chamberId: chamberMultiplierSubmissions.chamberId,
      voterAddress: chamberMultiplierSubmissions.voterAddress,
      multiplierTimes10: chamberMultiplierSubmissions.multiplierTimes10,
      createdAt: chamberMultiplierSubmissions.createdAt,
      updatedAt: chamberMultiplierSubmissions.updatedAt,
    })
    .from(chamberMultiplierSubmissions)
    .where(
      and(
        eq(chamberMultiplierSubmissions.chamberId, chamberId),
        eq(chamberMultiplierSubmissions.voterAddress, voterAddress),
      ),
    )
    .limit(1);

  await db
    .insert(chamberMultiplierSubmissions)
    .values({
      chamberId,
      voterAddress,
      multiplierTimes10,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        chamberMultiplierSubmissions.chamberId,
        chamberMultiplierSubmissions.voterAddress,
      ],
      set: { multiplierTimes10, updatedAt: now },
    });

  const existing = existingRows[0] ?? null;
  const submission: ChamberMultiplierSubmission = {
    chamberId,
    voterAddress,
    multiplierTimes10,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { submission, created: existing === null };
}

export async function getChamberMultiplierAggregate(
  env: Env,
  input: { chamberId: string },
): Promise<{ submissions: number; avgTimes10: number | null }> {
  const chamberId = input.chamberId.trim().toLowerCase();

  if (!env.DATABASE_URL) {
    const rows = Array.from(memory.values()).filter(
      (row) => row.chamberId === chamberId,
    );
    if (rows.length === 0) return { submissions: 0, avgTimes10: null };
    const sum = rows.reduce((acc, row) => acc + row.multiplierTimes10, 0);
    const avg = Math.round(sum / rows.length);
    return { submissions: rows.length, avgTimes10: avg };
  }

  const db = createDb(env);
  const rows = await db
    .select({
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${chamberMultiplierSubmissions.multiplierTimes10})`,
    })
    .from(chamberMultiplierSubmissions)
    .where(eq(chamberMultiplierSubmissions.chamberId, chamberId))
    .limit(1);

  const count = Number(rows[0]?.count ?? 0);
  if (count === 0) return { submissions: 0, avgTimes10: null };
  const avg = rows[0]?.avg;
  const rounded = Number.isFinite(Number(avg)) ? Math.round(Number(avg)) : null;
  return { submissions: count, avgTimes10: rounded };
}

export function clearChamberMultiplierSubmissionsForTests(): void {
  memory.clear();
}
