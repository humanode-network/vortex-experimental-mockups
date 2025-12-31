import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { pathToFileURL } from "node:url";

import { chambers as chambersTable, events, readModels } from "../db/schema.ts";

import {
  buildReadModelSeed,
  type ReadModelSeedEntry,
} from "../db/seed/readModels.ts";
import { buildEventSeed } from "../db/seed/events.ts";
import { chambers as chamberFixtures } from "../db/seed/fixtures/chambers.ts";

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

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const client = neon(databaseUrl);
  const db = drizzle(client);

  for (const entry of buildReadModelSeed()) {
    await upsertReadModel(db, entry.key, entry.payload);
  }

  const eventSeed = buildEventSeed();
  await db.execute(sql`TRUNCATE TABLE events RESTART IDENTITY`);
  await db.execute(
    sql`TRUNCATE TABLE chambers, chamber_memberships, pool_votes, chamber_votes, cm_awards, idempotency_keys, formation_projects, formation_team, formation_milestones, formation_milestone_events, court_cases, court_reports, court_verdicts, era_snapshots, era_user_activity, era_rollups, era_user_status RESTART IDENTITY`,
  );

  await db.insert(chambersTable).values(
    chamberFixtures.map((chamber) => ({
      id: chamber.id,
      title: chamber.name,
      status: "active",
      multiplierTimes10: Math.round(chamber.multiplier * 10),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      dissolvedAt: null,
      createdByProposalId: null,
      dissolvedByProposalId: null,
    })),
  );

  if (eventSeed.length > 0) {
    await db.insert(events).values(
      eventSeed.map((event) => ({
        type: event.type,
        stage: event.stage,
        actorAddress: event.actorAddress,
        entityType: event.entityType,
        entityId: event.entityId,
        payload: event.payload,
        createdAt: event.createdAt,
      })),
    );
  }

  console.log("Seeded read models and events into Postgres.");
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
