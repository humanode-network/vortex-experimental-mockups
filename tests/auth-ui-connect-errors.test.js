import assert from "node:assert/strict";
import { test } from "node:test";

import { formatAuthConnectError } from "../src/app/auth/connectErrors.ts";

test("formatAuthConnectError: shows Pages Functions hint on HTTP 404", () => {
  assert.equal(
    formatAuthConnectError({ message: "HTTP 404" }),
    "API is not available at `/api/*`. Start the backend with `yarn dev:api` (after `yarn build`) or run `yarn dev:full`. If you only run `yarn dev`, there is no API.",
  );
});
