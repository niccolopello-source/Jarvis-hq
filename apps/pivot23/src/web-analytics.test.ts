import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldLoadWebAnalytics } from "./WebAnalytics";

test("web analytics loads only in production on a real host", () => {
  assert.equal(shouldLoadWebAnalytics(true, "pivot23.vercel.app"), true);
  for (const h of ["localhost", "127.0.0.1", "::1", "[::1]", "app.localhost", ""]) {
    assert.equal(shouldLoadWebAnalytics(true, h), false, h);
  }
  assert.equal(shouldLoadWebAnalytics(false, "pivot23.vercel.app"), false);
});
