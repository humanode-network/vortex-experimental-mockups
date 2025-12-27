import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";

test("db migrations: contain core tables", () => {
  const migrationFiles = readdirSync("db/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
  const sql = migrationFiles
    .map((name) => readFileSync(`db/migrations/${name}`, "utf8"))
    .join("\n");
  for (const table of [
    "users",
    "auth_nonces",
    "eligibility_cache",
    "clock_state",
    "read_models",
    "events",
    "pool_votes",
    "chamber_votes",
    "idempotency_keys",
    "cm_awards",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE\\s+\\"${table}\\"`));
  }
});
