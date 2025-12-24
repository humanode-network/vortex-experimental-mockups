import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

test("db migrations: contain core tables", () => {
  const sql = [
    readFileSync("db/migrations/0000_nosy_mastermind.sql", "utf8"),
    readFileSync("db/migrations/0001_bitter_oracle.sql", "utf8"),
  ].join("\n");
  for (const table of [
    "users",
    "auth_nonces",
    "eligibility_cache",
    "clock_state",
    "read_models",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE\\s+\\"${table}\\"`));
  }
});
