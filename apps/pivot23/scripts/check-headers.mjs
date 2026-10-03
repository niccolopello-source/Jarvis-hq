#!/usr/bin/env node
/**
 * D-13 header check. Usage:
 *   node scripts/check-headers.mjs                 -> validates vercel.json only
 *   node scripts/check-headers.mjs <url> [<url>]   -> also fetches each URL and compares live headers
 * Exit code 1 on any missing or different header. Read-only: GET requests only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "..", "vercel.json"), "utf8"));
const global = config.headers.find((h) => h.source === "/(.*)");
const expected = Object.fromEntries(global.headers.map((h) => [h.key.toLowerCase(), h.value]));

const REQUIRED = ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options"];
const problems = [];
for (const key of REQUIRED) if (!expected[key]) problems.push(`vercel.json: missing ${key}`);
const csp = expected["content-security-policy"] ?? "";
for (const directive of ["default-src 'self'", "script-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"]) {
  if (!csp.includes(directive)) problems.push(`CSP lacks ${directive}`);
}
if (/script-src[^;]*'unsafe-(inline|eval)'/.test(csp)) problems.push("CSP allows unsafe script");

for (const url of process.argv.slice(2)) {
  const res = await fetch(url, { redirect: "follow" });
  for (const [key, value] of Object.entries(expected)) {
    const live = res.headers.get(key);
    if (live !== value) problems.push(`${url}: ${key} is ${live === null ? "absent" : JSON.stringify(live)}`);
  }
  console.log(`${url} -> ${res.status}`);
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${Object.keys(expected).length} security headers ok`);
