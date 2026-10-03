#!/usr/bin/env node
/**
 * Start-up benchmark for the production build (read-only, local).
 * Usage: node scripts/bench-tti.mjs [baseURL[,baseURL2...]=http://127.0.0.1:4173] [runs=15] [cpu=4]
 * Several comma-separated URLs are measured alternately (A,B,A,B...) so machine drift hits both alike.
 * Each run: fresh browser context (cold cache, empty storage), viewport 390x844, CPU throttled via CDP.
 * Metrics per run (ms from navigation start):
 *   fcp        first contentful paint
 *   ready      home "Inizia"/"Start" button attached and visible (app mounted)
 *   tti        first click on that button answered: setup screen heading visible (time to first interaction)
 *   tbt        sum over long tasks of (duration - 50 ms) until tti
 *   jsKB       JS bytes decoded before tti
 */
import { chromium } from "@playwright/test";

const bases = (process.argv[2] ?? "http://127.0.0.1:4173").split(",");
const runs = Number(process.argv[3] ?? 15);
const cpu = Number(process.argv[4] ?? 4);
const browser = await chromium.launch();
const rowsBy = Object.fromEntries(bases.map((b) => [b, []]));
for (let i = 0; i < runs * bases.length; i += 1) {
  const base = bases[i % bases.length];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await page.addInitScript(() => {
    globalThis.__lt = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) globalThis.__lt.push([e.startTime, e.duration]); }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(base, { waitUntil: "commit" });
  const start = page.getByRole("button", { name: /^(Inizia|Start)$/ });
  await start.waitFor({ state: "visible", timeout: 60_000 });
  const ready = await page.evaluate(() => performance.now());
  await start.click({ timeout: 60_000 });
  await page.locator("input[placeholder]").first().waitFor({ state: "visible", timeout: 60_000 });
  const m = await page.evaluate(() => {
    const now = performance.now();
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? NaN;
    const tbt = globalThis.__lt.filter(([s]) => s < now).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    const js = performance.getEntriesByType("resource").filter((r) => r.name.endsWith(".js")).reduce((a, r) => a + r.decodedBodySize, 0);
    return { fcp, tti: now, tbt, jsKB: js / 1024 };
  });
  rowsBy[base].push({ ...m, ready });
  await context.close();
}
await browser.close();
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const report = bases.map((base) => {
  const rows = rowsBy[base];
  const metrics = {};
  for (const k of ["fcp", "ready", "tti", "tbt", "jsKB"]) {
    const v = rows.map((r) => r[k]);
    metrics[k] = { median: +med(v).toFixed(1), p10: +q(v, 0.1).toFixed(1), p90: +q(v, 0.9).toFixed(1), min: +Math.min(...v).toFixed(1), max: +Math.max(...v).toFixed(1) };
  }
  return { base, runs, cpu, metrics };
});
console.log(JSON.stringify(report, null, 2));
