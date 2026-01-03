import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as draftsGet } from "../functions/api/proposals/drafts/index.ts";
import { onRequestGet as draftGet } from "../functions/api/proposals/drafts/[id].ts";
import { onRequestGet as proposalsGet } from "../functions/api/proposals/index.ts";
import { onRequestGet as proposalPoolGet } from "../functions/api/proposals/[id]/pool.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import {
  clearProposalsForTests,
  getProposal,
} from "../functions/_lib/proposalsStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import { clearEraForTests } from "../functions/_lib/eraStore.ts";
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
  READ_MODELS_INLINE_EMPTY: "true",
  DEV_BYPASS_ADMIN: "true",
};

function makeDraftForm() {
  return {
    title: "Test proposal draft",
    chamberId: "engineering",
    summary: "Short summary for the draft.",
    what: "What: build something useful.",
    why: "Why: make governance easier.",
    how: "Step 1\nStep 2",
    timeline: [{ id: "ms-1", title: "Milestone 1", timeframe: "2 weeks" }],
    outputs: [{ id: "out-1", label: "Docs", url: "https://example.com" }],
    budgetItems: [{ id: "b-1", description: "Work", amount: "1000" }],
    aboutMe: "",
    attachments: [
      { id: "a-1", label: "Spec", url: "https://example.com/spec" },
    ],
    agreeRules: true,
    confirmBudget: true,
  };
}

test("proposal drafts: save → list/detail → submit to pool", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearChamberMembershipsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5TestAddr");

  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: { form: makeDraftForm() },
      }),
    }),
  );
  assert.equal(saveRes.status, 200);
  const saved = await saveRes.json();
  assert.equal(saved.ok, true);
  assert.equal(saved.type, "proposal.draft.save");
  assert.ok(typeof saved.draftId === "string");

  const listRes = await draftsGet(
    makeContext({
      url: "https://local.test/api/proposals/drafts",
      env: baseEnv,
      method: "GET",
      headers: { cookie },
    }),
  );
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  assert.ok(Array.isArray(listJson.items));
  assert.equal(listJson.items.length, 1);
  assert.equal(listJson.items[0].id, saved.draftId);

  const detailRes = await draftGet(
    makeContext({
      url: `https://local.test/api/proposals/drafts/${saved.draftId}`,
      env: baseEnv,
      method: "GET",
      headers: { cookie },
      params: { id: saved.draftId },
    }),
  );
  assert.equal(detailRes.status, 200);
  const detailJson = await detailRes.json();
  assert.equal(detailJson.title, "Test proposal draft");
  assert.ok(Array.isArray(detailJson.checklist));

  const submitRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.submitToPool",
        payload: { draftId: saved.draftId },
      }),
    }),
  );
  assert.equal(submitRes.status, 200);
  const submitJson = await submitRes.json();
  assert.equal(submitJson.ok, true);
  assert.equal(submitJson.type, "proposal.submitToPool");
  assert.ok(typeof submitJson.proposalId === "string");

  const proposal = await getProposal(baseEnv, submitJson.proposalId);
  assert.ok(proposal, "canonical proposal exists");
  assert.equal(proposal.stage, "pool");
  assert.equal(proposal.title, "Test proposal draft");

  const proposalsRes = await proposalsGet(
    makeContext({
      url: "https://local.test/api/proposals?stage=pool",
      env: baseEnv,
      method: "GET",
    }),
  );
  assert.equal(proposalsRes.status, 200);
  const proposalsJson = await proposalsRes.json();
  assert.ok(Array.isArray(proposalsJson.items));
  assert.ok(
    proposalsJson.items.some((p) => p.id === submitJson.proposalId),
    "submitted proposal appears in proposals list",
  );

  const poolPageRes = await proposalPoolGet(
    makeContext({
      url: `https://local.test/api/proposals/${submitJson.proposalId}/pool`,
      env: baseEnv,
      method: "GET",
      params: { id: submitJson.proposalId },
    }),
  );
  assert.equal(poolPageRes.status, 200);
  const poolPageJson = await poolPageRes.json();
  assert.equal(poolPageJson.title, "Test proposal draft");
  assert.equal(poolPageJson.upvotes, 0);

  const listAfterSubmit = await draftsGet(
    makeContext({
      url: "https://local.test/api/proposals/drafts",
      env: baseEnv,
      method: "GET",
      headers: { cookie },
    }),
  );
  assert.equal(listAfterSubmit.status, 200);
  assert.deepEqual(await listAfterSubmit.json(), { items: [] });
});

