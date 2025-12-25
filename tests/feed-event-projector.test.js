import assert from "node:assert/strict";
import { test } from "node:test";

import { projectFeedPageFromEvents } from "../functions/_lib/feedEventProjector.ts";

function makeItem(id, stage) {
  return {
    id,
    title: `Title ${id}`,
    meta: "Meta",
    stage,
    summaryPill: "Pill",
    summary: "Summary",
    timestamp: "2026-01-01T00:00:00Z",
  };
}

test("feed event projector: paginates by seq and filters by stage", () => {
  const rows = [
    { seq: 1, stage: "pool", payload: makeItem("a", "pool") },
    { seq: 2, stage: "vote", payload: makeItem("b", "vote") },
    { seq: 3, stage: "pool", payload: makeItem("c", "pool") },
    { seq: 4, stage: "courts", payload: makeItem("d", "courts") },
  ];

  const page1 = projectFeedPageFromEvents(rows, { limit: 2 });
  assert.deepEqual(
    page1.items.map((i) => i.id),
    ["d", "c"],
  );
  assert.equal(page1.nextSeq, 2);

  const page2 = projectFeedPageFromEvents(rows, { limit: 2, beforeSeq: 2 });
  assert.deepEqual(
    page2.items.map((i) => i.id),
    ["a"],
  );
  assert.equal(page2.nextSeq, undefined);

  const pools = projectFeedPageFromEvents(rows, { limit: 10, stage: "pool" });
  assert.deepEqual(
    pools.items.map((i) => i.id),
    ["c", "a"],
  );
});
