import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as proposalsGet } from "../functions/api/proposals/index.ts";
import { onRequestGet as chamberPageGet } from "../functions/api/proposals/[id]/chamber.ts";
import { onRequestGet as formationPageGet } from "../functions/api/proposals/[id]/formation.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearCmAwardsForTests } from "../functions/_lib/cmAwardsStore.ts";
import { onRequestGet as humansGet } from "../functions/api/humans/index.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";

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

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
};

test("POST /api/command chamber.vote rejects when not authenticated", async () => {
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

  const res = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "tier-decay-v1", choice: "yes" },
      }),
    }),
  );
  assert.equal(res.status, 401);
});

test("GET /api/proposals/:id/chamber overlays live vote counts", async () => {
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5VoteAddr");
  await ensureChamberMembership(baseEnv, {
    address: "5VoteAddr",
    chamberId: "general",
    source: "test",
  });
  const res1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "tier-decay-v1", choice: "yes" },
      }),
    }),
  );
  assert.equal(res1.status, 200);

  const res2 = await chamberPageGet(
    makeContext({
      url: "https://local.test/api/proposals/tier-decay-v1/chamber",
      env: baseEnv,
      params: { id: "tier-decay-v1" },
      method: "GET",
    }),
  );
  assert.equal(res2.status, 200);
  const json = await res2.json();
  assert.equal(
    json.title,
    "Tier Decay v1: Nominee → Ecclesiast → Legate → Consul → Citizen",
  );
  assert.deepEqual(json.votes, { yes: 1, no: 0, abstain: 0 });
  assert.equal(json.engagedGovernors, 1);
});

test("chamber vote passing auto-advances proposal from vote → build and creates formation page", async () => {
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

  const proposalId = "tier-decay-v1";

  for (let i = 0; i < 50; i += 1) {
    const address = `5ChamberAddr${i}`;
    await ensureChamberMembership(baseEnv, {
      address,
      chamberId: "general",
      source: "test",
    });
    const cookie = await makeSessionCookie(baseEnv, address);
    const choice = i < 34 ? "yes" : "no";
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: baseEnv,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "chamber.vote",
          payload: {
            proposalId,
            choice,
            ...(choice === "yes" ? { score: 8 } : {}),
          },
        }),
      }),
    );
    if (res.status === 409) break;
    assert.equal(res.status, 200);
  }

  const proposalsRes = await proposalsGet(
    makeContext({
      url: "https://local.test/api/proposals",
      env: baseEnv,
      method: "GET",
    }),
  );
  assert.equal(proposalsRes.status, 200);
  const proposalsJson = await proposalsRes.json();
  const item = proposalsJson.items.find((p) => p.id === proposalId);
  assert.ok(item);
  assert.equal(item.stage, "build");

  const formationRes = await formationPageGet(
    makeContext({
      url: "https://local.test/api/proposals/tier-decay-v1/formation",
      env: baseEnv,
      params: { id: proposalId },
      method: "GET",
    }),
  );
  assert.equal(formationRes.status, 200);
  const formationJson = await formationRes.json();
  assert.ok(
    typeof formationJson.title === "string" && formationJson.title.length > 0,
  );
  assert.match(formationJson.title, /^Tier Decay v1/);

  await ensureChamberMembership(baseEnv, {
    address: "5AfterPass",
    chamberId: "general",
    source: "test",
  });
  const cookieAfter = await makeSessionCookie(baseEnv, "5AfterPass");
  const resAfter = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie: cookieAfter },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId, choice: "yes" },
      }),
    }),
  );
  assert.equal(resAfter.status, 409);

  const humansRes = await humansGet(
    makeContext({
      url: "https://local.test/api/humans",
      env: baseEnv,
      method: "GET",
    }),
  );
  assert.equal(humansRes.status, 200);
  const humansJson = await humansRes.json();
  const andrei = humansJson.items.find((h) => h.id === "andrei");
  assert.ok(andrei);
  assert.equal(andrei.acm, 266);
});
