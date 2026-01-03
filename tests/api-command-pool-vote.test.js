import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as proposalsGet } from "../functions/api/proposals/index.ts";
import { onRequestGet as poolPageGet } from "../functions/api/proposals/[id]/pool.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
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
  await ensureChamberMembership(env, {
    address,
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(env, {
    address,
    chamberId: "engineering",
    source: "test",
  });
  return `${name}=${value}`;
}

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
};

async function seedMembers(env, input) {
  for (let i = 0; i < input.count; i += 1) {
    await ensureChamberMembership(env, {
      address: `${input.prefix}${i}`,
      chamberId: input.chamberId,
      source: "test",
    });
  }
}

test("POST /api/command rejects when not authenticated", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearChamberMembershipsForTests();
  const res = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(res.status, 401);
});

test("POST /api/command pool.vote stores a single vote and supports idempotency", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearChamberMembershipsForTests();

  await seedMembers(baseEnv, {
    prefix: "5EngMember",
    chamberId: "engineering",
    count: 10,
  });

  const cookie = await makeSessionCookie(baseEnv, "5FakeAddr");
  const idempotencyKey = "idem-00000001";

  const requestBody = {
    type: "pool.vote",
    payload: { proposalId: "biometric-account-recovery", direction: "up" },
    idempotencyKey,
  };

  const res1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        cookie,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(requestBody),
    }),
  );
  assert.equal(res1.status, 200);
  const json1 = await res1.json();
  assert.equal(json1.ok, true);
  assert.deepEqual(json1.counts, { upvotes: 1, downvotes: 0 });

  const res2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        cookie,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(requestBody),
    }),
  );
  assert.equal(res2.status, 200);
  const json2 = await res2.json();
  assert.deepEqual(json2, json1);

  const res3 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        cookie,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        type: "pool.vote",
        payload: {
          proposalId: "biometric-account-recovery",
          direction: "down",
        },
      }),
    }),
  );
  assert.equal(res3.status, 409);
});

test("GET /api/proposals/:id/pool overlays live vote counts", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearChamberMembershipsForTests();

  await seedMembers(baseEnv, {
    prefix: "5EngMember",
    chamberId: "engineering",
    count: 10,
  });

  const cookie = await makeSessionCookie(baseEnv, "5FakeAddr");
  const res1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(res1.status, 200);

  const res2 = await poolPageGet(
    makeContext({
      url: "https://local.test/api/proposals/biometric-account-recovery/pool",
      env: baseEnv,
      params: { id: "biometric-account-recovery" },
      method: "GET",
    }),
  );
  assert.equal(res2.status, 200);
  const json = await res2.json();
  assert.equal(json.title, "Biometric Account Recovery & Key Rotation Pallet");
  assert.equal(json.upvotes, 1);
  assert.equal(json.downvotes, 0);
});

test("pool quorum auto-advances proposal from pool → vote", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearChamberMembershipsForTests();

  const proposalId = "biometric-account-recovery";

  for (let i = 0; i < 200; i += 1) {
    const address = `5FakeAddr${i}`;
    const cookie = await makeSessionCookie(baseEnv, address);
    const direction = i < 100 ? "up" : "down";
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: baseEnv,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "pool.vote",
          payload: { proposalId, direction },
        }),
      }),
    );
    if (res.status === 200) continue;
    if (res.status === 409) break; // proposal advanced to vote
    assert.equal(res.status, 200);
  }

  const res = await proposalsGet(
    makeContext({
      url: "https://local.test/api/proposals",
      env: baseEnv,
      method: "GET",
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  const item = json.items.find((p) => p.id === proposalId);
  assert.ok(item);
  assert.equal(item.stage, "vote");
  assert.equal(item.summaryPill, "Chamber vote");
  assert.equal(item.stageData[0].title, "Voting quorum");
});
