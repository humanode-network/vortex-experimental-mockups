import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clearDelegationsForTests,
  setDelegation,
} from "../functions/_lib/delegationsStore.ts";

const env = {};

test("delegation: rejects cycles within a chamber", async () => {
  clearDelegationsForTests();

  await setDelegation(env, {
    chamberId: "general",
    delegatorAddress: "A",
    delegateeAddress: "B",
  });

  await assert.rejects(
    () =>
      setDelegation(env, {
        chamberId: "general",
        delegatorAddress: "B",
        delegateeAddress: "A",
      }),
    (err) => {
      assert.equal(err?.message, "delegation_cycle");
      return true;
    },
  );
});
