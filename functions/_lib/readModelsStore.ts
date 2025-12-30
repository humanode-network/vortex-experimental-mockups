import { eq } from "drizzle-orm";

import { readModels } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type ReadModelsStore = {
  get: (key: string) => Promise<unknown | null>;
  set?: (key: string, payload: unknown) => Promise<void>;
};

export async function createReadModelsStore(
  env: Env,
): Promise<ReadModelsStore> {
  if (env.READ_MODELS_INLINE_EMPTY === "true") {
    const map = await getEmptyReadModelsMap();
    return {
      get: async (key) => map.get(key) ?? null,
      set: async (key, payload) => {
        map.set(key, payload);
      },
    };
  }
  if (env.READ_MODELS_INLINE === "true") {
    const map = await getInlineReadModelsMap();
    return {
      get: async (key) => map.get(key) ?? null,
      set: async (key, payload) => {
        map.set(key, payload);
      },
    };
  }

  const db = createDb(env);
  return {
    get: async (key) => {
      const rows = await db
        .select()
        .from(readModels)
        .where(eq(readModels.key, key))
        .limit(1);
      return rows[0]?.payload ?? null;
    },
    set: async (key, payload) => {
      const now = new Date();
      await db
        .insert(readModels)
        .values({ key, payload, updatedAt: now })
        .onConflictDoUpdate({
          target: readModels.key,
          set: { payload, updatedAt: now },
        });
    },
  };
}

let inlineReadModelsMap: Map<string, unknown> | null = null;
let emptyReadModelsMap: Map<string, unknown> | null = null;

export function clearInlineReadModelsForTests() {
  inlineReadModelsMap = null;
  emptyReadModelsMap = null;
}

async function getInlineReadModelsMap(): Promise<Map<string, unknown>> {
  if (inlineReadModelsMap) return inlineReadModelsMap;
  const { buildReadModelSeed } = await import("../../db/seed/readModels.ts");
  inlineReadModelsMap = new Map<string, unknown>(
    buildReadModelSeed().map((entry) => [entry.key, entry.payload]),
  );
  return inlineReadModelsMap;
}

async function getEmptyReadModelsMap(): Promise<Map<string, unknown>> {
  if (emptyReadModelsMap) return emptyReadModelsMap;
  emptyReadModelsMap = new Map<string, unknown>();
  return emptyReadModelsMap;
}
