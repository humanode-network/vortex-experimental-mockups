import assert from "node:assert/strict";
import { test } from "node:test";

import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady, xxhashAsHex } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

import { onRequestGet as gateGet } from "../functions/api/gate/status.ts";
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
  return { request, env, params: {} };
}

function scaleEncodeVecAccountId32(publicKeys) {
  if (publicKeys.length > 63) throw new Error("test helper: too many keys");
  const lengthByte = (publicKeys.length << 2) | 0; // compact-encoded small int
  const out = new Uint8Array(1 + publicKeys.length * 32);
  out[0] = lengthByte;
  publicKeys.forEach((pk, i) => {
    out.set(pk, 1 + i * 32);
  });
  return out;
}

test("gate/status: real RPC gate uses cached result (memory mode)", async () => {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const pair = keyring.addFromUri("//Alice");

  const validatorsKey =
    "0x" +
    xxhashAsHex("Session", 128).slice(2) +
    xxhashAsHex("Validators", 128).slice(2);

  let rpcCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    rpcCalls += 1;
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const key = body?.params?.[0];
    let result;

    if (key === validatorsKey) {
      result = u8aToHex(scaleEncodeVecAccountId32([pair.publicKey]));
    } else {
      result = null;
    }

    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const env = {
      SESSION_SECRET: "test-secret",
      HUMANODE_RPC_URL: "https://rpc.test",
    };

    const nonceRes = await noncePost(
      makeContext({
        url: "https://local.test/api/auth/nonce",
        method: "POST",
        env,
        body: { address: pair.address },
      }),
    );
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
    const sessionCookie = cookiePair(getSetCookies(verifyRes)[0]);

    const gateRes1 = await gateGet(
      makeContext({
        url: "https://local.test/api/gate/status",
        method: "GET",
        env,
        cookie: sessionCookie,
      }),
    );
    const json1 = await gateRes1.json();
    assert.equal(json1.eligible, true);

    const gateRes2 = await gateGet(
      makeContext({
        url: "https://local.test/api/gate/status",
        method: "GET",
        env,
        cookie: sessionCookie,
      }),
    );
    const json2 = await gateRes2.json();
    assert.equal(json2.eligible, true);

    assert.equal(rpcCalls, 1, "expected eligibility to be cached");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
