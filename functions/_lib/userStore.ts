import { users } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export async function upsertUser(env: Env, input: { address: string }) {
  if (!env.DATABASE_URL) return;
  const db = createDb(env);
  await db
    .insert(users)
    .values({ address: input.address })
    .onConflictDoNothing();
}
