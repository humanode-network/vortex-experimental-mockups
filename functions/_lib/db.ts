import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

type Env = Record<string, string | undefined>;

export type Db = ReturnType<typeof drizzle>;

export function createDb(env: Env): Db {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(url);
  return drizzle(sql);
}
