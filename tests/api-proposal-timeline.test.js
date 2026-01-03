import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as timelineGet } from "../functions/api/proposals/[id]/timeline.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearPoolVotesForTests } from "../functions/_lib/poolVotesStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import { clearProposalsForTests } from "../functions/_lib/proposalsStore.ts";
import { clearProposalTimelineForTests } from "../functions/_lib/proposalTimelineStore.ts";
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

const env = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
};

test("GET /api/proposals/:id/timeline returns proposal events in order", async () => {
  clearProposalTimelineForTests();
  clearIdempotencyForTests();
  await clearPoolVotesForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();
  clearChamberMembershipsForTests();

  const cookie = await makeSessionCookie(env, "5timeline");

  const draftRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: {
          form: {
            title: "Timeline test proposal",
            chamberId: "engineering",
            summary: "Summary",
            what: "Overview",
            why: "Why",
            when: "When",
            where: "Where",
            how: "How",
            howMuch: "How much",
            timeline: [{ id: "m1", title: "Milestone", timeframe: "Week 1" }],
            outputs: [],
            budgetItems: [{ id: "b1", description: "Work", amount: "1" }],
            aboutMe: "",
            attachments: [],
            agreeRules: true,
            confirmBudget: true,
          },
        },
      }),
    }),
  );
  assert.equal(draftRes.status, 200);
  const draftJson = await draftRes.json();
  assert.ok(draftJson.draftId);

  const submitRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.submitToPool",
        payload: { draftId: draftJson.draftId },
      }),
    }),
  );
  assert.equal(submitRes.status, 200);
  const submitJson = await submitRes.json();
  assert.ok(submitJson.proposalId);

  const voteRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: submitJson.proposalId, direction: "up" },
      }),
    }),
  );
  assert.equal(voteRes.status, 200);

  const timelineRes = await timelineGet(
    makeContext({
      url: `https://local.test/api/proposals/${submitJson.proposalId}/timeline`,
      env,
      params: { id: submitJson.proposalId },
      method: "GET",
    }),
  );
  assert.equal(timelineRes.status, 200);
  const timelineJson = await timelineRes.json();
  assert.ok(Array.isArray(timelineJson.items));
  assert.ok(timelineJson.items.length >= 2);
  assert.equal(timelineJson.items[0].type, "proposal.submitted");
  assert.ok(timelineJson.items.some((item) => item.type === "pool.vote"));
});
