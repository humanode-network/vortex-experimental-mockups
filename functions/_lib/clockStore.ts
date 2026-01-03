import { eq } from "drizzle-orm";

import { clockState } from "../../db/schema.ts";
import { envBoolean, envString } from "./env.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type ClockSnapshot = {
  currentEra: number;
  updatedAt: string;
};

export type ClockStore = {
  get: () => Promise<ClockSnapshot>;
  advanceEra: () => Promise<ClockSnapshot>;
};

let inlineEra = 0;
let inlineUpdatedAt = new Date().toISOString();

async function ensureClockRow(): Promise<ClockSnapshot> {
  return { currentEra: inlineEra, updatedAt: inlineUpdatedAt };
}

export function createClockStore(env: Env): ClockStore {
  if (
    env.READ_MODELS_INLINE === "true" ||
    env.READ_MODELS_INLINE_EMPTY === "true"
  ) {
    return {
      get: async () => ensureClockRow(),
      advanceEra: async () => {
        inlineEra += 1;
        inlineUpdatedAt = new Date().toISOString();
        return ensureClockRow();
      },
    };
  }

  const db = createDb(env);
  const clockRowId = 1;

  async function upsertDefaultRow(): Promise<void> {
    await db
      .insert(clockState)
      .values({ id: clockRowId, currentEra: 0 })
      .onConflictDoNothing();
  }

  async function readRow(): Promise<ClockSnapshot> {
    await upsertDefaultRow();
    const rows = await db
      .select({
        currentEra: clockState.currentEra,
        updatedAt: clockState.updatedAt,
      })
      .from(clockState)
      .where(eq(clockState.id, clockRowId))
      .limit(1);
    const updatedAt = rows[0]?.updatedAt
      ? rows[0].updatedAt.toISOString()
      : new Date(0).toISOString();
    return { currentEra: rows[0]?.currentEra ?? 0, updatedAt };
  }

  async function bumpEra(): Promise<ClockSnapshot> {
    const rows = await db
      .select({ currentEra: clockState.currentEra })
      .from(clockState)
      .where(eq(clockState.id, clockRowId))
      .limit(1);
    const currentEra = rows[0]?.currentEra ?? 0;
    const nextEra = currentEra + 1;
    const now = new Date();
    await db
      .insert(clockState)
      .values({ id: clockRowId, currentEra: nextEra, updatedAt: now })
      .onConflictDoUpdate({
        target: clockState.id,
        set: { currentEra: nextEra, updatedAt: now },
      });
    return { currentEra: nextEra, updatedAt: now.toISOString() };
  }

  return {
    get: async () => readRow(),
    advanceEra: async () => bumpEra(),
  };
}

export function clearClockForTests(): void {
  inlineEra = 0;
  inlineUpdatedAt = new Date().toISOString();
}

export function assertAdmin(context: { request: Request; env: Env }): void {
  if (envBoolean(context.env, "DEV_BYPASS_ADMIN")) return;
  const secret = envString(context.env, "ADMIN_SECRET");
  if (!secret) throw new Error("ADMIN_SECRET is required");
  const provided = context.request.headers.get("x-admin-secret") ?? "";
  if (!provided || provided !== secret) {
    const err = new Error("Unauthorized");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
}
