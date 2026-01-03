import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as freezePost } from "../functions/api/admin/writes/freeze.ts";
import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearAdminStateForTests } from "../functions/_lib/adminStateStore.ts";
import { clearApiRateLimitsForTests } from "../functions/_lib/apiRateLimitStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
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
  ADMIN_SECRET: "admin-secret",
  SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS: "1000",
  SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP: "1000",
};

test("admin write freeze blocks /api/command until unfrozen (memory mode)", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearEraForTests();
  clearApiRateLimitsForTests();
  clearAdminStateForTests();
  clearChamberMembershipsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5FreezeAddr");

  const freeze = await freezePost(
    makeContext({
      url: "https://local.test/api/admin/writes/freeze",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        "x-admin-secret": "admin-secret",
      },
      body: JSON.stringify({ enabled: true }),
    }),
  );
  assert.equal(freeze.status, 200);

  const blocked = await commandPost(
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
  assert.equal(blocked.status, 503);
  const blockedJson = await blocked.json();
  assert.equal(blockedJson.error.code, "writes_frozen");

  const unfreeze = await freezePost(
    makeContext({
      url: "https://local.test/api/admin/writes/freeze",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        "x-admin-secret": "admin-secret",
      },
      body: JSON.stringify({ enabled: false }),
    }),
  );
  assert.equal(unfreeze.status, 200);

  const allowed = await commandPost(
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
  assert.equal(allowed.status, 200);
});
