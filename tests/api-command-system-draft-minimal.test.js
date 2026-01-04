import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearProposalDraftsForTests } from "../functions/_lib/proposalDraftsStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearProposalsForTests } from "../functions/_lib/proposalsStore.ts";

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
  READ_MODELS_INLINE_EMPTY: "true",
  DEV_BYPASS_ADMIN: "true",
};

test("system draft submits with minimal fields", async () => {
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearProposalDraftsForTests();
  clearProposalsForTests();

  const cookie = await makeSessionCookie(baseEnv, "5SystemGovernor");

  const saveRes = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "proposal.draft.save",
        payload: {
          form: {
            templateId: "system",
            title: "Create chamber: Ops",
            chamberId: "general",
            metaGovernance: {
              action: "chamber.create",
              chamberId: "ops",
              title: "Ops chamber",
            },
            agreeRules: true,
            confirmBudget: true,
          },
        },
      }),
    }),
  );
  assert.equal(saveRes.status, 200);
  const saved = await saveRes.json();
  assert.equal(saved.ok, true);
  assert.equal(saved.type, "proposal.draft.save");

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
  const submitted = await submitRes.json();
  assert.equal(submitted.ok, true);
  assert.equal(submitted.type, "proposal.submitToPool");
  assert.ok(typeof submitted.proposalId === "string");
});
