import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as meGet } from "../functions/api/me.ts";
import { onRequestPost as noncePost } from "../functions/api/auth/nonce.ts";
import { onRequestPost as logoutPost } from "../functions/api/auth/logout.ts";
import { onRequestPost as verifyPost } from "../functions/api/auth/verify.ts";
import { canonicalizeHmndAddress } from "../functions/_lib/address.ts";

function getSetCookies(response) {
  // Node fetch supports getSetCookie(), but Cloudflare-style headers may not.
  const maybe = response.headers.getSetCookie?.bind(response.headers);
  if (maybe) return maybe();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookiePair(setCookieValue) {
  return setCookieValue.split(";")[0];
}

function makeContext({ url, method, env, body, cookie }) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (body !== undefined) headers.set("content-type", "application/json");
  const request = new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { request, env };
}

test("auth flow: nonce -> verify (bypass) -> me -> logout", async () => {
  const baseEnv = { SESSION_SECRET: "test-secret" };
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  const nonceCtx = makeContext({
    url: "https://local.test/api/auth/nonce",
    method: "POST",
    env: baseEnv,
    body: { address },
  });
  const nonceRes = await noncePost(nonceCtx);
  assert.equal(nonceRes.status, 200);
  const nonceJson = await nonceRes.json();
  assert.equal(typeof nonceJson.nonce, "string");
  assert.ok(nonceJson.nonce.length >= 8);

  const [nonceSetCookie] = getSetCookies(nonceRes);
  assert.ok(nonceSetCookie?.startsWith("vortex_nonce="));
  const nonceCookie = cookiePair(nonceSetCookie);

  const verifyCtx = makeContext({
    url: "https://local.test/api/auth/verify",
    method: "POST",
    env: { ...baseEnv, DEV_BYPASS_SIGNATURE: "true", DEV_BYPASS_GATE: "true" },
    body: { address, nonce: nonceJson.nonce, signature: "0xsig" },
    cookie: nonceCookie,
  });
  const verifyRes = await verifyPost(verifyCtx);
  assert.equal(verifyRes.status, 200);
  const [sessionSetCookie] = getSetCookies(verifyRes);
  assert.ok(sessionSetCookie?.startsWith("vortex_session="));
  const sessionCookie = cookiePair(sessionSetCookie);

  const meCtx = makeContext({
    url: "https://local.test/api/me",
    method: "GET",
    env: { ...baseEnv, DEV_BYPASS_GATE: "true" },
    cookie: sessionCookie,
  });
  const meRes = await meGet(meCtx);
  assert.equal(meRes.status, 200);
  const meJson = await meRes.json();
  assert.equal(meJson.authenticated, true);
  assert.equal(meJson.address, await canonicalizeHmndAddress(address));
  assert.equal(meJson.gate.eligible, true);

  const logoutCtx = makeContext({
    url: "https://local.test/api/auth/logout",
    method: "POST",
    env: { ...baseEnv },
    cookie: sessionCookie,
  });
  const logoutRes = await logoutPost(logoutCtx);
  assert.equal(logoutRes.status, 200);
  const [logoutCookie] = getSetCookies(logoutRes);
  assert.ok(logoutCookie?.startsWith("vortex_session="));
  assert.match(logoutCookie, /Max-Age=0/);
});

test("auth/nonce rejects missing address", async () => {
  const ctx = makeContext({
    url: "https://local.test/api/auth/nonce",
    method: "POST",
    env: { SESSION_SECRET: "test-secret" },
    body: {},
  });
  const res = await noncePost(ctx);
  assert.equal(res.status, 400);
});

test("auth/verify rejects invalid signature (no bypass)", async () => {
  const env = { SESSION_SECRET: "test-secret" };
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  const nonceRes = await noncePost(
    makeContext({
      url: "https://local.test/api/auth/nonce",
      method: "POST",
      env,
      body: { address },
    }),
  );
  const nonceJson = await nonceRes.json();
  const nonceCookie = cookiePair(getSetCookies(nonceRes)[0]);

  const verifyRes = await verifyPost(
    makeContext({
      url: "https://local.test/api/auth/verify",
      method: "POST",
      env,
      body: { address, nonce: nonceJson.nonce, signature: "0xsig" },
      cookie: nonceCookie,
    }),
  );
  assert.equal(verifyRes.status, 401);
});
