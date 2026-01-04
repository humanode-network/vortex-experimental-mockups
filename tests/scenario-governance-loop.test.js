import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as timelineGet } from "../functions/api/proposals/[id]/timeline.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearApiRateLimitsForTests } from "../functions/_lib/apiRateLimitStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import {
  clearProposalsForTests,
  getProposal,
} from "../functions/_lib/proposalsStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
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

async function resetAll() {
  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
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
      genesisChambers: [
        { id: "general", title: "General", multiplier: 1.2 },
        { id: "engineering", title: "Engineering", multiplier: 1.4 },
      ],
      genesisChamberMembers: {},
    }),
    ...overrides,
  };
}

test("scenario: project proposal goes pool → vote → build with timeline entries", async () => {
  await resetAll();
  const env = baseEnv();

  const proposer = "5Proposer";
  const proposerCookie = await makeSessionCookie(env, proposer);
  await ensureChamberMembership(env, {
    address: proposer,
    chamberId: "engineering",
    source: "test",
  });

  const voters = ["5GovA", "5GovB"];
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
            title: "Engineering tooling proposal",
            chamberId: "engineering",
            summary: "Short proposal summary.",
            what: "Build a validator ops toolkit.",
            why: "Improve tooling for node operators.",
            how: "Deliver CLI + docs in 4 weeks.",
            timeline: [
              { id: "ms-1", title: "Milestone 1", timeframe: "4 weeks" },
            ],
            outputs: [
              { id: "out-1", label: "GitHub repo", url: "https://example.com" },
            ],
            budgetItems: [{ id: "b-1", description: "Work", amount: "1000" }],
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
  assert.ok(typeof saveJson.draftId === "string");

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
  const proposalId = submitJson.proposalId;
  assert.ok(typeof proposalId === "string" && proposalId.length > 0);

  for (const voter of voters) {
    const cookie = await makeSessionCookie(env, voter);
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
    assert.equal(res.status, 200);
  }

  const afterPool = await getProposal(env, proposalId);
  assert.ok(afterPool);
  assert.equal(afterPool.stage, "vote");

  for (const voter of voters) {
    const cookie = await makeSessionCookie(env, voter);
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
    assert.equal(res.status, 200);
  }

  const afterVote = await getProposal(env, proposalId);
  assert.ok(afterVote);
  assert.equal(afterVote.stage, "build");

  const timelineRes = await timelineGet(
    makeContext({
      url: `https://local.test/api/proposals/${proposalId}/timeline`,
      env,
      method: "GET",
      params: { id: proposalId },
    }),
  );
  assert.equal(timelineRes.status, 200);
  const timelineJson = await timelineRes.json();
  assert.ok(Array.isArray(timelineJson.items));
  assert.ok(timelineJson.items.length >= 3);
});
