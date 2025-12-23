import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as chambersGet } from "../functions/api/chambers/index.ts";
import { onRequestGet as chamberGet } from "../functions/api/chambers/[id].ts";
import { onRequestGet as proposalsGet } from "../functions/api/proposals/index.ts";
import { onRequestGet as proposalPoolGet } from "../functions/api/proposals/[id]/pool.ts";
import { onRequestGet as courtsGet } from "../functions/api/courts/index.ts";
import { onRequestGet as courtGet } from "../functions/api/courts/[id].ts";
import { onRequestGet as humansGet } from "../functions/api/humans/index.ts";
import { onRequestGet as humanGet } from "../functions/api/humans/[id].ts";
import { onRequestGet as clockGet } from "../functions/api/clock/index.ts";
import { onRequestPost as clockAdvancePost } from "../functions/api/clock/advance-era.ts";

function makeContext({ url, env, params, method = "GET", headers }) {
  return {
    request: new Request(url, { method, headers }),
    env,
    params,
  };
}

const inlineEnv = { READ_MODELS_INLINE: "true", DEV_BYPASS_ADMIN: "true" };

test("GET /api/chambers returns items", async () => {
  const res = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items.length > 0);
  assert.ok(json.items[0].id);
});

test("GET /api/chambers/:id returns seeded chamber detail (engineering)", async () => {
  const res = await chamberGet(
    makeContext({
      url: "https://local.test/api/chambers/engineering",
      env: inlineEnv,
      params: { id: "engineering" },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.proposals));
  assert.ok(Array.isArray(json.governors));
});

test("GET /api/proposals returns items and can filter by stage", async () => {
  const res = await proposalsGet(
    makeContext({
      url: "https://local.test/api/proposals?stage=pool",
      env: inlineEnv,
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  for (const item of json.items) assert.equal(item.stage, "pool");
});

test("GET /api/proposals/:id/pool returns page model", async () => {
  const res = await proposalPoolGet(
    makeContext({
      url: "https://local.test/api/proposals/biometric-account-recovery/pool",
      env: inlineEnv,
      params: { id: "biometric-account-recovery" },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.title, "Biometric Account Recovery & Key Rotation Pallet");
  assert.ok(typeof json.summary === "string");
});

test("GET /api/courts returns list items", async () => {
  const res = await courtsGet(
    makeContext({ url: "https://local.test/api/courts", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items[0].id);
  assert.equal(typeof json.items[0].triggeredBy, "string");
});

test("GET /api/courts/:id returns detail model", async () => {
  const res = await courtGet(
    makeContext({
      url: "https://local.test/api/courts/delegation-reroute-keeper-nyx",
      env: inlineEnv,
      params: { id: "delegation-reroute-keeper-nyx" },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.id, "delegation-reroute-keeper-nyx");
  assert.ok(Array.isArray(json.parties));
  assert.ok(Array.isArray(json.proceedings?.evidence));
});

test("GET /api/humans returns items", async () => {
  const res = await humansGet(
    makeContext({ url: "https://local.test/api/humans", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items[0].id);
});

test("GET /api/humans/:id returns profile model", async () => {
  const res = await humanGet(
    makeContext({
      url: "https://local.test/api/humans/dato",
      env: inlineEnv,
      params: { id: "dato" },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.id, "dato");
  assert.ok(Array.isArray(json.heroStats));
  assert.ok(json.proofSections?.time);
});

test("GET /api/clock returns a snapshot and POST /api/clock/advance-era increments", async () => {
  const res1 = await clockGet(
    makeContext({ url: "https://local.test/api/clock", env: inlineEnv }),
  );
  assert.equal(res1.status, 200);
  const snap1 = await res1.json();
  assert.equal(typeof snap1.currentEra, "number");

  const res2 = await clockAdvancePost(
    makeContext({
      url: "https://local.test/api/clock/advance-era",
      env: inlineEnv,
      method: "POST",
    }),
  );
  assert.equal(res2.status, 200);
  const snap2 = await res2.json();
  assert.equal(snap2.currentEra, snap1.currentEra + 1);
});
