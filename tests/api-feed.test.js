import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as feedGet } from "../functions/api/feed/index.ts";

function makeContext({ url, env, params, method = "GET", headers }) {
  return {
    request: new Request(url, { method, headers }),
    env,
    params,
  };
}

const inlineEnv = { READ_MODELS_INLINE: "true", DEV_BYPASS_ADMIN: "true" };

test("GET /api/feed returns items", async () => {
  const res = await feedGet(
    makeContext({ url: "https://local.test/api/feed", env: inlineEnv }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items.length > 0);
  assert.ok(json.items[0].id);
});

test("GET /api/feed can filter by stage", async () => {
  const res = await feedGet(
    makeContext({
      url: "https://local.test/api/feed?stage=faction",
      env: inlineEnv,
    }),
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items.length > 0);
  for (const item of json.items) assert.equal(item.stage, "faction");
});
