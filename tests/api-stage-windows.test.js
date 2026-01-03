import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import {
  clearProposalsForTests,
  transitionProposalStage,
} from "../functions/_lib/proposalsStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
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
  SIM_ENABLE_STAGE_WINDOWS: "true",
  SIM_POOL_WINDOW_SECONDS: "1",
  SIM_VOTE_WINDOW_SECONDS: "1",
};

function makeDraftForm() {
  return {
    title: "Stage window test proposal",
    chamberId: "engineering",
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

test("stage windows: pool votes rejected after pool window ends", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearEraForTests();

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

  const envExpired = {
    ...baseEnv,
    SIM_NOW_ISO: new Date(Date.now() + 5_000).toISOString(),
  };
  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: envExpired,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: submitJson.proposalId, direction: "up" },
      }),
    }),
  );
  assert.equal(voteRes.status, 409);
});

test("stage windows: chamber votes rejected after voting window ends", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearEraForTests();

  const cookie = await makeSessionCookie(baseEnv, "5TestAddr");
  await ensureChamberMembership(baseEnv, {
    address: "5TestAddr",
    chamberId: "engineering",
    source: "test",
  });

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

  const moved = await transitionProposalStage(baseEnv, {
    proposalId: submitJson.proposalId,
    from: "pool",
    to: "vote",
  });
  assert.equal(moved, true);

  const envExpired = {
    ...baseEnv,
    SIM_NOW_ISO: new Date(Date.now() + 5_000).toISOString(),
  };
  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: envExpired,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: submitJson.proposalId, choice: "yes" },
      }),
    }),
  );
  assert.equal(voteRes.status, 409);
});
