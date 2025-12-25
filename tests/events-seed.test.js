import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEventSeed } from "../db/seed/events.ts";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

test("events seed: deterministic and JSON-safe", () => {
  const seed = buildEventSeed();
  assert.ok(seed.length > 0);

  for (const entry of seed) {
    assert.equal(entry.type, "feed.item.v1");
    assert.equal(entry.entityType, "feed");
    assert.equal(typeof entry.entityId, "string");
    assert.equal(entry.stage, entry.payload.stage);
    assert.equal(entry.entityId, entry.payload.id);
    assert.ok(entry.createdAt instanceof Date);

    assert.doesNotThrow(() => JSON.stringify(entry.payload));
  }

  // Deterministic ordering and stable output.
  const first = stableStringify(seed);
  const second = stableStringify(buildEventSeed());
  assert.equal(first, second);
});
