import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { localPreviewHeaders } from "../vite.config.ts";

/* Acceptance 2026-10-19 (H-8, local WebKit e2e): production headers stay strict. */

const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const prod = Object.fromEntries(vercel.headers.find((h) => h.source === "/(.*)")!.headers.map((h) => [h.key, h.value]));
const ENFORCED =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";

test("enforced production CSP is unchanged, keeps upgrade-insecure-requests and names no ad host", () => {
  assert.equal(prod["Content-Security-Policy"], ENFORCED);
  assert.doesNotMatch(prod["Content-Security-Policy"]!, /google|doubleclick|adtraffic/);
});

test("no Report-Only CSP without a reporting directive (WebKit logs a console error for it)", () => {
  const ro = prod["Content-Security-Policy-Report-Only"];
  if (ro !== undefined) assert.match(ro, /report-to\s+\S/);
});

test("local preview drops only upgrade-insecure-requests; every other header equals production", () => {
  const local = localPreviewHeaders();
  assert.equal(local["Content-Security-Policy"], ENFORCED.replace("; upgrade-insecure-requests", ""));
  for (const [k, v] of Object.entries(prod)) if (k !== "Content-Security-Policy") assert.equal(local[k], v, k);
  assert.deepEqual(Object.keys(local).sort(), Object.keys(prod).sort());
});

test("jarvis-hq-pgoc.vercel.app redirects permanently to www.pivot23.com; the canonical hosts never match a redirect", () => {
  const cfg = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
    redirects?: { source: string; has?: { type: string; value: string }[]; destination: string; permanent?: boolean }[];
  };
  const redirects = cfg.redirects ?? [];
  const pgoc = redirects.filter((r) => r.has?.some((h) => h.type === "host" && h.value === "jarvis-hq-pgoc.vercel.app"));
  assert.equal(pgoc.length, 1);
  const r = pgoc[0]!;
  assert.equal(r.source, "/:path*");
  assert.deepEqual(r.has, [{ type: "host", value: "jarvis-hq-pgoc.vercel.app" }]);
  assert.equal(r.destination, "https://www.pivot23.com/:path*");
  assert.equal(r.permanent, true);
  // Every redirect is host-conditioned on an exact *.vercel.app host: www.pivot23.com / pivot23.com can't loop or match.
  for (const x of redirects) {
    assert.ok(x.has?.length === 1 && x.has[0]!.type === "host", "redirect without an exact host condition");
    assert.match(x.has[0]!.value, /^[a-z0-9-]+\.vercel\.app$/);
    assert.ok(!/pivot23\.com$/.test(x.has[0]!.value));
  }
});
