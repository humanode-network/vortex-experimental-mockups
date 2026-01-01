import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as humanGet } from "../functions/api/humans/[id].ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
import { clearChamberMultiplierSubmissionsForTests } from "../functions/_lib/chamberMultiplierSubmissionsStore.ts";
import {
  awardCmOnce,
  clearCmAwardsForTests,
} from "../functions/_lib/cmAwardsStore.ts";
import {
  clearInlineReadModelsForTests,
  createReadModelsStore,
} from "../functions/_lib/readModelsStore.ts";

function makeContext({ url, env, params, method = "POST", headers, body }) {
  return {
    request: new Request(url, { method, headers, body }),
    env,
    params,
  };
}

async function makeSessionCookie(env, address) {
  const headers = new Headers();
  await issueSession(headers, env, "https://local.test/api/command", address);
  const setCookie = headers.get("set-cookie");
  assert.ok(setCookie);
  const tokenPair = setCookie.split(";")[0];
  const [name, value] = tokenPair.split("=");
  assert.equal(name, getSessionCookieName());
  return `${name}=${value}`;
}

function baseEnv(overrides = {}) {
  return {
    SESSION_SECRET: "test-secret",
    DEV_BYPASS_GATE: "true",
    DEV_INSECURE_COOKIES: "true",
    READ_MODELS_INLINE_EMPTY: "true",
    DEV_BYPASS_ADMIN: "true",
    DEV_BYPASS_CHAMBER_ELIGIBILITY: "true",
    SIM_CONFIG_JSON: JSON.stringify({
      genesisChamberMembers: { marketing: ["5Outsider"], general: ["5Alice"] },
      genesisChambers: [
        { id: "general", title: "General", multiplier: 1.2 },
        { id: "engineering", title: "Engineering", multiplier: 1.5 },
        { id: "marketing", title: "Marketing", multiplier: 1.1 },
      ],
    }),
    ...overrides,
  };
}

test("multiplier voting is outsiders-only and affects ACM view without rewriting awards", async () => {
  clearChambersForTests();
  clearChamberMultiplierSubmissionsForTests();
  await clearCmAwardsForTests();
  clearInlineReadModelsForTests();

  const env = baseEnv();

  const store = await createReadModelsStore(env);
  await store.set("humans:5Alice", {
    id: "5Alice",
    name: "Alice",
    heroStats: [{ label: "ACM", value: "0" }],
  });

  await awardCmOnce(env, {
    proposalId: "award-1",
    proposerId: "5Alice",
    chamberId: "engineering",
    avgScore: 10,
    lcmPoints: 100,
    chamberMultiplierTimes10: 15,
    mcmPoints: 150,
  });

  const beforeRes = await humanGet(
    makeContext({
      url: "https://local.test/api/humans/5Alice",
      env,
      params: { id: "5Alice" },
      method: "GET",
    }),
  );
  assert.equal(beforeRes.status, 200);
  const beforeJson = await beforeRes.json();
  const beforeAcm = beforeJson.heroStats.find((s) => s.label === "ACM")?.value;
  assert.equal(beforeAcm, "150");

  // A user who has LCM history in a chamber cannot submit a multiplier for that chamber.
  const aliceCookie = await makeSessionCookie(env, "5Alice");
  const deniedRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: aliceCookie },
      body: JSON.stringify({
        type: "chamber.multiplier.submit",
        payload: { chamberId: "engineering", multiplierTimes10: 10 },
      }),
    }),
  );
  assert.equal(deniedRes.status, 400);
  const deniedJson = await deniedRes.json();
  assert.equal(deniedJson.error?.code, "multiplier_outsider_required");

  // An outsider governor can submit and update the canonical chamber multiplier.
  const outsiderCookie = await makeSessionCookie(env, "5Outsider");
  const submitRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: outsiderCookie },
      body: JSON.stringify({
        type: "chamber.multiplier.submit",
        payload: { chamberId: "engineering", multiplierTimes10: 10 },
      }),
    }),
  );
  assert.equal(submitRes.status, 200);
  const submitJson = await submitRes.json();
  assert.equal(submitJson.chamberId, "engineering");
  assert.equal(submitJson.aggregate.avgTimes10, 10);
  assert.equal(submitJson.applied?.nextMultiplierTimes10, 10);

  const afterRes = await humanGet(
    makeContext({
      url: "https://local.test/api/humans/5Alice",
      env,
      params: { id: "5Alice" },
      method: "GET",
    }),
  );
  assert.equal(afterRes.status, 200);
  const afterJson = await afterRes.json();
  const afterAcm = afterJson.heroStats.find((s) => s.label === "ACM")?.value;
  assert.equal(afterAcm, "100");
});
