import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestPost as tickPost } from "../functions/api/clock/tick.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearChamberMembershipsForTests } from "../functions/_lib/chamberMembershipsStore.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
import { clearCmAwardsForTests } from "../functions/_lib/cmAwardsStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import {
  clearProposalsForTests,
  createProposal,
  getProposal,
} from "../functions/_lib/proposalsStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { getChamber } from "../functions/_lib/chambersStore.ts";

function makeContext({ url, env, params, method = "POST", headers, body }) {
  return {
    request: new Request(url, { method, headers, body }),
    env,
    params,
  };
}

async function finalizeIfPendingVeto(env, proposalId) {
  const proposal = await getProposal(env, proposalId);
  if (!proposal?.voteFinalizesAt) return;
  const envAfter = {
    ...env,
    SIM_NOW_ISO: new Date(
      proposal.voteFinalizesAt.getTime() + 1000,
    ).toISOString(),
  };
  const res = await tickPost(
    makeContext({
      url: "https://local.test/api/clock/tick",
      env: envAfter,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollup: false }),
    }),
  );
  assert.equal(res.status, 200);
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

function makeDraftForm({ title, chamberId }) {
  return {
    title,
    chamberId,
    summary: "Short summary.",
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

test("cannot submit new proposals to a dissolved chamber", async () => {
  clearIdempotencyForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

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

  const dissolveVote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "general-dissolve", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(dissolveVote.status, 200);
  await finalizeIfPendingVeto(env, "general-dissolve");

  const proposerCookie = await makeSessionCookie(env, "5Proposer");
  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: proposerCookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: {
          form: makeDraftForm({
            title: "New engineering proposal after dissolution",
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
  assert.equal(submitRes.status, 409);
  const submitJson = await submitRes.json();
  assert.equal(submitJson.error?.code, "chamber_dissolved");
});

test("dissolved chambers still allow voting on proposals created before dissolution", async () => {
  clearIdempotencyForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

  const env = baseEnv();
  const voterCookie = await makeSessionCookie(env, "5GenesisEng");

  await createProposal(env, {
    id: "eng-pre-dissolve",
    stage: "vote",
    authorAddress: "5Creator",
    title: "Engineering proposal before dissolution",
    chamberId: "engineering",
    summary: "Old proposal",
    payload: { title: "Engineering proposal before dissolution" },
  });

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

  const dissolveVote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "general-dissolve", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(dissolveVote.status, 200);
  await finalizeIfPendingVeto(env, "general-dissolve");

  const chamber = await getChamber(
    env,
    "https://local.test/api/command",
    "engineering",
  );
  assert.equal(chamber?.status, "dissolved");

  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "eng-pre-dissolve", choice: "yes", score: 7 },
      }),
    }),
  );
  assert.equal(voteRes.status, 200);
});

test("dissolved chambers reject voting on proposals created after dissolution", async () => {
  clearIdempotencyForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

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

  const dissolveVote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "general-dissolve", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(dissolveVote.status, 200);
  await finalizeIfPendingVeto(env, "general-dissolve");

  const chamber = await getChamber(
    env,
    "https://local.test/api/command",
    "engineering",
  );
  assert.equal(chamber?.status, "dissolved");
  assert.ok(chamber?.dissolvedAt);

  while (Date.now() <= chamber.dissolvedAt.getTime()) {
    await new Promise((r) => setTimeout(r, 1));
  }

  await createProposal(env, {
    id: "eng-post-dissolve",
    stage: "vote",
    authorAddress: "5Creator",
    title: "Engineering proposal after dissolution",
    chamberId: "engineering",
    summary: "New proposal",
    payload: { title: "Engineering proposal after dissolution" },
  });

  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "eng-post-dissolve", choice: "yes", score: 7 },
      }),
    }),
  );
  assert.equal(voteRes.status, 409);
  const voteJson = await voteRes.json();
  assert.equal(voteJson.error?.code, "chamber_dissolved");
});
