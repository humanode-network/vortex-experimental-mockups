import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pathToFileURL } from "node:url";

import { readModels } from "../db/schema.ts";

import { chambers } from "../src/data/mock/chambers.ts";
import {
  chamberChatLog,
  chamberGovernors,
  chamberProposals,
  chamberThreads,
  proposalStageOptions,
} from "../src/data/mock/chamberDetail.ts";
import { courtCases } from "../src/data/mock/courts.ts";
import { humanNodes } from "../src/data/mock/humanNodes.ts";
import { humanNodeProfilesById } from "../src/data/mock/humanNodeProfiles.ts";
import { proposals } from "../src/data/mock/proposals.ts";
import {
  chamberProposalPageById,
  formationProposalPageById,
  poolProposalPageById,
} from "../src/data/mock/proposalPages.ts";

export type ReadModelSeedEntry = { key: string; payload: unknown };

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

export function buildReadModelSeed(): ReadModelSeedEntry[] {
  const entries: ReadModelSeedEntry[] = [];

  entries.push({ key: "chambers:list", payload: { items: chambers } });
  entries.push({
    key: "chambers:engineering",
    payload: {
      proposals: chamberProposals,
      governors: chamberGovernors,
      threads: chamberThreads,
      chatLog: chamberChatLog,
      stageOptions: proposalStageOptions,
    },
  });

  entries.push({ key: "proposals:list", payload: { items: proposals } });
  entries.push({ key: "courts:list", payload: { items: courtCases } });
  entries.push({ key: "humans:list", payload: { items: humanNodes } });

  for (const [id, profile] of Object.entries(humanNodeProfilesById)) {
    entries.push({ key: `humans:${id}`, payload: profile });
  }

  for (const proposal of proposals) {
    const id = proposal.id;
    const poolPage = poolProposalPageById(id);
    const chamberPage = chamberProposalPageById(id);
    const formationPage = formationProposalPageById(id);

    if (poolPage)
      entries.push({ key: `proposals:${id}:pool`, payload: poolPage });
    if (chamberPage)
      entries.push({ key: `proposals:${id}:chamber`, payload: chamberPage });
    if (formationPage)
      entries.push({
        key: `proposals:${id}:formation`,
        payload: formationPage,
      });
  }

  return entries;
}

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
