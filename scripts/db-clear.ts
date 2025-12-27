import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { pathToFileURL } from "node:url";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const client = neon(databaseUrl);
  const db = drizzle(client);

  await db.execute(
    sql`TRUNCATE TABLE auth_nonces, eligibility_cache, users, clock_state, read_models, events, pool_votes, chamber_votes, cm_awards, idempotency_keys, formation_projects, formation_team, formation_milestones, formation_milestone_events, court_cases, court_reports, court_verdicts, era_snapshots, era_user_activity RESTART IDENTITY`,
  );

  console.log("Cleared simulation tables (data removed, schema preserved).");
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
