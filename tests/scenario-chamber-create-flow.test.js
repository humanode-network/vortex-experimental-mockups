import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as chambersGet } from "../functions/api/chambers/index.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearApiRateLimitsForTests } from "../functions/_lib/apiRateLimitStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
import { clearCmAwardsForTests } from "../functions/_lib/cmAwardsStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import { clearProposalsForTests } from "../functions/_lib/proposalsStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearVetoVotesForTests } from "../functions/_lib/vetoVotesStore.ts";
import { getProposal } from "../functions/_lib/proposalsStore.ts";

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

async function resetAll() {
  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  await clearCmAwardsForTests();
  clearVetoVotesForTests();
  clearIdempotencyForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearInlineReadModelsForTests();
  clearApiRateLimitsForTests();
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
    SIM_CONFIG_JSON: JSON.stringify({
      genesisChambers: [{ id: "general", title: "General", multiplier: 1.2 }],
      genesisChamberMembers: {},
    }),
    ...overrides,
  };
}

test("scenario: create chamber via General meta-governance proposal (draft → pool → vote → chambers)", async () => {
  await resetAll();
  const env = baseEnv();

  const proposerAddress = "5Proposer";
  const proposerCookie = await makeSessionCookie(env, proposerAddress);

  const voters = Array.from({ length: 15 }, (_, i) => `5Gov${i}`);
  for (const address of voters) {
    await ensureChamberMembership(env, {
      address,
      chamberId: "engineering",
      source: "test",
    });
  }

  const saveDraft = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: proposerCookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: {
          form: {
            title: "Create Science chamber",
            chamberId: "general",
            summary: "Creates a new specialization chamber.",
            what: "Create a new specialization chamber for science.",
            why: "Need a dedicated domain for proposals.",
            how: "Create the chamber and seed initial members.",
            metaGovernance: {
              action: "chamber.create",
              chamberId: "science",
              title: "Science",
              multiplier: 1.25,
              genesisMembers: ["5Founder1", "5Founder2"],
            },
            timeline: [],
            outputs: [],
            budgetItems: [],
            aboutMe: "",
            attachments: [],
            agreeRules: true,
            confirmBudget: true,
          },
        },
      }),
    }),
  );
  assert.equal(saveDraft.status, 200);
  const saveJson = await saveDraft.json();
  assert.ok(
    typeof saveJson.draftId === "string" && saveJson.draftId.length > 0,
  );

  const submit = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: proposerCookie },
      body: JSON.stringify({
        type: "proposal.submitToPool",
        payload: { draftId: saveJson.draftId },
      }),
    }),
  );
  assert.equal(submit.status, 200);
  const submitJson = await submit.json();
  assert.ok(
    typeof submitJson.proposalId === "string" &&
      submitJson.proposalId.length > 0,
  );
  const proposalId = submitJson.proposalId;

  for (let i = 0; i < voters.length; i += 1) {
    const cookie = await makeSessionCookie(env, voters[i]);
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "pool.vote",
          payload: { proposalId, direction: "up" },
        }),
      }),
    );
    if (res.status === 409) break;
    assert.equal(res.status, 200);
  }

  const afterPool = await getProposal(env, proposalId);
  assert.ok(afterPool);
  assert.equal(afterPool.stage, "vote");

  for (let i = 0; i < 10; i += 1) {
    const cookie = await makeSessionCookie(env, voters[i]);
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "chamber.vote",
          payload: { proposalId, choice: "yes", score: 8 },
        }),
      }),
    );
    if (res.status === 409) break;
    assert.equal(res.status, 200);
  }

  const afterVote = await getProposal(env, proposalId);
  assert.ok(afterVote);
  assert.equal(afterVote.stage, "build");

  const chambersRes = await chambersGet(
    makeContext({
      url: "https://local.test/api/chambers",
      env,
      method: "GET",
    }),
  );
  assert.equal(chambersRes.status, 200);
  const chambersJson = await chambersRes.json();
  assert.ok(Array.isArray(chambersJson.items));
  assert.ok(chambersJson.items.some((c) => c.id === "science"));
});
