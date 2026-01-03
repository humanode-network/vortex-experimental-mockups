import assert from "node:assert/strict";
import { test } from "node:test";

import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady, xxhashAsHex } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as clockGet } from "../functions/api/clock/index.ts";
import { onRequestPost as rollupEraPost } from "../functions/api/clock/rollup-era.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearCourtsForTests } from "../functions/_lib/courtsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import {
  clearEraRollupsForTests,
  getEraUserStatus,
} from "../functions/_lib/eraRollupStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
import { clearFormationForTests } from "../functions/_lib/formationStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";

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

function scaleEncodeVecAccountId32(publicKeys) {
  if (publicKeys.length > 63) throw new Error("test helper: too many keys");
  const lengthByte = (publicKeys.length << 2) | 0; // compact-encoded small int
  const out = new Uint8Array(1 + publicKeys.length * 32);
  out[0] = lengthByte;
  publicKeys.forEach((pk, i) => {
    out.set(pk, 1 + i * 32);
  });
  return out;
}

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
  SIM_REQUIRED_POOL_VOTES: "1",
  SIM_REQUIRED_CHAMBER_VOTES: "0",
  SIM_REQUIRED_COURT_ACTIONS: "0",
  SIM_REQUIRED_FORMATION_ACTIONS: "0",
};

test("rollup: active governors next era are filtered by Session::Validators", async () => {
  await cryptoWaitReady();

  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearCourtsForTests();
  clearFormationForTests();
  clearEraForTests();
  clearEraRollupsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const keyring = new Keyring({ type: "sr25519" });
  const validator = keyring.addFromUri("//Alice");
  const nonValidator = keyring.addFromUri("//Bob");

  const envActions = { ...baseEnv, DEV_BYPASS_GATE: "true" };

  const clockRes = await clockGet(
    makeContext({
      url: "https://local.test/api/clock",
      env: envActions,
      method: "GET",
    }),
  );
  assert.equal(clockRes.status, 200);
  const clockJson = await clockRes.json();
  assert.equal(typeof clockJson.currentEra, "number");
  const era = clockJson.currentEra;

  await ensureChamberMembership(envActions, {
    address: validator.address,
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(envActions, {
    address: nonValidator.address,
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(envActions, {
    address: validator.address,
    chamberId: "engineering",
    source: "test",
  });
  await ensureChamberMembership(envActions, {
    address: nonValidator.address,
    chamberId: "engineering",
    source: "test",
  });
  for (let i = 0; i < 10; i += 1) {
    await ensureChamberMembership(envActions, {
      address: `5EngMember${i}`,
      chamberId: "engineering",
      source: "test",
    });
  }

  const cookieValidator = await makeSessionCookie(
    envActions,
    validator.address,
  );
  const cookieNonValidator = await makeSessionCookie(
    envActions,
    nonValidator.address,
  );

  const vote1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: envActions,
      headers: { "content-type": "application/json", cookie: cookieValidator },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(vote1.status, 200);

  const vote2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: envActions,
      headers: {
        "content-type": "application/json",
        cookie: cookieNonValidator,
      },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(vote2.status, 200);

  const validatorsKey =
    "0x" +
    xxhashAsHex("Session", 128).slice(2) +
    xxhashAsHex("Validators", 128).slice(2);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const key = body?.params?.[0];

    const result =
      key === validatorsKey
        ? u8aToHex(scaleEncodeVecAccountId32([validator.publicKey]))
        : null;

    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const envRollup = {
      ...baseEnv,
      DEV_BYPASS_GATE: "false",
      HUMANODE_RPC_URL: "https://rpc.test",
    };

    const rollupRes = await rollupEraPost(
      makeContext({
        url: "https://local.test/api/clock/rollup-era",
        env: envRollup,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ era }),
      }),
    );
    assert.equal(rollupRes.status, 200);
    const json = await rollupRes.json();
    assert.equal(json.ok, true);
    assert.equal(json.usersRolled, 2);
    assert.equal(json.activeGovernorsNextEra, 1);

    const statusValidator = await getEraUserStatus(envRollup, {
      era,
      address: validator.address,
    });
    assert.ok(statusValidator);
    assert.equal(statusValidator.isActiveNextEra, true);

    const statusNonValidator = await getEraUserStatus(envRollup, {
      era,
      address: nonValidator.address,
    });
    assert.ok(statusNonValidator);
    assert.equal(statusNonValidator.isActiveNextEra, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
