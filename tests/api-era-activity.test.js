import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as myGovernanceGet } from "../functions/api/my-governance/index.ts";
import { onRequestPost as advanceEraPost } from "../functions/api/clock/advance-era.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearCourtsForTests } from "../functions/_lib/courtsStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
import { clearFormationForTests } from "../functions/_lib/formationStore.ts";
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
  return `${name}=${value}`;
}

function getDoneCount(myGovJson, label) {
  const actions = myGovJson?.eraActivity?.actions;
  assert.ok(Array.isArray(actions), "Expected eraActivity.actions array");
  const action = actions.find((entry) => entry?.label === label);
  assert.ok(action, `Expected action with label "${label}"`);
  assert.equal(typeof action.done, "number", "Expected action.done number");
  return action.done;
}

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
};

test("My Governance era activity counts only the first action per entity per era", async () => {
  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearCourtsForTests();
  clearFormationForTests();
  clearEraForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const address = "5EraAddr";
  const cookie = await makeSessionCookie(baseEnv, address);
  await ensureChamberMembership(baseEnv, {
    address,
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(baseEnv, {
    address,
    chamberId: "engineering",
    source: "test",
  });
  for (let i = 0; i < 10; i += 1) {
    await ensureChamberMembership(baseEnv, {
      address: `5EngMember${i}`,
      chamberId: "engineering",
      source: "test",
    });
  }

  const poolProposalId = "biometric-account-recovery";

  const vote1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: poolProposalId, direction: "up" },
      }),
    }),
  );
  assert.equal(vote1.status, 200);

  const vote2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: poolProposalId, direction: "down" },
      }),
    }),
  );
  assert.equal(vote2.status, 200);

  const chamberProposalId = "tier-decay-v1";
  const chamberVote1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: chamberProposalId, choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(chamberVote1.status, 200);

  const chamberVote2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: chamberProposalId, choice: "no" },
      }),
    }),
  );
  assert.equal(chamberVote2.status, 200);

  const caseId = "delegation-farming-forum-whale";
  const report1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.report",
        payload: { caseId },
      }),
    }),
  );
  assert.equal(report1.status, 200);

  const report2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.report",
        payload: { caseId },
      }),
    }),
  );
  assert.equal(report2.status, 200);

  const myGovRes = await myGovernanceGet(
    makeContext({
      url: "https://local.test/api/my-governance",
      env: baseEnv,
      method: "GET",
      headers: { cookie },
    }),
  );
  assert.equal(myGovRes.status, 200);
  const myGovJson = await myGovRes.json();
  assert.equal(getDoneCount(myGovJson, "Pool votes"), 1);
  assert.equal(getDoneCount(myGovJson, "Chamber votes"), 1);
  assert.equal(getDoneCount(myGovJson, "Court actions"), 1);

  const advanceRes = await advanceEraPost(
    makeContext({
      url: "https://local.test/api/clock/advance-era",
      env: baseEnv,
      method: "POST",
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(advanceRes.status, 200);

  const myGovAfterRes = await myGovernanceGet(
    makeContext({
      url: "https://local.test/api/my-governance",
      env: baseEnv,
      method: "GET",
      headers: { cookie },
    }),
  );
  assert.equal(myGovAfterRes.status, 200);
  const myGovAfterJson = await myGovAfterRes.json();
  assert.equal(getDoneCount(myGovAfterJson, "Pool votes"), 0);
  assert.equal(getDoneCount(myGovAfterJson, "Chamber votes"), 0);
  assert.equal(getDoneCount(myGovAfterJson, "Court actions"), 0);
});
