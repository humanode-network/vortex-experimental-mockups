import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as noncePost } from "../functions/api/auth/nonce.ts";
import { onRequestPost as verifyPost } from "../functions/api/auth/verify.ts";

function getSetCookies(response) {
  const maybe = response.headers.getSetCookie?.bind(response.headers);
  if (maybe) return maybe();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookiePair(setCookieValue) {
  return setCookieValue.split(";")[0];
}

function makeContext({ url, method, env, body, cookie, headers: headersInit }) {
  const headers = new Headers(headersInit);
  if (cookie) headers.set("cookie", cookie);
  if (body !== undefined) headers.set("content-type", "application/json");
  const request = new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { request, env };
}

test("auth/nonce is rate limited per IP (memory mode)", async () => {
  const env = { SESSION_SECRET: "test-secret" };
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  const originalNow = Date.now;
  Date.now = () => 0;
  try {
    for (let i = 0; i < 20; i++) {
      const res = await noncePost(
        makeContext({
          url: "https://local.test/api/auth/nonce",
          method: "POST",
          env,
          body: { address },
          headers: { "x-forwarded-for": "203.0.113.9" },
        }),
      );
      assert.equal(res.status, 200);
    }

    const limited = await noncePost(
      makeContext({
        url: "https://local.test/api/auth/nonce",
        method: "POST",
        env,
        body: { address },
        headers: { "x-forwarded-for": "203.0.113.9" },
      }),
    );
    assert.equal(limited.status, 429);
    const json = await limited.json();
    assert.equal(json.error?.retryAfterSeconds, 60);
  } finally {
    Date.now = originalNow;
  }
});

test("auth/verify rejects expired nonce cookie", async () => {
  const env = { SESSION_SECRET: "test-secret", DEV_BYPASS_SIGNATURE: "true" };
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  const originalNow = Date.now;
  Date.now = () => 0;
  try {
    const nonceRes = await noncePost(
      makeContext({
        url: "https://local.test/api/auth/nonce",
        method: "POST",
        env,
        body: { address },
      }),
    );
    assert.equal(nonceRes.status, 200);
    const nonceJson = await nonceRes.json();
    const nonceCookie = cookiePair(getSetCookies(nonceRes)[0]);

    Date.now = () => 10 * 60_000 + 1;
    const verifyRes = await verifyPost(
      makeContext({
        url: "https://local.test/api/auth/verify",
        method: "POST",
        env: { ...env, DEV_BYPASS_GATE: "true" },
        body: { address, nonce: nonceJson.nonce, signature: "0xsig" },
        cookie: nonceCookie,
      }),
    );
    assert.equal(verifyRes.status, 401);
  } finally {
    Date.now = originalNow;
  }
});
