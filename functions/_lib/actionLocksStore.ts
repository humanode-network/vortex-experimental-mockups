import { eq } from "drizzle-orm";

import { userActionLocks } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type ActionLock = {
  address: string;
  reason: string | null;
  lockedUntil: string;
};

export type ActionLocksStore = {
  getActiveLock: (address: string) => Promise<ActionLock | null>;
  listActiveLocks: () => Promise<ActionLock[]>;
  setLock: (input: {
    address: string;
    lockedUntil: Date;
    reason?: string | null;
  }) => Promise<void>;
  clearLock: (address: string) => Promise<void>;
};

const memoryLocks = new Map<
  string,
  { lockedUntilMs: number; reason: string | null }
>();

function normalizeAddress(address: string): string {
  return address.trim();
}

function nowMs(): number {
  return Date.now();
}

export function createActionLocksStore(env: Env): ActionLocksStore {
  if (!env.DATABASE_URL || env.READ_MODELS_INLINE === "true") {
    return {
      getActiveLock: async (address) => {
        const normalized = normalizeAddress(address);
        const lock = memoryLocks.get(normalized);
        if (!lock) return null;
        if (lock.lockedUntilMs <= nowMs()) return null;
        return {
          address: normalized,
          reason: lock.reason,
          lockedUntil: new Date(lock.lockedUntilMs).toISOString(),
        };
      },
      listActiveLocks: async () => {
        const now = nowMs();
        const result: ActionLock[] = [];
        for (const [address, lock] of memoryLocks.entries()) {
          if (lock.lockedUntilMs <= now) continue;
          result.push({
            address,
            reason: lock.reason,
            lockedUntil: new Date(lock.lockedUntilMs).toISOString(),
          });
        }
        result.sort((a, b) => a.address.localeCompare(b.address));
        return result;
      },
      setLock: async ({ address, lockedUntil, reason }) => {
        const normalized = normalizeAddress(address);
        memoryLocks.set(normalized, {
          lockedUntilMs: lockedUntil.getTime(),
          reason: reason ?? null,
        });
      },
      clearLock: async (address) => {
        const normalized = normalizeAddress(address);
        memoryLocks.delete(normalized);
      },
    };
  }

  const db = createDb(env);

  return {
    getActiveLock: async (address) => {
      const normalized = normalizeAddress(address);
      const rows = await db
        .select({
          address: userActionLocks.address,
          reason: userActionLocks.reason,
          lockedUntil: userActionLocks.lockedUntil,
        })
        .from(userActionLocks)
        .where(eq(userActionLocks.address, normalized))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      if (row.lockedUntil.getTime() <= nowMs()) return null;
      return {
        address: row.address,
        reason: row.reason ?? null,
        lockedUntil: row.lockedUntil.toISOString(),
      };
    },
    listActiveLocks: async () => {
      const now = new Date();
      const rows = await db
        .select({
          address: userActionLocks.address,
          reason: userActionLocks.reason,
          lockedUntil: userActionLocks.lockedUntil,
        })
        .from(userActionLocks);
      const filtered = rows
        .filter((r) => r.lockedUntil.getTime() > now.getTime())
        .map((r) => ({
          address: r.address,
          reason: r.reason ?? null,
          lockedUntil: r.lockedUntil.toISOString(),
        }));
      filtered.sort((a, b) => a.address.localeCompare(b.address));
      return filtered;
    },
    setLock: async ({ address, lockedUntil, reason }) => {
      const normalized = normalizeAddress(address);
      const now = new Date();
      await db
        .insert(userActionLocks)
        .values({
          address: normalized,
          lockedUntil,
          reason: reason ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userActionLocks.address,
          set: { lockedUntil, reason: reason ?? null, updatedAt: now },
        });
    },
    clearLock: async (address) => {
      const normalized = normalizeAddress(address);
      await db
        .delete(userActionLocks)
        .where(eq(userActionLocks.address, normalized));
    },
  };
}

export function clearActionLocksForTests(): void {
  memoryLocks.clear();
}

export async function setActionLockForTests(input: {
  env: Env;
  address: string;
  lockedUntil: Date;
  reason?: string | null;
}): Promise<void> {
  await createActionLocksStore(input.env).setLock(input);
}
