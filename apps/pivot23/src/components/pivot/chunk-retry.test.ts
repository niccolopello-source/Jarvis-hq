import assert from "node:assert/strict";
import test from "node:test";
import { moduleUrlOf, moduleUrlOfLoader } from "./ChunkBoundary";

/* Acceptance 2026-10-19: WebKit's generic import error carries no URL; the retry must still bust the cache. */

test("WebKit's generic message yields no URL from the error", () => {
  assert.equal(moduleUrlOf(new TypeError("Importing a module script failed.")), null);
});

test("the chunk URL is recovered from the built loader, relative to the assets folder", () => {
  const built = { toString: () => '()=>__vitePreload(()=>import("./CareerChart-BCAtsnRH.js"),[])' } as unknown as () => unknown;
  assert.equal(moduleUrlOfLoader(built, "https://www.pivot23.com/assets/index-x.js"), "https://www.pivot23.com/assets/CareerChart-BCAtsnRH.js");
});

test("dev loader paths resolve too; non-module or unknown loaders give null", () => {
  const dev = { toString: () => '() => import("/src/components/pivot/CareerChart.tsx")' } as unknown as () => unknown;
  assert.equal(moduleUrlOfLoader(dev, "http://127.0.0.1:8080/src/x.tsx"), "http://127.0.0.1:8080/src/components/pivot/CareerChart.tsx");
  assert.equal(moduleUrlOfLoader(() => Promise.resolve(1), "https://a.b/c.js"), null);
});
