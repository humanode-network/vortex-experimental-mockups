import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as tickPost } from "../functions/api/clock/tick.ts";
import { clearClockForTests } from "../functions/_lib/clockStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
import { clearEraRollupsForTests } from "../functions/_lib/eraRollupStore.ts";

function makeContext({ url, env, method = "POST", headers, body }) {
  return {
    request: new Request(url, { method, headers, body }),
    env,
    params: {},
  };
}

test("clock tick: no advance when not due", async () => {
  clearClockForTests();
  clearEraForTests();
  clearEraRollupsForTests();

  const env = {
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_ERA_SECONDS: "9999999",
  };

  const res = await tickPost(
    makeContext({
      url: "https://local.test/api/clock/tick",
      env,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollup: false }),
    }),
  );

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.due, false);
  assert.equal(json.advanced, false);
  assert.equal(json.fromEra, 0);
  assert.equal(json.toEra, 0);
});

test("clock tick: force advance + rollup", async () => {
  clearClockForTests();
  clearEraForTests();
  clearEraRollupsForTests();

  const env = {
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_ERA_SECONDS: "9999999",
  };

  const res = await tickPost(
    makeContext({
      url: "https://local.test/api/clock/tick",
      env,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ forceAdvance: true, rollup: true }),
    }),
  );

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.due, true);
  assert.equal(json.advanced, true);
  assert.equal(json.fromEra, 0);
  assert.equal(json.toEra, 1);
  assert.ok(json.rollup);
  assert.equal(json.rollup.era, 0);
});
