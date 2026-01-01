import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as chamberGet } from "../functions/api/chambers/[id].ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import { clearChambersForTests } from "../functions/_lib/chambersStore.ts";
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

function baseEnv(overrides = {}) {
  return {
    READ_MODELS_INLINE: "true",
    DEV_BYPASS_ADMIN: "true",
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

test("GET /api/chambers/:id projects proposals and roster from canonical stores", async () => {
  clearProposalsForTests();
  clearChamberMembershipsForTests();
  clearChambersForTests();
  clearInlineReadModelsForTests();

  const env = baseEnv();

  await ensureChamberMembership(env, {
    address: "5MemberEng",
    chamberId: "engineering",
    source: "accepted_proposal",
  });
  await ensureChamberMembership(env, {
    address: "5MemberProd",
    chamberId: "product",
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
    id: "eng-build-formation",
    stage: "build",
    authorAddress: "5Author",
    title: "Eng build formation proposal",
    chamberId: "engineering",
    summary: "Build summary",
    payload: { formationEligible: true },
  });
  await createProposal(env, {
    id: "eng-build-passed",
    stage: "build",
    authorAddress: "5Author",
    title: "Eng build passed proposal",
    chamberId: "engineering",
    summary: "Build passed summary",
    payload: { formationEligible: false },
  });

  const engineeringRes = await chamberGet(
    makeContext({
      url: "https://local.test/api/chambers/engineering",
      env,
      params: { id: "engineering" },
    }),
  );
  assert.equal(engineeringRes.status, 200);
  const engineeringJson = await engineeringRes.json();

  const engGovernorIds = engineeringJson.governors.map((g) => g.id).sort();
  assert.deepEqual(engGovernorIds, ["5GenesisEng", "5MemberEng"]);

  const engProposals = engineeringJson.proposals;
  assert.ok(
    engProposals.some(
      (p) =>
        p.id === "eng-pool" &&
        p.stage === "upcoming" &&
        p.meta === "Proposal pool",
    ),
  );
  assert.ok(
    engProposals.some(
      (p) =>
        p.id === "eng-vote" && p.stage === "live" && p.meta === "Chamber vote",
    ),
  );
  assert.ok(
    engProposals.some(
      (p) =>
        p.id === "eng-build-formation" &&
        p.stage === "ended" &&
        p.meta === "Formation",
    ),
  );
  assert.ok(
    engProposals.some(
      (p) =>
        p.id === "eng-build-passed" &&
        p.stage === "ended" &&
        p.meta === "Passed",
    ),
  );

  const generalRes = await chamberGet(
    makeContext({
      url: "https://local.test/api/chambers/general",
      env,
      params: { id: "general" },
    }),
  );
  assert.equal(generalRes.status, 200);
  const generalJson = await generalRes.json();

  const generalGovernorIds = generalJson.governors.map((g) => g.id).sort();
  assert.deepEqual(generalGovernorIds, [
    "5GenesisEng",
    "5GenesisMkt",
    "5MemberEng",
    "5MemberProd",
  ]);
});
