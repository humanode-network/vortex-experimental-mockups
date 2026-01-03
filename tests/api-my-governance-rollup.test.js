import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestPost as rollupEraPost } from "../functions/api/clock/rollup-era.ts";
import { onRequestGet as myGovernanceGet } from "../functions/api/my-governance/index.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearCourtsForTests } from "../functions/_lib/courtsStore.ts";
import { clearEraRollupsForTests } from "../functions/_lib/eraRollupStore.ts";
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

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
  SIM_REQUIRED_POOL_VOTES: "1",
  SIM_REQUIRED_CHAMBER_VOTES: "0",
  SIM_REQUIRED_COURT_ACTIONS: "0",
  SIM_REQUIRED_FORMATION_ACTIONS: "0",
};

test("GET /api/my-governance includes rollup status after rollup", async () => {
  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearCourtsForTests();
  clearFormationForTests();
  clearEraForTests();
  clearEraRollupsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5GovRollupAddr");
  await ensureChamberMembership(baseEnv, {
    address: "5GovRollupAddr",
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(baseEnv, {
    address: "5GovRollupAddr",
    chamberId: "engineering",
    source: "test",
  });

  // 3 distinct actions so status becomes Ahead (requiredTotal=1).
  const poolVote = await commandPost(
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
  assert.equal(poolVote.status, 200);

  const chamberVote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "tier-decay-v1", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(chamberVote.status, 200);

  const report = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.report",
        payload: { caseId: "delegation-farming-forum-whale" },
      }),
    }),
  );
  assert.equal(report.status, 200);

  const rollupRes = await rollupEraPost(
    makeContext({
      url: "https://local.test/api/clock/rollup-era",
      env: baseEnv,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );
  assert.equal(rollupRes.status, 200);
  const rollupJson = await rollupRes.json();
  assert.equal(rollupJson.ok, true);

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
  assert.ok(myGovJson.rollup);
  assert.equal(myGovJson.rollup.status, "Ahead");
  assert.equal(myGovJson.rollup.isActiveNextEra, true);
  assert.equal(myGovJson.rollup.requiredTotal, 1);
  assert.equal(myGovJson.rollup.completedTotal, 3);
});
