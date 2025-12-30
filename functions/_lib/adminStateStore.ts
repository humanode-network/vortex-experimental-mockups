import { eq } from "drizzle-orm";

import { adminState } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type AdminStateSnapshot = {
  writesFrozen: boolean;
};

export type AdminStateStore = {
  get: () => Promise<AdminStateSnapshot>;
  setWritesFrozen: (writesFrozen: boolean) => Promise<void>;
};

let memoryWritesFrozen = false;

export function createAdminStateStore(env: Env): AdminStateStore {
  if (!env.DATABASE_URL || env.READ_MODELS_INLINE === "true") {
    return {
      get: async () => ({ writesFrozen: memoryWritesFrozen }),
      setWritesFrozen: async (writesFrozen) => {
        memoryWritesFrozen = writesFrozen;
      },
    };
  }

  const db = createDb(env);
  const rowId = 1;

  async function ensureRow(): Promise<void> {
    await db
      .insert(adminState)
      .values({ id: rowId, writesFrozen: false })
      .onConflictDoNothing();
  }

  return {
    get: async () => {
      await ensureRow();
      const rows = await db
        .select({ writesFrozen: adminState.writesFrozen })
        .from(adminState)
        .where(eq(adminState.id, rowId))
        .limit(1);
      return { writesFrozen: rows[0]?.writesFrozen ?? false };
    },
    setWritesFrozen: async (writesFrozen) => {
      await ensureRow();
      await db
        .insert(adminState)
        .values({ id: rowId, writesFrozen, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: adminState.id,
          set: { writesFrozen, updatedAt: new Date() },
        });
    },
  };
}

export function clearAdminStateForTests(): void {
  memoryWritesFrozen = false;
}
