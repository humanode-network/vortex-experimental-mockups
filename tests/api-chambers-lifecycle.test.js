import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as chambersGet } from "../functions/api/chambers/index.ts";
import { onRequestGet as chamberGet } from "../functions/api/chambers/[id].ts";
import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestPost as tickPost } from "../functions/api/clock/tick.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import {
  clearProposalsForTests,
  createProposal,
  getProposal,
} from "../functions/_lib/proposalsStore.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import { clearChamberMembershipsForTests } from "../functions/_lib/chamberMembershipsStore.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearCmAwardsForTests } from "../functions/_lib/cmAwardsStore.ts";

function makeContext({ url, env, params, method = "GET", headers, body }) {
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
  return {
    SESSION_SECRET: "test-secret",
    DEV_BYPASS_GATE: "true",
    DEV_INSECURE_COOKIES: "true",
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
    SIM_ACTIVE_GOVERNORS: "3",
    SIM_CONFIG_JSON: JSON.stringify({
      genesisChamberMembers: { engineering: ["5GenesisEng"] },
      genesisChambers: [
        { id: "general", title: "General", multiplier: 1.2 },
        { id: "engineering", title: "Engineering", multiplier: 1.5 },
      ],
    }),
    ...overrides,
  };
}

test("accepted General proposal can create and dissolve chambers", async () => {
  clearIdempotencyForTests();
  clearProposalsForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();

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
      },
    },
  });

  const voteCreate = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      method: "POST",
      headers: { "content-type": "application/json", cookie: voterCookie },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId: "general-create", choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(voteCreate.status, 200);
  await finalizeIfPendingVeto(env, "general-create");
  const afterCreate = await getProposal(env, "general-create");
  assert.ok(afterCreate);
  assert.equal(afterCreate.stage, "build");

  const listRes1 = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env }),
  );
  assert.equal(listRes1.status, 200);
  const listJson1 = await listRes1.json();
  assert.ok(Array.isArray(listJson1.items));
  assert.ok(listJson1.items.some((c) => c.id === "science"));

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
  await finalizeIfPendingVeto(env, "general-dissolve");

  const listRes2 = await chambersGet(
    makeContext({ url: "https://local.test/api/chambers", env }),
  );
  assert.equal(listRes2.status, 200);
  const listJson2 = await listRes2.json();
  assert.ok(!listJson2.items.some((c) => c.id === "engineering"));

  const detailRes = await chamberGet(
    makeContext({
      url: "https://local.test/api/chambers/engineering",
      env,
      params: { id: "engineering" },
    }),
  );
  assert.equal(detailRes.status, 200);
  const detailJson = await detailRes.json();
  assert.ok(Array.isArray(detailJson.stageOptions));
  assert.ok(Array.isArray(detailJson.governors));
  assert.ok(detailJson.governors.length > 0);
});
