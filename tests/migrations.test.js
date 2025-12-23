import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

test("db migrations: initial migration exists and contains core tables", () => {
  const sql = readFileSync("db/migrations/0000_nosy_mastermind.sql", "utf8");
  for (const table of [
    "users",
    "eligibility_cache",
    "clock_state",
    "read_models",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE\\s+\\"${table}\\"`));
  }
});
