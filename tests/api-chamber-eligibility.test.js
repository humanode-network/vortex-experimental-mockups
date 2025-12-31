import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import {
  clearProposalsForTests,
  createProposal,
  getProposal,
  transitionProposalStage,
} from "../functions/_lib/proposalsStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
  hasChamberMembership,
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
    ...overrides,
  };
}

function makeDraftForm({ title, chamberId }) {
  return {
    title,
    chamberId,
    summary: "Short summary for the draft.",
    what: "What",
    why: "Why",
    how: "How",
    timeline: [{ id: "ms-1", title: "Milestone 1", timeframe: "2 weeks" }],
    outputs: [],
    budgetItems: [{ id: "b-1", description: "Work", amount: "1000" }],
    aboutMe: "",
    attachments: [],
    agreeRules: true,
    confirmBudget: true,
  };
}

test("chamber voting is restricted by chamber membership and membership is granted on acceptance", async () => {
  clearIdempotencyForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearEraForTests();
  clearInlineReadModelsForTests();

  const env = baseEnv();

  const proposerAddress = "5Author";
  const proposerCookie = await makeSessionCookie(env, proposerAddress);

  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: proposerCookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: {
          form: makeDraftForm({
            title: "Engineering acceptance grants membership",
            chamberId: "engineering",
          }),
        },
      }),
    }),
  );
  assert.equal(saveRes.status, 200);
  const saveJson = await saveRes.json();

  const submitRes = await commandPost(
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
  assert.equal(submitRes.status, 200);
  const submitJson = await submitRes.json();

  const moved = await transitionProposalStage(env, {
    proposalId: submitJson.proposalId,
    from: "pool",
    to: "vote",
  });
  assert.equal(moved, true);

  const genesisVoter = "5GenesisEng";
  await ensureChamberMembership(env, {
    address: genesisVoter,
    chamberId: "engineering",
    source: "genesis",
  });

  const genesisCookie = await makeSessionCookie(env, genesisVoter);
  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: genesisCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: submitJson.proposalId, choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteRes.status, 200);

  const accepted = await getProposal(env, submitJson.proposalId);
  assert.ok(accepted);
  assert.equal(accepted.stage, "build");

  assert.equal(
    await hasChamberMembership(env, {
      address: proposerAddress,
      chamberId: "engineering",
    }),
    true,
  );
  assert.equal(
    await hasChamberMembership(env, {
      address: proposerAddress,
      chamberId: "general",
    }),
    true,
  );

  const p2 = await createProposal(env, {
    id: "p2-engineering",
    stage: "vote",
    authorAddress: "5SomeoneElse",
    title: "Another engineering proposal",
    chamberId: "engineering",
    summary: "Summary",
    payload: {},
  });
  assert.equal(p2.stage, "vote");

  const voteAllowed = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: proposerCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: p2.id, choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteAllowed.status, 200);

  const p3 = await createProposal(env, {
    id: "p3-economics",
    stage: "vote",
    authorAddress: "5SomeoneElse",
    title: "Economics proposal",
    chamberId: "economics",
    summary: "Summary",
    payload: {},
  });

  const voteDenied = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: proposerCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: p3.id, choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteDenied.status, 403);
});

test("genesis chamber memberships from SIM_CONFIG_JSON allow initial chamber voting", async () => {
  clearIdempotencyForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearEraForTests();
  clearInlineReadModelsForTests();

  const genesisVoter = "5GenesisEng";
  const env = baseEnv({
    SIM_CONFIG_JSON: JSON.stringify({
      genesisChamberMembers: { engineering: [genesisVoter] },
    }),
  });

  const proposal = await createProposal(env, {
    id: "p-genesis-1",
    stage: "vote",
    authorAddress: "5SomeoneElse",
    title: "Genesis voter can vote without stored membership",
    chamberId: "engineering",
    summary: "Summary",
    payload: {},
  });
  assert.equal(proposal.stage, "vote");

  assert.equal(
    await hasChamberMembership(env, {
      address: genesisVoter,
      chamberId: "engineering",
    }),
    false,
  );

  const genesisCookie = await makeSessionCookie(env, genesisVoter);
  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: genesisCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: proposal.id, choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteRes.status, 200);

  assert.equal(
    await hasChamberMembership(env, {
      address: genesisVoter,
      chamberId: "engineering",
    }),
    false,
  );
});
