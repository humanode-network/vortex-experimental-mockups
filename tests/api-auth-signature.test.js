import assert from "node:assert/strict";
import { test } from "node:test";

import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

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

test("auth/verify: valid Substrate signature succeeds and nonce is single-use", async () => {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const pair = keyring.addFromUri("//Alice");

  const env = { SESSION_SECRET: "test-secret", DEV_BYPASS_GATE: "true" };

  const nonceRes = await noncePost(
    makeContext({
      url: "https://local.test/api/auth/nonce",
      method: "POST",
      env,
      body: { address: pair.address },
    }),
  );
  assert.equal(nonceRes.status, 200);
  const nonceJson = await nonceRes.json();
  const nonceCookie = cookiePair(getSetCookies(nonceRes)[0]);

  const messageBytes = new TextEncoder().encode(nonceJson.nonce);
  const signatureHex = u8aToHex(pair.sign(messageBytes));

  const verifyRes = await verifyPost(
    makeContext({
      url: "https://local.test/api/auth/verify",
      method: "POST",
      env,
      body: {
        address: pair.address,
        nonce: nonceJson.nonce,
        signature: signatureHex,
      },
      cookie: nonceCookie,
    }),
  );
  assert.equal(verifyRes.status, 200);

  const verifyRes2 = await verifyPost(
    makeContext({
      url: "https://local.test/api/auth/verify",
      method: "POST",
      env,
      body: {
        address: pair.address,
        nonce: nonceJson.nonce,
        signature: signatureHex,
      },
      cookie: nonceCookie,
    }),
  );
  assert.equal(verifyRes2.status, 401);
});
