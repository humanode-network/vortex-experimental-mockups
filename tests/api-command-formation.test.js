import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as formationPageGet } from "../functions/api/proposals/[id]/formation.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearFormationForTests } from "../functions/_lib/formationStore.ts";

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

test("formation.join increments team slots in formation read model overlay", async () => {
  clearFormationForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const proposalId = "evm-dev-starter-kit";
  const cookie = await makeSessionCookie(baseEnv, "5JoinAddr");

  const res = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId },
      }),
    }),
  );
  assert.equal(res.status, 200);

  const formationRes = await formationPageGet(
    makeContext({
      url: `https://local.test/api/proposals/${proposalId}/formation`,
      env: baseEnv,
      params: { id: proposalId },
      method: "GET",
    }),
  );
  assert.equal(formationRes.status, 200);
  const json = await formationRes.json();
  assert.equal(json.teamSlots, "2 / 3");
  assert.equal(json.milestones, "1 / 3");
  assert.ok(Array.isArray(json.lockedTeam));
  assert.ok(
    json.lockedTeam.some((m) => String(m.name).toLowerCase().includes("5join")),
  );
});

test("formation.join enforces team slots capacity", async () => {
  clearFormationForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const proposalId = "evm-dev-starter-kit";

  const c1 = await makeSessionCookie(baseEnv, "5JoinFill1");
  const r1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie: c1 },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId },
      }),
    }),
  );
  assert.equal(r1.status, 200);

  const c2 = await makeSessionCookie(baseEnv, "5JoinFill2");
  const r2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie: c2 },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId },
      }),
    }),
  );
  assert.equal(r2.status, 200);

  const c3 = await makeSessionCookie(baseEnv, "5JoinFill3");
  const r3 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie: c3 },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId },
      }),
    }),
  );
  assert.equal(r3.status, 409);
});

test("formation milestone submit + unlock updates milestones and progress", async () => {
  clearFormationForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const proposalId = "evm-dev-starter-kit";
  const cookie = await makeSessionCookie(baseEnv, "5MilestoneAddr");

  const unlockFirst = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.milestone.requestUnlock",
        payload: { proposalId, milestoneIndex: 2 },
      }),
    }),
  );
  assert.equal(unlockFirst.status, 409);

  const submit = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.milestone.submit",
        payload: { proposalId, milestoneIndex: 2 },
      }),
    }),
  );
  assert.equal(submit.status, 200);

  const afterSubmit = await formationPageGet(
    makeContext({
      url: `https://local.test/api/proposals/${proposalId}/formation`,
      env: baseEnv,
      params: { id: proposalId },
      method: "GET",
    }),
  );
  assert.equal(afterSubmit.status, 200);
  const afterSubmitJson = await afterSubmit.json();
  assert.equal(afterSubmitJson.milestones, "1 / 3");

  const unlock = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.milestone.requestUnlock",
        payload: { proposalId, milestoneIndex: 2 },
      }),
    }),
  );
  assert.equal(unlock.status, 200);

  const formationRes = await formationPageGet(
    makeContext({
      url: `https://local.test/api/proposals/${proposalId}/formation`,
      env: baseEnv,
      params: { id: proposalId },
      method: "GET",
    }),
  );
  assert.equal(formationRes.status, 200);
  const json = await formationRes.json();
  assert.equal(json.milestones, "2 / 3");
  assert.equal(json.progress, "67%");
});
