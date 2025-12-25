import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as chambersGet } from "../functions/api/chambers/index.ts";
import { onRequestGet as chamberGet } from "../functions/api/chambers/[id].ts";
import { onRequestGet as feedGet } from "../functions/api/feed/index.ts";
import { onRequestGet as proposalsGet } from "../functions/api/proposals/index.ts";
import { onRequestGet as proposalPoolGet } from "../functions/api/proposals/[id]/pool.ts";
import { onRequestGet as courtsGet } from "../functions/api/courts/index.ts";
import { onRequestGet as courtGet } from "../functions/api/courts/[id].ts";
import { onRequestGet as humansGet } from "../functions/api/humans/index.ts";
import { onRequestGet as humanGet } from "../functions/api/humans/[id].ts";
import { onRequestGet as factionsGet } from "../functions/api/factions/index.ts";
import { onRequestGet as factionGet } from "../functions/api/factions/[id].ts";
import { onRequestGet as formationGet } from "../functions/api/formation/index.ts";
import { onRequestGet as invisionGet } from "../functions/api/invision/index.ts";
import { onRequestGet as myGovGet } from "../functions/api/my-governance/index.ts";
import { onRequestGet as draftListGet } from "../functions/api/proposals/drafts/index.ts";
import { onRequestGet as draftGet } from "../functions/api/proposals/drafts/[id].ts";
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
const emptyEnv = { READ_MODELS_INLINE_EMPTY: "true", DEV_BYPASS_ADMIN: "true" };

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

test("GET /api/factions returns items", async () => {
  const res = await factionsGet(
    makeContext({ url: "https://local.test/api/factions", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items.length > 0);
  assert.ok(json.items[0].id);
});

test("GET /api/factions/:id returns a faction model", async () => {
  const res = await factionGet(
    makeContext({
      url: "https://local.test/api/factions/delegation-removal-supporters",
      env: inlineEnv,
      params: { id: "delegation-removal-supporters" },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.id, "delegation-removal-supporters");
  assert.ok(Array.isArray(json.goals));
  assert.ok(Array.isArray(json.roster));
});

test("GET /api/formation returns metrics and projects", async () => {
  const res = await formationGet(
    makeContext({ url: "https://local.test/api/formation", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.metrics));
  assert.ok(Array.isArray(json.projects));
});

test("GET /api/invision returns dashboard model", async () => {
  const res = await invisionGet(
    makeContext({ url: "https://local.test/api/invision", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(typeof json.governanceState?.label, "string");
  assert.ok(Array.isArray(json.economicIndicators));
  assert.ok(Array.isArray(json.riskSignals));
});

test("GET /api/my-governance returns era activity and chambers", async () => {
  const res = await myGovGet(
    makeContext({
      url: "https://local.test/api/my-governance",
      env: inlineEnv,
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(typeof json.eraActivity?.era, "string");
  assert.ok(Array.isArray(json.myChamberIds));
});

test("GET /api/proposals/drafts returns items", async () => {
  const res = await draftListGet(
    makeContext({
      url: "https://local.test/api/proposals/drafts",
      env: inlineEnv,
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items[0].id);
});

test("GET /api/proposals/drafts/:id returns detail model", async () => {
  const res = await draftGet(
    makeContext({
      url: "https://local.test/api/proposals/drafts/draft-vortex-ux-v1",
      env: inlineEnv,
      params: { id: "draft-vortex-ux-v1" },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(
    json.title,
    "Vortex Governance Hub UX Refresh & Design System v1",
  );
  assert.ok(Array.isArray(json.checklist));
  assert.ok(Array.isArray(json.attachments));
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

test("read endpoints: empty read-model store returns empty defaults for list/singletons", async () => {
  const chambersRes = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env: emptyEnv }),
  );
  assert.equal(chambersRes.status, 200);
  assert.deepEqual(await chambersRes.json(), { items: [] });

  const proposalsRes = await proposalsGet(
    makeContext({ url: "https://local.test/api/proposals", env: emptyEnv }),
  );
  assert.equal(proposalsRes.status, 200);
  assert.deepEqual(await proposalsRes.json(), { items: [] });

  const feedRes = await feedGet(
    makeContext({ url: "https://local.test/api/feed", env: emptyEnv }),
  );
  assert.equal(feedRes.status, 200);
  assert.deepEqual(await feedRes.json(), { items: [] });

  const courtsRes = await courtsGet(
    makeContext({ url: "https://local.test/api/courts", env: emptyEnv }),
  );
  assert.equal(courtsRes.status, 200);
  assert.deepEqual(await courtsRes.json(), { items: [] });

  const humansRes = await humansGet(
    makeContext({ url: "https://local.test/api/humans", env: emptyEnv }),
  );
  assert.equal(humansRes.status, 200);
  assert.deepEqual(await humansRes.json(), { items: [] });

  const factionsRes = await factionsGet(
    makeContext({ url: "https://local.test/api/factions", env: emptyEnv }),
  );
  assert.equal(factionsRes.status, 200);
  assert.deepEqual(await factionsRes.json(), { items: [] });

  const formationRes = await formationGet(
    makeContext({ url: "https://local.test/api/formation", env: emptyEnv }),
  );
  assert.equal(formationRes.status, 200);
  assert.deepEqual(await formationRes.json(), { metrics: [], projects: [] });

  const invisionRes = await invisionGet(
    makeContext({ url: "https://local.test/api/invision", env: emptyEnv }),
  );
  assert.equal(invisionRes.status, 200);
  assert.deepEqual(await invisionRes.json(), {
    governanceState: { label: "—", metrics: [] },
    economicIndicators: [],
    riskSignals: [],
    chamberProposals: [],
  });

  const myGovRes = await myGovGet(
    makeContext({ url: "https://local.test/api/my-governance", env: emptyEnv }),
  );
  assert.equal(myGovRes.status, 200);
  const myGovJson = await myGovRes.json();
  assert.equal(typeof myGovJson.eraActivity?.era, "string");
  assert.ok(Array.isArray(myGovJson.myChamberIds));

  const draftsRes = await draftListGet(
    makeContext({
      url: "https://local.test/api/proposals/drafts",
      env: emptyEnv,
    }),
  );
  assert.equal(draftsRes.status, 200);
  assert.deepEqual(await draftsRes.json(), { items: [] });
});
