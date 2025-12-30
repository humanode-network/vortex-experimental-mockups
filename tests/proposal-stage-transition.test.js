import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clearProposalsForTests,
  createProposal,
  getProposal,
  transitionProposalStage,
} from "../functions/_lib/proposalsStore.ts";

const env = {};

test("proposal stage transitions: compare-and-set + validation", async () => {
  clearProposalsForTests();

  await createProposal(env, {
    id: "p-1",
    stage: "pool",
    authorAddress: "alice",
    title: "Test",
    chamberId: "engineering",
    summary: "Summary",
    payload: {},
  });

  const moved = await transitionProposalStage(env, {
    proposalId: "p-1",
    from: "pool",
    to: "vote",
  });
  assert.equal(moved, true);
  assert.equal((await getProposal(env, "p-1"))?.stage, "vote");

  const movedAgain = await transitionProposalStage(env, {
    proposalId: "p-1",
    from: "pool",
    to: "vote",
  });
  assert.equal(movedAgain, false);

  await assert.rejects(
    () =>
      transitionProposalStage(env, {
        proposalId: "p-1",
        from: "vote",
        to: "pool",
      }),
    /invalid_transition/,
  );
});
