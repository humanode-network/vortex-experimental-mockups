import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateChamberQuorum } from "../functions/_lib/chamberQuorum.ts";

test("evaluateChamberQuorum requires quorum + passing", () => {
  const inputs = {
    quorumFraction: 0.33,
    activeGovernors: 150,
    passingFraction: 2 / 3,
  };

  const notEnoughQuorum = evaluateChamberQuorum(inputs, {
    yes: 40,
    no: 0,
    abstain: 0,
  });
  assert.equal(notEnoughQuorum.quorumNeeded, 50);
  assert.equal(notEnoughQuorum.quorumMet, false);
  assert.equal(notEnoughQuorum.shouldAdvance, false);

  const quorumButNotPassing = evaluateChamberQuorum(inputs, {
    yes: 33,
    no: 17,
    abstain: 0,
  });
  assert.equal(quorumButNotPassing.quorumMet, true);
  assert.equal(quorumButNotPassing.passMet, false);
  assert.equal(quorumButNotPassing.shouldAdvance, false);

  const quorumAndPassing = evaluateChamberQuorum(inputs, {
    yes: 35,
    no: 17,
    abstain: 0,
  });
  assert.equal(quorumAndPassing.quorumMet, true);
  assert.equal(quorumAndPassing.passMet, true);
  assert.equal(quorumAndPassing.shouldAdvance, true);
});
