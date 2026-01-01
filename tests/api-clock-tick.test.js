import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as tickPost } from "../functions/api/clock/tick.ts";
import { clearClockForTests } from "../functions/_lib/clockStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
import { clearEraRollupsForTests } from "../functions/_lib/eraRollupStore.ts";
import {
  clearProposalsForTests,
  createProposal,
} from "../functions/_lib/proposalsStore.ts";
import {
  clearFeedEventsForTests,
  listFeedEventsPage,
} from "../functions/_lib/eventsStore.ts";

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
    DEV_BYPASS_GATE: "true",
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

test("clock tick: emits window-ended feed events (deduped)", async () => {
  clearClockForTests();
  clearEraForTests();
  clearEraRollupsForTests();
  clearProposalsForTests();
  clearFeedEventsForTests();

  const env = {
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_ERA_SECONDS: "9999999",
    SIM_ENABLE_STAGE_WINDOWS: "true",
    SIM_POOL_WINDOW_SECONDS: "1",
    SIM_VOTE_WINDOW_SECONDS: "1",
    SIM_NOW_ISO: new Date(Date.now() + 5_000).toISOString(),
  };

  await createProposal(env, {
    id: "p-1",
    stage: "pool",
    authorAddress: "5TestAddr",
    title: "Test proposal",
    chamberId: "engineering",
    summary: "Summary",
    payload: {},
  });

  await createProposal(env, {
    id: "p-2",
    stage: "vote",
    authorAddress: "5TestAddr",
    title: "Test proposal 2",
    chamberId: "engineering",
    summary: "Summary",
    payload: {},
  });

  const res1 = await tickPost(
    makeContext({
      url: "https://local.test/api/clock/tick",
      env,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollup: false }),
    }),
  );
  assert.equal(res1.status, 200);
  const json1 = await res1.json();
  assert.ok(Array.isArray(json1.endedWindows));
  assert.equal(json1.endedWindows.length, 2);
  assert.equal(json1.endedWindows.filter((window) => window.emitted).length, 2);

  const page1 = await listFeedEventsPage(env, { limit: 10 });
  assert.equal(page1.items.length, 2);
  assert.ok(page1.items.some((item) => item.stage === "pool"));
  assert.ok(page1.items.some((item) => item.stage === "vote"));

  const res2 = await tickPost(
    makeContext({
      url: "https://local.test/api/clock/tick",
      env,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollup: false }),
    }),
  );
  assert.equal(res2.status, 200);
  const json2 = await res2.json();
  assert.equal(json2.endedWindows.length, 2);
  assert.equal(json2.endedWindows.filter((window) => window.emitted).length, 0);

  const page2 = await listFeedEventsPage(env, { limit: 10 });
  assert.equal(page2.items.length, 2);
});
