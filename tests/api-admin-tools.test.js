import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as auditGet } from "../functions/api/admin/audit/index.ts";
import { onRequestGet as statsGet } from "../functions/api/admin/stats.ts";
import { onRequestGet as adminUserGet } from "../functions/api/admin/users/[address].ts";
import { onRequestGet as adminLocksGet } from "../functions/api/admin/users/locks.ts";
import { onRequestPost as adminLockPost } from "../functions/api/admin/users/lock.ts";
import { onRequestPost as adminUnlockPost } from "../functions/api/admin/users/unlock.ts";
import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearActionLocksForTests } from "../functions/_lib/actionLocksStore.ts";
import { clearAdminAuditForTests } from "../functions/_lib/adminAuditStore.ts";
import { clearApiRateLimitsForTests } from "../functions/_lib/apiRateLimitStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";

function makeContext({ url, env, params, method = "GET", headers, body }) {
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
  SIM_MAX_POOL_VOTES_PER_ERA: "2",
};

async function resetAll() {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearEraForTests();
  clearApiRateLimitsForTests();
  clearActionLocksForTests();
  clearAdminAuditForTests();
  clearChamberMembershipsForTests();
}

test("admin endpoints: list locks, inspect user, and audit lock/unlock actions (memory mode)", async () => {
  await resetAll();

  const address = "5AdminTarget";
  const cookie = await makeSessionCookie(baseEnv, address);

  const vote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(vote.status, 200);

  const lockedUntil = new Date(Date.now() + 60_000).toISOString();
  const lockRes = await adminLockPost(
    makeContext({
      url: "https://local.test/api/admin/users/lock",
      env: baseEnv,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": "admin-secret",
      },
      body: JSON.stringify({ address, lockedUntil, reason: "testing" }),
    }),
  );
  assert.equal(lockRes.status, 200);

  const locksRes = await adminLocksGet(
    makeContext({
      url: "https://local.test/api/admin/users/locks",
      env: baseEnv,
      method: "GET",
      headers: { "x-admin-secret": "admin-secret" },
    }),
  );
  assert.equal(locksRes.status, 200);
  const locksJson = await locksRes.json();
  assert.ok(Array.isArray(locksJson.items));
  assert.ok(locksJson.items.find((l) => l.address === address));

  const statusRes = await adminUserGet(
    makeContext({
      url: `https://local.test/api/admin/users/${address}`,
      env: baseEnv,
      params: { address },
      method: "GET",
      headers: { "x-admin-secret": "admin-secret" },
    }),
  );
  assert.equal(statusRes.status, 200);
  const statusJson = await statusRes.json();
  assert.equal(statusJson.address, address);
  assert.equal(statusJson.counts.poolVotes, 1);
  assert.equal(statusJson.quotas.maxPoolVotes, 2);
  assert.equal(statusJson.remaining.poolVotes, 1);
  assert.equal(statusJson.lock.address, address);

  const unlockRes = await adminUnlockPost(
    makeContext({
      url: "https://local.test/api/admin/users/unlock",
      env: baseEnv,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": "admin-secret",
      },
      body: JSON.stringify({ address }),
    }),
  );
  assert.equal(unlockRes.status, 200);

  const auditRes = await auditGet(
    makeContext({
      url: "https://local.test/api/admin/audit",
      env: baseEnv,
      method: "GET",
      headers: { "x-admin-secret": "admin-secret" },
    }),
  );
  assert.equal(auditRes.status, 200);
  const auditJson = await auditRes.json();
  assert.ok(Array.isArray(auditJson.items));
  assert.ok(auditJson.items.find((e) => e.action === "user.lock"));
  assert.ok(auditJson.items.find((e) => e.action === "user.unlock"));

  const statsRes = await statsGet(
    makeContext({
      url: "https://local.test/api/admin/stats",
      env: baseEnv,
      method: "GET",
      headers: { "x-admin-secret": "admin-secret" },
    }),
  );
  assert.equal(statsRes.status, 200);
  const statsJson = await statsRes.json();
  assert.equal(statsJson.currentEra, 0);
  assert.equal(statsJson.writesFrozen, false);
  assert.equal(statsJson.currentEraActivity.rows, 1);
});
