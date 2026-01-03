import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as chamberPageGet } from "../functions/api/proposals/[id]/chamber.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import { clearDelegationsForTests } from "../functions/_lib/delegationsStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";

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

const env = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
};

test("delegation increases chamber vote weight (delegators who vote are excluded)", async () => {
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearDelegationsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const chamberId = "general";
  const proposalId = "tier-decay-v1";

  const delegatee = "5DelegateeAddr";
  const delegatorVoter = "5DelegatorVoterAddr";
  const delegatorNonVoter = "5DelegatorNonVoterAddr";

  await ensureChamberMembership(env, {
    address: delegatee,
    chamberId,
    source: "test",
  });
  await ensureChamberMembership(env, {
    address: delegatorVoter,
    chamberId,
    source: "test",
  });
  await ensureChamberMembership(env, {
    address: delegatorNonVoter,
    chamberId,
    source: "test",
  });
  for (let i = 0; i < 7; i += 1) {
    await ensureChamberMembership(env, {
      address: `5ExtraGov${i}`,
      chamberId,
      source: "test",
    });
  }

  const cookieDelegatorVoter = await makeSessionCookie(env, delegatorVoter);
  const cookieDelegatorNonVoter = await makeSessionCookie(
    env,
    delegatorNonVoter,
  );

  const set1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: {
        "content-type": "application/json",
        cookie: cookieDelegatorVoter,
      },
      body: JSON.stringify({
        type: "delegation.set",
        payload: { chamberId, delegateeAddress: delegatee },
      }),
    }),
  );
  assert.equal(set1.status, 200);

  const set2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: {
        "content-type": "application/json",
        cookie: cookieDelegatorNonVoter,
      },
      body: JSON.stringify({
        type: "delegation.set",
        payload: { chamberId, delegateeAddress: delegatee },
      }),
    }),
  );
  assert.equal(set2.status, 200);

  const cookieDelegatee = await makeSessionCookie(env, delegatee);
  const vote1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieDelegatee },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId, choice: "yes", score: 7 },
      }),
    }),
  );
  assert.equal(vote1.status, 200);
  const voteJson1 = await vote1.json();
  assert.deepEqual(voteJson1.counts, { yes: 3, no: 0, abstain: 0 });

  const vote2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: {
        "content-type": "application/json",
        cookie: cookieDelegatorVoter,
      },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId, choice: "no" },
      }),
    }),
  );
  assert.equal(vote2.status, 200);
  const voteJson2 = await vote2.json();
  assert.deepEqual(voteJson2.counts, { yes: 2, no: 1, abstain: 0 });

  const page = await chamberPageGet(
    makeContext({
      url: "https://local.test/api/proposals/tier-decay-v1/chamber",
      env,
      params: { id: proposalId },
      method: "GET",
    }),
  );
  assert.equal(page.status, 200);
  const pageJson = await page.json();
  assert.deepEqual(pageJson.votes, { yes: 2, no: 1, abstain: 0 });
});
