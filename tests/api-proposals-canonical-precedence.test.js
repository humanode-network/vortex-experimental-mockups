import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as proposalsGet } from "../functions/api/proposals/index.ts";
import { onRequestGet as proposalPoolGet } from "../functions/api/proposals/[id]/pool.ts";
import {
  clearProposalsForTests,
  createProposal,
} from "../functions/_lib/proposalsStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";

function makeContext({ url, env, params, method = "GET", headers }) {
  return {
    request: new Request(url, { method, headers }),
    env,
    params,
  };
}

const env = { READ_MODELS_INLINE: "true", DEV_BYPASS_ADMIN: "true" };
const proposalId = "biometric-account-recovery";

test("GET /api/proposals prefers canonical proposals over seeded read models", async () => {
  clearProposalsForTests();
  await clearPoolVotesForTests();

  await createProposal(env, {
    id: proposalId,
    stage: "pool",
    authorAddress: "5canonical-author",
    title: "Canonical proposal title",
    chamberId: "engineering",
    summary: "Canonical summary",
    payload: {
      title: "Canonical proposal title",
      chamberId: "engineering",
      summary: "Canonical summary",
      what: "Canonical overview",
      why: "",
      how: "Step 1\nStep 2",
      aboutMe: "",
      agreeRules: true,
      confirmBudget: true,
      timeline: [],
      outputs: [],
      budgetItems: [],
      attachments: [],
    },
  });

  const res = await proposalsGet(
    makeContext({ url: "https://local.test/api/proposals", env }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  const item = json.items.find((entry) => entry.id === proposalId);
  assert.ok(item, "Expected the proposal to be present in the list");
  assert.equal(item.title, "Canonical proposal title");
  assert.equal(item.summary, "Canonical summary");
});

test("GET /api/proposals/:id/pool prefers canonical proposals over seeded read models", async () => {
  clearProposalsForTests();
  await clearPoolVotesForTests();

  await createProposal(env, {
    id: proposalId,
    stage: "pool",
    authorAddress: "5canonical-author",
    title: "Canonical proposal title",
    chamberId: "engineering",
    summary: "Canonical summary",
    payload: {
      title: "Canonical proposal title",
      chamberId: "engineering",
      summary: "Canonical summary",
      what: "Canonical overview",
      why: "",
      how: "Step 1\nStep 2",
      aboutMe: "",
      agreeRules: true,
      confirmBudget: true,
      timeline: [],
      outputs: [],
      budgetItems: [],
      attachments: [],
    },
  });

  const res = await proposalPoolGet(
    makeContext({
      url: `https://local.test/api/proposals/${proposalId}/pool`,
      env,
      params: { id: proposalId },
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.title, "Canonical proposal title");
  assert.equal(json.summary, "Canonical summary");
  assert.equal(json.overview, "Canonical overview");
});
