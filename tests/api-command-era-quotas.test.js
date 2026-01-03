import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearApiRateLimitsForTests } from "../functions/_lib/apiRateLimitStore.ts";
import { clearActionLocksForTests } from "../functions/_lib/actionLocksStore.ts";
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
  await ensureChamberMembership(env, {
    address,
    chamberId: "design",
    source: "test",
  });
  return `${name}=${value}`;
}

function baseEnv(overrides = {}) {
  return {
    SESSION_SECRET: "test-secret",
    DEV_BYPASS_GATE: "true",
    DEV_INSECURE_COOKIES: "true",
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS: "1000",
    SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP: "1000",
    ...overrides,
  };
}

async function resetAll() {
  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearCourtsForTests();
  clearFormationForTests();
  clearEraForTests();
  clearApiRateLimitsForTests();
  clearActionLocksForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
}

async function seedMembers(env, input) {
  for (let i = 0; i < input.count; i += 1) {
    await ensureChamberMembership(env, {
      address: `${input.prefix}${i}`,
      chamberId: input.chamberId,
      source: "test",
    });
  }
}

test("era quota: pool votes limit blocks new votes but allows updates", async () => {
  await resetAll();
  const env = baseEnv({ SIM_MAX_POOL_VOTES_PER_ERA: "1" });
  await seedMembers(env, {
    prefix: "5EngMember",
    chamberId: "engineering",
    count: 10,
  });
  await seedMembers(env, {
    prefix: "5DesignMember",
    chamberId: "design",
    count: 10,
  });
  const cookie = await makeSessionCookie(env, "5QuotaAddr");

  const first = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(first.status, 200);

  const blocked = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: {
          proposalId: "humanode-dreamscapes-visual-lore",
          direction: "up",
        },
      }),
    }),
  );
  assert.equal(blocked.status, 429);
  const blockedJson = await blocked.json();
  assert.equal(blockedJson.error.code, "era_quota_exceeded");
  assert.equal(blockedJson.error.kind, "poolVotes");

  const update = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: {
          proposalId: "biometric-account-recovery",
          direction: "down",
        },
      }),
    }),
  );
  assert.equal(update.status, 200);
});

test("era quota: chamber votes limit blocks new votes but allows updates", async () => {
  await resetAll();
  const env = baseEnv({ SIM_MAX_CHAMBER_VOTES_PER_ERA: "1" });
  await seedMembers(env, {
    prefix: "5GeneralMember",
    chamberId: "general",
    count: 20,
  });
  await seedMembers(env, {
    prefix: "5EconomicsMember",
    chamberId: "economics",
    count: 20,
  });
  const cookie = await makeSessionCookie(env, "5QuotaAddr");
  await ensureChamberMembership(env, {
    address: "5QuotaAddr",
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(env, {
    address: "5QuotaAddr",
    chamberId: "economics",
    source: "test",
  });

  const first = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "tier-decay-v1", choice: "yes" },
      }),
    }),
  );
  assert.equal(first.status, 200);

  const blocked = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: {
          proposalId: "fixed-governor-stake-spam-slashing",
          choice: "yes",
        },
      }),
    }),
  );
  assert.equal(blocked.status, 429);
  const blockedJson = await blocked.json();
  assert.equal(blockedJson.error.code, "era_quota_exceeded");
  assert.equal(blockedJson.error.kind, "chamberVotes");

  const update = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "tier-decay-v1", choice: "no" },
      }),
    }),
  );
  assert.equal(update.status, 200);
});

test("era quota: court actions limit blocks new reports but allows duplicates", async () => {
  await resetAll();
  const env = baseEnv({ SIM_MAX_COURT_ACTIONS_PER_ERA: "1" });
  const cookie = await makeSessionCookie(env, "5QuotaAddr");

  const first = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.report",
        payload: { caseId: "delegation-reroute-keeper-nyx" },
      }),
    }),
  );
  assert.equal(first.status, 200);

  const blocked = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.report",
        payload: { caseId: "delegation-farming-forum-whale" },
      }),
    }),
  );
  assert.equal(blocked.status, 429);
  const blockedJson = await blocked.json();
  assert.equal(blockedJson.error.code, "era_quota_exceeded");
  assert.equal(blockedJson.error.kind, "courtActions");

  const duplicate = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.report",
        payload: { caseId: "delegation-reroute-keeper-nyx" },
      }),
    }),
  );
  assert.equal(duplicate.status, 200);
});

test("era quota: formation actions limit blocks new joins but allows duplicates", async () => {
  await resetAll();
  const env = baseEnv({ SIM_MAX_FORMATION_ACTIONS_PER_ERA: "1" });
  const cookie = await makeSessionCookie(env, "5QuotaAddr");

  const first = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId: "evm-dev-starter-kit" },
      }),
    }),
  );
  assert.equal(first.status, 200);

  const blocked = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId: "mev-safe-dex-v1-launch-sprint" },
      }),
    }),
  );
  assert.equal(blocked.status, 429);
  const blockedJson = await blocked.json();
  assert.equal(blockedJson.error.code, "era_quota_exceeded");
  assert.equal(blockedJson.error.kind, "formationActions");

  const duplicate = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "formation.join",
        payload: { proposalId: "evm-dev-starter-kit" },
      }),
    }),
  );
  assert.equal(duplicate.status, 200);
});
