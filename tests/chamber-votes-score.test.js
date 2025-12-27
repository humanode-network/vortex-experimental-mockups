import assert from "node:assert/strict";
import { test } from "node:test";

import {
  castChamberVote,
  clearChamberVotesForTests,
  getChamberYesScoreAverage,
} from "../functions/_lib/chamberVotesStore.ts";

const env = {};

test("chamber vote score average is computed from yes votes only", async () => {
  await clearChamberVotesForTests();

  await castChamberVote(env, {
    proposalId: "tier-decay-v1",
    voterAddress: "5A",
    choice: 1,
    score: 8,
  });
  await castChamberVote(env, {
    proposalId: "tier-decay-v1",
    voterAddress: "5B",
    choice: 1,
    score: 6,
  });
  await castChamberVote(env, {
    proposalId: "tier-decay-v1",
    voterAddress: "5C",
    choice: -1,
    score: 10,
  });
  await castChamberVote(env, {
    proposalId: "tier-decay-v1",
    voterAddress: "5D",
    choice: 0,
    score: 10,
  });

  const avg = await getChamberYesScoreAverage(env, "tier-decay-v1");
  assert.equal(avg, 7);
});