test("proposal reads prefer canonical proposals over read models", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearChamberMembershipsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5TestAddr");

  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: { form: makeDraftForm() },
      }),
    }),
  );
  assert.equal(saveRes.status, 200);
  const saved = await saveRes.json();

  const submitRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.submitToPool",
        payload: { draftId: saved.draftId },
      }),
    }),
  );
  assert.equal(submitRes.status, 200);
  const submitJson = await submitRes.json();
  assert.ok(submitJson.proposalId);

  const proposal = await getProposal(baseEnv, submitJson.proposalId);
  assert.ok(proposal);

  clearInlineReadModelsForTests();

  const proposalsRes = await proposalsGet(
    makeContext({
      url: "https://local.test/api/proposals?stage=pool",
      env: baseEnv,
      method: "GET",
    }),
  );
  assert.equal(proposalsRes.status, 200);
  const proposalsJson = await proposalsRes.json();
  assert.ok(
    proposalsJson.items.some((p) => p.id === submitJson.proposalId),
    "proposal still appears without read models",
  );

  const poolPageRes = await proposalPoolGet(
    makeContext({
      url: `https://local.test/api/proposals/${submitJson.proposalId}/pool`,
      env: baseEnv,
      method: "GET",
      params: { id: submitJson.proposalId },
    }),
  );
  assert.equal(poolPageRes.status, 200);
  const poolPageJson = await poolPageRes.json();
  assert.equal(poolPageJson.title, "Test proposal draft");
});

test("canonical proposals: stage gating and pool→vote advance work without read models", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearChamberMembershipsForTests();
  await clearPoolVotesForTests();
  clearEraForTests();

  const env = {
    ...baseEnv,
    READ_MODELS_INLINE: "true",
    SIM_ACTIVE_GOVERNORS: "10",
  };

  for (let i = 0; i < 10; i += 1) {
    await ensureChamberMembership(env, {
      address: `5EngMember${i}`,
      chamberId: "engineering",
      source: "test",
    });
  }

  const cookieProposer = await makeSessionCookie(env, "5ProposerAddr");
  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieProposer },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: { form: makeDraftForm() },
      }),
    }),
  );
  assert.equal(saveRes.status, 200);
  const saved = await saveRes.json();

  const submitRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieProposer },
      body: JSON.stringify({
        type: "proposal.submitToPool",
        payload: { draftId: saved.draftId },
      }),
    }),
  );
  assert.equal(submitRes.status, 200);
  const submitted = await submitRes.json();
  const proposalId = submitted.proposalId;
  assert.ok(proposalId);

  clearInlineReadModelsForTests();

  const cookieVoter1 = await makeSessionCookie(env, "5VoterA");
  const vote1 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieVoter1 },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId, direction: "up" },
      }),
    }),
  );
  assert.equal(vote1.status, 200);

  const cookieVoter2 = await makeSessionCookie(env, "5VoterB");
  const vote2 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieVoter2 },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId, direction: "down" },
      }),
    }),
  );
  assert.equal(vote2.status, 200);

  const cookieVoter3 = await makeSessionCookie(env, "5VoterC");
  const vote3 = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieVoter3 },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId, direction: "down" },
      }),
    }),
  );
  assert.equal(vote3.status, 200);

  const canonical = await getProposal(env, proposalId);
  assert.ok(canonical);
  assert.equal(canonical.stage, "vote");

  const proposalsRes = await proposalsGet(
    makeContext({
      url: "https://local.test/api/proposals?stage=vote",
      env,
      method: "GET",
    }),
  );
  assert.equal(proposalsRes.status, 200);
  const proposalsJson = await proposalsRes.json();
  assert.ok(proposalsJson.items.some((p) => p.id === proposalId));

  const blocked = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie: cookieVoter1 },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId, direction: "up" },
      }),
    }),
  );
  assert.equal(blocked.status, 409);
});

test("proposal drafts: submit requires submittable draft", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearChamberMembershipsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5TestAddr");
  const badForm = makeDraftForm();
  badForm.why = "";

  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: { form: badForm },
      }),
    }),
  );
  assert.equal(saveRes.status, 200);
  const saved = await saveRes.json();

  const submitRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.submitToPool",
        payload: { draftId: saved.draftId },
      }),
    }),
  );
  assert.equal(submitRes.status, 400);
});

test("proposal drafts: save is idempotent (Idempotency-Key)", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearChamberMembershipsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5TestAddr");

  const headers = {
    "content-type": "application/json",
    cookie,
    "idempotency-key": "draft-save-1",
  };
  const body = JSON.stringify({
    type: "proposal.draft.save",
    payload: { form: makeDraftForm() },
  });

  const first = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers,
      body,
    }),
  );
  assert.equal(first.status, 200);
  const firstJson = await first.json();
  assert.equal(firstJson.ok, true);
  assert.ok(typeof firstJson.draftId === "string");

  const second = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers,
      body,
    }),
  );
  assert.equal(second.status, 200);
  const secondJson = await second.json();
  assert.deepEqual(secondJson, firstJson);

  const listRes = await draftsGet(
    makeContext({
      url: "https://local.test/api/proposals/drafts",
      env: baseEnv,
      method: "GET",
      headers: { cookie },
    }),
  );
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  assert.ok(Array.isArray(listJson.items));
  assert.equal(listJson.items.length, 1);
  assert.equal(listJson.items[0].id, firstJson.draftId);
});
