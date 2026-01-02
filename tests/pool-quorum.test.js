import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluatePoolQuorum } from "../functions/_lib/poolQuorum.ts";

test("evaluatePoolQuorum uses ceil for engagedNeeded", () => {
  const result = evaluatePoolQuorum(
    { attentionQuorum: 0.22, activeGovernors: 150, upvoteFloor: 15 },
    { upvotes: 15, downvotes: 14 },
  );
  assert.equal(result.engagedNeeded, 33);
  assert.equal(result.attentionMet, false);
  assert.equal(result.upvoteMet, true);
  assert.equal(result.shouldAdvance, false);
});

test("evaluatePoolQuorum advances only when attention + upvote floor are met", () => {
  const result = evaluatePoolQuorum(
    { attentionQuorum: 0.22, activeGovernors: 150, upvoteFloor: 15 },
    { upvotes: 15, downvotes: 18 },
  );
  assert.equal(result.engaged, 33);
  assert.equal(result.attentionMet, true);
  assert.equal(result.upvoteMet, true);
  assert.equal(result.shouldAdvance, true);
});

test("evaluatePoolQuorum never advances when activeGovernors is zero", () => {
  const result = evaluatePoolQuorum(
    { attentionQuorum: 0.22, activeGovernors: 0, upvoteFloor: 1 },
    { upvotes: 10, downvotes: 0 },
  );
  assert.equal(result.attentionMet, false);
  assert.equal(result.shouldAdvance, false);
});
