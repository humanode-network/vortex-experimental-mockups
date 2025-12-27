import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../functions/api/command.ts";
import { onRequestGet as courtsGet } from "../functions/api/courts/index.ts";
import { onRequestGet as courtGet } from "../functions/api/courts/[id].ts";
import { getSessionCookieName, issueSession } from "../functions/_lib/auth.ts";
import { clearIdempotencyForTests } from "../functions/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../functions/_lib/readModelsStore.ts";
import { clearCourtsForTests } from "../functions/_lib/courtsStore.ts";

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
  DEV_BYPASS_ADMIN: "true",
};

test("court.case.report increments reports and can transition jury → live", async () => {
  clearCourtsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const caseId = "delegation-farming-forum-whale"; // base: jury, 9 reports

  for (let i = 0; i < 3; i += 1) {
    const cookie = await makeSessionCookie(baseEnv, `5CourtReport${i}`);
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: baseEnv,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "court.case.report",
          payload: { caseId },
        }),
      }),
    );
    assert.equal(res.status, 200);
  }

  const detailRes = await courtGet(
    makeContext({
      url: `https://local.test/api/courts/${caseId}`,
      env: baseEnv,
      params: { id: caseId },
      method: "GET",
    }),
  );
  assert.equal(detailRes.status, 200);
  const json = await detailRes.json();
  assert.equal(json.reports, 12);
  assert.equal(json.status, "live");

  const listRes = await courtsGet(
    makeContext({
      url: "https://local.test/api/courts",
      env: baseEnv,
      method: "GET",
    }),
  );
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  const item = listJson.items.find((c) => c.id === caseId);
  assert.ok(item);
  assert.equal(item.reports, 12);
  assert.equal(item.status, "live");
});

test("court.case.verdict rejects when case is not live", async () => {
  clearCourtsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const caseId = "delegation-farming-forum-whale"; // jury in seed
  const cookie = await makeSessionCookie(baseEnv, "5CourtVerdictJury");
  const res = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "court.case.verdict",
        payload: { caseId, verdict: "guilty" },
      }),
    }),
  );
  assert.equal(res.status, 409);
});

test("court.case.verdict ends the case after 12 distinct verdicts", async () => {
  clearCourtsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const caseId = "delegation-reroute-keeper-nyx"; // live in seed

  for (let i = 0; i < 12; i += 1) {
    const cookie = await makeSessionCookie(baseEnv, `5CourtVoter${i}`);
    const verdict = i % 2 === 0 ? "guilty" : "not_guilty";
    const res = await commandPost(
      makeContext({
        url: "https://local.test/api/command",
        env: baseEnv,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          type: "court.case.verdict",
          payload: { caseId, verdict },
        }),
      }),
    );
    assert.equal(res.status, 200);
  }

  const detailRes = await courtGet(
    makeContext({
      url: `https://local.test/api/courts/${caseId}`,
      env: baseEnv,
      params: { id: caseId },
      method: "GET",
    }),
  );
  assert.equal(detailRes.status, 200);
  const json = await detailRes.json();
  assert.equal(json.status, "ended");

  const cookieAfter = await makeSessionCookie(baseEnv, "5CourtAfterEnded");
  const resAfter = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie: cookieAfter },
      body: JSON.stringify({
        type: "court.case.verdict",
        payload: { caseId, verdict: "guilty" },
      }),
    }),
  );
  assert.equal(resAfter.status, 409);
});
