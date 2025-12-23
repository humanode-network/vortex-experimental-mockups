import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pathToFileURL } from "node:url";

import { readModels } from "../db/schema.ts";

import {
  buildReadModelSeed,
  type ReadModelSeedEntry,
} from "../db/seed/readModels.ts";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

async function upsertReadModel(
  db: ReturnType<typeof drizzle>,
  key: string,
  payload: unknown,
) {
  const now = new Date();
  await db
    .insert(readModels)
    .values({ key, payload, updatedAt: now })
    .onConflictDoUpdate({
      target: readModels.key,
      set: { payload, updatedAt: now },
    });
}

export { buildReadModelSeed };

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  for (const entry of buildReadModelSeed()) {
    await upsertReadModel(db, entry.key, entry.payload);
  }

  console.log("Seeded read models into Postgres.");
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
