import assert from "node:assert/strict";
import { test } from "node:test";

import { buildReadModelSeed } from "../db/seed/readModels.ts";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

test("db seed: produces deterministic, unique keys and JSON-safe payloads", () => {
  const seed = buildReadModelSeed();
  assert.ok(seed.length > 0);

  const keys = seed.map((e) => e.key);
  const uniqueKeys = new Set(keys);
  assert.equal(uniqueKeys.size, keys.length, "seed contains duplicate keys");

  // Basic must-have read models
  for (const required of [
    "chambers:list",
    "chambers:engineering",
    "proposals:list",
    "courts:list",
    "humans:list",
    "factions:list",
    "formation:directory",
    "invision:dashboard",
    "my-governance:summary",
    "proposals:drafts:list",
  ]) {
    assert.ok(uniqueKeys.has(required), `missing seed entry: ${required}`);
  }

  // JSON-safe: should be serializable without throwing and without Symbols/functions.
  for (const entry of seed) {
    assert.doesNotThrow(
      () => JSON.stringify(entry.payload),
      `payload not JSON-safe: ${entry.key}`,
    );
  }

  // Deterministic ordering for snapshot-like stability (in case we later hash it for idempotency).
  const first = stableStringify(seed);
  const second = stableStringify(buildReadModelSeed());
  assert.equal(first, second);
});
