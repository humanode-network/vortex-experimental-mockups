import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as chambersGet } from "../functions/api/chambers/index.ts";
import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import {
  clearCmAwardsForTests,
  awardCmOnce,
} from "../functions/_lib/cmAwardsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import {
  clearProposalsForTests,
  createProposal,
} from "../functions/_lib/proposalsStore.ts";

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
  return `${name}=${value}`;
}

function baseEnv(overrides = {}) {
  return {
    SESSION_SECRET: "test-secret",
    DEV_BYPASS_GATE: "true",
    DEV_INSECURE_COOKIES: "true",
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_ACTIVE_GOVERNORS: "3",
    SIM_CONFIG_JSON: JSON.stringify({
      genesisChamberMembers: {
        engineering: ["5GenesisEng"],
        marketing: ["5GenesisMkt"],
      },
      genesisChambers: [
        { id: "general", title: "General", multiplier: 1.2 },
        { id: "engineering", title: "Engineering", multiplier: 1.5 },
        { id: "marketing", title: "Marketing", multiplier: 1.1 },
      ],
    }),
    ...overrides,
  };
}

test("GET /api/chambers projects pipeline + stats from canonical stores (inline mode)", async () => {
  clearIdempotencyForTests();
  clearProposalsForTests();
  clearChambersForTests();
  clearChamberMembershipsForTests();
  await clearChamberVotesForTests();
  await clearCmAwardsForTests();
  clearInlineReadModelsForTests();

  const env = baseEnv();

  await ensureChamberMembership(env, {
    address: "5MemberEng",
    chamberId: "engineering",
    source: "accepted_proposal",
  });

  await createProposal(env, {
    id: "eng-pool",
    stage: "pool",
    authorAddress: "5Author",
    title: "Eng pool proposal",
    chamberId: "engineering",
    summary: "Pool summary",
    payload: {},
  });
  await createProposal(env, {
    id: "eng-vote",
    stage: "vote",
    authorAddress: "5Author",
    title: "Eng vote proposal",
    chamberId: "engineering",
    summary: "Vote summary",
    payload: {},
  });
  await createProposal(env, {
    id: "gen-vote",
    stage: "vote",
    authorAddress: "5Author",
    title: "General vote proposal",
    chamberId: "general",
    summary: "Vote summary",
    payload: {},
  });

  await awardCmOnce(env, {
    proposalId: "p-award-1",
    proposerId: "5MemberEng",
    chamberId: "engineering",
    avgScore: 8,
    lcmPoints: 80,
    chamberMultiplierTimes10: 15,
    mcmPoints: 120,
  });

  const res = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));

  const engineering = json.items.find((c) => c.id === "engineering");
  assert.ok(engineering);
  assert.deepEqual(engineering.pipeline, { pool: 1, vote: 1, build: 0 });

  const general = json.items.find((c) => c.id === "general");
  assert.ok(general);

  // General governors = union of all genesis members + all memberships.
  assert.equal(general.stats.governors, "3");
});

test("GET /api/chambers supports includeDissolved=true", async () => {
  clearIdempotencyForTests();
  clearProposalsForTests();
  clearChambersForTests();
  clearChamberMembershipsForTests();
  await clearChamberVotesForTests();
  await clearCmAwardsForTests();
  clearInlineReadModelsForTests();

  const env = baseEnv();
  const voterCookie = await makeSessionCookie(env, "5GenesisEng");

  await createProposal(env, {
    id: "general-dissolve",
    stage: "vote",
    authorAddress: "5Creator",
    title: "Dissolve engineering",
    chamberId: "general",
    summary: "Dissolve Engineering",
    payload: {
      title: "Dissolve engineering",
      timeline: [],
      budgetItems: [],
      metaGovernance: { action: "chamber.dissolve", chamberId: "engineering" },
    },
  });

  const voteDissolve = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      method: "POST",
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "general-dissolve", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteDissolve.status, 200);

  const resNo = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env }),
  );
  assert.equal(resNo.status, 200);
  const jsonNo = await resNo.json();
  assert.ok(!jsonNo.items.some((c) => c.id === "engineering"));

  const resYes = await chambersGet(
    makeContext({
      url: "https://local.test/api/chambers?includeDissolved=true",
      env,
    }),
  );
  assert.equal(resYes.status, 200);
  const jsonYes = await resYes.json();
  assert.ok(jsonYes.items.some((c) => c.id === "engineering"));
});
