import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearApiRateLimitsForTests } from "../functions/_lib/apiRateLimitStore.ts";
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
  SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS: "2",
  SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP: "1000",
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

test("POST /api/command is rate limited per address (memory mode)", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearApiRateLimitsForTests();
  clearChamberMembershipsForTests();

  await seedMembers(baseEnv, {
    prefix: "5EngMember",
    chamberId: "engineering",
    count: 10,
  });

  const cookie = await makeSessionCookie(baseEnv, "5FakeAddr");

  const makeRequest = () =>
    commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: baseEnv,
        headers: {
          "content-type": "application/json",
          cookie,
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({
          type: "pool.vote",
          payload: {
            proposalId: "biometric-account-recovery",
            direction: "up",
          },
        }),
      }),
    );

  const ok1 = await makeRequest();
  assert.equal(ok1.status, 200);
  const ok2 = await makeRequest();
  assert.equal(ok2.status, 200);

  const limited = await makeRequest();
  assert.equal(limited.status, 429);
  const json = await limited.json();
  assert.equal(json.error.message, "Rate limited");
  assert.equal(json.error.scope, "address");
  assert.equal(typeof json.error.retryAfterSeconds, "number");
});
