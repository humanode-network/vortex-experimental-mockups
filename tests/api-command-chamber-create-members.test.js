import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as chambersGet } from "../functions/api/chambers/index.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import {
  clearChamberMembershipsForTests,
  hasChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import {
  clearProposalsForTests,
  createProposal,
} from "../functions/_lib/proposalsStore.ts";

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

function baseEnv(overrides = {}) {
  const genesisVoter = "5GenesisEng";
  return {
    SESSION_SECRET: "test-secret",
    DEV_BYPASS_GATE: "true",
    DEV_INSECURE_COOKIES: "true",
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_ACTIVE_GOVERNORS: "3",
    SIM_CONFIG_JSON: JSON.stringify({
      genesisChamberMembers: { engineering: [genesisVoter] },
      genesisChambers: [
        { id: "general", title: "General", multiplier: 1.2 },
        { id: "engineering", title: "Engineering", multiplier: 1.5 },
      ],
    }),
    ...overrides,
  };
}

test("General chamber.create proposal seeds initial chamber memberships", async () => {
  clearIdempotencyForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  clearInlineReadModelsForTests();

  const env = baseEnv();
  const voterCookie = await makeSessionCookie(env, "5GenesisEng");

  await createProposal(env, {
    id: "general-create",
    stage: "vote",
    authorAddress: "5Creator",
    title: "Create science chamber",
    chamberId: "general",
    summary: "Create a new chamber",
    payload: {
      title: "Create science chamber",
      timeline: [],
      budgetItems: [],
      metaGovernance: {
        action: "chamber.create",
        chamberId: "science",
        title: "Science",
        multiplier: 1.7,
        genesisMembers: ["5SciLead", "5SciMember"],
      },
    },
  });

  const voteCreate = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "general-create", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteCreate.status, 200);

  const listRes = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env, method: "GET" }),
  );
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  assert.ok(listJson.items.some((c) => c.id === "science"));

  assert.equal(
    await hasChamberMembership(env, {
      address: "5SciLead",
      chamberId: "science",
    }),
    true,
  );
  assert.equal(
    await hasChamberMembership(env, {
      address: "5SciMember",
      chamberId: "science",
    }),
    true,
  );
  assert.equal(
    await hasChamberMembership(env, {
      address: "5Creator",
      chamberId: "science",
    }),
    true,
  );

  await createProposal(env, {
    id: "science-proposal",
    stage: "vote",
    authorAddress: "5SomeoneElse",
    title: "Science proposal",
    chamberId: "science",
    summary: "Summary",
    payload: {},
  });

  const sciCookie = await makeSessionCookie(env, "5SciLead");
  const sciVote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: sciCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "science-proposal", choice: "yes", score: 7 },
      }),
    }),
  );
  assert.equal(sciVote.status, 200);
});
