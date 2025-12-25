import { eq } from "drizzle-orm";

import { readModels } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type ReadModelsStore = {
  get: (key: string) => Promise<unknown | null>;
};

export async function createReadModelsStore(
  env: Env,
): Promise<ReadModelsStore> {
  if (env.READ_MODELS_INLINE_EMPTY === "true") {
    return { get: async () => null };
  }
  if (env.READ_MODELS_INLINE === "true") {
    const { buildReadModelSeed } = await import("../../db/seed/readModels.ts");
    const map = new Map<string, unknown>(
      buildReadModelSeed().map((entry) => [entry.key, entry.payload]),
    );
    return {
      get: async (key) => map.get(key) ?? null,
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
  };
}
