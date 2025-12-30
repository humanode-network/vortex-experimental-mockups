import assert from "node:assert/strict";
import { test } from "node:test";

import { formatAuthConnectError } from "../src/app/auth/connectErrors.ts";

test("formatAuthConnectError: shows Pages Functions hint on HTTP 404", () => {
  assert.equal(
    formatAuthConnectError({ message: "HTTP 404" }),
    "API is not available at `/api/*`. Start the backend with `yarn dev:api` (after `yarn build`) or run `yarn dev:full`. If you only run `yarn dev`, there is no API.",
  );
});

test("formatAuthConnectError: shows Pages Functions hint on network failures", () => {
  assert.equal(
    formatAuthConnectError({ message: "Failed to fetch" }),
    "API is not reachable at `/api/*`. If you are running locally, start the backend with `yarn dev:api` (after `yarn build`) or run `yarn dev:full`. If you are on a deployed site, check that Pages Functions are deployed and `/api/health` responds.",
  );
});
