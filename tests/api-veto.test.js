import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestPost as tickPost } from "../functions/api/clock/tick.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearChamberVotesForTests } from "../functions/_lib/chamberVotesStore.ts";
import {
  awardCmOnce,
  clearCmAwardsForTests,
} from "../functions/_lib/cmAwardsStore.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../functions/_lib/chamberMembershipsStore.ts";
import {
  clearProposalsForTests,
  createProposal,
  getProposal,
} from "../functions/_lib/proposalsStore.ts";
import { clearVetoVotesForTests } from "../functions/_lib/vetoVotesStore.ts";

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

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  READ_MODELS_INLINE_EMPTY: "true",
  DEV_BYPASS_ADMIN: "true",
  DEV_BYPASS_CHAMBER_ELIGIBILITY: "true",
  SIM_ENABLE_STAGE_WINDOWS: "false",
};

test("veto vote can reset a passed chamber vote and pause voting", async () => {
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();
  clearVetoVotesForTests();
  clearProposalsForTests();

  const proposalId = "veto-test-proposal";
  await createProposal(baseEnv, {
    id: proposalId,
    stage: "vote",
    authorAddress: "5Proposer",
    title: "Veto test",
    chamberId: "general",
    summary: "Test proposal",
    payload: { formationEligible: false },
  });
  const created = await getProposal(baseEnv, proposalId);
  assert.ok(created);
  const envNow = { ...baseEnv, SIM_NOW_ISO: created.updatedAt.toISOString() };

  await awardCmOnce(envNow, {
    proposalId: "award-general-1",
    proposerId: "5VetoHolder",
    chamberId: "general",
    avgScore: 8,
    lcmPoints: 80,
    chamberMultiplierTimes10: 10,
    mcmPoints: 80,
  });

  await ensureChamberMembership(envNow, {
    address: "5VetoHolder",
    chamberId: "general",
    source: "test",
  });
  for (let i = 0; i < 50; i += 1) {
    await ensureChamberMembership(envNow, {
      address: `5Vote${i}`,
      chamberId: "general",
      source: "test",
    });
  }

  for (let i = 0; i < 50; i += 1) {
    const voter = `5Vote${i}`;
    const cookie = await makeSessionCookie(envNow, voter);
    const choice = i < 34 ? "yes" : "no";
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: envNow,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "chamber.vote",
          payload: {
            proposalId,
            choice,
            ...(choice === "yes" ? { score: 8 } : {}),
          },
        }),
      }),
    );
    if (res.status === 409) break;
    assert.equal(res.status, 200);
  }

  const afterPass = await getProposal(envNow, proposalId);
  assert.ok(afterPass);
  assert.equal(afterPass.stage, "vote");
  assert.ok(afterPass.votePassedAt);
  assert.ok(afterPass.voteFinalizesAt);
  assert.ok(Array.isArray(afterPass.vetoCouncil));
  assert.equal(afterPass.vetoThreshold, 1);

  const vetoCookie = await makeSessionCookie(envNow, "5VetoHolder");
  const vetoRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: envNow,
      headers: { "content-type": "application/json", cookie: vetoCookie },
      body: JSON.stringify({
        type: "veto.vote",
        payload: { proposalId, choice: "veto" },
      }),
    }),
  );
  assert.equal(vetoRes.status, 200);

  const afterVeto = await getProposal(envNow, proposalId);
  assert.ok(afterVeto);
  assert.equal(afterVeto.stage, "vote");
  assert.equal(afterVeto.vetoCount, 1);
  assert.equal(afterVeto.votePassedAt, null);
  assert.equal(afterVeto.voteFinalizesAt, null);
  assert.equal(afterVeto.vetoCouncil, null);
  assert.equal(afterVeto.vetoThreshold, null);
  assert.ok(
    afterVeto.updatedAt.getTime() > new Date(envNow.SIM_NOW_ISO).getTime(),
  );

  const cookieAfter = await makeSessionCookie(envNow, "5VoteAfter");
  const resAfter = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: envNow,
      headers: { "content-type": "application/json", cookie: cookieAfter },
      body: JSON.stringify({
        type: "chamber.vote",
        payload: { proposalId, choice: "yes", score: 8 },
      }),
    }),
  );
  assert.equal(resAfter.status, 409);
  const jsonAfter = await resAfter.json();
  assert.equal(jsonAfter.error?.code, "vote_paused");
});

test("tick finalizes a passed chamber vote when veto window ends", async () => {
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  await clearCmAwardsForTests();
  clearVetoVotesForTests();
  clearProposalsForTests();

  const proposalId = "veto-test-finalize";
  await createProposal(baseEnv, {
    id: proposalId,
    stage: "vote",
    authorAddress: "5Proposer",
    title: "Veto finalize test",
    chamberId: "general",
    summary: "Test proposal",
    payload: { formationEligible: false },
  });
  const created = await getProposal(baseEnv, proposalId);
  assert.ok(created);
  const envNow = { ...baseEnv, SIM_NOW_ISO: created.updatedAt.toISOString() };

  await awardCmOnce(envNow, {
    proposalId: "award-general-2",
    proposerId: "5VetoHolder",
    chamberId: "general",
    avgScore: 8,
    lcmPoints: 80,
    chamberMultiplierTimes10: 10,
    mcmPoints: 80,
  });

  await ensureChamberMembership(envNow, {
    address: "5VetoHolder",
    chamberId: "general",
    source: "test",
  });
  for (let i = 0; i < 50; i += 1) {
    await ensureChamberMembership(envNow, {
      address: `5VoteF${i}`,
      chamberId: "general",
      source: "test",
    });
  }

  for (let i = 0; i < 50; i += 1) {
    const voter = `5VoteF${i}`;
    const cookie = await makeSessionCookie(envNow, voter);
    const choice = i < 34 ? "yes" : "no";
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: envNow,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "chamber.vote",
          payload: {
            proposalId,
            choice,
            ...(choice === "yes" ? { score: 8 } : {}),
          },
        }),
      }),
    );
    if (res.status === 409) break;
    assert.equal(res.status, 200);
  }

  const passed = await getProposal(envNow, proposalId);
  assert.ok(passed);
  assert.equal(passed.stage, "vote");
  assert.ok(passed.voteFinalizesAt);

  const envAfter = {
    ...envNow,
    SIM_NOW_ISO: new Date(
      passed.voteFinalizesAt.getTime() + 1000,
    ).toISOString(),
  };

  const tickRes = await tickPost(
    makeContext({
      url: "https://local.test/api/clock/tick",
      env: envAfter,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollup: false }),
    }),
  );
  assert.equal(tickRes.status, 200);

  const finalized = await getProposal(envAfter, proposalId);
  assert.ok(finalized);
  assert.equal(finalized.stage, "build");
});
